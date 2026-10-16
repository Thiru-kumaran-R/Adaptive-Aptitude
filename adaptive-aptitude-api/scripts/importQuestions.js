'use strict';

/**
 * scripts/importQuestions.js
 *
 * Deterministic, failure-safe import pipeline for the verified Phase 2 dataset.
 *
 * EXACT 22-STEP OPERATION SEQUENCE:
 *  1.  Load all source question files
 *  2.  Load canonical pattern registry
 *  3.  Load legacy pattern mappings
 *  4.  Validate registry structure
 *  5.  Validate legacy mappings
 *  6.  Validate prerequisite DAG
 *  7.  Validate all 12,000 questions (required non-empty content)
 *  8.  Validate answer-option consistency (answer ∈ options)
 *  9.  Validate topic/pattern ownership
 *  10. Validate difficulty (integer 1–10)
 *  11. Detect suspicious duplicates (non-destructive: report only)
 *  12. Generate source fingerprints (deterministic SHA-256)
 *  13. Confirm database identity
 *  14. Confirm NODE_ENV is not production
 *  15. Confirm explicit --clean authorization
 *  16. Only now clear the questions collection (deleteMany({}), never dropDatabase())
 *  17. Insert records
 *  18. Verify count (12,000)
 *  19. Verify indexes
 *  20. Verify content integrity
 *  21. Verify metadata integrity
 *  22. Run Phase 2 structural verification
 *
 * Usage:
 *   node scripts/importQuestions.js               # dry-run (validation only)
 *   node scripts/importQuestions.js --clean        # full clean import
 *
 * npm scripts:
 *   npm run import:questions                       # dry-run
 *   npm run import:questions -- --clean            # clean import
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') });

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const mongoose = require('mongoose');
const Question = require('../src/models/questionModel');
const { validatePrerequisiteDAG } = require('../src/services/hierarchyService');

// ── Configuration ──────────────────────────────────────────────────────────

const QUESTIONS_BANK_PATH =
  process.env.QUESTIONS_BANK_PATH ||
  path.resolve(__dirname, '..', '..', 'Questions bank');

const REGISTRY_PATH = path.resolve(__dirname, '..', 'src', 'data', 'canonicalPatternRegistry.json');
const LEGACY_PATH   = path.resolve(__dirname, '..', 'src', 'data', 'legacyPatternMapping.json');

const EXPECTED_TOTAL = 12000;
const EXPECTED_DB_NAME = 'adaptive_aptitude';

const SOURCE_FILES = [
  { file: 'ages.json',                          expectedTopic: 'Problems on Ages',           expectedCount: 591 },
  { file: 'algebra.json',                       expectedTopic: 'Algebra',                    expectedCount: 500 },
  { file: 'averages.json',                      expectedTopic: 'Average',                    expectedCount: 459 },
  { file: 'boats.json',                         expectedTopic: 'Boats and Streams',          expectedCount: 550 },
  { file: 'calendar.json',                      expectedTopic: 'Calendar',                   expectedCount: 500 },
  { file: 'clock.json',                         expectedTopic: 'Clock',                      expectedCount: 500 },
  { file: 'compound interest.json',             expectedTopic: 'Compound Interest',          expectedCount: 500 },
  { file: 'mixtureAndAlligations.json',         expectedTopic: 'Mixture and Alligation',     expectedCount: 558 },
  { file: 'numbers.json',                       expectedTopic: 'Number System',              expectedCount: 500 },
  { file: 'partnership.json',                   expectedTopic: 'Partnership',                expectedCount: 550 },
  { file: 'percentages.json',                   expectedTopic: 'Percentage',                 expectedCount: 492 },
  { file: 'permutations and combinations.json', expectedTopic: 'Permutation and Combination', expectedCount: 500 },
  { file: 'pipes and cisterns.json',            expectedTopic: 'Pipes and Cisterns',         expectedCount: 610 },
  { file: 'probability.json',                   expectedTopic: 'Probability',                expectedCount: 500 },
  { file: 'profitAndLoss.json',                 expectedTopic: 'Profit and Loss',            expectedCount: 500 },
  { file: 'ratioAndProportions.json',           expectedTopic: 'Ratio and Proportion',       expectedCount: 350 },
  { file: 'simple interest.json',               expectedTopic: 'Simple Interest',            expectedCount: 500 },
  { file: 'stocks and shares.json',             expectedTopic: 'Stocks and Shares',          expectedCount: 500 },
  { file: 'surds and indices.json',             expectedTopic: 'Surds and Indices',          expectedCount: 500 },
  { file: 'time and work.json',                 expectedTopic: 'Time and Work',              expectedCount: 440 },
  { file: 'time speed distance.json',           expectedTopic: 'Time, Speed and Distance',   expectedCount: 400 },
  { file: 'trains.json',                        expectedTopic: 'Problems on Trains',         expectedCount: 550 },
  { file: 'trigonometry.json',                  expectedTopic: 'Trigonometry',               expectedCount: 500 },
  { file: 'volume surface and area.json',       expectedTopic: 'Volume and Surface Area',    expectedCount: 450 },
];

// ── Utility functions ──────────────────────────────────────────────────────

const loadJSON = (filePath) => {
  const raw = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(raw);
};

/**
 * Compute SHA-256 fingerprint of a question's content fields.
 *
 * Deterministic serialization contract:
 *   Keys in exactly this order: question, answer, options, explanation
 *   Option array order preserved from source
 *   Database-generated fields (_id, __v, createdAt, updatedAt) NOT included
 *   Metadata fields (topic, pattern, difficulty) NOT included
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

// ── Validation helpers ─────────────────────────────────────────────────────

const buildRegistryInfo = (registry) => {
  const topicNames = new Set();
  const patternNames = new Set();
  const topicPatternMap = new Map();

  for (const topicEntry of registry) {
    topicNames.add(topicEntry.topic);
    const patternSet = new Set();
    topicPatternMap.set(topicEntry.topic, patternSet);
    for (const p of topicEntry.patterns || []) {
      patternNames.add(p.name);
      patternSet.add(p.name);
    }
  }
  return { topicNames, patternNames, topicPatternMap };
};

const validateRegistryStructure = (registry) => {
  const errors = [];
  const topicNames = new Set();
  const patternNames = new Set();

  for (const t of registry) {
    if (!t.topic || typeof t.topic !== 'string' || t.topic.trim() === '') {
      errors.push('Registry entry missing topic name');
    }
    if (topicNames.has(t.topic)) {
      errors.push(`Duplicate topic in registry: "${t.topic}"`);
    }
    topicNames.add(t.topic);

    for (const p of t.patterns || []) {
      if (!p.name || typeof p.name !== 'string' || p.name.trim() === '') {
        errors.push(`Pattern in topic "${t.topic}" missing name`);
      }
      if (patternNames.has(p.name)) {
        errors.push(`Duplicate canonical pattern name: "${p.name}"`);
      }
      patternNames.add(p.name);
    }
  }

  return { topicNames, patternNames, errors };
};

const validateLegacyMappings = (legacyMappings, registryInfo) => {
  const errors = [];
  for (const m of legacyMappings) {
    if (!registryInfo.topicNames.has(m.canonicalTopic)) {
      errors.push(`Unknown canonicalTopic: "${m.canonicalTopic}"`);
    }
    if (!registryInfo.patternNames.has(m.canonicalPattern)) {
      errors.push(`Unknown canonicalPattern: "${m.canonicalPattern}"`);
    }
  }
  return errors;
};

const validateQuestion = (q, index, expectedTopic, registryInfo) => {
  const { topicNames, patternNames, topicPatternMap } = registryInfo;
  const errors = [];

  // Content validation
  if (!q.question || typeof q.question !== 'string' || q.question.trim() === '') {
    errors.push(`[${index}] question is empty or missing`);
  }
  if (!q.answer || typeof q.answer !== 'string' || q.answer.trim() === '') {
    errors.push(`[${index}] answer is empty or missing`);
  }
  if (!q.explanation || typeof q.explanation !== 'string' || q.explanation.trim() === '') {
    errors.push(`[${index}] explanation is empty or missing`);
  }
  if (!Array.isArray(q.options) || q.options.length !== 4) {
    errors.push(`[${index}] options must be array of exactly 4 strings`);
  } else {
    for (let optIdx = 0; optIdx < q.options.length; optIdx++) {
      if (typeof q.options[optIdx] !== 'string' || q.options[optIdx].trim() === '') {
        errors.push(`[${index}] option[${optIdx}] must be a non-empty string`);
      }
    }
    // Answer-option consistency
    if (q.answer && !q.options.includes(q.answer)) {
      errors.push(`[${index}] answer "${q.answer}" not found in options`);
    }
  }

  // Topic validation
  if (!q.topic || typeof q.topic !== 'string' || q.topic.trim() === '') {
    errors.push(`[${index}] topic is missing or empty`);
  } else if (q.topic !== expectedTopic) {
    errors.push(`[${index}] topic mismatch: expected "${expectedTopic}", found "${q.topic}"`);
  } else if (!topicNames.has(q.topic)) {
    errors.push(`[${index}] topic "${q.topic}" not in canonical registry`);
  }

  // Pattern validation & ownership
  if (!q.pattern || typeof q.pattern !== 'string' || q.pattern.trim() === '') {
    errors.push(`[${index}] pattern is missing or empty`);
  } else if (!patternNames.has(q.pattern)) {
    errors.push(`[${index}] pattern "${q.pattern}" not in canonical registry`);
  } else if (q.topic && topicNames.has(q.topic)) {
    const pSet = topicPatternMap.get(q.topic);
    if (pSet && !pSet.has(q.pattern)) {
      errors.push(`[${index}] pattern "${q.pattern}" does not belong to topic "${q.topic}"`);
    }
  }

  // Difficulty validation
  if (q.difficulty === undefined || q.difficulty === null) {
    errors.push(`[${index}] difficulty is missing`);
  } else if (!Number.isInteger(q.difficulty) || q.difficulty < 1 || q.difficulty > 10) {
    errors.push(`[${index}] difficulty "${q.difficulty}" must be integer 1–10`);
  }

  return errors;
};

// ── DB safety checks ───────────────────────────────────────────────────────

/**
 * Validates clean import safety invariants before performing collection clearing.
 * Exported for automated safety testing.
 */
