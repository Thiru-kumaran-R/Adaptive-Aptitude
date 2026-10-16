'use strict';

/**
 * src/services/authService.js
 * Authoritative Security, Authentication & Session Ledger Service — Phase 14
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const authConfig = require('../config/authConfig');
const User = require('../models/userModel');
const AuthSession = require('../models/authSessionModel');
const logger = require('../utils/logger');

const {
  EXPECTED_BLOCKLIST_SHA256,
  JWT_ISSUER,
  JWT_AUDIENCE,
  ACCESS_TOKEN_TTL_SECONDS,
  JWT_CLOCK_TOLERANCE_SECONDS,
  COOKIE_NAME,
  getRefreshCookieOptions,
  getClearRefreshCookieOptions,
  SCRYPT_N,
  SCRYPT_R,
  SCRYPT_P,
  SCRYPT_SALT_BYTES,
  SCRYPT_KEYLEN,
  SCRYPT_MAXMEM,
  SESSION_ABSOLUTE_LIFETIME_MS,
  DUMMY_PASSWORD_HASH,
  CORS_ALLOWED_ORIGINS,
  JWT_KEYRING
} = authConfig;

// Regex for serialized scrypt hash: $scrypt$v=1$N=16384,r=8,p=5$<32_hex_salt>$<128_hex_key>
const SCRYPT_REGEX = /^\$scrypt\$v=1\$N=(\d+),r=(\d+),p=(\d+)\$([0-9a-fA-F]{32})\$([0-9a-fA-F]{128})$/;

// ── Password Policy, Normalization & Hashing Helpers ─────────────────────────

function normalizePassword(password) {
  if (typeof password !== 'string') return '';
  return password.normalize('NFC');
}

function validatePasswordPolicy(password) {
  if (typeof password !== 'string') {
    const err = new Error('Password must be a string.');
    err.code = 'PASSWORD_LENGTH_INVALID';
    err.statusCode = 400;
    throw err;
  }
  const normalized = normalizePassword(password);
  const codePoints = Array.from(normalized).length;
  if (codePoints < 15 || codePoints > 128) {
    const err = new Error('Password must be between 15 and 128 Unicode code points.');
    err.code = 'PASSWORD_LENGTH_INVALID';
    err.statusCode = 400;
    throw err;
  }
}

async function hashPassword(password) {
  validatePasswordPolicy(password);
  const normalized = normalizePassword(password);
  const salt = crypto.randomBytes(SCRYPT_SALT_BYTES);
  const derivedKey = await new Promise((resolve, reject) => {
    crypto.scrypt(
      normalized,
      salt,
      SCRYPT_KEYLEN,
      { N: SCRYPT_N, r: SCRYPT_R, p: SCRYPT_P, maxmem: SCRYPT_MAXMEM },
      (err, key) => (err ? reject(err) : resolve(key))
    );
  });
  return `$scrypt$v=1$N=${SCRYPT_N},r=${SCRYPT_R},p=${SCRYPT_P}$${salt.toString('hex')}$${derivedKey.toString('hex')}`;
}

async function verifyPassword(password, encodedHash) {
  if (!encodedHash || typeof encodedHash !== 'string') {
    // Execute dummy scrypt timing path to prevent user enumeration
    await verifyPassword(password, DUMMY_PASSWORD_HASH);
    return false;
  }

  const match = encodedHash.match(SCRYPT_REGEX);
  if (!match) {
    await verifyPassword(password, DUMMY_PASSWORD_HASH);
    return false;
  }

  const N = parseInt(match[1], 10);
  const r = parseInt(match[2], 10);
  const p = parseInt(match[3], 10);
  const salt = Buffer.from(match[4], 'hex');
  const expectedKey = Buffer.from(match[5], 'hex');

  const normalized = normalizePassword(password || '');
  const candidateKey = await new Promise((resolve, reject) => {
    crypto.scrypt(
      normalized,
      salt,
      SCRYPT_KEYLEN,
      { N, r, p, maxmem: SCRYPT_MAXMEM },
      (err, key) => (err ? reject(err) : resolve(key))
    );
  });

  return crypto.timingSafeEqual(candidateKey, expectedKey);
}

// ── Password Blocklist Subsystem ─────────────────────────────────────────────

let blocklistSet = new Set();
let blocklistState = 'UNINITIALIZED'; // 'READY' | 'UNAVAILABLE'

function initBlocklist() {
  const blocklistPath = path.join(__dirname, '../data/auth/commonPasswordsBlocklist.json');
  try {
    if (!fs.existsSync(blocklistPath)) {
      throw new Error(`Blocklist file not found at ${blocklistPath}`);
    }
    const fileBuffer = fs.readFileSync(blocklistPath);
    const computedHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
    if (computedHash !== EXPECTED_BLOCKLIST_SHA256) {
      throw new Error(`Blocklist digest mismatch. Expected ${EXPECTED_BLOCKLIST_SHA256}, got ${computedHash}`);
    }
    const parsed = JSON.parse(fileBuffer.toString('utf8'));
    if (!Array.isArray(parsed)) {
      throw new Error('Blocklist artifact must be an array of password strings.');
    }
    blocklistSet = new Set(parsed.map((p) => normalizePassword(p)));
    blocklistState = 'READY';
  } catch (_err) {
    logger.error({
      event: 'LOG_EVENT',
      component: 'server',
      message: 'Password blocklist integrity initialization failure'
    });
    blocklistSet = new Set();
    blocklistState = 'UNAVAILABLE';
  }
}

initBlocklist();

function checkPasswordBlocklist(normalizedPassword) {
  if (blocklistState === 'UNAVAILABLE') {
    const err = new Error('Password security service is unavailable.');
    err.code = 'BLOCKLIST_UNAVAILABLE';
    err.statusCode = 500;
    throw err;
  }
  if (blocklistSet.has(normalizedPassword)) {
    const err = new Error('Choose a different password.');
    err.code = 'PASSWORD_BLOCKLISTED';
    err.statusCode = 400;
    throw err;
  }
}

// ── JWT Signing & Verification Helpers ───────────────────────────────────────

function signAccessToken({ userId, sessionId, tokenId } = {}) {
  const activeKid = JWT_KEYRING.activeKid;
  const secret = JWT_KEYRING.keys[activeKid];

  const nowSec = Math.floor(Date.now() / 1000);
  const payload = {
    sub: userId,
    sid: sessionId || `ses_${crypto.randomUUID()}`,
    jti: tokenId || `tok_${crypto.randomUUID()}`,
    iat: nowSec,
    exp: nowSec + ACCESS_TOKEN_TTL_SECONDS,
    iss: JWT_ISSUER,
    aud: JWT_AUDIENCE
  };

  return jwt.sign(payload, secret, {
    algorithm: 'HS256',
    header: {
      alg: 'HS256',
      kid: activeKid
    }
  });
}

function verifyAccessToken(rawToken) {
  if (!rawToken || typeof rawToken !== 'string') {
    const err = new Error('Authentication is required to access this resource.');
    err.code = 'UNAUTHORIZED';
    err.statusCode = 401;
    throw err;
  }

  const decodedHeader = jwt.decode(rawToken, { complete: true });
  if (!decodedHeader || !decodedHeader.header) {
    const err = new Error('Access token is invalid or malformed.');
    err.code = 'INVALID_TOKEN';
    err.statusCode = 401;
    throw err;
  }

  const { alg, kid } = decodedHeader.header;
  const keyring = authConfig.JWT_KEYRING;
  if (alg !== 'HS256' || !kid || !keyring?.keys?.[kid]) {
    const err = new Error('Access token is invalid or malformed.');
    err.code = 'INVALID_TOKEN';
    err.statusCode = 401;
    throw err;
  }

  const secret = keyring.keys[kid];
  let decoded;
  try {
    decoded = jwt.verify(rawToken, secret, {
      algorithms: ['HS256'],
      clockTolerance: JWT_CLOCK_TOLERANCE_SECONDS,
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE
    });
  } catch (verifyErr) {
    if (verifyErr.name === 'TokenExpiredError') {
      const err = new Error('Access token has expired.');
      err.code = 'TOKEN_EXPIRED';
      err.statusCode = 401;
      throw err;
    }
    const err = new Error('Access token is invalid or malformed.');
    err.code = 'INVALID_TOKEN';
    err.statusCode = 401;
    throw err;
  }

  // Mandatory structural claim validation
  if (
    typeof decoded.sub !== 'string' || decoded.sub.length === 0 ||
    typeof decoded.sid !== 'string' || decoded.sid.length === 0 ||
    typeof decoded.jti !== 'string' || decoded.jti.length === 0 ||
    typeof decoded.iat !== 'number' || !Number.isFinite(decoded.iat) ||
    typeof decoded.exp !== 'number' || !Number.isFinite(decoded.exp) ||
    decoded.iss !== JWT_ISSUER ||
    decoded.aud !== JWT_AUDIENCE
  ) {
    const err = new Error('Access token is invalid or malformed.');
    err.code = 'INVALID_TOKEN';
    err.statusCode = 401;
    throw err;
  }

  return decoded;
}

// ── AuthService Class ────────────────────────────────────────────────────────

class AuthService {
  async register({ name, email, password }) {
    // Validate scalar inputs & reject NoSQL operator injections
    if (
      typeof name !== 'string' || name.trim().length === 0 ||
      typeof email !== 'string' || email.trim().length === 0 ||
      typeof password !== 'string'
    ) {
      const err = new Error('Invalid registration payload.');
      err.code = 'INVALID_PAYLOAD';
      err.statusCode = 400;
      throw err;
    }

    const canonicalEmail = email.trim().toLowerCase();
    validatePasswordPolicy(password);
    checkPasswordBlocklist(normalizePassword(password));

    // Check for existing user with identical canonical email
    const existing = await User.findOne({ email: canonicalEmail });
    if (existing) {
      const err = new Error('Email is already registered.');
      err.code = 'EMAIL_ALREADY_REGISTERED';
      err.statusCode = 409;
      throw err;
    }

    const passwordHash = await hashPassword(password);
    const userId = `usr_${crypto.randomUUID()}`;

    const createdUser = await User.create({
      userId,
      name: name.trim(),
      email: canonicalEmail,
      passwordHash,
      status: 'active'
    });

    logger.info({
      event: 'AUTH_REGISTER_SUCCESS',
      component: 'http',
      message: 'User registered successfully'
    });

    return {
      user: {
        userId: createdUser.userId,
        name: createdUser.name,
        email: createdUser.email
      }
    };
  }

  async login({ email, password }) {
    if (typeof email !== 'string' || typeof password !== 'string') {
      const err = new Error('Invalid email or password.');
      err.code = 'INVALID_PAYLOAD';
      err.statusCode = 400;
      throw err;
    }

    const canonicalEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: canonicalEmail }).select('+passwordHash userId name email status');

    if (!user) {
      await verifyPassword(password, DUMMY_PASSWORD_HASH);
      logger.warn({
        event: 'AUTH_LOGIN_FAILED',
        component: 'http',
        reason: 'LOGIN',
        statusCode: 401,
        errorCode: 'INVALID_CREDENTIALS',
        message: 'Login failed: unknown account'
      });
      const err = new Error('Invalid email or password.');
      err.code = 'INVALID_CREDENTIALS';
      err.statusCode = 401;
      throw err;
    }

    if (!user.passwordHash) {
      await verifyPassword(password, DUMMY_PASSWORD_HASH);
      logger.warn({
        event: 'AUTH_LOGIN_FAILED',
        component: 'http',
        reason: 'LOGIN',
        statusCode: 401,
        errorCode: 'INVALID_CREDENTIALS',
        message: 'Login failed: legacy user lacking passwordHash'
      });
      const err = new Error('Invalid email or password.');
      err.code = 'INVALID_CREDENTIALS';
      err.statusCode = 401;
      throw err;
    }

    const passwordMatches = await verifyPassword(password, user.passwordHash);
    if (!passwordMatches) {
      logger.warn({
        event: 'AUTH_LOGIN_FAILED',
        component: 'http',
        reason: 'LOGIN',
        statusCode: 401,
        errorCode: 'INVALID_CREDENTIALS',
        message: 'Login failed: incorrect password'
      });
      const err = new Error('Invalid email or password.');
      err.code = 'INVALID_CREDENTIALS';
      err.statusCode = 401;
      throw err;
    }

    if (user.status === 'disabled') {
      logger.warn({
        event: 'AUTH_ACCOUNT_DISABLED',
        component: 'http',
        reason: 'LOGIN',
        statusCode: 403,
        errorCode: 'ACCOUNT_DISABLED',
        message: 'Login rejected: account is disabled'
      });
      const err = new Error('Account has been disabled.');
      err.code = 'ACCOUNT_DISABLED';
      err.statusCode = 403;
      throw err;
    }

    const sessionId = `sess_${crypto.randomUUID()}`;
    const tokenId = `tok_${crypto.randomUUID()}`;
    const rawRefreshToken = crypto.randomBytes(32).toString('base64url');
    const tokenHash = crypto.createHash('sha256').update(rawRefreshToken).digest('hex');
    const now = new Date();
    const expiresAt = new Date(now.getTime() + SESSION_ABSOLUTE_LIFETIME_MS);

    await AuthSession.create({
      tokenId,
      sessionId,
      userId: user.userId,
      tokenHash,
      status: 'active',
      issuedAt: now,
      expiresAt
    });

    const accessToken = signAccessToken({
      userId: user.userId,
      sessionId,
      tokenId
    });

    logger.info({
      event: 'AUTH_LOGIN_SUCCESS',
      component: 'http',
      message: 'User logged in successfully'
    });

    return {
      accessToken,
      expiresIn: ACCESS_TOKEN_TTL_SECONDS,
      refreshToken: rawRefreshToken,
      user: {
        userId: user.userId,
        name: user.name,
        email: user.email
      }
    };
  }

  async refresh({ rawRefreshToken, origin }) {
    // 1. Mandatory Origin verification
    if (!origin || typeof origin !== 'string') {
      const err = new Error('Origin header is required.');
      err.code = 'REFRESH_ORIGIN_REQUIRED';
      err.statusCode = 403;
      throw err;
    }

    if (!CORS_ALLOWED_ORIGINS.has(origin)) {
      const err = new Error('Origin is not allowed.');
      err.code = 'CORS_ORIGIN_DENIED';
      err.statusCode = 403;
      throw err;
    }

    // 2. Cookie extraction
    if (!rawRefreshToken || typeof rawRefreshToken !== 'string' || rawRefreshToken.length === 0) {
      const err = new Error('Refresh token is invalid or not found.');
      err.code = 'INVALID_REFRESH_TOKEN';
      err.statusCode = 401;
      throw err;
    }

    const presentedHash = crypto.createHash('sha256').update(rawRefreshToken).digest('hex');

    // 3. Pre-CAS Lookup
    const sessionRecord = await AuthSession.findOne({ tokenHash: presentedHash });
    if (!sessionRecord) {
      const err = new Error('Refresh token is invalid or not found.');
      err.code = 'INVALID_REFRESH_TOKEN';
      err.statusCode = 401;
      throw err;
    }

    if (sessionRecord.status === 'revoked') {
      const err = new Error('Session has been revoked.');
      err.code = 'SESSION_REVOKED';
      err.statusCode = 401;
      throw err;
    }

    const now = new Date();

    if (sessionRecord.status === 'rotated') {
      // Replay detected!
      logger.warn({
        event: 'AUTH_REFRESH_REUSE_DETECTED',
        component: 'http',
        reason: 'REFRESH',
        statusCode: 401,
        errorCode: 'REFRESH_REUSE_DETECTED',
        message: 'Token reuse detected on refresh'
      });
      // Durable replay compromise marker
      await AuthSession.findOneAndUpdate(
        { tokenHash: presentedHash, status: 'rotated' },
        { $set: { status: 'revoked', revokedAt: now } },
        { new: true }
      );
      // Revoke all active generations in this family
      await AuthSession.updateMany(
        { sessionId: sessionRecord.sessionId, status: 'active' },
        { $set: { status: 'revoked', revokedAt: now } }
      );
      const err = new Error('Session family revoked due to token reuse.');
      err.code = 'REFRESH_REUSE_DETECTED';
      err.statusCode = 401;
      throw err;
    }

    if (sessionRecord.expiresAt <= now) {
      const err = new Error('Session has expired.');
      err.code = 'SESSION_EXPIRED';
      err.statusCode = 401;
      throw err;
    }

    // 4. Verify Owning User Account Status before CAS
    const owningUser = await User.findOne({ userId: sessionRecord.userId }).select('userId status');
    if (!owningUser) {
      const err = new Error('Refresh token is invalid or not found.');
      err.code = 'INVALID_REFRESH_TOKEN';
      err.statusCode = 401;
      throw err;
    }

    if (owningUser.status === 'disabled') {
      logger.warn({
        event: 'AUTH_ACCOUNT_DISABLED',
        component: 'http',
        reason: 'REFRESH',
        statusCode: 403,
        errorCode: 'ACCOUNT_DISABLED',
        message: 'Refresh rejected: account is disabled'
      });
      const err = new Error('Account has been disabled.');
      err.code = 'ACCOUNT_DISABLED';
      err.statusCode = 403;
      throw err;
    }

    // 5. Execute Atomic CAS Rotation
    const successorTokenId = `tok_${crypto.randomUUID()}`;
    const rotated = await AuthSession.findOneAndUpdate(
      {
        tokenHash: presentedHash,
        status: 'active',
        expiresAt: { $gt: now }
      },
      {
        $set: {
          status: 'rotated',
          rotatedAt: now,
          replacedByTokenId: successorTokenId
        }
      },
      { new: false }
    );

    if (!rotated) {
      // Another concurrent request transitioned or expired the token
      const rechecked = await AuthSession.findOne({ tokenHash: presentedHash });
      if (rechecked?.status === 'rotated') {
        logger.warn({
          event: 'AUTH_REFRESH_REUSE_DETECTED',
          component: 'http',
          reason: 'REFRESH',
          statusCode: 401,
          errorCode: 'REFRESH_REUSE_DETECTED',
          message: 'Token reuse detected during CAS race'
        });
        await AuthSession.findOneAndUpdate(
          { tokenHash: presentedHash, status: 'rotated' },
          { $set: { status: 'revoked', revokedAt: now } },
          { new: true }
        );
        await AuthSession.updateMany(
          { sessionId: rechecked.sessionId, status: 'active' },
          { $set: { status: 'revoked', revokedAt: now } }
        );
        const err = new Error('Session family revoked due to token reuse.');
        err.code = 'REFRESH_REUSE_DETECTED';
        err.statusCode = 401;
        throw err;
      }
      if (rechecked?.status === 'revoked') {
        const err = new Error('Session has been revoked.');
        err.code = 'SESSION_REVOKED';
        err.statusCode = 401;
        throw err;
      }
      if (rechecked && rechecked.expiresAt <= now) {
        const err = new Error('Session has expired.');
        err.code = 'SESSION_EXPIRED';
        err.statusCode = 401;
        throw err;
      }
      const err = new Error('Refresh token is invalid or not found.');
      err.code = 'INVALID_REFRESH_TOKEN';
      err.statusCode = 401;
      throw err;
    }

    // CAS succeeded -> generate successor credential
    const rawSuccessorToken = crypto.randomBytes(32).toString('base64url');
    const successorHash = crypto.createHash('sha256').update(rawSuccessorToken).digest('hex');

    try {
      await AuthSession.create({
        tokenId: successorTokenId,
        sessionId: rotated.sessionId,
        userId: rotated.userId,
        tokenHash: successorHash,
        status: 'active',
        issuedAt: now,
        expiresAt: rotated.expiresAt // Retains absolute 7-day family expiration
      });
    } catch (successorError) {
      // Successor creation failure: predecessor remains rotated, fail closed
      throw successorError;
    }

    // 6. Post-Successor Replay Reconciliation Before Credential Issuance
    const predecessorStillValid = await AuthSession.exists({
      tokenHash: presentedHash,
      status: 'rotated',
      replacedByTokenId: successorTokenId
    });

    if (!predecessorStillValid) {
      // Replay occurred during CAS/create window! Revoke newly created successor
      await AuthSession.findOneAndUpdate(
        {
          tokenId: successorTokenId,
          sessionId: rotated.sessionId,
          status: 'active'
        },
        {
          $set: {
            status: 'revoked',
            revokedAt: new Date()
          }
        }
      );
      const err = new Error('Session family revoked due to token reuse.');
      err.code = 'REFRESH_REUSE_DETECTED';
      err.statusCode = 401;
      throw err;
    }

    const accessToken = signAccessToken({
      userId: rotated.userId,
      sessionId: rotated.sessionId,
      tokenId: successorTokenId
    });

    logger.info({
      event: 'AUTH_TOKEN_REFRESH_SUCCESS',
      component: 'http',
      message: 'Token refreshed successfully'
    });

    return {
      accessToken,
      expiresIn: ACCESS_TOKEN_TTL_SECONDS,
      refreshToken: rawSuccessorToken,
      expiresAt: rotated.expiresAt
    };
  }

  async logout({ sessionId }) {
    if (sessionId) {
      await AuthSession.updateMany(
        { sessionId, status: 'active' },
        { $set: { status: 'revoked', revokedAt: new Date() } }
      );
      logger.info({
        event: 'AUTH_LOGOUT',
        component: 'http',
        message: 'Session logged out successfully'
      });
    }
    return { message: 'Successfully logged out.' };
  }

  async revokeAll({ userId }) {
    if (userId) {
      await AuthSession.updateMany(
        { userId, status: 'active' },
        { $set: { status: 'revoked', revokedAt: new Date() } }
      );
      logger.info({
        event: 'AUTH_SESSION_REVOKED',
        component: 'http',
        message: 'All user sessions revoked successfully'
      });
    }
    return { message: 'All active sessions revoked.' };
  }

  async getPrincipal({ userId }) {
    const user = await User.findOne({ userId }).select('userId name email avatar createdAt');
    if (!user) {
      const err = new Error('User not found.');
      err.code = 'USER_NOT_FOUND';
      err.statusCode = 404;
      throw err;
    }
    return user;
  }
}

const authService = new AuthService();

module.exports = authService;
module.exports.AuthService = AuthService;
module.exports.normalizePassword = normalizePassword;
module.exports.validatePasswordPolicy = validatePasswordPolicy;
module.exports.hashPassword = hashPassword;
module.exports.verifyPassword = verifyPassword;
module.exports.generateAccessToken = signAccessToken;
module.exports.signAccessToken = signAccessToken;
module.exports.verifyAccessToken = verifyAccessToken;
module.exports.checkPasswordBlocklist = checkPasswordBlocklist;
module.exports.initBlocklist = initBlocklist;
module.exports._getBlocklistState = () => blocklistState;
module.exports._setBlocklistState = (state) => { blocklistState = state; };

