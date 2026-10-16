'use strict';

/**
 * Planning Engine — Phase 5: Automated Planning Engine
 *
 * Central facade for planning operations:
 *   - Non-destructive preview
 *   - Atomic plan and daily objective generation
 *   - Progress-aware replanning
 *   - Schedule retrieval with ownership enforcement
 */

const { previewStudyPlan } = require('./planningPreviewService');
const { generateStudyPlan } = require('./studyPlanGenerationService');
const { replanStudyPlan } = require('./planReplanningService');
const { assertPlanOwnership } = require('../studyPlanService');
const DailyObjective = require('../../models/dailyObjectiveModel');

/**
 * Non-destructive preview of a study plan.
 */
const previewPlan = async (params) => {
  return previewStudyPlan(params);
};

/**
 * Generate and commit a study plan and its daily objectives.
 */
const generatePlan = async (params) => {
  return generateStudyPlan(params);
};

/**
 * Re-evaluate and regenerate future pending objectives for an existing plan.
 */
const replanPlan = async (planId, userId, options) => {
  return replanStudyPlan(planId, userId, options);
};

/**
 * Retrieves the full objective schedule for a plan with ownership verification.
 *
 * @param {string} planId
 * @param {string} userId
 * @returns {Promise<Object>}
 */
const getPlanSchedule = async (planId, userId) => {
  const plan = await assertPlanOwnership(planId, userId);
  const objectives = await DailyObjective.find({ planId: plan._id, userId }).sort({ date: 1 });

  return {
    planId: plan._id,
    planName: plan.name,
    userId: plan.userId,
    goalId: plan.goalId,
    startDate: plan.startDate,
    endDate: plan.endDate,
    status: plan.status,
    totalObjectives: objectives.length,
    objectives,
  };
};

module.exports = {
  previewPlan,
  generatePlan,
  replanPlan,
  getPlanSchedule,
};
