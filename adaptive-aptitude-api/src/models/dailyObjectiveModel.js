'use strict';

/**
 * DailyObjective Model — Phase 3: Student Learning Data Layer
 *
 * DailyObjective represents the learning work assigned/planned for ONE
 * logical calendar day under a specific study plan.
 *
 * UNIQUENESS CONSTRAINT: { userId, planId, date } (unique compound index).
 *   - Same user + same plan + same logical date → REJECTED (duplicate).
 *   - Same user + different plan + same date → ALLOWED.
 *
 * DATE NORMALIZATION STRATEGY:
 *   Store `date` normalized to midnight UTC (beginning of the calendar day).
 *   This prevents { userId, planId, date } uniqueness bypass when the same
 *   intended daily objective is submitted with different clock times on the
 *   same calendar day. Normalization is performed in the service layer before
 *   writing.
 *
 * TARGET DIFFICULTY IS PATTERN-SPECIFIC:
 *   `targetDifficulty` belongs to each pattern entry, NOT the whole objective.
 *   This preserves: Topic → Pattern → Difficulty → Question hierarchy.
 *   `targetDifficulty` is optional (Phase 4 may assign difficulty adaptively).
 *
 * NOT in Phase 3:
 *   - Automatic daily-work generation
 *   - Prerequisite eligibility checks
 *   - Adaptive difficulty selection
 */

const mongoose = require('mongoose');

const patternObjectiveSchema = new mongoose.Schema(
  {
    pattern: {
      type: String,
      required: [true, 'pattern is required'],
      trim: true,
    },

    targetQuestions: {
      type: Number,
      required: [true, 'targetQuestions is required'],
      min: [1, 'targetQuestions must be at least 1'],
      validate: {
        validator: (v) => Number.isInteger(v) && v >= 1,
        message: 'targetQuestions must be a positive integer',
      },
    },

    completedQuestions: {
      type: Number,
      default: 0,
      min: [0, 'completedQuestions must be non-negative'],
      validate: {
        validator: (v) => Number.isInteger(v) && v >= 0,
        message: 'completedQuestions must be a non-negative integer',
      },
    },

    // Pattern-specific target difficulty (optional — Phase 4 may decide dynamically)
    targetDifficulty: {
      type: Number,
      required: false,
      min: [1, 'targetDifficulty must be at least 1'],
      max: [10, 'targetDifficulty must be at most 10'],
      validate: {
        validator: (v) => v == null || (Number.isInteger(v) && v >= 1 && v <= 10),
        message: 'targetDifficulty must be an integer between 1 and 10',
      },
    },
  },
  { _id: false }
);

const dailyObjectiveSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: [true, 'userId is required'],
      trim: true,
    },

    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StudyPlan',
      required: [true, 'planId is required'],
    },

    goalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Goal',
      required: [true, 'goalId is required'],
    },

    /**
     * Normalized to midnight UTC by the service layer.
     * This prevents bypass of the { userId, planId, date } unique index
     * when the same intended calendar day is submitted with different times.
     */
    date: {
      type: Date,
      required: [true, 'date is required'],
    },

    topic: {
      type: String,
      required: [true, 'topic is required'],
      trim: true,
    },

    patterns: {
      type: [patternObjectiveSchema],
      default: [],
    },

    targetMinutes: {
      type: Number,
      min: [0, 'targetMinutes must be non-negative'],
    },

    actualMinutes: {
      type: Number,
      default: 0,
      min: [0, 'actualMinutes must be non-negative'],
    },

    status: {
      type: String,
      enum: {
        values: ['pending', 'in_progress', 'completed', 'skipped'],
        message: 'status must be one of: pending, in_progress, completed, skipped',
      },
      default: 'pending',
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// ── Unique compound index: same user + same plan + same logical date ────────
// Prevents duplicate daily objectives for the same plan on the same day.
// Different plans for the same user on the same day ARE allowed.
dailyObjectiveSchema.index(
  { userId: 1, planId: 1, date: 1 },
  { unique: true }
);

// ── Supporting indexes ─────────────────────────────────────────────────────
dailyObjectiveSchema.index({ userId: 1, date: -1 });
dailyObjectiveSchema.index({ userId: 1, planId: 1, status: 1 });
dailyObjectiveSchema.index({ planId: 1, date: -1 });

const DailyObjective = mongoose.model('DailyObjective', dailyObjectiveSchema);

module.exports = DailyObjective;
