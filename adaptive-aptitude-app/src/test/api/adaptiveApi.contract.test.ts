// src/test/api/adaptiveApi.contract.test.ts
import { describe, it, expect } from 'vitest';
import { fetchAdaptiveNextQuestion } from '../../services/api/adaptiveApi';

describe('Adaptive API Contract (Operation 34)', () => {
  it('Operation 34: GET /api/v1/adaptive/next-question', async () => {
    const res = await fetchAdaptiveNextQuestion({ topic: 'Arithmetic', pattern: 'Percentages' });
    expect(res.success).toBe(true);
    expect(res.data.question._id).toBe('q-adaptive-001');
    expect(res.data.decision.selectedPattern).toBe('Percentages');
    // Anti-leakage: AdaptiveQuestionDto must not contain answer or explanation
    const q = res.data.question as unknown as Record<string, unknown>;
    expect(q.answer).toBeUndefined();
    expect(q.explanation).toBeUndefined();
  });
});
