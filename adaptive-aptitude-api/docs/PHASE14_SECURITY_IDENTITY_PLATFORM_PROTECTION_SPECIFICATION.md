# PHASE 14 — SECURITY, IDENTITY & PLATFORM PROTECTION
# PRESCRIPTIVE SPECIFICATION

```text
Document: docs/PHASE14_SECURITY_IDENTITY_PLATFORM_PROTECTION_SPECIFICATION.md
Version: 1.0.8-FROZEN
Status: VERIFIED / COMPLETE / FROZEN
Architecture Basis: docs/PHASE14_ARCHITECTURE_PROPOSAL.md v1.0.4-FROZEN
Implementation Authorization: NONE
Implementation Performed: NO
Date: October 2026
```

---

## 1. AUTHORITATIVE PRECEDENCE & GOVERNANCE HIERARCHY

This prescriptive specification translates the frozen Phase 14 architecture proposal into deterministic, implementation-addressable contracts for engineering execution.

### 1.1 Strict Precedence Hierarchy

```text
Frozen Phases 1–13 Contracts
>
Phase 14 Architecture Proposal (docs/PHASE14_ARCHITECTURE_PROPOSAL.md v1.0.4-FROZEN)
>
Phase 14 Prescriptive Specification (this document)
>
Future Phase 14 Implementation Details
```

### 1.2 Conflict Resolution Invariant
1. **Architecture Wins**: Under no circumstances may this specification redesign, weaken, bypass, or alter any contract established in `PHASE14_ARCHITECTURE_PROPOSAL.md v1.0.4-FROZEN`.
2. If any discrepancy or implementation challenge arises between this specification and the frozen architecture, the frozen architecture is authoritative (`ARCHITECTURE WINS`), and an explicit architecture contradiction must be reported rather than silently altering architecture rules.
3. Zero Phase 1–13 contracts, mathematical models, question intelligence, SM-2 spaced repetition algorithms, IRT estimation routines, diagnostic CLI guarantees, or Prometheus metric bounds may be modified.

---

## 2. FROZEN PHASE 1–13 BASELINE & PLATFORM EVOLUTION

Phase 14 executes strictly on top of the verified, permanently frozen terminal baseline established by Phases 1 through 13.

### 2.1 Frozen Platform Baseline Metrics

```text
Jest Test Suites:             84 / 84 passing (Baseline Invariant)
Total Tests:                  1156 / 1156 passing (Baseline Invariant)
Phase 2 Verification:         PASS (scripts/verifyPhase2.js)
Content Integrity:            PASS (scripts/verifyContentIntegrity.js)
Pre-Phase-13 Regressions:     0
Pre-Phase-14 Regressions:     0
Active Implementation Blockers:0
Current Mongoose Models:      15
Current Mongo Collections:    15
Current Runtime Dependencies: 4 (cors, dotenv, express, mongoose)
Current Dev Dependencies:     3 (jest, nodemon, supertest)
```

### 2.2 Authorized Platform Deltas

| Metric / Dimension | Baseline (Phase 13 Frozen) | Phase 14 Delta | Projected Terminal State |
|---|---|---|---|
| **Mongoose Models** | 15 | **+1** (`AuthSession`) | **16** |
| **MongoDB Collections** | 15 | **+1** (`authsessions`) | **16** |
| **Runtime Dependencies** | 4 | **+2** (`jsonwebtoken`, `cookie-parser`) | **6** |
| **Dev Dependencies** | 3 | **+0** | **3** |
| **Active Routes** | 80 | **+6** (Auth routes) | **86** |
| **Prometheus Metric Families** | 8 | **+0** (Zero new metric families) | **8** |
| **High-Cardinality Metric Labels** | 0 | **+0** (Zero high-cardinality labels) | **0** |

No additional model, collection, runtime dependency, or development dependency is authorized.

---

## 3. EXACT IMPLEMENTATION FILE INVENTORY & RESPONSIBILITIES

Phase 14 implementation is strictly confined to the following authoritative file inventory. Wildcard-only implementation ownership is strictly prohibited.

### 3.1 New Production Files (Exactly 11 Files)

1. `src/config/authConfig.js`
   - **Responsibility**: Centralized security configuration, static literal cryptographic digests, environment parsing, range validation, fail-closed assertions, and rate-limit safety bounds.
2. `src/models/authSessionModel.js`
   - **Responsibility**: Mongoose schema and index definitions for refresh session generations (`authsessions` collection).
3. `src/middleware/authenticate.js`
   - **Responsibility**: Router boundary middleware parsing RFC 6750 Bearer JWTs, verifying signatures against the active keyring, validating mandatory principal claims (`sub`, `sid`, `jti`, `iat`, `exp`, `iss`, `aud`), and establishing `req.user` without performing database queries.
4. `src/middleware/authorize.js`
   - **Responsibility**: Deterministic resource ownership verification middleware preventing Broken Object Level Authorization (BOLA/IDOR).
5. `src/middleware/securityHeaders.js`
   - **Responsibility**: Express middleware emitting strict defensive security headers (CSP, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy, Cache-Control).
6. `src/middleware/rateLimiter.js`
   - **Responsibility**: In-process bounded fixed-window counter rate limiter with process-wide background bucket sweeper and fail-closed capacity limits.
7. `src/services/authService.js`
   - **Responsibility**: Core authentication domain service executing registration, password verification (explicitly selecting `passwordHash`), session issuance (binding access JWT `jti` to `AuthSession.tokenId`), refresh token rotation with owning user account-status verification, reuse detection, and session revocation.
8. `src/controllers/authController.js`
   - **Responsibility**: HTTP controller mapping request bodies, query parameters, cookies, and headers to `authService` invocations and emitting RFC-compliant JSON responses.
9. `src/routes/authRoutes.js`
   - **Responsibility**: Express router mounting the 6 public and authenticated authentication endpoints under `/api/v1/auth`.
10. `src/data/auth/commonPasswordsBlocklist.json`
    - **Responsibility**: Immutable local static JSON blocklist containing the verified 10,000 common passwords from SecLists.
11. `scripts/checkAuthMigrationReadiness.js`
    - **Responsibility**: Deterministic, strictly read-only preflight CLI auditing legacy User records for non-canonical emails, duplicates, and auth eligibility prior to index creation.

### 3.2 Modified Existing Production Files (Exactly 39 Files)

#### Core Application Infrastructure & Models (6 Files)
1. `src/models/userModel.js`: Extend schema with `passwordHash` (`select: false`), `status` enum (`active`, `disabled`), preserve baseline `userId` unique index; restore architecture-required schema index declaration for canonical partial unique index on non-blank canonical `email` (`userSchema.index({ email: 1 }, { unique: true, partialFilterExpression: { email: { $exists: true, $type: 'string', $gt: '' } } })`); enforce User-model-local autoIndex suppression (`userSchema.set('autoIndex', false)`) preventing automatic index building prior to migration preflight while preserving global Mongoose default auto-indexing across all Phase 1–13 models.
2. `src/app.js`: Reorder and mount Express middleware pipeline adhering strictly to the frozen 15-stage sequence: correlation, metrics, security headers, health, metrics gate, global limiter, CORS, cookie parser, JSON parser, auth router, authenticate boundary, Tier-4 LLM limiter for `/api/v1/learning/*`, Step 13 protected business stage beginning with universal body/query principal guard (`enforcePrincipalUserIdBodyQuery`) followed by protected business routers and route-level ownership guards, notFound, and errorHandler.
3. `src/server.js`: Integrate configuration fail-closed assertions on boot; explicitly own all startup physical index verification before listener binding: after successful MongoDB connection and before listener binding, `src/server.js` (1) explicitly ensures `userId_1` unique physical index (`await User.collection.createIndex({ userId: 1 }, { unique: true, name: 'userId_1' })`), (2) explicitly ensures `status_1` physical index (`await User.collection.createIndex({ status: 1 }, { name: 'status_1' })`), (3) reads `await User.collection.indexes()`, (4) verifies `userId_1` unique index, (5) verifies `status_1` index, (6) independently performs READ-ONLY deep semantic verification of the existing canonical email index (`email_1_canonical_unique`, key `{ email: 1 }`, `unique: true`, `partialFilterExpression: { email: { $exists: true, $type: 'string', $gt: '' } }`), (7) creates AuthSession indexes through `await AuthSession.createIndexes()`, (8) verifies all 7 required non-_id AuthSession physical indexes via `await AuthSession.collection.indexes()`, (9) fails closed on any required-index mismatch before accepting traffic, and (10) binds HTTP listener only after all checks pass. Canonical email index creation during startup is strictly FORBIDDEN (`src/server.js DOES NOT create email_1_canonical_unique`). Prohibit `User.createIndexes()`, `User.syncIndexes()`, and `User.collection.createIndex({ email: 1 }, ...)` before or during normal startup because the application verifies the canonical email index but never activates it; preserve global Mongoose autoIndex behavior for all Phase 1–13 models; and handle graceful cleanup of the rate-limiter background interval.
4. `src/utils/logger.js`: Authorize the 10 Phase 14 security events in the event catalog with strict allowed/forbidden field redaction.
5. `scripts/diagnoseSystem.js`: Update `EXPECTED_COLLECTIONS` inventory from 15 to 16 by appending `'authsessions'`.
6. `scripts/managePolicy.js`: Harden host CLI trust boundary to require `POLICY_GOVERNANCE_SECRET` fail-closed in production and staging environments.

#### Controllers Receiving Authoritative Identity Binding (15 Files)
7. `src/controllers/userController.js`: Bind `getUser` to `req.user.userId` with client-supplied `userId` mismatch rejection (HTTP 403 `IDENTITY_MISMATCH`); deprecate `createUser` to return HTTP 410.
8. `src/controllers/goalController.js`: Bind `createGoal` to `req.user.userId` with client-supplied `userId` mismatch rejection (HTTP 403 `IDENTITY_MISMATCH`); enforce ownership verification on goal mutations and fetches.
9. `src/controllers/attemptController.js`: Bind `createAttempt` to `req.user.userId` with client-supplied `userId` mismatch rejection (HTTP 403 `IDENTITY_MISMATCH`); enforce ownership verification on attempt fetches.
10. `src/controllers/studyPlanController.js`: Bind `createStudyPlan` to `req.user.userId` with client-supplied `userId` mismatch rejection (HTTP 403 `IDENTITY_MISMATCH`); enforce plan ownership verification.
11. `src/controllers/dailyObjectiveController.js`: Bind `createDailyObjective` to `req.user.userId` with client-supplied `userId` mismatch rejection (HTTP 403 `IDENTITY_MISMATCH`); enforce objective ownership.
12. `src/controllers/studentProgressController.js`: Enforce caller binding (`enforcePrincipalUserId`) with mismatch rejection (HTTP 403 `IDENTITY_MISMATCH`) on student progress and analytics aggregations.
13. `src/controllers/adaptiveController.js`: Bind `getNextQuestion` to `req.user.userId` with client-supplied `userId` query parameter mismatch rejection (HTTP 403 `IDENTITY_MISMATCH`).
14. `src/controllers/planningController.js`: Bind study plan preview, generation, and replanning to `req.user.userId` with client-supplied `userId` mismatch rejection (HTTP 403 `IDENTITY_MISMATCH`).
15. `src/controllers/revisionController.js`: Bind spaced repetition revisions and state rebuilds to `req.user.userId` with client-supplied `userId` mismatch rejection (HTTP 403 `IDENTITY_MISMATCH`).
16. `src/controllers/mockBlueprintController.js`: Close `createBlueprint` (`POST /api/v1/mock-blueprints`) to learner HTTP mutation with HTTP 403.
17. `src/controllers/mockSessionController.js`: Eliminate `extractUserId` helper; bind session creation and exam progression strictly to `req.user.userId` with client-supplied `userId` mismatch rejection (HTTP 403 `IDENTITY_MISMATCH`).
18. `src/controllers/learningController.js`: Bind AI tutoring, hints, attempt explanations, and mock reviews strictly to `req.user.userId` with client-supplied `userId` mismatch rejection (HTTP 403 `IDENTITY_MISMATCH`).
19. `src/controllers/analyticsController.js`: Bind dashboards, cognitive profiles, retention analytics, and goal readiness to `req.user.userId` with client-supplied `userId` mismatch rejection (HTTP 403 `IDENTITY_MISMATCH`).
20. `src/controllers/orchestrationController.js`: Bind next actions, daily agendas, and dynamic interventions to `req.user.userId` with client-supplied `userId` mismatch rejection (HTTP 403 `IDENTITY_MISMATCH`).
21. `src/controllers/attributionController.js`: Bind prescription issuance, activation, completion, and summaries to `req.user.userId` with client-supplied `userId` mismatch rejection (HTTP 403 `IDENTITY_MISMATCH`).

#### Cross-Phase Route Guards (3 Files)
22. `src/middlewares/analyticsGuard.js`: Enforce strict caller validation ensuring client-supplied `userId` (in `params` or `query`) matches `req.user.userId` via `enforcePrincipalUserId` (HTTP 403 `IDENTITY_MISMATCH` on mismatch).
23. `src/middlewares/orchestrationGuard.js`: Enforce strict caller validation ensuring client-supplied `userId` (in `query` or `body`) matches `req.user.userId` via `enforcePrincipalUserId` (HTTP 403 `IDENTITY_MISMATCH` on mismatch).
24. `src/middlewares/attributionGuard.js`: Enforce strict caller validation ensuring client-supplied `userId` (in `params` or `body`) matches `req.user.userId` via `enforcePrincipalUserId` (HTTP 403 `IDENTITY_MISMATCH` on mismatch).

#### Route Definition Files Receiving Middleware Boundaries & Identity Wiring (Exactly 15 Files)
25. `src/routes/userRoutes.js`: Mount `enforcePrincipalUserId` on `/users/:userId`; mount HTTP 410 tombstone handler on `POST /users`.
26. `src/routes/goalRoutes.js`: Mount `enforcePrincipalUserId` on `/goals` and `/goals/user/:userId`, and resource ownership guards on `/:id`.
27. `src/routes/studyPlanRoutes.js`: Mount `enforcePrincipalUserId` on `/study-plans` and `/study-plans/user/:userId`, and resource ownership guards on `/:id`.
28. `src/routes/dailyObjectiveRoutes.js`: Mount `enforcePrincipalUserId` on `/daily-objectives` and `/daily-objectives/user/:userId`, and resource ownership guards on `/:id`.
29. `src/routes/attemptRoutes.js`: Mount `enforcePrincipalUserId` on `/attempts` and `/attempts/user/:userId`, and resource ownership guards on `/:id`.
30. `src/routes/progressRoutes.js`: Mount `enforcePrincipalUserId` on `/progress/:userId*` user progress routes.
31. `src/routes/adaptiveRoutes.js`: Route protection wiring mounting `enforcePrincipalUserId` guard, validating that any client-supplied `userId` query parameter matches `req.user.userId` (failing closed with `403 IDENTITY_MISMATCH` on mismatch), and binding execution identity strictly to `req.user.userId`.
32. `src/routes/planningRoutes.js`: Mount `enforcePrincipalUserId` on preview, generate, replan, and schedule routes, plus plan document ownership guards on `/:planId`.
33. `src/routes/revisionRoutes.js`: Mount `enforcePrincipalUserId` on `/revisions/due`, `/revisions/plan`, `/revisions/user/:userId`, `/revisions/rebuild`, and item ownership guard on `/:id`.
34. `src/routes/mockBlueprintRoutes.js`: Mount HTTP 403 tombstone closure on `POST /mock-blueprints`.
35. `src/routes/mockSessionRoutes.js`: Mount `enforcePrincipalUserId` on `POST /mock-sessions` and session ownership guards across all session progression endpoints.
36. `src/routes/learningRoutes.js`: Route protection wiring operating behind pipeline Step 12 Tier 4 LLM rate limiting (`llmRateLimiter` mounted in `src/app.js`) and Step 13 caller identity validation (`enforcePrincipalUserIdBodyQuery` returning HTTP 403 `IDENTITY_MISMATCH` on mismatch) across the 6 AI tutoring/explanation endpoints (zero duplicate Tier-4 limiters).
37. `src/routes/analyticsRoutes.js`: Route protection wiring mounting `enforcePrincipalUserId` (HTTP 403 `IDENTITY_MISMATCH` on query/body mismatch), plus resource ownership verification on `/readiness/:goalId` (`goal.userId === req.user.userId`).
38. `src/routes/orchestrationRoutes.js`: Route protection wiring mounting `enforcePrincipalUserId` (HTTP 403 `IDENTITY_MISMATCH` on query mismatch) across orchestration endpoints (`/next-action`, `/daily-agenda`, `/interventions`).
39. `src/routes/attributionRoutes.js`: Route protection wiring mounting `enforcePrincipalUserId` (HTTP 403 `IDENTITY_MISMATCH` on body/params mismatch) and resource ownership verification on prescription activation and completion routes.

### 3.3 Existing Test Files Receiving Mechanical Security Adaptation
1. `tests/reliability/diagnosticsCli.test.js`: Update expected collections assertion from 15 to 16.
2. `tests/reliability/observabilityTelemetry.test.js`: Adapt test requests with valid Bearer JWT fixtures.
3. `tests/architecture_guard.test.js`: Update registered Mongoose model and MongoDB collection assertions from 15 to 16.
4. `tests/orchestration/phase9CrossPhaseIsolation.test.js`: Update registered model count assertion from 15 to 16.
5. `tests/attribution/attributionIssuance.test.js`: Update registered model count assertion from 15 to 16.
6. `tests/analytics/phase8CrossPhaseIsolation.test.js`: Update registered model count assertion from 15 to 16.
7. `tests/simulation/phase11CrossPhaseIsolation.test.js`: Update registered model count assertion from 15 to 16.
8. `tests/phase3_regression.test.js`: Update registered model count assertion from 15 to 16.
9. Existing functional API suites across Phases 2–12 receiving mechanical authenticated fixtures (Bearer JWTs) to traverse the new security barrier without modifying business assertions.

### 3.4 New Security Test Files (Exactly 10 Files)
1. `tests/security/passwordHashing.test.js`: Tests scrypt N=16384/r=8/p=5, timingSafeEqual, NFC normalization, length validation, malformed hash handling, canonical signature `verifyPassword(password, encodedHash)`, and call order correctness with zero argument reversal.
2. `tests/security/jwtKeyring.test.js`: Tests HS256 signing, multi-key keyring resolution, kid validation, 30s clock tolerance, algorithm allowlisting, 960s old-key retention, mandatory claim structural validation (`sub`, `sid`, `jti`, `iat`, `exp`, `iss`, `aud`), zero database lookups, and deterministic `jti` mapping matching issuing `AuthSession.tokenId`.
3. `tests/security/authSessionLedger.test.js`: Tests AuthSession creation, status transitions (active -> rotated, active -> revoked, rotated -> revoked durable replay marker), TTL index, at-most-one active generation constraint, family tracking, controlled interleavings (Case A, B, C race resolution proving replay detected before or after successor creation results in fail-secure revocation with zero credentials issued), physical presence and verification of all 7 required non-_id indexes, and distinct non-colliding index names (`sessionId_1` vs `sessionId_active_unique`).
4. `tests/security/authRoutes.test.js`: Tests public registration (stripping/ignoring unauthorized extra fields), login (explicit `passwordHash` selection, correct `verifyPassword(password, user.passwordHash)` call order, dummy timing derivations with `verifyPassword(password, DUMMY_PASSWORD_HASH)`, disabled-account rejection with bounded `AUTH_ACCOUNT_DISABLED` logging), refresh (environment-consistent cookie creation/clearing, disabled-account rejection with zero successor creation and zero CAS rotation, post-successor replay reconciliation returning HTTP 401 `REFRESH_REUSE_DETECTED` with zero credentials issued upon race), authenticated logout, revoke-all, and `/me` flows.
5. `tests/security/rateLimiter.test.js`: Tests single process-wide registry Map shared across all four tiers contributing to aggregate `registry.size`, aggregate capacity saturation (HTTP 429 when `registry.size >= RATE_LIMIT_MAX_KEYS`), single background sweeper, absence of per-key timers, safe key derivation without throwing on missing/malformed payloads or missing cookies, and pipeline middleware ordering (asserts `authenticate` establishes `req.user` before `llmRateLimiter` reads `req.user.userId`, and `llmRateLimiter` executes before `enforcePrincipalUserIdBodyQuery` on learning routes; asserts Tier-4-exhausted request terminates with HTTP 429 before Step 13 identity mismatch evaluation).
6. `tests/security/ownershipGuard.test.js`: Tests BOLA/IDOR prevention, caller `userId` binding, universal body/query mismatch rejection across all 74 protected business routes (HTTP 403 `IDENTITY_MISMATCH`), learning route below Tier-4 limit with mismatching `userId` yielding HTTP 403 `IDENTITY_MISMATCH`, matching/absent supplied `userId` yielding normal execution, route parameter `:userId` mismatches yielding HTTP 403 `IDENTITY_MISMATCH`, exact method+path tombstone bypass for `POST /api/v1/users` (HTTP 410) and `POST /api/v1/mock-blueprints` (HTTP 403) across anonymous and authenticated callers with zero bypass for any other route, and independent resource document ownership rejection (HTTP 403 `OWNERSHIP_VIOLATION`).
7. `tests/security/bolaPrevention.test.js`: Comprehensive cross-tenant access attempts across all student resources (goals, plans, attempts, sessions, analytics).
8. `tests/security/securityHeaders.test.js`: Asserts presence and values of CSP, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy, and absence of Node HSTS.
9. `tests/security/authMigrationReadiness.test.js`: Tests `checkAuthMigrationReadiness.js` audit checks, exit code semantics (INDEX SAFETY), and complete index lifecycle/verification contract (1. email schema index declaration remains present; 2. User model autoIndex is false; 3. global Mongoose autoIndex remains unchanged; 4. failed preflight prohibits index activation; 5. passing preflight permits the single operator activation mechanism; 6. exact physical email index options are deeply verified; 7. application startup performs independent read-only email index verification; 8. missing email_1_canonical_unique causes startup failure; 9. wrong unique:false causes startup failure; 10. wrong partialFilterExpression causes startup failure; 11. wrong key causes startup failure; 12. startup does NOT create the email index; 13. userId_1 remains physically unique; 14. status_1 remains present; 15. all 7 required non-_id AuthSession indexes remain physically verified without name collision).
10. `tests/security/blocklistIntegrity.test.js`: Asserts blocklist digest matching `EXPECTED_BLOCKLIST_SHA256`, deterministic `UNAVAILABLE` service state and HTTP 500 `BLOCKLIST_UNAVAILABLE` on registration attempts if file is tampered/missing, and static constant independence.

---

## 4. CONFIGURATION SUBSYSTEM CONTRACT (`src/config/authConfig.js`)

`src/config/authConfig.js` is the sole canonical authority owning all security constants, environment parsing, validation rules, and safety bounds.

### 4.1 Exported Constants & Configuration Schema

```javascript
/**
 * src/config/authConfig.js
 * Authoritative Security & Platform Protection Configuration
 */

// 1. Password Blocklist Integrity Constant
// SHA-256 over exact committed bytes of src/data/auth/commonPasswordsBlocklist.json
// Upstream Provenance: danielmiessler/SecLists commit 7ab4b6a718285141ef8154630c9091da06987113
const EXPECTED_BLOCKLIST_SHA256 = 'fe0b58f7baab02c6a3019a22f80049080747b435097812bf48d11f42f627ef56';

// 2. JWT Configuration Constants
const JWT_ISSUER = 'aptitude-platform';
const JWT_AUDIENCE = 'aptitude-learning-api';
const ACCESS_TOKEN_TTL_SECONDS = 900;       // 15 minutes
const JWT_CLOCK_TOLERANCE_SECONDS = 30;     // 30 seconds
const OLD_KEY_RETENTION_SECONDS = 960;      // >= 900s + 30s = 930s (Satisfies invariant)

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
```

### 4.2 Runtime Validation & Parsing Logic

`src/config/authConfig.js` executes strict startup validation:
1. **CORS Origins (`CORS_ALLOWED_ORIGINS`)**:
   - Must be parsed from a comma-separated string into a frozen `Set` of exact strings.
   - Wildcard `*` is strictly forbidden when `NODE_ENV === 'production'`.
   - In production/staging, must contain at least one valid HTTP/HTTPS origin.
