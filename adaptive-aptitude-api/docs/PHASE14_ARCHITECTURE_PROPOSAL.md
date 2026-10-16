# PHASE 14 — SECURITY, IDENTITY & PLATFORM PROTECTION
## ARCHITECTURE PROPOSAL

```text
Document: docs/PHASE14_ARCHITECTURE_PROPOSAL.md
Version: 1.0.4-FROZEN
Status: VERIFIED / COMPLETE / FROZEN
Base Platform: Phases 1–13 VERIFIED / COMPLETE / FROZEN
Implementation Authorization: NONE
Date: October 2026
```

---

## 1. STATUS / METADATA

| Property | Value |
|---|---|
| **Document Target** | `docs/PHASE14_ARCHITECTURE_PROPOSAL.md` |
| **Document Version** | `1.0.4-FROZEN` |
| **Document Status** | `VERIFIED / COMPLETE / FROZEN` |
| **Implementation Authorization** | `NONE` (Architecture Frozen Only) |
| **Preceding Gate** | Phase 13 ROPH (Reliability, Observability & Production Hardening) — Permanently Frozen (`v1.0.9-FROZEN`) |
| **Target Platform** | Node.js (macOS / Linux Container), Express 4.19, Mongoose 8.4, MongoDB 7.x |
| **Scope Boundary** | Identity, Authentication, Authorization, Session Lifecycle, Platform Abuse Protection, API Boundary Security |
| **Subsequent Gate** | Phase 14 Prescriptive Specification |

---

## 2. FROZEN PHASE 1–13 BASELINE & MODEL/COLLECTION TRANSITION

Phase 14 operates strictly on top of the verified, permanently frozen terminal baseline established by Phases 1 through 13.

### 2.1 Frozen Platform Metrics & Invariants

```text
Jest Test Suites:         84 / 84 passing
Total Tests:              1156 / 1156 passing
Phase 2 Verification:     PASS (scripts/verifyPhase2.js)
Content Integrity:        PASS (scripts/verifyContentIntegrity.js)
Pre-Phase-13 Regressions: 0
Active Blockers:          0
Current Mongoose Models:  15
Current Mongo Collections:15
Runtime Dependencies:     4 (cors, dotenv, express, mongoose)
Dev Dependencies:         3 (jest, nodemon, supertest)
```

### 2.2 Controlled Cross-Phase Model & Collection Evolution (15 → 16)
The frozen Phase 13 platform enforces a strict baseline of exactly 15 Mongoose models and 15 MongoDB collections:
- The frozen Phase 13 diagnostic CLI (`scripts/diagnoseSystem.js`) verifies `EXPECTED_COLLECTIONS` containing exactly 15 collection names and flags any unexpected application collections as `UNHEALTHY`.
- The frozen architecture guard (`tests/architecture_guard.test.js`) and cross-phase isolation suites assert `files.length === 15` and `EXPECTED_COLLECTIONS.length === 15`.

**Authoritative Transition Contract**:
1. Phase 14 proposes adding exactly **1 new Mongoose model** (`AuthSession`) and **1 new MongoDB collection** (`authsessions`), transitioning the live platform invariant from:
   ```text
   15 models / 15 collections  ──►  16 models / 16 collections
   ```
2. The historical Phase 13 documentation (`docs/PHASE13_*.md`) remains permanently frozen and **MUST NOT** be modified or rewritten.
3. The future Phase 14 implementation inventory authorizes the explicit updates to the live runtime guards:
   - `scripts/diagnoseSystem.js`: Evolve `EXPECTED_COLLECTIONS` by appending `'authsessions'` (16 collections total). The diagnostic CLI remains strictly **read-only**, **sole-writer compliant**, with **5/5 Phase 12 governance operations unchanged**, **policy-source taxonomy unchanged**, and **zero repair behavior**.
   - `tests/reliability/diagnosticsCli.test.js`: Update expected collections assertion from 15 to 16.
   - `tests/architecture_guard.test.js`: Update model and collection count invariant assertions from 15 to 16, proving:
     - Mongoose models = 16 exactly
     - MongoDB collections = 16 exactly
     - Sole new model = `AuthSession`
     - Sole new collection = `authsessions`
   - Cross-phase isolation tests (`tests/orchestration/phase9CrossPhaseIsolation.test.js`, `tests/attribution/attributionIssuance.test.js`, `tests/analytics/phase8CrossPhaseIsolation.test.js`, `tests/simulation/phase11CrossPhaseIsolation.test.js`, `tests/phase3_regression.test.js`): Transition model count assertions to 16 during Phase 14 implementation.

### 2.3 Authoritative Phase Precedence Hierarchy

```text
Frozen Phases 1–13 Contracts
>
Phase 14 Architecture Proposal (this document)
>
Future Phase 14 Prescriptive Specification
>
Future Phase 14 Implementation Details
```

Phase 14 MUST adapt to the existing platform. Phase 14 MUST NEVER redesign, weaken, bypass, or mutate frozen contracts from earlier phases:
1. **Phase 2–4 Question Intelligence & Mastery**: Pure deterministic IRT and Bayesian mastery updates; zero auth pollution in question bank.
2. **Phase 5 Planning & Revision Engine**: Spaced repetition SM-2 intervals, study plan generation, and revision idempotency records.
3. **Phase 6 Mock Test Engine**: Distributed lease locking (`mockAttemptFinalizationRecord`), time-bounded sessions, and zero answer leakage prior to finalization.
4. **Phase 7 Intelligent Learning & LLM**: Fallback degradation contracts, zero-retention data privacy compliance, and LLM factory abstractions.
5. **Phase 8 Cognitive Analytics Engine**: Deterministic analytics calculation, lease-aware lockout, and progress aggregations.
6. **Phase 9 Prescriptive Orchestration & NBA**: Zero-write policy arbiter, dynamic intervention generation, and orchestration context isolation.
7. **Phase 10 Prescription Adherence & Outcome Attribution**: Controlled intervention life-cycle transitions, lease expiry bounds, and prescription execution tracking.
8. **Phase 11 Policy Calibration & Offline Simulation**: Isolated offline sandbox simulation with read-only database boundary.
9. **Phase 12 Prescriptive Policy Versioning & Governance (PPVG)**: Host CLI trust boundary with `POLICY_GOVERNANCE_SECRET`, SHA-256 fingerprinting, immutability, sole-writer guarantee, and active version fallback.
10. **Phase 13 Reliability, Observability & Production Hardening (ROPH)**: `correlationMiddleware` execution first, authoritative `activeRequestCount` tracking, graceful shutdown draining, bounded 8-metric registry with <700 total series cap and 33 canonical route labels, structured log sanitization, and read-only diagnostic CLI (`scripts/diagnoseSystem.js`).

---

## 3. CURRENT SECURITY SOURCE AUDIT

An exhaustive mechanical source audit of the repository was executed following the freezing of Phase 13.

### 3.1 Package Manifest & Dependencies (`package.json`)
- **Runtime Dependencies**: Exactly 4 packages installed: `cors (^2.8.5)`, `dotenv (^16.4.5)`, `express (^4.19.2)`, `mongoose (^8.4.3)`.
- **Security Dependencies**: Zero security libraries present. No password hashing (`scrypt`, `bcrypt`, `argon2`), no token signing (`jsonwebtoken`, `jose`), no cookie parser (`cookie-parser`), no security headers (`helmet`), no rate limiter (`express-rate-limit`).

### 3.2 Application Mounting & Pipeline (`src/app.js`)
- `correlationMiddleware` is mounted first (line 52); `metricsMiddleware` is mounted second (line 55).
- Line 58 invokes `app.use(cors())` with zero options (wildcard `*` permitting any origin, method, or header).
- Line 59 invokes `app.use(express.json())` without an explicit `limit` parameter.
- No security headers are configured.
- 16 business route files are mounted under `/api/v1/*` without authentication or authorization.
- Probes `/health`, `/health/live`, `/health/ready` are unauthenticated; `/metrics` is unauthenticated when `METRICS_ENABLED === 'true'`.

### 3.3 Server Lifecycle & Configuration (`src/server.js`)
- Graceful shutdown request draining and process error normalization are present.
- Lacks secret strength validation and TLS/HTTPS enforcement.

### 3.4 User Identity Model (`src/models/userModel.js`)
- Schema contains: `userId` (String, required, unique), `name` (String, required), `email` (String, optional, lowercase), `avatar` (String, optional).
- No password hash, salt, role, account status (`status`, `isActive`), or session tracking fields exist.

### 3.5 Controller & Route Vulnerability Audit (BOLA / IDOR Analysis)
- Universal BOLA / IDOR across 100% of student endpoints:
  - `userController.js`: `createUser` accepts arbitrary `userId` in `req.body`; `getUser` fetches `req.params.userId` without authentication.
  - `goalController.js`: `updateGoal` and `deleteGoal` check `req.body.userId` for "ownership verification" (`goal.userId !== requestingUserId`), allowing arbitrary goal tampering if attacker supplies the victim's `userId`.
  - `attemptController.js`: `createAttempt` binds `req.body.userId`; `getAttemptsByUser` fetches `req.params.userId` unauthenticated.
  - `studyPlanController.js`, `dailyObjectiveController.js`, `progressRoutes.js`, `revisionController.js`, `mockSessionController.js`, `learningController.js`: All accept client-supplied `userId` without authentication.
  - `analyticsGuard.js`, `orchestrationGuard.js`, `attributionGuard.js`: Check `req.query.userId` and verify `User.exists()`, but perform zero caller authentication.

### 3.6 Phase 12 Governance Boundary (`scripts/managePolicy.js`)
- Governance operations are strictly **HOST-CLI-ONLY**. Web API routes for governance mutations do NOT exist.
- Gate requires `--secret <val>` matching `POLICY_GOVERNANCE_SECRET` via `crypto.timingSafeEqual`, with a legacy `--confirm` fallback when the secret is unset.

### 3.7 Phase 13 Observability & Security Redaction (`src/utils/logger.js`, `src/utils/metrics.js`)
- `logger.js` sanitizes MongoDB URIs, Bearer tokens, secrets, and user paths; redacts sensitive keys matching `/password|token|secret|authorization|key|auth|answers|selectedoptions|options/i`.
- `metrics.js` enforces a bounded 8-metric registry with <700 total series cap and 33 canonical route labels. Contains zero `userId`, `email`, or `IP` metric labels.

---

## 4. EXISTING SECURITY CAPABILITIES

1. **Log Redaction & Secret Masking**: Pattern-based automated secret scrubbing in `logger.js`.
2. **Context Correlation**: Request correlation tracing via `correlationMiddleware` and Node.js `AsyncLocalStorage`.
3. **Schema Typing**: Mongoose schema types and regex validators provide basic validation.
4. **Concurrency Leases**: Lease locks on mock finalization and prescription execution.
5. **Phase 12 Administrative Gate**: Constant-time secret validation (`crypto.timingSafeEqual`) for policy governance CLI.
6. **Graceful Request Draining**: Draining of active requests during process termination.

