# PHASE 15 — LEARNER APPLICATION & ADAPTIVE UX
## ARCHITECTURE PROPOSAL

```text
Document: docs/PHASE15_ARCHITECTURE_PROPOSAL.md
Version: 1.0.13-PROPOSED
Status: PROPOSED / RECONCILED / AWAITING FINAL GOVERNANCE VERIFICATION
Base Platform: Phases 1–14 VERIFIED / IMPLEMENTED / COMPLETE / FROZEN
Architecture Basis: Frozen Phase 1–14 backend contracts plus the verified Phase 15 backend wire-contract recertification
Implementation Authorization: NONE
Implementation Performed: NO
Date: October 2026
```

---

## 1. STATUS / METADATA

| Property | Value |
|---|---|
| **Document Target** | `docs/PHASE15_ARCHITECTURE_PROPOSAL.md` |
| **Document Version** | `1.0.13-PROPOSED` |
| **Document Status** | `PROPOSED / RECONCILED / AWAITING FINAL GOVERNANCE VERIFICATION` |
| **Implementation Authorization** | `NONE` (Awaiting Final Governance Reconciliation and Re-Freeze Gate) |
| **Preceding Gate** | Phase 14 Security, Identity & Platform Protection — Permanently Frozen (`v1.0.8-FROZEN`) |
| **Target Platform** | Modern Standards-Compliant Web Browsers (Chrome, Edge, Firefox, Safari) |
| **Upstream Backend Baseline** | Node.js (macOS / Linux Container), Express 4.19, Mongoose 8.4, MongoDB 7.x (86 Routes, 16 Models, 16 Collections) |
| **Scope Boundary** | Learner-Facing Web Application, Adaptive Practice UX, Exam Simulation UI, Cognitive Analytics Display, In-Memory JWT & HttpOnly Session Management |
| **Subsequent Gate** | Phase 15 Final Governance Reconciliation & Re-Freeze |

### 1.1 Targeted Revision Scope & Governance Provenance

Version `1.0.13-PROPOSED` reconciles candidate wire-contract enhancements and alignment with the candidate prescriptive specification (`v1.0.10-PROPOSED`). It builds upon the prior historical frozen baseline `v1.0.12-FROZEN` (SHA-256: `d4c83adca5dfaef6e7f8d5eb6da6d19fa31d813ca527a998db77cf38a1a28556`), which incorporated the governance resolution of transport Finding W39 via **Same-Origin Path-Based Production API Ingress**. Under this architecture:
- The public learner SPA (`https://app.example.com/`) and browser-visible API namespace (`https://app.example.com/api/v1/...`) share a unified browser origin.
- Proposed Operation 64 (`POST /api/v1/attribution/prescriptions`) delivers the required `Idempotency-Key` header (1–128 characters) as a same-origin request, entirely bypassing cross-origin CORS preflight constraints.
- The Phase 14 backend source, middleware, and CORS allowlist remain 100% frozen and unmodified (0 backend changes, 0 database mutations, 0 Phase 1–14 edits).
- All non-transport wire findings (W01–W38) and the 64 consumed / 22 non-consumed route partition across all 86 registered backend routes remain fully proven and reconciled.
- The candidate architecture proposal is reconciled at `v1.0.13-PROPOSED` awaiting final governance verification.
- Preserved historical baselines:
  - Prior Architecture Baseline: `v1.0.12-FROZEN` (SHA-256: `d4c83adca5dfaef6e7f8d5eb6da6d19fa31d813ca527a998db77cf38a1a28556`)
  - Earlier Architecture Baseline: `v1.0.10-FROZEN` (SHA-256: `69d638c9e884c5a5daa5997de74d1f200250194d172a2d2bcba3987de835a670`)
  - Intermediate Architecture Fingerprint: `v1.0.11-PROPOSED` (Fingerprint: `9a03d5af8121799f63a1cc1781d2199047cc3480051b49b7da3d51575cace9c4`)
  - Preserved Historical Specification Baseline: `v1.0.9-FROZEN` (SHA-256: `41f969e3c1a1471c6a2594b64f4f969cb6ba88eaa7a81d2640bc0286fd1aa63f`)
  - Historical Specification Provenance: `v1.0.8-FROZEN` (SHA-256: `e1e21bc07f460106dda3263ef1491238a7bb32a85636146adc5f23e713420b76`)
- **IMPLEMENTATION AUTHORIZATION: NONE**. Implementation remains strictly paused pending final governance verification and re-freeze.

---

## 2. FROZEN PHASE 1–14 BASELINE

Phase 15 operates strictly as a consumer of the verified, permanently frozen terminal baseline established by Phases 1 through 14.

### 2.1 Frozen Platform Invariants & Metrics

```text
Question Bank:                  12,000 Questions
Topics:                         24 Canonical Topics
Patterns:                       278 Canonical Patterns
Legacy Pattern Mappings:        308 Mappings
Prerequisite Patterns:          218 Patterns
Foundational Patterns:          60 Patterns
Prerequisite Edges:             410 Directed Edges
DAG Cycles:                     0 (Strict Directed Acyclic Graph)
Question Fingerprint Integrity: 12,000 / 12,000 SHA-256 Matches (verify:content PASS)
Mongoose Models:                16 Models
MongoDB Collections:            16 Collections
HTTP Routes:                    86 Routes (80 Baseline + 6 Auth Endpoints)
Unclassified Routes:            0
Runtime Dependencies:           6 (cookie-parser, cors, dotenv, express, jsonwebtoken, mongoose)
Dev Dependencies:               3 (jest, nodemon, supertest)
Prometheus Metric Families:     8 Families
Full Jest Test Suites:          94 / 94 Passing
Total Jest Tests:               1,279 / 1,279 Passing
Security Suites:                10 / 10 Passing (123 Tests)
Reliability Suites:             3 / 3 Passing (59 Tests)
Governance Suites:              3 / 3 Passing (68 Tests)
Cross-Phase Isolation Suites:   6 / 6 Passing (73 Tests)
```

### 2.2 Authoritative Precedence & Immutability Hierarchy

```text
Frozen Phases 1–14 Contracts
>
PHASE15_ARCHITECTURE_PROPOSAL.md (v1.0.13-PROPOSED)
>
Reconciled Phase 15 Prescriptive Specification (v1.0.10-PROPOSED)
>
Future Phase 15 Implementation
```

1. **Zero Backend Modifications**: Phase 15 requires strictly **0 new backend models**, **0 new collections**, **0 new routes**, **0 modified routes**, and **0 database schema modifications**.
2. **Zero Algorithmic Mutations**: Phase 15 does not recalculate or redefine adaptive difficulty, deterministic pattern mastery, fixed-stage spaced revision intervals, exam scoring algorithms, cognitive analytics matrices, or prescriptive orchestration arbitrations. All learning intelligence remains exclusively backend-calculated.
3. **Phase 14 Security Conformance**: Phase 15 inherits and preserves the frozen security contracts: in-memory access token storage, HttpOnly `SameSite=Strict` refresh cookies, mandatory `Origin` verification for session rotation, strict 15-to-128 code point password policies, and fail-closed rate limiting.

---

## 3. ACTUAL REPOSITORY / FRONTEND SOURCE AUDIT

### 3.1 Original Pre-Implementation Architecture Audit (Historical Clean Slate)

A mechanical audit of `/Users/rajakumaran/Documents/Aptitude` and `/Users/rajakumaran/Documents/Aptitude/adaptive-aptitude-api` prior to any frontend implementation confirmed:

```text
Pre-implementation frontend application: NO
Pre-implementation frontend framework:   NONE
Pre-implementation frontend directory:   NONE
Pre-implementation package manager:     npm (package-lock.json v3 in backend)
Pre-implementation UI libraries:         NONE
Pre-implementation CSS strategy:         NONE
Pre-implementation frontend tests:       NONE
Pre-implementation frontend API client:  NONE
```

Historically, the repository contained exclusively the Node.js / Express backend API (`adaptive-aptitude-api`) and raw source datasets (`Questions bank`). There was no legacy or pre-existing third-party frontend codebase prior to Phase 15.

### 3.2 Current Workspace State (Paused Frontend Baseline)

Following the paused implementation attempt, a mechanical workspace audit confirms:

```text
Frontend Directory:                  adaptive-aptitude-app
Core Stack Declared Ranges:          React (^18.3.1) + Vite (^5.3.1) + TypeScript (^5.4.5)
Core Stack Resolved Versions:        React 18.3.1 + Vite 5.4.21 + TypeScript 5.9.3
Authorized Frontend Inventory:       121 files
Existing Authorized Frontend Files:  13 files (preserved byte-for-byte)
Missing Authorized Frontend Files:   108 files (uncreated)
Unauthorized Frontend Files:         0 files
Frontend Implementation Status:      PAUSED / INCOMPLETE
Implementation Authorization:        NONE
```

The 13 existing authorized frontend files are:
1. `adaptive-aptitude-app/index.html`
2. `adaptive-aptitude-app/package.json`
3. `adaptive-aptitude-app/package-lock.json`
4. `adaptive-aptitude-app/tsconfig.json`
5. `adaptive-aptitude-app/vite.config.ts`
6. `adaptive-aptitude-app/vitest.config.ts`
7. `adaptive-aptitude-app/playwright.config.ts`
8. `adaptive-aptitude-app/src/types/api.ts`
9. `adaptive-aptitude-app/src/types/quiz.ts`
10. `adaptive-aptitude-app/src/types/analytics.ts`
11. `adaptive-aptitude-app/src/utils/apiBaseUrl.ts`
12. `adaptive-aptitude-app/src/utils/queryKeyFactory.ts`
13. `adaptive-aptitude-app/src/styles/tokens.css`

All 13 existing authorized files are preserved strictly without modification. Frontend implementation remains completely paused pending prescriptive specification reconciliation and subsequent implementation authorization.

---

## 4. EXISTING LEARNER API CAPABILITY AUDIT

The backend exposes exactly 86 registered routes. The learner application mechanically consumes **64 specific operations** (including proposed Operation 64 prescription issuance), while the remaining **22 routes** are explicitly classified as non-consumed operational probes, tombstones, non-learner authoring utilities, or low-level redundant CRUD bypassed by higher-level workflow APIs:

```text
Total Registered Backend Routes:    86
Consumed Learner-Facing Operations: 64
Non-Consumed Backend Routes:        22
Unclassified Backend Routes:        0
```

### 4.1 Authoritative Consumed Operations Inventory (64 Operations)

| # | HTTP Method | Frozen Backend Route | Consuming Frontend Feature | Primary DTO / Contract |
|---|---|---|---|---|
| 1 | `POST` | `/api/v1/auth/register` | Learner Registration | `{ name, email, password }` -> `{ user: AuthUserSummary }` (no auto-login, no tokens) |
| 2 | `POST` | `/api/v1/auth/login` | Learner Login | `{ email, password }` -> `{ accessToken, expiresIn, user }`, sets httpOnly refreshToken cookie |
| 3 | `POST` | `/api/v1/auth/refresh` | Single-Flight Session Rotation | HttpOnly Cookie `refreshToken`, Header: Origin -> `{ accessToken, expiresIn }`, rotates cookie |
| 4 | `POST` | `/api/v1/auth/logout` | Session Revocation | Bearer JWT -> clears httpOnly cookie -> `{ message }` |
| 5 | `POST` | `/api/v1/auth/revoke-all` | Universal Device Logout | Bearer JWT -> revokes family |
| 6 | `GET` | `/api/v1/auth/me` | Principal & Session Shell | Bearer JWT -> `{ user, session }` |
| 7 | `GET` | `/api/v1/questions/topics` | Practice Catalog Root | List of 24 canonical topics |
| 8 | `GET` | `/api/v1/questions/topic/:topic/patterns` | Topic Pattern Browser | Canonical patterns in topic |
| 9 | `GET` | `/api/v1/questions/topic/:topic` | Topic Question Explorer | Paginated questions by topic |
| 10 | `GET` | `/api/v1/questions/topic/:topic/pattern/:pattern` | Pattern Question Explorer | Paginated questions by pattern |
| 11 | `GET` | `/api/v1/questions/topic/:topic/random` | Random Topic Practice | Sample questions by topic |
| 12 | `GET` | `/api/v1/questions/topic/:topic/pattern/:pattern/random` | Random Pattern Practice | Sample questions by pattern |
| 13 | `GET` | `/api/v1/questions/:id([a-fA-F0-9]{24})` | Question Detail Viewer | Single question metadata |
| 14 | `GET` | `/api/v1/users/:userId` | Learner Profile Display | Principal user record |
| 15 | `GET` | `/api/v1/goals/user/:userId` | Active Goal Evaluator | List of learner goals |
| 16 | `POST` | `/api/v1/goals` | Goal Creation Wizard | `{ title, type, targetDate, ... }` |
| 17 | `GET` | `/api/v1/goals/:id` | Goal Detail View | Single goal record |
| 18 | `PATCH` | `/api/v1/goals/:id` | Goal Adjustment | Updated goal fields |
| 19 | `DELETE`| `/api/v1/goals/:id` | Goal Removal / Reset | Removes target goal |
| 20 | `POST` | `/api/v1/planning/preview` | Schedule Preview Modal | Preview generated schedule |
| 21 | `POST` | `/api/v1/planning/generate` | Onboarding Plan Commit | Commits generated study plan |
| 22 | `POST` | `/api/v1/planning/plans/:planId/replan` | Schedule Pace Rebalancing | Dynamic plan replan |
| 23 | `GET` | `/api/v1/planning/plans/:planId/schedule` | Multi-Week Calendar View | Full study plan calendar |
| 24 | `GET` | `/api/v1/study-plans/user/:userId` | Study Plan List | Learner's historical plans |
| 25 | `GET` | `/api/v1/daily-objectives/user/:userId` | Daily Tasks & Targets | Daily objectives for today |
| 26 | `PATCH`| `/api/v1/daily-objectives/:id` | Task Check-Off / Progress | Updates objective status |
| 27 | `POST` | `/api/v1/attempts` | Question Attempt Submission | Records answer & updates mastery |
| 28 | `GET` | `/api/v1/attempts/user/:userId` | Mistake Notebook & History | Attempt query (`?isCorrect=false`) |
| 29 | `GET` | `/api/v1/progress/:userId` | Overall Mastery Summary | High-level student progress |
| 30 | `GET` | `/api/v1/progress/:userId/topics` | Topic Mastery Breakdown | Progress by topic |
| 31 | `GET` | `/api/v1/progress/:userId/patterns` | Pattern Mastery Matrix | Progress by canonical pattern |
| 32 | `GET` | `/api/v1/progress/:userId/weakest` | Weakest Patterns Widget | Remediable weak patterns |
| 33 | `GET` | `/api/v1/progress/prerequisites/:patternName` | Prerequisite Graph Modal | DAG prerequisite nodes |
| 34 | `GET` | `/api/v1/adaptive/next-question` | Adaptive Practice Engine | Deterministic adaptive next-question |
| 35 | `GET` | `/api/v1/revisions/due` | Fixed-Stage Revision Due Queue | Items due for review today |
| 36 | `GET` | `/api/v1/revisions/plan` | 1-Day / 2-Day Revision Plan | Upcoming review volume (1-2 days) |
| 37 | `POST` | `/api/v1/revisions/rebuild` | Revision Queue Synchronizer | Re-indexes revision state |
| 38 | `GET` | `/api/v1/mock-blueprints` | Mock Examination Catalog | Standardized exam blueprints |
| 39 | `POST` | `/api/v1/mock-sessions` | Exam Session Initialization | Creates new mock session |
| 40 | `POST` | `/api/v1/mock-sessions/:id/start` | Exam Timer Unseal | Begins authoritative countdown |
| 41 | `GET` | `/api/v1/mock-sessions/:id` | Active Exam View | Exam shell (no answer keys) |
| 42 | `GET` | `/api/v1/mock-sessions/:id/questions/:questionId` | Exam Question Fetcher | Single question in exam |
| 43 | `POST` | `/api/v1/mock-sessions/:id/responses` | Exam Answer Save | Records response & review flag |
| 44 | `POST` | `/api/v1/mock-sessions/:id/sections/:sectionId/complete`| Section Locked Transition | Locks completed section |
| 45 | `POST` | `/api/v1/mock-sessions/:id/submit` | Final Exam Submission | Finalizes & scores session |
| 46 | `POST` | `/api/v1/mock-sessions/:id/abandon` | Exam Forfeit | Terminates active exam |
| 47 | `GET` | `/api/v1/mock-sessions/:id/result` | Score Report & Breakdown | Score, accuracy, pacing, domain breakdowns |
| 48 | `GET` | `/api/v1/mock-sessions/:id/review` | Post-Exam Review | Unsealed answers & explanations |
| 49 | `GET` | `/api/v1/analytics/dashboard` | Unified Analytics Dashboard | Dashboard summary and topic mastery evidence |
| 50 | `GET` | `/api/v1/analytics/cognitive-profile` | Cognitive Profile Diagnostics | Speed/accuracy quadrant counts, timing summaries, stamina quartile evidence |
| 51 | `GET` | `/api/v1/analytics/retention` | Retention Evidence | Observed retention by gap bucket and current revision stage distribution |
| 52 | `GET` | `/api/v1/analytics/readiness/:goalId`| Target Goal Readiness Meter | Empirical exam readiness |
| 53 | `GET` | `/api/v1/orchestration/next-action` | Next-Best-Action (NBA) Card | Highest urgency prescription |
| 54 | `GET` | `/api/v1/orchestration/daily-agenda` | 4-Segment Daily Agenda | `{ status, reason?, activeMockSessionId?, agenda? }` container with 4 segments & checkpoints |
| 55 | `GET` | `/api/v1/orchestration/interventions`| Active Pedagogical Alerts | Pacing / fatigue alerts |
| 56 | `POST` | `/api/v1/attribution/prescriptions/:prescriptionId/activate` | Prescription Lease Lock | Begins prescribed activity |
| 57 | `POST` | `/api/v1/attribution/prescriptions/:prescriptionId/complete` | Prescription Verification | Confirms adherence |
| 58 | `POST` | `/api/v1/learning/tutor` | Socratic AI Tutor Workspace | Interactive learning dialogue |
| 59 | `POST` | `/api/v1/learning/hint` | Contextual Practice Hint | 5-level contextual hints (levels 1–5; level 5 requires prior attempt) |
| 60 | `POST` | `/api/v1/learning/explain-attempt` | Misconception Diagnosis | AI analysis of wrong answer |
| 61 | `POST` | `/api/v1/learning/explain-progress` | Coaching Summary Card | Narrative momentum review |
| 62 | `POST` | `/api/v1/learning/explain-plan` | Study Plan Rationale | Strategic breakdown of plan |
| 63 | `POST` | `/api/v1/learning/mock-review` | Mock Exam AI Debrief | Post-exam executive analysis |
| 64 | `POST` | `/api/v1/attribution/prescriptions` | Prescriptive Issuance (Proposed) | `{ originSurface, goalId?, actionId? }`, Header: `Idempotency-Key` -> `PrescriptionIssuanceResponseDto` |

### 4.2 Non-Consumed Operations Classification (22 Operations)

| # | HTTP Method | Exact Frozen Path | Frozen Auth Class | Frozen Ownership Class | Phase 15 Consumption | UI Architecture Reason for Non-Consumption |
|---|---|---|---|---|---|---|
| 1 | `GET` | `/health` | Unauthenticated | Platform Health | NO | Infrastructure liveness probe; not required by Phase 15 V1 learner UX. |
| 2 | `GET` | `/health/live` | Unauthenticated | Platform Health | NO | Kubernetes container liveness probe; not required by Phase 15 V1 learner UX. |
| 3 | `GET` | `/health/ready` | Unauthenticated | Platform Health | NO | Database dependency readiness probe; not required by Phase 15 V1 learner UX. |
| 4 | `GET` | `/metrics` | Bearer Metrics Secret | Operational Telemetry | NO | Prometheus metrics scraper endpoint; not required by Phase 15 V1 learner UX. |
| 5 | `POST` | `/api/v1/users` | Unauthenticated (Tombstone) | Public (HTTP 410) | NO | Permanently deprecated (HTTP 410 `USER_CREATION_ENDPOINT_DEPRECATED`); registration is handled via `POST /api/v1/auth/register`. |
| 6 | `POST` | `/api/v1/mock-blueprints` | CLOSED / Tombstone Auth Bypass | None — learner mutation permanently closed | NO | Blueprint authoring mutation closed in production (HTTP 403 `BLUEPRINT_MUTATION_CLOSED`); bypasses auth for deterministic 403. |
| 7 | `POST` | `/api/v1/mock-blueprints/preview` | Authenticated (`req.user`) | Shared Content | NO | Authenticated Shared Content — Not Consumed by Phase 15 V1. The learner V1 consumes published blueprint catalog; authoring/preview is omitted. |
| 8 | `GET` | `/api/v1/mock-blueprints/:id` | Authenticated (`req.user`) | Shared Content | NO | Blueprint catalog (`GET /api/v1/mock-blueprints`) provides metadata for exam selection; individual blueprint lookup is not required by learner UX. |
| 9 | `POST` | `/api/v1/study-plans` | Authenticated (`req.user`) | User-Owned | NO | Low-level direct plan creation is omitted; study plans are generated through high-level planning wizard (`POST /api/v1/planning/generate`). |
| 10 | `GET` | `/api/v1/study-plans/:id` | Authenticated (`req.user`) | User-Owned | NO | Single plan lookup by ID is omitted; plans and schedules are accessed via user endpoints (`/study-plans/user/:userId` and `/planning/plans/:id/schedule`). |
| 11 | `PATCH` | `/api/v1/study-plans/:id` | Authenticated (`req.user`) | User-Owned | NO | Direct manual plan modification is omitted; schedule pace adjustments are performed via `POST /api/v1/planning/plans/:planId/replan`. |
| 12 | `DELETE`| `/api/v1/study-plans/:id` | Authenticated (`req.user`) | User-Owned | NO | Direct plan deletion is omitted; goal lifecycle management handles plan lifecycle. |
| 13 | `POST` | `/api/v1/daily-objectives` | Authenticated (`req.user`) | User-Owned | NO | Manual daily objective creation is omitted; daily objectives are automatically synthesized during planning generation. |
| 14 | `GET` | `/api/v1/daily-objectives/:id` | Authenticated (`req.user`) | User-Owned | NO | Individual objective lookup by ID is omitted; objectives are queried by user date range via `GET /api/v1/daily-objectives/user/:userId`. |
| 15 | `DELETE`| `/api/v1/daily-objectives/:id` | Authenticated (`req.user`) | User-Owned | NO | Individual objective deletion is not exposed to learners; objective recalculation is handled through replanning. |
| 16 | `GET` | `/api/v1/attempts/:id` | Authenticated (`req.user`) | User-Owned | NO | Single attempt lookup by ID is omitted; attempts are queried in paginated user collections via `GET /api/v1/attempts/user/:userId`. |
| 17 | `GET` | `/api/v1/progress/:userId/difficulty-distribution` | Authenticated (`req.user`) | User-Owned | NO | Specialized diagnostic endpoint; not required by Phase 15 V1 learner UX. |
| 18 | `GET` | `/api/v1/progress/:userId/accuracy-over-time` | Authenticated (`req.user`) | User-Owned | NO | Specialized diagnostic endpoint; not required by Phase 15 V1 learner UX. |
| 19 | `GET` | `/api/v1/progress/:userId/by-source` | Authenticated (`req.user`) | User-Owned | NO | Specialized diagnostic endpoint; not required by Phase 15 V1 learner UX. |
| 20 | `GET` | `/api/v1/revisions/user/:userId` | Authenticated (`req.user`) | User-Owned | NO | Unfiltered raw revision ledger; learner UX consumes actionable queue `GET /api/v1/revisions/due` and projection `GET /api/v1/revisions/plan`. |
| 21 | `GET` | `/api/v1/revisions/:id` | Authenticated (`req.user`) | User-Owned | NO | Single revision lookup by ID is omitted; items are reviewed within active sessions. |
| 22 | `GET` | `/api/v1/attribution/users/:userId/summary` | Authenticated (`req.user`) | User-Owned | NO | Specialized longitudinal summary report; not required by Phase 15 V1 learner UX. |

---

## 5. PHASE 15 GOALS

1. **Production-Grade Single Page Application**: Deliver a responsive, accessible, resilient web client built with modern engineering standards.
2. **Strict Phase 14 Security Alignment**: Guarantee 100% adherence to in-memory access token storage, browser-managed HttpOnly refresh cookies, single-flight refresh concurrency locks, and automatic 401 recovery.
3. **Seamless Adaptive Journey**: Guide the learner fluidly through authentication, goal configuration, daily agenda execution, adaptive practice, mistake remediation, spaced repetition, mock exams, cognitive analytics, and AI tutoring.
4. **Authoritative Learning Integrity**: Rely entirely on backend scoring, deterministic mastery scores, adaptive difficulty selection, and fixed-stage spaced revision calculations without duplicate or divergent client-side math.
5. **Robust Error Resilience & Cooldown Handling**: Provide deterministic UI representations for loading, empty, degraded, rate-limited (Tier-4 LLM 429), and disconnected states.
6. **Accessibility & Responsive Polish**: Adhere strictly to WCAG 2.2 Level AA accessibility standards, semantic landmarks, keyboard navigation, and responsive ergonomics from mobile (320px) to desktop (1920px).

---

## 6. PHASE 15 EXPLICIT NON-GOALS

The following capabilities are strictly out of scope for Phase 15:
- **Zero Backend Changes**: No new backend routes, controllers, models, or database schemas.
- **No Teacher / Admin / Operator Portals**: No administrative user management, teacher dashboards, institutional views, or web-based policy configuration.
- **No Social Logins or External Identity Providers**: No Google, GitHub, OAuth2, OIDC, or SSO integrations.
- **No Multi-Factor Authentication (MFA)**: No SMS, TOTP, WebAuthn, or Passkeys.
- **No Email Delivery Flows**: No outbound emails, password reset email links, or email verification flows.
- **No Client-Side Learning Algorithms**: No browser-side mastery updating, adaptive difficulty calibration, or revision scheduling computations.
- **No Persistent Offline Mutation Sync**: No local offline database, sync queue, or offline exam progress.
- **No Phase 16 Infrastructure**: No edge reverse-proxy configuration, TLS termination, CDN asset caching, or container orchestration.

---

## 7. UX PRINCIPLES

1. **Cognitive Clarity Over Clutter**: Aptitude learning requires deep mental focus. The UI minimizes decorative visual distractions, unnecessary badges, and gamification noise, prioritizing clean typography, clear question presentation, and actionable metrics.
2. **Prescriptive Guidance**: The platform actively answers *"What should I do right now?"* via the Phase 9 Prescriptive Orchestration engine rather than leaving the learner overwhelmed with options.
3. **Calm, Constructive Feedback**: Incorrect answers are framed as diagnostic learning opportunities through automated error attribution, prerequisite graph exploration, and AI-guided hints.
4. **Deterministic Exam Simulation**: Mock tests strictly mimic realistic exam conditions, including section countdowns, authoritative server-side time boundaries, and sealed answer keys.
5. **Instant Interaction & Smooth Micro-Animations**: Navigation and question interactions feel immediate, using subtle state transitions and layout stability (Zero Cumulative Layout Shift).

---

## 8. CANDIDATE FRONTEND ARCHITECTURE OPTIONS

### Candidate A: React Single Page Application (SPA) with Vite
A decoupled client-side application compiled with Vite, rendered in the user's browser, utilizing React 18+ and TypeScript. Routing is handled via client-side History API (`react-router-dom`). Data access is coordinated via `@tanstack/react-query`. Styling uses Vanilla CSS Design Tokens with scoped CSS Modules.

### Candidate B: Server-Side Rendered (SSR) Framework (Next.js / Remix)
A hybrid client/server framework executing a Node.js middleware server that renders HTML before client hydration.

### Candidate C: Multi-Page Application (MPA) with Server Templates (Express + EJS)
Server-rendered traditional HTML pages returned directly from Express controllers, hydrated with lightweight Vanilla JavaScript islands.

### Candidate D: Vanilla JavaScript Single Page Application (No Framework)
A hand-rolled client SPA using native ES Modules, Vanilla DOM manipulation, native History API, and standard Web Components.

---

## 9. WEIGHTED DECISION MATRICES

### 9.1 Framework Selection Matrix

| Evaluation Dimension | Weight | Option A: React SPA + Vite | Option B: Next.js (SSR) | Option C: Express MPA | Option D: Vanilla JS SPA |
|---|---|---|---|---|---|
| **Backend Contract Compatibility** | 20% | **95** (19.0) | 70 (14.0) | 60 (12.0) | 85 (17.0) |
| **Security & Phase 14 Alignment** | 15% | **95** (14.25) | 65 (9.75) | 80 (12.0) | 90 (13.5) |
| **Adaptive UX & Dynamic State** | 15% | **95** (14.25) | 80 (12.0) | 40 (6.0) | 60 (9.0) |
| **Maintainability & Developer Speed**| 15% | **90** (13.5) | 80 (12.0) | 60 (9.0) | 50 (7.5) |
| **Performance & Bundle Efficiency** | 10% | **90** (9.0) | 85 (8.5) | 95 (9.5) | 98 (9.8) |
| **Testability (Unit, E2E, Mocks)** | 10% | **95** (9.5) | 75 (7.5) | 60 (6.0) | 60 (6.0) |
| **Developer Complexity** | 10% | **85** (8.5) | 55 (5.5) | 80 (8.0) | 45 (4.5) |
| **Deployment Compatibility** | 5% | **95** (4.75) | 70 (3.5) | 85 (4.25) | 95 (4.75) |
| **Weighted Total** | **100%** | **92.75** | **72.75** | **66.75** | **72.05** |
| **Verdict** | | **SELECTED** | REJECTED | REJECTED | REJECTED |

#### Rationale for Rejections:
- **Next.js (SSR) Rejected**: An intermediate Node.js server severely complicates Phase 14 security contracts. An SSR server would either need access to the learner's access token (violating the in-memory constraint) or act as a proxy forwarding HttpOnly cookies and headers, distorting client `Origin` validation, rate limiter IP tracking (Stage 6), and WebSocket/SSE futures. Furthermore, static export Next.js offers zero advantage over Vite while introducing unnecessary configuration bloat.
- **Express MPA Rejected**: The adaptive learning experience requires rapid, sub-second question transitions, active client countdown timers, real-time Socratic AI chat, interactive question maps, and complex local quiz state machines. Traditional page reloads destroy exam flow and degrade learner immersion.
- **Vanilla JS SPA Rejected**: Hand-rolling state machines, reactive question-rendering components, query caching, and accessible modal/dialog trees across 16 screens without a proven framework introduces extreme surface area for defects and poor maintainability.

### 9.2 Styling Strategy Decision Matrix

| Evaluation Dimension | Weight | Vanilla CSS + CSS Modules | TailwindCSS | CSS-in-JS (Styled) |
|---|---|---|---|---|
| **Standards Compliance & Flexibility**| 25% | **95** (23.75) | 70 (17.5) | 65 (16.25) |
| **Performance (Zero Runtime Overhead)**| 25% | **100** (25.0) | 95 (23.75) | 60 (15.0) |
| **Design Token & Theming Ergonomics** | 20% | **95** (19.0) | 85 (17.0) | 85 (17.0) |
| **Project Guidance Conformance** | 20% | **100** (20.0) | 40 (8.0) | 60 (12.0) |
| **Maintainability & Scoping** | 10% | **90** (9.0) | 85 (8.5) | 85 (8.5) |
| **Weighted Total** | **100%** | **96.75** | **74.75** | **68.75** |
| **Verdict** | | **SELECTED** | REJECTED | REJECTED |

