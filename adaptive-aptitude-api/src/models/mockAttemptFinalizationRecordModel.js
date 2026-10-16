'use strict';

const mongoose = require('mongoose');

const mockAttemptFinalizationRecordSchema = new mongoose.Schema(
  {
    sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'MockSession', required: true },
    questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
    userId: { type: String, required: true, trim: true },
    attemptId: { type: mongoose.Schema.Types.ObjectId, ref: 'Attempt', required: true },
    algorithmVersion: { type: String, required: true, default: 'v1' },
    status: { type: String, enum: ['completed'], default: 'completed' },
    finalizedAt: { type: Date, default: Date.now },
  },
  { timestamps: false, versionKey: false }
);

mockAttemptFinalizationRecordSchema.index({ sessionId: 1, questionId: 1 }, { unique: true });
mockAttemptFinalizationRecordSchema.index({ sessionId: 1, attemptId: 1 });

module.exports = mongoose.model('MockAttemptFinalizationRecord', mockAttemptFinalizationRecordSchema);
