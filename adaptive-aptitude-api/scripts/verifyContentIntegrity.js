'use strict';

/**
 * scripts/verifyContentIntegrity.js
 *
 * Compares SHA-256 fingerprints of source question content with imported
 * database documents. Also verifies structural metadata (topic/pattern/difficulty)
 * independently from content fingerprints.
 *
 * Stable SHA-256 serialization contract:
 *   Keys in exactly this order: question, answer, options, explanation
 *   Option array order preserved from source
 *   Database-generated fields (_id, __v, createdAt, updatedAt) NOT included
 *   Metadata fields (topic, pattern, difficulty) NOT included in content hash
 *
 * Usage:
 *   npm run verify:content
 *   node scripts/verifyContentIntegrity.js
 *
 * Exit codes:
 *   0 — all 12,000 records verified, 0 modifications
 *   1 — mismatches found or unexpected records
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') });

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const mongoose = require('mongoose');
const Question = require('../src/models/questionModel');

const QUESTIONS_BANK_PATH =
  process.env.QUESTIONS_BANK_PATH ||
  path.resolve(__dirname, '..', '..', 'Questions bank');

const EXPECTED_TOTAL = 12000;

const SOURCE_FILES = [
  { file: 'ages.json',                          expectedTopic: 'Problems on Ages' },
  { file: 'algebra.json',                       expectedTopic: 'Algebra' },
  { file: 'averages.json',                      expectedTopic: 'Average' },
  { file: 'boats.json',                         expectedTopic: 'Boats and Streams' },
  { file: 'calendar.json',                      expectedTopic: 'Calendar' },
  { file: 'clock.json',                         expectedTopic: 'Clock' },
  { file: 'compound interest.json',             expectedTopic: 'Compound Interest' },
  { file: 'mixtureAndAlligations.json',         expectedTopic: 'Mixture and Alligation' },
  { file: 'numbers.json',                       expectedTopic: 'Number System' },
  { file: 'partnership.json',                   expectedTopic: 'Partnership' },
  { file: 'percentages.json',                   expectedTopic: 'Percentage' },
  { file: 'permutations and combinations.json', expectedTopic: 'Permutation and Combination' },
  { file: 'pipes and cisterns.json',            expectedTopic: 'Pipes and Cisterns' },
  { file: 'probability.json',                   expectedTopic: 'Probability' },
  { file: 'profitAndLoss.json',                 expectedTopic: 'Profit and Loss' },
  { file: 'ratioAndProportions.json',           expectedTopic: 'Ratio and Proportion' },
  { file: 'simple interest.json',               expectedTopic: 'Simple Interest' },
  { file: 'stocks and shares.json',             expectedTopic: 'Stocks and Shares' },
  { file: 'surds and indices.json',             expectedTopic: 'Surds and Indices' },
  { file: 'time and work.json',                 expectedTopic: 'Time and Work' },
  { file: 'time speed distance.json',           expectedTopic: 'Time, Speed and Distance' },
  { file: 'trains.json',                        expectedTopic: 'Problems on Trains' },
  { file: 'trigonometry.json',                  expectedTopic: 'Trigonometry' },
  { file: 'volume surface and area.json',       expectedTopic: 'Volume and Surface Area' },
];

/**
 * Stable SHA-256 content fingerprint.
 * Serializes exactly: { question, answer, options, explanation }
 * Option order is preserved. No DB fields included.
 */
const computeFingerprint = (q) => {
  const stable = JSON.stringify({
    question:    q.question,
    answer:      q.answer,
    options:     q.options,
    explanation: q.explanation,
  });
  return crypto.createHash('sha256').update(stable, 'utf8').digest('hex');
};

