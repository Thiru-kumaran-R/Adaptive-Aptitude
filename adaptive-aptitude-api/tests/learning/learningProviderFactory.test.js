'use strict';

const { getLLMProvider } = require('../../src/providers/learning/llmProviderFactory');
const FakeLLMProvider = require('../../src/providers/learning/fakeLLMProvider');
const GeminiAdapter = require('../../src/providers/learning/geminiAdapter');

describe('Phase 7: LLM Provider Factory', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  test('defaults to null (disabled fallback-only mode) when LEARNING_LLM_PROVIDER is unset or disabled', () => {
    delete process.env.LEARNING_LLM_PROVIDER;
    expect(getLLMProvider()).toBeNull();

    process.env.LEARNING_LLM_PROVIDER = 'disabled';
    expect(getLLMProvider()).toBeNull();
  });

  test('resolves FakeLLMProvider only when explicitly configured', () => {
    process.env.LEARNING_LLM_PROVIDER = 'fake';
    const provider = getLLMProvider();
    expect(provider).toBeInstanceOf(FakeLLMProvider);
    expect(provider.providerName).toBe('fake');
  });

  test('in non-production without credentials, gracefully degrades to null (never fake)', () => {
    process.env.NODE_ENV = 'test';
    process.env.LEARNING_LLM_PROVIDER = 'gemini';
    delete process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_MODEL;

    const provider = getLLMProvider();
    expect(provider).toBeNull();
  });

  test('in production without GEMINI_API_KEY, throws CONFIG_ERROR', () => {
    process.env.NODE_ENV = 'production';
    process.env.LEARNING_LLM_PROVIDER = 'gemini';
    delete process.env.GEMINI_API_KEY;
    process.env.GEMINI_MODEL = 'gemini-1.5-pro';

    expect(() => getLLMProvider()).toThrow('CONFIG_ERROR: Missing GEMINI_API_KEY');
  });

  test('in production without GEMINI_MODEL, throws CONFIG_ERROR', () => {
    process.env.NODE_ENV = 'production';
    process.env.LEARNING_LLM_PROVIDER = 'gemini';
    process.env.GEMINI_API_KEY = 'test-key';
    delete process.env.GEMINI_MODEL;

    expect(() => getLLMProvider()).toThrow('CONFIG_ERROR: Missing GEMINI_MODEL');
  });

  test('instantiates GeminiAdapter when valid configuration provided', () => {
    process.env.LEARNING_LLM_PROVIDER = 'gemini';
    process.env.GEMINI_API_KEY = 'test-key';
    process.env.GEMINI_MODEL = 'gemini-1.5-pro';

    const provider = getLLMProvider();
    expect(provider).toBeInstanceOf(GeminiAdapter);
    expect(provider.providerName).toBe('gemini');
    expect(provider.model).toBe('gemini-1.5-pro');
  });

  test('enforces zero retention privacy gate when required', () => {
    process.env.LEARNING_LLM_PROVIDER = 'gemini';
    process.env.GEMINI_API_KEY = 'test-key';
    process.env.GEMINI_MODEL = 'gemini-1.5-pro';
    process.env.LEARNING_REQUIRE_ZERO_RETENTION = 'true';

    expect(() => getLLMProvider()).toThrow('CONFIG_ERROR: Configured LLM provider does not satisfy zero-retention privacy requirement.');
  });

  test('throws UNKNOWN_PROVIDER on unsupported provider name', () => {
    expect(() => getLLMProvider({ provider: 'unsupported-ai' })).toThrow('UNKNOWN_PROVIDER');
  });
});
