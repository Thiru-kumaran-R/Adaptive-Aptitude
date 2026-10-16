/**
 * src/config/authConfig.js
 * Authoritative Security & Platform Protection Configuration
 */

const crypto = require('crypto');

// 1. Password Blocklist Integrity Constant
// SHA-256 over exact committed bytes of src/data/auth/commonPasswordsBlocklist.json
// Upstream Provenance: danielmiessler/SecLists commit 7ab4b6a718285141ef8154630c9091da06987113
const EXPECTED_BLOCKLIST_SHA256 = 'fe0b58f7baab02c6a3019a22f80049080747b435097812bf48d11f42f627ef56';

// 2. JWT Configuration Constants
const JWT_ISSUER = 'aptitude-platform';
const JWT_AUDIENCE = 'aptitude-learning-api';
const ACCESS_TOKEN_TTL_SECONDS = 900;       // 15 minutes
const JWT_CLOCK_TOLERANCE_SECONDS = 30;     // 30 seconds
const OLD_KEY_RETENTION_SECONDS = 960;      // >= 900s + 30s = 930s

// 3. Cookie Configuration Constants
const COOKIE_NAME = 'refreshToken';
const COOKIE_PATH = '/api/v1/auth/refresh';
const COOKIE_SAME_SITE = 'Strict';
const COOKIE_HTTP_ONLY = true;

// 4. Rate Limiter Safety Bounds & Tunables
const RATE_LIMIT_MAX_KEYS_DEFAULT = 10000;
const RATE_LIMIT_MAX_KEYS_MIN = 1000;
const RATE_LIMIT_MAX_KEYS_MAX = 100000;

// 5. Default Rate Limiting Tiers (Deployment-Tunable)
const RATE_LIMIT_GLOBAL_MAX_DEFAULT = 300;   // 300 req / 15 min per IP
const RATE_LIMIT_GLOBAL_WINDOW_MS = 15 * 60 * 1000;

const RATE_LIMIT_AUTH_MAX_DEFAULT = 5;       // 5 attempts / 15 min per IP+email
const RATE_LIMIT_AUTH_WINDOW_MS = 15 * 60 * 1000;

const RATE_LIMIT_REFRESH_MAX_DEFAULT = 20;   // 20 req / 15 min per IP+tokenHash
const RATE_LIMIT_REFRESH_WINDOW_MS = 15 * 60 * 1000;

const RATE_LIMIT_LLM_MAX_DEFAULT = 20;       // 20 req / 1 min per userId
const RATE_LIMIT_LLM_WINDOW_MS = 1 * 60 * 1000;

// 6. Scrypt Key Derivation Parameters (Frozen)
const SCRYPT_N = 16384;
const SCRYPT_R = 8;
const SCRYPT_P = 5;
const SCRYPT_SALT_BYTES = 16;
const SCRYPT_KEYLEN = 64;
const SCRYPT_MAXMEM = 128 * 1024 * 1024; // 128 MB

// 7. Session Lifetime Bounds
const SESSION_ABSOLUTE_LIFETIME_MS = 7 * 24 * 60 * 60 * 1000; // 7 days (604,800,000 ms)

// Static dummy hash with canonical format: $scrypt$v=1$N=16384,r=8,p=5$<32_hex_salt>$<128_hex_hash>
const DUMMY_SALT_HEX = '00000000000000000000000000000000';
const DUMMY_HASH_HEX = '00'.repeat(64);
const DUMMY_PASSWORD_HASH = `$scrypt$v=1$N=${SCRYPT_N},r=${SCRYPT_R},p=${SCRYPT_P}$${DUMMY_SALT_HEX}$${DUMMY_HASH_HEX}`;

// Environment parsing & validation
const isProduction = process.env.NODE_ENV === 'production';
const isStaging = process.env.NODE_ENV === 'staging';

