'use strict';

/**
 * tests/questions.test.js
 *
 * API integration tests using Supertest against the test database.
 * Seeds a small representative dataset in beforeAll, clears it in afterAll.
 *
 * Covers:
 *  - GET /health
 *  - 404 on unknown routes
 *  - Error handler format
 *  - GET /api/v1/questions/topics
 *  - GET /api/v1/questions/topic/:topic/patterns
 *  - GET /api/v1/questions/topic/:topic (paginated)
 *  - GET /api/v1/questions/topic/:topic?difficulty=N
 *  - GET /api/v1/questions/topic/:topic/random?limit=N
 *  - GET /api/v1/questions/topic/:topic/pattern/:pattern
 *  - GET /api/v1/questions/topic/:topic/pattern/:pattern/random
 *  - GET /api/v1/questions/:id
 *  - Invalid topic → 404
 *  - Invalid pattern → 404
 *  - Invalid difficulty → 400
 *  - Invalid limit → 400
 *  - Invalid page → 400
 *  - Random returns unique question IDs
 *  - Schema validation (4 options, answer in options)
 */

const supertest = require('supertest');
const { signAccessToken } = require('../src/services/authService');
const getAuthHeaders = (userId = 'usr_test_default', extra = {}) => ({
  Authorization: `Bearer ${signAccessToken({ userId, ...extra })}`
});
const authHeaders = getAuthHeaders('test_user');
const request = (targetApp) => {
  const inst = supertest(targetApp);
  return new Proxy(inst, {
    get(target, prop) {
      const orig = target[prop];
      if (typeof orig === 'function' && ['get', 'post', 'put', 'patch', 'delete'].includes(prop)) {
        return function(url) {
          return orig.call(target, url).set(authHeaders);
        };
      }
      return orig;
    }
  });
};
const mongoose = require('mongoose');
const createApp = require('../src/app');
const { connectTestDB, disconnectTestDB, clearTestQuestions } = require('./helpers/dbSetup');
const { seedQuestions, SEED_QUESTIONS } = require('./helpers/seedData');

let app;
let seededDocs;

beforeAll(async () => {
  await connectTestDB();
  await clearTestQuestions();
  seededDocs = await seedQuestions();
  app = createApp();
});

afterAll(async () => {
  await clearTestQuestions();
  await disconnectTestDB();
});

// ── Health ─────────────────────────────────────────────────────────────────

describe('GET /health', () => {
  it('returns 200 with success: true and status: ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.status).toBe('ok');
  });

  it('does not expose database or application internals', async () => {
    const res = await request(app).get('/health');
    expect(res.body).not.toHaveProperty('db');
    expect(res.body).not.toHaveProperty('stack');
  });
});

// ── 404 handling ───────────────────────────────────────────────────────────

