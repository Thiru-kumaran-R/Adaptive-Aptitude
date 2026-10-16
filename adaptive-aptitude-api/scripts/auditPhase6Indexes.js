'use strict';

/**
 * scripts/auditPhase6Indexes.js
 *
 * Verifies the MongoDB indexes for Phase 6 and runs explain("executionStats")
 * on all critical Phase 6 queries specified in the master specification.
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') });
const mongoose = require('mongoose');

const Attempt = require('../src/models/attemptModel');
const Question = require('../src/models/questionModel');
const MockBlueprint = require('../src/models/mockBlueprintModel');
const MockSession = require('../src/models/mockSessionModel');
const MockResponse = require('../src/models/mockResponseModel');
const MockAttemptFinalizationRecord = require('../src/models/mockAttemptFinalizationRecordModel');

const runAudit = async () => {
  const uri = process.env.MONGODB_URI || process.env.TEST_MONGODB_URI;
  if (!uri) {
    console.error('No MONGODB_URI or TEST_MONGODB_URI configured.');
    process.exit(1);
  }

  console.log('Connecting to database...');
  await mongoose.connect(uri);
  console.log(`Connected to: ${mongoose.connection.name}`);

  // Ensure all model indexes are synchronized with MongoDB
  await Promise.all([
    Attempt.syncIndexes(),
    Question.syncIndexes(),
    MockBlueprint.syncIndexes(),
    MockSession.syncIndexes(),
    MockResponse.syncIndexes(),
    MockAttemptFinalizationRecord.syncIndexes(),
  ]);

  console.log('\n=============================================================');
  console.log('                 PHASE 6 INDEX INVENTORY AUDIT');
  console.log('=============================================================');

  const models = [
    { name: 'Attempt', model: Attempt },
    { name: 'MockBlueprint', model: MockBlueprint },
    { name: 'MockSession', model: MockSession },
    { name: 'MockResponse', model: MockResponse },
    { name: 'MockAttemptFinalizationRecord', model: MockAttemptFinalizationRecord },
  ];

  for (const { name, model } of models) {
    const indexes = await model.collection.indexes();
    console.log(`\nModel: ${name} (${indexes.length} indexes)`);
    indexes.forEach((idx, i) => {
      console.log(`  [${i + 1}] Name: ${idx.name}`);
      console.log(`      Keys: ${JSON.stringify(idx.key)}`);
      if (idx.unique) console.log(`      Unique: ${idx.unique}`);
      if (idx.partialFilterExpression) {
        console.log(`      PartialFilter: ${JSON.stringify(idx.partialFilterExpression)}`);
      }
    });
  }

  console.log('\n=============================================================');
  console.log('          PHASE 6 CRITICAL QUERY EXPLAIN("executionStats")');
  console.log('=============================================================');

  const extractExplainStats = (explainResult) => {
    const winningPlan =
      explainResult.queryPlanner?.winningPlan?.queryPlan ||
      explainResult.queryPlanner?.winningPlan;
    
    // Find stage name and index name (recursive search)
    let stage = winningPlan?.stage;
    let indexName = winningPlan?.indexName;
    let inputStage = winningPlan?.inputStage;
    while (!indexName && inputStage) {
      if (inputStage.indexName) indexName = inputStage.indexName;
      if (inputStage.stage) stage = inputStage.stage;
      inputStage = inputStage.inputStage;
    }

    const executionStats = explainResult.executionStats || {};
    return {
      stage: stage || winningPlan?.stage || 'UNKNOWN',
      winningIndex: indexName || 'NONE (COLLSCAN)',
      isColscan: (stage === 'COLLSCAN' || !indexName),
      keysExamined: executionStats.totalKeysExamined ?? 0,
      docsExamined: executionStats.totalDocsExamined ?? 0,
      nReturned: executionStats.nReturned ?? 0,
      executionTimeMillis: executionStats.executionTimeMillis ?? 0,
    };
  };

  const dummySessionId = new mongoose.Types.ObjectId();
  const dummyQuestionId = new mongoose.Types.ObjectId();

  const queries = [
    {
      label: '1. MockSession: Owner & Status Lookup',
      run: () => MockSession.find({ userId: 'audit_user', status: 'started' }).explain('executionStats'),
    },
    {
      label: '2. MockSession: Started Session Expiry Check',
      run: () => MockSession.find({ status: 'started', expiresAt: { $lte: new Date() } }).explain('executionStats'),
    },
    {
      label: '3. MockResponse: Session & Question Lookup',
      run: () => MockResponse.findOne({ sessionId: dummySessionId, questionId: dummyQuestionId }).explain('executionStats'),
    },
    {
      label: '4. MockResponse: Session & Section Lookup',
      run: () => MockResponse.find({ sessionId: dummySessionId, sectionId: 'sec-1' }).explain('executionStats'),
    },
    {
      label: '5. MockAttemptFinalizationRecord: Session Receipts',
      run: () => MockAttemptFinalizationRecord.find({ sessionId: dummySessionId }).explain('executionStats'),
    },
    {
      label: '6. Attempt: Recent History (Bounded Lookback)',
      run: () => Attempt.find({ userId: 'audit_user' }).sort({ attemptedAt: -1 }).limit(50).explain('executionStats'),
    },
    {
      label: '7. Question: Candidate Assembly Pre-Sort',
      run: () => Question.find({ topic: 'Percentage', pattern: 'Successive Percentage Changes', difficulty: { $in: [4, 5, 6, 7] } }).sort({ _id: 1 }).explain('executionStats'),
    },
  ];

  let anyUnexpectedCollscan = false;

  for (const q of queries) {
    const rawExplain = await q.run();
    const stats = extractExplainStats(rawExplain);
    console.log(`\nQuery: ${q.label}`);
    console.log(`  Winning Index : ${stats.winningIndex}`);
    console.log(`  Execution Plan: ${stats.stage}`);
    console.log(`  Keys Examined : ${stats.keysExamined}`);
    console.log(`  Docs Examined : ${stats.docsExamined}`);
    console.log(`  Docs Returned : ${stats.nReturned}`);
    console.log(`  Execution Time: ${stats.executionTimeMillis} ms`);

    if (stats.isColscan) {
      console.warn(`  WARNING: COLLSCAN detected!`);
      anyUnexpectedCollscan = true;
    } else {
      console.log(`  Status        : OPTIMAL (IXSCAN)`);
    }
  }

  console.log('\n=============================================================');
  if (anyUnexpectedCollscan) {
    console.log('  AUDIT RESULT: WARNINGS FOUND (Unexpected COLLSCAN)');
  } else {
    console.log('  AUDIT RESULT: ALL CRITICAL QUERIES OPTIMAL (100% IXSCAN)');
  }
  console.log('=============================================================\n');

  await mongoose.disconnect();
};

runAudit().catch((err) => {
  console.error('Audit failed with error:', err);
  process.exit(1);
});
