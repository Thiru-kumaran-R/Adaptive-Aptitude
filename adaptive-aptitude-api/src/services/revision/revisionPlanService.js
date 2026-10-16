'use strict';

/**
 * Revision Plan Service — Phase 5: Spaced Revision Engine
 *
 * Generates 1-day and 2-day revision plans by prioritizing:
 *   1. Overdue RevisionItems
 *   2. RevisionItems due today
 *   3. Supplemental recent incorrect weak patterns (mastery < 0.70 within lookback window)
 *
 * Workload is strictly bounded by daily question budgets and patterns-per-day limits.
 * Response is a non-persisted projection.
 */

const Attempt = require('../../models/attemptModel');
const StudentProgress = require('../../models/studentProgressModel');
const { getDueRevisions, getPatternRegistryIndex } = require('./revisionQueryService');
const {
  DEFAULT_REVISION_QUESTION_BUDGET,
  MIN_REVISION_QUESTION_BUDGET,
  MAX_REVISION_QUESTION_BUDGET,
  DEFAULT_REVISION_PATTERNS_PER_DAY,
  MIN_REVISION_PATTERNS_PER_DAY,
  MAX_REVISION_PATTERNS_PER_DAY,
  REVISION_RECENT_INCORRECT_LOOKBACK_DAYS,
  REVISION_REASON_CODES,
  REVISION_ALGORITHM_VERSION,
} = require('../../config/revisionConfig');
const {
  getLogicalToday,
  addLogicalDays,
  formatLogicalDate,
} = require('../../utils/dateUtils');
const { userExists } = require('../userService');
const { assertPlanOwnership } = require('../studyPlanService');
const { assertGoalOwnership } = require('../goalService');
const registryService = require('../patternRegistryService');

/**
 * Distributes a question budget deterministically across a list of patterns.
 *
 * @param {number} totalQuestions
 * @param {number} patternCount
 * @returns {number[]} Array of question counts per pattern
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
 * Finds supplemental recent incorrect weak patterns for a user
 * that are not already present in the due items list.
 *
 * @param {string} userId
 * @param {Set<string>} existingPatternKeys
 * @param {Date} referenceDate
 * @param {string} [topicFilter]
 * @returns {Promise<Array<Object>>}
 */
const findRecentIncorrectWeakPatterns = async (userId, existingPatternKeys, referenceDate, topicFilter) => {
  const lookbackStart = addLogicalDays(referenceDate, -REVISION_RECENT_INCORRECT_LOOKBACK_DAYS);

  const attemptQuery = {
    userId,
    isCorrect: false,
    attemptedAt: { $gte: lookbackStart },
  };
  if (topicFilter) attemptQuery.topic = topicFilter;

  const recentIncorrect = await Attempt.find(attemptQuery).sort({ attemptedAt: -1 }).lean();

  const candidateKeys = new Set();
  const candidateList = [];

  for (const att of recentIncorrect) {
    const key = `${att.topic}:::${att.pattern}`;
    if (!existingPatternKeys.has(key) && !candidateKeys.has(key)) {
      candidateKeys.add(key);
      candidateList.push({ topic: att.topic, pattern: att.pattern });
    }
  }

  if (candidateList.length === 0) return [];

  // Fetch progress to confirm weak status (mastery < 0.70)
  const progressDocs = await StudentProgress.find({
    userId,
    $or: candidateList,
  }).lean();

  const progressMap = new Map();
  for (const p of progressDocs) {
    progressMap.set(`${p.topic}:::${p.pattern}`, p);
  }

  const weakItems = [];
  for (const cand of candidateList) {
    const key = `${cand.topic}:::${cand.pattern}`;
    const prog = progressMap.get(key);
    const mastery = prog?.mastery || 0;

    // Phase 4 weak pattern definition: mastery < 0.70
    if (mastery < 0.70) {
      weakItems.push({
        topic: cand.topic,
        pattern: cand.pattern,
        mastery,
        reasonCode: REVISION_REASON_CODES.RECENT_INCORRECT_WEAK,
        registryIndex: getPatternRegistryIndex(cand.pattern),
      });
    }
  }

  // Sort weak candidates by mastery ascending, registry index
  weakItems.sort((a, b) => {
    if (a.mastery !== b.mastery) return a.mastery - b.mastery;
    if (a.registryIndex !== b.registryIndex) return a.registryIndex - b.registryIndex;
    return a.pattern.localeCompare(b.pattern);
  });

  return weakItems;
};

/**
 * Generates a 1-day or 2-day revision plan projection.
 *
 * @param {string} userId
 * @param {Object} [options]
 * @param {number} [options.days=1] 1 or 2
 * @param {number} [options.questionBudget=20] Total daily question budget
 * @param {number} [options.patternsPerDay=4] Max patterns per day
 * @param {Date|string} [options.referenceDate] Injectable clock
 * @param {string} [options.topic] Optional topic filter
 * @param {string} [options.planId] Optional study plan ID
 * @param {string} [options.goalId] Optional goal ID
 * @returns {Promise<Object>}
 */
