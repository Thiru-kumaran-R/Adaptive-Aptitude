# Phase 6 — Mock Test & Exam Simulation Engine Specification

## 1. Executive Architectural Overview

Phase 6 implements a production-grade, server-authoritative mock test and exam simulation engine on top of the verified Phase 1–5 adaptive aptitude platform. It provides standardized benchmark exams, personalized diagnostic assessments, draft response state management with decoupled review flagging, millisecond-exact session timing, and crash-proof, distributed finalization with resilient three-path lease recovery.

```text
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                   PHASE 6 MASTER TOPOLOGY                                       │
├─────────────────────────────────────────────────────────────────────────────────────────────────┤
│  1. CONFIGURATION & BLUEPRINT DOMAIN                                                            │
│     - Modes: 'standard' (fixed benchmark) & 'diagnostic' (mastery-targeted)                     │
│     - Scope Validation: topics OR patterns OR (topics + patterns) OR allCanonicalPatterns       │
│     - Zero Syllabus Fabrication: Explicit scope only (never derived from company/exam name)     │
│     - Structural Derivation: section.order, totalQuestions, fingerprint, algorithmVersion       │
│     - Authoritative Signed Scoring: correctMarks > 0, incorrectMarks <= 0,                      │
│       unansweredMarks <= 0                                                                      │
│     - Section Timing: free = null duration; section_locked = all or none timed,                 │
│       sum(section.durationMinutes) <= blueprint.durationMinutes                                │
│     - Normalized SHA-256 Fingerprint: semantic section order + canonicalized effective schema   │
├─────────────────────────────────────────────────────────────────────────────────────────────────┤
│  2. QUESTION GENERATION & RECENT EXCLUSION ENGINE                                               │
│     - Standard Mode: Largest-remainder integer distribution across canonical pattern order      │
│     - Diagnostic Mode: 4-bucket (Weak, Unseen, Developing, Mastered) + 5-tier comparator        │
│     - New-Student Diagnostic: Missing StudentProgress normalized in-memory to 0 mastery/attempts│
│     - Seeded PRNG Replay: Question.find().sort({ _id: 1 }) + seeded Fisher-Yates shuffle        │
│     - Session-Wide Question Uniqueness: Single Set<ObjectId> spans all sections & difficulties  │
│     - Bounded Recent Exclusion: Inspects at most 50 recent Attempts; default standard=false,     │
│       diagnostic=true; shortage throws 400 INSUFFICIENT_QUESTIONS_FOR_MOCK without relaxation   │
├─────────────────────────────────────────────────────────────────────────────────────────────────┤
│  3. SESSION LIFECYCLE & TRANSACTIONAL TIMING GUARDS                                             │
│     - Lifecycle: created → started → submitted | expired | abandoned                            │
│     - Idempotent Start: Subsequent start calls on started session return identical session      │
│     - Server-Authoritative Expiry: now < expiresAt (active) vs now >= expiresAt (expired)       │
│     - Transactional Section Deadlines: saveResponse verifies activeSec.expiresAt inside tx      │
│     - Atomic Section Transitions: Non-final transitions advance next section atomically;        │
│       final section establishes atomic finalization barrier within same document write          │
├─────────────────────────────────────────────────────────────────────────────────────────────────┤
│  4. RESPONSE STATE & FREEZE CONTENTION                                                          │
│     - Decoupled State: Draft answer, answer edit, answer clear (reverts to viewed), review flag │
│     - Option Integrity: Selected answer validated against immutable stored Question.options     │
│     - Bounded timeTakenSeconds: Validates non-negative integer within elapsed + tolerance (5s)  │
│     - Freeze Contention Barrier: saveResponse contends on MockSession via $inc responseMutation │
│       Version with responsesFrozen: false; finalization acquisition atomically sets frozen=true│
├─────────────────────────────────────────────────────────────────────────────────────────────────┤
│  5. THREE-PATH DISTRIBUTED LEASE & CRASH RECOVERY ENGINE                                        │
│     - Path A (Initial Acquisition): responsesFrozen=false, state=idle, ownerToken=null          │
│     - Path B1 (Crash Recovery): responsesFrozen=true, state=in_progress, leaseExpiresAt <= now  │
│     - Path B2 (Failed-State Retry): responsesFrozen=true, state=failed, lease=null | <= now    │
│     - Exact Lease Boundary: VALID iff leaseExpiresAt > now; EXPIRED iff leaseExpiresAt <= now   │
│     - Immutable Target Status: Captured during initial freeze; never recalculated on recovery   │
│     - Stale Worker Fencing: Lease expiry rejects heartbeat/commit with 409 FINALIZATION_LEASE_LOST│
├─────────────────────────────────────────────────────────────────────────────────────────────────┤
│  6. ANSWERED-ONLY ATTEMPT FINALIZATION & REBUILD PARITY                                         │
│     - Answered-Only Finalization: ONLY answered responses create Attempts & receipts;           │
│       unanswered questions create neither and are scored as unansweredMarks                     │
│     - Exactly-Once Guarantees: Partial unique Attempt index { sessionId, questionId }           │
│     - Phase 3/4/5 Integration: createAttempt adapter maps timeTakenSeconds → timeTaken;         │
│       triggers Phase 4 mastery recalculation; triggers Phase 5 revision scheduling              │
│     - Phase 5 Mock Revision Semantics: Incorrect attempt resets to Stage 0 (interval 1d);       │
│       correct mock attempt DOES NOT advance revision stage, interval, or nextReviewDate         │
│     - Cross-Phase Isolation: Mock attempts do NOT affect DailyObjective or StudyPlan targets   │
│     - Rebuild Parity: rebuildMockResult validates receipt linkage and re-derives identical      │
│       scoring across all six analytics domains (overall, sections, topics, patterns, diffs, pace)│
└─────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Configuration & Frozen Contracts (`src/config/mockConfig.js`)

All constants, algorithm versions, thresholds, error codes, and HTTP mappings are strictly centralized in `src/config/mockConfig.js`:

```javascript
MOCK_ALGORITHM_VERSION: 'v1'

