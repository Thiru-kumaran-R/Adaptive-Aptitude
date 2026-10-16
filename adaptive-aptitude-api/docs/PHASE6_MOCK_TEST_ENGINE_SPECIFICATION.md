# PHASE 6 — MOCK TEST & EXAM SIMULATION ENGINE
## Authoritative Master Implementation Specification

---

### EXECUTIVE ARCHITECTURAL CONTRACT

Phase 6 implements a production-grade, server-authoritative mock test and exam simulation engine on top of the verified Phase 1–5 aptitude platform. It provides standardized exam generation, personalized diagnostic assessments, draft response state management with decoupled review flagging, millisecond-exact session timing, and crash-proof, distributed finalization with resilient three-path lease recovery.

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                   PHASE 6 MASTER TOPOLOGY                                       │
├─────────────────────────────────────────────────────────────────────────────────────────────────┤
│  1. CONFIGURATION & BLUEPRINT DOMAIN                                                            │
│     - Canonical Modes: 'standard' (fixed benchmark) & 'diagnostic' (mastery-targeted)            │
│     - Mode Validation: Strict check precedes fingerprinting; invalid strings reject with 400    │
│     - Explicit Section Scope: topics OR patterns OR (topics + patterns) OR allCanonicalPatterns │
│     - No Fabricated Syllabus: Scope is strictly explicit (never derived from company/exam name) │
│     - Structural Derivation: section.order, totalQuestions, fingerprint, & version derived       │
│     - Authoritative Signed Scoring: correctMarks > 0, incorrectMarks <= 0,                      │
│       unansweredMarks <= 0                                                                      │
│     - Section Timing Reconciliation: free = null duration; section_locked = all or none timed, │
│       sum(section.durationMinutes) <= blueprint.durationMinutes (INVALID_SECTION_TIMING)        │
│     - Normalized SHA-256 Fingerprint: semantic section order + canonicalized effective schema   │
│     - Mode-Aware Recent Exclusion: standard=false, diagnostic=true; explicit override allowed;   │
│       effectiveExcludeRecentQuestions persisted on session and included in fingerprint          │
├─────────────────────────────────────────────────────────────────────────────────────────────────┤
│  2. DETERMINISTIC QUESTION ASSEMBLY PIPELINE                                                    │
│     - Standard Mode: canonical registry order, largest-remainder distribution                   │
│     - Diagnostic Mode: 4 non-overlapping buckets (Weak → Unseen → Developing → Mastered)       │
│     - Intra-Bucket 5-Tier Tie-Break: bucket → lower mastery → fewer attempts → registry → name  │
│     - Difficulty Bands: Easy (1–3), Medium (4–7), Hard (8–10); default 30/50/20 weights        │
│     - Query Stabilization: .sort({ _id: 1 }) prior to deterministic PRNG Fisher-Yates           │
│     - Bounded Recent Exclusion: at most 50 recent Attempts; shortage = 400 (no relaxation)      │
│     - Zero-Write Blueprint Preview: Verified delta = 0 across ALL 5 write collections            │
│       (MockBlueprint, MockSession, MockResponse, MockAttemptFinalizationRecord, Attempt)        │
├─────────────────────────────────────────────────────────────────────────────────────────────────┤
│  3. SERVER-AUTHORITATIVE SESSION LIFECYCLE & CONCURRENCY BARRIER                                │
│     - State Machine: created → started → [submitted | expired | abandoned]                     │
│     - Abandon Lifecycle: created → abandoned, started → abandoned; abandonedAt timestamp;        │
│       atomic submit vs abandon concurrency race (exactly one terminal outcome);                 │
│       abandoned session review strictly denied (no answers or explanations exposed)             │
│     - Exact Expiry: now >= expiresAt terminates mutation (0ms grace period)                     │
│     - Lazy Expiry Finalization: background-worker-free automatic finalization with expiredAt    │
│     - Database-Level Write Contention: responseMutationVersion on MockSession document          │
│     - Cross-Collection Atomicity: saveResponse & first-view draft writes contend directly       │
│       with finalization lock acquisition on the same document via WiredTiger write conflicts    │
│     - Decoupled Review State: status ('viewed'|'answered') + isMarkedForReview (boolean)        │
│     - Answer Clearing: selectedAnswer = null allowed, resets status = 'viewed', preserves mark  │
│     - Strict Answer Validation: selectedAnswer in Question.options or null (INVALID_OPTION)     │
│     - Centralized Error Codes: Dynamic consistency; zero undocumented literals                  │
│     - Zero Answer Leakage: recursive sanitization scanner across all active-state DTOs          │
├─────────────────────────────────────────────────────────────────────────────────────────────────┤
│  4. RESUMABLE, CRASH-PROOF FINALIZATION & THREE-WAY LEASE ENGINE                                │
│     - Path A: Initial Finalization (responsesFrozen: false, finalizationState: idle, owner: null)│
│     - Path B1: Crash Recovery (responsesFrozen: true, state: in_progress, lease expired <= now) │
│     - Path B2: Explicit Failed Recovery (responsesFrozen: true, finalizationState: failed,       │
│       owner: null, lease: null/expired) — permits IMMEDIATE retry without waiting 30 seconds    │
│     - Deterministic Path Resolution: Sequential atomic acquisition resolves path BEFORE state  │
│       is overwritten to in_progress (eliminates path mislabeling bug)                           │
│     - Responses Never Unfreeze: responsesFrozen remains true across crash retries and failures  │
│     - Explicit Failure Protocol: Known worker failure sets state=failed, releases owner/lease,  │
│       preserves finalizationStartedAt, logs MOCK_FINALIZATION_FAILED safely                     │
│     - Distributed Finalization Lease: workerToken, 30s lease, renew heartbeat, fence-on-loss    │
│     - Lifecycle Start Preserved: finalizationStartedAt set only on initial acquisition          │
│     - Authoritative Finalization Set: ONLY frozen ANSWERED responses create Attempt & receipt   │
│     - Unanswered Questions: DO NOT create Attempt or receipt; scored using unansweredMarks;     │
│       zero-answered and partially-answered sessions finalize and rebuild successfully           │
│     - Exactly-Once Attempt Guarantee: unique partial index on Attempt (sessionId + questionId,  │
│       partial source = 'mock')                                                                  │
│     - Attempt-Before-Receipt Recovery: idempotent crash recovery across unwritten receipts      │
│     - Minimal Audit Receipts: MockAttemptFinalizationRecord without duplicate answers or scores │
│     - Receipt -> Attempt Integrity: All 8 linkage fields validated on recovery & rebuild;        │
│       mismatches throw RESULT_INTEGRITY_ERROR                                                   │
│     - Rebuild Completeness: Validates answered responses, not total question count              │
│     - Submissions: 1st caller acquires lease; concurrent callers receive 409; post-final = 200 │
│     - Downstream Integrations: Phase 3 Attempt / Phase 4 Mastery / Phase 5 Revision (Stage 0    │
│       on incorrect only; correct mock attempts DO NOT advance revision stage)                   │
└─────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 1. CENTRALIZED CONFIGURATION & COMPLETE ERROR-CODE REGISTRY

All Phase 6 parameters and error codes are centralized in `src/config/mockConfig.js`. Magic numbers and undocumented string literals are strictly prohibited. Error-code consistency is dynamic: every Phase 6 error code emitted across controllers, services, and validators must exist in `MOCK_ERROR_CODES`, and every documented Phase 6 API error must exist in `MOCK_ERROR_CODES`. The registry count is verified dynamically by automated test suites rather than treated as a permanently hardcoded architectural invariant. `QUESTION_NOT_FOUND` (404) and `FINALIZATION_EXECUTION_FAILED` (500) are fully centralized.

```javascript
'use strict';

module.exports = Object.freeze({
  MOCK_ALGORITHM_VERSION: 'v1',

  MOCK_MODES: Object.freeze({
    STANDARD: 'standard',
    DIAGNOSTIC: 'diagnostic',
  }),

  NAVIGATION_POLICIES: Object.freeze({
    FREE: 'free',
    SECTION_LOCKED: 'section_locked',
  }),

  SESSION_STATUS: Object.freeze({
    CREATED: 'created',
    STARTED: 'started',
    SUBMITTED: 'submitted',
    EXPIRED: 'expired',
    ABANDONED: 'abandoned',
  }),

  FINALIZATION_STATE: Object.freeze({
    IDLE: 'idle',
    IN_PROGRESS: 'in_progress',
    COMPLETED: 'completed',
    FAILED: 'failed',
  }),

  SECTION_STATUS: Object.freeze({
    PENDING: 'pending',
    IN_PROGRESS: 'in_progress',
    COMPLETED: 'completed',
    EXPIRED: 'expired',
  }),

  BLUEPRINT_STATUS: Object.freeze({
    ACTIVE: 'active',
  }),

  RESPONSE_STATUS: Object.freeze({
    VIEWED: 'viewed',
    ANSWERED: 'answered',
  }),

  DIFFICULTY_BANDS: Object.freeze({
    EASY: Object.freeze({ min: 1, max: 3, label: 'easy' }),
    MEDIUM: Object.freeze({ min: 4, max: 7, label: 'medium' }),
    HARD: Object.freeze({ min: 8, max: 10, label: 'hard' }),
  }),

  DEFAULT_DIFFICULTY_DISTRIBUTION: Object.freeze({
    easy: 0.30,
    medium: 0.50,
    hard: 0.20,
  }),

  MOCK_RECENT_QUESTION_EXCLUSION_LIMIT: 50,

  FINALIZATION_LEASE: Object.freeze({
    DURATION_MS: 30000, // 30 seconds initial lease
    HEARTBEAT_INTERVAL_MS: 5000, // Renew every 5 seconds or every 5 questions
  }),

  SESSION_LIMITS: Object.freeze({
    MIN_QUESTIONS: 1,
    MAX_QUESTIONS: 200,
    MIN_DURATION_MINUTES: 1,
    MAX_DURATION_MINUTES: 360, // 6 hours
    MAX_ALLOWED_TIME_TAKEN_SECONDS: 21600, // 6 hours cap for client time reporting
    PACING_TOLERANCE_SECONDS: 5, // Client transit/clock skew tolerance strictly for pacing metadata
  }),

  DIAGNOSTIC_THRESHOLDS: Object.freeze({
    WEAK_MASTERY_UPPER_BOUND: 0.70,
    DEVELOPING_MASTERY_UPPER_BOUND: 0.85,
  }),

  DEFAULT_GLOBAL_SCORING: Object.freeze({
    correctMarks: 1.0,
    incorrectMarks: 0.0,
    unansweredMarks: 0.0,
  }),

  MOCK_ERROR_CODES: Object.freeze({
    MOCK_BLUEPRINT_NOT_FOUND: 'MOCK_BLUEPRINT_NOT_FOUND',
    INVALID_BLUEPRINT: 'INVALID_BLUEPRINT',
    MOCK_SCOPE_REQUIRED: 'MOCK_SCOPE_REQUIRED',
    INVALID_TOPIC: 'INVALID_TOPIC',
    INVALID_PATTERN: 'INVALID_PATTERN',
    INVALID_SECTION_SCOPE: 'INVALID_SECTION_SCOPE',
    INVALID_DIFFICULTY_DISTRIBUTION: 'INVALID_DIFFICULTY_DISTRIBUTION',
    INVALID_SCORING: 'INVALID_SCORING',
    INVALID_SECTION_TIMING: 'INVALID_SECTION_TIMING',
    INSUFFICIENT_QUESTIONS_FOR_MOCK: 'INSUFFICIENT_QUESTIONS_FOR_MOCK',
    MOCK_SESSION_NOT_FOUND: 'MOCK_SESSION_NOT_FOUND',
    MOCK_SESSION_EXPIRED: 'MOCK_SESSION_EXPIRED',
    INVALID_SESSION_STATE: 'INVALID_SESSION_STATE',
    QUESTION_NOT_IN_SESSION: 'QUESTION_NOT_IN_SESSION',
    QUESTION_NOT_FOUND: 'QUESTION_NOT_FOUND', // Centralized (404)
    INVALID_OPTION: 'INVALID_OPTION',
    INVALID_TIME_TAKEN: 'INVALID_TIME_TAKEN',
    RESPONSE_FROZEN: 'RESPONSE_FROZEN',
    SECTION_LOCKED: 'SECTION_LOCKED',
    SECTION_NOT_ACTIVE: 'SECTION_NOT_ACTIVE',
    FINALIZATION_IN_PROGRESS: 'FINALIZATION_IN_PROGRESS',
    FINALIZATION_LEASE_LOST: 'FINALIZATION_LEASE_LOST',
    FINALIZATION_EXECUTION_FAILED: 'FINALIZATION_EXECUTION_FAILED', // Centralized (500)
    SESSION_STATE_CONFLICT: 'SESSION_STATE_CONFLICT',
    MOCK_SESSION_NOT_TERMINAL: 'MOCK_SESSION_NOT_TERMINAL',
    RESULT_INCOMPLETE_FINALIZATION: 'RESULT_INCOMPLETE_FINALIZATION', // Centralized (500)
    RESULT_INTEGRITY_ERROR: 'RESULT_INTEGRITY_ERROR', // Centralized (500)
    USER_NOT_FOUND: 'USER_NOT_FOUND',
    FORBIDDEN: 'FORBIDDEN',
  }),

  MOCK_HTTP_STATUS_MAP: Object.freeze({
    // 400 Bad Request — Malformed client requests / syntax / bounds violations
    INVALID_BLUEPRINT: 400,
    MOCK_SCOPE_REQUIRED: 400,
    INVALID_TOPIC: 400,
    INVALID_PATTERN: 400,
    INVALID_SECTION_SCOPE: 400,
    INVALID_DIFFICULTY_DISTRIBUTION: 400,
    INVALID_SCORING: 400,
    INVALID_SECTION_TIMING: 400,
    INSUFFICIENT_QUESTIONS_FOR_MOCK: 400,
    INVALID_SESSION_STATE: 400,
    QUESTION_NOT_IN_SESSION: 400,
    INVALID_OPTION: 400,
    INVALID_TIME_TAKEN: 400,
    MOCK_SESSION_NOT_TERMINAL: 400,

    // 403 Forbidden — Access control & ownership mismatch
    FORBIDDEN: 403,

    // 404 Not Found — Resource absence
    MOCK_BLUEPRINT_NOT_FOUND: 404,
    MOCK_SESSION_NOT_FOUND: 404,
    QUESTION_NOT_FOUND: 404,
    USER_NOT_FOUND: 404,

    // 409 Conflict — Lifecycle state races, lock barriers & lease contention
    MOCK_SESSION_EXPIRED: 409,
    RESPONSE_FROZEN: 409,
    SECTION_LOCKED: 409,
    SECTION_NOT_ACTIVE: 409,
    FINALIZATION_IN_PROGRESS: 409,
    FINALIZATION_LEASE_LOST: 409,
    SESSION_STATE_CONFLICT: 409,

    // 500 Internal Server Error — Worker execution failure & persisted data invariant violations
    FINALIZATION_EXECUTION_FAILED: 500,
    RESULT_INCOMPLETE_FINALIZATION: 500,
    RESULT_INTEGRITY_ERROR: 500,
  }),
});
```

---

## 2. DATA MODELS & SCHEMAS

### 2.1 `MockBlueprint` Model (`src/models/mockBlueprintModel.js`)

```javascript
'use strict';

const mongoose = require('mongoose');
const { MOCK_MODES, NAVIGATION_POLICIES, BLUEPRINT_STATUS } = require('../config/mockConfig');

// Explicit Scope: genuine patterns-only, topics-only, topics+patterns, or allCanonicalPatterns.
// No syllabus is ever fabricated from company, government, competitive exams, goal types, or blueprint titles.
const sectionScopeSchema = new mongoose.Schema(
  {
    topics: { type: [String], default: undefined }, // Canonical topics (optional)
    patterns: { type: [String], default: undefined }, // Canonical patterns (optional, genuine patterns-only supported)
    allCanonicalPatterns: { type: Boolean, default: false }, // When true, topics/patterns must be empty/omitted
  },
  { _id: false }
);

const difficultyDistributionSchema = new mongoose.Schema(
  {
    easy: { type: Number, required: true, min: 0, max: 1 },
    medium: { type: Number, required: true, min: 0, max: 1 },
    hard: { type: Number, required: true, min: 0, max: 1 },
  },
  { _id: false }
);

const sectionScoringSchema = new mongoose.Schema(
  {
    correctMarks: { type: Number, required: true, min: 0.0001 },
    incorrectMarks: { type: Number, required: true, max: 0 },
    unansweredMarks: { type: Number, required: true, max: 0 },
  },
  { _id: false }
);

const sectionSchema = new mongoose.Schema(
  {
    sectionId: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    order: { type: Number, required: true, min: 0 }, // Server-derived (0, 1, 2...)
    questionCount: { type: Number, required: true, min: 1, max: 200 },
    durationMinutes: { type: Number, default: null, min: 1 }, // Null for free nav or untimed; required for all if any timed
    scope: { type: sectionScopeSchema, required: true },
    difficultyDistribution: { type: difficultyDistributionSchema, default: null },
    scoring: { type: sectionScoringSchema, default: null },
  },
  { _id: false }
);

const mockBlueprintSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: '' },
    mode: {
      type: String,
      required: true,
      enum: Object.values(MOCK_MODES),
      default: MOCK_MODES.STANDARD,
    },
    navigationPolicy: {
      type: String,
      required: true,
      enum: Object.values(NAVIGATION_POLICIES),
      default: NAVIGATION_POLICIES.FREE,
    },
    durationMinutes: { type: Number, required: true, min: 1, max: 360 },
    totalQuestions: { type: Number, required: true, min: 1, max: 200 }, // Server-derived sum(sections.questionCount)
    scoring: {
      correctMarks: { type: Number, required: true, min: 0.0001, default: 1.0 },
      incorrectMarks: { type: Number, required: true, max: 0, default: 0.0 },
      unansweredMarks: { type: Number, required: true, max: 0, default: 0.0 },
    },
    excludeRecentQuestions: { type: Boolean, default: null }, // Null delegates to mode default (standard: false, diagnostic: true); boolean overrides
    sections: {
      type: [sectionSchema],
      required: true,
      validate: [
        {
          validator: (val) => Array.isArray(val) && val.length > 0,
          message: 'Blueprint must contain at least one section.',
        },
      ],
    },
    blueprintFingerprint: { type: String, required: true, trim: true, index: true }, // Server-derived SHA-256
    status: {
      type: String,
      required: true,
      enum: Object.values(BLUEPRINT_STATUS),
      default: BLUEPRINT_STATUS.ACTIVE,
    },
    algorithmVersion: { type: String, required: true, default: 'v1' }, // Server-derived
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: false, versionKey: false }
);

mockBlueprintSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('MockBlueprint', mockBlueprintSchema);
```