2. **JWT Keyring (`JWT_ACCESS_KEYS`, `JWT_ACCESS_ACTIVE_KID`)**:
   - `JWT_ACCESS_KEYS` must be a valid JSON string representing an object mapping string `kid`s to secrets.
   - Each secret must be validated for byte size: `Buffer.byteLength(secret, 'utf8') >= 32` (Minimum encoded secret size: 32 UTF-8 bytes). Key material below 32 UTF-8 bytes fails closed immediately.
   - `JWT_ACCESS_ACTIVE_KID` must be defined and must match a key present in `JWT_ACCESS_KEYS`.
   - In production/staging, missing, short (< 32 UTF-8 bytes), or malformed keys fail closed immediately (`throw new Error(...)`).
   - In development/test, fallback ephemeral test keys (each >= 32 UTF-8 bytes) are generated if unconfigured.
3. **Cookie Security Posture (`COOKIE_SECURE`)**:
   - Production deployment: `Secure=true`.
   - Local explicit non-HTTPS development: `Secure=false`.
   - Test environment: may override cookie security only inside isolated test configuration; this is not a deployment posture.
4. **Proxy Trust Configuration (`TRUST_PROXY_HOPS`)**:
   - Defaults to `false`. If configured, validated as a non-negative integer or strict subnet CIDR string.
5. **Rate Limiter Bounds**:
   - `RATE_LIMIT_MAX_KEYS` parsed from environment, bounded within `[RATE_LIMIT_MAX_KEYS_MIN, RATE_LIMIT_MAX_KEYS_MAX]`.

---

## 5. PASSWORD HASHING CONTRACT

Password verification and derivation are implemented natively via Node.js `node:crypto.scrypt` with zero third-party dependencies.

### 5.1 Password Policy & Normalization
1. **Normalization**: Complete password string must be normalized to Unicode **NFC** (`password.normalize('NFC')`). NFKC is strictly forbidden as it destroys distinct characters.
2. **Length Validation**: Measured strictly by Unicode code points:
   ```javascript
   const codePointLength = Array.from(normalizedPassword).length;
   if (codePointLength < 15 || codePointLength > 128) {
     throw new ValidationError('PASSWORD_LENGTH_INVALID');
   }
   ```
3. **Composition Rules**: **NONE**. No arbitrary requirements for uppercase, lowercase, numbers, or symbols.
4. **Truncation**: Strictly forbidden. The entire code-point sequence is processed.

### 5.2 Scrypt Derivation Parameters & Storage Format
- **Parameters**: `N = 16384`, `r = 8`, `p = 5`, `salt = 16 random bytes`, `derivedKey = 64 bytes`, `maxmem = 128 MB`.
- **Serialized Format**:
  ```text
  $scrypt$v=1$N=16384,r=8,p=5$<salt_hex>$<derived_key_hex>
  ```
  - `salt_hex`: 32 hex characters (16 bytes).
  - `derived_key_hex`: 128 hex characters (64 bytes).

### 5.3 Function Contracts (`src/services/authService.js` / password helper)

```javascript
function normalizePassword(password);
// Returns: string normalized to Unicode NFC

function validatePasswordPolicy(password);
// Throws: Error with code 'PASSWORD_LENGTH_INVALID' if code points < 15 or > 128

async function hashPassword(password);
// Returns: Promise<string> formatted as $scrypt$v=1$N=16384,r=8,p=5$<salt_hex>$<derived_key_hex>

async function verifyPassword(password, encodedHash);
// Returns: Promise<boolean>
// 1. Parses encodedHash. If format does not match $scrypt$v=1$N=16384,r=8,p=5$<salt>$<hash>, returns false.
// 2. Extracts salt buffer (16 bytes) and expected derivedKey buffer (64 bytes).
// 3. Normalizes input password to NFC.
// 4. Derives candidate key using crypto.scrypt(normalizedPassword, salt, 64, { N: 16384, r: 8, p: 5, maxmem: 134217728 }).
// 5. Compares candidateKey and expectedKey using crypto.timingSafeEqual(candidateKey, expectedKey).
// 6. Returns true on match, false on mismatch.
```

### 5.4 Timing Defense & Malformed Hash Handling
- If `encodedHash` is missing, malformed, or belongs to an unprovisioned legacy user, `verifyPassword` executes a dummy `crypto.scrypt` computation against a pre-encoded static dummy hash to eliminate timing side-channels before returning `false`.
- Plaintext passwords or derived keys must never be logged or persisted.

---

## 6. COMPROMISED PASSWORD BLOCKLIST CONTRACT

The platform protects against common and compromised credentials using a local, deterministic, supply-chain verified artifact with zero runtime network calls.

### 6.1 Upstream Source Provenance
- **Repository**: `danielmiessler/SecLists` (`https://github.com/danielmiessler/SecLists.git`)
- **Pinned Immutable Commit SHA**: `7ab4b6a718285141ef8154630c9091da06987113` (Release `2024.1`)
- **Source File**: `Passwords/Common-Credentials/10k-most-common.txt`
- **Source File Bytes**: Exactly 73,017 bytes.
- The immutable Git commit independently proves the upstream source version and raw content bytes.

### 6.2 Local Runtime Artifact & Integrity Verification
- **Local Artifact Path**: `src/data/auth/commonPasswordsBlocklist.json`
- **Runtime Network Calls**: **ZERO**. Pure in-memory lookup.
- **`EXPECTED_BLOCKLIST_SHA256` Definition**: SHA-256 computed over the exact bytes of `src/data/auth/commonPasswordsBlocklist.json` committed to this repository (`fe0b58f7baab02c6a3019a22f80049080747b435097812bf48d11f42f627ef56`).
- **Integrity Verification**:
  1. At module initialization, `authService` reads `src/data/auth/commonPasswordsBlocklist.json`.
  2. Computes `crypto.createHash('sha256').update(fileBuffer).digest('hex')`.
  3. Asserts computed hash matches `EXPECTED_BLOCKLIST_SHA256` from `src/config/authConfig.js`.
  4. If file is missing, JSON is invalid, or SHA-256 digest fails to match:
     - Log error event via logger using existing canonical event catalog: `event: 'LOG_EVENT'`, `component: 'server'`, message: `'Password blocklist integrity initialization failure'`. No unauthorized event (such as `BLOCKLIST_INTEGRITY_FAILURE`) is added to the event catalog. Zero secret material, hash values, passwords, or file contents are logged.
     - Set in-memory blocklist state to `UNAVAILABLE`. The application server process may remain running, but authentication service enters a degraded fail-closed state.
     - Any subsequent registration or password-changing request while blocklist state is `UNAVAILABLE` fails closed immediately with HTTP 500 `BLOCKLIST_UNAVAILABLE`. No user is created, and no passwordHash is persisted.
  5. On successful digest assertion, load entries into an in-memory `Set<string>`.

### 6.3 Deterministic Artifact Generation Contract
The committed local JSON artifact `src/data/auth/commonPasswordsBlocklist.json` is generated from the pinned upstream text via this exact 9-step deterministic pipeline:
1. **Read Upstream Bytes**: Read exact upstream file bytes at pinned commit `7ab4b6a718285141ef8154630c9091da06987113` from `Passwords/Common-Credentials/10k-most-common.txt` (73,017 bytes).
2. **Line Parsing**: Parse one password per source line.
3. **Newline Handling**: Split lines on UNIX LF (`\n`); discard the single terminal empty line resulting from the final trailing newline.
4. **CRLF Normalization**: Normalize any CRLF by stripping carriage return (`\r`) if present (all source lines in pinned commit are LF-terminated).
5. **Content Preservation**: Preserve exact UTF-8 character content of each password string without modification, stripping only line termination bytes.
6. **Duplicate Handling**: Retain entries preserving first-seen source order; drop duplicates (all 10,000 source lines are verified unique strings).
7. **Canonical JSON Serialization**: Serialize as a pretty-printed JSON array with 2-space indentation and a single trailing POSIX newline (`JSON.stringify(passwords, null, 2) + '\n'`, exactly 123,021 bytes).
8. **Final Digest Calculation**: Compute SHA-256 over the final committed JSON artifact bytes: `fe0b58f7baab02c6a3019a22f80049080747b435097812bf48d11f42f627ef56`.
9. **Independent Constant Assertion**: Hardcode that digest independently as `EXPECTED_BLOCKLIST_SHA256 = 'fe0b58f7baab02c6a3019a22f80049080747b435097812bf48d11f42f627ef56'` in `src/config/authConfig.js`. The constant is never derived dynamically from the mutable runtime file.

### 6.4 Rejection Contract
- Candidate password is NFC-normalized and looked up via exact match (`blocklistSet.has(normalizedPassword)`).
- Substring matching or case conversion is forbidden.
- On match, registration fails with:
  ```http
  HTTP/1.1 400 Bad Request
  Content-Type: application/json; charset=utf-8
  ```
  ```json
  {
    "success": false,
    "error": {
      "code": "PASSWORD_BLOCKLISTED",
      "message": "Choose a different password."
    }
  }
  ```

---

## 7. USER MODEL EVOLUTION (`src/models/userModel.js`)

`src/models/userModel.js` is evolved with zero breaking changes to existing documents.

### 7.1 Schema Additions
```javascript
// Retain existing fields: userId, name, email, avatar, createdAt, updatedAt
// Add Phase 14 Security Fields:
passwordHash: {
  type: String,
  required: false, // Optional for legacy compatibility
  select: false    // Excluded from default queries to prevent leakage
},
status: {
  type: String,
  enum: ['active', 'disabled'],
  default: 'active',
  index: true
}
```

### 7.2 Strict Invariants & Indexing Lifecycle
1. **Forbidden Fields**: No `role`, `operator`, `failedLoginAttempts`, `lockUntil`, `resetToken`, or `refreshToken` fields.
2. **Legacy User Compatibility**: Legacy users lacking `passwordHash` or `email` remain valid and loadable.
3. **Authentication Eligibility**: Enforced in `authService`—users lacking `passwordHash` cannot authenticate.
4. **Canonical Stored Email**: All new or updated emails must be stored as trimmed lowercase strings (`email.trim().toLowerCase()`).
5. **Canonical Email Schema Index Declaration Restored**:
   - The canonical email index is explicitly declared on `userSchema` in `src/models/userModel.js` exactly as required by the frozen `1.0.4-FROZEN` architecture:
     ```javascript
     userSchema.index(
       { email: 1 },
       {
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
     ```
   - Canonical email index declared in userSchema: **YES**.
   - Architecture-required `userSchema.index(...)` removed: **NO**.
6. **User-Model-Local autoIndex Suppression**:
   - Global auto-index suppression (`mongoose.set('autoIndex', false)`) remains **STRICTLY PROHIBITED** because it would silently alter index creation across all Phase 1–13 models.
   - Instead, the specification freezes the narrow, User-model-local configuration:
     ```javascript
     userSchema.set('autoIndex', false);
     ```
   - Scope: **User model only**.
   - This allows the canonical email index to remain declared in `userSchema` exactly as mandated by the frozen architecture while preventing Mongoose from automatically building it before the migration preflight runs.
   - Global Mongoose autoIndex: **PRESERVED** (global accidental index suppression = 0).
   - Other Phase 1–13 models: **UNCHANGED**.
   - User schema email index declaration: **PRESENT**.
   - User model automatic index creation before preflight: **DISABLED**.
7. **Physical User Index Verification & Canonical Email Boot Verification Protocol**:
   - Because User-model-local `autoIndex: false` prevents automatic index creation, the server boot sequence (`src/server.js`) explicitly ensures baseline physical non-gated User indexes (`userId_1` and `status_1`) and independently performs read-only deep semantic verification of `email_1_canonical_unique` before binding the HTTP listener.
   - The required expected physical User indexes verified at boot are:
     1. `userId_1` (key: `{ userId: 1 }`, `unique: true`)
     2. `status_1` (key: `{ status: 1 }`)
     3. `email_1_canonical_unique` (key: `{ email: 1 }`, `unique: true`, partialFilterExpression matching `{ email: { $exists: true, $type: 'string', $gt: '' } }`)
   - `userId_1` and `status_1` may be explicitly ensured by startup.
   - `email_1_canonical_unique` must be **VERIFICATION-ONLY** during startup. Canonical email index creation during startup is strictly **FORBIDDEN** (`src/server.js DOES NOT create email_1_canonical_unique`).
   - Implementation-addressable verification contract executed during `src/server.js` startup:
     ```javascript
     await User.collection.createIndex(
       { userId: 1 },
       {
         unique: true,
         name: 'userId_1'
       }
     );

     await User.collection.createIndex(
       { status: 1 },
       {
         name: 'status_1'
       }
     );

     const userIndexes = await User.collection.indexes();

     const userIdIndex = userIndexes.find(
       idx =>
         idx.name === 'userId_1' &&
         idx.key?.userId === 1 &&
         idx.unique === true
     );

     const statusIndex = userIndexes.find(
       idx =>
         idx.name === 'status_1' &&
         idx.key?.status === 1
     );

     const emailIndex = userIndexes.find(
       idx => idx.name === 'email_1_canonical_unique'
     );

     const canonicalEmailIndexValid =
       emailIndex &&
       emailIndex.key?.email === 1 &&
       emailIndex.unique === true &&
       emailIndex.partialFilterExpression &&
       emailIndex.partialFilterExpression.email?.$exists === true &&
       emailIndex.partialFilterExpression.email?.$type === 'string' &&
       emailIndex.partialFilterExpression.email?.$gt === '';

     if (
       !userIdIndex ||
       !statusIndex ||
       !canonicalEmailIndexValid
     ) {
       throw new Error('User physical index verification failed');
     }
     ```
   - Superficial checks (such as `Boolean(emailIndex)` or `!!emailIndex.partialFilterExpression`) are strictly prohibited and insufficient. Deep semantic verification of the exact filter expression is mandatory.
   - **Exact Canonical Email Index Semantics Required**:
     - Index name: `email_1_canonical_unique`
     - Key: `{ email: 1 }`
     - unique: `true`
     - partialFilterExpression:
       ```javascript
       {
         email: {
           $exists: true,
           $type: 'string',
           $gt: ''
         }
       }
       ```
   - **Startup Failure Contract**:
     If `email_1_canonical_unique` is missing, non-unique, has the wrong key, has the wrong filter, or is malformed:
     - `src/server.js` MUST fail startup immediately.
     - Logs via existing canonical logger: `event: 'SERVER_STARTUP_FAILED'`, `component: 'server'`.
     - Binds zero HTTP listeners.
     - Accepts zero authentication traffic and zero business traffic.
     - Process exits non-zero according to existing server startup failure semantics.
     - Startup MUST NOT auto-create the email index, repair it, drop it, replace it, call `syncIndexes()`, continue with a warning, or degrade registration only while serving other Phase 14 traffic. The deployment is considered incomplete until the index is correct.
   - **Prohibited Boot Commands**:
     - `User.createIndexes()` and `User.syncIndexes()` remain **STRICTLY PROHIBITED** before or during normal startup because either operation would automatically create the gated schema email index without going through the preflight gate.
     - Direct execution of `User.collection.createIndex({ email: 1 }, ...)` by application code is **STRICTLY PROHIBITED**. The application verifies this index; it never activates it.
   - **Distinction Between Activation and Verification**:
     - Email Index Activation Mechanism Count: **1** (single administrative MongoDB command executed by operator).
     - Operator-created email index: **YES**.
     - Application-created email index: **NO** (0 runtime creation by application).
     - Deployment-gate email index verification: **YES**.
     - Application boot email index verification: **YES** (read-only verification in `src/server.js`).
     - Boot email index verification mutates database: **NO**.
     (Two verification checkpoints do NOT constitute two activation mechanisms).

---

## 8. AUTHSESSION MODEL CONTRACT (`src/models/authSessionModel.js`)

`AuthSession` tracks refresh token generations and enforces session family lifecycle bounds.

### 8.1 Schema Definition
```javascript
const authSessionSchema = new mongoose.Schema(
  {
    tokenId: {
      type: String,
      required: true,
      unique: true
    },
    sessionId: {
      type: String,
      required: true,
      index: true
    },
    userId: {
      type: String,
      required: true,
      index: true
    },
    tokenHash: {
      type: String,
      required: true,
      unique: true
    },
    status: {
      type: String,
      enum: ['active', 'rotated', 'revoked'],
      required: true,
      default: 'active'
    },
    replacedByTokenId: {
      type: String,
      default: null
    },
    rotatedAt: {
      type: Date,
      default: null
    },
    revokedAt: {
      type: Date,
      default: null
    },
    issuedAt: {
      type: Date,
      required: true,
      default: Date.now
    },
    expiresAt: {
      type: Date,
      required: true
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);
```

### 8.2 Indexes & Unique Invariants
Source-level schema contracts match the frozen architecture without redundant schema index declarations:
1. **`tokenId` Unique Contract**: Path-level `unique: true` in schema definition (generates physical unique index `tokenId_1`, key `{ tokenId: 1 }`, `unique: true`). Redundant schema-level `authSessionSchema.index({ tokenId: 1 }, { unique: true })` call is removed.
2. **`tokenHash` Unique Contract**: Path-level `unique: true` in schema definition (generates physical unique index `tokenHash_1`, key `{ tokenHash: 1 }`, `unique: true`). Redundant schema-level `authSessionSchema.index({ tokenHash: 1 }, { unique: true })` call is removed.
3. **`userId` Lookup Index**: Path-level `index: true` in schema definition (generates physical non-partial lookup index `userId_1`, key `{ userId: 1 }`).
4. **`sessionId` Lookup Index (Plain Lookup Deduplication)**: Path-level `index: true` in schema definition is the sole authoritative source declaration of the plain session-family lookup index (generates physical non-partial lookup index `sessionId_1`, key `{ sessionId: 1 }`). Redundant schema-level `authSessionSchema.index({ sessionId: 1 });` is removed.
   - Plain `sessionId` lookup physical index preserved: **YES**
   - Duplicate plain `sessionId` source declaration: **NO**
   - Frozen architecture lookup semantics altered: **NO**
5. **`expiresAt` TTL Cleanup Index**: Schema index `authSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });` (generates native MongoDB TTL cleanup index `expiresAt_1`, `expireAfterSeconds = 0`).
6. **`userId + sessionId + status` Compound Index**: Schema compound index `authSessionSchema.index({ userId: 1, sessionId: 1, status: 1 });` (generates physical compound index `userId_1_sessionId_1_status_1` for fast session family status lookups).
7. **Single Active Generation Invariant (Partial Unique Index with Distinct Name)**:
   ```javascript
   authSessionSchema.index(
     { sessionId: 1 },
     {
       name: 'sessionId_active_unique',
       unique: true,
       partialFilterExpression: { status: 'active' }
     }
   );
   ```
   - **Distinct Index Naming**: Explicitly named `sessionId_active_unique` to prevent physical index name collision with the plain lookup index `sessionId_1`.
   - **Mechanical Invariant**: At most ONE active token generation per session family exists at any time, physically enforced by MongoDB partial unique constraint. The partial unique index does NOT replace or merge with the plain `sessionId_1` lookup index (which covers rotated/revoked generations for family audits and reuse detection).

- **Inventory Invariant**:
  - Required non-_id `AuthSession` physical indexes: **7**
  - Implicit MongoDB `_id_` index is NOT counted in the seven.

### 8.3 Physical Index Creation & Startup Verification Protocol
Regardless of global auto-indexing posture, all seven non-_id `AuthSession` physical indexes must exist and be deeply verified before authentication, login, refresh, or business traffic is accepted:
1. **Explicit Physical Creation in `src/server.js`**:
   During the server boot sequence in `src/server.js` (inside `start()`, immediately following successful `await database.connectDB()`):
   ```javascript
   await AuthSession.createIndexes();
   ```
2. **Deep Semantic Verification of All 7 Non-_id Physical Indexes**:
   Immediately following creation, the server physically inspects MongoDB collection indexes:
   ```javascript
   const sessionIndexes = await AuthSession.collection.indexes();

   // 1. tokenId_1 unique
   const tokenIdIdx = sessionIndexes.find(
     idx => idx.name === 'tokenId_1' && idx.key?.tokenId === 1 && idx.unique === true
   );

   // 2. tokenHash_1 unique
   const tokenHashIdx = sessionIndexes.find(
     idx => idx.name === 'tokenHash_1' && idx.key?.tokenHash === 1 && idx.unique === true
   );

   // 3. userId_1 non-partial lookup
   const userIdIdx = sessionIndexes.find(
     idx => idx.name === 'userId_1' && idx.key?.userId === 1 && !idx.partialFilterExpression
   );

   // 4. sessionId_1 non-partial lookup
   const sessionIdIdx = sessionIndexes.find(
     idx => idx.name === 'sessionId_1' && idx.key?.sessionId === 1 && !idx.partialFilterExpression
   );

   // 5. expiresAt_1 TTL
   const expiresAtIdx = sessionIndexes.find(
     idx => idx.name === 'expiresAt_1' && idx.key?.expiresAt === 1 && idx.expireAfterSeconds === 0
   );

   // 6. userId_1_sessionId_1_status_1 compound
   const compoundIdx = sessionIndexes.find(
     idx =>
       idx.name === 'userId_1_sessionId_1_status_1' &&
       idx.key?.userId === 1 &&
       idx.key?.sessionId === 1 &&
       idx.key?.status === 1
   );

   // 7. sessionId_active_unique partial unique
   const activePartialIdx = sessionIndexes.find(
     idx =>
       idx.name === 'sessionId_active_unique' &&
       idx.key?.sessionId === 1 &&
       idx.unique === true &&
       idx.partialFilterExpression?.status === 'active'
   );

   if (!tokenIdIdx || !tokenHashIdx || !userIdIdx || !sessionIdIdx || !expiresAtIdx || !compoundIdx || !activePartialIdx) {
     throw new Error('AuthSession physical index verification failed');
   }
   ```
   - Proves plain lookup indexes (`userId_1`, `sessionId_1`) are non-partial and not accidentally satisfied only by a partial index.
   - Proves `sessionId_1` and `sessionId_active_unique` have distinct names with zero collision.
3. **Fail-Closed Startup Invariant**:
   If `AuthSession.createIndexes()` rejects or if physical index verification detects any missing or non-matching index among the 7 required:
   - The application MUST fail closed immediately before binding the HTTP listener (`throw new Error('AuthSession physical index verification failed')`).
   - The server startup failure is logged via canonical logger: `event: 'SERVER_STARTUP_FAILED'`, `component: 'server'`.
   - The process exits with code 1.
   - Zero authentication, login, refresh, or business traffic can be accepted if physical `AuthSession` indexes are absent or malformed.
   - No repair, drop, or `syncIndexes` behavior is authorized.

---

## 9. ACCESS JWT CONTRACT

Access tokens provide stateless authentication across business API endpoints.

### 9.1 RFC 7519 JWT Claims
```json
{
  "sub": "usr_f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "sid": "sess_9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "jti": "tok_c81d4e2e-bcf2-11e6-869b-7df92533c2ec",
  "iat": 1728662400,
  "exp": 1728663300,
  "iss": "aptitude-platform",
  "aud": "aptitude-learning-api"
}
```

### 9.2 Mandatory Principal Claims & Structural Validation Rules
`authenticate` MUST NOT merely copy arbitrary decoded claims into `req.user`. After cryptographic verification against the configured keyring, it MUST structurally validate all mandatory canonical claims:
1. `sub`: Required non-empty string (`typeof sub === 'string' && sub.length > 0`). Represents caller principal ID.
   - Note: Do NOT require a `usr_` prefix for `sub`, because frozen legacy user IDs remain valid.
2. `sid`: Required non-empty string (`typeof sid === 'string' && sid.length > 0`). Represents session family identifier (`sess_<UUID>`).
3. `jti`: Required non-empty string (`typeof jti === 'string' && jti.length > 0`). Represents access token identifier. Strictly mapped from the `AuthSession.tokenId` of the refresh generation that issued the access token (`tok_<UUID>`).
4. `iat`: Required finite numeric JWT timestamp (`typeof iat === 'number' && Number.isFinite(iat)`).
5. `exp`: Required finite numeric JWT timestamp (`typeof exp === 'number' && Number.isFinite(exp)`).
6. `iss`: Required string exactly matching `'aptitude-platform'`.
7. `aud`: Required string exactly matching `'aptitude-learning-api'`.
8. Header `alg`: Required string exactly matching `'HS256'`.
9. Header `kid`: Required string present in configured keyring (`JWT_ACCESS_KEYS`).

