'use strict';

/**
 * Retention Analytics Service
 *
 * Implements Section 14, 17, 25:
 *   - Current factual RevisionItem state using UTC logical-day boundaries
 *   - Bounded historical revision attempt observation scanning (up to 1,000 attempts)
 *   - Lexicographical predecessor anchor search with boundary-recovery query beyond 1,000
 *   - Half-open gap bucket partitioning [0.5, 1.5), [1.5, 4.5), ...
 *   - Strict retention accounting identity:
 *     revisionAttemptsAnalyzed === bucketedCount + excludedNoPrior + excludedShortGap + excludedInvalidChronology
 */

const RevisionItem = require('../../models/revisionItemModel');
const Attempt = require('../../models/attemptModel');
const {
  ANALYTICS_ALGORITHM_VERSION,
  MAX_ATTEMPTS_ANALYZED,
  RETENTION_GAP_BUCKETS,
} = require('../../config/analyticsConfig');
const {
  roundTo,
  getLogicalDayBoundaries,
} = require('./analyticsMathUtils');

/**
 * Computes retention analytics for a given user.
 *
 * @param {string} userId
 * @param {Date} referenceNow
 * @returns {Promise<Object>}
 */
const getRetentionAnalytics = async (userId, referenceNow) => {
  // 1. Current State Calculations using UTC logical-day boundaries
  const { todayStartUtc, tomorrowStartUtc } = getLogicalDayBoundaries(referenceNow);

  const [activeItems, completedRevisionItems, dueTodayCount, overdueCount] = await Promise.all([
    RevisionItem.find({ userId, status: 'scheduled' }).lean(),
    RevisionItem.countDocuments({ userId, status: 'completed' }),
    RevisionItem.countDocuments({
      userId,
      status: 'scheduled',
      nextReviewDate: { $gte: todayStartUtc, $lt: tomorrowStartUtc },
    }),
    RevisionItem.countDocuments({
      userId,
      status: 'scheduled',
      nextReviewDate: { $lt: todayStartUtc },
    }),
  ]);

  const activeRevisionItems = activeItems.length;

  const stageDistribution = {
    stage0_1day: 0,
    stage1_3days: 0,
    stage2_7days: 0,
    stage3_14days: 0,
    stage4_30days: 0,
  };

  for (const item of activeItems) {
    if (item.stage === 0) stageDistribution.stage0_1day += 1;
    else if (item.stage === 1) stageDistribution.stage1_3days += 1;
    else if (item.stage === 2) stageDistribution.stage2_7days += 1;
    else if (item.stage === 3) stageDistribution.stage3_14days += 1;
    else if (item.stage === 4) stageDistribution.stage4_30days += 1;
  }

  // 2. Observation History & Gap Analysis
  const loadedAttempts = await Attempt.find({ userId })
    .sort({ attemptedAt: -1, _id: -1 })
    .limit(MAX_ATTEMPTS_ANALYZED)
    .lean();

  // Sort ascending by attemptedAt, then _id
  loadedAttempts.sort((a, b) => {
    const timeDiff = new Date(a.attemptedAt).getTime() - new Date(b.attemptedAt).getTime();
    if (timeDiff !== 0) return timeDiff;
    return String(a._id).localeCompare(String(b._id));
  });

  // Identify revision observation candidates
  let revisionAttemptsAnalyzed = 0;
  let excludedNoPriorAttemptCount = 0;
  let excludedShortGapCount = 0;
  let excludedInvalidChronologyCount = 0;

  // Initialize bucket tracking
  const bucketCounts = new Map();
  for (const b of RETENTION_GAP_BUCKETS) {
    bucketCounts.set(b.key, { totalEvents: 0, correctEvents: 0 });
  }

  for (let i = 0; i < loadedAttempts.length; i++) {
    const aCurrent = loadedAttempts[i];
    if (aCurrent.source !== 'revision') {
      continue;
    }

    revisionAttemptsAnalyzed += 1;

    // Search loadedAttempts for immediately preceding attempt with same (userId, topic, pattern)
    let aPrev = null;
    const currentAttemptedTime = new Date(aCurrent.attemptedAt).getTime();
    const currentIdStr = String(aCurrent._id);

    for (let j = i - 1; j >= 0; j--) {
      const candidate = loadedAttempts[j];
      if (candidate.topic === aCurrent.topic && candidate.pattern === aCurrent.pattern) {
        const candTime = new Date(candidate.attemptedAt).getTime();
        const candIdStr = String(candidate._id);
        const isPreceding = candTime < currentAttemptedTime || (candTime === currentAttemptedTime && candIdStr < currentIdStr);
        if (isPreceding) {
          aPrev = candidate;
          break;
        }
      }
    }

    // Boundary recovery if no predecessor in loaded attempts
    if (!aPrev) {
      const recoveredAnchor = await Attempt.findOne({
        userId,
        topic: aCurrent.topic,
        pattern: aCurrent.pattern,
        $or: [
          { attemptedAt: { $lt: aCurrent.attemptedAt } },
          { attemptedAt: aCurrent.attemptedAt, _id: { $lt: aCurrent._id } },
        ],
      })
        .sort({ attemptedAt: -1, _id: -1 })
        .lean();

      if (recoveredAnchor) {
        aPrev = recoveredAnchor;
      }
    }

    // Categorize into exactly one category
    if (!aPrev) {
      excludedNoPriorAttemptCount += 1;
      continue;
    }

    const prevAttemptedTime = new Date(aPrev.attemptedAt).getTime();
    const gapDays = (currentAttemptedTime - prevAttemptedTime) / 86400000;

    if (gapDays <= 0) {
      excludedInvalidChronologyCount += 1;
      continue;
    }

    if (gapDays < 0.5) {
      excludedShortGapCount += 1;
      continue;
    }

    // Half-open bucket assignment [minDaysInclusive, maxDaysExclusive)
    let matchedBucketKey = null;
    for (const b of RETENTION_GAP_BUCKETS) {
      if (gapDays >= b.minDaysInclusive && gapDays < b.maxDaysExclusive) {
        matchedBucketKey = b.key;
        break;
      }
    }

    if (matchedBucketKey) {
      const bData = bucketCounts.get(matchedBucketKey);
      bData.totalEvents += 1;
      if (aCurrent.isCorrect === true) {
        bData.correctEvents += 1;
      }
    }
  }

  // Populate observedRetentionByGap with only populated buckets
  const observedRetentionByGap = [];
  for (const b of RETENTION_GAP_BUCKETS) {
    const bData = bucketCounts.get(b.key);
    if (bData.totalEvents > 0) {
      const observedRetentionRate = roundTo((bData.correctEvents / bData.totalEvents) * 100, 1);
      observedRetentionByGap.push({
        gapBucket: b.key,
        totalEvents: bData.totalEvents,
        correctEvents: bData.correctEvents,
        observedRetentionRate,
      });
    }
  }

  return {
    userId,
    algorithmVersion: ANALYTICS_ALGORITHM_VERSION,
    currentState: {
      activeRevisionItems,
      completedRevisionItems,
      dueTodayCount,
      overdueCount,
      stageDistribution,
    },
    observedRetentionByGap,
    evidence: {
      revisionAttemptsAnalyzed,
      excludedNoPriorAttemptCount,
      excludedShortGapCount,
      excludedInvalidChronologyCount,
    },
  };
};

module.exports = {
  getRetentionAnalytics,
};