### 2.2 `MockSession` Model (`src/models/mockSessionModel.js`)

```javascript
'use strict';

const mongoose = require('mongoose');
const {
  SESSION_STATUS,
  FINALIZATION_STATE,
  NAVIGATION_POLICIES,
  MOCK_MODES,
  SECTION_STATUS,
} = require('../config/mockConfig');

const questionSequenceEntrySchema = new mongoose.Schema(
  {
    questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
    sectionId: { type: String, required: true },
    order: { type: Number, required: true },
    topic: { type: String, required: true },
    pattern: { type: String, required: true },
    difficulty: { type: Number, required: true },
  },
  { _id: false }
);

const sessionSectionStateSchema = new mongoose.Schema(
  {
    sectionId: { type: String, required: true },
    order: { type: Number, required: true },
    status: {
      type: String,
      required: true,
      enum: Object.values(SECTION_STATUS), // Enforced canonical enum
      default: SECTION_STATUS.PENDING,
    },
    startedAt: { type: Date, default: null },
    expiresAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    durationMinutes: { type: Number, default: null },
    questionCount: { type: Number, required: true },
  },
  { _id: false }
);

const mockSessionSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, trim: true },
    blueprintId: { type: mongoose.Schema.Types.ObjectId, ref: 'MockBlueprint', default: null },
    blueprintSnapshot: { type: mongoose.Schema.Types.Mixed, required: true },
    blueprintFingerprint: { type: String, required: true },
    mode: { type: String, required: true, enum: Object.values(MOCK_MODES) },
    navigationPolicy: { type: String, required: true, enum: Object.values(NAVIGATION_POLICIES) },
    effectiveExcludeRecentQuestions: { type: Boolean, required: true }, // Persisted effective value (standard: false, diagnostic: true, or explicit override)
    currentSectionId: { type: String, default: null }, // Null before start, or valid sectionId in sectionStates
    questionSequence: { type: [questionSequenceEntrySchema], required: true },
    sectionStates: { type: [sessionSectionStateSchema], required: true },
    totalQuestions: { type: Number, required: true },
    durationMinutes: { type: Number, required: true },
    generationSeed: { type: String, required: true },
    algorithmVersion: { type: String, required: true, default: 'v1' },

    status: {
      type: String,
      required: true,
      enum: Object.values(SESSION_STATUS),
      default: SESSION_STATUS.CREATED, // created → started → [submitted | expired | abandoned]
    },

    // ── Concurrency & Database-Level Write Contention ───────────────────────
    responseMutationVersion: { type: Number, default: 0 },
    responsesFrozen: { type: Boolean, default: false },

    // ── Distributed Finalization Lease ─────────────────────────────────────
    finalizationState: {
      type: String,
      required: true,
      enum: Object.values(FINALIZATION_STATE),
      default: FINALIZATION_STATE.IDLE,
    },
    finalizationOwnerToken: { type: String, default: null },
    finalizationLeaseExpiresAt: { type: Date, default: null },
    finalizationHeartbeatAt: { type: Date, default: null },
    finalizationStartedAt: { type: Date, default: null }, // Preserved across recovery; set only on initial acquisition
    finalizationTargetStatus: {
      type: String,
      enum: [SESSION_STATUS.SUBMITTED, SESSION_STATUS.EXPIRED],
      default: null,
      // Records the immutable terminal intention of a finalization lifecycle. Not another session state.
      // Lifecycle: created -> null; started (pre-finalization) -> null;
      // initial acquisition (Path A / Final Section) -> submitted OR expired;
      // Path B1 crash recovery -> unchanged (preserved); Path B2 failed recovery -> unchanged (preserved);
      // terminal completion -> retained (never cleared).
    },

    // ── Exact Server Timestamps ───────────────────────────────────────────
    createdAt: { type: Date, default: Date.now },
    startedAt: { type: Date, default: null },
    expiresAt: { type: Date, default: null },
    submittedAt: { type: Date, default: null },
    expiredAt: { type: Date, default: null },
    abandonedAt: { type: Date, default: null }, // Populated on POST /abandon; terminal state

    // ── Frozen Final Score & Analytics Summary ────────────────────────────
    resultSummary: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { timestamps: false, versionKey: false }
);

mockSessionSchema.index({ userId: 1, status: 1, createdAt: -1 });
mockSessionSchema.index({ expiresAt: 1 }, { partialFilterExpression: { status: 'started' } });
mockSessionSchema.index(
  { finalizationOwnerToken: 1, finalizationLeaseExpiresAt: 1 },
  { partialFilterExpression: { finalizationOwnerToken: { $type: 'string' } } }
);

module.exports = mongoose.model('MockSession', mockSessionSchema);
```

### 2.3 `MockResponse` Model (`src/models/mockResponseModel.js`)

```javascript
'use strict';

const mongoose = require('mongoose');
const { RESPONSE_STATUS } = require('../config/mockConfig');

const mockResponseSchema = new mongoose.Schema(
  {
    sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'MockSession', required: true },
    questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
    userId: { type: String, required: true, trim: true },
    sectionId: { type: String, required: true },
    selectedAnswer: { type: String, default: null, trim: true }, // Null when unanswered/cleared
    status: {
      type: String,
      required: true,
      enum: Object.values(RESPONSE_STATUS), // 'viewed' or 'answered'
      default: RESPONSE_STATUS.VIEWED,
    },
    isMarkedForReview: { type: Boolean, default: false }, // Decoupled review flag
    isViewed: { type: Boolean, default: true },
    viewedAt: { type: Date, default: Date.now },
    timeTakenSeconds: { type: Number, default: 0, min: 0 },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: false, versionKey: false }
);

mockResponseSchema.index({ sessionId: 1, questionId: 1 }, { unique: true });
mockResponseSchema.index({ sessionId: 1, sectionId: 1 });

module.exports = mongoose.model('MockResponse', mockResponseSchema);
```

### 2.4 `MockAttemptFinalizationRecord` Model (`src/models/mockAttemptFinalizationRecordModel.js`)

The `MockAttemptFinalizationRecord` is strictly an audit and crash-recovery link between a session, an answered question, and its immutable Phase 3 Attempt.

**Authoritative Invariants**:
1. It MUST NOT duplicate Attempt or Question data (no `isCorrect`, `rawScoreAwarded`, `timeTakenSeconds`, `topic`, `pattern`, `difficulty`, or option data). The source truths are `Question`, `Attempt`, and the `MockSession` blueprint/scoring snapshot.
2. Only frozen ANSWERED responses (`selectedAnswer !== null`) receive an Attempt and a `MockAttemptFinalizationRecord`.
3. Unanswered questions NEVER create an Attempt or a `MockAttemptFinalizationRecord`.

```javascript
'use strict';

const mongoose = require('mongoose');

const mockAttemptFinalizationRecordSchema = new mongoose.Schema(
  {
    sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'MockSession', required: true },
    questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
    userId: { type: String, required: true, trim: true },
    attemptId: { type: mongoose.Schema.Types.ObjectId, ref: 'Attempt', required: true },
    algorithmVersion: { type: String, required: true, default: 'v1' },
    status: { type: String, enum: ['completed'], default: 'completed' },
    finalizedAt: { type: Date, default: Date.now },
  },
  { timestamps: false, versionKey: false }
);

mockAttemptFinalizationRecordSchema.index({ sessionId: 1, questionId: 1 }, { unique: true });
mockAttemptFinalizationRecordSchema.index({ sessionId: 1, attemptId: 1 });

module.exports = mongoose.model('MockAttemptFinalizationRecord', mockAttemptFinalizationRecordSchema);
```

### 2.5 Updated `Attempt` Partial Unique Index (`src/models/attemptModel.js`)

```javascript
// Database-level guarantee: exactly one mock Attempt per (sessionId, questionId)
attemptSchema.index(
  { sessionId: 1, questionId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      source: 'mock',
      sessionId: { $type: 'string' },
    },
  }
);
```

---

## 3. BLUEPRINT CONTRACT, VALIDATION & SERVER DERIVATION

### 3.1 Server-Derived Structural Fields
The server derives and enforces structural invariants, ignoring or validating client values:
1. **`section.order`**: Automatically assigned strictly from array index: $\text{section}[i].\text{order} = i$.
2. **`totalQuestions`**: Derived as $\sum \text{sections}[i].\text{questionCount}$. Must satisfy $1 \le \text{totalQuestions} \le 200$. If client provides `totalQuestions`, it must match this derived sum or reject with `400 INVALID_BLUEPRINT`.
3. **`blueprintFingerprint`**: Calculated server-side by normalizing the effective blueprint $\to$ canonical JSON $\to$ SHA-256 hash. Client input is ignored.
4. **`algorithmVersion`**: Assigned directly from `MOCK_ALGORITHM_VERSION = 'v1'`.

### 3.2 Section Scope Matrix & Validation
Every section within a blueprint must satisfy **exactly one** of the following four explicit scope modalities:
1. **Topics Only**: `scope.topics` non-empty canonical array; `patterns` empty or omitted; `allCanonicalPatterns: false`. Meaning: all canonical patterns belonging to those specified topics.
2. **Patterns Only**: `scope.patterns` non-empty canonical array; `topics` empty or omitted; `allCanonicalPatterns: false`. Genuine pattern-only scope without requiring any artificial topic.
3. **Topics + Patterns**: Both `topics` and `patterns` non-empty. Every supplied pattern **must belong** to one of the specified topics (`registryService.patternBelongsToTopic(p, topic)`). Otherwise reject with **`400 INVALID_SECTION_SCOPE`**.
4. **All Canonical Patterns**: `scope.allCanonicalPatterns: true`; `topics` and `patterns` must be empty or omitted. If topics or patterns are provided alongside `allCanonicalPatterns: true`, reject with **`400 INVALID_SECTION_SCOPE`**.

If no scope is specified (all fields empty/omitted and `allCanonicalPatterns: false`), reject with **`400 MOCK_SCOPE_REQUIRED`**.

**No Fabricated Syllabus**: Do not derive syllabus or scope from company, government, competitive exams, goal types, or blueprint titles. Phase 6 section scope remains strictly explicit.

### 3.3 Section Duration & Navigation Reconciliation
- For `navigationPolicy = 'free'`: Every section must have `section.durationMinutes = null`. Any section specifying a duration rejects with **`400 INVALID_SECTION_TIMING`**.
- For `navigationPolicy = 'section_locked'`:
  - If no section timing is enabled: all `section.durationMinutes` must be `null`.
  - If section timing is enabled: **every section must define `durationMinutes !== null`**. Any partial section timing (e.g. some sections timed, others untimed) rejects with **`400 INVALID_SECTION_TIMING`**.
  - The sum of section durations must not exceed the blueprint global duration:
    $$\sum_{s \in \text{sections}} s.\text{durationMinutes} \le \text{blueprint}.\text{durationMinutes}$$
  - Violations where $\sum s.\text{durationMinutes} > \text{blueprint}.\text{durationMinutes}$ reject with **`400 INVALID_SECTION_TIMING`**.
  - The approved contract is strictly $\le$ (sum <= global duration accepted; equality is not required). The global timer remains the absolute hard limit.

### 3.4 Mode Validation & Canonical Fingerprint Pipeline
Mode validation **strictly precedes** fingerprint normalization. If `mode` is not in `['standard', 'diagnostic']`, reject with **`400 INVALID_BLUEPRINT`** (never silently default invalid strings).

#### Mode-Aware Recent Question Exclusion Contract:
- `standard` mode default: `excludeRecentQuestions = false`.
- `diagnostic` mode default: `excludeRecentQuestions = true`.
- Client explicit boolean override supported: `{ "excludeRecentQuestions": true }` or `{ "excludeRecentQuestions": false }`.
- Effective resolution:
  ```javascript
  const effectiveExcludeRecentQuestions =
    typeof blueprint.excludeRecentQuestions === 'boolean'
      ? blueprint.excludeRecentQuestions
      : mode === MOCK_MODES.DIAGNOSTIC;
  ```
- This effective boolean is:
  1. Used during deterministic question generation.
  2. Persisted/snapshotted on `MockSession.effectiveExcludeRecentQuestions` and in `MockSession.blueprintSnapshot`.
  3. Included in the canonical blueprint fingerprint.

```javascript
const crypto = require('crypto');
const { MOCK_MODES, DEFAULT_DIFFICULTY_DISTRIBUTION } = require('../config/mockConfig');

const normalizeMockBlueprintForFingerprint = (blueprint) => {
  // Mode validation has already succeeded at the boundary
  const mode = blueprint.mode.toLowerCase();

  const effectiveExcludeRecentQuestions =
    typeof blueprint.excludeRecentQuestions === 'boolean'
      ? blueprint.excludeRecentQuestions
      : mode === MOCK_MODES.DIAGNOSTIC;

  const navigationPolicy = blueprint.navigationPolicy || 'free';
  const globalScoring = {
    correctMarks: Number(blueprint.scoring?.correctMarks ?? 1.0),
    incorrectMarks: Number(blueprint.scoring?.incorrectMarks ?? 0.0),
    unansweredMarks: Number(blueprint.scoring?.unansweredMarks ?? 0.0),
  };

  // Section order is SEMANTIC and preserved
  const sections = (blueprint.sections || []).map((sec, idx) => {
    const secScoring = {
      correctMarks: Number(sec.scoring?.correctMarks ?? globalScoring.correctMarks),
      incorrectMarks: Number(sec.scoring?.incorrectMarks ?? globalScoring.incorrectMarks),
      unansweredMarks: Number(sec.scoring?.unansweredMarks ?? globalScoring.unansweredMarks),
    };

    const isAllCanonical = Boolean(sec.scope?.allCanonicalPatterns);
    const topics = !isAllCanonical && sec.scope?.topics ? [...sec.scope.topics].sort() : [];
    const patterns = !isAllCanonical && sec.scope?.patterns ? [...sec.scope.patterns].sort() : [];

    const diffDist = sec.difficultyDistribution
      ? {
          easy: Number(sec.difficultyDistribution.easy ?? DEFAULT_DIFFICULTY_DISTRIBUTION.easy),
          medium: Number(sec.difficultyDistribution.medium ?? DEFAULT_DIFFICULTY_DISTRIBUTION.medium),
          hard: Number(sec.difficultyDistribution.hard ?? DEFAULT_DIFFICULTY_DISTRIBUTION.hard),
        }
      : { ...DEFAULT_DIFFICULTY_DISTRIBUTION };

    return {
      sectionId: String(sec.sectionId),
      order: idx, // Server-derived index
      questionCount: Number(sec.questionCount),
      durationMinutes: sec.durationMinutes !== null && sec.durationMinutes !== undefined ? Number(sec.durationMinutes) : null,
      scope: {
        allCanonicalPatterns: isAllCanonical,
        topics,
        patterns,
      },
      difficultyDistribution: diffDist,
      scoring: secScoring,
    };
  });

  return {
    mode,
    navigationPolicy,
    durationMinutes: Number(blueprint.durationMinutes),
    totalQuestions: sections.reduce((sum, s) => sum + s.questionCount, 0),
    excludeRecentQuestions: effectiveExcludeRecentQuestions,
    scoring: globalScoring,
    sections,
  };
};

const computeBlueprintFingerprint = (blueprint) => {
  const normalized = normalizeMockBlueprintForFingerprint(blueprint);
  return crypto.createHash('sha256').update(JSON.stringify(normalized)).digest('hex');
};
```

---

## 4. ZERO-WRITE BLUEPRINT PREVIEW

- **Route**: `POST /api/v1/mock-blueprints/preview`
- Evaluates blueprint structure, section uniqueness, scope validity, and question bank availability.
- In `diagnostic` mode, accepts an optional `userId` to compute personalized bucket allocations.
- **Zero-Write Guarantee Across All 5 Write Collections**: Pre/post document counts across ALL five Phase 6 write collections are verified to be strictly equal ($\Delta = 0$):
  1. `MockBlueprint` ($\Delta = 0$)
  2. `MockSession` ($\Delta = 0$)
  3. `MockResponse` ($\Delta = 0$)
  4. `MockAttemptFinalizationRecord` ($\Delta = 0$)
  5. `Attempt` ($\Delta = 0$)

---

## 5. DETERMINISTIC QUESTION ASSEMBLER & ALLOCATION

### 5.1 Standard Mode Question Allocation
1. Resolve eligible canonical patterns in the section scope.
2. Sort patterns strictly by **canonical registry order** (`patternRegistryService`).
3. Given $Q$ requested questions and $P$ eligible patterns:
   - If $P \le Q$: Base $B = \lfloor Q / P \rfloor$, remainder $R = Q \pmod P$. First $R$ patterns receive $B + 1$ questions; remaining receive $B$.
   - If $P > Q$: First $Q$ patterns receive 1 question each; remaining receive 0.

### 5.2 Diagnostic Mode Question Allocation
1. For EVERY canonical eligible pattern in the requested scope:
   - Query `StudentProgress` for `(userId, topic, pattern)`.
   - If no document exists, construct an in-memory normalized state:
     ```javascript
     {
       pattern,
       mastery: 0,
       attempts: 0,
       registryIndex: patternRegistryService.getPatternRegistryIndex(pattern),
     }
     ```
     **Invariant**: Do NOT persist a `StudentProgress` document merely to classify the mock.
   - Partition patterns into 4 mutually exclusive, exhaustive buckets:
     - **`Weak`**: `attempts > 0` **AND** `mastery < 0.70` (includes `mastery === 0`)
     - **`Unseen`**: `attempts === 0` (includes all normalized patterns with no prior progress records)
     - **`Developing`**: `0.70 <= mastery < 0.85`
     - **`Mastered`**: `mastery >= 0.85`
   - **Partial Progress Handling**: If scope contains patterns with progress and patterns without progress, patterns without progress participate as `attempts: 0, mastery: 0` in the `Unseen` bucket.
   - **New-Student Guarantee**: For a user with zero `StudentProgress` documents, 100% of patterns in scope classify as `Unseen`, sorted by canonical registry order, and allocated deterministically.
2. Sort patterns within each bucket using the authoritative **5-tier comparator**:
   ```javascript
   const comparePatternsInBucket = (a, b) => {
     // 1. Lower mastery first
     if (Math.abs(a.mastery - b.mastery) > 0.00001) {
       return a.mastery - b.mastery;
     }
     // 2. Fewer attempts first
     if (a.attempts !== b.attempts) {
       return a.attempts - b.attempts;
     }
     // 3. Canonical registry order (derived from patternRegistry.json index)
     if (a.registryIndex !== b.registryIndex) {
       return a.registryIndex - b.registryIndex;
     }
     // 4. Lexicographical pattern name fallback
     return a.pattern.localeCompare(b.pattern);
   };
   ```
3. Concatenate buckets in priority order:
   $$\text{rankedPatterns} = [\dots\text{Weak}, \dots\text{Unseen}, \dots\text{Developing}, \dots\text{Mastered}]$$