- **Forbidden Claims**: No `email`, `role`, `status`, `password`, `refreshToken`, or `tokenHash`.
- **Public Error Mapping**:
  - Missing token: HTTP 401 `UNAUTHORIZED` (`"Authentication is required to access this resource."`).
  - Missing, wrong-type, empty, or malformed mandatory principal claims (`sub`, `sid`, `jti`, `iat`, `exp`), invalid `iss`, invalid `aud`, unknown/missing `kid`, or `alg !== 'HS256'`: HTTP 401 `INVALID_TOKEN` (`"Access token is invalid or malformed."`).
  - Expired token outside 30s clock tolerance (`JWT_CLOCK_TOLERANCE_SECONDS = 30`): HTTP 401 `TOKEN_EXPIRED` (`"Access token has expired."`).

### 9.3 Zero-Database Verification Invariant
- **Access JWT authentication MongoDB queries**: **0**
- **AuthSession queries on ordinary business requests**: **0**
- **User status DB lookup on ordinary business requests**: **0**
- Cryptographic verification is 100% stateless in-memory. No database lookups occur during access token verification on ordinary business requests.

---

## 10. JWT KEYRING & ROTATION CONTRACT

JWT signing and verification support seamless key rotation via an explicit keyring.

### 10.1 Keyring Structure & Startup Assertions
- Environment variable `JWT_ACCESS_KEYS` is a JSON string:
  ```json
  {
    "kid_2026_v1": "4a7f9b8c2d1e0f3a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a",
    "kid_2026_v2": "8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c"
  }
  ```
- **Minimum Encoded Secret Size**: Each secret in `JWT_ACCESS_KEYS` must satisfy `Buffer.byteLength(secret, 'utf8') >= 32` (Minimum encoded secret size: 32 UTF-8 bytes). Key material below 32 UTF-8 bytes fails closed immediately.
- `JWT_ACCESS_ACTIVE_KID`: Specifies the key ID used for all new signatures.
- **Verification**:
  1. Parse header `kid`. If missing or not in `JWT_ACCESS_KEYS`, reject with HTTP 401 `INVALID_TOKEN`.
  2. Verify signature using secret matching `kid`.
- **Old-Key Retention Invariant**:
  ```text
  OLD_KEY_RETENTION_SECONDS >= ACCESS_TOKEN_TTL_SECONDS + JWT_CLOCK_TOLERANCE_SECONDS
  (960s >= 900s + 30s)
  ```
  Old keys must remain in the keyring for at least 960 seconds after retirement before deletion.

---

## 11. REFRESH TOKEN GENERATION CONTRACT

### 11.1 Cryptographic Entropy & Representation
- **Raw Token**: 32 cryptographically secure random bytes (`crypto.randomBytes(32)`), encoded as a 43-character base64url string (`base64url`).
- **Persistent Hash**: Computed as `crypto.createHash('sha256').update(rawToken).digest('hex')` (64-character hex string).
- **Persistence Rule**: Raw refresh tokens are **NEVER** stored in MongoDB, logs, or metrics. Only `tokenHash` is persisted.

---

## 12. LOGIN SESSION CREATION CONTRACT

Upon successful credential validation:
1. Generate `sessionId = 'sess_' + crypto.randomUUID()`.
2. Generate `tokenId = 'tok_' + crypto.randomUUID()`.
3. Generate raw refresh token and compute `tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex')`.
4. Calculate `expiresAt = new Date(Date.now() + SESSION_ABSOLUTE_LIFETIME_MS)`.
5. Insert new `AuthSession` record with `status: 'active'`, `sessionId`, `tokenId`, `tokenHash`, `userId: user.userId`.
6. Issue access JWT with:
   - `sub = user.userId`
   - `sid = sessionId`
   - `jti = tokenId` (AuthSession tokenId of the login refresh generation that issued that access token)
7. Set `refreshToken` HttpOnly cookie using canonical options (`getRefreshCookieOptions()`).
8. Return access token and user metadata in response body.

### 12.1 Deterministic Access JWT jti Generation Contract
- **Contract**: `Access JWT jti = AuthSession tokenId of the refresh generation that issued that access token`.
- Successful login issues:
  - `sub = user.userId`
  - `sid = sessionId`
  - `jti = tokenId` (AuthSession.tokenId for the login refresh generation)
- Successful refresh issues:
  - `sub = rotated.userId`
  - `sid = rotated.sessionId`
  - `jti = successorTokenId` (successor AuthSession.tokenId)
- Invariants:
  - Additional access-token identifier collection: **NO** (0)
  - Additional model field: **NO** (0)
  - Additional UUID solely for access JWT: **NO** (0)
  - Existing `tokenId` remains non-secret metadata and MUST NEVER be used as a credential.

---

## 13. REFRESH ROTATION & CAS ATOMIC TRANSITION

### 13.1 Compare-And-Swap (CAS) Rotation Algorithm
When a client requests token refresh via `POST /api/v1/auth/refresh`:
1. **Validate Origin**: Verify `Origin` header matches `CORS_ALLOWED_ORIGINS` (fail closed; HTTP 403 `REFRESH_ORIGIN_REQUIRED` if missing, HTTP 403 `CORS_ORIGIN_DENIED` if not allowed).
2. **Extract Cookie**: Extract `refreshToken` from cookie. Compute `presentedHash = sha256(rawToken)`.
3. **Pre-CAS Lookup & Owning User Account Status Verification**:
   - Query session record by `tokenHash`:
     ```javascript
     const sessionRecord = await AuthSession.findOne({ tokenHash: presentedHash });
     ```
   - If not found: return HTTP 401 `INVALID_REFRESH_TOKEN` (`"Refresh token is invalid or not found."`).
   - If `sessionRecord.status === 'revoked'`: return HTTP 401 `SESSION_REVOKED` (`"Session has been revoked."`).
   - If `sessionRecord.status === 'rotated'`: **TRIGGER REUSE DETECTION** (Section 14).
   - If `sessionRecord.expiresAt <= now`: return HTTP 401 `SESSION_EXPIRED` (`"Session has expired."`).
   - If `sessionRecord.status === 'active'` (and not expired):
     - Resolve the owning User:
       ```javascript
       const owningUser = await User.findOne({ userId: sessionRecord.userId }).select('userId status');
       ```
     - **Referenced User Not Found**: If owning User record does not exist in MongoDB (e.g. deleted or orphaned user), fail closed and issue zero credentials. Return HTTP 401 `INVALID_REFRESH_TOKEN`.
     - **Owning User Status Disabled (`owningUser.status === 'disabled'`)**:
       - Emit canonical audit log: `AUTH_ACCOUNT_DISABLED` (`event: 'AUTH_ACCOUNT_DISABLED'`, `reason: 'REFRESH'`) using strictly authorized bounded logger fields without unauthorized `userId` or `sessionId` fields.
       - Strict Invariants for Disabled User Refresh:
         - Successor `AuthSession` created: **NO**
         - Predecessor CAS rotation performed: **NO** (predecessor generation is not consumed, rotated, or modified)
         - New access JWT issued: **NO**
         - New refresh token issued: **NO**
         - New refresh cookie set: **NO**
         - `AUTH_ACCOUNT_DISABLED` emitted: **YES**
       - Return HTTP 403 `ACCOUNT_DISABLED` (`"Account has been disabled."`).
4. **Execute CAS Transition**:
   - For an active generation belonging to an active user, proceed to atomic CAS rotation:
     ```javascript
     const now = new Date();
     const successorTokenId = 'tok_' + crypto.randomUUID();
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
     ```
5. **Evaluate CAS Result**:
   - If `rotated` is `null`:
     - Another concurrent request transitioned or expired the token during the narrow window between pre-CAS lookup and CAS execution.
     - Re-query record by `tokenHash`:
       - If `status === 'rotated'`: **TRIGGER REUSE DETECTION** (Section 14).
       - If `status === 'revoked'`: return HTTP 401 `SESSION_REVOKED`.
       - If `expiresAt <= now`: return HTTP 401 `SESSION_EXPIRED`.
       - Otherwise return HTTP 401 `INVALID_REFRESH_TOKEN`.
   - If `rotated` succeeded:
     - Generate new raw refresh token (`crypto.randomBytes(32).toString('base64url')`) and compute `successorHash = sha256(rawToken)`.
     - Attempt to create successor record:
       ```javascript
       try {
         await AuthSession.create({
           tokenId: successorTokenId,
           sessionId: rotated.sessionId,
           userId: rotated.userId,
           tokenHash: successorHash,
           status: 'active',
           issuedAt: now,
           expiresAt: rotated.expiresAt // Retains original absolute 7-day expiration!
         });
       } catch (successorError) {
         // Execute Successor Creation Failure Protocol (Section 13.2)
         throw successorError;
       }
       ```
     - **Post-Successor Replay Reconciliation Before Credential Issuance**:
       - After inserting the successor record, but BEFORE issuing the access JWT, setting the refresh cookie, or returning the HTTP 200 response:
       - The CAS winner MUST verify that its predecessor still represents an uncompromised valid rotation:
         ```javascript
         const predecessorStillValid = await AuthSession.exists({
           tokenHash: presentedHash,
           status: 'rotated',
           replacedByTokenId: successorTokenId
         });
         ```
       - If `predecessorStillValid`:
         - Proceed with normal credential issuance:
           - Issue new access JWT with:
             - `sub = rotated.userId`
             - `sid = rotated.sessionId`
             - `jti = successorTokenId` (AuthSession tokenId of the successor refresh generation)
           - Set new refresh cookie using canonical options (`getRefreshCookieOptions()`).
           - Return `{ success: true, data: { accessToken, expiresIn: 900 } }`.
       - If `!predecessorStillValid` (because concurrent replay detection marked the predecessor `revoked` during the window between rotation and successor creation):
         - The CAS winner must fail-securely invalidate the newly created successor and abort credential issuance:
           1. Revoke the just-created successor record if still active:
              ```javascript
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
              ```
           2. Issue **NO** access JWT.
           3. Emit **NO** usable refresh cookie (clear or omit refresh cookie on response).
           4. Return HTTP 401 `REFRESH_REUSE_DETECTED`:
              ```json
              {
                "success": false,
                "error": {
                  "code": "REFRESH_REUSE_DETECTED",
                  "message": "Session family revoked due to token reuse."
                }
              }
              ```
           5. Mandatory Client Reauthentication: The client must reauthenticate via `POST /api/v1/auth/login`.
           6. Predecessor reactivation: **NEVER**. Predecessor remains permanently `revoked`.

### 13.2 Successor AuthSession Creation Failure Contract
If predecessor CAS rotation succeeds (`status` transitioned from `active` to `rotated`), but insertion of the successor `AuthSession` record fails (e.g., database timeout, duplicate key, or infrastructure error):
1. **Predecessor Remains Rotated**: Do NOT reactivate, rollback, or resurrect the predecessor record. The predecessor remains permanently `rotated`.
2. **Zero Access JWT Issuance**: Do NOT issue a new access JWT.
3. **Zero Refresh Cookie Emission**: Do NOT set a new refresh cookie. Clear or omit refresh cookie on response.
4. **Zero Raw Token Exposure**: Do NOT return or leak the raw successor refresh token in any header, body, or cookie.
5. **Zero Silent Retries**: Do NOT silently retry by resurrecting old predecessor state or suppressing the failure.
6. **Session Family State**: The predecessor remains rotated. The session family is non-refreshable unless another valid active successor already exists due to independently proven concurrent state.
7. **Mandatory Client Reauthentication**: The client must reauthenticate via `POST /api/v1/auth/login`.
8. **Canonical Generic 500 Public Error Response**: Return the canonical Phase 13 generic HTTP 500 public error contract:
   ```http
   HTTP/1.1 500 Internal Server Error
   Content-Type: application/json; charset=utf-8
   ```
   ```json
   {
     "success": false,
     "error": {
       "code": "INTERNAL_SERVER_ERROR",
       "message": "Internal Server Error"
     }
   }
   ```
9. **Structured Error Logging**: Log structured error via existing logger: `event: 'HTTP_REQUEST_ERROR'`, `component: 'http'`, `statusCode: 500`, `errorCode: 'INTERNAL_SERVER_ERROR'`, `operationalCategory: 'INFRASTRUCTURE_FAULT'`.
10. **Zero Assumed MongoDB Transactions**: Multi-document MongoDB transactions are NOT assumed or required. The protocol correctness model remains completely fail-secure without transaction dependencies.

### 13.3 Account Status Check Scope Invariant
- **Account status check on login**: **YES** (queries User and checks `status === 'active'`).
- **Account status check on refresh**: **YES** (queries User and checks `status === 'active'` before predecessor CAS rotation).
- **Account status database check on ordinary JWT business request**: **NO** (access JWT verification is 100% stateless; zero DB queries).
- Existing access JWTs issued before an account is disabled remain valid until their natural <=15-minute expiration (`ACCESS_TOKEN_TTL_SECONDS = 900`). The platform relies on the short access token lifetime without incurring per-request database lookups on business routes.
- No MongoDB transaction requirement is introduced for the refresh flow.

---

## 14. REFRESH TOKEN REUSE DETECTION & REVOCATION SCOPE

### 14.1 Reuse Detection Response
If a rotated predecessor token is presented:
1. Emit security log `AUTH_REFRESH_REUSE_DETECTED`.
2. **Durable Replay Marker on Predecessor**: Atomically transition the presented replayed predecessor record from `rotated` to `revoked`:
   ```javascript
   const replayedPredecessor = await AuthSession.findOneAndUpdate(
     {
       tokenHash: presentedHash,
       status: 'rotated'
     },
     {
       $set: {
         status: 'revoked',
         revokedAt: now
       }
     },
     {
       new: true
     }
   );
   ```
   - `rotated -> revoked` on replayed predecessor: **AUTHORIZED**
   - Purpose: Durable in-database replay/compromise marker ensuring that any concurrent CAS winner cannot finalize credential issuance if replay was observed before successor finalization.
   - Predecessor document retained until TTL: **YES**
   - Unrelated sessionId families revoked: **NO**
   - Zero new schema fields or enum values: Reuses existing `status: 'revoked'` and `revokedAt` fields. No `compromised`, `replayed`, `familyRevoked`, or other schema additions.
3. **Session-Family Active Generation Revocation**: Revoke all active generations in that SAME session family:
   ```javascript
   await AuthSession.updateMany(
     {
       sessionId: record.sessionId,
       status: 'active'
     },
     {
       $set: {
         status: 'revoked',
         revokedAt: now
       }
     }
   );
   ```
4. Clear refresh cookie on response (`clearRefreshCookie(res)`).
5. Return HTTP 401:
   ```json
   {
     "success": false,
     "error": {
       "code": "REFRESH_REUSE_DETECTED",
       "message": "Session family revoked due to token reuse."
     }
   }
   ```
6. **Isolation Invariant**: Revocation applies strictly to that specific compromised `sessionId` family. Unrelated active sessions on other devices for that user remain valid.

---

## 15. REFRESH CONCURRENCY CONTRACT

### 15.1 CAS Race Resolution & Mechanical Interleavings
The refresh protocol guarantees that concurrent requests presenting the same active refresh token result in fail-secure session family invalidation with zero credential leakage across all interleavings.

#### Case A — Replay Before Successor Creation
```text
1. Request A executes CAS rotation: predecessor transitions 'active' -> 'rotated' with replacedByTokenId = successorTokenId.
2. Request A pauses before AuthSession.create.
3. Concurrent Request B presents the same token. Pre-CAS lookup observes predecessor status === 'rotated'.
4. Request B detects replay:
   - Marks predecessor status: 'revoked'.
   - Runs updateMany({ sessionId, status: 'active' }) -> revokes 0 records (since A has not created successor yet).
   - Clears cookie and returns HTTP 401 REFRESH_REUSE_DETECTED.
5. Request A resumes:
   - Creates successor record with status: 'active'.
   - Performs Post-Successor Replay Reconciliation:
     AuthSession.exists({ tokenHash: presentedHash, status: 'rotated', replacedByTokenId: successorTokenId })
   - Check FAILS because Request B transitioned predecessor status to 'revoked'.
   - Request A immediately revokes the newly created successor.
   - Request A issues NO access JWT, emits NO refresh cookie, and returns HTTP 401 REFRESH_REUSE_DETECTED.
Final State: Zero active generations in family. Credentials issued: 0.
```

#### Case B — Replay After Successor Creation but Before Winner Finalization
```text
1. Request A executes CAS rotation: predecessor transitions 'active' -> 'rotated'.
2. Request A creates successor record with status: 'active'.
3. Request A pauses before Post-Successor Replay Reconciliation.
4. Concurrent Request B presents the same token. B observes status === 'rotated'.
5. Request B detects replay:
   - Marks predecessor status: 'revoked'.
   - Runs updateMany({ sessionId, status: 'active' }) -> revokes Request A's active successor.
   - Clears cookie and returns HTTP 401 REFRESH_REUSE_DETECTED.
6. Request A resumes:
   - Performs Post-Successor Replay Reconciliation: check fails (predecessor is 'revoked').
   - Request A revokes successor (idempotent, already revoked).
   - Request A issues NO access JWT, emits NO refresh cookie, and returns HTTP 401 REFRESH_REUSE_DETECTED.
Final State: Zero active generations in family. Credentials issued: 0.
```

#### Case C — Replay After Winner Final Check / Credential Issuance Boundary
```text
1. Request A executes CAS rotation: predecessor transitions 'active' -> 'rotated'.
2. Request A creates successor record with status: 'active'.
3. Request A performs Post-Successor Replay Reconciliation: confirms predecessor is still 'rotated'.
4. Request A issues new access JWT and sets new refresh cookie.
5. Concurrent/subsequent Request B presents the same predecessor token.
6. Request B detects replay:
   - Marks predecessor status: 'revoked'.
   - Runs updateMany({ sessionId, status: 'active' }) -> revokes Request A's active successor.
   - Clears cookie and returns HTTP 401 REFRESH_REUSE_DETECTED.
Result:
- Refresh session family: REVOKED.
- Fresh refresh cookie held by A: no longer usable (subsequent refresh attempts will observe status === 'revoked' and be rejected).
- Already-issued stateless access JWT: retains only its existing <=15-minute residual lifetime (ACCESS_TOKEN_TTL_SECONDS = 900).
- Additional DB lookup on ordinary business requests: NO (access token verification remains 100% stateless).
```

### 15.2 Concurrency Invariants
- **Same-token concurrent refresh family escapes revocation**: **0**
- **Replay detected before successor exists**: Durably remembered via predecessor `revoked` state.
- **Successor created after replay detection remains active**: **NO**
- **Successor credential issued after observed pre-finalization replay**: **NO**
- **MongoDB transactions required**: **NO** (fail-secure without multi-document transaction dependencies).
- **Grace window or reusable predecessor tokens**: **NONE** (strictly forbidden).

---

## 16. REFRESH ORIGIN CONTRACT

`POST /api/v1/auth/refresh` is a browser-cookie authentication surface.

### 16.1 Fail-Closed Origin Verification
1. `Origin` header is **MANDATORY**.
2. If `Origin` header is missing:
   - Reject immediately with HTTP 403 Forbidden:
     ```json
     {
       "success": false,
       "error": {
         "code": "REFRESH_ORIGIN_REQUIRED",
         "message": "Origin header is required for refresh token exchange."
       }
     }
     ```
3. If `Origin` header does not match any entry in `CORS_ALLOWED_ORIGINS`:
   - Reject immediately with HTTP 403 Forbidden:
     ```json
     {
       "success": false,
       "error": {
         "code": "CORS_ORIGIN_DENIED",
         "message": "Origin is not allowed."
       }
     }
     ```
4. **Invariant**: `Cookie-bearing refresh accepted without verified allowlisted Origin = 0`.

---

## 17. REFRESH COOKIE CONTRACT

### 17.1 Canonical Cookie Option Builder & Environment Posture
Creation and clearing of the `refreshToken` cookie MUST derive their cookie attributes from the same canonical cookie-options builder/configuration in `src/config/authConfig.js`:

```javascript
function getRefreshCookieOptions(overrides = {}) {
  return {
    httpOnly: true,
    sameSite: 'strict',
    path: '/api/v1/auth/refresh',
    secure: authConfig.COOKIE_SECURE, // true in production; false in explicit local non-HTTPS development
    ...overrides
  };
}
```

- **Name**: `refreshToken`
- **Path**: `/api/v1/auth/refresh`
- **HttpOnly**: `true`
- **SameSite**: `Strict`
- **Secure in production**: `true`
- **Secure in explicit local non-HTTPS development**: `false`

### 17.2 Cookie Creation & Server-Side Absolute Lifetime Authority
On initial login:
```http
Set-Cookie: refreshToken=<rawToken>; Path=/api/v1/auth/refresh; HttpOnly; SameSite=Strict; Secure=<environment-resolved>; Max-Age=604800
```
On refresh, the browser cookie is emitted with the new raw successor refresh token.
- **Authoritative Server-Side Lifetime Invariant**:
  - Client-side cookie `Max-Age` (or remaining time) MUST NOT alter or override the authoritative server-side `AuthSession.expiresAt`.
  - Refresh rotation inherits predecessor `expiresAt` (`expiresAt: rotated.expiresAt`) and NEVER extends the 7-day absolute session family lifetime (`SESSION_ABSOLUTE_LIFETIME_MS = 604800000`).
  - Refresh cookie lifetime does not claim authority beyond the remaining absolute family lifetime.
  - `Secure` attribute is emitted in production environments where `COOKIE_SECURE === true`, and omitted in explicit local non-HTTPS development environments where `COOKIE_SECURE === false`.

### 17.3 Clearing Scope & Attribute Parity
`POST /api/v1/auth/logout` and `POST /api/v1/auth/revoke-all` clear the cookie using the **exact same environment-resolved values** as creation via the shared options builder:
```javascript
res.clearCookie('refreshToken', getRefreshCookieOptions());
```
Represented over HTTP as:
```http
Set-Cookie: refreshToken=; Path=/api/v1/auth/refresh; HttpOnly; SameSite=Strict; Secure=<same environment-resolved value used at creation>; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Max-Age=0
```
- In production: includes `Secure;`.
- In explicit local non-HTTPS development: `Secure` is omitted for both creation and clearing.
- Unconditional hardcoding of `Secure=true` for local non-HTTPS development is strictly prohibited.
- Tests prove creation and clearing attributes remain 100% environment-consistent.

---

## 18. AUTH SERVICE CONTRACT (`src/services/authService.js`)

Public methods and signatures:

```javascript
class AuthService {
  async register({ name, email, password });
  async login({ email, password });
  async refresh({ rawRefreshToken, origin });
  async logout({ sessionId });
  async revokeAll({ userId });
  async getPrincipal({ userId });
}
```

Every method enforces:
- Zero execution identity derived from caller input.
- Zero sensitive data returned in DTOs.
- Structured security log emissions for every success/failure outcome.

---

## 19. AUTH HTTP ROUTES (`src/routes/authRoutes.js`)

Phase 14 defines exactly 6 routes:

```javascript
router.post('/register', authRateLimiter, authController.register);
router.post('/login', authRateLimiter, authController.login);
router.post('/refresh', refreshRateLimiter, authController.refresh);
router.post('/logout', authenticate, authController.logout);
router.post('/revoke-all', authenticate, authController.revokeAll);
router.get('/me', authenticate, authController.getMe);
```

---

## 20. REGISTRATION CONTRACT (`POST /api/v1/auth/register`)

- **Input Body**:
  ```json
  {
    "name": "Alex Student",
    "email": "alex@example.com",
    "password": "Correct-Horse-Battery-Staple-2026!"
  }
  ```
- **Registration Input & Unauthorized Extra-Field Handling**:
  - Registration payload accepts strictly: `name`, `email`, `password`.
  - Unauthorized additional fields (e.g. `userId`, `role`, `status`, `passwordHash`, `isVerified`, `admin`) are stripped/ignored:
    - Execution identity effect: **NONE**
    - Persistence effect: **NONE**
    - Server-generated `userId = 'usr_' + crypto.randomUUID()` remains strictly authoritative.
  - Scalar validation for `name`, `email`, and `password` is strictly enforced.
  - NoSQL operator injection payloads (e.g. `{ $gt: '' }`, `{ $ne: null }`) are rejected with HTTP 400 `INVALID_PAYLOAD`.
