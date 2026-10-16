'use strict';

/**
 * Adaptive Query Helper — Phase 3
 *
 * Provides data-retrieval queries Q1–Q10 for the adaptive engine foundation.
 * These queries retrieve and sort EXISTING stored values.
 * They do NOT compute mastery, select questions adaptively, or make decisions.
 *
 * PHASE 3 BOUNDARY:
 *   Q1–Q10 are DATA QUERIES ONLY.
 *   They return facts stored in the database.
 *   The adaptive decision layer (Phase 4) will consume these as inputs.
 *
 * NOT in Phase 3:
 *   - adaptive question selection
 *   - automatic difficulty adjustment
 *   - mastery thresholds or mastery-based decisions
 *   - prerequisite gating (deciding whether a pattern is unlocked)
 *   - pattern promotion
 *   - Phase 4 eligibility decisions
 */

const StudentProgress = require('../models/studentProgressModel');
const Attempt = require('../models/attemptModel');
const Question = require('../models/questionModel');
const hierarchyService = require('./hierarchyService');
const registryService = require('./patternRegistryService');

// ─────────────────────────────────────────────────────────────────────────────
// Q1: Progress by topic for a user
// Returns all StudentProgress records for a user, grouped/filtered by topic.
// Sorted by attempts descending (most practiced first).
// ─────────────────────────────────────────────────────────────────────────────
const Q1_progressByTopic = async (userId, topic = null) => {
  const query = { userId };
  if (topic) query.topic = topic;
  const records = await StudentProgress.find(query).sort({ attempts: -1 });
  return records;
};

// ─────────────────────────────────────────────────────────────────────────────
// Q2: Progress by pattern for a user within a topic
// Returns all StudentProgress records for a user within a specific topic.
// Sorted by attempts descending.
// ─────────────────────────────────────────────────────────────────────────────
const Q2_progressByPattern = async (userId, topic) => {
  return StudentProgress.find({ userId, topic }).sort({ attempts: -1 });
};

// ─────────────────────────────────────────────────────────────────────────────
// Q3: Recent attempts for a user
// Returns the N most recent Attempt documents for a user.
// Phase 3 retrieves stored values — no interpretation.
// ─────────────────────────────────────────────────────────────────────────────
const Q3_recentAttempts = async (userId, { limit = 20, topic = null, pattern = null } = {}) => {
  const query = { userId };
  if (topic) query.topic = topic;
  if (pattern) query.pattern = pattern;
  return Attempt.find(query)
    .sort({ attemptedAt: -1 })
    .limit(Math.min(100, Math.max(1, parseInt(limit) || 20)));
};

// ─────────────────────────────────────────────────────────────────────────────
// Q4: Weakest patterns for a user
// Returns StudentProgress records sorted by accuracy ascending (lowest accuracy first),
// then by attempts descending (more practiced patterns shown first within same accuracy).
// Phase 3 sorts STORED accuracy — does NOT recompute mastery.
// ─────────────────────────────────────────────────────────────────────────────
const Q4_weakestPatterns = async (userId, { topic = null, limit = 10 } = {}) => {
  const query = { userId, attempts: { $gt: 0 } };
  if (topic) query.topic = topic;
  return StudentProgress.find(query)
    .sort({ accuracy: 1, attempts: -1 })
    .limit(Math.min(50, Math.max(1, parseInt(limit) || 10)));
};

// ─────────────────────────────────────────────────────────────────────────────
// Q5: Questions attempted by a user (with optional pattern filter)
// Returns distinct questionIds a user has attempted.
// Useful for Phase 4 to filter out already-seen questions.
// ─────────────────────────────────────────────────────────────────────────────
const Q5_attemptedQuestionIds = async (userId, { topic = null, pattern = null } = {}) => {
  const match = { userId };
  if (topic) match.topic = topic;
  if (pattern) match.pattern = pattern;
  const results = await Attempt.aggregate([
    { $match: match },
    { $group: { _id: '$questionId' } },
  ]);
  return results.map((r) => r._id);
};

// ─────────────────────────────────────────────────────────────────────────────
// Q6: Questions NOT attempted by a user in a topic/pattern
// Returns up to `limit` Question documents not previously attempted by this user.
// Phase 3 retrieves existing stored questions — no adaptive selection.
// ─────────────────────────────────────────────────────────────────────────────
const Q6_unattemptedQuestions = async (userId, { topic, pattern = null, limit = 10, difficulty = null } = {}) => {
  const attemptedIds = await Q5_attemptedQuestionIds(userId, { topic, pattern });
  const qQuery = {};
  if (topic) qQuery.topic = topic;
  if (pattern) qQuery.pattern = pattern;
  if (difficulty) qQuery.difficulty = difficulty;
  if (attemptedIds.length > 0) {
    qQuery._id = { $nin: attemptedIds };
  }
  return Question.find(qQuery)
    .limit(Math.min(100, Math.max(1, parseInt(limit) || 10)));
};