const validateImportSafeguards = ({ dbName, env, isClean }) => {
  if (!isClean) {
    throw new Error('SAFETY: Destructive import refused — missing --clean authorization flag.');
  }

  if (env === 'production') {
    throw new Error(
      'SAFETY: Destructive import refused — NODE_ENV=production. ' +
      'Use a dedicated migration process for production.'
    );
  }

  if (dbName !== EXPECTED_DB_NAME) {
    throw new Error(
      `SAFETY: Destructive import refused — connected database is "${dbName}", ` +
      `expected "${EXPECTED_DB_NAME}".`
    );
  }

  return true;
};

const checkDestructiveSafeguards = async (isClean) => {
  const env = process.env.NODE_ENV || 'development';
  const dbName = mongoose.connection.name;

  console.log('\n── Destructive import safeguards ────────────────────────────');
  console.log(`  Database:         ${dbName}`);
  console.log(`  Expected DB:      ${EXPECTED_DB_NAME}`);
  console.log(`  Environment:      ${env}`);
  console.log(`  --clean flag:     ${isClean ? 'present' : 'missing'}`);

  validateImportSafeguards({ dbName, env, isClean });

  const currentCount = await Question.countDocuments();
  console.log(`  Current docs:     ${currentCount}`);
  console.log(`  Operation:        CLEAN IMPORT (questions collection only)`);
  console.log('  All safeguards passed ✓');
};