- **Email Canonicalization**: `email.trim().toLowerCase()`.
- **Duplicate Email**: Returns HTTP 409 `EMAIL_ALREADY_REGISTERED`.
- **Blocklisted Password**: Returns HTTP 400 `PASSWORD_BLOCKLISTED`.
- **Success DTO**:
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "userId": "usr_...",
        "name": "Alex Student",
        "email": "alex@example.com"
      }
    }
  }
  ```

---

## 21. LOGIN CONTRACT (`POST /api/v1/auth/login`)

- **Input Body**: `{ "email": "...", "password": "..." }`.
- **Email Canonicalization**: `email.trim().toLowerCase()`.
- **Explicit User Query & passwordHash Selection**:
  - Because `User.passwordHash` is configured with `select: false` to guarantee omission from default queries, the login implementation MUST explicitly retrieve the password hash:
    ```javascript
    const user = await User.findOne({
      email: canonicalEmail
    }).select('+passwordHash userId name email status');
    ```
  - An equivalent implementation is authorized only if it mechanically guarantees `passwordHash` is available to the login credential verifier while remaining excluded from all ordinary/default User queries.
  - **Invariants**:
    - `passwordHash` selected during login credential verification: **YES**
    - `passwordHash` returned in login DTO: **NO**
    - `passwordHash` logged: **NO**
    - `passwordHash` returned by `/me`: **NO**
    - `passwordHash` used by ordinary business controllers: **NO**
- **Unknown User, Missing passwordHash & Timing-Safe Verification**:
  - **Unknown Email**: If `user` is not found, execute dummy scrypt timing path (`verifyPassword(password, DUMMY_PASSWORD_HASH)`) to equalize timing and return HTTP 401 `INVALID_CREDENTIALS` (`"Invalid email or password."`).
  - **Legacy User Lacking passwordHash**: If user exists but `!user.passwordHash`, execute dummy scrypt timing path (`verifyPassword(password, DUMMY_PASSWORD_HASH)`) and return HTTP 401 `INVALID_CREDENTIALS` (`"Invalid email or password."`).
  - **Wrong Password**: If `verifyPassword(password, user.passwordHash)` fails, return HTTP 401 `INVALID_CREDENTIALS` (`"Invalid email or password."`).
  - Account-enumeration timing defenses remain strictly preserved.
- **Account Status Verification**:
  - If credentials are valid, but `user.status === 'disabled'`:
    - Emit canonical audit log: `AUTH_ACCOUNT_DISABLED` (`event: 'AUTH_ACCOUNT_DISABLED'`, `reason: 'LOGIN'`) using strictly authorized bounded logger fields without unauthorized `userId` or `sessionId` fields.
    - Successor `AuthSession` created: **NO**
    - New access JWT issued: **NO**
    - New refresh cookie set: **NO**
    - Return HTTP 403 `ACCOUNT_DISABLED` (`"Account has been disabled."`).
- **Session Creation & Access Token Issuance**:
  - Generate `sessionId = 'sess_' + crypto.randomUUID()`.
  - Generate `tokenId = 'tok_' + crypto.randomUUID()`.
  - Compute `tokenHash = sha256(rawRefreshToken)`.
  - Create active `AuthSession` record.
  - Issue access JWT with:
    - `sub = user.userId`
    - `sid = sessionId`
    - `jti = tokenId` (AuthSession tokenId of the login refresh generation)
  - Set `refreshToken` cookie using canonical `getRefreshCookieOptions()`.
- **Success DTO**:
  ```json
  {
    "success": true,
    "data": {
      "accessToken": "<jwt>",
      "expiresIn": 900,
      "user": {
        "userId": "usr_...",
        "name": "Alex Student",
        "email": "alex@example.com"
      }
    }
  }
  ```

---

## 22. LOGOUT CONTRACT (`POST /api/v1/auth/logout`)

- Requires valid access JWT (`authenticate`).
- Authoritative target: `req.user.sessionId`.
- Marks active generation for `req.user.sessionId` as `status = 'revoked'`, `revokedAt = new Date()`.
- Clears `refreshToken` cookie.
- Returns `{ "success": true, "data": { "message": "Successfully logged out." } }`.
- *Truthful Revocation*: Access JWT remains valid until its natural 15-minute expiration.

---

## 23. REVOKE-ALL CONTRACT (`POST /api/v1/auth/revoke-all`)

- Requires valid access JWT (`authenticate`).
- Authoritative target: `req.user.userId`.
- Revokes all active sessions for that user across all devices:
  ```javascript
  await AuthSession.updateMany(
    { userId: req.user.userId, status: 'active' },
    { $set: { status: 'revoked', revokedAt: new Date() } }
  );
  ```
- Clears current browser refresh cookie.
- Returns `{ "success": true, "data": { "message": "All active sessions revoked." } }`.

---

## 24. `/me` CONTRACT (`GET /api/v1/auth/me`)

- Requires valid access JWT (`authenticate`).
- Reads user profile from database: `User.findOne({ userId: req.user.userId }).select('userId name email avatar createdAt')`.
- Returns:
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "userId": "usr_...",
        "name": "...",
        "email": "...",
        "avatar": null,
        "createdAt": "..."
      },
      "session": {
        "sessionId": "sess_...",
        "issuedAt": 1728662400,
        "expiresAt": 1728663300
      }
    }
  }
  ```

---

## 25. AUTHENTICATE MIDDLEWARE CONTRACT (`src/middleware/authenticate.js`)

### 25.1 Token Verification, Structural Claim Validation & Identity Extraction
1. **Extract Authorization Header**:
   - Requires `Authorization: Bearer <token>`.
   - Missing or malformed header -> HTTP 401 `UNAUTHORIZED` (`"Authentication is required to access this resource."`).
2. **Decode Header & Resolve Keyring**:
   - Decodes JWT header.
   - Asserts `header.alg === 'HS256'`. If not `HS256` -> HTTP 401 `INVALID_TOKEN` (`"Access token is invalid or malformed."`).
   - Asserts `header.kid` is present and resolves key from `JWT_ACCESS_KEYS[header.kid]`. If missing or unknown -> HTTP 401 `INVALID_TOKEN`.
3. **Cryptographic Verification & Skew Tolerance**:
   - Verifies HMAC-SHA256 signature using the resolved secret.
   - Evaluates expiration with 30s clock skew tolerance (`JWT_CLOCK_TOLERANCE_SECONDS = 30`).
   - Expired token outside tolerance -> HTTP 401 `TOKEN_EXPIRED` (`"Access token has expired."`).
   - Invalid signature -> HTTP 401 `INVALID_TOKEN`.
4. **Mandatory Structural Claim Validation**:
   - `authenticate` MUST NOT merely copy arbitrary decoded claims into `req.user`. It MUST structurally validate all canonical claims:
     - `typeof decoded.sub === 'string' && decoded.sub.length > 0` (legacy user IDs without `usr_` prefix remain valid)
     - `typeof decoded.sid === 'string' && decoded.sid.length > 0`
     - `typeof decoded.jti === 'string' && decoded.jti.length > 0`
     - `typeof decoded.iat === 'number' && Number.isFinite(decoded.iat)`
     - `typeof decoded.exp === 'number' && Number.isFinite(decoded.exp)`
     - `decoded.iss === 'aptitude-platform'`
     - `decoded.aud === 'aptitude-learning-api'`
   - Missing, wrong-type, empty, or otherwise malformed mandatory principal claims MUST produce HTTP 401 `INVALID_TOKEN` (`"Access token is invalid or malformed."`).
   - Forbidden claims (roles, email, account status, tokenHash, refresh credentials) must NOT be introduced or relied upon.
5. **Populate `req.user`**:
   ```javascript
   req.user = {
     userId: decoded.sub,
     sessionId: decoded.sid,
     accessTokenId: decoded.jti,
     issuedAt: decoded.iat,
     expiresAt: decoded.exp
   };
   ```
6. **Zero Database Lookups**:
   - Access JWT authentication MongoDB queries: **0**
   - AuthSession queries on ordinary business requests: **0**
   - User status DB queries on ordinary business requests: **0**
   - Access token verification is 100% stateless in-memory.
7. **Context Preservation**:
   - Does **NOT** mutate Phase 13 `requestContext` (AsyncLocalStorage).

### 25.2 Tombstone Route Bypass Contract
`authenticate` is the authoritative `/api/v1` router boundary for all business routes, but explicitly bypasses authentication ONLY for the two frozen non-operational tombstone surfaces:
1. `POST /api/v1/users`
2. `POST /api/v1/mock-blueprints`

Bypass Matching Rules:
- The bypass requires exact method + exact normalized path matching (`req.method === 'POST' && path === '/api/v1/users'` or `req.method === 'POST' && path === '/api/v1/mock-blueprints'`).
- The bypass is strictly non-prefix and non-wildcard.
- No other business endpoint is exempt from authentication.

Pipeline Execution Invariant:
These bypassed requests proceed directly to their deterministic frozen handlers:
- `POST /api/v1/users` -> HTTP 410 `USER_CREATION_ENDPOINT_DEPRECATED` (anonymous callers receive 410, authenticated callers receive 410; neither receives 401).
- `POST /api/v1/mock-blueprints` -> HTTP 403 `BLUEPRINT_MUTATION_CLOSED` (anonymous callers receive 403, authenticated learner callers receive 403; neither receives 401).

---

## 26. AUTHORIZE MIDDLEWARE & UNIVERSAL PRINCIPAL USER-ID GUARD (`src/middleware/authorize.js`)

`src/middleware/authorize.js` provides authoritative route-boundary and controller-level security guards preventing Broken Object Level Authorization (BOLA/IDOR) and direct identity spoofing.

### 26.1 Authoritative Identity-Mismatch Rules & Universal Semantics
For ANY authenticated business request across the entire API (all 74 protected business endpoints):
- **CLIENT USER ID ABSENT**: Allowed. Execution identity = `req.user.userId`.
- **CLIENT USER ID PRESENT AND EQUAL TO req.user.userId**: Allowed. Execution identity = `req.user.userId`.
- **CLIENT USER ID PRESENT AND DIFFERENT FROM req.user.userId**: HTTP 403 `IDENTITY_MISMATCH`. Controller/service MUST NOT execute.
- **NEVER TRUST CLIENT-SUPPLIED IDENTITY**: The client-supplied value MUST NEVER simply be trusted, silently substituted, or treated as execution identity. Execution identity is ALWAYS `req.user.userId` exclusively.
- **UNIVERSAL COVERAGE & ZERO BYPASS**: A caller must NOT be able to bypass identity mismatch checking merely because an endpoint does not normally consume or require `userId`. If an authenticated request provides a mismatching `userId` in query, body, or params, it fails closed immediately with HTTP 403 `IDENTITY_MISMATCH`. Examples of enforced caller identity mismatch:
  - `GET /api/v1/questions/topics?userId=victim` -> HTTP 403 `IDENTITY_MISMATCH`
  - `POST /api/v1/mock-blueprints/preview` with `body.userId = victim` -> HTTP 403 `IDENTITY_MISMATCH`
  - `GET /api/v1/mock-sessions/:id?userId=victim` -> HTTP 403 `IDENTITY_MISMATCH`
  - Client-supplied mismatching `userId` silently ignored = **0**.

### 26.2 Exact Error Distinction
1. **Direct Caller Identity Mismatch (`IDENTITY_MISMATCH`)**:
   Emitted when client-supplied `userId` in `req.params`, `req.query`, or `req.body` does not match authenticated token subject `req.user.userId`:
   ```http
   HTTP/1.1 403 Forbidden
   Content-Type: application/json; charset=utf-8
   ```
   ```json
   {
     "success": false,
     "error": {
       "code": "IDENTITY_MISMATCH",
       "message": "Caller identity does not match token subject."
     }
   }
   ```
2. **Resource Document Ownership Failure (`OWNERSHIP_VIOLATION`)**:
   Reserved strictly for resource-document ownership failures where a student attempts to access or mutate an existing document owned by another student:
   - `goal.userId !== req.user.userId`
   - `plan.userId !== req.user.userId`
   - `attempt.userId !== req.user.userId`
   - `session.userId !== req.user.userId`
   - `prescription.userId !== req.user.userId`
   - `item.userId !== req.user.userId`
   - `objective.userId !== req.user.userId`
   ```http
   HTTP/1.1 403 Forbidden
   Content-Type: application/json; charset=utf-8
   ```
   ```json
   {
     "success": false,
     "error": {
       "code": "OWNERSHIP_VIOLATION",
       "message": "Access denied: caller does not own this resource."
     }
   }
   ```

### 26.3 Universal Guard Mounting Split (Body/Query Boundary vs Route Params)
Because application-level middleware executes before route parameter extraction in Express mounting arrangements, the specification freezes an explicit two-tier mounting architecture:

#### 26.3.1 Body + Query Boundary Guard Mounting (Frozen Step 13 First Operation)
- Mounted in `src/app.js` strictly following the frozen 15-stage middleware pipeline sequence:
  ```javascript
  // Frozen Step 11: Authenticate Boundary (establishes req.user)
  app.use('/api/v1', authenticate);

  // Frozen Step 12: Tier-4 Authenticated LLM Rate Limiter (for learning routes, keyed by req.user.userId)
  app.use('/api/v1/learning', llmRateLimiter);

  // Frozen Step 13 begins: Universal Body/Query Principal Guard
  app.use('/api/v1', enforcePrincipalUserIdBodyQuery);

  // Protected business routers follow
  app.use('/api/v1/users', userRoutes);
  app.use('/api/v1/goals', goalRoutes);
  app.use('/api/v1/study-plans', studyPlanRoutes);
  app.use('/api/v1/daily-objectives', dailyObjectiveRoutes);
  app.use('/api/v1/attempts', attemptRoutes);
  app.use('/api/v1/progress', progressRoutes);
  app.use('/api/v1/adaptive', adaptiveRoutes);
  app.use('/api/v1/questions', questionRoutes);
  app.use('/api/v1/planning', planningRoutes);
  app.use('/api/v1/revisions', revisionRoutes);
  app.use('/api/v1/mock-blueprints', mockBlueprintRoutes);
  app.use('/api/v1/mock-sessions', mockSessionRoutes);
  app.use('/api/v1/learning', learningRoutes);
  app.use('/api/v1/analytics', analyticsRoutes);
  app.use('/api/v1/orchestration', orchestrationRoutes);
  app.use('/api/v1/attribution', attributionRoutes);
  ```
- **Observable Execution Ordering**:
  - For learning requests (`/api/v1/learning/*`):
    `authenticate -> llmRateLimiter -> enforcePrincipalUserIdBodyQuery -> learning router -> controller`
  - For non-learning business requests (`/api/v1/*`):
    `authenticate -> enforcePrincipalUserIdBodyQuery -> business router -> controller`
- **Ordering Invariants**:
  - Universal body/query guard before Tier-4 limiter: **NO**.
  - Universal body/query guard after Tier-4 limiter: **YES**.
  - Universal body/query guard before business controller execution: **YES**.
  - Tier-4 LLM rate limiter executes only after `authenticate` establishes `req.user.userId`.
  - Zero duplicate Tier-4 limiters: the limiter is mounted at pipeline Step 12 and not reintroduced in routers or controllers.
  - Zero 16th middleware stage: `enforcePrincipalUserIdBodyQuery` is the first authorization operation inside frozen Step 13.
- Evaluates:
  ```text
  req.body.userId
  req.query.userId
  ```
- Protects **100%** of all 74 protected authenticated business routes against injected query or body `userId` mismatches before sub-routers or controllers execute.
- Coverage: **74 / 74 (100%)**.

#### 26.3.2 Route Parameter Guard (100% Coverage of `:userId` Parameter Routes)
- Every route containing an actual `:userId` parameter mounts `enforcePrincipalUserId` after route parameter parsing within its respective router definition file:
  - `userRoutes.js`: `GET /users/:userId`
  - `goalRoutes.js`: `GET /goals/user/:userId`
  - `studyPlanRoutes.js`: `GET /study-plans/user/:userId`
  - `dailyObjectiveRoutes.js`: `GET /daily-objectives/user/:userId`
  - `attemptRoutes.js`: `GET /attempts/user/:userId`
  - `progressRoutes.js`: `GET /progress/:userId*` (all 7 methods)
  - `revisionRoutes.js`: `GET /revisions/user/:userId`
  - `attributionRoutes.js`: `GET /attribution/users/:userId/summary`
- Evaluates:
  ```text
  req.params.userId
  ```
- Protects **100%** of all 14 `:userId` parameter routes against route parameter mismatches.
- Coverage: **14 / 14 (100%)**.

#### 26.3.3 Exempt Surfaces & Deterministic Tombstone Handling (Exactly 12 Routes)
Tombstone, authentication, and operational public routes are excluded from principal user-id mismatch checking strictly according to their frozen contracts:
- **Operational Public Probes (4 routes)**:
  - `GET /health`, `GET /health/live`, `GET /health/ready` (Bypass CORS, rate limiters, auth)
  - `GET /metrics` (Protected by scrape secret gate; bypasses user auth and principal guard)
- **Authentication Endpoints (6 routes)**:
  - `POST /api/v1/auth/register`, `POST /api/v1/auth/login`, `POST /api/v1/auth/refresh`, `POST /api/v1/auth/logout`, `POST /api/v1/auth/revoke-all`, `GET /api/v1/auth/me` (Handled by `authRoutes.js` at Step 10 before business boundary)
- **Tombstone Endpoints (2 routes)**:
  - `POST /api/v1/users` (HTTP 410 `USER_CREATION_ENDPOINT_DEPRECATED`)
  - `POST /api/v1/mock-blueprints` (HTTP 403 `BLUEPRINT_MUTATION_CLOSED`)
- **Tombstone Guard Bypass Invariant**:
  - The two tombstone endpoints deliberately bypass authentication and return their frozen responses for both anonymous and authenticated callers:
    - Anonymous `POST /api/v1/users` -> HTTP 410 `USER_CREATION_ENDPOINT_DEPRECATED`
    - Authenticated `POST /api/v1/users` -> HTTP 410 `USER_CREATION_ENDPOINT_DEPRECATED`
    - Anonymous `POST /api/v1/mock-blueprints` -> HTTP 403 `BLUEPRINT_MUTATION_CLOSED`
    - Authenticated `POST /api/v1/mock-blueprints` -> HTTP 403 `BLUEPRINT_MUTATION_CLOSED`
  - The universal body/query guard MUST NOT turn these into 401, 500, or `IDENTITY_MISMATCH`.
  - Deterministic mechanism: `enforcePrincipalUserIdBodyQuery` performs an exact method+path bypass for ONLY the two tombstone surfaces (`POST /api/v1/users` and `POST /api/v1/mock-blueprints`).
  - No prefix matching.
  - No wildcard matching.
  - Zero other business route bypass.
  - Broad bypass on `!req.user` is **STRICTLY FORBIDDEN** because that would mask authentication failures on protected routes.
  - For every non-tombstone business request reaching `enforcePrincipalUserIdBodyQuery`, `req.user` MUST already exist.
- Total Exempt Routes: **12**.
- Broadening authentication or identity exemptions: **0**.

### 26.4 Universal Implementation-Addressable Guards (`src/middleware/authorize.js`)
`src/middleware/authorize.js` exports the authoritative caller identity validation middleware:

```javascript
/**
 * Universal Body/Query Principal Guard (Mounted at Step 13a in src/app.js)
 *
 * Enforces that any client-supplied userId in body or query matches req.user.userId
 * across all 74 protected business routes.
 *
 * Invariants:
 * - Exact method+path bypass for ONLY the two frozen tombstone endpoints:
 *   - POST /api/v1/users
 *   - POST /api/v1/mock-blueprints
 *   (Zero prefix matching, zero wildcard matching, zero other bypasses).
 * - For all non-tombstone business requests reaching this guard, req.user MUST already exist.
 *   Broad bypass on !req.user is STRICTLY FORBIDDEN.
 * - Client body/query userId absent: allowed. Execution identity = req.user.userId.
 * - Client body/query userId matching req.user.userId: allowed. Execution identity = req.user.userId.
 * - Client body/query userId mismatching req.user.userId: HTTP 403 IDENTITY_MISMATCH.
 */
function enforcePrincipalUserIdBodyQuery(req, res, next) {
  // Exact method + path bypass for tombstone routes ONLY
  const isTombstone =
    (req.method === 'POST' && (req.originalUrl === '/api/v1/users' || req.baseUrl + req.path === '/api/v1/users')) ||
    (req.method === 'POST' && (req.originalUrl === '/api/v1/mock-blueprints' || req.baseUrl + req.path === '/api/v1/mock-blueprints'));

  if (isTombstone) {
    return next();
  }

  // Fail-closed assertion: req.user must exist on all protected business routes
  if (!req.user || !req.user.userId) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authorization header is required.'
      }
    });
  }

  const suppliedUserIds = [
    req.query?.userId,
    req.body?.userId
  ].filter(value => value !== undefined);

  for (const suppliedUserId of suppliedUserIds) {
    if (typeof suppliedUserId !== 'string' || suppliedUserId !== req.user.userId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'IDENTITY_MISMATCH',
          message: 'Caller identity does not match token subject.'
        }
      });
    }
  }

  next();
}

/**
 * Route-Level Principal Guard (Mounted in routers on routes with :userId parameters)
 *
 * Enforces that any client-supplied userId in req.params (or query/body)
 * matches the authenticated principal (req.user.userId).
 */
function enforcePrincipalUserId(req, res, next) {
  const suppliedUserIds = [
    req.params?.userId,
    req.query?.userId,
    req.body?.userId
  ].filter(value => value !== undefined);

  for (const suppliedUserId of suppliedUserIds) {
    if (typeof suppliedUserId !== 'string' || suppliedUserId !== req.user.userId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'IDENTITY_MISMATCH',
          message: 'Caller identity does not match token subject.'
        }
      });
    }
  }

  next();
}
```

### 26.5 Resource Document Ownership Helpers
```javascript
// Document Ownership Verification Helpers
// Returns HTTP 403 OWNERSHIP_VIOLATION if document.userId !== req.user.userId
async function verifyGoalOwnership(goalId, userId);
async function verifyPlanOwnership(planId, userId);
async function verifyAttemptOwnership(attemptId, userId);
async function verifyMockSessionOwnership(sessionId, userId);
async function verifyDailyObjectiveOwnership(objectiveId, userId);
async function verifyPrescriptionOwnership(prescriptionId, userId);
```

---

## 27. AUTHORITATIVE IDENTITY MIGRATION THROUGH CONTROLLERS

Exact before-and-after specification for all 15 controllers.
For each:
1. Detect supplied `userId` in `req.params`, `req.query`, or `req.body` if present.
2. Reject mismatch with HTTP 403 `IDENTITY_MISMATCH` (`"Caller identity does not match token subject."`).
3. Never use client-supplied `userId` as execution identity.
4. Pass `req.user.userId` to controllers, services, and engines.
5. Apply independent document ownership verification (`403 OWNERSHIP_VIOLATION`) where required.

