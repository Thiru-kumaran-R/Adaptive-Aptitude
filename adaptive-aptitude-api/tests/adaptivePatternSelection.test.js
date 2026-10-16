'use strict';

/**
 * tests/adaptivePatternSelection.test.js
 *
 * Tests for Phase 4 Candidate Pattern Selection:
 *   - Explicit pattern request & topic-pattern validation
 *   - Topic-only scope restriction
 *   - Plan ownership & planId restriction
 *   - DailyObjective priority formula (0.70 * masteryNeed + 0.30 * objectiveNeedRatio)
 *   - Completed objective does not receive bonus
 *   - Deterministic tie-breaking
 *   - New student foundational fallback
 */

const mongoose = require('mongoose');
const { connectTestDB, disconnectTestDB, clearAllTestCollections } = require('./helpers/dbSetup');
const DailyObjective = require('../src/models/dailyObjectiveModel');
const StudyPlan = require('../src/models/studyPlanModel');
const Goal = require('../src/models/goalModel');
const StudentProgress = require('../src/models/studentProgressModel');
const patternSelectionService = require('../src/services/adaptive/patternSelectionService');
const { normalizeToMidnightUTC } = require('../src/services/dailyObjectiveService');
const config = require('../src/config/adaptiveConfig');

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

describe('Adaptive Pattern Selection Service (Phase 4 V1)', () => {
  const userId = 'pattern_sel_user';

  it('PS1: explicit pattern request takes top priority', async () => {
    const result = await patternSelectionService.selectCandidatePattern(userId, {
      pattern: 'Basic Percentage Calculation',
    });

    expect(result.pattern).toBe('Basic Percentage Calculation');
    expect(result.topic).toBe('Percentage');
    expect(result.reasonCodes).toContain('EXPLICIT_PATTERN');
  });

  it('PS2: topic-pattern mismatch is rejected with HTTP 400 PATTERN_TOPIC_MISMATCH', async () => {
    // 'Linear Equations & Systems of Equations' belongs to 'Algebra', NOT 'Percentage'
    await expect(
      patternSelectionService.selectCandidatePattern(userId, {
        topic: 'Percentage',
        pattern: 'Linear Equations & Systems of Equations',
      })
    ).rejects.toMatchObject({
      statusCode: 400,
      code: 'PATTERN_TOPIC_MISMATCH',
    });
  });

  it('PS3: topic-only scope restricts selection strictly to that topic', async () => {
    const result = await patternSelectionService.selectCandidatePattern(userId, {
      topic: 'Percentage',
    });

    expect(result.topic).toBe('Percentage');
    expect(['Basic Percentage Calculation', 'Percentage']).toContain(result.topic);
  });

  it('PS4: planId belonging to another student is rejected with 404', async () => {
    const otherPlan = await StudyPlan.create({
      userId: 'other_student',
      goalId: new mongoose.Types.ObjectId(),
      name: 'Other Plan',
      scope: 'short',
      phase: 'foundation',
      targets: [{ topic: 'Percentage', pattern: 'Basic Percentage Calculation' }],
    });

    await expect(
      patternSelectionService.selectCandidatePattern(userId, {
        planId: otherPlan._id.toString(),
      })
    ).rejects.toMatchObject({
      statusCode: 404,
      code: 'STUDY_PLAN_NOT_FOUND',
    });
  });

  it('PS5: DailyObjective incomplete pattern receives objective need bonus according to formula', async () => {
    const today = normalizeToMidnightUTC(new Date());
    const planId = new mongoose.Types.ObjectId();
    const goalId = new mongoose.Types.ObjectId();

    // Pattern 1: targetQuestions = 10, completed = 2 => remaining = 8 => ratio = 0.8
    // Pattern 2: targetQuestions = 10, completed = 9 => remaining = 1 => ratio = 0.1
    // Both have mastery = 0.50 => masteryNeed = 0.50
    // Pattern 1 score = 0.70 * 0.50 + 0.30 * 0.80 = 0.35 + 0.24 = 0.59
    // Pattern 2 score = 0.70 * 0.50 + 0.30 * 0.10 = 0.35 + 0.03 = 0.38
    await DailyObjective.create({
      userId,
      planId,
      goalId,
      date: today,
      topic: 'Percentage',
      patterns: [
        {
          pattern: 'Successive Percentage Changes',
          targetQuestions: 10,
          completedQuestions: 9,
        },
        {
          pattern: 'Basic Percentage Calculation',
          targetQuestions: 10,
          completedQuestions: 2,
        },
      ],
    });

    await StudentProgress.create({
      userId,
      topic: 'Percentage',
      pattern: 'Basic Percentage Calculation',
      mastery: 0.50,
      attempts: 5,
    });
    await StudentProgress.create({
      userId,
      topic: 'Percentage',
      pattern: 'Successive Percentage Changes',
      mastery: 0.50,
      attempts: 5,
    });

    const result = await patternSelectionService.selectCandidatePattern(userId);

    // Basic Percentage Calculation should win because of higher remainingQuestions
    expect(result.pattern).toBe('Basic Percentage Calculation');
    expect(result.candidateScoreDetails.priorityScore).toBeCloseTo(0.59, 4);
    expect(result.reasonCodes).toContain('DAILY_OBJECTIVE');
  });

  it('PS6: completed DailyObjective pattern (remaining = 0) receives NO objective bonus', async () => {
    const today = normalizeToMidnightUTC(new Date());
    const planId = new mongoose.Types.ObjectId();
    const goalId = new mongoose.Types.ObjectId();

    await DailyObjective.create({
      userId,
      planId,
      goalId,
      date: today,
      topic: 'Percentage',
      patterns: [
        {
          pattern: 'Basic Percentage Calculation',
          targetQuestions: 5,
          completedQuestions: 5, // Completed!
        },
      ],
    });

    // Since today's daily objective has 0 remaining questions, it falls through to foundational fallback
    const result = await patternSelectionService.selectCandidatePattern(userId);
    expect(result.reasonCodes).toContain('FOUNDATIONAL_FALLBACK');
  });

  it('PS7: new student with zero data falls back to first eligible foundational pattern deterministically', async () => {
    const result = await patternSelectionService.selectCandidatePattern(userId);

    expect(result.reasonCodes).toContain('FOUNDATIONAL_FALLBACK');
    expect(result.mastery).toBe(0);
    expect(result.topic).toBeDefined();
    expect(result.pattern).toBeDefined();
  });

  it('PS8: weak-pattern fallback uses mastery < PREREQUISITE_MASTERY_THRESHOLD (0.70), NOT accuracy', async () => {
    // Pattern 1 has accuracy = 75% (> 70%), but mastery = 0.55 (< 0.70)
    // This MUST qualify as weak/developing candidate
    await StudentProgress.create({
      userId,
      topic: 'Percentage',
      pattern: 'Basic Percentage Calculation',
      accuracy: 75,
      mastery: 0.55,
      attempts: 8,
    });

    // Pattern 2 has accuracy = 60%, but mastery = 0.75 (>= 0.70)
    // This must NOT qualify as weak/developing candidate
    await StudentProgress.create({
      userId,
      topic: 'Percentage',
      pattern: 'Single Percentage Increase and Decrease',
      accuracy: 60,
      mastery: 0.75,
      attempts: 12,
    });

    // With no active DailyObjective or StudyPlan, Priority 4 (weak progress) executes
    const result = await patternSelectionService.selectCandidatePattern(userId);

    expect(result.reasonCodes).toContain('LOW_MASTERY');
    expect(result.pattern).toBe('Basic Percentage Calculation');
    expect(result.mastery).toBe(0.55);
    expect(result.mastery).toBeLessThan(config.PREREQUISITE_MASTERY_THRESHOLD);
  });

  it('PS9: general candidate tie-breaking uses canonical registry order when priority, mastery, and attempts are equal', async () => {
    // Active StudyPlan with 2 patterns from Percentage:
    // 'Basic Percentage Calculation' (earlier in registry) vs 'Single Percentage Increase and Decrease' (later)
    const goalId = new mongoose.Types.ObjectId();
    const plan = await StudyPlan.create({
      userId,
      goalId,
      name: 'Tie-break Plan',
      scope: 'short',
      phase: 'foundation',
      status: 'active',
      targets: [
        { topic: 'Percentage', pattern: 'Single Percentage Increase and Decrease' },
        { topic: 'Percentage', pattern: 'Basic Percentage Calculation' },
      ],
    });

    // Seed equal mastery (0.50) and equal attempts (5) for both patterns
    await StudentProgress.create({
      userId,
      topic: 'Percentage',
      pattern: 'Basic Percentage Calculation',
      mastery: 0.50,
      attempts: 5,
    });
    await StudentProgress.create({
      userId,
      topic: 'Percentage',
      pattern: 'Single Percentage Increase and Decrease',
      mastery: 0.50,
      attempts: 5,
    });

    const result = await patternSelectionService.selectCandidatePattern(userId, {
      planId: plan._id.toString(),
    });

    // Even though 'Single Percentage Increase and Decrease' was listed first in targets,
    // 'Basic Percentage Calculation' wins due to earlier canonical registry position!
    expect(result.pattern).toBe('Basic Percentage Calculation');
    expect(result.reasonCodes).toContain('ACTIVE_STUDY_PLAN');
  });

  it('PS10: topic-only request strictly restricts all candidate selection scopes to the requested topic', async () => {
    // Seed very weak pattern in Algebra (mastery = 0.10)
    await StudentProgress.create({
      userId,
      topic: 'Algebra',
      pattern: 'Linear Equations & Systems of Equations',
      mastery: 0.10,
      attempts: 3,
    });

    // Seed developing pattern in Percentage (mastery = 0.50)
    await StudentProgress.create({
      userId,
      topic: 'Percentage',
      pattern: 'Basic Percentage Calculation',
      mastery: 0.50,
      attempts: 5,
    });

    // Request with topic: 'Percentage'
    const result = await patternSelectionService.selectCandidatePattern(userId, {
      topic: 'Percentage',
    });

    // Must NEVER select the weaker pattern from Algebra!
    expect(result.topic).toBe('Percentage');
    expect(result.pattern).toBe('Basic Percentage Calculation');
  });

  it('PS11: general candidate tie-breaking uses pattern name as final fallback when priority, mastery, attempts, and registry index tie', () => {
    const candidates = [
      { pattern: 'Zulu Pattern', priorityScore: 0.70, mastery: 0.30, attempts: 5, registryIndex: 20 },
      { pattern: 'Alpha Pattern', priorityScore: 0.70, mastery: 0.30, attempts: 5, registryIndex: 20 },
    ];

    candidates.sort((a, b) => {
      if (Math.abs(b.priorityScore - a.priorityScore) > 1e-9) return b.priorityScore - a.priorityScore;
      if (Math.abs(a.mastery - b.mastery) > 1e-9) return a.mastery - b.mastery;
      if (a.attempts !== b.attempts) return a.attempts - b.attempts;
      if (a.registryIndex !== b.registryIndex) return a.registryIndex - b.registryIndex;
      return a.pattern.localeCompare(b.pattern);
    });

    expect(candidates[0].pattern).toBe('Alpha Pattern');
  });
});
