'use strict';

/**
 * geminiAdapter.js — Production Gemini Provider Adapter
 *
 * Implements native fetch transport with AbortController, structured JSON responseFormat,
 * and error classification without third-party SDK dependencies.
 */

const LLMProvider = require('./llmProvider');
const { LEARNING_LLM_RUNTIME, LEARNING_ERROR_CODES } = require('../../config/learningConfig');
const { toGeminiStructuredOutputSchema } = require('../../utils/learning/learningSchemaUtils');
const LearningError = require('../../utils/learning/LearningError');

class GeminiAdapter extends LLMProvider {
  /**
   * @param {Object} options
   * @param {string} options.apiKey - Gemini API key
   * @param {string} options.model - Gemini model identifier (verbatim from env)
   * @param {string} [options.baseUrl] - Optional custom endpoint URL for testing
   */
  constructor({ apiKey, model, baseUrl }) {
    super();
    if (!apiKey) {
      throw new Error('CONFIG_ERROR: Missing apiKey for GeminiAdapter.');
    }
    if (!model) {
      throw new Error('CONFIG_ERROR: Missing model for GeminiAdapter.');
    }
    this.apiKey = apiKey;
    this.model = model;
    this.providerName = 'gemini';
    this.baseUrl = baseUrl || 'https://generativelanguage.googleapis.com/v1beta';
  }

  getCapabilities() {
    return { supportsZeroRetention: false };
  }

  /**
   * Generates completion via native fetch and current official REST structured output format.
   *
   * @param {Object} params
   * @returns {Promise<{ content: Object|string, rawUsage: { promptTokens: number|null, completionTokens: number|null }, model: string }>}
   */
  async generate({ taskType, systemInstruction, context, studentMessage, conversationHistory, outputSchema, options = {} }) {
    const timeoutMs = options.timeoutMs || LEARNING_LLM_RUNTIME.timeoutMs;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const wireSchema = outputSchema ? toGeminiStructuredOutputSchema(outputSchema) : null;

    // Build quarantined prompt text
    const promptParts = [];
    if (systemInstruction) {
      promptParts.push(systemInstruction);
    }
    if (context) {
      promptParts.push(`<PLATFORM_CONTEXT>\n${JSON.stringify(context, null, 2)}\n</PLATFORM_CONTEXT>`);
    }
    if (conversationHistory && conversationHistory.length > 0) {
      promptParts.push(
        `<conversation_history>\n${JSON.stringify(conversationHistory, null, 2)}\n</conversation_history>`
      );
    }
    if (studentMessage) {
      promptParts.push(`<student_query>\n${studentMessage}\n</student_query>`);
    }

    const fullPromptText = promptParts.join('\n\n');

    const requestBody = {
      contents: [
        {
          role: 'user',
          parts: [{ text: fullPromptText }],
        },
      ],
      generationConfig: {
        maxOutputTokens: options.maxOutputTokens || LEARNING_LLM_RUNTIME.maxOutputTokens,
      },
    };

    if (wireSchema) {
      requestBody.generationConfig.responseFormat = {
        text: {
          mimeType: 'APPLICATION_JSON',
          schema: wireSchema,
        },
      };
    }

    const endpointUrl = `${this.baseUrl}/models/${encodeURIComponent(this.model)}:generateContent?key=${encodeURIComponent(this.apiKey)}`;

    let response;
    try {
      response = await fetch(endpointUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });
    } catch (err) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError' || controller.signal.aborted) {
        throw new LearningError(
          504,
          LEARNING_ERROR_CODES.LLM_PROVIDER_TIMEOUT,
          `Gemini request timed out after ${timeoutMs}ms.`
        );
      }
      throw new LearningError(
        503,
        LEARNING_ERROR_CODES.LLM_PROVIDER_UNAVAILABLE,
        `Network error communicating with Gemini provider: ${err.message}`
      );
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      if (response.status === 408 || response.status === 504) {
        throw new LearningError(
          504,
          LEARNING_ERROR_CODES.LLM_PROVIDER_TIMEOUT,
          `Gemini gateway timeout: HTTP ${response.status}`
        );
      }
      throw new LearningError(
        503,
        LEARNING_ERROR_CODES.LLM_PROVIDER_UNAVAILABLE,
        `Gemini provider returned HTTP ${response.status}`
      );
    }

    let payload;
    try {
      payload = await response.json();
    } catch (err) {
      throw new LearningError(
        502,
        LEARNING_ERROR_CODES.LLM_INVALID_STRUCTURED_OUTPUT,
        'Failed to parse JSON response body from Gemini.'
      );
    }

    const candidate = payload.candidates?.[0];
    const candidateText = candidate?.content?.parts?.[0]?.text;

    if (!candidateText || typeof candidateText !== 'string') {
      throw new LearningError(
        502,
        LEARNING_ERROR_CODES.LLM_INVALID_STRUCTURED_OUTPUT,
        'Gemini response candidate text is missing or empty.'
      );
    }

    let parsedContent;
    try {
      parsedContent = JSON.parse(candidateText);
    } catch (err) {
      throw new LearningError(
        502,
        LEARNING_ERROR_CODES.LLM_INVALID_STRUCTURED_OUTPUT,
        `Malformed structured output JSON returned by Gemini: ${err.message}`
      );
    }

    const providerUsage = payload.usageMetadata;

    return {
      content: parsedContent,
      rawUsage: {
        promptTokens: providerUsage?.promptTokenCount || null,
        completionTokens: providerUsage?.candidatesTokenCount || null,
      },
      model: this.model,
    };
  }
}

module.exports = GeminiAdapter;