| Controller & Method | Before (Unsafe Input) | Phase 14 Authoritative Source | Ownership & Behavior Enforcement |
|---|---|---|---|
| `userController.getUser` | `req.params.userId` | `req.user.userId` | Enforce `req.params.userId === req.user.userId` via `enforcePrincipalUserId` (403 `IDENTITY_MISMATCH` on mismatch) |
| `userController.createUser` | `req.body.userId` | N/A | Return HTTP 410 `USER_CREATION_ENDPOINT_DEPRECATED` |
| `goalController.createGoal` | `req.body.userId` | `req.user.userId` | Validate supplied `body.userId` matches `req.user.userId` (403 `IDENTITY_MISMATCH` on mismatch); bind goal owner to `req.user.userId` |
| `goalController.getGoalsByUser` | `req.params.userId` | `req.user.userId` | Enforce `req.params.userId === req.user.userId` via `enforcePrincipalUserId` (403 `IDENTITY_MISMATCH` on mismatch) |
| `goalController.getGoal` | Direct DB lookup | `req.user.userId` | Verify `goal.userId === req.user.userId` (403 `OWNERSHIP_VIOLATION` on mismatch) |
| `goalController.updateGoal` | Direct DB lookup | `req.user.userId` | Validate supplied `body.userId` (403 `IDENTITY_MISMATCH`); verify `goal.userId === req.user.userId` (403 `OWNERSHIP_VIOLATION`) |
| `goalController.deleteGoal` | Direct DB lookup | `req.user.userId` | Verify `goal.userId === req.user.userId` (403 `OWNERSHIP_VIOLATION` on mismatch) |
| `studyPlanController.createStudyPlan` | `req.body.userId` | `req.user.userId` | Validate supplied `body.userId` matches `req.user.userId` (403 `IDENTITY_MISMATCH` on mismatch); bind plan owner to `req.user.userId` |
| `studyPlanController.getStudyPlansByUser` | `req.params.userId` | `req.user.userId` | Enforce `req.params.userId === req.user.userId` via `enforcePrincipalUserId` (403 `IDENTITY_MISMATCH` on mismatch) |
| `studyPlanController.getStudyPlan` | Direct DB lookup | `req.user.userId` | Verify `plan.userId === req.user.userId` (403 `OWNERSHIP_VIOLATION` on mismatch) |
| `studyPlanController.updateStudyPlan` | Direct DB lookup | `req.user.userId` | Validate supplied `body.userId` (403 `IDENTITY_MISMATCH`); verify `plan.userId === req.user.userId` (403 `OWNERSHIP_VIOLATION`) |
| `studyPlanController.deleteStudyPlan` | Direct DB lookup | `req.user.userId` | Verify `plan.userId === req.user.userId` (403 `OWNERSHIP_VIOLATION` on mismatch) |
| `dailyObjectiveController.createDailyObjective` | `req.body.userId` | `req.user.userId` | Validate supplied `body.userId` matches `req.user.userId` (403 `IDENTITY_MISMATCH` on mismatch); bind objective owner to `req.user.userId` |
| `dailyObjectiveController.getDailyObjectivesByUser` | `req.params.userId` | `req.user.userId` | Enforce `req.params.userId === req.user.userId` via `enforcePrincipalUserId` (403 `IDENTITY_MISMATCH` on mismatch) |
| `dailyObjectiveController.getDailyObjective` | Direct DB lookup | `req.user.userId` | Verify `obj.userId === req.user.userId` (403 `OWNERSHIP_VIOLATION` on mismatch) |
| `dailyObjectiveController.updateDailyObjective` | `req.body.userId` | `req.user.userId` | Validate supplied `body.userId` (403 `IDENTITY_MISMATCH`); verify `obj.userId === req.user.userId` (403 `OWNERSHIP_VIOLATION`) |
| `dailyObjectiveController.deleteDailyObjective` | `req.body.userId` | `req.user.userId` | Validate supplied `body.userId` (403 `IDENTITY_MISMATCH`); verify `obj.userId === req.user.userId` (403 `OWNERSHIP_VIOLATION`) |
| `attemptController.createAttempt` | `req.body.userId` | `req.user.userId` | Validate supplied `body.userId` matches `req.user.userId` (403 `IDENTITY_MISMATCH` on mismatch); bind attempt owner to `req.user.userId` |
| `attemptController.getAttemptsByUser` | `req.params.userId` | `req.user.userId` | Enforce `req.params.userId === req.user.userId` via `enforcePrincipalUserId` (403 `IDENTITY_MISMATCH` on mismatch) |
| `attemptController.getAttempt` | Direct DB lookup | `req.user.userId` | Verify `attempt.userId === req.user.userId` (403 `OWNERSHIP_VIOLATION` on mismatch) |
| `studentProgressController.*` (all 7 methods) | `req.params.userId` | `req.user.userId` | Enforce `req.params.userId === req.user.userId` via `enforcePrincipalUserId` (403 `IDENTITY_MISMATCH` on mismatch) |
| `adaptiveController.getNextQuestion` | `req.query.userId` | `req.user.userId` | Validate supplied `query.userId` matches `req.user.userId` (403 `IDENTITY_MISMATCH` on mismatch); pass `req.user.userId` to adaptive engine |
| `planningController.preview` / `generate` | `req.body.userId` | `req.user.userId` | Validate supplied `body.userId` matches `req.user.userId` (403 `IDENTITY_MISMATCH` on mismatch); pass `req.user.userId` to planning engine |
| `planningController.replan` / `getSchedule` | `req.body.userId` / `req.query.userId` | `req.user.userId` | Validate supplied `userId` (403 `IDENTITY_MISMATCH`); verify `plan.userId === req.user.userId` (403 `OWNERSHIP_VIOLATION`); pass `req.user.userId` |
| `revisionController.getDue` / `getPlan` | `req.query.userId` | `req.user.userId` | Validate supplied `query.userId` matches `req.user.userId` (403 `IDENTITY_MISMATCH` on mismatch); pass `req.user.userId` to revision service |
| `revisionController.getByUser` | `req.params.userId` | `req.user.userId` | Enforce `req.params.userId === req.user.userId` via `enforcePrincipalUserId` (403 `IDENTITY_MISMATCH` on mismatch) |
| `revisionController.getById` | Direct DB lookup | `req.user.userId` | Verify `item.userId === req.user.userId` (403 `OWNERSHIP_VIOLATION` on mismatch) |
| `revisionController.rebuildState` | `req.body.userId` | `req.user.userId` | Validate supplied `body.userId` matches `req.user.userId` (403 `IDENTITY_MISMATCH` on mismatch); pass `req.user.userId` to rebuild engine |
| `mockBlueprintController.createBlueprint` | Open | N/A | Return HTTP 403 `BLUEPRINT_MUTATION_CLOSED` |
| `mockSessionController.createSession` | `extractUserId(req)` | `req.user.userId` | Validate supplied `body.userId` matches `req.user.userId` (403 `IDENTITY_MISMATCH` on mismatch); eliminate `extractUserId`; bind session to `req.user.userId` |
| `mockSessionController.*` (progression methods) | `extractUserId(req)` | `req.user.userId` | Validate supplied `body.userId` (403 `IDENTITY_MISMATCH`); verify `session.userId === req.user.userId` (403 `OWNERSHIP_VIOLATION`) |
| `learningController.*` (all 6 methods) | `req.body.userId` | `req.user.userId` | Validate supplied `body.userId` matches `req.user.userId` (403 `IDENTITY_MISMATCH` on mismatch); pass `req.user.userId` to LLM engine |
| `analyticsController.*` (dashboard, cognitive, retention) | `req.query.userId` / `req.body.userId` | `req.user.userId` | Validate supplied `userId` matches `req.user.userId` (403 `IDENTITY_MISMATCH` on mismatch); pass `req.user.userId` to analytics engine |
| `analyticsController.getReadiness` | `req.query.userId` / `req.params.goalId` | `req.user.userId` | Validate supplied `query.userId` (403 `IDENTITY_MISMATCH`); verify `goal.userId === req.user.userId` (403 `OWNERSHIP_VIOLATION`) |
| `orchestrationController.*` (all 3 methods) | `req.query.userId` | `req.user.userId` | Validate supplied `query.userId` matches `req.user.userId` (403 `IDENTITY_MISMATCH` on mismatch); pass `req.user.userId` to orchestration engine |
| `attributionController.issuePrescription` | `req.body.userId` | `req.user.userId` | Validate supplied `body.userId` matches `req.user.userId` (403 `IDENTITY_MISMATCH` on mismatch); bind prescription to `req.user.userId` |
| `attributionController.activatePrescription` | `req.body.userId` | `req.user.userId` | Validate supplied `body.userId` (403 `IDENTITY_MISMATCH`); verify `prescription.userId === req.user.userId` (403 `OWNERSHIP_VIOLATION`) |
| `attributionController.completePrescription` | `req.body.userId` | `req.user.userId` | Validate supplied `body.userId` (403 `IDENTITY_MISMATCH`); verify `prescription.userId === req.user.userId` (403 `OWNERSHIP_VIOLATION`) |
| `attributionController.getSummary` | `req.params.userId` | `req.user.userId` | Enforce `req.params.userId === req.user.userId` via `enforcePrincipalUserId` (403 `IDENTITY_MISMATCH` on mismatch) |

---

## 28. EXACT 86-ROUTE INVENTORY & PROTECTION MATRIX

Mechanically verified across all application routes. Total existing: 80. Total new: 6. Total projected: 86. Unclassified: 0.

| # | Lifecycle | Method | Path | Handler | Protection Class | Identity Source | Ownership Rule | Rate Limit Tier | Expected Unauthorized | Expected Mismatch |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | EXISTING | GET | `/health` | Inline | `PUBLIC` | None | None | None | 200 | N/A |
| 2 | EXISTING | GET | `/health/live` | `healthService.evaluateLiveness` | `PUBLIC` | None | None | None | 200 | N/A |
| 3 | EXISTING | GET | `/health/ready` | `healthService.evaluateReadiness` | `PUBLIC` | None | None | None | 200/503 | N/A |
| 4 | EXISTING | GET | `/metrics` | Inline | `PROTECTED-PROBE` | Scrape Secret | Scrape Match | None | 401 | N/A |
| 5 | PHASE14_NEW | POST | `/api/v1/auth/register` | `authController.register` | `PUBLIC` | Server UUID | N/A | Tier 2 (Auth) | N/A (Public) | 400/409 |
| 6 | PHASE14_NEW | POST | `/api/v1/auth/login` | `authController.login` | `PUBLIC` | Credential | N/A | Tier 2 (Auth) | 401 | 403 (Disabled)|
| 7 | PHASE14_NEW | POST | `/api/v1/auth/refresh` | `authController.refresh` | `PUBLIC-COOKIE` | Cookie Hash | Valid Session | Tier 3 (Refresh)| 401 | 403 (Origin) |
| 8 | PHASE14_NEW | POST | `/api/v1/auth/logout` | `authController.logout` | `AUTHENTICATED` | `req.user.sessionId` | Session Owner | Global API | 401 | N/A |
| 9 | PHASE14_NEW | POST | `/api/v1/auth/revoke-all` | `authController.revokeAll` | `AUTHENTICATED` | `req.user.userId` | Account Owner | Global API | 401 | N/A |
| 10 | PHASE14_NEW | GET | `/api/v1/auth/me` | `authController.getMe` | `AUTHENTICATED` | `req.user` | Returns Principal | Global API | 401 | N/A |
| 11 | EXISTING | POST | `/api/v1/users` | `userController.createUser` | `DEPRECATED` | None | Deprecated | Global API | 410 | 410 |
| 12 | EXISTING | GET | `/api/v1/users/:userId` | `userController.getUser` | `OWNER-ONLY` | `req.user.userId` | `:userId === req.user.userId` | Global API | 401 | 403 IDENTITY_MISMATCH |
| 13 | EXISTING | GET | `/api/v1/questions/topics` | `questionController.getTopics` | `AUTHENTICATED` | `req.user` | Shared Content | Global API | 401 | 403 IDENTITY_MISMATCH |
| 14 | EXISTING | GET | `/api/v1/questions/:id([a-fA-F0-9]{24})`| `questionController.getQuestionById` | `AUTHENTICATED` | `req.user` | Shared Content | Global API | 401 | 403 IDENTITY_MISMATCH |
| 15 | EXISTING | GET | `/api/v1/questions/topic/:topic/patterns` | `questionController.getPatternsByTopic` | `AUTHENTICATED` | `req.user` | Shared Content | Global API | 401 | 403 IDENTITY_MISMATCH |
| 16 | EXISTING | GET | `/api/v1/questions/topic/:topic/random` | `questionController.getRandomByTopic` | `AUTHENTICATED` | `req.user` | Shared Content | Global API | 401 | 403 IDENTITY_MISMATCH |
| 17 | EXISTING | GET | `/api/v1/questions/topic/:topic/pattern/:pattern/random` | `questionController.getRandomByPattern` | `AUTHENTICATED` | `req.user` | Shared Content | Global API | 401 | 403 IDENTITY_MISMATCH |
| 18 | EXISTING | GET | `/api/v1/questions/topic/:topic/pattern/:pattern` | `questionController.getQuestionsByPattern` | `AUTHENTICATED` | `req.user` | Shared Content | Global API | 401 | 403 IDENTITY_MISMATCH |
| 19 | EXISTING | GET | `/api/v1/questions/topic/:topic` | `questionController.getQuestionsByTopic` | `AUTHENTICATED` | `req.user` | Shared Content | Global API | 401 | 403 IDENTITY_MISMATCH |
| 20 | EXISTING | GET | `/api/v1/goals/user/:userId` | `goalController.getGoalsByUser` | `OWNER-ONLY` | `req.user.userId` | `:userId === req.user.userId` | Global API | 401 | 403 IDENTITY_MISMATCH |
| 21 | EXISTING | POST | `/api/v1/goals` | `goalController.createGoal` | `AUTHENTICATED` | `req.user.userId` | Bound to `req.user.userId` | Global API | 401 | 403 IDENTITY_MISMATCH |
| 22 | EXISTING | GET | `/api/v1/goals/:id` | `goalController.getGoal` | `OWNER-ONLY` | `req.user.userId` | `goal.userId === req.user.userId` | Global API | 401 | 403 OWNERSHIP_VIOLATION / 403 IDENTITY_MISMATCH |
| 23 | EXISTING | PATCH | `/api/v1/goals/:id` | `goalController.updateGoal` | `OWNER-ONLY` | `req.user.userId` | `goal.userId === req.user.userId` | Global API | 401 | 403 OWNERSHIP_VIOLATION / 403 IDENTITY_MISMATCH |
| 24 | EXISTING | DELETE | `/api/v1/goals/:id` | `goalController.deleteGoal` | `OWNER-ONLY` | `req.user.userId` | `goal.userId === req.user.userId` | Global API | 401 | 403 OWNERSHIP_VIOLATION / 403 IDENTITY_MISMATCH |
| 25 | EXISTING | GET | `/api/v1/study-plans/user/:userId` | `studyPlanController.getStudyPlansByUser` | `OWNER-ONLY` | `req.user.userId` | `:userId === req.user.userId` | Global API | 401 | 403 IDENTITY_MISMATCH |
| 26 | EXISTING | POST | `/api/v1/study-plans` | `studyPlanController.createStudyPlan` | `AUTHENTICATED` | `req.user.userId` | Bound to `req.user.userId` | Global API | 401 | 403 IDENTITY_MISMATCH |
| 27 | EXISTING | GET | `/api/v1/study-plans/:id` | `studyPlanController.getStudyPlan` | `OWNER-ONLY` | `req.user.userId` | `plan.userId === req.user.userId` | Global API | 401 | 403 OWNERSHIP_VIOLATION / 403 IDENTITY_MISMATCH |
| 28 | EXISTING | PATCH | `/api/v1/study-plans/:id` | `studyPlanController.updateStudyPlan` | `OWNER-ONLY` | `req.user.userId` | `plan.userId === req.user.userId` | Global API | 401 | 403 OWNERSHIP_VIOLATION / 403 IDENTITY_MISMATCH |
| 29 | EXISTING | DELETE | `/api/v1/study-plans/:id` | `studyPlanController.deleteStudyPlan` | `OWNER-ONLY` | `req.user.userId` | `plan.userId === req.user.userId` | Global API | 401 | 403 OWNERSHIP_VIOLATION / 403 IDENTITY_MISMATCH |
| 30 | EXISTING | GET | `/api/v1/daily-objectives/user/:userId` | `dailyObjectiveController.getDailyObjectivesByUser` | `OWNER-ONLY` | `req.user.userId` | `:userId === req.user.userId` | Global API | 401 | 403 IDENTITY_MISMATCH |
| 31 | EXISTING | POST | `/api/v1/daily-objectives` | `dailyObjectiveController.createDailyObjective` | `AUTHENTICATED` | `req.user.userId` | Bound to `req.user.userId` | Global API | 401 | 403 IDENTITY_MISMATCH |
| 32 | EXISTING | GET | `/api/v1/daily-objectives/:id` | `dailyObjectiveController.getDailyObjective` | `OWNER-ONLY` | `req.user.userId` | `obj.userId === req.user.userId` | Global API | 401 | 403 OWNERSHIP_VIOLATION / 403 IDENTITY_MISMATCH |
| 33 | EXISTING | PATCH | `/api/v1/daily-objectives/:id` | `dailyObjectiveController.updateDailyObjective` | `OWNER-ONLY` | `req.user.userId` | `obj.userId === req.user.userId` | Global API | 401 | 403 OWNERSHIP_VIOLATION / 403 IDENTITY_MISMATCH |
| 34 | EXISTING | DELETE | `/api/v1/daily-objectives/:id` | `dailyObjectiveController.deleteDailyObjective` | `OWNER-ONLY` | `req.user.userId` | `obj.userId === req.user.userId` | Global API | 401 | 403 OWNERSHIP_VIOLATION / 403 IDENTITY_MISMATCH |
| 35 | EXISTING | GET | `/api/v1/attempts/user/:userId` | `attemptController.getAttemptsByUser` | `OWNER-ONLY` | `req.user.userId` | `:userId === req.user.userId` | Global API | 401 | 403 IDENTITY_MISMATCH |
| 36 | EXISTING | POST | `/api/v1/attempts` | `attemptController.createAttempt` | `AUTHENTICATED` | `req.user.userId` | Bound to `req.user.userId` | Global API | 401 | 403 IDENTITY_MISMATCH |
| 37 | EXISTING | GET | `/api/v1/attempts/:id` | `attemptController.getAttempt` | `OWNER-ONLY` | `req.user.userId` | `attempt.userId === req.user.userId` | Global API | 401 | 403 OWNERSHIP_VIOLATION / 403 IDENTITY_MISMATCH |
| 38 | EXISTING | GET | `/api/v1/progress/prerequisites/:patternName` | `studentProgressController.getPrerequisiteData` | `AUTHENTICATED` | `req.user` | Shared Content | Global API | 401 | 403 IDENTITY_MISMATCH |
| 39 | EXISTING | GET | `/api/v1/progress/:userId` | `studentProgressController.getProgressByUser` | `OWNER-ONLY` | `req.user.userId` | `:userId === req.user.userId` | Global API | 401 | 403 IDENTITY_MISMATCH |
| 40 | EXISTING | GET | `/api/v1/progress/:userId/topics` | `studentProgressController.getProgressByTopic` | `OWNER-ONLY` | `req.user.userId` | `:userId === req.user.userId` | Global API | 401 | 403 IDENTITY_MISMATCH |
| 41 | EXISTING | GET | `/api/v1/progress/:userId/patterns` | `studentProgressController.getProgressByPattern` | `OWNER-ONLY` | `req.user.userId` | `:userId === req.user.userId` | Global API | 401 | 403 IDENTITY_MISMATCH |
| 42 | EXISTING | GET | `/api/v1/progress/:userId/weakest` | `studentProgressController.getWeakestPatterns` | `OWNER-ONLY` | `req.user.userId` | `:userId === req.user.userId` | Global API | 401 | 403 IDENTITY_MISMATCH |
| 43 | EXISTING | GET | `/api/v1/progress/:userId/difficulty-distribution` | `studentProgressController.getDifficultyDistribution` | `OWNER-ONLY` | `req.user.userId` | `:userId === req.user.userId` | Global API | 401 | 403 IDENTITY_MISMATCH |
| 44 | EXISTING | GET | `/api/v1/progress/:userId/accuracy-over-time` | `studentProgressController.getAccuracyOverTime` | `OWNER-ONLY` | `req.user.userId` | `:userId === req.user.userId` | Global API | 401 | 403 IDENTITY_MISMATCH |
| 45 | EXISTING | GET | `/api/v1/progress/:userId/by-source` | `studentProgressController.getAttemptsBySource` | `OWNER-ONLY` | `req.user.userId` | `:userId === req.user.userId` | Global API | 401 | 403 IDENTITY_MISMATCH |
| 46 | EXISTING | GET | `/api/v1/adaptive/next-question` | `adaptiveController.getNextQuestion` | `AUTHENTICATED` | `req.user.userId` | Bound to `req.user.userId` | Global API | 401 | 403 IDENTITY_MISMATCH |
| 47 | EXISTING | POST | `/api/v1/planning/preview` | `planningController.preview` | `AUTHENTICATED` | `req.user.userId` | Bound to `req.user.userId` | Global API | 401 | 403 IDENTITY_MISMATCH |
| 48 | EXISTING | POST | `/api/v1/planning/generate` | `planningController.generate` | `AUTHENTICATED` | `req.user.userId` | Bound to `req.user.userId` | Global API | 401 | 403 IDENTITY_MISMATCH |
| 49 | EXISTING | POST | `/api/v1/planning/plans/:planId/replan` | `planningController.replan` | `OWNER-ONLY` | `req.user.userId` | `plan.userId === req.user.userId` | Global API | 401 | 403 OWNERSHIP_VIOLATION / 403 IDENTITY_MISMATCH |
| 50 | EXISTING | GET | `/api/v1/planning/plans/:planId/schedule` | `planningController.getSchedule` | `OWNER-ONLY` | `req.user.userId` | `plan.userId === req.user.userId` | Global API | 401 | 403 OWNERSHIP_VIOLATION / 403 IDENTITY_MISMATCH |
| 51 | EXISTING | GET | `/api/v1/revisions/due` | `revisionController.getDue` | `AUTHENTICATED` | `req.user.userId` | Bound to `req.user.userId` | Global API | 401 | 403 IDENTITY_MISMATCH |
| 52 | EXISTING | GET | `/api/v1/revisions/plan` | `revisionController.getPlan` | `AUTHENTICATED` | `req.user.userId` | Bound to `req.user.userId` | Global API | 401 | 403 IDENTITY_MISMATCH |
| 53 | EXISTING | GET | `/api/v1/revisions/user/:userId` | `revisionController.getByUser` | `OWNER-ONLY` | `req.user.userId` | `:userId === req.user.userId` | Global API | 401 | 403 IDENTITY_MISMATCH |
| 54 | EXISTING | GET | `/api/v1/revisions/:id` | `revisionController.getById` | `OWNER-ONLY` | `req.user.userId` | `item.userId === req.user.userId` | Global API | 401 | 403 OWNERSHIP_VIOLATION / 403 IDENTITY_MISMATCH |
| 55 | EXISTING | POST | `/api/v1/revisions/rebuild` | `revisionController.rebuildState` | `AUTHENTICATED` | `req.user.userId` | Bound to `req.user.userId` | Global API | 401 | 403 IDENTITY_MISMATCH |
| 56 | EXISTING | POST | `/api/v1/mock-blueprints` | `controller.createBlueprint` | `CLOSED` | None | Closed to Learner HTTP | Global API | 403 | 403 BLUEPRINT_MUTATION_CLOSED |
| 57 | EXISTING | GET | `/api/v1/mock-blueprints` | `controller.getBlueprints` | `AUTHENTICATED` | `req.user` | Shared Content | Global API | 401 | 403 IDENTITY_MISMATCH |
| 58 | EXISTING | POST | `/api/v1/mock-blueprints/preview` | `controller.previewBlueprint` | `AUTHENTICATED` | `req.user` | Shared Content | Global API | 401 | 403 IDENTITY_MISMATCH |
| 59 | EXISTING | GET | `/api/v1/mock-blueprints/:id` | `controller.getBlueprintById` | `AUTHENTICATED` | `req.user` | Shared Content | Global API | 401 | 403 IDENTITY_MISMATCH |
| 60 | EXISTING | POST | `/api/v1/mock-sessions` | `controller.createSession` | `AUTHENTICATED` | `req.user.userId` | Bound to `req.user.userId` | Global API | 401 | 403 IDENTITY_MISMATCH |
| 61 | EXISTING | POST | `/api/v1/mock-sessions/:id/start` | `controller.startSession` | `OWNER-ONLY` | `req.user.userId` | `session.userId === req.user.userId` | Global API | 401 | 403 OWNERSHIP_VIOLATION / 403 IDENTITY_MISMATCH |
| 62 | EXISTING | GET | `/api/v1/mock-sessions/:id` | `controller.getSession` | `OWNER-ONLY` | `req.user.userId` | `session.userId === req.user.userId` | Global API | 401 | 403 OWNERSHIP_VIOLATION / 403 IDENTITY_MISMATCH |
| 63 | EXISTING | GET | `/api/v1/mock-sessions/:id/questions/:questionId` | `controller.getQuestion` | `OWNER-ONLY` | `req.user.userId` | `session.userId === req.user.userId` | Global API | 401 | 403 OWNERSHIP_VIOLATION / 403 IDENTITY_MISMATCH |
| 64 | EXISTING | POST | `/api/v1/mock-sessions/:id/responses` | `controller.saveResponse` | `OWNER-ONLY` | `req.user.userId` | `session.userId === req.user.userId` | Global API | 401 | 403 OWNERSHIP_VIOLATION / 403 IDENTITY_MISMATCH |
| 65 | EXISTING | POST | `/api/v1/mock-sessions/:id/sections/:sectionId/complete` | `controller.completeSection` | `OWNER-ONLY` | `req.user.userId` | `session.userId === req.user.userId` | Global API | 401 | 403 OWNERSHIP_VIOLATION / 403 IDENTITY_MISMATCH |
| 66 | EXISTING | POST | `/api/v1/mock-sessions/:id/submit` | `controller.submitSession` | `OWNER-ONLY` | `req.user.userId` | `session.userId === req.user.userId` | Global API | 401 | 403 OWNERSHIP_VIOLATION / 403 IDENTITY_MISMATCH |
| 67 | EXISTING | POST | `/api/v1/mock-sessions/:id/abandon` | `controller.abandonSession` | `OWNER-ONLY` | `req.user.userId` | `session.userId === req.user.userId` | Global API | 401 | 403 OWNERSHIP_VIOLATION / 403 IDENTITY_MISMATCH |
| 68 | EXISTING | GET | `/api/v1/mock-sessions/:id/result` | `controller.getResult` | `OWNER-ONLY` | `req.user.userId` | `session.userId === req.user.userId` | Global API | 401 | 403 OWNERSHIP_VIOLATION / 403 IDENTITY_MISMATCH |
| 69 | EXISTING | GET | `/api/v1/mock-sessions/:id/review` | `controller.getReview` | `OWNER-ONLY` | `req.user.userId` | `session.userId === req.user.userId` | Global API | 401 | 403 OWNERSHIP_VIOLATION / 403 IDENTITY_MISMATCH |
| 70 | EXISTING | POST | `/api/v1/learning/tutor` | `learningController.tutor` | `AUTHENTICATED` | `req.user.userId` | Bound to `req.user.userId` | Tier 4 (LLM) | 401 | 403 IDENTITY_MISMATCH |
| 71 | EXISTING | POST | `/api/v1/learning/hint` | `learningController.hint` | `AUTHENTICATED` | `req.user.userId` | Bound to `req.user.userId` | Tier 4 (LLM) | 401 | 403 IDENTITY_MISMATCH |
| 72 | EXISTING | POST | `/api/v1/learning/explain-attempt` | `learningController.explainAttempt` | `AUTHENTICATED` | `req.user.userId` | Bound to `req.user.userId` | Tier 4 (LLM) | 401 | 403 IDENTITY_MISMATCH |
| 73 | EXISTING | POST | `/api/v1/learning/explain-progress` | `learningController.explainProgress` | `AUTHENTICATED` | `req.user.userId` | Bound to `req.user.userId` | Tier 4 (LLM) | 401 | 403 IDENTITY_MISMATCH |
| 74 | EXISTING | POST | `/api/v1/learning/explain-plan` | `learningController.explainPlan` | `AUTHENTICATED` | `req.user.userId` | Bound to `req.user.userId` | Tier 4 (LLM) | 401 | 403 IDENTITY_MISMATCH |
| 75 | EXISTING | POST | `/api/v1/learning/mock-review` | `learningController.mockReview` | `AUTHENTICATED` | `req.user.userId` | Bound to `req.user.userId` | Tier 4 (LLM) | 401 | 403 IDENTITY_MISMATCH |
| 76 | EXISTING | GET | `/api/v1/analytics/dashboard` | `analyticsController.getDashboard` | `AUTHENTICATED` | `req.user.userId` | Bound to `req.user.userId` | Global API | 401 | 403 IDENTITY_MISMATCH |
| 77 | EXISTING | GET | `/api/v1/analytics/cognitive-profile` | `analyticsController.getCognitiveProfile` | `AUTHENTICATED` | `req.user.userId` | Bound to `req.user.userId` | Global API | 401 | 403 IDENTITY_MISMATCH |
| 78 | EXISTING | GET | `/api/v1/analytics/retention` | `analyticsController.getRetention` | `AUTHENTICATED` | `req.user.userId` | Bound to `req.user.userId` | Global API | 401 | 403 IDENTITY_MISMATCH |
| 79 | EXISTING | GET | `/api/v1/analytics/readiness/:goalId` | `analyticsController.getReadiness` | `OWNER-ONLY` | `req.user.userId` | `goal.userId === req.user.userId` | Global API | 401 | 403 OWNERSHIP_VIOLATION / 403 IDENTITY_MISMATCH |
| 80 | EXISTING | GET | `/api/v1/orchestration/next-action` | `orchestrationController.getNextAction` | `AUTHENTICATED` | `req.user.userId` | Bound to `req.user.userId` | Global API | 401 | 403 IDENTITY_MISMATCH |
| 81 | EXISTING | GET | `/api/v1/orchestration/daily-agenda` | `orchestrationController.getDailyAgenda` | `AUTHENTICATED` | `req.user.userId` | Bound to `req.user.userId` | Global API | 401 | 403 IDENTITY_MISMATCH |
| 82 | EXISTING | GET | `/api/v1/orchestration/interventions` | `orchestrationController.getInterventions` | `AUTHENTICATED` | `req.user.userId` | Bound to `req.user.userId` | Global API | 401 | 403 IDENTITY_MISMATCH |
| 83 | EXISTING | POST | `/api/v1/attribution/prescriptions` | `attributionController.issuePrescription` | `AUTHENTICATED` | `req.user.userId` | Bound to `req.user.userId` | Global API | 401 | 403 IDENTITY_MISMATCH |
| 84 | EXISTING | POST | `/api/v1/attribution/prescriptions/:prescriptionId/activate` | `attributionController.activatePrescription` | `OWNER-ONLY` | `req.user.userId` | `prescription.userId === req.user.userId` | Global API | 401 | 403 OWNERSHIP_VIOLATION / 403 IDENTITY_MISMATCH |
| 85 | EXISTING | POST | `/api/v1/attribution/prescriptions/:prescriptionId/complete` | `attributionController.completePrescription` | `OWNER-ONLY` | `req.user.userId` | `prescription.userId === req.user.userId` | Global API | 401 | 403 OWNERSHIP_VIOLATION / 403 IDENTITY_MISMATCH |
| 86 | EXISTING | GET | `/api/v1/attribution/users/:userId/summary` | `attributionController.getSummary` | `OWNER-ONLY` | `req.user.userId` | `:userId === req.user.userId` | Global API | 401 | 403 IDENTITY_MISMATCH |

