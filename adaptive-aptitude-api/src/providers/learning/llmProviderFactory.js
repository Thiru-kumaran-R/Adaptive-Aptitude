'use strict';

/**
 * llmProviderFactory.js — Centralized Provider Resolver & Privacy Gate
 */

const FakeLLMProvider = require('./fakeLLMProvider');
const GeminiAdapter = require('./geminiAdapter');

/**
 * Resolves the active LLM provider based on environment configuration.
 *
 * @param {Object} [config]
 * @param {string} [config.provider] - Override for process.env.LEARNING_LLM_PROVIDER
 * @returns {import('./llmProvider')|null} Active provider instance, or null for disabled fallback-only mode
 */
const getLLMProvider = (config = {}) => {
  const providerType = (
    config.provider ||
    process.env.LEARNING_LLM_PROVIDER ||
    'disabled'
  ).toLowerCase();

  switch (providerType) {
    case 'disabled':
      // Safe default: missing env config forces deterministic fallback-only behavior across all routes
      return null;

    case 'fake':
      // Permitted ONLY when explicitly configured or injected by tests
      return new FakeLLMProvider();

    case 'gemini':
    case 'production': // Alias for selected V1 production provider
      if (!process.env.GEMINI_API_KEY) {
        if (process.env.NODE_ENV === 'production') {
          throw new Error('CONFIG_ERROR: Missing GEMINI_API_KEY for production learning provider.');
        }
        // In non-production without credentials, safely degrade to disabled fallback (never fake)
        return null;
      }
      if (!process.env.GEMINI_MODEL) {
        if (process.env.NODE_ENV === 'production') {
          throw new Error('CONFIG_ERROR: Missing GEMINI_MODEL for production learning provider.');
        }
        // In non-production without model configuration, safely degrade to disabled fallback (never fake)
        return null;
      }

      const adapter = new GeminiAdapter({
        apiKey: process.env.GEMINI_API_KEY,
        model: process.env.GEMINI_MODEL,
      });

      // Privacy capability gate: verify deployment requirements before allowing live calls
      const capabilities = adapter.getCapabilities();
      if (process.env.LEARNING_REQUIRE_ZERO_RETENTION === 'true' && !capabilities.supportsZeroRetention) {
        throw new Error('CONFIG_ERROR: Configured LLM provider does not satisfy zero-retention privacy requirement.');
      }
      return adapter;

    default:
      throw new Error(`UNKNOWN_PROVIDER: Unsupported learning provider "${providerType}".`);
  }
};

module.exports = {
  getLLMProvider,
};
