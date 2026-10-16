'use strict';

/**
 * tests/adaptiveEndpoint.test.js
 *
 * Tests for Phase 4 Adaptive HTTP API:
 *   - Input validation (missing userId -> 400, unknown userId -> 404)
 *   - Success response contract { success: true, data: { question, decision } }
 *   - Zero answer leakage over HTTP response
 *   - Attempt pipeline mastery integration
 *   - Client override security
 *   - Target vs selected difficulty reporting
 */

const mongoose = require('mongoose');
const supertest = require('supertest');
const { signAccessToken } = require('../src/services/authService');

function getAuthHeaders(userId = 'endpoint_student_01', extra = {}) {
  return { Authorization: `Bearer ${signAccessToken({ userId, ...extra })}` };
}

function createAuthRequest(defaultUserId = 'endpoint_student_01') {
  return function authRequest(targetApp) {
    const inst = supertest(targetApp);
    return new Proxy(inst, {
      get(target, method) {
        const origMethod = target[method];
        if (typeof origMethod !== 'function' || !['get', 'post', 'put', 'patch', 'delete'].includes(method)) {
          return origMethod;
        }
        return function(url) {
          const testInstance = origMethod.call(target, url);
          let targetUserId = defaultUserId;
          const queryMatch = url && typeof url === 'string' && url.match(/[?&]userId=([^&]+)/);
          const pathMatch = url && typeof url === 'string' && url.match(/\/(?:user|users)\/([^/?]+)/);
          if (queryMatch) {
            targetUserId = decodeURIComponent(queryMatch[1]);
          } else if (pathMatch) {
            targetUserId = decodeURIComponent(pathMatch[1]);
          }
          if (targetUserId) {
            testInstance.set(getAuthHeaders(targetUserId));
          }
          const origSend = testInstance.send;
          testInstance.send = function(data) {
            if (data && typeof data === 'object' && data.userId) {
              testInstance.set(getAuthHeaders(data.userId));
            }
            return origSend.call(testInstance, data);
          };
          return testInstance;
        };
      }
    });
  };
}
const request = createAuthRequest('endpoint_student_01');
const createApp = require('../src/app');
const { connectTestDB, disconnectTestDB, clearAllTestCollections } = require('./helpers/dbSetup');
const User = require('../src/models/userModel');
const Question = require('../src/models/questionModel');
const StudentProgress = require('../src/models/studentProgressModel');
const StudyPlan = require('../src/models/studyPlanModel');
const DailyObjective = require('../src/models/dailyObjectiveModel');

let app;

beforeAll(async () => {
  await connectTestDB();
  app = createApp();
}, 60000);

afterAll(async () => {
  await clearAllTestCollections();
  await disconnectTestDB();
}, 60000);

beforeEach(async () => {
  await clearAllTestCollections();
});

