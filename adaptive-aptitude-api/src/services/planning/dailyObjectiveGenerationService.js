'use strict';

/**
 * Daily Objective Generation Service — Phase 5: Automated Planning Engine
 *
 * Generates horizon DailyObjectives satisfying:
 *   1. Single primary topic per logical date
 *   2. Up to maxPatternsPerDay patterns per day
 *   3. sum(targetQuestions) <= dailyQuestionBudget per day
 *   4. sum(targetMinutes) <= dailyMinutes per day
 *   5. targetDifficulty left unset for Phase 4 dynamic adaptation
 *   6. targetQuestions reconciled strictly with StudyPlan targets
 */

const {
  DEFAULT_DAILY_QUESTION_BUDGET,
  DEFAULT_DAILY_MINUTES,
  DEFAULT_MAX_PATTERNS_PER_DAY,
  DEFAULT_QUESTIONS_PER_PATTERN,
  PLANNING_REASON_CODES,
} = require('../../config/planningConfig');
const { addLogicalDays, normalizeLogicalDate } = require('../../utils/dateUtils');
const hierarchyService = require('../hierarchyService');

/**
 * Distributes a question budget deterministically across a list of patterns.
 * Example: 30 across 3 -> [10, 10, 10]
 *          20 across 3 -> [7, 7, 6]
 *
 * @param {number} totalQuestions
 * @param {number} patternCount
 * @returns {number[]}
 */
const distributeQuestions = (totalQuestions, patternCount) => {
  if (patternCount <= 0) return [];
  const base = Math.floor(totalQuestions / patternCount);
  let remainder = totalQuestions % patternCount;

  const allocation = [];
  for (let i = 0; i < patternCount; i++) {
    allocation.push(base + (remainder > 0 ? 1 : 0));
    if (remainder > 0) remainder--;
  }
  return allocation;
};

/**
 * Distributes daily minutes deterministically across patterns proportionally to questions.
 *
 * @param {number} totalMinutes
 * @param {number[]} questionAllocations
 * @returns {number[]}
 */
const distributeMinutes = (totalMinutes, questionAllocations) => {
  const totalQuestions = questionAllocations.reduce((sum, q) => sum + q, 0);
  if (totalQuestions === 0 || questionAllocations.length === 0) return [];

  let allocated = 0;
  const minutes = [];

  for (let i = 0; i < questionAllocations.length; i++) {
    if (i === questionAllocations.length - 1) {
      // Last pattern gets exact remaining minutes so sum === totalMinutes
      minutes.push(Math.max(1, totalMinutes - allocated));
    } else {
      const share = Math.round((questionAllocations[i] / totalQuestions) * totalMinutes);
      minutes.push(share);
      allocated += share;
    }
  }
  return minutes;
};

/**
 * Generates an array of staged DailyObjective document representations for a plan horizon.
 *
 * @param {Object} params
 * @param {string} params.userId
 * @param {Object|string} params.planId
 * @param {Object|string} params.goalId
 * @param {Date|string} params.startDate
 * @param {number} [params.days]
 * @param {Array<Date|string>} [params.targetDates] Explicit array of logical dates to generate for
 * @param {Array<Object>} params.orderedPatterns Topologically sorted pattern objects
 * @param {number} [params.dailyQuestionBudget=30]
 * @param {number} [params.dailyMinutes=60]
 * @param {number} [params.maxPatternsPerDay=3]
 * @returns {{
 *   objectives: Array<Object>,
 *   scheduledPatterns: Array<Object>,
 *   unscheduledPatterns: Array<Object>,
 *   patternQuestionTotals: Map<string, number>,
 *   capacityShortfall: boolean,
 *   reasonCodes: string[]
 * }}
 */