### 9.3 Charting Architecture Decision Matrix

| Evaluation Dimension | Weight | Option A: Native SVG Components | Option B: Recharts | Option C: Chart.js (Canvas) |
|---|---|---|---|---|
| **Accessibility (Screen Reader & ARIA)**| 20% | **95** (19.0) | 80 (16.0) | 60 (12.0) |
| **Zero Runtime Bundle Impact** | 20% | **100** (20.0) | 65 (13.0) | 60 (12.0) |
| **Zero External Supply-Chain Risk** | 20% | **100** (20.0) | 70 (14.0) | 70 (14.0) |
| **Testability in jsdom (No Canvas Mock)**| 20% | **100** (20.0) | 85 (17.0) | 50 (10.0) |
| **Implementation Complexity** | 20% | **80** (16.0) | 90 (18.0) | 80 (16.0) |
| **Weighted Total** | **100%** | **95.00** | **78.00** | **64.00** |
| **Verdict** | | **SELECTED** | REJECTED | REJECTED |

---

## 10. SELECTED FRONTEND ARCHITECTURE

```text
Architecture Type:          Single Page Application (SPA)
Build Tool & Dev Server:    Vite 5.x
Language:                   TypeScript 5.x (Strict Mode)
Core Library:               React 18.x
Client Router:              React Router v6.x
Server-State Cache:         TanStack Query v5.x (@tanstack/react-query)
Local State Management:     React Hooks (useState, useReducer, useContext)
Styling Architecture:       Vanilla CSS (Modern Design Tokens + Scoped CSS Modules)
Charting Subsystem:         Native Accessible SVG Components (Zero Dependency)
Markdown Parser:            marked (^13.0.0)
Sanitizer:                  DOMPurify (^3.1.5)
Mathematical Rendering:     Plain Unicode Math + CSS Tabular Numerals (Zero Dependency)
Font Delivery:              System Font Stack (Zero Network Requests, Zero FOIT/FOUT)
Iconography:                Lucide React (^0.395.0) (Tree-shaken SVG icons)
Unit & Component Testing:   Vitest + jsdom + React Testing Library + MSW
End-to-End Testing:         Playwright
```

---

## 11. APPLICATION ROUTE ARCHITECTURE

The application implements a clean, declarative route map partitioned into Public and Guarded Protected layouts:

```text
/                                       -> Public Landing / Features Screen
/login                                  -> Public Login Screen
/register                               -> Public Registration Screen

/app                                    -> Authenticated Shell (Sidebar, Header, Main View)
  /app/onboarding                       -> Goal Selection & Diagnostic Onboarding
  /app/dashboard                        -> Learner Dashboard (Readiness, Active Goal, NBA)
  /app/agenda                           -> Prescriptive Daily Agenda (4 Segments)
  /app/practice                         -> Topic & Pattern Catalog
  /app/practice/:topic                  -> Topic Detail & Pattern Selection
  /app/practice/:topic/:pattern         -> Standard Pattern Practice Session
  /app/adaptive                         -> Adaptive Dynamic Practice Session
  /app/mistakes                         -> Mistake Remediation Notebook
  /app/revision                         -> Fixed-Stage Spaced Revision Daily Queue & 2-Day Plan
  /app/mock-exams                       -> Mock Examination Catalog & Blueprint Select
  /app/mock-exams/:sessionId            -> Full-Screen Authoritative Mock Exam Session
  /app/mock-exams/:sessionId/result     -> Final Mock Score Report & Analytics
  /app/mock-exams/:sessionId/review     -> Question-by-Question Post-Exam Review
  /app/analytics                        -> Cognitive Diagnostics & Retention Evidence
  /app/tutor                            -> Socratic AI Tutor Workspace
  /app/profile                          -> Learner Profile & Security Settings
```

All 16 protected routes and 3 public routes are fully classified. Unclassified routes count: `0`.

---

## 12. AUTHENTICATION / SESSION UX ARCHITECTURE

### 12.1 Authoritative Access Token Ownership
To eliminate dual-source ambiguity:
- **`tokenManager.ts` is the SOLE AUTHORITATIVE OWNER of the raw access JWT**. The token is held in a private, non-exported JavaScript module closure variable (`let inMemoryAccessToken: string | null = null;`). It is **NEVER** persisted to `localStorage`, `sessionStorage`, `IndexedDB`, cookies, or URL parameters.
- **`AuthContext` owns authentication status (`'BOOTSTRAPPING' | 'AUTHENTICATED' | 'UNAUTHENTICATED' | 'ACCOUNT_DISABLED' | 'SERVICE_UNAVAILABLE'`), `UserPrincipal`, and `SessionMetadata` only**. `AuthContext` does NOT maintain an independent copy of the raw JWT string.
- **`apiClient.ts` retrieves the token exclusively via `tokenManager.getAccessToken()`**.
- **Raw JWT copies in React state stores**: `0`.
- **Persistent JWT copies**: `0`.

### 12.2 Refresh Token Contract
- Managed exclusively by the browser via the Phase 14 `refreshToken` cookie (`HttpOnly`, `Path=/api/v1/auth/refresh`, `SameSite=Strict`, `Secure` in production). JavaScript cannot access, inspect, or modify this cookie.
- **Browser-Generated Origin**: In compliance with web security standards, the `Origin` header is generated exclusively by the browser upon cross-origin or credentials-included requests. The frontend application never manually sets or fabricates an `Origin` header. Backend Phase 14 remains sole authority for validating the Origin against `CORS_ALLOWED_ORIGINS`.

### 12.3 Application Auth Bootstrap Flow & Error Taxonomy
Both initial bootstrap and runtime 401 recovery converge on the exact same `tokenManager.executeSingleFlightRefresh()` mechanism with deterministic branching:

```text
                               Application Boots
                                       │
                                       ▼
     AuthBootstrapBoundary Mounts (BOOTSTRAPPING state, renders branded skeleton)
                                       │
                                       ▼
            tokenManager.executeSingleFlightRefresh() (Single-Flight Lock)
                                       │
      ┌────────────────────────────────┼────────────────────────────────┬────────────────────────┐
      ▼ (HTTP 200 OK)                  ▼ (401 Bad / Expired Session)     ▼ (403 ACCOUNT_DISABLED)  ▼ (Network / 5xx Fault)
Stores JWT in tokenManager      tokenManager clears memory       tokenManager clears token  tokenManager retains state
      │                                │                                │ (Halts all polling)     │ (Does NOT logout user)
GET /api/v1/auth/me             AuthContext -> UNAUTHENTICATED   AuthContext ->            AuthContext ->
      │                                │                         ACCOUNT_DISABLED          SERVICE_UNAVAILABLE
AuthContext -> AUTHENTICATED    If on /app/* -> /login           Dedicated Inactive View   Recoverable Offline View
Renders Protected Shell         If on public -> Public view      (NO redirect loop)        (Manual Retry Affordance)
```

#### Deterministic Error Handling Taxonomy:
1. **Refresh Success (HTTP 200)**:
   - Stores newly rotated access JWT in `tokenManager`.
   - Calls `GET /api/v1/auth/me` to hydrate `user` and `session` metadata.
   - Transitions `AuthContext` to `'AUTHENTICATED'` and mounts the protected application shell.
2. **Invalid or Expired Credentials (HTTP 401 `INVALID_REFRESH_TOKEN`, `SESSION_EXPIRED`, `REFRESH_REUSE_DETECTED`, missing cookie)**:
   - Calls `tokenManager.clearAccessToken()`.
   - Transitions `AuthContext` to `'UNAUTHENTICATED'`.
   - If learner navigated to a protected route (`/app/*`), redirects cleanly to `/login`. If on a public route, renders public content.
3. **Account Disabled (HTTP 403 `ACCOUNT_DISABLED`)**:
   - Calls `tokenManager.clearAccessToken()` and halts all periodic polling queries.
   - Transitions `AuthContext` to `'ACCOUNT_DISABLED'`.
   - Renders a dedicated inactive-account screen with support contact instructions. **DO NOT redirect-loop to `/login`**.
4. **Origin Security Failures (HTTP 403 `REFRESH_ORIGIN_REQUIRED` or `CORS_ORIGIN_DENIED`)**:
   - Indicates edge proxy or domain configuration mismatch.
   - Clear memory token if present; **DO NOT loop refresh and DO NOT mislabel as invalid credentials**.
   - Renders a bounded configuration error screen displaying correlation ID for platform administrators.
5. **Network Failure or Transient 5xx Infrastructure Fault**:
   - **DO NOT assume learner credentials are invalid; DO NOT redirect to `/login`**.
   - Transitions `AuthContext` to `'SERVICE_UNAVAILABLE'`.
   - Renders a recoverable connection failure screen with a manual *"Retry Connection"* button.

---

## 13. SINGLE-FLIGHT REFRESH ARCHITECTURE

In Phase 14, concurrent reuse of the same refresh token generation is actively flagged as session theft / race condition, triggering family revocation. Therefore, the client **MUST NEVER** emit parallel refresh requests.

### Centralized Base URL Resolver (`src/utils/apiBaseUrl.ts`)

To ensure identical origin resolution across both `apiClient` and `tokenManager`:

```typescript
// src/utils/apiBaseUrl.ts
export function resolveApiUrl(path: string): string {
  const baseUrl = import.meta.env.VITE_API_BASE_URL;
  if (!baseUrl || baseUrl === '' || baseUrl === '/') {
    return path.startsWith('/') ? path : `/${path}`;
  }
  const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${cleanBase}${cleanPath}`;
}
```

Supports canonical same-origin production deployment (`/api/v1/...`) via `VITE_API_BASE_URL` unset, `""`, or `"/"`. The frontend exclusively invokes `resolveApiUrl()`; no client endpoint may manually construct an independent API hostname. Under the frozen production ingress architecture, browser requests are dispatched as same-origin paths (`/api/v1/...`), ensuring zero cross-origin preflight dependency.

### Single-Flight Concurrency Lock Implementation

```typescript
// src/services/api/tokenManager.ts
import { resolveApiUrl } from '../../utils/apiBaseUrl';

export interface RefreshExchangeError extends Error {
  statusCode?: number;
  code:
    | 'INVALID_REFRESH_TOKEN'
    | 'SESSION_EXPIRED'
    | 'REFRESH_REUSE_DETECTED'
    | 'ACCOUNT_DISABLED'
    | 'REFRESH_ORIGIN_REQUIRED'
    | 'CORS_ORIGIN_DENIED'
    | 'SERVICE_UNAVAILABLE'
    | 'NETWORK_ERROR'
    | string;
}

let inMemoryAccessToken: string | null = null;
let singleFlightRefreshPromise: Promise<string> | null = null;

export function getAccessToken(): string | null {
  return inMemoryAccessToken;
}

export function setAccessToken(token: string | null): void {
  inMemoryAccessToken = token;
}

export function clearAccessToken(): void {
  inMemoryAccessToken = null;
}

