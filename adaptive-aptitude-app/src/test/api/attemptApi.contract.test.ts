// src/test/api/attemptApi.contract.test.ts
import { describe, it, expect } from 'vitest';
import { recordAttempt, fetchUserAttempts } from '../../services/api/attemptApi';

describe('Attempt API Contract (Operations 27–28)', () => {
  it('Operation 27: POST /api/v1/attempts', async () => {
    const res = await recordAttempt({
      questionId: 'q-101',
      selectedAnswer: '12',
      timeTaken: 35,
      source: 'practice',
    });
    expect(res.success).toBe(true);
    expect(res.data._id).toBe('attempt-rec-999');
    expect(res.data.isCorrect).toBe(true);
  });

  it('Operation 28: GET /api/v1/attempts/user/:userId', async () => {
    const res = await fetchUserAttempts('user-test-123', { limit: 10 });
    expect(res.success).toBe(true);
    expect(res.data.length).toBeGreaterThan(0);
    expect(res.data[0].questionId).toBe('q-101');
  });
});
