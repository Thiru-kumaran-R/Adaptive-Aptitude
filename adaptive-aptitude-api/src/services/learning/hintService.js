'use strict';

/**
 * hintService.js — Progressive Hint Orchestration (Levels 1–5)
 */

const Question = require('../../models/questionModel');
const { assertAssessmentAccess } = require('./learningAssessmentGuard');
const { hydrateContext } = require('./learningContextService');
const { assemblePrompt } = require('./promptService');
const { validatePipeline } = require('./responseValidator');
const { buildHintFallback } = require('./fallbackService');
const { buildDeliveryEnvelope } = require('./learningDeliveryService');
const { getLLMProvider } = require('../../providers/learning/llmProviderFactory');
const { TASK_SCHEMAS } = require('../../utils/learning/learningSchemaUtils');
const { LEARNING_ERROR_CODES } = require('../../config/learningConfig');
const LearningError = require('../../utils/learning/LearningError');
const FakeLLMProvider = require('../../providers/learning/fakeLLMProvider');

/**
 * Executes Progressive Hint request.
 *
 * @param {Object} params
 * @param {string} params.userId
 * @param {string} params.questionId
 * @param {number} params.hintLevel
 * @param {Object} [params.providerOverride] - Optional test injection
 * @returns {Promise<Object>} Response envelope
 */
async function getHint({ userId, questionId, hintLevel, providerOverride = null }) {
  const taskType = 'hint';

  // 1. Input Validation: integer between 1 and 5
  const level = Number(hintLevel);
  if (!Number.isInteger(level) || level < 1 || level > 5) {
    throw new LearningError(
      400,
      LEARNING_ERROR_CODES.INVALID_HINT_LEVEL,
      `hintLevel must be an integer between 1 and 5. Received: ${hintLevel}`
    );
  }

  // 2. Resource check
  if (!questionId) {
    throw new LearningError(400, LEARNING_ERROR_CODES.VALIDATION_ERROR, 'questionId is required.');
  }
  const question = await Question.findById(questionId);
  if (!question) {
    throw new LearningError(404, LEARNING_ERROR_CODES.QUESTION_NOT_FOUND, 'Question not found.');
  }

  // 3. Assessment guard
  const preFetched = await assertAssessmentAccess({
    userId,
    endpoint: '/hint',
    taskType,
    questionId,
    hintLevel: level,
  });

  // 4. Hydrate context
  const context = await hydrateContext({
    userId,
    taskType,
    hintLevel: level,
    questionId,
    preFetched,
  });

  // 5. Resolve provider
  const provider = providerOverride || getLLMProvider();

  if (!provider) {
    const fallback = buildHintFallback({
      hintLevel: level,
      question,
      topicContext: context.topicContext,
    });

    return buildDeliveryEnvelope({
      data: fallback,
      taskType,
      provider: 'disabled',
      model: null,
      isDegraded: true,
      degradationReason: 'disabled_mode',
      context,
    });
  }

  const promptDetails = assemblePrompt({
    taskType,
    context,
  });

  const providerName = provider instanceof FakeLLMProvider ? 'fake' : 'gemini';

  try {
    const completion = await provider.generate({
      taskType,
      systemInstruction: promptDetails.systemInstruction,
      context: promptDetails.scrubbedContext,
      studentMessage: null,
      conversationHistory: null,
      outputSchema: TASK_SCHEMAS.hint,
    });

    const validation = validatePipeline(completion.content, taskType, context, question);
    if (!validation.valid) {
      const fallback = buildHintFallback({
        hintLevel: level,
        question,
        topicContext: context.topicContext,
      });

      return buildDeliveryEnvelope({
        data: fallback,
        taskType,
        promptVersion: promptDetails.promptVersion,
        model: completion.model || provider.model || null,
        provider: providerName,
        isDegraded: true,
        degradationReason: validation.failureType || 'invalid_output',
        context,
      });
    }

    return buildDeliveryEnvelope({
      data: completion.content,
      taskType,
      promptVersion: promptDetails.promptVersion,
      model: completion.model,
      provider: providerName,
      isDegraded: false,
      context,
    });
  } catch (err) {
    let degradationReason = 'provider_unavailable';
    if (err.code === 'LLM_PROVIDER_TIMEOUT') {
      degradationReason = 'provider_timeout';
    } else if (err.code === 'LLM_INVALID_STRUCTURED_OUTPUT') {
      degradationReason = 'invalid_output';
    }

    // Attempt safe deterministic fallback
    let fallback;
    try {
      fallback = buildHintFallback({
        hintLevel: level,
        question,
        topicContext: context.topicContext,
      });
    } catch (fallbackErr) {
      // If fallback assembly failed (e.g. LEVEL5_FALLBACK_ASSEMBLY_FAILED), fail safe with 502/503/504
      throw err;
    }

    return buildDeliveryEnvelope({
      data: fallback,
      taskType,
      promptVersion: promptDetails.promptVersion,
      model: provider.model || null,
      provider: providerName,
      isDegraded: true,
      degradationReason,
      context,
    });
  }
}

module.exports = {
  getHint,
};