const generateDailyObjectivesForHorizon = ({
  userId,
  planId,
  goalId,
  startDate,
  days,
  targetDates,
  orderedPatterns,
  dailyQuestionBudget = DEFAULT_DAILY_QUESTION_BUDGET,
  dailyMinutes = DEFAULT_DAILY_MINUTES,
  maxPatternsPerDay = DEFAULT_MAX_PATTERNS_PER_DAY,
}) => {
  const normStart = normalizeLogicalDate(startDate);
  const dates = Array.isArray(targetDates) && targetDates.length > 0
    ? targetDates.map((d) => normalizeLogicalDate(d))
    : Array.from({ length: days || 0 }, (_, d) => addLogicalDays(normStart, d));

  const remaining = [...orderedPatterns];
  const scheduledPatterns = [];
  const patternQuestionTotals = new Map();
  const objectives = [];
  const scheduledPatternNames = new Set();
  const reasonCodes = new Set();

  for (let d = 0; d < dates.length; d++) {
    if (remaining.length === 0) break;

    const objectiveDate = dates[d];

    // Pick the topic of the first eligible pattern in remaining list
    // A pattern is eligible if all its prerequisites are already scheduled
    let eligibleIdx = -1;
    for (let i = 0; i < remaining.length; i++) {
      const p = remaining[i];
      const prereqs = hierarchyService.getPrerequisites(p.pattern) || [];
      const allPrereqsScheduled = prereqs.every(
        (pr) => !orderedPatterns.some((op) => op.pattern === pr) || scheduledPatternNames.has(pr)
      );
      if (allPrereqsScheduled) {
        eligibleIdx = i;
        break;
      }
    }

    if (eligibleIdx === -1) {
      // Fallback to front of queue if all have unresolved prerequisites
      eligibleIdx = 0;
    }

    const currentTopic = remaining[eligibleIdx].topic;

    // Collect up to maxPatternsPerDay for this day matching currentTopic and eligible
    const dayPatterns = [];
    const indicesToRemove = [];

    for (let i = 0; i < remaining.length; i++) {
      if (dayPatterns.length >= maxPatternsPerDay) break;
      const p = remaining[i];
      if (p.topic === currentTopic) {
        const prereqs = hierarchyService.getPrerequisites(p.pattern) || [];
        const allPrereqsScheduled = prereqs.every(
          (pr) =>
            !orderedPatterns.some((op) => op.pattern === pr) ||
            scheduledPatternNames.has(pr) ||
            dayPatterns.some((dp) => dp.pattern === pr)
        );
        if (allPrereqsScheduled) {
          dayPatterns.push(p);
          indicesToRemove.push(i);
        }
      }
    }

    // If none matched the topic with prerequisites satisfied, take the single eligible pattern
    if (dayPatterns.length === 0) {
      dayPatterns.push(remaining[eligibleIdx]);
      indicesToRemove.push(eligibleIdx);
    }

    // Remove chosen patterns from remaining list (reverse order so indices stay valid)
    indicesToRemove.sort((a, b) => b - a);
    for (const idx of indicesToRemove) {
      remaining.splice(idx, 1);
    }

    // Mark as scheduled
    for (const p of dayPatterns) {
      scheduledPatternNames.add(p.pattern);
      scheduledPatterns.push(p);
    }

    // Distribute questions and minutes for this day
    const questionAllocations = distributeQuestions(dailyQuestionBudget, dayPatterns.length);
    const minuteAllocations = distributeMinutes(dailyMinutes, questionAllocations);

    const patternsPayload = dayPatterns.map((p, idx) => {
      const targetQuestions = questionAllocations[idx];
      patternQuestionTotals.set(
        p.pattern,
        (patternQuestionTotals.get(p.pattern) || 0) + targetQuestions
      );

      return {
        pattern: p.pattern,
        targetQuestions,
        completedQuestions: 0,
        // targetDifficulty left unset for Phase 4 adaptive engine
        status: 'pending',
      };
    });

    objectives.push({
      userId,
      planId,
      goalId,
      date: objectiveDate,
      topic: currentTopic,
      patterns: patternsPayload,
      targetMinutes: dailyMinutes,
      actualMinutes: 0,
      status: 'pending',
    });
  }

  const unscheduledPatterns = remaining;
  const capacityShortfall = unscheduledPatterns.length > 0;

  if (capacityShortfall) {
    reasonCodes.add(PLANNING_REASON_CODES.CAPACITY_LIMIT_REACHED);
    reasonCodes.add(PLANNING_REASON_CODES.PLAN_PARTIALLY_SCHEDULED);
  } else {
    reasonCodes.add(PLANNING_REASON_CODES.PLAN_GENERATED);
  }

  return {
    objectives,
    scheduledPatterns,
    unscheduledPatterns,
    patternQuestionTotals,
    capacityShortfall,
    reasonCodes: Array.from(reasonCodes),
  };
};

module.exports = {
  distributeQuestions,
  distributeMinutes,
  generateDailyObjectivesForHorizon,
};