// CORS Allowed Origins
function parseCorsAllowedOrigins(env = process.env) {
  const isProd = env.NODE_ENV === 'production';
  const isStag = env.NODE_ENV === 'staging';
  const raw = env.CORS_ALLOWED_ORIGINS;
  if (!raw || typeof raw !== 'string' || raw.trim().length === 0) {
    if (isProd || isStag) {
      throw new Error('CORS_ALLOWED_ORIGINS is mandatory in production/staging.');
    }
    return new Set(['http://localhost:3000', 'http://localhost:5173']);
  }

  const origins = raw.split(',').map(s => s.trim()).filter(Boolean);
  if (isProd && origins.includes('*')) {
    throw new Error('CORS wildcard * is strictly forbidden in production.');
  }

  if ((isProd || isStag) && origins.length === 0) {
    throw new Error('CORS_ALLOWED_ORIGINS must contain at least one valid origin in production/staging.');
  }

  return new Set(origins);
}

const CORS_ALLOWED_ORIGINS = Object.freeze(parseCorsAllowedOrigins());

// JWT Keyring Resolution
function resolveJwtKeyring(env = process.env) {
  const rawKeys = env.JWT_ACCESS_KEYS;
  const activeKid = env.JWT_ACCESS_ACTIVE_KID;

  let keyring = {};

  if (rawKeys) {
    try {
      keyring = JSON.parse(rawKeys);
    } catch (err) {
      throw new Error(`Malformed JWT_ACCESS_KEYS JSON: ${err.message}`);
    }
  }

  if (typeof keyring !== 'object' || keyring === null || Array.isArray(keyring)) {
    throw new Error('JWT_ACCESS_KEYS must be a JSON object mapping kid to secret.');
  }

  // Validate byte length of each secret
  for (const [kid, secret] of Object.entries(keyring)) {
    if (typeof secret !== 'string') {
      throw new Error(`JWT secret for kid "${kid}" must be a string.`);
    }
    const byteLen = Buffer.byteLength(secret, 'utf8');
    if (byteLen < 32) {
      throw new Error(`JWT secret for kid "${kid}" must be at least 32 UTF-8 bytes (found ${byteLen} bytes).`);
    }
  }

  if (!activeKid) {
    if (isProduction || isStaging) {
      throw new Error('JWT_ACCESS_ACTIVE_KID is mandatory in production/staging.');
    }
    // Development/test ephemeral fallback
    if (Object.keys(keyring).length === 0) {
      const ephemeralKid = 'ephemeral-test-kid-v1';
      const ephemeralSecret = 'ephemeral-secret-must-be-at-least-32-bytes-long!';
      keyring[ephemeralKid] = ephemeralSecret;
      return {
        keys: Object.freeze(keyring),
        activeKid: ephemeralKid
      };
    }
    const firstKid = Object.keys(keyring)[0];
    return {
      keys: Object.freeze(keyring),
      activeKid: firstKid
    };
  }

  if (!keyring[activeKid]) {
    throw new Error(`JWT_ACCESS_ACTIVE_KID "${activeKid}" does not exist in JWT_ACCESS_KEYS.`);
  }

  return {
    keys: Object.freeze(keyring),
    activeKid
  };
}

const JWT_KEYRING = Object.freeze(resolveJwtKeyring());

// Cookie Security Resolution
function resolveCookieSecure() {
  if (process.env.COOKIE_SECURE !== undefined) {
    return process.env.COOKIE_SECURE === 'true';
  }
  return isProduction;
}

const COOKIE_SECURE = resolveCookieSecure();

function getRefreshCookieOptions(overrides = {}) {
  const base = {
    httpOnly: COOKIE_HTTP_ONLY,
    secure: COOKIE_SECURE,
    sameSite: COOKIE_SAME_SITE,
    path: COOKIE_PATH
  };

  return {
    ...base,
    ...overrides
  };
}

function getClearRefreshCookieOptions(overrides = {}) {
  return getRefreshCookieOptions({
    maxAge: 0,
    ...overrides
  });
}

// Proxy Trust
function resolveTrustProxy() {
  const raw = process.env.TRUST_PROXY_HOPS;
  if (!raw) return false;
  const num = parseInt(raw, 10);
  if (!Number.isNaN(num) && num >= 0) return num;
  return raw;
}

const TRUST_PROXY = resolveTrustProxy();

