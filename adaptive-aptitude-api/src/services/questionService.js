'use strict';

/**
 * Question Service
 *
 * Business logic layer for all question queries.
 * All database operations are encapsulated here; controllers call this service.
 *
 * Phase 2 scope only:
 *  - No adaptive selection logic
 *  - No mastery or student-progress logic
 *  - No attempt tracking
 */

const Question = require('../models/questionModel');

/** Maximum number of questions returnable from random endpoints. */
const MAX_RANDOM_LIMIT = 100;

/** Default number of questions per paginated page. */
const DEFAULT_PAGE_LIMIT = 20;

/** Maximum number of questions per paginated page. */
const MAX_PAGE_LIMIT = 100;

// ── Paginated queries ──────────────────────────────────────────────────────

/**
 * Get paginated questions with optional filters.
 *
 * @param {Object} opts
 * @param {string}  [opts.topic]      Canonical topic name
 * @param {string}  [opts.pattern]    Canonical pattern name
 * @param {number}  [opts.difficulty] Integer 1–10
 * @param {number}  [opts.page=1]
 * @param {number}  [opts.limit=20]
 * @returns {Promise<{ data: Object[], meta: Object }>}
 */
const getQuestions = async ({ topic, pattern, difficulty, page = 1, limit = DEFAULT_PAGE_LIMIT } = {}) => {
  const query = {};
  if (topic !== undefined) query.topic = topic;
  if (pattern !== undefined) query.pattern = pattern;
  if (difficulty !== undefined) query.difficulty = difficulty;

  const safeLimit = Math.min(Math.max(1, limit), MAX_PAGE_LIMIT);
  const safePage = Math.max(1, page);
  const skip = (safePage - 1) * safeLimit;

  const [data, total] = await Promise.all([
    Question.find(query).skip(skip).limit(safeLimit).lean(),
    Question.countDocuments(query),
  ]);

  return {
    data,
    meta: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.ceil(total / safeLimit),
      count: data.length,
    },
  };
};

// ── Random queries ─────────────────────────────────────────────────────────

/**
 * Get random unique questions for a topic and/or pattern.
 *
 * Uses MongoDB $sample aggregation — all returned IDs within a single
 * response are unique (guaranteed by $sample when size ≤ collection size).
 *
 * @param {Object} opts
 * @param {string}  [opts.topic]      Canonical topic name
 * @param {string}  [opts.pattern]    Canonical pattern name
 * @param {number}  [opts.difficulty] Integer 1–10
 * @param {number}  [opts.limit=5]    1 – MAX_RANDOM_LIMIT (100)
 * @returns {Promise<{ data: Object[], meta: Object }>}
 */
const getRandomQuestions = async ({ topic, pattern, difficulty, limit = 5 } = {}) => {
  const safeLimit = Math.min(Math.max(1, parseInt(limit, 10) || 5), MAX_RANDOM_LIMIT);

  const match = {};
  if (topic !== undefined) match.topic = topic;
  if (pattern !== undefined) match.pattern = pattern;
  if (difficulty !== undefined) match.difficulty = difficulty;

  const data = await Question.aggregate([
    { $match: match },
    { $sample: { size: safeLimit } },
  ]);

  return {
    data,
    meta: {
      count: data.length,
      limit: safeLimit,
    },
  };
};

// ── Single question ────────────────────────────────────────────────────────

/**
 * Get a single question by its MongoDB ObjectId.
 *
 * @param {string} id  24-character hex string
 * @returns {Promise<Object|null>}
 */
const getQuestionById = async (id) => {
  return Question.findById(id).lean();
};

module.exports = {
  getQuestions,
  getRandomQuestions,
  getQuestionById,
  MAX_RANDOM_LIMIT,
  MAX_PAGE_LIMIT,
  DEFAULT_PAGE_LIMIT,
};
