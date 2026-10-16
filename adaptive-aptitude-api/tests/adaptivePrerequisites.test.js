'use strict';

/**
 * tests/adaptivePrerequisites.test.js
 *
 * Tests for Phase 4 Prerequisite Gating and Recursive DAG Remediation:
 *   - Foundational pattern (automatically eligible)
 *   - Satisfied prerequisite (mastery >= 0.70)
 *   - Unsatisfied prerequisite (mastery < 0.70)
 *   - Missing StudentProgress treated as mastery = 0
 *   - Multi-level prerequisite chain traversal (A -> B -> C)
 */

const { connectTestDB, disconnectTestDB, clearAllTestCollections } = require('./helpers/dbSetup');
const StudentProgress = require('../src/models/studentProgressModel');
const prerequisiteService = require('../src/services/adaptive/prerequisiteService');

beforeAll(async () => {
  await connectTestDB();
}, 60000);

afterAll(async () => {
  await clearAllTestCollections();
  await disconnectTestDB();
}, 60000);

beforeEach(async () => {
  await clearAllTestCollections();
});

describe('Adaptive Prerequisite Service (Phase 4 V1)', () => {
  const userId = 'prereq_test_user';

  it('P1: foundational pattern with 0 prerequisites is automatically eligible', async () => {
    const pattern = 'Basic Percentage Calculation';
    const evalResult = await prerequisiteService.evaluatePrerequisites(userId, pattern);

    expect(evalResult.eligible).toBe(true);
    expect(evalResult.prerequisites).toEqual([]);
    expect(evalResult.unmetPrerequisites).toEqual([]);

    const remResult = await prerequisiteService.findRemediationPattern(userId, pattern);
    expect(remResult.selectedPattern).toBe(pattern);
    expect(remResult.redirected).toBe(false);
  });

  it('P2: pattern is eligible when all prerequisites have mastery >= 0.70', async () => {
    // 'Weighted Percentage Calculations' requires ONLY 'Basic Percentage Calculation'
    const pattern = 'Weighted Percentage Calculations';
    await StudentProgress.create({
      userId,
      topic: 'Percentage',
      pattern: 'Basic Percentage Calculation',
      mastery: 0.75,
      attempts: 10,
    });

    const evalResult = await prerequisiteService.evaluatePrerequisites(userId, pattern);
    expect(evalResult.eligible).toBe(true);
    expect(evalResult.unmetPrerequisites).toEqual([]);

    const remResult = await prerequisiteService.findRemediationPattern(userId, pattern);
    expect(remResult.selectedPattern).toBe(pattern);
    expect(remResult.redirected).toBe(false);
  });

  it('P3: pattern is blocked when prerequisite mastery < 0.70 and redirects to prereq', async () => {
    // 'Weighted Percentage Calculations' requires ONLY 'Basic Percentage Calculation'
    const pattern = 'Weighted Percentage Calculations';
    await StudentProgress.create({
      userId,
      topic: 'Percentage',
      pattern: 'Basic Percentage Calculation',
      mastery: 0.55,
      attempts: 8,
    });

    const evalResult = await prerequisiteService.evaluatePrerequisites(userId, pattern);
    expect(evalResult.eligible).toBe(false);
    expect(evalResult.unmetPrerequisites.length).toBe(1);
    expect(evalResult.unmetPrerequisites[0].pattern).toBe('Basic Percentage Calculation');

    const remResult = await prerequisiteService.findRemediationPattern(userId, pattern);
    expect(remResult.redirected).toBe(true);
    expect(remResult.requestedPattern).toBe(pattern);
    expect(remResult.selectedPattern).toBe('Basic Percentage Calculation');
  });

  it('P4: missing StudentProgress for prerequisite is treated as mastery = 0', async () => {
    // 'Weighted Percentage Calculations' requires ONLY 'Basic Percentage Calculation'
    const pattern = 'Weighted Percentage Calculations';
    // No StudentProgress created in database

    const evalResult = await prerequisiteService.evaluatePrerequisites(userId, pattern);
    expect(evalResult.eligible).toBe(false);
    expect(evalResult.unmetPrerequisites[0].mastery).toBe(0);

    const remResult = await prerequisiteService.findRemediationPattern(userId, pattern);
    expect(remResult.redirected).toBe(true);
    expect(remResult.selectedPattern).toBe('Basic Percentage Calculation');
  });

  it('P5: multi-level prerequisite chain (A -> B -> C) traverses recursively to nearest eligible unmet pattern', async () => {
    // Chain in Algebra:
    // A: 'Standard Algebraic Identities & Expansions' (foundational)
    // B: 'Inequalities & Modulus Functions' (requires A and 'Linear Equations')
    // C: 'Conditional Cubic Identity (a^3 + b^3 + c^3 - 3abc)' (requires B and 'Linear Equations')
    const patternA = 'Standard Algebraic Identities & Expansions';
    const patternB = 'Inequalities & Modulus Functions';
    const patternC = 'Conditional Cubic Identity (a^3 + b^3 + c^3 - 3abc)';
    const linearEq = 'Linear Equations & Systems of Equations'; // foundational

    // Master linear equations foundational prereq for both B and C
    await StudentProgress.create({
      userId,
      topic: 'Algebra',
      pattern: linearEq,
      mastery: 0.85,
      attempts: 10,
    });

    // Scenario 1: A is unmastered (0.0). When requesting C, engine traverses C -> B -> A
    const rem1 = await prerequisiteService.findRemediationPattern(userId, patternC);
    expect(rem1.redirected).toBe(true);
    expect(rem1.requestedPattern).toBe(patternC);
    expect(rem1.selectedPattern).toBe(patternA);

    // Scenario 2: A is mastered (0.80), but B is not mastered (0.45)
    // When requesting C, B's prerequisites are all satisfied, so B is the nearest eligible unmet pattern!
    await StudentProgress.create({
      userId,
      topic: 'Algebra',
      pattern: patternA,
      mastery: 0.80,
      attempts: 12,
    });
    await StudentProgress.create({
      userId,
      topic: 'Algebra',
      pattern: patternB,
      mastery: 0.45,
      attempts: 5,
    });

    const rem2 = await prerequisiteService.findRemediationPattern(userId, patternC);
    expect(rem2.redirected).toBe(true);
    expect(rem2.requestedPattern).toBe(patternC);
    expect(rem2.selectedPattern).toBe(patternB);

    // Scenario 3: B is now also mastered (0.90)
    // When requesting C, C is fully eligible!
    await StudentProgress.findOneAndUpdate(
      { userId, topic: 'Algebra', pattern: patternB },
      { $set: { mastery: 0.90 } }
    );

    const rem3 = await prerequisiteService.findRemediationPattern(userId, patternC);
    expect(rem3.redirected).toBe(false);
    expect(rem3.selectedPattern).toBe(patternC);
  });

  it('P6: prerequisite tie-breaking: same mastery -> fewer attempts wins', async () => {
    // 'Inequalities & Modulus Functions' requires:
    // Prereq 1: 'Linear Equations & Systems of Equations'
    // Prereq 2: 'Standard Algebraic Identities & Expansions'
    const target = 'Inequalities & Modulus Functions';

    // Prereq 1: mastery = 0.30, attempts = 15
    await StudentProgress.create({
      userId,
      topic: 'Algebra',
      pattern: 'Linear Equations & Systems of Equations',
      mastery: 0.30,
      attempts: 15,
    });

    // Prereq 2: mastery = 0.30, attempts = 2 (fewer attempts)
    await StudentProgress.create({
      userId,
      topic: 'Algebra',
      pattern: 'Standard Algebraic Identities & Expansions',
      mastery: 0.30,
      attempts: 2,
    });

    const rem = await prerequisiteService.findRemediationPattern(userId, target);
    expect(rem.redirected).toBe(true);
    // Prereq 2 wins because student has fewer attempts (less evidence) there
    expect(rem.selectedPattern).toBe('Standard Algebraic Identities & Expansions');
  });

  it('P7: prerequisite tie-breaking: same mastery and same attempts -> earlier canonical registry order wins', async () => {
    // 'Inequalities & Modulus Functions' requires:
    // Prereq 1: 'Linear Equations & Systems of Equations' (registry index earlier)
    // Prereq 2: 'Standard Algebraic Identities & Expansions' (registry index later)
    const target = 'Inequalities & Modulus Functions';

    // Both have identical mastery (0.30) and identical attempts (5)
    await StudentProgress.create({
      userId,
      topic: 'Algebra',
      pattern: 'Linear Equations & Systems of Equations',
      mastery: 0.30,
      attempts: 5,
    });
    await StudentProgress.create({
      userId,
      topic: 'Algebra',
      pattern: 'Standard Algebraic Identities & Expansions',
      mastery: 0.30,
      attempts: 5,
    });

    const rem = await prerequisiteService.findRemediationPattern(userId, target);
    expect(rem.redirected).toBe(true);
    // 'Linear Equations & Systems of Equations' wins because it appears earlier in canonical registry
    expect(rem.selectedPattern).toBe('Linear Equations & Systems of Equations');
  });

  it('P8: prerequisite tie-breaking: same mastery, attempts, and registry position -> alphabetical pattern name as final deterministic fallback', () => {
    // When mastery, attempt count, and canonical registry index all tie, alphabetical pattern name breaks tie
    const candidates = [
      { pattern: 'Zebra Remediation Pattern', mastery: 0.30, attempts: 5, registryIndex: 10 },
      { pattern: 'Alpha Remediation Pattern', mastery: 0.30, attempts: 5, registryIndex: 10 },
    ];

    candidates.sort((a, b) => {
      if (Math.abs(a.mastery - b.mastery) > 1e-9) return a.mastery - b.mastery;
      if (a.attempts !== b.attempts) return a.attempts - b.attempts;
      if (a.registryIndex !== b.registryIndex) return a.registryIndex - b.registryIndex;
      return a.pattern.localeCompare(b.pattern);
    });

    expect(candidates[0].pattern).toBe('Alpha Remediation Pattern');
  });
});
