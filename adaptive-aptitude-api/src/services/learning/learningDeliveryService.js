'use strict';

/**
 * learningDeliveryService.js — Common Response Delivery Envelope & Provenance Engine
 *
 * Implements the Section 8.8 uniform response envelope and three-tier factual provenance.
 */

const { PHASE7_ALGORITHM_VERSION } = require('../../config/learningConfig');

/**
 * Derives three-tier provenance entries from context and output data.
 *
 * @param {string} taskType
 * @param {Object} context
 * @param {Object} data
 * @param {boolean} isDegraded
 * @returns {{ facts: string[], deterministicSignals: string[], llmInterpretations: string[] }}
 */
function deriveProvenance(taskType, context = {}, data = {}, isDegraded = false) {
  const facts = [];
  const deterministicSignals = [];
  const llmInterpretations = [];

  // 1. Facts from Phase 2 / Phase 3 / Phase 6
  if (context.topicContext?.topic) {
    facts.push(`Canonical Topic: ${context.topicContext.topic}`);
  }
  if (context.topicContext?.pattern) {
    facts.push(`Canonical Pattern: ${context.topicContext.pattern}`);
  }
  if (context.questionContext?.questionId) {
    facts.push(`Question ID: ${context.questionContext.questionId}`);
  }
  if (context.questionContext?.difficulty) {
    facts.push(`Stored Question Difficulty: ${context.questionContext.difficulty}`);
  }
  if (context.attemptContext?.selectedAnswer) {
    facts.push(`Selected Answer: ${context.attemptContext.selectedAnswer}`);
  }
  if (context.mockAnalyticsContext?.rawScore !== undefined) {
    facts.push(`Raw Mock Score: ${context.mockAnalyticsContext.rawScore}/${context.mockAnalyticsContext.maxPossibleScore}`);
  }

  // 2. Deterministic Signals from Phase 4 / Phase 5
  if (context.progressContext) {
    deterministicSignals.push(`Phase 4 Mastery Score: ${context.progressContext.mastery} (${context.progressContext.masteryLabel})`);
    deterministicSignals.push(`Recent Accuracy: ${context.progressContext.recentAccuracy}%`);
  }
  if (context.planningContext) {
    const totalTarget = (context.planningContext.scheduledPatterns || []).reduce((s, p) => s + (p.targetQuestions || 0), 0);
    deterministicSignals.push(`Target Date: ${context.planningContext.targetDate}`);
    deterministicSignals.push(`Planned Questions: ${totalTarget}`);
    if (context.planningContext.revisionItem) {
      deterministicSignals.push(`Revision Stage: ${context.planningContext.revisionItem.stage} (${context.planningContext.revisionItem.intervalDays}d interval)`);
    }
  }

  // 3. LLM Interpretations
  if (isDegraded) {
    llmInterpretations.push('Degraded mode active: Advisory generated via deterministic platform fallback.');
  } else {
    if (data.conceptExplanation) {
      llmInterpretations.push(`Pedagogical concept guidance for ${context.topicContext?.pattern || 'pattern'}.`);
    }
    if (data.mistakeExplanation) {
      llmInterpretations.push(data.mistakeExplanation);
    }
    if (data.masteryInterpretation) {
      llmInterpretations.push(data.masteryInterpretation);
    }
    if (data.objectiveSummary) {
      llmInterpretations.push(data.objectiveSummary);
    }
    if (data.overallScoreInterpretation) {
      llmInterpretations.push(data.overallScoreInterpretation);
    }
    if (data.workedExample) {
      llmInterpretations.push('Ephemeral worked example provided for pedagogical demonstration.');
    }
  }

  return {
    facts,
    deterministicSignals,
    llmInterpretations,
  };
}

/**
 * Builds the Section 8.8 Common Response Delivery Envelope.
 *
 * @param {Object} params
 * @param {Object} params.data - Public DTO
 * @param {string} params.taskType - Canonical task type
 * @param {string|null} [params.promptVersion]
 * @param {string|null} [params.model]
 * @param {string} [params.provider='disabled']
 * @param {boolean} [params.isDegraded=false]
 * @param {string|null} [params.degradationReason=null]
 * @param {Object} [params.context={}]
 * @returns {Object} Uniform envelope
 */
function buildDeliveryEnvelope({
  data,
  taskType,
  promptVersion = null,
  model = null,
  provider = 'disabled',
  isDegraded = false,
  degradationReason = null,
  context = {},
}) {
  const provenance = deriveProvenance(taskType, context, data, isDegraded);

  return {
    data,
    metadata: {
      taskType,
      algorithmVersion: PHASE7_ALGORITHM_VERSION,
      promptVersion: isDegraded && !promptVersion ? null : promptVersion,
      model: provider === 'disabled' ? null : model,
      provider,
      isDegraded,
      degradationReason: isDegraded ? degradationReason || 'disabled_mode' : null,
    },
    provenance,
  };
}

module.exports = {
  buildDeliveryEnvelope,
  deriveProvenance,
};
