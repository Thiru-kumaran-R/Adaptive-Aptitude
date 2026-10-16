// src/test/unit/tokenManager.security.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getAccessToken,
  setAccessToken,
  clearAccessToken,
  performSingleFlightRefresh,
} from '../../services/api/tokenManager';

describe('tokenManager (Security & Concurrency)', () => {
  beforeEach(() => {
    clearAccessToken();
    localStorage.clear();
    sessionStorage.clear();
  });

  it('ACC-06: preserves access token in closure memory only, never in web storage or cookies', () => {
    const testToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test-payload.signature';
    setAccessToken(testToken);

    // 1. In-memory access works
    expect(getAccessToken()).toBe(testToken);

    // 2. Storage isolation: NO storage of access token in localStorage
    expect(localStorage.getItem('accessToken')).toBeNull();
    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.length).toBe(0);

    // 3. Storage isolation: NO storage of access token in sessionStorage
    expect(sessionStorage.getItem('accessToken')).toBeNull();
    expect(sessionStorage.getItem('token')).toBeNull();
    expect(sessionStorage.length).toBe(0);

    // 4. Cookie isolation: NO readable document cookie written by client
    expect(document.cookie).not.toContain(testToken);

    // 5. Window variable isolation: NO global window pollution
    const win = window as unknown as Record<string, unknown>;
    expect(win.accessToken).toBeUndefined();
    expect(win.__TOKEN__).toBeUndefined();

    // 6. Clear removes from closure
    clearAccessToken();
    expect(getAccessToken()).toBeNull();
  });

  it('ACC-07: deduplicates concurrent 401 refresh calls into exactly one single-flight refresh', async () => {
    let rawRefreshCalls = 0;
    const mockRefreshFn = vi.fn(async () => {
      rawRefreshCalls++;
      await new Promise((resolve) => setTimeout(resolve, 50));
      return 'new-access-jwt-token-777';
    });

    // Launch 5 concurrent refresh attempts simultaneously
    const results = await Promise.all([
      performSingleFlightRefresh(mockRefreshFn),
      performSingleFlightRefresh(mockRefreshFn),
      performSingleFlightRefresh(mockRefreshFn),
      performSingleFlightRefresh(mockRefreshFn),
      performSingleFlightRefresh(mockRefreshFn),
    ]);

    // Exactly one refresh operation was executed
    expect(mockRefreshFn).toHaveBeenCalledTimes(1);
    expect(rawRefreshCalls).toBe(1);

    // All callers received the identical new token
    for (const token of results) {
      expect(token).toBe('new-access-jwt-token-777');
    }
    expect(getAccessToken()).toBe('new-access-jwt-token-777');
  });

  it('ACC-08: correctly implements refresh error taxonomy across all 5 frozen categories', async () => {
    // 1. Refresh success -> sets access token, returns token
    const successRefreshFn = vi.fn().mockResolvedValue('fresh-jwt-token');
    const token = await performSingleFlightRefresh(successRefreshFn);
    expect(token).toBe('fresh-jwt-token');
    expect(getAccessToken()).toBe('fresh-jwt-token');

    // 2. Credential invalid / expired / reused (401) -> clears access token
    const err401 = Object.assign(new Error('INVALID_REFRESH_TOKEN'), {
      statusCode: 401,
      code: 'INVALID_REFRESH_TOKEN',
    });
    const failed401Fn = vi.fn().mockRejectedValue(err401);
    await expect(performSingleFlightRefresh(failed401Fn)).rejects.toThrow('INVALID_REFRESH_TOKEN');
    expect(getAccessToken()).toBeNull();

    // 3. ACCOUNT_DISABLED (403) -> clears access token
    setAccessToken('pre-existing-token');
    const errDisabled = Object.assign(new Error('ACCOUNT_DISABLED'), {
      statusCode: 403,
      code: 'ACCOUNT_DISABLED',
    });
    const failedDisabledFn = vi.fn().mockRejectedValue(errDisabled);
    await expect(performSingleFlightRefresh(failedDisabledFn)).rejects.toThrow('ACCOUNT_DISABLED');
    expect(getAccessToken()).toBeNull();

    // 4. Origin / security failure (403 REFRESH_ORIGIN_REQUIRED) -> clears access token
    setAccessToken('pre-existing-token');
    const errOrigin = Object.assign(new Error('REFRESH_ORIGIN_REQUIRED'), {
      statusCode: 403,
      code: 'REFRESH_ORIGIN_REQUIRED',
    });
    const failedOriginFn = vi.fn().mockRejectedValue(errOrigin);
    await expect(performSingleFlightRefresh(failedOriginFn)).rejects.toThrow('REFRESH_ORIGIN_REQUIRED');
    expect(getAccessToken()).toBeNull();

    // 5. Transient HTTP 5xx / Network failure -> PRESERVES valid in-memory access token!
    setAccessToken('valid-in-memory-token-to-preserve');
    const err500 = Object.assign(new Error('SERVICE_UNAVAILABLE'), {
      statusCode: 503,
      code: 'SERVICE_UNAVAILABLE',
    });
    const failed500Fn = vi.fn().mockRejectedValue(err500);
    await expect(performSingleFlightRefresh(failed500Fn)).rejects.toThrow('SERVICE_UNAVAILABLE');
    // Critical frozen invariant: Transient 5xx MUST NOT clear valid in-memory token!
    expect(getAccessToken()).toBe('valid-in-memory-token-to-preserve');

    // 5b. Network failure -> PRESERVES valid in-memory access token!
    const errNet = Object.assign(new Error('NETWORK_ERROR'), {
      code: 'NETWORK_ERROR',
    });
    const failedNetFn = vi.fn().mockRejectedValue(errNet);
    await expect(performSingleFlightRefresh(failedNetFn)).rejects.toThrow('NETWORK_ERROR');
    expect(getAccessToken()).toBe('valid-in-memory-token-to-preserve');
  });
});
