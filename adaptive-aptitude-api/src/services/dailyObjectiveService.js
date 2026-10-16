'use strict';

/**
 * DailyObjective Service — Phase 3
 *
 * DATE NORMALIZATION:
 *   All dates are normalized to midnight UTC (start of calendar day) before
 *   writing. This prevents bypass of the { userId, planId, date } unique index
 *   when the same intended day is submitted with different clock times.
 *
 * VALIDATION:
 *   - userId → existing User
 *   - planId → existing StudyPlan belonging to userId
 *   - goalId → existing Goal belonging to userId, matching plan.goalId
 *   - topic → canonical registry
 *   - each pattern → canonical registry AND belongs to topic
 *   - targetDifficulty → integer 1–10 (when provided)
 *
 * NOT in Phase 3:
 *   - Automatic daily objective generation
 *   - Prerequisite eligibility checks
 */

const DailyObjective = require('../models/dailyObjectiveModel');
const { userExists } = require('./userService');
const { assertGoalOwnership } = require('./goalService');
const { assertPlanOwnership } = require('./studyPlanService');
const registryService = require('./patternRegistryService');
const { normalizeLogicalDate } = require('../utils/dateUtils');

/**
 * Normalize a Date to midnight UTC (beginning of the logical calendar day).
 * Consolidates Phase 3 and Phase 5 on the shared dateUtils implementation.
 * @param {Date|string} date
 * @returns {Date}
 */
const normalizeToMidnightUTC = (date) => normalizeLogicalDate(date);

const validatePatternObjectives = (topic, patterns = []) => {
  for (let i = 0; i < patterns.length; i++) {
    const p = patterns[i];
    if (!p.pattern || typeof p.pattern !== 'string' || p.pattern.trim() === '') {
      const err = new Error(`patterns[${i}].pattern is required and cannot be empty.`);
      err.statusCode = 400;
      err.code = 'VALIDATION_ERROR';
      throw err;
    }
    if (!registryService.patternExists(p.pattern)) {
      const err = new Error(`Pattern "${p.pattern}" at patterns[${i}] does not exist in the canonical registry.`);
      err.statusCode = 400;
      err.code = 'INVALID_PATTERN';
      throw err;
    }
    if (!registryService.patternBelongsToTopic(p.pattern, topic)) {
      const err = new Error(`Pattern "${p.pattern}" at patterns[${i}] does not belong to topic "${topic}".`);
      err.statusCode = 400;
      err.code = 'PATTERN_TOPIC_MISMATCH';
      throw err;
    }
    if (p.targetDifficulty !== undefined && p.targetDifficulty !== null) {
      if (!Number.isInteger(p.targetDifficulty) || p.targetDifficulty < 1 || p.targetDifficulty > 10) {
        const err = new Error(`patterns[${i}].targetDifficulty must be an integer between 1 and 10.`);
        err.statusCode = 400;
        err.code = 'INVALID_DIFFICULTY';
        throw err;
      }
    }
  }
};

const createDailyObjective = async (data) => {
  const { userId, planId, goalId, topic, patterns, date } = data;

  // 1. User must exist
  if (!(await userExists(userId))) {
    const err = new Error(`User "${userId}" not found.`);
    err.statusCode = 404;
    err.code = 'USER_NOT_FOUND';
    throw err;
  }

  // 2. Plan must exist and belong to user
  const plan = await assertPlanOwnership(planId, userId);

  // 3. Goal must exist and belong to user
  await assertGoalOwnership(goalId, userId);

  // 4. goalId must match the plan's goalId
  if (plan.goalId.toString() !== goalId.toString()) {
    const err = new Error('goalId does not match the goal linked to the study plan.');
    err.statusCode = 400;
    err.code = 'GOAL_PLAN_MISMATCH';
    throw err;
  }

  // 5. Topic must be canonical
  if (!registryService.topicExists(topic)) {
    const err = new Error(`Topic "${topic}" is not a canonical topic.`);
    err.statusCode = 400;
    err.code = 'INVALID_TOPIC';
    throw err;
  }

  // 6. Patterns must be canonical and belong to topic
  validatePatternObjectives(topic, patterns);

  // 7. Normalize date to midnight UTC
  const normalizedDate = normalizeToMidnightUTC(date);

  const objective = await DailyObjective.create({
    ...data,
    date: normalizedDate,
  });
  return objective;
};

const getDailyObjectiveById = async (id) => {
  const obj = await DailyObjective.findById(id);
  if (!obj) {
    const err = new Error('Daily objective not found.');
    err.statusCode = 404;
    err.code = 'OBJECTIVE_NOT_FOUND';
    throw err;
  }
  return obj;
};

const getDailyObjectivesByUser = async (userId, filters = {}) => {
  const query = { userId };
  if (filters.planId) query.planId = filters.planId;
  if (filters.status) query.status = filters.status;
  if (filters.date) {
    // Match the normalized calendar day
    const dayStart = normalizeToMidnightUTC(filters.date);
    const dayEnd = new Date(dayStart);
    dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);
    query.date = { $gte: dayStart, $lt: dayEnd };
  }
  const page = Math.max(1, parseInt(filters.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(filters.limit) || 20));
  const skip = (page - 1) * limit;
  const total = await DailyObjective.countDocuments(query);
  const data = await DailyObjective.find(query)
    .sort({ date: -1 })
    .skip(skip)
    .limit(limit);
  return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit), count: data.length } };
};

const updateDailyObjective = async (id, updates, requestingUserId) => {
  const obj = await getDailyObjectiveById(id);
  if (obj.userId !== requestingUserId) {
    const err = new Error('Daily objective does not belong to the specified user.');
    err.statusCode = 403;
    err.code = 'FORBIDDEN';
    throw err;
  }
  if (updates.patterns !== undefined) {
    validatePatternObjectives(updates.topic || obj.topic, updates.patterns);
  }
  const protectedFields = ['userId', 'planId', 'goalId', 'date'];
  protectedFields.forEach((f) => delete updates[f]);
  Object.assign(obj, updates);
  await obj.save();
  return obj;
};

const deleteDailyObjective = async (id, requestingUserId) => {
  const obj = await getDailyObjectiveById(id);
  if (obj.userId !== requestingUserId) {
    const err = new Error('Daily objective does not belong to the specified user.');
    err.statusCode = 403;
    err.code = 'FORBIDDEN';
    throw err;
  }
  await DailyObjective.deleteOne({ _id: id });
  return { deleted: true };
};

module.exports = {
  createDailyObjective,
  getDailyObjectiveById,
  getDailyObjectivesByUser,
  updateDailyObjective,
  deleteDailyObjective,
  normalizeToMidnightUTC,
  validatePatternObjectives,
};
