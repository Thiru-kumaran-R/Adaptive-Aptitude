'use strict';

/**
 * tutorService.js — Concept & Pattern Tutoring Orchestration
 */

const { assertAssessmentAccess } = require('./learningAssessmentGuard');
const { hydrateContext } = require('./learningContextService');
const { assemblePrompt } = require('./promptService');
const { validatePipeline } = require('./responseValidator');
const { buildTutorFallback } = require('./fallbackService');
const { buildDeliveryEnvelope } = require('./learningDeliveryService');
const { getLLMProvider } = require('../../providers/learning/llmProviderFactory');
const { TASK_SCHEMAS } = require('../../utils/learning/learningSchemaUtils');
const FakeLLMProvider = require('../../providers/learning/fakeLLMProvider');

/**
 * Executes Concept Tutor request.
 *
 * @param {Object} params
 * @param {string} params.userId
 * @param {string} params.topic
 * @param {string} params.pattern
 * @param {string} [params.query]
 * @param {Array}  [params.conversationHistory]
 * @param {Object} [params.providerOverride] - Optional test injection
 * @returns {Promise<Object>} Response envelope
 */
async function getConceptTutoring({ userId, topic, pattern, query, conversationHistory, providerOverride = null }) {
  const taskType = 'concept_tutor';

  // 1. Assessment guard
  await assertAssessmentAccess({
    userId,
    endpoint: '/tutor',
    taskType,
  });

  // 2. Hydrate context
  const context = await hydrateContext({
    userId,
    taskType,
    topic,
    pattern,
  });

  // 3. Resolve provider
  const provider = providerOverride || getLLMProvider();

  if (!provider) {
    const fallback = buildTutorFallback({ topic, pattern });
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
    studentMessage: query,
    conversationHistory,
  });

  const providerName = provider instanceof FakeLLMProvider ? 'fake' : 'gemini';

  try {
    const completion = await provider.generate({
      taskType,
      systemInstruction: promptDetails.systemInstruction,
      context: promptDetails.scrubbedContext,
      studentMessage: promptDetails.sanitizedStudentMessage,
      conversationHistory: promptDetails.sanitizedHistory,
      outputSchema: TASK_SCHEMAS.concept_tutor,
    });

    const validation = validatePipeline(completion.content, taskType, context);
    if (!validation.valid) {
      const fallback = buildTutorFallback({ topic, pattern });
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

    const fallback = buildTutorFallback({ topic, pattern });
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
  getConceptTutoring,
};
