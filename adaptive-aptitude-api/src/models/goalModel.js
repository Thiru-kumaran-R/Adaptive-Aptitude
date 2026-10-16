'use strict';

/**
 * Goal Model — Phase 3: Student Learning Data Layer
 *
 * A Goal represents WHY the student is studying.
 * It is the top-level anchor for study plans.
 *
 * userId (String) is consistent with all Phase 3 student-owned collections.
 *
 * Validation:
 *   - targetDate >= startDate (when both are provided)
 *   - priority 1–5
 *   - valid type and status enums
 *
 * NOT in Phase 3:
 *   - Automatic goal activation / deactivation via adaptive logic
 *   - Score prediction or adaptive goal-score adjustment
 */

const mongoose = require('mongoose');

const goalSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: [true, 'userId is required'],
      trim: true,
    },

    title: {
      type: String,
      required: [true, 'title is required'],
      trim: true,
      validate: {
        validator: (v) => typeof v === 'string' && v.trim().length > 0,
        message: 'title cannot be empty',
      },
    },

    type: {
      type: String,
      required: [true, 'type is required'],
      enum: {
        values: ['company', 'government', 'entrance', 'competitive', 'master', 'custom'],
        message: 'type must be one of: company, government, entrance, competitive, master, custom',
      },
    },

    targetName: {
      type: String,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
    },

    startDate: {
      type: Date,
    },

    targetDate: {
      type: Date,
    },

    targetScore: {
      type: Number,
      min: [0, 'targetScore must be non-negative'],
    },

    priority: {
      type: Number,
      min: [1, 'priority must be at least 1'],
      max: [5, 'priority must be at most 5'],
      validate: {
        validator: (v) => v == null || Number.isInteger(v),
        message: 'priority must be an integer',
      },
    },

    status: {
      type: String,
      enum: {
        values: ['planned', 'active', 'completed', 'paused', 'cancelled'],
        message: 'status must be one of: planned, active, completed, paused, cancelled',
      },
      default: 'planned',
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// ── Custom validator: targetDate >= startDate ──────────────────────────────
goalSchema.pre('validate', function (next) {
  if (this.startDate && this.targetDate && this.targetDate < this.startDate) {
    this.invalidate('targetDate', 'targetDate must be greater than or equal to startDate');
  }
  next();
});

// ── Indexes ────────────────────────────────────────────────────────────────
goalSchema.index({ userId: 1, status: 1 });
goalSchema.index({ userId: 1, targetDate: 1 });
goalSchema.index({ userId: 1, priority: 1 });

const Goal = mongoose.model('Goal', goalSchema);

module.exports = Goal;
