'use strict';

/**
 * Question Controller
 *
 * Handles all question-related HTTP requests.
 * Each handler calls the appropriate service method and formats the response.
 * No business logic lives here — that belongs in questionService.
 */

const questionService = require('../services/questionService');
const registryService = require('../services/patternRegistryService');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

// ── Topics ─────────────────────────────────────────────────────────────────

/**
 * GET /api/v1/questions/topics
 *
 * Returns all 24 canonical topic names.
 */
const getTopics = asyncHandler(async (req, res) => {
  const topics = registryService.getAllTopics();
  return sendSuccess(res, topics, { count: topics.length });
});

// ── Patterns ───────────────────────────────────────────────────────────────

/**
 * GET /api/v1/questions/topic/:topic/patterns
 *
 * Returns canonical patterns belonging to the resolved topic.
 * Includes name, slug, description, questionCount, prerequisites, aliases.
 */
const getPatternsByTopic = asyncHandler(async (req, res) => {
  const patterns = registryService.getPatternsByTopic(req.canonicalTopic);

  // Shape each pattern for the response — include only API-relevant fields
  const data = patterns.map((p) => ({
    name: p.name,
    slug: p.slug || registryService.buildSlug(p.name),
    description: p.description || '',
    questionCount: p.questionCount || 0,
    prerequisites: p.prerequisites || [],
    aliases: p.aliases || [],
  }));

  return sendSuccess(res, data, {
    topic: req.canonicalTopic,
    count: data.length,
  });
});

// ── Questions by topic ─────────────────────────────────────────────────────

/**
 * GET /api/v1/questions/topic/:topic
 * Query params: ?page=1 &limit=20 &difficulty=N
 *
 * Returns paginated questions for a topic with optional difficulty filter.
 */
const getQuestionsByTopic = asyncHandler(async (req, res) => {
  const result = await questionService.getQuestions({
    topic: req.canonicalTopic,
    difficulty: req.validatedDifficulty,
    page: req.validatedPage,
    limit: req.validatedLimit,
  });

  return sendSuccess(res, result.data, result.meta);
});

// ── Random questions by topic ──────────────────────────────────────────────

/**
 * GET /api/v1/questions/topic/:topic/random
 * Query params: ?limit=5 &difficulty=N
 *
 * Returns up to `limit` random unique questions from the topic.
 * Default limit: 5. Maximum limit: 100.
 */
const getRandomByTopic = asyncHandler(async (req, res) => {
  const result = await questionService.getRandomQuestions({
    topic: req.canonicalTopic,
    difficulty: req.validatedDifficulty,
    limit: req.validatedLimit || 5,
  });

  return sendSuccess(res, result.data, result.meta);
});

// ── Questions by topic + pattern ───────────────────────────────────────────

/**
 * GET /api/v1/questions/topic/:topic/pattern/:pattern
 * Query params: ?page=1 &limit=20 &difficulty=N
 *
 * Returns paginated questions for a specific topic+pattern combination.
 */
const getQuestionsByPattern = asyncHandler(async (req, res) => {
  const result = await questionService.getQuestions({
    topic: req.canonicalTopic,
    pattern: req.canonicalPattern,
    difficulty: req.validatedDifficulty,
    page: req.validatedPage,
    limit: req.validatedLimit,
  });

  return sendSuccess(res, result.data, result.meta);
});

// ── Random questions by topic + pattern ───────────────────────────────────

/**
 * GET /api/v1/questions/topic/:topic/pattern/:pattern/random
 * Query params: ?limit=5 &difficulty=N
 *
 * Returns up to `limit` random unique questions for a topic+pattern.
 */
const getRandomByPattern = asyncHandler(async (req, res) => {
  const result = await questionService.getRandomQuestions({
    topic: req.canonicalTopic,
    pattern: req.canonicalPattern,
    difficulty: req.validatedDifficulty,
    limit: req.validatedLimit || 5,
  });

  return sendSuccess(res, result.data, result.meta);
});

// ── Single question ────────────────────────────────────────────────────────

/**
 * GET /api/v1/questions/:id
 *
 * Returns a single question document by MongoDB ObjectId.
 * The :id param is pre-validated in the route as a 24-char hex string.
 */
const getQuestionById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const question = await questionService.getQuestionById(id);

  if (!question) {
    return sendError(
      res,
      'QUESTION_NOT_FOUND',
      `Question with id '${id}' not found.`,
      404
    );
  }

  return sendSuccess(res, question);
});

module.exports = {
  getTopics,
  getPatternsByTopic,
  getQuestionsByTopic,
  getRandomByTopic,
  getQuestionsByPattern,
  getRandomByPattern,
  getQuestionById,
};
