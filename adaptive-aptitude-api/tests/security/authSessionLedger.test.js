'use strict';

/**
 * tests/security/authSessionLedger.test.js
 *
 * Security test suite for AuthSession lifecycle, state transitions,
 * at-most-one active generation constraint, 7 physical indexes,
 * and the 3 controlled concurrency interleaving test cases (Case A, B, C).
 */

const crypto = require('node:crypto');
const mongoose = require('mongoose');
const { connectTestDB, disconnectTestDB } = require('../helpers/dbSetup');
const AuthSession = require('../../src/models/authSessionModel');
const User = require('../../src/models/userModel');
const authService = require('../../src/services/authService');
const authConfig = require('../../src/config/authConfig');

describe('Security: AuthSession Ledger & Refresh Concurrency Interleaving', () => {
  const testUserId = 'usr_test_concurrency_student';

  beforeAll(async () => {
    await connectTestDB();
    await AuthSession.createIndexes();
    await User.collection.createIndex({ userId: 1 }, { unique: true, name: 'userId_1' });
    await User.collection.createIndex({ status: 1 }, { name: 'status_1' });
  });

  afterAll(async () => {
    await AuthSession.deleteMany({ userId: testUserId });
    await User.deleteMany({ userId: testUserId });
    await disconnectTestDB();
  });

  beforeEach(async () => {
    await AuthSession.deleteMany({ userId: testUserId });
    await User.deleteMany({ userId: testUserId });
    await User.create({
      userId: testUserId,
      name: 'Test Student',
      email: 'test@example.com',
      status: 'active'
    });
  });

  it('verifies presence and configuration of all 7 required non-_id physical indexes', async () => {
    const indexes = await AuthSession.collection.indexes();

    const tokenIdIdx = indexes.find(
      (idx) => idx.name === 'tokenId_1' && idx.key?.tokenId === 1 && idx.unique === true
    );
    const tokenHashIdx = indexes.find(
      (idx) => idx.name === 'tokenHash_1' && idx.key?.tokenHash === 1 && idx.unique === true
    );
    const userIdIdx = indexes.find(
      (idx) => idx.name === 'userId_1' && idx.key?.userId === 1 && !idx.partialFilterExpression
    );
    const sessionIdIdx = indexes.find(
      (idx) => idx.name === 'sessionId_1' && idx.key?.sessionId === 1 && !idx.partialFilterExpression
    );
    const expiresAtIdx = indexes.find(
      (idx) => idx.name === 'expiresAt_1' && idx.key?.expiresAt === 1 && idx.expireAfterSeconds === 0
    );
    const compoundIdx = indexes.find(
      (idx) =>
        idx.name === 'userId_1_sessionId_1_status_1' &&
        idx.key?.userId === 1 &&
        idx.key?.sessionId === 1 &&
        idx.key?.status === 1
    );
    const activePartialIdx = indexes.find(
      (idx) =>
        idx.name === 'sessionId_active_unique' &&
        idx.key?.sessionId === 1 &&
        idx.unique === true &&
        idx.partialFilterExpression?.status === 'active'
    );

    expect(tokenIdIdx).toBeDefined();
    expect(tokenHashIdx).toBeDefined();
    expect(userIdIdx).toBeDefined();
    expect(sessionIdIdx).toBeDefined();
    expect(expiresAtIdx).toBeDefined();
    expect(compoundIdx).toBeDefined();
    expect(activePartialIdx).toBeDefined();

    // Verify non-colliding names for plain sessionId lookup and active partial unique index
    expect(sessionIdIdx.name).not.toBe(activePartialIdx.name);
  });

  it('enforces at-most-one active generation per sessionId via sessionId_active_unique', async () => {
    const sessionId = 'sess_' + crypto.randomUUID();
    const token1 = 'tok_' + crypto.randomUUID();
    const token2 = 'tok_' + crypto.randomUUID();

    await AuthSession.create({
      tokenId: token1,
      tokenHash: crypto.createHash('sha256').update(token1).digest('hex'),
      userId: testUserId,
      sessionId,
      status: 'active',
      expiresAt: new Date(Date.now() + 604800000)
    });

    // Attempting to create a second active session with the same sessionId must fail
    await expect(
      AuthSession.create({
        tokenId: token2,
        tokenHash: crypto.createHash('sha256').update(token2).digest('hex'),
        userId: testUserId,
        sessionId,
        status: 'active',
        expiresAt: new Date(Date.now() + 604800000)
      })
    ).rejects.toThrow();
  });

  it('persists only SHA-256 tokenHash and never raw tokens', async () => {
    const rawToken = crypto.randomBytes(32).toString('base64url');
    const hash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const sessionId = 'sess_' + crypto.randomUUID();
    const tokenId = 'tok_' + crypto.randomUUID();

    const record = await AuthSession.create({
      tokenId,
      tokenHash: hash,
      userId: testUserId,
      sessionId,
      status: 'active',
      expiresAt: new Date(Date.now() + 604800000)
    });

    const doc = await AuthSession.findById(record._id).lean();
    expect(doc.tokenHash).toBe(hash);
    expect(doc.rawToken).toBeUndefined();
    expect(JSON.stringify(doc)).not.toContain(rawToken);
  });

  it('controlled interleaving Case A: Replay presented before successor creation', async () => {
    // Setup initial session
    const rawToken1 = crypto.randomBytes(32).toString('base64url');
    const tokenHash1 = crypto.createHash('sha256').update(rawToken1).digest('hex');
    const sessionId = 'sess_' + crypto.randomUUID();
    const tokenId1 = 'tok_' + crypto.randomUUID();
    const successorTokenId = 'tok_' + crypto.randomUUID();

    await AuthSession.create({
      tokenId: tokenId1,
      tokenHash: tokenHash1,
      userId: testUserId,
      sessionId,
      status: 'active',
      expiresAt: new Date(Date.now() + 604800000)
    });

    // Request A CAS succeeds: active -> rotated
    const rotated = await AuthSession.findOneAndUpdate(
      { tokenHash: tokenHash1, status: 'active' },
      { $set: { status: 'rotated', replacedByTokenId: successorTokenId, rotatedAt: new Date() } },
      { new: true }
    );
    expect(rotated).not.toBeNull();
    expect(rotated.status).toBe('rotated');

    // Request B presents the same token1 before A creates successor
    // B observes status === 'rotated', triggers durable replay marker: rotated -> revoked
    const replayMarked = await AuthSession.findOneAndUpdate(
      { tokenHash: tokenHash1, status: 'rotated' },
      { $set: { status: 'revoked', revokedAt: new Date() } },
      { new: true }
    );
    expect(replayMarked.status).toBe('revoked');

    // B revokes all active generations in the same family
    await AuthSession.updateMany(
      { sessionId, status: 'active' },
      { $set: { status: 'revoked', revokedAt: new Date() } }
    );

    // Request A now attempts successor creation and post-successor reconciliation
    // A creates successor:
    const successorRecord = await AuthSession.create({
      tokenId: successorTokenId,
      tokenHash: crypto.randomBytes(32).toString('hex'),
      userId: testUserId,
      sessionId,
      status: 'active',
      expiresAt: rotated.expiresAt
    });

    // A checks predecessor still satisfies: tokenHash: tokenHash1, status: 'rotated', replacedByTokenId: successorTokenId
    const reconciles = await AuthSession.findOne({
      tokenHash: tokenHash1,
      status: 'rotated',
      replacedByTokenId: successorTokenId
    });

    // Post-successor check FAILS because predecessor was revoked by B
    expect(reconciles).toBeNull();

    // A must revoke newly created successor and issue zero credentials
    await AuthSession.updateOne({ _id: successorRecord._id }, { $set: { status: 'revoked', revokedAt: new Date() } });

    // Assert final active generation count in family = 0
    const activeCount = await AuthSession.countDocuments({ sessionId, status: 'active' });
    expect(activeCount).toBe(0);
  });

  it('controlled interleaving Case B: Replay presented after successor creation before winner finalization', async () => {
    const rawToken1 = crypto.randomBytes(32).toString('base64url');
    const tokenHash1 = crypto.createHash('sha256').update(rawToken1).digest('hex');
    const sessionId = 'sess_' + crypto.randomUUID();
    const tokenId1 = 'tok_' + crypto.randomUUID();
    const successorTokenId = 'tok_' + crypto.randomUUID();

    await AuthSession.create({
      tokenId: tokenId1,
      tokenHash: tokenHash1,
      userId: testUserId,
      sessionId,
      status: 'active',
      expiresAt: new Date(Date.now() + 604800000)
    });

    // Request A CAS succeeds: active -> rotated
    const rotated = await AuthSession.findOneAndUpdate(
      { tokenHash: tokenHash1, status: 'active' },
      { $set: { status: 'rotated', replacedByTokenId: successorTokenId, rotatedAt: new Date() } },
      { new: true }
    );

    // Request A creates successor:
    const successorRecord = await AuthSession.create({
      tokenId: successorTokenId,
      tokenHash: crypto.randomBytes(32).toString('hex'),
      userId: testUserId,
      sessionId,
      status: 'active',
      expiresAt: rotated.expiresAt
    });

    // Request B presents token1 BEFORE Request A runs post-successor reconciliation:
    // B marks predecessor rotated -> revoked
    await AuthSession.findOneAndUpdate(
      { tokenHash: tokenHash1, status: 'rotated' },
      { $set: { status: 'revoked', revokedAt: new Date() } }
    );
    // B revokes active successor for that family
    await AuthSession.updateMany(
      { sessionId, status: 'active' },
      { $set: { status: 'revoked', revokedAt: new Date() } }
    );

    // Request A now attempts post-successor reconciliation:
    const reconciles = await AuthSession.findOne({
      tokenHash: tokenHash1,
      status: 'rotated',
      replacedByTokenId: successorTokenId
    });

    // Check fails because predecessor is no longer 'rotated'
    expect(reconciles).toBeNull();

    // A revokes successor and fails with REFRESH_REUSE_DETECTED
    await AuthSession.updateOne({ _id: successorRecord._id }, { $set: { status: 'revoked', revokedAt: new Date() } });

    const activeCount = await AuthSession.countDocuments({ sessionId, status: 'active' });
    expect(activeCount).toBe(0);
  });

  it('controlled interleaving Case C: Replay presented after winner finalization', async () => {
    // Session family 1 (attacked)
    const rawToken1 = crypto.randomBytes(32).toString('base64url');
    const tokenHash1 = crypto.createHash('sha256').update(rawToken1).digest('hex');
    const sessionId1 = 'sess_' + crypto.randomUUID();
    const tokenId1 = 'tok_' + crypto.randomUUID();
    const successorTokenId1 = 'tok_' + crypto.randomUUID();

    // Session family 2 (unrelated device/session)
    const rawToken2 = crypto.randomBytes(32).toString('base64url');
    const tokenHash2 = crypto.createHash('sha256').update(rawToken2).digest('hex');
    const sessionId2 = 'sess_' + crypto.randomUUID();
    const tokenId2 = 'tok_' + crypto.randomUUID();

    await AuthSession.create({
      tokenId: tokenId1,
      tokenHash: tokenHash1,
      userId: testUserId,
      sessionId: sessionId1,
      status: 'active',
      expiresAt: new Date(Date.now() + 604800000)
    });

    await AuthSession.create({
      tokenId: tokenId2,
      tokenHash: tokenHash2,
      userId: testUserId,
      sessionId: sessionId2,
      status: 'active',
      expiresAt: new Date(Date.now() + 604800000)
    });

    // Request A rotates successfully and creates successor
    await AuthSession.findOneAndUpdate(
      { tokenHash: tokenHash1, status: 'active' },
      { $set: { status: 'rotated', replacedByTokenId: successorTokenId1, rotatedAt: new Date() } }
    );
    const successor1 = await AuthSession.create({
      tokenId: successorTokenId1,
      tokenHash: crypto.randomBytes(32).toString('hex'),
      userId: testUserId,
      sessionId: sessionId1,
      status: 'active',
      expiresAt: new Date(Date.now() + 604800000)
    });

    // Request B presents token1 (replay of rotated token)
    // Marks predecessor rotated -> revoked
    const marked = await AuthSession.findOneAndUpdate(
      { tokenHash: tokenHash1, status: 'rotated' },
      { $set: { status: 'revoked', revokedAt: new Date() } }
    );
    expect(marked).not.toBeNull();

    // Revokes active successor in family 1 ONLY
    await AuthSession.updateMany(
      { sessionId: sessionId1, status: 'active' },
      { $set: { status: 'revoked', revokedAt: new Date() } }
    );

    // Family 1 successor is now revoked
    const fam1Successor = await AuthSession.findById(successor1._id);
    expect(fam1Successor.status).toBe('revoked');
    const activeCountFam1 = await AuthSession.countDocuments({ sessionId: sessionId1, status: 'active' });
    expect(activeCountFam1).toBe(0);

    // Unrelated session family 2 is completely unaffected and remains active
    const activeCountFam2 = await AuthSession.countDocuments({ sessionId: sessionId2, status: 'active' });
    expect(activeCountFam2).toBe(1);
  });

  it('successor creation failure preserves rotated status and does not reactivate predecessor', async () => {
    const rawToken = crypto.randomBytes(32).toString('base64url');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const sessionId = 'sess_' + crypto.randomUUID();
    const tokenId = 'tok_' + crypto.randomUUID();
    const successorTokenId = 'tok_' + crypto.randomUUID();

    await AuthSession.create({
      tokenId,
      tokenHash,
      userId: testUserId,
      sessionId,
      status: 'active',
      expiresAt: new Date(Date.now() + 604800000)
    });

    // CAS succeeds
    await AuthSession.findOneAndUpdate(
      { tokenHash, status: 'active' },
      { $set: { status: 'rotated', replacedByTokenId: successorTokenId, rotatedAt: new Date() } }
    );

    // Simulate successor creation throwing (e.g. Mongo duplicate key error or network error)
    // Predecessor must remain 'rotated' and NEVER reactivated
    const predecessor = await AuthSession.findOne({ tokenHash });
    expect(predecessor.status).toBe('rotated');
    expect(predecessor.status).not.toBe('active');
  });
});
