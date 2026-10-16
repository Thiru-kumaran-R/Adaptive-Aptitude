'use strict';

/**
 * Revision Query Service — Phase 5: Spaced Revision Engine
 *
 * Handles due revision queries with strict user ownership validation,
 * bounded limits, and deterministic priority ordering.
 */

const RevisionItem = require('../../models/revisionItemModel');
const StudentProgress = require('../../models/studentProgressModel');
const { userExists } = require('../userService');
const { assertPlanOwnership } = require('../studyPlanService');
const { assertGoalOwnership } = require('../goalService');
const registryService = require('../patternRegistryService');
const registry = require('../../data/canonicalPatternRegistry.json');
const { getLogicalToday, compareLogicalDates } = require('../../utils/dateUtils');
const { REVISION_REASON_CODES } = require('../../config/revisionConfig');

// Build canonical pattern index map (0 to 277)
const patternIndexMap = new Map();
let globalIdx = 0;
for (const topic of registry) {
  for (const pattern of topic.patterns || []) {
    patternIndexMap.set(pattern.name, globalIdx++);
  }
}

const getPatternRegistryIndex = (patternName) => {
  return patternIndexMap.has(patternName) ? patternIndexMap.get(patternName) : 999999;
};

/**
 * Retrieves due RevisionItems for a user, sorted by deterministic priority:
 *   1. Most overdue first (earliest nextReviewDate)
 *   2. Lowest mastery first
 *   3. Canonical registry order
 *   4. Alphabetical pattern name
 *
 * @param {string} userId
 * @param {Object} [options]
 * @param {Date|string} [options.date] Filter cutoff date (defaults to logical today)
 * @param {Date|string} [options.referenceDate] Alias for date
 * @param {string} [options.topic] Optional topic filter
 * @param {string} [options.planId] Optional study plan ID (must belong to user)
 * @param {string} [options.goalId] Optional goal ID (must belong to user)
 * @param {number} [options.limit] Max items to return (1-100)
 * @returns {Promise<Array<Object>>}
 */
const getDueRevisions = async (userId, options = {}) => {
  if (!userId) {
    const err = new Error('userId is required.');
    err.statusCode = 400;
    err.code = 'VALIDATION_ERROR';
    throw err;
  }

  // 1. Verify user exists
  if (!(await userExists(userId))) {
    const err = new Error(`User "${userId}" not found.`);
    err.statusCode = 404;
    err.code = 'USER_NOT_FOUND';
    throw err;
  }

  // 2. Validate plan ownership if provided
  if (options.planId) {
    await assertPlanOwnership(options.planId, userId);
  }

  // 3. Validate goal ownership if provided
  if (options.goalId) {
    await assertGoalOwnership(options.goalId, userId);
  }

  // 4. Validate canonical topic if provided
  if (options.topic) {
    if (!registryService.topicExists(options.topic)) {
      const err = new Error(`Topic "${options.topic}" is not a canonical topic.`);
      err.statusCode = 400;
      err.code = 'INVALID_TOPIC';
      throw err;
    }
  }

  // 5. Determine reference date
  let cutoffDate;
  try {
    cutoffDate = getLogicalToday(options.date || options.referenceDate);
  } catch (e) {
    const err = new Error('Invalid date provided.');
    err.statusCode = 400;
    err.code = 'INVALID_DATE';
    throw err;
  }

  // Validate limit if provided
  let limit = 100;
  if (options.limit !== undefined && options.limit !== null && options.limit !== '') {
    const parsedLimit = Number(options.limit);
    if (!Number.isInteger(parsedLimit) || parsedLimit <= 0) {
      const err = new Error('limit must be a positive integer.');
      err.statusCode = 400;
      err.code = 'INVALID_LIMIT';
      throw err;
    }
    if (parsedLimit > 100) {
      const err = new Error('limit cannot exceed maximum of 100.');
      err.statusCode = 400;
      err.code = 'LIMIT_EXCEEDED';
      throw err;
    }
    limit = parsedLimit;
  }

  // 6. Build query filter
  const filter = {
    userId,
    status: 'scheduled',
    nextReviewDate: { $lte: cutoffDate },
  };

  if (options.topic) filter.topic = options.topic;
  if (options.planId) filter.planId = options.planId;
  if (options.goalId) filter.goalId = options.goalId;

  // 7. Fetch matching items
  const items = await RevisionItem.find(filter).lean();

  if (items.length === 0) {
    return [];
  }

  // 8. Enrich with current StudentProgress mastery
  const patternKeys = items.map((i) => ({ topic: i.topic, pattern: i.pattern }));
  const progressDocs = await StudentProgress.find({
    userId,
    $or: patternKeys,
  }).lean();

  const progressMap = new Map();
  for (const p of progressDocs) {
    progressMap.set(`${p.topic}:::${p.pattern}`, p);
  }

  const enriched = items.map((item) => {
    const prog = progressMap.get(`${item.topic}:::${item.pattern}`);
    const mastery = prog?.mastery || 0;
    const isOverdue = compareLogicalDates(item.nextReviewDate, cutoffDate) < 0;

    return {
      ...item,
      mastery,
      reasonCode: isOverdue ? REVISION_REASON_CODES.OVERDUE_REVISION : REVISION_REASON_CODES.DUE_TODAY,
      registryIndex: getPatternRegistryIndex(item.pattern),
    };
  });

  // 9. Sort deterministically
  enriched.sort((a, b) => {
    // 1. Most overdue first (earlier nextReviewDate wins)
    const dateComp = compareLogicalDates(a.nextReviewDate, b.nextReviewDate);
    if (dateComp !== 0) return dateComp;

    // 2. Lowest mastery first
    if (a.mastery !== b.mastery) return a.mastery - b.mastery;

    // 3. Canonical registry order
    if (a.registryIndex !== b.registryIndex) return a.registryIndex - b.registryIndex;

    // 4. Alphabetical pattern name
    return a.pattern.localeCompare(b.pattern);
  });

  // 10. Apply bounded limit
  return enriched.slice(0, limit);
};

module.exports = {
  getDueRevisions,
  getPatternRegistryIndex,
};
