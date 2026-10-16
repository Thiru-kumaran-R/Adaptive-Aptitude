'use strict';

/**
 * tests/phase3_adaptive_query.test.js
 *
 * Phase 3 Adaptive Query Helper Tests (Q1–Q10)
 *
 * Verifies that Q1–Q10 functions return STORED factual data.
 * CONFIRMS:
 *   - Q10 does NOT return: eligible, notEligible, prerequisiteSatisfied,
 *     readyForPattern, canAdvance, or any Phase 4 decision fields.
 *   - Q4 sorts by stored accuracy ASC — does not compute new mastery.
 *   - Q3 returns recent attempts sorted by date DESC.
 */

const mongoose = require('mongoose');
const { connectTestDB, disconnectTestDB, clearPhase3Collections } = require('./helpers/dbSetup');
const { seedAttempt, seedProgress } = require('./helpers/seedData');
const {
  Q1_progressByTopic,
  Q2_progressByPattern,
  Q3_recentAttempts,
  Q4_weakestPatterns,
  Q5_attemptedQuestionIds,
  Q6_unattemptedQuestions,
  Q7_difficultyDistribution,
  Q8_accuracyOverTime,
  Q9_attemptsBySource,
  Q10_prerequisiteData,
} = require('../src/services/adaptiveQueryHelper');

const PHASE3_QUERY_USER = 'q_test_user_001';

beforeAll(async () => {
  await connectTestDB();
  await clearPhase3Collections();

  // Seed progress records for query tests
  await seedProgress({ userId: PHASE3_QUERY_USER, topic: 'Percentage', pattern: 'Basic Percentage Calculation', attempts: 10, correct: 7, incorrect: 3, accuracy: 70, totalTimeSpent: 300, averageTime: 30 });
  await seedProgress({ userId: PHASE3_QUERY_USER, topic: 'Percentage', pattern: 'Successive Percentage Changes', attempts: 5, correct: 2, incorrect: 3, accuracy: 40, totalTimeSpent: 200, averageTime: 40 });
  await seedProgress({ userId: PHASE3_QUERY_USER, topic: 'Algebra', pattern: 'Linear Equations & Systems of Equations', attempts: 8, correct: 8, incorrect: 0, accuracy: 100, totalTimeSpent: 160, averageTime: 20 });

  // Seed attempts for attempt-based queries
  const qId1 = new mongoose.Types.ObjectId();
  const qId2 = new mongoose.Types.ObjectId();
  await seedAttempt({ userId: PHASE3_QUERY_USER, questionId: qId1, topic: 'Percentage', pattern: 'Basic Percentage Calculation', difficulty: 1, isCorrect: true, timeTaken: 30, source: 'practice' });
  await seedAttempt({ userId: PHASE3_QUERY_USER, questionId: qId2, topic: 'Percentage', pattern: 'Basic Percentage Calculation', difficulty: 2, isCorrect: false, timeTaken: 40, source: 'daily_plan' });
}, 60000);

afterAll(async () => {
  await clearPhase3Collections();
  await disconnectTestDB();
}, 60000);

