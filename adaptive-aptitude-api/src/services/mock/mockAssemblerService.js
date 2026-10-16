'use strict';

/**
 * mockAssemblerService.js — Deterministic Question Assembler & Allocation Engine
 *
 * Implements:
 * 1. Standard mode pattern allocation (canonical registry order, largest-remainder)
 * 2. Diagnostic mode pattern allocation (4-bucket partition, 5-tier comparator)
 * 3. Deterministic difficulty allocation (largest-remainder integer division)
 * 4. Bounded recent question exclusion (up to 50 attempts across complete history)
 * 5. Deterministic candidate query ({ _id: 1 }) + seeded Fisher-Yates PRNG
 * 6. Strict session-wide question uniqueness invariant (selectedQuestionIds = new Set())
 * 7. Zero silent relaxation shortfall safety (INSUFFICIENT_QUESTIONS_FOR_MOCK)
 */

const Question = require('../../models/questionModel');
const Attempt = require('../../models/attemptModel');
const StudentProgress = require('../../models/studentProgressModel');
const registryService = require('../patternRegistryService');
const AppError = require('../../utils/AppError');
const {
  MOCK_MODES,
  DIFFICULTY_BANDS,
  DEFAULT_DIFFICULTY_DISTRIBUTION,
  MOCK_RECENT_QUESTION_EXCLUSION_LIMIT,
  DIAGNOSTIC_THRESHOLDS,
  MOCK_ERROR_CODES,
} = require('../../config/mockConfig');

/**
 * Creates a deterministic 32-bit PRNG from a seed string (Mulberry32).
 */
const createPrng = (seedStr) => {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seedStr.length; i++) {
    h = Math.imul(h ^ seedStr.charCodeAt(i), 16777619) >>> 0;
  }
  return () => {
    h = Math.imul(h ^ (h >>> 15), 1 | h);
    h = (h + Math.imul(h ^ (h >>> 7), 61 | h)) ^ h;
    return ((h ^ (h >>> 14)) >>> 0) / 4294967296;
  };
};

/**
 * Deterministic Fisher-Yates shuffle using a seeded PRNG.
 */
