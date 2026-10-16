'use strict';

/**
 * mistakeService.js — Mistake Explanation & Delta Analysis Orchestration
 */

const Question = require('../../models/questionModel');
const { assertAssessmentAccess } = require('./learningAssessmentGuard');
const { hydrateContext } = require('./learningContextService');
const { assemblePrompt } = require('./promptService');
const { validatePipeline } = require('./responseValidator');
const { buildAttemptExplanationFallback } = require('./fallbackService');
const { buildDeliveryEnvelope } = require('./learningDeliveryService');
const { getLLMProvider } = require('../../providers/learning/llmProviderFactory');
const { TASK_SCHEMAS } = require('../../utils/learning/learningSchemaUtils');
const FakeLLMProvider = require('../../providers/learning/fakeLLMProvider');

/**
 * Executes Explain Attempt request.
 *
 * @param {Object} params
 * @param {string} params.userId
 * @param {string} params.attemptId
 * @param {Object} [params.providerOverride] - Optional test injection
 * @returns {Promise<Object>} Response envelope
 */
async function explainAttempt({ userId, attemptId, providerOverride = null }) {
  const taskType = 'explain_attempt';

  // 1. Assessment guard & ownership check
  const preFetched = await assertAssessmentAccess({
    userId,
    endpoint: '/explain-attempt',
    taskType,
    attemptId,
  });

  // 2. Hydrate context
  const context = await hydrateContext({
    userId,
    taskType,
    preFetched,
  });

  const question = await Question.findById(preFetched.attempt.questionId);

  // 3. Resolve provider
  const provider = providerOverride || getLLMProvider();

  if (!provider) {
    const fallback = buildAttemptExplanationFallback({
      attempt: preFetched.attempt,
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
      outputSchema: TASK_SCHEMAS.explain_attempt,
    });

    const validation = validatePipeline(completion.content, taskType, context, question);
    if (!validation.valid) {
      const fallback = buildAttemptExplanationFallback({
        attempt: preFetched.attempt,
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

    const fallback = buildAttemptExplanationFallback({
      attempt: preFetched.attempt,
      question,
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
  explainAttempt,
};
