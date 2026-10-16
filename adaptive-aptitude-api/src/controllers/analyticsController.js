'use strict';

/**
 * Analytics Controller
 *
 * Exposes the four Phase 8 analytics endpoints:
 *   1. GET /api/v1/analytics/dashboard
 *   2. GET /api/v1/analytics/cognitive-profile
 *   3. GET /api/v1/analytics/retention
 *   4. GET /api/v1/analytics/readiness/:goalId
 *
 * Implements strict HTTP query normalization for scalar windowDays and topic,
 * authoritative caller identity binding, and document ownership checks.
 */

const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');
const AppError = require('../utils/AppError');
const patternRegistryService = require('../services/patternRegistryService');
const Goal = require('../models/goalModel');
const {
  ANALYTICS_ALGORITHM_VERSION,
  DEFAULT_WINDOW_DAYS,
  MAX_WINDOW_DAYS,
} = require('../config/analyticsConfig');

const { getDashboardAnalytics } = require('../services/analytics/dashboardAggregateService');
const { getSpeedAccuracyMatrix } = require('../services/analytics/speedAccuracyMatrixService');
const { getStaminaCurve } = require('../services/analytics/staminaAnalyticsService');
const { getRetentionAnalytics } = require('../services/analytics/retentionAnalyticsService');
const { getGoalReadiness } = require('../services/analytics/readinessService');

/**
 * GET /api/v1/analytics/dashboard
 */
const getDashboard = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const referenceNow = req.referenceNow || new Date();

  const data = await getDashboardAnalytics(userId, referenceNow);
  return sendSuccess(res, data);
});

/**
 * GET /api/v1/analytics/cognitive-profile
 */
const getCognitiveProfile = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const referenceNow = req.referenceNow || new Date();

  // 1. windowDays normalization contract (Section 16.2)
  const rawWindowDays = req.query.windowDays;
  let windowDays = DEFAULT_WINDOW_DAYS;

  if (rawWindowDays !== undefined) {
    if (typeof rawWindowDays !== 'string') {
      throw new AppError(400, 'INVALID_WINDOW_DAYS', 'windowDays must be a single scalar integer string.');
    }

    const trimmed = rawWindowDays.trim();
    if (trimmed === '') {
      throw new AppError(400, 'INVALID_WINDOW_DAYS', 'windowDays cannot be an empty string.');
    }

    if (!/^\d+$/.test(trimmed)) {
      throw new AppError(400, 'INVALID_WINDOW_DAYS', 'windowDays must contain only digits.');
    }

    const parsed = parseInt(trimmed, 10);
    if (!Number.isSafeInteger(parsed) || parsed < 1 || parsed > MAX_WINDOW_DAYS) {
      throw new AppError(
        400,
        'INVALID_WINDOW_DAYS',
        `windowDays must be an integer between 1 and ${MAX_WINDOW_DAYS}.`
      );
    }
    windowDays = parsed;
  }

  // 2. topic normalization contract (Section 16.2)
  const rawTopic = req.query.topic;
  let topic = null;

  if (rawTopic !== undefined) {
    if (typeof rawTopic !== 'string') {
      throw new AppError(400, 'INVALID_TOPIC', 'topic must be a single scalar string.');
    }

    const trimmedTopic = rawTopic.trim();
    if (trimmedTopic === '') {
      throw new AppError(400, 'INVALID_TOPIC', 'topic cannot be an empty string.');
    }

    if (!patternRegistryService.topicExists(trimmedTopic)) {
      throw new AppError(400, 'INVALID_TOPIC', `Topic "${trimmedTopic}" is not registered in the system.`);
    }

    topic = trimmedTopic;
  }

  // 3. Assemble Cognitive Profile
  const speedData = await getSpeedAccuracyMatrix(userId, windowDays, topic, referenceNow);
  const staminaData = await getStaminaCurve(userId);

  const profilePayload = {
    userId,
    algorithmVersion: ANALYTICS_ALGORITHM_VERSION,
    analysisWindow: speedData.analysisWindow,
    speedAccuracyMatrix: speedData.speedAccuracyMatrix,
    staminaCurve: staminaData.staminaCurve,
  };

  if (staminaData.staminaReason) {
    profilePayload.staminaReason = staminaData.staminaReason;
  }

  return sendSuccess(res, profilePayload);
});

/**
 * GET /api/v1/analytics/retention
 */
const getRetention = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const referenceNow = req.referenceNow || new Date();

  const data = await getRetentionAnalytics(userId, referenceNow);
  return sendSuccess(res, data);
});

/**
 * GET /api/v1/analytics/readiness/:goalId
 */
const getReadiness = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const { goalId } = req.params;
  const referenceNow = req.referenceNow || new Date();

  const data = await getGoalReadiness(userId, goalId, referenceNow);
  return sendSuccess(res, data);
});

module.exports = {
  getDashboard,
  getCognitiveProfile,
  getRetention,
  getReadiness,
};