4. Distribute $Q$ questions across top $K = \min(Q, \text{rankedPatterns.length})$ patterns via largest-remainder integer division ($B = \lfloor Q / K \rfloor$, $R = Q \pmod K$).

### 5.3 Difficulty Allocation & Seeded PRNG
- Difficulty weights (`easy`, `medium`, `hard`) must sum to $1.0$. Integer counts per pattern are allocated via the largest-remainder method.
- Candidate queries must enforce baseline stabilization:
  ```javascript
  const candidates = await Question.find(query).sort({ _id: 1 }).lean();
  ```
- Deterministic Fisher-Yates PRNG seeded with `generationSeed` selects final questions.
- If constraints cannot be met without question duplication, abort with **`400 INSUFFICIENT_QUESTIONS_FOR_MOCK`**.

### 5.4 Recent Question Exclusion
- Effective Default: `false` for `STANDARD`, `true` for `DIAGNOSTIC`. Client may explicitly override via boolean `excludeRecentQuestions: true` or `false`.
- When enabled, load at most the latest `MOCK_RECENT_QUESTION_EXCLUSION_LIMIT = 50` user attempts across the complete Phase 3 Attempt history (`practice`, `daily_plan`, `adaptive`, `revision`, `mock`, and any other valid Phase 3 source) using the existing `{ userId: 1, attemptedAt: -1 }` index:
  ```javascript
  const recentAttempts = await Attempt.find({ userId })
    .sort({ attemptedAt: -1 })
    .limit(MOCK_RECENT_QUESTION_EXCLUSION_LIMIT)
    .select('questionId')
    .lean();
  const excludedQuestionIds = new Set(recentAttempts.map((a) => a.questionId.toString()));
  ```
  Do NOT filter out valid Attempt sources. The exclusion naturally inspects the student's complete recent attempt history without creating redundant source-specific indexes.
- Shortfall Safety: If recent question exclusion causes a shortage, throw **`400 INSUFFICIENT_QUESTIONS_FOR_MOCK`**. Zero silent relaxation.

### 5.5 Strict Session-Wide Question Uniqueness Invariant
A generated mock session may **NEVER contain the same `questionId` more than once anywhere in the same session**. This invariant applies across all patterns, difficulty buckets, topics, and sections:
1. **Global Selected Set**:
   During deterministic question assembly across all sections, maintain a single session-wide set of selected question IDs:
   ```javascript
   const selectedQuestionIds = new Set();
   ```
   Before accepting any candidate question for any pattern, difficulty, or section:
   ```javascript
   if (selectedQuestionIds.has(question._id.toString())) {
     continue; // Candidate already assigned to another slot in the session
   }
   selectedQuestionIds.add(question._id.toString());
   ```
2. **Cross-Section Duplication Elimination**:
   Overlapping section scopes (e.g. Section A scopes the topic `Percentage`, while Section B scopes pattern `Successive Percentage Change` which belongs to `Percentage`) must never duplicate questions. The global set guarantees distinct Question documents across all sections.
3. **Shortfall Invariant**:
   If exact question count constraints cannot be satisfied after enforcing session-wide uniqueness, the generator must abort and throw **`400 INSUFFICIENT_QUESTIONS_FOR_MOCK`**. The generator must **NEVER**:
   - Duplicate questions within or across sections
   - Silently relax difficulty distribution
   - Silently relax recent question exclusion
   - Silently alter blueprint scope
4. **Deterministic Replay Guarantee**:
   The candidate query sort (`{ _id: 1 }`) $\to$ seeded Fisher-Yates PRNG $\to$ global uniqueness filtering pipeline guarantees that identical inputs (`question-bank state + normalized blueprint + generationSeed + algorithmVersion`) deterministically produce the exact same ordered session question sequence.

---

## 6. SESSION LIFECYCLE & SERVER-AUTHORITATIVE TIMING

### 6.1 State Machine & Invariants
- Valid Transitions:
  - `created` $\to$ `started`
  - `created` $\to$ `abandoned`
  - `started` $\to$ `submitted`
  - `started` $\to$ `expired`
  - `started` $\to$ `abandoned`
- Terminal States: `submitted`, `expired`, `abandoned`.
- Start Idempotency: Calling `/start` on an active session returns current state without altering `startedAt` or `expiresAt`.

### 6.2 Strict Server-Authoritative Timer (0ms Grace Period)
- $\text{now} < \text{expiresAt} \implies$ **Active**. $\text{now} \ge \text{expiresAt} \implies$ **Expired**.
- Exact 0ms grace period. Pacing metadata tolerance (+5s) applies strictly to `timeTakenSeconds` reporting.

### 6.3 Authoritative Expiry Handoff & Lazy Finalization
A session that reaches or exceeds its expiry timestamp ($\text{now} \ge \text{expiresAt}$) is terminal and must not remain in `status = started`.
To guarantee uniform lifecycle transitions without nested or competing transaction behaviors, all session operations invoke one centralized orchestration boundary:
```text
resolveSessionExpiry(sessionId, userId, now)
```

#### 6.3.1 Mandatory Orchestration Invocations
At minimum, `resolveSessionExpiry` is checked across all entry points:
- `GET /api/v1/mock-sessions/:id`
- `GET /api/v1/mock-sessions/:id/questions/:questionId`
- `POST /api/v1/mock-sessions/:id/responses`
- `POST /api/v1/mock-sessions/:id/sections/:sectionId/complete`
- `POST /api/v1/mock-sessions/:id/submit`
- `POST /api/v1/mock-sessions/:id/abandon`
- `GET /api/v1/mock-sessions/:id/result`

#### 6.3.2 Execution Rules & Save Response Isolation
1. **Clock Evaluation**: If $\text{now} < \text{expiresAt}$, execution proceeds normally. If $\text{now} \ge \text{expiresAt}$, `finalizeMockSession(sessionId, userId, targetStatus = SESSION_STATUS.EXPIRED)` is invoked using the standard three-way lease acquisition protocol (Path A, B1, or B2), exactly-once Attempt processing, receipt recovery, signed scoring, and terminal write fencing.
2. **Do Not Finalize Inside Aborted Save Transaction**:
   For `saveResponse`:
   - Inner or pre-transaction check detects $\text{now} \ge \text{expiresAt}$.
   - Ensure the response mutation **DOES NOT commit**.
   - Abort/exit the response MongoDB transaction immediately.
   - Outside that transaction, trigger `finalizeMockSession(sessionId, userId, targetStatus = SESSION_STATUS.EXPIRED)`.
   - Return **`409 MOCK_SESSION_EXPIRED`**.
   - The session must never remain indefinitely in `started + expired clock` state.
3. **Read Endpoint Contract**:
   - `GET /mock-sessions/:id`: returns terminal `status = 'expired'`, `expiredAt` populated, `submittedAt = null` once finalization completes. While active finalization is running (`finalizationState = in_progress`, `finalizationLeaseExpiresAt > now`), returns active/frozen session state (`status = started`, `responsesFrozen = true`, `finalizationState = in_progress`) with strict zero answer leakage.
   - `GET /mock-sessions/:id/result`: triggers lazy expiry finalization if not already completed, then returns the persisted `resultSummary`. If another valid finalization worker is currently processing (`finalizationState = in_progress`, `finalizationLeaseExpiresAt > now`), returns **`409 FINALIZATION_IN_PROGRESS`** (never returns `200 null`). Once finalization completes, returns **`200 OK`** with persisted `resultSummary`.
4. **Strict Idempotency**: Repeated reads or mutations on an expired session are completely idempotent, producing zero additional Attempt writes.

### 6.4 Navigation Policies & Server-Authoritative Section Timing
- **`free`**: Global timer only. Free jumping across questions and sections.
- **`section_locked`**: Sequential progression ($0 \to 1 \dots \to N-1$).
  - Section 0 begins `in_progress`; remaining sections begin `pending`.
  - `currentSectionId`: Must be `null` before start, or refer to an existing `sectionStates[].sectionId`. During an active session, **exactly one section must be `in_progress`**.
  - Completing section $k$ marks it `completed` and activates section $k+1$.
  - **Server-Authoritative Section Timing & Exact Deadline**:
    When section timing is enabled (`activeSection.durationMinutes != null`):
    $$\text{activeSection.expiresAt} = \min(\text{activeSection.startedAt} + \text{durationMinutes} \times 60 \times 1000, \text{MockSession.expiresAt})$$
    The global session expiry remains the absolute hard limit.
    - $\text{now} < \text{activeSection.expiresAt} \implies$ **Section Active**.
    - $\text{now} \ge \text{activeSection.expiresAt} \implies$ **Section Expired** (zero timing grace).
    - `SESSION_LIMITS.PACING_TOLERANCE_SECONDS` (+5s) applies strictly to validating reported `timeTakenSeconds` pacing metadata and **NEVER extends section validity or expiry**.
  - **Lazy Section Expiry Resolution & Race-Safe Idempotent Transitions**:
    Phase 6 V1 does not require a background scheduler. Prior to section-scoped operations (view question, save response, complete section, get session), the server evaluates $\text{now} \ge \text{activeSection.expiresAt}$:
    1. **Current Section Expiry**: Transitions current section `IN_PROGRESS -> EXPIRED`, `completedAt = now`.
    2. **Locking**: Once section status is `completed` or `expired`, no further response mutation is allowed for questions in that section. Returns **`409 SECTION_LOCKED`**. Prior sections cannot be reopened.
    3. **Non-Final Section Atomic Transition**:
       For a non-final section transition, both the current section and the next section must change consistently in ONE logically atomic transition:
       - Current section: `status = COMPLETED` (manual) or `EXPIRED` (lazy timeout), `completedAt = now`.
       - Next section: `status = IN_PROGRESS`, `startedAt = now`, `expiresAt = (activeSection.durationMinutes != null ? min(now + next.durationMinutes, session.expiresAt) : null)`.
       - Session: `currentSectionId = next.sectionId`.
       - **Anti-Stranding Invariant**: Do NOT perform current section update and next section activation as two sequential independent operations. A worker crash between them would strand the session with zero active sections.
    4. **Final Section Timeout & Atomic Finalization Barrier (Zero Race Window)**:
       - For the final section, the transaction that transitions the section MUST ALSO atomically establish the finalization barrier within the **SAME single document write**:
         - Current section: `status = COMPLETED` (manual) or `EXPIRED` (timeout), `completedAt = now`.
         - `currentSectionId = null`.
         - `responsesFrozen = true`.
         - `finalizationState = FINALIZATION_STATE.IN_PROGRESS`.
         - `finalizationOwnerToken = workerToken`.
         - `finalizationLeaseExpiresAt = new Date(now.getTime() + FINALIZATION_LEASE.DURATION_MS)`.
         - `finalizationHeartbeatAt = now`.
         - `finalizationStartedAt = now`.
         - `finalizationTargetStatus = (now.getTime() >= session.expiresAt.getTime() ? SESSION_STATUS.EXPIRED : SESSION_STATUS.SUBMITTED)`.
         - `responseMutationVersion += 1`.
       - **Zero Race Window**: Eliminates any intermediate state where the final section is completed while `responsesFrozen = false` and `finalizationState = idle`. A concurrent `/abandon` request immediately sees `responsesFrozen: true` or `finalizationState: in_progress` and is rejected with **`409 SESSION_STATE_CONFLICT`**.
       - **Zero Redundant Path A Acquisition**: Because the final-section transaction already establishes lease ownership, freeze barrier, and immutable target status, the orchestrator DOES NOT invoke standard Path A acquisition again. It captures `responseSnapshot` under the same transaction and proceeds directly to `processFinalizationWithOwnedLease(...)` with `acquisitionPath = 'FINAL_SECTION_INITIAL'`.
       - **Final Section vs Abandon Race**:
         - Outcome A (Final Section Wins First): Final-section completion establishes freeze + lease $\implies$ concurrent abandon fails atomic guard and receives `409 SESSION_STATE_CONFLICT`. Session finalizes to `submitted` (or `expired`).
         - Outcome B (Abandon Wins First): Abandon sets `status = abandoned` before final section completes $\implies$ final section transition query fails to match `status = started`. Exactly 0 Attempts and 0 receipts created. Terminal status remains `abandoned`.
         - Dual-state or transition from `abandoned` to `submitted`/`expired` is strictly impossible.
       - **Final Section vs Manual Submit Race**: Both contend on the same atomic `MockSession` state. If manual submit acquires lease first, final section cannot create another owner. If final section acquires lease first, manual submit receives `409 FINALIZATION_IN_PROGRESS`. Exactly one finalization worker owns the session.
    5. **Atomic & Race-Safe Transition Guard ($elemMatch Guard)**:
       Concurrent operations (e.g. manual section completion vs lazy expiry, or parallel lazy expiry evaluations) must never activate the next section twice, nor leave a session stranded with no active section.
       - **Array Guard Requirement**: Do NOT rely on separate predicates such as `{ 'sectionStates.sectionId': expectedSectionId, 'sectionStates.status': SECTION_STATUS.IN_PROGRESS }` because those predicates can match different array elements. The authoritative guard MUST use `$elemMatch` to guarantee the SAME embedded section satisfies both `sectionId = expectedSectionId` AND `status = 'in_progress'`.
       - **Safe Implementation Patterns**:
         Either an atomic transactional read-modify-write on `MockSession`:
         ```javascript
         const transitionSectionTransactional = async ({ sessionId, expectedSectionId, targetSectionStatus, workerToken, now }) => {
           const mongoSession = await mongoose.startSession();
           try {
             let transitionResult = null;
             await mongoSession.withTransaction(async () => {
               // 1. Array guard ensures the SAME array element has expected sectionId AND in_progress status
               const session = await MockSession.findOne({
                 _id: sessionId,
                 status: SESSION_STATUS.STARTED,
                 currentSectionId: expectedSectionId,
                 sectionStates: {
                   $elemMatch: {
                     sectionId: expectedSectionId,
                     status: SECTION_STATUS.IN_PROGRESS,
                   },
                 },
               }).session(mongoSession);

               if (!session) return; // Another concurrent transition won or session is no longer active

               // 2. Transition current section
               const currentIdx = session.sectionStates.findIndex((s) => s.sectionId === expectedSectionId);
               session.sectionStates[currentIdx].status = targetSectionStatus; // COMPLETED or EXPIRED
               session.sectionStates[currentIdx].completedAt = now;

               const nextIdx = currentIdx + 1;
               const isFinalSection = nextIdx >= session.sectionStates.length;
               let responseSnapshot = null;

               if (isFinalSection) {
                 // Final Section: Atomically establish finalization barrier in same document write
                 session.currentSectionId = null;
                 session.responsesFrozen = true;
                 session.finalizationState = FINALIZATION_STATE.IN_PROGRESS;
                 session.finalizationOwnerToken = workerToken;
                 session.finalizationLeaseExpiresAt = new Date(now.getTime() + FINALIZATION_LEASE.DURATION_MS);
                 session.finalizationHeartbeatAt = now;
                 session.finalizationStartedAt = now;
                 session.finalizationTargetStatus =
                   now.getTime() >= session.expiresAt.getTime()
                     ? SESSION_STATUS.EXPIRED
                     : SESSION_STATUS.SUBMITTED;
                 session.responseMutationVersion += 1;

                 // Snapshot responses under the same atomic freeze barrier
                 responseSnapshot = await MockResponse.find({ sessionId: session._id }).session(mongoSession);
               } else {
                 // Non-final section: Atomically activate next section
                 const nextSec = session.sectionStates[nextIdx];
                 nextSec.status = SECTION_STATUS.IN_PROGRESS;
                 nextSec.startedAt = now;
                 if (nextSec.durationMinutes !== null && nextSec.durationMinutes !== undefined) {
                   const calculatedExpiry = new Date(now.getTime() + nextSec.durationMinutes * 60 * 1000);
                   nextSec.expiresAt = new Date(Math.min(calculatedExpiry.getTime(), session.expiresAt.getTime()));
                 } else {
                   nextSec.expiresAt = null;
                 }
                 session.currentSectionId = nextSec.sectionId;
               }

               await session.save({ session: mongoSession });
               transitionResult = {
                 session,
                 isFinalSection,
                 workerToken,
                 responseSnapshot,
                 acquisitionPath: isFinalSection ? 'FINAL_SECTION_INITIAL' : null,
               };
             });

             return transitionResult;
           } finally {
             await mongoSession.endSession();
           }
         };
         ```
         OR an equivalent single-document MongoDB update pipeline utilizing `$set` with `$map`/`$cond`.
       - **Invariants Guaranteed**:
         - Exactly one current section transition wins.
         - For non-final sections: exactly one next section activation occurs; no double activation; no zero-active-section crash window; exactly one section is `in_progress`.
         - For final section: atomically freezes responses, acquires lease, persists immutable `finalizationTargetStatus`, snapshots responses, and prevents abandon races with zero stranding window.

### 6.5 Abandon Session Contract & Concurrency Race
`ABANDONED` is an authoritative terminal state in `SESSION_STATUS`.

1. **Complete State Lifecycle**:
   - `created` $\to$ `started`
   - `created` $\to$ `abandoned`
   - `started` $\to$ `submitted`
   - `started` $\to$ `expired`
   - `started` $\to$ `abandoned`
   - Terminal States: `submitted`, `expired`, `abandoned`.

2. **API Endpoint & Authoritative Abandon Guard**:
   - `POST /api/v1/mock-sessions/:id/abandon`
   - Ownership: Identifier-based `userId` ownership check (Open V1 / no RBAC claim).
   - **Centralized Expiry Resolution**: Prior to evaluating abandonment on a started session, check if the session timer has expired ($\text{now} \ge \text{expiresAt}$). If expired, invoke `resolveSessionExpiry(sessionId, userId, now)` which finalizes the session with `status = expired`, and return **`409 SESSION_STATE_CONFLICT`**. Users cannot convert an already-expired assessment into `abandoned`.
   - **Pre-Finalization Atomic Transition**:
     For a `created` session, abandonment is always allowed.
     For a `started` session, abandonment is allowed **ONLY before finalization begins** (`responsesFrozen: false`, `finalizationState: IDLE`, `finalizationOwnerToken: null`). Once finalization acquires its lease or freezes responses, abandonment is strictly locked out to prevent concurrent Attempt generation.
     ```javascript
     // 1. Mandatory Expiry Orchestration Boundary
     const existing = await MockSession.findById(sessionId);
     if (!existing) throw new AppError(404, MOCK_ERROR_CODES.MOCK_SESSION_NOT_FOUND, 'Mock session not found.');
     if (existing.userId !== userId) throw new AppError(403, MOCK_ERROR_CODES.FORBIDDEN, 'Access denied.');

     const now = new Date();
     if (existing.status === SESSION_STATUS.STARTED && existing.expiresAt && now >= existing.expiresAt) {
       await resolveSessionExpiry(sessionId, userId, now);
       throw new AppError(409, MOCK_ERROR_CODES.SESSION_STATE_CONFLICT, 'Mock session has already expired.');
     }

     // 2. Authoritative Atomic Abandon Guard
     const session = await MockSession.findOneAndUpdate(
       {
         _id: sessionId,
         userId,
         $or: [
           {
             status: SESSION_STATUS.CREATED,
           },
           {
             status: SESSION_STATUS.STARTED,
             responsesFrozen: false,
             finalizationState: FINALIZATION_STATE.IDLE,
             finalizationOwnerToken: null,
           },
         ],
       },
       {
         $set: {
           status: SESSION_STATUS.ABANDONED,
           abandonedAt: now,
         },
       },
       { new: true }
     );
     if (!session) {
       // Session already reached a terminal state (submitted, expired, abandoned)
       // OR submission/finalization has already established responsesFrozen = true or finalizationState = in_progress
       throw new AppError(409, MOCK_ERROR_CODES.SESSION_STATE_CONFLICT, 'Session has already transitioned or finalization is in progress.');
     }
     ```