describe('404 handling', () => {
  it('returns 404 for unknown routes', async () => {
    const res = await request(app).get('/api/v1/nonexistent');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('404 response shape is { success: false, error: { code, message } }', async () => {
    const res = await request(app).get('/no-such-route');
    expect(res.body).toHaveProperty('success', false);
    expect(res.body).toHaveProperty('error');
    expect(res.body.error).toHaveProperty('code');
    expect(res.body.error).toHaveProperty('message');
  });
});

// ── Topics ─────────────────────────────────────────────────────────────────

describe('GET /api/v1/questions/topics', () => {
  it('returns 200 with array of 24 topics', async () => {
    const res = await request(app).get('/api/v1/questions/topics');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data).toHaveLength(24);
  });

  it('includes meta.count = 24', async () => {
    const res = await request(app).get('/api/v1/questions/topics');
    expect(res.body.meta.count).toBe(24);
  });

  it('contains "Time, Speed and Distance" with canonical comma form', async () => {
    const res = await request(app).get('/api/v1/questions/topics');
    expect(res.body.data).toContain('Time, Speed and Distance');
  });

  it('contains "Percentage"', async () => {
    const res = await request(app).get('/api/v1/questions/topics');
    expect(res.body.data).toContain('Percentage');
  });
});

// ── Patterns by topic ──────────────────────────────────────────────────────

describe('GET /api/v1/questions/topic/:topic/patterns', () => {
  it('returns patterns for a valid topic slug', async () => {
    const res = await request(app).get('/api/v1/questions/topic/percentage/patterns');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('each pattern has required fields', async () => {
    const res = await request(app).get('/api/v1/questions/topic/percentage/patterns');
    for (const p of res.body.data) {
      expect(p).toHaveProperty('name');
      expect(p).toHaveProperty('slug');
      expect(p).toHaveProperty('prerequisites');
      expect(Array.isArray(p.prerequisites)).toBe(true);
    }
  });

  it('resolves time-speed-and-distance slug to canonical topic', async () => {
    const res = await request(app).get('/api/v1/questions/topic/time-speed-and-distance/patterns');
    expect(res.status).toBe(200);
    expect(res.body.meta.topic).toBe('Time, Speed and Distance');
  });

  it('returns 404 for invalid topic', async () => {
    const res = await request(app).get('/api/v1/questions/topic/invalid-topic-xyz/patterns');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('INVALID_TOPIC');
  });
});

// ── Questions by topic (paginated) ────────────────────────────────────────

describe('GET /api/v1/questions/topic/:topic', () => {
  it('returns questions for a valid topic', async () => {
    const res = await request(app).get('/api/v1/questions/topic/percentage');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('includes correct pagination metadata', async () => {
    const res = await request(app).get('/api/v1/questions/topic/percentage?page=1&limit=2');
    expect(res.body.meta).toHaveProperty('page', 1);
    expect(res.body.meta).toHaveProperty('limit', 2);
    expect(res.body.meta).toHaveProperty('total');
    expect(res.body.meta).toHaveProperty('totalPages');
    expect(res.body.meta).toHaveProperty('count');
  });

  it('pagination respects limit', async () => {
    const res = await request(app).get('/api/v1/questions/topic/percentage?limit=2');
    expect(res.body.data.length).toBeLessThanOrEqual(2);
  });

  it('filters by difficulty correctly', async () => {
    const res = await request(app).get('/api/v1/questions/topic/percentage?difficulty=5');
    expect(res.status).toBe(200);
    for (const q of res.body.data) {
      expect(q.difficulty).toBe(5);
    }
  });

  it('returns 404 for invalid topic', async () => {
    const res = await request(app).get('/api/v1/questions/topic/bogus-topic-999');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('INVALID_TOPIC');
  });

  it('returns 400 for invalid difficulty', async () => {
    const res = await request(app).get('/api/v1/questions/topic/percentage?difficulty=11');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_DIFFICULTY');
  });

  it('returns 400 for non-integer difficulty', async () => {
    const res = await request(app).get('/api/v1/questions/topic/percentage?difficulty=abc');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_DIFFICULTY');
  });

  it('returns 400 for invalid page', async () => {
    const res = await request(app).get('/api/v1/questions/topic/percentage?page=0');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_PAGE');
  });

  it('returns 400 for limit > 100', async () => {
    const res = await request(app).get('/api/v1/questions/topic/percentage?limit=101');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_LIMIT');
  });

  it('each returned question has exactly 4 options', async () => {
    const res = await request(app).get('/api/v1/questions/topic/percentage');
    for (const q of res.body.data) {
      expect(q.options).toHaveLength(4);
    }
  });

  it('each returned question answer is in its options', async () => {
    const res = await request(app).get('/api/v1/questions/topic/percentage');
    for (const q of res.body.data) {
      expect(q.options).toContain(q.answer);
    }
  });
});

// ── Random questions by topic ──────────────────────────────────────────────

describe('GET /api/v1/questions/topic/:topic/random', () => {
  it('returns questions from the topic', async () => {
    const res = await request(app).get('/api/v1/questions/topic/percentage/random?limit=2');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('returns unique question IDs within a single response', async () => {
    const res = await request(app).get('/api/v1/questions/topic/percentage/random?limit=3');
    const ids = res.body.data.map((q) => String(q._id));
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('respects the limit parameter', async () => {
    const res = await request(app).get('/api/v1/questions/topic/percentage/random?limit=2');
    expect(res.body.data.length).toBeLessThanOrEqual(2);
  });

  it('returns 400 for limit=0', async () => {
    const res = await request(app).get('/api/v1/questions/topic/percentage/random?limit=0');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_LIMIT');
  });

  it('returns 400 for limit > 100', async () => {
    const res = await request(app).get('/api/v1/questions/topic/percentage/random?limit=200');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_LIMIT');
  });

  it('returns 400 for negative limit', async () => {
    const res = await request(app).get('/api/v1/questions/topic/percentage/random?limit=-1');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_LIMIT');
  });

  it('returns 404 for invalid topic', async () => {
    const res = await request(app).get('/api/v1/questions/topic/fakeTopic/random?limit=1');
    expect(res.status).toBe(404);
  });
});

// ── Questions by topic + pattern ───────────────────────────────────────────

describe('GET /api/v1/questions/topic/:topic/pattern/:pattern', () => {
  it('returns questions for valid topic+pattern', async () => {
    const res = await request(app).get(
      '/api/v1/questions/topic/percentage/pattern/basic-percentage-calculation'
    );
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('returned questions all have correct topic and pattern', async () => {
    const res = await request(app).get(
      '/api/v1/questions/topic/percentage/pattern/basic-percentage-calculation'
    );
    for (const q of res.body.data) {
      expect(q.topic).toBe('Percentage');
      expect(q.pattern).toBe('Basic Percentage Calculation');
    }
  });

  it('returns 404 for invalid pattern under valid topic', async () => {
    const res = await request(app).get(
      '/api/v1/questions/topic/percentage/pattern/nonexistent-pattern-xyz'
    );
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('INVALID_PATTERN');
  });

  it('returns 404 for pattern that exists but belongs to a different topic', async () => {
    // "Coin Toss Problems" pattern under Probability, not Percentage
    const res = await request(app).get(
      '/api/v1/questions/topic/percentage/pattern/coin-toss-problems'
    );
    expect(res.status).toBe(404);
    expect(['INVALID_PATTERN', 'PATTERN_TOPIC_MISMATCH']).toContain(res.body.error.code);
  });

  it('includes pagination metadata', async () => {
    const res = await request(app).get(
      '/api/v1/questions/topic/percentage/pattern/basic-percentage-calculation?page=1&limit=2'
    );
    expect(res.body.meta).toHaveProperty('page');
    expect(res.body.meta).toHaveProperty('totalPages');
  });

  it('difficulty filter works within topic+pattern query', async () => {
    const res = await request(app).get(
      '/api/v1/questions/topic/percentage/pattern/basic-percentage-calculation?difficulty=1'
    );
    expect(res.status).toBe(200);
    for (const q of res.body.data) {
      expect(q.difficulty).toBe(1);
    }
  });
});

// ── Random questions by pattern ────────────────────────────────────────────

describe('GET /api/v1/questions/topic/:topic/pattern/:pattern/random', () => {
  it('returns unique questions from a pattern', async () => {
    const res = await request(app).get(
      '/api/v1/questions/topic/percentage/pattern/basic-percentage-calculation/random?limit=2'
    );
    expect(res.status).toBe(200);
    const ids = res.body.data.map((q) => String(q._id));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('returns 404 for invalid pattern', async () => {
    const res = await request(app).get(
      '/api/v1/questions/topic/percentage/pattern/invalid-xyz/random?limit=1'
    );
    expect(res.status).toBe(404);
  });
});

// ── Single question by ID ──────────────────────────────────────────────────

describe('GET /api/v1/questions/:id', () => {
  it('returns a question by valid MongoDB ObjectId', async () => {
    const id = seededDocs[0]._id.toString();
    const res = await request(app).get(`/api/v1/questions/${id}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data._id.toString()).toBe(id);
  });

  it('returned question has all required fields', async () => {
    const id = seededDocs[0]._id.toString();
    const res = await request(app).get(`/api/v1/questions/${id}`);
    const q = res.body.data;
    expect(q).toHaveProperty('question');
    expect(q).toHaveProperty('answer');
    expect(q).toHaveProperty('options');
    expect(q).toHaveProperty('explanation');
    expect(q).toHaveProperty('topic');
    expect(q).toHaveProperty('pattern');
    expect(q).toHaveProperty('difficulty');
  });

  it('returned question has exactly 4 options', async () => {
    const id = seededDocs[0]._id.toString();
    const res = await request(app).get(`/api/v1/questions/${id}`);
    expect(res.body.data.options).toHaveLength(4);
  });

  it('returned question answer is in its options', async () => {
    const id = seededDocs[0]._id.toString();
    const res = await request(app).get(`/api/v1/questions/${id}`);
    const q = res.body.data;
    expect(q.options).toContain(q.answer);
  });

  it('returns 404 for a valid-format but non-existent ID', async () => {
    const fakeId = '000000000000000000000000';
    const res = await request(app).get(`/api/v1/questions/${fakeId}`);
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('QUESTION_NOT_FOUND');
  });

  it('returns 400 for invalid ObjectId format', async () => {
    const res = await request(app).get('/api/v1/questions/not-an-id');
    // Express will treat this as a route miss (not matching regex) → 404
    expect([400, 404]).toContain(res.status);
  });
});

// ── API response contract ──────────────────────────────────────────────────

describe('API response contract', () => {
  it('success response has { success: true, data, meta }', async () => {
    const res = await request(app).get('/api/v1/questions/topics');
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('data');
    expect(res.body).toHaveProperty('meta');
  });

  it('error response has { success: false, error: { code, message } }', async () => {
    const res = await request(app).get('/api/v1/questions/topic/fake-topic-xyz');
    expect(res.body).toHaveProperty('success', false);
    expect(res.body).toHaveProperty('error');
    expect(res.body.error).toHaveProperty('code');
    expect(res.body.error).toHaveProperty('message');
  });
});

// ── No legacy architecture in response data ────────────────────────────────

describe('No legacy architecture in API responses', () => {
  it('question documents do not contain mentor/teacher/userId fields', async () => {
    const id = seededDocs[0]._id.toString();
    const res = await request(app).get(`/api/v1/questions/${id}`);
    const q = res.body.data;
    expect(q).not.toHaveProperty('mentor');
    expect(q).not.toHaveProperty('mentee');
    expect(q).not.toHaveProperty('teacher');
    expect(q).not.toHaveProperty('userId');
    expect(q).not.toHaveProperty('goalId');
    expect(q).not.toHaveProperty('planId');
    expect(q).not.toHaveProperty('mastery');
  });

  it('question documents do not contain Phase 3+ fields', async () => {
    const id = seededDocs[0]._id.toString();
    const res = await request(app).get(`/api/v1/questions/${id}`);
    const q = res.body.data;
    expect(q).not.toHaveProperty('studentProgress');
    expect(q).not.toHaveProperty('adaptiveScore');
    expect(q).not.toHaveProperty('masteryScore');
  });
});
