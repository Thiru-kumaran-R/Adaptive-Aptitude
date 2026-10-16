'use strict';

const mongoose = require('mongoose');
const { MOCK_MODES, NAVIGATION_POLICIES, BLUEPRINT_STATUS } = require('../config/mockConfig');

// Explicit Scope: genuine patterns-only, topics-only, topics+patterns, or allCanonicalPatterns.
// No syllabus is ever fabricated from company, government, competitive exams, goal types, or blueprint titles.
const sectionScopeSchema = new mongoose.Schema(
  {
    topics: { type: [String], default: undefined }, // Canonical topics (optional)
    patterns: { type: [String], default: undefined }, // Canonical patterns (optional, genuine patterns-only supported)
    allCanonicalPatterns: { type: Boolean, default: false }, // When true, topics/patterns must be empty/omitted
  },
  { _id: false }
);

const difficultyDistributionSchema = new mongoose.Schema(
  {
    easy: { type: Number, required: true, min: 0, max: 1 },
    medium: { type: Number, required: true, min: 0, max: 1 },
    hard: { type: Number, required: true, min: 0, max: 1 },
  },
  { _id: false }
);

const sectionScoringSchema = new mongoose.Schema(
  {
    correctMarks: { type: Number, required: true, min: 0.0001 },
    incorrectMarks: { type: Number, required: true, max: 0 },
    unansweredMarks: { type: Number, required: true, max: 0 },
  },
  { _id: false }
);

const sectionSchema = new mongoose.Schema(
  {
    sectionId: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    order: { type: Number, required: true, min: 0 }, // Server-derived (0, 1, 2...)
    questionCount: { type: Number, required: true, min: 1, max: 200 },
    durationMinutes: { type: Number, default: null, min: 1 }, // Null for free nav or untimed; required for all if any timed
    scope: { type: sectionScopeSchema, required: true },
    difficultyDistribution: { type: difficultyDistributionSchema, default: null },
    scoring: { type: sectionScoringSchema, default: null },
  },
  { _id: false }
);

const mockBlueprintSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: '' },
    mode: {
      type: String,
      required: true,
      enum: Object.values(MOCK_MODES),
      default: MOCK_MODES.STANDARD,
    },
    navigationPolicy: {
      type: String,
      required: true,
      enum: Object.values(NAVIGATION_POLICIES),
      default: NAVIGATION_POLICIES.FREE,
    },
    durationMinutes: { type: Number, required: true, min: 1, max: 360 },
    totalQuestions: { type: Number, required: true, min: 1, max: 200 }, // Server-derived sum(sections.questionCount)
    scoring: {
      correctMarks: { type: Number, required: true, min: 0.0001, default: 1.0 },
      incorrectMarks: { type: Number, required: true, max: 0, default: 0.0 },
      unansweredMarks: { type: Number, required: true, max: 0, default: 0.0 },
    },
    excludeRecentQuestions: { type: Boolean, default: null }, // Null delegates to mode default; boolean overrides
    sections: {
      type: [sectionSchema],
      required: true,
      validate: [
        {
          validator: (val) => Array.isArray(val) && val.length > 0,
          message: 'Blueprint must contain at least one section.',
        },
      ],
    },
    blueprintFingerprint: { type: String, required: true, trim: true, index: true }, // Server-derived SHA-256
    status: {
      type: String,
      required: true,
      enum: Object.values(BLUEPRINT_STATUS),
      default: BLUEPRINT_STATUS.ACTIVE,
    },
    algorithmVersion: { type: String, required: true, default: 'v1' }, // Server-derived
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: false, versionKey: false }
);

mockBlueprintSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('MockBlueprint', mockBlueprintSchema);