3. **Submit vs Abandon Concurrency Race**:
   Atomic database-level state transitions guarantee exactly one terminal outcome:
   - **Allowed Outcome A (Submit Wins First)**: Submit acquires lease or freezes responses (`responsesFrozen = true`). Concurrent or subsequent abandon request fails the atomic guard and receives **`409 SESSION_STATE_CONFLICT`**. Terminal status remains strictly `submitted`.
   - **Allowed Outcome B (Abandon Wins First)**: Abandon succeeds before finalization lease acquisition (`status = abandoned`, `abandonedAt` set). Concurrent or subsequent submit request detects terminal `abandoned` status and receives **`409 SESSION_STATE_CONFLICT`**. Zero mock Attempts and zero receipts are created.
   - **Allowed Outcome C (Clock Expiry Wins)**: Session clock expires before abandon (`now >= expiresAt`). Centralized `resolveSessionExpiry` finalizes session with `status = expired`. Abandon request receives **`409 SESSION_STATE_CONFLICT`**.
   - **Strictly Forbidden States**:
     - Session transitioning `abandoned` $\to$ `submitted`
     - Session transitioning `submitted` $\to$ `abandoned`
     - Attempts or receipts created for an abandoned-winning session
     - Dual-state or multiple successful terminal transitions
   - `409 SESSION_STATE_CONFLICT` is returned universally whenever an otherwise valid request loses a lifecycle/state race or attempts an incompatible state transition. Never return 400 for state conflicts.

4. **Abandoned Review Denial**:
   Abandoned sessions **MUST NOT expose correct answers or explanations**.
   Calling `GET /api/v1/mock-sessions/:id/review` on an abandoned session is rejected with **`400 MOCK_SESSION_NOT_TERMINAL`** (or `400 INVALID_SESSION_STATE`).
   Review remains permitted strictly for `submitted` and `expired` sessions.

---

## 7. TRANSACTIONAL RESPONSE MUTATION & CONCURRENCY BARRIER

### 7.1 Cross-Collection Atomic Save Boundary
Every answer save contends on the `MockSession` document itself by incrementing `responseMutationVersion`:

```javascript
const saveResponseTransactional = async ({ sessionId, userId, questionId, selectedAnswer, isMarkedForReview, timeTakenSeconds }) => {
  const mongoSession = await mongoose.startSession();
  try {
    let result;
    await mongoSession.withTransaction(async () => {
      // 1. Contending atomic write on the MockSession document
      const guardedSession = await MockSession.findOneAndUpdate(
        {
          _id: sessionId,
          userId,
          status: SESSION_STATUS.STARTED,
          responsesFrozen: false,
          finalizationOwnerToken: null,
        },
        {
          $inc: { responseMutationVersion: 1 },
        },
        {
          new: true,
          session: mongoSession,
        }
      );

      if (!guardedSession) {
        const existing = await MockSession.findById(sessionId).session(mongoSession);
        if (!existing) throw new AppError(404, MOCK_ERROR_CODES.MOCK_SESSION_NOT_FOUND, 'Mock session not found.');
        if (existing.userId !== userId) throw new AppError(403, MOCK_ERROR_CODES.FORBIDDEN, 'Access denied.');
        if (existing.responsesFrozen || existing.finalizationOwnerToken !== null) {
          throw new AppError(409, MOCK_ERROR_CODES.RESPONSE_FROZEN, 'Mock session responses are frozen.');
        }
        throw new AppError(400, MOCK_ERROR_CODES.INVALID_SESSION_STATE, 'Mock session is not active.');
      }

      // 2. Exact Server-Authoritative Timeout Guard (0ms grace period)
      const now = new Date();
      if (now.getTime() >= guardedSession.expiresAt.getTime()) {
        throw new AppError(409, MOCK_ERROR_CODES.MOCK_SESSION_EXPIRED, 'Mock session has expired.');
      }

      // 3. Question & Section Membership Validation
      const qEntry = guardedSession.questionSequence.find(
        (q) => q.questionId.toString() === questionId.toString()
      );
      if (!qEntry) throw new AppError(400, MOCK_ERROR_CODES.QUESTION_NOT_IN_SESSION, 'Question not in session.');

      if (guardedSession.navigationPolicy === NAVIGATION_POLICIES.SECTION_LOCKED) {
        if (guardedSession.currentSectionId !== qEntry.sectionId) {
          throw new AppError(409, MOCK_ERROR_CODES.SECTION_LOCKED, 'Section is locked.');
        }

        // Transactional Active Section Deadline Check (Zero timing grace)
        const activeSec = guardedSession.sectionStates.find(
          (s) => s.sectionId === guardedSession.currentSectionId
        );
        if (
          activeSec?.durationMinutes !== null &&
          activeSec?.expiresAt &&
          now.getTime() >= activeSec.expiresAt.getTime()
        ) {
          // Section expired at the exact deadline boundary — abort response transaction immediately
          const err = new AppError(409, MOCK_ERROR_CODES.SECTION_LOCKED, 'Active section has expired.');
          err.isSectionExpiredSentinel = true;
          throw err;
        }
      }

      // 4. Authoritative Selected-Answer Validation
      const questionDoc = await Question.findById(questionId).session(mongoSession);
      if (!questionDoc) throw new AppError(404, MOCK_ERROR_CODES.QUESTION_NOT_FOUND, 'Question not found.');

      if (selectedAnswer !== null && selectedAnswer !== undefined) {
        if (!questionDoc.options.includes(selectedAnswer)) {
          throw new AppError(400, MOCK_ERROR_CODES.INVALID_OPTION, 'Selected answer must match one of the four options.');
        }
      }

      // 5. Strict timeTakenSeconds Validation (Reject wild inputs)
      if (
        typeof timeTakenSeconds !== 'number' ||
        !Number.isFinite(timeTakenSeconds) ||
        !Number.isInteger(timeTakenSeconds) ||
        timeTakenSeconds < 0
      ) {
        throw new AppError(400, MOCK_ERROR_CODES.INVALID_TIME_TAKEN, 'timeTakenSeconds must be a finite non-negative integer.');
      }

      // 5. Strict timeTakenSeconds Validation (Section-Aware)
      const elapsedSessionSec = Math.max(0, Math.ceil((now - guardedSession.startedAt) / 1000));
      let maxAllowedTime;
      const activeSec = guardedSession.sectionStates.find((s) => s.sectionId === guardedSession.currentSectionId);
      if (
        guardedSession.navigationPolicy === NAVIGATION_POLICIES.SECTION_LOCKED &&
        activeSec &&
        activeSec.startedAt &&
        activeSec.durationMinutes !== null
      ) {
        const elapsedSectionSec = Math.max(0, Math.ceil((now - activeSec.startedAt) / 1000));
        maxAllowedTime = Math.min(elapsedSessionSec, elapsedSectionSec) + SESSION_LIMITS.PACING_TOLERANCE_SECONDS;
      } else {
        maxAllowedTime = elapsedSessionSec + SESSION_LIMITS.PACING_TOLERANCE_SECONDS;
      }

      if (timeTakenSeconds > maxAllowedTime || timeTakenSeconds > SESSION_LIMITS.MAX_ALLOWED_TIME_TAKEN_SECONDS) {
        throw new AppError(400, MOCK_ERROR_CODES.INVALID_TIME_TAKEN, 'timeTakenSeconds exceeds allowed duration.');
      }

      // 6. Answer State & Review Flag Lifecycle
      const isAnswering = selectedAnswer !== null && selectedAnswer !== undefined;
      const responseStatus = isAnswering ? RESPONSE_STATUS.ANSWERED : RESPONSE_STATUS.VIEWED;

      const updateFields = {
        userId,
        sectionId: qEntry.sectionId,
        selectedAnswer: isAnswering ? selectedAnswer : null,
        status: responseStatus,
        timeTakenSeconds,
        updatedAt: now,
      };

      if (typeof isMarkedForReview === 'boolean') {
        updateFields.isMarkedForReview = isMarkedForReview;
      }

      result = await MockResponse.findOneAndUpdate(
        { sessionId: guardedSession._id, questionId: qEntry.questionId },
        {
          $set: updateFields,
          $setOnInsert: {
            createdAt: now,
            isViewed: true,
            viewedAt: now,
          },
        },
        { upsert: true, new: true, session: mongoSession }
      );
    });

    return result;
  } finally {
    await mongoSession.endSession();
  }
};

/**
 * Authoritative saveResponse orchestrator:
 * Resolves session or section expiry OUTSIDE the aborted transaction.
 */
const saveResponse = async (params) => {
  try {
    return await saveResponseTransactional(params);
  } catch (err) {
    if (err.code === MOCK_ERROR_CODES.MOCK_SESSION_EXPIRED) {
      // 1. Transaction aborted; response mutation NOT committed
      // 2. Resolve global expiry outside the aborted transaction
      await resolveSessionExpiry(params.sessionId, params.userId, new Date());
      throw err;
    }
    if (err.code === MOCK_ERROR_CODES.SECTION_LOCKED && err.isSectionExpiredSentinel) {
      // 1. Transaction aborted; response mutation NOT committed
      // 2. Resolve section expiry outside the aborted transaction:
      //    - Atomically transition current section (in_progress -> expired)
      //    - Activate next section if applicable (pending -> in_progress)
      //    - If final section timed out, finalize submitted or expired based on global timer
      await resolveActiveSectionExpiry(params.sessionId, params.userId, new Date());
      throw err;
    }
    throw err;
  }
};
```

### 7.2 First-View Draft Mutation Obeys Freeze & Section Expiry
The first-view endpoint (`GET /api/v1/mock-sessions/:id/questions/:questionId`) can create or update a `MockResponse` record to track `isViewed: true`. Therefore, its transactional mutation must strictly obey:
1. **Global Session Expiry**: If $\text{now} \ge \text{session.expiresAt}$, DO NOT create/update `MockResponse`. Abort mutation, trigger `resolveSessionExpiry(...)` outside the transaction, and reject with **`409 MOCK_SESSION_EXPIRED`**.
2. **Section Membership**: Question must belong to the mock session.
3. **Active Section State**: Under `section_locked` navigation, if the question belongs to a completed or expired prior section, reject with **`409 SECTION_LOCKED`** without modifying or creating `MockResponse`.
4. **Active Section Exact Expiry**: Under `section_locked` navigation with section timing (`activeSection.durationMinutes !== null`), evaluate the exact deadline:
   - If $\text{now} < \text{activeSection.expiresAt}$: Section active, proceed.
   - If $\text{now} \ge \text{activeSection.expiresAt}$: Section expired! **DO NOT create or update `MockResponse`**. Abort mutation, trigger `resolveActiveSectionExpiry(...)` outside the aborted mutation, and return **`409 SECTION_LOCKED`**.
5. **Responses Frozen**: If `responsesFrozen === true`, serve sanitized question DTO without modifying or creating `MockResponse`.

Only when the session is active, unexpired, within the active section, and `responsesFrozen === false` does the server execute the atomic upsert `{ isViewed: true, viewedAt: now }` and increment `responseMutationVersion`.

---

## 8. QUESTION DTO & RECURSIVE ZERO ANSWER LEAKAGE

- Question DTO fields: `questionId`, `sectionId`, `order`, `question`, `options`, `topic`, `pattern`, `difficulty`.
- `Question.options` served strictly in canonical stored order (**no shuffling**).
- Recursive scanner test traverses full JSON payload and asserts zero presence of `answer`, `correctAnswer`, `explanation`, `solution`.

---

## 9. RESUMABLE, CRASH-PROOF FINALIZATION & THREE-WAY LEASE ENGINE

### 9.1 Authoritative Three-Way Lease Acquisition Protocol
To eliminate all stranding windows, `acquireFinalizationLease(sessionId, userId, workerToken, requestedTargetStatus)` supports three explicit, mutually exclusive acquisition paths:

1. **Path A — Initial Finalization**:
   - `status = 'started'`
   - `responsesFrozen = false`
   - `finalizationState = 'idle'`
   - `finalizationOwnerToken = null`
   - Accepts `requestedTargetStatus` (`'submitted'` or `'expired'`).
   - At the exact initial acquisition time, computes:
     ```javascript
     const effectiveTargetStatus =
       now.getTime() >= session.expiresAt.getTime()
         ? SESSION_STATUS.EXPIRED
         : requestedTargetStatus;
     ```
     (Global expiry strictly wins at `now >= expiresAt` with zero timing grace).
   - Atomically sets:
     - `responsesFrozen = true` (permanent barrier established)
     - `finalizationState = 'in_progress'`
     - `finalizationOwnerToken = workerToken`
     - `finalizationLeaseExpiresAt = now + 30s`
     - `finalizationHeartbeatAt = now`
     - `finalizationStartedAt = now` (initial start timestamp set once)
     - `finalizationTargetStatus = effectiveTargetStatus` (immutable terminal intention recorded once)
     - `responseMutationVersion += 1`
2. **Path B1 — Crash Recovery (Expired Lease)**:
   - `status = 'started'`
   - `responsesFrozen = true` (responses remain permanently frozen!)
   - `finalizationState = 'in_progress'`
   - `finalizationLeaseExpiresAt <= now` (old worker died without cleanup, lease expired).
   - Recovery worker replaces `finalizationOwnerToken`, updates `finalizationLeaseExpiresAt = now + 30s`, updates `finalizationHeartbeatAt = now`, increments `responseMutationVersion`.
   - **Crucial**: Strictly **preserves** `finalizationTargetStatus`! Do **NOT** derive or recalculate it from the current wall clock.
     *Example*: At 10:59:58 manual submit begins (`finalizationTargetStatus = submitted`). Worker crashes. At 11:00:05 `expiresAt` has passed. B1 recovery begins. Expected: `finalizationTargetStatus` remains `submitted` and terminal state remains `submitted`. Recovery delay must not convert a valid manual submission into expiry.
   - **Crucial**: Does **NOT** alter `finalizationStartedAt`, preserving the original lifecycle start!
3. **Path B2 — Explicit Failed-State Recovery (Immediate Retry)**:
   - `status = 'started'`
   - `responsesFrozen = true`
   - `finalizationState = 'failed'`
   - `finalizationOwnerToken = null`
   - `finalizationLeaseExpiresAt = null` (or `<= now`)
   - Recovery worker transitions `finalizationState = 'in_progress'`, replaces `finalizationOwnerToken = workerToken`, sets `finalizationLeaseExpiresAt = now + 30s`, updates `finalizationHeartbeatAt = now`, increments `responseMutationVersion`.
   - Permits **immediate retry without waiting 30 seconds** because previous worker explicitly released ownership upon catching a recoverable error.
   - **Crucial**: Strictly **preserves** `finalizationTargetStatus`! Do **NOT** overwrite or recalculate it.
   - **Crucial**: Does **NOT** alter `finalizationStartedAt`.
4. **Recovery Callers Must Not Override the Target**:
   - Once `finalizationTargetStatus != null`, any caller-supplied target is no longer authoritative.
   - *Example*: Persisted target = `submitted`. A later expiry resolver requests `expired`. The persisted `submitted` target wins and is NOT overwritten.
   - *Example*: Persisted target = `expired`. A later manual submit requests `submitted`. The persisted `expired` target wins and is never converted to `submitted`.

