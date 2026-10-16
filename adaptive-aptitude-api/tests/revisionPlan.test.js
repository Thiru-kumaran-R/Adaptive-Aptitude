'use strict';

/**
 * tests/revisionPlan.test.js — Phase 5: 1-Day & 2-Day Revision Plan Tests
 */

const mongoose = require('mongoose');
const supertest = require('supertest');
const { signAccessToken } = require('../src/services/authService');

function getAuthHeaders(userId = 'usr_test_default', extra = {}) {
  return { Authorization: `Bearer ${signAccessToken({ userId, ...extra })}` };
}

function createAuthRequest(defaultUserId = 'usr_test_default') {
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
const request = createAuthRequest();
const createApp = require('../src/app');
const { connectTestDB, disconnectTestDB } = require('./helpers/dbSetup');
const User = require('../src/models/userModel');
const Goal = require('../src/models/goalModel');
const StudyPlan = require('../src/models/studyPlanModel');
const RevisionItem = require('../src/models/revisionItemModel');
const StudentProgress = require('../src/models/studentProgressModel');
const Attempt = require('../src/models/attemptModel');
const Question = require('../src/models/questionModel');

const app = createApp();

describe('Revision Plan Generation (Phase 5)', () => {
  const testUserId = 'test_rev_plan_user_' + Date.now();
  const otherUserId = 'other_rev_plan_user_' + Date.now();
  let sampleQ;

  beforeAll(async () => {
    await connectTestDB();

    await User.create({
      userId: testUserId,
      name: 'Rev Plan User',
      email: `${testUserId}@example.com`,
    });

    await User.create({
      userId: otherUserId,
      name: 'Other Plan User',
      email: `${otherUserId}@example.com`,
    });

    sampleQ = await Question.create({
      question: 'What is 10% of 100?',
      answer: '10',
      options: ['5', '10', '15', '20'],
      explanation: '10% of 100 is 10',
      topic: 'Percentage',
      pattern: 'Basic Percentage Calculation',
      difficulty: 3,
    });
  });

  afterAll(async () => {
    await User.deleteMany({ userId: { $in: [testUserId, otherUserId] } });
    await RevisionItem.deleteMany({ userId: { $in: [testUserId, otherUserId] } });
    await StudentProgress.deleteMany({ userId: { $in: [testUserId, otherUserId] } });
    await Attempt.deleteMany({ userId: { $in: [testUserId, otherUserId] } });
    if (sampleQ) {
      await Question.deleteMany({ _id: sampleQ._id });
    }
    await disconnectTestDB();
  });

  beforeEach(async () => {
    await RevisionItem.deleteMany({ userId: testUserId });
    await Attempt.deleteMany({ userId: testUserId });
    await StudentProgress.deleteMany({ userId: testUserId });
  });

  it('generates a 1-day revision plan bounded by questionBudget and patternsPerDay', async () => {
    // Seed 2 due revision items
    await RevisionItem.create({
      userId: testUserId,
      topic: 'Percentage',
      pattern: 'Basic Percentage Calculation',
      nextReviewDate: new Date('2026-10-01T00:00:00.000Z'),
      status: 'scheduled',
    });

    await RevisionItem.create({
      userId: testUserId,
      topic: 'Percentage',
      pattern: 'Successive Percentage Changes',
      nextReviewDate: new Date('2026-10-01T00:00:00.000Z'),
      status: 'scheduled',
    });

    const res = await request(app)
      .get(`/api/v1/revisions/plan?userId=${testUserId}&days=1&questionBudget=20&patternsPerDay=4&referenceDate=2026-10-01`);

    expect(res.status).toBe(200);
    const plan = res.body.data;

    expect(plan.days).toBe(1);
    expect(plan.totalQuestions).toBe(20);
    expect(plan.schedule.length).toBe(1);

    const day1 = plan.schedule[0];
    expect(day1.dayNumber).toBe(1);
    expect(day1.date).toBe('2026-10-01');
    expect(day1.patterns.length).toBe(2);

    // 20 questions distributed across 2 patterns = 10 each
    expect(day1.patterns[0].targetQuestions).toBe(10);
    expect(day1.patterns[1].targetQuestions).toBe(10);
  });

  it('generates a 2-day revision plan distributing patterns across two consecutive days', async () => {
    // Seed 4 due revision items
    const patterns = [
      'Basic Percentage Calculation',
      'Successive Percentage Changes',
      'Single Percentage Increase and Decrease',
      'Reverse Percentage & Base Value',
    ];

    for (const pat of patterns) {
      await RevisionItem.create({
        userId: testUserId,
        topic: 'Percentage',
        pattern: pat,
        nextReviewDate: new Date('2026-10-01T00:00:00.000Z'),
        status: 'scheduled',
      });
    }

    const res = await request(app)
      .get(`/api/v1/revisions/plan?userId=${testUserId}&days=2&questionBudget=20&patternsPerDay=2&referenceDate=2026-10-01`);

    expect(res.status).toBe(200);
    const plan = res.body.data;

    expect(plan.days).toBe(2);
    expect(plan.schedule.length).toBe(2);

    const day1 = plan.schedule[0];
    const day2 = plan.schedule[1];

    expect(day1.date).toBe('2026-10-01');
    expect(day1.patterns.length).toBe(2);
    expect(day1.totalQuestions).toBe(20);

    expect(day2.date).toBe('2026-10-02');
    expect(day2.patterns.length).toBe(2);
    expect(day2.totalQuestions).toBe(20);
  });

  it('supplements with recent incorrect weak patterns (Source 3) when due capacity remains', async () => {
    // Only 1 due RevisionItem
    await RevisionItem.create({
      userId: testUserId,
      topic: 'Percentage',
      pattern: 'Basic Percentage Calculation',
      nextReviewDate: new Date('2026-10-01T00:00:00.000Z'),
      status: 'scheduled',
    });

    // Seed recent incorrect attempt for another pattern
    if (sampleQ) {
      await Attempt.create({
        userId: testUserId,
        questionId: sampleQ._id,
        topic: 'Percentage',
        pattern: 'Successive Percentage Changes',
        difficulty: 3,
        selectedAnswer: 'WRONG',
        correctAnswer: sampleQ.answer,
        isCorrect: false,
        timeTaken: 30,
        source: 'practice',
        attemptedAt: new Date('2026-09-28T10:00:00.000Z'), // within 7-day lookback of 2026-10-01
      });

      // Weak progress (mastery < 0.70)
      await StudentProgress.create({
        userId: testUserId,
        topic: 'Percentage',
        pattern: 'Successive Percentage Changes',
        mastery: 0.50,
      });
    }

    const res = await request(app)
      .get(`/api/v1/revisions/plan?userId=${testUserId}&days=1&questionBudget=20&patternsPerDay=4&referenceDate=2026-10-01`);

    expect(res.status).toBe(200);
    const day1 = res.body.data.schedule[0];

    // Should include both the due item and the supplemental weak pattern
    expect(day1.patterns.length).toBe(2);
    const patternNames = day1.patterns.map((p) => p.pattern);
    expect(patternNames).toContain('Basic Percentage Calculation');
    expect(patternNames).toContain('Successive Percentage Changes');

    const supplemental = day1.patterns.find((p) => p.pattern === 'Successive Percentage Changes');
    expect(supplemental.reasonCode).toBe('RECENT_INCORRECT_WEAK');
  });

  it('rejects cross-user planId with 403 or 404 in revision plan and due queries', async () => {
    const otherPlan = await StudyPlan.create({
      userId: otherUserId,
      goalId: new mongoose.Types.ObjectId(),
      name: 'Other User Plan',
      startDate: new Date('2026-10-01'),
      endDate: new Date('2026-10-07'),
      status: 'active',
    });

    const resPlan = await request(app)
      .get(`/api/v1/revisions/plan?userId=${testUserId}&planId=${otherPlan._id}`);
    expect([403, 404]).toContain(resPlan.status);

    const resDue = await request(app)
      .get(`/api/v1/revisions/due?userId=${testUserId}&planId=${otherPlan._id}`);
    expect([403, 404]).toContain(resDue.status);

    await StudyPlan.deleteMany({ _id: otherPlan._id });
  });

  it('eliminates duplicate revision patterns when a pattern is both due and recent incorrect weak', async () => {
    // Seed due RevisionItem
    await RevisionItem.create({
      userId: testUserId,
      topic: 'Percentage',
      pattern: 'Basic Percentage Calculation',
      nextReviewDate: new Date('2026-10-01T00:00:00.000Z'),
      status: 'scheduled',
    });

    // Also seed recent incorrect attempt for the SAME pattern
    if (sampleQ) {
      await Attempt.create({
        userId: testUserId,
        questionId: sampleQ._id,
        topic: 'Percentage',
        pattern: 'Basic Percentage Calculation',
        difficulty: 3,
        selectedAnswer: 'WRONG',
        correctAnswer: sampleQ.answer,
        isCorrect: false,
        timeTaken: 30,
        source: 'practice',
        attemptedAt: new Date('2026-09-28T10:00:00.000Z'),
      });

      await StudentProgress.create({
        userId: testUserId,
        topic: 'Percentage',
        pattern: 'Basic Percentage Calculation',
        mastery: 0.40,
      });
    }

    const res = await request(app)
      .get(`/api/v1/revisions/plan?userId=${testUserId}&days=1&questionBudget=20&patternsPerDay=4&referenceDate=2026-10-01`);

    expect(res.status).toBe(200);
    const day1 = res.body.data.schedule[0];

    // Pattern must appear exactly once, not duplicated
    const matches = day1.patterns.filter((p) => p.pattern === 'Basic Percentage Calculation');
    expect(matches.length).toBe(1);
    expect(matches[0].reasonCode).toBe('DUE_TODAY');
  });

  it('deduplicates pattern appearing as both overdue RevisionItem and recent incorrect weak, favoring overdue state', async () => {
    // Seed OVERDUE RevisionItem (nextReviewDate before referenceDate 2026-10-01)
    await RevisionItem.create({
      userId: testUserId,
      topic: 'Percentage',
      pattern: 'Basic Percentage Calculation',
      nextReviewDate: new Date('2026-09-25T00:00:00.000Z'),
      status: 'scheduled',
    });

    // Also seed recent incorrect attempt for the SAME pattern within 7-day lookback
    if (sampleQ) {
      await Attempt.create({
        userId: testUserId,
        questionId: sampleQ._id,
        topic: 'Percentage',
        pattern: 'Basic Percentage Calculation',
        difficulty: 3,
        selectedAnswer: 'WRONG',
        correctAnswer: sampleQ.answer,
        isCorrect: false,
        timeTaken: 30,
        source: 'practice',
        attemptedAt: new Date('2026-09-28T10:00:00.000Z'),
      });

      await StudentProgress.create({
        userId: testUserId,
        topic: 'Percentage',
        pattern: 'Basic Percentage Calculation',
        mastery: 0.40,
      });
    }

    const res = await request(app)
      .get(`/api/v1/revisions/plan?userId=${testUserId}&days=1&questionBudget=20&patternsPerDay=4&referenceDate=2026-10-01`);

    expect(res.status).toBe(200);
    const day1 = res.body.data.schedule[0];

    // Pattern must appear exactly once, not duplicated
    const matches = day1.patterns.filter((p) => p.pattern === 'Basic Percentage Calculation');
    expect(matches.length).toBe(1);
    // Reason/priority must come from overdue RevisionItem (OVERDUE_REVISION), not supplemental weak source
    expect(matches[0].reasonCode).toBe('OVERDUE_REVISION');
  });

  it('uses approved default budget (20 questions) and max patterns (4) when parameters omitted', async () => {
    // Seed 4 due revision items
    const patterns = [
      'Basic Percentage Calculation',
      'Successive Percentage Changes',
      'Single Percentage Increase and Decrease',
      'Reverse Percentage & Base Value',
    ];

    for (const pat of patterns) {
      await RevisionItem.create({
        userId: testUserId,
        topic: 'Percentage',
        pattern: pat,
        nextReviewDate: new Date('2026-10-01T00:00:00.000Z'),
        status: 'scheduled',
      });
    }

    const res = await request(app)
      .get(`/api/v1/revisions/plan?userId=${testUserId}&referenceDate=2026-10-01`);

    expect(res.status).toBe(200);
    const plan = res.body.data;

    expect(plan.days).toBe(1);
    expect(plan.dailyQuestionBudget).toBe(20);
    expect(plan.maxPatternsPerDay).toBe(4);
    expect(plan.totalQuestions).toBe(20);

    const day1 = plan.schedule[0];
    expect(day1.patterns.length).toBe(4);
    // 20 questions across 4 patterns = 5 each
    for (const p of day1.patterns) {
      expect(p.targetQuestions).toBe(5);
    }
  });

  it('excludes future non-due RevisionItems from consuming capacity in V1 revision plan', async () => {
    // Due today
    await RevisionItem.create({
      userId: testUserId,
      topic: 'Percentage',
      pattern: 'Basic Percentage Calculation',
      nextReviewDate: new Date('2026-10-01T00:00:00.000Z'),
      status: 'scheduled',
    });

    // Future (not due until 2026-10-10)
    await RevisionItem.create({
      userId: testUserId,
      topic: 'Percentage',
      pattern: 'Successive Percentage Changes',
      nextReviewDate: new Date('2026-10-10T00:00:00.000Z'),
      status: 'scheduled',
    });

    const res = await request(app)
      .get(`/api/v1/revisions/plan?userId=${testUserId}&days=1&referenceDate=2026-10-01`);

    expect(res.status).toBe(200);
    const day1 = res.body.data.schedule[0];

    // Must NOT contain the future item
    const patternNames = day1.patterns.map((p) => p.pattern);
    expect(patternNames).toContain('Basic Percentage Calculation');
    expect(patternNames).not.toContain('Successive Percentage Changes');
  });

  it('enforces revision budget per logical day independently for multi-day plans', async () => {
    const patterns = [
      'Basic Percentage Calculation',
      'Successive Percentage Changes',
      'Single Percentage Increase and Decrease',
      'Reverse Percentage & Base Value',
    ];

    for (const pat of patterns) {
      await RevisionItem.create({
        userId: testUserId,
        topic: 'Percentage',
        pattern: pat,
        nextReviewDate: new Date('2026-10-01T00:00:00.000Z'),
        status: 'scheduled',
      });
    }

    const res = await request(app)
      .get(`/api/v1/revisions/plan?userId=${testUserId}&days=2&questionBudget=25&patternsPerDay=2&referenceDate=2026-10-01`);

    expect(res.status).toBe(200);
    const plan = res.body.data;

    expect(plan.days).toBe(2);
    expect(plan.totalQuestions).toBe(50); // 25 questions * 2 days

    const day1 = plan.schedule[0];
    const day2 = plan.schedule[1];

    expect(day1.totalQuestions).toBe(25);
    expect(day1.patterns.length).toBe(2);
    // 25 / 2 = 13 and 12
    expect(day1.patterns[0].targetQuestions).toBe(13);
    expect(day1.patterns[1].targetQuestions).toBe(12);

    expect(day2.totalQuestions).toBe(25);
    expect(day2.patterns.length).toBe(2);
    expect(day2.patterns[0].targetQuestions).toBe(13);
    expect(day2.patterns[1].targetQuestions).toBe(12);
  });

  describe('Endpoint Validation', () => {
    it('GET /api/v1/revisions/due rejects missing authentication with 401 UNAUTHORIZED', async () => {
      const supertest = require('supertest');
      const res = await supertest(app).get('/api/v1/revisions/due');
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('GET /api/v1/revisions/due rejects non-canonical topic with 400 INVALID_TOPIC', async () => {
      const res = await request(app)
        .get(`/api/v1/revisions/due?userId=${testUserId}&topic=InvalidTopicNameXYZ`);
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_TOPIC');
    });

    it('GET /api/v1/revisions/due rejects invalid date format with 400 INVALID_DATE', async () => {
      const res = await request(app)
        .get(`/api/v1/revisions/due?userId=${testUserId}&date=not-a-valid-date`);
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_DATE');
    });

    it('GET /api/v1/revisions/due rejects non-positive or non-integer limit with 400 INVALID_LIMIT', async () => {
      const res1 = await request(app)
        .get(`/api/v1/revisions/due?userId=${testUserId}&limit=0`);
      expect(res1.status).toBe(400);
      expect(res1.body.error.code).toBe('INVALID_LIMIT');

      const res2 = await request(app)
        .get(`/api/v1/revisions/due?userId=${testUserId}&limit=-5`);
      expect(res2.status).toBe(400);
      expect(res2.body.error.code).toBe('INVALID_LIMIT');

      const res3 = await request(app)
        .get(`/api/v1/revisions/due?userId=${testUserId}&limit=abc`);
      expect(res3.status).toBe(400);
      expect(res3.body.error.code).toBe('INVALID_LIMIT');
    });

    it('GET /api/v1/revisions/due rejects limit exceeding maximum (100) with 400 LIMIT_EXCEEDED', async () => {
      const res = await request(app)
        .get(`/api/v1/revisions/due?userId=${testUserId}&limit=101`);
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('LIMIT_EXCEEDED');
    });

    it('GET /api/v1/revisions/plan rejects days not equal to 1 or 2 with 400 INVALID_DAYS', async () => {
      const res = await request(app)
        .get(`/api/v1/revisions/plan?userId=${testUserId}&days=5`);
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_DAYS');
    });

    it('GET /api/v1/revisions/plan rejects non-canonical topic with 400 INVALID_TOPIC', async () => {
      const res = await request(app)
        .get(`/api/v1/revisions/plan?userId=${testUserId}&days=1&topic=InvalidTopicNameXYZ`);
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_TOPIC');
    });

    it('GET /api/v1/revisions/plan rejects invalid date format with 400 INVALID_DATE', async () => {
      const res = await request(app)
        .get(`/api/v1/revisions/plan?userId=${testUserId}&days=1&date=bad-date-string`);
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_DATE');
    });

    it('GET /api/v1/revisions/plan rejects invalid questionBudget with 400 INVALID_QUESTION_BUDGET', async () => {
      const res1 = await request(app)
        .get(`/api/v1/revisions/plan?userId=${testUserId}&days=1&questionBudget=0`);
      expect(res1.status).toBe(400);
      expect(res1.body.error.code).toBe('INVALID_QUESTION_BUDGET');

      const res2 = await request(app)
        .get(`/api/v1/revisions/plan?userId=${testUserId}&days=1&questionBudget=201`);
      expect(res2.status).toBe(400);
      expect(res2.body.error.code).toBe('INVALID_QUESTION_BUDGET');
    });

    it('GET /api/v1/revisions/plan rejects invalid patternsPerDay with 400 INVALID_PATTERNS_PER_DAY', async () => {
      const res1 = await request(app)
        .get(`/api/v1/revisions/plan?userId=${testUserId}&days=1&patternsPerDay=0`);
      expect(res1.status).toBe(400);
      expect(res1.body.error.code).toBe('INVALID_PATTERNS_PER_DAY');

      const res2 = await request(app)
        .get(`/api/v1/revisions/plan?userId=${testUserId}&days=1&patternsPerDay=21`);
      expect(res2.status).toBe(400);
      expect(res2.body.error.code).toBe('INVALID_PATTERNS_PER_DAY');
    });

    it('GET /api/v1/revisions/user/:userId validates user existence and returns user items', async () => {
      const resNotFound = await request(app)
        .get('/api/v1/revisions/user/non_existent_user_999')
        .set(getAuthHeaders('non_existent_user_999'));
      expect(resNotFound.status).toBe(404);
      expect(resNotFound.body.error.code).toBe('USER_NOT_FOUND');

      const resOk = await request(app).get(`/api/v1/revisions/user/${testUserId}`);
      expect(resOk.status).toBe(200);
      expect(Array.isArray(resOk.body.data)).toBe(true);
    });

    it('GET /api/v1/revisions/:id rejects missing authentication with 401 UNAUTHORIZED', async () => {
      const supertest = require('supertest');
      const fakeId = new mongoose.Types.ObjectId();
      const res = await supertest(app).get(`/api/v1/revisions/${fakeId}`);
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('GET /api/v1/revisions/:id rejects cross-user access with 403 OWNERSHIP_VIOLATION', async () => {
      const otherItem = await RevisionItem.create({
        userId: otherUserId,
        topic: 'Percentage',
        pattern: 'Basic Percentage Calculation',
        nextReviewDate: new Date('2026-10-01'),
        status: 'scheduled',
      });

      const res = await request(app).get(`/api/v1/revisions/${otherItem._id}?userId=${testUserId}`);
      expect(res.status).toBe(403);
      expect(['FORBIDDEN', 'OWNERSHIP_VIOLATION']).toContain(res.body.error.code);

      await RevisionItem.deleteOne({ _id: otherItem._id });
    });

    it('GET /api/v1/revisions/:id succeeds when requesting own item', async () => {
      const myItem = await RevisionItem.create({
        userId: testUserId,
        topic: 'Percentage',
        pattern: 'Basic Percentage Calculation',
        nextReviewDate: new Date('2026-10-01'),
        status: 'scheduled',
      });

      const res = await request(app).get(`/api/v1/revisions/${myItem._id}?userId=${testUserId}`);
      expect(res.status).toBe(200);
      expect(res.body.data.pattern).toBe('Basic Percentage Calculation');

      await RevisionItem.deleteOne({ _id: myItem._id });
    });
  });
});

