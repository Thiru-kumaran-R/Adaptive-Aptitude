'use strict';

/**
 * Attempt Model — Phase 3: Student Learning Data Layer
 *
 * Records ONE individual student attempt on ONE question.
 *
 * HISTORICAL SNAPSHOT STRATEGY:
 *   Attempt stores a snapshot of question metadata at the time of the attempt:
 *     topic, pattern, difficulty, correctAnswer
 *   These are derived SERVER-SIDE from the actual Question record.
 *   Clients may NOT provide these values — they are overridden by the server.
 *
 * IMMUTABILITY:
 *   Historical fields (listed below) represent recorded facts and must NOT be
 *   silently mutated through normal update paths:
 *     questionId, topic, pattern, difficulty, selectedAnswer, correctAnswer,
 *     isCorrect, timeTaken, attemptedAt
 *
 * SERVER-SIDE CORRECTNESS:
 *   isCorrect = (selectedAnswer === question.answer)
 *   This is computed server-side and stored as a historical fact.
 *   Clients must NOT provide isCorrect.
 *
 * NOT in Phase 3:
 *   - Legacy batch attempt structure
 *   - Adaptive next-question selection
 *   - Mastery events
 *   - Spaced repetition scheduling
 */

const mongoose = require('mongoose');

const attemptSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: [true, 'userId is required'],
      trim: true,
    },

    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question',
      required: [true, 'questionId is required'],
    },

    // ── Historical snapshot from Question record ──────────────────────────
    // Set server-side. These reflect the question at time of attempt.
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

    difficulty: {
      type: Number,
      required: [true, 'difficulty is required'],
      min: [1, 'difficulty must be at least 1'],
      max: [10, 'difficulty must be at most 10'],
      validate: {
        validator: Number.isInteger,
        message: 'difficulty must be an integer',
      },
    },

    // ── Student response ──────────────────────────────────────────────────
    selectedAnswer: {
      type: String,
      required: [true, 'selectedAnswer is required'],
      trim: true,
    },

    // ── Historical snapshot: correct answer from Question record ──────────
    correctAnswer: {
      type: String,
      required: [true, 'correctAnswer is required'],
      trim: true,
    },

    // ── Computed server-side: selectedAnswer === question.answer ──────────
    isCorrect: {
      type: Boolean,
      required: [true, 'isCorrect is required'],
    },

    // ── Time taken in seconds ─────────────────────────────────────────────
    timeTaken: {
      type: Number,
      required: [true, 'timeTaken is required'],
      min: [0, 'timeTaken must be non-negative'],
    },

    // ── Source context ────────────────────────────────────────────────────
    source: {
      type: String,
      required: [true, 'source is required'],
      enum: {
        values: ['practice', 'daily_plan', 'adaptive', 'revision', 'mock'],
        message: 'source must be one of: practice, daily_plan, adaptive, revision, mock',
      },
    },

    // ── Optional session grouping ─────────────────────────────────────────
    sessionId: {
      type: String,
      required: false,
      trim: true,
    },

    // ── Timestamp of the attempt ─────────────────────────────────────────
    attemptedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    // No timestamps: false — we manage attemptedAt explicitly.
    // No __v field.
    timestamps: false,
    versionKey: false,
  }
);

// ── Indexes for Phase 4 query patterns ────────────────────────────────────
attemptSchema.index({ userId: 1, attemptedAt: -1 });
attemptSchema.index({ userId: 1, topic: 1, attemptedAt: -1 });
attemptSchema.index({ userId: 1, pattern: 1, attemptedAt: -1 });
attemptSchema.index({ userId: 1, isCorrect: 1, attemptedAt: -1 });
attemptSchema.index({ userId: 1, questionId: 1, attemptedAt: -1 });
attemptSchema.index({ sessionId: 1 }, { sparse: true });

// ── Phase 6 Partial Unique Index: exactly one mock Attempt per (sessionId, questionId) ──
attemptSchema.index(
  { sessionId: 1, questionId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      source: 'mock',
      sessionId: { $type: 'string' },
    },
  }
);

const Attempt = mongoose.model('Attempt', attemptSchema);

module.exports = Attempt;