```javascript
const acquireFinalizationLease = async (sessionId, userId, workerToken, requestedTargetStatus) => {
  if (![SESSION_STATUS.SUBMITTED, SESSION_STATUS.EXPIRED].includes(requestedTargetStatus)) {
    throw new AppError(400, MOCK_ERROR_CODES.INVALID_SESSION_STATE, 'Invalid finalization target status.');
  }

  const mongoSession = await mongoose.startSession();
  try {
    let leaseResult;
    await mongoSession.withTransaction(async () => {
      const now = new Date();
      const leaseUntil = new Date(now.getTime() + FINALIZATION_LEASE.DURATION_MS);

      let acquisitionPath = null;
      let mockSession = null;

      // 1. Inspect existing session inside transaction
      const existing = await MockSession.findById(sessionId).session(mongoSession);
      if (!existing) throw new AppError(404, MOCK_ERROR_CODES.MOCK_SESSION_NOT_FOUND, 'Mock session not found.');
      if (existing.userId !== userId) throw new AppError(403, MOCK_ERROR_CODES.FORBIDDEN, 'Access denied.');

      // Check terminal state conflicts
      if (
        existing.status === SESSION_STATUS.ABANDONED ||
        existing.status === SESSION_STATUS.SUBMITTED ||
        existing.status === SESSION_STATUS.EXPIRED
      ) {
        throw new AppError(409, MOCK_ERROR_CODES.SESSION_STATE_CONFLICT, 'Session has already transitioned to an incompatible terminal state.');
      }

      // Check active unexpired lease: lease is valid iff finalizationLeaseExpiresAt > now
      if (
        existing.finalizationState === FINALIZATION_STATE.IN_PROGRESS &&
        existing.finalizationLeaseExpiresAt &&
        existing.finalizationLeaseExpiresAt > now
      ) {
        throw new AppError(409, MOCK_ERROR_CODES.FINALIZATION_IN_PROGRESS, 'Mock session finalization is currently in progress. Please retry shortly.');
      }

      // Compute effective target for Path A: global expiry wins if now >= expiresAt
      const effectiveTargetStatus =
        existing.expiresAt && now.getTime() >= existing.expiresAt.getTime()
          ? SESSION_STATUS.EXPIRED
          : requestedTargetStatus;

      // 2. Deterministic Acquisition Path Resolution:

      // Try PATH A: INITIAL ACQUISITION (Unfrozen, Idle, No Owner)
      mockSession = await MockSession.findOneAndUpdate(
        {
          _id: sessionId,
          userId,
          status: SESSION_STATUS.STARTED,
          responsesFrozen: false,
          finalizationState: FINALIZATION_STATE.IDLE,
          finalizationOwnerToken: null,
        },
        {
          $set: {
            responsesFrozen: true, // Permanent barrier established
            finalizationState: FINALIZATION_STATE.IN_PROGRESS,
            finalizationOwnerToken: workerToken,
            finalizationLeaseExpiresAt: leaseUntil,
            finalizationHeartbeatAt: now,
            finalizationStartedAt: now, // Initial start timestamp set once
            finalizationTargetStatus: effectiveTargetStatus, // Target recorded once
          },
          $inc: { responseMutationVersion: 1 },
        },
        { new: true, session: mongoSession }
      );

      if (mockSession) {
        acquisitionPath = 'PATH_A_INITIAL';
      } else {
        // Try PATH B1: CRASH RECOVERY (Frozen, In-Progress, Expired Lease <= now)
        // CRUCIAL: Strictly preserves existing finalizationTargetStatus (NEVER derived from current wall clock)
        // CRUCIAL: Strictly preserves existing finalizationStartedAt
        mockSession = await MockSession.findOneAndUpdate(
          {
            _id: sessionId,
            userId,
            status: SESSION_STATUS.STARTED,
            responsesFrozen: true,
            finalizationState: FINALIZATION_STATE.IN_PROGRESS,
            finalizationLeaseExpiresAt: { $lte: now },
          },
          {
            $set: {
              finalizationOwnerToken: workerToken,
              finalizationLeaseExpiresAt: leaseUntil,
              finalizationHeartbeatAt: now,
              // finalizationTargetStatus is strictly preserved (DO NOT overwrite or recalculate)
              // finalizationStartedAt is strictly preserved
            },
            $inc: { responseMutationVersion: 1 },
          },
          { new: true, session: mongoSession }
        );

        if (mockSession) {
          acquisitionPath = 'PATH_B1_CRASH_RECOVERY';
        } else {
          // Try PATH B2: EXPLICIT FAILED-STATE RECOVERY (Frozen, Failed, No Owner, Immediate Retry)
          // CRUCIAL: Strictly preserves existing finalizationTargetStatus (NEVER overwritten or recalculated)
          // CRUCIAL: Strictly preserves existing finalizationStartedAt
          mockSession = await MockSession.findOneAndUpdate(
            {
              _id: sessionId,
              userId,
              status: SESSION_STATUS.STARTED,
              responsesFrozen: true,
              finalizationState: FINALIZATION_STATE.FAILED,
              finalizationOwnerToken: null,
              $or: [
                { finalizationLeaseExpiresAt: null },
                { finalizationLeaseExpiresAt: { $lte: now } },
              ],
            },
            {
              $set: {
                finalizationState: FINALIZATION_STATE.IN_PROGRESS,
                finalizationOwnerToken: workerToken,
                finalizationLeaseExpiresAt: leaseUntil,
                finalizationHeartbeatAt: now,
                // finalizationTargetStatus is strictly preserved (DO NOT overwrite or recalculate)
                // finalizationStartedAt is strictly preserved
              },
              $inc: { responseMutationVersion: 1 },
            },
            { new: true, session: mongoSession }
          );

          if (mockSession) {
            acquisitionPath = 'PATH_B2_EXPLICIT_FAILED';
          }
        }
      }

      if (!mockSession) {
        throw new AppError(400, MOCK_ERROR_CODES.INVALID_SESSION_STATE, 'Mock session cannot be submitted in its current state.');
      }

      // Snapshot all MockResponses within this transaction
      const responseSnapshot = await MockResponse.find({ sessionId: mockSession._id }).session(mongoSession);
      leaseResult = { mockSession, responseSnapshot, acquisitionPath };
    });

    return leaseResult;
  } finally {
    await mongoSession.endSession();
  }
};
```

### 9.2 Explicit Failure Release Protocol
When an active worker catches a recoverable error while still owning the lease:
```javascript
const handleFinalizationFailure = async (sessionId, workerToken, error) => {
  const now = new Date();
  // Atomically transition to failed state and release lease ownership ONLY if caller still owns a valid unexpired lease
  const res = await MockSession.updateOne(
    {
      _id: sessionId,
      status: SESSION_STATUS.STARTED,
      finalizationOwnerToken: workerToken,
      finalizationState: FINALIZATION_STATE.IN_PROGRESS,
      finalizationLeaseExpiresAt: { $gt: now },
    },
    {
      $set: {
        finalizationState: FINALIZATION_STATE.FAILED,
        finalizationOwnerToken: null,
        finalizationLeaseExpiresAt: null,
        finalizationHeartbeatAt: now,
        responsesFrozen: true, // Permanent barrier preserved
      },
    }
  );

  if (res.matchedCount !== 1) {
    // If lease has already expired, stale worker has no authority to mutate finalization state.
    // Crash recovery will proceed via PATH_B1_CRASH_RECOVERY instead.
    return;
  }

  // Safe structured logging (zero sensitive answer/question content)
  console.error(
    JSON.stringify({
      event: 'MOCK_FINALIZATION_FAILED',
      sessionId,
      algorithmVersion: MOCK_ALGORITHM_VERSION,
      errorCode: error.code || MOCK_ERROR_CODES.FINALIZATION_EXECUTION_FAILED,
      finalizationState: 'failed',
      timestamp: now.toISOString(),
    })
  );
};
```

### 9.3 Heartbeat Fencing & Terminal Write Ownership
1. **Periodic Heartbeat**: Renews every 5 questions or 5 seconds. Requires a currently valid, unexpired lease:
   ```javascript
   const now = new Date();
   const res = await MockSession.updateOne(
     {
       _id: sessionId,
       status: SESSION_STATUS.STARTED,
       finalizationOwnerToken: workerToken,
       finalizationState: FINALIZATION_STATE.IN_PROGRESS,
       finalizationLeaseExpiresAt: { $gt: now },
     },
     { $set: { finalizationLeaseExpiresAt: new Date(Date.now() + 30000), finalizationHeartbeatAt: now } }
   );
   if (res.matchedCount !== 1) {
     throw new AppError(409, MOCK_ERROR_CODES.FINALIZATION_LEASE_LOST, 'Finalization lease lost or expired.');
   }
   ```
   If `finalizationLeaseExpiresAt <= now`, `matchedCount = 0` and the update fails. The worker receives **`409 FINALIZATION_LEASE_LOST`**, must STOP immediately, and must NOT resurrect its own expired lease.

2. **Terminal Write Fencing**: Committing terminal status strictly checks ownership and active unexpired lease validity (`finalizationLeaseExpiresAt > now`). The authoritative terminal outcome must come strictly from `MockSession.finalizationTargetStatus` (NOT an external caller parameter):
   ```javascript
   const target = ownedSession.finalizationTargetStatus;
   const now = new Date();

   const terminalUpdatePayload =
     target === SESSION_STATUS.SUBMITTED
       ? {
           status: SESSION_STATUS.SUBMITTED,
           finalizationState: FINALIZATION_STATE.COMPLETED,
           finalizationOwnerToken: null,
           finalizationLeaseExpiresAt: null,
           submittedAt: now,
           expiredAt: null,
           resultSummary,
         }
       : {
           status: SESSION_STATUS.EXPIRED,
           finalizationState: FINALIZATION_STATE.COMPLETED,
           finalizationOwnerToken: null,
           finalizationLeaseExpiresAt: null,
           expiredAt: now,
           submittedAt: null,
           resultSummary,
         };

   const finalUpdate = await MockSession.findOneAndUpdate(
     {
       _id: sessionId,
       status: SESSION_STATUS.STARTED,
       finalizationOwnerToken: workerToken,
       finalizationState: FINALIZATION_STATE.IN_PROGRESS,
       finalizationLeaseExpiresAt: { $gt: now },
     },
     {
       $set: terminalUpdatePayload,
     },
     { new: true }
   );
   if (!finalUpdate) {
     throw new AppError(409, MOCK_ERROR_CODES.FINALIZATION_LEASE_LOST, 'Finalization write rejected: lease lost or expired.');
   }
   ```
   **Authoritative Terminal Write Rules**:
   - `finalizationTargetStatus` is **retained** on the document upon completion (never cleared or reset to null).
   - For `target === SESSION_STATUS.SUBMITTED`: `status = submitted`, `submittedAt = now`, `expiredAt = null`.
   - For `target === SESSION_STATUS.EXPIRED`: `status = expired`, `expiredAt = now`, `submittedAt = null`.
   - The terminal write remains fenced strictly by: `status = started`, `finalizationState = in_progress`, `finalizationOwnerToken = workerToken`, and `finalizationLeaseExpiresAt > now`.
   - Writes strictly defined `MockSession` schema fields (`status`, `finalizationState`, `finalizationOwnerToken`, `finalizationLeaseExpiresAt`, `submittedAt` / `expiredAt`, and `resultSummary` which encapsulates section-level analytics). Undefined top-level fields such as `finalizedAt` or `sectionResults` are strictly prohibited.

### 9.4 Authoritative Finalization Set & Receipt Invariants

#### 9.4.1 Answered vs Unanswered Split
Before processing attempts:
1. Filter responses for answered questions:
   ```javascript
   const answeredResponses = responses.filter(r => r.selectedAnswer !== null);
   ```
2. Unanswered questions (`selectedAnswer === null`):
   - **DO NOT** create an Attempt document.
   - **DO NOT** create a `MockAttemptFinalizationRecord` receipt.
   - Are scored using `unansweredMarks` during result calculation.

#### 9.4.2 Answered Question Processing Loop
For each response in `answeredResponses`:
1. **Receipt Check & Integrity Validation**:
   - Check `MockAttemptFinalizationRecord.findOne({ sessionId: session._id, questionId: response.questionId })`.
   - If receipt exists:
     - Perform **Receipt $\to$ Attempt Integrity Validation**:
       Before trusting a receipt during recovery, result generation, or rebuild, validate:
       ```javascript
       if (
         receipt.sessionId.toString() !== session._id.toString() ||
         !session.questionSequence.some((q) => q.questionId.toString() === receipt.questionId.toString())
       ) {
         throw new AppError(500, MOCK_ERROR_CODES.RESULT_INTEGRITY_ERROR, 'Receipt session/question mismatch.');
       }
       const linkedAttempt = await Attempt.findById(receipt.attemptId);
       if (
         !linkedAttempt ||
         linkedAttempt._id.toString() !== receipt.attemptId.toString() ||
         linkedAttempt.userId !== session.userId ||
         linkedAttempt.sessionId !== session._id.toString() ||
         linkedAttempt.questionId.toString() !== receipt.questionId.toString() ||
         linkedAttempt.source !== 'mock'
       ) {
         throw new AppError(500, MOCK_ERROR_CODES.RESULT_INTEGRITY_ERROR, 'Receipt Attempt integrity check failed.');
       }
       ```
       If validation fails, throw **`500 RESULT_INTEGRITY_ERROR`** (internal persisted-data invariant failure). Do not blindly trust receipt existence.
     - If valid, skip Attempt creation.
2. **Recover or Create Attempt**:
   - Check `Attempt.findOne({ sessionId: session._id.toString(), questionId: response.questionId, source: 'mock' })`.
   - If pre-existing Attempt exists: validate integrity, create minimal receipt.
   - If missing: invoke `attemptService.createAttempt(...)` with `source = 'mock'`, `selectedAnswer: response.selectedAnswer`, `timeTaken: response.timeTakenSeconds`, `sessionId: session._id.toString()`.
   - On `E11000` duplicate key collision, recover the conflicting Attempt and persist receipt.
3. **Minimal Audit Receipt Written**:
   ```javascript
   await MockAttemptFinalizationRecord.create({
     sessionId: session._id,
     questionId: response.questionId,
     userId: session.userId,
     attemptId: attempt._id,
     algorithmVersion: MOCK_ALGORITHM_VERSION,
     status: 'completed',
     finalizedAt: new Date(),
   });
   ```
   Receipts are minimal audit/recovery links. They MUST NOT duplicate `isCorrect`, `rawScoreAwarded`, `timeTakenSeconds`, `topic`, `pattern`, `difficulty`, or option data.

### 9.5 Authoritative submitMockSession Orchestration & Post-Finalization Idempotency

Post-finalization idempotency is enforced strictly at the outer orchestration layer in `submitMockSession` **above** lease acquisition. `acquireFinalizationLease()` is responsible solely for lease contention on started sessions and never handles terminal idempotency.

Before attempting lease acquisition, `submitMockSession` inspects owned session state in this exact deterministic order:

```javascript
const submitMockSession = async ({ sessionId, userId }) => {
  // 1. Load owned session and resolve state above lease acquisition
  const session = await MockSession.findById(sessionId);
  if (!session) throw new AppError(404, MOCK_ERROR_CODES.MOCK_SESSION_NOT_FOUND, 'Mock session not found.');
  if (session.userId !== userId) throw new AppError(403, MOCK_ERROR_CODES.FORBIDDEN, 'Access denied.');

  // 14.1 Already submitted + completed: Zero-write idempotent 200 OK
  if (
    session.status === SESSION_STATUS.SUBMITTED &&
    session.finalizationState === FINALIZATION_STATE.COMPLETED &&
    session.resultSummary !== null
  ) {
    // Immediately return existing resultSummary.
    // Strictly ZERO lease acquisition, ZERO new Attempts, ZERO new receipts,
    // ZERO StudentProgress updates, ZERO Phase 4 mastery recalculations,
    // ZERO Phase 5 revision transitions, ZERO submittedAt timestamp changes.
    return session.resultSummary;
  }

  // 14.2 Expired: Cannot be manually submitted (409 MOCK_SESSION_EXPIRED)
  // Authoritative chosen response: 409 MOCK_SESSION_EXPIRED (never convert expired -> submitted)
  if (session.status === SESSION_STATUS.EXPIRED) {
    throw new AppError(409, MOCK_ERROR_CODES.MOCK_SESSION_EXPIRED, 'Mock session has already expired.');
  }

  // 14.3 Abandoned: Cannot be finalized or submitted (409 SESSION_STATE_CONFLICT)
  if (session.status === SESSION_STATUS.ABANDONED) {
    throw new AppError(409, MOCK_ERROR_CODES.SESSION_STATE_CONFLICT, 'Mock session has been abandoned.');
  }

  // Verify session is active (started)
  if (session.status !== SESSION_STATUS.STARTED) {
    throw new AppError(400, MOCK_ERROR_CODES.INVALID_SESSION_STATE, 'Mock session cannot be submitted in its current state.');
  }

  // 14.4 Active valid finalization: 409 FINALIZATION_IN_PROGRESS (lease valid iff expiresAt > now)
  const now = new Date();
  if (
    session.finalizationState === FINALIZATION_STATE.IN_PROGRESS &&
    session.finalizationLeaseExpiresAt &&
    session.finalizationLeaseExpiresAt > now
  ) {
    throw new AppError(409, MOCK_ERROR_CODES.FINALIZATION_IN_PROGRESS, 'Mock session finalization is currently in progress. Please retry shortly.');
  }

  // 14.5 Recoverable finalization (Path A initial, Path B1 crash recovery, Path B2 explicit failed retry):
  // Request finalization lease with requestedTargetStatus = submitted
  // (If wall clock now >= session.expiresAt at acquisition, Path A computes effectiveTargetStatus = expired).
  const workerToken = crypto.randomUUID();
  const leaseResult = await acquireFinalizationLease(sessionId, userId, workerToken, SESSION_STATUS.SUBMITTED);
  return await processFinalizationWithOwnedLease(leaseResult);
};
```

### 9.6 Authoritative resolveSessionExpiry Orchestration & Idempotent Expiry Resolution

Automatic / lazy session expiry resolution similarly enforces zero-write idempotency above lease acquisition and surfaces structured conflict when finalization is active:

```javascript
const resolveSessionExpiry = async (sessionId, userId, now = new Date()) => {
  const session = await MockSession.findById(sessionId);
  if (!session) throw new AppError(404, MOCK_ERROR_CODES.MOCK_SESSION_NOT_FOUND, 'Mock session not found.');
  if (session.userId !== userId) throw new AppError(403, MOCK_ERROR_CODES.FORBIDDEN, 'Access denied.');

  // 15. Zero-write idempotent return if already expired and fully finalized
  if (
    session.status === SESSION_STATUS.EXPIRED &&
    session.finalizationState === FINALIZATION_STATE.COMPLETED &&
    session.resultSummary !== null
  ) {
    // Return existing resultSummary immediately.
    // Repeated expiry resolution produces:
    // 0 new Attempts, 0 new receipts, 0 StudentProgress changes,
    // 0 Phase 4 mastery recalculations, 0 Phase 5 revision transitions, 0 timestamp changes.
    return session.resultSummary;
  }

  // If already submitted and completed, return existing resultSummary immediately
  if (session.status === SESSION_STATUS.SUBMITTED && session.resultSummary !== null) {
    return session.resultSummary;
  }

  // If already abandoned, cannot finalize as expired
  if (session.status === SESSION_STATUS.ABANDONED) {
    throw new AppError(409, MOCK_ERROR_CODES.SESSION_STATE_CONFLICT, 'Mock session has been abandoned.');
  }

  // 3.1 & 3.2 Active valid finalization in progress:
  // If another worker owns an active unexpired lease (finalizationLeaseExpiresAt > now),
  // surface structured FINALIZATION_IN_PROGRESS conflict. NEVER return null as a finalized result!
  if (
    session.finalizationState === FINALIZATION_STATE.IN_PROGRESS &&
    session.finalizationLeaseExpiresAt &&
    session.finalizationLeaseExpiresAt > now
  ) {
    throw new AppError(
      409,
      MOCK_ERROR_CODES.FINALIZATION_IN_PROGRESS,
      'Mock session finalization is currently in progress. Please retry shortly.'
    );
  }

  // Acquire lease with requestedTargetStatus = expired
  const workerToken = crypto.randomUUID();
  const leaseResult = await acquireFinalizationLease(sessionId, userId, workerToken, SESSION_STATUS.EXPIRED);
  return await processFinalizationWithOwnedLease(leaseResult);
};
```

---

## 10. SIGNED SCORING & RESULT ANALYTICS

### 10.1 Universal Signed Formula
$$\text{rawScore} = (\text{correctCount} \times \text{correctMarks}) + (\text{incorrectCount} \times \text{incorrectMarks}) + (\text{unansweredCount} \times \text{unansweredMarks})$$
- `correctMarks > 0`
- `incorrectMarks <= 0`
- `unansweredMarks <= 0`

### 10.2 Maximum Score & Reconciliation Invariants
$$\text{maxPossibleScore} = \sum_{s \in \text{sections}} (s.\text{questionCount} \times s.\text{effectiveCorrectMarks}) > 0$$
$$\sum \text{section.rawScore} \equiv \text{overall.rawScore}$$
$$\sum \text{section.maxPossibleScore} \equiv \text{overall.maxPossibleScore}$$