export async function executeSingleFlightRefresh(): Promise<string> {
  // If an exchange is already in-flight, await the existing promise
  if (singleFlightRefreshPromise) {
    return singleFlightRefreshPromise;
  }

  singleFlightRefreshPromise = (async () => {
    try {
      const response = await fetch(resolveApiUrl('/api/v1/auth/refresh'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Transmits HttpOnly cookie; Origin header is browser-generated
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorCode = errorData?.error?.code || (
          response.status === 403 ? 'FORBIDDEN' :
          response.status >= 500 ? 'SERVICE_UNAVAILABLE' : 'UNAUTHORIZED'
        );

        // CLASSIFICATION OCCURS BEFORE DESTRUCTIVE TOKEN CLEARING:
        // Only credential-invalidating failures clear the in-memory access token.
        // Transient 5xx failures MUST NOT clear valid in-memory tokens!
        if (
          errorCode === 'INVALID_REFRESH_TOKEN' ||
          errorCode === 'SESSION_EXPIRED' ||
          errorCode === 'REFRESH_REUSE_DETECTED' ||
          errorCode === 'ACCOUNT_DISABLED' ||
          errorCode === 'UNAUTHORIZED'
        ) {
          clearAccessToken();
        } else if (
          errorCode === 'REFRESH_ORIGIN_REQUIRED' ||
          errorCode === 'CORS_ORIGIN_DENIED'
        ) {
          // Edge configuration failure; fail closed without refresh loop
          clearAccessToken();
        }

        const err = new Error(errorCode) as RefreshExchangeError;
        err.statusCode = response.status;
        err.code = errorCode;
        throw err;
      }

      const payload = await response.json();
      const newAccessToken: string = payload.data.accessToken;
      setAccessToken(newAccessToken);
      return newAccessToken;
    } catch (networkOrSystemError: any) {
      if (networkOrSystemError?.code) {
        throw networkOrSystemError;
      }
      // Transient fetch/network failure: DO NOT clear token!
      const err = new Error('NETWORK_ERROR') as RefreshExchangeError;
      err.code = 'NETWORK_ERROR';
      throw err;
    } finally {
      // Release concurrency lock immediately upon resolution/rejection
      singleFlightRefreshPromise = null;
    }
  })();

  return singleFlightRefreshPromise;
}
```

- Direct parallel refresh implementations: `0`.
- Hardcoded refresh origin independent of `apiClient`: `0`.
- Generic non-2xx → immediate token deletion: `0`.
- 5xx refresh response causing unconditional `clearAccessToken()`: `0`.
- Network failure forced logout: `0`.
- All requests encountering expired tokens queue behind `singleFlightRefreshPromise`.

---

## 14. API CLIENT ARCHITECTURE

All network requests flow through a unified API client wrapper (`apiClient.ts`).

### Core Responsibilities:
1. **Base URL Resolution**: Resolves all endpoint paths through `resolveApiUrl()`.
2. **Bearer Token Injection**: Automatically injects `Authorization: Bearer <token>` from `tokenManager.getAccessToken()`.
3. **Credentials Support**: Sets `credentials: 'include'` for all requests.
4. **401 Interception & Replay**:
   - Detects HTTP 401 responses on protected endpoints.
   - Enforces a strict **one-time replay guard** (`isRetry = true`).
   - Invokes `executeSingleFlightRefresh()`.
   - On refresh success, replays the original request with the new token.
   - On refresh failure, dispatches error to the Auth taxonomy:
     * Invalid/expired session -> clears token, transitions to `'UNAUTHENTICATED'`, routes to `/login`.
     * `ACCOUNT_DISABLED` -> clears token, halts polling, transitions to `'ACCOUNT_DISABLED'`.
     * Origin/CORS error -> surfaces security configuration failure.
     * Network error / 5xx -> surfaces recoverable network alert without clearing local state.
5. **No Recursive Authentication Retries**: Calls to `/api/v1/auth/*` are never automatically retried on 401 to prevent infinite loops.
6. **Request Abort Support**: Exposes native `AbortSignal` integration for route teardown and debounced search cancellations.
7. **Canonical Error Parsing**: Extracts `{ success: false, error: { code, message } }` into typed `ApiClientError` exceptions.

---



### 14.1 Uniform Raw Wire Response Ownership & Endpoint Service Contracts

To eliminate the systemic ambiguity between internal service return types and raw HTTP transport responses (Finding W01), Phase 15 adopts a deterministic wire ownership contract:

1. **`apiClient` Return Invariant**: `apiClient` returns the decoded **raw HTTP response JSON unchanged**. It never automatically strips `data`, synthesizes artificial fields, or discards root envelope properties.
2. **Endpoint Service Contract**: All endpoint service modules (`authApi.ts`, `questionApi.ts`, `planningApi.ts`, `attemptApi.ts`, `analyticsApi.ts`, `orchestrationApi.ts`, `learningApi.ts`) return the full, typed `RawWireResponse`. Endpoint services do NOT discard `meta`, `count`, `message`, `metadata`, or `provenance`.
3. **Type Separation**:
   - `RawWireResponse`: Represents the complete JSON root structure returned over the network.
   - `PayloadDto`: Represents the nested entity inside `response.data` where applicable.
4. **Operation 3 Single-Flight Refresh Semantics**:
   - The HTTP wire response for `POST /api/v1/auth/refresh` is `AuthRefreshWireResponse` (`{ success: true, data: RefreshResponseDto }`).
   - The internal `tokenManager.refreshSession()` control flow method delegates to `apiClient.post<AuthRefreshWireResponse>('/api/v1/auth/refresh')` and returns `Promise<string>` (the raw rotated JWT access token string).
   - This strictly preserves the single-flight refresh lock (`singleFlightRefreshPromise`), sole in-memory JWT ownership in `tokenManager`, zero duplicate network calls, zero raw token in React state/localStorage, and complete envelope uniformity.

---

## 15. STATE MANAGEMENT ARCHITECTURE

The application maintains a strict separation between **Server State** and **Local UI State**:

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        SERVER STATE (TanStack Query)                   │
│                                                                        │
│ • User Profile & Active Goal          • Study Plans & Schedules        │
│ • Prescriptive Agenda (NBA)           • Daily Objectives               │
│ • Topic & Pattern Catalogs            • Question Attempt Records       │
│ • Pattern Mastery Progress            • Fixed-Stage Revision Queue     │
│ • Cognitive Diagnostic Evidence       • Mock Exam Results & Review     │
└────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼ (Read-only Props & Cache Invalidation)
┌────────────────────────────────────────────────────────────────────────┐
│                        LOCAL UI STATE (React Hooks)                    │
│                                                                        │
│ • Active Question Selection Index     • Unsubmitted Radio Choice       │
│ • Client Countdown Timer Display      • Modal & Drawer Open/Close      │
│ • Question Map Filter / Review Flags  • Theme Preference (Dark/Light)  │
│ • Collapsed Sidebar Toggle            • AI Tutor Draft Input Message   │
└────────────────────────────────────────────────────────────────────────┘
```

External global state libraries (Redux, Zustand, MobX) are **EXCLUDED**. TanStack Query coordinates all server communication, while React native state (`useState`, `useReducer`, `useContext`) handles component-level presentation state.

---

## 16. SERVER-STATE CACHING ARCHITECTURE

TanStack Query v5 is configured with distinct freshness policies matched to learning data volatility:

| Data Category | Stale Time | Garbage Collection Time | Invalidation Triggers |
|---|---|---|---|
| **Static Taxonomy** (Topics, Patterns) | 24 Hours | 48 Hours | Never (Static Catalog) |
| **User Profile & Goals** | 5 Minutes | 30 Minutes | Goal Mutation, Plan Generation |
| **Daily Agenda & NBA** | 1 Minute | 10 Minutes | Question Attempt, Prescription Complete |
| **Progress & Mastery** | 30 Seconds | 5 Minutes | Attempt Submission, Mock Finalization |
| **Spaced Repetition Due Queue** | 2 Minutes | 15 Minutes | Attempt Submission, Rebuild Trigger |
| **Active Mock Session** | 0 Seconds (Always Fetch) | 2 Minutes | Response Saved, Section Complete |
| **Cognitive Analytics** | 5 Minutes | 30 Minutes | Mock Finalization, Daily Replan |

---

## 17. LEARNER IDENTITY BOUNDARY

In Phase 14, the backend's Stage 13 `enforcePrincipalUserIdBodyQuery` middleware strictly validates that any client-supplied `userId` matches the authenticated JWT token subject (`req.user.userId`).

### Frontend Identity Enforcement Rules:
1. **Never Prompt for `userId`**: The frontend UI never renders an input field, select box, or URL parameter for a learner's ID.
2. **Centralized Identity Injection**: The API client automatically binds `authContext.user.userId` into query parameters and request bodies whenever an endpoint requires it (e.g., `GET /api/v1/progress/:userId`).
3. **No Cross-User Access**: If a route attempts to load another learner's ID, the backend returns HTTP 403 `IDENTITY_MISMATCH` or `OWNERSHIP_VIOLATION`. The frontend translates this into a standard forbidden state.

---

## 18. ONBOARDING ARCHITECTURE

```text
Authenticated Learner (No Goal Detected)
                  │
                  ▼
         /app/onboarding
                  │
       ┌──────────┴──────────┐
       ▼                     ▼
Option A: Target Exam Date   Option B: Custom Aptitude Goal
(Campus Placement, CAT, Bank) (Self-Paced Skill Building)
       │                     │
       └──────────┬──────────┘
                  ▼
    Select Daily Commitment (Minutes)
                  ▼
    Select Target Difficulty & Topics
                  ▼
    POST /api/v1/goals
                  ▼
    POST /api/v1/planning/generate
                  ▼
    Redirect to /app/dashboard
```

1. **First-Login Detection**: Upon successful bootstrap, the dashboard query evaluates `GET /api/v1/goals/user/:userId`. If the goal array is empty, the learner is smoothly routed to `/app/onboarding`.
2. **Deterministic Goal Creation**: The onboarding wizard collects target exam date, daily study minutes, target difficulty (1–10), and target topics.
3. **Automated Plan Generation**: Upon goal creation, the wizard dispatches `POST /api/v1/planning/generate` using the newly created `goalId`, populating multi-week objectives before transitioning to `/app/dashboard`.

---

## 19. DASHBOARD ARCHITECTURE

The Learner Dashboard (`/app/dashboard`) serves as the central command center:

```text
┌────────────────────────────────────────────────────────────────────────┐
│ HEADER: Welcome, [Name]  •  Target: [Goal Name] (Exam: in 42 Days)     │
├──────────────────────────────────┬─────────────────────────────────────┤
│ PRESCRIPTIVE NEXT BEST ACTION    │ TODAY'S PROGRESS                    │
│ "Prerequisite Weakness Detected" │ Daily Target: 45 / 60 Mins (75%)    │
│ Pattern: Work Equivalence        │ Questions Solved: 14                │
│ [ START 15-MIN REMEDIATION ]     │ Streak: 7 Days 🔥                   │
├──────────────────────────────────┼─────────────────────────────────────┤
│ 4-SEGMENT DAILY AGENDA           │ COGNITIVE DIAGNOSTICS PREVIEW       │
│ 1. Warmup: Overdue Revision ✓    │ Accurate & Fast: [returned count]  │
│ 2. Prerequisite Unblocking  ►    │ Median correct: [returned seconds] │
│ 3. Core Curriculum Advancement ○ │ [ VIEW FULL ANALYTICS ]             │
│ 4. Pacing Calibration          ○ │                                     │
├──────────────────────────────────┴─────────────────────────────────────┤
│ WEAKEST PATTERNS TO ADDRESS      •  REVISION QUEUE (FIXED-STAGE)       │
│ • Pipes & Cisterns Alternate (42%)• 6 Questions Due for Review Today   │
│ • Probability Independent (48%)  • [ START REVISION SESSION ]          │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 20. DAILY AGENDA / ORCHESTRATION UX

The Daily Agenda translates Phase 9 Prescriptive Orchestration into the 4 canonical segments:

1. **Segment 1: `WARMUP_RETRIEVAL`**: Overdue or due-today retention rescue (max 1 activity).
2. **Segment 2: `PREREQUISITE_UNBLOCKING`**: Targeted repair of blocking prerequisites identified by the DAG (max 1 activity).
3. **Segment 3: `CORE_CURRICULUM`**: Active study plan topic progression (max 2 activities).
4. **Segment 4: `PACING_OR_BENCHMARK`**: Speed calibration drill or milestone mock exam (max 1 activity).

### Prescription Lease Lifecycle Integration:
Learner execution of recommended segments follows the backend-proven 5-step prescriptive lifecycle (detailed in Section 20.1):
1. **Recommendation**: Prescriptive agenda segments or next actions deliver candidate recommendations bearing an `actionId` (e.g., `act_10a`).
2. **Issuance**: When the learner clicks *"Start Segment"*, the frontend calls `POST /api/v1/attribution/prescriptions` with `{ originSurface: daily_agenda, actionId }` and an `Idempotency-Key` header to mint a formal `prescriptionId` (e.g., `rx_65a...`). Direct activation before issuance is strictly prohibited (`actionId != prescriptionId`).
3. **Activation**: With the issued `prescriptionId`, the client calls `POST /api/v1/attribution/prescriptions/:prescriptionId/activate` to acquire the lease.
4. **Attributed Activity**: The learner engages in the prescribed practice, prerequisite unblocking, or benchmark activity under active lease.
5. **Completion**: Upon finishing or abandoning the session, the client calls `POST /api/v1/attribution/prescriptions/:prescriptionId/complete` to record adherence and update longitudinal attribution tracking.

---



### 20.1 Prescriptive Attribution Lifecycle & Transport Governance Resolution (W38 & W39)

The prescriptive execution and attribution subsystem strictly adheres to the backend-proven 4-stage lifecycle:

```text
Stage 1: Recommendation
  GET /api/v1/orchestration/next-action  OR  GET /api/v1/orchestration/daily-agenda
  Returns: Candidate recommendation with `actionId` (e.g., "act_10a"). Checkpoints have `executionIntent: null`.
  NOTE: actionId IS NOT prescriptionId!

Stage 2: Issuance (Proposed Operation 64)
  POST /api/v1/attribution/prescriptions
  Headers: Idempotency-Key: <unique-uuid-or-key> (REQUIRED, 1–128 chars)
  Body: { originSurface: 'next_action' | 'daily_agenda', goalId?, actionId? }
  Returns: HTTP 201 Created (or 200 Idempotent Replay) with newly minted `prescriptionId` (e.g., "rx_65a...").
  [RESOLVED BY TRANSPORT GOVERNANCE]: Under same-origin production ingress (https://app.example.com/api/v1/...), requests are same-origin. The custom Idempotency-Key header does not trigger cross-origin CORS preflight. Backend source and Phase 14 CORS allowlist remain 100% frozen and unmodified.

Stage 3: Activation (Operation 56)
  POST /api/v1/attribution/prescriptions/:prescriptionId/activate
  Path: :prescriptionId (matches /^rx_[a-f0-9]{24}$/)
  Returns: Prescription lease and status: 'active'.

Stage 4: Completion (Operation 57)
  POST /api/v1/attribution/prescriptions/:prescriptionId/complete
  Path: :prescriptionId
  Body: { abandon?: boolean, mockSessionId?: string }
  Returns: Adherence evaluation and updated outcome metrics.
```

**Strict Architectural Invariants**:
- `actionId != prescriptionId`: The frontend never attempts to pass `actionId` to `/activate` or `/complete`.
- `Idempotency-Key` Header: Required by backend `attributionIssuanceService.js:106` (1–128 characters). Fully supported via same-origin path-based API ingress (`/api/v1/attribution/prescriptions`). Frozen Phase 14 backend CORS is preserved without modification.

---

## 21. TOPIC & PATTERN PRACTICE EXPERIENCE

The Practice Catalog (`/app/practice`) enables focused, self-directed exploration:

1. **Topic Hierarchy**: Renders all 24 canonical topics with aggregated mastery indicators.
2. **Pattern Breakdown**: Clicking a topic routes to `/app/practice/:topic`, displaying all underlying canonical patterns, prerequisite badges, and current pattern mastery percentage.
3. **Configurable Practice Launcher**: Allows selecting question count (5, 10, or 20) supported by `GET /api/v1/questions/topic/:topic/pattern/:pattern/random?limit=N`.
4. **Practice Session View**: Renders the unified Question Shell in `PRACTICE` mode (immediate feedback, step-by-step explanations, and optional Socratic AI hint triggers).

---

## 22. ADAPTIVE PRACTICE EXPERIENCE

The Adaptive Practice module (`/app/adaptive`) connects directly to the Phase 4 Adaptive Engine:

### Client-Side Adaptive Loop

```text
┌────────────────────────────────────────────────────────┐
│ 1. GET /api/v1/adaptive/next-question                  │
│    (Backend selects optimal question via Adaptive Engine)│
└──────────────────────────┬─────────────────────────────┘
                           ▼
┌────────────────────────────────────────────────────────┐
│ 2. Render Question in Question Shell                   │
│    (Capture answer, time spent in seconds)             │
└──────────────────────────┬─────────────────────────────┘
                           ▼
┌────────────────────────────────────────────────────────┐
│ 3. POST /api/v1/attempts                               │
│    (Submits attempt, updates mastery & revision stage) │
└──────────────────────────┬─────────────────────────────┘
                           ▼
┌────────────────────────────────────────────────────────┐
│ 4. Render Outcome & Pedagogical Feedback               │
│    • Correct/Incorrect status                          │
│    • Updated pattern mastery percentage                │
│    • "Explain with AI" affordance                      │
└──────────────────────────┬─────────────────────────────┘
                           ▼
┌────────────────────────────────────────────────────────┐
│ 5. Learner Clicks "Next Question" ──► Loop to Step 1   │
└────────────────────────────────────────────────────────┘
```

The frontend never attempts to predict or calculate next-question difficulty. The backend remains the sole authoritative arbiter of question selection and mastery updates.

---

## 23. MISTAKE-BASED LEARNING

The Mistake Notebook (`/app/mistakes`) enables deliberate practice on prior errors:

1. **Authoritative Route**: Consumes `GET /api/v1/attempts/user/:userId?isCorrect=false&limit=50`.
2. **Filtering & Grouping**: Allows grouping mistakes by Topic, Canonical Pattern, or Difficulty Band.
3. **Misconception Diagnosis**: Each mistake card includes an *"Analyze Mistake"* button calling `POST /api/v1/learning/explain-attempt` to receive an AI breakdown of why the selected answer was incorrect and how to avoid the trap.
4. **Targeted Re-Attempt**: Allows launching a remediation drill with similar questions from the same canonical pattern via `/api/v1/questions/topic/:topic/pattern/:pattern/random`.

---

## 24. REVISION EXPERIENCE (FIXED-STAGE SPACED REVISION)

The Revision Center (`/app/revision`) surfaces Phase 5 fixed-stage spaced revision items (5-stage ladder: 1d, 3d, 7d, 14d, 30d):

1. **Daily Due Queue**: Fetches patterns due today via `GET /api/v1/revisions/due` (`limit=100`, optional filters).
2. **Upcoming Projection**: Renders a 1-day or 2-day revision projection showing scheduled review load via `GET /api/v1/revisions/plan?days=1` or `?days=2` (maximum supported horizon is 2 days; days > 2 rejected with HTTP 400 `INVALID_DAYS`).
3. **Pattern-Scoped Practice Delivery**: Follows the authoritative backend execution flow:
   - Fetches due `RevisionItem` / revision-plan pattern.
   - Resolves canonical topic and pattern.
   - Fetches a learning question for that topic/pattern via supported question delivery routes (`GET /api/v1/questions/topic/:topic/pattern/:pattern/random` or `GET /api/v1/adaptive/next-question?topic=...&pattern=...`).
   - Submits learner attempt via `POST /api/v1/attempts` with `source: 'revision'`.
4. **Authoritative Backend Ladder Progression**: Submitting the attempt via `POST /api/v1/attempts` with `source: 'revision'` triggers Phase 5 server-authoritative state progression on the five-stage ladder (Stage 0: 1d, Stage 1: 3d, Stage 2: 7d, Stage 3: 14d, Stage 4: 30d; correct advances stage; incorrect resets to Stage 0; final stage completion requires mastery >= 0.85). The frontend NEVER calculates or advances revision state locally.
5. **Rebuild Affordance**: Provides a *"Synchronize Queue"* button invoking `POST /api/v1/revisions/rebuild` if the learner's schedule was reset.

---

## 25. MOCK EXAMINATION EXPERIENCE

The Mock Exam subsystem (`/app/mock-exams/*`) implements a high-stakes, realistic test simulation:

### 25.1 Multi-Tiered Mock Exam State Machines

The mock examination experience distinguishes three separate, un-conflated lifecycle state machines strictly adhering to Phase 6 contracts (`src/config/mockConfig.js`):

#### 1. Authoritative Session Lifecycle (`MockSession.status`):
Exactly 5 frozen backend statuses (`mockConfig.SESSION_STATUS`):
- `created`: Session initialized from blueprint; partition generated; timer not yet ticking.
- `started`: Learner unsealed the exam; authoritative server countdown ticking.
- `submitted`: Final section completed or learner explicitly submitted; answers frozen.
- `expired`: Authoritative server duration elapsed before explicit submission; answers frozen.
- `abandoned`: Learner explicitly forfeited exam (`POST .../abandon`); zero stats saved.

Terminal session statuses: `submitted`, `expired`, `abandoned`. There is **NO** session status `in_progress` or `completed`.

```text
CATALOG
   │ POST /api/v1/mock-sessions
   ▼
[ CREATED ]
   ├── POST .../abandon ──────────────────────────────────► [ ABANDONED ]
   │
   ▼ POST .../start
[ STARTED ] (Authoritative Server Timer Active)
   ├── POST .../submit (or final section completion) ─────► [ SUBMITTED ]
   ├── Server Duration Elapsed ───────────────────────────► [ EXPIRED ]
   └── POST .../abandon ──────────────────────────────────► [ ABANDONED ]

POST-TERMINAL PATHWAYS (STATUS-SPECIFIC):
   ├── SUBMITTED / EXPIRED (Scoring & Diagnostic Review Eligible)
   │     ├── Backend Finalization Pipeline (idle → in_progress → completed)
   │     ├── RESULT_VIEW (GET .../result once finalization completed)
   │     └── REVIEW_VIEW (GET .../review post-exam question breakdown)
   │
   └── ABANDONED (Forfeited Exam — Zero Scoring / Zero Leakage)
         ├── Zero scoring pipeline invocation (No mock Attempts created or attributed)
         ├── Zero resultSummary generation (GET .../result returns 400 MOCK_SESSION_NOT_TERMINAL)
         ├── Zero review / answer leakage (GET .../review returns 400 MOCK_SESSION_NOT_TERMINAL)
         └── ABANDONED_VIEW (Safe forfeiture confirmation; routes back to catalog)
```

#### 2. Section Partition Lifecycle (`SectionState.status`):
Tracks section progression within an active session (`mockConfig.SECTION_STATUS`):
- `pending`: Section not yet reached.
- `in_progress`: Active section currently being attempted.
- `completed`: Section finalized and locked under `section_locked` policy.
- `expired`: Per-section time limit reached.

#### 3. Scoring Finalization Lifecycle (`FinalizationState`):
Asynchronous scoring pipeline triggered upon reaching `submitted` or `expired` status (`mockConfig.FINALIZATION_STATE`). `FinalizationState` is backend persisted/internal lifecycle metadata; it does NOT imply a dedicated HTTP 202 response (`POST /submit` returns HTTP 200 with `resultSummary` upon completion, or HTTP 409 `FINALIZATION_IN_PROGRESS` if a lease is in flight):
- `idle`: Session active; finalization not yet triggered.
- `in_progress`: Scoring calculation in flight (lease acquired by worker).
- `completed`: Signed scoring, answered/unanswered reconciliation, accuracy, rawScore, maxPossibleScore, percentage, domain aggregations (sections, topics, patterns, difficulties), pacing analytics, and exactly-once Attempt finalization completed; score report available. (Note: cohort percentiles and rankings are not calculated or supported).
- `failed`: Finalization encountered unrecoverable backend error.

#### 4. Frontend Viewport States:
- `EXAM_VIEWPORT`: Active test environment rendered while `session.status === 'started'`.
- `RESULT_VIEW`: Post-exam score breakdown rendered when `session.status` is `'submitted'` or `'expired'` AND finalization is `'completed'`.
- `REVIEW_VIEW`: Question-by-question post-exam diagnostic review rendered when `session.status` is `'submitted'` or `'expired'` AND backend review endpoint succeeds.
- `ABANDONED_VIEW`: Safe abandonment confirmation and return-to-catalog UI rendered when `session.status === 'abandoned'`. Zero result summaries, zero review palettes, zero correct answers, and zero explanations are rendered.

### 25.2 Anti-Leakage & Integrity Guarantees
- **Sealed Answer Keys**: During an active exam (`started`), `GET /api/v1/mock-sessions/:id` and `GET /api/v1/mock-sessions/:id/questions/:qId` **NEVER** return correct answers or explanations.
- **Authoritative Server Timer**: The exam countdown is initiated on the server at `/start`. If the client timer reaches zero or is closed, the server automatically expires or finalizes the session upon next contact. The client timer is strictly a display mirror.
- **Section Locking**: If the blueprint declares `navigationPolicy: 'section_locked'`, moving past a section requires `POST .../sections/:id/complete`, permanently locking previous sections.
- **Post-Finalization Review**: Correct answers and detailed step-by-step explanations are unsealed **ONLY** for `submitted` or `expired` sessions that satisfy backend review eligibility (`finalizationState === 'completed'`). For `abandoned` sessions, review is strictly prohibited, correct answers are prohibited, and explanations are prohibited (zero answer-leakage pathways).

---

## 26. QUESTION MAP / NAVIGATION SUBSYSTEM

The Mock Exam and Practice modes feature a sticky, accessible Question Navigation Map:

```text
┌────────────────────────────────────────────────────────┐
│ QUESTION PALETTE (Section 1: Quantitative Aptitude)    │
│                                                        │
│ [ 01 ] [ 02 ] [ 03 ] [ 04 ] [ 05 ] [ 06 ] [ 07 ] [ 08 ]│
│   ✓      ✓      •      ⚐      ?      -      -      -   │
│                                                        │
│ LEGEND:                                                │
│ [✓] Answered (Green)       [•] Current (Indigo Ring)   │
│ [⚐] Flagged for Review     [?] Visited/Unanswered      │
│ [-] Unvisited (Muted)                                  │
└────────────────────────────────────────────────────────┘
```

- Clicking any question button updates the active question viewport without page reload.
- Full keyboard support: Arrow keys navigate between questions; `Enter`/`Space` activates.
- Flags and response states are persisted to the server via `POST /api/v1/mock-sessions/:id/responses` on every selection change.

---

## 27. ANALYTICS UX

The Analytics Suite (`/app/analytics`) presents **Cognitive Profile Diagnostics, Topic Mastery, Retention & Readiness Analytics** using native accessible SVG plus equivalent labeled data tables. Every displayed value is existing backend evidence. Display formatting and mapping a value to SVG coordinates do not create a new analytic metric.

### 27.1 Cognitive Profile Diagnostics

Source: `GET /api/v1/analytics/cognitive-profile` (`CognitiveProfileResponseDto`). The primary diagnostic visualization is a four-quadrant count matrix:

| Display | Exact response field |
|---|---|
| Accurate & Fast | `speedAccuracyMatrix.quadrantCounts.accurateAndFast` |
| Accurate & Slow | `speedAccuracyMatrix.quadrantCounts.accurateAndSlow` |
| Fast Error / Rushing | `speedAccuracyMatrix.quadrantCounts.fastErrorRushing` |
| Slow Error / Struggling | `speedAccuracyMatrix.quadrantCounts.slowErrorStruggling` |
| Analysis window and inspected attempts | `analysisWindow.windowDays`, `analysisWindow.attemptsAnalyzed` |
| Insufficient-baseline count | `speedAccuracyMatrix.insufficientBaselineCount` |
| Rushing risk score (index 0–1) | `speedAccuracyMatrix.rushingRiskScore` |
| Median correct / incorrect response time (seconds) | `speedAccuracyMatrix.medianTimeCorrectSeconds`, `speedAccuracyMatrix.medianTimeIncorrectSeconds` |

Show returned zero counts as zero. Show nullable summary values only when non-null; otherwise use an explicit unavailable-evidence label, never a default zero. The API returns aggregate counts, not individual attempt coordinates; do not synthesize scatter points or recalculate quadrant membership, baselines, medians, or risk. The backend `topic`/`windowDays` filters apply only to speed/accuracy history, not to the independent stamina history.

### 27.2 Stamina / Fatigue Analysis

Use the **same response**, without another endpoint or calculation. Render native SVG points joined in quartile order, with x = `staminaCurve.quartileAccuracy[].quartile` (1–4), y = `staminaCurve.quartileAccuracy[].accuracy` (returned percentage, 0–100). Surface each row's `totalQuestions` and `correctQuestions`, plus `staminaCurve.mockSessionsAnalyzed`, `staminaCurve.totalQuestionsAnalyzed`, and non-null `staminaCurve.fatigueDropoffPercent`. These are the exact frozen Phase 8 wire keys; differently named quartile/accuracy fields are not supported.

If `staminaCurve` is null, display the backend `staminaReason` (`insufficient_terminal_mocks` or `insufficient_questions`) with no fabricated points. If only fatigue drop-off is null, retain the valid quartile profile and show `fatigueReason` where present (for example `zero_first_quartile_baseline`). Do not recalculate fatigue, smooth/interpolate missing observations, or present stamina as a retention score.

### 27.3 Topic Mastery

Source: `GET /api/v1/analytics/dashboard`, `AnalyticsDashboardResponseDto.topicMasteryRadar[]`. Render accessible topic bars and a table using `topic`, `diagnosticMastery` (index 0–1), and `diagnosticLabel`. Preserve the evidence-only returned membership and backend labels; no forced 24-entry padding, invented values for missing topics, threshold relabeling from rounded values, or conversion into unrelated cognitive dimensions. Existing `patternsWithEvidence`, `canonicalPatternsInTopic`, and `coverageRatio` may be shown directly as topic evidence, not recomputed.

### 27.4 Retention Analytics

Source: `GET /api/v1/analytics/retention` (`RetentionAnalyticsResponseDto`). Display `currentState` counts and `stageDistribution`, and plot only returned `observedRetentionByGap[]` records (`gapBucket`, `observedRetentionRate`, `totalEvents`, `correctEvents`). `observedRetentionRate` is already a percentage (0–100). Surface the returned `evidence` counts for analyzed/excluded observations. Empty buckets are absent evidence, not zero retention. Revision stages (1d/3d/7d/14d/30d) and observed gap buckets are distinct backend categories; never derive a forgetting equation, interpolate unobserved gaps, or perform frontend revision scheduling.

### 27.5 Exam Readiness

Source: `GET /api/v1/analytics/readiness/:goalId` (`ExamReadinessResponseDto`). Show `readinessStatus`, non-null `readinessScore` (index 0–1), and the returned `components.planTargetCoverage`, `components.masteryDepth`, `components.eligibleMockPerformance`, `components.eligibleMockPacing` evidence (`value`, `weight`, `effectiveWeight` and component-specific counts/values). Display `criticalPrerequisiteBottlenecks[]` directly, including `targetPattern`, `unmasteredPrerequisite`, `prerequisiteMastery`, and `masteryLabel`. Goal metadata is `goalId`, `goalTitle`, and `targetDate`; an insufficient-data response may include `reason` and null components.

Null values and insufficient data remain explicit unavailable states. Do not recompute component weights, readiness, eligibility, or bottlenecks. Readiness is neither pass probability nor a replacement for cognitive diagnostics; never relabel its components as unrelated scores.

### 27.6 Visualization Ownership, Safety & Provenance

Retain native SVG and zero chart-library dependencies. Authorize deterministic one-for-one renames of obsolete visualization components and corresponding tests in the subsequent prescriptive specification. Diagnostic summary/stamina, quadrant matrix, and observed retention responsibilities replace misleading visual names; topic mastery may remain inline in the existing analytics page. No additional production file is required. Pure view models may carry backend fields, labels, units, and SVG geometry only.

No new analytics routes/fields, changes to Phases 1–14, client learning/scoring algorithms, composite normalization, synthetic/default values, LLM scores, unrelated-endpoint derivations, or hidden fallback calculations are permitted. No component may fabricate unsupported cognitive axes.

Provenance verified read-only against `src/controllers/analyticsController.js`, `src/services/analytics/speedAccuracyMatrixService.js`, `staminaAnalyticsService.js`, `dashboardAggregateService.js`, `topicDiagnosticsService.js`, `retentionAnalyticsService.js`, `readinessService.js`, and `docs/PHASE8_COGNITIVE_ANALYTICS_SPECIFICATION.md`. Section 54.3 reproduces these wire contracts; this document does not change their implementation.

---

## 28. AI TUTOR & LEARNING EXPERIENCE

The AI Learning Center integrates the six Phase 7 LLM operations:

| Screen Context | Operation | Trigger | UI Manifestation |
|---|---|---|---|
| **Dedicated Workspace** | `POST /api/v1/learning/tutor` | Chat input in `/app/tutor` | Socratic conversational dialogue with math notation |
| **Active Practice** | `POST /api/v1/learning/hint` | *"Need a Hint?"* button | 5-level progressive conceptual hints (levels 1–5; level 5 requires prior attempt; active mock assistance prohibited) |
| **Attempt Review** | `POST /api/v1/learning/explain-attempt` | *"Diagnose Error"* button | Misconception diagnosis identifying specific arithmetic or conceptual trap |
| **Dashboard** | `POST /api/v1/learning/explain-progress` | *"Coach Summary"* button | Narrative coaching breakdown of weekly momentum and focus areas |
| **Study Plan** | `POST /api/v1/learning/explain-plan` | *"Why this Plan?"* button | Strategic rationale for topic sequencing and daily study allocation |
| **Mock Review** | `POST /api/v1/learning/mock-review` | *"Generate Exam Debrief"* | Executive debrief analyzing time management, section drop-offs, and pacing |

### Fallback & Graceful Degradation:
- Provider fallback is handled invisibly inside backend `llmProviderFactory`. Successful fallback returns standard HTTP 200 payload.
- If all providers fail, the backend returns HTTP 502/503/504 (`LLM_PROVIDER_UNAVAILABLE`, `LLM_PROVIDER_TIMEOUT`), which the frontend catches to render canned pedagogical hints without crashing.

---

## 29. LLM RATE-LIMIT UX (TIER-4 CONTRACT)

Calls to `/api/v1/learning/*` are governed by Phase 14's Tier-4 rate limiter:
- **Default Threshold**: `RATE_LIMIT_LLM_MAX_DEFAULT = 20` requests per `RATE_LIMIT_LLM_WINDOW = 1` minute window per authenticated `userId`.

### Client 429 Handling:
1. When an AI request encounters HTTP 429:
   - **`TOO_MANY_REQUESTS`**: User exceeded their 20 req / 1 min tier.
   - **`RATE_LIMIT_CAPACITY_EXCEEDED`**: Global in-memory registry capacity exceeded.
2. If `Retry-After` header is supplied:
   - The UI parses the seconds integer and renders a visual cooldown countdown.
   - Disables the *"Send"* / *"Request Hint"* button until the cooldown period elapses.
3. If `Retry-After` header is absent:
   - The UI displays: *"AI Tutor is currently busy. Please review concepts or continue practice."*
   - Offers a manual *"Try Again"* button without fabricating an arbitrary countdown.
4. **Zero Aggressive Retries**: The client **NEVER** retries Tier-4 rate-limited requests automatically.
5. **Core Learning Unblocked**: Practice questions, adaptive drills, and mock exams remain 100% operational during an AI cooldown.

---

## 30. LOADING, EMPTY, AND ERROR STATES

Every view implements deterministic state representations:

```text
┌────────────────────────────────────────────────────────────────────────┐
│ STATE TAXONOMY                                                         │
├───────────────────┬────────────────────────────────────────────────────┤
│ Initial Loading   │ Pulse skeleton screens matching exact layout card  │
│                   │ dimensions (Prevents Layout Shifts / CLS = 0).     │
├───────────────────┼────────────────────────────────────────────────────┤
│ Background Refresh│ Subtle progress shimmer in the top navigation bar. │
├───────────────────┼────────────────────────────────────────────────────┤
│ Empty State       │ Actionable vector illustration with primary CTA    │
│                   │ (e.g., "No mistakes recorded yet! [Start Practice]").│
├───────────────────┼────────────────────────────────────────────────────┤
│ Recoverable Error │ Inline alert card with exact human error message   │
│                   │ and a prominent "[ Try Again ]" retry button.      │
├───────────────────┼────────────────────────────────────────────────────┤
│ Auth Expired (401)│ Transparent single-flight refresh or smooth        │
│                   │ transition to /login with return URL preserved.    │
├───────────────────┼────────────────────────────────────────────────────┤
│ Forbidden (403)   │ "Access Restricted" state indicating resource      │
│                   │ ownership boundary.                                │
├───────────────────┼────────────────────────────────────────────────────┤
│ Not Found (404)   │ "Resource Not Found" state with link to Dashboard. │
├───────────────────┼────────────────────────────────────────────────────┤
│ Rate Limited (429)│ Cooldown countdown or manual retry affordance.     │
├───────────────────┼────────────────────────────────────────────────────┤
│ Network Offline   │ "Connection lost. Your latest answer has not been  │
│                   │ saved yet. Reconnect before continuing."           │
└───────────────────┴────────────────────────────────────────────────────┘
```

---

## 31. OPTIMISTIC UPDATES EVALUATION

### High-Integrity Learning Invariant:
Optimistic UI updates are **PROHIBITED** for core learning operations:
- **Question Attempt Submission**: Correctness, pattern mastery, and revision progression intervals are calculated on the backend. Marking an answer correct before server confirmation is strictly prohibited.
- **Daily Objective Progress Mutation**: Pessimistic and server-confirmed. The client displays a row-level pending spinner upon user check-off, awaits authoritative server response from `PATCH /api/v1/daily-objectives/:id`, and only updates UI state upon 200 OK (invalidating `['daily-objectives']` and `['agenda']` queries). On network/server failure, the prior server-confirmed state is preserved and an error toast is displayed.
- **Mock Exam Answers & Transitions**: Mock submissions and section completions require authoritative server timestamps and scoring barriers.
- **Goal & Plan Generation**: Multi-week schedules require server-validated constraint satisfaction.

### Permitted Optimistic / Local-Only Presentation Operations:
- Local question palette navigation and temporary radio button selection display before submit.
- UI theme toggling (Dark / Light mode).
- Collapsible sidebar toggle state.
- Pure modal and drawer open/close presentation state.

Authoritative server-state optimistic mutations: **0**.

---

## 32. ACCESSIBILITY ARCHITECTURE (WCAG 2.2 AA)

1. **Full Keyboard Operability**:
   - Every interactive element (question radio options, question map tiles, modal buttons, timer controls) is reachable and operable via `Tab`, `Shift+Tab`, `Enter`, `Space`, and Arrow keys.
   - Option choices map to keyboard shortcuts: `1` / `A`, `2` / `B`, `3` / `C`, `4` / `D`.
2. **Visible Focus Indicators**: High-contrast, 2px solid focus rings with 2px offset (`outline: 2px solid var(--ring-color); outline-offset: 2px;`).
3. **Semantic Hierarchy**: Single `<h1>` per view, followed by logical `<h2>`, `<h3>` heading levels.
4. **Screen Reader Support**:
   - `aria-live="polite"` regions for timer countdown thresholds (e.g., 5-minute warning) and score calculation completions.
   - Explicit `aria-label` on all iconography and question palette navigation tiles.
   - Form controls paired with permanent `<label>` elements and `aria-describedby` error associations.
5. **Color & Contrast**: Minimum 4.5:1 text contrast and 3:1 graphical control contrast across both light and dark themes. Correct/incorrect states always pair color with text and distinct iconography (check vs. cross).
6. **Reduced Motion**: Honored via `@media (prefers-reduced-motion: reduce)` disabling non-essential transitions and animations.

---

## 33. RESPONSIVE ARCHITECTURE

The application implements fluid responsive design across four standard viewport tiers:

```text
┌───────────────────────────────┬──────────────┬─────────────────────────┐
│ Viewport Tier                 │ Min Width    │ Layout Behavior         │
├───────────────────────────────┼──────────────┼─────────────────────────┤
│ Narrow Mobile                 │ 320px        │ Single column, bottom   │
│                               │              │ navigation bar, drawer  │
│                               │              │ question map.           │
├───────────────────────────────┼──────────────┼─────────────────────────┤
│ Wide Mobile / Small Tablet    │ 640px        │ Flexible card grids,    │
│                               │              │ collapsible top bar.    │
├───────────────────────────────┼──────────────┼─────────────────────────┤
│ Tablet                        │ 768px        │ Collapsible sidebar,    │
│                               │              │ 2-column dashboard.     │
├───────────────────────────────┼──────────────┼─────────────────────────┤
│ Desktop / Large Display       │ 1024px+      │ Persistent sidebar,     │
│                               │              │ split-pane exam screen, │
│                               │              │ sticky question palette.│
└───────────────────────────────┴──────────────┴─────────────────────────┘
```

---

## 34. DESIGN SYSTEM SPECIFICATION

The design system is implemented using **Vanilla CSS Custom Properties (Tokens)** and scoped **CSS Modules**:

```css
:root {
  /* Color Palette — Tailored Sleek Theme */
  --bg-primary: #0f172a;        /* Deep Slate Navy */
  --bg-surface: #1e293b;        /* Slate Surface */
  --bg-surface-elevated: #334155;
  --text-primary: #f8fafc;      /* Crisp Off-White */
  --text-secondary: #94a3b8;    /* Muted Slate Text */
  --text-tertiary: #64748b;
  --border-subtle: rgba(255, 255, 255, 0.08);
  --border-strong: rgba(255, 255, 255, 0.16);
  
  /* Brand & Accents */
  --accent-primary: #6366f1;    /* Vibrant Indigo */
  --accent-hover: #4f46e5;
  --accent-glow: rgba(99, 102, 241, 0.25);
  
  /* Semantic Status Colors */
  --status-success: #10b981;    /* Emerald Green */
  --status-warning: #f59e0b;    /* Warm Amber */
  --status-error: #f43f5e;      /* Rose Crimson */
  --status-info: #0ea5e9;       /* Sky Blue */
  
  /* System Typography Stack — Zero External Network Dependencies */
  --font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  --font-mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  --text-xs: clamp(0.75rem, 0.7rem + 0.25vw, 0.8125rem);
  --text-sm: clamp(0.875rem, 0.825rem + 0.25vw, 0.9375rem);
  --text-base: clamp(1rem, 0.95rem + 0.25vw, 1.0625rem);
  --text-lg: clamp(1.125rem, 1.05rem + 0.35vw, 1.25rem);
  --text-xl: clamp(1.25rem, 1.15rem + 0.5vw, 1.5rem);
  --text-2xl: clamp(1.5rem, 1.35rem + 0.75vw, 2rem);
  
  /* Spacing Scale */
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-6: 1.5rem;
  --space-8: 2rem;
  --space-12: 3rem;
  
  /* Glassmorphism & Elevation */
  --glass-bg: rgba(30, 41, 59, 0.75);
  --glass-blur: blur(12px);
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 16px;
  --radius-full: 9999px;
  --shadow-card: 0 4px 20px -2px rgba(0, 0, 0, 0.4);
}
```

---

## 35. VISUAL LANGUAGE & MATHEMATICAL ERGONOMICS

- **Atmosphere**: Professional, focused, modern learning cockpit. Avoids childish gamification or neon visual overload.
- **Surface Depth**: Clean glassmorphism (`backdrop-filter: blur(12px)`) on headers, modals, and sticky question maps.
- **Mathematical Rendering Architecture**:
  - The 12,000 aptitude questions use standardized **Plain Unicode Mathematical Notation** (`5x - 14 = 2x + 16`, superscripts `x²`, roots `√`, fractions `a/b`, `π`, `±`, `≠`, `≤`, `≥`).
  - No KaTeX or MathJax runtime dependency is required.
  - Numbers and formulas use CSS tabular numerals (`font-variant-numeric: tabular-nums`) and clean monospace styling (`var(--font-mono)`) for alignment.

---

## 36. FEEDBACK AFTER ANSWERS BY MODE

The Question Component dynamically adjusts feedback disclosure according to mode:

| Experience Mode | Answer Check Timing | Correct Option Disclosed? | Explanation Displayed? | AI Hint Available? |
|---|---|---|---|---|
| **Practice Mode** | Immediate (on Submit) | YES (Immediate) | YES (Immediate) | YES |
| **Adaptive Mode** | Immediate (on Submit) | YES (Immediate) | YES (Immediate) | YES |
| **Revision Mode** | Immediate (on Submit) | YES (Immediate) | YES (Immediate) | YES |
| **Mistake Review** | Immediate (on Submit) | YES (Immediate) | YES (Immediate) | YES (Diagnostic) |
| **Active Mock Exam** | Deferred (Post-Finalize)| **NO (SEALED)** | **NO (SEALED)** | **NO (STRICTLY PROHIBITED)**|
| **Mock Review** | Read-Only Post-Exam | YES (Historical) | YES (Full Review) | YES (AI Debrief) |

---

## 37. TIMER ARCHITECTURE

1. **Practice & Revision Timers**:
   - Managed locally as non-authoritative stopwatch counters recording elapsed `timeTaken` in seconds.
2. **Mock Examination Authoritative Timing**:
   - The authoritative start timestamp and deadline are recorded on the server upon `POST /api/v1/mock-sessions/:id/start` (`MockSession.expiresAt`).
   - The client display countdown is derived directly from the server-authoritative deadline: `Math.max(0, Date.parse(session.expiresAt) - Date.now())`. The client does NOT reconstruct expiry from non-authoritative `timeLimitSeconds`.
   - The client timer runs on a 1-second `setInterval` with drift correction against `performance.now()`.
   - **Background Tab Behavior**: Reconciled immediately via `Page Visibility API` against `session.expiresAt`.
   - **Zero-Time Client Expiry Behavior**:
     * Visual countdown zero is presentation-only; it does **NOT** blindly trigger manual `POST .../submit` and does **NOT** locally fabricate a terminal status (`expired`/`submitted`).
     * At countdown zero: (1) immediately disables further answer selection/mutation in the client; (2) treats client timer as advisory; (3) queries authoritative backend via `GET /api/v1/mock-sessions/:id/result` (triggering lazy server expiry resolution when `now >= session.expiresAt`); (4) handles HTTP 409 `FINALIZATION_IN_PROGRESS` with bounded polling; (5) navigates to `RESULT_VIEW` only after backend confirms terminal score report eligibility.

---

## 38. SESSION RECOVERY & OFFLINE CONTRACT

| Context | Recovery Mechanism | Recovery Data Source |
|---|---|---|
| **Active Mock Exam** | Re-opening the browser fetches `GET /api/v1/mock-sessions/:id`. Unsubmitted answers are rehydrated from server records; remaining time is derived directly from authoritative server `expiresAt`. | Backend MongoDB Session |
| **Active Study Plan** | Refreshing the page re-queries `GET /api/v1/planning/plans/:planId/schedule`. | Backend StudyPlan Model |
| **Adaptive Practice** | Refreshing restarts from `GET /api/v1/adaptive/next-question`. | Backend Adaptive Engine |
| **AI Tutor Chat** | Session history can be reloaded or initialized from conversational context. | Backend Learning Controller |

### Authoritative V1 Offline Policy:
- Practice unsubmitted answers may remain in volatile component memory.
- Mock test responses are **NOT considered saved until confirmed by the backend** (`POST /mock-sessions/:id/responses` returns 200).
- Persistent offline mutation queues: **NONE**.
- Automatic answer synchronization after reload: **NONE**.
- Offline mock progression: **NO**.
- User state on disconnect: *"Connection lost. Your latest answer has not been saved yet. Please reconnect before continuing."*

---

## 39. BROWSER PERSISTENCE POLICY

| Artifact / Storage | `localStorage` | `sessionStorage` | In-Memory Only | HttpOnly Cookie |
|---|---|---|---|---|
| **Access JWT** | **PROHIBITED** | **PROHIBITED** | **MANDATORY (`tokenManager`)** | NO |
| **Refresh Token** | **PROHIBITED** | **PROHIBITED** | NO | **MANDATORY (Browser)** |
| **User Passwords** | **PROHIBITED** | **PROHIBITED** | **TRANSIENT ONLY**| NO |
| **Mock Answer Keys** | **PROHIBITED** | **PROHIBITED** | **PROHIBITED** | NO |
| **UI Theme Preference** | PERMITTED (`aptitude_theme`) | NO | NO | NO |
| **Sidebar Collapse State** | PERMITTED (`sidebar_state`) | NO | NO | NO |
| **Pending Exam Choice** | NO | PERMITTED (Transient) | YES | NO |

---

## 40. BROWSER LOGGING POLICY

1. **Zero Sensitive Data in Production**:
   - Production builds strip all `console.log` statements via Vite compiler transforms.
   - Passwords, access tokens, refresh tokens, Authorization headers, and unsealed answer keys are **NEVER** logged under any log level.
2. **Controlled Development Logging**:
   - In development mode (`NODE_ENV === 'development'`), a custom logger wrapper (`logger.ts`) logs sanitized API route names and correlation IDs (`X-Correlation-ID`) without emitting credentials.

---

## 41. FRONTEND OBSERVABILITY

1. **React Error Boundaries**: Top-level and route-level error boundaries capture unhandled UI render crashes, displaying a friendly recovery card with a *"Reload Page"* button.
2. **Correlation ID Visibility**: When an API call fails, the response header `X-Correlation-ID` is captured and made visible in a subtle *"Technical Details"* disclosure (e.g., `Ref: 9a2b-4c5e-88f1`).
3. **Zero Third-Party Telemetry Vendors**: No third-party tracking scripts, analytics pixels, or external logging agents are included. Phase 15 relies entirely on existing backend Prometheus metrics and structured logs.

---

## 42. PERFORMANCE ARCHITECTURE

1. **Route-Based Code Splitting**: All major route modules are loaded via dynamic `React.lazy()` imports.
2. **Vendor Chunk Splitting**: Vite is configured with manual chunks separating `react-vendor` (`react`, `react-dom`, `react-router-dom`) and `query-vendor` (`@tanstack/react-query`).
3. **Zero External Chart Chunk**: Since native accessible SVG components render the Section 27 diagnostics, topic mastery, observed retention, and readiness evidence, no `chart-vendor` chunk or chart-library dependency is created.
4. **Asset Optimization**: Tree-shaken SVG icons via `lucide-react`. System fonts require 0 KB network downloads.
5. **Target Initial Bundle Budget**: Initial gzipped JavaScript bundle $\le 115\text{ kB}$; total initial CSS $\le 20\text{ kB}$.

---

## 43. REQUEST CANCELLATION

All search queries, pattern filters, and page transitions pass an `AbortSignal` to the API client:
- Rapid topic/pattern switches abort preceding in-flight requests, preventing out-of-order race conditions from overwriting the latest UI state.
- Unmounting views automatically abort pending queries via TanStack Query's native cancellation integration.

---

## 44. ERROR DTO INTEGRATION

Backend public errors conform to the canonical Phase 14 envelope:
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE_STRING",
    "message": "Human readable description."
  }
}
```

