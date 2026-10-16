'use strict';

/**
 * scripts/validateQuestions.js
 *
 * Pre-import validation report.
 * Reads source question bank files and validates every record against
 * the canonical registry WITHOUT connecting to or modifying any database.
 *
 * Usage:
 *   npm run validate:questions
 *   node scripts/validateQuestions.js
 *
 * Exit codes:
 *   0 — all validations passed
 *   1 — one or more validation errors found
 */

const fs = require('fs');
const path = require('path');

// ── Source configuration ───────────────────────────────────────────────────

const QUESTIONS_BANK_PATH =
  process.env.QUESTIONS_BANK_PATH ||
  path.resolve(__dirname, '..', '..', 'Questions bank');

const REGISTRY_PATH = path.resolve(__dirname, '..', 'src', 'data', 'canonicalPatternRegistry.json');
const LEGACY_PATH = path.resolve(__dirname, '..', 'src', 'data', 'legacyPatternMapping.json');

/**
 * Each entry maps a source filename to its expected canonical topic name
 * and expected question count (verified Phase 2 invariants).
 */
const SOURCE_FILES = [
  { file: 'ages.json',                        expectedTopic: 'Problems on Ages',           expectedCount: 591 },
  { file: 'algebra.json',                     expectedTopic: 'Algebra',                    expectedCount: 500 },
  { file: 'averages.json',                    expectedTopic: 'Average',                    expectedCount: 459 },
  { file: 'boats.json',                       expectedTopic: 'Boats and Streams',          expectedCount: 550 },
  { file: 'calendar.json',                    expectedTopic: 'Calendar',                   expectedCount: 500 },
  { file: 'clock.json',                       expectedTopic: 'Clock',                      expectedCount: 500 },
  { file: 'compound interest.json',           expectedTopic: 'Compound Interest',          expectedCount: 500 },
  { file: 'mixtureAndAlligations.json',       expectedTopic: 'Mixture and Alligation',     expectedCount: 558 },
  { file: 'numbers.json',                     expectedTopic: 'Number System',              expectedCount: 500 },
  { file: 'partnership.json',                 expectedTopic: 'Partnership',                expectedCount: 550 },
  { file: 'percentages.json',                 expectedTopic: 'Percentage',                 expectedCount: 492 },
  { file: 'permutations and combinations.json', expectedTopic: 'Permutation and Combination', expectedCount: 500 },
  { file: 'pipes and cisterns.json',          expectedTopic: 'Pipes and Cisterns',         expectedCount: 610 },
  { file: 'probability.json',                 expectedTopic: 'Probability',                expectedCount: 500 },
  { file: 'profitAndLoss.json',               expectedTopic: 'Profit and Loss',            expectedCount: 500 },
  { file: 'ratioAndProportions.json',         expectedTopic: 'Ratio and Proportion',       expectedCount: 350 },
  { file: 'simple interest.json',             expectedTopic: 'Simple Interest',            expectedCount: 500 },
  { file: 'stocks and shares.json',           expectedTopic: 'Stocks and Shares',          expectedCount: 500 },
  { file: 'surds and indices.json',           expectedTopic: 'Surds and Indices',          expectedCount: 500 },
  { file: 'time and work.json',               expectedTopic: 'Time and Work',              expectedCount: 440 },
  { file: 'time speed distance.json',         expectedTopic: 'Time, Speed and Distance',   expectedCount: 400 },
  { file: 'trains.json',                      expectedTopic: 'Problems on Trains',         expectedCount: 550 },
  { file: 'trigonometry.json',                expectedTopic: 'Trigonometry',               expectedCount: 500 },
  { file: 'volume surface and area.json',     expectedTopic: 'Volume and Surface Area',    expectedCount: 450 },
];

const EXPECTED_TOTAL = 12000;

// ── Load helpers ───────────────────────────────────────────────────────────

const loadJSON = (filePath) => {
  const raw = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(raw);
};

// ── Validate registry structure ────────────────────────────────────────────

