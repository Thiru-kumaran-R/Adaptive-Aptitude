'use strict';

const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const studentProgressService = require('../services/studentProgressService');
const adaptiveQueryHelper = require('../services/adaptiveQueryHelper');

// GET /api/v1/progress/:userId
const getProgressByUser = asyncHandler(async (req, res) => {
  const { topic, pattern, page, limit, sortBy, sortDir } = req.query;
  const userId = req.user?.userId || req.params.userId;
  const result = await studentProgressService.getProgressByUser(
    userId,
    { topic, pattern, page, limit, sortBy, sortDir }
  );
  return sendSuccess(res, result.data, result.meta);
});

// GET /api/v1/progress/:userId/topics
const getProgressByTopic = asyncHandler(async (req, res) => {
  const { topic } = req.query;
  const userId = req.user?.userId || req.params.userId;
  const records = await adaptiveQueryHelper.Q1_progressByTopic(userId, topic || null);
  return sendSuccess(res, records, { count: records.length });
});

// GET /api/v1/progress/:userId/patterns
const getProgressByPattern = asyncHandler(async (req, res) => {
  const { topic } = req.query;
  if (!topic) {
    return sendError(res, 'VALIDATION_ERROR', 'topic query parameter is required for pattern-level progress.', 400);
  }
  const userId = req.user?.userId || req.params.userId;
  const records = await adaptiveQueryHelper.Q2_progressByPattern(userId, topic);
  return sendSuccess(res, records, { count: records.length });
});

// GET /api/v1/progress/:userId/weakest
const getWeakestPatterns = asyncHandler(async (req, res) => {
  const { topic, limit } = req.query;
  const userId = req.user?.userId || req.params.userId;
  const records = await adaptiveQueryHelper.Q4_weakestPatterns(userId, { topic, limit });
  return sendSuccess(res, records, { count: records.length });
});

// GET /api/v1/progress/:userId/difficulty-distribution
const getDifficultyDistribution = asyncHandler(async (req, res) => {
  const { topic, pattern } = req.query;
  const userId = req.user?.userId || req.params.userId;
  const records = await adaptiveQueryHelper.Q7_difficultyDistribution(userId, { topic, pattern });
  return sendSuccess(res, records, { count: records.length });
});

// GET /api/v1/progress/:userId/accuracy-over-time
const getAccuracyOverTime = asyncHandler(async (req, res) => {
  const { topic, pattern, limit } = req.query;
  const userId = req.user?.userId || req.params.userId;
  const records = await adaptiveQueryHelper.Q8_accuracyOverTime(userId, { topic, pattern, limit });
  return sendSuccess(res, records, { count: records.length });
});

// GET /api/v1/progress/:userId/by-source
const getAttemptsBySource = asyncHandler(async (req, res) => {
  const userId = req.user?.userId || req.params.userId;
  const records = await adaptiveQueryHelper.Q9_attemptsBySource(userId);
  return sendSuccess(res, records, { count: records.length });
});

// GET /api/v1/progress/prerequisites/:patternName
const getPrerequisiteData = asyncHandler(async (req, res) => {
  const record = await adaptiveQueryHelper.Q10_prerequisiteData(req.params.patternName);
  return sendSuccess(res, record);
});

module.exports = {
  getProgressByUser,
  getProgressByTopic,
  getProgressByPattern,
  getWeakestPatterns,
  getDifficultyDistribution,
  getAccuracyOverTime,
  getAttemptsBySource,
  getPrerequisiteData,
};
