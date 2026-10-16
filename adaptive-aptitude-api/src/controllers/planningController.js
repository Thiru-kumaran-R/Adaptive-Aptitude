'use strict';

/**
 * Planning Controller — Phase 5: Automated Planning Engine
 *
 * Implements HTTP endpoints for plan preview, generation, replanning,
 * and schedule retrieval. Adheres to safe-logging standards and Phase 14 principal security.
 */

const planningEngine = require('../services/planning/planningEngine');
const StudyPlan = require('../models/studyPlanModel');

const preview = async (req, res, next) => {
  try {
    const result = await planningEngine.previewPlan({
      ...req.body,
      userId: req.user.userId,
    });
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

const generate = async (req, res, next) => {
  try {
    const result = await planningEngine.generatePlan({
      ...req.body,
      userId: req.user.userId,
    });
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    console.error(JSON.stringify({ event: 'PLAN_GENERATION_FAILED', error: err.message }));
    next(err);
  }
};

const replan = async (req, res, next) => {
  try {
    const { planId } = req.params;
    const { referenceDate, replaceToday, allowReplaceToday, includeMastered } = req.body;

    const plan = await StudyPlan.findById(planId);
    if (!plan) {
      const err = new Error('Study plan not found.');
      err.statusCode = 404;
      err.code = 'STUDY_PLAN_NOT_FOUND';
      throw err;
    }

    if (plan.userId !== req.user.userId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'OWNERSHIP_VIOLATION',
          message: 'Access denied: caller does not own this resource.'
        }
      });
    }

    const result = await planningEngine.replanPlan(planId, req.user.userId, {
      referenceDate,
      replaceToday: replaceToday === true || allowReplaceToday === true,
      allowReplaceToday: replaceToday === true || allowReplaceToday === true,
      includeMastered,
    });
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    console.error(JSON.stringify({ event: 'PLAN_REPLANNING_FAILED', error: err.message }));
    next(err);
  }
};

const getSchedule = async (req, res, next) => {
  try {
    const { planId } = req.params;

    const plan = await StudyPlan.findById(planId);
    if (!plan) {
      const err = new Error('Study plan not found.');
      err.statusCode = 404;
      err.code = 'STUDY_PLAN_NOT_FOUND';
      throw err;
    }

    if (plan.userId !== req.user.userId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'OWNERSHIP_VIOLATION',
          message: 'Access denied: caller does not own this resource.'
        }
      });
    }

    const result = await planningEngine.getPlanSchedule(planId, req.user.userId);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  preview,
  generate,
  replan,
  getSchedule,
};
