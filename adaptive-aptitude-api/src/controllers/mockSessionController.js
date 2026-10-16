'use strict';

/**
 * mockSessionController.js — HTTP Controller for Mock Sessions
 *
 * Implements strict caller identity binding and document ownership verification.
 */

const mockSessionService = require('../services/mock/mockSessionService');
const { resolveSessionExpiry } = require('../services/mock/mockExpiryService');
const MockSession = require('../models/mockSessionModel');
const AppError = require('../../src/utils/AppError');
const {
  SESSION_STATUS,
  FINALIZATION_STATE,
  MOCK_ERROR_CODES,
} = require('../config/mockConfig');

const createSession = async (req, res, next) => {
  try {
    const session = await mockSessionService.createSession({
      ...req.body,
      userId: req.user.userId,
    });
    res.status(201).json({ success: true, data: session });
  } catch (err) {
    next(err);
  }
};

const startSession = async (req, res, next) => {
  try {
    const session = await MockSession.findById(req.params.id);
    if (!session) {
      throw new AppError(404, MOCK_ERROR_CODES.MOCK_SESSION_NOT_FOUND, 'Mock session not found.');
    }
    if (session.userId !== req.user.userId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'OWNERSHIP_VIOLATION',
          message: 'Access denied: caller does not own this resource.'
        }
      });
    }
    const started = await mockSessionService.startSession(req.params.id, req.user.userId);
    res.status(200).json({ success: true, data: started });
  } catch (err) {
    next(err);
  }
};

const getSession = async (req, res, next) => {
  try {
    const session = await MockSession.findById(req.params.id);
    if (!session) {
      throw new AppError(404, MOCK_ERROR_CODES.MOCK_SESSION_NOT_FOUND, 'Mock session not found.');
    }
    if (session.userId !== req.user.userId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'OWNERSHIP_VIOLATION',
          message: 'Access denied: caller does not own this resource.'
        }
      });
    }
    const result = await mockSessionService.getSessionById(req.params.id, req.user.userId);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

const getQuestion = async (req, res, next) => {
  try {
    const session = await MockSession.findById(req.params.id);
    if (!session) {
      throw new AppError(404, MOCK_ERROR_CODES.MOCK_SESSION_NOT_FOUND, 'Mock session not found.');
    }
    if (session.userId !== req.user.userId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'OWNERSHIP_VIOLATION',
          message: 'Access denied: caller does not own this resource.'
        }
      });
    }
    const result = await mockSessionService.getQuestion(req.params.id, req.user.userId, req.params.questionId);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

const saveResponse = async (req, res, next) => {
  try {
    const session = await MockSession.findById(req.params.id);
    if (!session) {
      throw new AppError(404, MOCK_ERROR_CODES.MOCK_SESSION_NOT_FOUND, 'Mock session not found.');
    }
    if (session.userId !== req.user.userId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'OWNERSHIP_VIOLATION',
          message: 'Access denied: caller does not own this resource.'
        }
      });
    }
    const response = await mockSessionService.saveResponse({
      sessionId: req.params.id,
      userId: req.user.userId,
      questionId: req.body?.questionId,
      selectedAnswer: req.body?.selectedAnswer,
      isMarkedForReview: req.body?.isMarkedForReview,
      timeTakenSeconds: req.body?.timeTakenSeconds,
    });
    res.status(200).json({ success: true, data: response });
  } catch (err) {
    next(err);
  }
};

const completeSection = async (req, res, next) => {
  try {
    const session = await MockSession.findById(req.params.id);
    if (!session) {
      throw new AppError(404, MOCK_ERROR_CODES.MOCK_SESSION_NOT_FOUND, 'Mock session not found.');
    }
    if (session.userId !== req.user.userId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'OWNERSHIP_VIOLATION',
          message: 'Access denied: caller does not own this resource.'
        }
      });
    }
    const result = await mockSessionService.completeSection(req.params.id, req.user.userId, req.params.sectionId);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

