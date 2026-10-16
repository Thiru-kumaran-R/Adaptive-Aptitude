'use strict';

/**
 * Revision Scheduler Service — Phase 5: Spaced Revision Engine
 *
 * Processes attempts to trigger, advance, or reset RevisionItems.
 * Uses an atomic session transaction ensuring:
 * 1. RevisionProcessingRecord receipt creation and RevisionItem update commit atomically.
 * 2. If attemptId conflict occurs, transaction aborts and returns REVISION_DUPLICATE_IGNORED.
 * 3. If RevisionItem update fails, transaction aborts and receipt is rolled back.
 */

const mongoose = require('mongoose');
const RevisionItem = require('../../models/revisionItemModel');
const RevisionProcessingRecord = require('../../models/revisionProcessingRecordModel');
const StudentProgress = require('../../models/studentProgressModel');
const { transitionRevisionState } = require('./revisionTransitionHelper');
const { REVISION_REASON_CODES, REVISION_ALGORITHM_VERSION } = require('../../config/revisionConfig');

const isDuplicateOrConflict = (err) => {
  if (!err) return false;
  if (err.code === 11000 || (err.message && err.message.includes('E11000 duplicate key error'))) {
    return true;
  }
  if (err.code === 112 || err.codeName === 'WriteConflict') {
    return true;
  }
  if (typeof err.hasErrorLabel === 'function' && err.hasErrorLabel('TransientTransactionError')) {
    return true;
  }
  if (
    err.message &&
    (err.message.includes('Please retry your operation') ||
      err.message.includes('WriteConflict') ||
      err.message.includes('Write conflict'))
  ) {
    return true;
  }
  return false;
};

/**
 * Process a completed attempt and update the user's RevisionItem for that pattern.
 *
 * @param {Object} attempt Completed Attempt document
 * @param {Object} [options]
 * @param {Date|string} [options.referenceDate] Optional reference date for testing
 * @param {boolean} [options.testInjectedFailure] Optional injected failure to verify rollback
 * @returns {Promise<{ revisionItem: Object|null, reasonCode: string|null, changed: boolean }>}
 */
const processAttempt = async (attempt, options = {}) => {
  if (!attempt || !attempt.userId || !attempt.topic || !attempt.pattern) {
    return { revisionItem: null, reasonCode: null, changed: false };
  }

  // Pre-check optimization (fast return for already processed attempts)
  if (attempt._id) {
    const existingReceipt = await RevisionProcessingRecord.findOne({ attemptId: attempt._id });
    if (existingReceipt) {
      const currentItem = await RevisionItem.findOne({
        userId: attempt.userId,
        topic: attempt.topic,
        pattern: attempt.pattern,
      });
      return {
        revisionItem: currentItem,
        reasonCode: REVISION_REASON_CODES.REVISION_DUPLICATE_IGNORED,
        changed: false,
      };
    }
  }

  let session = null;
  try {
    session = await mongoose.startSession();
    session.startTransaction();

    // 1. Create RevisionProcessingRecord inside transaction (claims unique attemptId reservation)
    if (attempt._id) {
      try {
        await RevisionProcessingRecord.create(
          [
            {
              attemptId: attempt._id,
              userId: attempt.userId,
              topic: attempt.topic,
              pattern: attempt.pattern,
              processedAt: new Date(),
              algorithmVersion: REVISION_ALGORITHM_VERSION,
            },
          ],
          { session }
        );
      } catch (receiptErr) {
        if (isDuplicateOrConflict(receiptErr)) {
          await session.abortTransaction();
          // Poll briefly for competing transaction to commit its receipt
          for (let i = 0; i < 10; i++) {
            await new Promise((resolve) => setTimeout(resolve, 40 * (i + 1)));
            const conflictReceipt = await RevisionProcessingRecord.findOne({ attemptId: attempt._id });
            if (conflictReceipt) {
              const currentItem = await RevisionItem.findOne({
                userId: attempt.userId,
                topic: attempt.topic,
                pattern: attempt.pattern,
              });
              return {
                revisionItem: currentItem,
                reasonCode: REVISION_REASON_CODES.REVISION_DUPLICATE_IGNORED,
                changed: false,
              };
            }
          }
        }
        throw receiptErr;
      }
    }

    // 2. Fetch current mastery from StudentProgress
    const progress = await StudentProgress.findOne({
      userId: attempt.userId,
      topic: attempt.topic,
      pattern: attempt.pattern,
    }).session(session);
    const currentMastery = progress?.mastery || 0;

    // 3. Fetch current RevisionItem if any within session
    const currentItem = await RevisionItem.findOne({
      userId: attempt.userId,
      topic: attempt.topic,
      pattern: attempt.pattern,
    }).session(session);

    // 4. Compute state transition
    const { state: nextState, reasonCode, changed } = transitionRevisionState(
      currentItem,
      attempt,
      currentMastery,
      options.referenceDate
    );

    let updatedItem = currentItem;

    if (changed && nextState) {
      // 5. Upsert persistent RevisionItem state within session
      updatedItem = await RevisionItem.findOneAndUpdate(
        {
          userId: attempt.userId,
          topic: attempt.topic,
          pattern: attempt.pattern,
        },
        {
          $set: {
            stage: nextState.stage,
            intervalDays: nextState.intervalDays,
            nextReviewDate: nextState.nextReviewDate,
            lastReviewedAt: nextState.lastReviewedAt,
            lastOutcome: nextState.lastOutcome,
            consecutiveRevisionSuccesses: nextState.consecutiveRevisionSuccesses,
            status: nextState.status,
            triggerAttemptId: nextState.triggerAttemptId,
            lastProcessedAttemptId: nextState.lastProcessedAttemptId,
            processedAttemptIds: nextState.processedAttemptIds,
            algorithmVersion: nextState.algorithmVersion,
          },
          $setOnInsert: {
            goalId: nextState.goalId || undefined,
            planId: nextState.planId || undefined,
          },
        },
        {
          new: true,
          upsert: true,
          setDefaultsOnInsert: true,
          session,
        }
      );
    }

    // Support failure rollback simulation
    if (options.testInjectedFailure) {
      throw new Error('INJECTED_REVISION_PERSISTENCE_FAILURE');
    }

    await session.commitTransaction();
    return { revisionItem: updatedItem, reasonCode, changed: Boolean(changed) };
  } catch (txErr) {
    if (session) {
      try {
        await session.abortTransaction();
      } catch (_) {
        /* ignore */
      }
    }

    // If duplicate error occurred on attemptId (due to concurrent transaction commit race)
    if (attempt._id && !options.testInjectedFailure && isDuplicateOrConflict(txErr)) {
      for (let i = 0; i < 10; i++) {
        await new Promise((resolve) => setTimeout(resolve, 40 * (i + 1)));
        const conflictReceipt = await RevisionProcessingRecord.findOne({ attemptId: attempt._id });
        if (conflictReceipt) {
          const currentItem = await RevisionItem.findOne({
            userId: attempt.userId,
            topic: attempt.topic,
            pattern: attempt.pattern,
          });
          return {
            revisionItem: currentItem,
            reasonCode: REVISION_REASON_CODES.REVISION_DUPLICATE_IGNORED,
            changed: false,
          };
        }
      }
    }

    // Standalone fallback: compensating rollback if transactions not supported by MongoDB
    if (
      txErr.message &&
      txErr.message.includes('Transaction numbers are only allowed on a replica set member or mongos')
    ) {
      return await processAttemptStandalone(attempt, options);
    }

    throw txErr;
  } finally {
    if (session) {
      try {
        await session.endSession();
      } catch (_) {
        /* ignore */
      }
    }
  }
};

