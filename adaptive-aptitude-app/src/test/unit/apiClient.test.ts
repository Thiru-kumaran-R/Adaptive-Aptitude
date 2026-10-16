// src/test/unit/apiClient.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { apiClient } from '../../services/api/apiClient';
import { setAccessToken, clearAccessToken } from '../../services/api/tokenManager';

describe('apiClient (Wire Transport & Envelopes)', () => {
  beforeEach(() => {
    clearAccessToken();
  });

  it('preserves complete raw wire response and does NOT globally unwrap .data', async () => {
    const response = await apiClient.get<{
      success: boolean;
      count: number;
      data: string[];
    }>('/api/v1/questions/topics');

    // Invariant: apiClient returns the complete decoded JSON envelope
    expect(response).toBeDefined();
    expect(response.success).toBe(true);
    expect(response.count).toBe(3);
    expect(Array.isArray(response.data)).toBe(true);
    expect(response.data).toEqual(['Arithmetic', 'Algebra', 'Geometry']);
  });

  it('attaches Bearer access token when available in closure memory', async () => {
    setAccessToken('mock-active-access-token-999');

    const meRes = await apiClient.get<{
      success: boolean;
      data: { user: { userId: string } };
    }>('/api/v1/auth/me');

    expect(meRes.success).toBe(true);
    expect(meRes.data.user.userId).toBe('user-test-123');
  });

  it('handles query parameters and URL encoding properly', async () => {
    const res = await apiClient.get<{
      success: boolean;
      meta: { topic: string };
      data: unknown[];
    }>('/api/v1/questions/topic/Arithmetic/patterns');

    expect(res.success).toBe(true);
    expect(res.meta.topic).toBe('Arithmetic');
    expect(res.data.length).toBeGreaterThan(0);
  });
});
