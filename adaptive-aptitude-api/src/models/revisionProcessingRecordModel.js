'use strict';

/**
 * RevisionProcessingRecord Model — Phase 5: Spaced Revision Engine
 *
 * Append-only persistent receipt guaranteeing durable attempt idempotency:
 * The same immutable Attempt must never mutate revision state more than once,
 * even across >50, 100+, or arbitrary future attempts.
 */

const mongoose = require('mongoose');
const { REVISION_ALGORITHM_VERSION } = require('../config/revisionConfig');

const revisionProcessingRecordSchema = new mongoose.Schema(
  {
    attemptId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Attempt',
      required: [true, 'attemptId is required'],
      unique: true,
    },

    userId: {
      type: String,
      required: [true, 'userId is required'],
      index: true,
    },

    topic: {
      type: String,
      required: [true, 'topic is required'],
    },

    pattern: {
      type: String,
      required: [true, 'pattern is required'],
    },

    processedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },

    algorithmVersion: {
      type: String,
      required: true,
      default: REVISION_ALGORITHM_VERSION,
    },
  },
  {
    timestamps: false,
    versionKey: false,
  }
);

revisionProcessingRecordSchema.index({ userId: 1, processedAt: -1 });

const RevisionProcessingRecord = mongoose.model(
  'RevisionProcessingRecord',
  revisionProcessingRecordSchema
);

module.exports = RevisionProcessingRecord;