// ─────────────────────────────────────────────────────────────────────────────
// Q7: Difficulty distribution of attempts for a user in a pattern
// Returns counts of attempts per difficulty level (1–10).
// ─────────────────────────────────────────────────────────────────────────────
const Q7_difficultyDistribution = async (userId, { topic = null, pattern = null } = {}) => {
  const match = { userId };
  if (topic) match.topic = topic;
  if (pattern) match.pattern = pattern;
  const results = await Attempt.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$difficulty',
        totalAttempts: { $sum: 1 },
        correct: { $sum: { $cond: ['$isCorrect', 1, 0] } },
        incorrect: { $sum: { $cond: ['$isCorrect', 0, 1] } },
      },
    },
    { $sort: { _id: 1 } },
    {
      $project: {
        _id: 0,
        difficulty: '$_id',
        totalAttempts: 1,
        correct: 1,
        incorrect: 1,
      },
    },
  ]);
  return results;
};

// ─────────────────────────────────────────────────────────────────────────────
// Q8: Accuracy over time for a user in a pattern
// Returns attempt results as a time series (for future visualization).
// ─────────────────────────────────────────────────────────────────────────────
const Q8_accuracyOverTime = async (userId, { topic = null, pattern = null, limit = 50 } = {}) => {
  const query = { userId };
  if (topic) query.topic = topic;
  if (pattern) query.pattern = pattern;
  const attempts = await Attempt.find(query)
    .select('isCorrect attemptedAt difficulty')
    .sort({ attemptedAt: 1 })
    .limit(Math.min(200, Math.max(1, parseInt(limit) || 50)));

  // Build running accuracy series
  let correct = 0;
  let total = 0;
  return attempts.map((a) => {
    total += 1;
    correct += a.isCorrect ? 1 : 0;
    return {
      attemptedAt: a.attemptedAt,
      difficulty: a.difficulty,
      isCorrect: a.isCorrect,
      runningAccuracy: total > 0 ? (correct / total) * 100 : 0,
    };
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// Q9: Summary of attempts by source type for a user
// Returns attempt counts per source (practice, daily_plan, adaptive, revision, mock).
// ─────────────────────────────────────────────────────────────────────────────
const Q9_attemptsBySource = async (userId) => {
  const results = await Attempt.aggregate([
    { $match: { userId } },
    {
      $group: {
        _id: '$source',
        totalAttempts: { $sum: 1 },
        correct: { $sum: { $cond: ['$isCorrect', 1, 0] } },
      },
    },
    { $sort: { totalAttempts: -1 } },
    {
      $project: {
        _id: 0,
        source: '$_id',
        totalAttempts: 1,
        correct: 1,
      },
    },
  ]);
  return results;
};

// ─────────────────────────────────────────────────────────────────────────────
// Q10: Prerequisite information for a pattern
// Returns stored prerequisite data for a pattern from the canonical registry.
// Phase 3 returns factual prerequisite DATA ONLY.
// Phase 4 will add adaptive eligibility decisions on top of this data.
// ─────────────────────────────────────────────────────────────────────────────
const Q10_prerequisiteData = async (patternName) => {
  if (!registryService.patternExists(patternName)) {
    const err = new Error(`Pattern "${patternName}" not found in canonical registry.`);
    err.statusCode = 404;
    err.code = 'PATTERN_NOT_FOUND';
    throw err;
  }

  const prerequisites = hierarchyService.getPrerequisites(patternName) || [];
  const topic = registryService.getTopicForPattern(patternName);

  // Get all patterns that list this pattern as a prerequisite (dependents)
  const allEdges = hierarchyService.getPrerequisiteEdges();
  const dependents = allEdges
    .filter((edge) => edge.to === patternName)
    .map((edge) => edge.from);

  return {
    pattern: patternName,
    topic,
    prerequisites,
    prerequisiteCount: prerequisites.length,
    dependents,
    dependentCount: dependents.length,
    isFoundational: prerequisites.length === 0,
  };
};

module.exports = {
  Q1_progressByTopic,
  Q2_progressByPattern,
  Q3_recentAttempts,
  Q4_weakestPatterns,
  Q5_attemptedQuestionIds,
  Q6_unattemptedQuestions,
  Q7_difficultyDistribution,
  Q8_accuracyOverTime,
  Q9_attemptsBySource,
  Q10_prerequisiteData,
};
