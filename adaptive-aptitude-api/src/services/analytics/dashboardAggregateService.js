'use strict';

/**
 * Dashboard Aggregate Service
 *
 * Implements Section 13, 14, 15:
 *   - Bounded non-mock practice attempt summary (up to 1,000 attempts)
 *   - Completed mock count (terminal completed mocks only)
 *   - Active study plan summary with zero-denominator safety
 *   - Evidence-only topicMasteryRadar
 *   - Due revision count (strictly matching retention dueTodayCount)
 *   - Priority focus topics
 */

const Attempt = require('../../models/attemptModel');
const MockSession = require('../../models/mockSessionModel');
const StudyPlan = require('../../models/studyPlanModel');
const DailyObjective = require('../../models/dailyObjectiveModel');
const RevisionItem = require('../../models/revisionItemModel');
const {
  ANALYTICS_ALGORITHM_VERSION,
  MAX_ATTEMPTS_ANALYZED,
  NON_MOCK_ATTEMPT_SOURCES,
} = require('../../config/analyticsConfig');
const {
  roundTo,
  getLogicalDayBoundaries,
} = require('./analyticsMathUtils');
const {
  evaluateTopicDiagnostics,
  buildTopicMasteryRadar,
  computePriorityFocusTopics,
} = require('./topicDiagnosticsService');

/**
 * Computes dashboard aggregate analytics for a given user.
 *
 * @param {string} userId
 * @param {Date} referenceNow
 * @returns {Promise<Object>}
 */
const getDashboardAnalytics = async (userId, referenceNow) => {
  // 1. Practice Attempt Summary (bounded to 1,000 non-mock attempts)
  const nonMockAttempts = await Attempt.find({
    userId,
    source: { $in: NON_MOCK_ATTEMPT_SOURCES },
  })
    .sort({ attemptedAt: -1, _id: -1 })
    .limit(MAX_ATTEMPTS_ANALYZED)
    .lean();

  const attemptsAnalyzed = nonMockAttempts.length;
  const totalPracticeAttempts = attemptsAnalyzed;

  let overallAccuracy = null;
  if (attemptsAnalyzed > 0) {
    let correctCount = 0;
    for (const a of nonMockAttempts) {
      if (a.isCorrect === true) {
        correctCount += 1;
      }
    }
    overallAccuracy = roundTo((correctCount / attemptsAnalyzed) * 100, 1);
  }

  // 2. Terminal Completed Mocks Count
  const totalMocksCompleted = await MockSession.countDocuments({
    userId,
    status: { $in: ['submitted', 'expired'] },
    finalizationState: 'completed',
  });

  // 3. Active Study Plan Resolution (startDate descending, _id ascending)
  const activePlanDocs = await StudyPlan.find({
    userId,
    status: 'active',
  })
    .sort({ startDate: -1, _id: 1 })
    .limit(1)
    .lean();

  const activePlan = activePlanDocs.length > 0 ? activePlanDocs[0] : null;
  let activePlanSummary = null;

  if (activePlan) {
    const dailyObjectives = await DailyObjective.find({
      planId: activePlan._id,
      userId,
    }).lean();

    let totalTargetQuestions = 0;
    let totalCompletedQuestions = 0;

    for (const obj of dailyObjectives) {
      if (Array.isArray(obj.patterns)) {
        for (const p of obj.patterns) {
          if (p.targetQuestions && Number.isFinite(p.targetQuestions)) {
            totalTargetQuestions += p.targetQuestions;
          }
          if (p.completedQuestions && Number.isFinite(p.completedQuestions)) {
            totalCompletedQuestions += p.completedQuestions;
          }
        }
      }
    }

    let completionPercentage = null;
    if (totalTargetQuestions > 0) {
      const rawPercentage = Math.min(100.0, (totalCompletedQuestions / totalTargetQuestions) * 100);
      completionPercentage = roundTo(rawPercentage, 1);
    }

    activePlanSummary = {
      planId: String(activePlan._id),
      name: activePlan.name,
      startDate: activePlan.startDate || null,
      endDate: activePlan.endDate || null,
      completionPercentage,
      totalTargetQuestions,
      totalCompletedQuestions,
    };
  }

  // 4. Due Revision Count (strictly matching retention dueTodayCount)
  const { todayStartUtc, tomorrowStartUtc } = getLogicalDayBoundaries(referenceNow);

  const dueRevisionCount = await RevisionItem.countDocuments({
    userId,
    status: 'scheduled',
    nextReviewDate: {
      $gte: todayStartUtc,
      $lt: tomorrowStartUtc,
    },
  });

  // 5. Topic Diagnostics, Radar, and Priority Focus Topics
  const topicMetrics = await evaluateTopicDiagnostics(userId);
  const topicMasteryRadar = buildTopicMasteryRadar(topicMetrics);
  const priorityFocusTopics = await computePriorityFocusTopics(userId, activePlan, topicMetrics);

  return {
    userId,
    algorithmVersion: ANALYTICS_ALGORITHM_VERSION,
    summary: {
      totalPracticeAttempts,
      totalMocksCompleted,
      overallAccuracy,
      attemptsAnalyzed,
    },
    topicMasteryRadar,
    activePlanSummary,
    dueRevisionCount,
    priorityFocusTopics,
  };
};

module.exports = {
  getDashboardAnalytics,
};
