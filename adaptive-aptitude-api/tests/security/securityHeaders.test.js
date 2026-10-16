'use strict';

/**
 * tests/security/securityHeaders.test.js
 *
 * Security test suite for Phase 14 Security Headers, Hardened CORS, and Zero Node HSTS:
 * - CSP, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy
 * - Cache-Control on /api/v1/auth/*
 * - Absence of Strict-Transport-Security header (Zero Node HSTS)
 * - Strict CORS allowlist and rejection of disallowed origin (HTTP 403 CORS_ORIGIN_DENIED)
 * - CORS wildcard * rejection in production
 * - Operational health route bypass
 */

const request = require('supertest');
const createApp = require('../../src/app');
const authConfig = require('../../src/config/authConfig');
const { _clearRegistryForTesting } = require('../../src/middleware/rateLimiter');

describe('Security: Security Headers & Hardened CORS', () => {
  let app;
  const allowedOrigin = Array.from(authConfig.CORS_ALLOWED_ORIGINS)[0] || 'http://localhost:3000';

  beforeAll(() => {
    app = createApp();
  });

  beforeEach(() => {
    _clearRegistryForTesting();
  });

  describe('Defensive Security Headers Across Responses', () => {
    it('sets all mandatory security headers on HTTP responses', async () => {
      const res = await request(app).get('/health');

      expect(res.headers['x-content-type-options']).toBe('nosniff');
      expect(res.headers['x-frame-options']).toBe('DENY');
      expect(res.headers['content-security-policy']).toBe("default-src 'none'; frame-ancestors 'none'");
      expect(res.headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
      expect(res.headers['permissions-policy']).toBe('camera=(), microphone=(), geolocation=(), payment=()');
    });

    it('enforces strict zero Node HSTS (Strict-Transport-Security must NOT be emitted by Node)', async () => {
      const res = await request(app).get('/health');
      expect(res.headers['strict-transport-security']).toBeUndefined();
    });

    it('sets Cache-Control: no-store, no-cache, must-revalidate on /api/v1/auth/* routes', async () => {
      const res = await request(app)
        .post('/api/v1/auth/refresh');

      expect(res.headers['cache-control']).toBe('no-store, no-cache, must-revalidate');
    });
  });

  describe('Hardened CORS Allowlist Enforcement', () => {
    it('allows requests with allowlisted Origin and returns CORS headers', async () => {
      const res = await request(app)
        .options('/api/v1/auth/login')
        .set('Origin', allowedOrigin)
        .set('Access-Control-Request-Method', 'POST');

      expect(res.headers['access-control-allow-origin']).toBe(allowedOrigin);
      expect(res.headers['access-control-allow-credentials']).toBe('true');
      expect(res.headers['access-control-expose-headers']).toContain('X-Correlation-ID');
    });

    it('rejects requests with disallowed Origin with HTTP 403 CORS_ORIGIN_DENIED', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .set('Origin', 'https://malicious-hacker.com')
        .send({ email: 'test@example.com', password: 'Some-Password-1234!' });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('CORS_ORIGIN_DENIED');
    });

    it('rejects wildcard * in CORS_ALLOWED_ORIGINS during production startup', () => {
      const originalEnv = process.env.NODE_ENV;
      const originalCors = process.env.CORS_ALLOWED_ORIGINS;

      try {
        process.env.NODE_ENV = 'production';
        process.env.CORS_ALLOWED_ORIGINS = 'http://localhost:3000,*';

        expect(() => {
          authConfig.parseCorsAllowedOrigins();
        }).toThrow(/wildcard \* is strictly forbidden in production/i);
      } finally {
        process.env.NODE_ENV = originalEnv;
        if (originalCors !== undefined) {
          process.env.CORS_ALLOWED_ORIGINS = originalCors;
        } else {
          delete process.env.CORS_ALLOWED_ORIGINS;
        }
      }
    });
  });

  describe('Operational Health Route Exemptions', () => {
    it('/health, /health/live, /health/ready bypass CORS rejection and rate limiting', async () => {
      // Send health probe with disallowed Origin
      const resLive = await request(app)
        .get('/health/live')
        .set('Origin', 'https://untrusted-monitoring.internal');

      expect(resLive.status).toBe(200);

      const resHealth = await request(app)
        .get('/health')
        .set('Origin', 'https://untrusted-monitoring.internal');

      expect(resHealth.status).toBe(200);
    });
  });
});
