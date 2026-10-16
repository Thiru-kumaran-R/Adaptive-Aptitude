'use strict';

/**
 * tests/learning/geminiAdapter.test.js
 *
 * Tests the GeminiAdapter using mocked native fetch, verifying current REST payload structure,
 * AbortController timeout, error classification, and privacy gate.
 */

const GeminiAdapter = require('../../src/providers/learning/geminiAdapter');
const { getLLMProvider } = require('../../src/providers/learning/llmProviderFactory');
const { TASK_SCHEMAS } = require('../../src/utils/learning/learningSchemaUtils');

describe('Phase 7: GeminiAdapter & Transport Contract', () => {
  const originalFetch = global.fetch;
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    global.fetch = originalFetch;
    process.env = { ...originalEnv };
  });

  describe('REST Transport Payload Contract', () => {
    it('uses generationConfig.responseFormat.text and excludes deprecated responseSchema', async () => {
      let capturedUrl = null;
      let capturedBody = null;

      global.fetch = jest.fn(async (url, options) => {
        capturedUrl = url;
        capturedBody = JSON.parse(options.body);

        return {
          ok: true,
          status: 200,
          json: async () => ({
            candidates: [
              {
                content: {
                  parts: [
                    {
                      text: JSON.stringify({
                        topic: 'Algebra',
                        pattern: 'Linear Equations & Systems of Equations',
                        conceptExplanation: 'Explanation',
                        formulaSummary: null,
                        workedExample: null,
                        keyTakeaway: 'Takeaway',
                      }),
                    },
                  ],
                },
              },
            ],
            usageMetadata: {
              promptTokenCount: 150,
              candidatesTokenCount: 75,
            },
          }),
        };
      });

      const adapter = new GeminiAdapter({
        apiKey: 'test-api-key',
        model: 'gemini-2.0-flash',
      });

      const res = await adapter.generate({
        taskType: 'concept_tutor',
        systemInstruction: 'System instruction',
        context: { topicContext: { topic: 'Algebra' } },
        outputSchema: TASK_SCHEMAS.concept_tutor,
      });

      expect(capturedUrl).toContain('models/gemini-2.0-flash:generateContent?key=test-api-key');

      // Frozen Gemini REST structured output payload checks:
      const genConfig = capturedBody.generationConfig;
      expect(genConfig).toBeDefined();
      expect(genConfig.responseFormat).toBeDefined();
      expect(genConfig.responseFormat.text).toBeDefined();
      expect(genConfig.responseFormat.text.mimeType).toBe('APPLICATION_JSON');
      expect(genConfig.responseFormat.text.schema).toBeDefined();

      // Deprecated fields strictly prohibited
      expect(genConfig.responseSchema).toBeUndefined();
      expect(capturedBody.responseJsonSchema).toBeUndefined();

      // Tokens and usage
      expect(genConfig.maxOutputTokens).toBe(600);
      expect(res.rawUsage.promptTokens).toBe(150);
      expect(res.rawUsage.completionTokens).toBe(75);
      expect(res.model).toBe('gemini-2.0-flash');
    });
  });

  describe('Error Classification & Timeouts', () => {
    it('classifies network failure as LLM_PROVIDER_UNAVAILABLE (503)', async () => {
      global.fetch = jest.fn(async () => {
        throw new Error('Connection refused');
      });

      const adapter = new GeminiAdapter({
        apiKey: 'test-key',
        model: 'gemini-model',
      });

      await expect(
        adapter.generate({
          taskType: 'hint',
          context: {},
        })
      ).rejects.toMatchObject({
        statusCode: 503,
        code: 'LLM_PROVIDER_UNAVAILABLE',
      });
    });

    it('classifies HTTP 500/503 from provider as LLM_PROVIDER_UNAVAILABLE (503)', async () => {
      global.fetch = jest.fn(async () => ({
        ok: false,
        status: 503,
      }));

      const adapter = new GeminiAdapter({
        apiKey: 'test-key',
        model: 'gemini-model',
      });

      await expect(
        adapter.generate({
          taskType: 'hint',
          context: {},
        })
      ).rejects.toMatchObject({
        statusCode: 503,
        code: 'LLM_PROVIDER_UNAVAILABLE',
      });
    });

    it('classifies malformed non-JSON candidate text as LLM_INVALID_STRUCTURED_OUTPUT (502)', async () => {
      global.fetch = jest.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [{ text: 'Here is your response: NOT JSON' }],
              },
            },
          ],
        }),
      }));

      const adapter = new GeminiAdapter({
        apiKey: 'test-key',
        model: 'gemini-model',
      });

      await expect(
        adapter.generate({
          taskType: 'hint',
          context: {},
        })
      ).rejects.toMatchObject({
        statusCode: 502,
        code: 'LLM_INVALID_STRUCTURED_OUTPUT',
      });
    });

    it('maps AbortController timeout to LLM_PROVIDER_TIMEOUT (504)', async () => {
      global.fetch = jest.fn(async (_url, options) => {
        return new Promise((_resolve, reject) => {
          options.signal.addEventListener('abort', () => {
            const err = new Error('The operation was aborted');
            err.name = 'AbortError';
            reject(err);
          });
        });
      });

      const adapter = new GeminiAdapter({
        apiKey: 'test-key',
        model: 'gemini-model',
      });

      // Pass small timeoutMs option to trigger quickly in test
      await expect(
        adapter.generate({
          taskType: 'hint',
          context: {},
          options: { timeoutMs: 50 },
        })
      ).rejects.toMatchObject({
        statusCode: 504,
        code: 'LLM_PROVIDER_TIMEOUT',
      });
    });
  });

  describe('Privacy Capability Gate', () => {
    it('reports supportsZeroRetention: false by default for GeminiAdapter', () => {
      const adapter = new GeminiAdapter({ apiKey: 'k', model: 'm' });
      expect(adapter.getCapabilities().supportsZeroRetention).toBe(false);
    });

    it('provider factory throws CONFIG_ERROR if zero retention is required but unsupported', () => {
      process.env.LEARNING_LLM_PROVIDER = 'gemini';
      process.env.GEMINI_API_KEY = 'test-key';
      process.env.GEMINI_MODEL = 'test-model';
      process.env.LEARNING_REQUIRE_ZERO_RETENTION = 'true';

      expect(() => {
        getLLMProvider();
      }).toThrow('CONFIG_ERROR: Configured LLM provider does not satisfy zero-retention privacy requirement.');
    });
  });
});