---

## 5. SECURITY GAPS

| Category | Finding / Gap | Vulnerability Impact |
|---|---|---|
| **Authentication** | Zero credential storage, verification, or session management. | Anonymous access to all platform operations. |
| **Authorization** | Direct trust of client-supplied `userId` in body, params, and query. | Universal BOLA / IDOR across all student resources. |
| **Abuse Protection** | Zero rate limiting or request throttling. | Vulnerability to brute force, credential stuffing, and LLM endpoint DoS. |
| **Transport Boundary** | Open CORS (`*`); missing standard HTTP security headers. | Vulnerability to cross-origin data exposure, MIME-sniffing, and clickjacking. |
| **Payload Protection** | No explicit JSON payload size limit configured. | Memory exhaustion vulnerability via oversized payloads. |
| **Governance Surface** | Governance secret fallback to `--confirm` if unset in environment. | Host execution without configured secret is insecure in staging/production. |
| **Telemetry Exposure** | `/metrics` probe is unauthenticated when enabled. | Operational telemetry exposed to network eavesdroppers. |

---

## 6. THREAT MODEL

We apply STRIDE and OWASP Top 10 API Security 2023 threat modeling. Residual risks are stated realistically using contextual, non-minimizing language (`LOW`, `BOUNDED`, `REDUCED`, `DEPLOYMENT-DEPENDENT`, `REQUIRES PHASE 16 EDGE CONTROL`). Zero unsupported absolutes are used.

| Threat ID | Threat Name / Vector | Potential Impact | Preventive Control | Detective Control | Failure Behavior | Test Strategy | Residual Risk |
|---|---|---|---|---|---|---|---|
| **TM-01** | **BOLA / IDOR** | Attacker accesses or mutates another student's data. | Authoritative Principal binding (`req.user.userId`). Strict ownership checks. | Log `AUTH_ACCESS_DENIED`. | `403 FORBIDDEN` (`OWNERSHIP_VIOLATION`). | Automated cross-user tamper tests on all endpoints. | LOW for authenticated endpoints; bounded by route ownership assertions. |
| **TM-02** | **Credential Stuffing & Brute Force** | Dictionary attacks against login. | Bounded fixed-window rate limiting on login/register (IP + email). | Log `AUTH_LOGIN_FAILED` and `AUTH_RATE_LIMITED`. | `429 TOO_MANY_REQUESTS` or `401 INVALID_CREDENTIALS`. | Deterministic fast-clock rate-limit simulations. | BOUNDED locally; distributed botnets require edge WAF in Phase 16. |
| **TM-03** | **Password Hash Compromise** | Offline cracking if database is dumped. | `node:crypto.scrypt` with 16-byte random salt, OWASP parameter profile ($N=16384, r=8, p=5$). | Static schema guard enforcing hashed storage only. | Rejects plaintext/weak hashing. | Automated schema and hashing verification tests. | BOUNDED by scrypt memory-hardness and password entropy. |
| **TM-04** | **Access Token Theft (XSS)** | Attacker steals Bearer token from client. | 15-minute token lifetime. Tokens stored only in client memory (never localStorage). | Bounded token lifetime. | Token expires in <= 15 minutes. | Fast-clock expiry verification tests. | BOUNDED to <= 15-minute exposure window upon client compromise. |
| **TM-05** | **Refresh Token Theft & Replay** | Attacker steals refresh token. | Refresh Token Rotation: Each refresh invalidates predecessor. Automatic reuse detection revokes session family. SHA-256 hashed at rest. | Log `AUTH_REFRESH_REUSE_DETECTED`. | Revokes active records in that `sessionId` family. `401 REFRESH_REUSE_DETECTED`. | Token replay attack simulation suite. | REDUCED; requires edge HTTPS to prevent in-transit interception. |
| **TM-06** | **Session Fixation** | Attacker pre-creates session identifier before login. | Fresh `sessionId` and `tokenId` allocated on every successful login. | Log `AUTH_LOGIN_SUCCESS`. | Old session identifiers unreferenced. | Session ID generation tests. | LOW after server-generated session identifiers. |
| **TM-07** | **CSRF on State Mutations** | Third-party site triggers state-changing actions. | Business requests require `Authorization: Bearer`. Refresh cookie requires `Origin` header matching `CORS_ALLOWED_ORIGINS` and `SameSite=Strict`. | Origin header verification on refresh endpoint. | `401 UNAUTHORIZED`, `403 REFRESH_ORIGIN_REQUIRED`, or `403 CORS_ORIGIN_DENIED`. | Headless CSRF payload tests. | REDUCED by Bearer headers, required Origin matching, and SameSite=Strict cookies; deployment-dependent on same-site topology. |
| **TM-08** | **Privilege Escalation** | Student attempts administrative actions. | HTTP authorization enforces learner resource ownership. Administrative operations restricted to host CLI. | Log `AUTH_ACCESS_DENIED`. | `403 FORBIDDEN`. | Cross-privilege boundary tests. | LOW (no web operator role exists). |
| **TM-09** | **Mass Assignment** | Caller sends arbitrary fields during registration. | Strict DTO allowlisting. Destructure only `{ name, email, password }`. | Validation schema strips unapproved fields. | `400 VALIDATION_ERROR` or ignored properties. | Mass assignment fuzz tests. | LOW with strict DTO allowlisting. |
| **TM-10** | **NoSQL Operator Injection** | Attacker sends `{ "email": { "$ne": null } }`. | Explicit query construction, scalar type checks (`typeof val === 'string'`), DTO allowlisting. | DTO validator throws on non-scalar. | `400 VALIDATION_ERROR`. | MongoDB operator fuzzing tests. | LOW with scalar type enforcement. |
| **TM-11** | **Oversized Request DoS** | Attacker sends 50MB payload to exhaust event loop. | Express body parser size cap: `express.json({ limit: '100kb' })`. | Body parser error handler. | `413 PAYLOAD_TOO_LARGE`. | Large payload POST stress tests. | BOUNDED by parser limit; connection-level DoS remains deployment-dependent. |
| **TM-12** | **Account Enumeration (Login)** | Attacker discovers registered emails via timing or error messages. | Identical public error (`INVALID_CREDENTIALS`). Dummy scrypt verification on non-existent users for timing parity. | Log `AUTH_LOGIN_FAILED`. | `401 INVALID_CREDENTIALS`. | Timing parity and response assertion tests. | REDUCED; network latency jitter provides residual variance. |
| **TM-13** | **Secret Leakage in Logs** | Secrets or tokens printed in stdout/stderr. | Automated scrubbing in `logger.js` (`sanitizeString` + `redact`). Zero identity labels in metrics. | Static lint guards; test output assertions. | Scrubbed to `'[REDACTED]'`. | Automated test suite log assertion scanning. | BOUNDED by redaction patterns. |
| **TM-14** | **Log Injection** | Attacker injects CRLF (`\r\n`) to forge log lines. | String sanitization; JSON-lines serialization escapes newlines. | Logger sanitizes unescaped newlines. | Escaped as `\n` in JSON string. | CRLF log injection tests. | LOW with JSON string serialization. |
| **TM-15** | **CORS Misconfiguration** | Malicious site reads sensitive student analytics. | Explicit `CORS_ALLOWED_ORIGINS` whitelist. Disallowed origins rejected with HTTP 403 `CORS_ORIGIN_DENIED`. | Reject unapproved `Origin`. | `403 CORS_ORIGIN_DENIED`. | CORS header verification tests. | LOW if allowlist is correctly configured. |
| **TM-16** | **Proxy / IP Spoofing** | Attacker forges `X-Forwarded-For` to bypass rate limits. | `trust proxy = false` by default. Rate limiter uses direct socket IP unless explicit trusted proxy configured. | Normalized client IP extraction. | Limits applied to socket IP. | IP header spoofing test suite. | BOUNDED; requires correct reverse proxy configuration in production. |
| **TM-17** | **Governance Mutation Abuse** | Compromised user attempts policy promotion. | Governance mutations restricted to host CLI with `POLICY_GOVERNANCE_SECRET`. Web routes non-existent. | CLI emits audit log with operator ID. | CLI fails closed (exit code 1). | CLI trust gate tests. | BOUNDED by host-level access security. |
| **TM-18** | **Algorithm Confusion (JWT)** | Attacker alters JWT header to `alg: "none"`. | Strict verification option `algorithms: ['HS256']`. Rejects `none` or mismatched keys. | JWT verify error. | `401 INVALID_TOKEN`. | Algorithm confusion test suite. | LOW with strict algorithm + kid enforcement. |
| **TM-19** | **LLM Endpoint Resource Exhaustion** | Attacker floods expensive LLM routes. | Tier 4 rate limit on `/api/v1/learning/*` keyed by authenticated `userId`. | Log `AUTH_RATE_LIMITED`. | `429 TOO_MANY_REQUESTS`. | Rate limit burst tests. | BOUNDED by per-user rate limit tiers. |
| **TM-20** | **Clock Skew Token Invalidation** | Container clock drift causes premature token rejection. | 30-second clock tolerance configured in JWT verification. | Log token verification failure only if skew exceeded. | Rejects tokens outside leeway. | Clock skew tolerance unit tests. | BOUNDED by 30-second tolerance. |
| **TM-21** | **Account Disabled Bypass** | Disabled student continues using access tokens. | Disabled check enforced on login and refresh. Existing access tokens expire in <= 15 minutes. | Log `AUTH_ACCOUNT_DISABLED`. | `403 ACCOUNT_DISABLED` on login/refresh. | Account status transition tests. | BOUNDED residual exposure of <= 15 minutes for in-flight access tokens. |
| **TM-22** | **Unauthenticated Metrics Scraping** | Network attacker scrapes internal application metrics. | `/metrics` requires `Authorization: Bearer <METRICS_SCRAPE_SECRET>` in production when enabled. | Timing-safe secret verification. | `401 UNAUTHORIZED`. | Metrics endpoint access tests. | BOUNDED by scrape secret secrecy. |
| **TM-23** | **Shared Blueprint Mutation Abuse** | Attacker modifies global exam blueprint definitions. | `POST /api/v1/mock-blueprints` is closed to learner HTTP access (`HTTP 403 BLUEPRINT_MUTATION_CLOSED`). | Controller rejects mutation. | `403 BLUEPRINT_MUTATION_CLOSED`. | Unauthorized blueprint mutation test suite. | LOW (creation route closed to learner HTTP traffic). |
| **TM-24** | **Duplicate Registration Enumeration** | Attacker probes registration to confirm email presence. | Registration rejects duplicates with HTTP 409 `EMAIL_ALREADY_REGISTERED`. Bounded Tier 2 rate limit. | Rate limiter tracks registration attempts. | `429 TOO_MANY_REQUESTS` or `409 EMAIL_ALREADY_REGISTERED`. | Duplicate registration probe tests. | RESIDUAL RISK REMAINS (confirmed account existence); mitigated by rate limiting and zero profile disclosure. |
| **TM-25** | **Blocklist Artifact Tampering** | Attacker modifies local password blocklist file. | SHA-256 digest verification at module startup against constant in `src/config/authConfig.js`. | Integrity check failure. | `500 BLOCKLIST_UNAVAILABLE` (fail closed). | Blocklist integrity validation tests. | BOUNDED by host-filesystem write protections and startup digest assertion. |
| **TM-26** | **Cross-Site Refresh Cookie Mismatch** | Third-party domain attempts to trigger refresh exchange. | `SameSite=Strict` cookie policy; refresh endpoint requires and validates `Origin` against `CORS_ALLOWED_ORIGINS`. | Origin requirement & validation check. | `403 REFRESH_ORIGIN_REQUIRED` or `403 CORS_ORIGIN_DENIED`. | Cross-origin refresh cookie simulation tests. | DEPLOYMENT-DEPENDENT (requires same-site topology between frontend and API in Phase 15/16). |
| **TM-27** | **Metrics Scrape Credential Abuse** | Malicious scraper attempts to brute-force scrape secret. | Constant-time bearer secret verification; probe fails closed if unconfigured. | Scrape authorization check. | `401 UNAUTHORIZED`. | Scraper secret verification tests. | BOUNDED by bearer secret entropy. |

