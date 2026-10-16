'use strict';

/**
 * src/controllers/adaptiveController.js
 *
 * Handles HTTP requests for the Adaptive Decision Engine.
 *
 * Endpoints:
 *   GET /api/v1/adaptive/next-question
 */

const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');
const adaptiveEngine = require('../services/adaptive/adaptiveEngine');

/**
 * GET /api/v1/adaptive/next-question
 *
 * Query Parameters:
 *   - topic (optional string)
 *   - pattern (optional string)
 *   - planId (optional string)
 */
const getNextQuestion = asyncHandler(async (req, res) => {
  const { topic, pattern, planId } = req.query;
  const userId = req.user.userId;

  const result = await adaptiveEngine.getNextQuestion(userId, {
    topic: topic ? topic.trim() : undefined,
    pattern: pattern ? pattern.trim() : undefined,
    planId: planId ? planId.trim() : undefined,
  });

  return sendSuccess(res, result);
});

module.exports = {
  getNextQuestion,
};
