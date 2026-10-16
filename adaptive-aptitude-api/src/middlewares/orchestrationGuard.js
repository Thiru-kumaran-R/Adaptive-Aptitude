'use strict';

/**
 * Dedicated Orchestration Guard Middleware — Phase 9
 *
 * Enforces pre-execution orchestration gates:
 * 1. Single request-level reference clock initialization (req.referenceNow).
 * 2. Validates userId query parameter is a non-empty scalar string (or defaults to authenticated principal).
 * 3. Verifies the user exists in the database (404 USER_NOT_FOUND).
 * 4. Validates optional goalId syntax, existence, and strict ownership (403 OWNERSHIP_VIOLATION on foreign goal).
 * 5. Checks for active mock finalization in progress (409 FINALIZATION_IN_PROGRESS).
 * 6. Attaches validated execution context to req.orchestrationContext.
 */

const User = require('../models/userModel');
const Goal = require('../models/goalModel');
const MockSession = require('../models/mockSessionModel');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/;

const orchestrationGuard = asyncHandler(async (req, res, next) => {
  // 1. Clock Initialization — capture exactly one referenceNow for the request
  const referenceNow = req.referenceNow || new Date();
  req.referenceNow = referenceNow;

  const queryUserId = req.query?.userId;

  // 2. Validate userId parameter
  if (!queryUserId || typeof queryUserId !== 'string' || queryUserId.trim().length === 0) {
    throw new AppError(400, 'VALIDATION_ERROR', 'userId query parameter is required and must be a non-empty string.');
  }

  const trimmedUserId = queryUserId.trim();
  req.query.userId = trimmedUserId;

  // 3. Verify user exists
  const userExists = await User.exists({ userId: trimmedUserId });
  if (!userExists) {
    throw new AppError(404, 'USER_NOT_FOUND', `User "${trimmedUserId}" not found.`);
  }

  // 4. Optional goalId validation & ownership check
  const { goalId } = req.query;
  let resolvedGoal = null;
  if (goalId !== undefined) {
    if (typeof goalId !== 'string' || !OBJECT_ID_REGEX.test(goalId)) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Invalid goalId format. Must be a 24-character hexadecimal string.');
    }

    resolvedGoal = await Goal.findById(goalId).lean();
    if (!resolvedGoal) {
      throw new AppError(404, 'GOAL_NOT_FOUND', `Goal "${goalId}" not found.`);
    }

    if (resolvedGoal.userId !== trimmedUserId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'OWNERSHIP_VIOLATION',
          message: 'Access denied: caller does not own this resource.'
        }
      });
    }
  }

  // 5. Finalization lease guard check
  const inProgressSession = await MockSession.findOne({
    userId: trimmedUserId,
    finalizationState: 'in_progress',
  }).select('_id finalizationState').lean();

  if (inProgressSession) {
    throw new AppError(
      409,
      'FINALIZATION_IN_PROGRESS',
      'Cannot execute orchestration query: mock session finalization is currently in progress.'
    );
  }

  // 6. Execution context attachment
  req.orchestrationContext = {
    userId: trimmedUserId,
    goalId: goalId ? String(goalId).trim() : null,
    resolvedGoal,
    referenceNow,
  };

  next();
});

module.exports = orchestrationGuard;