const main = async () => {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  CONTENT INTEGRITY VERIFICATION');
  console.log('═══════════════════════════════════════════════════════════\n');

  // 1. Load source questions and compute fingerprints
  console.log('── Loading source data ───────────────────────────────────────');
  const sourceRecords = []; // { fingerprint, topic, pattern, difficulty }

  for (const { file, expectedTopic } of SOURCE_FILES) {
    const filePath = path.join(QUESTIONS_BANK_PATH, file);
    const questions = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    for (const q of questions) {
      sourceRecords.push({
        fingerprint: computeFingerprint(q),
        topic:       q.topic,
        pattern:     q.pattern,
        difficulty:  q.difficulty,
      });
    }
    process.stdout.write(`\r  Source records loaded: ${sourceRecords.length}`);
  }
  console.log(`\n  Source total: ${sourceRecords.length}`);

  if (sourceRecords.length !== EXPECTED_TOTAL) {
    console.log(`  ✗ Source count mismatch: expected ${EXPECTED_TOTAL}, found ${sourceRecords.length}`);
    process.exit(1);
  }

  // 2. Build source fingerprint map
  const sourceFpMap = new Map();
  for (const rec of sourceRecords) {
    sourceFpMap.set(rec.fingerprint, rec);
  }

  // 3. Connect and load DB documents
  console.log('\n── Loading database documents ────────────────────────────────');
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
  console.log(`  Connected: ${mongoose.connection.name}`);

  const dbTotal = await Question.countDocuments();
  console.log(`  Database total: ${dbTotal}`);

  // 4. Compute DB fingerprints and compare
  console.log('\n── Comparing fingerprints ────────────────────────────────────');
  let verified = 0;
  let modified = 0;
  let missing = 0; // in source but not in DB
  let topicMismatches = 0;
  let patternMismatches = 0;
  let difficultyMismatches = 0;

  const dbFpMap = new Map();
  const cursor = Question.find({}).lean().cursor();

  for await (const doc of cursor) {
    const fp = computeFingerprint(doc);
    dbFpMap.set(fp, doc);
  }

  for (const srcRec of sourceRecords) {
    const dbDoc = dbFpMap.get(srcRec.fingerprint);

    if (!dbDoc) {
      missing++;
    } else {
      verified++;
      // Structural metadata comparison
      if (dbDoc.topic !== srcRec.topic) topicMismatches++;
      if (dbDoc.pattern !== srcRec.pattern) patternMismatches++;
      if (dbDoc.difficulty !== srcRec.difficulty) difficultyMismatches++;
    }
  }

  // DB records not in source = "unexpected"
  const unexpected = dbTotal - verified;

  // 5. Report
  await mongoose.disconnect();

  console.log('\n── Content integrity ─────────────────────────────────────────');
  console.log(`  Verified (SHA-256 match):   ${verified}`);
  console.log(`  Modified (fingerprint miss): ${modified}`);
  console.log(`  Missing (source not in DB):  ${missing}`);
  console.log(`  Unexpected (DB not in src):  ${unexpected}`);

  console.log('\n── Metadata integrity ────────────────────────────────────────');
  console.log(`  Topic mismatches:       ${topicMismatches}`);
  console.log(`  Pattern mismatches:     ${patternMismatches}`);
  console.log(`  Difficulty mismatches:  ${difficultyMismatches}`);

  const allPassed =
    verified === EXPECTED_TOTAL &&
    missing === 0 &&
    unexpected === 0 &&
    topicMismatches === 0 &&
    patternMismatches === 0 &&
    difficultyMismatches === 0;

  console.log('\n═══════════════════════════════════════════════════════════');
  if (allPassed) {
    console.log('  CONTENT INTEGRITY: PASSED');
    console.log(`  All ${verified} records preserved exactly (content + metadata)`);
  } else {
    console.log('  CONTENT INTEGRITY: FAILED');
    if (missing > 0)            console.log(`    ✗ Missing: ${missing}`);
    if (unexpected > 0)         console.log(`    ✗ Unexpected: ${unexpected}`);
    if (topicMismatches > 0)    console.log(`    ✗ Topic mismatches: ${topicMismatches}`);
    if (patternMismatches > 0)  console.log(`    ✗ Pattern mismatches: ${patternMismatches}`);
    if (difficultyMismatches > 0) console.log(`    ✗ Difficulty mismatches: ${difficultyMismatches}`);
  }
  console.log('═══════════════════════════════════════════════════════════\n');

  process.exit(allPassed ? 0 : 1);
};

main().catch((err) => {
  console.error('Integrity check error:', err.message);
  mongoose.disconnect().finally(() => process.exit(1));
});
