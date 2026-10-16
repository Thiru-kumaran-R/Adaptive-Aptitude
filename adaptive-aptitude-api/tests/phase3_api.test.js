'use strict';

/**
 * tests/phase3_api.test.js
 *
 * Phase 3 API Integration Tests
 *
 * Tests H–J: REST endpoints, validation, attempt snapshot via HTTP,
 * ownership enforcement, registry validation.
 *
 * Uses supertest + test database.
 */

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
const mongoose = require('mongoose');
const createApp = require('../src/app');
const { connectTestDB, disconnectTestDB, clearPhase3Collections, clearTestQuestions } = require('./helpers/dbSetup');
const { seedQuestions, seedUser, seedGoal, seedStudyPlan } = require('./helpers/seedData');

let app;
let seededQuestions;

beforeAll(async () => {
  await connectTestDB();
  app = createApp();
  seededQuestions = await seedQuestions();
});

afterAll(async () => {
  await clearPhase3Collections();
  await clearTestQuestions();
  await disconnectTestDB();
});

beforeEach(async () => {
  await clearPhase3Collections();
});

// ─────────────────────────────────────────────────────────────────────────────
// Test H: User API
// ─────────────────────────────────────────────────────────────────────────────
describe('Test H — User API', () => {
  it('H1: POST /api/v1/users returns 410 USER_CREATION_ENDPOINT_DEPRECATED (Phase 14 Tombstone)', async () => {
    const res = await request(app).post('/api/v1/users').send({
      userId: 'h1_student',
      name: 'H1 Student',
    });
    expect(res.status).toBe(410);
    expect(res.body.error.code).toBe('USER_CREATION_ENDPOINT_DEPRECATED');
  });

  it('H2: POST /api/v1/users rejects direct creation even when missing userId', async () => {
    const res = await request(app).post('/api/v1/users').send({ name: 'No ID' });
    expect(res.status).toBe(410);
    expect(res.body.error.code).toBe('USER_CREATION_ENDPOINT_DEPRECATED');
  });

  it('H3: POST /api/v1/users rejects direct creation for duplicate userId', async () => {
    const res = await request(app).post('/api/v1/users').send({ userId: 'dup_user', name: 'Dup' });
    expect(res.status).toBe(410);
    expect(res.body.error.code).toBe('USER_CREATION_ENDPOINT_DEPRECATED');
  });

  it('H4: GET /api/v1/users/:userId retrieves user', async () => {
    await seedUser('h4_student');
    const res = await request(app).get('/api/v1/users/h4_student');
    expect(res.status).toBe(200);
    expect(res.body.data.userId).toBe('h4_student');
  });

  it('H5: GET /api/v1/users/:userId returns 404 for unknown user', async () => {
    const res = await request(app).get('/api/v1/users/no_such_user');
    expect(res.status).toBe(404);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Test I: Goal API
// ─────────────────────────────────────────────────────────────────────────────
describe('Test I — Goal API', () => {
  it('I1: POST /api/v1/goals creates a goal for existing user', async () => {
    await seedUser('i1_user');
    const res = await request(app).post('/api/v1/goals').send({
      userId: 'i1_user',
      title: 'GATE 2027',
      type: 'entrance',
    });
    expect(res.status).toBe(201);
    expect(res.body.data.type).toBe('entrance');
  });

  it('I2: POST /api/v1/goals rejects missing required fields', async () => {
    const res = await request(app).post('/api/v1/goals').send({ userId: 'i2_user' });
    expect(res.status).toBe(400);
  });

  it('I3: POST /api/v1/goals rejects unknown userId', async () => {
    const res = await request(app).post('/api/v1/goals').send({
      userId: 'nonexistent_user',
      title: 'Ghost Goal',
      type: 'competitive',
    });
    expect(res.status).toBe(404);
  });

  it('I4: GET /api/v1/goals/user/:userId lists goals', async () => {
    await seedUser('i4_user');
    await request(app).post('/api/v1/goals').send({ userId: 'i4_user', title: 'Goal 1', type: 'competitive' });
    await request(app).post('/api/v1/goals').send({ userId: 'i4_user', title: 'Goal 2', type: 'company' });
    const res = await request(app).get('/api/v1/goals/user/i4_user');
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(2);
  });

  it('I5: invalid goal type is rejected', async () => {
    await seedUser('i5_user');
    const res = await request(app).post('/api/v1/goals').send({
      userId: 'i5_user',
      title: 'Bad Type Goal',
      type: 'invalid_type',
    });
    expect(res.status).toBe(400);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Test J: StudyPlan API with target registry validation
// ─────────────────────────────────────────────────────────────────────────────
describe('Test J — StudyPlan API + registry validation', () => {
  it('J1: POST /api/v1/study-plans creates a plan with valid targets', async () => {
    await seedUser('j1_user');
    const goal = await seedGoal('j1_user');
    const res = await request(app).post('/api/v1/study-plans').send({
      userId: 'j1_user',
      goalId: goal._id.toString(),
      name: 'Foundation Plan',
      targets: [
        { topic: 'Percentage', pattern: 'Basic Percentage Calculation', targetQuestions: 10 },
      ],
    });
    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe('Foundation Plan');
  });

  it('J2: POST /api/v1/study-plans rejects invalid topic in targets', async () => {
    await seedUser('j2_user');
    const goal = await seedGoal('j2_user');
    const res = await request(app).post('/api/v1/study-plans').send({
      userId: 'j2_user',
      goalId: goal._id.toString(),
      name: 'Bad Plan',
      targets: [{ topic: 'FakeTopic', pattern: 'Some Pattern', targetQuestions: 5 }],
    });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_TOPIC');
  });

  it('J3: POST /api/v1/study-plans rejects pattern not belonging to topic', async () => {
    await seedUser('j3_user');
    const goal = await seedGoal('j3_user');
    const res = await request(app).post('/api/v1/study-plans').send({
      userId: 'j3_user',
      goalId: goal._id.toString(),
      name: 'Bad Plan',
      targets: [{ topic: 'Percentage', pattern: 'Linear Equations & Systems of Equations', targetQuestions: 5 }],
    });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('PATTERN_TOPIC_MISMATCH');
  });

  it('J4: GET /api/v1/study-plans/user/:userId lists plans', async () => {
    await seedUser('j4_user');
    const goal = await seedGoal('j4_user');
    await seedStudyPlan('j4_user', goal._id, { name: 'Plan A' });
    await seedStudyPlan('j4_user', goal._id, { name: 'Plan B' });
    const res = await request(app).get('/api/v1/study-plans/user/j4_user');
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(2);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Test K: Attempt API — server-side snapshot via HTTP
// ─────────────────────────────────────────────────────────────────────────────
describe('Test K — Attempt API: server-side snapshot', () => {
  it('K1: POST /api/v1/attempts derives topic/pattern/difficulty from Question', async () => {
    await seedUser('k1_user');
    // Use a seeded question — its topic/pattern/difficulty are canonical
    const q = seededQuestions.find((q) => q.topic === 'Percentage' && q.difficulty === 1);
    expect(q).toBeTruthy();

    const res = await request(app).post('/api/v1/attempts').send({
      userId: 'k1_user',
      questionId: q._id.toString(),
      selectedAnswer: q.answer, // correct
      timeTaken: 25,
      source: 'practice',
    });

    expect(res.status).toBe(201);
    expect(res.body.data.topic).toBe(q.topic);
    expect(res.body.data.pattern).toBe(q.pattern);
    expect(res.body.data.difficulty).toBe(q.difficulty);
    expect(res.body.data.correctAnswer).toBe(q.answer);
    expect(res.body.data.isCorrect).toBe(true);
  });

  it('K2: isCorrect is false when wrong answer provided', async () => {
    await seedUser('k2_user');
    const q = seededQuestions.find((q) => q.topic === 'Percentage' && q.difficulty === 1);

    const res = await request(app).post('/api/v1/attempts').send({
      userId: 'k2_user',
      questionId: q._id.toString(),
      selectedAnswer: 'wrong answer that does not match',
      timeTaken: 15,
      source: 'practice',
    });

    expect(res.status).toBe(201);
    expect(res.body.data.isCorrect).toBe(false);
  });

  it('K3: POST /api/v1/attempts rejects missing required fields', async () => {
    const res = await request(app).post('/api/v1/attempts').send({
      userId: 'k3_user',
      questionId: new mongoose.Types.ObjectId().toString(),
      // missing selectedAnswer, timeTaken, source
    });
    expect(res.status).toBe(400);
  });

  it('K4: attempt creates progress record automatically', async () => {
    await seedUser('k4_user');
    const q = seededQuestions.find((q) => q.topic === 'Percentage' && q.difficulty === 1);

    await request(app).post('/api/v1/attempts').send({
      userId: 'k4_user',
      questionId: q._id.toString(),
      selectedAnswer: q.answer,
      timeTaken: 20,
      source: 'practice',
    });

    // Wait a moment for async operations
    await new Promise((r) => setTimeout(r, 200));

    const StudentProgress = require('../src/models/studentProgressModel');
    const progress = await StudentProgress.findOne({ userId: 'k4_user' });
    expect(progress).toBeTruthy();
    expect(progress.attempts).toBe(1);
  });

  it('K5: GET /api/v1/attempts/user/:userId lists user attempts', async () => {
    await seedUser('k5_user');
    const q = seededQuestions[0];
    await request(app).post('/api/v1/attempts').send({ userId: 'k5_user', questionId: q._id.toString(), selectedAnswer: q.answer, timeTaken: 10, source: 'practice' });
    await request(app).post('/api/v1/attempts').send({ userId: 'k5_user', questionId: q._id.toString(), selectedAnswer: 'wrong', timeTaken: 10, source: 'practice' });

    const res = await request(app).get('/api/v1/attempts/user/k5_user');
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(2);
  });
});