### 28.1 Mechanically Verified Route Coverage Breakdown
```text
Total Projected Routes:                                                  86
Total Routes Classified:                                                 86 / 86
Protected Authenticated Business Routes:                                 74
Protected Business Routes With Body/Query Principal Guard:               74 / 74 (100%)
:userId Parameter Routes:                                                14
:userId Parameter Routes With Param Guard:                               14 / 14 (100%)
Public/Auth/Operational/Tombstone Routes Where Principal Mismatch Is N/A: 12
Routes Incorrectly Reported As Identity-Mismatch-Capable:                0
```

---

## 29. DEPRECATED USER CREATION ENDPOINT (`POST /api/v1/users`)

- **Status**: Permanently Deprecated.
- **Contract**:
  ```http
  HTTP/1.1 410 Gone
  Content-Type: application/json; charset=utf-8
  ```
  ```json
  {
    "success": false,
    "error": {
      "code": "USER_CREATION_ENDPOINT_DEPRECATED",
      "message": "Direct user creation via POST /api/v1/users is permanently deprecated. Use POST /api/v1/auth/register."
    }
  }
  ```
- No user records may be created through this route. Client-supplied `userId` persistence through this route is blocked.

---

## 30. SHARED MOCK BLUEPRINT MUTATION CLOSURE (`POST /api/v1/mock-blueprints`)

- **Status**: Closed to learner HTTP access.
- **Contract**:
  ```http
  HTTP/1.1 403 Forbidden
  Content-Type: application/json; charset=utf-8
  ```
  ```json
  {
    "success": false,
    "error": {
      "code": "BLUEPRINT_MUTATION_CLOSED",
      "message": "Mock blueprint creation is closed to learner HTTP access."
    }
  }
  ```
- **Invariant**: Learner mutation of global shared blueprint catalog = 0.
- Shared blueprint read routes (`GET /api/v1/mock-blueprints`, `GET /:id`, `POST /preview`) remain authenticated shared-content operations.

---

## 31. RATE LIMITER ENGINE SPECIFICATION (`src/middleware/rateLimiter.js`)

The platform implements a pure native in-process **bounded fixed-window counter** with zero third-party dependencies.

### 31.1 Single Process-Wide Registry & Algorithmic State
- **Process-Wide Registry Count**: **1** (single module-owned Map).
- **Shared Registry**: Exactly one `Map<string, { count: number, resetAt: number }>` shared across all four tiers (Tier 1 Global, Tier 2 Auth, Tier 3 Refresh, Tier 4 LLM).
- **Tier Key Separation**: Tiers are distinguished by unambiguous string key prefixes:
  - Tier 1: `ip:<clientIp>`
  - Tier 2: `auth:<clientIp>:<emailComponent>`
  - Tier 3: `ref:<clientIp>:<tokenHashComponent>`
  - Tier 4: `llm:<userId>`
- **Aggregate Capacity Bound (`RATE_LIMIT_MAX_KEYS`)**:
  - `RATE_LIMIT_MAX_KEYS` (default 10,000, bounds [1,000, 100,000]) applies to the **aggregate process-wide entries** across all four tiers combined (`registry.size <= RATE_LIMIT_MAX_KEYS`).
  - Independent per-tier Map instances each with `RATE_LIMIT_MAX_KEYS` are **STRICTLY PROHIBITED**.
  - Tier 1 keys, Tier 2 keys, Tier 3 keys, and Tier 4 keys all contribute to the single shared `registry.size`.
- **No Active-Key LRU Eviction**: Evicting active buckets under churn attack is strictly prohibited.
- **Synchronous Sweep on New Key Arrival**:
  ```javascript
  function sweepExpiredBuckets(now) {
    for (const [key, bucket] of registry.entries()) {
      if (bucket.resetAt <= now) {
        registry.delete(key);
      }
    }
  }
  ```
- **Capacity Overflow Contract**:
  - If a request arrives with an unallocated key, and `registry.size >= RATE_LIMIT_MAX_KEYS`:
    1. Run `sweepExpiredBuckets(now)`.
    2. If `registry.size >= RATE_LIMIT_MAX_KEYS`:
       - Log security event `AUTH_RATE_LIMITED` with `reason: 'CAPACITY_EXCEEDED'`.
       - Fail closed immediately with:
         ```http
         HTTP/1.1 429 Too Many Requests
         Retry-After: 60
         ```
         ```json
         {
           "success": false,
           "error": {
             "code": "RATE_LIMIT_CAPACITY_EXCEEDED",
             "message": "Service capacity exceeded. Please retry later."
           }
         }
         ```
  - Existing allocated keys at capacity continue to operate according to their individual bucket count/resetAt limits.
- **Background Sweeper**: A single process-wide timer runs every 60 seconds:
  ```javascript
  const sweeperInterval = setInterval(() => sweepExpiredBuckets(Date.now()), 60000);
  sweeperInterval.unref(); // Does not prevent clean Node.js shutdown
  ```
- **Process-Wide Sweeper Interval Count**: **1**.
- **Per-Key Timers**: **ZERO**.
- **Deterministic Time Injection**: Factory allows passing a mock clock (`() => currentTimeMs`) for hermetic unit testing.

---

## 32. RATE LIMITING TIERS & KEY NORMALIZATION

### 32.1 Tiers Definition

| Tier Name | Target Surface | Default Limit | Window | Key Format | Information Requirement |
|---|---|---|---|---|---|
| **Tier 1 (Global)** | All `/api/v1/*` routes | 300 requests | 15 min | `ip:<clientIp>` | Client IP |
| **Tier 2 (Auth)** | `/auth/register`, `/auth/login` | 5 requests | 15 min | `auth:<clientIp>:<normalizedEmail>` | Parsed Body |
| **Tier 3 (Refresh)** | `/auth/refresh` | 20 requests | 15 min | `ref:<clientIp>:<tokenHash>` | Parsed Cookie |
| **Tier 4 (LLM)** | `/api/v1/learning/*` | 20 requests | 1 min | `llm:<userId>` | `req.user.userId` |

### 32.2 Safe Key Derivation & Exception Prevention
The rate limiter MUST NEVER throw an uncaught exception due to missing or malformed request payloads, non-string values, or missing cookies. Safe extraction helpers guarantee deterministic sentinel keys before controller validation runs:

#### Tier-2 Auth Key Derivation (`getAuthRateLimitEmailComponent`)
```javascript
function getAuthRateLimitEmailComponent(req) {
  const email = req.body?.email;

  if (typeof email !== 'string') {
    return '__INVALID_EMAIL__';
  }

  return email.trim().toLowerCase();
}
```
- **Valid string email**: Trimmed and lowercased (`email.trim().toLowerCase()`).
- **Missing `req.body` or missing `req.body.email`**: Returns stable sentinel `'__INVALID_EMAIL__'`.
- **Non-string email (object, array, number, boolean, null)**: Returns stable sentinel `'__INVALID_EMAIL__'`.
- **Limiter throws**: **NO**.
- **Key format**: `auth:<clientIp>:${getAuthRateLimitEmailComponent(req)}`.
- **Relationship to Validation**: The downstream auth controller and DTO validation remain canonical and authoritative for returning HTTP 400 `INVALID_PAYLOAD`. The sentinel key exists solely to isolate malformed payloads within a bounded rate-limit bucket without crashing the middleware pipeline.

#### Tier-3 Refresh Key Derivation (`getRefreshRateLimitTokenComponent`)
```javascript
function getRefreshRateLimitTokenComponent(req) {
  const rawToken = req.cookies?.refreshToken;

  if (typeof rawToken !== 'string' || rawToken.length === 0) {
    return '__MISSING_OR_INVALID_REFRESH__';
  }

  return crypto
    .createHash('sha256')
    .update(rawToken)
    .digest('hex');
}
```
- **Valid string token**: SHA-256 token hash (hex encoded).
- **Missing cookie (`req.cookies?.refreshToken` absent)**: Returns stable sentinel `'__MISSING_OR_INVALID_REFRESH__'`.
- **Non-string or empty cookie**: Returns stable sentinel `'__MISSING_OR_INVALID_REFRESH__'`.
- **Raw refresh token included in limiter key**: **NO** (raw tokens are never placed into keys or memory dumps).
- **Raw refresh token logged**: **NO**.
- **Limiter throws**: **NO**.
- **Key format**: `ref:<clientIp>:${getRefreshRateLimitTokenComponent(req)}`.
- **Relationship to Refresh Controller**: The refresh controller/service remains responsible for validating cookie presence and returning canonical HTTP 401 `INVALID_REFRESH_TOKEN` responses.

### 32.3 Key Privacy & Logging Invariant
- Rate limiter keys contain raw IP, email, or token hashes in RAM only.
- Raw keys must **NEVER** be logged to stdout/stderr or exported into Prometheus labels.
- Security logs emit `operationalCategory: 'RATE_LIMIT'` with sanitized fields only.

---

## 33. RATE LIMITING MIDDLEWARE INFORMATION ORDERING & EXECUTION PRECEDENCE

The middleware pipeline enforces strict data-readiness ordering and execution precedence:
1. **Global IP Limiter**: Operates at the application boundary prior to body parsing.
2. **Hardened CORS & Cookie Parser**: Executed before `/api/v1/auth/refresh`.
3. **Bounded `express.json` & Type-Safe Key Derivation**: Bounded `express.json` performs bounded JSON parsing (it does NOT itself enforce Phase 14 scalar email/password DTO contracts). The Auth rate-limit key extractor performs type-safe normalization and sentinel handling (e.g. `'__INVALID_EMAIL__'`), guaranteeing that the limiter never throws on missing/malformed payloads. Downstream auth controller and service input validation remain canonical and authoritative for payload/scalar validation and returning HTTP 400 `INVALID_PAYLOAD`.
4. **Authenticate Boundary & Tier-4 LLM Limiter**:
   - Tier 4 LLM limiter strictly requires `req.user.userId`.
   - Therefore, `authenticate` (Step 11) must execute before `llmRateLimiter` (Step 12).
   - On `/api/v1/learning/*` routes, the Tier 4 LLM limiter executes at Step 12 **BEFORE** the Step 13 business authorization stage (`enforcePrincipalUserIdBodyQuery`):
     ```text
     authenticate -> llmRateLimiter -> enforcePrincipalUserIdBodyQuery -> learning router -> controller
     ```
   - **Precedence Invariant**:
     - Under ordinary non-rate-limited execution, any mismatching client `userId` in query/body triggers HTTP 403 `IDENTITY_MISMATCH` at Step 13a.
     - If the client request has already exceeded the Tier-4 limit, the earlier Step 12 rate limiter legitimately returns its HTTP 429 response before Step 13 identity mismatch evaluation occurs.
     - The route matrix expectation of `403 IDENTITY_MISMATCH` applies to non-rate-limited execution and does not override earlier pipeline-level rate limit termination.
5. No rate limiter may reference request metadata before its prerequisite parser or authenticator executes.

---

## 34. HARDENED CORS CONTRACT

### 34.1 Policy Rules
- **Configuration**: Comma-separated list `CORS_ALLOWED_ORIGINS`.
- **Production Wildcard**: Wildcard `*` is strictly forbidden in production.
- **Credentials**: `credentials: true` enabled strictly for explicit allowlisted origins.
- **Allowed Methods**: `['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS']` (No PUT).
- **Allowed Request Headers**:
  - `Content-Type`
  - `Authorization`
  - `X-Correlation-ID`
  - `X-Request-ID` *(preserves Phase 13 correlation compatibility)*
- **Exposed Response Headers**: `['X-Correlation-ID', 'Retry-After']`.
- **Disallowed Origin**: Returns HTTP 403 `CORS_ORIGIN_DENIED`.
- **No-Origin Requests**: Permitted for server-to-server and operational probes (except `/auth/refresh`, where Origin is required).
- **Operational Health Route Exemption**: Health routes (`/health`, `/health/live`, `/health/ready`) mount **BEFORE** CORS to ensure probes are never blocked.

---

## 35. SECURITY HEADERS & EDGE HSTS BOUNDARY (`src/middleware/securityHeaders.js`)

### 35.1 Application Headers Emitted by Node
Every response from Express receives:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Content-Security-Policy: default-src 'none'; frame-ancestors 'none'`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()`
- All `/api/v1/auth/*` responses receive: `Cache-Control: no-store, no-cache, must-revalidate`.

### 35.2 Single-Authority HSTS Ownership
```text
HSTS Production Owner:           PHASE 16 REVERSE PROXY / EDGE
Phase 14 Node Application Emits: NO
```
- Node Express application does **NOT** emit `Strict-Transport-Security`.
- Handoff Invariant: Production HSTS verification at the reverse proxy/edge gateway is mandatory prior to production release.

---

## 36. PROTECTED OPERATIONAL METRICS SCRAPER GATE (`/metrics`)

- Mounted at `/metrics` with `metrics.toPrometheusText()`.
- **Production Protection**:
  - If `METRICS_ENABLED === 'true'`, incoming requests must present `Authorization: Bearer <METRICS_SCRAPE_SECRET>`.
  - Secret comparison executes via `crypto.timingSafeEqual` after buffer length verification.
  - Missing/invalid secret returns HTTP 401 `UNAUTHORIZED`.
- **Limiter Exemption**: The scraper endpoint is placed **OUTSIDE** application rate limiting.
- **Cardinality Preservation**: Zero security labels added. Label budget remains strictly <700 series cap.

---

## 37. REVERSE PROXY TRUST POSTURE (`trust proxy`)

- Default: `app.set('trust proxy', false)`.
- Forwarded IP headers (`X-Forwarded-For`, `X-Real-IP`) are strictly ignored by default.
- If deployed behind a trusted proxy in Phase 16, `TRUST_PROXY_HOPS` may configure an explicit integer hop count or trusted CIDR list.
- Blindly enabling `app.set('trust proxy', true)` or `app.set('trust proxy', 1)` is strictly prohibited.

---

## 38. AUTHORITATIVE MIDDLEWARE PIPELINE ORDERING (`src/app.js`)

The exact sequence of middleware in `src/app.js` is frozen:

```text
1.  correlationMiddleware
2.  metricsMiddleware
3.  securityHeadersMiddleware
4.  health routes
5.  protected /metrics
6.  global IP limiter
7.  hardened CORS
8.  cookie-parser
9.  express.json({ limit: '100kb' })
10. auth router
11. authenticate boundary
12. Tier-4 LLM limiter for /api/v1/learning/*
13. protected business stage:
      a. enforcePrincipalUserIdBodyQuery
      b. business routers
      c. route-level :userId validation
      d. document ownership guards
14. notFound
15. errorHandler
```

Invariants:
- `correlationMiddleware` is first.
- `errorHandler` is last.
- Health probes mount before CORS and before application rate limiting.
- Authenticate boundary executes at Step 11, establishing `req.user`.
- Tier 4 LLM rate limiter executes at Step 12 for `/api/v1/learning/*`, reading `req.user.userId` before Step 13 business authorization.
- Universal body/query guard (`enforcePrincipalUserIdBodyQuery`) executes as the first authorization operation inside Step 13 (after Step 12 Tier-4 limiter), protecting all 74 protected business routes before business routers and controllers execute.
- This does NOT create a 16th middleware stage; Step 13 encapsulates the protected business authorization pipeline.
- If a request to `/api/v1/learning/*` exceeds the Tier 4 rate limit, the Step 12 rate limiter legitimately rejects it with HTTP 429 before Step 13 identity mismatch evaluation occurs.

---

## 39. PHASE 13 LIVENESS PRESERVATION

- `/health/live` must return HTTP 200 whenever the process event loop can respond, including during database outages, network partitions, or graceful shutdown draining (`SHUTTING_DOWN`).
- CORS, authentication, and rate limiting must never intercept health probes.
- `/health/ready` evaluates physical MongoDB connectivity and returns HTTP 200 or 503.

---

## 40. PHASE 13 OBSERVABILITY PRESERVATION

- Prometheus registry retains exactly **8 metric families**:
  1. `http_requests_total`
  2. `http_request_duration_seconds`
  3. `http_active_requests`
  4. `nodejs_eventloop_lag_seconds`
  5. `process_memory_heap_bytes`
  6. `database_connection_status`
  7. `database_ping_duration_seconds`
  8. `process_uptime_seconds`
- Zero new metric families added.
- Zero security labels (`userId`, `email`, `IP`, `token`, `tokenHash`, `sessionId`, `role`) added.
- Dynamic route templates collapse to `OTHER` if exceeding the 33 canonical route budget.

---

## 41. STRUCTURED SECURITY LOGGING EXTENSION (`src/utils/logger.js`)

### 41.1 Authorized Security Event Catalog
`src/utils/logger.js` is authorized to extend its canonical event catalog with exactly 10 security events:

```javascript
const PHASE14_SECURITY_EVENTS = new Set([
  'AUTH_REGISTER_SUCCESS',
  'AUTH_LOGIN_SUCCESS',
  'AUTH_LOGIN_FAILED',
  'AUTH_LOGOUT',
  'AUTH_TOKEN_REFRESH_SUCCESS',
  'AUTH_REFRESH_REUSE_DETECTED',
  'AUTH_SESSION_REVOKED',
  'AUTH_ACCESS_DENIED',
  'AUTH_ACCOUNT_DISABLED',
  'AUTH_RATE_LIMITED'
]);
```

