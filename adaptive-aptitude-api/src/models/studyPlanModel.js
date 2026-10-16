'use strict';

/**
 * StudyPlan Model — Phase 3: Student Learning Data Layer
 *
 * A StudyPlan describes WHAT the student intends to study over a period,
 * linked to a specific Goal.
 *
 * Validation:
 *   - goalId must reference a real Goal (validated in service layer)
 *   - each target.topic must exist in canonical registry
 *   - each target.pattern (if provided) must exist and belong to the topic
 *   - targetMastery 0–1 (reserved for Phase 4 mastery engine to interpret)
 *
 * NOT in Phase 3:
 *   - Automatic plan generation from goal
 *   - Automatic replanning / topic rebalancing
 */

const mongoose = require('mongoose');

const studyPlanTargetSchema = new mongoose.Schema(
  {
    topic: {
      type: String,
      required: [true, 'target topic is required'],
      trim: true,
    },

    pattern: {
      type: String,
      trim: true,
    },

    targetQuestions: {
      type: Number,
      min: [1, 'targetQuestions must be at least 1'],
      validate: {
        validator: (v) => v == null || (Number.isInteger(v) && v >= 1),
        message: 'targetQuestions must be a positive integer',
      },
    },

    targetMastery: {
      type: Number,
      min: [0, 'targetMastery must be between 0 and 1'],
      max: [1, 'targetMastery must be between 0 and 1'],
    },
  },
  { _id: false }
);

const studyPlanSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: [true, 'userId is required'],
      trim: true,
    },

    goalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Goal',
      required: [true, 'goalId is required'],
    },

    name: {
      type: String,
      required: [true, 'name is required'],
      trim: true,
      validate: {
        validator: (v) => typeof v === 'string' && v.trim().length > 0,
        message: 'name cannot be empty',
      },
    },

    scope: {
      type: String,
      enum: {
        values: ['short', 'medium', 'long'],
        message: 'scope must be one of: short, medium, long',
      },
    },

    phase: {
      type: String,
      enum: {
        values: ['foundation', 'core', 'pattern', 'advanced', 'revision', 'mock'],
        message: 'phase must be one of: foundation, core, pattern, advanced, revision, mock',
      },
    },

    startDate: {
      type: Date,
    },

    endDate: {
      type: Date,
    },

    status: {
      type: String,
      enum: {
        values: ['planned', 'active', 'completed', 'paused', 'cancelled'],
        message: 'status must be one of: planned, active, completed, paused, cancelled',
      },
      default: 'planned',
    },

    targets: [studyPlanTargetSchema],

    // ── Phase 5: Automated Planning Metadata ─────────────────────────────────
    planningMeta: {
      type: {
        algorithmVersion: { type: String, default: 'v1' },
        durationPreset: { type: String },
        generatedAutomatically: { type: Boolean, default: true },
        dailyQuestionBudget: { type: Number },
        dailyMinutes: { type: Number },
        maxPatternsPerDay: { type: Number },
        includeMastered: { type: Boolean, default: false },
        generatedAt: { type: Date, default: Date.now },
      },
      required: false,
      _id: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// ── Indexes ────────────────────────────────────────────────────────────────
studyPlanSchema.index({ userId: 1, goalId: 1, status: 1 });
studyPlanSchema.index({ userId: 1, status: 1 });
studyPlanSchema.index({ goalId: 1 });

const StudyPlan = mongoose.model('StudyPlan', studyPlanSchema);

module.exports = StudyPlan;
