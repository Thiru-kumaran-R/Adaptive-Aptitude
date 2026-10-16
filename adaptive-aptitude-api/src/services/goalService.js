'use strict';

/**
 * Goal Service — Phase 3
 *
 * Business logic for creating, reading, updating Goals.
 * Validates referential integrity: userId must be an existing User.
 */

const Goal = require('../models/goalModel');
const { userExists } = require('./userService');

const createGoal = async (data) => {
  const { userId } = data;
  if (!(await userExists(userId))) {
    const err = new Error(`User "${userId}" not found.`);
    err.statusCode = 404;
    err.code = 'USER_NOT_FOUND';
    throw err;
  }
  return Goal.create(data);
};

const getGoalsByUser = async (userId) => {
  return Goal.find({ userId }).sort({ createdAt: -1 });
};

const getGoalById = async (id) => {
  const goal = await Goal.findById(id);
  if (!goal) {
    const err = new Error('Goal not found.');
    err.statusCode = 404;
    err.code = 'GOAL_NOT_FOUND';
    throw err;
  }
  return goal;
};

const updateGoal = async (id, updates, requestingUserId) => {
  const goal = await getGoalById(id);
  // Ownership check
  if (goal.userId !== requestingUserId) {
    const err = new Error('Goal does not belong to the specified user.');
    err.statusCode = 403;
    err.code = 'FORBIDDEN';
    throw err;
  }
  // Prevent changing userId
  delete updates.userId;
  Object.assign(goal, updates);
  await goal.save();
  return goal;
};

const deleteGoal = async (id, requestingUserId) => {
  const goal = await getGoalById(id);
  if (goal.userId !== requestingUserId) {
    const err = new Error('Goal does not belong to the specified user.');
    err.statusCode = 403;
    err.code = 'FORBIDDEN';
    throw err;
  }
  await Goal.deleteOne({ _id: id });
  return { deleted: true };
};

/**
 * Verify a goal exists and belongs to the given userId.
 * Used by other services for referential integrity checks.
 */
const assertGoalOwnership = async (goalId, userId) => {
  const goal = await Goal.findById(goalId);
  if (!goal) {
    const err = new Error('Goal not found.');
    err.statusCode = 404;
    err.code = 'GOAL_NOT_FOUND';
    throw err;
  }
  if (goal.userId !== userId) {
    const err = new Error('Goal does not belong to the specified user.');
    err.statusCode = 403;
    err.code = 'FORBIDDEN';
    throw err;
  }
  return goal;
};

module.exports = {
  createGoal,
  getGoalsByUser,
  getGoalById,
  updateGoal,
  deleteGoal,
  assertGoalOwnership,
};