/**
 * Compensating rollback fallback for standalone MongoDB instances without replica set
 */
const processAttemptStandalone = async (attempt, options = {}) => {
  if (attempt._id) {
    try {
      await RevisionProcessingRecord.create({
        attemptId: attempt._id,
        userId: attempt.userId,
        topic: attempt.topic,
        pattern: attempt.pattern,
        processedAt: new Date(),
        algorithmVersion: REVISION_ALGORITHM_VERSION,
      });
    } catch (receiptErr) {
      if (receiptErr.code === 11000 || (receiptErr.message && receiptErr.message.includes('E11000 duplicate key error'))) {
        const currentItem = await RevisionItem.findOne({
          userId: attempt.userId,
          topic: attempt.topic,
          pattern: attempt.pattern,
        });
        return {
          revisionItem: currentItem,
          reasonCode: REVISION_REASON_CODES.REVISION_DUPLICATE_IGNORED,
          changed: false,
        };
      }
      throw receiptErr;
    }
  }

  try {
    const progress = await StudentProgress.findOne({
      userId: attempt.userId,
      topic: attempt.topic,
      pattern: attempt.pattern,
    });
    const currentMastery = progress?.mastery || 0;

    const currentItem = await RevisionItem.findOne({
      userId: attempt.userId,
      topic: attempt.topic,
      pattern: attempt.pattern,
    });

    const { state: nextState, reasonCode, changed } = transitionRevisionState(
      currentItem,
      attempt,
      currentMastery,
      options.referenceDate
    );

    if (!changed || !nextState) {
      return { revisionItem: currentItem, reasonCode, changed: false };
    }

    if (options.testInjectedFailure) {
      throw new Error('INJECTED_REVISION_PERSISTENCE_FAILURE');
    }

    const updatedItem = await RevisionItem.findOneAndUpdate(
      {
        userId: attempt.userId,
        topic: attempt.topic,
        pattern: attempt.pattern,
      },
      {
        $set: {
          stage: nextState.stage,
          intervalDays: nextState.intervalDays,
          nextReviewDate: nextState.nextReviewDate,
          lastReviewedAt: nextState.lastReviewedAt,
          lastOutcome: nextState.lastOutcome,
          consecutiveRevisionSuccesses: nextState.consecutiveRevisionSuccesses,
          status: nextState.status,
          triggerAttemptId: nextState.triggerAttemptId,
          lastProcessedAttemptId: nextState.lastProcessedAttemptId,
          processedAttemptIds: nextState.processedAttemptIds,
          algorithmVersion: nextState.algorithmVersion,
        },
        $setOnInsert: {
          goalId: nextState.goalId || undefined,
          planId: nextState.planId || undefined,
        },
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      }
    );

    return { revisionItem: updatedItem, reasonCode, changed: true };
  } catch (err) {
    if (attempt._id) {
      await RevisionProcessingRecord.deleteOne({ attemptId: attempt._id });
    }
    throw err;
  }
};

module.exports = {
  processAttempt,
  processAttemptForRevision: processAttempt,
};