---

## 7. CANDIDATE ARCHITECTURE OPTIONS & WEIGHTED DECISION MATRIX

### 7.1 Objective Evaluation Criteria (Total = 100%)
1. **Security Strength & Compromise Containment (20%)**
2. **CSRF & XSS Resistance (15%)**
3. **Session Revocation & Lifecycle Control (15%)**
4. **Horizontal Scalability & Performance (10%)**
5. **Decoupled API & Multi-Client Compatibility (10%)**
6. **Operational Complexity & Dependency Burden (10%)**
7. **Testability & Hermetic Simulation (10%)**
8. **Backward Compatibility & Contract Preservation (10%)**

### 7.2 Decision Matrix & Architecture Selections

| Dimension | Candidate Options | Weighted Score | Verdict | Rationale |
|---|---|---|---|---|
| **Identity & Session** | Opt 1A: Stateless JWT Only<br>Opt 1B: JWT + Rotated Refresh Ledger (Selected)<br>Opt 1C: Stateful Session Cookies<br>Opt 1D: External IdP | 6.85 / 10<br>**9.05 / 10**<br>6.35 / 10<br>6.85 / 10 | REJECTED<br>**SELECTED**<br>REJECTED<br>REJECTED | Opt 1B provides short access exposure (15m), instant refresh revocation, and mechanical reuse detection without DB lookups on business requests. |
| **Credential Strategy** | Opt 2A: Local Email/Password<br>Opt 2B: Passwordless Email Links<br>Opt 2C: OAuth Only<br>Opt 2D: Local Email/Password + Extensible Schema (Selected) | 8.60 / 10<br>6.00 / 10<br>6.70 / 10<br>**8.80 / 10** | DEFERRED<br>REJECTED<br>REJECTED<br>**SELECTED** | Opt 2D is hermetic, offline-testable, requires zero external network dependencies, and preserves clean forward-compatibility. |
| **Password Hashing** | Opt 3A: Argon2id<br>Opt 3B: bcrypt (Work factor 12)<br>Opt 3C: node:crypto.scrypt with OWASP parameters (Selected) | 7.20 / 10<br>8.10 / 10<br>**9.10 / 10** | REJECTED<br>REJECTED<br>**SELECTED** | Opt 3C uses Node's native memory-hard scrypt module with OWASP parameters, eliminating C++ native addon build fragility and adding zero runtime dependencies. |
| **Authorization Model** | Opt 4A: Auth Only<br>Opt 4B: Simple Web RBAC<br>Opt 4C: Learner Principal + Strict Resource Ownership (Selected)<br>Opt 4D: ABAC / OPA | 5.70 / 10<br>7.40 / 10<br>**9.10 / 10**<br>6.50 / 10 | REJECTED<br>REJECTED<br>**SELECTED**<br>REJECTED | Opt 4C eliminates BOLA/IDOR by binding data strictly to the authenticated principal. Web operator role is removed as unjustified by existing HTTP endpoints. |
| **Refresh Transport** | Opt 5A: JSON Response Refresh Token<br>Opt 5B: HttpOnly Cookie Only (Selected)<br>Opt 5C: localStorage for All Tokens | 7.50 / 10<br>**8.90 / 10**<br>4.20 / 10 | REJECTED<br>**SELECTED**<br>REJECTED | Opt 5B isolates refresh credentials from client-side script access, preparing cleanly for Phase 15 web application integration. |

---

## 8. SELECTED PHASE 14 ARCHITECTURE (RECONCILED)

```text
Identity Model:           Local Identity (Email/Password) with server-generated userId (UUID)
Password Hashing:         node:crypto.scrypt (OWASP-compliant: N=16384, r=8, p=5, salt: 16 bytes, keylen: 64)
Password Policy:          Minimum 15 Unicode code points, maximum 128 code points, zero composition rules
Unicode Normalization:    NFC normalization applied before length check and hashing
Common Password Defense:  Deterministic local repository blocklist artifact (zero runtime network dependency)
Authentication Mechanism: Short-Lived Access JWT (15 min) + Rotated Persisted Refresh Token Ledger (7-day absolute)
Access Token Transport:   Authorization: Bearer <access_token> in HTTP headers (stored in client memory)
Refresh Token Transport:  HttpOnly, Secure (prod), SameSite=Strict cookie (Path=/api/v1/auth/refresh)
Refresh Origin Policy:    Origin header REQUIRED on refresh; unapproved Origin rejected with 403
Raw Refresh Persistence:  PROHIBITED (stored strictly as SHA-256 hash)
Session Revocation Model: Immediate refresh invalidation; access JWTs expire naturally in <= 15 minutes
HTTP Authorization Model: Authenticated Learner Principal + Strict Resource Ownership (NO web operator role)
Governance Trust Boundary:HOST-CLI-ONLY via scripts/managePolicy.js with POLICY_GOVERNANCE_SECRET (fail-closed in prod)
Session Storage:          Dedicated Mongoose Model (AuthSession) & MongoDB Collection (authsessions) with native TTL
Model / Collection Count: 15 -> 16 (AuthSession / authsessions authorized cross-phase evolution)
Rate Limiting:            Bounded Fixed-Window Limiter with deterministic overflow (fail-closed 429) & tunable limits
Security Headers:         Native Express middleware setting CSP, X-Content-Type-Options, etc. (HSTS owned by Phase 16 edge)
Metrics Protection:       Authorization: Bearer <METRICS_SCRAPE_SECRET> when enabled in production (Rate Limit: NONE)
Observability Contracts:  100% Phase 13 preservation (correlation first, metrics second, 8 metrics, zero metric label pollution)
```

---

## 9. IDENTITY MODEL & CANONICAL PRINCIPAL

### 9.1 Server-Generated User Identity
Public registration **MUST NOT** accept a client-supplied `userId`.
- The server generates an opaque, authoritative `userId` using Node's cryptographically secure UUID generator:
  ```javascript
  const generatedUserId = `usr_${crypto.randomUUID()}`;
  ```
- Existing legacy `userId` values (e.g. `user_1`, `student_123`) remain fully valid and unchanged.
- Client registration payloads accept strictly whitelisted fields: `{ name, email, password }`.

### 9.2 Extended User Model (`src/models/userModel.js`) & Legacy Compatibility
To maintain full backward compatibility with legacy User documents:
1. `email`: Required for new registrations, trimmed, and converted to lowercase.
2. `passwordHash`: Required for new registrations, stored with `select: false`.
3. Legacy User documents without `email` or `passwordHash` remain loadable in MongoDB.
4. Legacy users lacking a `passwordHash` are **NOT authentication-eligible** (they cannot log in until claimed/provisioned via future migration).
5. Canonical Stored Email Invariant: For all authentication-eligible accounts, the stored `email` MUST be a trimmed, lowercase string (`email.trim().toLowerCase()`).
6. Indexing: The unique index on `email` is configured as a partial unique index:
   ```javascript
   userSchema.index(
     { email: 1 },
     { unique: true, partialFilterExpression: { email: { $exists: true, $type: 'string', $gt: '' } } }
   );
   ```
7. Account status: Minimal bounded field `status: { type: String, enum: ['active', 'disabled'], default: 'active', index: true }`. (No half-defined `locked` state; no `failedLoginAttempts` or `lockUntil` fields).

### 9.3 Canonical Authenticated Principal
Upon verifying a valid access JWT, the `authenticate` middleware constructs the minimal principal attached to `req.user`:

```javascript
req.user = {
  userId: 'usr_f47ac10b-58cc-4372-a567-0e02b2c3d479', // Authoritative student ID
  sessionId: 'sess_9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d', // Active session family ID
  accessTokenId: 'tok_c81d4e2e-bcf2-11e6-869b-7df92533c2ec', // JWT identifier (jti)
  issuedAt: 1728662400, // Unix epoch seconds
  expiresAt: 1728663300 // Unix epoch seconds (issuedAt + 900s)
};
```

- **Invariant**: `req.user` contains no `email`, no password data, no refresh tokens, and no token hashes.
- **AsyncLocalStorage Isolation**: `req.user` is **NEVER** injected into the Phase 13 `requestContext` store. Phase 13 context remains strictly:
  ```javascript
  { correlationId, method, normalizedRoute }
  ```

---

## 10. CREDENTIAL ARCHITECTURE

### 10.1 Selected Password Hashing: `node:crypto.scrypt` (OWASP Compliant)
Phase 14 selects Node.js core `node:crypto.scrypt` using the OWASP-approved parameter profile:
- **Zero Runtime Dependencies**: Eliminates `bcrypt` and avoids native C++ addon compilation failures.
- **OWASP-Supported Parameter Profile**:
  - Cost parameter (`N`): `16384` ($2^{14}$).
  - Block size (`r`): `8`.
  - Parallelization (`p`): `5`. (Matches OWASP Password Storage guidance: $N=2^{14}, r=8, p=5$).
  - Salt: 16 cryptographically random bytes (`crypto.randomBytes(16)`).
  - Key length: `64` bytes.
  - Memory ceiling (`maxmem`): `128 * 1024 * 1024` bytes (128 MB, a conservative implementation ceiling ensuring hashing does not fail). Primary scrypt memory buffer is governed by $128 \times N \times r \approx 16\text{ MB}$, with $p=5$ parallel chains.
- **Encoded Hash Format**: Stored as a versioned parameter string:
  ```text
  $scrypt$v=1$N=16384,r=8,p=5$<salt_hex>$<derived_key_hex>
  ```
