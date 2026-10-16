'use strict';

/**
 * tests/helpers/dbSetup.js
 *
 * Shared database connection helpers for tests.
 * Test suite uses TEST_MONGODB_URI → adaptive_aptitude_test database.
 * Never touches the main adaptive_aptitude database.
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '..', '..', '.env') });

const mongoose = require('mongoose');

const connectTestDB = async () => {
  const uri = process.env.TEST_MONGODB_URI;
  if (!uri) {
    throw new Error(
      'TEST_MONGODB_URI not set. Create a .env file from .env.example and set TEST_MONGODB_URI.'
    );
  }
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 30000, connectTimeoutMS: 30000 });
      return;
    } catch (err) {
      if (attempt === 3) throw err;
      await new Promise((r) => setTimeout(r, 1500));
    }
  }
};

const disconnectTestDB = async () => {
  await mongoose.disconnect();
};

/**
 * Safety guard: throws if connected to a non-test database.
 */
const assertTestDB = () => {
  const dbName = mongoose.connection.name || '';
  if (!dbName.includes('test')) {
    throw new Error(
      `Safety check failed: called on non-test database "${dbName}"`
    );
  }
};

/**
 * Clears only the questions collection in the test database.
 * Safety: only allowed when connected to the _test database.
 */
const clearTestQuestions = async () => {
  assertTestDB();
  const Question = require('../../src/models/questionModel');
  await Question.deleteMany({});
};

/**
 * Clears all Phase 3 student learning collections in the test database.
 * Safety: only allowed when connected to the _test database.
 */
const clearPhase3Collections = async () => {
  assertTestDB();
  const User = require('../../src/models/userModel');
  const Goal = require('../../src/models/goalModel');
  const StudyPlan = require('../../src/models/studyPlanModel');
  const DailyObjective = require('../../src/models/dailyObjectiveModel');
  const Attempt = require('../../src/models/attemptModel');
  const StudentProgress = require('../../src/models/studentProgressModel');
  const RevisionItem = require('../../src/models/revisionItemModel');
  await Promise.all([
    User.deleteMany({}),
    Goal.deleteMany({}),
    StudyPlan.deleteMany({}),
    DailyObjective.deleteMany({}),
    Attempt.deleteMany({}),
    StudentProgress.deleteMany({}),
    RevisionItem.deleteMany({}),
  ]);
};

/**
 * Clears all Phase 6 mock test collections in the test database.
 * Safety: only allowed when connected to the _test database.
 */
const clearPhase6Collections = async () => {
  assertTestDB();
  const MockBlueprint = require('../../src/models/mockBlueprintModel');
  const MockSession = require('../../src/models/mockSessionModel');
  const MockResponse = require('../../src/models/mockResponseModel');
  const MockAttemptFinalizationRecord = require('../../src/models/mockAttemptFinalizationRecordModel');
  await Promise.all([
    MockBlueprint.deleteMany({}),
    MockSession.deleteMany({}),
    MockResponse.deleteMany({}),
    MockAttemptFinalizationRecord.deleteMany({}),
  ]);
};

/**
 * Clears ALL collections (questions + Phase 3 + Phase 6).
 * Safety: only allowed when connected to the _test database.
 */
const clearAllTestCollections = async () => {
  await clearTestQuestions();
  await clearPhase3Collections();
  await clearPhase6Collections();
};

module.exports = {
  connectTestDB,
  disconnectTestDB,
  clearTestQuestions,
  clearPhase3Collections,
  clearPhase6Collections,
  clearAllTestCollections,
};

