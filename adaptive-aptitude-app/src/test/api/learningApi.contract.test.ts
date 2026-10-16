// src/test/api/learningApi.contract.test.ts
import { describe, it, expect } from 'vitest';
import {
  requestTutorGuidance,
  requestQuestionHint,
  requestAttemptExplanation,
  requestProgressExplanation,
  requestPlanExplanation,
  requestMockDebrief,
} from '../../services/api/learningApi';

describe('Socratic AI & Learning API Contract (Operations 58–63)', () => {
  it('Operation 58: POST /api/v1/learning/tutor', async () => {
    const res = await requestTutorGuidance({
      message: 'Can you explain percentages?',
      topic: 'Arithmetic',
      pattern: 'Percentages',
    });
    expect(res.data).toBeDefined();
    expect(res.metadata).toBeDefined();
    expect(res.data.conceptExplanation).toBeDefined();
    expect(res.data.keyTakeaway).toBeDefined();
  });

  it('Operation 59: POST /api/v1/learning/hint', async () => {
    const res = await requestQuestionHint({
      questionId: 'q-101',
      hintLevel: 1,
    });
    expect(res.data).toBeDefined();
    expect(res.data.hintLevel).toBe(1);
    expect(res.data.hint).toBeDefined();
  });

  it('Operation 60: POST /api/v1/learning/explain-attempt', async () => {
    const res = await requestAttemptExplanation({
      attemptId: 'att-123',
      questionId: 'q-101',
      selectedAnswer: '10',
    });
    expect(res.data).toBeDefined();
    expect(res.data.mistakeExplanation).toBeDefined();
    expect(res.data.correctApproach).toBeDefined();
  });

  it('Operation 61: POST /api/v1/learning/explain-progress', async () => {
    const res = await requestProgressExplanation({ userId: 'user-test-123' });
    expect(res.data).toBeDefined();
    expect(res.data.masteryInterpretation).toBeDefined();
  });

  it('Operation 62: POST /api/v1/learning/explain-plan', async () => {
    const res = await requestPlanExplanation({ planId: 'plan-gen-001' });
    expect(res.data).toBeDefined();
    expect(res.data.objectiveSummary).toBeDefined();
  });

  it('Operation 63: POST /api/v1/learning/mock-review', async () => {
    const res = await requestMockDebrief({ sessionId: 'mock-sess-777' });
    expect(res.data).toBeDefined();
    expect(res.data.overallScoreInterpretation).toBeDefined();
  });
});
