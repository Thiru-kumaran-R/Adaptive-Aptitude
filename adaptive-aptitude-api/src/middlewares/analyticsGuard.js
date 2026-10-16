'use strict';

/**
 * Analytics Guard Middleware
 *
 * Enforces pre-execution analytics gates:
 * 1. Validates userId query parameter is a non-empty scalar string (or defaults to authenticated principal).
 * 2. Verifies the user exists in the database (404 USER_NOT_FOUND).
 * 3. Enforces the distributed finalization lease guard: blocks queries with
 *    409 FINALIZATION_IN_PROGRESS if a mock session is actively in finalization.
 * 4. Captures and attaches a deterministic request-level reference timestamp (req.referenceNow).
 */

const User = require('../models/userModel');
const MockSession = require('../models/mockSessionModel');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

const analyticsGuard = asyncHandler(async (req, res, next) => {
  const queryUserId = req.query?.userId;

  // 1. Validate userId parameter
  if (!queryUserId || typeof queryUserId !== 'string' || queryUserId.trim().length === 0) {
    throw new AppError(400, 'VALIDATION_ERROR', 'userId is required as a non-empty scalar string.');
  }

  const trimmedUserId = queryUserId.trim();
  req.query.userId = trimmedUserId;

  // 2. Verify user exists
  const userExists = await User.exists({ userId: trimmedUserId });
  if (!userExists) {
    throw new AppError(404, 'USER_NOT_FOUND', `User with id "${trimmedUserId}" was not found.`);
  }

  // 3. Check for active finalization lease
  const inProgressSession = await MockSession.findOne({
    userId: trimmedUserId,
    finalizationState: 'in_progress',
  }).lean();

  if (inProgressSession) {
    throw new AppError(
      409,
      'FINALIZATION_IN_PROGRESS',
      'A mock session finalization is currently in progress for this student. Analytics are locked until finalization completes.'
    );
  }

  // 4. Attach request-level reference clock
  req.referenceNow = new Date();

  next();
});

module.exports = analyticsGuard;