- **Constant-Time Verification**: Derived key compared strictly using `crypto.timingSafeEqual`.

### 10.2 Modernized Password Policy & Unicode Normalization
- **Processing Sequence**:
  1. Receive complete raw password string.
  2. Apply Unicode **NFC** normalization (`password.normalize('NFC')`).
  3. Evaluate length by Unicode code points: `Array.from(normalizedPassword).length`.
  4. Compare complete NFC-normalized password against local blocklist.
  5. Hash complete normalized UTF-8 byte sequence with scrypt.
- **Length Constraints**: Minimum **15 Unicode code points**, maximum **128 Unicode code points**.
- **Composition Rules**: **NONE** (no mandatory uppercase, lowercase, numbers, or symbols).
- **Truncation**: Strictly forbidden.

### 10.3 Common/Compromised Password Blocklist Supply-Chain Contract
- **Runtime Network Lookup**: **NONE** (zero external API calls).
- **Upstream Repository**: `danielmiessler/SecLists`.
- **Exact Upstream File**: `Passwords/Common-Credentials/10k-most-common.txt`.
- **Full Immutable Commit SHA**: `7ab4b6a718285141ef8154630c9091da06987113` (Release `2024.1`).
- **Local Artifact Path**: `src/data/auth/commonPasswordsBlocklist.json`.
- **Local Version**: `v1`.
- **Configuration Module Ownership**: Expected SHA-256 digest is stored in `src/config/authConfig.js` as the source constant `EXPECTED_BLOCKLIST_SHA256`. Verified at module initialization.
- **Update Ownership**: Repository security-maintenance process via formal PR review and automated checksum verification.
- **Comparison**: Exact match against the complete NFC-normalized candidate password (no substring matching, no lossy case destruction).
- **Public Rejection Contract**:
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
  *(Zero breach list names, rankings, or frequencies disclosed).*
- **Failure Behavior on Load**: If the blocklist artifact cannot be loaded or checksum verification fails, registration and password changes fail closed with HTTP 500 `BLOCKLIST_UNAVAILABLE`.
- **Security Test Verification Contract (`tests/security/blocklistIntegrity.test.js`)**:
  1. Deterministic proof that artifact digest matches `EXPECTED_BLOCKLIST_SHA256` in `src/config/authConfig.js`.
  2. Deterministic proof that modified artifact fails closed (HTTP 500 `BLOCKLIST_UNAVAILABLE`).
  3. Deterministic proof that missing artifact fails closed (HTTP 500 `BLOCKLIST_UNAVAILABLE`).
  4. Deterministic proof that digest constant is not derived dynamically from the same runtime file (the constant `EXPECTED_BLOCKLIST_SHA256` in `src/config/authConfig.js` is an independent, hardcoded static string literal; computing both expected and actual values from the mutable runtime file is strictly forbidden).

### 10.4 Registration Duplicate-Email Policy & Enumeration Tradeoff
- **Public Duplicate Contract**:
  ```http
  HTTP/1.1 409 Conflict
  Content-Type: application/json; charset=utf-8
  ```
  ```json
  {
    "success": false,
    "error": {
      "code": "EMAIL_ALREADY_REGISTERED",
      "message": "An account with this email address already exists."
    }
  }
  ```
- **Residual Risk Disclosure**: Because Phase 14 has no outbound email verification service, this endpoint allows an unauthenticated client to confirm whether an email address is registered.
- **Mitigating Controls**: Bounded Tier 2 fixed-window rate limiting (keyed by client IP + normalized email), generic message structure, and zero disclosure of profile data, `userId`, or account state.

### 10.5 Account Enumeration Timing Mitigation (Login)
- If email exists: verify password against user's stored scrypt hash.
- If email does not exist: verify password against a static dummy scrypt hash ($N=16384, r=8, p=5$) to provide timing parity.
- Public response for both cases: HTTP 401 `INVALID_CREDENTIALS`.

### 10.6 Password Reset Status
- Password reset, outbound recovery email (SMTP), and reset-token storage are **EXPLICITLY DEFERRED** to a future phase when transactional email capabilities are authorized. Zero reset-token fields or endpoints are created in Phase 14.

---

## 11. SESSION & REFRESH-TOKEN ARCHITECTURE

### 11.1 Token Hierarchy & Lifetimes
- **Access JWT**: Lifetime of **15 minutes** (900 seconds). Signed via `HS256`. Stored in client memory.
- **Refresh Session Family**: Maximum lifetime of **7 days ABSOLUTE** from original login.

### 11.2 Token-Generation Ledger (`AuthSession` Model)
To make refresh reuse detection mechanically possible, Phase 14 implements a token-generation ledger where each refresh-token generation is recorded:

```javascript
const authSessionSchema = new mongoose.Schema(
  {
    tokenId: {
      type: String,
      required: true,
      unique: true // Token generation identifier
    },
    sessionId: {
      type: String,
      required: true,
      index: true // Stable login/device session-family identifier
    },
    userId: {
      type: String,
      required: true,
      index: true
    },
    tokenHash: {
      type: String,
      required: true,
      unique: true // SHA-256 hash of refresh token
    },
    status: {
      type: String,
      enum: ['active', 'rotated', 'revoked'],
      default: 'active',
      required: true
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
      required: true
    },
    expiresAt: {
      type: Date,
      required: true // Absolute 7-day expiration
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

// Indexes
authSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // Native TTL cleanup
authSessionSchema.index({ userId: 1, sessionId: 1, status: 1 });
authSessionSchema.index({ sessionId: 1 });

// Mechanical Invariant: At most ONE active token generation per session family!
authSessionSchema.index(
  { sessionId: 1 },
  { unique: true, partialFilterExpression: { status: 'active' } }
);
```

### 11.3 Refresh Token Rotation & Reuse Detection Algorithm
0. **Validate Origin Header (Browser Refresh Surface)**:
   - For `POST /api/v1/auth/refresh`, an `Origin` header is **REQUIRED**.
   - If missing: rejected with HTTP 403 Forbidden (`code: 'REFRESH_ORIGIN_REQUIRED'`, message: `'Origin header is required for refresh token exchange.'`).
   - If present but does not match any entry in `CORS_ALLOWED_ORIGINS`: rejected with HTTP 403 Forbidden (`code: 'CORS_ORIGIN_DENIED'`).
   - Invariant: Zero cookie-bearing refresh requests accepted without verified allowlisted Origin.
1. Compute `SHA-256(presentedRefreshToken)`.
2. Look up record by `tokenHash`.
3. If no record exists: Return `401 INVALID_REFRESH_TOKEN`.
4. If `status === 'revoked'`: Return `401 SESSION_REVOKED`.
5. If `status === 'rotated'`:
   - **REFRESH REUSE DETECTED!**
   - Atomically mark every still-active record sharing the same `sessionId` as `status = 'revoked'`, `revokedAt = new Date()`.
   - Emit security log event `AUTH_REFRESH_REUSE_DETECTED`.
   - Return `401 REFRESH_REUSE_DETECTED`.
   - *Scope Note*: Revocation applies strictly to that compromised `sessionId` family, NOT unrelated sessions on other devices.
6. If `status === 'active'`:
   - Check absolute expiration: If `expiresAt <= new Date()`, return `401 SESSION_EXPIRED`.
   - Atomically CAS update current record: `status = 'rotated'`, `rotatedAt = new Date()`, `replacedByTokenId = newGeneratedTokenId`.
   - Create successor record with the **SAME `sessionId`**, fresh `tokenId`, fresh `tokenHash`, `status = 'active'`, inheriting the **SAME `expiresAt`** (absolute 7-day bound).
   - Set fresh refresh cookie on response.
   - Issue fresh 15-minute access JWT.
   - Consumed/rotated predecessor records are retained until TTL expiry to ensure replay attempts remain detectable.

### 11.4 Refresh Concurrency & Successor-Creation Failure Semantics
- **Concurrent Same-Token Refresh (CAS-Loser Behavior)**:
  - If two requests present the same active refresh token concurrently, the first CAS transition (`active` -> `rotated`) succeeds.
  - The second request finds `status === 'rotated'`, which triggers refresh-token reuse detection and revokes the session family.
  - *Tradeoff*: Legitimate client concurrent refresh race results in fail-secure session invalidation; client must reauthenticate.
- **Successor-Creation Failure Semantics**:
  - If successor record creation fails after the predecessor was rotated:
    - Do NOT reactivate the predecessor.
    - Do NOT issue an access token or set a refresh cookie.
    - Return HTTP 500 error DTO.
    - Session family becomes non-refreshable; user must reauthenticate.

### 11.5 Refresh Cookie Transport & Path Clearing
- **Creation Scope**:
  ```http
  Set-Cookie: refreshToken=<token>; Path=/api/v1/auth/refresh; HttpOnly; SameSite=Strict; Secure=<true in production, false in local dev>
  ```
- **Clearing Scope**: `POST /api/v1/auth/logout` and `POST /api/v1/auth/revoke-all` clear the cookie using the **exact matching scope**:
  ```http
  Set-Cookie: refreshToken=; Path=/api/v1/auth/refresh; HttpOnly; SameSite=Strict; Secure=<true in production, false in local dev>; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Max-Age=0
  ```

### 11.6 Same-Site Deployment Requirement (Phase 16 Handoff)
- The architecture freezes `SameSite=Strict` for refresh cookies.
- **Deployment Assumption**: The browser frontend (Phase 15) and API must be deployed within a compatible same-site topology (e.g. `app.example.com` and `api.example.com` under the same registrable site and secure scheme).
- **Handoff Contract**: If Phase 16 selects cross-site deployment (e.g. `frontend.app-host.com` and `api.cloud-host.com`), the cookie strategy MUST be re-reviewed before deployment. Silently downgrading to `SameSite=None` without a new CSRF review is forbidden.

### 11.7 Truthful Revocation Contracts
- **Refresh Revocation**: Immediate upon `/logout` or reuse detection. Subsequent refresh exchanges are blocked immediately.
- **Access JWT Invalidation**: Access JWTs are stateless. Ordinary business requests do NOT query the session database. An already-issued access JWT remains usable until its 15-minute expiration (`<= 15 minutes`).
- **Account Disabling**: When `status === 'disabled'`, subsequent logins and refreshes are blocked immediately. Existing access tokens expire naturally within `<= 15 minutes`.

---

## 12. AUTHORIZATION & RESOURCE OWNERSHIP

### 12.1 Removal of Unjustified Web Operator RBAC
The repository audit confirms that Phase 12 governance mutations are **HOST-CLI-ONLY** and no web learner-administration endpoints exist. Therefore:
- Phase 14 V1 defines **NO web operator role** in User models or JWT claims.
- HTTP authorization consists strictly of: **Authenticated Learner Principal + Strict Resource Ownership**.
- Administrative governance operations remain isolated to the host CLI (`scripts/managePolicy.js`) protected by `POLICY_GOVERNANCE_SECRET`.
- Roles such as `teacher`, `mentor`, `school_admin`, `institution_admin`, and `web operator` are **EXPLICITLY DEFERRED**.

