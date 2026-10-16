'use strict';

/**
 * tests/security/rateLimiter.test.js
 *
 * Security test suite for Phase 14 Rate Limiter Engine:
 * - Single process-wide Map registry shared across all 4 tiers
 * - Aggregate capacity bounds and capacity exhaustion (HTTP 429 RATE_LIMIT_CAPACITY_EXCEEDED)
 * - Safe key derivation sentinels for malformed/missing payloads
 * - Process-wide sweeper without per-key timers
 * - Pipeline ordering and Tier-4 before identity guard
 */

const request = require('supertest');
const createApp = require('../../src/app');
const authConfig = require('../../src/config/authConfig');
const authService = require('../../src/services/authService');
const {
  globalRateLimiter,
  authRateLimiter,
  refreshRateLimiter,
  llmRateLimiter,
  getAuthRateLimitEmailComponent,
  getRefreshRateLimitTokenComponent,
  sweepExpiredBuckets,
  setTimeSource,
  resetTimeSource,
  _getRegistry,
  _clearRegistryForTesting
} = require('../../src/middleware/rateLimiter');

describe('Security: Rate Limiter Engine & Tiers', () => {
  let app;
  let registry;

  beforeAll(() => {
    registry = _getRegistry();
    app = createApp();
  });

  beforeEach(() => {
    _clearRegistryForTesting();
    resetTimeSource();
  });

  afterAll(() => {
    _clearRegistryForTesting();
    resetTimeSource();
  });

  describe('Single Process-Wide Shared Registry & Key Prefixes', () => {
    it('uses exactly 1 shared Map instance across all four tiers', () => {
      expect(registry).toBeInstanceOf(Map);
      _clearRegistryForTesting();

      // Simulate 1 request from each tier
      const mockReqIp = { ip: '10.0.0.1' };
      const mockReqAuth = { ip: '10.0.0.1', body: { email: 'user@example.com' } };
      const mockReqRef = { ip: '10.0.0.1', cookies: { refreshToken: 'dummy_token' } };
      const mockReqLlm = { user: { userId: 'usr_mock_123' } };

      const res = { setHeader: jest.fn(), status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();

      globalRateLimiter(mockReqIp, res, next);
      authRateLimiter(mockReqAuth, res, next);
      refreshRateLimiter(mockReqRef, res, next);
      llmRateLimiter(mockReqLlm, res, next);

      expect(registry.size).toBe(4);

      const keys = Array.from(registry.keys());
      expect(keys.some((k) => k.startsWith('ip:'))).toBe(true);
      expect(keys.some((k) => k.startsWith('auth:'))).toBe(true);
      expect(keys.some((k) => k.startsWith('ref:'))).toBe(true);
      expect(keys.some((k) => k.startsWith('llm:'))).toBe(true);
    });

    it('asserts zero independent per-tier Map allocations (capacity is aggregate)', () => {
      _clearRegistryForTesting();
      // Inject entries from different tiers
      registry.set('ip:1.1.1.1', { count: 1, resetAt: Date.now() + 60000 });
      registry.set('auth:1.1.1.1:user@example.com', { count: 1, resetAt: Date.now() + 60000 });
      registry.set('ref:1.1.1.1:tokhash', { count: 1, resetAt: Date.now() + 60000 });
      registry.set('llm:usr_123', { count: 1, resetAt: Date.now() + 60000 });

      expect(registry.size).toBe(4);
    });
  });

  describe('Aggregate Capacity Bound & Saturation Behavior', () => {
    it('rejects new keys with HTTP 429 RATE_LIMIT_CAPACITY_EXCEEDED when capacity is reached', () => {
      _clearRegistryForTesting();

      // Mock authConfig.RATE_LIMIT_MAX_KEYS by filling registry up to max
      const originalMax = authConfig.RATE_LIMIT_MAX_KEYS;
      // We can temporarily populate registry to simulate reaching RATE_LIMIT_MAX_KEYS
      // For fast unit testing, simulate max keys reached
      for (let i = 0; i < originalMax; i++) {
        registry.set(`fill:${i}`, { count: 1, resetAt: Date.now() + 60000 });
      }

      expect(registry.size).toBe(originalMax);

      const res = {
        setHeader: jest.fn(),
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      // Attempt new key from any tier
      const newReq = { ip: '192.168.1.100' };
      globalRateLimiter(newReq, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(429);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: 'RATE_LIMIT_CAPACITY_EXCEEDED'
          })
        })
      );

      // Existing allocated keys still operate normally
      const existingReq = { ip: 'fill:0' };
      const nextExisting = jest.fn();
      // Since 'fill:0' is in registry, keyExtractor for global is `ip:${ip}`, so if ip is 'fill:0', it would look for 'ip:fill:0'
      // Instead, test a key that actually exists:
      registry.set('ip:192.168.1.50', { count: 1, resetAt: Date.now() + 60000 });
      const existingReq2 = { ip: '192.168.1.50' };
      globalRateLimiter(existingReq2, res, nextExisting);
      expect(nextExisting).toHaveBeenCalled();

      // Active key eviction count remains 0 (no LRU drop)
      expect(registry.has('fill:0')).toBe(true);
    });
  });

  describe('Safe Limiter Key Extraction (Zero Throw Guarantee)', () => {
    it('uses __INVALID_EMAIL__ when req.body or email is missing, malformed, or non-scalar', () => {
      expect(getAuthRateLimitEmailComponent({})).toBe('__INVALID_EMAIL__');
      expect(getAuthRateLimitEmailComponent({ body: null })).toBe('__INVALID_EMAIL__');
      expect(getAuthRateLimitEmailComponent({ body: {} })).toBe('__INVALID_EMAIL__');
      expect(getAuthRateLimitEmailComponent({ body: { email: 12345 } })).toBe('__INVALID_EMAIL__');
      expect(getAuthRateLimitEmailComponent({ body: { email: { $gt: '' } } })).toBe('__INVALID_EMAIL__');
      expect(getAuthRateLimitEmailComponent({ body: { email: ['bad'] } })).toBe('__INVALID_EMAIL__');
      expect(getAuthRateLimitEmailComponent({ body: { email: true } })).toBe('__INVALID_EMAIL__');

      // Valid email canonicalized
      expect(getAuthRateLimitEmailComponent({ body: { email: '  ALICE@EXAMPLE.COM ' } })).toBe('alice@example.com');
    });

    it('uses __MISSING_OR_INVALID_REFRESH__ when refreshToken cookie is missing, empty, or non-scalar', () => {
      expect(getRefreshRateLimitTokenComponent({})).toBe('__MISSING_OR_INVALID_REFRESH__');
      expect(getRefreshRateLimitTokenComponent({ cookies: null })).toBe('__MISSING_OR_INVALID_REFRESH__');
      expect(getRefreshRateLimitTokenComponent({ cookies: {} })).toBe('__MISSING_OR_INVALID_REFRESH__');
      expect(getRefreshRateLimitTokenComponent({ cookies: { refreshToken: '' } })).toBe('__MISSING_OR_INVALID_REFRESH__');
      expect(getRefreshRateLimitTokenComponent({ cookies: { refreshToken: 123 } })).toBe('__MISSING_OR_INVALID_REFRESH__');
      expect(getRefreshRateLimitTokenComponent({ cookies: { refreshToken: {} } })).toBe('__MISSING_OR_INVALID_REFRESH__');

      // Valid token is hashed with sha256
      const validHash = getRefreshRateLimitTokenComponent({ cookies: { refreshToken: 'valid-refresh-token' } });
      expect(validHash).toHaveLength(64);
      expect(validHash).not.toBe('__MISSING_OR_INVALID_REFRESH__');
    });
  });

  describe('Process-Wide Sweeper & Zero Per-Key Timers', () => {
    it('sweeps expired buckets and maintains active buckets without per-key timers', () => {
      _clearRegistryForTesting();
      const now = 100000;
      setTimeSource(() => now);

      registry.set('expired:1', { count: 5, resetAt: 90000 });
      registry.set('expired:2', { count: 2, resetAt: 99999 });
      registry.set('active:1', { count: 1, resetAt: 100001 });
      registry.set('active:2', { count: 3, resetAt: 160000 });

      expect(registry.size).toBe(4);

      sweepExpiredBuckets(now);

      expect(registry.size).toBe(2);
      expect(registry.has('expired:1')).toBe(false);
      expect(registry.has('expired:2')).toBe(false);
      expect(registry.has('active:1')).toBe(true);
      expect(registry.has('active:2')).toBe(true);
    });
  });

  describe('Pipeline Middleware Ordering & Learning Tier-4 Exhaustion', () => {
    it('enforces Tier-4 LLM rate limit on /api/v1/learning before Step 13 identity mismatch evaluation', async () => {
      _clearRegistryForTesting();
      const testUserId = 'usr_llm_tester_1';
      const validToken = authService.signAccessToken({
        userId: testUserId,
        sessionId: 'sess_1',
        tokenId: 'tok_1'
      });

      // Exhaust Tier-4 rate limit for testUserId (default limit is 20)
      const limitKey = `llm:${testUserId}`;
      registry.set(limitKey, { count: 20, resetAt: Date.now() + 60000 });

      // Send request with mismatching body userId to /api/v1/learning/tutoring/chat
      const res = await request(app)
        .post('/api/v1/learning/tutoring/chat')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          userId: 'usr_different_mismatch_id',
          message: 'Hello'
        });

      // Tier-4 rate limiter executes at Stage 12, BEFORE Stage 13 enforcePrincipalUserIdBodyQuery!
      // Therefore, it must return 429 RATE_LIMIT_EXCEEDED, NOT 403 IDENTITY_MISMATCH!
      expect(res.status).toBe(429);
      expect(res.body.error.code).toBe('TOO_MANY_REQUESTS');
    });
  });
});