const validateRegistry = (registry) => {
  const errors = [];
  const topicNames = new Set();
  const patternNames = new Set();
  const topicPatternMap = new Map(); // topicName → Set<patternName>

  for (const topicEntry of registry) {
    if (!topicEntry.topic || typeof topicEntry.topic !== 'string') {
      errors.push(`Registry entry missing topic name`);
      continue;
    }

    if (topicNames.has(topicEntry.topic)) {
      errors.push(`Duplicate topic in registry: "${topicEntry.topic}"`);
    }
    topicNames.add(topicEntry.topic);

    const patternSet = new Set();
    topicPatternMap.set(topicEntry.topic, patternSet);

    for (const p of topicEntry.patterns || []) {
      if (!p.name || typeof p.name !== 'string') {
        errors.push(`Pattern in topic "${topicEntry.topic}" missing name`);
        continue;
      }
      if (patternNames.has(p.name)) {
        errors.push(`Duplicate canonical pattern name: "${p.name}"`);
      }
      patternNames.add(p.name);
      patternSet.add(p.name);
    }
  }

  return { topicNames, patternNames, topicPatternMap, errors };
};

// ── Validate a single question record ─────────────────────────────────────

const validateQuestion = (q, index, expectedTopic, registryInfo) => {
  const { topicNames, patternNames, topicPatternMap } = registryInfo;
  const errors = [];

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
    errors.push(`[${index}] options must be an array of exactly 4 — found ${Array.isArray(q.options) ? q.options.length : typeof q.options}`);
  } else if (q.answer && !q.options.includes(q.answer)) {
    errors.push(`[${index}] answer "${q.answer}" is not present in options`);
  }

  if (!q.topic || typeof q.topic !== 'string') {
    errors.push(`[${index}] topic is missing`);
  } else if (q.topic !== expectedTopic) {
    errors.push(`[${index}] topic mismatch: file says "${expectedTopic}", record says "${q.topic}"`);
  } else if (!topicNames.has(q.topic)) {
    errors.push(`[${index}] topic "${q.topic}" not found in canonical registry`);
  }

  if (!q.pattern || typeof q.pattern !== 'string') {
    errors.push(`[${index}] pattern is missing`);
  } else if (!patternNames.has(q.pattern)) {
    errors.push(`[${index}] pattern "${q.pattern}" not found in canonical registry`);
  } else if (q.topic && topicNames.has(q.topic)) {
    const patternSet = topicPatternMap.get(q.topic);
    if (patternSet && !patternSet.has(q.pattern)) {
      errors.push(`[${index}] pattern "${q.pattern}" does not belong to topic "${q.topic}"`);
    }
  }

  if (q.difficulty === undefined || q.difficulty === null) {
    errors.push(`[${index}] difficulty is missing`);
  } else if (!Number.isInteger(q.difficulty) || q.difficulty < 1 || q.difficulty > 10) {
    errors.push(`[${index}] difficulty "${q.difficulty}" is not an integer between 1 and 10`);
  }

  return errors;
};

// ── Duplicate detection ────────────────────────────────────────────────────

const detectDuplicates = (questions) => {
  const seen = new Map();
  const duplicates = [];

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const key = `${(q.question || '').trim().toLowerCase()}|${q.topic}|${q.pattern}`;
    if (seen.has(key)) {
      duplicates.push({ index: i, duplicateOf: seen.get(key), topic: q.topic, pattern: q.pattern });
    } else {
      seen.set(key, i);
    }
  }
  return duplicates;
};

// ── Main ───────────────────────────────────────────────────────────────────

