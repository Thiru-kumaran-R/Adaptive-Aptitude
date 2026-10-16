'use strict';

/**
 * StudentProgress Service — Phase 3
 *
 * Manages aggregate progress documents per (userId, topic, pattern).
 *
 * PROGRESS UPDATE FORMULA:
 *   attempts       += 1
 *   correct        += isCorrect ? 1 : 0
 *   incorrect      += isCorrect ? 0 : 1
 *   totalTimeSpent += timeTaken
 *   lastAttemptAt   = attemptedAt
 *   accuracy        = (correct / attempts) * 100
 *   averageTime     = totalTimeSpent / attempts
 *   consecutiveCorrect: +1 on correct, reset to 0 on incorrect
 *   consecutiveIncorrect: +1 on incorrect, reset to 0 on correct
 *
 * RESERVED (NOT updated in Phase 3):
 *   mastery, highestDifficultyMastered
 *
 * NOT in Phase 3:
 *   - Mastery computation algorithm
 *   - Prerequisite satisfaction logic
 *   - Adaptive difficulty promotion
 */

const StudentProgress = require('../models/studentProgressModel');

/**
 * Update aggregate progress from a single attempt event.
 * Called by attemptService after recording an Attempt.
 *
 * @param {{ userId, topic, pattern, difficulty, isCorrect, timeTaken, attemptedAt }} data
 * @param {{ session?: mongoose.ClientSession }} [opts]
 */
const updateProgressFromAttempt = async (
  { userId, topic, pattern, isCorrect, timeTaken, attemptedAt },
  { session } = {}
) => {
  const filter = { userId, topic, pattern };
  const opts = {
    upsert: true,
    new: true,
    ...(session ? { session } : {}),
  };

  // Step 1: Increment base counters and time (no streak fields here)
  const $inc = {
    attempts: 1,
    correct: isCorrect ? 1 : 0,
    incorrect: isCorrect ? 0 : 1,
    totalTimeSpent: timeTaken,
  };

  const $set = {
    lastAttemptAt: attemptedAt,
  };

  let progress = await StudentProgress.findOneAndUpdate(
    filter,
    { $inc, $set },
    opts
  );

  // Step 2: Recompute derived fields from updated counters
  const accuracy = progress.attempts > 0
    ? (progress.correct / progress.attempts) * 100
    : 0;
  const averageTime = progress.attempts > 0
    ? progress.totalTimeSpent / progress.attempts
    : 0;

  // Step 3: Update derived fields and handle streaks.
  // We separate the streak reset into $set and increment into $inc to avoid conflicts.
  // On a correct attempt: consecutiveCorrect +1, consecutiveIncorrect = 0
  // On an incorrect attempt: consecutiveIncorrect +1, consecutiveCorrect = 0
  const streakUpdate = isCorrect
    ? { $inc: { consecutiveCorrect: 1 }, $set: { accuracy, averageTime, consecutiveIncorrect: 0 } }
    : { $inc: { consecutiveIncorrect: 1 }, $set: { accuracy, averageTime, consecutiveCorrect: 0 } };

  progress = await StudentProgress.findOneAndUpdate(
    filter,
    streakUpdate,
    { new: true, ...(session ? { session } : {}) }
  );

  return progress;
};

/**
 * Get or null progress for a user/topic/pattern combination.
 */
const getProgress = async (userId, topic, pattern) => {
  return StudentProgress.findOne({ userId, topic, pattern });
};

/**
 * Get all progress records for a user (optionally filtered by topic).
 */
const getProgressByUser = async (userId, filters = {}) => {
  const query = { userId };
  if (filters.topic) query.topic = filters.topic;
  if (filters.pattern) query.pattern = filters.pattern;

  const page = Math.max(1, parseInt(filters.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(filters.limit) || 20));
  const skip = (page - 1) * limit;

  const sort = {};
  const sortBy = filters.sortBy || 'attempts';
  const sortDir = filters.sortDir === 'asc' ? 1 : -1;
  sort[sortBy] = sortDir;

  const total = await StudentProgress.countDocuments(query);
  const data = await StudentProgress.find(query)
    .sort(sort)
    .skip(skip)
    .limit(limit);

  return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit), count: data.length } };
};

/**
 * Rebuild a single user's progress aggregates from Attempt history.
 * For use by rebuildStudentProgress.js script.
 * This is a destructive reset: existing progress for the user is deleted and
 * recalculated from Attempt documents.
 */
const rebuildProgressForUser = async (userId) => {
  const Attempt = require('../models/attemptModel');

  // Delete all existing progress for this user
  await StudentProgress.deleteMany({ userId });

  // Aggregate all attempts by (topic, pattern)
  const groups = await Attempt.aggregate([
    { $match: { userId } },
    {
      $group: {
        _id: { topic: '$topic', pattern: '$pattern' },
        attempts: { $sum: 1 },
        correct: { $sum: { $cond: ['$isCorrect', 1, 0] } },
        incorrect: { $sum: { $cond: ['$isCorrect', 0, 1] } },
        totalTimeSpent: { $sum: '$timeTaken' },
        lastAttemptAt: { $max: '$attemptedAt' },
      },
    },
  ]);

  const docs = groups.map(({ _id, attempts, correct, incorrect, totalTimeSpent, lastAttemptAt }) => ({
    userId,
    topic: _id.topic,
    pattern: _id.pattern,
    attempts,
    correct,
    incorrect,
    accuracy: attempts > 0 ? (correct / attempts) * 100 : 0,
    totalTimeSpent,
    averageTime: attempts > 0 ? totalTimeSpent / attempts : 0,
    // mastery and highestDifficultyMastered remain 0 (reserved for Phase 4)
    mastery: 0,
    highestDifficultyMastered: 0,
    lastAttemptAt,
    consecutiveCorrect: 0,  // Cannot derive streaks from aggregate history
    consecutiveIncorrect: 0,
  }));

  if (docs.length > 0) {
    await StudentProgress.insertMany(docs);
  }

  return { userId, rebuilt: docs.length };
};

module.exports = {
  updateProgressFromAttempt,
  getProgress,
  getProgressByUser,
  rebuildProgressForUser,
};
