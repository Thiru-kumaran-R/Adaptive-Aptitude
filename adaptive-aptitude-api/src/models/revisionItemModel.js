'use strict';

/**
 * RevisionItem Model — Phase 5: Spaced Revision Engine
 *
 * Tracks the spaced-repetition and mistake-driven review state
 * for a specific user, topic, and pattern.
 *
 * Guaranteed uniqueness: exactly ONE revision state per (userId, topic, pattern).
 */

const mongoose = require('mongoose');
const registryService = require('../services/patternRegistryService');
const { REVISION_ALGORITHM_VERSION } = require('../config/revisionConfig');

const revisionItemSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: [true, 'userId is required'],
      trim: true,
    },

    goalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Goal',
      required: false,
    },

    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StudyPlan',
      required: false,
    },

    topic: {
      type: String,
      required: [true, 'topic is required'],
      trim: true,
      validate: [
        {
          validator(v) {
            return typeof v === 'string' && v.trim().length > 0;
          },
          message: 'topic cannot be empty',
        },
        {
          validator(v) {
            return registryService.topicExists(v);
          },
          message: 'topic must exist in the canonical registry',
        },
      ],
    },

    pattern: {
      type: String,
      required: [true, 'pattern is required'],
      trim: true,
      validate: [
        {
          validator(v) {
            return typeof v === 'string' && v.trim().length > 0;
          },
          message: 'pattern cannot be empty',
        },
        {
          validator(v) {
            return registryService.patternExists(v);
          },
          message: 'pattern must exist in the canonical registry',
        },
        {
          validator(v) {
            return !this.topic || registryService.patternBelongsToTopic(v, this.topic);
          },
          message: 'pattern must belong to the stored topic',
        },
      ],
    },

    // Stage in the interval ladder (0 to 4 corresponding to [1, 3, 7, 14, 30] days)
    stage: {
      type: Number,
      default: 0,
      min: [0, 'stage must be at least 0'],
      validate: {
        validator: Number.isInteger,
        message: 'stage must be an integer',
      },
    },

    // Current review interval in days
    intervalDays: {
      type: Number,
      default: 1,
      min: [1, 'intervalDays must be at least 1'],
      validate: {
        validator: Number.isInteger,
        message: 'intervalDays must be an integer',
      },
    },

    // Normalized logical date for the next review
    nextReviewDate: {
      type: Date,
      required: [true, 'nextReviewDate is required'],
    },

    lastReviewedAt: {
      type: Date,
      required: false,
    },

    lastOutcome: {
      type: String,
      enum: {
        values: ['correct', 'incorrect'],
        message: 'lastOutcome must be either correct or incorrect',
      },
      required: false,
    },

    consecutiveRevisionSuccesses: {
      type: Number,
      default: 0,
      min: [0, 'consecutiveRevisionSuccesses must be non-negative'],
      validate: {
        validator: Number.isInteger,
        message: 'consecutiveRevisionSuccesses must be an integer',
      },
    },

    status: {
      type: String,
      enum: {
        values: ['scheduled', 'completed', 'paused'],
        message: 'status must be one of: scheduled, completed, paused',
      },
      default: 'scheduled',
    },

    // Initial attempt that triggered or reset this revision item
    triggerAttemptId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Attempt',
      required: false,
    },

    // Idempotency guard: the latest attempt ID processed by this revision item
    lastProcessedAttemptId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Attempt',
      required: false,
    },

    // Bounded ring buffer of recent attempt IDs processed by this revision item (for durable idempotency)
    processedAttemptIds: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Attempt' }],
      default: [],
    },

    algorithmVersion: {
      type: String,
      default: REVISION_ALGORITHM_VERSION,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// ── Compound unique index: exactly one revision item per user-pattern ────────
revisionItemSchema.index(
  { userId: 1, topic: 1, pattern: 1 },
  { unique: true }
);

// ── Due query index: efficient lookup of scheduled items due on or before date ──
revisionItemSchema.index(
  { userId: 1, status: 1, nextReviewDate: 1 }
);

// Supporting query indexes
revisionItemSchema.index({ userId: 1, planId: 1 }, { sparse: true });

const RevisionItem = mongoose.model('RevisionItem', revisionItemSchema);

module.exports = RevisionItem;