describe('Adaptive API Endpoint (Phase 4 V1)', () => {
  const userId = 'endpoint_student_01';

  it('AE1: returns HTTP 401 UNAUTHORIZED when authentication is missing', async () => {
    const supertest = require('supertest');
    const res = await supertest(app).get('/api/v1/adaptive/next-question');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('AE2: returns HTTP 404 USER_NOT_FOUND when user does not exist', async () => {
    const res = await request(app).get('/api/v1/adaptive/next-question?userId=non_existent');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('USER_NOT_FOUND');
  });

  it('AE3: returns HTTP 200 with sanitized question and decision metadata', async () => {
    await User.create({ userId, name: 'Alice Test' });
    const q = await Question.create({
      question: 'What is 15% of 100?',
      answer: '15',
      options: ['10', '15', '20', '25'],
      explanation: '15% of 100 = 15',
      topic: 'Percentage',
      pattern: 'Basic Percentage Calculation',
      difficulty: 2,
    });

    const res = await request(app).get(
      `/api/v1/adaptive/next-question?userId=${userId}&topic=Percentage&pattern=Basic%20Percentage%20Calculation`
    );

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();

    const { question, decision } = res.body.data;

    // Question structure
    expect(question._id.toString()).toBe(q._id.toString());
    expect(question.question).toBe('What is 15% of 100?');
    expect(question.options).toEqual(['10', '15', '20', '25']);
    expect(question.difficulty).toBe(2);

    // Decision structure
    expect(decision.algorithmVersion).toBe('v1');
    expect(decision.selectedTopic).toBe('Percentage');
    expect(decision.selectedPattern).toBe('Basic Percentage Calculation');
    expect(decision.mastery).toBe(0);
    expect(decision.masteryLabel).toBe('weak');
    expect(decision.difficulty.selectedDifficulty).toBe(question.difficulty);
    expect(Array.isArray(decision.reasonCodes)).toBe(true);
  });

  it('AE4: ZERO answer leakage — answer, correctAnswer, and explanation are never returned (recursive scan)', async () => {
    await User.create({ userId, name: 'Alice Test' });
    await Question.create({
      question: 'Secret Question with Sensitive Content',
      answer: 'Secret Answer',
      options: ['A', 'B', 'Secret Answer', 'D'],
      explanation: 'Secret Explanation containing step-by-step resolution',
      topic: 'Percentage',
      pattern: 'Basic Percentage Calculation',
      difficulty: 2,
    });

    const res = await request(app).get(
      `/api/v1/adaptive/next-question?userId=${userId}&topic=Percentage`
    );

    expect(res.status).toBe(200);

    // 1. Recursive scan of complete response payload
    const findKeysRecursively = (obj, targets) => {
      const found = [];
      const recurse = (curr) => {
        if (!curr || typeof curr !== 'object') return;
        for (const key of Object.keys(curr)) {
          if (targets.includes(key)) {
            found.push(key);
          }
          recurse(curr[key]);
        }
      };
      recurse(obj);
      return found;
    };

    const leakedKeys = findKeysRecursively(res.body, ['answer', 'correctAnswer', 'explanation']);
    expect(leakedKeys).toEqual([]);

    // 2. String serialization check across entire response body
    const rawBody = JSON.stringify(res.body);
    expect(rawBody.includes('"answer"')).toBe(false);
    expect(rawBody.includes('"correctAnswer"')).toBe(false);
    expect(rawBody.includes('"explanation"')).toBe(false);
    expect(rawBody.includes('Secret Explanation')).toBe(false);
  });

  it('AE5: attempt submission recalculates and persists StudentProgress.mastery', async () => {
    await User.create({ userId, name: 'Alice Test' });
    const q = await Question.create({
      question: 'What is 50% of 100?',
      answer: '50',
      options: ['40', '50', '60', '70'],
      explanation: '50% of 100 = 50',
      topic: 'Percentage',
      pattern: 'Basic Percentage Calculation',
      difficulty: 2,
    });

    // Record an attempt via HTTP
    const attemptRes = await request(app).post('/api/v1/attempts').send({
      userId,
      questionId: q._id.toString(),
      selectedAnswer: '50', // Correct!
      timeTaken: 20,
      source: 'practice',
    });

    expect(attemptRes.status).toBe(201);

    // Verify StudentProgress has updated mastery
    const prog = await StudentProgress.findOne({
      userId,
      topic: 'Percentage',
      pattern: 'Basic Percentage Calculation',
    });

    expect(prog).toBeDefined();
    expect(prog.attempts).toBe(1);
    expect(prog.correct).toBe(1);
    expect(prog.mastery).toBeGreaterThan(0); // Phase 4 mastery recalculated!
  });

  it('AE6: client cannot override authoritative attempt metadata', async () => {
    await User.create({ userId, name: 'Alice Test' });
    const q = await Question.create({
      question: 'Question with Answer 5',
      answer: '5',
      options: ['1', '2', '3', '5'],
      explanation: 'Explanation',
      topic: 'Percentage',
      pattern: 'Basic Percentage Calculation',
      difficulty: 3,
    });

    // Attempt to submit fake metadata
    const attemptRes = await request(app).post('/api/v1/attempts').send({
      userId,
      questionId: q._id.toString(),
      selectedAnswer: '2', // Incorrect answer
      timeTaken: 10,
      source: 'practice',
      // Attacker tries to fake these fields:
      topic: 'FakeTopic',
      pattern: 'FakePattern',
      difficulty: 10,
      correctAnswer: '2',
      isCorrect: true,
    });

    expect(attemptRes.status).toBe(201);
    const data = attemptRes.body.data;

    // Server must have derived actual values from Question:
    expect(data.topic).toBe('Percentage');
    expect(data.pattern).toBe('Basic Percentage Calculation');
    expect(data.difficulty).toBe(3);
    expect(data.correctAnswer).toBe('5');
    expect(data.isCorrect).toBe(false); // 2 !== 5
  });

  it('AE7: reports targetDifficulty, selectedDifficulty, and DIFFICULTY_FALLBACK when fallback occurs', async () => {
    await User.create({ userId, name: 'Alice Test' });

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    // Active DailyObjective defines pattern targetDifficulty = 5
    await DailyObjective.create({
      userId,
      planId: new mongoose.Types.ObjectId(),
      goalId: new mongoose.Types.ObjectId(),
      date: today,
      topic: 'Percentage',
      patterns: [
        {
          pattern: 'Basic Percentage Calculation',
          targetQuestions: 5,
          completedQuestions: 0,
          targetDifficulty: 5,
        },
      ],
    });

    // Only difficulty-4 question exists (no difficulty-5 question in DB)
    await Question.create({
      question: 'Difficulty 4 Percentage Question',
      answer: 'Ans',
      options: ['A', 'B', 'Ans', 'D'],
      explanation: 'Expl',
      topic: 'Percentage',
      pattern: 'Basic Percentage Calculation',
      difficulty: 4,
    });

    const res = await request(app).get(
      `/api/v1/adaptive/next-question?userId=${userId}&topic=Percentage&pattern=Basic%20Percentage%20Calculation`
    );

    expect(res.status).toBe(200);
    const { question, decision } = res.body.data;

    // Controlled fallback:
    // baseDifficulty = 5, adjustment = 0, targetDifficulty = 5
    // Selected difficulty = 4 (fallback downward)
    expect(decision.difficulty.baseDifficulty).toBe(5);
    expect(decision.difficulty.adjustment).toBe(0);
    expect(decision.targetDifficulty).toBe(5);
    expect(decision.selectedDifficulty).toBe(4);
    expect(question.difficulty).toBe(4);
    expect(decision.selectedDifficulty).toBe(question.difficulty);
    expect(decision.isFallback).toBe(true);
    expect(decision.difficulty.fallbackUsed).toBe(true);
    expect(decision.reasonCodes).toContain('DIFFICULTY_FALLBACK');
  });

  it('AE8: cross-user planId is rejected with HTTP 404 STUDY_PLAN_NOT_FOUND', async () => {
    await User.create({ userId, name: 'Alice Test' });
    await User.create({ userId: 'other_student', name: 'Bob Test' });

    const otherPlan = await StudyPlan.create({
      userId: 'other_student',
      goalId: new mongoose.Types.ObjectId(),
      name: 'Bob Plan',
      scope: 'short',
      phase: 'foundation',
      targets: [{ topic: 'Percentage', pattern: 'Basic Percentage Calculation' }],
    });

    const res = await request(app).get(
      `/api/v1/adaptive/next-question?userId=${userId}&planId=${otherPlan._id.toString()}`
    );

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('STUDY_PLAN_NOT_FOUND');
  });

  it('AE9: topic-pattern mismatch is rejected with HTTP 400 PATTERN_TOPIC_MISMATCH', async () => {
    await User.create({ userId, name: 'Alice Test' });

    // 'Linear Equations & Systems of Equations' is an Algebra pattern, NOT Percentage
    const res = await request(app).get(
      `/api/v1/adaptive/next-question?userId=${userId}&topic=Percentage&pattern=Linear%20Equations%20%26%20Systems%20of%20Equations`
    );

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('PATTERN_TOPIC_MISMATCH');
  });

  it('AE10: topic-only adaptive request strictly restricts selection to requested topic', async () => {
    await User.create({ userId, name: 'Alice Test' });

    // Percentage progress: mastery = 0.60
    await StudentProgress.create({
      userId,
      topic: 'Percentage',
      pattern: 'Basic Percentage Calculation',
      mastery: 0.60,
      attempts: 5,
    });

    // Probability progress: MUCH LOWER mastery = 0.10
    await StudentProgress.create({
      userId,
      topic: 'Probability',
      pattern: 'Coin Toss Problems',
      mastery: 0.10,
      attempts: 2,
    });

    // Seed questions for both topics
    await Question.create({
      question: 'Percentage Question',
      answer: 'Ans',
      options: ['A', 'B', 'Ans', 'D'],
      explanation: 'Expl',
      topic: 'Percentage',
      pattern: 'Basic Percentage Calculation',
      difficulty: 2,
    });
    await Question.create({
      question: 'Probability Question',
      answer: 'Ans',
      options: ['A', 'B', 'Ans', 'D'],
      explanation: 'Expl',
      topic: 'Probability',
      pattern: 'Coin Toss Problems',
      difficulty: 2,
    });

    // Request with topic: 'Percentage'
    const res = await request(app).get(
      `/api/v1/adaptive/next-question?userId=${userId}&topic=Percentage`
    );

    expect(res.status).toBe(200);
    const { question, decision } = res.body.data;

    // Must NEVER select the weaker pattern from Probability!
    expect(decision.selectedTopic).toBe('Percentage');
    expect(question.topic).toBe('Percentage');
    expect(decision.selectedPattern).toBe('Basic Percentage Calculation');
  });
});
