'use strict';

/**
 * Question Validator Middleware
 *
 * Custom validation middleware — no express-validator dependency.
 * All validations are explicit and fail-fast with consistent error shapes.
 *
 * Slug resolution is API-boundary behavior only.
 * It resolves URL slugs to canonical names for querying.
 * It NEVER modifies canonical names stored in MongoDB.
 */

const registryService = require('../services/patternRegistryService');
const { sendError } = require('../utils/apiResponse');
const { MAX_RANDOM_LIMIT, MAX_PAGE_LIMIT } = require('../services/questionService');

// ── Topic resolution ───────────────────────────────────────────────────────

/**
 * Resolves :topic URL param (slug or canonical name) to its canonical topic name.
 * Attaches req.canonicalTopic on success.
 * Returns 404 if the topic cannot be resolved.
 */
const resolveTopicParam = (req, res, next) => {
  const slug = req.params.topic;
  const canonical = registryService.resolveTopicSlug(slug);

  if (!canonical) {
    return sendError(
      res,
      'INVALID_TOPIC',
      `Topic '${slug}' not found. Use GET /api/v1/questions/topics for valid topics.`,
      404
    );
  }

  req.canonicalTopic = canonical;
  return next();
};

// ── Pattern resolution ─────────────────────────────────────────────────────

/**
 * Resolves :pattern URL param to its canonical pattern name.
 * Requires req.canonicalTopic to be set first (call resolveTopicParam before this).
 * Attaches req.canonicalPattern on success.
 * Returns 404 if pattern not found or does not belong to the topic.
 */
const resolvePatternParam = (req, res, next) => {
  const slug = req.params.pattern;
  const canonical = registryService.resolvePatternSlug(slug);

  if (!canonical) {
    return sendError(
      res,
      'INVALID_PATTERN',
      `Pattern '${slug}' not found.`,
      404
    );
  }

  if (!registryService.patternBelongsToTopic(canonical, req.canonicalTopic)) {
    return sendError(
      res,
      'PATTERN_TOPIC_MISMATCH',
      `Pattern '${canonical}' does not belong to topic '${req.canonicalTopic}'.`,
      404
    );
  }

  req.canonicalPattern = canonical;
  return next();
};

// ── Difficulty ─────────────────────────────────────────────────────────────

/**
 * Validates optional ?difficulty query parameter.
 * Must be an integer between 1 and 10.
 * Attaches req.validatedDifficulty on success.
 */
const validateDifficulty = (req, res, next) => {
  const { difficulty } = req.query;
  if (difficulty === undefined) return next();

  const d = Number(difficulty);
  if (!Number.isInteger(d) || d < 1 || d > 10) {
    return sendError(
      res,
      'INVALID_DIFFICULTY',
      'Difficulty must be an integer between 1 and 10.',
      400
    );
  }

  req.validatedDifficulty = d;
  return next();
};

// ── Random limit ───────────────────────────────────────────────────────────

/**
 * Validates optional ?limit query parameter for random endpoints.
 * Must be an integer between 1 and MAX_RANDOM_LIMIT (100).
 * Attaches req.validatedLimit on success.
 */
const validateRandomLimit = (req, res, next) => {
  const { limit } = req.query;
  if (limit === undefined) return next();

  const l = Number(limit);
  if (!Number.isInteger(l) || l < 1 || l > MAX_RANDOM_LIMIT) {
    return sendError(
      res,
      'INVALID_LIMIT',
      `Limit must be an integer between 1 and ${MAX_RANDOM_LIMIT}.`,
      400
    );
  }

  req.validatedLimit = l;
  return next();
};

// ── Pagination ─────────────────────────────────────────────────────────────

/**
 * Validates optional ?page and ?limit query parameters for paginated endpoints.
 * page must be a positive integer.
 * limit must be an integer between 1 and MAX_PAGE_LIMIT (100).
 * Attaches req.validatedPage and/or req.validatedLimit on success.
 */
const validatePagination = (req, res, next) => {
  const { page, limit } = req.query;

  if (page !== undefined) {
    const p = Number(page);
    if (!Number.isInteger(p) || p < 1) {
      return sendError(res, 'INVALID_PAGE', 'Page must be a positive integer.', 400);
    }
    req.validatedPage = p;
  }

  if (limit !== undefined) {
    const l = Number(limit);
    if (!Number.isInteger(l) || l < 1 || l > MAX_PAGE_LIMIT) {
      return sendError(
        res,
        'INVALID_LIMIT',
        `Limit must be an integer between 1 and ${MAX_PAGE_LIMIT}.`,
        400
      );
    }
    req.validatedLimit = l;
  }

  return next();
};

module.exports = {
  resolveTopicParam,
  resolvePatternParam,
  validateDifficulty,
  validateRandomLimit,
  validatePagination,
};
