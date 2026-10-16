// src/test/api/mockApi.contract.test.ts
import { describe, it, expect } from 'vitest';
import {
  fetchMockBlueprints,
  createMockSession,
  startMockSession,
  fetchMockSession,
  fetchMockQuestion,
  saveMockResponse,
  completeMockSection,
  submitMockSession,
  abandonMockSession,
  fetchMockResult,
  fetchMockReview,
} from '../../services/api/mockApi';

describe('Mock Examination API Contract (Operations 38–48)', () => {
  it('Operation 38: GET /api/v1/mock-blueprints', async () => {
    const res = await fetchMockBlueprints();
    expect(res.success).toBe(true);
    expect(res.data.length).toBeGreaterThan(0);
    expect(res.data[0]._id).toBe('bp-standard-001');
  });

  it('Operation 39: POST /api/v1/mock-sessions', async () => {
    const res = await createMockSession({ blueprintId: 'bp-standard-001' });
    expect(res.success).toBe(true);
    expect(res.data._id).toBe('mock-sess-777');
    expect(res.data.status).toBe('created');
  });

  it('Operation 40: POST /api/v1/mock-sessions/:id/start', async () => {
    const res = await startMockSession('mock-sess-777');
    expect(res.success).toBe(true);
    expect(res.data.status).toBe('started');
    expect(res.data.expiresAt).toBeDefined();
  });

  it('Operation 41: GET /api/v1/mock-sessions/:id', async () => {
    const res = await fetchMockSession('mock-sess-777');
    expect(res.success).toBe(true);
    expect(res.data.status).toBe('started');
    expect(res.data.sections.length).toBeGreaterThan(0);
  });

  it('Operation 42: GET /api/v1/mock-sessions/:id/questions/:questionId', async () => {
    const res = await fetchMockQuestion('mock-sess-777', 'q-1');
    expect(res.success).toBe(true);
    expect(res.data.questionId).toBe('q-1');
    // Anti-leakage: ActiveMockQuestionDto must NOT expose answer or explanation
    const q = res.data as unknown as Record<string, unknown>;
    expect(q.answer).toBeUndefined();
    expect(q.explanation).toBeUndefined();
    expect(q.correctAnswer).toBeUndefined();
  });

  it('Operation 43: POST /api/v1/mock-sessions/:id/responses', async () => {
    const res = await saveMockResponse('mock-sess-777', {
      questionId: 'q-1',
      sectionId: 'sec-quant-01',
      selectedOption: '10',
      timeSpentSeconds: 25,
      isFlagged: false,
    });
    expect(res.success).toBe(true);
    expect(res.data.selectedOption).toBe('10');
  });

  it('Operation 44: POST /api/v1/mock-sessions/:id/sections/:sectionId/complete', async () => {
    const res = await completeMockSection('mock-sess-777', 'sec-quant-01');
    expect(res.success).toBe(true);
    expect(res.data.status).toBe('completed');
  });

  it('Operation 45: POST /api/v1/mock-sessions/:id/submit', async () => {
    const res = await submitMockSession('mock-sess-777');
    expect(res.success).toBe(true);
    expect(res.data.status).toBe('submitted');
  });

  it('Operation 46: POST /api/v1/mock-sessions/:id/abandon', async () => {
    const res = await abandonMockSession('mock-sess-777');
    expect(res.success).toBe(true);
    expect(res.data.status).toBe('abandoned');
  });

  it('Operation 47: GET /api/v1/mock-sessions/:id/result', async () => {
    const res = await fetchMockResult('mock-sess-777');
    expect(res.success).toBe(true);
    expect(res.data.totalScore).toBe(24);
    expect(res.data.percentage).toBe(80);
  });

  it('Operation 48: GET /api/v1/mock-sessions/:id/review', async () => {
    const res = await fetchMockReview('mock-sess-777');
    expect(res.success).toBe(true);
    expect(res.data.questions.length).toBeGreaterThan(0);
    expect(res.data.questions[0].correctAnswer).toBe('10');
  });
});
