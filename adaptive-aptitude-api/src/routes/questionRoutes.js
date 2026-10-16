'use strict';

/**
 * Question Routes — /api/v1/questions
 *
 * All routes use versioned /api/v1 prefix (set in app.js).
 *
 * Registration order is intentional:
 *  1. Static segment /topics first (avoids collision with /:id)
 *  2. /:id with 24-char hex regex constraint
 *  3. /topic/:topic with sub-routes ordered specific → general
 *     (patterns before random before bare topic; pattern/:pattern before bare pattern)
 *
 * Slug resolution middleware runs at route level, not globally.
 */

const express = require('express');
const router = express.Router();

const controller = require('../controllers/questionController');
const {
  resolveTopicParam,
  resolvePatternParam,
  validateDifficulty,
  validateRandomLimit,
  validatePagination,
} = require('../validators/questionValidator');

// ── Static routes ──────────────────────────────────────────────────────────

// GET /api/v1/questions/topics
router.get('/topics', controller.getTopics);

// ── Single question by ID ──────────────────────────────────────────────────
// Regex constraint ensures this only matches valid 24-char MongoDB ObjectIds.
// Must be registered before /topic/:topic to avoid ambiguity.

// GET /api/v1/questions/:id
router.get('/:id([a-fA-F0-9]{24})', controller.getQuestionById);

// ── Topic-level routes ─────────────────────────────────────────────────────

// GET /api/v1/questions/topic/:topic/patterns
// (Registered before /topic/:topic to ensure "patterns" is not captured as :pattern)
router.get(
  '/topic/:topic/patterns',
  resolveTopicParam,
  controller.getPatternsByTopic
);

// GET /api/v1/questions/topic/:topic/random
router.get(
  '/topic/:topic/random',
  resolveTopicParam,
  validateRandomLimit,
  validateDifficulty,
  controller.getRandomByTopic
);

// GET /api/v1/questions/topic/:topic/pattern/:pattern/random
router.get(
  '/topic/:topic/pattern/:pattern/random',
  resolveTopicParam,
  resolvePatternParam,
  validateRandomLimit,
  validateDifficulty,
  controller.getRandomByPattern
);

// GET /api/v1/questions/topic/:topic/pattern/:pattern
router.get(
  '/topic/:topic/pattern/:pattern',
  resolveTopicParam,
  resolvePatternParam,
  validatePagination,
  validateDifficulty,
  controller.getQuestionsByPattern
);

// GET /api/v1/questions/topic/:topic
// (Registered last among topic routes — most general)
router.get(
  '/topic/:topic',
  resolveTopicParam,
  validatePagination,
  validateDifficulty,
  controller.getQuestionsByTopic
);

module.exports = router;
