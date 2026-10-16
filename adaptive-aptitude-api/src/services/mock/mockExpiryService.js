'use strict';

/**
 * mockExpiryService.js — Centralized Expiry Orchestration & Lazy Finalization
 *
 * Implements:
 * 1. resolveSessionExpiry (Centralized entry boundary for global expiry)
 * 2. Idempotent zero-write returns on completed terminal sessions
 * 3. 409 FINALIZATION_IN_PROGRESS detection when active lease is owned
 * 4. Automatic handoff to acquireFinalizationLease with targetStatus = 'expired'
 */

const crypto = require('crypto');
const MockSession = require('../../models/mockSessionModel');
const {
  SESSION_STATUS,
  FINALIZATION_STATE,
  MOCK_ERROR_CODES,
} = require('../../config/mockConfig');
const {
  acquireFinalizationLease,
  processFinalizationWithOwnedLease,
} = require('./mockFinalizationService');
const AppError = require('../../utils/AppError');

/**
 * Centralized expiry resolution orchestrator.
 * Evaluates global session timer and triggers finalization if expired.
 * Idempotent: produces zero writes if already finalized.
 */
const resolveSessionExpiry = async (sessionId, userId, now = new Date()) => {
  const session = await MockSession.findById(sessionId);
  if (!session) {
    throw new AppError(404, MOCK_ERROR_CODES.MOCK_SESSION_NOT_FOUND, 'Mock session not found.');
  }
  if (session.userId !== userId) {
    throw new AppError(403, MOCK_ERROR_CODES.FORBIDDEN, 'Access denied.');
  }

  // 1. Zero-write idempotent return if already expired and fully finalized
  if (
    session.status === SESSION_STATUS.EXPIRED &&
    session.finalizationState === FINALIZATION_STATE.COMPLETED &&
    session.resultSummary !== null
  ) {
    return session.resultSummary;
  }

  // 2. Return existing resultSummary if already submitted and completed
  if (
    session.status === SESSION_STATUS.SUBMITTED &&
    session.finalizationState === FINALIZATION_STATE.COMPLETED &&
    session.resultSummary !== null
  ) {
    return session.resultSummary;
  }

  // 3. Abandoned session cannot be finalized as expired
  if (session.status === SESSION_STATUS.ABANDONED) {
    throw new AppError(409, MOCK_ERROR_CODES.SESSION_STATE_CONFLICT, 'Mock session has been abandoned.');
  }

  // 4. Active valid finalization in progress:
  // If another worker owns an active unexpired lease (leaseExpiresAt > now),
  // surface structured FINALIZATION_IN_PROGRESS conflict. NEVER return null as a finalized result!
  if (
    session.finalizationState === FINALIZATION_STATE.IN_PROGRESS &&
    session.finalizationLeaseExpiresAt &&
    session.finalizationLeaseExpiresAt > now
  ) {
    throw new AppError(
      409,
      MOCK_ERROR_CODES.FINALIZATION_IN_PROGRESS,
      'Mock session finalization is currently in progress. Please retry shortly.'
    );
  }

  // 5. If session is not active or hasn't expired yet, return null
  if (session.status !== SESSION_STATUS.STARTED) {
    return null;
  }
  if (session.expiresAt && now.getTime() < session.expiresAt.getTime()) {
    return null;
  }

  // 6. Clock has reached or passed expiry (now >= expiresAt): acquire lease and finalize as expired
  const workerToken = crypto.randomUUID();
  const leaseResult = await acquireFinalizationLease(
    sessionId,
    userId,
    workerToken,
    SESSION_STATUS.EXPIRED
  );
  return await processFinalizationWithOwnedLease(leaseResult);
};

module.exports = {
  resolveSessionExpiry,
};