### 10.3 Authoritative `resultSummary` Data Contract
The `resultSummary` object persisted on `MockSession` encapsulates full factual assessment analytics derived strictly from the frozen session data:
```javascript
{
  sessionId: session._id,
  mode: session.mode,

  overall: {
    totalQuestions: Number,
    answered: Number,
    unanswered: Number,
    correct: Number,
    incorrect: Number,

    accuracy: Number, // Percentage 0 - 100
    rawScore: Number, // Signed score
    maxPossibleScore: Number, // Strictly > 0
    percentage: Number, // Signed percentage (rawScore / maxPossibleScore * 100)

    totalTimeSeconds: Number,
    averageTimeSeconds: Number,
  },

  sections: [
    {
      sectionId: String,
      totalQuestions: Number,
      answered: Number,
      unanswered: Number,
      correct: Number,
      incorrect: Number,
      accuracy: Number,
      rawScore: Number,
      maxPossibleScore: Number,
      percentage: Number,
      totalTimeSeconds: Number,
      averageTimeSeconds: Number,
    },
  ],

  topics: [
    {
      topic: String,
      totalQuestions: Number,
      answered: Number,
      unanswered: Number,
      correct: Number,
      incorrect: Number,
      accuracy: Number,
      rawScore: Number,
      maxPossibleScore: Number,
      percentage: Number,
      totalTimeSeconds: Number,
      averageTimeSeconds: Number,
    },
  ],

  patterns: [
    {
      topic: String,
      pattern: String,
      totalQuestions: Number,
      answered: Number,
      unanswered: Number,
      correct: Number,
      incorrect: Number,
      accuracy: Number,
      rawScore: Number,
      maxPossibleScore: Number,
      percentage: Number,
      totalTimeSeconds: Number,
      averageTimeSeconds: Number,
    },
  ],

  difficulties: [
    {
      difficulty: Number, // 1 to 10
      totalQuestions: Number,
      answered: Number,
      unanswered: Number,
      correct: Number,
      incorrect: Number,
      accuracy: Number,
      rawScore: Number,
      maxPossibleScore: Number,
      percentage: Number,
      totalTimeSeconds: Number,
      averageTimeSeconds: Number,
    },
  ],

  pacing: {
    totalTimeSeconds: Number,
    averageTimePerAnsweredQuestion: Number,
    slowestAnsweredQuestions: [
      { questionId: String, sectionId: String, timeTakenSeconds: Number, isCorrect: Boolean },
    ],
    fastestAnsweredQuestions: [
      { questionId: String, sectionId: String, timeTakenSeconds: Number, isCorrect: Boolean },
    ],
  },
}
```

### 10.4 Accuracy Calculation & Division-by-Zero Safety
Accuracy is strictly evaluated on answered questions:
$$\text{answered} = \text{correct} + \text{incorrect}$$
$$\text{accuracy} = \begin{cases} \dfrac{\text{correct}}{\text{answered}} \times 100 & \text{if } \text{answered} > 0 \\ 0 & \text{if } \text{answered} = 0 \end{cases}$$
A zero-answered mock session must **never** produce `NaN`, `Infinity`, or an unhandled division-by-zero error.

### 10.5 Score Percentage & Signed Score Handling
$$\text{percentage} = \begin{cases} \dfrac{\text{rawScore}}{\text{maxPossibleScore}} \times 100 & \text{if } \text{maxPossibleScore} > 0 \\ 0 & \text{otherwise} \end{cases}$$
- `maxPossibleScore > 0` is guaranteed because `totalQuestions >= 1` and `correctMarks > 0`.
- Signed scores are **NOT** artificially clamped to zero. If negative marking produces a negative `rawScore`, a negative `percentage` is mathematically valid and preserved.

### 10.6 Grouping Truth & Unanswered Handling
- All grouping metadata (topic, pattern, difficulty, sectionId) is sourced strictly from the immutable `MockSession.questionSequence`.
- For answered questions, student answer truth, correctness, and score awarded come from the finalized immutable `Attempt` documents.
- For unanswered questions, grouping metadata comes from `questionSequence`, and score is computed via `unansweredMarks` without generating synthetic Attempts or receipts.

### 10.7 Section Scoring Overrides & Full Aggregation Reconciliation
When an individual section specifies custom scoring overrides (`correctMarks`, `incorrectMarks`, `unansweredMarks`):
- Every question within that section uses the section's effective scoring rules.
- Aggregations across sections, topics, patterns, and difficulties must use the effective scoring rules of each question's parent section.
- Exact reconciliation invariants:
  $$\sum \text{section.rawScore} \equiv \text{overall.rawScore}$$
  $$\sum \text{section.maxPossibleScore} \equiv \text{overall.maxPossibleScore}$$

### 10.8 Factual Learning Signals & Strict Boundary Enforcement
- Any learning signals (such as `lowAccuracyPatterns` identifying patterns where `accuracy < 50%`) must be derived purely from factual mock test statistics.
- **Strict Prohibition**: Phase 6 does not calculate or update student mastery formulas (owned exclusively by Phase 4), does not create semantic misconception labels, does not query LLMs, and does not compute predictive percentiles, rankings, or employability scores.

---

## 11. CROSS-PHASE INTEGRATION BOUNDARIES

1. **Phase 3 Attempt & Progress Pipeline**:
   - Answered questions route through the authoritative `attemptService.createAttempt(...)`, creating a factual `Attempt` document and updating `StudentProgress`.
   - **Timing Adapter Mapping**: Phase 6 stores draft duration as `MockResponse.timeTakenSeconds`. When invoking `attemptService.createAttempt(...)`, Phase 6 must map `timeTaken: response.timeTakenSeconds` to conform to the existing Phase 3 Attempt contract (`Attempt.timeTaken`). Phase 6 must **NOT** pass `timeTakenSeconds` or mutate the Phase 3 Attempt schema or public service contract.
   - **Preserve Existing Downstream Logic**: By routing through `attemptService.createAttempt(...)`, Phase 6 reuses authoritative server-side derivation of `correctAnswer`, `isCorrect`, `StudentProgress` aggregates, Phase 4 mastery recalculation hooks, and Phase 5 revision scheduling without manually duplicating those behaviors.
2. **Phase 4 Mastery Pipeline**: Recalculates mastery as a post-attempt hook. Phase 6 never directly mutates mastery.
3. **Phase 5 Revision Scheduling**:
   - `source = 'mock'`, `isCorrect = false` $\implies$ **Resets/schedules RevisionItem to Stage 0 with interval = 1 day**.
   - `source = 'mock'`, `isCorrect = true` $\implies$ **DOES NOT advance RevisionItem stage, intervalDays, or nextReviewDate**.
4. **DailyObjective Isolation**: Mock attempts do **not** increment `DailyObjective.patterns[].completedQuestions`.
5. **StudyPlan Isolation**: Mock completion never auto-completes study plans or triggers automatic replanning.
6. **Post-Submission Review**: Accessible strictly in `submitted` or `expired` state. Explanations loaded on-the-fly from Phase 2 `Question` documents. Abandoned sessions are strictly denied review.

---

## 12. RESULT REBUILD & INTEGRITY AUDIT ENGINE

`rebuildMockResult(sessionId)` reconstructs results from receipts and verifies full audit integrity:
1. **Load Frozen Sequence**: Load frozen session and `session.questionSequence`.
2. **Load Receipts**: Load all `MockAttemptFinalizationRecord` documents for `sessionId`.
3. **Load Receipt-Linked Attempts**: Load all Attempts referenced by `receipt.attemptId`.
4. **Receipt $\to$ Attempt Integrity Validation**:
   For every receipt, validate:
   - `receipt.sessionId.toString() === session._id.toString()`
   - `session.questionSequence.some(q => q.questionId.toString() === receipt.questionId.toString())`
   - Attempt exists
   - `Attempt._id.toString() === receipt.attemptId.toString()`
   - `Attempt.userId === session.userId`
   - `Attempt.sessionId === session._id.toString()`
   - `Attempt.questionId.toString() === receipt.questionId.toString()`
   - `Attempt.source === 'mock'`
   If any condition is violated, throw **`500 RESULT_INTEGRITY_ERROR`** (internal persisted-data invariant failure). Do not blindly trust receipt existence.
5. **Authoritative Completeness Check**:
   Load all frozen responses for the session.
   Derive:
   ```javascript
   const answeredResponses = responseSnapshot.filter((r) => r.selectedAnswer !== null);
   ```
   Validate that **every frozen ANSWERED response has exactly one valid receipt and exactly one valid mock Attempt**.
   If any answered response lacks a valid receipt or Attempt, throw **`500 RESULT_INCOMPLETE_FINALIZATION`** (internal finalization state failure).
   *(Crucial Architectural Rule: Receipt count is NOT compared against `totalQuestions`. Questions without an answered response are validly unanswered and NEVER require an Attempt or receipt).*
6. **Score Derivation**:
   - Questions with a valid answered response/Attempt are scored as `correct` or `incorrect` using the immutable session scoring snapshot (`correctMarks`, `incorrectMarks`).
   - Questions without an answered response remain `unanswered` and are scored using `unansweredMarks`.
7. **Recompute Complete Analytics via Shared Calculator**:
   - Both initial finalization and `rebuildMockResult()` must invoke the **exact same pure deterministic result calculator function**:
     $$\text{validated assessment entries} \longrightarrow \texttt{calculateMockResult(...)} \longrightarrow \texttt{resultSummary}$$
   - Recomputes ALL SIX analytics domains:
     - `overall`
     - `sections`
     - `topics`
     - `patterns`
     - `difficulties`
     - `pacing`
   - Zero drift permitted between initial finalization and result rebuild.
8. **Reconciliation Audit**:
   - Compare `rebuiltResult` against persisted `session.resultSummary` across all six domains (`overall`, `sections`, `topics`, `patterns`, `difficulties`, `pacing`).
   - Require `rebuiltResult` deep-equals `session.resultSummary`.
   - Any difference triggers **`500 RESULT_INTEGRITY_ERROR`**.
9. **Zero-Answered and Partially-Answered Verification**:
   - Partially answered mock (e.g. 10 questions, 3 answered, 7 unanswered): rebuilds with 3 Attempts, 3 receipts, 7 unanswered entries, and succeeds.
   - Zero answered mock (e.g. 10 questions, 0 answered): rebuilds with 0 Attempts, 0 receipts, 10 unanswered entries, and succeeds.

---

## 13. COMPLETE API SURFACE CONTRACT

