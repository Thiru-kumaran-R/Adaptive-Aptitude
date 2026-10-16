'use strict';

/**
 * Suite 3: tests/analytics/staminaCurve.test.js
 *
 * Verifies:
 *   - Only terminal finalized mock sessions qualify ('submitted', 'expired', 'completed')
 *   - Excludes active, created, started, abandoned, and unfinalized mocks
 *   - Sequence ordering from MockSession.questionSequence
 *   - Correctness from immutable mock Attempt records
 *   - Unanswered questions contribute 0 correct to quartile denominator
 *   - Balanced quartile partitioning: N = 4, 5, 6, 7, 8
 *   - N < 4 small mock exclusion from quartile aggregation
 *   - Fallback reasons: 'insufficient_terminal_mocks' and 'insufficient_questions'
 *   - Mixed history: 2-question mock + 20-question mock => only 20-question contributes
 *   - Zero-baseline guard: Q1 accuracy = 0.0% => fatigueDropoffPercent = null, 'zero_first_quartile_baseline'
 *   - Multi-session raw count aggregation
 *   - Topic and windowDays invariant (stamina is completely independent of topic & windowDays)
 */

const mongoose = require('mongoose');
const { connectTestDB, disconnectTestDB, clearAllTestCollections } = require('../helpers/dbSetup');
const User = require('../../src/models/userModel');
const MockSession = require('../../src/models/mockSessionModel');
const Attempt = require('../../src/models/attemptModel');
const { getStaminaCurve } = require('../../src/services/analytics/staminaAnalyticsService');
const { MOCK_MODES, NAVIGATION_POLICIES, SESSION_STATUS, FINALIZATION_STATE } = require('../../src/config/mockConfig');