const submitSession = async (req, res, next) => {
  try {
    const session = await MockSession.findById(req.params.id);
    if (!session) {
      throw new AppError(404, MOCK_ERROR_CODES.MOCK_SESSION_NOT_FOUND, 'Mock session not found.');
    }
    if (session.userId !== req.user.userId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'OWNERSHIP_VIOLATION',
          message: 'Access denied: caller does not own this resource.'
        }
      });
    }
    const resultSummary = await mockSessionService.submitMockSession({
      sessionId: req.params.id,
      userId: req.user.userId,
    });
    res.status(200).json({ success: true, data: resultSummary });
  } catch (err) {
    next(err);
  }
};

const abandonSession = async (req, res, next) => {
  try {
    const session = await MockSession.findById(req.params.id);
    if (!session) {
      throw new AppError(404, MOCK_ERROR_CODES.MOCK_SESSION_NOT_FOUND, 'Mock session not found.');
    }
    if (session.userId !== req.user.userId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'OWNERSHIP_VIOLATION',
          message: 'Access denied: caller does not own this resource.'
        }
      });
    }
    const result = await mockSessionService.abandonSession(req.params.id, req.user.userId);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

const getResult = async (req, res, next) => {
  try {
    const sessionId = req.params.id;
    const userId = req.user.userId;
    const now = new Date();

    const session = await MockSession.findById(sessionId);
    if (!session) {
      throw new AppError(404, MOCK_ERROR_CODES.MOCK_SESSION_NOT_FOUND, 'Mock session not found.');
    }
    if (session.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'OWNERSHIP_VIOLATION',
          message: 'Access denied: caller does not own this resource.'
        }
      });
    }

    // 1. If terminal (submitted or expired) and completed: return resultSummary (200)
    if (
      (session.status === SESSION_STATUS.SUBMITTED || session.status === SESSION_STATUS.EXPIRED) &&
      session.finalizationState === FINALIZATION_STATE.COMPLETED &&
      session.resultSummary !== null
    ) {
      return res.status(200).json({ success: true, data: session.resultSummary });
    }

    // 2. If active valid finalization is currently running: return 409 FINALIZATION_IN_PROGRESS
    if (
      session.finalizationState === FINALIZATION_STATE.IN_PROGRESS &&
      session.finalizationLeaseExpiresAt &&
      session.finalizationLeaseExpiresAt > now
    ) {
      throw new AppError(
        409,
        MOCK_ERROR_CODES.FINALIZATION_IN_PROGRESS,
        'Finalization is currently in progress.'
      );
    }

    // 3. If session is STARTED and expired: run expiry resolution synchronously
    if (
      session.status === SESSION_STATUS.STARTED &&
      session.expiresAt &&
      now.getTime() >= session.expiresAt.getTime()
    ) {
      const resultSummary = await resolveSessionExpiry(sessionId, userId, now);
      return res.status(200).json({ success: true, data: resultSummary });
    }

    // 4. If session is abandoned or not terminal: 400 MOCK_SESSION_NOT_TERMINAL
    throw new AppError(
      400,
      MOCK_ERROR_CODES.MOCK_SESSION_NOT_TERMINAL,
      'Mock session is not in a terminal state.'
    );
  } catch (err) {
    next(err);
  }
};

const getReview = async (req, res, next) => {
  try {
    const session = await MockSession.findById(req.params.id);
    if (!session) {
      throw new AppError(404, MOCK_ERROR_CODES.MOCK_SESSION_NOT_FOUND, 'Mock session not found.');
    }
    if (session.userId !== req.user.userId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'OWNERSHIP_VIOLATION',
          message: 'Access denied: caller does not own this resource.'
        }
      });
    }
    const review = await mockSessionService.getReview(req.params.id, req.user.userId);
    res.status(200).json({ success: true, data: review });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createSession,
  startSession,
  getSession,
  getQuestion,
  saveResponse,
  completeSection,
  submitSession,
  abandonSession,
  getResult,
  getReview,
};