MOCK_MODES: {
  STANDARD: 'standard',
  DIAGNOSTIC: 'diagnostic'
}

NAVIGATION_POLICIES: {
  FREE: 'free',
  SECTION_LOCKED: 'section_locked'
}

SESSION_STATUS: {
  CREATED: 'created',
  STARTED: 'started',
  SUBMITTED: 'submitted',
  EXPIRED: 'expired',
  ABANDONED: 'abandoned'
}

FINALIZATION_STATE: {
  IDLE: 'idle',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  FAILED: 'failed'
}

SECTION_STATUS: {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  EXPIRED: 'expired'
}

DIFFICULTY_BANDS: {
  EASY: { min: 1, max: 3, label: 'easy' },
  MEDIUM: { min: 4, max: 7, label: 'medium' },
  HARD: { min: 8, max: 10, label: 'hard' }
}

DEFAULT_DIFFICULTY_DISTRIBUTION: {
  easy: 0.30,
  medium: 0.50,
  hard: 0.20
}

MOCK_RECENT_QUESTION_EXCLUSION_LIMIT: 50

FINALIZATION_LEASE: {
  DURATION_MS: 30000, // 30 seconds
  HEARTBEAT_INTERVAL_MS: 5000 // 5 seconds
}

SESSION_LIMITS: {
  MAX_QUESTIONS: 200,
  MIN_QUESTIONS: 1,
  MAX_SECTIONS: 10,
  MAX_DURATION_MINUTES: 360,
  MIN_DURATION_MINUTES: 1,
  PACING_TOLERANCE_SECONDS: 5,
  MAX_ALLOWED_TIME_TAKEN_SECONDS: 7200
}

