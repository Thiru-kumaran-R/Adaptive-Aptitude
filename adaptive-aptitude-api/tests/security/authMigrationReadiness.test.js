'use strict';

/**
 * tests/security/authMigrationReadiness.test.js
 *
 * Security test suite for Phase 14 Auth Migration Readiness Preflight & Index Contracts:
 * - Read-only readiness audit script (0 writes, 0 repairs)
 * - Canonical email schema index declaration
 * - User model local autoIndex: false vs global Mongoose autoIndex
 * - Deep read-only boot-time email index verification in server.js
 * - Startup fail-closed behavior on missing/malformed indexes
 * - 7 physical AuthSession indexes
 */

const mongoose = require('mongoose');
const { connectTestDB, disconnectTestDB } = require('../helpers/dbSetup');
const User = require('../../src/models/userModel');
const AuthSession = require('../../src/models/authSessionModel');
const { checkAuthMigrationReadiness } = require('../../scripts/checkAuthMigrationReadiness');
const { verifyAndEnsureStartupIndexes } = require('../../src/server');

describe('Security: Auth Migration Readiness Preflight & Index Safety Contracts', () => {
  beforeAll(async () => {
    await connectTestDB();
  });

  afterAll(async () => {
    await disconnectTestDB();
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await AuthSession.deleteMany({});
  });

  describe('Read-Only Preflight Script Semantics', () => {
    it('returns exitCode 0 and indexSafetyPass true when all users have canonical emails and zero duplicates', async () => {
      await User.collection.insertMany([
        {
          userId: 'usr_valid_1',
          name: 'User One',
          email: 'valid1@example.com',
          passwordHash: '$scrypt$v=1$N=16384,r=8,p=5$0123456789abcdef0123456789abcdef$0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
          status: 'active'
        },
        {
          userId: 'usr_valid_2',
          name: 'User Two',
          email: 'valid2@example.com',
          passwordHash: '$scrypt$v=1$N=16384,r=8,p=5$0123456789abcdef0123456789abcdef$0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
          status: 'active'
        }
      ]);

      const result = await checkAuthMigrationReadiness({ silent: true });

      expect(result.exitCode).toBe(0);
      expect(result.indexSafetyPass).toBe(true);
      expect(result.usersWithNonCanonicalEmail).toBe(0);
      expect(result.duplicateCanonicalEmails).toBe(0);
    });

    it('returns exitCode 1 and indexSafetyPass false when non-canonical casing or whitespace is present', async () => {
      await User.collection.insertMany([
        {
          userId: 'usr_dirty_1',
          name: 'Dirty User',
          email: '  DIRTY@EXAMPLE.COM ',
          status: 'active'
        }
      ]);

      const result = await checkAuthMigrationReadiness({ silent: true });

      expect(result.exitCode).toBe(1);
      expect(result.indexSafetyPass).toBe(false);
      expect(result.usersWithNonCanonicalEmail).toBe(1);
    });

    it('returns exitCode 1 and indexSafetyPass false when duplicate canonical emails exist', async () => {
      await User.collection.insertMany([
        {
          userId: 'usr_dup_1',
          name: 'Dup User 1',
          email: 'dup@example.com',
          status: 'active'
        },
        {
          userId: 'usr_dup_2',
          name: 'Dup User 2',
          email: 'dup@example.com',
          status: 'active'
        }
      ]);

      const result = await checkAuthMigrationReadiness({ silent: true });

      expect(result.exitCode).toBe(1);
      expect(result.indexSafetyPass).toBe(false);
      expect(result.duplicateCanonicalEmails).toBe(2);
    });

    it('asserts zero database mutations during readiness audit (strictly read-only)', async () => {
      const initialUsers = [
        {
          userId: 'usr_ro_1',
          name: 'Readonly User',
          email: '  UNTRIMMED@EXAMPLE.COM ',
          status: 'active'
        }
      ];
      await User.collection.insertMany(initialUsers);

      await checkAuthMigrationReadiness({ silent: true });

      const userAfter = await User.collection.findOne({ userId: 'usr_ro_1' });
      // Email must remain exactly unmutated (no automatic repair or trimming)
      expect(userAfter.email).toBe('  UNTRIMMED@EXAMPLE.COM ');
    });
  });

  describe('User Schema Index Declaration & Local autoIndex Contract', () => {
    it('declares the canonical partial email index on userSchema', () => {
      const userSchema = User.schema;
      const indexes = userSchema.indexes();

      const emailIdx = indexes.find(([key]) => key.email === 1);
      expect(emailIdx).toBeDefined();

      const [, options] = emailIdx;
      expect(options.unique).toBe(true);
      expect(options.partialFilterExpression).toEqual({
        email: {
          $exists: true,
          $type: 'string',
          $gt: ''
        }
      });
    });

    it('enforces User model local autoIndex: false while preserving global autoIndex', () => {
      expect(User.schema.get('autoIndex')).toBe(false);
      expect(mongoose.get('autoIndex')).not.toBe(false);
    });
  });

  describe('Server Startup Index Verification & Fail-Closed Guard', () => {
    afterEach(async () => {
      try {
        await User.collection.dropIndexes();
      } catch (_err) {}
    });

    it('fails closed when email_1_canonical_unique index is missing', async () => {
      // Ensure required baseline indexes except email
      await User.collection.createIndex({ userId: 1 }, { unique: true, name: 'userId_1' });
      await User.collection.createIndex({ status: 1 }, { name: 'status_1' });

      await expect(verifyAndEnsureStartupIndexes()).rejects.toThrow(
        /User physical index verification failed/i
      );
    });

    it('fails closed when email index is unique: false', async () => {
      await User.collection.createIndex({ userId: 1 }, { unique: true, name: 'userId_1' });
      await User.collection.createIndex({ status: 1 }, { name: 'status_1' });
      await User.collection.createIndex(
        { email: 1 },
        {
          name: 'email_1_canonical_unique',
          unique: false,
          partialFilterExpression: { email: { $exists: true, $type: 'string', $gt: '' } }
        }
      );

      await expect(verifyAndEnsureStartupIndexes()).rejects.toThrow(
        /User physical index verification failed/i
      );
    });

    it('fails closed when email index partialFilterExpression is invalid', async () => {
      await User.collection.createIndex({ userId: 1 }, { unique: true, name: 'userId_1' });
      await User.collection.createIndex({ status: 1 }, { name: 'status_1' });
      await User.collection.createIndex(
        { email: 1 },
        {
          name: 'email_1_canonical_unique',
          unique: true
          // Missing partialFilterExpression
        }
      );

      await expect(verifyAndEnsureStartupIndexes()).rejects.toThrow(
        /User physical index verification failed/i
      );
    });

    it('passes verification when email index and all required indexes are strictly compliant', async () => {
      await User.collection.createIndex({ userId: 1 }, { unique: true, name: 'userId_1' });
      await User.collection.createIndex({ status: 1 }, { name: 'status_1' });
      await User.collection.createIndex(
        { email: 1 },
        {
          name: 'email_1_canonical_unique',
          unique: true,
          partialFilterExpression: {
            email: {
              $exists: true,
              $type: 'string',
              $gt: ''
            }
          }
        }
      );

      await expect(verifyAndEnsureStartupIndexes()).resolves.not.toThrow();

      // Proves all 7 AuthSession physical indexes were ensured and verified
      const sessionIndexes = await AuthSession.collection.indexes();
      const names = sessionIndexes.map((idx) => idx.name);

      expect(names).toContain('tokenId_1');
      expect(names).toContain('tokenHash_1');
      expect(names).toContain('userId_1');
      expect(names).toContain('sessionId_1');
      expect(names).toContain('expiresAt_1');
      expect(names).toContain('userId_1_sessionId_1_status_1');
      expect(names).toContain('sessionId_active_unique');
    });
  });
});
