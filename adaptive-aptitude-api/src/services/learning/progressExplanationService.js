'use strict';

/**
 * progressExplanationService.js — Progress & Mastery Coaching Orchestration
 */

const { assertAssessmentAccess } = require('./learningAssessmentGuard');
const { hydrateContext } = require('./learningContextService');
const { assemblePrompt } = require('./promptService');
const { validatePipeline } = require('./responseValidator');
const { buildProgressFallback } = require('./fallbackService');
const { buildDeliveryEnvelope } = require('./learningDeliveryService');
const { getLLMProvider } = require('../../providers/learning/llmProviderFactory');
const { TASK_SCHEMAS } = require('../../utils/learning/learningSchemaUtils');
const FakeLLMProvider = require('../../providers/learning/fakeLLMProvider');

/**
 * Executes Explain Progress request.
 *
 * @param {Object} params
 * @param {string} params.userId
 * @param {string} params.topic
 * @param {string} params.pattern
 * @param {Object} [params.providerOverride] - Optional test injection
 * @returns {Promise<Object>} Response envelope
 */
async function explainProgress({ userId, topic, pattern, providerOverride = null }) {
  const taskType = 'explain_progress';

  // 1. Assessment guard
  await assertAssessmentAccess({
    userId,
    endpoint: '/explain-progress',
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
    const fallback = buildProgressFallback({
      progressContext: context.progressContext,
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
      outputSchema: TASK_SCHEMAS.explain_progress,
    });

    const validation = validatePipeline(completion.content, taskType, context);
    if (!validation.valid) {
      const fallback = buildProgressFallback({
        progressContext: context.progressContext,
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

    const fallback = buildProgressFallback({
      progressContext: context.progressContext,
      topicContext: context.topicContext,
    });

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
  explainProgress,
};
