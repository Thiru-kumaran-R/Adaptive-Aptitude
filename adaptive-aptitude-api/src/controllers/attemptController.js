'use strict';

const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const attemptService = require('../services/attemptService');

const createAttempt = asyncHandler(async (req, res) => {
  const { questionId, selectedAnswer, timeTaken, source } = req.body;
  if (!questionId || selectedAnswer === undefined || timeTaken === undefined || !source) {
    return sendError(res, 'VALIDATION_ERROR', 'questionId, selectedAnswer, timeTaken, and source are required.', 400);
  }
  if (typeof timeTaken !== 'number' || timeTaken < 0) {
    return sendError(res, 'VALIDATION_ERROR', 'timeTaken must be a non-negative number.', 400);
  }
  const attempt = await attemptService.createAttempt({ ...req.body, userId: req.user.userId });
  return sendSuccess(res, attempt, {}, 201);
});

const getAttemptsByUser = asyncHandler(async (req, res) => {
  const { page, limit, topic, pattern, isCorrect, questionId, sessionId } = req.query;
  const result = await attemptService.getAttemptsByUser(
    req.user.userId,
    { page, limit, topic, pattern, isCorrect, questionId, sessionId }
  );
  return sendSuccess(res, result.data, result.meta);
});

const getAttempt = asyncHandler(async (req, res) => {
  const attempt = await attemptService.getAttemptById(req.params.id);
  if (attempt.userId !== req.user.userId) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'OWNERSHIP_VIOLATION',
        message: 'Access denied: caller does not own this resource.'
      }
    });
  }
  return sendSuccess(res, attempt);
});

module.exports = { createAttempt, getAttemptsByUser, getAttempt };
