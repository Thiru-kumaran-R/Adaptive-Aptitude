'use strict';

/**
 * Orchestration Controller — Phase 9: Prescriptive Learning Orchestration & Next-Best-Action (NBA) Engine
 *
 * Exposes the three Phase 9 endpoints:
 *   1. GET /api/v1/orchestration/next-action
 *   2. GET /api/v1/orchestration/daily-agenda
 *   3. GET /api/v1/orchestration/interventions
 *
 * Consumes validated req.orchestrationContext populated by orchestrationGuard.
 * Returns standardized success envelopes with meta.referenceNow.
 * Handles unexpected calculation or assembly failures with HTTP 500 ORCHESTRATION_CALCULATION_FAILED.
 */

const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');
const AppError = require('../utils/AppError');
const { ORCHESTRATION_ERROR_CODES } = require('../config/orchestrationConfig');

const nextActionArbiter = require('../services/orchestration/nextActionArbiter');
const dailyAgendaAssembler = require('../services/orchestration/dailyAgendaAssembler');
const interventionPolicyService = require('../services/orchestration/interventionPolicyService');

/**
 * GET /api/v1/orchestration/next-action
 */
const handleGetNextAction = asyncHandler(async (req, res) => {
  const context = req.orchestrationContext;
  try {
    const data = await nextActionArbiter.getNextAction(context);
    const { policyProvenance, ...publicData } = data;
    return sendSuccess(res, publicData, { referenceNow: context.referenceNow.toISOString() });
  } catch (err) {
    if (err instanceof AppError) {
      throw err;
    }
    throw new AppError(
      500,
      ORCHESTRATION_ERROR_CODES.ORCHESTRATION_CALCULATION_FAILED,
      'Internal orchestration calculation or arbitration failed.'
    );
  }
});

/**
 * GET /api/v1/orchestration/daily-agenda
 */
const handleGetDailyAgenda = asyncHandler(async (req, res) => {
  const context = req.orchestrationContext;
  try {
    const data = await dailyAgendaAssembler.getDailyAgenda(context);
    const { policyProvenance, ...publicData } = data;
    return sendSuccess(res, publicData, { referenceNow: context.referenceNow.toISOString() });
  } catch (err) {
    if (err instanceof AppError) {
      throw err;
    }
    throw new AppError(
      500,
      ORCHESTRATION_ERROR_CODES.ORCHESTRATION_CALCULATION_FAILED,
      'Internal daily agenda calculation or assembly failed.'
    );
  }
});

/**
 * GET /api/v1/orchestration/interventions
 */
const handleGetInterventions = asyncHandler(async (req, res) => {
  const context = req.orchestrationContext;
  try {
    const data = await interventionPolicyService.getInterventions(context);
    const { policyProvenance, ...publicData } = data;
    return sendSuccess(res, publicData, { referenceNow: context.referenceNow.toISOString() });
  } catch (err) {
    if (err instanceof AppError) {
      throw err;
    }
    throw new AppError(
      500,
      ORCHESTRATION_ERROR_CODES.ORCHESTRATION_CALCULATION_FAILED,
      'Internal cognitive intervention policy calculation failed.'
    );
  }
});

module.exports = {
  getNextAction: handleGetNextAction,
  getDailyAgenda: handleGetDailyAgenda,
  getInterventions: handleGetInterventions,
  handleGetNextAction,
  handleGetDailyAgenda,
  handleGetInterventions,
};
