'use strict';

/**
 * tests/security/jwtKeyring.test.js
 *
 * Security test suite for JWT signing, verification, multi-key keyring,
 * mandatory claim structural validation, and deterministic jti mapping.
 */

const crypto = require('node:crypto');
const jwt = require('jsonwebtoken');
const authService = require('../../src/services/authService');
const authConfig = require('../../src/config/authConfig');
const authenticate = require('../../src/middleware/authenticate');
const mongoose = require('mongoose');

describe('Security: JWT Keyring & Claim Validation Contract', () => {
  const activeKid = authConfig.JWT_KEYRING.activeKid;
  const activeKey = authConfig.JWT_KEYRING.keys[activeKid];

  const validPayload = {
    sub: 'usr_valid_student_123',
    sid: 'sess_valid_session_456',
    jti: 'tok_valid_token_789',
    iss: 'aptitude-platform',
    aud: 'aptitude-learning-api',
  };

  function createToken(payload = validPayload, options = {}) {
    const key = options.key !== undefined ? options.key : activeKey;
    const signOptions = {
      algorithm: options.alg !== undefined ? options.alg : 'HS256',
      keyid: options.kid !== undefined ? options.kid : activeKid,
      expiresIn: options.expiresIn !== undefined ? options.expiresIn : 900,
      ...options.jwtSignOptions
    };
    return jwt.sign(payload, key, signOptions);
  }

  function mockReqRes(authHeader) {
    const req = {
      headers: authHeader !== undefined ? { authorization: authHeader } : {},
      originalUrl: '/api/v1/goals',
      baseUrl: '/api/v1',
      path: '/goals',
      method: 'GET'
    };
    const res = {
      statusCode: null,
      jsonData: null,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(data) {
        this.jsonData = data;
        return this;
      }
    };
    const next = jest.fn();
    return { req, res, next };
  }

  it('validates tokens signed with active kid and populates req.user', async () => {
    const token = createToken();
    const { req, res, next } = mockReqRes(`Bearer ${token}`);

    await authenticate(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toBeDefined();
    expect(req.user.userId).toBe(validPayload.sub);
    expect(req.user.sessionId).toBe(validPayload.sid);
    expect(req.user.accessTokenId).toBe(validPayload.jti);
  });

  it('resolves secondary/retired keys from keyring via kid', async () => {
    const secondaryKid = 'key-secondary-test';
    const secondarySecret = 'a-super-secret-key-that-is-at-least-32-bytes-long!';
    const originalKeyring = authConfig.JWT_KEYRING;

    authConfig.JWT_KEYRING = {
      activeKid: originalKeyring.activeKid,
      keys: {
        ...originalKeyring.keys,
        [secondaryKid]: secondarySecret
      }
    };

    const token = createToken(validPayload, { key: secondarySecret, kid: secondaryKid });
    const { req, res, next } = mockReqRes(`Bearer ${token}`);

    await authenticate(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user.userId).toBe(validPayload.sub);

    authConfig.JWT_KEYRING = originalKeyring;
  });

  it('rejects missing, invalid, or unknown kid with HTTP 401 INVALID_TOKEN', async () => {
    const tokenUnknownKid = createToken(validPayload, { kid: 'non-existent-kid' });
    const { req, res, next } = mockReqRes(`Bearer ${tokenUnknownKid}`);

    await authenticate(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(401);
    expect(res.jsonData.error.code).toBe('INVALID_TOKEN');
  });

  it('rejects tokens with non-HS256 algorithm (e.g., none)', async () => {
    const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
    const payload = Buffer.from(JSON.stringify(validPayload)).toString('base64url');
    const unsignedToken = `${header}.${payload}.`;

    const { req, res, next } = mockReqRes(`Bearer ${unsignedToken}`);

    await authenticate(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(401);
    expect(res.jsonData.error.code).toBe('INVALID_TOKEN');
  });

  it('rejects expired tokens outside 30s clock tolerance with HTTP 401 TOKEN_EXPIRED', async () => {
    const nowSec = Math.floor(Date.now() / 1000);
    // Expired 60s ago (outside 30s tolerance)
    const expiredPayload = {
      ...validPayload,
      iat: nowSec - 960,
      exp: nowSec - 60
    };
    const expiredToken = jwt.sign(expiredPayload, activeKey, { algorithm: 'HS256', keyid: activeKid });

    const { req, res, next } = mockReqRes(`Bearer ${expiredToken}`);

    await authenticate(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(401);
    expect(res.jsonData.error.code).toBe('TOKEN_EXPIRED');
  });

  it('accepts tokens expired within 30s clock tolerance', async () => {
    const nowSec = Math.floor(Date.now() / 1000);
    // Expired 15s ago (within 30s tolerance)
    const tolerancePayload = {
      ...validPayload,
      iat: nowSec - 915,
      exp: nowSec - 15
    };
    const toleranceToken = jwt.sign(tolerancePayload, activeKey, { algorithm: 'HS256', keyid: activeKid });

    const { req, res, next } = mockReqRes(`Bearer ${toleranceToken}`);

    await authenticate(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toBeDefined();
  });

  it('rejects tokens with invalid issuer or invalid audience', async () => {
    const badIssToken = jwt.sign({ ...validPayload, iss: 'wrong-issuer' }, activeKey, { algorithm: 'HS256', keyid: activeKid, expiresIn: 900 });
    let { req, res, next } = mockReqRes(`Bearer ${badIssToken}`);
    await authenticate(req, res, next);
    expect(res.statusCode).toBe(401);
    expect(res.jsonData.error.code).toBe('INVALID_TOKEN');

    const badAudToken = jwt.sign({ ...validPayload, aud: 'wrong-audience' }, activeKey, { algorithm: 'HS256', keyid: activeKid, expiresIn: 900 });
    ({ req, res, next } = mockReqRes(`Bearer ${badAudToken}`));
    await authenticate(req, res, next);
    expect(res.statusCode).toBe(401);
    expect(res.jsonData.error.code).toBe('INVALID_TOKEN');
  });

  it('enforces mandatory structural claim validation on sub, sid, jti, iat, exp', async () => {
    const invalidClaims = [
      { sub: '' }, // empty sub
      { sub: 123 }, // non-string sub
      { sid: '' }, // empty sid
      { sid: null }, // non-string sid
      { jti: '' }, // empty jti
      { iat: 'invalid' }, // non-numeric iat
      { exp: 'invalid' }, // non-numeric exp
    ];

    for (const invalidPart of invalidClaims) {
      const nowSec = Math.floor(Date.now() / 1000);
      const payload = {
        ...validPayload,
        iat: nowSec,
        exp: nowSec + 900,
        ...invalidPart
      };

      const headerB64 = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT', kid: activeKid })).toString('base64url');
      const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
      const signature = crypto
        .createHmac('sha256', activeKey)
        .update(`${headerB64}.${payloadB64}`)
        .digest('base64url');
      const token = `${headerB64}.${payloadB64}.${signature}`;

      const { req, res, next } = mockReqRes(`Bearer ${token}`);

      await authenticate(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.statusCode).toBe(401);
      expect(res.jsonData.error.code).toBe('INVALID_TOKEN');
    }
  });

  it('accepts legacy user IDs without usr_ prefix', async () => {
    const legacyPayload = {
      ...validPayload,
      sub: 'legacy_student_uuid_or_id_without_prefix'
    };
    const token = createToken(legacyPayload);
    const { req, res, next } = mockReqRes(`Bearer ${token}`);

    await authenticate(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user.userId).toBe(legacyPayload.sub);
  });

  it('enforces minimum secret byte length >= 32 UTF-8 bytes', () => {
    const shortSecret = 'too-short-secret';
    expect(Buffer.byteLength(shortSecret, 'utf8')).toBeLessThan(32);
    expect(() => {
      authConfig.resolveJwtKeyring({
        JWT_ACCESS_ACTIVE_KID: 'k1',
        JWT_ACCESS_KEYS: JSON.stringify({ k1: shortSecret })
      });
    }).toThrow();
  });

  it('executes zero MongoDB queries during access JWT authentication', async () => {
    const token = createToken();
    const { req, res, next } = mockReqRes(`Bearer ${token}`);

    const spy = jest.spyOn(mongoose.Model, 'findOne');
    const spyFind = jest.spyOn(mongoose.Model, 'find');

    await authenticate(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(spy).not.toHaveBeenCalled();
    expect(spyFind).not.toHaveBeenCalled();

    spy.mockRestore();
    spyFind.mockRestore();
  });

  it('proves deterministic jti mapping matching AuthSession.tokenId', () => {
    const tokenId = 'tok_' + crypto.randomUUID();
    const token = authService.generateAccessToken({
      userId: 'usr_test',
      sessionId: 'sess_test',
      tokenId
    });

    const decoded = jwt.decode(token);
    expect(decoded.jti).toBe(tokenId);
    expect(decoded.sub).toBe('usr_test');
    expect(decoded.sid).toBe('sess_test');
  });
});