### 12.2 Resolution of Shared Mock Blueprint Mutation
- Inspection of `mockBlueprintModel.js` and `mockBlueprintController.js` confirms that mock blueprints are **global shared platform exam definitions** (canonical section scopes, difficulty distributions, scoring rules). They possess no `userId` field.
- **Authoritative Resolution**: Learners **MUST NOT** mutate global platform blueprints.
- `POST /api/v1/mock-blueprints`:
  - Protection class: `CLOSED / DEPRECATED`.
  - Public contract: **HTTP 403 Forbidden** (`code: 'BLUEPRINT_MUTATION_CLOSED'`, message: `'Mock blueprint creation is closed to learner HTTP access.'`).
  - Learner can mutate global/shared blueprint catalog: **NO**.
- Shared blueprint read routes (`GET /api/v1/mock-blueprints`, `GET /:id`, `POST /preview`) remain authenticated shared-content operations.

### 12.3 Authoritative Identity Flow
Client-supplied `userId` values in `req.body`, `req.query`, or `req.params` are **NEVER** trusted as execution identity:
1. `authenticate` middleware verifies access JWT and creates authoritative `req.user`.
2. `authorizeOwner` guard validates that any client-supplied `userId` matches `req.user.userId`. If a mismatch is detected, the request is immediately rejected with `403 FORBIDDEN` (`code: 'IDENTITY_MISMATCH'` or `'OWNERSHIP_VIOLATION'`).
3. Business controllers and services receive `req.user.userId` as the trusted execution identity argument.

---

## 13. EXACT MECHANICAL ROUTE INVENTORY & PROTECTION MATRIX

Mechanically audited across all files in `src/routes/` (76 routes) and `src/app.js` (4 root routes). Total existing routes discovered: **80**. Total existing routes classified: **80**. Unclassified existing routes: **0**. Proposed Phase 14 routes: **6**. Projected post-Phase-14 route total: **86**.