const generateRevisionPlan = async (userId, options = {}) => {
  if (!userId) {
    const err = new Error('userId is required.');
    err.statusCode = 400;
    err.code = 'VALIDATION_ERROR';
    throw err;
  }

  if (!(await userExists(userId))) {
    const err = new Error(`User "${userId}" not found.`);
    err.statusCode = 404;
    err.code = 'USER_NOT_FOUND';
    throw err;
  }

  if (options.planId) await assertPlanOwnership(options.planId, userId);
  if (options.goalId) await assertGoalOwnership(options.goalId, userId);

  if (options.topic) {
    if (!registryService.topicExists(options.topic)) {
      const err = new Error(`Topic "${options.topic}" is not a canonical topic.`);
      err.statusCode = 400;
      err.code = 'INVALID_TOPIC';
      throw err;
    }
  }

  const days =
    options.days !== undefined && options.days !== null && options.days !== ''
      ? Number(options.days)
      : 1;
  if (!Number.isInteger(days) || (days !== 1 && days !== 2)) {
    const err = new Error('Revision plan days must be either 1 or 2.');
    err.statusCode = 400;
    err.code = 'INVALID_DAYS';
    throw err;
  }

  let questionBudget = DEFAULT_REVISION_QUESTION_BUDGET;
  if (
    options.questionBudget !== undefined &&
    options.questionBudget !== null &&
    options.questionBudget !== ''
  ) {
    const rawBudget = Number(options.questionBudget);
    if (
      !Number.isInteger(rawBudget) ||
      rawBudget < MIN_REVISION_QUESTION_BUDGET ||
      rawBudget > MAX_REVISION_QUESTION_BUDGET
    ) {
      const err = new Error(
        `questionBudget must be an integer between ${MIN_REVISION_QUESTION_BUDGET} and ${MAX_REVISION_QUESTION_BUDGET}.`
      );
      err.statusCode = 400;
      err.code = 'INVALID_QUESTION_BUDGET';
      throw err;
    }
    questionBudget = rawBudget;
  }

  let patternsPerDay = DEFAULT_REVISION_PATTERNS_PER_DAY;
  if (
    options.patternsPerDay !== undefined &&
    options.patternsPerDay !== null &&
    options.patternsPerDay !== ''
  ) {
    const rawPatterns = Number(options.patternsPerDay);
    if (
      !Number.isInteger(rawPatterns) ||
      rawPatterns < MIN_REVISION_PATTERNS_PER_DAY ||
      rawPatterns > MAX_REVISION_PATTERNS_PER_DAY
    ) {
      const err = new Error(
        `patternsPerDay must be an integer between ${MIN_REVISION_PATTERNS_PER_DAY} and ${MAX_REVISION_PATTERNS_PER_DAY}.`
      );
      err.statusCode = 400;
      err.code = 'INVALID_PATTERNS_PER_DAY';
      throw err;
    }
    patternsPerDay = rawPatterns;
  }

  let referenceDate;
  try {
    referenceDate = getLogicalToday(options.referenceDate || options.date);
  } catch (e) {
    const err = new Error('Invalid date provided.');
    err.statusCode = 400;
    err.code = 'INVALID_DATE';
    throw err;
  }
  const maxTotalPatterns = days * patternsPerDay;

  // 1. Fetch due revisions (Sources 1 & 2: Overdue and Due Today)
  const dueItems = await getDueRevisions(userId, {
    date: referenceDate,
    topic: options.topic,
    planId: options.planId,
    goalId: options.goalId,
    limit: maxTotalPatterns,
  });

  const selectedPatterns = [...dueItems];
  const existingKeys = new Set(selectedPatterns.map((i) => `${i.topic}:::${i.pattern}`));

  // 2. If capacity remains, supplement with Source 3 (Recent Incorrect Weak patterns)
  if (selectedPatterns.length < maxTotalPatterns) {
    const needed = maxTotalPatterns - selectedPatterns.length;
    const weakItems = await findRecentIncorrectWeakPatterns(
      userId,
      existingKeys,
      referenceDate,
      options.topic
    );
    selectedPatterns.push(...weakItems.slice(0, needed));
  }

  // 3. Partition across days
  const schedule = [];

  for (let d = 0; d < days; d++) {
    const dayDate = addLogicalDays(referenceDate, d);
    const dayPatternsSlice = selectedPatterns.slice(d * patternsPerDay, (d + 1) * patternsPerDay);

    const patternCounts = distributeQuestions(questionBudget, dayPatternsSlice.length);

    const patternsWithCounts = dayPatternsSlice.map((p, idx) => ({
      topic: p.topic,
      pattern: p.pattern,
      targetQuestions: patternCounts[idx] || 0,
      mastery: p.mastery,
      reasonCode: p.reasonCode,
      status: p.status || 'scheduled',
      nextReviewDate: p.nextReviewDate ? formatLogicalDate(p.nextReviewDate) : null,
    }));

    const dayTotalQuestions = patternCounts.reduce((sum, n) => sum + n, 0);

    schedule.push({
      dayNumber: d + 1,
      date: formatLogicalDate(dayDate),
      totalQuestions: dayTotalQuestions,
      patternCount: patternsWithCounts.length,
      patterns: patternsWithCounts,
    });
  }

  const totalQuestions = schedule.reduce((sum, day) => sum + day.totalQuestions, 0);

  return {
    algorithmVersion: REVISION_ALGORITHM_VERSION,
    userId,
    days,
    dailyQuestionBudget: questionBudget,
    maxPatternsPerDay: patternsPerDay,
    totalQuestions,
    totalPatterns: selectedPatterns.length,
    schedule,
  };
};

module.exports = {
  generateRevisionPlan,
};
