'use strict';

/**
 * tests/learning/learningDeliveryService.test.js
 *
 * Tests the uniform response envelope, normalized provider metadata,
 * three-tier provenance lineage, and process-local rate limiter.
 */

const {
  buildDeliveryEnvelope,
  deriveProvenance,
} = require('../../src/services/learning/learningDeliveryService');

const {
  checkRateLimit,
  acquireConcurrency,
  releaseConcurrency,
  resetRateLimits,
} = require('../../src/utils/learning/rateLimiter');

describe('Phase 7: Response Delivery Envelope & Rate Limiting', () => {
  describe('buildDeliveryEnvelope & Metadata Normalization', () => {
    it('enforces exact top-level envelope keys (data, metadata, provenance)', () => {
      const envelope = buildDeliveryEnvelope({
        data: { topic: 'Algebra', pattern: 'Linear Equations & Systems of Equations' },
        taskType: 'concept_tutor',
        promptVersion: 'v1.0.0',
        model: 'gemini-1.5-pro',
        provider: 'gemini',
        isDegraded: false,
      });

      expect(Object.keys(envelope).sort()).toEqual(['data', 'metadata', 'provenance'].sort());
      expect(envelope).not.toHaveProperty('success');
    });

    it('enforces exact metadata fields and values for all six task types', () => {
      const taskTypes = [
        'concept_tutor',
        'hint',
        'explain_attempt',
        'explain_progress',
        'explain_plan',
        'mock_review',
      ];

      for (const t of taskTypes) {
        const envelope = buildDeliveryEnvelope({
          data: { sample: 'payload' },
          taskType: t,
          promptVersion: 'v1.0.0',
          model: 'gemini-1.5-pro',
          provider: 'gemini',
          isDegraded: false,
        });

        expect(envelope.metadata.taskType).toBe(t);
        expect(envelope.metadata.algorithmVersion).toBe('v1');
        expect(Object.keys(envelope.metadata).sort()).toEqual([
          'algorithmVersion',
          'degradationReason',
          'isDegraded',
          'model',
          'promptVersion',
          'provider',
          'taskType',
        ].sort());
      }
    });

    it('normalizes provider metadata for Gemini provider success', () => {
      const envelope = buildDeliveryEnvelope({
        data: { topic: 'Algebra', pattern: 'Linear Equations & Systems of Equations' },
        taskType: 'concept_tutor',
        promptVersion: 'v1.0.0',
        model: 'gemini-1.5-pro',
        provider: 'gemini',
        isDegraded: false,
      });

      expect(envelope.data).toBeDefined();
      expect(envelope.metadata.taskType).toBe('concept_tutor');
      expect(envelope.metadata.algorithmVersion).toBe('v1');
      expect(envelope.metadata.promptVersion).toBe('v1.0.0');
      expect(envelope.metadata.model).toBe('gemini-1.5-pro');
      expect(envelope.metadata.provider).toBe('gemini');
      expect(envelope.metadata.isDegraded).toBe(false);
      expect(envelope.metadata.degradationReason).toBeNull();
    });

    it('normalizes provider metadata for Fake provider success', () => {
      const envelope = buildDeliveryEnvelope({
        data: { hintLevel: 1, hint: 'A hint.' },
        taskType: 'hint',
        promptVersion: 'v1.0.0',
        model: 'fake-llm-v1',
        provider: 'fake',
        isDegraded: false,
      });

      expect(envelope.metadata.taskType).toBe('hint');
      expect(envelope.metadata.algorithmVersion).toBe('v1');
      expect(envelope.metadata.promptVersion).toBe('v1.0.0');
      expect(envelope.metadata.model).toBe('fake-llm-v1');
      expect(envelope.metadata.provider).toBe('fake');
      expect(envelope.metadata.isDegraded).toBe(false);
      expect(envelope.metadata.degradationReason).toBeNull();
    });

    it('disabled fallback sets promptVersion: null and does not falsely claim provider invocation', () => {
      const envelope = buildDeliveryEnvelope({
        data: { hintLevel: 1, hint: 'Review the problem.' },
        taskType: 'hint',
        provider: 'disabled',
        model: null,
        isDegraded: true,
        degradationReason: 'disabled_mode',
      });

      expect(envelope.metadata.taskType).toBe('hint');
      expect(envelope.metadata.algorithmVersion).toBe('v1');
      expect(envelope.metadata.provider).toBe('disabled');
      expect(envelope.metadata.model).toBeNull();
      expect(envelope.metadata.promptVersion).toBeNull();
      expect(envelope.metadata.isDegraded).toBe(true);
      expect(envelope.metadata.degradationReason).toBe('disabled_mode');
    });

    it('normalizes provider metadata for provider failure + degraded fallback', () => {
      const envelope = buildDeliveryEnvelope({
        data: { hintLevel: 1, hint: 'Review the problem.' },
        taskType: 'hint',
        promptVersion: 'v1.0.0',
        model: 'gemini-1.5-pro',
        provider: 'gemini',
        isDegraded: true,
        degradationReason: 'provider_timeout',
      });

      expect(envelope.metadata.provider).toBe('gemini'); // preserves attempted provider
      expect(envelope.metadata.model).toBe('gemini-1.5-pro');
      expect(envelope.metadata.isDegraded).toBe(true);
      expect(envelope.metadata.degradationReason).toBe('provider_timeout');
    });
  });

  describe('deriveProvenance (Three-Tier Factual Provenance)', () => {
    it('separates facts, deterministicSignals, and llmInterpretations and enforces exact structure', () => {
      const context = {
        topicContext: { topic: 'Percentage', pattern: 'Basic Percentage' },
        questionContext: { questionId: 'q123', difficulty: 4 },
        attemptContext: { selectedAnswer: '25%' },
        progressContext: { mastery: 0.72, masteryLabel: 'proficient', recentAccuracy: 75 },
        planningContext: { targetDate: '2026-10-15', scheduledPatterns: [{ targetQuestions: 15 }] },
      };

      const data = {
        conceptExplanation: 'Understanding base and percentage relationships.',
        workedExample: { setup: 'Example' },
      };

      const prov = deriveProvenance('concept_tutor', context, data, false);

      expect(Object.keys(prov).sort()).toEqual([
        'deterministicSignals',
        'facts',
        'llmInterpretations',
      ].sort());

      expect(prov.facts.some((f) => f.includes('Canonical Topic: Percentage'))).toBe(true);
      expect(prov.facts.some((f) => f.includes('Stored Question Difficulty: 4'))).toBe(true);
      expect(prov.deterministicSignals.some((s) => s.includes('0.72 (proficient)'))).toBe(true);
      expect(prov.llmInterpretations.some((i) => i.includes('Pedagogical concept guidance'))).toBe(true);
    });
  });

  describe('Rate Limiter (Process-Local In-Memory)', () => {
    beforeEach(() => {
      resetRateLimits();
    });

    it('enforces 30 requests per hour per user sliding window', () => {
      const userId = 'rate_user_1';

      // 30 requests should succeed
      for (let i = 0; i < 30; i++) {
        expect(() => checkRateLimit(userId)).not.toThrow();
      }

      // 31st request throws 429 LEARNING_RATE_LIMIT_EXCEEDED
      expect(() => checkRateLimit(userId)).toThrow();
      try {
        checkRateLimit(userId);
      } catch (err) {
        expect(err.statusCode).toBe(429);
        expect(err.code).toBe('LEARNING_RATE_LIMIT_EXCEEDED');
      }
    });

    it('enforces 2 concurrent requests per user', () => {
      const userId = 'rate_user_2';

      acquireConcurrency(userId); // 1
      acquireConcurrency(userId); // 2

      // Next check throws concurrency limit
      expect(() => checkRateLimit(userId)).toThrow();

      releaseConcurrency(userId); // now 1
      expect(() => checkRateLimit(userId)).not.toThrow();
    });
  });
});
