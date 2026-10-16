'use strict';

/**
 * learningController.js — HTTP Controller for Phase 7 Intelligent Learning Endpoints
 *
 * Implements authoritative caller identity binding (req.user.userId) for all methods.
 */

const tutorService = require('../services/learning/tutorService');
const hintService = require('../services/learning/hintService');
const mistakeService = require('../services/learning/mistakeService');
const progressExplanationService = require('../services/learning/progressExplanationService');
const planExplanationService = require('../services/learning/planExplanationService');
const mockReviewService = require('../services/learning/mockReviewService');
const { checkRateLimit, acquireConcurrency, releaseConcurrency } = require('../utils/learning/rateLimiter');
const LearningError = require('../utils/learning/LearningError');
const { LEARNING_ERROR_CODES } = require('../config/learningConfig');

const tutor = async (req, res, next) => {
  const userId = req.user.userId;

  try {
    checkRateLimit(userId);
    acquireConcurrency(userId);
    try {
      const result = await tutorService.getConceptTutoring({
        ...req.body,
        userId,
      });
      res.status(200).json(result);
    } finally {
      releaseConcurrency(userId);
    }
  } catch (err) {
    next(err);
  }
};

const hint = async (req, res, next) => {
  const userId = req.user.userId;

  try {
    checkRateLimit(userId);
    acquireConcurrency(userId);
    try {
      const result = await hintService.getHint({
        ...req.body,
        userId,
      });
      res.status(200).json(result);
    } finally {
      releaseConcurrency(userId);
    }
  } catch (err) {
    next(err);
  }
};

const explainAttempt = async (req, res, next) => {
  const userId = req.user.userId;

  try {
    checkRateLimit(userId);
    acquireConcurrency(userId);
    try {
      const result = await mistakeService.explainAttempt({
        ...req.body,
        userId,
      });
      res.status(200).json(result);
    } finally {
      releaseConcurrency(userId);
    }
  } catch (err) {
    next(err);
  }
};

const explainProgress = async (req, res, next) => {
  const userId = req.user.userId;

  try {
    if (!req.body.userId || typeof req.body.userId !== 'string' || req.body.userId.trim().length === 0) {
      throw new LearningError(400, LEARNING_ERROR_CODES.VALIDATION_ERROR, 'userId is required.');
    }
    checkRateLimit(userId);
    acquireConcurrency(userId);
    try {
      const result = await progressExplanationService.explainProgress({
        ...req.body,
        userId,
      });
      res.status(200).json(result);
    } finally {
      releaseConcurrency(userId);
    }
  } catch (err) {
    next(err);
  }
};

const explainPlan = async (req, res, next) => {
  const userId = req.user.userId;

  try {
    checkRateLimit(userId);
    acquireConcurrency(userId);
    try {
      const result = await planExplanationService.explainPlan({
        ...req.body,
        userId,
      });
      res.status(200).json(result);
    } finally {
      releaseConcurrency(userId);
    }
  } catch (err) {
    next(err);
  }
};

const mockReview = async (req, res, next) => {
  const userId = req.user.userId;

  try {
    checkRateLimit(userId);
    acquireConcurrency(userId);
    try {
      const result = await mockReviewService.getMockReview({
        ...req.body,
        userId,
      });
      res.status(200).json(result);
    } finally {
      releaseConcurrency(userId);
    }
  } catch (err) {
    next(err);
  }
};

module.exports = {
  tutor,
  hint,
  explainAttempt,
  explainProgress,
  explainPlan,
  mockReview,
};