// Bounded Rate Limiter Max Keys
function resolveRateLimitMaxKeys() {
  const raw = process.env.RATE_LIMIT_MAX_KEYS;
  if (!raw) return RATE_LIMIT_MAX_KEYS_DEFAULT;
  const num = parseInt(raw, 10);
  if (Number.isNaN(num)) return RATE_LIMIT_MAX_KEYS_DEFAULT;
  return Math.min(Math.max(num, RATE_LIMIT_MAX_KEYS_MIN), RATE_LIMIT_MAX_KEYS_MAX);
}

const RATE_LIMIT_MAX_KEYS = resolveRateLimitMaxKeys();

// Tier-Specific Max Requests
function resolveTierMax(envVar, defaultVal) {
  const raw = process.env[envVar];
  if (!raw) return defaultVal;
  const num = parseInt(raw, 10);
  return !Number.isNaN(num) && num > 0 ? num : defaultVal;
}

const RATE_LIMIT_GLOBAL_MAX = resolveTierMax('RATE_LIMIT_GLOBAL_MAX', RATE_LIMIT_GLOBAL_MAX_DEFAULT);
const RATE_LIMIT_AUTH_MAX = resolveTierMax('RATE_LIMIT_AUTH_MAX', RATE_LIMIT_AUTH_MAX_DEFAULT);
const RATE_LIMIT_REFRESH_MAX = resolveTierMax('RATE_LIMIT_REFRESH_MAX', RATE_LIMIT_REFRESH_MAX_DEFAULT);
const RATE_LIMIT_LLM_MAX = resolveTierMax('RATE_LIMIT_LLM_MAX', RATE_LIMIT_LLM_MAX_DEFAULT);

module.exports = {
  EXPECTED_BLOCKLIST_SHA256,
  JWT_ISSUER,
  JWT_AUDIENCE,
  ACCESS_TOKEN_TTL_SECONDS,
  JWT_CLOCK_TOLERANCE_SECONDS,
  OLD_KEY_RETENTION_SECONDS,
  COOKIE_NAME,
  COOKIE_PATH,
  COOKIE_SAME_SITE,
  COOKIE_HTTP_ONLY,
  COOKIE_SECURE,
  getRefreshCookieOptions,
  getClearRefreshCookieOptions,
  RATE_LIMIT_MAX_KEYS_DEFAULT,
  RATE_LIMIT_MAX_KEYS_MIN,
  RATE_LIMIT_MAX_KEYS_MAX,
  RATE_LIMIT_MAX_KEYS,
  RATE_LIMIT_GLOBAL_MAX,
  RATE_LIMIT_GLOBAL_MAX_DEFAULT,
  RATE_LIMIT_GLOBAL_WINDOW_MS,
  RATE_LIMIT_AUTH_MAX,
  RATE_LIMIT_AUTH_MAX_DEFAULT,
  RATE_LIMIT_AUTH_WINDOW_MS,
  RATE_LIMIT_REFRESH_MAX,
  RATE_LIMIT_REFRESH_MAX_DEFAULT,
  RATE_LIMIT_REFRESH_WINDOW_MS,
  RATE_LIMIT_LLM_MAX,
  RATE_LIMIT_LLM_MAX_DEFAULT,
  RATE_LIMIT_LLM_WINDOW_MS,
  SCRYPT_N,
  SCRYPT_R,
  SCRYPT_P,
  SCRYPT_SALT_BYTES,
  SCRYPT_KEYLEN,
  SCRYPT_KEYLEN_BYTES: SCRYPT_KEYLEN,
  SCRYPT_MAXMEM,
  SCRYPT_PARAMS: {
    N: SCRYPT_N,
    r: SCRYPT_R,
    p: SCRYPT_P,
    maxmem: SCRYPT_MAXMEM
  },
  SESSION_ABSOLUTE_LIFETIME_MS,
  DUMMY_PASSWORD_HASH,
  CORS_ALLOWED_ORIGINS,
  JWT_KEYRING,
  TRUST_PROXY,
  // Helper for tests/configuration reload
  parseCorsAllowedOrigins,
  resolveJwtKeyring,
  resolveCookieSecure,
  resolveRateLimitMaxKeys
};
