'use strict';

const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const dailyObjectiveService = require('../services/dailyObjectiveService');

const createDailyObjective = asyncHandler(async (req, res) => {
  const { planId, goalId, date, topic } = req.body;
  if (!planId || !goalId || !date || !topic) {
    return sendError(res, 'VALIDATION_ERROR', 'planId, goalId, date, and topic are required.', 400);
  }
  const objective = await dailyObjectiveService.createDailyObjective({ ...req.body, userId: req.user.userId });
  return sendSuccess(res, objective, {}, 201);
});

const getDailyObjectivesByUser = asyncHandler(async (req, res) => {
  const { page, limit, status, planId, date } = req.query;
  const result = await dailyObjectiveService.getDailyObjectivesByUser(
    req.user.userId,
    { page, limit, status, planId, date }
  );
  return sendSuccess(res, result.data, result.meta);
});

const getDailyObjective = asyncHandler(async (req, res) => {
  const obj = await dailyObjectiveService.getDailyObjectiveById(req.params.id);
  if (obj.userId !== req.user.userId) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'OWNERSHIP_VIOLATION',
        message: 'Access denied: caller does not own this resource.'
      }
    });
  }
  return sendSuccess(res, obj);
});

const updateDailyObjective = asyncHandler(async (req, res) => {
  const obj = await dailyObjectiveService.getDailyObjectiveById(req.params.id);
  if (obj.userId !== req.user.userId) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'OWNERSHIP_VIOLATION',
        message: 'Access denied: caller does not own this resource.'
      }
    });
  }
  const updated = await dailyObjectiveService.updateDailyObjective(req.params.id, req.body, req.user.userId);
  return sendSuccess(res, updated);
});

const deleteDailyObjective = asyncHandler(async (req, res) => {
  const obj = await dailyObjectiveService.getDailyObjectiveById(req.params.id);
  if (obj.userId !== req.user.userId) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'OWNERSHIP_VIOLATION',
        message: 'Access denied: caller does not own this resource.'
      }
    });
  }
  const result = await dailyObjectiveService.deleteDailyObjective(req.params.id, req.user.userId);
  return sendSuccess(res, result);
});

module.exports = { createDailyObjective, getDailyObjectivesByUser, getDailyObjective, updateDailyObjective, deleteDailyObjective };
