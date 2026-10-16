'use strict';

/**
 * Attempt Service — Phase 3
 *
 * ATTEMPT CREATION PROTOCOL:
 *   Client provides: userId, questionId, selectedAnswer, timeTaken, source, sessionId
 *   Server derives: topic, pattern, difficulty, correctAnswer, isCorrect, attemptedAt
 *
 * CONSISTENCY STRATEGY (with conditional transaction support):
 *   Step 1: Create the Attempt document.
 *   Step 2: Update StudentProgress aggregates.
 *
 *   Attempt is the primary record — if step 2 fails, the Attempt is still
 *   preserved so it can be reprocessed via rebuildStudentProgress.js.
 *   Atlas free-tier transactions are attempted via startSession() — if Atlas
 *   does not support multi-document transactions (e.g., replica set not
 *   available), we fall back to sequential writes.
 *
 * NOT in Phase 3:
 *   - Adaptive next-question selection after each attempt
 *   - Mastery events triggered by attempt outcomes
 *   - Spaced repetition scheduling
 */

const mongoose = require('mongoose');
const Question = require('../models/questionModel');
const Attempt = require('../models/attemptModel');
const studentProgressService = require('./studentProgressService');
const masteryService = require('./adaptive/masteryService');
const revisionSchedulerService = require('./revision/revisionSchedulerService');
const { userExists } = require('./userService');

const createAttempt = async ({ userId, questionId, selectedAnswer, timeTaken, source, sessionId }) => {
  // 1. Validate user
  if (!(await userExists(userId))) {
    const err = new Error(`User "${userId}" not found.`);
    err.statusCode = 404;
    err.code = 'USER_NOT_FOUND';
    throw err;
  }

  // 2. Load question — derive server-side snapshot fields
  const question = await Question.findById(questionId);
  if (!question) {
    const err = new Error(`Question "${questionId}" not found.`);
    err.statusCode = 404;
    err.code = 'QUESTION_NOT_FOUND';
    throw err;
  }

  // 3. Compute server-side correctness
  const correctAnswer = question.answer;
  const isCorrect = selectedAnswer === correctAnswer;
  const attemptedAt = new Date();

  const attemptData = {
    userId,
    questionId: question._id,
    topic: question.topic,
    pattern: question.pattern,
    difficulty: question.difficulty,
    selectedAnswer,
    correctAnswer,
    isCorrect,
    timeTaken,
    source,
    sessionId: sessionId || undefined,
    attemptedAt,
  };

  // 4. Try transaction-safe write; fall back to sequential writes if transactions unavailable
  let session = null;
  let attempt;

  try {
    session = await mongoose.startSession();
    session.startTransaction();

    attempt = await Attempt.create([attemptData], { session });
    attempt = attempt[0];

    await studentProgressService.updateProgressFromAttempt(
      {
        userId,
        topic: question.topic,
        pattern: question.pattern,
        difficulty: question.difficulty,
        isCorrect,
        timeTaken,
        attemptedAt,
      },
      { session }
    );

    await session.commitTransaction();
  } catch (transactionErr) {
    // If transaction fails (e.g. no replica set), fall back to sequential writes
    if (session) {
      try { await session.abortTransaction(); } catch (_) { /* ignore */ }
    }

    // Attempt is the primary record — write it first (outside transaction)
    attempt = await Attempt.create(attemptData);

    // Best-effort factual progress update
    try {
      await studentProgressService.updateProgressFromAttempt({
        userId,
        topic: question.topic,
        pattern: question.pattern,
        difficulty: question.difficulty,
        isCorrect,
        timeTaken,
        attemptedAt,
      });
    } catch (progressErr) {
      console.error(
        `[AttemptService] Progress update failed for userId=${userId}, questionId=${questionId}. ` +
        `Attempt ${attempt._id} is preserved. Run rebuildStudentProgress to repair. ` +
        `Error: ${progressErr.message}`
      );
    }
  } finally {
    if (session) {
      try { await session.endSession(); } catch (_) { /* ignore */ }
    }
  }

  // 5. Post-Attempt: recalculate derived mastery & highestDifficultyMastered
  // Attempt and factual aggregates are already safely committed.
  // If derived recalculation fails, Attempt is preserved and structured error is logged.
  try {
    await masteryService.recalculateAndPersistPatternMastery(
      userId,
      question.topic,
      question.pattern
    );
  } catch (masteryErr) {
    console.error(
      JSON.stringify({
        event: 'MASTERY_RECALCULATION_FAILED',
        userId,
        topic: question.topic,
        pattern: question.pattern,
        attemptId: attempt._id,
        errorCode: masteryErr.code || 'MASTERY_UPDATE_FAILED',
      })
    );
  }

  // 6. Post-Attempt: process Phase 5 revision state
  // Attempt, progress, and mastery are already safely committed.
  // If revision scheduling fails, Attempt is preserved and structured error is logged.
  try {
    await revisionSchedulerService.processAttempt(attempt);
  } catch (revisionErr) {
    console.error(
      JSON.stringify({
        event: 'REVISION_SCHEDULING_FAILED',
        userId,
        topic: question.topic,
        pattern: question.pattern,
        attemptId: attempt._id,
        errorCode: revisionErr.code || 'REVISION_UPDATE_FAILED',
      })
    );
  }

  return attempt;
};

const getAttemptById = async (id) => {
  const attempt = await Attempt.findById(id);
  if (!attempt) {
    const err = new Error('Attempt not found.');
    err.statusCode = 404;
    err.code = 'ATTEMPT_NOT_FOUND';
    throw err;
  }
  return attempt;
};

const getAttemptsByUser = async (userId, filters = {}) => {
  const query = { userId };
  if (filters.topic) query.topic = filters.topic;
  if (filters.pattern) query.pattern = filters.pattern;
  if (filters.isCorrect !== undefined) {
    query.isCorrect = filters.isCorrect === 'true' || filters.isCorrect === true;
  }
  if (filters.questionId) query.questionId = filters.questionId;
  if (filters.sessionId) query.sessionId = filters.sessionId;

  const page = Math.max(1, parseInt(filters.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(filters.limit) || 20));
  const skip = (page - 1) * limit;

  const total = await Attempt.countDocuments(query);
  const data = await Attempt.find(query)
    .sort({ attemptedAt: -1 })
    .skip(skip)
    .limit(limit);

  return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit), count: data.length } };
};

module.exports = { createAttempt, getAttemptById, getAttemptsByUser };
