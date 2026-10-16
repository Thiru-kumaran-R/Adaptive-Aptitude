// src/test/api/progressApi.contract.test.ts
import { describe, it, expect } from 'vitest';
import {
  fetchOverallProgress,
  fetchTopicMastery,
  fetchPatternMastery,
  fetchWeakestPatterns,
  fetchPrerequisites,
} from '../../services/api/progressApi';

describe('Progress & Mastery API Contract (Operations 29–33)', () => {
  it('Operation 29: GET /api/v1/progress/:userId', async () => {
    const res = await fetchOverallProgress('user-test-123');
    expect(res.success).toBe(true);
    expect(res.data.length).toBeGreaterThan(0);
    expect(res.data[0].pattern).toBe('Percentages');
  });

  it('Operation 30: GET /api/v1/progress/:userId/topics', async () => {
    const res = await fetchTopicMastery('user-test-123');
    expect(res.success).toBe(true);
    expect(res.data.length).toBeGreaterThan(0);
  });

  it('Operation 31: GET /api/v1/progress/:userId/patterns', async () => {
    const res = await fetchPatternMastery('user-test-123', { topic: 'Arithmetic' });
    expect(res.success).toBe(true);
    expect(res.data.length).toBeGreaterThan(0);
  });

  it('Operation 32: GET /api/v1/progress/:userId/weakest', async () => {
    const res = await fetchWeakestPatterns('user-test-123', { limit: 5 });
    expect(res.success).toBe(true);
    expect(res.data.length).toBeGreaterThan(0);
    expect(res.data[0].pattern).toBe('Percentages');
  });

  it('Operation 33: GET /api/v1/progress/prerequisites/:patternName', async () => {
    const res = await fetchPrerequisites('Percentages');
    expect(res.success).toBe(true);
    expect(res.data.pattern).toBe('Percentages');
  });
});
