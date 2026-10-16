'use strict';

/**
 * Attribution Request Fingerprint Utility — Phase 10: PAOA
 *
 * Computes deterministic SHA-256 fingerprint for prescription issuance idempotency checks.
 * Normalized JSON payload preserves exact property ordering:
 *   1. userId
 *   2. originSurface
 *   3. goalId
 *   4. actionId
 */

const crypto = require('crypto');

function computeIssuanceFingerprint(userId, originSurface, goalId, actionId) {
  const normalizedPayload = {
    userId: String(userId).trim(),
    originSurface,
    goalId: goalId ? String(goalId) : null,
    actionId: actionId ? String(actionId) : null,
  };

  return crypto
    .createHash('sha256')
    .update(JSON.stringify(normalizedPayload))
    .digest('hex');
}

module.exports = {
  computeIssuanceFingerprint,
};