const main = () => {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  QUESTION BANK VALIDATION — PRE-IMPORT CHECK');
  console.log('═══════════════════════════════════════════════════════════\n');
  console.log(`Source directory: ${QUESTIONS_BANK_PATH}\n`);

  // 1. Load and validate registry
  console.log('── Registry validation ─────────────────────────────────────');
  const registry = loadJSON(REGISTRY_PATH);
  const legacyMappings = loadJSON(LEGACY_PATH);
  const registryInfo = validateRegistry(registry);

  console.log(`Topics:           ${registryInfo.topicNames.size}`);
  console.log(`Patterns:         ${registryInfo.patternNames.size}`);
  console.log(`Legacy mappings:  ${legacyMappings.length}`);

  if (registryInfo.errors.length > 0) {
    console.log('\n[REGISTRY ERRORS]');
    registryInfo.errors.forEach((e) => console.log(`  ✗ ${e}`));
  } else {
    console.log('Registry:         ✓ valid\n');
  }

  // Validate legacy mappings
  const legacyErrors = [];
  for (const mapping of legacyMappings) {
    if (!registryInfo.topicNames.has(mapping.canonicalTopic)) {
      legacyErrors.push(`Legacy mapping canonicalTopic not found: "${mapping.canonicalTopic}"`);
    }
    if (!registryInfo.patternNames.has(mapping.canonicalPattern)) {
      legacyErrors.push(`Legacy mapping canonicalPattern not found: "${mapping.canonicalPattern}"`);
    }
  }

  if (legacyErrors.length > 0) {
    console.log('\n[LEGACY MAPPING ERRORS]');
    legacyErrors.forEach((e) => console.log(`  ✗ ${e}`));
  } else {
    console.log(`Legacy mappings:  ✓ all ${legacyMappings.length} mappings resolve\n`);
  }

  // 2. Validate question files
  console.log('── Question file validation ─────────────────────────────────');
  let totalQuestions = 0;
  let totalErrors = 0;
  const allQuestions = [];
  const perFileResults = [];

  for (const { file, expectedTopic, expectedCount } of SOURCE_FILES) {
    const filePath = path.join(QUESTIONS_BANK_PATH, file);

    let questions;
    try {
      questions = loadJSON(filePath);
    } catch (err) {
      console.log(`  ✗ CANNOT READ ${file}: ${err.message}`);
      totalErrors++;
      continue;
    }

    const fileErrors = [];

    if (questions.length !== expectedCount) {
      fileErrors.push(
        `Count mismatch: expected ${expectedCount}, found ${questions.length}`
      );
    }

    for (let i = 0; i < questions.length; i++) {
      const qErrors = validateQuestion(questions[i], i, expectedTopic, registryInfo);
      fileErrors.push(...qErrors);
    }

    totalQuestions += questions.length;
    totalErrors += fileErrors.length;
    allQuestions.push(...questions);
    perFileResults.push({ file, count: questions.length, errors: fileErrors.length });

    const status = fileErrors.length === 0 ? '✓' : `✗ ${fileErrors.length} error(s)`;
    console.log(`  ${status.padEnd(30)} ${file} (${questions.length})`);
    if (fileErrors.length > 0 && fileErrors.length <= 5) {
      fileErrors.forEach((e) => console.log(`      → ${e}`));
    } else if (fileErrors.length > 5) {
      fileErrors.slice(0, 5).forEach((e) => console.log(`      → ${e}`));
      console.log(`      → ... and ${fileErrors.length - 5} more`);
    }
  }

  // 3. Total count check
  console.log('\n── Summary ─────────────────────────────────────────────────');
  console.log(`Total questions found:    ${totalQuestions}`);
  console.log(`Expected total:           ${EXPECTED_TOTAL}`);

  if (totalQuestions !== EXPECTED_TOTAL) {
    console.log(`  ✗ Total count mismatch: expected ${EXPECTED_TOTAL}, found ${totalQuestions}`);
    totalErrors++;
  } else {
    console.log('Total count:              ✓ 12,000\n');
  }

  // 4. Duplicate detection (non-destructive — report only)
  console.log('── Duplicate detection ──────────────────────────────────────');
  const duplicates = detectDuplicates(allQuestions);
  if (duplicates.length > 0) {
    console.log(`  ⚠  ${duplicates.length} potential duplicate(s) found (report only — not deleted):`);
    duplicates.slice(0, 10).forEach((d) => {
      console.log(`     Index ${d.index} is a duplicate of ${d.duplicateOf} [${d.topic} / ${d.pattern}]`);
    });
    if (duplicates.length > 10) console.log(`     ... and ${duplicates.length - 10} more`);
  } else {
    console.log('  ✓ No duplicates detected');
  }

  // 5. Final result
  console.log('\n═══════════════════════════════════════════════════════════');
  if (totalErrors === 0 && registryInfo.errors.length === 0 && legacyErrors.length === 0) {
    console.log('  VALIDATION PASSED — source data is ready for import');
    console.log('═══════════════════════════════════════════════════════════\n');
    process.exit(0);
  } else {
    console.log(`  VALIDATION FAILED — ${totalErrors + registryInfo.errors.length + legacyErrors.length} error(s) found`);
    console.log('  Fix errors before running import.');
    console.log('═══════════════════════════════════════════════════════════\n');
    process.exit(1);
  }
};

main();
