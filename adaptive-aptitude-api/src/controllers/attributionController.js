'use strict';

/**
 * Attribution Controller — Phase 10: PAOA
 *
 * Exposes the four Phase 10 endpoints:
 *   1. POST /api/v1/attribution/prescriptions
 *   2. POST /api/v1/attribution/prescriptions/:prescriptionId/activate
 *   3. POST /api/v1/attribution/prescriptions/:prescriptionId/complete
 *   4. GET  /api/v1/attribution/users/:userId/summary
 *
 * Consumes validated request data, captures single referenceNow,
 * forwards to modular domain services, and returns standardized envelopes.
 */

const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');
const AppError = require('../utils/AppError');

const attributionIssuanceService = require('../services/attribution/attributionIssuanceService');
const attributionActivationService = require('../services/attribution/attributionActivationService');
const attributionCompletionService = require('../services/attribution/attributionCompletionService');
const attributionSummaryService = require('../services/attribution/attributionSummaryService');

/**
 * POST /api/v1/attribution/prescriptions
 */
const issuePrescription = asyncHandler(async (req, res) => {
  const referenceNow = req.referenceNow || new Date();
  req.referenceNow = referenceNow;

  const idempotencyKey = req.headers['idempotency-key'];
  const { originSurface, goalId, actionId } = req.body || {};
  const userId = req.user.userId;

  try {
    const result = await attributionIssuanceService.issuePrescription({
      userId,
      originSurface,
      goalId,
      actionId,
      idempotencyKey,
      referenceNow,
    });

    return sendSuccess(
      res,
      result.data,
      { referenceNow: referenceNow.toISOString() },
      result.statusCode || 201
    );
  } catch (err) {
    if (err instanceof AppError) {
      throw err;
    }
    throw new AppError(
      500,
      'ATTRIBUTION_ISSUANCE_FAILED',
      err.message || 'Prescription issuance failed.'
    );
  }
});

/**
 * POST /api/v1/attribution/prescriptions/:prescriptionId/activate
 */
const activatePrescription = asyncHandler(async (req, res) => {
  const referenceNow = req.referenceNow || new Date();
  req.referenceNow = referenceNow;

  const { prescriptionId } = req.params;
  const userId = req.user.userId;

  try {
    const result = await attributionActivationService.activatePrescription({
      prescriptionId,
      userId,
      referenceNow,
    });

    return sendSuccess(
      res,
      result.data,
      { referenceNow: referenceNow.toISOString() },
      result.statusCode || 200
    );
  } catch (err) {
    if (err instanceof AppError) {
      throw err;
    }
    throw new AppError(
      500,
      'ATTRIBUTION_CALCULATION_FAILED',
      err.message || 'Prescription activation failed.'
    );
  }
});

/**
 * POST /api/v1/attribution/prescriptions/:prescriptionId/complete
 */
const completePrescription = asyncHandler(async (req, res) => {
  const referenceNow = req.referenceNow || new Date();
  req.referenceNow = referenceNow;

  const { prescriptionId } = req.params;
  const userId = req.user.userId;
  const { abandon, mockSessionId } = req.body || {};

  try {
    const result = await attributionCompletionService.completePrescription({
      prescriptionId,
      userId,
      abandon: abandon === true,
      mockSessionId: mockSessionId || null,
      referenceNow,
    });

    return sendSuccess(
      res,
      result.data,
      { referenceNow: referenceNow.toISOString() },
      result.statusCode || 200
    );
  } catch (err) {
    if (err instanceof AppError) {
      throw err;
    }
    throw new AppError(
      500,
      'ATTRIBUTION_CALCULATION_FAILED',
      err.message || 'Prescription completion failed.'
    );
  }
});

/**
 * GET /api/v1/attribution/users/:userId/summary
 */
const getSummary = asyncHandler(async (req, res) => {
  const referenceNow = req.referenceNow || new Date();
  req.referenceNow = referenceNow;

  const userId = req.user.userId;
  const { windowDays, actionType } = req.query;

  try {
    const result = await attributionSummaryService.getAttributionSummary({
      userId,
      windowDays,
      actionType,
      referenceNow,
    });

    return sendSuccess(
      res,
      result,
      { referenceNow: referenceNow.toISOString() },
      200
    );
  } catch (err) {
    if (err instanceof AppError) {
      throw err;
    }
    throw new AppError(
      500,
      'ATTRIBUTION_SUMMARY_FAILED',
      err.message || 'Attribution summary retrieval failed.'
    );
  }
});

module.exports = {
  issuePrescription,
  activatePrescription,
  completePrescription,
  getSummary,
};
