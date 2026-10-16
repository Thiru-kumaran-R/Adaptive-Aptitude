'use strict';

/**
 * StudyPlan Service — Phase 3
 *
 * Business logic for study plans.
 * Validates:
 *   - userId → existing User
 *   - goalId → existing Goal belonging to userId
 *   - target.topic → canonical registry
 *   - target.pattern (if provided) → canonical registry AND belongs to topic
 */

const StudyPlan = require('../models/studyPlanModel');
const { userExists } = require('./userService');
const { assertGoalOwnership } = require('./goalService');
const registryService = require('./patternRegistryService');

const validateTargets = (targets = []) => {
  for (let i = 0; i < targets.length; i++) {
    const t = targets[i];
    if (!registryService.topicExists(t.topic)) {
      const err = new Error(`Target topic "${t.topic}" at index ${i} is not a canonical topic.`);
      err.statusCode = 400;
      err.code = 'INVALID_TOPIC';
      throw err;
    }
    if (t.pattern) {
      if (!registryService.patternExists(t.pattern)) {
        const err = new Error(`Target pattern "${t.pattern}" at index ${i} does not exist in the canonical registry.`);
        err.statusCode = 400;
        err.code = 'INVALID_PATTERN';
        throw err;
      }
      if (!registryService.patternBelongsToTopic(t.pattern, t.topic)) {
        const err = new Error(`Target pattern "${t.pattern}" at index ${i} does not belong to topic "${t.topic}".`);
        err.statusCode = 400;
        err.code = 'PATTERN_TOPIC_MISMATCH';
        throw err;
      }
    }
  }
};

const createStudyPlan = async (data) => {
  const { userId, goalId, targets } = data;

  if (!(await userExists(userId))) {
    const err = new Error(`User "${userId}" not found.`);
    err.statusCode = 404;
    err.code = 'USER_NOT_FOUND';
    throw err;
  }

  await assertGoalOwnership(goalId, userId);
  validateTargets(targets);

  return StudyPlan.create(data);
};

const getStudyPlansByUser = async (userId) => {
  return StudyPlan.find({ userId }).sort({ createdAt: -1 });
};

const getStudyPlanById = async (id) => {
  const plan = await StudyPlan.findById(id);
  if (!plan) {
    const err = new Error('Study plan not found.');
    err.statusCode = 404;
    err.code = 'PLAN_NOT_FOUND';
    throw err;
  }
  return plan;
};

const updateStudyPlan = async (id, updates, requestingUserId) => {
  const plan = await getStudyPlanById(id);
  if (plan.userId !== requestingUserId) {
    const err = new Error('Study plan does not belong to the specified user.');
    err.statusCode = 403;
    err.code = 'FORBIDDEN';
    throw err;
  }
  if (updates.targets !== undefined) {
    validateTargets(updates.targets);
  }
  delete updates.userId;
  delete updates.goalId;
  Object.assign(plan, updates);
  await plan.save();
  return plan;
};

const deleteStudyPlan = async (id, requestingUserId) => {
  const plan = await getStudyPlanById(id);
  if (plan.userId !== requestingUserId) {
    const err = new Error('Study plan does not belong to the specified user.');
    err.statusCode = 403;
    err.code = 'FORBIDDEN';
    throw err;
  }
  await StudyPlan.deleteOne({ _id: id });
  return { deleted: true };
};

/**
 * Verify a plan exists and belongs to the given userId.
 */
const assertPlanOwnership = async (planId, userId) => {
  const plan = await StudyPlan.findById(planId);
  if (!plan) {
    const err = new Error('Study plan not found.');
    err.statusCode = 404;
    err.code = 'PLAN_NOT_FOUND';
    throw err;
  }
  if (plan.userId !== userId) {
    const err = new Error('Study plan does not belong to the specified user.');
    err.statusCode = 403;
    err.code = 'FORBIDDEN';
    throw err;
  }
  return plan;
};

module.exports = {
  createStudyPlan,
  getStudyPlansByUser,
  getStudyPlanById,
  updateStudyPlan,
  deleteStudyPlan,
  assertPlanOwnership,
  validateTargets,
};