const seededShuffle = (array, prng) => {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(prng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

/**
 * Resolves all eligible canonical pattern pairs { topic, pattern } for a section scope.
 * Returned in canonical registry order.
 */
const resolveScopePatternsInRegistryOrder = (scope) => {
  if (scope.allCanonicalPatterns) {
    return registryService.getAllCanonicalPatterns();
  }

  const allCanonical = registryService.getAllCanonicalPatterns();

  if (scope.patterns && scope.patterns.length > 0) {
    const patternSet = new Set(scope.patterns);
    return allCanonical.filter((item) => patternSet.has(item.pattern));
  }

  if (scope.topics && scope.topics.length > 0) {
    const topicSet = new Set(scope.topics);
    return allCanonical.filter((item) => topicSet.has(item.topic));
  }

  return [];
};

/**
 * Allocates integer counts of questions across items using largest-remainder method.
 *
 * @param {number} totalQuestions
 * @param {Array<number>} weights Array of floating weights summing to 1.0
 * @returns {Array<number>} Array of integer allocations
 */
const allocateLargestRemainder = (totalQuestions, weights) => {
  const floats = weights.map((w) => totalQuestions * w);
  const integers = floats.map((f) => Math.floor(f));
  let allocated = integers.reduce((sum, n) => sum + n, 0);
  let remainder = totalQuestions - allocated;

  const remainders = floats.map((f, idx) => ({
    idx,
    fraction: f - integers[idx],
  }));

  remainders.sort((a, b) => b.fraction - a.fraction || a.idx - b.idx);

  for (let i = 0; i < remainder; i++) {
    integers[remainders[i].idx] += 1;
  }

  return integers;
};

/**
 * Authoritative 5-tier diagnostic comparator for sorting patterns within a bucket:
 * 1. Lower mastery first
 * 2. Fewer attempts first
 * 3. Canonical registry order (derived from patternRegistry.json index)
 * 4. Lexicographical pattern name fallback
 */
const comparePatternsInBucket = (a, b) => {
  if (Math.abs(a.mastery - b.mastery) > 0.00001) {
    return a.mastery - b.mastery;
  }
  if (a.attempts !== b.attempts) {
    return a.attempts - b.attempts;
  }
  if (a.registryIndex !== b.registryIndex) {
    return a.registryIndex - b.registryIndex;
  }
  return a.pattern.localeCompare(b.pattern);
};

/**
 * Performs pattern allocation for a section based on blueprint mode.
 */
const allocatePatternsForSection = async ({ section, mode, userId }) => {
  const eligiblePairs = resolveScopePatternsInRegistryOrder(section.scope);
  if (eligiblePairs.length === 0) {
    throw new AppError(
      400,
      MOCK_ERROR_CODES.INSUFFICIENT_QUESTIONS_FOR_MOCK,
      `Section "${section.sectionId}" scope has 0 eligible canonical patterns.`
    );
  }

  const Q = section.questionCount;

  if (mode === MOCK_MODES.STANDARD) {
    const P = eligiblePairs.length;
    let allocations;
    if (P <= Q) {
      const B = Math.floor(Q / P);
      const R = Q % P;
      allocations = eligiblePairs.map((pair, idx) => ({
        topic: pair.topic,
        pattern: pair.pattern,
        questionCount: idx < R ? B + 1 : B,
      }));
    } else {
      allocations = eligiblePairs.map((pair, idx) => ({
        topic: pair.topic,
        pattern: pair.pattern,
        questionCount: idx < Q ? 1 : 0,
      }));
    }
    return allocations.filter((a) => a.questionCount > 0);
  }

  // DIAGNOSTIC MODE: Personalized ranking via 4 buckets and 5-tier comparator
  const patternProgressList = await Promise.all(
    eligiblePairs.map(async (pair) => {
      let progress = null;
      if (userId) {
        progress = await StudentProgress.findOne({
          userId,
          topic: pair.topic,
          pattern: pair.pattern,
        }).lean();
      }

      const mastery = progress?.mastery ?? 0;
      const attempts = progress?.attempts ?? progress?.totalAttempts ?? 0;
      const registryIndex = registryService.getPatternRegistryIndex(pair.pattern);

      return {
        topic: pair.topic,
        pattern: pair.pattern,
        mastery,
        attempts,
        registryIndex,
      };
    })
  );

  const weakBucket = [];
  const unseenBucket = [];
  const developingBucket = [];
  const masteredBucket = [];

  for (const item of patternProgressList) {
    if (item.attempts === 0) {
      unseenBucket.push(item);
    } else if (item.mastery < DIAGNOSTIC_THRESHOLDS.WEAK_MASTERY_UPPER_BOUND) {
      weakBucket.push(item);
    } else if (item.mastery < DIAGNOSTIC_THRESHOLDS.DEVELOPING_MASTERY_UPPER_BOUND) {
      developingBucket.push(item);
    } else {
      masteredBucket.push(item);
    }
  }

  weakBucket.sort(comparePatternsInBucket);
  unseenBucket.sort(comparePatternsInBucket);
  developingBucket.sort(comparePatternsInBucket);
  masteredBucket.sort(comparePatternsInBucket);

  const rankedPatterns = [
    ...weakBucket,
    ...unseenBucket,
    ...developingBucket,
    ...masteredBucket,
  ];

  const K = Math.min(Q, rankedPatterns.length);
  const selectedPatterns = rankedPatterns.slice(0, K);

  const B = Math.floor(Q / K);
  const R = Q % K;

  return selectedPatterns.map((item, idx) => ({
    topic: item.topic,
    pattern: item.pattern,
    questionCount: idx < R ? B + 1 : B,
    diagnosticBucket:
      item.attempts === 0
        ? 'Unseen'
        : item.mastery < DIAGNOSTIC_THRESHOLDS.WEAK_MASTERY_UPPER_BOUND
        ? 'Weak'
        : item.mastery < DIAGNOSTIC_THRESHOLDS.DEVELOPING_MASTERY_UPPER_BOUND
        ? 'Developing'
        : 'Mastered',
    mastery: item.mastery,
    attempts: item.attempts,
  }));
};

/**
 * Loads recent attempt question IDs for exclusion (bounded at 50).
 */
const loadExcludedRecentQuestionIds = async (userId, effectiveExcludeRecentQuestions) => {
  if (!effectiveExcludeRecentQuestions || !userId) {
    return new Set();
  }

  const recentAttempts = await Attempt.find({ userId })
    .sort({ attemptedAt: -1 })
    .limit(MOCK_RECENT_QUESTION_EXCLUSION_LIMIT)
    .select('questionId')
    .lean();

  return new Set(recentAttempts.map((a) => a.questionId.toString()));
};

/**
 * Deterministically assembles the full session question sequence according to
 * blueprint sections, allocations, PRNG seed, and strict session-wide uniqueness.
 *
 * @param {Object} params
 * @param {Object} params.blueprint Normalized MockBlueprint
 * @param {string} params.userId Student user ID
 * @param {string} params.generationSeed Deterministic PRNG seed string
 * @param {boolean} [params.dryRun=false] If true, verifies question availability without returning full sequence
 * @returns {Promise<{ questionSequence: Array<Object>, sectionStates: Array<Object> }>}
 */
const assembleMockSessionQuestions = async ({ blueprint, userId, generationSeed, dryRun = false }) => {
  const prng = createPrng(generationSeed);
  const effectiveExcludeRecent = blueprint.effectiveExcludeRecentQuestions;
  const excludedRecentIds = await loadExcludedRecentQuestionIds(userId, effectiveExcludeRecent);

  // Invariant 5.5: Single session-wide set of selected question IDs
  const selectedQuestionIds = new Set();
  const fullQuestionSequence = [];
  let globalOrder = 0;

  for (let sIdx = 0; sIdx < blueprint.sections.length; sIdx++) {
    const section = blueprint.sections[sIdx];
    const diffDist = section.difficultyDistribution || DEFAULT_DIFFICULTY_DISTRIBUTION;

    // 1. Allocate questions per pattern
    const patternAllocations = await allocatePatternsForSection({
      section,
      mode: blueprint.mode,
      userId,
    });

    for (const alloc of patternAllocations) {
      const { topic, pattern, questionCount } = alloc;

      // 2. Integer difficulty allocation per pattern
      const diffWeights = [diffDist.easy, diffDist.medium, diffDist.hard];
      const [easyCount, mediumCount, hardCount] = allocateLargestRemainder(questionCount, diffWeights);

      const bandRequirements = [
        { band: DIFFICULTY_BANDS.EASY, count: easyCount },
        { band: DIFFICULTY_BANDS.MEDIUM, count: mediumCount },
        { band: DIFFICULTY_BANDS.HARD, count: hardCount },
      ];

      for (const req of bandRequirements) {
        if (req.count <= 0) continue;

        // Query candidates sorted by _id: 1 for baseline stabilization
        const candidates = await Question.find({
          topic,
          pattern,
          difficulty: { $gte: req.band.min, $lte: req.band.max },
        })
          .sort({ _id: 1 })
          .select('_id topic pattern difficulty question options')
          .lean();

        // Filter out candidates already selected in this session or in recent exclusions
        const eligibleCandidates = candidates.filter((c) => {
          const idStr = c._id.toString();
          if (selectedQuestionIds.has(idStr)) return false;
          if (excludedRecentIds.has(idStr)) return false;
          return true;
        });

        if (eligibleCandidates.length < req.count) {
          throw new AppError(
            400,
            MOCK_ERROR_CODES.INSUFFICIENT_QUESTIONS_FOR_MOCK,
            `Insufficient available questions for topic "${topic}", pattern "${pattern}", difficulty band "${req.band.label}" in section "${section.sectionId}". Required: ${req.count}, Available: ${eligibleCandidates.length}.`
          );
        }

        // Deterministically shuffle candidates using seeded PRNG
        const shuffled = seededShuffle(eligibleCandidates, prng);
        const selected = shuffled.slice(0, req.count);

        for (const q of selected) {
          const idStr = q._id.toString();
          selectedQuestionIds.add(idStr);

          if (!dryRun) {
            fullQuestionSequence.push({
              questionId: q._id,
              sectionId: section.sectionId,
              order: globalOrder++,
              topic: q.topic,
              pattern: q.pattern,
              difficulty: q.difficulty,
            });
          }
        }
      }
    }
  }

  // Initialize section states
  const sectionStates = blueprint.sections.map((sec, idx) => ({
    sectionId: sec.sectionId,
    order: idx,
    status: 'pending', // Will be set to in_progress on session start
    startedAt: null,
    expiresAt: null,
    completedAt: null,
    durationMinutes: sec.durationMinutes,
    questionCount: sec.questionCount,
  }));

  return {
    questionSequence: fullQuestionSequence,
    sectionStates,
  };
};

module.exports = {
  createPrng,
  seededShuffle,
  resolveScopePatternsInRegistryOrder,
  allocateLargestRemainder,
  comparePatternsInBucket,
  allocatePatternsForSection,
  loadExcludedRecentQuestionIds,
  assembleMockSessionQuestions,
};
