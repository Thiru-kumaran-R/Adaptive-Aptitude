'use strict';

/**
 * src/models/authSessionModel.js
 * Authoritative AuthSession Model — Phase 14
 *
 * Tracks refresh token generations, enforces session family lifecycle bounds,
 * and maintains at-most-one active generation per sessionId.
 */

const mongoose = require('mongoose');

const authSessionSchema = new mongoose.Schema(
  {
    tokenId: {
      type: String,
      required: true,
      unique: true,
    },
    sessionId: {
      type: String,
      required: true,
      index: true,
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
    tokenHash: {
      type: String,
      required: true,
      unique: true,
    },
    status: {
      type: String,
      enum: ['active', 'rotated', 'revoked'],
      required: true,
      default: 'active',
    },
    replacedByTokenId: {
      type: String,
      default: null,
    },
    rotatedAt: {
      type: Date,
      default: null,
    },
    revokedAt: {
      type: Date,
      default: null,
    },
    issuedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    collection: 'authsessions',
  }
);

// ── Indexes ──────────────────────────────────────────────────────────────────
// 5. TTL Index for automatic background eviction of expired sessions
authSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// 6. Compound index for session family status audits
authSessionSchema.index({ userId: 1, sessionId: 1, status: 1 });

// 7. Active generation partial unique index with distinct physical name
authSessionSchema.index(
  { sessionId: 1 },
  {
    name: 'sessionId_active_unique',
    unique: true,
    partialFilterExpression: { status: 'active' },
  }
);

const AuthSession = mongoose.model('AuthSession', authSessionSchema);

module.exports = AuthSession;