| Method | Endpoint | Description | Auth / State Check | Emitted Errors |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/mock-blueprints` | Create reusable blueprint template | Open (V1) / no RBAC | `INVALID_BLUEPRINT`, `MOCK_SCOPE_REQUIRED`, `INVALID_SECTION_SCOPE`, `INVALID_SCORING`, `INVALID_SECTION_TIMING`, `INVALID_DIFFICULTY_DISTRIBUTION` |
| `GET` | `/api/v1/mock-blueprints` | List active blueprints | Open (V1) / no RBAC | — |
| `GET` | `/api/v1/mock-blueprints/:id` | Get blueprint definition | Open (V1) / no RBAC | `MOCK_BLUEPRINT_NOT_FOUND` |
| `POST` | `/api/v1/mock-blueprints/preview` | Zero-write shortfall & timing preview | Open (V1) / no RBAC | `INVALID_BLUEPRINT`, `INSUFFICIENT_QUESTIONS_FOR_MOCK` |
| `POST` | `/api/v1/mock-sessions` | Generate session from blueprint | `userId` required | `USER_NOT_FOUND`, `MOCK_BLUEPRINT_NOT_FOUND`, `INSUFFICIENT_QUESTIONS_FOR_MOCK` |
| `POST` | `/api/v1/mock-sessions/:id/start` | Start session timers (Idempotent) | Owner check | `MOCK_SESSION_NOT_FOUND`, `FORBIDDEN`, `INVALID_SESSION_STATE` |
| `GET` | `/api/v1/mock-sessions/:id` | Get active session state & question DTOs | Owner check | `MOCK_SESSION_NOT_FOUND`, `FORBIDDEN` |
| `GET` | `/api/v1/mock-sessions/:id/questions/:questionId` | View question & record first-view draft | Owner check | `MOCK_SESSION_NOT_FOUND`, `FORBIDDEN`, `MOCK_SESSION_EXPIRED`, `QUESTION_NOT_IN_SESSION`, `QUESTION_NOT_FOUND`, `SECTION_LOCKED` |
| `POST` | `/api/v1/mock-sessions/:id/responses` | Save answer draft / review flag | Owner check | `MOCK_SESSION_NOT_FOUND`, `FORBIDDEN`, `RESPONSE_FROZEN`, `MOCK_SESSION_EXPIRED`, `SECTION_LOCKED`, `QUESTION_NOT_IN_SESSION`, `QUESTION_NOT_FOUND`, `INVALID_OPTION`, `INVALID_TIME_TAKEN` |
| `POST` | `/api/v1/mock-sessions/:id/sections/:sectionId/complete` | Complete section (`section_locked` mode) | Owner check | `MOCK_SESSION_NOT_FOUND`, `FORBIDDEN`, `MOCK_SESSION_EXPIRED`, `SECTION_NOT_ACTIVE`, `SECTION_LOCKED`, `SESSION_STATE_CONFLICT`, `RESPONSE_FROZEN` |
| `POST` | `/api/v1/mock-sessions/:id/submit` | Submit test & trigger finalization | Owner check | `MOCK_SESSION_NOT_FOUND`, `FORBIDDEN`, `MOCK_SESSION_EXPIRED`, `FINALIZATION_IN_PROGRESS`, `FINALIZATION_LEASE_LOST`, `SESSION_STATE_CONFLICT`, `INVALID_SESSION_STATE` |
| `POST` | `/api/v1/mock-sessions/:id/abandon` | Abandon test session | Owner check | `MOCK_SESSION_NOT_FOUND`, `FORBIDDEN`, `SESSION_STATE_CONFLICT` |
| `GET` | `/api/v1/mock-sessions/:id/result` | Get finalized scoring & analytics | Owner check | `MOCK_SESSION_NOT_FOUND`, `FORBIDDEN`, `MOCK_SESSION_NOT_TERMINAL`, `FINALIZATION_IN_PROGRESS` |
| `GET` | `/api/v1/mock-sessions/:id/review` | Question review with explanations | Owner check (terminal only: `submitted` or `expired`; abandoned rejected) | `MOCK_SESSION_NOT_FOUND`, `FORBIDDEN`, `MOCK_SESSION_NOT_TERMINAL` |

### 13.1 Authoritative `POST /api/v1/mock-sessions/:id/submit` Response Contract
- **Already Submitted & Fully Finalized (`status = 'submitted'`, `finalizationState = 'completed'`)**:
  - Returns **`200 OK`** with existing `resultSummary` immediately. Zero lease acquisition, zero new Attempts, zero new receipts, zero Phase 4/5 downstream effects.
- **Active Finalization Running (`status = 'started'`, `finalizationState = 'in_progress'`, active lease `expiresAt > now`)**:
  - Returns **`409 FINALIZATION_IN_PROGRESS`**.
- **Expired Mock Session (`status = 'expired'`)**:
  - Returns **`409 MOCK_SESSION_EXPIRED`** (strictly forbids converting `expired` $\to$ `submitted`).
- **Abandoned Mock Session (`status = 'abandoned'`)**:
  - Returns **`409 SESSION_STATE_CONFLICT`**.
- **Session Not Active (`status = 'created'`)**:
  - Returns **`400 INVALID_SESSION_STATE`**.
- **Finalization Lease Lost (`finalizationLeaseExpiresAt <= now`)**:
  - Returns **`409 FINALIZATION_LEASE_LOST`**.

### 13.2 Authoritative `GET /api/v1/mock-sessions/:id/result` Response Contract
- **Terminal Submitted or Expired Session (`status` $\in$ `['submitted', 'expired']`, `finalizationState = 'completed'`)**:
  - Returns **`200 OK`** with persisted `resultSummary`.
- **Active Valid Finalization In-Progress (`finalizationState = 'in_progress'`, `finalizationLeaseExpiresAt > now`)**:
  - Returns **`409 FINALIZATION_IN_PROGRESS`** (never returns `200 OK` with null `resultSummary`).
- **Non-Terminal Active Session Pre-Expiry (`status = 'started'`, `now < expiresAt`)**:
  - Returns **`400 MOCK_SESSION_NOT_TERMINAL`**.
- **Abandoned Session (`status = 'abandoned'`)**:
  - Returns **`400 MOCK_SESSION_NOT_TERMINAL`** (abandoned sessions have no result summary and are denied review).

---

## 14. SAFE LOGGING SPECIFICATION

- **Allowed Metadata Keys**: `event`, `algorithmVersion`, `sessionId`, `userId`, `blueprintId`, `sectionId`, `questionId`, `status`, `errorCode`, `timestamp`.
- **Strictly Prohibited**: `selectedAnswer`, `correctAnswer`, `question`, `options`, `explanation`, `solution`, auth tokens, passwords, full document dumps.

---

## 15. DATABASE INDEX PLAN & QUERY EXECUTION AUDIT

### 15.1 MongoDB Index Inventory
1. **`Attempt`** (`src/models/attemptModel.js`):
   - `{ sessionId: 1, questionId: 1 }`, unique: true, partial: `{ source: 'mock', sessionId: { $type: 'string' } }`
   - `{ userId: 1, attemptedAt: -1 }` (existing Phase 3)
2. **`MockBlueprint`** (`src/models/mockBlueprintModel.js`):
   - `{ status: 1, createdAt: -1 }`
   - `{ blueprintFingerprint: 1 }`
3. **`MockSession`** (`src/models/mockSessionModel.js`):
   - `{ userId: 1, status: 1, createdAt: -1 }`
   - `{ expiresAt: 1 }`, partial: `{ status: 'started' }`
   - `{ finalizationOwnerToken: 1, finalizationLeaseExpiresAt: 1 }`, partial: `{ finalizationOwnerToken: { $type: 'string' } }`
4. **`MockResponse`** (`src/models/mockResponseModel.js`):
   - `{ sessionId: 1, questionId: 1 }`, unique: true
   - `{ sessionId: 1, sectionId: 1 }`
5. **`MockAttemptFinalizationRecord`** (`src/models/mockAttemptFinalizationRecordModel.js`):
   - `{ sessionId: 1, questionId: 1 }`, unique: true
   - `{ sessionId: 1, attemptId: 1 }`

### 15.2 Post-Implementation Query Execution Audit (explain("executionStats"))
Phase 6 acceptance requires auditing critical query execution plans using `explain("executionStats")` to verify that execution leverages indexed paths (`IXSCAN`) and does not perform unindexed full collection scans (`COLLSCAN`).

After implementation, audit at minimum:
1. **MockSession owner/status lookup**: `MockSession.findOne({ _id: sessionId, userId: ... })`
2. **Started-session expiry lookup**: `MockSession.find({ status: 'started', expiresAt: { $lte: now } })`
3. **MockResponse session/question lookup**: `MockResponse.findOne({ sessionId, questionId })`
4. **MockResponse section snapshot lookup**: `MockResponse.find({ sessionId, sectionId })`
5. **MockAttemptFinalizationRecord lookup**: `MockAttemptFinalizationRecord.find({ sessionId })`
6. **Recent Attempt history query**: `Attempt.find({ userId }).sort({ attemptedAt: -1 }).limit(50)`
7. **Question candidate assembly queries**: `Question.find({ pattern: ..., difficulty: ... }).sort({ _id: 1 })`

**Reporting Requirement for Each Query**:
- Winning index name
- Stage (`IXSCAN` vs `COLLSCAN`)
- `keysExamined`
- `docsExamined`

Unexpected collection scans (`COLLSCAN`) on critical Phase 6 paths must be explained or fixed. Existing Phase 1–5 indexes must not be modified unnecessarily.

---

## 16. COMPREHENSIVE TEST SUITE MATRIX

### 16.0 Final Runtime Semantics, Expiry & Regression Closeout Tests
- **T0.1: Expired Response Triggers Lazy Expiry Finalization**:
  Fixture: `status = 'started'`, `expiresAt = 11:00:00`, 3 saved answers, 7 unanswered questions. At 11:00:00 call `POST /responses`. Asserts: new response NOT saved, 3 existing answers finalized exactly once into mock Attempts, 7 scored unanswered, session `status = 'expired'`, `expiredAt != null`, `submittedAt = null`, `resultSummary` persisted, subsequent calls create 0 new Attempts.
- **T0.2: Expired GET Session Returns Terminal State**:
  Calling `GET /mock-sessions/:id` after `expiresAt` triggers lazy expiry finalization and returns terminal `status = 'expired'`.
- **T0.3: Expired GET Result Idempotently Finalizes and Serves Result**:
  Calling `GET /mock-sessions/:id/result` after `expiresAt` finalizes session if still pending, persists and returns `resultSummary`.
- **T0.4: Timed Section Auto-Expiry & Next Section Activation**:
  Under `section_locked` with section timing, when `activeSection.expiresAt <= now`, current section transitions to `expired`, next section transitions to `in_progress` with `expiresAt = min(now + duration, session.expiresAt)`.
- **T0.5: Expired Prior Section Rejection**:
  Submitting a response to an expired section returns `409 SECTION_LOCKED`. Prior sections cannot be reopened.
- **T0.6: Final Timed Section Auto-Submission**:
  When final timed section times out while `now < session.expiresAt`, finalizes with `targetStatus = 'submitted'`. If `now >= session.expiresAt`, global expiry takes precedence (`targetStatus = 'expired'`).
- **T0.7: Section-Aware timeTakenSeconds Enforcement**:
  Session elapsed = 30m, active section elapsed = 4m, tolerance = 5s. Client reporting `timeTakenSeconds <= 245` succeeds; client reporting `timeTakenSeconds > 245` is rejected with `400 INVALID_TIME_TAKEN`.
- **T0.8: Missing StudentProgress Normalized to Unseen in Diagnostic Mock**:
  User with 0 `StudentProgress` documents generates diagnostic mock. All eligible patterns classify as `Unseen`, canonical registry order resolves ties, zero progress documents are created merely for classification, question allocation succeeds deterministically.
- **T0.9: Partial StudentProgress Diagnostic Normalization**:
  User with progress only for 1 pattern out of 3 in scope. The remaining 2 patterns normalize in-memory to `attempts: 0, mastery: 0` and participate in `Unseen` bucket without data loss.
- **T0.10: Dynamic Error-Code Complete Consistency**:
  Dynamically asserts that:
  1. Every Phase 6 error code emitted across controllers, services, and validators $\in$ `MOCK_ERROR_CODES`.
  2. Every documented Phase 6 API error $\in$ `MOCK_ERROR_CODES`.
  Zero undocumented string literals remain. Error code count is evaluated dynamically.
- **T0.11: Partially Answered Mock (3 Answered / 7 Unanswered)**:
  10-question mock with 3 answered and 7 unanswered. Asserts: exactly 3 mock Attempts created, exactly 3 finalization receipts created, 7 questions scored as unanswered via `unansweredMarks`, result finalizes successfully without `RESULT_INCOMPLETE_FINALIZATION`.
- **T0.12: Zero Answered Mock (0 Answered / 10 Unanswered)**:
  10-question mock where student answers 0 questions (e.g., auto-expired session). Asserts: exactly 0 mock Attempts created, exactly 0 receipts created, all 10 questions scored as unanswered, result finalization and retrieval succeed without error.
- **T0.13: Result Rebuild Completeness Validates Answered Responses, Not Total Questions**:
  `rebuildMockResult(sessionId)` validates that every frozen ANSWERED response has exactly one valid receipt and Attempt. Does not expect receipts for unanswered questions. Rebuild succeeds identically for partially answered and zero-answered mocks.
- **T0.14: Genuine Pattern-Only Scope**:
  Blueprint with `patterns: ["Successive Percentage Change", "Marked Price Discount"]` and `topics` omitted succeeds without artificial topics.
- **T0.15: Topics-Only Scope**:
  Blueprint with `topics: ["Percentage", "Profit and Loss"]` resolves to all canonical patterns of those topics.
- **T0.16: Topics + Patterns Scope**:
  Blueprint with `topics: ["Percentage"]` and `patterns: ["Successive Percentage Change"]` succeeds; pattern not belonging to topic is rejected with `400 INVALID_SECTION_SCOPE`.
- **T0.17: All Canonical Patterns Scope**:
  `allCanonicalPatterns: true` succeeds when topics/patterns are omitted, and is rejected with `400 INVALID_SECTION_SCOPE` if topics or patterns are present.
- **T0.18: Mode-Aware Recent Question Exclusion Defaults**:
  - `standard` mode with `excludeRecentQuestions` omitted resolves to `false`.
  - `diagnostic` mode with `excludeRecentQuestions` omitted resolves to `true`.
  - Explicit boolean override (`true` or `false`) correctly overrides mode default in both modes.
- **T0.19: Complete Abandon Session Lifecycle**:
  Transitions `created` $\to$ `abandoned` and `started` $\to$ `abandoned` populate `abandonedAt` timestamp and set terminal `status = 'abandoned'`.
- **T0.20: Submit vs Abandon Concurrency Race & Atomic Winner**:
  Simultaneous atomic race between `submit()` and `abandon()`.
  - When submit acquires lease or freezes responses first $\implies$ abandon receives `409 SESSION_STATE_CONFLICT`, final status is `submitted` only.
  - When abandon wins first before finalization begins $\implies$ submit receives `409 SESSION_STATE_CONFLICT`, final status is `abandoned` only, and exactly 0 mock Attempts/receipts are created.
  - When abandon is called on an expired session (`now >= expiresAt`) $\implies$ centralized `resolveSessionExpiry` sets `status = expired`, abandon receives `409 SESSION_STATE_CONFLICT`.
  - Forbids dual transitions, `abandoned` transitioning to `submitted`, `submitted` transitioning to `abandoned`, or Attempts created for an abandoned session.
- **T0.21: Abandoned Session Review Denial**:
  `GET /mock-sessions/:id/review` on an abandoned session is rejected without exposing correct answers, options, or explanations.
- **T0.22: Minimal Receipt Schema Enforcement**:
  Asserts that `MockAttemptFinalizationRecord` documents contain ONLY minimal audit link fields (`sessionId`, `questionId`, `userId`, `attemptId`, `algorithmVersion`, `status`, `finalizedAt`) and zero duplicate scores, correctness, or question metadata.
- **T0.23: Receipt $\to$ Attempt Linkage Integrity Check**:
  Corrupt receipt linkage (wrong sessionId, questionId not belonging to `session.questionSequence`, missing Attempt, `receipt.attemptId` does not match loaded Attempt, `Attempt.userId` mismatch, `Attempt.sessionId` mismatch, `Attempt.questionId` mismatch, or non-mock source) throws **`500 RESULT_INTEGRITY_ERROR`** during recovery, result generation, or rebuild.
- **T0.24: Lease Recovery Path Identification (B1 vs B2)**:
  - Worker crash with expired lease correctly acquires and reports `acquisitionPath = 'PATH_B1_CRASH_RECOVERY'`.
  - Explicit failed session correctly acquires and reports `acquisitionPath = 'PATH_B2_EXPLICIT_FAILED'` immediately without 30s delay.
- **T0.25: Zero-Write Preview Across All 5 Write Collections**:
  `POST /mock-blueprints/preview` verifies $\Delta = 0$ on all 5 collections: `MockBlueprint`, `MockSession`, `MockResponse`, `MockAttemptFinalizationRecord`, and `Attempt`.
- **T0.26: Section Timing Validation Contract**:
  - `free` navigation with any section duration rejects with `400 INVALID_SECTION_TIMING`.
  - `section_locked` with partial timing (some timed, some untimed) rejects with `400 INVALID_SECTION_TIMING`.
  - `section_locked` with sum(section durations) $\le$ global duration is ACCEPTED (equality is not required).
  - `section_locked` with sum(section durations) > global duration rejects with `400 INVALID_SECTION_TIMING`.
- **T0.27: HTTP Lifecycle & Concurrency Conflict Contract**:
  - Submit vs abandon race loser receives `409 SESSION_STATE_CONFLICT`.
  - Abandon vs submit race loser receives `409 SESSION_STATE_CONFLICT`.
  - Calling abandon on an already expired or submitted session receives `409 SESSION_STATE_CONFLICT`.
  - Concurrent finalization attempt against an active lease receives `409 FINALIZATION_IN_PROGRESS`.
  - Lost finalization lease during heartbeat or terminal write fencing raises `409 FINALIZATION_LEASE_LOST`.
- **T0.28: Internal Persisted Invariant & Finalization Error Contract**:
  - Corrupt receipt/Attempt linkage throws `500 RESULT_INTEGRITY_ERROR`.
  - Missing finalized Attempt for any answered response during rebuild throws `500 RESULT_INCOMPLETE_FINALIZATION`.
  - Unhandled worker execution failure throws `500 FINALIZATION_EXECUTION_FAILED`.
- **T0.29: Expired Lease Authority Loss & Recovery**:
  Fixture: Worker A acquires finalization lease, lease expires (`finalizationLeaseExpiresAt <= now`).
  - Worker A heartbeat attempt rejects with `409 FINALIZATION_LEASE_LOST`.
  - Worker A terminal commit attempt rejects with `409 FINALIZATION_LEASE_LOST`.
  - Worker A `handleFinalizationFailure` matches 0 documents (does not mutate state to failed).
  - Worker B acquires session via `PATH_B1_CRASH_RECOVERY` and finishes finalization cleanly with exactly-once Attempts and receipts.
- **T0.30: Authoritative Terminal Timestamps & Schema Alignment**:
  - Manual submission: `status = submitted`, `submittedAt != null`, `expiredAt = null`, `abandonedAt = null`.
  - Timer expiry: `status = expired`, `expiredAt != null`, `submittedAt = null`, `abandonedAt = null`.
  - Abandon: `status = abandoned`, `abandonedAt != null`, `submittedAt = null`, `expiredAt = null`.
  - Asserts zero undefined top-level `MockSession` writes (`finalizedAt` and `sectionResults` do not exist at top level; section results live strictly inside `resultSummary`).
- **T0.31: Recent Question Exclusion Across Complete Attempt History**:
  - User with recent attempts from `practice`, `daily_plan`, `adaptive`, `revision`, and `mock`.
  - With `effectiveExcludeRecentQuestions = true`, all 5 attempt sources within the latest-50 window are excluded from selection candidate pool.
  - With `effectiveExcludeRecentQuestions = false`, none of these recent attempts are excluded.
- **T0.32: Transactional Section Deadline Check Aborts Response Persist**:
  Request begins immediately before section expiry (`now < activeSection.expiresAt`), but transactional clock reaches exact expiry (`now >= activeSection.expiresAt`) inside `saveResponseTransactional`. Asserts: response is NOT persisted, transaction aborts, and section expiry is resolved outside the transaction, returning `409 SECTION_LOCKED`.
- **T0.33: First-View Reaches Exact Section Expiry Without Mutation**:
  First-view endpoint reaches exact section expiry. Asserts: does NOT create or update `MockResponse`. Resolves section transition outside the aborted mutation, returning `409 SECTION_LOCKED`.
- **T0.34: Manual Section Complete vs Lazy Expiry Single-Transition Winner**:
  Simultaneous race between manual `POST /sections/:id/complete` and lazy section expiry evaluation. Atomic transition guard (`$elemMatch: { sectionId: expectedSectionId, status: in_progress }`) ensures exactly one transition succeeds and activates the next section exactly once.
- **T0.35: Concurrent Lazy Expiry Resolvers Activate Next Section Exactly Once**:
  Multiple concurrent lazy expiry requests race on an expired section. Exactly one transition succeeds, next section is activated once, and after resolution exactly one section remains `in_progress`.
- **T0.36: Final Section Expiry During Response Finalizes Session Deterministically**:
  Response submitted during final section timeout. Response is NOT persisted. Session transitions to terminal state (`submitted` if `now < session.expiresAt`, `expired` if `now >= session.expiresAt`).
- **T0.37: Pacing Tolerance Never Extends activeSection.expiresAt**:
  Verification that `SESSION_LIMITS.PACING_TOLERANCE_SECONDS` (+5s) strictly validates `timeTakenSeconds` pacing input and never extends section validity or expiry.
- **T0.38: Complete Result Analytics Aggregations**:
  Validates factual assessment analytics for `overall`, `sections`, `topics`, `patterns`, `difficulties`, and `pacing`, including `totalQuestions`, `answered`, `unanswered`, `correct`, `incorrect`, `accuracy`, `rawScore`, `maxPossibleScore`, `percentage`, `totalTimeSeconds`, and `averageTimeSeconds`.
- **T0.39: Zero-Answered Analytics Division-by-Zero Safety**:
  Mock session with 0 answered questions produces `accuracy = 0`, `answered = 0`, `unanswered = totalQuestions`, with zero `NaN`, `Infinity`, or division-by-zero errors. Defensive denominator guard protects `percentage`.
- **T0.40: Signed Negative Score & Percentage Support**:
  Mock session with negative raw score preserves signed score and negative percentage without artificial zero clamping.
- **T0.41: Section Override Scoring Reflected in Every Aggregation**:
  Custom section marks (`correctMarks`, `incorrectMarks`, `unansweredMarks`) correctly apply to questions in that section and reflect across overall, topic, pattern, and difficulty aggregations.
- **T0.42: Section Scoring Reconciliation With Overall**:
  Asserts $\sum \text{section.rawScore} \equiv \text{overall.rawScore}$ and $\sum \text{section.maxPossibleScore} \equiv \text{overall.maxPossibleScore}$.
- **T0.43: Result Rebuild Reproduces resultSummary Identically**:
  `rebuildMockResult(sessionId)` invokes shared `calculateMockResult` function and regenerates all six analytics domains (`overall`, `sections`, `topics`, `patterns`, `difficulties`, `pacing`), matching the initial finalization output identically.
- **T0.44: Session-Wide Question Uniqueness (Within & Across Sections)**:
  Asserts zero duplicate `questionId` exists anywhere in the mock session across all sections, topics, patterns, and difficulty buckets.
- **T0.45: Overlapping Scopes Produce Globally Unique Questions**:
  Sections with overlapping scope pools (e.g. topic `Percentage` and pattern `Successive Percentage Change`) draw distinct, globally unique questions using session-wide `selectedQuestionIds`.
- **T0.46: Question Shortfall from Uniqueness Rejection**:
  When question bank candidate exhaustion occurs due to session-wide uniqueness filtering, generator throws `400 INSUFFICIENT_QUESTIONS_FOR_MOCK` with zero silent relaxation of difficulty, recent exclusion, or scope.
- **T0.47: Deterministic Replay With Global Uniqueness**:
  Replaying session generation with identical seed, blueprint, and question-bank state reproduces the exact same ordered `questionSequence` with identical globally unique questions.
- **T0.48: Atomic Two-Section Transition & Anti-Stranding Verification**:
  Asserts that manual section completion and lazy expiry update current section (`status = completed/expired`, `completedAt = now`) and activate next section (`status = in_progress`, `startedAt = now`, `expiresAt = calculated`, `currentSectionId = next.sectionId`) in one logically atomic transition. Asserts that `$elemMatch` guard matches the same array element (`sectionId` and `status = in_progress`). Asserts that no intermediate state can leave current completed while next remains pending, and exactly one section is in_progress after any non-final transition.
- **T0.49: Mock Response Duration to Phase 3 Attempt Adapter Mapping**:
  Fixture: Finalized answered mock response with `MockResponse.timeTakenSeconds = 42`.
  Asserts: Resulting immutable Attempt record created via `attemptService.createAttempt(...)` has `Attempt.timeTaken = 42`. Verifies that Phase 3 schema is unmodified, `source = 'mock'`, `sessionId` correct, `questionId` correct, `difficultyAtAttempt` correct, and topic/pattern snapshots match question document.
- **T0.50: Complete 6-Domain Result Rebuild Parity**:
  Asserts that `rebuildMockResult(sessionId)` invokes the shared deterministic `calculateMockResult` function and reconstructs all six analytics domains (`overall`, `sections`, `topics`, `patterns`, `difficulties`, `pacing`). Asserts `rebuiltResult` deep-equals `persisted session.resultSummary` across every metric. Verifies identical reconstruction for zero-answered, partially-answered, and signed negative scoring sessions.
- **T0.51: Bi-Directional Dynamic API Error Consistency**:
  Asserts dynamically that:
  1. Every Phase 6 error code emitted across controllers, services, and validators exists in `MOCK_ERROR_CODES`.
  2. Every error code documented in the API Surface Contract table exists in `MOCK_ERROR_CODES`.
  3. Integration tests assert endpoint-specific documented error codes for every tested failure path.
  Zero undocumented string literals exist. No hardcoded count.
- **T0.52: Path A Persists Target Submitted**:
  Initial finalization acquisition via Path A when `now < session.expiresAt` with `requestedTargetStatus = submitted` atomically sets `finalizationTargetStatus = 'submitted'`. Terminal commit reads `finalizationTargetStatus`, writes `status = 'submitted'`, `submittedAt = now`, `expiredAt = null`, and retains `finalizationTargetStatus = 'submitted'`.
- **T0.53: Path A Persists Target Expired on Global Expiry**:
  Initial acquisition via Path A when `now >= session.expiresAt` (even if caller requested `submitted`) atomically computes `effectiveTargetStatus = 'expired'` and sets `finalizationTargetStatus = 'expired'`. Terminal commit writes `status = 'expired'`, `expiredAt = now`, `submittedAt = null`, and retains `finalizationTargetStatus = 'expired'`.
- **T0.54: Path B1 Preserves Target Across Wall-Clock Expiry**:
  Submit starts before expiry at 10:59:58 (`finalizationTargetStatus = 'submitted'`), worker crashes. Wall-clock expiry passes at 11:00:00. B1 crash recovery begins at 11:00:05. Asserts: `finalizationTargetStatus` is preserved as `'submitted'` without clock recalculation. Terminal commit completes with `status = 'submitted'`, `submittedAt != null`, `expiredAt = null`.
- **T0.55: Path B2 Preserves Target on Explicit Failed Recovery**:
  Session with `finalizationTargetStatus = 'submitted'` catches recoverable error and transitions to `failed` state. B2 immediate retry acquires lease. Asserts: `finalizationTargetStatus` remains `'submitted'` without overwrite or clock recalculation.
- **T0.56: Expiry Finalization Crash Recovery Preserves Target Expired**:
  Lazy expiry finalization begins (`finalizationTargetStatus = 'expired'`), worker crashes. Recovery worker acquires lease. Asserts: `finalizationTargetStatus` remains `'expired'`. Terminal commit completes with `status = 'expired'`.
- **T0.57: Recovery Caller Cannot Overwrite Persisted Target**:
  Session with persisted `finalizationTargetStatus = 'submitted'` undergoes recovery. A concurrent or subsequent caller requesting `expired` cannot mutate or override the persisted target. The persisted `'submitted'` target wins. Conversely, persisted `'expired'` cannot be overwritten by a `submitted` request.
- **T0.58: Final Section Completion & Finalization Barrier Atomic Single Write**:
  Final section transition atomically writes in ONE transaction: current section status (`completed` or `expired`), `completedAt = now`, `currentSectionId = null`, `responsesFrozen = true`, `finalizationState = 'in_progress'`, `finalizationOwnerToken = workerToken`, `finalizationLeaseExpiresAt = now + 30s`, `finalizationHeartbeatAt = now`, `finalizationStartedAt = now`, `finalizationTargetStatus = (now >= expiresAt ? 'expired' : 'submitted')`, `responseMutationVersion += 1`. Asserts zero intermediate state exists.
- **T0.59: Final-Section Completion & Expiry vs Abandon Repeated Races (50–100 Iterations)**:
  50–100 repeated race iterations between final-section transition (both completion and timeout expiry) and `/abandon`. Asserts:
  - Exactly one winner per iteration.
  - If final section establishes barrier first $\implies$ abandon receives `409 SESSION_STATE_CONFLICT`, final status is `submitted` or `expired`.
  - If abandon wins first $\implies$ final section transition fails, session remains `abandoned`, exactly 0 Attempts, 0 receipts.
  - Zero Attempts or receipts are ever created when abandon wins.
- **T0.60: Final-Section Completion & Expiry vs Manual Submit Repeated Races (50–100 Iterations)**:
  50–100 repeated race iterations between final section transition and manual `POST /submit`. Both contend on the same session state. Asserts:
  - Exactly one finalization owner is created.
  - If final section establishes owner first $\implies$ submit receives `409 FINALIZATION_IN_PROGRESS`.
  - If submit establishes owner first $\implies$ final section transition cannot acquire a second owner.
  - Exactly one terminal state.
- **T0.61: No Response Commits After Final-Section Barrier**:
  Response save arriving concurrently with or after final-section transition barrier commits is rejected with `409 RESPONSE_FROZEN` (or `409 SECTION_LOCKED` / `400 INVALID_SESSION_STATE`). Exactly 0 response writes commit post-barrier.
- **T0.62: Submit After Completed Submission Returns 200 Identical Result (Zero Downstream Work)**:
  Calling `POST /submit` on an already submitted and completed session returns `200 OK` with identical `resultSummary`. Asserts strictly: 0 new lease acquisitions, 0 new Attempts, 0 new receipts, 0 `StudentProgress` updates, 0 Phase 4 mastery recalculations, 0 Phase 5 revision scheduling updates, 0 timestamp modifications.
- **T0.63: Submit After Expired Returns 409 MOCK_SESSION_EXPIRED**:
  Calling `POST /submit` on an already expired session is rejected with `409 MOCK_SESSION_EXPIRED`. Asserts session is never converted to `submitted`.
- **T0.64: Submit After Abandoned Returns 409 SESSION_STATE_CONFLICT**:
  Calling `POST /submit` on an abandoned session returns `409 SESSION_STATE_CONFLICT`. Asserts zero finalization occurs.
- **T0.65: Repeated resolveSessionExpiry Is Zero-Write Idempotent**:
  Calling `resolveSessionExpiry` repeatedly on an already expired and completed session returns existing `resultSummary` with strictly 0 database writes, 0 new Attempts, 0 new receipts, and 0 Phase 4/5 side effects.
- **T0.66: Exact Lease Boundary Fencing (No 1ms Dead Zone)**:
  Worker A has `leaseExpiresAt = T`, and current server time reaches exactly `T`.
  - Worker A periodic heartbeat query (`finalizationLeaseExpiresAt: { $gt: now }`) matches 0 documents and raises **`409 FINALIZATION_LEASE_LOST`**.
  - Worker A terminal write query (`finalizationLeaseExpiresAt: { $gt: now }`) matches 0 documents and raises **`409 FINALIZATION_LEASE_LOST`**.
  - Worker A failure release query (`finalizationLeaseExpiresAt: { $gt: now }`) matches 0 documents (stale worker cannot mutate state to failed).
  - Worker B Path B1 crash recovery query (`finalizationLeaseExpiresAt: { $lte: now }`) matches the session at exact boundary `T` and acquires ownership immediately. Asserts zero dead zone or stranded period exists between worker expiration and crash recovery.
- **T0.67: Active Lease Definition Strictly Uses > now**:
  Orchestration guards evaluate lease validity as `finalizationLeaseExpiresAt > now`.
  - With `expiresAt > now`: active finalization in-progress returns **`409 FINALIZATION_IN_PROGRESS`**.
  - With `expiresAt === now` or `expiresAt < now`: lease is expired, allowing immediate Path B1 crash recovery or Path B2 retry without false conflict.
- **T0.68: GET /result During Active Expiry Finalization Returns 409 FINALIZATION_IN_PROGRESS**:
  Fixture: Session clock expires (`now >= expiresAt`), lazy expiry resolution begins, Worker A acquires lease. Client invokes `GET /api/v1/mock-sessions/:id/result` while Worker A is processing. Asserts:
  - Endpoint returns **`409 FINALIZATION_IN_PROGRESS`**.
  - Endpoint NEVER returns `200 OK` with `resultSummary = null`.
  - Once Worker A terminal commit succeeds, repeated `GET /result` returns **`200 OK`** with persisted `resultSummary`.
- **T0.69: Active Finalization Blocks All Mutation Endpoints**:
  While session has `responsesFrozen = true` and `finalizationState = 'in_progress'` with an active lease:
  - `POST /responses` rejects with `409 RESPONSE_FROZEN`
  - `POST /sections/:id/complete` rejects with `409 RESPONSE_FROZEN`
  - `POST /submit` rejects with `409 FINALIZATION_IN_PROGRESS`
  - `POST /abandon` rejects with `409 SESSION_STATE_CONFLICT`
  Asserts that zero mutations or state corruption can occur while finalization is running.
- **T0.70: Zero Answer Leakage During Active Finalization**:
  Calling `GET /api/v1/mock-sessions/:id` while finalization is active (`responsesFrozen = true`, `finalizationState = 'in_progress'`) returns active/frozen session state. Full recursive scanner traversal verifies zero presence of `answer`, `correctAnswer`, `explanation`, or `solution`.
- **T0.71: Dynamic Error Code Consistency & Zero Undefined INVALID_REQUEST**:
  Asserts dynamically that `INVALID_REQUEST` is not referenced anywhere in Phase 6 codebase or specification. Asserts that every emitted Phase 6 error code exists in `MOCK_ERROR_CODES` and `MOCK_HTTP_STATUS_MAP`.

1. **Blueprint Validation**: Mode validation preceding normalization, duplicate section IDs, derived totalQuestions, free + section duration (`INVALID_SECTION_TIMING`), partially timed section-locked (`INVALID_SECTION_TIMING`), section timing > global timing (`INVALID_SECTION_TIMING`), invalid topic/pattern/mismatch, allCanonicalPatterns validation, difficulty weights sum, signed scoring bounds.
2. **Error Code Dynamic Consistency**: Exported `MOCK_ERROR_CODES` matched dynamically against all emitted codes across Phase 6 services and controllers.
3. **Blueprint Preview Zero-Write**: $\Delta = 0$ on all 5 write collections, question shortfall reporting.
4. **Standard Generation**: Canonical registry ordering, largest-remainder allocation, deterministic replay with same seed, candidate `_id` stabilization.
5. **Diagnostic Generation**: 4 exhaustive buckets, 5-tier intra-bucket tie-breaking (`lower mastery → fewer attempts → registry order → pattern name`), recent question exclusions.
6. **Session Lifecycle**: State machine transitions, start idempotency, free navigation, section-locked sequential activation, currentSectionId validation, abandon lifecycle.
7. **Draft Response Lifecycle**: First view draft creation, repeated view idempotency, answer setting, answer editing, mark for review, simultaneous answered + marked state, unmarking preserving answer, answer clearing (`selectedAnswer = null`), invalid answer rejection (`INVALID_OPTION`), missing question rejection (`QUESTION_NOT_FOUND`).
8. **Concurrency & Race Battles**:
   - Save vs Freeze: 50–100 repeated race iterations (Save wins + answer scored OR 409 `RESPONSE_FROZEN`).
   - Submit vs Abandon / Abandon vs Submit: Atomic transition guarantees exactly one terminal state; losing caller receives `409 SESSION_STATE_CONFLICT`.
9. **Resumable Three-Way Lease Recovery & Crash Recovery**:
   - **Worker Crash Recovery (Path B1)**: Worker A finalizes questions 1–12, crashes, lease expires with `responsesFrozen = true`. Worker B acquires expired lease, preserves `finalizationStartedAt`, reports `PATH_B1_CRASH_RECOVERY`, finalizes questions 13–30 with zero duplicates.
   - **Explicit Failure Recovery (Path B2)**: Worker A catches recoverable error, sets `state = 'failed'`, releases owner/lease (`ownerToken = null`, `leaseExpiresAt = null`). Worker B immediately acquires Path B2 without waiting 30 seconds, reports `PATH_B2_EXPLICIT_FAILED`, and finishes safely.
   - **Expired-Session Recovery**: Crash recovery during lazy automatic expiry finalization sets `status = 'expired'`, `expiredAt` populated, `submittedAt = null`.
   - **Active Lease Fencing**: Active lease cannot be stolen (`409 FINALIZATION_IN_PROGRESS`). Heartbeat failure halts worker immediately.
   - **Owner Fencing on Terminal Write**: Only active lease owner can commit terminal status; stale worker receives `409 FINALIZATION_LEASE_LOST`.
10. **Timing & Automatic Expiry**: Exact 0ms grace expiry rejection, lazy automatic expiry finalization setting `status = 'expired'` and `expiredAt`, idempotent repeated calls.
11. **Signed Scoring & Reconciliation**: Signed formula, mixed section weights, maxPossibleScore reconciliation, section vs overall reconciliation.
12. **Downstream Integrations**:
    - Phase 3 Attempt integrity.
    - Phase 4 mastery hook execution.
    - Phase 5 revision: **Incorrect mock attempt schedules Stage 0 / 1-day; correct mock attempt DOES NOT advance revision stage**.
    - DailyObjective isolation: Mock attempts do not increment daily objective counts.
    - StudyPlan isolation: Mock completion does not alter study plan or auto-replan.
13. **Review & Rebuild Security**: Post-submit review access control, question explanation loading, receipt-linked result rebuild, result integrity traps (`500 RESULT_INTEGRITY_ERROR`, `500 RESULT_INCOMPLETE_FINALIZATION`), recursive zero answer leakage scanner.

---

## 17. PRE-IMPLEMENTATION BASELINE VERIFICATION EVIDENCE

```text
1. Full Jest Test Suite (Phases 1–5):
   Command:  npx jest --runInBand --forceExit
   Output:   Test Suites: 24 passed, 24 total
             Tests:       388 passed, 388 total
             Snapshots:   0 total
             Time:        116.68 s
             Result:      PASSED (Exit Code: 0, Zero Failures, Zero Regressions)

