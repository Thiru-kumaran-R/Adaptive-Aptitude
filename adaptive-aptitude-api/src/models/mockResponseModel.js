'use strict';

const mongoose = require('mongoose');
const { RESPONSE_STATUS } = require('../config/mockConfig');

const mockResponseSchema = new mongoose.Schema(
  {
    sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'MockSession', required: true },
    questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
    userId: { type: String, required: true, trim: true },
    sectionId: { type: String, required: true },
    selectedAnswer: { type: String, default: null, trim: true }, // Null when unanswered/cleared
    status: {
      type: String,
      required: true,
      enum: Object.values(RESPONSE_STATUS), // 'viewed' or 'answered'
      default: RESPONSE_STATUS.VIEWED,
    },
    isMarkedForReview: { type: Boolean, default: false }, // Decoupled review flag
    isViewed: { type: Boolean, default: true },
    viewedAt: { type: Date, default: Date.now },
    timeTakenSeconds: { type: Number, default: 0, min: 0 },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: false, versionKey: false }
);

mockResponseSchema.index({ sessionId: 1, questionId: 1 }, { unique: true });
mockResponseSchema.index({ sessionId: 1, sectionId: 1 });

module.exports = mongoose.model('MockResponse', mockResponseSchema);
