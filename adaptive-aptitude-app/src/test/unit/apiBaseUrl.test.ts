// src/test/unit/apiBaseUrl.test.ts
import { describe, it, expect } from 'vitest';
import { getApiBaseUrl, resolveApiUrl } from '../../utils/apiBaseUrl';

describe('apiBaseUrl (Same-Origin & URL Resolution)', () => {
  it('returns same-origin base URL by default or from env', () => {
    const base = getApiBaseUrl();
    expect(typeof base).toBe('string');
  });

  it('correctly resolves endpoint paths without double slashes', () => {
    const resolved = resolveApiUrl('/api/v1/auth/me');
    expect(resolved).toMatch(/\/api\/v1\/auth\/me$/);
    expect(resolved).not.toContain('//api');
  });

  it('handles paths without leading slash gracefully', () => {
    const resolved = resolveApiUrl('api/v1/questions/topics');
    expect(resolved).toMatch(/\/api\/v1\/questions\/topics$/);
  });
});
