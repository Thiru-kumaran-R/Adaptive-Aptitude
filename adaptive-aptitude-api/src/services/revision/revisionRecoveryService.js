'use strict';

/**
 * Revision Recovery Service — Phase 5: Spaced Revision Engine
 *
 * Reconstructs a user's RevisionItem state by querying and chronologically
 * replaying immutable historical Attempts using the exact same state machine.
 */

const Attempt = require('../../models/attemptModel');
const RevisionItem = require('../../models/revisionItemModel');
const RevisionProcessingRecord = require('../../models/revisionProcessingRecordModel');
const StudentProgress = require('../../models/studentProgressModel');
const { transitionRevisionState } = require('./revisionTransitionHelper');
const { REVISION_ALGORITHM_VERSION } = require('../../config/revisionConfig');

/**
 * Reconstructs the RevisionItem state for a given user, topic, and pattern
 * by replaying all historical attempts from oldest to newest.
 *
 * @param {string} userId
 * @param {string} topic
 * @param {string} pattern
 * @param {Object} [options]
 * @param {Date|string} [options.referenceDate] Optional reference date for testing
 * @returns {Promise<Object|null>} Reconstructed RevisionItem document
 */
const rebuildRevisionState = async (userId, topic, pattern, options = {}) => {
  if (!userId || !topic || !pattern) {
    throw new Error('userId, topic, and pattern are required to rebuild revision state.');
  }

  // 1. Fetch current student progress (for final-stage mastery evaluation)
  const progress = await StudentProgress.findOne({ userId, topic, pattern });
  const mastery = progress?.mastery || 0;

  // 2. Query all attempts in chronological order (oldest first)
  const attempts = await Attempt.find({ userId, topic, pattern }).sort({ attemptedAt: 1 });

  // Clear existing processing records for this scoped pattern
  await RevisionProcessingRecord.deleteMany({ userId, topic, pattern });

  if (attempts.length === 0) {
    // No attempts exist: delete existing RevisionItem if present
    await RevisionItem.deleteOne({ userId, topic, pattern });
    return null;
  }

  // 3. Sequentially replay attempts through the state machine
  let currentState = null;

  for (const attempt of attempts) {
    const { state: nextState, changed } = transitionRevisionState(
      currentState,
      attempt,
      mastery,
      options.referenceDate
    );
    if (changed && nextState) {
      currentState = {
        ...nextState,
        userId,
        topic,
        pattern,
      };
    }

    // Reconstruct durable receipt
    if (attempt._id) {
      try {
        await RevisionProcessingRecord.create({
          attemptId: attempt._id,
          userId,
          topic,
          pattern,
          processedAt: attempt.attemptedAt || new Date(),
          algorithmVersion: REVISION_ALGORITHM_VERSION,
        });
      } catch (receiptErr) {
        if (receiptErr.code !== 11000) throw receiptErr;
      }
    }
  }

  if (!currentState) {
    // If all attempts were correct non-revision, no RevisionItem should exist
    await RevisionItem.deleteOne({ userId, topic, pattern });
    return null;
  }

  // 4. Upsert the reconstructed state
  const reconstructed = await RevisionItem.findOneAndUpdate(
    { userId, topic, pattern },
    {
      $set: {
        stage: currentState.stage,
        intervalDays: currentState.intervalDays,
        nextReviewDate: currentState.nextReviewDate,
        lastReviewedAt: currentState.lastReviewedAt,
        lastOutcome: currentState.lastOutcome,
        consecutiveRevisionSuccesses: currentState.consecutiveRevisionSuccesses,
        status: currentState.status,
        triggerAttemptId: currentState.triggerAttemptId,
        lastProcessedAttemptId: currentState.lastProcessedAttemptId,
        processedAttemptIds: currentState.processedAttemptIds,
        algorithmVersion: currentState.algorithmVersion,
      },
    },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    }
  );

  return reconstructed;
};

/**
 * Reconstructs all RevisionItem states for a user across all attempted patterns.
 * Explicit maintenance operation that never deletes unrelated valid items.
 *
 * @param {string} userId
 * @param {Object} [options]
 * @returns {Promise<Array<Object>>}
 */
const rebuildUserRevisionState = async (userId, options = {}) => {
  if (!userId) {
    throw new Error('userId is required to rebuild user revision state.');
  }

  const distinctPatterns = await Attempt.find({ userId }).distinct('pattern');
  const results = [];

  for (const pattern of distinctPatterns) {
    const sample = await Attempt.findOne({ userId, pattern }).select('topic');
    if (sample && sample.topic) {
      const item = await rebuildRevisionState(userId, sample.topic, pattern, options);
      if (item) results.push(item);
    }
  }

  return results;
};

module.exports = {
  rebuildRevisionState,
  rebuildUserRevisionState,
};
