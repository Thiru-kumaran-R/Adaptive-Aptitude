'use strict';

/**
 * tests/mock/mockBlueprintPreview.test.js
 *
 * Verifies POST /api/v1/mock-blueprints/preview and the strict Zero-Write Guarantee
 * across all five collections: MockBlueprint, MockSession, MockResponse,
 * MockAttemptFinalizationRecord, and Attempt.
 */

const request = require('supertest');
const createApp = require('../../src/app');
const { connectTestDB, disconnectTestDB, clearPhase6Collections } = require('../helpers/dbSetup');
const MockBlueprint = require('../../src/models/mockBlueprintModel');
const MockSession = require('../../src/models/mockSessionModel');
const MockResponse = require('../../src/models/mockResponseModel');
const MockAttemptFinalizationRecord = require('../../src/models/mockAttemptFinalizationRecordModel');
const Attempt = require('../../src/models/attemptModel');
const User = require('../../src/models/userModel');
const Question = require('../../src/models/questionModel');
const { MOCK_MODES, NAVIGATION_POLICIES } = require('../../src/config/mockConfig');
const { seedMockQuestions } = require('../helpers/mockTestHelpers');
const { signAccessToken } = require('../../src/services/authService');
const getAuthHeaders = (userId = 'usr_test_default', extra = {}) => ({
  Authorization: `Bearer ${signAccessToken({ userId, ...extra })}`
});

describe('Phase 6: Blueprint Zero-Write Preview Engine', () => {
  let app;
  const testUserId = 'test-preview-user-1';

  beforeAll(async () => {
    await connectTestDB();
    app = createApp();
    await User.deleteMany({ userId: testUserId });
    await User.create({ userId: testUserId, name: 'Preview Tester' });

    // Seed test questions for Percentage and Average patterns
    await Question.deleteMany({
      pattern: {
        $in: [
          'Successive Percentage Changes',
          'Basic Arithmetic Mean & Missing Observations',
        ],
      },
    });
    await seedMockQuestions({
      topic: 'Percentage',
      pattern: 'Successive Percentage Changes',
      countPerBand: 5,
    });
    await seedMockQuestions({
      topic: 'Average',
      pattern: 'Basic Arithmetic Mean & Missing Observations',
      countPerBand: 5,
    });
  });

  afterAll(async () => {
    await User.deleteMany({ userId: testUserId });
    await Question.deleteMany({
      pattern: {
        $in: [
          'Successive Percentage Changes',
          'Basic Arithmetic Mean & Missing Observations',
        ],
      },
    });
    await clearPhase6Collections();
    await disconnectTestDB();
  });

  beforeEach(async () => {
    await clearPhase6Collections();
  });

  it('evaluates blueprint preview and returns timing, allocations, and canGenerate: true', async () => {
    const payload = {
      title: 'Preview Standard Mock',
      mode: MOCK_MODES.STANDARD,
      navigationPolicy: NAVIGATION_POLICIES.FREE,
      durationMinutes: 45,
      sections: [
        {
          sectionId: 'quant-sec',
          title: 'Quantitative Ability',
          questionCount: 6,
          scope: {
            patterns: ['Successive Percentage Changes'],
          },
        },
      ],
    };

    const res = await request(app)
      .post('/api/v1/mock-blueprints/preview')
      .set(getAuthHeaders(testUserId))
      .send(payload);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.canGenerate).toBe(true);
    expect(res.body.data.totalQuestions).toBe(6);
    expect(res.body.data.durationMinutes).toBe(45);
    expect(res.body.data.blueprintFingerprint).toBeDefined();
    expect(res.body.data.sections).toHaveLength(1);
    expect(res.body.data.sections[0].patternAllocations.length).toBeGreaterThan(0);
  });

  it('guarantees strictly ZERO writes across all five collections (Delta = 0)', async () => {
    const preBlueprintCount = await MockBlueprint.countDocuments();
    const preSessionCount = await MockSession.countDocuments();
    const preResponseCount = await MockResponse.countDocuments();
    const preReceiptCount = await MockAttemptFinalizationRecord.countDocuments();
    const preAttemptCount = await Attempt.countDocuments();

    const payload = {
      title: 'Zero Write Verification Mock',
      mode: MOCK_MODES.DIAGNOSTIC,
      userId: testUserId,
      navigationPolicy: NAVIGATION_POLICIES.SECTION_LOCKED,
      durationMinutes: 60,
      sections: [
        {
          sectionId: 'sec-1',
          title: 'Section 1',
          questionCount: 3,
          durationMinutes: 30,
          scope: {
            patterns: ['Successive Percentage Changes'],
          },
        },
        {
          sectionId: 'sec-2',
          title: 'Section 2',
          questionCount: 3,
          durationMinutes: 30,
          scope: {
            patterns: ['Basic Arithmetic Mean & Missing Observations'],
          },
        },
      ],
    };

    const res = await request(app)
      .post('/api/v1/mock-blueprints/preview')
      .set(getAuthHeaders(testUserId))
      .send(payload);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.canGenerate).toBe(true);

    const postBlueprintCount = await MockBlueprint.countDocuments();
    const postSessionCount = await MockSession.countDocuments();
    const postResponseCount = await MockResponse.countDocuments();
    const postReceiptCount = await MockAttemptFinalizationRecord.countDocuments();
    const postAttemptCount = await Attempt.countDocuments();

    // Strict Delta = 0 Assertions
    expect(postBlueprintCount - preBlueprintCount).toBe(0);
    expect(postSessionCount - preSessionCount).toBe(0);
    expect(postResponseCount - preResponseCount).toBe(0);
    expect(postReceiptCount - preReceiptCount).toBe(0);
    expect(postAttemptCount - preAttemptCount).toBe(0);
  });
});