DIAGNOSTIC_THRESHOLDS: {
  DEVELOPING_MIN_MASTERY: 0.70,
  MASTERED_MIN_MASTERY: 0.85
}
```

---

## 3. Data Models & Schemas

### 3.1 `MockBlueprint` (`src/models/mockBlueprintModel.js`)
* Stores blueprint configuration, section definitions, timing rules, and global scoring overrides.
* Explicit recent-exclusion override: `excludeRecentQuestions: { type: Boolean, default: null }` (nullable explicit override; when `null`, delegates to mode default).
* Server-derived fields: `section.order`, `totalQuestions`, `blueprintFingerprint`, `algorithmVersion`.
* Redundant field omission: `effectiveExcludeRecentQuestions` is strictly NOT persisted in `MockBlueprint` to prevent schema drift and dual sources of truth.
* Indexes:
  * `{ blueprintFingerprint: 1 }`
  * `{ status: 1, createdAt: -1 }`

### 3.2 `MockSession` (`src/models/mockSessionModel.js`)
* Manages runtime session state, question sequence, section progression, and distributed finalization lease.
* Single Authoritative Resolved Ownership:
  * `effectiveExcludeRecentQuestions: { type: Boolean, required: true }` — Server-resolved boolean:
    `typeof blueprint.excludeRecentQuestions === 'boolean' ? blueprint.excludeRecentQuestions : (blueprint.mode === 'diagnostic')`.
  * Also preserved in `MockSession.blueprintSnapshot.effectiveExcludeRecentQuestions` and canonical fingerprint inputs.
* Complete finalization fields:
  * `responseMutationVersion`: Monotonically incrementing integer for optimistic concurrency control.
  * `responsesFrozen`: Boolean flag locking responses from further mutations.
  * `finalizationState`: `idle` | `in_progress` | `completed` | `failed`.
  * `finalizationOwnerToken`: Unique UUID identifying current leaseholder.
  * `finalizationLeaseExpiresAt`: Server timestamp fencing lease validity.
  * `finalizationHeartbeatAt`: Heartbeat timestamp for liveness monitoring.
  * `finalizationStartedAt`: Timestamp of initial Path A lease acquisition.
  * `finalizationTargetStatus`: Immutable terminal intention (`submitted` | `expired`).
* Indexes:
  * `{ userId: 1, status: 1, createdAt: -1 }`
  * `{ expiresAt: 1 }` with partial filter `{ status: 'started' }`
  * `{ finalizationOwnerToken: 1, finalizationLeaseExpiresAt: 1 }` with partial filter `{ finalizationOwnerToken: { $type: 'string' } }`

### 3.3 `MockResponse` (`src/models/mockResponseModel.js`)
* Stores draft answers, view events, review flags, and pacing metrics for individual questions.
* Independent lifecycle: viewed $\to$ answered $\to$ cleared (viewed) $\to$ marked for review.
* Indexes:
  * `{ sessionId: 1, questionId: 1 }` (unique)
  * `{ sessionId: 1, sectionId: 1 }`

### 3.4 `MockAttemptFinalizationRecord` (`src/models/mockAttemptFinalizationRecordModel.js`)
* Minimal finalization audit receipt establishing cryptographic linkage between `MockSession`, `Question`, and the created Phase 3 `Attempt`.
* Authoritative Seven-Field Minimal Schema:
  1. `sessionId` (ObjectId ref: 'MockSession', required)
  2. `questionId` (ObjectId ref: 'Question', required)
  3. `userId` (String, required)
  4. `attemptId` (ObjectId ref: 'Attempt', required)
  5. `algorithmVersion` (String, required, default: 'v1')
  6. `status` (String, required, enum: ['completed'], default: 'completed')
  7. `finalizedAt` (Date, required, default: Date.now)
* Prohibited Duplicate Assessment Data: Strictly omits `selectedAnswer`, `correctAnswer`, `isCorrect`, `rawScoreAwarded`, `timeTakenSeconds`, `topic`, `pattern`, `difficulty`, `options`, `explanation`, and `solution` (Attempt remains the single source of truth).
* Indexes:
  * `{ sessionId: 1, questionId: 1 }` (unique)
  * `{ sessionId: 1, attemptId: 1 }` (supporting index)

### 3.5 Partial Unique Mock Attempt Index (`src/models/attemptModel.js`)
* Added partial unique compound index to existing `Attempt` collection:
  * Key: `{ sessionId: 1, questionId: 1 }`
  * Filter: `{ source: 'mock', sessionId: { $type: 'string' } }`
  * Enforces strictly at most one mock attempt per question in a session without altering non-mock attempts.

---

## 4. Blueprint Scope & Preview Engine

### 4.1 Scope Forms
Four explicit forms are validated against the canonical pattern registry:
1. **Topics only**: `{ topics: ['Percentage'] }` — expands to all canonical patterns in topic.
2. **Patterns only**: `{ patterns: ['Successive Percentage Changes'] }` — genuine pattern targeting.
3. **Topics + patterns**: `{ topics: ['Percentage'], patterns: ['Successive Percentage Changes'] }` — every pattern must belong to one of the supplied topics.
4. **All canonical patterns**: `{ allCanonicalPatterns: true }` — topics and patterns must be empty or omitted.

Syllabus is never inferred from company names, exam types, or blueprint titles.

### 4.2 Section Timing Rules
* **Free Navigation (`free`)**: All section durations must be `null`.
* **Section-Locked (`section_locked`)**: Either all sections are untimed (`durationMinutes = null`) OR all sections are timed (`durationMinutes >= 1`).
* **Timing Constraint**: $\sum \text{section.durationMinutes} \le \text{blueprint.durationMinutes}$.

### 4.3 Zero-Write Preview (`POST /api/v1/mock-blueprints/preview`)
* Computes allocations, timing reconciliation, pattern rankings, and candidate availability.
* Enforces $\Delta = 0$ writes across all collections (`MockBlueprint`, `MockSession`, `MockResponse`, `MockAttemptFinalizationRecord`, `Attempt`).

---

## 5. Question Assembler & Allocation Engine

### 5.1 Difficulty Allocation
* Bands: Easy ($1–3$), Medium ($4–7$), Hard ($8–10$).
* Default distribution: $30\%$ Easy, $50\%$ Medium, $20\%$ Hard.
* Uses deterministic largest-remainder integer distribution. Shortages never silently alter requested distributions.

### 5.2 Diagnostic 4-Bucket & 5-Tier Comparator
Eligible patterns are sorted into four buckets:
1. **Weak**: $\text{mastery} < 0.70$ with $\ge 1$ attempt.
2. **Unseen**: $0$ attempts (missing `StudentProgress` normalized in-memory to `{ mastery: 0, attempts: 0 }`).
3. **Developing**: $0.70 \le \text{mastery} < 0.85$.
4. **Mastered**: $\text{mastery} \ge 0.85$.

Within each bucket, patterns are ranked by:
1. Lower mastery
2. Fewer attempts
3. Canonical pattern registry index
4. Pattern name alphabetical order

### 5.3 Deterministic Candidate Selection & Session-Wide Uniqueness
* Query: `Question.find(query).sort({ _id: 1 })`.
* Seeded PRNG: Fisher-Yates shuffle parameterized by `generationSeed`.
* Session-Wide Uniqueness: Single `selectedQuestionIds = new Set()` spans the entire session across sections, topics, and difficulty buckets.
* Insufficient questions throw `400 INSUFFICIENT_QUESTIONS_FOR_MOCK` with zero silent relaxation.

---

## 6. Concurrency Control & Distributed Lease Engine

### 6.1 Save vs Freeze Contention
* `saveResponse`: Executes inside a MongoDB transaction that atomically increments `responseMutationVersion` on `MockSession` matching `{ status: 'started', responsesFrozen: false, finalizationOwnerToken: null }`.
* Finalization Acquisition: Atomically sets `responsesFrozen = true`, blocking all concurrent save operations with `409 RESPONSE_FROZEN`.

### 6.2 Three-Path Lease Engine
* **Path A (Initial Acquisition)**:
  * Guard: `status = started, responsesFrozen = false, finalizationState = idle, finalizationOwnerToken = null`.
  * Sets: `responsesFrozen = true, finalizationState = in_progress, finalizationOwnerToken = workerToken, finalizationLeaseExpiresAt = now + 30s, finalizationTargetStatus = target`.
* **Path B1 (Crash Recovery)**:
  * Guard: `status = started, responsesFrozen = true, finalizationState = in_progress, finalizationLeaseExpiresAt <= now`.
  * Reacquires lease while strictly preserving `finalizationStartedAt` and `finalizationTargetStatus`.
* **Path B2 (Failed-State Retry)**:
  * Guard: `status = started, responsesFrozen = true, finalizationState = failed, (finalizationLeaseExpiresAt == null || <= now)`.
  * Allows immediate recovery retry.

### 6.3 Exact Lease Boundary
* Valid lease: `finalizationLeaseExpiresAt > now`.
* Expired lease: `finalizationLeaseExpiresAt <= now`.
* Stale workers attempting heartbeats or commits after lease expiry are rejected with `409 FINALIZATION_LEASE_LOST`.

---

## 7. Downstream Integrations & Analytics

### 7.1 Phase 3 Attempt Adapter & Frozen Phase 4 Mastery Pipeline
* Answered responses are finalized via `attemptService.createAttempt(...)`:
  * Maps `MockResponse.timeTakenSeconds` $\to$ `Attempt.timeTaken`.
  * Derives `isCorrect`, updates `StudentProgress`, triggers Phase 4 post-attempt hooks, and invokes Phase 5 revision scheduler.
* **Frozen Phase 4 Mastery Invariant**:
  * Mock Attempts are routed through the existing Phase 3 Attempt pipeline (`attemptService.createAttempt`).
  * The existing Phase 4 mastery recalculation runs completely unchanged using its verified deterministic multi-factor calculation.
  * Phase 6 introduces no mastery formula, no exponential moving average (EMA), and does not directly mutate mastery.
  * Phase 6 performs strictly zero direct mastery calculation.

### 7.2 Phase 5 Mock Revision Semantics
* **Incorrect Mock Attempt**: Resets pattern to Stage 0 with interval 1 day.
* **Correct Mock Attempt**: Does NOT advance revision stage, interval days, or next review date.

### 7.3 DailyObjective & StudyPlan Isolation
* Mock completions do NOT increment `DailyObjective.patterns[].completedQuestions`.
* Mock completions do NOT auto-complete or replan active `StudyPlan` targets.

### 7.4 Scoring & Six-Domain Analytics
* Formula: $\text{rawScore} = \text{correct} \times \text{correctMarks} + \text{incorrect} \times \text{incorrectMarks} + \text{unanswered} \times \text{unansweredMarks}$.
* Aggregations: Overall, sections (with section-specific overrides and reconciliation), topics, patterns, difficulties, and pacing metrics.
* `rebuildMockResult(sessionId)` re-executes the pure calculator against persisted receipts and ensures deep parity.

---

## 8. REST API Surface & Status Mappings

| Method | Endpoint | Description | HTTP Status / Error Codes |
|---|---|---|---|
| `POST` | `/api/v1/mock-blueprints` | Create blueprint | `201`, `400 INVALID_BLUEPRINT` |
| `GET` | `/api/v1/mock-blueprints` | List blueprints | `200` |
| `GET` | `/api/v1/mock-blueprints/:id` | Get blueprint by ID | `200`, `404 MOCK_BLUEPRINT_NOT_FOUND` |
| `POST` | `/api/v1/mock-blueprints/preview` | Zero-write preview | `200`, `400` |
| `POST` | `/api/v1/mock-sessions` | Create mock session | `201`, `400`, `404 USER_NOT_FOUND` |
| `POST` | `/api/v1/mock-sessions/:id/start` | Start session (idempotent) | `200`, `400`, `404` |
| `GET` | `/api/v1/mock-sessions/:id` | Get session summary | `200`, `403 FORBIDDEN`, `404` |
| `GET` | `/api/v1/mock-sessions/:id/questions/:questionId` | View question (sanitized DTO) | `200`, `400`, `404`, `409 SECTION_LOCKED` |
| `POST` | `/api/v1/mock-sessions/:id/responses` | Save / edit / clear response | `200`, `400 INVALID_OPTION`, `409 RESPONSE_FROZEN` |
| `POST` | `/api/v1/mock-sessions/:id/sections/:sectionId/complete` | Complete section | `200`, `409 SECTION_NOT_ACTIVE` |
| `POST` | `/api/v1/mock-sessions/:id/submit` | Submit test & finalize | `200`, `409 MOCK_SESSION_EXPIRED`, `409 FINALIZATION_IN_PROGRESS` |
| `POST` | `/api/v1/mock-sessions/:id/abandon` | Abandon session | `200`, `409 SESSION_STATE_CONFLICT` |
| `GET` | `/api/v1/mock-sessions/:id/result` | Get scoring & analytics | `200`, `400 MOCK_SESSION_NOT_TERMINAL`, `409` |
| `GET` | `/api/v1/mock-sessions/:id/review` | Question review with explanations | `200`, `400 MOCK_SESSION_NOT_TERMINAL` |
