'use strict';

const mongoose = require('mongoose');
const {
  SESSION_STATUS,
  FINALIZATION_STATE,
  NAVIGATION_POLICIES,
  MOCK_MODES,
  SECTION_STATUS,
} = require('../config/mockConfig');

const questionSequenceEntrySchema = new mongoose.Schema(
  {
    questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
    sectionId: { type: String, required: true },
    order: { type: Number, required: true },
    topic: { type: String, required: true },
    pattern: { type: String, required: true },
    difficulty: { type: Number, required: true },
  },
  { _id: false }
);

const sessionSectionStateSchema = new mongoose.Schema(
  {
    sectionId: { type: String, required: true },
    order: { type: Number, required: true },
    status: {
      type: String,
      required: true,
      enum: Object.values(SECTION_STATUS), // Enforced canonical enum
      default: SECTION_STATUS.PENDING,
    },
    startedAt: { type: Date, default: null },
    expiresAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    durationMinutes: { type: Number, default: null },
    questionCount: { type: Number, required: true },
  },
  { _id: false }
);

const mockSessionSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, trim: true },
    blueprintId: { type: mongoose.Schema.Types.ObjectId, ref: 'MockBlueprint', default: null },
    blueprintSnapshot: { type: mongoose.Schema.Types.Mixed, required: true },
    blueprintFingerprint: { type: String, required: true },
    mode: { type: String, required: true, enum: Object.values(MOCK_MODES) },
    navigationPolicy: { type: String, required: true, enum: Object.values(NAVIGATION_POLICIES) },
    effectiveExcludeRecentQuestions: { type: Boolean, required: true }, // Persisted effective value
    currentSectionId: { type: String, default: null }, // Null before start, or valid sectionId in sectionStates
    questionSequence: { type: [questionSequenceEntrySchema], required: true },
    sectionStates: { type: [sessionSectionStateSchema], required: true },
    totalQuestions: { type: Number, required: true },
    durationMinutes: { type: Number, required: true },
    generationSeed: { type: String, required: true },
    algorithmVersion: { type: String, required: true, default: 'v1' },

    status: {
      type: String,
      required: true,
      enum: Object.values(SESSION_STATUS),
      default: SESSION_STATUS.CREATED, // created → started → [submitted | expired | abandoned]
    },

    // ── Concurrency & Database-Level Write Contention ───────────────────────
    responseMutationVersion: { type: Number, default: 0 },
    responsesFrozen: { type: Boolean, default: false },

    // ── Distributed Finalization Lease ─────────────────────────────────────
    finalizationState: {
      type: String,
      required: true,
      enum: Object.values(FINALIZATION_STATE),
      default: FINALIZATION_STATE.IDLE,
    },
    finalizationOwnerToken: { type: String, default: null },
    finalizationLeaseExpiresAt: { type: Date, default: null },
    finalizationHeartbeatAt: { type: Date, default: null },
    finalizationStartedAt: { type: Date, default: null }, // Preserved across recovery; set only on initial acquisition
    finalizationTargetStatus: {
      type: String,
      enum: [SESSION_STATUS.SUBMITTED, SESSION_STATUS.EXPIRED],
      default: null,
      // Records the immutable terminal intention of a finalization lifecycle. Not another session state.
    },

    // ── Exact Server Timestamps ───────────────────────────────────────────
    createdAt: { type: Date, default: Date.now },
    startedAt: { type: Date, default: null },
    expiresAt: { type: Date, default: null },
    submittedAt: { type: Date, default: null },
    expiredAt: { type: Date, default: null },
    abandonedAt: { type: Date, default: null }, // Populated on POST /abandon; terminal state

    // ── Frozen Final Score & Analytics Summary ────────────────────────────
    resultSummary: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { timestamps: false, versionKey: false }
);

mockSessionSchema.index({ userId: 1, status: 1, createdAt: -1 });
mockSessionSchema.index({ expiresAt: 1 }, { partialFilterExpression: { status: 'started' } });
mockSessionSchema.index(
  { finalizationOwnerToken: 1, finalizationLeaseExpiresAt: 1 },
  { partialFilterExpression: { finalizationOwnerToken: { $type: 'string' } } }
);

module.exports = mongoose.model('MockSession', mockSessionSchema);