### 41.2 Field Redaction & Sanitization
- **Allowed Optional Fields**: `['statusCode', 'errorCode', 'operationalCategory', 'reason', 'action']`.
- **Forbidden Sensitive Fields**: Passwords, access tokens, refresh tokens, auth headers, email addresses, client IPs, token hashes.
- Failsafe fallback: If logging fails, emit frozen out-of-band non-recursive stderr fallback string.

---

## 42. POLICY GOVERNANCE SECURITY HARDENING (`scripts/managePolicy.js`)

- Phase 12 governance remains strictly **HOST-CLI-ONLY**. Web API endpoints do not exist.
- In `production` and `staging`, `POLICY_GOVERNANCE_SECRET` is **STRICTLY REQUIRED**. If unset, exit immediately with exit code 1.
- In `development` and `test`, the `--confirm` prompt remains permitted as fallback.
- Policy fingerprints (SHA-256), sole-writer locks, active version invariants, and source taxonomy remain 100% untouched.

---

## 43. READ-ONLY MIGRATION READINESS AUDIT TOOL (`scripts/checkAuthMigrationReadiness.js`)

### 43.1 Audit Checks
A strictly read-only CLI performing zero writes, zero repairs, and zero mutations:
1. `totalUsers`: Total count of documents in `users`.
2. `usersMissingEmail`: Count where `email` field is absent or null.
3. `usersBlankEmail`: Count where `email` is an empty string or whitespace-only.
4. `duplicateCanonicalEmails`: Count of duplicate occurrences of `email.trim().toLowerCase()`.
5. `usersWithNonCanonicalEmail` (`NON_CANONICAL_EMAIL`): Count where existing nonblank `email !== email.trim().toLowerCase()`.
6. `usersMissingPasswordHash`: Count where `passwordHash` is absent or null.
7. `usersWithMalformedPasswordHash`: Count where `passwordHash` exists but does not match `$scrypt$v=1$...`.
8. `invalidAccountStatus`: Count where `status` is not in `['active', 'disabled']`.
9. `legacyUserIdIntegrityFailures`: Count of missing or malformed `userId` fields.
10. `usersNotAuthEligible`: Aggregate count of legacy users lacking `email` or `passwordHash`.

### 43.2 Exit Code Semantics
- The exit code represents **INDEX SAFETY** only:
  - `exit 0` (INDEX SAFETY PASS): Zero duplicate canonical emails and zero non-canonical nonblank emails. The partial unique index may be safely created.
  - `exit 1` (INDEX / CANONICALIZATION BLOCKER): Duplicate canonical emails > 0 or `usersWithNonCanonicalEmail > 0`.
- Authentication eligibility counts are reported separately. System is NOT labeled "all users auth ready" unless auth-ineligible count is zero.

---

## 44. EMAIL INDEX DEPLOYMENT GATE

```text
1. Execute: node scripts/checkAuthMigrationReadiness.js
2. If exit code 1:
   - Operator inspects reported conflicts.
   - Operator manually resolves duplicate canonical emails and non-canonical emails.
3. Re-run: node scripts/checkAuthMigrationReadiness.js
4. Verify exit code 0 (INDEX SAFETY PASS).
5. Authorize partial unique index creation on email.
```

Zero automatic user mutation or deletion is permitted.

---

## 45. DIAGNOSTIC CLI TRANSITION (`scripts/diagnoseSystem.js`)

- `EXPECTED_COLLECTIONS` updated from 15 to 16 by appending `'authsessions'`.
- The CLI remains strictly read-only, non-repairing, sole-writer compliant, verifying 16 physical collections, active policy counts, and database health.

---

## 46. ARCHITECTURE GUARDS & INVARIANT ASSERTIONS

`tests/architecture_guard.test.js` is updated to assert:
1. Registered Mongoose models = 16 (`files.length === 16`).
2. MongoDB physical collections = 16 (`EXPECTED_COLLECTIONS.length === 16`).
3. Sole new model = `AuthSession`. Sole new collection = `authsessions`.
4. Web operator role = 0.
5. High-cardinality metric labels = 0.
6. Raw tokens persisted = 0.

---

## 47. PUBLIC ERROR DTO ENVELOPE CONTRACT

All error responses strictly preserve the canonical two-field DTO:

```json
{
  "success": false,
  "error": {
    "code": "STRING_IDENTIFIER",
    "message": "Human readable description."
  }
}
```

Forbidden in DTO: Stack traces, internal file paths, correlation IDs, database error details, operational categories.

---

## 48. PHASE 14 CANONICAL ERROR CODE CATALOG

| HTTP Status | Error Code | Canonical Message |
|---|---|---|
| 400 | `INVALID_PAYLOAD` | Request body is malformed or invalid JSON. |
| 400 | `PASSWORD_LENGTH_INVALID` | Password must be between 15 and 128 characters. |
| 400 | `PASSWORD_BLOCKLISTED` | Choose a different password. |
| 401 | `UNAUTHORIZED` | Authentication is required to access this resource. |
| 401 | `INVALID_CREDENTIALS` | Invalid email or password. |
| 401 | `INVALID_TOKEN` | Access token is invalid or malformed. |
| 401 | `TOKEN_EXPIRED` | Access token has expired. |
| 401 | `INVALID_REFRESH_TOKEN` | Refresh token is invalid or not found. |
| 401 | `SESSION_REVOKED` | Session has been revoked. |
| 401 | `SESSION_EXPIRED` | Session has expired. |
| 401 | `REFRESH_REUSE_DETECTED` | Session family revoked due to token reuse. |
| 403 | `FORBIDDEN` | Access denied. |
| 403 | `ACCOUNT_DISABLED` | Account has been disabled. |
| 403 | `REFRESH_ORIGIN_REQUIRED` | Origin header is required for refresh token exchange. |
| 403 | `CORS_ORIGIN_DENIED` | Origin is not allowed. |
| 403 | `IDENTITY_MISMATCH` | Caller identity does not match token subject. |
| 403 | `OWNERSHIP_VIOLATION` | Access denied: caller does not own this resource. |
| 403 | `BLUEPRINT_MUTATION_CLOSED`| Mock blueprint creation is closed to learner HTTP access. |
| 409 | `EMAIL_ALREADY_REGISTERED` | An account with this email address already exists. |
| 410 | `USER_CREATION_ENDPOINT_DEPRECATED` | Direct user creation via POST /api/v1/users is permanently deprecated. Use POST /api/v1/auth/register. |
| 413 | `PAYLOAD_TOO_LARGE` | Request payload exceeds the 100kb limit. |
| 429 | `TOO_MANY_REQUESTS` | Rate limit exceeded. Please retry later. |
| 429 | `RATE_LIMIT_CAPACITY_EXCEEDED` | Service capacity exceeded. Please retry later. |
| 500 | `BLOCKLIST_UNAVAILABLE` | Authentication service temporarily unavailable. |

---

## 49. COMPREHENSIVE SECURITY TEST MATRIX

The 10 new security test suites and adapted Phase 12/13 test suites assert deterministic security behaviors:

1. `tests/security/passwordHashing.test.js`:
   - Scrypt derivation matches N=16384, r=8, p=5, keylen=64, salt=16 bytes, maxmem=128 MiB.
   - NFC normalization preserves distinct characters and correctly compares decomposed unicode.
   - Rejects passwords < 15 and > 128 Unicode code points with `PASSWORD_LENGTH_INVALID` (HTTP 400).
   - Constant-time verification via `crypto.timingSafeEqual` verifies valid hashes and rejects invalid hashes.
   - Canonical function signature: `verifyPassword(password, encodedHash)` where argument 1 is plaintext candidate password and argument 2 is stored/encoded hash.
   - `verifyPassword(validPassword, validStoredHash)` returns `true`.
   - `verifyPassword(wrongPassword, validStoredHash)` returns `false`.
   - Proves zero encodedHash/plaintext argument reversal anywhere in selected implementation contract.
   - Handles malformed hash strings gracefully without unhandled exceptions.

2. `tests/security/jwtKeyring.test.js`:
   - Validates HS256 tokens signed with active key (`JWT_ACCESS_ACTIVE_KID`).
   - Resolves secondary/retired keys from keyring via `kid`.
   - Rejects missing, invalid, or unknown `kid` (HTTP 401 `INVALID_TOKEN`).
   - Rejects tokens with `alg !== 'HS256'` (e.g. `alg: 'none'` or RS256) (HTTP 401 `INVALID_TOKEN`).
   - Rejects expired tokens outside 30s clock tolerance with HTTP 401 `TOKEN_EXPIRED`.
   - Rejects tokens with invalid issuer (`iss !== 'aptitude-platform'`) (HTTP 401 `INVALID_TOKEN`).
   - Rejects tokens with invalid audience (`aud !== 'aptitude-learning-api'`) (HTTP 401 `INVALID_TOKEN`).
   - Mandatory Structural Claim Validation:
     - Valid `sub`, `sid`, `jti`, `iat`, `exp` accepted.
     - Missing `sub` -> HTTP 401 `INVALID_TOKEN`.
     - Non-string or empty `sub` -> HTTP 401 `INVALID_TOKEN`.
     - Missing `sid` -> HTTP 401 `INVALID_TOKEN`.
     - Non-string or empty `sid` -> HTTP 401 `INVALID_TOKEN`.
     - Missing `jti` -> HTTP 401 `INVALID_TOKEN`.
     - Non-string or empty `jti` -> HTTP 401 `INVALID_TOKEN`.
     - Invalid/non-numeric/non-finite `iat` -> HTTP 401 `INVALID_TOKEN`.
     - Invalid/non-numeric/non-finite `exp` -> HTTP 401 `INVALID_TOKEN`.
     - Legacy user IDs without `usr_` prefix accepted (no artificial prefix restriction).
   - Enforces minimum secret byte length: `Buffer.byteLength(secret, 'utf8') >= 32` (Minimum encoded secret size: 32 UTF-8 bytes); fails closed on secrets < 32 bytes.
   - Asserts zero MongoDB queries executed during access JWT verification (DB queries = 0).
   - Proves deterministic `jti` mapping:
     - Login access JWT `jti` strictly equals login `AuthSession.tokenId`.
     - Refresh access JWT `jti` strictly equals successor `AuthSession.tokenId`.

3. `tests/security/authSessionLedger.test.js`:
   - Creates active `AuthSession` with 7-day absolute lifetime (`SESSION_ABSOLUTE_LIFETIME_MS`).
   - Enforces unique partial index (at most 1 active generation per `sessionId`).
   - TTL index configuration verified (`expiresAt` index).
   - Status transitions: active -> rotated, active -> revoked, rotated -> revoked (authorized for durable replay compromise marking).
   - CAS atomic rotation: first CAS winner transitions record from active to rotated and succeeds.
   - Refresh CAS race: second same-token CAS loses (returns null).
   - CAS loser observes rotated predecessor, transitions predecessor from `rotated` to `revoked`, and triggers reuse detection.
   - Reuse detection: active successor for the family is revoked by reuse detection.
   - Replay family isolation: unrelated `sessionId` remains active when a different session family triggers reuse detection.
   - Controlled Interleaving Test 1 (Replay Before Successor Creation):
     - Pause request A immediately after CAS active -> rotated, before AuthSession.create.
     - Run request B completely presenting the same rotated predecessor.
     - Assert B returns HTTP 401 `REFRESH_REUSE_DETECTED`.
     - Assert predecessor status is transitioned to `'revoked'`.
     - Assert active generations in family immediately after B = 0.
     - Resume request A: A attempts successor creation, executes post-successor predecessor check (`tokenHash`, `status: 'rotated'`, `replacedByTokenId`), check fails because predecessor is `'revoked'`.
     - Assert A revokes the newly created successor, issues no access JWT, emits no refresh cookie, and returns HTTP 401 `REFRESH_REUSE_DETECTED`.
     - Assert final active generation count in family = 0.
   - Controlled Interleaving Test 2 (Replay After Successor Creation Before Winner Finalization):
     - Pause request A after successor creation but before final replay reconciliation check.
     - Run request B completely.
     - Assert predecessor is marked `'revoked'`.
     - Assert active successor is revoked by B's `updateMany`.
     - Resume request A: A performs post-successor predecessor check, check fails, A issues no credentials.
     - Assert final active generations in family = 0.
   - Controlled Interleaving Test 3 (Replay After Winner Finalization):
     - Request A completes rotation, creates successor, validates predecessor still rotated, and finalizes credentials.
     - Request B then executes with the same predecessor token.
     - Assert B transitions predecessor to `'revoked'` and revokes active successor.
     - Assert subsequent refresh with the newly issued successor token is rejected.
     - Assert unrelated session families remain active and unaffected.
     - Assert previously issued stateless access JWT retains only its <=15-minute residual lifetime with zero ordinary business DB queries.
   - Successor creation failure after predecessor rotation: predecessor remains rotated, predecessor is NOT reactivated, no access token issued, no refresh cookie set, session family requires reauthentication.
   - Raw refresh token persistence = 0 (only SHA-256 `tokenHash` stored).
   - Physical Index Verification (All 7 Non-_id Indexes Verified):
     - `tokenId_1`: key `{ tokenId: 1 }`, unique: true.
     - `tokenHash_1`: key `{ tokenHash: 1 }`, unique: true.
     - `userId_1`: key `{ userId: 1 }`, non-partial lookup.
     - `sessionId_1`: key `{ sessionId: 1 }`, non-partial lookup.
     - `expiresAt_1`: key `{ expiresAt: 1 }`, TTL `expireAfterSeconds === 0`.
     - `userId_1_sessionId_1_status_1`: key `{ userId: 1, sessionId: 1, status: 1 }`, compound index.
     - `sessionId_active_unique`: key `{ sessionId: 1 }`, unique: true, partialFilterExpression: `{ status: 'active' }`.
   - Proves normal `sessionId_1` lookup index and `sessionId_active_unique` partial unique index names do not collide.
   - Proves missing any one of the 7 required indexes causes startup failure before listener bind.
   - Implicit MongoDB `_id_` index is not counted in the seven.

4. `tests/security/authRoutes.test.js`:
   - Full registration, login, refresh, logout, revoke-all, and `/me` flows.
   - Server-generated `usr_<UUID>` and canonical trimmed-lowercase email stored.
   - Mass-assignment registration payload: asserts unauthorized extra injected fields (`role`, `status`, `userId`, `isVerified`, `admin`) are stripped/ignored and never persisted or trusted, while server-generated `userId` remains authoritative.
   - NoSQL operator payload rejection: rejects operator objects (e.g. `{ $gt: '' }`, `{ $ne: null }`) in email/password inputs with HTTP 400 `INVALID_PAYLOAD`.
   - Duplicate registration returns HTTP 409 `EMAIL_ALREADY_REGISTERED`.
   - Blocklisted password returns HTTP 400 `PASSWORD_BLOCKLISTED`.
   - Password length violation returns HTTP 400 `PASSWORD_LENGTH_INVALID`.
   - Login credential verification explicitly retrieves `passwordHash` (`User.findOne(...).select('+passwordHash userId name email status')`); proves `passwordHash` is excluded from login DTO, `/me`, logs, and default queries.
   - Password verification call order: calls `verifyPassword(password, user.passwordHash)`. Correct password succeeds; wrong password returns HTTP 401 `INVALID_CREDENTIALS`.
   - Unknown email executes dummy scrypt timing path with candidate password in argument 1 and dummy hash in argument 2 (`verifyPassword(password, DUMMY_PASSWORD_HASH)`) -> HTTP 401 `INVALID_CREDENTIALS`.
   - Legacy user lacking `passwordHash` executes dummy scrypt timing path (`verifyPassword(password, DUMMY_PASSWORD_HASH)`) -> HTTP 401 `INVALID_CREDENTIALS`.
   - Proves zero argument reversal in credential verification.
   - Disabled account on login emits `AUTH_ACCOUNT_DISABLED` (`event: 'AUTH_ACCOUNT_DISABLED'`, `reason: 'LOGIN'`) using strictly authorized bounded logger fields without `userId` or `sessionId` fields and returns HTTP 403 `ACCOUNT_DISABLED`.
   - Disabled account on refresh:
     - Active user + valid refresh token -> normal refresh execution (returns new access token, rotates family).
     - Disabled user + otherwise valid active refresh token -> HTTP 403 `ACCOUNT_DISABLED`.
     - Proves disabled-user refresh creates successor: NO.
     - Proves disabled-user refresh rotates predecessor: NO (predecessor remains unconsumed).
     - Proves disabled-user refresh returns access token: NO.
     - Proves disabled-user refresh sets refresh cookie: NO.
     - Proves `AUTH_ACCOUNT_DISABLED` security log emitted (`event: 'AUTH_ACCOUNT_DISABLED'`, `reason: 'REFRESH'`) without unauthorized `userId` or `sessionId` fields, containing NO password, email, tokenHash, or access/refresh token.
     - Proves previously issued access JWT for disabled user is NOT immediately invalidated (natural <=15-minute residual expiry preserved).
     - Proves ordinary business request does NOT query User status in DB (DB queries = 0).
   - Refresh flow: validates refresh cookie, rotates token family, returns new access JWT with `jti = successorTokenId`.
   - Refresh absolute 7-day lifetime preserved across rotations; refresh rotation inherits predecessor `expiresAt` and never extends server-side absolute expiry.
   - Post-successor replay reconciliation: proves that if replay/race occurs prior to winner finalization, refresh returns HTTP 401 `REFRESH_REUSE_DETECTED`, newly created successor is revoked, no access JWT is issued, and no refresh cookie is emitted.
   - Proves same-token concurrent refresh family escapes revocation: 0.
   - Missing refresh Origin returns HTTP 403 `REFRESH_ORIGIN_REQUIRED`.
   - Disallowed refresh Origin returns HTTP 403 `CORS_ORIGIN_DENIED`.
   - Cookie creation and clearing attributes derive from canonical builder and remain environment-consistent:
     - Path=`/api/v1/auth/refresh`, HttpOnly=true, SameSite=Strict.
     - Secure in production: true for creation and clearing.
     - Secure in explicit local non-HTTPS development: false for creation and clearing.
     - Proves cookie clearing uses identical environment-resolved Secure attribute as creation.
   - Logout idempotency: repeated logout returns HTTP 200 without error.
   - Revoke-all behavior: revokes all active sessions for `req.user.userId` and clears cookie.
   - Successor-creation failure on refresh: returns HTTP 500 `INTERNAL_SERVER_ERROR`, does not issue new access JWT, does not set refresh cookie, predecessor is NOT reactivated.
   - Deprecated/Closed routes vs global authenticate boundary:
     - Anonymous `POST /api/v1/users` -> HTTP 410 `USER_CREATION_ENDPOINT_DEPRECATED` (not 401).
     - Authenticated `POST /api/v1/users` -> HTTP 410 `USER_CREATION_ENDPOINT_DEPRECATED`.
     - Anonymous `POST /api/v1/mock-blueprints` -> HTTP 403 `BLUEPRINT_MUTATION_CLOSED` (not 401).
     - Authenticated learner `POST /api/v1/mock-blueprints` -> HTTP 403 `BLUEPRINT_MUTATION_CLOSED`.
     - Asserts zero other routes receive tombstone bypass from authentication or identity guards.

5. `tests/security/rateLimiter.test.js`:
   - Single Process-Wide Registry: Exactly 1 module-owned Map registry shared across all four tiers (Tier 1 Global, Tier 2 Auth, Tier 3 Refresh, Tier 4 LLM).
   - Key prefixes maintain tier separation (`ip:`, `auth:`, `ref:`, `llm:`).
   - Aggregate Capacity Bound: Asserts Tier 1 keys + Tier 2 keys + Tier 3 keys + Tier 4 keys all contribute to the same `registry.size`.
   - Aggregate Capacity Saturation Test: When configured with `RATE_LIMIT_MAX_KEYS = 4`, allocating 1 Tier-1 key, 1 Tier-2 key, 1 Tier-3 key, and 1 Tier-4 key results in `registry.size === 4`. Attempting a fifth new key from ANY tier immediately returns HTTP 429 `RATE_LIMIT_CAPACITY_EXCEEDED` without throwing or allocating.
   - Existing Allocated Keys at Capacity: Existing allocated keys continue to operate according to their individual bucket count/resetAt limits without being evicted.
   - Active-Key Eviction = 0 (no LRU eviction under churn attack).
   - Independent per-tier capacity multiplication = 0 (proves no separate per-tier Map instances).
   - Single Process-Wide Background Sweeper: Exactly 1 unref background timer interval sweeps expired buckets; asserts zero per-key timers created.
   - Safe Key Derivation (No Limiter Exceptions):
     - Missing `req.body` or missing `req.body.email` does not throw; uses sentinel `'__INVALID_EMAIL__'`.
     - Non-string email (object, array, number, boolean) does not throw; uses sentinel `'__INVALID_EMAIL__'`.
     - Missing or malformed `refreshToken` cookie does not throw; uses sentinel `'__MISSING_OR_INVALID_REFRESH__'`.
     - Asserts zero uncaught exceptions in limiter key extractors.
   - Proves pipeline middleware ordering:
     - `authenticate` establishes `req.user` BEFORE `llmRateLimiter` reads `req.user.userId`.
     - `llmRateLimiter` executes BEFORE `enforcePrincipalUserIdBodyQuery` on learning routes (`/api/v1/learning/*`).
   - Proves a Tier-4-exhausted request terminates with HTTP 429 before Step 13 identity mismatch evaluation occurs.
   - Proxy/IP spoofing defense with `trust proxy` false: spoofed `X-Forwarded-For` headers are ignored; uses remote client socket address.

6. `tests/security/ownershipGuard.test.js`:
   - Tests `enforcePrincipalUserIdBodyQuery` and `enforcePrincipalUserId` middleware across `req.params`, `req.query`, and `req.body`:
     - Normal protected route + mismatching query/body `userId` -> HTTP 403 `IDENTITY_MISMATCH` (`"Caller identity does not match token subject."`).
     - Learning route below Tier-4 limit + mismatching `userId` in body -> HTTP 403 `IDENTITY_MISMATCH`.
     - Matching supplied `userId` (`supplied === req.user.userId`) -> allowed, executing ordinary route behavior with `req.user.userId`.
     - No supplied `userId` -> allowed, executing ordinary route behavior with `req.user.userId`.
     - Route parameter `:userId` mismatch (e.g. `GET /api/v1/users/:userId` where `:userId !== req.user.userId`) -> HTTP 403 `IDENTITY_MISMATCH`.
     - Exact method+path tombstone bypass for `POST /api/v1/users` (HTTP 410) and `POST /api/v1/mock-blueprints` (HTTP 403) across anonymous and authenticated callers; zero other routes receive bypass.
     - Universal body/query coverage: 74 / 74 protected business routes reject mismatching body/query `userId`.
     - Route parameter coverage: 14 / 14 `:userId` routes reject mismatching param `userId`.
     - Proves `req.user.userId` is never overwritten by client input and Phase 13 AsyncLocalStorage context is unmutated.
     - Independent resource document ownership violation: `document.userId !== req.user.userId` independently yields HTTP 403 `OWNERSHIP_VIOLATION` (`"Access denied: caller does not own this resource."`).

7. `tests/security/bolaPrevention.test.js`:
   - Matrix testing across all 15 business controllers asserting rejection of cross-user access attempts:
     - Direct identity mismatch rejection (`403 IDENTITY_MISMATCH`):
       - `POST /goals` with victim `userId` in body -> HTTP 403 `IDENTITY_MISMATCH`.
       - `POST /study-plans` with victim `userId` in body -> HTTP 403 `IDENTITY_MISMATCH`.
       - `POST /attempts` with victim `userId` in body -> HTTP 403 `IDENTITY_MISMATCH`.
       - `GET /adaptive/next-question?userId=victim` -> HTTP 403 `IDENTITY_MISMATCH`.
       - Planning requests (`preview`, `generate`, `replan`, `schedule`) containing victim `userId` in body/query -> HTTP 403 `IDENTITY_MISMATCH`.
       - Revision requests (`due`, `plan`, `rebuild`) containing victim `userId` in query/body -> HTTP 403 `IDENTITY_MISMATCH`.
       - Learning requests (all 6 tutor/hint/explanation endpoints) containing victim `userId` in body -> HTTP 403 `IDENTITY_MISMATCH`.
       - Analytics requests (`dashboard`, `cognitive-profile`, `retention`, `readiness`) containing victim `userId` in query/body -> HTTP 403 `IDENTITY_MISMATCH`.
       - Orchestration requests (`next-action`, `daily-agenda`, `interventions`) containing victim `userId` in query -> HTTP 403 `IDENTITY_MISMATCH`.
       - Prescription requests (`issue`, `activate`, `complete`) containing victim `userId` in body -> HTTP 403 `IDENTITY_MISMATCH`.
     - Resource document ownership rejection (`403 OWNERSHIP_VIOLATION`):
       - Accessing or mutating goal owned by another student (`goal.userId !== req.user.userId`) -> HTTP 403 `OWNERSHIP_VIOLATION`.
       - Accessing or mutating study plan owned by another student (`plan.userId !== req.user.userId`) -> HTTP 403 `OWNERSHIP_VIOLATION`.
       - Accessing attempt owned by another student (`attempt.userId !== req.user.userId`) -> HTTP 403 `OWNERSHIP_VIOLATION`.
       - Progressing mock session owned by another student (`session.userId !== req.user.userId`) -> HTTP 403 `OWNERSHIP_VIOLATION`.
       - Activating or completing prescription owned by another student (`prescription.userId !== req.user.userId`) -> HTTP 403 `OWNERSHIP_VIOLATION`.
   - Asserts zero `authsessions` database lookups during ordinary JWT-authenticated business requests.