| # | Lifecycle | HTTP Method | Full Mounted Path | Current Controller / Handler | Phase 14 Protection Class | Identity Source | Ownership Rule | Rate Limit Tier |
|---|---|---|---|---|---|---|---|---|
| 1 | EXISTING | GET | `/health` | Inline `app.get` | `PUBLIC` | None | None | None |
| 2 | EXISTING | GET | `/health/live` | `healthService.evaluateLiveness` | `PUBLIC` | None | None | None |
| 3 | EXISTING | GET | `/health/ready` | `healthService.evaluateReadiness` | `PUBLIC` | None | None | None |
| 4 | EXISTING | GET | `/metrics` | Inline `metrics.toPrometheusText` | `PROTECTED-PROBE` | Scraper Bearer Secret | Scrape Secret Match | NONE |
| 5 | PHASE14_NEW | POST | `/api/v1/auth/register` | `authController.register` | `PUBLIC` | Server-Generated UUID | N/A | Tier 2 (Auth) |
| 6 | PHASE14_NEW | POST | `/api/v1/auth/login` | `authController.login` | `PUBLIC` | Credential Lookup | N/A | Tier 2 (Auth) |
| 7 | PHASE14_NEW | POST | `/api/v1/auth/refresh` | `authController.refresh` | `PUBLIC-COOKIE` | Refresh Cookie Hash | Valid Session | Tier 3 (Refresh) |
| 8 | PHASE14_NEW | POST | `/api/v1/auth/logout` | `authController.logout` | `AUTHENTICATED` | `req.user.sessionId` | Session Family Owner | Global API |
| 9 | PHASE14_NEW | POST | `/api/v1/auth/revoke-all` | `authController.revokeAll` | `AUTHENTICATED` | `req.user.userId` | User Account Owner | Global API |
| 10 | PHASE14_NEW | GET | `/api/v1/auth/me` | `authController.getMe` | `AUTHENTICATED` | `req.user` | Returns Principal | Global API |
| 11 | EXISTING | POST | `/api/v1/users` | `userController.createUser` | `DEPRECATED` | None (Returns 410) | Deprecated Surface | Global API |
| 12 | EXISTING | GET | `/api/v1/users/:userId` | `userController.getUser` | `OWNER-ONLY` | `req.user.userId` | `:userId === req.user.userId` | Global API |
| 13 | EXISTING | GET | `/api/v1/questions/topics` | `questionController.getTopics` | `AUTHENTICATED` | `req.user` | Shared Content | Global API |
| 14 | EXISTING | GET | `/api/v1/questions/:id([a-fA-F0-9]{24})`| `questionController.getQuestionById`| `AUTHENTICATED` | `req.user` | Shared Content | Global API |
| 15 | EXISTING | GET | `/api/v1/questions/topic/:topic/patterns`| `questionController.getPatternsByTopic`| `AUTHENTICATED`| `req.user` | Shared Content | Global API |
| 16 | EXISTING | GET | `/api/v1/questions/topic/:topic/random`| `questionController.getRandomByTopic`| `AUTHENTICATED`| `req.user` | Shared Content | Global API |
| 17 | EXISTING | GET | `/api/v1/questions/topic/:topic/pattern/:pattern/random`| `questionController.getRandomByPattern`| `AUTHENTICATED`| `req.user`| Shared Content| Global API |
| 18 | EXISTING | GET | `/api/v1/questions/topic/:topic/pattern/:pattern`| `questionController.getQuestionsByPattern`| `AUTHENTICATED`| `req.user`| Shared Content| Global API |
| 19 | EXISTING | GET | `/api/v1/questions/topic/:topic`| `questionController.getQuestionsByTopic`| `AUTHENTICATED`| `req.user`| Shared Content| Global API |
| 20 | EXISTING | GET | `/api/v1/goals/user/:userId` | `goalController.getGoalsByUser` | `OWNER-ONLY` | `req.user.userId` | `:userId === req.user.userId` | Global API |
| 21 | EXISTING | POST | `/api/v1/goals` | `goalController.createGoal` | `AUTHENTICATED` | `req.user.userId` | Auto-bound to `req.user.userId` | Global API |
| 22 | EXISTING | GET | `/api/v1/goals/:id` | `goalController.getGoal` | `OWNER-ONLY` | `req.user.userId` | `goal.userId === req.user.userId` | Global API |
| 23 | EXISTING | PATCH | `/api/v1/goals/:id` | `goalController.updateGoal` | `OWNER-ONLY` | `req.user.userId` | `goal.userId === req.user.userId` | Global API |
| 24 | EXISTING | DELETE | `/api/v1/goals/:id` | `goalController.deleteGoal` | `OWNER-ONLY` | `req.user.userId` | `goal.userId === req.user.userId` | Global API |
| 25 | EXISTING | GET | `/api/v1/study-plans/user/:userId`| `studyPlanController.getStudyPlansByUser`| `OWNER-ONLY`| `req.user.userId`| `:userId === req.user.userId`| Global API |
| 26 | EXISTING | POST | `/api/v1/study-plans` | `studyPlanController.createStudyPlan` | `AUTHENTICATED` | `req.user.userId` | Auto-bound to `req.user.userId` | Global API |
| 27 | EXISTING | GET | `/api/v1/study-plans/:id` | `studyPlanController.getStudyPlan` | `OWNER-ONLY` | `req.user.userId` | `plan.userId === req.user.userId` | Global API |
| 28 | EXISTING | PATCH | `/api/v1/study-plans/:id` | `studyPlanController.updateStudyPlan` | `OWNER-ONLY` | `req.user.userId` | `plan.userId === req.user.userId` | Global API |
| 29 | EXISTING | DELETE | `/api/v1/study-plans/:id` | `studyPlanController.deleteStudyPlan` | `OWNER-ONLY` | `req.user.userId` | `plan.userId === req.user.userId` | Global API |
| 30 | EXISTING | GET | `/api/v1/daily-objectives/user/:userId`| `dailyObjectiveController.getDailyObjectivesByUser`| `OWNER-ONLY`| `req.user.userId`| `:userId === req.user.userId`| Global API |
| 31 | EXISTING | POST | `/api/v1/daily-objectives` | `dailyObjectiveController.createDailyObjective`| `AUTHENTICATED`| `req.user.userId`| Auto-bound to `req.user.userId`| Global API |
| 32 | EXISTING | GET | `/api/v1/daily-objectives/:id` | `dailyObjectiveController.getDailyObjective`| `OWNER-ONLY`| `req.user.userId`| `obj.userId === req.user.userId`| Global API |
| 33 | EXISTING | PATCH | `/api/v1/daily-objectives/:id` | `dailyObjectiveController.updateDailyObjective`| `OWNER-ONLY`| `req.user.userId`| `obj.userId === req.user.userId`| Global API |
| 34 | EXISTING | DELETE | `/api/v1/daily-objectives/:id` | `dailyObjectiveController.deleteDailyObjective`| `OWNER-ONLY`| `req.user.userId`| `obj.userId === req.user.userId`| Global API |
| 35 | EXISTING | GET | `/api/v1/attempts/user/:userId`| `attemptController.getAttemptsByUser`| `OWNER-ONLY`| `req.user.userId`| `:userId === req.user.userId`| Global API |
| 36 | EXISTING | POST | `/api/v1/attempts` | `attemptController.createAttempt` | `AUTHENTICATED` | `req.user.userId` | Auto-bound to `req.user.userId` | Global API |
| 37 | EXISTING | GET | `/api/v1/attempts/:id` | `attemptController.getAttempt` | `OWNER-ONLY` | `req.user.userId` | `attempt.userId === req.user.userId`| Global API |
| 38 | EXISTING | GET | `/api/v1/progress/prerequisites/:patternName`| `studentProgressController.getPrerequisiteData`| `AUTHENTICATED`| `req.user`| Shared Content| Global API |
| 39 | EXISTING | GET | `/api/v1/progress/:userId` | `studentProgressController.getProgressByUser`| `OWNER-ONLY`| `req.user.userId`| `:userId === req.user.userId`| Global API |
| 40 | EXISTING | GET | `/api/v1/progress/:userId/topics`| `studentProgressController.getProgressByTopic`| `OWNER-ONLY`| `req.user.userId`| `:userId === req.user.userId`| Global API |
| 41 | EXISTING | GET | `/api/v1/progress/:userId/patterns`| `studentProgressController.getProgressByPattern`| `OWNER-ONLY`| `req.user.userId`| `:userId === req.user.userId`| Global API |
| 42 | EXISTING | GET | `/api/v1/progress/:userId/weakest`| `studentProgressController.getWeakestPatterns`| `OWNER-ONLY`| `req.user.userId`| `:userId === req.user.userId`| Global API |
| 43 | EXISTING | GET | `/api/v1/progress/:userId/difficulty-distribution`| `studentProgressController.getDifficultyDistribution`| `OWNER-ONLY`| `req.user.userId`| `:userId === req.user.userId`| Global API |
| 44 | EXISTING | GET | `/api/v1/progress/:userId/accuracy-over-time`| `studentProgressController.getAccuracyOverTime`| `OWNER-ONLY`| `req.user.userId`| `:userId === req.user.userId`| Global API |
| 45 | EXISTING | GET | `/api/v1/progress/:userId/by-source`| `studentProgressController.getAttemptsBySource`| `OWNER-ONLY`| `req.user.userId`| `:userId === req.user.userId`| Global API |
| 46 | EXISTING | GET | `/api/v1/adaptive/next-question`| `adaptiveController.getNextQuestion`| `AUTHENTICATED`| `req.user.userId`| Bound to `req.user.userId`| Global API |
| 47 | EXISTING | POST | `/api/v1/planning/preview` | `planningController.preview` | `AUTHENTICATED` | `req.user.userId` | Bound to `req.user.userId` | Global API |
| 48 | EXISTING | POST | `/api/v1/planning/generate`| `planningController.generate`| `AUTHENTICATED` | `req.user.userId` | Bound to `req.user.userId` | Global API |
| 49 | EXISTING | POST | `/api/v1/planning/plans/:planId/replan`| `planningController.replan`| `OWNER-ONLY`| `req.user.userId`| `plan.userId === req.user.userId`| Global API |
| 50 | EXISTING | GET | `/api/v1/planning/plans/:planId/schedule`| `planningController.getSchedule`| `OWNER-ONLY`| `req.user.userId`| `plan.userId === req.user.userId`| Global API |
| 51 | EXISTING | GET | `/api/v1/revisions/due` | `revisionController.getDue` | `AUTHENTICATED` | `req.user.userId` | Bound to `req.user.userId` | Global API |
| 52 | EXISTING | GET | `/api/v1/revisions/plan` | `revisionController.getPlan` | `AUTHENTICATED` | `req.user.userId` | Bound to `req.user.userId` | Global API |
| 53 | EXISTING | GET | `/api/v1/revisions/user/:userId`| `revisionController.getByUser`| `OWNER-ONLY`| `req.user.userId`| `:userId === req.user.userId`| Global API |
| 54 | EXISTING | GET | `/api/v1/revisions/:id` | `revisionController.getById` | `OWNER-ONLY` | `req.user.userId` | `item.userId === req.user.userId`| Global API |
| 55 | EXISTING | POST | `/api/v1/revisions/rebuild`| `revisionController.rebuildState`| `OWNER-ONLY`| `req.user.userId`| Bound to `req.user.userId`| Global API |
| 56 | EXISTING | POST | `/api/v1/mock-blueprints` | `controller.createBlueprint` | `CLOSED` | None (Returns 403) | Closed to Learner HTTP | Global API |
| 57 | EXISTING | GET | `/api/v1/mock-blueprints` | `controller.getBlueprints` | `AUTHENTICATED` | `req.user` | Shared Content | Global API |
| 58 | EXISTING | POST | `/api/v1/mock-blueprints/preview`| `controller.previewBlueprint`| `AUTHENTICATED` | `req.user` | Shared Content | Global API |
| 59 | EXISTING | GET | `/api/v1/mock-blueprints/:id` | `controller.getBlueprintById` | `AUTHENTICATED` | `req.user` | Shared Content | Global API |
| 60 | EXISTING | POST | `/api/v1/mock-sessions` | `controller.createSession` | `AUTHENTICATED` | `req.user.userId` | Auto-bound to `req.user.userId` | Global API |
| 61 | EXISTING | POST | `/api/v1/mock-sessions/:id/start`| `controller.startSession` | `OWNER-ONLY` | `req.user.userId` | `session.userId === req.user.userId`| Global API |
| 62 | EXISTING | GET | `/api/v1/mock-sessions/:id` | `controller.getSession` | `OWNER-ONLY` | `req.user.userId` | `session.userId === req.user.userId`| Global API |
| 63 | EXISTING | GET | `/api/v1/mock-sessions/:id/questions/:questionId`| `controller.getQuestion`| `OWNER-ONLY`| `req.user.userId`| `session.userId === req.user.userId`| Global API |
| 64 | EXISTING | POST | `/api/v1/mock-sessions/:id/responses`| `controller.saveResponse`| `OWNER-ONLY`| `req.user.userId`| `session.userId === req.user.userId`| Global API |
| 65 | EXISTING | POST | `/api/v1/mock-sessions/:id/sections/:sectionId/complete`| `controller.completeSection`| `OWNER-ONLY`| `req.user.userId`| `session.userId === req.user.userId`| Global API |
| 66 | EXISTING | POST | `/api/v1/mock-sessions/:id/submit`| `controller.submitSession`| `OWNER-ONLY`| `req.user.userId`| `session.userId === req.user.userId`| Global API |
| 67 | EXISTING | POST | `/api/v1/mock-sessions/:id/abandon`| `controller.abandonSession`| `OWNER-ONLY`| `req.user.userId`| `session.userId === req.user.userId`| Global API |
| 68 | EXISTING | GET | `/api/v1/mock-sessions/:id/result`| `controller.getResult` | `OWNER-ONLY` | `req.user.userId` | `session.userId === req.user.userId`| Global API |
| 69 | EXISTING | GET | `/api/v1/mock-sessions/:id/review`| `controller.getReview` | `OWNER-ONLY` | `req.user.userId` | `session.userId === req.user.userId`| Global API |
| 70 | EXISTING | POST | `/api/v1/learning/tutor` | `learningController.tutor` | `AUTHENTICATED` | `req.user.userId` | Bound to `req.user.userId` | Tier 4 (LLM) |
| 71 | EXISTING | POST | `/api/v1/learning/hint` | `learningController.hint` | `AUTHENTICATED` | `req.user.userId` | Bound to `req.user.userId` | Tier 4 (LLM) |
| 72 | EXISTING | POST | `/api/v1/learning/explain-attempt`| `learningController.explainAttempt`| `AUTHENTICATED`| `req.user.userId`| Bound to `req.user.userId`| Tier 4 (LLM) |
| 73 | EXISTING | POST | `/api/v1/learning/explain-progress`| `learningController.explainProgress`| `AUTHENTICATED`| `req.user.userId`| Bound to `req.user.userId`| Tier 4 (LLM) |
| 74 | EXISTING | POST | `/api/v1/learning/explain-plan`| `learningController.explainPlan`| `AUTHENTICATED`| `req.user.userId`| Bound to `req.user.userId`| Tier 4 (LLM) |
| 75 | EXISTING | POST | `/api/v1/learning/mock-review`| `learningController.mockReview`| `AUTHENTICATED`| `req.user.userId`| Bound to `req.user.userId`| Tier 4 (LLM) |
| 76 | EXISTING | GET | `/api/v1/analytics/dashboard`| `analyticsController.getDashboard`| `AUTHENTICATED`| `req.user.userId`| Bound to `req.user.userId` | Global API |
| 77 | EXISTING | GET | `/api/v1/analytics/cognitive-profile`| `analyticsController.getCognitiveProfile`| `AUTHENTICATED`| `req.user.userId`| Bound to `req.user.userId`| Global API |
| 78 | EXISTING | GET | `/api/v1/analytics/retention`| `analyticsController.getRetention`| `AUTHENTICATED`| `req.user.userId`| Bound to `req.user.userId` | Global API |
| 79 | EXISTING | GET | `/api/v1/analytics/readiness/:goalId`| `analyticsController.getReadiness`| `OWNER-ONLY`| `req.user.userId`| `goal.userId === req.user.userId`| Global API |
| 80 | EXISTING | GET | `/api/v1/orchestration/next-action`| `orchestrationController.getNextAction`| `AUTHENTICATED`| `req.user.userId`| Bound to `req.user.userId`| Global API |
| 81 | EXISTING | GET | `/api/v1/orchestration/daily-agenda`| `orchestrationController.getDailyAgenda`| `AUTHENTICATED`| `req.user.userId`| Bound to `req.user.userId`| Global API |
| 82 | EXISTING | GET | `/api/v1/orchestration/interventions`| `orchestrationController.getInterventions`| `AUTHENTICATED`| `req.user.userId`| Bound to `req.user.userId`| Global API |
| 83 | EXISTING | POST | `/api/v1/attribution/prescriptions`| `attributionController.issuePrescription`| `AUTHENTICATED`| `req.user.userId`| Bound to `req.user.userId`| Global API |
| 84 | EXISTING | POST | `/api/v1/attribution/prescriptions/:prescriptionId/activate`| `attributionController.activatePrescription`| `OWNER-ONLY`| `req.user.userId`| `prescription.userId === req.user.userId`| Global API |
| 85 | EXISTING | POST | `/api/v1/attribution/prescriptions/:prescriptionId/complete`| `attributionController.completePrescription`| `OWNER-ONLY`| `req.user.userId`| `prescription.userId === req.user.userId`| Global API |
| 86 | EXISTING | GET | `/api/v1/attribution/users/:userId/summary`| `attributionController.getSummary`| `OWNER-ONLY`| `req.user.userId`| `:userId === req.user.userId`| Global API |

---

## 14. MIDDLEWARE PIPELINE & LIVENESS PRESERVATION

The pipeline strictly places health probes before CORS and application rate limiting to preserve frozen Phase 13 liveness contracts:

```text
┌────────────────────────────────────────────────────────────────────────┐
│ 1. correlationMiddleware (Phase 13)                                    │
│    - MUST BE FIRST. Allocates correlationId and AsyncLocalStorage.     │
├────────────────────────────────────────────────────────────────────────┤
│ 2. metricsMiddleware (Phase 13)                                        │
│    - MUST BE SECOND. Increments activeRequestCount, records latency.   │
├────────────────────────────────────────────────────────────────────────┤
│ 3. securityHeadersMiddleware (Phase 14)                                │
│    - Native headers (CSP, X-Content-Type-Options, etc.). HSTS owned by │
│      Phase 16 edge.                                                    │
├────────────────────────────────────────────────────────────────────────┤
│ 4. Phase 13 Operational Health Probes (Public)                         │
│    - /health, /health/live, /health/ready                              │
│    - MOUNTED BEFORE CORS so disallowed origins cannot break liveness!  │
├────────────────────────────────────────────────────────────────────────┤
│ 5. Protected Scraper Gate (/metrics)                                   │
│    - Enabled via METRICS_ENABLED === 'true'.                           │
│    - Requires Authorization: Bearer <METRICS_SCRAPE_SECRET> in prod.   │
│    - Application Rate-Limit Tier: NONE (Scraper probe outside limiter).│
├────────────────────────────────────────────────────────────────────────┤
│ 6. Global API IP Rate Limiter (Bounded Fixed-Window)                   │
│    - Applies to application/API traffic, NOT health probes.            │
├────────────────────────────────────────────────────────────────────────┤
│ 7. corsMiddleware (Hardened CORS)                                      │
│    - credentials=true ONLY for allowlisted origins.                    │
│    - Disallowed browser Origin rejected with HTTP 403 CORS_ORIGIN_DENIED│
├────────────────────────────────────────────────────────────────────────┤
│ 8. cookie-parser Middleware                                            │
│    - Parses incoming Cookie header for /api/v1/auth/refresh.           │
├────────────────────────────────────────────────────────────────────────┤
│ 9. express.json({ limit: '100kb' })                                    │
│    - Explicit 100kb payload bounding. Rejects oversized JSON payloads. │
├────────────────────────────────────────────────────────────────────────┤
│ 10. /api/v1/auth Router (Explicit Route-Level Protection)              │
│     - Public (3/3): /register, /login, /refresh (Origin REQUIRED)      │
│     - Protected (3/3): /logout, /revoke-all, /me (apply authenticate)  │
├────────────────────────────────────────────────────────────────────────┤
│ 11. authenticate Middleware (Phase 14 Router Boundary)                 │
│     - Guards all /api/v1/* business endpoints.                         │
│     - Verifies Bearer JWT signature, kid, expiration, algorithm.       │
│     - Attaches minimal canonical principal to req.user.                │
├────────────────────────────────────────────────────────────────────────┤
│ 12. Authenticated Expensive Route Limiter                              │
│     - Tier 4 Limiter for /api/v1/learning/* (Key: req.user.userId).    │
├────────────────────────────────────────────────────────────────────────┤
│ 13. Protected Business Routers (/api/v1/*)                             │
│     - Route-level authorizeOwner guards applied.                       │
├────────────────────────────────────────────────────────────────────────┤
│ 14. notFound Handler (Phase 13)                                        │
│     - Generates 404 AppError with route correlation.                   │
├────────────────────────────────────────────────────────────────────────┤
│ 15. errorHandler (Phase 13 Centralized Handler)                        │
│     - MUST REMAIN LAST. Sanitizes and serializes public error DTO.     │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 15. RATE LIMITING & ABUSE PROTECTION

### 15.1 Bounded Fixed-Window Rate Limiter
Phase 14 implements a **bounded fixed-window counter** (`{ count: Number, resetAt: Number }`):
- **Deterministic Cap-Exhaustion Contract**:
  - When a new key arrives: sweep expired buckets synchronously (best-effort).
  - If capacity becomes available: allocate the new key.
  - If the registry remains at capacity (`RATE_LIMIT_MAX_KEYS`):
    - **DO NOT evict an active key** (LRU eviction of active keys is strictly forbidden to prevent attacker key-churn denial-of-service).
    - **DO NOT allocate a new key**.
    - **FAIL CLOSED with HTTP 429 `RATE_LIMIT_CAPACITY_EXCEEDED`**.
- **Sweeper**: A single unreferenced background interval sweeps expired buckets every 60 seconds (`setInterval(...).unref()`). Zero per-key timers.
- **Configurable Capacity**: `RATE_LIMIT_MAX_KEYS` is classified as `TUNABLE / DEPLOYMENT CONFIGURATION` in `src/config/authConfig.js` (Default: 10,000 keys, safety max: 100,000 keys).

### 15.2 Tunable Thresholds
All rate limit numbers are defined as **TUNABLE / DEPLOYMENT CONFIGURATION** parameters via environment variables with safe defaults:
- Global Tier: `RATE_LIMIT_GLOBAL_MAX` (Default: 300 / 15m). Key: client IP.
- Auth Tier: `RATE_LIMIT_AUTH_MAX` (Default: 5 / 15m). Key: `IP + ':' + normalizedEmail`.
- Refresh Tier: `RATE_LIMIT_REFRESH_MAX` (Default: 20 / 15m). Key: `IP + ':' + tokenHash`.
- Expensive LLM Tier: `RATE_LIMIT_LLM_MAX` (Default: 20 / 1m). Key: `req.user.userId`.

### 15.3 Proxy Trust Default
- `trust proxy` is set to **`false`** by default. Forwarded headers (`X-Forwarded-For`) are strictly ignored unless explicit trusted proxy hops or CIDRs are configured via `TRUST_PROXY_HOPS` in production.

---

## 16. CORS & SECURITY HEADERS

### 16.1 Hardened CORS Contract
Phase 14 implements a strict CORS policy:
- **Configuration**: `CORS_ALLOWED_ORIGINS` (comma-separated list of approved origins, e.g. `https://learn.aptitude.io,https://app.aptitude.io`).
- **Production Wildcard `*`**: **STRICTLY FORBIDDEN**.
- **Credentials**: `credentials: true` enabled strictly for explicit allowlisted origins.
- **Allowed Methods**: Whitelisted strictly to actual route methods: `['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS']`. (PUT is excluded as absent from route inventory).
- **Allowed Request Headers**: Whitelisted strictly to:
  - `Content-Type`
  - `Authorization`
  - `X-Correlation-ID`
  - `X-Request-ID` *(preserves Phase 13 request correlation compatibility)*
- **Exposed Response Headers**: `['X-Correlation-ID', 'Retry-After']`.
- **Disallowed Browser Origin**: Rejected with HTTP 403 `CORS_ORIGIN_DENIED`.
- **Requests with No Origin**: Permitted for non-browser / server-to-server requests.
- **Strict Cookie Refresh Origin Validation**:
  - For `POST /api/v1/auth/refresh`, an `Origin` header is **MANDATORY**.
  - Missing Origin header: rejected with **HTTP 403 Forbidden** (`code: 'REFRESH_ORIGIN_REQUIRED'`, message: `'Origin header is required for refresh token exchange.'`).
  - Origin header not in `CORS_ALLOWED_ORIGINS`: rejected with **HTTP 403 Forbidden** (`code: 'CORS_ORIGIN_DENIED'`).

### 16.2 Security Headers Policy
- `X-Content-Type-Options`: `nosniff`.
- `X-Frame-Options`: `DENY`.
- `Content-Security-Policy`: `default-src 'none'; frame-ancestors 'none'`.
- `Referrer-Policy`: `strict-origin-when-cross-origin`.
- `Permissions-Policy`: `camera=(), microphone=(), geolocation=(), payment=()`.
- `Cache-Control`: `no-store, no-cache, must-revalidate` emitted on all `/api/v1/auth/*` responses.
- **HSTS Production Ownership**:
  ```text
  HSTS Production Owner:           PHASE 16 REVERSE PROXY / EDGE
  Phase 14 Node Application Emits: NO
  ```
  *Handoff Invariant*: Phase 16 reverse proxy/edge gateway owns `Strict-Transport-Security` termination. Production HSTS verification is mandatory prior to production release.

---

## 17. SECRET & KEY MANAGEMENT

### 17.1 Canonical Secret Inventory

| Secret Name | Purpose | Required / Optional | Production Posture | Rotation Sensitivity |
|---|---|---|---|---|
| `MONGODB_URI` | Database connection string | Required | Fail-closed | High |
| `POLICY_GOVERNANCE_SECRET`| Phase 12 CLI authorization secret | Required | **Fail-closed in prod/staging**| Critical |
| `METRICS_SCRAPE_SECRET` | Prometheus scraper bearer secret | Required if metrics on | Fail-closed | Critical |
| `GEMINI_API_KEY` | Phase 7 LLM provider credential | Optional | Falls back to fake/disabled | High |
| `JWT_ACCESS_ACTIVE_KID` | Active key ID for JWT signing | Required | Fail-closed | High |
| `JWT_ACCESS_KEYS` | JSON map of kid -> secret | Required | Fail-closed (min 32 bytes/secret)| Critical |
| `CORS_ALLOWED_ORIGINS` | Whitelisted frontend origins | Required | Fail-closed | Medium |

*Unused Secret Removal*: `JWT_REFRESH_SECRET` is **REMOVED** from the inventory. Refresh tokens are 256-bit high-entropy random strings hashed with SHA-256; no pepper secret is required.

### 17.2 Configuration Module Ownership (`src/config/authConfig.js`)
All security parameters, constants, and parsing contracts are centralized authoritatively in `src/config/authConfig.js`:
- `EXPECTED_BLOCKLIST_SHA256`: Static cryptographic SHA-256 digest string literal of the verified common passwords blocklist.
- **JWT Issuer**: `JWT_ISSUER = 'aptitude-platform'`
- **JWT Audience**: `JWT_AUDIENCE = 'aptitude-learning-api'`
- **JWT Access TTL**: `ACCESS_TOKEN_TTL_SECONDS = 900` (15 minutes)
- **JWT Clock Tolerance**: `JWT_CLOCK_TOLERANCE_SECONDS = 30` (30 seconds)
- **JWT Old-Key Retention**: `OLD_KEY_RETENTION_SECONDS = 960` (satisfies invariant `>= ACCESS_TOKEN_TTL_SECONDS + JWT_CLOCK_TOLERANCE_SECONDS`)
- **Cookie Production Defaults**: `COOKIE_PATH = '/api/v1/auth/refresh'`, `COOKIE_SAME_SITE = 'Strict'`, `COOKIE_HTTP_ONLY = true`, `COOKIE_SECURE = process.env.NODE_ENV === 'production'`
- **Rate-Limit Safety Bounds**: `RATE_LIMIT_MAX_KEYS = 10000` (tunable safety bounds: default 10,000 keys, safety ceiling 100,000 keys)

### 17.3 JWT Key Rotation via Keyring
- `JWT_ACCESS_KEYS`: Stored as a JSON string mapping Key IDs to secrets:
  ```json
  { "kid_2026_v1": "64_char_hex_secret_a...", "kid_2026_v2": "64_char_hex_secret_b..." }
  ```
- Signing: Uses `JWT_ACCESS_ACTIVE_KID` only with `HS256`.
- Verification: Reads `kid` from JWT header, looks up key in `JWT_ACCESS_KEYS`, verifies `HS256` signature, issuer, audience, and enforces 30-second clock skew tolerance.
- **Key Retirement Invariant**:
  ```text
  OLD_KEY_RETENTION_SECONDS >= ACCESS_TOKEN_TTL_SECONDS + JWT_CLOCK_TOLERANCE_SECONDS
  (960 seconds >= 900s + 30s)
  ```
- Rotation process: Add new key to mapping, update `JWT_ACCESS_ACTIVE_KID`, continue verifying with old key, retire old key only after 960 seconds.

---

## 18. LEGACY-USER COMPATIBILITY & MIGRATION PREFLIGHT

