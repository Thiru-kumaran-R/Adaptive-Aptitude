'use strict';

const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const studyPlanService = require('../services/studyPlanService');

const createStudyPlan = asyncHandler(async (req, res) => {
  const { goalId, name } = req.body;
  if (!goalId || !name) {
    return sendError(res, 'VALIDATION_ERROR', 'goalId and name are required.', 400);
  }
  const plan = await studyPlanService.createStudyPlan({ ...req.body, userId: req.user.userId });
  return sendSuccess(res, plan, {}, 201);
});

const getStudyPlansByUser = asyncHandler(async (req, res) => {
  const plans = await studyPlanService.getStudyPlansByUser(req.user.userId);
  return sendSuccess(res, plans, { count: plans.length });
});

const getStudyPlan = asyncHandler(async (req, res) => {
  const plan = await studyPlanService.getStudyPlanById(req.params.id);
  if (plan.userId !== req.user.userId) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'OWNERSHIP_VIOLATION',
        message: 'Access denied: caller does not own this resource.'
      }
    });
  }
  return sendSuccess(res, plan);
});

const updateStudyPlan = asyncHandler(async (req, res) => {
  const plan = await studyPlanService.getStudyPlanById(req.params.id);
  if (plan.userId !== req.user.userId) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'OWNERSHIP_VIOLATION',
        message: 'Access denied: caller does not own this resource.'
      }
    });
  }
  const updated = await studyPlanService.updateStudyPlan(req.params.id, req.body, req.user.userId);
  return sendSuccess(res, updated);
});

const deleteStudyPlan = asyncHandler(async (req, res) => {
  const plan = await studyPlanService.getStudyPlanById(req.params.id);
  if (plan.userId !== req.user.userId) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'OWNERSHIP_VIOLATION',
        message: 'Access denied: caller does not own this resource.'
      }
    });
  }
  const result = await studyPlanService.deleteStudyPlan(req.params.id, req.user.userId);
  return sendSuccess(res, result);
});

module.exports = { createStudyPlan, getStudyPlansByUser, getStudyPlan, updateStudyPlan, deleteStudyPlan };
