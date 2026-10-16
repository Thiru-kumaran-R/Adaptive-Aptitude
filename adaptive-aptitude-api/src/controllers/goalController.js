'use strict';

const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const goalService = require('../services/goalService');

const createGoal = asyncHandler(async (req, res) => {
  const { title, type, targetName, description, startDate, targetDate, targetScore, priority, status } = req.body;
  if (!title || !type) {
    return sendError(res, 'VALIDATION_ERROR', 'title and type are required.', 400);
  }
  const userId = req.user.userId;
  const goal = await goalService.createGoal({ userId, title, type, targetName, description, startDate, targetDate, targetScore, priority, status });
  return sendSuccess(res, goal, {}, 201);
});

const getGoalsByUser = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const goals = await goalService.getGoalsByUser(userId);
  return sendSuccess(res, goals, { count: goals.length });
});

const getGoal = asyncHandler(async (req, res) => {
  const goal = await goalService.getGoalById(req.params.id);
  if (goal.userId !== req.user.userId) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'OWNERSHIP_VIOLATION',
        message: 'Access denied: caller does not own this resource.'
      }
    });
  }
  return sendSuccess(res, goal);
});

const updateGoal = asyncHandler(async (req, res) => {
  const goal = await goalService.getGoalById(req.params.id);
  if (goal.userId !== req.user.userId) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'OWNERSHIP_VIOLATION',
        message: 'Access denied: caller does not own this resource.'
      }
    });
  }
  const updated = await goalService.updateGoal(req.params.id, req.body, req.user.userId);
  return sendSuccess(res, updated);
});

const deleteGoal = asyncHandler(async (req, res) => {
  const goal = await goalService.getGoalById(req.params.id);
  if (goal.userId !== req.user.userId) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'OWNERSHIP_VIOLATION',
        message: 'Access denied: caller does not own this resource.'
      }
    });
  }
  const result = await goalService.deleteGoal(req.params.id, req.user.userId);
  return sendSuccess(res, result);
});

module.exports = { createGoal, getGoalsByUser, getGoal, updateGoal, deleteGoal };
