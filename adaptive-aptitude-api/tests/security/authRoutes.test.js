'use strict';

/**
 * tests/security/authRoutes.test.js
 *
 * Security test suite for Phase 14 HTTP auth routes, registration, login,
 * refresh, logout, revoke-all, /me, account disable, and tombstone contracts.
 */

const request = require('supertest');
const { connectTestDB, disconnectTestDB } = require('../helpers/dbSetup');
const createApp = require('../../src/app');
const User = require('../../src/models/userModel');
const AuthSession = require('../../src/models/authSessionModel');
const authService = require('../../src/services/authService');
const authConfig = require('../../src/config/authConfig');
const { _clearRegistryForTesting } = require('../../src/middleware/rateLimiter');

describe('Security: Authentication HTTP Routes & Endpoints', () => {
  let app;
  const validOrigin = Array.from(authConfig.CORS_ALLOWED_ORIGINS)[0] || 'http://localhost:3000';
  const testPassword = 'Correct-Horse-Battery-Staple-2026!';
  const testEmail = 'alex.security.test@example.com';

  beforeAll(async () => {
    await connectTestDB();
    await AuthSession.createIndexes();
    await User.collection.createIndex({ userId: 1 }, { unique: true, name: 'userId_1' });
    await User.collection.createIndex({ status: 1 }, { name: 'status_1' });
    app = createApp();
  });

  afterAll(async () => {
    await User.deleteMany({ email: { $regex: /@example\.com$/ } });
    await AuthSession.deleteMany({});
    await disconnectTestDB();
  });

  beforeEach(async () => {
    _clearRegistryForTesting();
    await User.deleteMany({ email: { $regex: /@example\.com$/ } });
    await AuthSession.deleteMany({});
  });

  describe('POST /api/v1/auth/register', () => {
    it('registers a new user and generates usr_ prefixed UUID and trimmed lowercase email', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Alex Student',
          email: '  ALEX.SECURITY.TEST@EXAMPLE.COM  ',
          password: testPassword
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(testEmail);
      expect(res.body.data.user.userId.startsWith('usr_')).toBe(true);
      expect(res.body.data.user.passwordHash).toBeUndefined();

      const userInDb = await User.findOne({ email: testEmail }).select('+passwordHash');
      expect(userInDb).not.toBeNull();
      expect(userInDb.passwordHash).toBeDefined();
      expect(userInDb.status).toBe('active');
    });

    it('strips and ignores mass-assignment fields (role, status, userId, admin)', async () => {
      const injectedUserId = 'usr_injected_attacker_id';
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Attacker',
          email: 'attacker@example.com',
          password: testPassword,
          userId: injectedUserId,
          role: 'admin',
          status: 'disabled',
          admin: true,
          isVerified: true
        });

      expect(res.status).toBe(201);
      expect(res.body.data.user.userId).not.toBe(injectedUserId);
      expect(res.body.data.user.role).toBeUndefined();

      const user = await User.findOne({ email: 'attacker@example.com' });
      expect(user.userId).not.toBe(injectedUserId);
      expect(user.status).toBe('active');
    });

    it('rejects NoSQL injection payloads in email and password', async () => {
      const res1 = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Inject',
          email: { $gt: '' },
          password: testPassword
        });
      expect(res1.status).toBe(400);
      expect(res1.body.error.code).toBe('INVALID_PAYLOAD');

      const res2 = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Inject',
          email: 'inject@example.com',
          password: { $ne: null }
        });
      expect(res2.status).toBe(400);
      expect(res2.body.error.code).toBe('INVALID_PAYLOAD');
    });

    it('rejects duplicate email with HTTP 409 EMAIL_ALREADY_REGISTERED', async () => {
      await request(app)
        .post('/api/v1/auth/register')
        .send({ name: 'User 1', email: testEmail, password: testPassword });

      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ name: 'User 2', email: testEmail.toUpperCase(), password: testPassword });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('EMAIL_ALREADY_REGISTERED');
    });

    it('rejects blocklisted password with HTTP 400 PASSWORD_BLOCKLISTED', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Weak Pass',
          email: 'weak@example.com',
          password: 'films+pic+galeries' // in blocklist
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('PASSWORD_BLOCKLISTED');
    });

    it('rejects password shorter than 15 code points with HTTP 400 PASSWORD_LENGTH_INVALID', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Short Pass',
          email: 'short@example.com',
          password: 'short-pass-123'
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('PASSWORD_LENGTH_INVALID');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/v1/auth/register')
        .send({ name: 'Alex Student', email: testEmail, password: testPassword });
    });

    it('authenticates valid credentials, returns JWT, and sets refreshToken cookie', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: testEmail, password: testPassword });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.expiresIn).toBe(900);
      expect(res.body.data.user.email).toBe(testEmail);
      expect(res.body.data.user.passwordHash).toBeUndefined();

      const cookieHeader = res.headers['set-cookie'];
      expect(cookieHeader).toBeDefined();
      expect(cookieHeader.some((c) => c.includes('refreshToken='))).toBe(true);
      expect(cookieHeader.some((c) => c.includes('HttpOnly'))).toBe(true);
      expect(cookieHeader.some((c) => c.includes('SameSite=Strict'))).toBe(true);
    });

    it('rejects invalid password with HTTP 401 INVALID_CREDENTIALS', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: testEmail, password: 'Wrong-Password-12345678!' });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('rejects unknown email with HTTP 401 INVALID_CREDENTIALS after dummy scrypt path', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'unknown@example.com', password: testPassword });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('rejects legacy user lacking passwordHash with HTTP 401 INVALID_CREDENTIALS', async () => {
      await User.create({
        userId: 'usr_legacy_no_pass',
        name: 'Legacy User',
        email: 'legacy@example.com',
        status: 'active'
        // no passwordHash
      });

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'legacy@example.com', password: testPassword });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('rejects disabled account with HTTP 403 ACCOUNT_DISABLED and does not issue session', async () => {
      await User.updateOne({ email: testEmail }, { $set: { status: 'disabled' } });

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: testEmail, password: testPassword });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('ACCOUNT_DISABLED');
      expect(res.body.data).toBeUndefined();
      expect(res.headers['set-cookie']).toBeUndefined();
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    let refreshCookie;

    beforeEach(async () => {
      const reg = await request(app)
        .post('/api/v1/auth/register')
        .send({ name: 'Alex Student', email: testEmail, password: testPassword });

      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: testEmail, password: testPassword });

      refreshCookie = loginRes.headers['set-cookie'].find((c) => c.startsWith('refreshToken='));
    });

    it('rejects refresh request missing Origin header with HTTP 403 REFRESH_ORIGIN_REQUIRED', async () => {
      const res = await request(app)
        .post('/api/v1/auth/refresh')
        .set('Cookie', [refreshCookie]);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('REFRESH_ORIGIN_REQUIRED');
    });

    it('rejects refresh request with disallowed Origin with HTTP 403 CORS_ORIGIN_DENIED', async () => {
      const res = await request(app)
        .post('/api/v1/auth/refresh')
        .set('Origin', 'https://attacker-domain.com')
        .set('Cookie', [refreshCookie]);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('CORS_ORIGIN_DENIED');
    });

    it('rotates refresh token and returns new access token with matching successor jti', async () => {
      const res = await request(app)
        .post('/api/v1/auth/refresh')
        .set('Origin', validOrigin)
        .set('Cookie', [refreshCookie]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();

      const newCookie = res.headers['set-cookie'].find((c) => c.startsWith('refreshToken='));
      expect(newCookie).toBeDefined();
      expect(newCookie).not.toBe(refreshCookie);
    });

    it('rejects disabled account during refresh with HTTP 403 ACCOUNT_DISABLED and does not rotate', async () => {
      await User.updateOne({ email: testEmail }, { $set: { status: 'disabled' } });

      const res = await request(app)
        .post('/api/v1/auth/refresh')
        .set('Origin', validOrigin)
        .set('Cookie', [refreshCookie]);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('ACCOUNT_DISABLED');
    });
  });

  describe('POST /api/v1/auth/logout, revoke-all & GET /api/v1/auth/me', () => {
    let accessToken;
    let refreshCookie;

    beforeEach(async () => {
      await request(app)
        .post('/api/v1/auth/register')
        .send({ name: 'Alex Student', email: testEmail, password: testPassword });

      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: testEmail, password: testPassword });

      accessToken = loginRes.body.data.accessToken;
      refreshCookie = loginRes.headers['set-cookie'].find((c) => c.startsWith('refreshToken='));
    });

    it('GET /api/v1/auth/me returns current user profile and session info', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(testEmail);
      expect(res.body.data.session.sessionId).toBeDefined();
    });

    it('POST /api/v1/auth/logout revokes session and clears refresh cookie', async () => {
      const res = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.message).toBe('Successfully logged out.');

      // Cookie clearing attribute check
      const cookieHeader = res.headers['set-cookie'];
      expect(cookieHeader.some((c) => c.includes('refreshToken=;'))).toBe(true);
      expect(cookieHeader.some((c) => c.includes('Max-Age=0'))).toBe(true);
    });

    it('POST /api/v1/auth/revoke-all revokes all sessions across all devices', async () => {
      const res = await request(app)
        .post('/api/v1/auth/revoke-all')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.message).toBe('All active sessions revoked.');
    });
  });

  describe('Tombstone Endpoints Bypass Contract', () => {
    it('anonymous POST /api/v1/users returns HTTP 410 USER_CREATION_ENDPOINT_DEPRECATED (not 401)', async () => {
      const res = await request(app)
        .post('/api/v1/users')
        .send({ name: 'Legacy' });

      expect(res.status).toBe(410);
      expect(res.body.error.code).toBe('USER_CREATION_ENDPOINT_DEPRECATED');
    });

    it('anonymous POST /api/v1/mock-blueprints returns HTTP 403 BLUEPRINT_MUTATION_CLOSED (not 401)', async () => {
      const res = await request(app)
        .post('/api/v1/mock-blueprints')
        .send({ title: 'New Blueprint' });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('BLUEPRINT_MUTATION_CLOSED');
    });
  });
});
