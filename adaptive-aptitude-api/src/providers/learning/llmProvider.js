'use strict';

/**
 * llmProvider.js — Base Provider Interface for Phase 7
 */

class LLMProvider {
  /**
   * Generates a structured or formatted completion.
   *
   * @param {Object} params
   * @param {string} params.taskType - One of Phase 7 task types
   * @param {string} params.systemInstruction - Immutable versioned system prompt
   * @param {Object} params.context - Grounded context object
   * @param {string} [params.studentMessage] - Optional sanitized user query
   * @param {Array}  [params.conversationHistory] - Untrusted client history turns
   * @param {Object} [params.outputSchema] - JSON Schema for structured output
   * @param {Object} [params.options] - Timeout, max_tokens, temperature
   * @returns {Promise<{ content: Object|string, rawUsage: { promptTokens: number|null, completionTokens: number|null }, model: string }>}
   */
  async generate({ taskType, systemInstruction, context, studentMessage, conversationHistory, outputSchema, options }) {
    throw new Error('LLMProvider.generate must be implemented by adapter subclasses.');
  }

  /**
   * Declares adapter privacy capabilities.
   * @returns {{ supportsZeroRetention: boolean }}
   */
  getCapabilities() {
    return { supportsZeroRetention: false };
  }
}

module.exports = LLMProvider;