8. `tests/security/securityHeaders.test.js`:
   - Asserts defensive headers on all responses: CSP, X-Content-Type-Options: nosniff, X-Frame-Options: DENY, Referrer-Policy: strict-origin-when-cross-origin, Permissions-Policy.
   - Asserts `Cache-Control: no-store, no-cache, must-revalidate` on all `/api/v1/auth/*` responses.
   - Asserts absence of application-level `Strict-Transport-Security` header emitted by Node (owned by Phase 16 edge).
   - CORS allowlist behavior: allowlisted origin receives `Access-Control-Allow-Origin` and `Access-Control-Allow-Credentials: true`.
   - CORS disallowed origin rejected with HTTP 403 `CORS_ORIGIN_DENIED`.
   - CORS wildcard rejection: fail-closed boot if `CORS_ALLOWED_ORIGINS` contains `*` in production.
   - `X-Correlation-ID` compatibility and `X-Request-ID` compatibility.
   - Operational health route exemption: `/health`, `/health/live`, `/health/ready` bypass CORS and rate limiting.

9. `tests/security/authMigrationReadiness.test.js`:
   - Strictly read-only audit checks against mock User collections (0 writes, 0 repairs).
   - Asserts exit code 0 (`INDEX SAFETY PASS`) when non-canonical and duplicate counts are 0.
   - Asserts exit code 1 (`INDEX SAFETY FAIL`) when non-canonical casing/whitespace or duplicate emails exist.
   - Index lifecycle and verification contract assertions:
     1. Proves canonical email schema index declaration remains present in `userSchema` (`userSchema.index({ email: 1 }, ...)`).
     2. Proves User model autoIndex suppression is model-local only (`userSchema.get('autoIndex') === false`).
     3. Proves global Mongoose autoIndex remains unchanged across all Phase 1–13 models (`mongoose.get('autoIndex') !== false`).
     4. Proves failed preflight (exit code 1) prohibits email index activation.
     5. Proves passing preflight (exit code 0) permits the single operator activation mechanism.
     6. Proves exact physical email index options are deeply verified (`name: 'email_1_canonical_unique'`, `key: { email: 1 }`, `unique: true`, and deep semantic check of `partialFilterExpression: { email: { $exists: true, $type: 'string', $gt: '' } }`).
     7. Proves application startup (`src/server.js`) performs independent read-only email index verification.
     8. Proves missing `email_1_canonical_unique` causes startup failure before listener bind.
     9. Proves wrong `unique: false` causes startup failure.
     10. Proves wrong `partialFilterExpression` causes startup failure.
     11. Proves wrong key causes startup failure.
     12. Proves startup does NOT create the email index (zero automatic application index creation).
     13. Proves baseline `User.userId` unique physical index (`userId_1`) remains physically unique.
     14. Proves new `User.status` physical index (`status_1`) remains present.
     15. Proves physical `AuthSession` index verification is preserved (all 7 required non-_id indexes verified at boot, proving tokenId unique, tokenHash unique, userId lookup, sessionId lookup, expiresAt TTL, compound index, and active partial unique index with zero name collision).

10. `tests/security/blocklistIntegrity.test.js`:
    - Asserts local blocklist artifact digest matches `EXPECTED_BLOCKLIST_SHA256` (`fe0b58f7baab02c6a3019a22f80049080747b435097812bf48d11f42f627ef56`).
    - Asserts tampered or missing blocklist file causes deterministic `UNAVAILABLE` state in memory (`authService`); application process may remain running.
    - Asserts subsequent registration or password-changing request returns HTTP 500 `BLOCKLIST_UNAVAILABLE`; zero user records created; zero passwordHash persisted.
    - Proves `EXPECTED_BLOCKLIST_SHA256` is an independent static literal in `src/config/authConfig.js` and not derived dynamically from the runtime artifact.
    - Asserts integrity failure logging uses canonical logger `LOG_EVENT` with `component: 'server'`, message `'Password blocklist integrity initialization failure'` (zero unauthorized events added to event catalog).

11. Existing Phase 12 & 13 Integration Suites:
    - `tests/governance/managePolicy.test.js`: Asserts `POLICY_GOVERNANCE_SECRET` fails closed in `production` and `staging` (exits code 1 if secret is unset or mismatched).
    - `tests/reliability/observabilityTelemetry.test.js`: Asserts metrics endpoint `/metrics` scrape-secret protection:
      - Valid `Authorization: Bearer <METRICS_SCRAPE_SECRET>` succeeds (HTTP 200).
      - Missing or invalid secret fails closed with HTTP 401 `UNAUTHORIZED` when `METRICS_ENABLED === 'true'`.
      - Asserts zero high-cardinality security labels (`userId`, `email`, `IP`, `token`, `sessionId`) in exported Prometheus text.

---

## 50. BASELINE TEST SECURITY ADAPTATION RULES

1. **Permitted Adaptation**: Existing test suites previously sending unauthenticated HTTP requests to `/api/v1/*` may receive mechanical test fixtures (e.g. generating a valid mock access JWT and attaching `Authorization: Bearer <token>`) to traverse the authentication boundary.
2. **Forbidden Changes**:
   - Zero tests may be deleted or skipped.
   - Zero domain assertions (scoring, IRT mastery, SM-2 revisions, Bayesian updates, DAG traversals) may be weakened or modified.
3. **Verification Contract**: Final implementation verification requires executing `npm test` across the entire codebase. The future implementation report must record actual observed suite and test counts directly from Jest output rather than predicting a fabricated combined sum. Baseline invariant requires all 84 baseline suites and all 1156 baseline tests pass without regression, alongside all 10 new security test files.

---

## 51. REQUIRED IMPLEMENTATION ORDER

Future implementation must proceed in the following 26-step dependency-aware sequence:

```text
Step 1:  Create src/config/authConfig.js with all constants, schemas, and validation assertions.
Step 2:  Install authorized runtime dependencies (jsonwebtoken, cookie-parser).
Step 3:  Place src/data/auth/commonPasswordsBlocklist.json and verify SHA-256 digest.
Step 4:  Implement password hashing, NFC normalization, and blocklist utilities.
Step 5:  Update src/models/userModel.js (add passwordHash, status, declare canonical email userSchema.index, configure userSchema.set('autoIndex', false)).
Step 6:  Create src/models/authSessionModel.js with indexes and active-generation partial index.
Step 7:  Create scripts/checkAuthMigrationReadiness.js and verify read-only audit execution.
Step 8:  Implement src/services/authService.js (core auth, sessions, rotation, reuse detection).
Step 9:  Implement src/middleware/authenticate.js (Bearer JWT verification and req.user).
Step 10: Implement src/middleware/authorize.js (ownership guards, enforcePrincipalUserId, and BOLA defense).
Step 11: Implement src/controllers/authController.js and src/routes/authRoutes.js.
Step 12: Implement src/middleware/rateLimiter.js (bounded fixed-window counter).
Step 13: Implement src/middleware/securityHeaders.js and hardened CORS configuration.
Step 14: Update src/server.js (ensures userId_1, ensures status_1, read-only verifies email_1_canonical_unique, creates/verifies AuthSession physical indexes, fails closed before listener bind on any required physical-index mismatch; src/server.js DOES NOT create email_1_canonical_unique) and src/app.js (authoritative 15-stage pipeline: correlation, metrics, security headers, health, metrics gate, global limiter, CORS, cookie parser, JSON parser, auth router, authenticate boundary, Tier-4 LLM limiter for learning routes, Step-13 protected business stage beginning with enforcePrincipalUserIdBodyQuery, notFound, errorHandler).
Step 15: Migrate identity handling in existing controllers (user, goal, studyPlan, objective, attempt).
Step 16: Migrate identity handling in remaining controllers (progress, adaptive, planning, revision).
Step 17: Close POST /api/v1/mock-blueprints (HTTP 403) and migrate mockSessionController.
Step 18: Migrate learningController, analyticsController, orchestrationController, attributionController.
Step 19: Apply route-level ownership guards across src/routes/*.js.
Step 20: Harden scripts/managePolicy.js to require POLICY_GOVERNANCE_SECRET fail-closed in prod/staging.
Step 21: Update scripts/diagnoseSystem.js expected collections from 15 to 16 (add authsessions).
Step 22: Extend src/utils/logger.js with authorized Phase 14 security events.
Step 23: Implement 10 new security test suites in tests/security/*.test.js.
Step 24: Apply mechanical security test fixtures to existing API test suites.
Step 25: Update architecture guard and cross-phase isolation tests (models 15 -> 16, collections 15 -> 16).
Step 26: Execute full verification suite (targeted tests, full Jest suite, verifyPhase2, verifyContentIntegrity, diagnoseSystem).
```

---

## 52. PRE-IMPLEMENTATION MIGRATION GATE & CANONICAL EMAIL INDEX ACTIVATION

To guarantee data safety and prevent downtime or index corruption:
1. **User Schema Email Index Declared & Model-Local Auto-Indexing Suppressed**:
   - The canonical partial unique index on `email` is explicitly declared on `userSchema` in `src/models/userModel.js` exactly as required by the frozen `1.0.4-FROZEN` architecture (`userSchema.index({ email: 1 }, { unique: true, partialFilterExpression: { email: { $exists: true, $type: 'string', $gt: '' } } })`).
   - Automatic email unique index building on server startup before preflight verification is suppressed strictly via User-model-local configuration (`userSchema.set('autoIndex', false)`).
   - Global `mongoose.set('autoIndex', false)` is strictly prohibited; all Phase 1–13 models retain default Mongoose auto-indexing behavior.
   - Baseline User physical indexes (`userId_1` unique, `status_1`) are explicitly ensured and verified during server startup (`src/server.js`) without triggering email index creation.
   - Prohibited commands prior to preflight: `User.createIndexes()` and `User.syncIndexes()` are strictly prohibited before preflight pass.
2. **Read-Only Preflight Audit Prerequisite**:
   - Operator or deployment procedure must execute:
     ```bash
     node scripts/checkAuthMigrationReadiness.js
     ```
   - `scripts/checkAuthMigrationReadiness.js` remains strictly read-only: zero write modes, zero automatic mutations, zero repair flags.
   - Preflight must report `usersWithNonCanonicalEmail === 0` and `duplicateCanonicalEmails === 0`, exiting with code 0 (`INDEX SAFETY PASS`).
   - If preflight reports non-zero duplicates or non-canonical emails, it exits with code 1 (`INDEX SAFETY FAIL`), and unique email index creation is strictly PROHIBITED until the operator resolves records manually. Zero automatic user data mutation is authorized.
3. **Single Authorized Email Index Activation Mechanism**:
   Only after preflight reports exit code 0 (`INDEX SAFETY PASS`), the canonical partial unique index is physically created using exactly ONE authorized operational mechanism:
   - **Authorized Actor**: Deployment/operator procedure.
   - **Mechanism**: MongoDB administrative command executed after the read-only preflight.
   - **Repository File Delta**: **0** (No second Node migration-runner alternative authorized; no new repository script invented).
   - **Exact Administrative Command**:
     ```javascript
     db.users.createIndex(
       { email: 1 },
       {
         unique: true,
         partialFilterExpression: {
           email: {
             $exists: true,
             $type: 'string',
             $gt: ''
           }
         },
         name: 'email_1_canonical_unique'
       }
     );
     ```
   - **Index Activation Mechanism Count**: Exactly **1**.
4. **Deep Semantic Physical Verification & Verification Ownership**:
   After the operator creates the canonical index, both the deployment gate and application boot sequence execute deep semantic verification:
   ```javascript
   const indexes = await User.collection.indexes();
   const emailIndex = indexes.find(idx => idx.name === 'email_1_canonical_unique');
   if (
     !emailIndex ||
     emailIndex.key?.email !== 1 ||
     emailIndex.unique !== true ||
     !emailIndex.partialFilterExpression ||
     emailIndex.partialFilterExpression.email?.$exists !== true ||
     emailIndex.partialFilterExpression.email?.$type !== 'string' ||
     emailIndex.partialFilterExpression.email?.$gt !== ''
   ) {
     throw new Error('Canonical email unique index deep semantic verification failed');
   }
   ```
   A superficial check (such as `!!emailIndex.partialFilterExpression?.email`) is strictly prohibited. Deep semantic verification of the exact filter contract is mandatory.
   - **Verification Ownership**:
     - Canonical email index CREATION owner: Deployment/operator procedure exclusively.
     - Canonical email index boot-time VERIFICATION owner: `src/server.js` independently performs read-only deep semantic verification before listener bind.
     - Boot verification behavior: Strictly READ-ONLY. Zero mutation, zero creation, zero repair, zero automatic index building.
     - Boot verification failure behavior: Fail closed before HTTP listener bind.
   - **Distinction Between Activation and Verification**:
     ```text
     Email Index Activation Mechanism Count: 1
     Operator-created email index: YES
     Application-created email index: NO
     Deployment-gate email index verification: YES
     Application boot email index verification: YES
     Boot email index verification mutates database: NO
     ```
     Two verification locations do NOT constitute two activation mechanisms.
   - Failure means:
     - Phase 14 deployment NOT READY.
     - Authentication registration traffic NOT accepted.
     - Implementation acceptance NOT granted.
5. **Prescribed Deployment Order**:
   The authoritative deployment sequence is frozen as a single, unambiguous 9-step sequence:
   ```text
   1. Deploy/build Phase 14 artifacts without accepting application traffic.

   2. Run:
      node scripts/checkAuthMigrationReadiness.js

   3. If exit code != 0:
      STOP.
      Operator manually resolves canonicalization/index-safety blockers.
      Do not create email index.
      Do not start Phase 14 production traffic.

   4. If exit code == 0:
      Operator/deployment procedure creates exactly:

      db.users.createIndex(
        { email: 1 },
        {
          unique: true,
          partialFilterExpression: {
            email: {
              $exists: true,
              $type: 'string',
              $gt: ''
            }
          },
          name: 'email_1_canonical_unique'
        }
      );

   5. Deployment/operator gate performs deep semantic verification
      of email_1_canonical_unique.

   6. Start Phase 14 application.

   7. During src/server.js startup:
      a. ensure userId_1
      b. ensure status_1
      c. read User.collection.indexes()
      d. verify userId_1
      e. verify status_1
      f. independently READ-ONLY deep-verify email_1_canonical_unique
      g. execute AuthSession.createIndexes()
      h. verify required AuthSession physical indexes

   8. If ANY startup physical-index verification fails:
      fail closed before listener bind.

   9. Only after every startup verification succeeds:
      bind HTTP listener and accept traffic.
   ```
   Zero automatic user data mutation is authorized.

---

## 53. IMPLEMENTATION ACCEPTANCE CRITERIA

The Phase 14 implementation will be declared complete when:
1. Plaintext passwords persisted = 0.
2. Raw refresh tokens persisted = 0.
3. Passwords, raw tokens, or hashes logged in stdout/stderr = 0.
4. Client-supplied caller identity trusted for execution = 0.
5. Unauthorized cross-user access allowed = 0.
6. Web operator role bypasses in HTTP business routes = 0.
7. Web routes for Phase 12 policy governance = 0.
8. Active refresh token records per session family > 1 = 0.
9. Learner mutation of global mock blueprint definitions = 0.
10. Cookie-bearing refresh accepted without verified allowlisted Origin = 0.
11. Node application emits HSTS = 0.
12. Prometheus metric families = 8 (zero added).
13. High-cardinality metric labels added = 0.
14. Mongoose models = 16. MongoDB collections = 16.
15. Runtime dependencies added = 2 (`jsonwebtoken`, `cookie-parser`).
16. Dev dependencies added = 0.
17. All 84 pre-Phase-14 baseline suites pass (1156 tests passing).
18. All 10 Phase 14 security test suites pass.
19. `npm run verify:phase2` passes.
20. `npm run verify:content` passes.
21. Canonical email index created automatically by application = 0.
22. Canonical email index activation mechanisms = 1.
23. Canonical email index deeply verified at application startup = YES.
24. Application accepts traffic while canonical email index is missing/malformed = 0.

---

## 54. VERIFICATION COMMAND EXECUTION MATRIX

```bash
# 1. Targeted Phase 14 Security Suites
npm test -- tests/security/

# 2. Phase 13 Reliability & Observability Verification
npm test -- tests/reliability/

# 3. Phase 12 Policy Governance Verification
npm test -- tests/governance/

# 4. Cross-Phase Isolation & Architecture Guard Verification
npm test -- tests/architecture_guard.test.js tests/orchestration/phase9CrossPhaseIsolation.test.js tests/attribution/attributionIssuance.test.js tests/analytics/phase8CrossPhaseIsolation.test.js tests/simulation/phase11CrossPhaseIsolation.test.js tests/phase3_regression.test.js

# 5. Complete Jest Suite
npm test
# Record actual post-implementation suite count and test count from Jest output.

# 6. Question Bank Intelligence & Content Verification
npm run verify:phase2
npm run verify:content

# 7. System Diagnostic CLI Verification (16 Collections)
node scripts/diagnoseSystem.js

# 8. Auth Migration Readiness Audit CLI (Read-Only)
node scripts/checkAuthMigrationReadiness.js
```

---

## 55. PERFORMANCE & RESOURCE UTILIZATION EVIDENCE CRITERIA

1. **Configured Registry Bounds**: Bounded registry map size satisfies `registry.size <= RATE_LIMIT_MAX_KEYS` (default 10,000 entries).
2. **Zero Timer Leaks**: Rate limiter utilizes a single unref background sweeper interval; zero per-key timers created.
3. **Scrypt Execution Bounds**: Scrypt key derivation executes successfully with frozen parameters N=16384, r=8, p=5, maxmem=128 MiB (134,217,728 bytes).
4. **Benchmarking & Latency Observation**: Measure observed scrypt derivation latency, memory usage, and CPU consumption under benchmarking. (Note: `SCRYPT_MAXMEM=128 MiB` is an execution memory ceiling for OpenSSL scrypt internal buffer allocation, not a claim of process-wide memory consumption).
5. **Bounded Concurrency Behavior**: Measure observed authentication concurrency behavior under load without assuming multi-document transactions.
6. **Stateless JWT Verification**: Access JWT authentication performs zero MongoDB queries.
7. **Session Query Boundary**: Ordinary authenticated business requests perform zero `authsessions` queries.

---

## 56. EXPLICIT PLATFORM NON-GOALS

The following capabilities are explicitly out of scope for Phase 14:
- Web operator, teacher, mentor, school admin, or institution admin roles.
- Learner API keys (long-lived bearer tokens for programmatic access).
- Device fingerprinting (client canvas/WebGL/audio fingerprinting or tracking).
- External Identity Providers (IdP).
- OAuth, OpenID Connect, social logins, or SSO.
- Email verification services, outbound emails, or password reset flows.
- Multi-Factor Authentication (MFA), TOTP, or WebAuthn/Passkeys.
- Distributed Redis caching or Redis-backed rate limiting.
- Frontend UI components or single-page application integration (Phase 15).
- Infrastructure TLS termination and edge HSTS deployment (Phase 16).

---

## 57. SPECIFICATION SELF-CONSISTENCY & SELECTED-CONTRACT AUDIT

Audit of active/selected architecture contracts confirms:
- Selected bcrypt contract: 0 (node:crypto.scrypt exclusively selected)
- Selected Argon2id contract: 0 (node:crypto.scrypt exclusively selected)
- Selected NFKC normalization contract: 0 (Unicode NFC normalization exclusively selected)
- Selected JWT_REFRESH_SECRET contract: 0 (Cryptographically random tokens with SHA-256 persistence exclusively selected)
- Selected SameSite=None contract: 0 (SameSite=Strict exclusively selected)
- Selected sliding-window limiter contract: 0 (Bounded fixed-window counter exclusively selected)
- Selected active-key LRU eviction contract: 0 (Zero active-key eviction; fail-closed capacity saturation exclusively selected)
- Selected application-owned HSTS contract: 0 (HSTS owned exclusively by Phase 16 edge reverse proxy)
- Selected web-operator authorization contract: 0 (Zero web-operator roles or route bypasses; Phase 12 host CLI exclusively authorized)
- Selected DATABASE_ACTIVE policy source: 0 (Active policy state resolution preserved from frozen Phase 12/13 contracts)
- Selected scripts/diagnostics.js reference: 0 (Canonical diagnostics script is scripts/diagnoseSystem.js exclusively)
- Selected application email-index creation: 0 (Application boot verification is strictly read-only)
- Canonical email index activation mechanisms: 1 (Administrative MongoDB command executed by operator after passing preflight)
- Email index verification ownership ambiguity: 0 (src/server.js unambiguously owns boot-time deep semantic verification)
- Universal body/query guard before Tier-4 LLM limiter: 0
- Tier-4 LLM limiter before authenticate boundary: 0
- Frozen middleware pipeline stages: 15 (preserved without 16th stage)
- Selected disabled-account refresh bypass: 0
- Selected refresh token issuance for disabled account: 0
- Selected login query without explicit passwordHash inclusion: 0
- Selected JWT without jti: 0
- Selected malformed mandatory JWT principal claims accepted: 0
- Selected ordinary business User-status DB lookup: 0
- Selected unconditional Secure cookie-clearing contract: 0
- Selected reversed verifyPassword invocation: 0
- Selected verifyPassword signature: verifyPassword(password, encodedHash)
- Required AuthSession non-_id physical indexes: 7
- Selected unverified required AuthSession physical index: 0
- Selected duplicate plain sessionId lookup declaration: 0
- Selected same-name collision between plain and partial sessionId indexes: 0
- Selected partial active-session index name: sessionId_active_unique
- Selected unauthorized Phase 14 logger optional field: 0
- Selected AUTH_ACCOUNT_DISABLED userId/sessionId payload dependency: 0
- Selected registration “reject OR strip” ambiguity: 0
- Selected replay gap allowing successor creation after prior replay detection: 0
- Selected replay marker using new schema field: 0
- Selected replay marker using existing predecessor status: revoked
- Selected successor issuance without post-create predecessor validation: 0
- Selected MongoDB transaction dependency: 0
- Selected per-tier independent rate-limit registry: 0
- Selected process-wide rate-limit registry count: 1
- Selected process-wide rate-limit sweeper count: 1
- Selected malformed Tier-2 key extraction exception: 0
- Selected missing Tier-3 cookie key extraction exception: 0
- Selected express.json scalar-validation assumption: 0

Note: Historical, rejected, forbidden, and non-goal textual mentions of deprecated alternatives are documented for governance traceability, but active selected contracts for these mechanisms are exactly 0.

---

## 58. RECOMMENDED NEXT GATE

```text
===============================================================================
RECOMMENDED NEXT GATE:
PHASE 14 IMPLEMENTATION AUTHORIZATION
===============================================================================

This document represents the frozen prescriptive specification (v1.0.8-FROZEN).
Zero production code, schemas, or dependencies have been modified.
Implementation authorization is NONE.
Implementation performed: NO.

Operator action required:
Authorize implementation of docs/PHASE14_SECURITY_IDENTITY_PLATFORM_PROTECTION_SPECIFICATION.md v1.0.8-FROZEN.
================================================================================
```
