'use strict';

/**
 * StudentProgress Model — Phase 3: Student Learning Data Layer
 *
 * Maintains one aggregate progress document per (userId, topic, pattern).
 *
 * UNIQUE CONSTRAINT: { userId, topic, pattern }
 *   Only one progress record may exist per student-pattern pair within a topic.
 *
 * RELATIONSHIP TO ATTEMPT:
 *   Attempt is the historical source of truth.
 *   StudentProgress is an aggregate/cache optimized for queries.
 *   Progress can be rebuilt from Attempt history via rebuildStudentProgress.js.
 *
 * FACTUAL STATISTICS (Phase 3 owns these):
 *   attempts, correct, incorrect, accuracy, totalTimeSpent, averageTime,
 *   consecutiveCorrect, consecutiveIncorrect, lastAttemptAt
 *
 * RESERVED FIELDS (Phase 4 mastery engine will update these):
 *   mastery — reserved; default 0; Phase 4 will define the mastery formula.
 *   highestDifficultyMastered — reserved; default 0; Phase 4 will set this.
 *
 * NOT in Phase 3:
 *   - mastery computation algorithm
 *   - highestDifficultyMastered inference from individual attempts
 *   - prerequisite satisfaction decisions
 *   - adaptive difficulty promotion
 */

const mongoose = require('mongoose');

const studentProgressSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: [true, 'userId is required'],
      trim: true,
    },

    topic: {
      type: String,
      required: [true, 'topic is required'],
      trim: true,
    },

    pattern: {
      type: String,
      required: [true, 'pattern is required'],
      trim: true,
    },

    // ── Factual attempt counters ───────────────────────────────────────────
    attempts: {
      type: Number,
      default: 0,
      min: [0, 'attempts must be non-negative'],
    },

    correct: {
      type: Number,
      default: 0,
      min: [0, 'correct must be non-negative'],
    },

    incorrect: {
      type: Number,
      default: 0,
      min: [0, 'incorrect must be non-negative'],
    },

    // accuracy = (correct / attempts) * 100  [computed from aggregates]
    accuracy: {
      type: Number,
      default: 0,
      min: [0, 'accuracy must be non-negative'],
      max: [100, 'accuracy must be at most 100'],
    },

    // ── Time statistics ────────────────────────────────────────────────────
    totalTimeSpent: {
      type: Number,
      default: 0,
      min: [0, 'totalTimeSpent must be non-negative'],
    },

    // averageTime = totalTimeSpent / attempts  [computed from aggregates]
    averageTime: {
      type: Number,
      default: 0,
      min: [0, 'averageTime must be non-negative'],
    },

    // ── Reserved: Phase 4 mastery engine will update these ─────────────────
    /**
     * RESERVED — Phase 4.
     * mastery will be defined and updated by the future mastery engine.
     * Phase 3 must not compute or infer mastery.
     * Default: 0 (algorithm-neutral initial value).
     */
    mastery: {
      type: Number,
      default: 0,
      min: [0, 'mastery must be between 0 and 1'],
      max: [1, 'mastery must be between 0 and 1'],
    },

    /**
     * RESERVED — Phase 4.
     * highestDifficultyMastered will be set by the mastery engine once a
     * formal definition of difficulty mastery exists.
     * Phase 3 must not infer it from individual correct answers.
     * Default: 0 (algorithm-neutral initial value).
     */
    highestDifficultyMastered: {
      type: Number,
      default: 0,
      min: [0, 'highestDifficultyMastered must be between 0 and 10'],
      max: [10, 'highestDifficultyMastered must be at most 10'],
    },

    // ── Factual streak counters ────────────────────────────────────────────
    // Correct attempt:   consecutiveCorrect += 1, consecutiveIncorrect = 0
    // Incorrect attempt: consecutiveIncorrect += 1, consecutiveCorrect = 0
    // These are factual streaks only — NOT interpreted as mastery in Phase 3.
    consecutiveCorrect: {
      type: Number,
      default: 0,
      min: [0, 'consecutiveCorrect must be non-negative'],
    },

    consecutiveIncorrect: {
      type: Number,
      default: 0,
      min: [0, 'consecutiveIncorrect must be non-negative'],
    },

    lastAttemptAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// ── Unique compound index: one progress record per student-pattern ──────────
studentProgressSchema.index(
  { userId: 1, topic: 1, pattern: 1 },
  { unique: true }
);

// ── Query indexes ──────────────────────────────────────────────────────────
// For weakest-pattern queries (sorted by mastery ascending)
studentProgressSchema.index({ userId: 1, mastery: 1 });
// For topic-level progress retrieval
studentProgressSchema.index({ userId: 1, topic: 1 });

const StudentProgress = mongoose.model('StudentProgress', studentProgressSchema);

module.exports = StudentProgress;