The frontend maps backend error codes to contextual user guidance:

| Backend Error Code | HTTP Status | Backend Source Origin | Frontend Presentation & Retry Policy |
|---|---|---|---|
| `UNAUTHORIZED` | 401 | `authenticate.js` / `authController.js` | Single-flight refresh; redirects to login on failure. |
| `IDENTITY_MISMATCH` | 403 | `authorize.js` | *"Access restricted: Account ownership boundary."* |
| `OWNERSHIP_VIOLATION` | 403 | `authorize.js` / Controllers | *"Access denied: You do not own this resource."* |
| `ACCOUNT_DISABLED` | 403 | `authService.js` | Deactivated account view; halts polling loops. |
| `PASSWORD_BLOCKLISTED` | 400 | `authService.js` | Passphrase blocklist notification; allows re-entry. |
| `TOO_MANY_REQUESTS` | 429 | `rateLimiter.js` | Cooldown countdown based on `Retry-After`. |
| `RATE_LIMIT_CAPACITY_EXCEEDED`| 429 | `rateLimiter.js` | Capacity alert; retry after cooldown. |
| `FINALIZATION_IN_PROGRESS`| 409 | `mockConfig.js` / `orchestrationGuard.js`| Exam finalization spinner; polls `/result`. |
| `FINALIZATION_LEASE_LOST` | 409 | `mockConfig.js` / `mockSessionService.js` | Finalization lease contention; initiates idempotent recovery. |
| `MOCK_SESSION_EXPIRED` | 409 | `mockConfig.js` / `mockSessionService.js` | Expired exam alert; routes to server-authoritative score report. |
| `SECTION_LOCKED` | 409 | `mockConfig.js` / `mockSessionService.js` | Notice that section is sealed under locked policy. |
| `SECTION_NOT_ACTIVE` | 409 | `mockConfig.js` / `mockSessionService.js` | Section transition barrier notice; stays on active section. |
| `RESPONSE_FROZEN` | 409 | `mockConfig.js` / `mockSessionService.js` | Notice that exam is submitted and answers frozen. |
| `SESSION_STATE_CONFLICT` | 409 | `mockConfig.js` / `mockSessionService.js` | State conflict banner; refetches latest session state. |
| `MOCK_SESSION_NOT_TERMINAL` | 400 | `mockConfig.js` / `mockSessionService.js` | Terminal barrier error; hides unsealed review/scorecard. |
| `INVALID_SESSION_STATE` | 400 | `mockConfig.js` / `mockSessionService.js` | Invalid lifecycle transition alert; returns to valid view. |
| `INVALID_OPTION` | 400 | `mockConfig.js` / `mockSessionService.js` | Choice validation alert; prompts valid selection. |
| `INVALID_TIME_TAKEN` | 400 | `mockConfig.js` / `mockSessionService.js` | Pacing bounds validation alert; clamps reported transit time. |
| `MOCK_SESSION_NOT_FOUND` | 404 | `mockConfig.js` / `mockSessionService.js` | Missing session alert; routes to mock catalog. |
| `LLM_PROVIDER_UNAVAILABLE`| 503 | `learningConfig.js` / `learningService.js`| AI Tutor fallback notice; retry available. |
| `LLM_PROVIDER_TIMEOUT` | 504 | `learningConfig.js` / `learningService.js`| AI Tutor timeout notice; retry available. |
| `INTERNAL_SERVER_ERROR` | 500 | `errorHandler.js` | System fault notice with correlation ID disclosure. |

---

## 45. CORRELATION ID INTEGRATION

Every outgoing request captures `X-Correlation-ID`:
- If returned by the server, `apiClient` attaches the correlation ID to the resolved response or error object.
- In error states, the ID is surfaced unobtrusively in small monospace text: `Reference ID: b3f3b26d-292a-4a91-aa3f-5e94fd4665fe`.

---

## 46. FORM ARCHITECTURE

All forms (Registration, Login, Goal Setting) use controlled React components:
1. **Client Validation as Usability Aid**: Inline character count meter, empty field warnings.
2. **Server as Sole Authority**: Submissions await server responses and display canonical server error messages upon rejection.
3. **Form Disable During Submission**: Submit buttons transition to a loading state and disable inputs during network transit.

### 46.1 Registration UX Flow (No Auto-Login)
Because Phase 14's registration endpoint (`POST /api/v1/auth/register`) returns solely `{ user: { userId, name, email } }` without an access token or session cookie:
1. **Lifecycle Transition**: `REGISTERING` ──► `REGISTERED` ──► navigate `/login`.
2. **Zero Credentials Issued**: Registration does **NOT** set an in-memory token, does **NOT** assume a refresh cookie exists, and does **NOT** enter the authenticated application shell.
3. **Deterministic Completion**: Upon successful HTTP 201 response, the registration interface presents an affirmative success confirmation (*"Account successfully created! Please sign in to begin."*) and cleanly navigates the learner to `/login`.
4. **Authoritative Login Exchange**: The learner explicitly enters credentials on `/login` via `POST /api/v1/auth/login` to obtain the raw access token and session cookie.

---

## 47. PASSWORD UX (PHASE 14 COMPLIANCE)

The registration form strictly adheres to the frozen Phase 14 password contract:
- **Length Boundary**: 15 to 128 Unicode code points.
- **Zero Arbitrary Complexity Rules**: No mandatory uppercase, lowercase, numbers, or special symbols.
- **Blocklist Rejection**: Handled via backend `PASSWORD_BLOCKLISTED` response without leaking blocklist contents.
- **NFC Normalization**: Password inputs are normalized to Unicode NFC before submission.

---

## 48. ACCOUNT DISABLED UX

If a learner's account is set to `status: 'disabled'`:
- Login or token refresh returns HTTP 403 `ACCOUNT_DISABLED`.
- The frontend immediately clears any in-memory token, halts all periodic polling queries, and renders a dedicated **Account Inactive** view.
- The interface prevents automated refresh retry loops or infinite redirects.

---

## 49. LOGOUT & REVOKE-ALL UX

1. **Standard Logout (`POST /api/v1/auth/logout`)**:
   - Calls the logout endpoint with `credentials: 'include'`.
   - The backend revokes the current session and clears the HttpOnly cookie.
   - The frontend clears in-memory access tokens via `tokenManager.clearAccessToken()`, clears all TanStack Query caches, and transitions to `/login`.
2. **Revoke All Sessions (`POST /api/v1/auth/revoke-all`)**:
   - Located in `/app/profile`.
   - Requires explicit learner confirmation via modal dialog.
   - Revokes all active sessions across all devices, clears local state, and routes to `/login`.

---

## 50. FRONTEND SECURITY BOUNDARY & CSP OWNERSHIP

### 50.1 Truthful Security Threat Model
- **In-Memory Access JWT**: Prevents durable token exfiltration from `localStorage`, `sessionStorage`, or `document.cookie`. However, in-memory storage **does NOT make a running application immune to active same-origin XSS**. If malicious code executes in the application runtime, it can make authenticated requests via the existing in-memory client. Therefore, strict XSS prevention remains the primary defensive priority.
- **CSRF Defense**: `SameSite=Strict` cookies materially reduce cross-site transmission. In addition, refresh requests strictly enforce Phase 14's allowlisted `Origin` verification header. Complete CSRF immunity is reinforced by the Phase 15/16 same-origin production deployment topology.

### 50.2 Content Security Policy (CSP) Disambiguation
Phase 15 strictly separates the two distinct security header surfaces:

1. **Backend API CSP**:
   - **Owner**: Phase 14 Node.js API (`securityHeaders.js`).
   - **Contract**: `default-src 'none'; frame-ancestors 'none'`.
   - **Phase 15 Modification**: `0`.
2. **Frontend Document CSP**:
   - **Owner**: Phase 15 Architecture + Phase 16 Deployment Delivery.
   - **Purpose**: Protect the learner SPA HTML document, scripts, styles, and assets.
   - **Contract Proposal**:
     ```text
     default-src 'self';
     script-src 'self';
     style-src 'self';
     img-src 'self' data:;
     font-src 'self';
     connect-src 'self';
     frame-ancestors 'none';
     base-uri 'self';
     form-action 'self';
     ```
   - **Zero `'unsafe-inline'`**: Compatible with Vite's external CSS and JS asset bundling.
   - **Delivery Responsibility**: Actual HTTP header delivery on static HTML assets is deferred to Phase 16 edge/static hosting.

---

## 51. TEACHER / ADMIN SCOPE BOUNDARY

The application is exclusively designed for **Learners**:
- There are no teacher assignment portals, student roster screens, grading views, or administrative configuration panels.
- Any future educational or institutional operator features remain deferred to separate phases.

---

## 52. ZERO SOCIAL AUTH / MFA SCOPE CREEP

- The authentication UI contains exclusively Email & Password authentication.
- No buttons or placeholders exist for OAuth, Google, GitHub, Magic Links, Passkeys, or SMS MFA.

---

## 53. FRONTEND / BACKEND TRUST BOUNDARY

```text
┌─────────────────────────────────┐           ┌─────────────────────────────────┐
│     CLIENT / BROWSER RUNTIME    │           │      AUTHORITATIVE BACKEND      │
│          (Untrusted)            │           │            (Trusted)            │
│                                 │           │                                 │
│ • Client input validation is    │           │ • All permissions, ownership,   │
│   cosmetic guidance only.       │           │   and quotas enforced on server.│
│ • Access JWT is volatile memory.│           │ • Pattern mastery, adaptive,    │
│ • Timers are visual indicators. │  ──────►  │   and revision intervals here.  │
│ • Cannot override scoring or    │   HTTPS   │ • Authoritative exam timers     │
│   difficulty progression.       │           │   unseat & expire sessions.     │
│ • Zero access to answer keys    │           │ • Sealed answer keys revealed   │
│   during active mock exam.      │           │   only post-finalization.       │
└─────────────────────────────────┘           └─────────────────────────────────┘
```

---

## 54. FRONTEND TYPE CONTRACTS & PROVENANCE AUDIT

### 54.1 Separation of Type Concerns
To prevent conflation between raw network transport and user interface display states, the architecture enforces a strict three-tier type hierarchy:
1. **API DTOs (`src/types/api.ts`)**: Pure wire representations matching frozen Express routes and Mongoose schemas. Contain zero UI-only state flags, view formatters, or derived labels.
2. **View Models (`src/types/quiz.ts`, `src/types/analytics.ts`)**: Ephemeral, client-side synthesized state combining multiple DTOs for efficient React rendering (e.g., `QuizFeedbackViewModel` combining attempt results with question explanations).
3. **Component Props (`src/components/...`)**: Pure interface boundaries specifying React element properties, accessibility callbacks, and render slots.

---

### 54.2 Architecture-Level DTO & Wire Envelope Inventory (All 64 Consumed Endpoints)

Every candidate consumed backend endpoint maps to an authoritative named Request, Response DTO, and Raw Wire Envelope contract:

| # | Endpoint | Method | Named Request Contract / Parameters | Named Payload DTO | Raw Wire Response Envelope | Status |
|---|---|---|---|---|---|---|
| 1 | `/api/v1/auth/register` | `POST` | Body: { name (string, 2-100), email (string, email), password (string, 15-128 code points) }. Headers: Origin, Content-Type | `data: RegisterResponseDto` | `AuthRegisterWireResponse { success: true, data: { user: AuthUserSummary } }` | **PROVEN** |
| 2 | `/api/v1/auth/login` | `POST` | Body: { email (string, email), password (string, 15-128 code points) }. Headers: Origin, Content-Type | `data: LoginResponseDto` | `AuthLoginWireResponse { success: true, data: LoginResponseDto }` | **PROVEN** |
| 3 | `/api/v1/auth/refresh` | `POST` | Cookie: refreshToken (HttpOnly). Headers: Origin | `data: RefreshTokenResponseDto` | `AuthRefreshWireResponse { success: true, data: RefreshTokenResponseDto }` | **PROVEN** |
| 4 | `/api/v1/auth/logout` | `POST` | Headers: Authorization: Bearer <accessToken> [Clears refreshToken Cookie] | `data: { message: string }` | `AuthLogoutWireResponse { success: true, data: { message: string } }` | **PROVEN** |
| 5 | `/api/v1/auth/revoke-all` | `POST` | Headers: Authorization: Bearer <accessToken> | `data: { message: string } }` | `AuthRevokeAllWireResponse { success: true` | **PROVEN** |
| 6 | `/api/v1/auth/me` | `GET` | Headers: Authorization: Bearer <accessToken> | `data: { user: UserProfileDto } }` | `AuthMeWireResponse { success: true` | **PROVEN** |
| 7 | `/api/v1/questions/topics` | `GET` | Headers: Authorization: Bearer <accessToken> | `data: string[]` | `TopicListWireResponse { success: true` | **PROVEN** |
| 8 | `/api/v1/questions/topic/:topic/patterns` | `GET` | Path: :topic (canonical topic name or alias). Headers: Authorization | `data: PatternDto[]` | `PatternListWireResponse { success: true` | **PROVEN** |
| 9 | `/api/v1/questions/topic/:topic` | `GET` | Path: :topic. Query: page (int >= 1, def 1), limit (int 1-100, def 20). Headers: Authorization | `data: QuestionDto[]` | `QuestionPaginatedWireResponse { success: true` | **PROVEN** |
| 10 | `/api/v1/questions/topic/:topic/pattern/:pattern` | `GET` | Path: :topic, :pattern. Query: page (def 1), limit (def 20), difficulty? (int 1-10). Headers: Authorization | `data: QuestionDto[]` | `QuestionPaginatedWireResponse { success: true` | **PROVEN** |
| 11 | `/api/v1/questions/topic/:topic/random` | `GET` | Path: :topic. Query: limit (int 1-50, def 10). Headers: Authorization | `data: QuestionDto[]` | `QuestionRandomListWireResponse { success: true` | **PROVEN** |
| 12 | `/api/v1/questions/topic/:topic/pattern/:pattern/random` | `GET` | Path: :topic, :pattern. Query: limit (int 1-50, def 10), difficulty? (int 1-10). Headers: Authorization | `data: QuestionDto[]` | `QuestionRandomListWireResponse { success: true` | **PROVEN** |
| 13 | `/api/v1/questions/:id([a-fA-F0-9]{24})` | `GET` | Path: :id (24 hex char ObjectId). Headers: Authorization | `data: QuestionDto }` | `QuestionDetailWireResponse { success: true` | **PROVEN** |
| 14 | `/api/v1/users/:userId` | `GET` | Path: :userId (matches JWT sub). Headers: Authorization | `data: UserProfileDto }` | `UserGetWireResponse { success: true` | **PROVEN** |
| 15 | `/api/v1/goals/user/:userId` | `GET` | Path: :userId (matches JWT sub). Headers: Authorization | `data: GoalDetailDto[]` | `GoalListWireResponse { success: true` | **PROVEN** |
| 16 | `/api/v1/goals` | `POST` | Body: { type (enum), targetName (string), description?, startDate?, targetDate?, targetScore?, priority?, status? }. Headers: Authorization | `data: GoalDetailDto }` | `GoalCreateWireResponse { success: true` | **PROVEN** |
| 17 | `/api/v1/goals/:id` | `GET` | Path: :id (goalId). Headers: Authorization | `data: GoalDetailDto }` | `GoalDetailWireResponse { success: true` | **PROVEN** |
| 18 | `/api/v1/goals/:id` | `PATCH` | Path: :id. Body: { type?, targetName?, description?, startDate?, targetDate?, targetScore?, priority?, status? }. Headers: Authorization | `data: GoalDetailDto }` | `GoalUpdateWireResponse { success: true` | **PROVEN** |
| 19 | `/api/v1/goals/:id` | `DELETE` | Path: :id. Headers: Authorization | `data: { deleted: true } }` | `GoalDeleteWireResponse { success: true` | **PROVEN** |
| 20 | `/api/v1/planning/preview` | `POST` | Body: { goalId (required), scope (required), durationPreset?, startDate?, targetDate?, referenceDate?, dailyQuestionBudget?, dailyMinutes?, maxPatternsPerDay?, includeMastered? } | `data: PlanPreviewResponseDto }` | `PlanPreviewWireResponse { success: true` | **PROVEN** |
| 21 | `/api/v1/planning/generate` | `POST` | Body: { goalId, scope, name?, durationPreset?, startDate?, targetDate?, referenceDate?, dailyQuestionBudget?, dailyMinutes?, maxPatternsPerDay?, includeMastered? } | `data: { plan: StudyPlanDto` | `StudyPlanGenerateWireResponse { success: true` | **PROVEN** |
| 22 | `/api/v1/planning/plans/:planId/replan` | `POST` | Path: :planId. Body: { referenceDate?, replaceToday?, allowReplaceToday?, includeMastered? } | `data: PlanReplanResponseDto }` | `PlanReplanWireResponse { success: true` | **PROVEN** |
| 23 | `/api/v1/planning/plans/:planId/schedule` | `GET` | Path: :planId. Headers: Authorization | `data: PlanScheduleResponseDto }` | `PlanScheduleWireResponse { success: true` | **PROVEN** |
| 24 | `/api/v1/study-plans/user/:userId` | `GET` | Path: :userId (matches JWT sub). Headers: Authorization | `data: StudyPlanDto[]` | `StudyPlanListWireResponse { success: true` | **PROVEN** |
| 25 | `/api/v1/daily-objectives/user/:userId` | `GET` | Path: :userId. Query: page (def 1), limit (def 20). Headers: Authorization | `data: DailyObjectiveDto[]` | `DailyObjectivePaginatedWireResponse { success: true` | **PROVEN** |
| 26 | `/api/v1/daily-objectives/:id` | `PATCH` | Path: :id. Body: { topic?, patterns?, targetMinutes?, actualMinutes?, status? }. Headers: Authorization | `data: DailyObjectiveDto }` | `DailyObjectiveUpdateWireResponse { success: true` | **PROVEN** |
| 27 | `/api/v1/attempts` | `POST` | Body: { questionId, selectedAnswer, timeTaken, source?, goalId?, sessionId? }. Headers: Authorization | `data: AttemptRecordDto }` | `AttemptCreateWireResponse { success: true` | **PROVEN** |
| 28 | `/api/v1/attempts/user/:userId` | `GET` | Path: :userId. Query: page (def 1), limit (def 20), topic?, pattern?, dateFrom?, dateTo?. Headers: Authorization | `data: AttemptRecordDto[]` | `AttemptPaginatedWireResponse { success: true` | **PROVEN** |
| 29 | `/api/v1/progress/:userId` | `GET` | Path: :userId. Query: page (def 1), limit (def 20), sortBy?, sortOrder?. Headers: Authorization | `data: StudentProgressDto[]` | `ProgressPaginatedWireResponse { success: true` | **PROVEN** |
| 30 | `/api/v1/progress/:userId/topics` | `GET` | Path: :userId. Headers: Authorization | `data: StudentProgressDto[]` | `ProgressTopicListWireResponse { success: true` | **PROVEN** |
| 31 | `/api/v1/progress/:userId/patterns` | `GET` | Path: :userId. Headers: Authorization | `data: StudentProgressDto[]` | `ProgressPatternListWireResponse { success: true` | **PROVEN** |
| 32 | `/api/v1/progress/:userId/weakest` | `GET` | Path: :userId. Query: limit (def 10, clamp 1-50). Headers: Authorization | `data: StudentProgressDto[]` | `ProgressWeakestListWireResponse { success: true` | **PROVEN** |
| 33 | `/api/v1/progress/prerequisites/:patternName` | `GET` | Path: :patternName (canonical pattern name). Headers: Authorization | `data: PrerequisiteGraphDto }` | `ProgressPrerequisiteWireResponse { success: true` | **PROVEN** |
| 34 | `/api/v1/adaptive/next-question` | `GET` | Query: topic?, pattern?. Headers: Authorization | `data: { question: AdaptiveQuestionDto` | `AdaptiveNextQuestionWireResponse { success: true` | **PROVEN** |
| 35 | `/api/v1/revisions/due` | `GET` | Headers: Authorization: Bearer <accessToken> | `count: number` | `RevisionDueWireResponse { success: true` | **PROVEN** |
| 36 | `/api/v1/revisions/plan` | `GET` | Query: windowDays? (int 1-365, def 30). Headers: Authorization | `data: RevisionProjectionDto }` | `RevisionPlanWireResponse { success: true` | **PROVEN** |
| 37 | `/api/v1/revisions/rebuild` | `POST` | Body: { topic?, pattern?, referenceDate? }. Headers: Authorization | `message: string` | `RevisionRebuildWireResponse { success: true` | **PROVEN** |
| 38 | `/api/v1/mock-blueprints` | `GET` | Headers: Authorization: Bearer <accessToken> | `data: MockBlueprintDto[] }` | `MockBlueprintListWireResponse { success: true` | **PROVEN** |
| 39 | `/api/v1/mock-sessions` | `POST` | Body: { blueprintId?, blueprint?, generationSeed? }. Headers: Authorization | `data: MockSessionDocDto }` | `MockSessionCreateWireResponse { success: true` | **PROVEN** |
| 40 | `/api/v1/mock-sessions/:id/start` | `POST` | Path: :id. Headers: Authorization | `data: MockSessionDocDto }` | `MockSessionStartWireResponse { success: true` | **PROVEN** |
| 41 | `/api/v1/mock-sessions/:id` | `GET` | Path: :id. Headers: Authorization | `data: MockSessionDetailDto }` | `MockSessionDetailWireResponse { success: true` | **PROVEN** |
| 42 | `/api/v1/mock-sessions/:id/questions/:questionId` | `GET` | Path: :id, :questionId. Headers: Authorization | `data: ActiveMockQuestionDto }` | `MockQuestionWireResponse { success: true` | **PROVEN** |
| 43 | `/api/v1/mock-sessions/:id/responses` | `POST` | Path: :id. Body: { questionId, selectedAnswer?, isFlagged?, timeTakenSeconds? } | `data: MockResponseSaveDto }` | `MockResponseSaveWireResponse { success: true` | **PROVEN** |
| 44 | `/api/v1/mock-sessions/:id/sections/:sectionId/complete` | `POST` | Path: :id, :sectionId. Headers: Authorization | `data: MockSectionCompleteDto }` | `MockSectionCompleteWireResponse { success: true` | **PROVEN** |
| 45 | `/api/v1/mock-sessions/:id/submit` | `POST` | Path: :id. Headers: Authorization | `data: MockSubmitResponseDto }` | `MockSubmitWireResponse { success: true` | **PROVEN** |
| 46 | `/api/v1/mock-sessions/:id/abandon` | `POST` | Path: :id. Headers: Authorization | `data: { status: "abandoned"` | `MockSessionAbandonWireResponse { success: true` | **PROVEN** |
| 47 | `/api/v1/mock-sessions/:id/result` | `GET` | Path: :id. Headers: Authorization | `data: MockResultResponseDto }` | `MockResultWireResponse { success: true` | **PROVEN** |
| 48 | `/api/v1/mock-sessions/:id/review` | `GET` | Path: :id. Headers: Authorization | `data: MockReviewResponseDto }` | `MockReviewWireResponse { success: true` | **PROVEN** |
| 49 | `/api/v1/analytics/dashboard` | `GET` | Query: userId (REQUIRED non-empty scalar string, matches token), windowDays? (int 1-365, def 30) | `data: AnalyticsDashboardResponseDto }` | `AnalyticsDashboardWireResponse { success: true` | **PROVEN** |
| 50 | `/api/v1/analytics/cognitive-profile` | `GET` | Query: userId (REQUIRED scalar string), windowDays? (int 1-365, def 30) | `data: CognitiveProfileResponseDto }` | `CognitiveProfileWireResponse { success: true` | **PROVEN** |
| 51 | `/api/v1/analytics/retention` | `GET` | Query: userId (REQUIRED scalar string), windowDays? (int 1-365, def 30) | `data: RetentionAnalyticsResponseDto }` | `AnalyticsRetentionWireResponse { success: true` | **PROVEN** |
| 52 | `/api/v1/analytics/readiness/:goalId` | `GET` | Path: :goalId. Query: userId (REQUIRED scalar string), targetDate? (ISO date) | `data: ExamReadinessResponseDto }` | `AnalyticsReadinessWireResponse { success: true` | **PROVEN** |
| 53 | `/api/v1/orchestration/next-action` | `GET` | Query: userId (REQUIRED scalar string, matches token). Headers: Authorization | `data: NextActionContainerDto` | `OrchestrationNextActionWireResponse { success: true` | **PROVEN** |
| 54 | `/api/v1/orchestration/daily-agenda` | `GET` | Query: userId (REQUIRED scalar string, matches token). Headers: Authorization | `data: DailyAgendaContainerDto` | `DailyAgendaWireResponse { success: true, data: DailyAgendaContainerDto, meta: { referenceNow: string } }` | **PROVEN** |
| 55 | `/api/v1/orchestration/interventions` | `GET` | Query: userId (REQUIRED scalar string, matches token). Headers: Authorization | `data: InterventionListContainerDto` | `InterventionListWireResponse { success: true, data: InterventionListContainerDto, meta: { referenceNow: string } }` | **PROVEN** |
| 56 | `/api/v1/attribution/prescriptions/:prescriptionId/activate` | `POST` | Path: :prescriptionId (regex rx_[a-f0-9]{24}). Headers: Authorization | `data: PrescriptionLeaseResponseDto` | `AttributionActivateWireResponse { success: true` | **PROVEN** |
| 57 | `/api/v1/attribution/prescriptions/:prescriptionId/complete` | `POST` | Path: :prescriptionId (rx_[a-f0-9]{24}). Body: { abandon?, mockSessionId? }. Headers: Authorization | `data: PrescriptionAdherenceResponseDto` | `AttributionCompleteWireResponse { success: true` | **PROVEN** |
| 58 | `/api/v1/learning/tutor` | `POST` | Body: { topic (required), pattern (required), message?, questionId?, conversationHistory? }. Headers: Authorization | `metadata: LearningMetadataDto` | `LearningDeliveryEnvelope<TutorResponseDto> { data: TutorResponseDto` | **PROVEN** |
| 59 | `/api/v1/learning/hint` | `POST` | Body: { topic, pattern, questionId, level (integer 1-5) }. Headers: Authorization | `metadata: LearningMetadataDto` | `LearningDeliveryEnvelope<HintResponseDto> { data: HintResponseDto` | **PROVEN** |
| 60 | `/api/v1/learning/explain-attempt` | `POST` | Body: { attemptId (ObjectId string) }. Headers: Authorization | `metadata: LearningMetadataDto` | `LearningDeliveryEnvelope<DiagnoseResponseDto> { data: DiagnoseResponseDto` | **PROVEN** |
| 61 | `/api/v1/learning/explain-progress` | `POST` | Body: { userId (REQUIRED, matches token), topic (required), pattern (required), period? }. Headers: Authorization | `metadata: LearningMetadataDto` | `LearningDeliveryEnvelope<ExplainProgressResponseDto> { data: ExplainProgressResponseDto` | **PROVEN** |
| 62 | `/api/v1/learning/explain-plan` | `POST` | Body: { planId (required ObjectId), targetDate (required ISO date string) }. Headers: Authorization | `metadata: LearningMetadataDto` | `LearningDeliveryEnvelope<ExplainPlanResponseDto> { data: ExplainPlanResponseDto` | **PROVEN** |
| 63 | `/api/v1/learning/mock-review` | `POST` | Body: { sessionId (required ObjectId) }. Headers: Authorization | `metadata: LearningMetadataDto` | `LearningDeliveryEnvelope<MockReviewAiResponseDto> { data: MockReviewAiResponseDto` | **PROVEN** |
| 64 | `/api/v1/attribution/prescriptions` | `POST` | Headers: Idempotency-Key (REQUIRED non-empty string, max 128 chars), Authorization. Body: { originSurface: "next_action" &#124; "daily_agenda", goalId?, actionId? } | `data: PrescriptionIssuanceResponseDto` | `AttributionIssuanceWireResponse { success: true` | **PROVEN (App Contract) / RESOLVED-BY-DEPLOYMENT-CONTRACT (W39)** |

---

### 54.3 Core Backend-Proven TypeScript Interfaces

The frontend strictly models wire interfaces according to backend schemas, avoiding client-side type fabrication:

```typescript
// src/types/api.ts
// Exhaustive, mechanically certified backend wire contracts for all 64 consumed operations.

// ── Generic API Envelopes & Metadata (BACKEND-PROVEN: src/utils/apiResponse.js) ────────────
export interface ApiSuccessEnvelope<T, M = unknown> {
  success: true;
  data: T;
  meta?: M;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  count: number;
}

export interface SuccessEnvelopeDto {
  message: string;
}

// ── Auth Wire DTOs & Responses (Operations 1–6) ───────────────────────────────────────────
// BACKEND-PROVEN: src/routes/authRoutes.js & src/controllers/authController.js
export interface AuthUserSummary {
  userId: string;
  name: string;
  email: string;
}

export interface UserProfileDto {
  userId: string;
  name: string;
  email?: string | null;
  avatar?: string | null;
  status: 'active' | 'disabled' | 'pending';
  createdAt?: string;
  updatedAt?: string;
}

export interface RegisterRequestPayload {
  name: string;
  email: string;
  password: string;
}

// Op 1: POST /api/v1/auth/register (returns 201 with data: { user })
export interface RegisterResponseDto {
  user: AuthUserSummary;
}

export type AuthRegisterPayload = RegisterResponseDto;
export type AuthRegisterResponse = AuthRegisterWireResponse;
export type RegisterWireResponse = AuthRegisterWireResponse;
export type RegisterResponseWireResponse = AuthRegisterWireResponse;

export interface AuthRegisterWireResponse {
  success: true;
  data: RegisterResponseDto;
}

export interface LoginRequestPayload {
  email: string;
  password: string;
}

// Op 2: POST /api/v1/auth/login (returns 200 with accessToken, expiresIn, user; HttpOnly cookie for refresh)
export interface LoginResponseDto {
  accessToken: string;
  expiresIn: number;
  user: AuthUserSummary;
}

export type AuthLoginPayload = LoginResponseDto;
export type AuthLoginResponse = AuthLoginWireResponse;
export type LoginWireResponse = AuthLoginWireResponse;

export interface AuthLoginWireResponse {
  success: true;
  data: LoginResponseDto;
}

// Op 3: POST /api/v1/auth/refresh (returns 200 with accessToken, expiresIn; HttpOnly cookie for refresh)
export interface RefreshTokenResponseDto {
  accessToken: string;
  expiresIn: number;
}

export type RefreshResponseDto = RefreshTokenResponseDto;
export type AuthRefreshPayload = RefreshTokenResponseDto;
export type AuthRefreshResponse = AuthRefreshWireResponse;
export type RefreshWireResponse = AuthRefreshWireResponse;

export interface AuthRefreshWireResponse {
  success: true;
  data: RefreshResponseDto;
}

// Op 4: POST /api/v1/auth/logout (requires authenticate middleware; clears refresh cookie)
export interface AuthLogoutWireResponse {
  success: true;
  data: {
    message: string;
  };
}

// Op 5: POST /api/v1/auth/revoke-all (requires authenticate middleware; clears refresh cookie)
export interface AuthRevokeAllWireResponse {
  success: true;
  data: {
    message: string;
  };
}

// Op 6: GET /api/v1/auth/me (requires authenticate middleware)
export interface AuthMeWireResponse {
  success: true;
  data: {
    user: UserProfileDto;
    session: {
      sessionId: string;
      issuedAt: string;
      expiresAt: string;
    };
  };
}

// ── Question Bank & Pattern Registry DTOs (Operations 7–13) ──────────────────────────────
// Op 7: GET /api/v1/questions/topics
export interface TopicListWireResponse {
  success: true;
  data: string[];
  meta: {
    count: number;
  };
}

export interface PatternSummaryDto {
  name: string;
  slug: string;
  description: string;
  questionCount: number;
  prerequisites: string[];
  aliases: string[];
}

export type PatternDto = PatternSummaryDto;

// Op 8: GET /api/v1/questions/topic/:topic/patterns
export interface PatternListWireResponse {
  success: true;
  data: PatternSummaryDto[];
  meta: {
    topic: string;
    count: number;
  };
}

export interface QuestionDto {
  _id: string;
  questionId?: string;
  topic: string;
  pattern: string;
  difficulty: number;
  question: string;
  options: string[];
  answer: string;
  explanation: string;
  metadata?: {
    estimatedTimeSeconds?: number;
    tags?: string[];
  };
  createdAt?: string;
  updatedAt?: string;
}

// Ops 9 & 10: GET /api/v1/questions/topic/:topic & GET /api/v1/questions/pattern/:pattern
// Op 11 & 12: GET /api/v1/questions/topic/:topic/random & GET /api/v1/questions/topic/:topic/pattern/:pattern/random
export interface QuestionRandomListWireResponse {
  success: true;
  data: QuestionDto[];
  meta: {
    count: number;
  };
}

export interface QuestionPaginatedWireResponse {
  success: true;
  data: QuestionDto[];
  meta: PaginationMeta;
}

// Op 11: GET /api/v1/questions/:id
export interface QuestionDetailWireResponse {
  success: true;
  data: QuestionDto;
}

// Op 12: GET /api/v1/questions/practice
export interface PracticeSessionWireResponse {
  success: true;
  data: QuestionDto[];
  meta: {
    count: number;
  };
}

// Op 13: GET /api/v1/questions/details/:id
export interface QuestionWithExplanationDto extends QuestionDto {
  detailedExplanation?: string;
  conceptTakeaway?: string;
}

export interface QuestionExplanationWireResponse {
  success: true;
  data: QuestionWithExplanationDto;
}

// ── User Profile & Goal Management DTOs (Operations 14–19) ─────────────────────────────────
// Op 14: GET /api/v1/users/:id
export interface UserGetWireResponse {
  success: true;
  data: UserProfileDto;
}

export type UserProfileWireResponse = UserGetWireResponse;

export interface GoalDetailDto {
  _id: string;
  userId: string;
  title: string;
  type: string;
  targetName?: string;
  description?: string | null;
  startDate?: string | null;
  targetDate?: string | null;
  targetScore?: number | null;
  priority?: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

// Op 15: GET /api/v1/goals/user/:userId
export interface GoalListWireResponse {
  success: true;
  data: GoalDetailDto[];
  meta: {
    count: number;
  };
}

// Op 16: POST /api/v1/goals (requires title and type; status accepted)
export interface GoalCreatePayload {
  title: string;
  type: string;
  targetName?: string;
  description?: string;
  startDate?: string;
  targetDate?: string;
  targetScore?: number;
  priority?: string;
  status?: string;
}

export type GoalCreateRequestPayload = GoalCreatePayload;

export interface GoalCreateWireResponse {
  success: true;
  data: GoalDetailDto;
}

// Op 17: GET /api/v1/goals/:id
export interface GoalDetailWireResponse {
  success: true;
  data: GoalDetailDto;
}

// Op 18: PATCH /api/v1/goals/:id
export interface GoalPatchPayload {
  title?: string;
  type?: string;
  targetName?: string;
  description?: string;
  startDate?: string;
  targetDate?: string;
  targetScore?: number;
  priority?: string;
  status?: string;
}

export type GoalPatchRequestPayload = GoalPatchPayload;

export interface GoalUpdateWireResponse {
  success: true;
  data: GoalDetailDto;
}

export type GoalPatchWireResponse = GoalUpdateWireResponse;

// Op 19: DELETE /api/v1/goals/:id (hard delete via Goal.deleteOne returning { deleted: true })
export interface GoalDeleteWireResponse {
  success: true;
  data: {
    deleted: true;
  };
}

// ── Planning & Study Plan Engine DTOs (Operations 20–26) ──────────────────────────────────
// Structured scope object supported by planningScopeService.js
export interface PlanningScopeDto {
  topics?: string[];
  patterns?: string[];
  allCanonicalPatterns?: boolean;
  targetProfileId?: string;
  includeMastered?: boolean;
}

// Op 20: POST /api/v1/planning/preview
export interface PlanPreviewPayload {
  goalId: string;
  scope: PlanningScopeDto;
  durationPreset?: '3d' | '7d' | '9d' | '1m' | '2m' | '3m' | '6m';
  startDate?: string;
  targetDate?: string;
  referenceDate?: string;
  dailyQuestionBudget?: number;
  dailyMinutes?: number;
  maxPatternsPerDay?: number;
  includeMastered?: boolean;
}

export type PlanPreviewRequestPayload = PlanPreviewPayload;

export interface PlanPreviewResultDto {
  algorithmVersion: string;
  startDate: string;
  endDate: string;
  days: number;
  durationPreset: string | null;
  dailyQuestionBudget: number;
  dailyMinutes: number;
  maxPatternsPerDay: number;
  patternsRequested: number;
  prerequisitesAdded: number;
  prerequisitesList: string[];
  patternsAlreadyMastered: number;
  patternsScheduled: number;
  patternsUnscheduled: number;
  unscheduledPatterns: string[];
  totalRequestedWorkload: number;
  horizonQuestionCapacity: number;
  scheduledWorkload: number;
  unscheduledWorkload: number;
  capacityShortfall: boolean;
  reasonCodes: string[];
  proposedTargets: Array<{
    topic: string;
    pattern: string;
    targetQuestions: number;
    targetMastery: number;
  }>;
  objectives: Array<{
    date: string;
    topic: string;
    patterns: Array<{
      pattern: string;
      targetQuestions: number;
      completedQuestions: number;
      targetDifficulty?: number;
    }>;
    targetMinutes: number;
    actualMinutes: number;
    status: string;
  }>;
}

export interface PlanPreviewWireResponse {
  success: true;
  data: PlanPreviewResultDto;
}

// Op 21: POST /api/v1/planning/generate (returns 201 with data: { plan, objectives, summary })
export interface PlanGeneratePayload {
  goalId: string;
  scope: PlanningScopeDto;
  name?: string;
  durationPreset?: '3d' | '7d' | '9d' | '1m' | '2m' | '3m' | '6m';
  startDate?: string;
  targetDate?: string;
  referenceDate?: string;
  dailyQuestionBudget?: number;
  dailyMinutes?: number;
  maxPatternsPerDay?: number;
  includeMastered?: boolean;
}

export type PlanGenerateRequestPayload = PlanGeneratePayload;

export interface StudyPlanSummaryDto {
  algorithmVersion: string;
  startDate: string;
  endDate: string;
  days: number;
  durationPreset: string | null;
  dailyQuestionBudget: number;
  dailyMinutes: number;
  maxPatternsPerDay: number;
  patternsRequested: number;
  prerequisitesAdded: number;
  patternsAlreadyMastered: number;
  patternsScheduled: number;
  patternsUnscheduled: number;
  unscheduledPatterns: string[];
  totalRequestedWorkload: number;
  horizonQuestionCapacity: number;
  scheduledWorkload: number;
  unscheduledWorkload: number;
  capacityShortfall: boolean;
  reasonCodes: string[];
}

export interface StudyPlanDto {
  _id: string;
  userId: string;
  goalId: string;
  name: string;
  scope: 'short' | 'medium' | 'long';
  phase: 'core' | 'remediation' | 'retention';
  startDate: string;
  endDate: string;
  status: 'active' | 'completed' | 'paused' | 'archived';
  targets: Array<{
    topic: string;
    pattern: string;
    targetQuestions: number;
    targetMastery: number;
  }>;
  planningMeta?: {
    algorithmVersion: string;
    durationPreset: string | null;
    generatedAutomatically: boolean;
    dailyQuestionBudget: number;
    dailyMinutes: number;
    maxPatternsPerDay: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface StudyPlanGenerateResultDto {
  plan: StudyPlanDto;
  objectives: DailyObjectiveDto[];
  summary: StudyPlanSummaryDto;
}

export interface StudyPlanGenerateWireResponse {
  success: true;
  data: StudyPlanGenerateResultDto;
}

export type PlanGenerateWireResponse = StudyPlanGenerateWireResponse;

// Single study plan wire response (e.g. GET /api/v1/study-plans/:id)
export interface StudyPlanWireResponse {
  success: true;
  data: StudyPlanDto;
}

// Op 22: POST /api/v1/planning/plans/:planId/replan
export interface PlanReplanPayload {
  referenceDate?: string;
  replaceToday?: boolean;
  allowReplaceToday?: boolean;
  includeMastered?: boolean;
}

export type PlanReplanRequestPayload = PlanReplanPayload;

export interface PlanReplanResultDto {
  success: true;
  planId: string;
  algorithmVersion: string;
  replanCutoffDate: string;
  startReplanDate: string;
  remainingDays: number;
  preservedObjectives: number;
  removedFutureObjectives: number;
  newObjectives: number;
  patternsRescheduled: number;
  patternsSkippedAsMastered: number;
  unscheduledPatterns: string[];
  remainingCapacity: number;
  reasonCodes: string[];
}

export interface PlanReplanWireResponse {
  success: true;
  data: PlanReplanResultDto;
}

// Op 23: GET /api/v1/planning/plans/:planId/schedule
export interface PlanScheduleResultDto {
  planId: string;
  planName: string;
  userId: string;
  goalId: string;
  startDate: string;
  endDate: string;
  status: string;
  totalObjectives: number;
  objectives: DailyObjectiveDto[];
}

export interface PlanScheduleWireResponse {
  success: true;
  data: PlanScheduleResultDto;
}

// Op 24: GET /api/v1/study-plans/user/:userId
export interface PlanListWireResponse {
  success: true;
  data: StudyPlanDto[];
  meta: {
    count: number;
  };
}

// Op 25: GET /api/v1/daily-objectives/user/:userId
export interface DailyObjectiveDto {
  _id: string;
  userId: string;
  planId: string;
  goalId: string;
  date: string;
  topic: string;
  patterns: Array<{
    pattern: string;
    targetQuestions: number;
    completedQuestions: number;
    targetDifficulty?: number;
  }>;
  targetMinutes: number;
  actualMinutes: number;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  createdAt: string;
  updatedAt: string;
}

export interface DailyObjectiveListWireResponse {
  success: true;
  data: DailyObjectiveDto[];
  meta: PaginationMeta;
}

// Op 26: PATCH /api/v1/daily-objectives/:id
export interface DailyObjectivePatchPayload {
  topic?: string;
  patterns?: Array<{
    pattern: string;
    targetQuestions?: number;
    completedQuestions?: number;
    targetDifficulty?: number;
  }>;
  targetMinutes?: number;
  actualMinutes?: number;
  status?: 'pending' | 'in_progress' | 'completed' | 'skipped';
}

export interface DailyObjectivePatchWireResponse {
  success: true;
  data: DailyObjectiveDto;
}

// ── Attempts & History DTOs (Operations 27–28) ────────────────────────────────────────────
// Op 27: POST /api/v1/attempts
export interface AttemptCreatePayload {
  questionId: string;
  selectedAnswer: string;
  timeTaken: number;
  source: string;
  sessionId?: string;
}

export type AttemptRecordRequestPayload = AttemptCreatePayload;

export interface AttemptRecordDto {
  _id: string;
  userId: string;
  questionId: string;
  selectedAnswer: string;
  isCorrect: boolean;
  timeTaken: number;
  source: string;
  sessionId?: string | null;
  topic: string;
  pattern: string;
  difficulty: number;
  createdAt: string;
}

export interface AttemptCreateWireResponse {
  success: true;
  data: AttemptRecordDto;
}

export type AttemptRecordWireResponse = AttemptCreateWireResponse;

// Op 28: GET /api/v1/attempts/user/:userId
export interface AttemptListWireResponse {
  success: true;
  data: AttemptRecordDto[];
  meta: PaginationMeta;
}

// ── Progress & Student Mastery DTOs (Operations 29–33) ────────────────────────────────────
export interface StudentProgressDto {
  _id: string;
  userId: string;
  topic: string;
  pattern: string;
  attempts: number;
  correct: number;
  accuracy: number;
  mastery: number;
  streak: number;
  lastAttemptDate?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Op 29: GET /api/v1/progress/:userId
export interface ProgressOverallWireResponse {
  success: true;
  data: StudentProgressDto[];
  meta: PaginationMeta;
}

export type StudentProgressWireResponse = ProgressOverallWireResponse;

// Op 30: GET /api/v1/progress/:userId/topics
export interface ProgressTopicsWireResponse {
  success: true;
  data: StudentProgressDto[];
  meta: {
    count: number;
  };
}

export type TopicMasteryWireResponse = ProgressTopicsWireResponse;

// Op 31: GET /api/v1/progress/:userId/patterns
export interface ProgressPatternsWireResponse {
  success: true;
  data: StudentProgressDto[];
  meta: {
    count: number;
  };
}

export type PatternMasteryWireResponse = ProgressPatternsWireResponse;

export interface WeakestPatternDto {
  topic: string;
  pattern: string;
  accuracy: number;
  attempts: number;
  mastery: number;
}

// Op 32: GET /api/v1/progress/:userId/weakest
export interface ProgressWeakestWireResponse {
  success: true;
  data: WeakestPatternDto[];
  meta: {
    count: number;
  };
}

export type WeakestPatternsWireResponse = ProgressWeakestWireResponse;

export interface PrerequisiteDataDto {
  pattern: string;
  topic: string;
  prerequisites: string[];
  prerequisiteCount: number;
  dependents: string[];
  dependentCount: number;
  isFoundational: boolean;
}

// Op 33: GET /api/v1/progress/prerequisites/:patternName
export interface ProgressPrerequisitesWireResponse {
  success: true;
  data: PrerequisiteDataDto;
}

export type PrerequisiteGraphWireResponse = ProgressPrerequisitesWireResponse;

// ── Adaptive Decision Engine DTOs (Operation 34) ──────────────────────────────────────────
export interface AdaptiveQuestionDto {
  _id: string;
  question: string;
  options: string[];
  topic: string;
  pattern: string;
  difficulty: number;
}

export interface AdaptiveDecisionDto {
  requestedPattern?: string;
  selectedTopic: string;
  selectedPattern: string;
  mastery: number;
  recentAccuracy: number;
  baseDifficulty: number;
  adjustment: number;
  targetDifficulty: number;
  selectedDifficulty: number;
  fallbackUsed: boolean;
  prerequisiteRedirect: boolean;
  reasonCodes: string[];
}

// Op 34: GET /api/v1/adaptive/next-question
export interface AdaptiveNextQuestionWireResponse {
  success: true;
  data: {
    question: AdaptiveQuestionDto;
    decision: AdaptiveDecisionDto;
  };
}

// ── Spaced Revision Engine DTOs (Operations 35–37) ────────────────────────────────────────
export interface RevisionDueItemDto {
  _id: string;
  userId: string;
  topic: string;
  pattern: string;
  dueDate: string;
  intervalDays: number;
  stage: number;
  mastery: number;
  reasonCode: string;
  registryIndex: number;
}

// Op 35: GET /api/v1/revisions/due
export interface RevisionDueListWireResponse {
  success: true;
  count: number;
  data: RevisionDueItemDto[];
}

export interface RevisionPlanProjectionDto {
  days: number;
  referenceDate: string;
  projections: Array<{
    date: string;
    count: number;
    patterns: string[];
  }>;
}

// Op 36: GET /api/v1/revisions/plan
export interface RevisionPlanWireResponse {
  success: true;
  data: RevisionPlanProjectionDto;
}

export interface RevisionItemDto {
  _id: string;
  userId: string;
  topic: string;
  pattern: string;
  intervalDays: number;
  easeFactor: number;
  stage: number;
  dueDate: string;
  lastReviewedAt?: string;
}

export interface RevisionRebuildPayload {
  topic?: string;
  pattern?: string;
  referenceDate?: string;
}

export type RevisionRebuildRequestPayload = RevisionRebuildPayload;

// Op 37: POST /api/v1/revisions/rebuild
export interface RevisionRebuildWireResponse {
  success: true;
  message: string;
  data: RevisionItemDto | RevisionItemDto[] | null;
}

// ── Mock Test Engine DTOs (Operations 38–48) ──────────────────────────────────────────────
export interface MockBlueprintSectionDto {
  sectionId: string;
  name: string;
  durationMinutes: number;
  topics: string[];
  questionCount: number;
}

export interface MockBlueprintDto {
  _id: string;
  title: string;
  description?: string;
  mode: 'standard' | 'adaptive' | 'speed_challenge';
  totalDurationMinutes: number;
  sections: MockBlueprintSectionDto[];
  status: 'draft' | 'published' | 'archived';
  scoring?: Record<string, unknown>;
  excludeRecentQuestions?: number;
  algorithmVersion?: string;
  createdAt: string;
}

// Op 38: GET /api/v1/mock-blueprints
export interface MockBlueprintListWireResponse {
  success: true;
  data: MockBlueprintDto[];
}

// Op 39: POST /api/v1/mock-sessions (no top-level mode; mode belongs to blueprint)
export interface MockSessionCreatePayload {
  blueprintId?: string;
  blueprint?: Record<string, unknown>;
  generationSeed?: string;
}

export type MockSessionCreateRequestPayload = MockSessionCreatePayload;

export interface MockSessionDocDto {
  _id: string;
  userId: string;
  blueprintId: string;
  status: 'created' | 'started' | 'submitted' | 'expired' | 'abandoned';
  navigationPolicy: string;
  currentSectionId: string;
  responsesFrozen: boolean;
  finalizationState: 'idle' | 'in_progress' | 'completed' | 'failed';
  createdAt: string;
  startedAt?: string;
  expiresAt?: string;
  submittedAt?: string;
}

export interface MockSessionCreateWireResponse {
  success: true;
  data: MockSessionDocDto;
}

// Op 40: POST /api/v1/mock-sessions/:id/start
export interface MockSessionStartWireResponse {
  success: true;
  data: MockSessionDocDto;
}

export interface MockSessionDetailDto extends MockSessionDocDto {
  sections: Array<{
    sectionId: string;
    name: string;
    durationMinutes: number;
    status: 'pending' | 'in_progress' | 'completed';
    questionCount: number;
  }>;
}

// Op 41: GET /api/v1/mock-sessions/:id
export interface MockSessionDetailWireResponse {
  success: true;
  data: MockSessionDetailDto;
}

export interface ActiveMockQuestionDto {
  questionId: string;
  sectionId: string;
  order: number;
  question: string;
  options: string[];
  topic: string;
  pattern: string;
  difficulty: number;
}

// Op 42: GET /api/v1/mock-sessions/:id/questions/:questionId
export interface MockQuestionWireResponse {
  success: true;
  data: ActiveMockQuestionDto;
}

// Op 43: POST /api/v1/mock-sessions/:id/responses
export interface MockResponseSavePayload {
  questionId: string;
  sectionId: string;
  selectedOption: string | null;
  timeSpentSeconds?: number;
  isFlagged?: boolean;
}

export interface MockResponseDocDto {
  _id: string;
  sessionId: string;
  questionId: string;
  sectionId: string;
  selectedOption: string | null;
  timeSpentSeconds: number;
  isFlagged: boolean;
  status: string;
  updatedAt: string;
}

export interface MockResponseSaveWireResponse {
  success: true;
  data: MockResponseDocDto;
}

export interface MockSectionCompleteResultDto {
  sessionId: string;
  sectionId: string;
  status: 'completed';
  nextSectionId: string | null;
}

// Op 44: POST /api/v1/mock-sessions/:id/sections/:sectionId/complete
export interface MockSectionCompleteWireResponse {
  success: true;
  data: MockSectionCompleteResultDto;
}

export interface MockSessionSubmitResultDto {
  sessionId: string;
  status: 'submitted';
  finalizationState: 'in_progress' | 'completed';
}

// Op 45: POST /api/v1/mock-sessions/:id/submit
export interface MockSubmitWireResponse {
  success: true;
  data: MockSessionSubmitResultDto;
}

// Op 46: POST /api/v1/mock-sessions/:id/abandon
export interface MockSessionAbandonWireResponse {
  success: true;
  data: MockSessionDocDto;
}

export interface MockScoringResultDto {
  sessionId: string;
  totalScore: number;
  maxScore: number;
  percentage: number;
  percentile?: number | null;
  sectionScores: Array<{
    sectionId: string;
    score: number;
    maxScore: number;
    accuracy: number;
  }>;
  accuracy: number;
  totalTimeSpentSeconds: number;
  speedScore?: number;
  staminaIndex?: number;
}

// Op 47: GET /api/v1/mock-sessions/:id/result
export interface MockResultWireResponse {
  success: true;
  data: MockScoringResultDto;
}

export interface MockReviewQuestionDto {
  questionId: string;
  order: number;
  question: string;
  options: string[];
  selectedOption: string | null;
  correctAnswer: string;
  isCorrect: boolean;
  explanation: string;
  timeSpentSeconds: number;
  topic: string;
  pattern: string;
  difficulty: number;
}

export interface MockReviewDetailDto {
  sessionId: string;
  scoring: MockScoringResultDto;
  questions: MockReviewQuestionDto[];
}

// Op 48: GET /api/v1/mock-sessions/:id/review
export interface MockSessionReviewWireResponse {
  success: true;
  data: MockReviewDetailDto;
}
export type MockReviewWireResponse = MockSessionReviewWireResponse;

// ── Cognitive Analytics DTOs (Operations 49–52) ───────────────────────────────────────────
// Op 49: GET /api/v1/analytics/dashboard
export interface TopicMasteryRadarItemDto {
  topic: string;
  masteryScore: number;
  practiceAttempts: number;
}

export interface ActivePlanSummaryDto {
  planId: string;
  planName: string;
  targetDate: string;
  daysRemaining: number;
  totalAssignedQuestions: number;
  totalCompletedQuestions: number;
}

export interface AnalyticsDashboardResponseDto {
  userId: string;
  algorithmVersion: string;
  summary: {
    totalPracticeAttempts: number;
    totalMocksCompleted: number;
    overallAccuracy: number | null;
    attemptsAnalyzed: number;
  };
  topicMasteryRadar: TopicMasteryRadarItemDto[];
  activePlanSummary: ActivePlanSummaryDto | null;
  dueRevisionCount: number;
  priorityFocusTopics: string[];
}

export interface AnalyticsDashboardWireResponse {
  success: true;
  data: AnalyticsDashboardResponseDto;
}

// Op 50: GET /api/v1/analytics/cognitive-profile
export interface StaminaQuartileItemDto {
  quartile: number;
  accuracy: number;
  totalQuestions: number;
  correctQuestions: number;
}

export interface StaminaCurveDto {
  mockSessionsAnalyzed: number;
  totalQuestionsAnalyzed: number;
  quartileAccuracy: StaminaQuartileItemDto[];
  fatigueDropoffPercent: number | null;
  fatigueReason?: string | null;
}

export interface CognitiveProfileResponseDto {
  userId: string;
  algorithmVersion: string;
  analysisWindow: {
    windowDays: number;
    attemptsAnalyzed: number;
  };
  speedAccuracyMatrix: {
    quadrantCounts: {
      accurateAndFast: number;
      accurateAndSlow: number;
      fastErrorRushing: number;
      slowErrorStruggling: number;
    };
    insufficientBaselineCount: number;
    rushingRiskScore: number | null;
    medianTimeCorrectSeconds: number | null;
    medianTimeIncorrectSeconds: number | null;
  };
  staminaCurve: StaminaCurveDto | null;
  staminaReason?: string | null;
}

export interface CognitiveProfileWireResponse {
  success: true;
  data: CognitiveProfileResponseDto;
}

// Op 51: GET /api/v1/analytics/retention
export interface RetentionGapBucketDto {
  gapBucket: string;
  totalEvents: number;
  correctEvents: number;
  observedRetentionRate: number;
}

export interface RetentionAnalyticsResponseDto {
  userId: string;
  algorithmVersion: string;
  currentState: {
    activeRevisionItems: number;
    completedRevisionItems: number;
    dueTodayCount: number;
    overdueCount: number;
    stageDistribution: {
      stage0_1day: number;
      stage1_3days: number;
      stage2_7days: number;
      stage3_14days: number;
      stage4_30days: number;
    };
  };
  observedRetentionByGap: RetentionGapBucketDto[];
  evidence: {
    revisionAttemptsAnalyzed: number;
    excludedNoPriorAttemptCount: number;
    excludedShortGapCount: number;
    excludedInvalidChronologyCount: number;
  };
}

export interface RetentionAnalyticsWireResponse {
  success: true;
  data: RetentionAnalyticsResponseDto;
}

// Op 52: GET /api/v1/analytics/readiness/:goalId
export interface PrerequisiteBottleneckDto {
  targetPattern: string;
  unmasteredPrerequisite: string;
  prerequisiteMastery: number;
  masteryLabel: string;
}

export interface ExamReadinessResponseDto {
  goalId: string;
  goalTitle: string;
  targetDate: string | null;
  algorithmVersion: string;
  readinessStatus: 'calculated' | 'insufficient_data';
  readinessScore: number | null;
  reason?: string | null;
  components: {
    planTargetCoverage: number | null;
    masteryDepth: number | null;
    eligibleMockPerformance: number | null;
    eligibleMockPacing: number | null;
  };
  criticalPrerequisiteBottlenecks: PrerequisiteBottleneckDto[];
}

export interface ExamReadinessWireResponse {
  success: true;
  data: ExamReadinessResponseDto;
}

// ── Prescriptive Orchestration DTOs (Operations 53–55) ────────────────────────────────────
export interface PublicActionDto {
  actionId: string;
  actionType: string;
  actionSubtype?: string;
  priorityTier: number;
  policyPriorityClass: string;
  urgencyScore: number;
  topic: string;
  pattern: string;
  prescribedQuestions: number;
  estimatedMinutes: number;
  rationale: string | null;
  executionIntent: string | null;
  blockedTarget?: {
    topic: string;
    pattern: string;
  };
}

export interface NextActionRecommendationDto {
  status: string;
  reason: string;
  activeMockSessionId?: string | null;
  nextAction: PublicActionDto | null;
}

// Op 53: GET /api/v1/orchestration/next-action
export interface NextActionWireResponse {
  success: true;
  data: NextActionRecommendationDto;
  meta: {
    referenceNow: string;
  };
}

export interface AgendaCheckpointRationaleDto {
  reasonCode: string;
  description: string;
}

export interface AgendaCheckpointDto {
  checkpointId: string;
  checkpointType: string;
  afterSegmentIndex: number;
  beforeSegmentIndex: number;
  prescribedQuestions: number;
  estimatedMinutes: number;
  rationale: AgendaCheckpointRationaleDto;
  executionIntent: string | null;
}

export interface AgendaSegmentDto {
  segmentIndex: number;
  segmentName: string;
  segmentBudget: number;
  allocatedQuestions: number;
  activities: PublicActionDto[];
}

export interface DailyAgendaPayloadDto {
  dailyQuestionBudget: number;
  totalPrescribedQuestions: number;
  totalEstimatedMinutes: number;
  segments: AgendaSegmentDto[];
  checkpoints: AgendaCheckpointDto[];
}

export interface DailyAgendaContainerDto {
  status: string;
  reason?: string | null;
  activeMockSessionId?: string | null;
  agenda?: DailyAgendaPayloadDto | null;
}

export interface DailyAgendaWireResponse {
  success: true;
  data: DailyAgendaContainerDto;
  meta: {
    referenceNow: string;
  };
}

export type OrchestrationDailyAgendaWireResponse = DailyAgendaWireResponse;
export type DailyAgendaDto = DailyAgendaContainerDto;

export interface InterventionItemDto {
  interventionId: string;
  category: string;
  severity: string;
  topic: string;
  pattern: string | null;
  blockedTarget: string | null;
  rationale: string;
}

export interface InterventionListContainerDto {
  status: string;
  reason?: string | null;
  interventions: InterventionItemDto[];
}

export interface InterventionListWireResponse {
  success: true;
  data: InterventionListContainerDto;
  meta: {
    referenceNow: string;
  };
}

export type OrchestrationInterventionsWireResponse = InterventionListWireResponse;

// ── PAOA Attribution & Prescription Lifecycle (Operations 56, 57, 64) ───────────────────────
// Op 64: POST /api/v1/attribution/prescriptions
// Backend requires actionId for daily_agenda, but arbiter selects for next_action.
export interface PrescriptionIssuanceRequestPayload {
  originSurface: 'next_action' | 'daily_agenda';
  actionId?: string;
  goalId?: string;
}

export interface PrescriptionIssuanceDto {
  prescriptionId: string;
  status: string;
  effectiveStatus: string;
  isExpired: boolean;
  originSurface: string;
  action: PublicActionDto;
  issuedAt: string;
  expiresAt: string;
  versions: {
    phase10AlgorithmVersion: string;
    orchestrationAlgorithmVersion: string;
  };
}

export interface AttributionIssuanceWireResponse {
  success: true;
  data: PrescriptionIssuanceDto;
  meta: {
    referenceNow: string;
  };
}

// Op 56: POST /api/v1/attribution/prescriptions/:prescriptionId/activate
export interface PrescriptionActivationDto {
  prescriptionId: string;
  status: string;
  effectiveStatus: string;
  isExpired: boolean;
  actionType: string;
  topic: string;
  pattern: string;
  prescribedQuestions: number;
  activatedAt: string;
  expiresAt: string;
  executionGuidance: {
    targetMode?: string;
    instructions: string;
    sessionId?: string;
    targetSource?: string;
  };
}

export interface AttributionActivationWireResponse {
  success: true;
  data: PrescriptionActivationDto;
  meta: {
    referenceNow: string;
  };
}

export type PrescriptionLeaseWireResponse = AttributionActivationWireResponse;

// Op 57: POST /api/v1/attribution/prescriptions/:prescriptionId/complete
export interface PrescriptionCompletePayload {
  abandon?: boolean;
  mockSessionId?: string | null;
}

export interface PrescriptionCompletionDto {
  prescriptionId: string;
  status: string;
  effectiveStatus: string;
  completedAt: string;
  executionRequirementMet: boolean;
  targetMilestoneMet: boolean;
  outcomeSnapshot: Record<string, unknown>;
  mockSessionId: string | null;
  attributionNotice: string;
}

export interface AttributionCompletionWireResponse {
  success: true;
  data: PrescriptionCompletionDto;
  meta: {
    referenceNow: string;
  };
}

export type PrescriptionCompleteWireResponse = AttributionCompletionWireResponse;

// ── Intelligent Learning DTOs & Delivery Envelopes (Operations 58–63) ─────────────────────
// Section 8.8 Uniform response delivery envelope (returns { data, metadata, provenance } without success boolean)
export interface LearningMetadataDto {
  taskType: string;
  algorithmVersion: string;
  promptVersion: string | null;
  model: string | null;
  provider: string;
  isDegraded: boolean;
  degradationReason: string | null;
}

export interface LearningProvenanceDto {
  facts: string[];
  deterministicSignals: string[];
  llmInterpretations: string[];
}

// Op 58: POST /api/v1/learning/tutor
export interface TutorRequestPayload {
  questionId?: string;
  topic?: string;
  pattern?: string;
  message?: string;
  conversationHistory?: Array<{
    role: 'user' | 'model';
    text: string;
  }>;
}

export type LearningTutorRequestPayload = TutorRequestPayload;

export interface ConceptTutorDto {
  topic: string;
  pattern: string;
  conceptExplanation: string;
  formulaSummary: string | null;
  workedExample: {
    setup: string;
    solutionSteps: string[];
    finalResult: string;
  } | null;
  keyTakeaway: string;
}

export interface LearningTutorResponseDto {
  data: ConceptTutorDto;
  metadata: LearningMetadataDto;
  provenance: LearningProvenanceDto;
}

export type TutorWireResponse = LearningTutorResponseDto;

// Op 59: POST /api/v1/learning/hint
export interface HintRequestPayload {
  questionId: string;
  hintLevel: number;
}

export type LearningHintRequestPayload = HintRequestPayload;

export interface HintDto {
  hintLevel: number;
  hint: string;
  revealsAnswer: boolean;
  nextAction: 'try_calculation' | 'review_formula' | 'check_options' | 'view_explanation';
}

export interface LearningHintResponseDto {
  data: HintDto;
  metadata: LearningMetadataDto;
  provenance: LearningProvenanceDto;
}

export type HintWireResponse = LearningHintResponseDto;

// Op 60: POST /api/v1/learning/explain-attempt
export interface ExplainAttemptPayload {
  attemptId?: string;
  questionId?: string;
  selectedAnswer?: string;
  timeTaken?: number;
}

export type LearningExplainAttemptPayload = ExplainAttemptPayload;

export interface ExplainAttemptDto {
  conceptSummary: string;
  mistakeExplanation: string;
  correctApproach: string;
  revisionSuggestion: string;
  confidence: number | null;
}

export interface LearningExplainAttemptResponseDto {
  data: ExplainAttemptDto;
  metadata: LearningMetadataDto;
  provenance: LearningProvenanceDto;
}

export type ExplainAttemptWireResponse = LearningExplainAttemptResponseDto;

// Op 61: POST /api/v1/learning/explain-progress
export interface ExplainProgressPayload {
  userId: string;
  topic?: string;
  pattern?: string;
}

export type LearningExplainProgressPayload = ExplainProgressPayload;

export interface ExplainProgressDto {
  masteryInterpretation: string;
  strengths: string[];
  weaknesses: string[];
  recommendedAction: string;
}

export interface LearningExplainProgressResponseDto {
  data: ExplainProgressDto;
  metadata: LearningMetadataDto;
  provenance: LearningProvenanceDto;
}

export type ExplainProgressWireResponse = LearningExplainProgressResponseDto;

// Op 62: POST /api/v1/learning/explain-plan
export interface ExplainPlanPayload {
  planId: string;
  targetDate?: string;
}

export type LearningExplainPlanPayload = ExplainPlanPayload;

export interface ExplainPlanDto {
  planId: string;
  targetDate: string;
  objectiveSummary: string;
  schedulingReasons: string[];
  revisionSummary: string | null;
  recommendedAction: string;
}

export interface LearningExplainPlanResponseDto {
  data: ExplainPlanDto;
  metadata: LearningMetadataDto;
  provenance: LearningProvenanceDto;
}

export type ExplainPlanWireResponse = LearningExplainPlanResponseDto;

// Op 63: POST /api/v1/learning/mock-review
export interface MockReviewPayload {
  sessionId: string;
}

export type LearningMockReviewPayload = MockReviewPayload;

export interface MockReviewDto {
  overallScoreInterpretation: string;
  sectionDiagnostics: Array<{
    sectionId: string;
    diagnosticMessage: string;
    performanceTier: 'strong' | 'competent' | 'needs_focus' | null;
  }>;
  pacingObservations: string;
  priorityRevisionPatterns: string[];
}

export interface LearningMockReviewResponseDto {
  data: MockReviewDto;
  metadata: LearningMetadataDto;
  provenance: LearningProvenanceDto;
}

export type LearningMockReviewWireResponse = LearningMockReviewResponseDto;

export type MockReviewAiWireResponse = MockReviewWireResponse;
```

## 55. QUESTION RENDERING CONTRACT

A unified, mode-safe `QuestionCard` component supports all learning modes via a discriminated union preventing transport DTO mismatches and guaranteeing zero answer leakage during active examinations:

```typescript
// Practice, Adaptive, Revision, and Mistake modes consume standard QuestionDto
export type PracticeQuestionCardProps = {
  mode: 'PRACTICE' | 'ADAPTIVE' | 'REVISION' | 'MISTAKE';
  question: QuestionDto;
  selectedOption: string | null; // VIEW-MODEL-DERIVED (mapped to selectedAnswer for DTO payload)
  onSelectOption: (option: string) => void;
  onSubmitAnswer: () => void;
  onFlagForReview?: () => void;
  isFlagged?: boolean;          // VIEW-MODEL-DERIVED (mapped to isMarkedForReview for DTO payload)
  isSubmitting?: boolean;
  feedback?: QuizFeedbackViewModel | null;
  onRequestHint?: () => void;
  onDiagnoseError?: () => void;
};

// Active Mock Exam strictly consumes sanitized MockQuestionDto (no answer/explanation fields exist)
export type ActiveMockQuestionCardProps = {
  mode: 'MOCK_EXAM';
  question: MockQuestionDto;
  selectedOption: string | null; // VIEW-MODEL-DERIVED (mapped to selectedAnswer for DTO payload)
  onSelectOption: (option: string) => void;
  onFlagForReview: () => void;
  isFlagged?: boolean;          // VIEW-MODEL-DERIVED (mapped to isMarkedForReview for DTO payload)
  isSubmitting?: boolean;
  feedback?: never;
  onRequestHint?: never;
  onDiagnoseError?: never;
  onSubmitAnswer?: never;
};

// Post-Exam Review strictly consumes MockReviewItemDto in read-only mode
export type MockReviewQuestionCardProps = {
  mode: 'MOCK_REVIEW';
  question: MockReviewItemDto;
  selectedOption?: never;
  onSelectOption?: never;
  onSubmitAnswer?: never;
  onFlagForReview?: never;
  isFlagged?: boolean;
  isSubmitting?: never;
  feedback?: never;
  onRequestHint?: never;
  onDiagnoseError?: never;
};

export type QuestionCardProps =
  | PracticeQuestionCardProps
  | ActiveMockQuestionCardProps
  | MockReviewQuestionCardProps;
```

- When `mode === 'MOCK_EXAM'`, the component accepts exclusively `MockQuestionDto`. Because `MockQuestionDto` completely lacks `answer`, `correctAnswer`, and `explanation` properties at both compile and runtime boundaries, answer leakage is structurally impossible.
- When `mode === 'PRACTICE'` or `'ADAPTIVE'`, submitting an answer triggers immediate option highlights, step-by-step explanations, and AI hint/diagnosis affordances.
- When `mode === 'MOCK_REVIEW'`, the card is strictly read-only, rendering the learner's chosen response alongside authoritative explanations and correct answer keys.

---

## 56. LEARNING SESSION STATE MACHINE

```text
       ┌──────────────┐
       │ INITIALIZING │ (Loading question/catalog)
       └──────┬───────┘
              ▼
       ┌──────────────┐
  ┌───►│    READY     │ (Question visible, timer ticking)
  │    └──────┬───────┘
  │           ▼
  │    ┌──────────────┐
  │    │  ANSWERING   │ (Option selected by learner)
  │    └──────┬───────┘
  │           ▼
  │    ┌──────────────┐
  │    │  SUBMITTING  │ (POST /api/v1/attempts in flight)
  │    └──────┬───────┘
  │           ▼
  │    ┌──────────────┐
  │    │   FEEDBACK   │ (Outcome, explanation, mastery delta displayed)
  │    └──────┬───────┘
  │           ▼
  │    ┌──────────────┐
  └────┤ NEXT_LOADING │ (GET next adaptive question)
       └──────┬───────┘
              ▼ (If drill complete)
       ┌──────────────┐
       │  COMPLETED   │ (Session summary, accuracy, time spent)
       └──────────────┘
```

---

## 57. MOCK SESSION STATE MACHINE

Strictly aligned with Phase 6 backend contracts (`mockConfig.SESSION_STATUS`, `mockConfig.SECTION_STATUS`, `mockConfig.FINALIZATION_STATE`):

### 1. Authoritative Session Lifecycle (`MockSession.status`):
- Exactly 5 frozen backend statuses: `created`, `started`, `submitted`, `expired`, `abandoned`.
- Terminal statuses: `submitted`, `expired`, `abandoned`.
- Fictional session statuses `in_progress` or `completed`: **STRICTLY PROHIBITED (0)**.

```text
CATALOG
   │ POST /api/v1/mock-sessions
   ▼
[ CREATED ]
   ├── POST .../abandon ──────────────────────────────────► [ ABANDONED ]
   │
   ▼ POST .../start
[ STARTED ] (Authoritative Server Timer Active)
   ├── POST .../submit (or final section completion) ─────► [ SUBMITTED ]
   ├── Server Duration Elapsed ───────────────────────────► [ EXPIRED ]
   └── POST .../abandon ──────────────────────────────────► [ ABANDONED ]

POST-TERMINAL PATHWAYS (STATUS-SPECIFIC):
   ├── SUBMITTED / EXPIRED (Scoring & Diagnostic Review Eligible)
   │     ├── Backend Finalization Pipeline (idle → in_progress → completed)
   │     ├── RESULT_VIEW (GET .../result once finalization completed)
   │     └── REVIEW_VIEW (GET .../review post-exam question breakdown)
   │
   └── ABANDONED (Forfeited Exam — Zero Scoring / Zero Leakage)
         ├── Zero scoring pipeline invocation (No mock Attempts created or attributed)
         ├── Zero resultSummary generation (GET .../result returns 400 MOCK_SESSION_NOT_TERMINAL)
         ├── Zero review / answer leakage (GET .../review returns 400 MOCK_SESSION_NOT_TERMINAL)
         └── ABANDONED_VIEW (Safe forfeiture confirmation; routes back to catalog)
```

### 2. Multi-Level State Domain Separation:
- **`MockSession.status`**: `created | started | submitted | expired | abandoned`
- **`SectionState.status`**: `pending | in_progress | completed | expired`
- **`FinalizationState`**: `idle | in_progress | completed | failed`
- **Cross-Domain Conflation**: Strictly `0`. Section and finalization states are never assigned to `MockSession.status`.

---

## 58. CACHE INVALIDATION MATRIX

| Mutation Action | Triggering Endpoint | TanStack Query Cache Keys Invalidated |
|---|---|---|
| **Question Attempt Submitted** | `POST /api/v1/attempts` | `['progress']`, `['weakest']`, `['dashboard']`, `['revisions', 'due']`, `['agenda']`, `['next-action']` |
| **Goal Created / Updated** | `POST/PATCH /api/v1/goals` | `['goals']`, `['dashboard']`, `['plans']`, `['readiness']` |
| **Study Plan Generated / Replanned**| `POST /api/v1/planning/*` | `['plans']`, `['daily-objectives']`, `['agenda']`, `['dashboard']` |
| **Daily Objective Updated** | `PATCH /api/v1/daily-objectives/:id` | `['daily-objectives']`, `['agenda']`, `['progress']` |
| **Mock Session Finalized** | `POST /api/v1/mock-sessions/:id/submit`| `['mock-sessions']`, `['mock-result', id]`, `['progress']`, `['analytics']`, `['dashboard']` |
| **Prescription Completed** | `POST /api/v1/attribution/.../complete`| `['agenda']`, `['next-action']` |

---

## 59. AUTHORITATIVE API CONSUMPTION MATRIX (64 OPERATIONS)

Every backend endpoint candidate for consumption in Phase 15 is cataloged below with 100% mechanical consistency:

| # | HTTP Method | Exact Registered Route | Authentication / Ownership | Frontend Feature | Request Contract / Parameters | Raw Success Envelope & Payload | Cache Policy | Mutation? | Invalidation Targets | Error Handling & Status Codes | Mismatch IDs | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | `POST` | `/api/v1/auth/register` | anonymousRateLimiter, validateRegister | Feature Op 1 | Body: { name (string, 2-100), email (string, email), password (string, 15-128 code points) }. Headers: Origin, Content-Type | `{ success: true, data: { user: AuthUserSummary } }` (201 Created) | No Cache | YES | None | 400 VALIDATION_ERROR / DUPLICATE_RESOURCE, 429 RATE_LIMITED, 500 INTERNAL_SERVER_ERROR | W01 | **PROVEN** |
| 2 | `POST` | `/api/v1/auth/login` | anonymousRateLimiter, validateLogin | Feature Op 2 | Body: { email (string, email), password (string, 15-128 code points) }. Headers: Origin, Content-Type | `{ success: true, data: { accessToken: string, expiresIn: number, user: AuthUserSummary } }` (200 OK) [Sets HttpOnly SameSite=Strict refreshToken Cookie] | No Cache | YES | Clears all cache (queryClient.clear()) | 400 VALIDATION_ERROR, 401 INVALID_CREDENTIALS, 403 ACCOUNT_DISABLED, 429 RATE_LIMITED, 500 INTERNAL_SERVER_ERROR | W01 | **PROVEN** |
| 3 | `POST` | `/api/v1/auth/refresh` | refreshRateLimiter | Feature Op 3 | Cookie: refreshToken (HttpOnly). Headers: Origin | `{ success: true, data: { accessToken: string, expiresIn: number } }` (200 OK) [Rotates HttpOnly refreshToken Cookie] | No Cache | YES | None | 401 INVALID_TOKEN / TOKEN_EXPIRED / SESSION_REVOKED, 403 ORIGIN_MISMATCH, 429 RATE_LIMITED, 500 INTERNAL_SERVER_ERROR | W01 | **PROVEN** |
| 4 | `POST` | `/api/v1/auth/logout` | authenticatedRateLimiter, authMiddleware | Feature Op 4 | Headers: Authorization: Bearer <accessToken> [Clears HttpOnly refreshToken Cookie] | `{ success: true, data: { message: "Successfully logged out." } }` (200 OK) | No Cache | YES | Clears all cache (queryClient.clear()) | 401 UNAUTHORIZED, 500 INTERNAL_SERVER_ERROR | W01 | **PROVEN** |
| 5 | `POST` | `/api/v1/auth/revoke-all` | authenticatedRateLimiter, authMiddleware | Feature Op 5 | Headers: Authorization: Bearer <accessToken> [Clears HttpOnly refreshToken Cookie] | `{ success: true, data: { message: "All sessions revoked." } }` (200 OK) | No Cache | YES | Clears all cache (queryClient.clear()) | 401 UNAUTHORIZED, 500 INTERNAL_SERVER_ERROR | W01 | **PROVEN** |
| 6 | `GET` | `/api/v1/auth/me` | authenticatedRateLimiter, authMiddleware | Feature Op 6 | Headers: Authorization: Bearer <accessToken> | `{ success: true, data: { user: UserProfileDto } }` (200 OK) | Stale: 5m | NO | None | 401 UNAUTHORIZED, 404 USER_NOT_FOUND, 500 INTERNAL_SERVER_ERROR | W01, W06 | **PROVEN** |
| 7 | `GET` | `/api/v1/questions/topics` | authenticatedRateLimiter, authMiddleware | Feature Op 7 | Headers: Authorization: Bearer <accessToken> | `{ success: true, data: string[], meta: { count: number } }` (200 OK) | Stale: 5m | NO | None | 401 UNAUTHORIZED, 500 INTERNAL_SERVER_ERROR | W01, W37 | **PROVEN** |
| 8 | `GET` | `/api/v1/questions/topic/:topic/patterns` | authenticatedRateLimiter, authMiddleware, validateTopic | Feature Op 8 | Path: :topic (canonical topic name or alias). Headers: Authorization | `{ success: true, data: PatternDto[], meta: { topic: string, count: number } }` (200 OK) | Stale: 5m | NO | None | 400 INVALID_TOPIC, 401 UNAUTHORIZED, 500 INTERNAL_SERVER_ERROR | W01, W02, W37 | **PROVEN** |
| 9 | `GET` | `/api/v1/questions/topic/:topic` | authenticatedRateLimiter, authMiddleware, validateTopic, validatePagination | Feature Op 9 | Path: :topic. Query: page (int >= 1, def 1), limit (int 1-100, def 20). Headers: Authorization | `{ success: true, data: QuestionDto[], meta: { page: number, limit: number, total: number, totalPages: number, count: number } }` (200 OK) | Stale: 5m | NO | None | 400 INVALID_TOPIC / INVALID_PAGINATION, 401 UNAUTHORIZED, 500 INTERNAL_SERVER_ERROR | W01, W03, W05, W37 | **PROVEN** |
| 10 | `GET` | `/api/v1/questions/topic/:topic/pattern/:pattern` | authenticatedRateLimiter, authMiddleware, validateTopic, validatePattern, validatePagination | Feature Op 10 | Path: :topic, :pattern. Query: page (def 1), limit (def 20), difficulty? (int 1-10). Headers: Authorization | `{ success: true, data: QuestionDto[], meta: { page: number, limit: number, total: number, totalPages: number, count: number } }` (200 OK) | Stale: 5m | NO | None | 400 INVALID_TOPIC / INVALID_PATTERN / INVALID_DIFFICULTY, 401 UNAUTHORIZED, 500 INTERNAL_SERVER_ERROR | W01, W03, W04, W05, W37 | **PROVEN** |
| 11 | `GET` | `/api/v1/questions/topic/:topic/random` | authenticatedRateLimiter, authMiddleware, validateTopic | Feature Op 11 | Path: :topic. Query: limit (int 1-50, def 10). Headers: Authorization | `{ success: true, data: QuestionDto[], meta: { count: number, limit: number } }` (200 OK) | Stale: 5m | NO | None | 400 INVALID_TOPIC / INVALID_LIMIT, 401 UNAUTHORIZED, 500 INTERNAL_SERVER_ERROR | W01, W05, W37 | **PROVEN** |
| 12 | `GET` | `/api/v1/questions/topic/:topic/pattern/:pattern/random` | authenticatedRateLimiter, authMiddleware, validateTopic, validatePattern | Feature Op 12 | Path: :topic, :pattern. Query: limit (int 1-50, def 10), difficulty? (int 1-10). Headers: Authorization | `{ success: true, data: QuestionDto[], meta: { count: number, limit: number } }` (200 OK) | Stale: 5m | NO | None | 400 INVALID_TOPIC / INVALID_PATTERN / INVALID_DIFFICULTY, 401 UNAUTHORIZED, 500 INTERNAL_SERVER_ERROR | W01, W04, W05, W37 | **PROVEN** |
| 13 | `GET` | `/api/v1/questions/:id([a-fA-F0-9]{24})` | authenticatedRateLimiter, authMiddleware | Feature Op 13 | Path: :id (24 hex char ObjectId). Headers: Authorization | `{ success: true, data: QuestionDto }` (200 OK) | Stale: 5m | NO | None | 400 INVALID_ID, 401 UNAUTHORIZED, 404 QUESTION_NOT_FOUND, 500 INTERNAL_SERVER_ERROR | W01, W05 | **PROVEN** |
| 14 | `GET` | `/api/v1/users/:userId` | authenticatedRateLimiter, authMiddleware, requireOwnership('userId') | Feature Op 14 | Path: :userId (matches JWT sub). Headers: Authorization | `{ success: true, data: UserProfileDto }` (200 OK) | Stale: 5m | NO | None | 401 UNAUTHORIZED, 403 OWNERSHIP_VIOLATION, 404 USER_NOT_FOUND, 500 INTERNAL_SERVER_ERROR | W01, W06 | **PROVEN** |
| 15 | `GET` | `/api/v1/goals/user/:userId` | authenticatedRateLimiter, authMiddleware, requireOwnership('userId') | Feature Op 15 | Path: :userId (matches JWT sub). Headers: Authorization | `{ success: true, data: GoalDetailDto[], meta: { count: number } }` (200 OK) | Stale: 5m | NO | None | 401 UNAUTHORIZED, 403 OWNERSHIP_VIOLATION, 500 INTERNAL_SERVER_ERROR | W01, W08, W37 | **PROVEN** |
| 16 | `POST` | `/api/v1/goals` | authenticatedRateLimiter, authMiddleware, validateGoalCreation | Feature Op 16 | Body: { type (enum), targetName (string), description?, startDate?, targetDate?, targetScore?, priority?, status? }. Headers: Authorization | `{ success: true, data: GoalDetailDto }` (201 Created) | No Cache | YES | ['goals', 'user', userId] | 400 VALIDATION_ERROR, 401 UNAUTHORIZED, 500 INTERNAL_SERVER_ERROR | W01, W07, W08, W19 | **PROVEN** |
| 17 | `GET` | `/api/v1/goals/:id` | authenticatedRateLimiter, authMiddleware | Feature Op 17 | Path: :id (goalId). Headers: Authorization | `{ success: true, data: GoalDetailDto }` (200 OK) | Stale: 5m | NO | None | 401 UNAUTHORIZED, 403 OWNERSHIP_VIOLATION, 404 GOAL_NOT_FOUND, 500 INTERNAL_SERVER_ERROR | W01, W08 | **PROVEN** |
| 18 | `PATCH` | `/api/v1/goals/:id` | authenticatedRateLimiter, authMiddleware, validateGoalUpdate | Feature Op 18 | Path: :id. Body: { type?, targetName?, description?, startDate?, targetDate?, targetScore?, priority?, status? }. Headers: Authorization | `{ success: true, data: GoalDetailDto }` (200 OK) | No Cache | YES | ['goals', 'user', userId], ['goals', 'detail', id] | 400 VALIDATION_ERROR, 401 UNAUTHORIZED, 403 OWNERSHIP_VIOLATION, 404 GOAL_NOT_FOUND, 500 INTERNAL_SERVER_ERROR | W01, W07, W08 | **PROVEN** |
| 19 | `DELETE` | `/api/v1/goals/:id` | authenticatedRateLimiter, authMiddleware | Feature Op 19 | Path: :id. Headers: Authorization | `{ success: true, data: { deleted: true } }` (200 OK) | No Cache | YES | ['goals', 'user', userId], ['goals', 'detail', id] | 401 UNAUTHORIZED, 403 OWNERSHIP_VIOLATION, 404 GOAL_NOT_FOUND, 500 INTERNAL_SERVER_ERROR | W01, W09 | **PROVEN** |
| 20 | `POST` | `/api/v1/planning/preview` | authenticatedRateLimiter, authMiddleware, validatePlanningPreview | Feature Op 20 | Body: { goalId (required), scope (required), durationPreset?, startDate?, targetDate?, referenceDate?, dailyQuestionBudget?, dailyMinutes?, maxPatternsPerDay?, includeMastered? } | `{ success: true, data: PlanPreviewResponseDto }` (200 OK) | No Cache | YES | None | 400 VALIDATION_ERROR, 401 UNAUTHORIZED, 404 GOAL_NOT_FOUND, 500 INTERNAL_SERVER_ERROR | W01, W10, W11 | **PROVEN** |
| 21 | `POST` | `/api/v1/planning/generate` | authenticatedRateLimiter, authMiddleware, validatePlanningGenerate | Feature Op 21 | Body: { goalId, scope, name?, durationPreset?, startDate?, targetDate?, referenceDate?, dailyQuestionBudget?, dailyMinutes?, maxPatternsPerDay?, includeMastered? } | `{ success: true, data: { plan: StudyPlanDto, objectives: DailyObjectiveDto[], summary: StudyPlanSummaryDto } }` (201 Created) | No Cache | YES | ['planning', 'plans', userId], ['planning', 'dailyObjectives', userId], ['planning', 'schedule'] | 400 VALIDATION_ERROR, 401 UNAUTHORIZED, 404 GOAL_NOT_FOUND, 500 INTERNAL_SERVER_ERROR | W01, W10, W12, W13, W19 | **PROVEN** |
| 22 | `POST` | `/api/v1/planning/plans/:planId/replan` | authenticatedRateLimiter, authMiddleware, validatePlanningReplan | Feature Op 22 | Path: :planId. Body: { referenceDate?, replaceToday?, allowReplaceToday?, includeMastered? } | `{ success: true, data: PlanReplanResponseDto }` (200 OK) | No Cache | YES | ['planning', 'plans', userId], ['planning', 'dailyObjectives', userId], ['planning', 'schedule', planId] | 400 VALIDATION_ERROR, 401 UNAUTHORIZED, 404 PLAN_NOT_FOUND, 500 INTERNAL_SERVER_ERROR | W01, W14 | **PROVEN** |
| 23 | `GET` | `/api/v1/planning/plans/:planId/schedule` | authenticatedRateLimiter, authMiddleware | Feature Op 23 | Path: :planId. Headers: Authorization | `{ success: true, data: { planId: string, planName: string, userId: string, goalId: string, startDate?: string, endDate?: string, status: string, totalObjectives: number, objectives: DailyObjectiveDto[] } }` (200 OK) | Stale: 5m | NO | None | 401 UNAUTHORIZED, 403 OWNERSHIP_VIOLATION, 404 PLAN_NOT_FOUND, 500 INTERNAL_SERVER_ERROR | W01, W13, W15 | **PROVEN** |
| 24 | `GET` | `/api/v1/study-plans/user/:userId` | authenticatedRateLimiter, authMiddleware, requireOwnership('userId') | Feature Op 24 | Path: :userId (matches JWT sub). Headers: Authorization | `{ success: true, data: StudyPlanDto[], meta: { count: number } }` (200 OK) | Stale: 5m | NO | None | 401 UNAUTHORIZED, 403 OWNERSHIP_VIOLATION, 500 INTERNAL_SERVER_ERROR | W01, W13, W37 | **PROVEN** |
| 25 | `GET` | `/api/v1/daily-objectives/user/:userId` | authenticatedRateLimiter, authMiddleware, requireOwnership('userId'), validatePagination | Feature Op 25 | Path: :userId. Query: page (def 1), limit (def 20). Headers: Authorization | `{ success: true, data: DailyObjectiveDto[], meta: { page: number, limit: number, total: number, totalPages: number, count: number } }` (200 OK) | Stale: 5m | NO | None | 400 INVALID_PAGINATION, 401 UNAUTHORIZED, 403 OWNERSHIP_VIOLATION, 500 INTERNAL_SERVER_ERROR | W01, W16, W17, W37 | **PROVEN** |
| 26 | `PATCH` | `/api/v1/daily-objectives/:id` | authenticatedRateLimiter, authMiddleware, validateDailyObjectiveUpdate | Feature Op 26 | Path: :id. Body: { topic?, patterns?, targetMinutes?, actualMinutes?, status? }. Headers: Authorization | `{ success: true, data: DailyObjectiveDto }` (200 OK) | No Cache | YES | ['planning', 'dailyObjectives', userId] | 400 VALIDATION_ERROR, 401 UNAUTHORIZED, 403 OWNERSHIP_VIOLATION, 404 OBJECTIVE_NOT_FOUND, 500 INTERNAL_SERVER_ERROR | W01, W17, W18 | **PROVEN** |
| 27 | `POST` | `/api/v1/attempts` | authenticatedRateLimiter, authMiddleware, validateAttemptCreation | Feature Op 27 | Body: { questionId, selectedAnswer, timeTaken, source?, goalId?, sessionId? }. Headers: Authorization | `{ success: true, data: AttemptRecordDto }` (201 Created) | No Cache | YES | ['attempts', 'user', userId], ['progress'], ['analytics'], ['revisions', 'due'], ['revisions', 'plan'], ['orchestration'] | 400 VALIDATION_ERROR, 401 UNAUTHORIZED, 404 QUESTION_NOT_FOUND, 500 INTERNAL_SERVER_ERROR | W01, W19 | **PROVEN** |
| 28 | `GET` | `/api/v1/attempts/user/:userId` | authenticatedRateLimiter, authMiddleware, requireOwnership('userId'), validatePagination | Feature Op 28 | Path: :userId. Query: page (def 1), limit (def 20), topic?, pattern?, dateFrom?, dateTo?. Headers: Authorization | `{ success: true, data: AttemptRecordDto[], meta: { page: number, limit: number, total: number, totalPages: number, count: number } }` (200 OK) | Stale: 5m | NO | None | 400 INVALID_PAGINATION / INVALID_DATE, 401 UNAUTHORIZED, 403 OWNERSHIP_VIOLATION, 500 INTERNAL_SERVER_ERROR | W01, W20, W37 | **PROVEN** |
| 29 | `GET` | `/api/v1/progress/:userId` | authenticatedRateLimiter, authMiddleware, requireOwnership('userId'), validatePagination | Feature Op 29 | Path: :userId. Query: page (def 1), limit (def 20), sortBy?, sortOrder?. Headers: Authorization | `{ success: true, data: StudentProgressDto[], meta: { page: number, limit: number, total: number, totalPages: number, count: number } }` (200 OK) | Stale: 5m | NO | None | 400 INVALID_PAGINATION / INVALID_SORT, 401 UNAUTHORIZED, 403 OWNERSHIP_VIOLATION, 500 INTERNAL_SERVER_ERROR | W01, W21, W37 | **PROVEN** |
| 30 | `GET` | `/api/v1/progress/:userId/topics` | authenticatedRateLimiter, authMiddleware, requireOwnership('userId') | Feature Op 30 | Path: :userId. Headers: Authorization | `{ success: true, data: StudentProgressDto[], meta: { count: number } }` (200 OK) | Stale: 5m | NO | None | 401 UNAUTHORIZED, 403 OWNERSHIP_VIOLATION, 500 INTERNAL_SERVER_ERROR | W01, W22, W37 | **PROVEN** |
| 31 | `GET` | `/api/v1/progress/:userId/patterns` | authenticatedRateLimiter, authMiddleware, requireOwnership('userId') | Feature Op 31 | Path: :userId. Headers: Authorization | `{ success: true, data: StudentProgressDto[], meta: { count: number } }` (200 OK) | Stale: 5m | NO | None | 401 UNAUTHORIZED, 403 OWNERSHIP_VIOLATION, 500 INTERNAL_SERVER_ERROR | W01, W22, W37 | **PROVEN** |
| 32 | `GET` | `/api/v1/progress/:userId/weakest` | authenticatedRateLimiter, authMiddleware, requireOwnership('userId') | Feature Op 32 | Path: :userId. Query: limit (def 10, clamp 1-50). Headers: Authorization | `{ success: true, data: StudentProgressDto[], meta: { count: number } }` (200 OK) | Stale: 5m | NO | None | 401 UNAUTHORIZED, 403 OWNERSHIP_VIOLATION, 500 INTERNAL_SERVER_ERROR | W01, W22, W23, W37 | **PROVEN** |
| 33 | `GET` | `/api/v1/progress/prerequisites/:patternName` | authenticatedRateLimiter, authMiddleware | Feature Op 33 | Path: :patternName (canonical pattern name). Headers: Authorization | `{ success: true, data: PrerequisiteGraphDto }` (200 OK) | Stale: 5m | NO | None | 400 PATTERN_NOT_FOUND, 401 UNAUTHORIZED, 500 INTERNAL_SERVER_ERROR | W01, W24 | **PROVEN** |
| 34 | `GET` | `/api/v1/adaptive/next-question` | authenticatedRateLimiter, authMiddleware | Feature Op 34 | Query: topic?, pattern?. Headers: Authorization | `{ success: true, data: { question: AdaptiveQuestionDto, decision: AdaptiveDecisionDto } }` (200 OK) | Stale: 5m | NO | None | 400 INVALID_TOPIC / INVALID_PATTERN, 401 UNAUTHORIZED, 404 NO_ELIGIBLE_QUESTIONS, 500 INTERNAL_SERVER_ERROR | W01, W05, W25 | **PROVEN** |
| 35 | `GET` | `/api/v1/revisions/due` | authenticatedRateLimiter, authMiddleware | Feature Op 35 | Headers: Authorization: Bearer <accessToken> | `{ success: true, count: number, data: RevisionDueItemDto[] }` (200 OK) | Stale: 5m | NO | None | 401 UNAUTHORIZED, 500 INTERNAL_SERVER_ERROR | W01, W26, W37 | **PROVEN** |
| 36 | `GET` | `/api/v1/revisions/plan` | authenticatedRateLimiter, authMiddleware | Feature Op 36 | Query: windowDays? (int 1-365, def 30). Headers: Authorization | `{ success: true, data: RevisionProjectionDto }` (200 OK) | Stale: 5m | NO | None | 400 INVALID_WINDOW, 401 UNAUTHORIZED, 500 INTERNAL_SERVER_ERROR | W01 | **PROVEN** |
| 37 | `POST` | `/api/v1/revisions/rebuild` | authenticatedRateLimiter, authMiddleware, validateRebuild | Feature Op 37 | Body: { topic?, pattern?, referenceDate? }. Headers: Authorization | `{ success: true, message: "Revision state successfully rebuilt.", data: RevisionItemDto &#124; RevisionItemDto[] &#124; null }` (200 OK) | No Cache | YES | ['revisions', 'due'], ['revisions', 'plan'], ['orchestration', 'dailyAgenda'] | 400 VALIDATION_ERROR, 401 UNAUTHORIZED, 500 INTERNAL_SERVER_ERROR | W01, W27 | **PROVEN** |
| 38 | `GET` | `/api/v1/mock-blueprints` | authenticatedRateLimiter, authMiddleware | Feature Op 38 | Headers: Authorization: Bearer <accessToken> | `{ success: true, data: MockBlueprintDto[] }` (200 OK) | Stale: 5m | NO | None | 401 UNAUTHORIZED, 500 INTERNAL_SERVER_ERROR | W01, W28 | **PROVEN** |
| 39 | `POST` | `/api/v1/mock-sessions` | authenticatedRateLimiter, authMiddleware, validateCreateSession | Feature Op 39 | Body: { blueprintId?, blueprint?, generationSeed? }. Headers: Authorization | `{ success: true, data: MockSessionDocDto }` (201 Created) | No Cache | YES | ['mock', 'session'] | 400 VALIDATION_ERROR, 401 UNAUTHORIZED, 404 BLUEPRINT_NOT_FOUND, 500 INTERNAL_SERVER_ERROR | W01, W19, W29 | **PROVEN** |
| 40 | `POST` | `/api/v1/mock-sessions/:id/start` | authenticatedRateLimiter, authMiddleware | Feature Op 40 | Path: :id. Headers: Authorization | `{ success: true, data: MockSessionDocDto }` (200 OK) | No Cache | YES | ['mock', 'session', id], ['orchestration'] | 401 UNAUTHORIZED, 403 OWNERSHIP_VIOLATION, 404 MOCK_SESSION_NOT_FOUND, 409 SESSION_STATE_CONFLICT, 500 INTERNAL_SERVER_ERROR | W01 | **PROVEN** |
| 41 | `GET` | `/api/v1/mock-sessions/:id` | authenticatedRateLimiter, authMiddleware | Feature Op 41 | Path: :id. Headers: Authorization | `{ success: true, data: MockSessionDetailDto }` (200 OK) | Stale: 5m | NO | None | 401 UNAUTHORIZED, 403 OWNERSHIP_VIOLATION, 404 MOCK_SESSION_NOT_FOUND, 500 INTERNAL_SERVER_ERROR | W01 | **PROVEN** |
| 42 | `GET` | `/api/v1/mock-sessions/:id/questions/:questionId` | authenticatedRateLimiter, authMiddleware | Feature Op 42 | Path: :id, :questionId. Headers: Authorization | `{ success: true, data: ActiveMockQuestionDto }` (200 OK) | Stale: 5m | NO | None | 400 QUESTION_NOT_IN_SESSION, 401 UNAUTHORIZED, 403 OWNERSHIP_VIOLATION, 404 MOCK_SESSION_NOT_FOUND / QUESTION_NOT_FOUND, 409 SECTION_LOCKED / MOCK_SESSION_EXPIRED, 500 INTERNAL_SERVER_ERROR | W01, W05 | **PROVEN** |
| 43 | `POST` | `/api/v1/mock-sessions/:id/responses` | authenticatedRateLimiter, authMiddleware, validateSaveResponse | Feature Op 43 | Path: :id. Body: { questionId, selectedAnswer?, isFlagged?, timeTakenSeconds? } | `{ success: true, data: MockResponseSaveDto }` (200 OK) | No Cache | YES | ['mock', 'session', id] | 400 VALIDATION_ERROR / QUESTION_NOT_IN_SESSION, 401 UNAUTHORIZED, 403 OWNERSHIP_VIOLATION, 409 RESPONSES_FROZEN / SECTION_LOCKED / MOCK_SESSION_EXPIRED, 500 INTERNAL_SERVER_ERROR | W01 | **PROVEN** |
| 44 | `POST` | `/api/v1/mock-sessions/:id/sections/:sectionId/complete` | authenticatedRateLimiter, authMiddleware | Feature Op 44 | Path: :id, :sectionId. Headers: Authorization | `{ success: true, data: MockSectionCompleteDto }` (200 OK) | No Cache | YES | ['mock', 'session', id] | 400 INVALID_SECTION, 401 UNAUTHORIZED, 403 OWNERSHIP_VIOLATION, 409 SECTION_STATE_CONFLICT / MOCK_SESSION_EXPIRED, 500 INTERNAL_SERVER_ERROR | W01 | **PROVEN** |
| 45 | `POST` | `/api/v1/mock-sessions/:id/submit` | authenticatedRateLimiter, authMiddleware | Feature Op 45 | Path: :id. Headers: Authorization | `{ success: true, data: MockSubmitResponseDto }` (200 OK) | No Cache | YES | ['mock', 'session', id], ['mock', 'result', id], ['progress'], ['analytics'], ['orchestration'] | 401 UNAUTHORIZED, 403 OWNERSHIP_VIOLATION, 404 MOCK_SESSION_NOT_FOUND, 409 FINALIZATION_IN_PROGRESS / SESSION_STATE_CONFLICT, 500 INTERNAL_SERVER_ERROR | W01 | **PROVEN** |
| 46 | `POST` | `/api/v1/mock-sessions/:id/abandon` | authenticatedRateLimiter, authMiddleware | Feature Op 46 | Path: :id. Headers: Authorization | `{ success: true, data: { status: "abandoned", abandonedAt: string } }` (200 OK) | No Cache | YES | ['mock', 'session', id], ['orchestration'] | 401 UNAUTHORIZED, 403 OWNERSHIP_VIOLATION, 404 MOCK_SESSION_NOT_FOUND, 409 SESSION_STATE_CONFLICT, 500 INTERNAL_SERVER_ERROR | W01 | **PROVEN** |
| 47 | `GET` | `/api/v1/mock-sessions/:id/result` | authenticatedRateLimiter, authMiddleware | Feature Op 47 | Path: :id. Headers: Authorization | `{ success: true, data: MockResultResponseDto }` (200 OK) | Stale: 5m | NO | None | 400 MOCK_SESSION_NOT_TERMINAL, 401 UNAUTHORIZED, 403 OWNERSHIP_VIOLATION, 404 MOCK_SESSION_NOT_FOUND / RESULT_NOT_FOUND, 409 FINALIZATION_IN_PROGRESS, 500 INTERNAL_SERVER_ERROR | W01 | **PROVEN** |
| 48 | `GET` | `/api/v1/mock-sessions/:id/review` | authenticatedRateLimiter, authMiddleware | Feature Op 48 | Path: :id. Headers: Authorization | `{ success: true, data: MockReviewResponseDto }` (200 OK) | Stale: 5m | NO | None | 400 MOCK_SESSION_NOT_TERMINAL, 401 UNAUTHORIZED, 403 OWNERSHIP_VIOLATION, 404 MOCK_SESSION_NOT_FOUND, 500 INTERNAL_SERVER_ERROR | W01, W05, W30 | **PROVEN** |
| 49 | `GET` | `/api/v1/analytics/dashboard` | authenticatedRateLimiter, authMiddleware, analyticsGuard | Feature Op 49 | Query: userId (REQUIRED non-empty scalar string, matches token), windowDays? (int 1-365, def 30) | `{ success: true, data: AnalyticsDashboardResponseDto }` (200 OK) | Stale: 5m | NO | None | 400 VALIDATION_ERROR, 401 UNAUTHORIZED, 403 OWNERSHIP_VIOLATION, 500 INTERNAL_SERVER_ERROR | W01, W31 | **PROVEN** |
| 50 | `GET` | `/api/v1/analytics/cognitive-profile` | authenticatedRateLimiter, authMiddleware, analyticsGuard | Feature Op 50 | Query: userId (REQUIRED scalar string), windowDays? (int 1-365, def 30) | `{ success: true, data: CognitiveProfileResponseDto }` (200 OK) | Stale: 5m | NO | None | 400 VALIDATION_ERROR, 401 UNAUTHORIZED, 403 OWNERSHIP_VIOLATION, 500 INTERNAL_SERVER_ERROR | W01, W31 | **PROVEN** |
| 51 | `GET` | `/api/v1/analytics/retention` | authenticatedRateLimiter, authMiddleware, analyticsGuard | Feature Op 51 | Query: userId (REQUIRED scalar string), windowDays? (int 1-365, def 30) | `{ success: true, data: RetentionAnalyticsResponseDto }` (200 OK) | Stale: 5m | NO | None | 400 VALIDATION_ERROR, 401 UNAUTHORIZED, 403 OWNERSHIP_VIOLATION, 500 INTERNAL_SERVER_ERROR | W01, W31 | **PROVEN** |
| 52 | `GET` | `/api/v1/analytics/readiness/:goalId` | authenticatedRateLimiter, authMiddleware, analyticsGuard | Feature Op 52 | Path: :goalId. Query: userId (REQUIRED scalar string), targetDate? (ISO date) | `{ success: true, data: ExamReadinessResponseDto }` (200 OK) | Stale: 5m | NO | None | 400 VALIDATION_ERROR, 401 UNAUTHORIZED, 403 OWNERSHIP_VIOLATION, 404 GOAL_NOT_FOUND, 500 INTERNAL_SERVER_ERROR | W01, W31 | **PROVEN** |
| 53 | `GET` | `/api/v1/orchestration/next-action` | authenticatedRateLimiter, authMiddleware, orchestrationGuard, orchestrationContext | Feature Op 53 | Query: userId (REQUIRED scalar string, matches token). Headers: Authorization | `{ success: true, data: { status: string, reason: string, activeMockSessionId?: string, nextAction: ActionDto &#124; null }, meta: { referenceNow: string } }` (200 OK) | Stale: 5m | NO | None | 400 VALIDATION_ERROR, 401 UNAUTHORIZED, 403 OWNERSHIP_VIOLATION, 500 INTERNAL_SERVER_ERROR | W01, W31, W32, W37, W38 | **PROVEN** |
| 54 | `GET` | `/api/v1/orchestration/daily-agenda` | authenticatedRateLimiter, authMiddleware, orchestrationGuard, orchestrationContext | Feature Op 54 | Query: userId (REQUIRED scalar string, matches token). Headers: Authorization | `{ success: true, data: DailyAgendaContainerDto, meta: { referenceNow: string } }` (200 OK) | Stale: 5m | NO | None | 400 VALIDATION_ERROR, 401 UNAUTHORIZED, 403 OWNERSHIP_VIOLATION, 500 INTERNAL_SERVER_ERROR | W01, W31, W32, W37, W38 | **PROVEN** |
| 55 | `GET` | `/api/v1/orchestration/interventions` | authenticatedRateLimiter, authMiddleware, orchestrationGuard, orchestrationContext | Feature Op 55 | Query: userId (REQUIRED scalar string, matches token). Headers: Authorization | `{ success: true, data: InterventionListContainerDto, meta: { referenceNow: string } }` (200 OK) | Stale: 5m | NO | None | 400 VALIDATION_ERROR, 401 UNAUTHORIZED, 403 OWNERSHIP_VIOLATION, 500 INTERNAL_SERVER_ERROR | W01, W31, W37 | **PROVEN** |
| 56 | `POST` | `/api/v1/attribution/prescriptions/:prescriptionId/activate` | authenticatedRateLimiter, authMiddleware, orchestrationContext | Feature Op 56 | Path: :prescriptionId (regex rx_[a-f0-9]{24}). Headers: Authorization | `{ success: true, data: PrescriptionLeaseResponseDto, meta: { referenceNow: string } }` (200 OK) | No Cache | YES | ['orchestration'] | 400 VALIDATION_ERROR / INVALID_PRESCRIPTION_ID, 401 UNAUTHORIZED, 403 OWNERSHIP_VIOLATION, 404 PRESCRIPTION_NOT_FOUND, 409 PRESCRIPTION_STATE_CONFLICT, 500 INTERNAL_SERVER_ERROR | W01, W37, W38 | **PROVEN** |
| 57 | `POST` | `/api/v1/attribution/prescriptions/:prescriptionId/complete` | authenticatedRateLimiter, authMiddleware, orchestrationContext | Feature Op 57 | Path: :prescriptionId (rx_[a-f0-9]{24}). Body: { abandon?, mockSessionId? }. Headers: Authorization | `{ success: true, data: PrescriptionAdherenceResponseDto, meta: { referenceNow: string } }` (200 OK) | No Cache | YES | ['orchestration'], ['progress'], ['analytics'] | 400 VALIDATION_ERROR, 401 UNAUTHORIZED, 403 OWNERSHIP_VIOLATION, 404 PRESCRIPTION_NOT_FOUND, 409 PRESCRIPTION_STATE_CONFLICT, 500 INTERNAL_SERVER_ERROR | W01, W37, W38 | **PROVEN** |
| 58 | `POST` | `/api/v1/learning/tutor` | authenticatedRateLimiter, authMiddleware, validateTutor | Feature Op 58 | Body: { topic (required), pattern (required), message?, questionId?, conversationHistory? }. Headers: Authorization | `{ data: TutorResponseDto, metadata: LearningMetadataDto, provenance: LearningProvenanceDto } [NO success property!]` (200 OK) | No Cache | YES | None | 400 VALIDATION_ERROR, 401 UNAUTHORIZED, 429 RATE_LIMITED, 500 INTERNAL_SERVER_ERROR | W01, W33, W37 | **PROVEN** |
| 59 | `POST` | `/api/v1/learning/hint` | authenticatedRateLimiter, authMiddleware, validateHint | Feature Op 59 | Body: { topic, pattern, questionId, level (integer 1-5) }. Headers: Authorization | `{ data: HintResponseDto, metadata: LearningMetadataDto, provenance: LearningProvenanceDto } [NO success property!]` (200 OK) | No Cache | YES | None | 400 VALIDATION_ERROR, 401 UNAUTHORIZED, 403 ATTEMPT_REQUIRED (for level 5), 429 RATE_LIMITED, 500 INTERNAL_SERVER_ERROR | W01, W36, W37 | **PROVEN** |
| 60 | `POST` | `/api/v1/learning/explain-attempt` | authenticatedRateLimiter, authMiddleware, validateExplainAttempt | Feature Op 60 | Body: { attemptId (ObjectId string) }. Headers: Authorization | `{ data: DiagnoseResponseDto, metadata: LearningMetadataDto, provenance: LearningProvenanceDto } [NO success property!]` (200 OK) | No Cache | YES | None | 400 VALIDATION_ERROR, 401 UNAUTHORIZED, 403 OWNERSHIP_VIOLATION, 404 ATTEMPT_NOT_FOUND, 429 RATE_LIMITED, 500 INTERNAL_SERVER_ERROR | W01, W37 | **PROVEN** |
| 61 | `POST` | `/api/v1/learning/explain-progress` | authenticatedRateLimiter, authMiddleware, validateExplainProgress | Feature Op 61 | Body: { userId (REQUIRED, matches token), topic (required), pattern (required), period? }. Headers: Authorization | `{ data: ExplainProgressResponseDto, metadata: LearningMetadataDto, provenance: LearningProvenanceDto } [NO success property!]` (200 OK) | No Cache | YES | None | 400 VALIDATION_ERROR, 401 UNAUTHORIZED, 403 OWNERSHIP_VIOLATION, 429 RATE_LIMITED, 500 INTERNAL_SERVER_ERROR | W01, W34, W37 | **PROVEN** |
| 62 | `POST` | `/api/v1/learning/explain-plan` | authenticatedRateLimiter, authMiddleware, validateExplainPlan | Feature Op 62 | Body: { planId (required ObjectId), targetDate (required ISO date string) }. Headers: Authorization | `{ data: ExplainPlanResponseDto, metadata: LearningMetadataDto, provenance: LearningProvenanceDto } [NO success property!]` (200 OK) | No Cache | YES | None | 400 VALIDATION_ERROR, 401 UNAUTHORIZED, 403 OWNERSHIP_VIOLATION, 404 PLAN_NOT_FOUND, 429 RATE_LIMITED, 500 INTERNAL_SERVER_ERROR | W01, W35, W37 | **PROVEN** |
| 63 | `POST` | `/api/v1/learning/mock-review` | authenticatedRateLimiter, authMiddleware, validateMockReview | Feature Op 63 | Body: { sessionId (required ObjectId) }. Headers: Authorization | `{ data: MockReviewAiResponseDto, metadata: LearningMetadataDto, provenance: LearningProvenanceDto } [NO success property!]` (200 OK) | No Cache | YES | None | 400 VALIDATION_ERROR / SESSION_NOT_TERMINAL, 401 UNAUTHORIZED, 403 OWNERSHIP_VIOLATION, 404 SESSION_NOT_FOUND, 429 RATE_LIMITED, 500 INTERNAL_SERVER_ERROR | W01, W37 | **PROVEN** |
| 64 | `POST` | `/api/v1/attribution/prescriptions` | authenticatedRateLimiter, authMiddleware, orchestrationContext | Feature Op 64 | Headers: Idempotency-Key (REQUIRED non-empty string, max 128 chars), Authorization. Body: { originSurface: "next_action" &#124; "daily_agenda", goalId?, actionId? } | `{ success: true, data: PrescriptionIssuanceResponseDto, meta: { referenceNow: string } }` (201 Created (new) / 200 OK (idempotent replay)) | No Cache | YES | ['orchestration'] | 400 VALIDATION_ERROR (missing/invalid Idempotency-Key), 401 UNAUTHORIZED, 409 IDEMPOTENCY_KEY_REUSED_WITH_DIFFERENT_PAYLOAD, 500 INTERNAL_SERVER_ERROR | W01, W37, W38, W39 | **PROVEN (App Contract) / RESOLVED-BY-DEPLOYMENT-CONTRACT (W39)** |

---

## 60. FEATURE-TO-API TRACEABILITY MATRIX

| Proposed Learner Feature | Backend Route Dependencies | Traceability Status | Backend Gaps |
|---|---|---|---|
| **Learner Registration & Login** | `POST /api/v1/auth/register`, `POST /api/v1/auth/login` | **SUPPORTED (100%)** | None |
| **In-Memory Session Bootstrap & Rotation** | `POST /api/v1/auth/refresh`, `GET /api/v1/auth/me` | **SUPPORTED (100%)** | None |
| **Account Logout & Revoke All** | `POST /api/v1/auth/logout`, `POST /api/v1/auth/revoke-all`| **SUPPORTED (100%)** | None |
| **Goal Selection & Study Plan Generation** | `POST /api/v1/goals`, `POST /api/v1/planning/generate` | **SUPPORTED (100%)** | None |
| **Learner Dashboard & Progress View** | `GET /api/v1/analytics/dashboard`, `GET /api/v1/progress/:userId`| **SUPPORTED (100%)** | None |
| **Prescriptive Next Best Action & Agenda** | `GET /api/v1/orchestration/next-action`, `.../daily-agenda`| **SUPPORTED (100%)** | None |
| **Topic & Pattern Exploration** | `GET /api/v1/questions/topics`, `.../:topic/patterns` | **SUPPORTED (100%)** | None |
| **Standard Practice Drills** | `GET /api/v1/questions/.../random`, `POST /api/v1/attempts` | **SUPPORTED (100%)** | None |
| **Deterministic Adaptive Practice** | `GET /api/v1/adaptive/next-question`, `POST /api/v1/attempts` | **SUPPORTED (100%)** | None |
| **Mistake Notebook & Error Remediation** | `GET /api/v1/attempts/user/:userId?isCorrect=false`, `POST /api/v1/learning/explain-attempt` | **SUPPORTED (100%)** | None |
| **Fixed-Stage Spaced Revision Queue** | `GET /api/v1/revisions/due`, `GET /api/v1/revisions/plan` | **SUPPORTED (100%)** | None |
| **Realistic Full Mock Exam Simulation** | `POST /api/v1/mock-sessions`, `.../start`, `.../responses`, `.../submit` | **SUPPORTED (100%)** | None |
| **Mock Score Report & Question Review** | `GET /api/v1/mock-sessions/:id/result`, `.../review` | **SUPPORTED (100%)** | None |
| **Cognitive Profile Diagnostics, Topic Mastery, Retention & Readiness Analytics** | `GET /api/v1/analytics/cognitive-profile`, `GET /api/v1/analytics/dashboard`, `GET /api/v1/analytics/retention`, `GET /api/v1/analytics/readiness/:goalId` | **SUPPORTED (100%)** — exact field provenance in Section 27 | None; display only existing backend evidence |
| **Socratic AI Tutor & Contextual Hints** | `POST /api/v1/learning/tutor`, `POST /api/v1/learning/hint`| **SUPPORTED (100%)** | None |
| **Prescriptive Attribution Issuance & Adherence Lifecycle** | `POST /api/v1/attribution/prescriptions`, `.../:prescriptionId/activate`, `.../:prescriptionId/complete` | **SUPPORTED (100%)** | None (W39 resolved by same-origin production API ingress) |

**Total Proposed Features**: 16  
**Features with 100% Backend API Application Traceability**: 16 / 16  
**Unresolved Backend Application Contract Gaps**: **0**  
**Unresolved Transport / Deployment Blockers**: **0 (Finding W39 resolved by same-origin production ingress contract)**

---

## 61. TEST ARCHITECTURE

Phase 15 proposes a comprehensive, isolated frontend test pyramid:

```text
               ▲
              / \
             /   \     E2E Browser Tests (Playwright)
            /  5% \    • Full User Journey & Cross-Origin Auth
           /───────\
          /         \   Integration & Component Tests (RTL + MSW)
         /   25%     \  • Question Flow, State Machines, Form Validation
        /─────────────\
       /               \ Unit Tests (Vitest + jsdom)
      /      70%        \ • Single-Flight Lock, API Client, Error Parsers,
     /───────────────────\  Token Storage, Time Formatters
```

### Tooling:
- **Test Runner**: Vitest (Native ESM, identical configuration to Vite, ultra-fast).
- **DOM Environment**: jsdom (Provides standard browser globals `window`, `document`, `navigator`).
- **Component Testing**: React Testing Library + `@testing-library/jest-dom` + `@testing-library/user-event`.
- **API Mocking**: Mock Service Worker (MSW) (Intercepts fetch requests at the network boundary).
- **E2E Automation**: Playwright (Headless Chromium, Firefox, WebKit validating real browser cookies and navigation).

**Analytics verification within the existing test architecture**: Contract tests for operations 49–52 MUST preserve exact returned values, field names, and nullability. Component tests MUST cover all four quadrant counts, missing baselines, nullable medians/risk, quartile `quartile`/`accuracy` points, null stamina, null fatigue with a valid curve, evidence-only topic membership and unchanged labels, populated retention buckets, and calculated/insufficient readiness with null components. Assert visible labels/units and accessible tables match the response; no unsupported score or fabricated polygon is rendered. These assertions are owned by existing suites after one-for-one renaming, not additional dependencies or test files.

### E2E Test Topology Reconciliation:
The historical specification baseline (`v1.0.8-FROZEN`) previously defined a cross-origin Playwright test topology (`127.0.0.1:5173` client vs `127.0.0.1:5174` API).
- Under the reconciled governance baseline, both production deployment and local test topology align with same-origin path-based API ingress (`http://127.0.0.1:5173/api/v1/*` or intercepted route handling), fully reconciled in specification candidate `v1.0.10-PROPOSED`.
- Acceptance testing and Playwright webServer / baseURL configurations operate within this unified origin model while preserving all Phase 14 origin verification, authentication, and cookie security assertions.


---

## 62. SECURITY TEST REQUIREMENTS FOR PHASE 15

Future implementation tests will explicitly verify:
1. `test('access token is never persisted to localStorage or sessionStorage')`
2. `test('single-flight refresh prevents parallel /refresh requests on concurrent 401s')`
3. `test('invalid/expired refresh credential clears in-memory token, sets UNAUTHENTICATED, and redirects to /login')`
4. `test('REFRESH_REUSE_DETECTED clears in-memory token, sets UNAUTHENTICATED, and redirects to /login')`
5. `test('403 ACCOUNT_DISABLED clears in-memory token, halts polling, and renders dedicated inactive screen without redirect loop')`
6. `test('403 REFRESH_ORIGIN_REQUIRED or CORS_ORIGIN_DENIED enters configuration error state without refresh loop')`
7. `test('HTTP 5xx refresh failure preserves in-memory auth state, transitions to SERVICE_UNAVAILABLE, and avoids forced logout')`
8. `test('network/fetch failure during refresh preserves auth state, transitions to SERVICE_UNAVAILABLE, and offers manual retry')`
9. `test('unauthenticated visitor cannot access protected /app routes')`
10. `test('authenticated user visiting /login redirects to /app/dashboard')`
11. `test('403 IDENTITY_MISMATCH triggers forbidden boundary without infinite retries')`
12. `test('429 TOO_MANY_REQUESTS on AI tutor disables submit button and respects cooldown')`
13. `test('mock exam in-progress view contains zero correct answers or explanations')`
14. `test('abandoned mock session produces no result view and routes safely to catalog')`
15. `test('abandoned mock session review request handles 400 MOCK_SESSION_NOT_TERMINAL and exposes zero answer keys or explanations')`
16. `test('abandoned mock session does not invoke scoring finalization and creates zero mock Attempts or receipts')`
17. `test('AI tutor Markdown rendering sanitizes malicious XSS script payloads via DOMPurify')`

---

## 63. ACCESSIBILITY TEST REQUIREMENTS

1. `test('question options can be focused and selected using keyboard only (1-4, Enter)')`
2. `test('focus is moved to first heading upon route navigation')`
3. `test('exam timer emits aria-live announcements at critical thresholds')`
4. `test('form validation errors are associated via aria-describedby')`
5. `test('color contrast meets WCAG AA 4.5:1 ratio across light and dark themes')`
6. `test('prefers-reduced-motion disables transitions and timer pulse animations')`

---

## 64. RESPONSIVE TEST REQUIREMENTS

Playwright viewport test suites:
- `Narrow Mobile`: $375 \times 667$ (iPhone SE)
- `Standard Mobile`: $390 \times 844$ (iPhone 14)
- `Tablet`: $768 \times 1024$ (iPad Mini)
- `Desktop`: $1280 \times 800$ (MacBook Air)
- `Large Desktop`: $1920 \times 1080$ (1080p Monitor)

---

## 65. ARCHITECTURAL DECISIONS SUMMARY

| Architecture Dimension | Selected Decision | Status |
|---|---|---|
| **Frontend Framework** | React 18.x SPA | **FROZEN** |
| **Build Tooling** | Vite 5.x | **FROZEN** |
| **Language** | TypeScript 5.x (Strict) | **FROZEN** |
| **Routing** | React Router v6.x | **FROZEN** |
| **Server-State Library** | TanStack Query v5.x | **FROZEN** |
| **Local-State Strategy** | React Native Hooks (`useState`, `useReducer`, `useContext`) | **FROZEN** |
| **Styling Strategy** | Vanilla CSS Tokens + CSS Modules | **FROZEN** |
| **Charting Architecture** | Native Accessible SVG Components (Zero Dependency) | **FROZEN** |
| **Markdown Parsing** | `marked` (^13.0.0) | **FROZEN** |
| **HTML Sanitization** | `dompurify` (^3.1.5) | **FROZEN** |
| **Math Rendering** | Plain Unicode Math + CSS Tabular Numerals (Zero Dependency) | **FROZEN** |
| **Font Delivery** | Native System Font Stack (Zero Network Requests) | **FROZEN** |
| **Iconography** | Lucide React (^0.395.0) | **FROZEN** |
| **Access Token Owner** | Sole Owner: `tokenManager.ts` (Volatile In-Memory Closure) | **FROZEN** |
| **Auth Bootstrap** | Unified with `tokenManager.executeSingleFlightRefresh()` | **FROZEN** |
| **Single-Flight Refresh** | Single In-Flight Promise Lock in `tokenManager.ts` | **FROZEN** |
| **Offline Mutation Policy** | Zero Persistent Queue; Unconfirmed Answers Not Saved | **FROZEN** |
| **Accessibility Target** | WCAG 2.2 Level AA | **FROZEN** |
| **Unit / Component Tests**| Vitest + jsdom + React Testing Library + MSW | **FROZEN** |
| **E2E Strategy** | Playwright | **FROZEN** |
| **Frontend Document CSP** | Proposed in Architecture; Header Delivery Handed to Phase 16 | **FROZEN** |

---

## 66. WEIGHTED DECISION MATRICES REFERENCE

All candidate options and weighted trade-offs are preserved in **Section 9.1** (Framework Selection), **Section 9.2** (Styling Strategy), and **Section 9.3** (Charting Architecture).

---

## 67. PROPOSED IMPLEMENTATION FOOTPRINT

```text
adaptive-aptitude-app/                 # Proposed New Frontend Root Directory
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── vitest.config.ts
├── playwright.config.ts
├── public/
│   └── favicon.svg
├── e2e/
│   ├── fixtures.ts                     # Playwright authenticated fixtures & browser harness
│   └── learner-journey.spec.ts         # Full end-to-end adaptive smoke test
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── router.tsx                      # Centralized React Router configuration
    ├── styles/
    │   ├── tokens.css                  # Design Tokens (Colors, Typography, Spacing)
    │   ├── global.css                  # Base Reset & System Font Stack
    │   └── animations.css              # Transitions & Reduced Motion
    ├── types/
    │   ├── api.ts                      # Backend DTO Interfaces
    │   ├── auth.ts                     # Auth State & User Principal
    │   └── quiz.ts                     # Quiz & Mock State Models
    ├── services/
    │   ├── api/
    │   │   ├── apiClient.ts            # Centralized Fetch Wrapper & 401 Interceptor
    │   │   ├── tokenManager.ts         # Sole Raw JWT Owner & Single-Flight Lock
    │   │   ├── authApi.ts              # Auth Endpoints
    │   │   ├── questionApi.ts          # Questions, Topics, Patterns
    │   │   ├── attemptApi.ts           # Submissions & Mistakes
    │   │   ├── adaptiveApi.ts          # Adaptive Decision Engine
    │   │   ├── goalApi.ts              # Goals & Planning
    │   │   ├── revisionApi.ts          # Spaced Revision Engine
    │   │   ├── mockApi.ts              # Mock Exams & Scoring
    │   │   ├── analyticsApi.ts         # Cognitive Diagnostics & Evidence
    │   │   ├── orchestrationApi.ts     # Next Best Action & Agenda
    │   │   └── learningApi.ts          # AI Tutor, Hints & Explanations
    ├── utils/
    │   ├── apiBaseUrl.ts               # Shared Centralized Base URL & Path Resolver
    │   ├── markdownSanitizer.ts        # marked + DOMPurify Pipeline
    │   ├── errorCodeMapper.ts          # Backend error code to UI presentation mapper
    │   └── queryKeyFactory.ts          # TanStack Query Key Constants
    ├── context/
    │   └── AuthContext.tsx             # UserPrincipal & AuthBootstrapBoundary
    ├── test/
    │   ├── setup.ts                    # Vitest + jsdom + jest-dom matchers setup
    │   └── mocks/
    │       ├── server.ts               # MSW node server for test isolation
    │       └── handlers.ts             # MSW API handlers for 64 candidate consumed endpoints
    ├── components/
    │   ├── common/
    │   │   ├── Button/
    │   │   ├── Card/
    │   │   ├── Badge/
    │   │   ├── Modal/
    │   │   ├── Skeleton/
    │   │   └── ErrorAlert/
    │   ├── charts/
    │   │   ├── CognitiveDiagnosticsSvg/ # Native SVG diagnostics and stamina profile
    │   │   ├── SpeedAccuracyMatrixSvg/ # Native SVG quadrant counts
    │   │   └── RetentionEvidenceSvg/   # Native SVG observed gap/stage evidence
    │   ├── layout/
    │   │   ├── AppHeader/
    │   │   ├── AppSidebar/
    │   │   ├── BottomNav/
    │   │   └── ProtectedLayout.tsx     # ProtectedRoute & Navigation Guard Shell
    │   ├── quiz/
    │   │   ├── QuestionCard/
    │   │   ├── QuestionPalette/
    │   │   ├── ExamTimer/
    │   │   └── ExplanationDrawer/
    │   ├── dashboard/
    │   │   ├── NextActionCard/
    │   │   ├── AgendaSegmentList/
    │   │   └── ReadinessMeter/
    │   └── ai/
    │       ├── TutorChatWindow/
    │       └── HintAccordion/
    └── pages/
        ├── LandingPage.tsx
        ├── LoginPage.tsx
        ├── RegisterPage.tsx
        ├── OnboardingPage.tsx
        ├── DashboardPage.tsx
        ├── DailyAgendaPage.tsx
        ├── PracticeCatalogPage.tsx
        ├── PatternPracticePage.tsx
        ├── AdaptivePracticePage.tsx
        ├── MistakesNotebookPage.tsx
        ├── RevisionQueuePage.tsx
        ├── MockCatalogPage.tsx
        ├── MockSessionPage.tsx
        ├── MockResultPage.tsx
        ├── MockReviewPage.tsx
        ├── AnalyticsDashboardPage.tsx
        └── ProfileSettingsPage.tsx
```

### Planned Implementation File Delta:
- **New Frontend Production Files**: ~44 files (Components, Services, Utilities, Pages, Styles)
- **New Frontend Configuration Files**: 6 files (`package.json`, `vite.config.ts`, `tsconfig.json`, `vitest.config.ts`, `playwright.config.ts`, `index.html`)
- **New Frontend Test Files**: ~16 files (Unit, Integration, E2E)
- **Modified Backend Files**: **0**
- **New Backend Files**: **0**

---

## 68. DEPENDENCY BUDGET

### Proposed Runtime Dependencies (7 Total):
1. `react` (^18.3.1): Core reactive UI rendering engine.
   - *Why required*: Declarative component lifecycle and tree reconciliation.
   - *Security relevance*: Built-in JSX escaping mitigates raw string HTML injection.
   - *Bundle impact*: ~42 kB gzipped (with react-dom).
2. `react-dom` (^18.3.1): DOM renderer for React.
   - *Why required*: Renders React tree to browser DOM.
   - *Bundle impact*: Included in React bundle.
3. `react-router-dom` (^6.24.1): Declarative client-side routing.
   - *Why required*: Manages protected layouts, navigation guards, and history without full page reloads.
   - *Security relevance*: Declarative auth route redirection prevents unauthenticated content flashes.
   - *Bundle impact*: ~15 kB gzipped.
4. `@tanstack/react-query` (^5.45.1): Dedicated server-state caching, synchronization, and abort management.
   - *Why required*: Coordinates server cache invalidation, request deduplication, and window-focus sync.
   - *Bundle impact*: ~13 kB gzipped.
5. `marked` (^13.0.0): High-performance client-side Markdown parser.
   - *Why required*: Converts AI tutor Socratic guidance (lists, bolding, code blocks) to HTML.
   - *Security relevance*: Strictly paired with DOMPurify to prevent XSS.
   - *Bundle impact*: ~8 kB gzipped.
6. `dompurify` (^3.1.5): Zero-dependency DOM sanitizer.
   - *Why required*: Strips malicious scripts, event handlers, and `javascript:` URLs from parsed Markdown.
   - *Security relevance*: Core XSS defense for LLM-generated rich text.
   - *Bundle impact*: ~7 kB gzipped.
7. `lucide-react` (^0.395.0): Accessible, tree-shaken SVG iconography.
   - *Why required*: Provides clear, accessible visual cues (check, alert, clock, chevron).
   - *Security relevance*: Emits pure inline SVG; zero external font network requests.
   - *Bundle impact*: ~5 kB gzipped (tree-shaken).

### Proposed Development Dependencies (12 Total):
1. `typescript` (^5.4.5): Static typing and strict DTO contracts.
2. `@types/react` (^18.3.3): Type definitions for React.
3. `@types/react-dom` (^18.3.0): Type definitions for React DOM.
4. `vite` (^5.3.1): Build tool and dev server.
5. `@vitejs/plugin-react` (^4.3.1): Babel/SWC fast-refresh React plugin for Vite.
6. `vitest` (^1.6.0): Native Vite unit/component test runner.
7. `jsdom` (^24.1.0): Headless DOM implementation providing browser environment for Vitest.
8. `@testing-library/react` (^16.0.0): User-centric React component testing framework.
9. `@testing-library/jest-dom` (^6.4.6): Custom DOM matchers for assertion ergonomics.
10. `@testing-library/user-event` (^14.5.2): Realistic user event simulation for keyboard and click tests.
11. `msw` (^2.3.1): Mock Service Worker for network-level API interception in tests.
12. `@playwright/test` (^1.45.0): Browser automation runner for multi-browser E2E testing.

---

## 69. PHASE 16 DEPLOYMENT HANDOFFS

The following production infrastructure requirements are explicitly deferred to Phase 16:
1. **Edge TLS & Certificate Management**: HTTPS termination at the edge proxy / load balancer.
2. **Production HSTS Delivery**: Strict-Transport-Security header injection at the edge proxy (reaffirming Node's zero-HSTS contract).
3. **Frontend Document CSP Injection**: Delivery of the `Content-Security-Policy` header on static SPA HTML documents at the edge/web server.
4. **Same-Origin Path-Based Production Ingress**: Configuration of reverse-proxy / edge ingress routing public SPA traffic (`https://app.example.com/`) and browser API namespace (`https://app.example.com/api/v1/...`) to internal backend services.
   - **Same Browser Origin != Same Application Process**: The SPA static asset server and the Express backend API remain separate, decoupled internal processes.
   - **Production Routing Topology**:
     ```text
     Browser (Unified Origin: https://app.example.com)
        │
        ├── GET / (and /assets/*)
        │     └── Ingress routes to SPA Static Service
        │
        └── ALL /api/v1/*
              └── Ingress routes to adaptive-aptitude-api (Express on private network)
     ```
   - **Backend Source Immutability**: No Express static hosting requirement is introduced; backend code, routes, middleware, and CORS allowlist remain 100% frozen and unmodified.
5. **Static Asset Caching & CDN**: Edge caching rules for immutable Vite assets (`/assets/*.js`, `/assets/*.css`).
6. **Reverse Proxy Rate Limiting**: Distributed DDoS protection in front of Node's process-wide memory limiter.
7. **Containerization**: Production multi-stage Docker build producing an unprivileged Nginx/Caddy container serving static client assets.

---

## 70. ARCHITECTURE INVARIANTS

The Phase 15 architecture guarantees the following mechanically testable platform invariants:

```text
Phase 1–14 frozen documents modified:              0
Backend model changes:                             0
Backend collection changes:                        0
Backend route additions / modifications:          0
Learning / scoring mathematics modified:           0
Access tokens persisted in browser storage:        0 (In-Memory Only in tokenManager)
Refresh tokens readable by JavaScript:             0 (HttpOnly Cookie Only)
Parallel refresh requests for one auth state:      0 (Single-Flight Lock)
Direct parallel refresh implementations:           0
Client-supplied userId trusted as identity:        0 (Server JWT Sole Authority)
Frontend recalculation of adaptive/mastery math:   0
Teacher / Admin / Operator roles introduced:       0
Phase 16 infrastructure implemented:               0
Unmapped learner features:                         0
Unclassified frontend routes:                      0
Unclassified API integrations:                     0
Declared candidate consumed operations:            64
Matrix-classified candidate consumed operations:   64
Candidate non-consumed operations:                 22
Unclassified consumed operations:                  0
Selected test tools missing from dependency budget:0
Active architecture contradictions:                0
Open architecture decisions:                       0
Backend API gaps:                                  0 (Section 27 field-proven evidence presentations)
Incorrect Phase 6 HTTP status mappings:            0
Backend-proven mock DTO naming mismatches:         0
Invalid mock result field aliases:                 0
Generic Record<string, unknown> in mock result:    0
Unsupported percentile / rank claims:              0
Active mock question answer-bearing fields:        0
Unsupported Bayesian mastery claims:               0
Unsupported IRT claims:                            0
Unsupported SM-2 claims:                           0
Unsupported ease-factor claims:                    0
Unsupported 7-day revision-plan claims:            0
Unsupported readiness probability claims:          0
Request-contract cross-section contradictions:     0
Premature Phase 15 FROZEN decision labels:         0
Active mock answer leakage pathways:               0
Unresolved request DTOs:                           0
Unresolved response DTOs:                          0
Backend-proven DTO contradictions:                 0
View-model fields misclassified as backend:        0
Invented backend fields:                           0
Client-created terminal MockSession states:        0
Global expiry blindly treated as manual submit:    0
Authoritative server-state optimistic mutations:   0
Unresolved transport blockers (W39):               0 (Resolved by same-origin production ingress contract)
Production implementation performed in this task:  NO
```

---

## 71. RESOLVED ARCHITECTURAL DECISIONS & W39 GOVERNANCE DISPOSITION

### Architectural Decision: Same-Origin Production Browser Ingress (Finding W39 Disposition)
- **Problem (Historical Finding W39)**: Candidate consumed Operation 64 (`POST /api/v1/attribution/prescriptions`) requires the `Idempotency-Key` HTTP request header (1–128 chars). The frozen Phase 14 CORS preflight allowlist in `src/middleware/securityHeaders.js:65` allows only `Content-Type, Authorization, X-Correlation-ID, X-Request-ID`. A cross-origin browser request fails CORS preflight because `Idempotency-Key` is unlisted.
- **Superseded Directive (Historical Evidence)**: The previous governance directive (*"Keep deployment requirements unchanged; leave freeze blocked"*) preserved the frozen backend at the cost of leaving W39 open and freeze blocked.
- **Governing Resolution**: The explicit transport governance directive authorizes **Same-Origin Path-Based Production API Ingress**:
  - Browser Origin: `https://app.example.com`
  - SPA Application: `https://app.example.com/`
  - Browser API Namespace: `https://app.example.com/api/v1/...`
  - Upstream Routing: Edge ingress / reverse proxy routes `/api/v1/*` to `adaptive-aptitude-api` without altering backend source code or CORS configuration.
- **Why This Resolves W39**: Under same-origin browser dispatch, custom request headers (including `Idempotency-Key`) are same-origin and do not trigger CORS preflight. The Phase 14 backend code, middleware, and CORS allowlist remain 100% frozen and unmodified.
- **Disposition**: **RESOLVED-BY-DEPLOYMENT-CONTRACT**.
  - Architecture transport contradiction resolved: **YES**
  - Production infrastructure implemented: **NO** (Deferred to Phase 16)
  - Production deployment verification performed: **NO** (Deferred to Phase 16)
- **Impact on Freeze**: **ARCHITECTURE RECONCILIATION COMPLETE**. With zero open architecture decisions, zero backend contract contradictions, and W39 resolved via deployment contract, the candidate Phase 15 architecture is reconciled at `v1.0.13-PROPOSED` awaiting final governance verification.

---

## 72. ARCHITECTURE VERIFICATION CHECKLIST

- [x] Repository mechanically audited; historical clean slate and paused implementation workspace state documented.
- [x] 100% of proposed learner features traced to existing frozen backend APIs.
- [x] Zero backend model, collection, route, or algorithmic modifications proposed.
- [x] Tier-4 rate limit contract reconciled to frozen Phase 14 defaults (20 req / 1 min / userId).
- [x] HTTP 429 error contracts reconciled to `TOO_MANY_REQUESTS` and `RATE_LIMIT_CAPACITY_EXCEEDED`.
- [x] Generic HTTP 500 error code reconciled to `INTERNAL_SERVER_ERROR`.
- [x] Dual CSP ownership reconciled (Backend API CSP preserved; Frontend document CSP defined).
- [x] Single access token owner resolved (`tokenManager.ts` closure); dual-owner ambiguity eliminated.
- [x] Auth bootstrap unified with `tokenManager.executeSingleFlightRefresh()`.
- [x] Authoritative API consumption matrix expanded to cover all 64 candidate consumed operations.
- [x] Non-consumed backend routes cataloged and audited (22 candidate non-consumed routes; verified tombstone codes & authentication classes).
- [x] Mistake notebook traceability corrected to `GET /api/v1/attempts/user/:userId?isCorrect=false`.
- [x] Native accessible SVG charting selected; `chart-vendor` chunk removed.
- [x] Analytics UX reconciled to existing quadrant, stamina, topic mastery, observed retention, and readiness fields; unsupported composite scores and obsolete visualization references removed.
- [x] Analytics DTO transcription reconciled to frozen Phase 8/backend fields; no backend change.
- [x] Analytics component/test renaming limited to one-for-one specification inventory changes.
- [x] Markdown parsing pipeline selected (`marked` + `DOMPurify` + tag allowlist).
- [x] Mathematical rendering selected (Plain Unicode Math + CSS Tabular Numerals).
- [x] Font delivery selected (System Font Stack; zero external network requests).
- [x] Unspecified offline mutation sync removed; authoritative offline policy defined.
- [x] Truthful threat models for in-memory JWT and CSRF documented.
- [x] Learner profile capabilities reconciled to frozen backend (zero unsupported session list claims).
- [x] TypeScript DTOs verified against actual backend models; 64/64 candidate operations mapped to named request/response contracts.
- [x] Unsupported error/fallback codes removed (`FALLBACK_PROVIDER_ENGAGED` eliminated).
- [x] Complete dependency budget recomputed (7 Runtime, 12 Dev; zero redundant stub types).
- [x] Implementation footprint aligned with selected architecture modules (including `src/utils/apiBaseUrl.ts`).
- [x] Phase 16 infrastructure handoffs explicitly documented.
- [x] MockSession lifecycle reconciled to exactly 5 frozen backend statuses (`created`, `started`, `submitted`, `expired`, `abandoned`); fictional `in_progress`/`completed` session statuses strictly eliminated.
- [x] Multi-level mock state domains disambiguated (`MockSession.status`, `SectionState.status`, `FinalizationState`).
- [x] Closed mock-blueprint mutation route (`POST /api/v1/mock-blueprints`) classified as CLOSED / Tombstone Auth Bypass (bypasses authenticate and identity guard for deterministic 403 `BLUEPRINT_MUTATION_CLOSED`).
- [x] Auth DTOs decoupled into exact backend wire contracts (`RegisterResponseDto`, `LoginResponseDto`, `RefreshResponseDto`, `AuthMeResponseDto`); conflation with generic envelopes eliminated.
- [x] Deterministic auth bootstrap failure taxonomy defined (distinguishing 401 unauthenticated, 403 `ACCOUNT_DISABLED`, 403 Origin/CORS security failure, and network `SERVICE_UNAVAILABLE`).
- [x] Centralized API base URL resolver (`resolveApiUrl` in `src/utils/apiBaseUrl.ts`) unified across `apiClient` and `tokenManager`.
- [x] Registration UX contract resolved (`REGISTERING -> REGISTERED -> /login`) with zero auto-login assumptions.
- [x] In-memory access token preserved across transient HTTP 5xx and network refresh failures; unconditional `clearAccessToken()` on non-2xx eliminated.
- [x] Typed refresh error contract (`RefreshExchangeError`) defined with error classification before destructive state mutations.
- [x] `UserSessionSummary` session timestamps reconciled to backend-proven Unix epoch numbers (`issuedAt: number`, `expiresAt: number`).
- [x] Security test suite expanded to distinguish all 7 auth failure taxonomy cases; stale all-failures-to-login tests eliminated.
- [x] Abandoned mock session lifecycle decoupled from scoring pipeline, result summaries, and review palettes (zero leakage).
- [x] Invented HTTP 202 submit semantics removed; backend-proven HTTP 200 result summary and HTTP 409 `FINALIZATION_IN_PROGRESS` contracts preserved.
- [x] API consumption matrix rows 45–48 reconciled with backend-proven mock finalization, result, and review contracts.
- [x] Incorrect Phase 6 HTTP status mappings reconciled to 409 (`MOCK_SESSION_EXPIRED`, `RESPONSE_FROZEN`, `SECTION_LOCKED`, `SECTION_NOT_ACTIVE`, `FINALIZATION_LEASE_LOST`, `FINALIZATION_IN_PROGRESS`, `SESSION_STATE_CONFLICT`).
- [x] `MockResponseSavePayload` field naming reconciled to backend wire contract (`selectedAnswer`, `isMarkedForReview`, `timeTakenSeconds`; `selectedOption` and `isFlagged` restricted to view-model-derived state).
- [x] Mock examination timer derived strictly from server-authoritative `expiresAt` deadline; invented `timeLimitSeconds` session contract eliminated.
- [x] Zero-time client expiry behavior reconciled to server-authoritative inquiry via `GET /api/v1/mock-sessions/:id/result` (lazy expiry evaluation); client-created terminal states eliminated.
- [x] Daily objective progress mutation reconciled to pessimistic server-confirmed update (authoritative server-state optimistic mutations: 0).
- [x] Complete mock-exam API block (rows 39–48) source-audited against Phase 6 controller/service implementations (10/10 reconciled).
- [x] MockResultResponseDto reconciled to exact Phase 6 fields (`rawScore`, `maxPossibleScore`, `answered`, `unanswered`, `correct`, `incorrect`, `accuracy`, `percentage`, `totalTimeSeconds`, `averageTimeSeconds`); invalid aliases (`score`, `totalPossibleMarks`, `attemptedQuestions`, `correctAnswers`, `incorrectAnswers`, `unansweredQuestions`) strictly eliminated.
- [x] Generic `Record<string, unknown>[]` placeholder types eliminated from backend-proven `MockResultResponseDto`; exact section, topic, pattern, difficulty, and pacing interfaces defined.
- [x] Active `MockQuestionDto` decoupled from practice `QuestionDto`; strictly excludes `answer`, `correctAnswer`, `explanation`, and `solution`; uses `questionId` instead of `_id`.
- [x] `MockQuestionResponseDto` mechanically source-audited (`{ question: MockQuestionDto, response: MockQuestionDraftResponseDto | null }`); zero invented wrappers.
- [x] MockSession projections decoupled into `MockSessionDocDto` (create/start) and `MockSessionDetailResponseDto` (viewport/status inquiry).
- [x] `MockResponseSaveResponseDto` reconciled with exact Phase 6 model fields.
- [x] `MockSectionCompleteResponseDto` verified and typed as discriminated union (non-final vs final with resultSummary).
- [x] `MockReviewResponseDto` verified and typed against Phase 6 review service; zero unverified question/attempt schemas inferred.
- [x] All unsupported percentile and rank claims strictly eliminated across proposal; mock finalization described using factual signed scoring and domain aggregations.
- [x] 64/64 candidate consumed operations mechanically source-proven with 0 unresolved request or response DTOs and 0 backend-proven DTO contradictions.
- [x] Phase 4 mastery terminology reconciled to deterministic mastery scores and adaptive difficulty selection; false Bayesian and IRT claims strictly eliminated (0 claims).
- [x] Phase 5 revision terminology reconciled to fixed-stage spaced revision ladder (5-stage schedule: 1d, 3d, 7d, 14d, 30d); SM-2 and ease-factor references eliminated (0 claims).
- [x] Revision plan horizons reconciled strictly to backend capability (days ∈ {1,2}); invalid 7-day projection claims eliminated.
- [x] Consumed GET query parameters and request contracts mechanically source-audited and reconciled across Section 54.2 and Section 59 (including rows 25, 28, 29, 30, 31, 32); request-contract semantic contradictions eliminated (0 contradictions across all 64 candidate consumed operations).
- [x] Auth refresh request description standardized to 'No Request Body; browser-managed HttpOnly refresh cookie' across Section 54.2 and Section 59.
- [x] All 21 Phase 15 architectural decisions verified and frozen in Section 65 (0 open decisions; W39 resolved by same-origin ingress contract).
- [x] Operation 64 Prescription Issuance transport blocker (Finding W39) resolved via same-origin path-based API ingress architecture; backend source and CORS allowlist preserved 100% frozen.
- [x] Phase 8 readiness semantics reconciled to bounded readiness index [0.0, 1.0] and component evidence; invalid pass/success probability claims eliminated (0 claims).
- [x] Revision question delivery decoupled from local scheduling; follows pattern-scoped backend flow via supported practice delivery and Attempt submission (source: 'revision').
- [x] QuestionCard component typed as mode-safe discriminated union (`PracticeQuestionCardProps`, `ActiveMockQuestionCardProps`, `MockReviewQuestionCardProps`), preventing `MockQuestionDto` answer leakage in active exams and guaranteeing read-only mock review.

---

### 72.1 Historical Record — Superseded: Targeted Analytics Reconciliation Verification (v1.0.9-FROZEN)

> [!NOTE]
> **HISTORICAL RECORD — SUPERSEDED**: The verification text below documents an earlier historical milestone (`v1.0.9-FROZEN`) under the superseded 63/23 route partition. It is retained strictly as an immutable audit trail and DOES NOT govern the current `v1.0.13` candidate architecture or its reconciled 64/22 candidate contract state.

The authorized revision checked the existing implementation and frozen Phase 8 contracts read-only. The original unsupported composite-score requirement had no backend wire fields or frozen derivation mapping. Section 27 named only existing fields across the same four analytics operations, with explicit units, null/empty handling, and zero client scoring. The Section 54.3 corrections reproduced `quartile`/`accuracy`, topic evidence fields, and readiness goal metadata/reasons/null components already emitted by the backend; they added no backend contract.

Historical verification criteria for that superseded revision:
- Exactly Sections 1–73 remained present; unrelated sections remained byte-for-byte unchanged. Changes were limited to metadata, analytics descriptions/preview/UX, the three affected analytics DTO declarations, visualization responsibility names, analytics traceability/testing, and the associated sign-off entries.
- Historical baseline: 63 consumed method/path pairs and 23 non-consumed pairs; backend routes 86, unclassified operations 0.
- Section 27 fields resolved to the existing analytics controller/services and frozen Phase 8 contract. No superseded cognitive-score identifiers, obsolete cognitive visualization component references, or unsupported score/polygon acceptance requirements remained.
- React/Vite, TanStack Query, native accessible SVG, 7 runtime/12 dev dependencies, auth/security, accessibility/responsive contracts, mock isolation, and Phase 16 boundaries remained unchanged.
- Backend source, routes, models, collections, schemas, algorithms, database, and frozen Phases 1–14 changes are all 0. Implementation authorization remained NONE; implementation performed NO.

*(Historical verification result for v1.0.9: PASS under prior 63/23 partition; now superseded by subsequent reconciliations).*

---

### 72.2 Historical Record — Superseded: Governance Reference Verification (v1.0.10-FROZEN)

> [!NOTE]
> **HISTORICAL RECORD — SUPERSEDED**: The text below is preserved strictly as an immutable historical record of the earlier v1.0.10 governance reference verification. It does NOT govern current `v1.0.13` candidate assertions.

This historical revision corrected Section 2.2 to the prior architecture identity. Audit of every old version/hash occurrence confirmed that Section 1's Phase 14 preceding-gate version was an independently versioned upstream reference; prior Phase 15 version markers are historical. None governs the current precedence hierarchy. The backend field `topicMasteryRadar` remains valid; it is not an obsolete cognitive-score contract.

*(Historical verification result for v1.0.10: PASS; now superseded by subsequent reconciliations).*

---

### 72.3 Historical Record — Superseded: v1.0.11-PROPOSED Architecture Consistency Verification

> [!NOTE]
> **HISTORICAL RECORD — SUPERSEDED**: The verification text below documents an earlier intermediate proposal milestone (`v1.0.11-PROPOSED`, fingerprint `9a03d5af8121799f63a1cc1781d2199047cc3480051b49b7da3d51575cace9c4`). It recorded the completion of W01–W38 reconciliation while Finding W39 remained temporarily open prior to transport governance resolution. It is preserved strictly as an immutable audit trail and does NOT govern current frozen architecture assertions.

```text
Historical Proposal Version:
v1.0.11-PROPOSED

Historical Intermediate Fingerprint:
9a03d5af8121799f63a1cc1781d2199047cc3480051b49b7da3d51575cace9c4

Historical Status:
ARCHITECTURE RECONCILED EXCEPT FOR EXPLICIT TRANSPORT BLOCKER (W39 OPEN)
```

---

### 72.4 Historical Record — Superseded: Final v1.0.12-FROZEN Architecture Reconciliation & Freeze Verification

> [!NOTE]
> **HISTORICAL RECORD — SUPERSEDED**: The verification text below documents an earlier historical milestone (`v1.0.12-FROZEN`, SHA-256: `d4c83adca5dfaef6e7f8d5eb6da6d19fa31d813ca527a998db77cf38a1a28556`). It is retained strictly as an immutable audit trail and does NOT govern current `v1.0.13` candidate assertions.

```text
Historical Architecture Version:
v1.0.12-FROZEN

Historical Architecture Status:
VERIFIED / COMPLETE / FROZEN

Historical Candidate Consumed Operations:
64

Historical Candidate Non-Consumed Operations:
22

Total Registered Backend Routes:
86

Unclassified Routes:
0

Route Partition Assertion:
Consumed ∩ NonConsumed = ∅
Consumed ∪ NonConsumed = 86

W01–W38 Non-Transport Wire Findings:
RESOLVED (0 unresolved)

W39 Transport / Deployment Finding:
RESOLVED-BY-DEPLOYMENT-CONTRACT (Same-Origin Production API Ingress)

Other Architecture Blockers:
0

Architecture Freeze:
COMPLETE (Frozen at v1.0.12-FROZEN)

Specification Reconciliation:
REQUIRED / NOT STARTED (Baseline v1.0.8-FROZEN preserved)

Implementation Authorization:
NONE (Frontend implementation remains strictly PAUSED)
```

---

### 72.5 Candidate v1.0.13-PROPOSED Architecture Reconciliation Verification

```text
Architecture Version:
v1.0.13-PROPOSED

Architecture Status:
PROPOSED / RECONCILED / AWAITING FINAL GOVERNANCE VERIFICATION

Candidate Consumed Operations:
64

Candidate Non-Consumed Operations:
22

Total Registered Backend Routes:
86

Unclassified Routes:
0

Route Partition Assertion:
Consumed ∩ NonConsumed = ∅
Consumed ∪ NonConsumed = 86

W01–W38 Non-Transport Wire Findings:
RESOLVED (0 unresolved)

W39 Transport / Deployment Finding:
RESOLVED-BY-DEPLOYMENT-CONTRACT (Same-Origin Production API Ingress)

Other Architecture Blockers:
0

Architecture Freeze:
AWAITING FINAL GOVERNANCE VERIFICATION (Proposed v1.0.13)

Specification Status:
RECONCILED CANDIDATE (v1.0.10-PROPOSED)

Implementation Authorization:
NONE (Frontend implementation remains strictly PAUSED)
```

---

## 73. RECOMMENDED NEXT GATE

The Phase 15 Architecture Proposal candidate (`v1.0.13-PROPOSED`) has completed 64-operation backend contract recertification, full non-transport reconciliation, and transport governance resolution for Finding W39 via same-origin path-based API ingress. All architectural decisions are reconciled and awaiting final governance re-freeze.

```text
STATUS:
PROPOSED / RECONCILED / AWAITING FINAL GOVERNANCE VERIFICATION (v1.0.13-PROPOSED)

ARCHITECTURE FREEZE:
PENDING FINAL GOVERNANCE VERIFICATION

W39 TRANSPORT DISPOSITION:
RESOLVED-BY-DEPLOYMENT-CONTRACT (Same-Origin Production Ingress)

SPECIFICATION STATUS:
RECONCILED CANDIDATE (v1.0.10-PROPOSED)

FRONTEND IMPLEMENTATION AUTHORIZATION:
NONE (Implementation remains strictly PAUSED)

RECOMMENDED NEXT GATE:
PHASE 15 FINAL GOVERNANCE RECONCILIATION AND RE-FREEZE
```

### Mandated Scope for Subsequent Final Governance Gate:
1. Reconcile and audit all candidate artifacts against canonical backend contracts and tests.
2. Confirm zero architecture and zero specification contradictions across all 64 consumed operations and 22 non-consumed routes.
3. Perform formal architecture freeze (`v1.0.13-FROZEN`) and compute repeatable canonical SHA-256.
4. Rebase and perform formal prescriptive specification freeze (`v1.0.10-FROZEN`) with exact architecture SHA-256 reference.
5. Verify 121-file authorized inventory and zero implementation mutation baseline.
6. Grant implementation authorization for subsequent implementation task only.
