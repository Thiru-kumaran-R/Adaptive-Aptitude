'use strict';

/**
 * tests/security/blocklistIntegrity.test.js
 *
 * Security test suite for Phase 14 Password Blocklist Integrity:
 * - Runtime blocklist artifact digest verification against hardcoded EXPECTED_BLOCKLIST_SHA256
 * - Static literal verification of EXPECTED_BLOCKLIST_SHA256
 * - Tampered/missing blocklist causes deterministic UNAVAILABLE state
 * - Registration returns HTTP 500 BLOCKLIST_UNAVAILABLE when blocklist is unavailable
 * - Zero user creation and zero passwordHash persistence on failure
 * - Logging uses canonical LOG_EVENT with component: server
 */

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const request = require('supertest');
const { connectTestDB, disconnectTestDB } = require('../helpers/dbSetup');
const createApp = require('../../src/app');
const User = require('../../src/models/userModel');
const authConfig = require('../../src/config/authConfig');
const authService = require('../../src/services/authService');
const logger = require('../../src/utils/logger');
const { _clearRegistryForTesting } = require('../../src/middleware/rateLimiter');

describe('Security: Password Blocklist Subsystem & Integrity', () => {
  let app;
  const blocklistPath = path.join(__dirname, '../../src/data/auth/commonPasswordsBlocklist.json');

  beforeAll(async () => {
    await connectTestDB();
    app = createApp();
  });

  afterAll(async () => {
    await disconnectTestDB();
  });

  beforeEach(async () => {
    _clearRegistryForTesting();
    await User.deleteMany({});
    authService._setBlocklistState('READY');
  });

  afterEach(() => {
    authService._setBlocklistState('READY');
  });

  describe('Blocklist Artifact Digest & Static Literal Invariant', () => {
    it('verifies the runtime artifact SHA-256 matches exactly EXPECTED_BLOCKLIST_SHA256', () => {
      const buffer = fs.readFileSync(blocklistPath);
      const computedHash = crypto.createHash('sha256').update(buffer).digest('hex');

      expect(computedHash).toBe('fe0b58f7baab02c6a3019a22f80049080747b435097812bf48d11f42f627ef56');
      expect(computedHash).toBe(authConfig.EXPECTED_BLOCKLIST_SHA256);
    });

    it('proves EXPECTED_BLOCKLIST_SHA256 is an independent static hardcoded constant', () => {
      expect(typeof authConfig.EXPECTED_BLOCKLIST_SHA256).toBe('string');
      expect(authConfig.EXPECTED_BLOCKLIST_SHA256).toBe('fe0b58f7baab02c6a3019a22f80049080747b435097812bf48d11f42f627ef56');
    });

    it('asserts blocklist file contains exactly an array of strings', () => {
      const content = JSON.parse(fs.readFileSync(blocklistPath, 'utf8'));
      expect(Array.isArray(content)).toBe(true);
      expect(content.length).toBeGreaterThan(1000);
      expect(typeof content[0]).toBe('string');
    });
  });

  describe('Tampered or Missing Blocklist Handling', () => {
    it('transitions blocklist to UNAVAILABLE and logs canonical LOG_EVENT on integrity mismatch', () => {
      const loggerSpy = jest.spyOn(logger, 'error');

      // Mock fs.readFileSync to return corrupted bytes
      const originalReadFileSync = fs.readFileSync;
      jest.spyOn(fs, 'readFileSync').mockImplementation((p, ...args) => {
        if (p.includes('commonPasswordsBlocklist.json')) {
          return Buffer.from(JSON.stringify(['corrupted', 'list']));
        }
        return originalReadFileSync(p, ...args);
      });

      authService.initBlocklist();

      expect(authService._getBlocklistState()).toBe('UNAVAILABLE');

      // Assert canonical logger event
      expect(loggerSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'LOG_EVENT',
          component: 'server',
          message: 'Password blocklist integrity initialization failure'
        })
      );

      fs.readFileSync.mockRestore();
      loggerSpy.mockRestore();
      // Restore valid blocklist
      authService.initBlocklist();
    });

    it('rejects registration with HTTP 500 BLOCKLIST_UNAVAILABLE when blocklist is UNAVAILABLE', async () => {
      authService._setBlocklistState('UNAVAILABLE');

      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Jane Doe',
          email: 'jane.unavailable@example.com',
          password: 'Correct-Horse-Battery-2026!'
        });

      expect(res.status).toBe(500);
      expect(res.body.error.code).toBe('BLOCKLIST_UNAVAILABLE');

      // Asserts zero user record created in DB
      const userCount = await User.countDocuments({ email: 'jane.unavailable@example.com' });
      expect(userCount).toBe(0);
    });
  });
});