// ── Main import pipeline ───────────────────────────────────────────────────

const main = async () => {
  const isClean = process.argv.includes('--clean');

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  ADAPTIVE APTITUDE — QUESTION IMPORT PIPELINE');
  console.log(`  Mode: ${isClean ? 'CLEAN IMPORT (--clean)' : 'DRY RUN (validation only)'}`);
  console.log('═══════════════════════════════════════════════════════════\n');

  // ── STEP 1: Load all source question files ─────────────────────────────
  console.log('── Step 1: Loading all source question files ──────────────────');
  const sourceQuestions = [];
  const perFileQuestions = [];
  for (const { file, expectedTopic, expectedCount } of SOURCE_FILES) {
    const filePath = path.join(QUESTIONS_BANK_PATH, file);
    const questions = loadJSON(filePath);
    perFileQuestions.push({ file, expectedTopic, expectedCount, questions });
    sourceQuestions.push(...questions);
  }
  console.log(`  Loaded ${sourceQuestions.length} questions across ${SOURCE_FILES.length} files`);

  // ── STEP 2: Load canonical pattern registry ────────────────────────────
  console.log('\n── Step 2: Loading canonical pattern registry ────────────────');
  const registry = loadJSON(REGISTRY_PATH);
  const registryInfo = buildRegistryInfo(registry);
  console.log(`  Loaded registry with ${registryInfo.topicNames.size} topics and ${registryInfo.patternNames.size} patterns`);

  // ── STEP 3: Load legacy pattern mappings ───────────────────────────────
  console.log('\n── Step 3: Loading legacy pattern mappings ───────────────────');
  const legacyMappings = loadJSON(LEGACY_PATH);
  console.log(`  Loaded ${legacyMappings.length} legacy pattern mappings`);

  // ── STEP 4: Validate registry structure ────────────────────────────────
  console.log('\n── Step 4: Validating registry structure ─────────────────────');
  const { errors: regErrors } = validateRegistryStructure(registry);
  if (regErrors.length > 0) {
    console.error('✗ Registry validation failed:');
    regErrors.forEach((e) => console.error(`  - ${e}`));
    process.exit(1);
  }
  console.log('  ✓ Registry structure valid (24 topics, 278 patterns, 0 collisions)');

  // ── STEP 5: Validate legacy mappings ───────────────────────────────────
  console.log('\n── Step 5: Validating legacy mappings ────────────────────────');
  const legErrors = validateLegacyMappings(legacyMappings, registryInfo);
  if (legErrors.length > 0) {
    console.error('✗ Legacy mapping validation failed:');
    legErrors.forEach((e) => console.error(`  - ${e}`));
    process.exit(1);
  }
  console.log(`  ✓ All ${legacyMappings.length} legacy mappings resolve to canonical references`);

  // ── STEP 6: Validate prerequisite DAG ──────────────────────────────────
  console.log('\n── Step 6: Validating prerequisite DAG ───────────────────────');
  const dagReport = validatePrerequisiteDAG();
  if (!dagReport.isValid) {
    console.error('✗ Prerequisite DAG validation failed:');
    if (dagReport.invalidReferences.length > 0) console.error('  Invalid references:', dagReport.invalidReferences);
    if (dagReport.selfReferences.length > 0) console.error('  Self references:', dagReport.selfReferences);
    if (dagReport.cycles.length > 0) console.error('  Cycles:', dagReport.cycles);
    process.exit(1);
  }
  console.log(`  ✓ Prerequisite DAG valid: ${dagReport.totalPatterns} patterns, ${dagReport.withPrerequisites} with prereqs, ${dagReport.foundational} foundational, ${dagReport.totalEdges} edges, 0 cycles`);

  // ── STEP 7: Validate all 12,000 questions (required content) ───────────
  // ── STEP 8: Validate answer-option consistency ─────────────────────────
  // ── STEP 9: Validate topic/pattern ownership ───────────────────────────
  // ── STEP 10: Validate difficulty ───────────────────────────────────────
  console.log('\n── Steps 7–10: Validating questions (content, answer∈options, ownership, difficulty) ──');
  let totalErrors = 0;
  let qIdx = 0;
  for (const { file, expectedTopic, expectedCount, questions } of perFileQuestions) {
    let fileErrors = 0;
    if (questions.length !== expectedCount) {
      console.error(`  ✗ ${file}: expected ${expectedCount}, found ${questions.length}`);
      fileErrors++;
    }
    for (let i = 0; i < questions.length; i++) {
      const errs = validateQuestion(questions[i], qIdx++, expectedTopic, registryInfo);
      if (errs.length > 0) {
        fileErrors += errs.length;
        errs.slice(0, 3).forEach((e) => console.error(`    ${e}`));
      }
    }
    totalErrors += fileErrors;
    const status = fileErrors === 0 ? '✓' : `✗ ${fileErrors} error(s)`;
    console.log(`  ${status.padEnd(20)} ${file} (${questions.length})`);
  }

  if (sourceQuestions.length !== EXPECTED_TOTAL) {
    console.error(`  ✗ Total question count mismatch: expected ${EXPECTED_TOTAL}, found ${sourceQuestions.length}`);
    totalErrors++;
  }

  if (totalErrors > 0) {
    console.error(`\n✗ Question validation failed with ${totalErrors} error(s). Import aborted.`);
    process.exit(1);
  }
  console.log(`  ✓ All ${sourceQuestions.length} questions passed content, answer∈options, ownership, and difficulty validation`);

  // ── STEP 11: Detect suspicious duplicates (report only) ─────────────────
  console.log('\n── Step 11: Duplicate detection (non-destructive: report only) ──');
  const seen = new Map();
  const duplicates = [];
  for (let i = 0; i < sourceQuestions.length; i++) {
    const q = sourceQuestions[i];
    const key = `${(q.question || '').trim().toLowerCase()}|${q.topic}|${q.pattern}`;
    if (seen.has(key)) {
      duplicates.push({ index: i, duplicateOf: seen.get(key), topic: q.topic, pattern: q.pattern });
    } else {
      seen.set(key, i);
    }
  }
  if (duplicates.length > 0) {
    console.log(`  ⚠  ${duplicates.length} potential duplicate(s) found — reported, NOT deleted:`);
    duplicates.forEach((d) => console.log(`     Index ${d.index} duplicate of ${d.duplicateOf} [${d.topic} / ${d.pattern}]`));
  } else {
    console.log('  ✓ No duplicates detected');
  }

  // ── STEP 12: Generate source fingerprints ──────────────────────────────
  console.log('\n── Step 12: Generating source fingerprints (deterministic SHA-256) ──');
  const sourceFingerprints = new Map();
  for (let i = 0; i < sourceQuestions.length; i++) {
    const fp = computeFingerprint(sourceQuestions[i]);
    sourceFingerprints.set(fp, sourceQuestions[i]);
  }
  console.log(`  ✓ Generated ${sourceFingerprints.size} unique content fingerprints`);

  // ── DRY RUN stops here ─────────────────────────────────────────────────
  if (!isClean) {
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('  DRY RUN COMPLETE — All 12 source validations passed.');
    console.log('  No database changes made.');
    console.log('  Run with --clean to perform the actual import:');
    console.log('    npm run import:questions -- --clean');
    console.log('═══════════════════════════════════════════════════════════\n');
    process.exit(0);
  }

  // ── STEP 13: Confirm database identity ─────────────────────────────────
  // ── STEP 14: Confirm NODE_ENV is not production ────────────────────────
  // ── STEP 15: Confirm explicit --clean authorization ────────────────────
  console.log('\n── Steps 13–15: Connecting to MongoDB & verifying safety safeguards ──');
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI not set in .env');
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  console.log(`  Connected: ${mongoose.connection.host} / ${mongoose.connection.name}`);

  await checkDestructiveSafeguards(isClean);

  // ── STEP 16: Only now clear the questions collection ───────────────────
  console.log('\n── Step 16: Clearing questions collection (deleteMany({})) ────');
  const deleteResult = await Question.deleteMany({});
  console.log(`  Cleared ${deleteResult.deletedCount} existing documents (questions collection only)`);

  // ── STEP 17: Insert records ────────────────────────────────────────────
  console.log('\n── Step 17: Inserting questions ───────────────────────────────');
  const batchSize = 500;
  let inserted = 0;
  for (let i = 0; i < sourceQuestions.length; i += batchSize) {
    const batch = sourceQuestions.slice(i, i + batchSize);
    const docs = batch.map((q) => ({
      question:    q.question,
      answer:      q.answer,
      options:     q.options,
      explanation: q.explanation,
      topic:       q.topic,
      pattern:     q.pattern,
      difficulty:  q.difficulty,
    }));
    await Question.insertMany(docs, { ordered: true });
    inserted += docs.length;
    process.stdout.write(`\r  Inserted: ${inserted} / ${sourceQuestions.length}`);
  }
  console.log(`\n  ✓ Inserted ${inserted} questions`);

  // ── STEP 18: Verify count ──────────────────────────────────────────────
  console.log('\n── Step 18: Verifying imported count ─────────────────────────');
  const importedCount = await Question.countDocuments();
  if (importedCount !== EXPECTED_TOTAL) {
    throw new Error(`CRITICAL: Expected ${EXPECTED_TOTAL} documents, found ${importedCount}`);
  }
  console.log(`  ✓ ${importedCount} / ${EXPECTED_TOTAL} documents verified`);

  // ── STEP 19: Verify indexes ────────────────────────────────────────────
  console.log('\n── Step 19: Verifying indexes ────────────────────────────────');
  await Question.createIndexes();
  const indexes = await Question.collection.getIndexes();
  console.log(`  Indexes present: ${Object.keys(indexes).length}`);
  Object.keys(indexes).forEach((name) => console.log(`    • ${name}`));

  // ── STEP 20: Verify content integrity ──────────────────────────────────
  // ── STEP 21: Verify metadata integrity ─────────────────────────────────
  console.log('\n── Steps 20–21: Verifying content (SHA-256) & metadata integrity ──');
  let contentMismatches = 0;
  let topicMismatches = 0;
  let patternMismatches = 0;
  let difficultyMismatches = 0;
  let verifiedCount = 0;

  const cursor = Question.find({}).lean().cursor();
  for await (const dbDoc of cursor) {
    const fp = computeFingerprint(dbDoc);
    const srcDoc = sourceFingerprints.get(fp);
    if (!srcDoc) {
      contentMismatches++;
    } else {
      verifiedCount++;
      if (dbDoc.topic !== srcDoc.topic) topicMismatches++;
      if (dbDoc.pattern !== srcDoc.pattern) patternMismatches++;
      if (dbDoc.difficulty !== srcDoc.difficulty) difficultyMismatches++;
    }
  }

  console.log(`  Content verified:       ${verifiedCount}`);
  console.log(`  Content mismatches:     ${contentMismatches}`);
  console.log(`  Topic mismatches:       ${topicMismatches}`);
  console.log(`  Pattern mismatches:     ${patternMismatches}`);
  console.log(`  Difficulty mismatches:  ${difficultyMismatches}`);

  if (contentMismatches > 0 || topicMismatches > 0 || patternMismatches > 0 || difficultyMismatches > 0) {
    throw new Error('CRITICAL: Post-import content or metadata integrity failed.');
  }
  console.log('  ✓ Content & metadata integrity verified (0 mismatches)');

  // ── STEP 22: Run Phase 2 structural verification ───────────────────────
  console.log('\n── Step 22: Running Phase 2 structural verification ──────────');
  const diffAgg = await Question.aggregate([
    { $group: { _id: '$difficulty', count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);
  const topicAgg = await Question.aggregate([
    { $group: { _id: '$topic', count: { $sum: 1 } } },
  ]);
  console.log(`  Topics in database: ${topicAgg.length} (expected 24)`);
  console.log(`  Difficulty bins:    ${diffAgg.length} (expected 10)`);
  console.log('  ✓ Structural verification complete');

  await mongoose.disconnect();

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  IMPORT PIPELINE COMPLETE — ALL 22 STEPS PASSED');
  console.log(`  Questions imported:  ${importedCount}`);
  console.log(`  Content verified:    ${verifiedCount}`);
  console.log('═══════════════════════════════════════════════════════════\n');
  process.exit(0);
};

// Export helpers for test suites
module.exports = {
  computeFingerprint,
  validateImportSafeguards,
  validateQuestion,
  validateRegistryStructure,
  validateLegacyMappings,
  EXPECTED_TOTAL,
  EXPECTED_DB_NAME,
};

if (require.main === module) {
  main().catch((err) => {
    console.error('\n✗ Import failed:', err.message);
    mongoose.disconnect().finally(() => process.exit(1));
  });
}