// ─────────────────────────────────────────────────────────────────────────────
// Q1: Progress by topic
// ─────────────────────────────────────────────────────────────────────────────
describe('Q1 — progressByTopic', () => {
  it('Q1a: returns all progress records for user when no topic filter', async () => {
    const records = await Q1_progressByTopic(PHASE3_QUERY_USER);
    expect(records.length).toBe(3);
  });

  it('Q1b: filters by topic when provided', async () => {
    const records = await Q1_progressByTopic(PHASE3_QUERY_USER, 'Percentage');
    expect(records.every((r) => r.topic === 'Percentage')).toBe(true);
    expect(records.length).toBe(2);
  });

  it('Q1c: returns empty array for user with no records', async () => {
    const records = await Q1_progressByTopic('nonexistent_user');
    expect(records).toEqual([]);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Q2: Progress by pattern within topic
// ─────────────────────────────────────────────────────────────────────────────
describe('Q2 — progressByPattern', () => {
  it('Q2a: returns patterns for a specific topic', async () => {
    const records = await Q2_progressByPattern(PHASE3_QUERY_USER, 'Percentage');
    expect(records.length).toBe(2);
    expect(records.every((r) => r.topic === 'Percentage')).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Q3: Recent attempts
// ─────────────────────────────────────────────────────────────────────────────
describe('Q3 — recentAttempts', () => {
  it('Q3a: returns attempts sorted by attemptedAt DESC', async () => {
    const attempts = await Q3_recentAttempts(PHASE3_QUERY_USER);
    expect(attempts.length).toBeGreaterThan(0);
    for (let i = 1; i < attempts.length; i++) {
      expect(attempts[i - 1].attemptedAt >= attempts[i].attemptedAt).toBe(true);
    }
  });

  it('Q3b: respects limit parameter', async () => {
    const attempts = await Q3_recentAttempts(PHASE3_QUERY_USER, { limit: 1 });
    expect(attempts.length).toBe(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Q4: Weakest patterns — sorted by accuracy ASC
// ─────────────────────────────────────────────────────────────────────────────
describe('Q4 — weakestPatterns', () => {
  it('Q4a: returns patterns sorted by accuracy ASC (lowest accuracy first)', async () => {
    const records = await Q4_weakestPatterns(PHASE3_QUERY_USER);
    for (let i = 1; i < records.length; i++) {
      expect(records[i - 1].accuracy <= records[i].accuracy).toBe(true);
    }
  });

  it('Q4b: does NOT compute or return mastery formula decisions', async () => {
    const records = await Q4_weakestPatterns(PHASE3_QUERY_USER);
    for (const r of records) {
      // Phase 3: mastery remains 0, no computed mastery field from Q4
      expect(r.mastery).toBe(0);
      // No adaptive decision fields
      expect(r.eligible).toBeUndefined();
      expect(r.notEligible).toBeUndefined();
      expect(r.prerequisiteSatisfied).toBeUndefined();
      expect(r.readyForPattern).toBeUndefined();
      expect(r.canAdvance).toBeUndefined();
    }
  });

  it('Q4c: only includes patterns with at least 1 attempt', async () => {
    const records = await Q4_weakestPatterns(PHASE3_QUERY_USER);
    expect(records.every((r) => r.attempts > 0)).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Q5: Attempted question IDs
// ─────────────────────────────────────────────────────────────────────────────
describe('Q5 — attemptedQuestionIds', () => {
  it('Q5a: returns distinct question IDs attempted by user', async () => {
    const ids = await Q5_attemptedQuestionIds(PHASE3_QUERY_USER);
    expect(ids.length).toBe(2); // 2 distinct questions seeded
  });

  it('Q5b: filters by topic when provided', async () => {
    const ids = await Q5_attemptedQuestionIds(PHASE3_QUERY_USER, { topic: 'Percentage' });
    expect(ids.length).toBe(2);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Q7: Difficulty distribution
// ─────────────────────────────────────────────────────────────────────────────
describe('Q7 — difficultyDistribution', () => {
  it('Q7a: returns difficulty breakdown with totals', async () => {
    const dist = await Q7_difficultyDistribution(PHASE3_QUERY_USER, { topic: 'Percentage' });
    expect(dist.length).toBeGreaterThan(0);
    expect(dist[0]).toHaveProperty('difficulty');
    expect(dist[0]).toHaveProperty('totalAttempts');
    expect(dist[0]).toHaveProperty('correct');
    expect(dist[0]).toHaveProperty('incorrect');
  });

  it('Q7a2: difficulty levels sorted ascending', async () => {
    const dist = await Q7_difficultyDistribution(PHASE3_QUERY_USER);
    for (let i = 1; i < dist.length; i++) {
      expect(dist[i - 1].difficulty <= dist[i].difficulty).toBe(true);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Q8: Accuracy over time
// ─────────────────────────────────────────────────────────────────────────────
describe('Q8 — accuracyOverTime', () => {
  it('Q8a: returns time series with runningAccuracy', async () => {
    const series = await Q8_accuracyOverTime(PHASE3_QUERY_USER);
    expect(series.length).toBeGreaterThan(0);
    expect(series[0]).toHaveProperty('attemptedAt');
    expect(series[0]).toHaveProperty('runningAccuracy');
    expect(series[0]).toHaveProperty('isCorrect');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Q9: Attempts by source
// ─────────────────────────────────────────────────────────────────────────────
describe('Q9 — attemptsBySource', () => {
  it('Q9a: returns source breakdown', async () => {
    const sources = await Q9_attemptsBySource(PHASE3_QUERY_USER);
    const sourceNames = sources.map((s) => s.source);
    expect(sourceNames).toContain('practice');
    expect(sourceNames).toContain('daily_plan');
  });

  it('Q9b: totalAttempts is a positive integer per source', async () => {
    const sources = await Q9_attemptsBySource(PHASE3_QUERY_USER);
    expect(sources.every((s) => Number.isInteger(s.totalAttempts) && s.totalAttempts > 0)).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Q10: Prerequisite data — Phase 3 boundary enforcement
// ─────────────────────────────────────────────────────────────────────────────
describe('Q10 — prerequisiteData (Phase 3 boundary)', () => {
  const FOUNDATIONAL_PATTERN = 'Basic Percentage Calculation';
  const PATTERN_WITH_PREREQS = 'Successive Percentage Changes';

  it('Q10a: returns factual prerequisite list for a pattern', async () => {
    const data = await Q10_prerequisiteData(FOUNDATIONAL_PATTERN);
    expect(data.pattern).toBe(FOUNDATIONAL_PATTERN);
    expect(Array.isArray(data.prerequisites)).toBe(true);
    expect(typeof data.prerequisiteCount).toBe('number');
    expect(typeof data.isFoundational).toBe('boolean');
  });

  it('Q10b: foundational pattern has isFoundational=true and empty prerequisites', async () => {
    const data = await Q10_prerequisiteData(FOUNDATIONAL_PATTERN);
    expect(data.isFoundational).toBe(true);
    expect(data.prerequisites.length).toBe(0);
  });

  it('Q10c: DOES NOT return adaptive decision fields', async () => {
    const data = await Q10_prerequisiteData(FOUNDATIONAL_PATTERN);
    // These MUST NOT appear in Phase 3 Q10 output
    expect(data.eligible).toBeUndefined();
    expect(data.notEligible).toBeUndefined();
    expect(data.prerequisiteSatisfied).toBeUndefined();
    expect(data.readyForPattern).toBeUndefined();
    expect(data.canAdvance).toBeUndefined();
  });

  it('Q10d: returns topic for the pattern', async () => {
    const data = await Q10_prerequisiteData(FOUNDATIONAL_PATTERN);
    expect(data.topic).toBe('Percentage');
  });

  it('Q10e: returns dependents list (patterns that need this pattern as prereq)', async () => {
    const data = await Q10_prerequisiteData(FOUNDATIONAL_PATTERN);
    expect(Array.isArray(data.dependents)).toBe(true);
    expect(typeof data.dependentCount).toBe('number');
  });

  it('Q10f: 404 for non-existent pattern', async () => {
    await expect(Q10_prerequisiteData('Nonexistent Pattern XYZ')).rejects.toMatchObject({
      statusCode: 404,
      code: 'PATTERN_NOT_FOUND',
    });
  });
});