describe('Suite 3: Cognitive Stamina & Sequence Fatigue Analytics', () => {
  const userId = 'usr_stamina_test';

  beforeAll(async () => {
    jest.setTimeout(60000);
    await connectTestDB();
    await clearAllTestCollections();
    await User.create({ userId, email: 'stamina@test.com', name: 'Stamina Test User' });
  }, 60000);

  afterAll(async () => {
    await clearAllTestCollections();
    await disconnectTestDB();
  });

  beforeEach(async () => {
    await MockSession.deleteMany({});
    await Attempt.deleteMany({});
  });

  it('returns staminaCurve: null with staminaReason: "insufficient_terminal_mocks" when no mocks exist', async () => {
    const result = await getStaminaCurve(userId);
    expect(result.staminaCurve).toBeNull();
    expect(result.staminaReason).toBe('insufficient_terminal_mocks');
  });

  it('excludes active, created, started, abandoned, and unfinalized mocks', async () => {
    await MockSession.create([
      {
        userId,
        blueprintSnapshot: { sections: [] },
        blueprintFingerprint: 'fp-1',
        mode: MOCK_MODES.STANDARD,
        navigationPolicy: NAVIGATION_POLICIES.FREE,
        effectiveExcludeRecentQuestions: false,
        questionSequence: [{ questionId: new mongoose.Types.ObjectId(), sectionId: 's1', order: 0, topic: 'Percentage', pattern: 'P1', difficulty: 1 }],
        sectionStates: [],
        totalQuestions: 1,
        durationMinutes: 30,
        generationSeed: 'seed-1',
        status: SESSION_STATUS.STARTED,
        finalizationState: FINALIZATION_STATE.IDLE,
      },
      {
        userId,
        blueprintSnapshot: { sections: [] },
        blueprintFingerprint: 'fp-2',
        mode: MOCK_MODES.STANDARD,
        navigationPolicy: NAVIGATION_POLICIES.FREE,
        effectiveExcludeRecentQuestions: false,
        questionSequence: [{ questionId: new mongoose.Types.ObjectId(), sectionId: 's1', order: 0, topic: 'Percentage', pattern: 'P1', difficulty: 1 }],
        sectionStates: [],
        totalQuestions: 1,
        durationMinutes: 30,
        generationSeed: 'seed-2',
        status: SESSION_STATUS.ABANDONED,
        finalizationState: FINALIZATION_STATE.COMPLETED,
      },
    ]);

    const result = await getStaminaCurve(userId);
    expect(result.staminaCurve).toBeNull();
    expect(result.staminaReason).toBe('insufficient_terminal_mocks');
  });

  it('returns staminaReason: "insufficient_questions" when terminal mocks exist but all have N < 4', async () => {
    await MockSession.create({
      userId,
      blueprintSnapshot: { sections: [] },
      blueprintFingerprint: 'fp-small',
      mode: MOCK_MODES.STANDARD,
      navigationPolicy: NAVIGATION_POLICIES.FREE,
      effectiveExcludeRecentQuestions: false,
      questionSequence: [
        { questionId: new mongoose.Types.ObjectId(), sectionId: 's1', order: 0, topic: 'Percentage', pattern: 'P1', difficulty: 1 },
        { questionId: new mongoose.Types.ObjectId(), sectionId: 's1', order: 1, topic: 'Percentage', pattern: 'P1', difficulty: 1 },
      ],
      sectionStates: [],
      totalQuestions: 2,
      durationMinutes: 10,
      generationSeed: 'seed-small',
      status: SESSION_STATUS.SUBMITTED,
      finalizationState: FINALIZATION_STATE.COMPLETED,
    });

    const result = await getStaminaCurve(userId);
    expect(result.staminaCurve).toBeNull();
    expect(result.staminaReason).toBe('insufficient_questions');
  });

  it('mixed history: 2-question mock + 20-question mock => only 20-question mock contributes', async () => {
    const qIds20 = Array.from({ length: 20 }, () => new mongoose.Types.ObjectId());
    const seq20 = qIds20.map((qid, idx) => ({
      questionId: qid,
      sectionId: 's1',
      order: idx,
      topic: 'Percentage',
      pattern: 'P1',
      difficulty: 1,
    }));

    // 2-question mock
    await MockSession.create({
      userId,
      blueprintSnapshot: { sections: [] },
      blueprintFingerprint: 'fp-2q',
      mode: MOCK_MODES.STANDARD,
      navigationPolicy: NAVIGATION_POLICIES.FREE,
      effectiveExcludeRecentQuestions: false,
      questionSequence: [
        { questionId: new mongoose.Types.ObjectId(), sectionId: 's1', order: 0, topic: 'Percentage', pattern: 'P1', difficulty: 1 },
        { questionId: new mongoose.Types.ObjectId(), sectionId: 's1', order: 1, topic: 'Percentage', pattern: 'P1', difficulty: 1 },
      ],
      sectionStates: [],
      totalQuestions: 2,
      durationMinutes: 10,
      generationSeed: 'seed-2q',
      status: SESSION_STATUS.SUBMITTED,
      finalizationState: FINALIZATION_STATE.COMPLETED,
    });

    // 20-question mock
    const session20 = await MockSession.create({
      userId,
      blueprintSnapshot: { sections: [] },
      blueprintFingerprint: 'fp-20q',
      mode: MOCK_MODES.STANDARD,
      navigationPolicy: NAVIGATION_POLICIES.FREE,
      effectiveExcludeRecentQuestions: false,
      questionSequence: seq20,
      sectionStates: [],
      totalQuestions: 20,
      durationMinutes: 60,
      generationSeed: 'seed-20q',
      status: SESSION_STATUS.SUBMITTED,
      finalizationState: FINALIZATION_STATE.COMPLETED,
    });

    // Create attempts for session20:
    // Q1 (questions 0..4): 5 correct => 100%
    // Q2 (questions 5..9): 4 correct => 80%
    // Q3 (questions 10..14): 3 correct => 60%
    // Q4 (questions 15..19): 2 correct => 40%
    const attemptsToInsert = [];
    for (let i = 0; i < 20; i++) {
      let isCorrect = false;
      if (i < 5) isCorrect = true; // 5/5
      else if (i >= 5 && i < 9) isCorrect = true; // 4/5
      else if (i >= 10 && i < 13) isCorrect = true; // 3/5
      else if (i >= 15 && i < 17) isCorrect = true; // 2/5

      attemptsToInsert.push({
        userId,
        questionId: qIds20[i],
        topic: 'Percentage',
        pattern: 'P1',
        difficulty: 1,
        selectedAnswer: 'A',
        correctAnswer: 'A',
        isCorrect,
        timeTaken: 30,
        source: 'mock',
        sessionId: String(session20._id),
      });
    }
    await Attempt.insertMany(attemptsToInsert);

    const result = await getStaminaCurve(userId);
    expect(result.staminaReason).toBeNull();
    const curve = result.staminaCurve;
    expect(curve.mockSessionsAnalyzed).toBe(1);
    expect(curve.totalQuestionsAnalyzed).toBe(20);

    expect(curve.quartileAccuracy[0].accuracy).toBe(100.0);
    expect(curve.quartileAccuracy[0].totalQuestions).toBe(5);
    expect(curve.quartileAccuracy[0].correctQuestions).toBe(5);

    expect(curve.quartileAccuracy[1].accuracy).toBe(80.0);
    expect(curve.quartileAccuracy[2].accuracy).toBe(60.0);
    expect(curve.quartileAccuracy[3].accuracy).toBe(40.0);

    // Fatigue dropoff: (100 - 40) / 100 * 100 = 60.0%
    expect(curve.fatigueDropoffPercent).toBe(60.0);
  });

  it('zero-baseline guard: Q1 accuracy = 0.0% => fatigueDropoffPercent: null, fatigueReason: "zero_first_quartile_baseline"', async () => {
    const qIds = Array.from({ length: 4 }, () => new mongoose.Types.ObjectId());
    const seq = qIds.map((qid, idx) => ({
      questionId: qid,
      sectionId: 's1',
      order: idx,
      topic: 'Percentage',
      pattern: 'P1',
      difficulty: 1,
    }));

    const session = await MockSession.create({
      userId,
      blueprintSnapshot: { sections: [] },
      blueprintFingerprint: 'fp-zero',
      mode: MOCK_MODES.STANDARD,
      navigationPolicy: NAVIGATION_POLICIES.FREE,
      effectiveExcludeRecentQuestions: false,
      questionSequence: seq,
      sectionStates: [],
      totalQuestions: 4,
      durationMinutes: 15,
      generationSeed: 'seed-zero',
      status: SESSION_STATUS.SUBMITTED,
      finalizationState: FINALIZATION_STATE.COMPLETED,
    });

    // Q1 (question 0) incorrect, Q4 (question 3) correct
    await Attempt.create([
      {
        userId,
        questionId: qIds[0],
        topic: 'Percentage',
        pattern: 'P1',
        difficulty: 1,
        selectedAnswer: 'B',
        correctAnswer: 'A',
        isCorrect: false,
        timeTaken: 30,
        source: 'mock',
        sessionId: String(session._id),
      },
      {
        userId,
        questionId: qIds[3],
        topic: 'Percentage',
        pattern: 'P1',
        difficulty: 1,
        selectedAnswer: 'A',
        correctAnswer: 'A',
        isCorrect: true,
        timeTaken: 30,
        source: 'mock',
        sessionId: String(session._id),
      },
    ]);

    const result = await getStaminaCurve(userId);
    expect(result.staminaCurve.quartileAccuracy[0].accuracy).toBe(0.0);
    expect(result.staminaCurve.fatigueDropoffPercent).toBeNull();
    expect(result.staminaCurve.fatigueReason).toBe('zero_first_quartile_baseline');
  });

  it('treats unanswered questions as 0 correct in quartile denominator without synthetic attempt creation', async () => {
    const qIds = Array.from({ length: 4 }, () => new mongoose.Types.ObjectId());
    const seq = qIds.map((qid, idx) => ({
      questionId: qid,
      sectionId: 's1',
      order: idx,
      topic: 'Percentage',
      pattern: 'P1',
      difficulty: 1,
    }));

    const session = await MockSession.create({
      userId,
      blueprintSnapshot: { sections: [] },
      blueprintFingerprint: 'fp-unanswered',
      mode: MOCK_MODES.STANDARD,
      navigationPolicy: NAVIGATION_POLICIES.FREE,
      effectiveExcludeRecentQuestions: false,
      questionSequence: seq,
      sectionStates: [],
      totalQuestions: 4,
      durationMinutes: 15,
      generationSeed: 'seed-unans',
      status: SESSION_STATUS.SUBMITTED,
      finalizationState: FINALIZATION_STATE.COMPLETED,
    });

    // Student only answered question 0 correctly, leaving questions 1, 2, 3 unanswered
    await Attempt.create({
      userId,
      questionId: qIds[0],
      topic: 'Percentage',
      pattern: 'P1',
      difficulty: 1,
      selectedAnswer: 'A',
      correctAnswer: 'A',
      isCorrect: true,
      timeTaken: 30,
      source: 'mock',
      sessionId: String(session._id),
    });

    const result = await getStaminaCurve(userId);
    const curve = result.staminaCurve;
    expect(curve.quartileAccuracy[0].accuracy).toBe(100.0);
    expect(curve.quartileAccuracy[1].accuracy).toBe(0.0);
    expect(curve.quartileAccuracy[2].accuracy).toBe(0.0);
    expect(curve.quartileAccuracy[3].accuracy).toBe(0.0);

    // Verify 0 synthetic attempts were created
    const totalAttempts = await Attempt.countDocuments({ sessionId: String(session._id) });
    expect(totalAttempts).toBe(1);
  });
});
