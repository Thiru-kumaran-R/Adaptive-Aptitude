'use strict';

/**
 * tests/phase2_verification.test.js
 *
 * End-to-end data invariant verification tests.
 * Connects to the MAIN database (adaptive_aptitude via MONGODB_URI)
 * to verify that the imported dataset satisfies all Phase 2 invariants.
 *
 * These tests are intended to run AFTER the import has been completed:
 *   npm run import:questions -- --clean
 *   npm test
 *
 * If MONGODB_URI is not set or the database has no data, tests are skipped
 * with an explanatory message rather than failing.
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') });

const mongoose = require('mongoose');
const Question = require('../src/models/questionModel');
const registryService = require('../src/services/patternRegistryService');
const { validatePrerequisiteDAG } = require('../src/services/hierarchyService');

const EXPECTED_TOTAL = 12000;
const EXPECTED_TOPICS = 24;
const EXPECTED_PATTERNS = 278;
const EXPECTED_LEGACY_MAPPINGS = 308;
const EXPECTED_DIFFICULTY_DIST = {
  1: 1442, 2: 1415, 3: 1715, 4: 2018, 5: 1858,
  6: 1447, 7: 1085, 8: 738,  9: 214,  10: 68,
};

let dbAvailable = false;
let mainConnection;

beforeAll(async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.warn('[phase2_verification] MONGODB_URI not set — skipping DB tests');
    return;
  }
  try {
    // Use a separate connection so we don't interfere with the test DB connection
    mainConnection = await mongoose.createConnection(uri, {
      serverSelectionTimeoutMS: 8000,
    }).asPromise();

    const count = await mainConnection.model('Question', Question.schema).countDocuments();
    if (count === 0) {
      console.warn('[phase2_verification] adaptive_aptitude DB is empty — run import first');
      return;
    }
    dbAvailable = true;
  } catch (err) {
    console.warn('[phase2_verification] Cannot connect to main DB:', err.message);
  }
});

afterAll(async () => {
  if (mainConnection) {
    await mainConnection.close();
  }
});

const getModel = () => mainConnection.model('Question', Question.schema);

// ── Registry invariants (no DB needed) ────────────────────────────────────

describe('Registry invariants', () => {
  it('should have exactly 24 canonical topics', () => {
    const stats = registryService.getRegistryStats();
    expect(stats.topicCount).toBe(EXPECTED_TOPICS);
  });

  it('should have exactly 278 canonical patterns', () => {
    const stats = registryService.getRegistryStats();
    expect(stats.patternCount).toBe(EXPECTED_PATTERNS);
  });

  it('should have exactly 308 legacy mappings', () => {
    const stats = registryService.getRegistryStats();
    expect(stats.legacyMappingCount).toBe(EXPECTED_LEGACY_MAPPINGS);
  });

  it('canonical pattern names should be globally unique', () => {
    const registry = require('../src/data/canonicalPatternRegistry.json');
    const names = registry.flatMap((t) => (t.patterns || []).map((p) => p.name));
    expect(new Set(names).size).toBe(names.length);
  });

  it('all legacy mappings resolve to valid canonical references', () => {
    const legacyMappings = require('../src/data/legacyPatternMapping.json');
    const invalid = legacyMappings.filter(
      (m) =>
        !registryService.topicExists(m.canonicalTopic) ||
        !registryService.patternExists(m.canonicalPattern)
    );
    expect(invalid).toHaveLength(0);
  });
});

// ── Prerequisite DAG invariants (no DB needed) ────────────────────────────

describe('Prerequisite DAG invariants', () => {
  let dagReport;

  beforeAll(() => {
    dagReport = validatePrerequisiteDAG();
  });

  it('should have 218 patterns with prerequisites', () => {
    expect(dagReport.withPrerequisites).toBe(218);
  });

  it('should have 60 foundational patterns', () => {
    expect(dagReport.foundational).toBe(60);
  });

  it('should have 410 prerequisite edges', () => {
    expect(dagReport.totalEdges).toBe(410);
  });

  it('should have 0 invalid prerequisite references', () => {
    expect(dagReport.invalidReferences).toHaveLength(0);
  });

  it('should have 0 self-references', () => {
    expect(dagReport.selfReferences).toHaveLength(0);
  });

  it('should have 0 cycles', () => {
    expect(dagReport.cycles).toHaveLength(0);
  });
});

// ── Database invariants (require imported data) ────────────────────────────

describe('Database invariants (requires import)', () => {
  beforeEach(() => {
    if (!dbAvailable) {
      pending('Database not available — run import first');
    }
  });

  it('should have exactly 12,000 total questions', async () => {
    const Q = getModel();
    const count = await Q.countDocuments();
    expect(count).toBe(EXPECTED_TOTAL);
  });

  it('topic totals should sum to 12,000', async () => {
    const Q = getModel();
    const agg = await Q.aggregate([
      { $group: { _id: '$topic', count: { $sum: 1 } } },
    ]);
    const total = agg.reduce((s, t) => s + t.count, 0);
    expect(total).toBe(EXPECTED_TOTAL);
  });

  it('should have exactly 24 distinct topics in the database', async () => {
    const Q = getModel();
    const topics = await Q.distinct('topic');
    expect(topics.length).toBe(EXPECTED_TOPICS);
  });

  it('each topic in DB matches a canonical topic', async () => {
    const Q = getModel();
    const topics = await Q.distinct('topic');
    for (const t of topics) {
      expect(registryService.topicExists(t)).toBe(true);
    }
  });

  it('difficulty distribution matches Phase 2 invariants', async () => {
    const Q = getModel();
    const agg = await Q.aggregate([
      { $group: { _id: '$difficulty', count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    const actual = {};
    for (const entry of agg) {
      actual[entry._id] = entry.count;
    }

    for (let d = 1; d <= 10; d++) {
      expect(actual[d]).toBe(EXPECTED_DIFFICULTY_DIST[d]);
    }
  });

  it('every question has exactly 4 options', async () => {
    const Q = getModel();
    const badCount = await Q.countDocuments({
      $expr: { $ne: [{ $size: '$options' }, 4] },
    });
    expect(badCount).toBe(0);
  });

  it('every question has a valid difficulty (integer 1–10)', async () => {
    const Q = getModel();
    const badCount = await Q.countDocuments({
      $or: [
        { difficulty: { $lt: 1 } },
        { difficulty: { $gt: 10 } },
      ],
    });
    expect(badCount).toBe(0);
  });

  it('every question topic exists in canonical registry', async () => {
    const Q = getModel();
    const allTopics = registryService.getAllTopics();
    const invalidCount = await Q.countDocuments({
      topic: { $nin: allTopics },
    });
    expect(invalidCount).toBe(0);
  });

  it('every question pattern exists in canonical registry', async () => {
    const Q = getModel();
    const legacyMappings = require('../src/data/legacyPatternMapping.json');
    const allPatterns = legacyMappings.map((m) => m.canonicalPattern);
    const invalidCount = await Q.countDocuments({
      pattern: { $nin: allPatterns },
    });
    expect(invalidCount).toBe(0);
  });

  it('import did not introduce mentor/teacher/adaptive Phase 3+ fields', async () => {
    const Q = getModel();
    // These fields must not exist on any document
    const withMentor = await Q.countDocuments({ mentor: { $exists: true } });
    const withTeacher = await Q.countDocuments({ teacher: { $exists: true } });
    const withGoalId = await Q.countDocuments({ goalId: { $exists: true } });
    const withMastery = await Q.countDocuments({ mastery: { $exists: true } });

    expect(withMentor).toBe(0);
    expect(withTeacher).toBe(0);
    expect(withGoalId).toBe(0);
    expect(withMastery).toBe(0);
  });
});
