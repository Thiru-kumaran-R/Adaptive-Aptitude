'use strict';

const mongoose = require('mongoose');
const registryService = require('../services/patternRegistryService');

/**
 * Question Schema
 *
 * Represents a single aptitude question in the verified Phase 2 dataset.
 * All fields are preserved exactly as imported from verified source data.
 *
 * Phase 3 compatibility: _id, topic, pattern, and difficulty are stable
 * identifiers that future Attempt records will reference as snapshots.
 *
 * NOT PRESENT (intentionally excluded):
 *   - mentor, teacher, userId, goalId, planId (old architecture)
 *   - mastery, studentProgress (Phase 3+)
 *   - adaptive fields (Phase 4+)
 */
const questionSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: [true, 'question is required'],
      trim: true,
      validate: {
        validator(v) {
          return typeof v === 'string' && v.trim().length > 0;
        },
        message: 'question cannot be empty',
      },
    },

    answer: {
      type: String,
      required: [true, 'answer is required'],
      trim: true,
      validate: [
        {
          validator(v) {
            return typeof v === 'string' && v.trim().length > 0;
          },
          message: 'answer cannot be empty',
        },
        {
          validator(v) {
            return !this.options || (Array.isArray(this.options) && this.options.includes(v));
          },
          message: 'answer must match one of the four options',
        },
      ],
    },

    options: {
      type: [String],
      required: [true, 'options are required'],
      validate: [
        {
          validator(v) {
            return Array.isArray(v) && v.length === 4;
          },
          message: 'options must be an array of exactly 4 strings',
        },
        {
          validator(v) {
            return Array.isArray(v) && v.every((opt) => typeof opt === 'string' && opt.trim().length > 0);
          },
          message: 'each option must be a non-empty string',
        },
      ],
    },

    explanation: {
      type: String,
      required: [true, 'explanation is required'],
      trim: true,
      validate: {
        validator(v) {
          return typeof v === 'string' && v.trim().length > 0;
        },
        message: 'explanation cannot be empty',
      },
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
  },
  {
    // timestamps: false — no createdAt/updatedAt on question documents
    timestamps: false,
    // versionKey: false — no __v field
    versionKey: false,
  }
);

// ── Indexes supporting expected Phase 2 query patterns ─────────────────────
// Primary compound: topic + pattern + difficulty (covers most filtered queries)
questionSchema.index({ topic: 1, pattern: 1, difficulty: 1 });
// Topic + pattern (for unfiltered pattern-level queries)
questionSchema.index({ topic: 1, pattern: 1 });
// Pattern + difficulty (cross-topic pattern difficulty queries)
questionSchema.index({ pattern: 1, difficulty: 1 });
// Topic + difficulty (topic-level difficulty queries)
questionSchema.index({ topic: 1, difficulty: 1 });
// Difficulty only (global difficulty queries)
questionSchema.index({ difficulty: 1 });

const Question = mongoose.model('Question', questionSchema);

module.exports = Question;