2. Phase 2 Verification Script:
   Command:  npm run verify:phase2
   Output:   Questions: 12,000 | Canonical topics: 24 | Canonical patterns: 278
             Prerequisite edges: 410 | Content fingerprints: 12,000 / 12,000
             Result:      PASSED (Exit Code: 0)

3. Content Integrity Verification Script:
   Command:  npm run verify:content
   Output:   Verified (SHA-256 match): 12,000
             Modified: 0 | Missing: 0 | Unexpected: 0
             Result:      PASSED (Exit Code: 0)
```

---

## 18. PHASE 7+ BOUNDARY AUDIT

The Phase 6 codebase and runtime architecture enforce **zero presence** of:
- LLM tutoring or conversational agents
- LLM hints or synthetic explanations
- LLM question generation
- Semantic misconception engines
- Teacher or mentor dashboards
- Video or biometric proctoring
- Cross-cohort predictive percentiles or ranks

---

## 19. POST-IMPLEMENTATION DOCUMENTATION & ACCEPTANCE REQUIREMENTS

### 19.1 Documentation Deliverables
Following implementation, the following documentation deliverables must be created or updated with ACTUAL implementation evidence (not planned claims):

1. **`docs/PHASE6_MOCK_TEST_ENGINE.md`**:
   Comprehensive engineering architecture guide for Phase 6, covering data models, lifecycle state machines, timing engines, scoring algorithms, and security boundaries.

2. **`docs/PHASE6_WALKTHROUGH.md`**:
   Detailed walkthrough containing real execution evidence across:
   - executive summary
   - files added/changed
   - configuration
   - models
   - scope validation matrix
   - zero-write preview
   - standard generation fixture
   - diagnostic generation fixture
   - deterministic replay
   - difficulty allocation
   - recent exclusion
   - session state machine
   - global timing
   - section timing
   - navigation
   - draft response lifecycle
   - answer edit/clear/review
   - recursive answer-leakage checks
   - save-vs-freeze race
   - submit-vs-abandon race
   - exactly-once Attempts
   - Attempt-before-receipt recovery
   - B1 crash recovery
   - B2 explicit failure recovery
   - stale-worker fencing
   - manual submission
   - lazy expiry finalization
   - zero-answered finalization
   - partially-answered finalization
   - signed scoring
   - section/topic/pattern/difficulty analytics
   - pacing analytics
   - Phase 4 integration
   - Phase 5 revision integration
   - DailyObjective isolation
   - StudyPlan isolation
   - review security
   - result rebuild
   - integrity failures
   - ownership model
   - safe logging
   - error-code validation
   - test counts
   - Phase 2 integrity evidence
   - index inventory
   - explain executionStats evidence
   - Phase 7+ boundary scan
   - known limitations
   - final Phase 6 gate

3. **Project API Documentation & README**:
   Update `README.md` and API specifications to reflect the new `/api/v1/mock-blueprints` and `/api/v1/mock-sessions` endpoints, error codes, and result analytics contracts.

### 19.2 Final Implementation Acceptance Requirements
During the implementation phase, the test suite and integrity checks must be executed:
```bash
npx jest --runInBand --forceExit
npm run verify:phase2
npm run verify:content
```

**Baseline Pre-Implementation Invariant**:
- Test Suites: 24 passed, 24 total
- Tests: 388 passed, 388 total
- Questions: 12,000 | Canonical topics: 24 | Canonical patterns: 278 | Prerequisite edges: 410
- Fingerprints: 12,000 / 12,000 (0 modified, 0 missing, 0 unexpected)

**Post-Implementation Acceptance Criteria**:
- Total test count **must exceed 388** (as Phase 6 tests are added).
- Report ACTUAL counts for:
  - test suites
  - tests
  - failures (must be 0)
  - skips
  - Phase 2 integrity (12,000 questions, 24 topics, 278 patterns, 410 edges)
  - content integrity (12,000 / 12,000 match)
  - index/explain findings (confirming indexed scans on critical paths)

---

## FINAL RUNTIME SEMANTICS & IMPLEMENTATION READINESS GATE

- [x] every emitted error code is registered
- [x] no INVALID_REQUEST registry mismatch
- [x] lease validity uses strictly > now
- [x] lease expiry uses <= now
- [x] no equality dead-zone exists
- [x] B1 recovers at exact lease expiry
- [x] active expiry finalization never returns a fake 200/null result
- [x] GET /result active-finalization behavior is explicit
- [x] persisted target behavior remains intact
- [x] final-section atomic barrier remains intact
- [x] post-finalization idempotency remains intact
- [x] finalizationTargetStatus exists
- [x] initial acquisition persists target
- [x] B1 preserves target
- [x] B2 preserves target
- [x] terminal commit reads persisted target
- [x] recovery caller cannot change target
- [x] final-section completion and finalization barrier are atomic
- [x] abandon cannot win after final-section finalization barrier
- [x] manual submit and final section cannot create separate owners
- [x] repeated completed submit returns 200 existing result
- [x] repeated completed submit has zero duplicate downstream effects
- [x] repeated completed expiry resolution has zero duplicate downstream effects
- [x] current and next section states change atomically
- [x] section array guard cannot match different embedded elements
- [x] non-final transition cannot leave zero active sections
- [x] MockResponse.timeTakenSeconds maps correctly into existing Phase 3 Attempt.timeTaken contract
- [x] no Phase 3 Attempt schema/service is silently changed by Phase 6
- [x] finalization and rebuild share the same result calculator
- [x] rebuild includes overall, section, topic, pattern, difficulty and pacing
- [x] API error table matches actual runtime endpoint behavior
- [x] exact timed-section deadline is rechecked at the mutation boundary
- [x] no response can commit after activeSection.expiresAt
- [x] first-view mutation obeys exact section deadline
- [x] section transition is race-safe
- [x] overall analytics defined
- [x] section analytics defined
- [x] topic analytics defined
- [x] pattern analytics defined
- [x] difficulty analytics defined
- [x] pacing analytics defined
- [x] zero-answer analytics safe
- [x] scoring reconciliation defined
- [x] questionId is globally unique across the entire mock session
- [x] overlapping section scopes cannot duplicate a Question
- [x] uniqueness shortfall fails explicitly
- [x] explain executionStats audit is required after implementation
- [x] Phase 6 documentation and walkthrough deliverables are restored
- [x] all previous Phase 6 invariants remain
- [x] Phase 1–5 baseline remains clean

---

```text
PHASE 6 DESIGN — VERIFIED

READY TO BEGIN IMPLEMENTATION
```