### 18.1 Read-Only Migration Preflight Utility (`scripts/checkAuthMigrationReadiness.js`)
Phase 14 defines a deterministic, **strictly read-only** preflight script:
- **Zero Writes / Zero Mutations**: Zero database modifications, zero account claiming, zero automatic password generation. Automatic legacy user mutation is strictly forbidden.
- **Audit Checks**:
  1. Total user count.
  2. Users missing `email` field (`usersMissingEmail`).
  3. Users with blank or whitespace-only `email` (`usersBlankEmail`).
  4. Duplicate canonical emails (`email.trim().toLowerCase()`).
  5. Non-canonical stored email check (`NON_CANONICAL_EMAIL`): Defined as any existing nonblank email where `email !== email.trim().toLowerCase()`. The preflight reports `usersWithNonCanonicalEmail` and returns exit code `1` while any such record exists.
  6. Users missing `passwordHash` (`usersMissingPasswordHash`).
  7. Users with malformed `passwordHash` format.
  8. Invalid account status values.
  9. Retained legacy `userId` integrity.
- **Preflight Exit Code Semantics (`INDEX_SAFETY` vs. `AUTH_ELIGIBILITY`)**:
  - The exit code of `scripts/checkAuthMigrationReadiness.js` represents **INDEX SAFETY** only:
    - `exit 0` (INDEX SAFETY PASS): Zero duplicate canonical emails, zero non-canonical nonblank emails. The partial unique email index may be safely applied.
    - `exit 1` (INDEX / CANONICALIZATION BLOCKER): An index safety or canonicalization blocker exists (`usersWithNonCanonicalEmail > 0` or duplicate canonical emails > 0).
  - **Authentication-Eligibility Reporting**:
    - The preflight separately reports counts for:
      - `legacy users missing email` (`usersMissingEmail`)
      - `legacy users missing passwordHash` (`usersMissingPasswordHash`)
      - `legacy users not authentication-eligible` (`usersNotAuthEligible`)
    - Those users may remain stored in MongoDB, but they cannot authenticate.
    - The system is **NOT** labeled "all users auth ready" unless those auth-ineligible counts are zero.
- **Canonical Stored Email Contract**:
  - Canonical stored email for authentication-eligible accounts: single trimmed lowercase string (`email.trim().toLowerCase()`).
  - No second `normalizedEmail` field is created.
- **Index Authorization Gate**:
  Before the unique partial email index can be authorized:
  1. Missing/blank legacy email may remain for authentication-ineligible legacy users.
  2. Every EXISTING NONBLANK email must be canonical: trimmed + lowercase string.
  3. Duplicate canonical emails must equal 0.
  4. Operator resolves canonicalization conflicts manually.
  5. Preflight reruns.
  6. Only after PASS (exit code 0) may the partial unique index be created.

### 18.2 Deployment Ordering Invariant
The partial unique index on `email` MUST NOT be applied before the preflight passes:
```text
1. Execute scripts/checkAuthMigrationReadiness.js
2. If exit code 1: Operator manually resolves legacy data conflicts
3. Re-run scripts/checkAuthMigrationReadiness.js
4. Verify preflight exit code 0 (INDEX SAFETY PASS)
5. Authorize Phase 14 schema evolution and unique index creation
```

---

## 19. PHASE 12 & PHASE 13 PRESERVATION

### 19.1 Phase 12 Governance Boundary Preservation
- `scripts/managePolicy.js` remains **HOST-CLI-ONLY**. Web API routes for governance mutations do NOT exist.
- **Fail-Closed Hardening**: In `production` and `staging`, `POLICY_GOVERNANCE_SECRET` is **STRICTLY REQUIRED**. If unset, the CLI fails closed immediately (exit code 1). The `--confirm` fallback remains permitted only in `development` and `test`.

### 19.2 Phase 13 Observability Preservation
- **Metric Families**: The **bounded 8-metric Prometheus registry is strictly preserved**. Zero metric labels for `userId`, `email`, `token`, `IP`, or `role` are added.
- **Dynamic Route Collapse**: Dynamic template routes beyond the 33 canonical route budget collapse to `OTHER`. Detailed security forensics are captured via structured logs, not Prometheus metrics.
- **Structured Logger Extension (`src/utils/logger.js`)**:
  - The Phase 14 security event catalog is formally authorized to extend `logger.js`:
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
  - `AUTH_OPERATOR_ACTION` is **REMOVED** (no web operator role).
  - Allowed optional fields: `['statusCode', 'errorCode', 'operationalCategory', 'reason', 'action']`.
  - Forbidden fields: passwords, access tokens, refresh tokens, auth headers, email, IP, tokenHash.

---

## 20. DEPENDENCY DELTA

```text
Current Runtime Dependencies:   4 (cors, dotenv, express, mongoose)
Proposed Runtime Dependencies:  +2 (jsonwebtoken, cookie-parser)
Projected Total Runtime:        6

Current Dev Dependencies:       3 (jest, nodemon, supertest)
Proposed Dev Dependencies:      0
Projected Total Dev:            3
```

- `jsonwebtoken (^9.0.2)`: Canonical RFC 7519 implementation.
- `cookie-parser (^1.4.6)`: Standard, maintained cookie header parser for `/api/v1/auth/refresh`.
- `node:crypto.scrypt`: Native Node.js module (zero dependencies).
- Security headers & Rate limiting: Native Express middleware (zero dependencies).

---

## 21. BASELINE TEST PRESERVATION & SECURITY ADAPTATION RULE

Phase 14 intentionally alters network access: previously unauthenticated requests to student endpoints now return HTTP 401.

**Authoritative Baseline Preservation Rule**:
1. All **84 pre-Phase-14 Jest suites** and all **1156 pre-Phase-14 tests** MUST retain their business assertions, scoring mathematics, mastery updates, and domain expectations.
2. Existing tests may receive mechanical security adaptation fixtures (e.g. authenticated test helpers providing valid Bearer JWTs or test user credentials) solely to traverse the new security barrier.
3. **Zero** business, adaptive, mastery, or learning assertions may be weakened, deleted, skipped, or rewritten.
4. The final Phase 14 verification report will separately audit and prove:
   - Security-boundary adaptation: PASS
   - Business/contract regression: 0

---

## 22. FUTURE IMPLEMENTATION FOOTPRINT

The prospective Phase 14 implementation footprint consists of the following exact files:

```text
New Production Files:
  src/config/authConfig.js
  src/models/authSessionModel.js
  src/middleware/authenticate.js
  src/middleware/authorize.js
  src/middleware/securityHeaders.js
  src/middleware/rateLimiter.js
  src/services/authService.js
  src/controllers/authController.js
  src/routes/authRoutes.js
  src/data/auth/commonPasswordsBlocklist.json
  scripts/checkAuthMigrationReadiness.js

Modified Existing Production Files:
  src/models/userModel.js
  src/app.js
  src/server.js
  src/utils/logger.js
  scripts/diagnoseSystem.js
  scripts/managePolicy.js
  src/controllers/userController.js
  src/controllers/goalController.js
  src/controllers/attemptController.js
  src/controllers/studyPlanController.js
  src/controllers/dailyObjectiveController.js
  src/controllers/studentProgressController.js
  src/controllers/adaptiveController.js
  src/controllers/planningController.js
  src/controllers/revisionController.js
  src/controllers/mockBlueprintController.js
  src/controllers/mockSessionController.js
  src/controllers/learningController.js
  src/controllers/analyticsController.js
  src/controllers/orchestrationController.js
  src/controllers/attributionController.js
  src/middlewares/analyticsGuard.js
  src/middlewares/orchestrationGuard.js
  src/middlewares/attributionGuard.js
  src/routes/userRoutes.js
  src/routes/goalRoutes.js
  src/routes/studyPlanRoutes.js
  src/routes/dailyObjectiveRoutes.js
  src/routes/attemptRoutes.js
  src/routes/progressRoutes.js
  src/routes/adaptiveRoutes.js
  src/routes/planningRoutes.js
  src/routes/revisionRoutes.js
  src/routes/mockBlueprintRoutes.js
  src/routes/mockSessionRoutes.js
  src/routes/learningRoutes.js
  src/routes/analyticsRoutes.js
  src/routes/orchestrationRoutes.js
  src/routes/attributionRoutes.js

Modified Existing Test Files (Security Adaptation & Count Updates):
  tests/reliability/diagnosticsCli.test.js
  tests/reliability/observabilityTelemetry.test.js
  tests/architecture_guard.test.js
  tests/orchestration/phase9CrossPhaseIsolation.test.js
  tests/attribution/attributionIssuance.test.js
  tests/analytics/phase8CrossPhaseIsolation.test.js
  tests/simulation/phase11CrossPhaseIsolation.test.js
  tests/phase3_regression.test.js
  (Existing API test suites receiving mechanical authenticated fixtures)

New Security Test Files:
  tests/security/passwordHashing.test.js
  tests/security/jwtKeyring.test.js
  tests/security/authSessionLedger.test.js
  tests/security/authRoutes.test.js
  tests/security/rateLimiter.test.js
  tests/security/ownershipGuard.test.js
  tests/security/bolaPrevention.test.js
  tests/security/securityHeaders.test.js
  tests/security/authMigrationReadiness.test.js
  tests/security/blocklistIntegrity.test.js (asserts: artifact digest matches EXPECTED_BLOCKLIST_SHA256, modified artifact fails closed, missing artifact fails closed, and digest constant is not derived dynamically from the same runtime file)
```

---

## 23. PHASE 14 SECURITY INVARIANTS

The reconciled architecture establishes the following mechanically testable invariants:

```text
1. Plaintext passwords persisted = 0
2. Raw refresh tokens persisted = 0
3. Passwords, raw tokens, or hashes logged in stdout/stderr = 0
4. Client-supplied caller identity trusted for execution = 0
5. Unauthorized cross-user access allowed = 0
6. Web operator role bypasses in HTTP business routes = 0
7. Web routes for Phase 12 policy governance = 0
8. New Prometheus metric families added = 0 (remains 8)
9. High-cardinality metric labels added = 0
10. Unclassified existing API routes = 0
11. Phase 1–13 learning, mastery, or scoring mathematics modified = 0
12. Public error DTO structure modified = 0 ({ success: false, error: { code, message } })
13. Diagnostic CLI mutation or repair behaviors added = 0
14. Health probe intercepted or rejected by CORS = 0
15. Active refresh token records per session family > 1 = 0
16. Learner mutation of global mock blueprint definitions = 0
17. Cookie-bearing refresh accepted without verified allowlisted Origin = 0
18. Production HSTS verification is mandatory before production release = 1
```

---

## 24. RECOMMENDED NEXT GATE

```text
================================================================================
RECOMMENDED NEXT GATE:
PHASE 14 PRESCRIPTIVE SPECIFICATION
================================================================================

This document represents the frozen Phase 14 architecture (v1.0.4-FROZEN).
Architecture verification has passed completely.
Zero production code, schemas, or dependencies have been modified.
Implementation authorization is NONE.

Operator action required:
Authorize Phase 14 Prescriptive Specification.
================================================================================
```
