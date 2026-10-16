'use strict';

/**
 * PrescriptionExecutionRecord Model — Phase 10: Prescription Adherence & Learning Outcome Attribution Engine (PAOA)
 */

const mongoose = require('mongoose');

const { Schema } = mongoose;

const prescriptionExecutionRecordSchema = new Schema(
  {
    // ── Unique Identity ────────────────────────────────────────────────────────
    prescriptionId: {
      type: String,
      required: true,
      trim: true,
      match: /^rx_[a-f0-9]{24}$/,
    },

    // ── Student Identity (Consistent Phase 3 String Strategy) ──────────────────
    userId: {
      type: String,
      required: true,
      trim: true,
    },

    // ── Idempotency & Slot Concurrency Invariants ─────────────────────────────
    issuanceIdempotencyKey: {
      type: String,
      required: true,
      trim: true,
      maxlength: 128,
    },
    issuanceRequestFingerprint: {
      type: String,
      required: true,
      match: /^[a-f0-9]{64}$/, // SHA-256 hex digest
    },
    nonTerminalSlotKey: {
      type: String,
      default: null, // String(userId) while issued/active; null when terminal
    },

    // ── Algorithm Version Fingerprints ────────────────────────────────────────
    phase10AlgorithmVersion: {
      type: String,
      required: true,
      trim: true,
    },
    orchestrationAlgorithmVersion: {
      type: String,
      required: true,
      trim: true,
    },

    // ── Policy Governance Provenance (Phase 12) ──────────────────────────────
    policyVersion: {
      type: String,
      default: null,
    },
    policyFingerprint: {
      type: String,
      default: null,
    },
    policySource: {
      type: String,
      enum: ['GOVERNED_POLICY', 'CODE_BASELINE', 'CODE_BASELINE_FALLBACK'],
      default: null,
    },

    // ── Issuance Origin & Action Metadata ─────────────────────────────────────
    originSurface: {
      type: String,
      required: true,
      enum: ['next_action', 'daily_agenda'],
    },
    actionId: {
      type: String,
      required: true,
      trim: true,
    },
    actionType: {
      type: String,
      required: true,
      enum: [
        'PREREQUISITE_REMEDIATION',
        'RETENTION_RESCUE',
        'CURRICULUM_ADVANCEMENT',
        'PACING_CALIBRATION',
        'EXAM_BENCHMARK',
        'DIAGNOSTIC_ASSESSMENT',
      ],
    },
    actionSubtype: {
      type: String,
      required: true,
      trim: true,
    },
    policyPriorityClass: {
      type: Number,
      default: null,
      enum: [0, 1, 2, null],
    },
    urgencyScore: {
      type: Number,
      default: null,
    },
    priorityTier: {
      type: String,
      required: true,
      enum: ['critical', 'urgent', 'high', 'normal', 'low'],
    },

    // ── Pedagogical Targets ───────────────────────────────────────────────────
    topic: {
      type: String,
      default: null,
      trim: true,
    },
    pattern: {
      type: String,
      default: null,
      trim: true,
    },
    prescribedQuestions: {
      type: Number,
      required: true,
      min: 0,
    },
    estimatedMinutes: {
      type: Number,
      default: null,
      min: 0,
    },

    // ── Targeted Bottlenecks & Entity Links ───────────────────────────────────
    blockedTargetTopic: {
      type: String,
      default: null,
      trim: true,
    },
    blockedTargetPattern: {
      type: String,
      default: null,
      trim: true,
    },
    revisionItemId: {
      type: Schema.Types.ObjectId,
      ref: 'RevisionItem',
      default: null,
    },
    goalId: {
      type: Schema.Types.ObjectId,
      ref: 'Goal',
      default: null,
    },
    planId: {
      type: Schema.Types.ObjectId,
      ref: 'StudyPlan',
      default: null,
    },
    mockSessionId: {
      type: Schema.Types.ObjectId,
      ref: 'MockSession',
      default: null, // Populated upon verified benchmark completion
    },

    // ── Dual Pre-Execution Snapshots ──────────────────────────────────────────
    issuanceSnapshot: {
      type: Schema.Types.Mixed,
      required: true,
    },
    activationBaselineSnapshot: {
      type: Schema.Types.Mixed,
      default: null,
    },

    // ── Lifecycle & State Management ──────────────────────────────────────────
    status: {
      type: String,
      required: true,
      enum: ['issued', 'active', 'completed', 'abandoned', 'superseded', 'expired'],
      default: 'issued',
    },

    // ── Timestamps ───────────────────────────────────────────────────────────
    issuedAt: {
      type: Date,
      required: true,
    },
    activatedAt: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    abandonedAt: {
      type: Date,
      default: null,
    },
    supersededAt: {
      type: Date,
      default: null,
    },
    supersededByPrescriptionId: {
      type: String,
      default: null,
      match: /^rx_[a-f0-9]{24}$/,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    lastActivityAt: {
      type: Date,
      default: null,
    },

    // ── Outcome Evidence ─────────────────────────────────────────────────────
    executionRequirementMet: {
      type: Boolean,
      default: null,
    },
    targetMilestoneMet: {
      type: Boolean,
      default: null,
    },
    outcomeSnapshot: {
      type: Schema.Types.Mixed,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'prescriptionexecutionrecords',
  }
);

// Exactly five custom indexes registered on the schema
prescriptionExecutionRecordSchema.index(
  { prescriptionId: 1 },
  { unique: true }
);

prescriptionExecutionRecordSchema.index(
  { userId: 1, issuanceIdempotencyKey: 1 },
  { unique: true }
);

prescriptionExecutionRecordSchema.index(
  { nonTerminalSlotKey: 1 },
  {
    unique: true,
    partialFilterExpression: {
      nonTerminalSlotKey: { $type: 'string' },
    },
  }
);

prescriptionExecutionRecordSchema.index(
  { userId: 1, issuedAt: -1 }
);

prescriptionExecutionRecordSchema.index(
  { status: 1, expiresAt: 1 }
);

prescriptionExecutionRecordSchema.index(
  {
    policyVersion: 1,
    policyFingerprint: 1,
  },
  {
    sparse: true,
  }
);

const PrescriptionExecutionRecord = mongoose.model(
  'PrescriptionExecutionRecord',
  prescriptionExecutionRecordSchema
);

module.exports = PrescriptionExecutionRecord;
