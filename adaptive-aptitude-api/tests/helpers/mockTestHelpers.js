'use strict';

/**
 * tests/helpers/mockTestHelpers.js
 *
 * Dedicated test helper utilities for Phase 6 Mock Test Engine test suites.
 * Seeds questions with known topics, patterns, and difficulty levels,
 * manages test users, and builds standard blueprint templates.
 */

const Question = require('../../src/models/questionModel');
const User = require('../../src/models/userModel');
const MockBlueprint = require('../../src/models/mockBlueprintModel');
const { MOCK_MODES, NAVIGATION_POLICIES } = require('../../src/config/mockConfig');

/**
 * Seeds questions for a given topic and pattern across easy, medium, and hard difficulty bands.
 *
 * @param {Object} options
 * @param {string} [options.topic='Percentage']
 * @param {string} [options.pattern='Successive Percentage Changes']
 * @param {number} [options.countPerBand=5] Number of questions to create per difficulty band
 * @returns {Promise<Array<Object>>} Created question documents
 */
const seedMockQuestions = async ({
  topic = 'Percentage',
  pattern = 'Successive Percentage Changes',
  countPerBand = 5,
} = {}) => {
  const bands = [
    { difficulty: 2, label: 'easy' },
    { difficulty: 5, label: 'medium' },
    { difficulty: 9, label: 'hard' },
  ];

  const docs = [];
  for (const band of bands) {
    for (let i = 0; i < countPerBand; i++) {
      docs.push({
        question: `Test Question ${topic} - ${pattern} - Diff ${band.difficulty} - #${i + 1} (${Date.now()}-${Math.random()})`,
        options: ['Option A', 'Option B', 'Option C', 'Option D'],
        answer: 'Option A',
        explanation: 'Option A is mathematically correct.',
        solution: 'Detailed step-by-step solution for Option A.',
        topic,
        pattern,
        difficulty: band.difficulty,
      });
    }
  }

  return await Question.insertMany(docs);
};

/**
 * Creates or resets a test user.
 */
const createTestUser = async (userId = 'mock-test-user-1') => {
  await User.deleteMany({ userId });
  return await User.create({
    userId,
    name: 'Mock Test User',
    email: `${userId}@example.com`,
  });
};

/**
 * Builds a standard test blueprint payload.
 */
const buildStandardBlueprintPayload = (overrides = {}) => {
  return {
    title: 'Standard Test Blueprint',
    mode: MOCK_MODES.STANDARD,
    navigationPolicy: NAVIGATION_POLICIES.FREE,
    durationMinutes: 60,
    sections: [
      {
        sectionId: 'sec-1',
        title: 'Quantitative Reasoning',
        questionCount: 6,
        scope: {
          topics: ['Percentage'],
        },
      },
    ],
    ...overrides,
  };
};

module.exports = {
  seedMockQuestions,
  createTestUser,
  buildStandardBlueprintPayload,
};
