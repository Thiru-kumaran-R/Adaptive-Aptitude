// src/test/api/questionApi.contract.test.ts
import { describe, it, expect } from 'vitest';
import {
  fetchTopics,
  fetchPatternsByTopic,
  fetchQuestionsByTopic,
  fetchQuestionsByPattern,
  fetchRandomQuestionsByTopic,
  fetchRandomQuestionsByPattern,
  fetchQuestionById,
} from '../../services/api/questionApi';

describe('Question API Contract (Operations 7–13)', () => {
  it('Operation 7: GET /api/v1/questions/topics', async () => {
    const res = await fetchTopics();
    expect(res.success).toBe(true);
    expect(Array.isArray(res.data)).toBe(true);
    expect(res.data).toContain('Arithmetic');
  });

  it('Operation 8: GET /api/v1/questions/topic/:topic/patterns', async () => {
    const res = await fetchPatternsByTopic('Arithmetic');
    expect(res.success).toBe(true);
    expect(res.data.length).toBeGreaterThan(0);
    expect(res.data[0].name).toBe('Percentages');
  });

  it('Operation 9: GET /api/v1/questions/topic/:topic', async () => {
    const res = await fetchQuestionsByTopic('Arithmetic', { page: 1, limit: 5 });
    expect(res.success).toBe(true);
    expect(res.data.length).toBeGreaterThan(0);
    expect(res.meta.page).toBe(1);
  });

  it('Operation 10: GET /api/v1/questions/topic/:topic/pattern/:pattern', async () => {
    const res = await fetchQuestionsByPattern('Arithmetic', 'Percentages');
    expect(res.success).toBe(true);
    expect(res.data.length).toBeGreaterThan(0);
    expect(res.data[0].pattern).toBe('Percentages');
  });

  it('Operation 11: GET /api/v1/questions/topic/:topic/random', async () => {
    const res = await fetchRandomQuestionsByTopic('Arithmetic', { limit: 1 });
    expect(res.success).toBe(true);
    expect(res.data.length).toBe(1);
  });

  it('Operation 12: GET /api/v1/questions/topic/:topic/pattern/:pattern/random', async () => {
    const res = await fetchRandomQuestionsByPattern('Arithmetic', 'Percentages', { limit: 1 });
    expect(res.success).toBe(true);
    expect(res.data.length).toBe(1);
  });

  it('Operation 13: GET /api/v1/questions/:id', async () => {
    const res = await fetchQuestionById('q-101');
    expect(res.success).toBe(true);
    expect(res.data._id).toBe('q-101');
    expect(res.data.options.length).toBe(4);
  });
});
