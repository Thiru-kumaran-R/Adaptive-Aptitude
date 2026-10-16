'use strict';

/**
 * Attribution Guard Middleware — Phase 10: PAOA
 *
 * Enforces pre-execution attribution gates:
 * 1. Single request-level reference clock initialization (req.referenceNow).
 * 2. Validates userId is a non-empty scalar string (or defaults to authenticated principal).
 * 3. Verifies student exists in database (404 USER_NOT_FOUND).
 * 4. Provides mock finalization barrier helper.
 */

const User = require('../models/userModel');
const MockSession = require('../models/mockSessionModel');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Asserts no mock session finalization is currently in progress for the user.
 * Throws 409 FINALIZATION_IN_PROGRESS if locked.
 */
const assertNoFinalizationInProgress = async (userId) => {
  const inProgressSession = await MockSession.findOne({
    userId,
    finalizationState: 'in_progress',
  }).select('_id finalizationState').lean();

  if (inProgressSession) {
    throw new AppError(
      409,
      'FINALIZATION_IN_PROGRESS',
      'Cannot execute attribution operation: mock session finalization is currently in progress.'
    );
  }
};

const attributionGuard = asyncHandler(async (req, res, next) => {
  // 1. Clock Initialization — capture exactly one referenceNow for the request
  const headerTime = req.headers['x-reference-now'];
  const referenceNow = req.referenceNow || (headerTime ? new Date(headerTime) : new Date());
  req.referenceNow = referenceNow;

  // 2. Extract userId from body (POST) or params/query (GET)
  const candidateUserId = req.method === 'GET'
    ? (req.params?.userId !== undefined ? req.params.userId : req.query?.userId)
    : req.body?.userId;

  const rawUserId = (typeof candidateUserId === 'string' && candidateUserId.trim().length > 0)
    ? candidateUserId
    : req.user?.userId;

  // 3. Validate userId parameter
  if (!rawUserId || typeof rawUserId !== 'string' || rawUserId.trim().length === 0) {
    throw new AppError(400, 'VALIDATION_ERROR', 'userId is required and must be a non-empty string.');
  }

  const trimmedUserId = rawUserId.trim();

  // Bind to body if absent
  if (req.body && !req.body.userId) {
    req.body.userId = trimmedUserId;
  }

  // 4. Verify user exists
  const userExists = await User.exists({ userId: trimmedUserId });
  if (!userExists) {
    throw new AppError(404, 'USER_NOT_FOUND', `User "${trimmedUserId}" not found.`);
  }

  // 5. Check for active finalization barrier
  await assertNoFinalizationInProgress(trimmedUserId);

  next();
});

module.exports = attributionGuard;
module.exports.attributionGuard = attributionGuard;
module.exports.assertNoFinalizationInProgress = assertNoFinalizationInProgress;
