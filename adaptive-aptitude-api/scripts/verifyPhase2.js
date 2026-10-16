'use strict';

/**
 * scripts/verifyPhase2.js
 *
 * Post-import structural verification for Phase 2.
 * Connects to the configured database and verifies ALL invariants.
 *
 * Every value in this report is COMPUTED from actual data.
 * No values are hard-coded to appear passing.
 *
 * Exit codes:
 *   0 — all invariants passed
 *   1 — one or more invariants failed
 *
 * Usage:
 *   npm run verify:phase2
 *   node scripts/verifyPhase2.js
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') });

const fs   = require('fs');
const path = require('path');
const crypto = require('crypto');
const mongoose = require('mongoose');
const Question = require('../src/models/questionModel');

const REGISTRY_PATH = path.resolve(__dirname, '..', 'src', 'data', 'canonicalPatternRegistry.json');
const LEGACY_PATH   = path.resolve(__dirname, '..', 'src', 'data', 'legacyPatternMapping.json');

const QUESTIONS_BANK_PATH =
  process.env.QUESTIONS_BANK_PATH ||
  path.resolve(__dirname, '..', '..', 'Questions bank');

// ── Expected invariants (Phase 2 verified dataset) ─────────────────────────
const EXPECTED = {
  totalQuestions:         12000,
  canonicalTopics:        24,
  canonicalPatterns:      278,
  legacyMappings:         308,
  patternsWithPrereqs:    218,
  foundationalPatterns:   60,
  prerequisiteEdges:      410,
};

const EXPECTED_DIFFICULTY_DIST = {
  1: 1442, 2: 1415, 3: 1715, 4: 2018, 5: 1858,
  6: 1447, 7: 1085, 8: 738,  9: 214,  10: 68,
};

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

// ── SHA-256 fingerprint (same contract as importQuestions.js) ──────────────
const computeFingerprint = (q) => {
  const stable = JSON.stringify({
    question:    q.question,
    answer:      q.answer,
    options:     q.options,
    explanation: q.explanation,
  });
  return crypto.createHash('sha256').update(stable, 'utf8').digest('hex');
};

// ── Prerequisite DAG validation ────────────────────────────────────────────
const validateDAG = (registry) => {
  const allPatterns = new Set();
  const patternPrereqs = new Map();

  for (const topic of registry) {
    for (const pattern of topic.patterns || []) {
      allPatterns.add(pattern.name);
      patternPrereqs.set(pattern.name, pattern.prerequisites || []);
    }
  }

  const invalidRefs = [];
  const selfRefs = [];
  let withPrereqs = 0;
  let totalEdges = 0;

  for (const [name, prereqs] of patternPrereqs) {
    if (prereqs.length > 0) withPrereqs++;
    totalEdges += prereqs.length;
    for (const p of prereqs) {
      if (p === name) selfRefs.push(name);
      if (!allPatterns.has(p)) invalidRefs.push({ pattern: name, missing: p });
    }
  }

  const WHITE = 0, GRAY = 1, BLACK = 2;
  const color = new Map([...allPatterns].map((p) => [p, WHITE]));
  const cycleNodes = new Set();

  const dfs = (node) => {
    color.set(node, GRAY);
    for (const prereq of patternPrereqs.get(node) || []) {
      if (!allPatterns.has(prereq)) continue;
      if (color.get(prereq) === GRAY) {
        cycleNodes.add(node);
        cycleNodes.add(prereq);
        return;
      }
      if (color.get(prereq) === WHITE) dfs(prereq);
    }
    color.set(node, BLACK);
  };
  for (const p of allPatterns) if (color.get(p) === WHITE) dfs(p);

  return {
    totalPatterns: allPatterns.size,
    foundational: allPatterns.size - withPrereqs,
    withPrereqs,
    totalEdges,
    invalidRefs,
    selfRefs,
    cycles: [...cycleNodes],
  };
};

// ── Main ───────────────────────────────────────────────────────────────────
const main = async () => {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  PHASE 2 VERIFICATION — FULL REPORT');
  console.log('═══════════════════════════════════════════════════════════\n');

  const failures = [];
  const check = (label, actual, expected) => {
    const pass = actual === expected;
    const mark = pass ? '✓' : '✗';
    console.log(`  ${mark} ${label.padEnd(46)} actual: ${actual}  expected: ${expected}`);
    if (!pass) failures.push(`${label}: expected ${expected}, got ${actual}`);
    return pass;
  };
  const report = (label, actual) => {
    console.log(`    ${label.padEnd(44)} ${actual}`);
  };

  // ── 1. Registry structure ────────────────────────────────────────────────
  console.log('── Registry ─────────────────────────────────────────────────');
  const registry      = JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf8'));
  const legacyMappings = JSON.parse(fs.readFileSync(LEGACY_PATH, 'utf8'));

  const totalTopics   = registry.length;
  const patternNames  = registry.flatMap((t) => (t.patterns || []).map((p) => p.name));
  const totalPatterns = patternNames.length;
  const uniquePatternNames = new Set(patternNames);
  const collisions    = totalPatterns - uniquePatternNames.size;

  // Build topic→patterns ownership map
  const validTopics  = new Set(registry.map((t) => t.topic));
  const validPatterns = new Set(patternNames);
  const topicPatternMap = new Map();
  for (const t of registry) {
    topicPatternMap.set(t.topic, new Set((t.patterns || []).map((p) => p.name)));
  }

  check('Canonical topics',             totalTopics,   EXPECTED.canonicalTopics);
  check('Canonical patterns',           totalPatterns, EXPECTED.canonicalPatterns);
  check('Canonical name collisions',    collisions,    0);
  check('Legacy mappings',              legacyMappings.length, EXPECTED.legacyMappings);

  // ── 2. Legacy mapping validity ────────────────────────────────────────────
  console.log('\n── Legacy mappings ──────────────────────────────────────────');
  let invalidMappings = 0;
  for (const m of legacyMappings) {
    if (!validTopics.has(m.canonicalTopic) || !validPatterns.has(m.canonicalPattern)) {
      invalidMappings++;
    }
  }
  check('Invalid legacy mapping references', invalidMappings, 0);

  // ── 3. Prerequisite DAG ────────────────────────────────────────────────────
  console.log('\n── Prerequisite DAG ─────────────────────────────────────────');
  const dag = validateDAG(registry);
  check('Patterns with prerequisites',       dag.withPrereqs,          EXPECTED.patternsWithPrereqs);
  check('Foundational patterns',             dag.foundational,         EXPECTED.foundationalPatterns);
  check('Prerequisite edges',                dag.totalEdges,           EXPECTED.prerequisiteEdges);
  check('Invalid prerequisite refs',         dag.invalidRefs.length,   0);
  check('Self prerequisite references',      dag.selfRefs.length,      0);
  check('Prerequisite cycles',               dag.cycles.length,        0);

  // ── 4. Source data checks (no DB) ─────────────────────────────────────────
  console.log('\n── Source data validation ────────────────────────────────────');
  let emptyQuestions   = 0;
  let emptyAnswers     = 0;
  let emptyExplanations = 0;
  let invalidOptionArrays = 0;
  let invalidOptionCounts = 0;
  let answerNotInOptions  = 0;
  let invalidTopicRefs    = 0;
  let invalidPatternRefs  = 0;
  let topicPatternMismatches = 0;
  let invalidDifficultyValues = 0;
  let sourceTotal = 0;
  const sourceRecords = [];

  for (const { file, expectedTopic } of SOURCE_FILES) {
    const filePath = path.join(QUESTIONS_BANK_PATH, file);
    const questions = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    sourceTotal += questions.length;

    for (const q of questions) {
      sourceRecords.push(q);

      if (!q.question || typeof q.question !== 'string' || q.question.trim() === '') emptyQuestions++;
      if (!q.answer || typeof q.answer !== 'string' || q.answer.trim() === '') emptyAnswers++;
      if (!q.explanation || typeof q.explanation !== 'string' || q.explanation.trim() === '') emptyExplanations++;

      if (!Array.isArray(q.options)) {
        invalidOptionArrays++;
      } else if (q.options.length !== 4) {
        invalidOptionCounts++;
      } else if (q.answer && !q.options.includes(q.answer)) {
        answerNotInOptions++;
      }

      if (!validTopics.has(q.topic)) invalidTopicRefs++;
      if (!validPatterns.has(q.pattern)) invalidPatternRefs++;

      if (validTopics.has(q.topic) && validPatterns.has(q.pattern)) {
        const pSet = topicPatternMap.get(q.topic);
        if (pSet && !pSet.has(q.pattern)) topicPatternMismatches++;
      }

      if (
        q.difficulty === undefined ||
        q.difficulty === null ||
        !Number.isInteger(q.difficulty) ||
        q.difficulty < 1 ||
        q.difficulty > 10
      ) invalidDifficultyValues++;
    }
    process.stdout.write(`\r  Source records scanned: ${sourceTotal}`);
  }
  console.log(`\r  Source records scanned: ${sourceTotal}           `);

  check('Source total questions',              sourceTotal,             EXPECTED.totalQuestions);
  check('Empty question values',               emptyQuestions,          0);
  check('Empty answers',                       emptyAnswers,            0);
  check('Empty explanations',                  emptyExplanations,       0);
  check('Invalid option arrays (not Array)',    invalidOptionArrays,     0);
  check('Invalid option counts (≠ 4)',         invalidOptionCounts,     0);
  check('Answers not present in options',      answerNotInOptions,      0);
  check('Invalid topic references (source)',   invalidTopicRefs,        0);
  check('Invalid pattern references (source)', invalidPatternRefs,      0);
  check('Topic-pattern ownership violations',  topicPatternMismatches,  0);
  check('Invalid difficulty values (source)',  invalidDifficultyValues, 0);

  // ── 5. Connect to MongoDB ──────────────────────────────────────────────────
  console.log('\n── Database verification ─────────────────────────────────────');
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
  console.log(`  Connected: ${mongoose.connection.host} / ${mongoose.connection.name}`);

  // ── 6. DB total count ──────────────────────────────────────────────────────
  const totalQuestions = await Question.countDocuments();
  check('Total questions in DB',               totalQuestions,          EXPECTED.totalQuestions);

  // ── 7. DB content validation ───────────────────────────────────────────────
  console.log('\n── DB content validation ─────────────────────────────────────');

  const [
    dbEmptyQ,
    dbEmptyA,
    dbEmptyE,
    dbBadOpts,
    dbBadDiff,
    dbBadTopics,
    dbBadPatterns,
  ] = await Promise.all([
    Question.countDocuments({ $or: [{ question: '' }, { question: null }] }),
    Question.countDocuments({ $or: [{ answer: '' }, { answer: null }] }),
    Question.countDocuments({ $or: [{ explanation: '' }, { explanation: null }] }),
    Question.countDocuments({ $expr: { $ne: [{ $size: '$options' }, 4] } }),
    Question.countDocuments({ $or: [{ difficulty: { $lt: 1 } }, { difficulty: { $gt: 10 } }] }),
    Question.countDocuments({ topic: { $nin: [...validTopics] } }),
    Question.countDocuments({ pattern: { $nin: [...validPatterns] } }),
  ]);

  // Answer not in options — check via aggregation
  const answerNotInOptionsDB = await Question.aggregate([
    {
      $match: {
        $expr: { $not: { $in: ['$answer', '$options'] } },
      },
    },
    { $count: 'count' },
  ]);
  const dbAnswerNotInOptions = answerNotInOptionsDB[0]?.count || 0;

  check('DB empty question values',            dbEmptyQ,                0);
  check('DB empty answers',                    dbEmptyA,                0);
  check('DB empty explanations',               dbEmptyE,                0);
  check('DB invalid option counts',            dbBadOpts,               0);
  check('DB invalid difficulty values',        dbBadDiff,               0);
  check('DB invalid topic references',         dbBadTopics,             0);
  check('DB invalid pattern references',       dbBadPatterns,           0);
  check('DB answers not in options',           dbAnswerNotInOptions,    0);

  // ── 8. Difficulty distribution ─────────────────────────────────────────────
  console.log('\n── Difficulty distribution ───────────────────────────────────');
  const diffAgg = await Question.aggregate([
    { $group: { _id: '$difficulty', count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);
  const diffMap = {};
  for (const d of diffAgg) diffMap[d._id] = d.count;

  let diffTotal = 0;
  for (let d = 1; d <= 10; d++) {
    const actual = diffMap[d] || 0;
    check(`Difficulty ${d}`, actual, EXPECTED_DIFFICULTY_DIST[d]);
    diffTotal += actual;
  }
  check('Difficulty total', diffTotal, EXPECTED.totalQuestions);

  // ── 9. Topic totals ────────────────────────────────────────────────────────
  console.log('\n── Topic question totals ─────────────────────────────────────');
  const topicAgg = await Question.aggregate([
    { $group: { _id: '$topic', count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);
  const topicTotal = topicAgg.reduce((s, t) => s + t.count, 0);
  console.log(`  Topics with data: ${topicAgg.length}`);
  for (const t of topicAgg) {
    report(t._id, t.count);
  }
  check('Topic totals sum',                    topicTotal,              EXPECTED.totalQuestions);
  check('Topics with data',                    topicAgg.length,        EXPECTED.canonicalTopics);

  // ── 10. SHA-256 content integrity ──────────────────────────────────────────
  console.log('\n── SHA-256 content and metadata integrity ────────────────────');
  console.log('  Fingerprint contract: JSON.stringify({ question, answer, options, explanation })');
  console.log('  Excluded: _id, __v, createdAt, updatedAt, topic, pattern, difficulty\n');

  // Build source fingerprint map
  const sourceFpMap = new Map();
  for (const q of sourceRecords) {
    const fp = computeFingerprint(q);
    sourceFpMap.set(fp, q);
  }

  // Stream DB records and compare
  const cursor = Question.find({}).lean().cursor();
  let fpVerified = 0, fpMissing = 0;
  let topicMismatches = 0, patternMismatches = 0, diffMismatches = 0;

  for await (const doc of cursor) {
    const fp = computeFingerprint(doc);
    const src = sourceFpMap.get(fp);
    if (!src) {
      fpMissing++;
    } else {
      fpVerified++;
      if (doc.topic !== src.topic) topicMismatches++;
      if (doc.pattern !== src.pattern) patternMismatches++;
      if (doc.difficulty !== src.difficulty) diffMismatches++;
    }
  }

  check('Content fingerprints verified',       fpVerified,              EXPECTED.totalQuestions);
  check('Content fingerprint mismatches',      fpMissing,               0);
  check('Metadata topic mismatches',           topicMismatches,         0);
  check('Metadata pattern mismatches',         patternMismatches,       0);
  check('Metadata difficulty mismatches',      diffMismatches,          0);

  // ── 11. Indexes ────────────────────────────────────────────────────────────
  console.log('\n── MongoDB indexes ───────────────────────────────────────────');
  const indexes = await Question.collection.getIndexes();
  console.log(`  Index count: ${Object.keys(indexes).length}`);
  // ── 12. Verification Invariant Summary (Exact Specification Format) ───────
  console.log('\n── Phase 2 Verification Invariant Summary ────────────────────');
  console.log(`Questions: ${totalQuestions}\n`);
  console.log(`Canonical topics: ${totalTopics}\n`);
  console.log(`Canonical patterns: ${totalPatterns}\n`);
  console.log(`Legacy mappings: ${legacyMappings.length}\n`);
  console.log(`Patterns with prerequisites: ${dag.withPrereqs}\n`);
  console.log(`Foundational patterns: ${dag.foundational}\n`);
  console.log(`Prerequisite edges: ${dag.totalEdges}\n`);
  console.log(`Invalid prerequisite references: ${dag.invalidRefs.length}\n`);
  console.log(`Self prerequisite references: ${dag.selfRefs.length}\n`);
  console.log(`Prerequisite cycles: ${dag.cycles.length}\n`);
  console.log(`Canonical pattern collisions: ${collisions}\n`);
  console.log(`Invalid topic references: ${invalidTopicRefs + dbBadTopics}\n`);
  console.log(`Invalid pattern references: ${invalidPatternRefs + dbBadPatterns}\n`);
  console.log(`Topic-pattern ownership violations: ${topicPatternMismatches}\n`);
  console.log(`Invalid difficulty values: ${invalidDifficultyValues + dbBadDiff}\n`);
  console.log(`Empty question values: ${emptyQuestions + dbEmptyQ}\n`);
  console.log(`Empty answers: ${emptyAnswers + dbEmptyA}\n`);
  console.log(`Empty explanations: ${emptyExplanations + dbEmptyE}\n`);
  console.log(`Invalid option arrays: ${invalidOptionArrays}\n`);
  console.log(`Invalid option counts: ${invalidOptionCounts + dbBadOpts}\n`);
  console.log(`Answers not present in options: ${answerNotInOptions + dbAnswerNotInOptions}\n`);
  console.log(`Metadata mismatches: ${topicMismatches + patternMismatches + diffMismatches}\n`);
  console.log(`Content fingerprint mismatches: ${fpMissing}\n`);

  // ── Final report ───────────────────────────────────────────────────────────
  await mongoose.disconnect();

  console.log('\n═══════════════════════════════════════════════════════════');
  if (failures.length === 0) {
    console.log('  PHASE 2 VERIFICATION PASSED — all invariants satisfied');
  } else {
    console.log(`  PHASE 2 VERIFICATION FAILED — ${failures.length} invariant(s) not satisfied:`);
    failures.forEach((f) => console.log(`    ✗ ${f}`));
  }
  console.log('═══════════════════════════════════════════════════════════\n');

  process.exit(failures.length === 0 ? 0 : 1);
};

main().catch((err) => {
  console.error('Verification error:', err.message);
  mongoose.disconnect().finally(() => process.exit(1));
});
