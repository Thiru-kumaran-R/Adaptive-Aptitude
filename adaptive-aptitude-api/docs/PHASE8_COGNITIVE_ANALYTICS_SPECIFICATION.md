# PHASE 8 — COGNITIVE DIAGNOSTICS & LONGITUDINAL LEARNING ANALYTICS ENGINE
## Authoritative Master Architecture Specification

```text
Document Type:       Authoritative Master Implementation Specification
Status:              PHASE 8 DESIGN — VERIFIED
                     READY TO BEGIN IMPLEMENTATION
Implementation:      PROHIBITED during this specification task
Target Phase:        Phase 8
Author:              DeepMind Antigravity Pair Programmer
Repository:          adaptive-aptitude-api
Frozen Baseline:     Phases 1–7 Verified (51 Suites, 674 Tests, 13 Models)
```

---

## 1. Executive Summary

With the successful verification and closure of **Phase 7 (Intelligent Learning & LLM Advisory Layer)**, the Adaptive Aptitude Platform features an authoritative, deterministic foundation across curriculum intelligence (Phase 2), student data persistence (Phase 3), adaptive decisioning (Phase 4), automated planning and spaced revision (Phase 5), mock exam simulation and atomic finalization (Phase 6), and pedagogical advisory interpretation (Phase 7).

However, the platform currently operates within **transactional silos**:
- **Phase 4** evaluates student mastery on an isolated, per-pattern basis.
- **Phase 5** evaluates daily objectives and revision stages without cross-topic longitudinal modeling.
- **Phase 6** evaluates pacing and section scores strictly within a single mock session.
- **Phase 7** provides episodic pedagogical explanations for individual questions or single exams.

The platform lacks a **Longitudinal Learning Analytics & Cognitive Diagnostic Engine** capable of synthesizing student behavior across time, topics, and modalities.

### Phase 8 Purpose
Phase 8 introduces a **read-only, deterministic analytics engine** that synthesizes immutable student event histories into actionable cognitive diagnostics:
1. **Unified Student Dashboard API**: Single-call aggregation summarizing overall practice volume, mock assessment completion, topic mastery radar, active study plan progress, due revision count, and prioritized focus topics.
2. **Speed-Accuracy Tradeoff Profiling**: Categorizing attempts into four behavioral quadrants (`accurateAndFast`, `accurateAndSlow`, `fastErrorRushing`, `slowErrorStruggling`) to quantify conceptual mastery versus time-pressure rushing.
3. **Cognitive Stamina & Fatigue Modeling**: Analyzing accuracy across question sequence quartiles ($Q_1 \dots Q_4$) within completed, terminal mock exams to detect cognitive fatigue drop-off.
4. **Spaced Repetition Retention Trends**: Measuring empirical correctness across elapsed time intervals between learning events using exact half-open mathematical gap buckets.
5. **Deterministic Goal Readiness Index**: Formulating an objective readiness score ($R \in [0.0, 1.0]$) combining plan target coverage, mastery depth, eligible mock performance, and mock pacing efficiency with dynamic weight renormalization.

---

## 2. Phase 8 Primary Invariant

```text
================================================================================
                           PHASE 8 PRIMARY INVARIANT
================================================================================
PHASE 8 IS A READ-ONLY DETERMINISTIC ANALYTICS LAYER.

1. It consumes deterministic truth strictly from Phases 2–6.
2. It NEVER consumes Phase 7 LLM output as deterministic analytics input.
3. It NEVER mutates Phase 1–7 data.
4. It requires ZERO new MongoDB collections and ZERO new Mongoose models
   (the repository model count remains strictly at exactly 13).
5. All calculations are 100% deterministic, reproducible, and in-memory.
================================================================================
```

### Allowed Responsibilities
- Query immutable historical records from Phases 2, 3, 4, 5, and 6 using indexed, user-scoped read operations.
- Derive in-memory mathematical aggregations, medians, quartiles, and readiness indices.
- Return structured, versioned DTOs (`algorithmVersion: 'v1'`) directly to API clients.

### Strictly Forbidden Responsibilities
- **NO Database Writes**: Zero calls to `save()`, `create()`, `insertMany()`, `updateOne()`, `updateMany()`, `findOneAndUpdate()`, `findByIdAndUpdate()`, `deleteOne()`, `deleteMany()`, or `bulkWrite()` on persistent domain models.
- **NO Mastery Recalculation**: Phase 4 owns mastery math. Phase 8 reads stored `StudentProgress.mastery` and labels (`weak`, `developing`, `proficient`, `mastered`). It never calls `calculatePatternMastery` or `recalculateAndPersistPatternMastery`.
- **NO Planning or Replanning**: Phase 5 owns study plan generation, replanning, and daily objective scheduling. Phase 8 only observes factual records.
- **NO Revision Lifecycle Transitions**: Phase 5 owns Leitner stage progression and receipts. Phase 8 only queries `RevisionItem` state and revision `Attempt` records.
- **NO Mock Scoring or Finalization**: Phase 6 owns scoring, finalization leases, and `resultSummary`. Phase 8 reads completed `resultSummary` and finalized mock attempts.
- **NO LLM in Critical Path**: Diagnostics are pure mathematical algorithms. Zero calls to Gemini or FakeLLMProvider.
- **NO Persistent Analytics Cache**: No Redis, no analytics MongoDB collection, and no background roll-up jobs.

---

## 3. Phase Ownership Boundaries

The platform enforces strict architectural boundaries across all phases:

| Concern | Authoritative Owner | Phase 8 Read | Phase 8 Write | Boundary Enforcement |
|---|---|:---:|:---:|---|
| **Question Bank & DAG** | Phase 2 | YES | **NO** | 12,000 canonical questions and 410 prerequisite edges are immutable. |
| **Attempt Records** | Phase 3 | YES | **NO** | Historical `Attempt` records are immutable factual event snapshots. |
| **StudentProgress** | Phase 3 / Phase 4 | YES | **NO** | Factual attempt counters and Phase 4 pattern mastery are read-only. |
| **Mastery Calculation** | Phase 4 | YES | **NO** | Phase 4 deterministic formula owns mastery. Phase 8 reads persisted values. |
| **Adaptive Selection** | Phase 4 | Optional | **NO** | Next-question recommendation logic belongs to Phase 4. |
| **Study Plans & Goals** | Phase 3 / Phase 5 | YES | **NO** | Goal milestones and plan targets belong to Phase 3/5. |
| **Daily Objectives** | Phase 3 / Phase 5 | YES | **NO** | Objective completion counters belong to Phase 3/5. |
| **Revision Ladder** | Phase 5 | YES | **NO** | 5-stage Leitner intervals and receipts belong to Phase 5. |
| **Mock Scoring & Leases**| Phase 6 | YES | **NO** | Mock sessions, response freezing, and signed scoring belong to Phase 6. |
| **Pedagogical Advice** | Phase 7 | **NO** | **NO** | Phase 7 LLM output is NOT platform truth; Phase 8 never reads LLM text. |
| **Longitudinal Diagnostics** | **Phase 8** | **Owner** | **In-Memory** | Pure mathematical derivation of cognitive profiles and readiness. |

### Unidirectional Relationship with Phase 7
```text
┌────────────────────────────────────────────────────────────────────────┐
│                              PLATFORM TRUTH                            │
│  Phase 2 (Content/DAG) ──► Phase 3 (Events) ──► Phase 4 (Mastery)      │
│  Phase 5 (Plans/Revision) ──► Phase 6 (Mock Simulation & Scoring)      │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼ Read-Only (Deterministic Ingestion)
┌────────────────────────────────────────────────────────────────────────┐
│                                PHASE 8                                 │
│         Cognitive Diagnostics & Longitudinal Analytics Engine          │
│       (Speed-Accuracy, Stamina Curve, Retention Gaps, Readiness)       │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼ Deterministic Signals (Future Scope)
┌────────────────────────────────────────────────────────────────────────┐
│                                PHASE 7                                 │
│                   Intelligent Learning & LLM Layer                     │
│                (Socratic Tutoring, Explanations, Hints)                │
└────────────────────────────────────────────────────────────────────────┘
```
- **Forward Flow**: Phase 8 diagnostic signals (e.g. rushing risk, fatigue drop-off, readiness bottlenecks) may hydrate future Phase 7 prompt contexts.
- **Zero Reverse Flow**: Phase 7 LLM outputs NEVER enter Phase 8 analytical pipelines.

---

## 4. Existing Data Sources & Field Verification

Phase 8 consumes strictly verified fields from the existing 13 Mongoose models.

### Specification-Level Consistency Assertion
```text
Phase 8 must never define a Phase 1–7 schema, field, or enum that differs from the actual model.
```

### 1. `Goal` (`src/models/goalModel.js`)
- `userId` (String, required, trim): Owner student identity.
- `title` (String, required, trim): Goal display name.
- `type` (String, required): Goal type enum, exactly:
  `'company'`, `'government'`, `'entrance'`, `'competitive'`, `'master'`, `'custom'`.
- `targetName` (String, optional, trim): Standardized target name.
- `description` (String, optional, trim): Goal description.
- `startDate` (Date, optional): Horizon start date.
- `targetDate` (Date, optional): Target milestone date. **Note**: Target date belongs to `Goal`, NOT `User`. Custom pre-validate hook enforces `targetDate >= startDate` when both are provided.
- `targetScore` (Number, optional): Target score threshold.
- `priority` (Number, optional, integer 1..5): Priority ranking.
- `status` (String, required, default `'planned'`): Goal status enum, exactly:
  `'planned'`, `'active'`, `'completed'`, `'paused'`, `'cancelled'`.
  **Critical Reconciliation**: `'abandoned'` is **NOT** a valid `Goal` status (it belongs to `MockSession`, NOT `Goal`).
- `createdAt` (Date): Auto-managed timestamp.
- `updatedAt` (Date): Auto-managed timestamp.

### 2. `StudyPlan` (`src/models/studyPlanModel.js`)
- `userId` (String, required, trim): Owner student identity.
- `goalId` (ObjectId, ref: `'Goal'`, required): Linked goal.
- `name` (String, required, trim): Plan title.
- `scope` (String, optional): `'short'`, `'medium'`, `'long'`.
- `phase` (String, optional): `'foundation'`, `'core'`, `'pattern'`, `'advanced'`, `'revision'`, `'mock'`.
- `startDate` (Date, optional): Plan start date.
- `endDate` (Date, optional): Plan scheduled completion date.
- `status` (String, required, default `'planned'`): Plan status enum:
  `'planned'`, `'active'`, `'completed'`, `'paused'`, `'cancelled'`.
- `targets` (Array): Target definitions:
  ```javascript
  {
    topic: String,           // Canonical topic, required
    pattern: String,         // Canonical pattern, optional
    targetQuestions: Number, // Positive integer quota, optional
    targetMastery: Number    // Target mastery threshold 0.0 - 1.0, optional
  }
  ```
  **Critical Verification**: `StudyPlan.targets[]` has **NO `status` or `completed` field**. Target satisfaction is derived factually from `DailyObjective` and `StudentProgress`.
- `planningMeta` (Object, optional): Algorithm metadata.
- `createdAt` (Date), `updatedAt` (Date): Auto-managed timestamps.

### 3. `DailyObjective` (`src/models/dailyObjectiveModel.js`)
- `userId` (String, required, trim): Owner student identity.
- `planId` (ObjectId, ref: `'StudyPlan'`, required): Associated study plan.
- `goalId` (ObjectId, ref: `'Goal'`, required): Associated goal.
- `date` (Date, required): Normalized midnight UTC logical calendar date.
- `topic` (String, required, trim): Daily topic focus.
- `patterns` (Array): Pattern-level objectives:
  ```javascript
  {
    pattern: String,
    targetQuestions: Number,
    completedQuestions: Number, // Factual completed counter (default: 0)
    targetDifficulty: Number
  }
  ```
- `targetMinutes` (Number, optional), `actualMinutes` (Number, optional).
- `status` (String, required, default `'pending'`): `'pending'`, `'in_progress'`, `'completed'`, `'skipped'`.
- `createdAt` (Date), `updatedAt` (Date): Auto-managed timestamps.

### 4. `Attempt` (`src/models/attemptModel.js`)
- `userId` (String, required, trim): Owner student identity.
- `questionId` (ObjectId, ref: `'Question'`, required): Canonical question reference.
- `topic` (String, required, trim): Snapshot of question topic.
- `pattern` (String, required, trim): Snapshot of question pattern.
- `difficulty` (Number, required, integer 1..10): Difficulty level.
- `selectedAnswer` (String, required, trim): Student's chosen option.
- `correctAnswer` (String, required, trim): Canonical correct answer.
- `isCorrect` (Boolean, required): Deterministic server-computed correctness.
- `timeTaken` (Number, required, min: 0): Time taken in seconds. **Note**: Field name is `timeTaken` (NOT `timeSpentSeconds`).
- `source` (String, required): `'practice'`, `'daily_plan'`, `'adaptive'`, `'revision'`, `'mock'`.
- `sessionId` (String, optional, trim): Session grouping (links mock attempts to `MockSession._id`).
- `attemptedAt` (Date, default `Date.now`): Timestamp of attempt execution.

### 5. `StudentProgress` (`src/models/studentProgressModel.js`)
- `userId` (String, required, trim): Owner student identity.
- `topic` (String, required, trim): Canonical topic.
- `pattern` (String, required, trim): Canonical pattern.
- `attempts` (Number, default: 0): Total attempt count.
- `correct` (Number, default: 0): Total correct count.
- `incorrect` (Number, default: 0): Total incorrect count.
- `accuracy` (Number, default: 0): Overall percentage accuracy.
- `mastery` (Number, default: 0): Deterministic Phase 4 pattern mastery ($0.0 \dots 1.0$).
- `highestDifficultyMastered` (Number, default: 0): Highest difficulty mastered (0..10).
- `lastAttemptAt` (Date, optional): Timestamp of most recent attempt.

### 6. `RevisionItem` (`src/models/revisionItemModel.js`)
- `userId` (String, required, trim): Owner student identity.
- `goalId` (ObjectId, ref: `'Goal'`, optional): Linked goal.
- `planId` (ObjectId, ref: `'StudyPlan'`, optional): Linked plan.
- `topic` (String, required, trim): Canonical topic.
- `pattern` (String, required, trim): Canonical pattern.
- `stage` (Number, default: 0, integer 0..4): Leitner stage index ($[1, 3, 7, 14, 30]$ days).
- `intervalDays` (Number, default: 1): Current interval in days.
- `nextReviewDate` (Date, required): Normalized midnight UTC date for next review.
- `lastReviewedAt` (Date, optional): Timestamp of last review.
- `lastOutcome` (String, optional): `'correct'` or `'incorrect'`.
- `status` (String, default `'scheduled'`): `'scheduled'`, `'completed'`, `'paused'`.
- **Note**: Does NOT contain `lastAttemptAt` or `failureCount`.

### 7. `MockSession` (`src/models/mockSessionModel.js`)
- `userId` (String, required, trim): Owner student identity.
- `blueprintId` (ObjectId, ref: `'MockBlueprint'`, optional): Blueprint reference.
- `blueprintSnapshot` (Mixed, required): Deep snapshot of blueprint configuration and sections.
- `mode` (String, required): `'standard'` or `'diagnostic'`.
- `questionSequence` (Array, required): Ordered sequence of questions:
  ```javascript
  {
    questionId: ObjectId,
    sectionId: String,
    order: Number,
    topic: String,
    pattern: String,
    difficulty: Number
  }
  ```
- `totalQuestions` (Number, required): Total question count.
- `durationMinutes` (Number, required): Scheduled test duration.
- `status` (String, required, default `'created'`):
  `'created'`, `'started'`, `'submitted'`, `'expired'`, `'abandoned'`.
- `finalizationState` (String, required, default `'idle'`):
  `'idle'`, `'in_progress'`, `'completed'`, `'failed'`.
- `resultSummary` (Mixed, default `null`): Phase 6 frozen result payload containing `overall.percentage`.

### 8. `MockResponse` (`src/models/mockResponseModel.js`)
- `sessionId` (ObjectId, required): Linked mock session.
- `questionId` (ObjectId, required): Question reference.
- `userId` (String, required): Owner student identity.
- `sectionId` (String, required): Section identifier.
- `selectedAnswer` (String, default `null`): Student's submitted answer.
- `timeTakenSeconds` (Number, default: 0): Time spent on question.
- **Critical Verification**: `MockResponse` does **NOT contain `isCorrect`**. Correctness is read strictly from finalized `Attempt` records (`source = 'mock'`).

---

## 5. Central Configuration

All Phase 8 mathematical thresholds, window limits, weights, and intervals are centralized in:

```text
src/config/analyticsConfig.js
```

### Frozen Configuration Object

```javascript
'use strict';

/**
 * Central Configuration for Phase 8: Cognitive Diagnostics & Analytics Engine
 * All constants are permanently frozen to prevent magic numbers in services.
 */
module.exports = Object.freeze({
  ANALYTICS_ALGORITHM_VERSION: 'v1',

  // Query & Analysis Scope Limits
  DEFAULT_WINDOW_DAYS: 30,
  MAX_WINDOW_DAYS: 90,
  MAX_ATTEMPTS_ANALYZED: 1000,

  // Speed-Accuracy Matrix Parameters
  MIN_SPEED_BASELINE_SAMPLES: 3,
  SPEED_RUSHING_THRESHOLD_MULTIPLIER: 0.60,

  // Cognitive Stamina Parameters
  STAMINA_MIN_QUESTIONS: 4,

  // Priority Focus Topics Parameters
  PRIORITY_FOCUS_TOPICS_LIMIT: 3,

  // Goal Readiness Component Weights (sum to 1.0)
  READINESS_WEIGHTS: Object.freeze({
    planTargetCoverage: 0.30,
    masteryDepth: 0.35,
    eligibleMockPerformance: 0.25,
    eligibleMockPacing: 0.10,
  }),

  // Minimum Required Components for Readiness Score Calculation
  MIN_READINESS_REQUIRED_COMPONENTS: Object.freeze([
    'planTargetCoverage',
    'masteryDepth',
  ]),

  // Spaced Repetition Half-Open Gap Buckets [minDaysInclusive, maxDaysExclusive)
  GAP_RETENTION_BUCKETS: Object.freeze([
    { key: '0.5-1.5d',   minDaysInclusive: 0.5,  maxDaysExclusive: 1.5 },
    { key: '1.5-4.5d',   minDaysInclusive: 1.5,  maxDaysExclusive: 4.5 },
    { key: '4.5-9.5d',   minDaysInclusive: 4.5,  maxDaysExclusive: 9.5 },
    { key: '9.5-18.5d',  minDaysInclusive: 9.5,  maxDaysExclusive: 18.5 },
    { key: '18.5-35.5d', minDaysInclusive: 18.5, maxDaysExclusive: 35.5 },
    { key: '>35.5d',     minDaysInclusive: 35.5, maxDaysExclusive: Infinity },
  ]),

  // Retention Sub-Half-Day Boundary Threshold (days)
  RETENTION_SHORT_GAP_THRESHOLD_DAYS: 0.5,

  // Prerequisite Unmet Threshold for Bottlenecks
  PREREQUISITE_UNMET_THRESHOLD: 0.70,

  // Diagnostic Mastery Label Thresholds
  DIAGNOSTIC_LABEL_THRESHOLDS: Object.freeze({
    WEAK_MAX: 0.40,
    DEVELOPING_MAX: 0.70,
    PROFICIENT_MAX: 0.85,
  }),
});
```

---

## 6. Public API Surface

Phase 8 exposes **exactly FOUR focused, idempotent `GET` endpoints** under `/api/v1/analytics`:

```text
1. GET /api/v1/analytics/dashboard
2. GET /api/v1/analytics/cognitive-profile
3. GET /api/v1/analytics/retention
4. GET /api/v1/analytics/readiness/:goalId
```

No other Phase 8 V1 routes are permitted.

---

## 7. Request Validation

All endpoints validate query parameters before initiating database reads:

### Common Validation (`userId`)
- `userId`: **Required non-empty string** (`typeof userId === 'string' && userId.trim().length > 0`).
- If missing or empty: returns `400 VALIDATION_ERROR` with message `'userId query parameter is required.'`.

### `GET /api/v1/analytics/cognitive-profile`
- `topic`: **Optional string**.
  - If omitted: defaults to `null` (all topics eligible).
  - If supplied: must be a single scalar string. Arrays, objects, blank strings, or non-canonical topics return `400 INVALID_TOPIC`. Verified via `patternRegistryService.topicExists(trimmed)`.
- `windowDays`: **Optional integer**.
  - Default: `30` (`DEFAULT_WINDOW_DAYS`).
  - If supplied: must be a single scalar string parsing to a finite integer in $[1, 90]$. Arrays, objects, blank strings, floats, non-numeric strings, or values outside $1 \dots 90$ return `400 INVALID_WINDOW_DAYS`.

### `GET /api/v1/analytics/readiness/:goalId`
- `goalId`: **Required valid MongoDB ObjectId string** in path parameter.
  - If invalid format: returns `400 VALIDATION_ERROR` with message `'Invalid goalId format.'`.
- `userId`: **Required non-empty string** in query parameter.

---

## 8. Analytics Guard & AppError Convention

All Phase 8 endpoints execute behind a dedicated middleware:

```text
src/middlewares/analyticsGuard.js
```

### 8.1 AppError Constructor Convention
The repository's established `AppError` constructor (`src/utils/AppError.js`) signature is:
```javascript
class AppError extends Error {
  constructor(statusCode, code, message) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode || MOCK_HTTP_STATUS_MAP[code] || 500;
    Error.captureStackTrace(this, this.constructor);
  }
}
```
All Phase 8 error calls MUST conform to this exact argument order:
`new AppError(statusCode, code, message)`.

### 8.2 Finalization Lockout (`409 FINALIZATION_IN_PROGRESS`)
Before calculating analytical views, query `MockSession` for an active finalization lease:
```javascript
const inProgressMock = await MockSession.findOne({
  userId,
  finalizationState: 'in_progress',
});
if (inProgressMock) {
  throw new AppError(
    409,
    'FINALIZATION_IN_PROGRESS',
    'Analytics unavailable while mock finalization is in progress.'
  );
}
```
*Rationale*: Prevents clients from observing intermediate or partial mock score data while the atomic finalization worker is mutating attempts and calculating signed scores.

### 8.3 Active Mock Session Isolation
If a student currently has a mock session in `status IN ['created', 'started']`:
- Analytics endpoints are **NOT blocked**.
- All queries over `MockSession`, `MockResponse`, and `Attempt` **strictly exclude records tied to non-terminal sessions**.
- Draft responses from active exams never leak into historical practice counts, accuracy, speed-accuracy baselines, or stamina curves.

### 8.4 User Existence Semantics
All Phase 8 endpoints verify that the requesting `userId` maps to an existing `User` record in MongoDB:
```javascript
const user = await User.findOne({ userId });
if (!user) {
  throw new AppError(404, 'USER_NOT_FOUND', `User "${userId}" not found.`);
}
```
*Rationale*: Guarantees that empty analytics profiles are never fabricated for nonexistent identities.

### 8.5 Goal Ownership Verification (Readiness Route)
For `GET /api/v1/analytics/readiness/:goalId`:
```javascript
const goal = await Goal.findById(goalId);
if (!goal) {
  throw new AppError(404, 'GOAL_NOT_FOUND', `Goal "${goalId}" not found.`);
}
if (String(goal.userId) !== String(userId)) {
  throw new AppError(403, 'FORBIDDEN', 'Access denied: goal belongs to another user.');
}
```
*Rationale*: Enforces strict separation between nonexistent goals (`404`) and foreign goals (`403`).

---

## 9. Error Taxonomy

Phase 8 uses the centralized `AppError` class and standard HTTP status mappings:

| Error Code | HTTP Status | Trigger Condition |
|---|:---:|---|
| `VALIDATION_ERROR` | `400` | Missing `userId`, malformed `goalId`, or invalid parameter structure. |
| `INVALID_TOPIC` | `400` | Query parameter `topic` does not exist in canonical registry. |
| `INVALID_WINDOW_DAYS` | `400` | Query parameter `windowDays` outside integer range $1 \dots 90$. |
| `USER_NOT_FOUND` | `404` | Requesting `userId` does not exist in `User` collection. |
| `GOAL_NOT_FOUND` | `404` | Target `goalId` does not exist in `Goal` collection. |
| `FORBIDDEN` | `403` | Target `goalId` exists but belongs to a different student. |
| `FINALIZATION_IN_PROGRESS` | `409` | Student has an active mock exam with `finalizationState = 'in_progress'`. |
| `ANALYTICS_CALCULATION_FAILED`| `500` | Unhandled internal mathematical or analytical execution exception. |

---

## 10. Common Response Contract & Helper Verification

Phase 8 responses conform strictly to the established platform helper `src/utils/apiResponse.js`:
- `sendSuccess(res, data, meta = {}, status = 200)`
- `sendError(res, code, message, status = 500)`

### Success Shape
```json
{
  "success": true,
  "data": {
    "algorithmVersion": "v1",
    "...": "payload"
  }
}
```

### Error Shape
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Descriptive error message"
  }
}
```

---

## 11. Global Numeric Presentation & Precision Policy

To ensure 100% deterministic outputs across environments and remove all rounding ambiguity:

### 11.1 Internal Execution Precision
All statistical, algebraic, and aggregative calculations in service layers MUST execute using **full JavaScript Number precision (IEEE 754 64-bit floating point)**.
- **General Invariant**: No Phase 8 analytical branch, threshold comparison, sort comparator, eligibility check, weighting calculation, or label mapping may consume a presentation-rounded value.
- Analytical decisions (e.g. diagnostic labeling and focus ranking) operate exclusively on unrounded values:
  $$\text{rawDiagnosticMastery} = \frac{\sum_{p \in \text{Progress}} p.\text{mastery}}{|\text{Progress}|}$$
  $$\text{rawCoverageRatio} = \frac{\text{patternsWithEvidence}}{\text{canonicalPatternsInTopic}}$$
- Intermediate calculations must never be prematurely rounded, and rounded values must never be fed back into downstream calculations.
- `roundTo()` is strictly a DTO presentation serialization helper executed at the response delivery boundary.

### 11.2 Presentation Rounding Helper
Presentation values are rounded at the DTO serialization boundary using:
```javascript
const roundTo = (num, decimals) => {
  if (num === null || num === undefined || Number.isNaN(num)) return null;
  const factor = Math.pow(10, decimals);
  return Math.round((num + Number.EPSILON) * factor) / factor;
};
```

### 11.3 Authoritative Field Precision Map

| Field Category | Target Precision | Applicable DTO Fields | Example Output |
|---|:---:|---|:---:|
| **Readiness Index** | 2 decimal places | `readinessScore` | `0.77` |
| **Normalized Masteries & Ratios** | 2 decimal places | `diagnosticMastery`, `coverageRatio`, `rushingRiskScore`, `planTargetCoverage.value`, `masteryDepth.value`, `eligibleMockPerformance.value`, `eligibleMockPacing.value`, `averageMastery`, `averagePacingEfficiency` | `0.45`, `0.82`, `0.56` |
| **Effective Component Weights** | 4 decimal places | `effectiveWeight` | `0.3000`, `0.4615`, `0.5385` |
| **Percentages** | 1 decimal place | `overallAccuracy`, quartile `accuracy`, `fatigueDropoffPercent`, `observedRetentionRate`, `completionPercentage` | `78.4`, `84.0`, `22.6`, `42.5` |
| **Time Medians** | 2 decimal places | `medianTimeCorrectSeconds`, `medianTimeIncorrectSeconds` | `38.50`, `24.20` |
| **Integer Counters** | No rounding (integers) | `totalPracticeAttempts`, `totalMocksCompleted`, `attemptsAnalyzed`, `patternsWithEvidence`, `canonicalPatternsInTopic`, `totalTargetQuestions`, `totalCompletedQuestions`, `dueRevisionCount`, `insufficientBaselineCount`, `mockSessionsAnalyzed`, `totalQuestionsAnalyzed`, `totalQuestions`, `correctQuestions`, `activeRevisionItems`, `completedRevisionItems`, `dueTodayCount`, `overdueCount`, `revisionAttemptsAnalyzed`, `excludedNoPriorAttemptCount`, `excludedShortGapCount`, `excludedInvalidChronologyCount`, `completedTargets`, `totalTargets`, `quotaSatisfiedTargets`, `masterySatisfiedTargets`, `targetPatternsWithMastery`, `eligibleMocksCount` | `342`, `5`, `18`, `0` |

### 11.4 Null Value Preservation
- `null` values are **NEVER rounded** and **NEVER converted to `0`** or `0.0`.
- An absent signal remains strictly `null` to reflect absent evidence truthfully.

---

## 12. Active StudyPlan Resolution & Target Shape Contract

The platform schema allows multiple `StudyPlan` documents per user, and `StudyPlan.targets[]` contains optional fields. Phase 8 defines deterministic resolution and shape normalization rules for all endpoints:

### 12.1 Dashboard Active Plan Resolution
For `GET /api/v1/analytics/dashboard`:
```javascript
const activePlan = await StudyPlan.find({
  userId,
  status: 'active',
})
.sort({
  startDate: -1,
  _id: 1,
})
.limit(1);
```
- **Qualifying Status**: Strictly `status === 'active'`.
- **Excluded Statuses**: `planned`, `completed`, `paused`, `cancelled` are NEVER returned as the dashboard active plan.
- **Multiple Active Plans Resolution**: Sorted by `startDate` descending (latest starting plan takes precedence). If `startDate` ties or is missing, tie-broken by `_id` ascending (earliest created plan wins deterministically).
- **No Active Plan**: If no active plan exists, `activePlanSummary = null`.

### 12.2 Goal Readiness Linked Plan Resolution
For `GET /api/v1/analytics/readiness/:goalId`:
```javascript
const linkedPlan = await StudyPlan.find({
  goalId: goal._id,
  userId,
  status: 'active',
})
.sort({
  startDate: -1,
  _id: 1,
})
.limit(1);
```
- **Scoping**: Must match BOTH `goalId` and `userId`.
- **Status Requirement**: Must have `status === 'active'` in V1.
- **Missing Linked Plan**: If no active plan is linked to the goal:
  $$\text{readinessStatus} = \text{'insufficient_data'}, \quad \text{readinessScore} = \text{null}, \quad \text{reason} = \text{'NO_STUDY_PLAN_LINKED_TO_GOAL'}$$
- **Empty Targets**: If the active plan exists but has `targets.length === 0`:
  $$\text{readinessStatus} = \text{'insufficient_data'}, \quad \text{readinessScore} = \text{null}, \quad \text{reason} = \text{'STUDY_PLAN_HAS_NO_TARGETS'}$$

### 12.3 StudyPlan Target Shape Handling Contract
The frozen Phase 3 schema defines targets as:
```javascript
{
  topic: String,           // required
  pattern: String,         // optional
  targetQuestions: Number, // optional
  targetMastery: Number    // optional
}
```
Phase 8 defines unambiguous handling for all model-valid target shapes:

#### 1. Dashboard Behavior (Topic-Only Targets Permitted)
- The dashboard focus-topic analytics (`priorityFocusTopics`) operates at the topic level.
- A model-valid target specifying only `topic` (with `pattern` absent or omitted) is valid for the dashboard candidate set: it causes that topic to become an eligible focus candidate.
- Dashboard analytics MUST NOT invent a pattern for a topic-only target.

#### 2. Goal Readiness Normalization Gate (Strict Pattern-Addressability)
Before computing Goal Readiness (`GET /api/v1/analytics/readiness/:goalId`), the service normalizes every `StudyPlan.targets[]` entry:
- A target is **readiness-pattern-addressable** if and only if:
  1. `target.topic` is a non-empty string matching a valid canonical topic in the Phase 2 registry (`patternRegistryService.topicExists(target.topic)`).
  2. `target.pattern` is a non-empty string matching a valid canonical pattern in the Phase 2 registry (`patternRegistryService.patternExists(target.pattern)`).
  3. `target.pattern` canonically belongs to `target.topic` (`patternRegistryService.patternBelongsToTopic(target.pattern, target.topic)`).
- **Authoritative Helper Signature**: Phase 8 strictly passes arguments in the existing Phase 2/4/6 order: `patternRegistryService.patternBelongsToTopic(pattern, topic)`. It never reverses the arguments and never invents an alias or wrapper.
- **Gate Failure Rule**: If ANY target in the linked active `StudyPlan.targets[]` fails readiness-pattern-addressability (e.g. topic-only target, unknown topic, unknown pattern, pattern not belonging to topic, empty string):
  $$\text{readinessStatus} = \text{'insufficient_data'}, \quad \text{readinessScore} = \text{null}, \quad \text{reason} = \text{'UNSUPPORTED_STUDY_PLAN_TARGET_SHAPE'}$$
- **Prohibitions**:
  - Do NOT expand a topic-only target into all canonical patterns of that topic.
  - Do NOT invent a synthetic or default pattern.
  - Do NOT guess a quota distribution.
  - Do NOT silently drop, skip, or filter out unsupported targets.

#### 3. Optional `targetQuestions` Semantics
Once a target is validated as pattern-addressable:
- If `targetQuestions` is a positive finite integer (`Number.isInteger(t.targetQuestions) && t.targetQuestions > 0`):
  $$\text{quotaAvailable} = \text{true}$$
  $$\text{quotaSatisfied} = (\text{completedQuestions} \ge \text{targetQuestions})$$
- If `targetQuestions` is absent or null (`t.targetQuestions === undefined || t.targetQuestions === null`):
  $$\text{quotaAvailable} = \text{false}$$
  $$\text{quotaSatisfied} = \text{false}$$
  *(Never perform numerical comparison against `undefined`).*
  A mastery-only target without a question quota can still be satisfied through the mastery branch (`masterySatisfied === true`).
- If `targetQuestions` exists but is invalid (e.g. not a finite integer, negative, zero, or non-numeric):
  $$\text{readinessStatus} = \text{'insufficient_data'}, \quad \text{readinessScore} = \text{null}, \quad \text{reason} = \text{'UNSUPPORTED_STUDY_PLAN_TARGET_SHAPE'}$$

#### 4. Optional `targetMastery` Semantics
- Effective target mastery threshold uses the compatibility default:
  $$\text{effectiveTargetMastery} = t.\text{targetMastery} \text{ ?? } 0.85$$
  provided that when `targetMastery` is present, it is a finite number in $[0.0, 1.0]$.
- If `targetMastery` is present but invalid (e.g. non-numeric, $< 0.0$, or $> 1.0$):
  $$\text{readinessStatus} = \text{'insufficient_data'}, \quad \text{readinessScore} = \text{null}, \quad \text{reason} = \text{'UNSUPPORTED_STUDY_PLAN_TARGET_SHAPE'}$$
  Invalid values MUST NEVER be silently replaced with `0.85`.

#### 5. Normalized Algorithm Execution
Only after the target-shape normalization gate succeeds without error may downstream readiness components execute:
- `planTargetCoverage`
- `masteryDepth`
- `PlanTargetPatterns`
- `MockScopePatterns ⊆ PlanTargetPatterns`
- `criticalPrerequisiteBottlenecks`
All algorithms consume the normalized canonical `(topic, pattern)` tuples consistently.

---

## 13. Dashboard Attempt Source & Accuracy Semantics

### 13.1 Non-Mock Practice Attempt Set
The dashboard analytical attempt set consists strictly of non-mock learning attempts:
$$\text{DashboardNonMockAttempts} = \left\{ A \in \text{Attempt} \mid A.\text{userId} === \text{requestingUserId} \land A.\text{source} \in [\text{'practice'}, \text{'daily_plan'}, \text{'adaptive'}, \text{'revision'}] \right\}$$

Mock attempts (`source === 'mock'`) are **NEVER included** in dashboard practice counts or practice accuracy; they are represented independently by `totalMocksCompleted`.

### 13.2 Field Naming: `totalPracticeAttempts`
The field name `totalPracticeAttempts` is preserved to maintain API contract stability. It is formally defined as:
```text
totalPracticeAttempts = Bounded count of all non-mock learning attempts
(practice, daily_plan, adaptive, revision) analyzed for the dashboard.
```

### 13.3 Query Execution & Bounded Window
To ensure zero extra `countDocuments()` overhead:
```javascript
const nonMockAttempts = await Attempt.find({
  userId,
  source: { $in: ['practice', 'daily_plan', 'adaptive', 'revision'] },
})
.sort({
  attemptedAt: -1,
  _id: -1,
})
.limit(MAX_ATTEMPTS_ANALYZED); // 1000

const attemptsAnalyzed = nonMockAttempts.length;
const totalPracticeAttempts = attemptsAnalyzed;
```

### 13.4 Overall Accuracy
$$\text{overallAccuracy} = \begin{cases}
\text{roundTo}\left(\frac{\sum_{i=1}^{N} \mathbb{I}(A_i.\text{isCorrect} == \text{true})}{N} \times 100, 1\right), & N > 0 \\
\text{null}, & N = 0
\end{cases}$$
where $N = \text{attemptsAnalyzed}$.

### 13.5 Completed Mock Count
$$\text{totalMocksCompleted} = \text{Count of MockSession where } \text{userId} = \text{requestingUserId} \land \text{status} \in [\text{'submitted'}, \text{'expired'}] \land \text{finalizationState} = \text{'completed'}$$
- **Excluded**: Sessions in `created`, `started`, or `abandoned`.
- **Excluded**: Sessions with `finalizationState` in `idle`, `in_progress`, or `failed`.

---

## 14. Revision Current-State Logical-Day Semantics

Current revision-state metrics are computed against normalized UTC calendar boundaries anchored to the request-level `referenceNow`:

### 14.1 UTC Logical-Day Boundaries
```javascript
const todayStartUtc = new Date(Date.UTC(
  referenceNow.getUTCFullYear(),
  referenceNow.getUTCMonth(),
  referenceNow.getUTCDate(),
  0, 0, 0, 0
));

const tomorrowStartUtc = new Date(todayStartUtc.getTime() + 86_400_000);
```

### 14.2 Revision Item Counts
1. **`activeRevisionItems`**:
   $$\text{Count of RevisionItem where } \text{userId} = \text{requestingUserId} \land \text{status} = \text{'scheduled'}$$
2. **`completedRevisionItems`**:
   $$\text{Count of RevisionItem where } \text{userId} = \text{requestingUserId} \land \text{status} = \text{'completed'}$$
   *(Paused items count in neither active nor completed).*
3. **`dueTodayCount`**:
   $$\text{Count where } \text{userId} = \text{requestingUserId} \land \text{status} = \text{'scheduled'} \land \text{nextReviewDate} \ge \text{todayStartUtc} \land \text{nextReviewDate} < \text{tomorrowStartUtc}$$
4. **`overdueCount`**:
   $$\text{Count where } \text{userId} = \text{requestingUserId} \land \text{status} = \text{'scheduled'} \land \text{nextReviewDate} < \text{todayStartUtc}$$
   *(Completed or paused items are never overdue).*
5. **`stageDistribution`**:
   Counts of **scheduled items only** (`status === 'scheduled'`) partitioned by integer stage index $0 \dots 4$:
   - `stage0_1day`: count with `stage === 0`
   - `stage1_3days`: count with `stage === 1`
   - `stage2_7days`: count with `stage === 2`
   - `stage3_14days`: count with `stage === 3`
   - `stage4_30days`: count with `stage === 4`
   *Invariant*: Under valid data, $\sum \text{stageDistribution} \equiv \text{activeRevisionItems}$.

---

## 15. Dashboard Contract (`GET /api/v1/analytics/dashboard`)

### 15.1 Request
- Method: `GET`
- Path: `/api/v1/analytics/dashboard`
- Query Parameters: `userId` (required string).

### 15.2 Normal Full-Data Response (Active Plan + History)
```json
{
  "success": true,
  "data": {
    "userId": "student_123",
    "algorithmVersion": "v1",
    "summary": {
      "totalPracticeAttempts": 342,
      "totalMocksCompleted": 5,
      "overallAccuracy": 78.4,
      "attemptsAnalyzed": 342
    },
    "topicMasteryRadar": [
      {
        "topic": "Algebra",
        "diagnosticMastery": 0.45,
        "diagnosticLabel": "weak",
        "patternsWithEvidence": 6,
        "canonicalPatternsInTopic": 14,
        "coverageRatio": 0.43
      },
      {
        "topic": "Percentage",
        "diagnosticMastery": 0.82,
        "diagnosticLabel": "proficient",
        "patternsWithEvidence": 12,
        "canonicalPatternsInTopic": 12,
        "coverageRatio": 1.0
      }
    ],
    "activePlanSummary": {
      "planId": "66a01234567890abcdef1234",
      "name": "CAT 2026 Core Quantitative",
      "startDate": "2026-10-01T00:00:00.000Z",
      "endDate": "2026-12-31T00:00:00.000Z",
      "completionPercentage": 42.5,
      "totalTargetQuestions": 300,
      "totalCompletedQuestions": 128
    },
    "dueRevisionCount": 3,
    "priorityFocusTopics": [
      "Algebra",
      "Surds and Indices",
      "Trigonometry"
    ]
  }
}
```

### 15.3 Partial Response (No Active Plan, Evidence-Only Topics)
```json
{
  "success": true,
  "data": {
    "userId": "student_123",
    "algorithmVersion": "v1",
    "summary": {
      "totalPracticeAttempts": 15,
      "totalMocksCompleted": 0,
      "overallAccuracy": 60.0,
      "attemptsAnalyzed": 15
    },
    "topicMasteryRadar": [
      {
        "topic": "Percentage",
        "diagnosticMastery": 0.50,
        "diagnosticLabel": "developing",
        "patternsWithEvidence": 2,
        "canonicalPatternsInTopic": 12,
        "coverageRatio": 0.17
      }
    ],
    "activePlanSummary": null,
    "dueRevisionCount": 0,
    "priorityFocusTopics": [
      "Percentage"
    ]
  }
}
```

### 15.4 Insufficient Data Response (New User: No Plan, No Progress)
```json
{
  "success": true,
  "data": {
    "userId": "student_new",
    "algorithmVersion": "v1",
    "summary": {
      "totalPracticeAttempts": 0,
      "totalMocksCompleted": 0,
      "overallAccuracy": null,
      "attemptsAnalyzed": 0
    },
    "topicMasteryRadar": [],
    "activePlanSummary": null,
    "dueRevisionCount": 0,
    "priorityFocusTopics": []
  }
}
```

### 15.5 Dashboard dueRevisionCount Semantics
The dashboard metric `dueRevisionCount` is formally defined as:
$$\text{dashboard.dueRevisionCount} \equiv \text{retention.currentState.dueTodayCount}$$
- Count `RevisionItem` records where:
  - `userId === requestingUserId`
  - `status === 'scheduled'`
  - `nextReviewDate >= todayStartUtc`
  - `nextReviewDate < tomorrowStartUtc`
- **Exclusion of Overdue Items**: `dueRevisionCount` reflects items scheduled specifically for the logical UTC day. Overdue items (`nextReviewDate < todayStartUtc`) are **strictly excluded** from `dueRevisionCount` and are exposed exclusively via `retention.currentState.overdueCount`.
- **Cross-Endpoint Equality Invariant**: Under identical request reference timestamp `referenceNow`, `dashboard.dueRevisionCount` MUST strictly equal `retention.currentState.dueTodayCount`.

### 15.6 Active Plan Completion & Zero-Denominator Safety
For the resolved active study plan:
$$\text{totalTargetQuestions} = \sum_{\text{obj} \in \text{PlanDailyObjectives}} \sum_{p \in \text{obj.patterns}} p.\text{targetQuestions}$$
$$\text{totalCompletedQuestions} = \sum_{\text{obj} \in \text{PlanDailyObjectives}} \sum_{p \in \text{obj.patterns}} p.\text{completedQuestions}$$
where `PlanDailyObjectives` are all `DailyObjective` documents matching `{ planId: activePlan._id, userId }`.

- **Positive Workload ($totalTargetQuestions > 0$)**:
  $$\text{completionPercentage} = \text{roundTo}\left(\min\left(100.0, \frac{\text{totalCompletedQuestions}}{\text{totalTargetQuestions}} \times 100\right), 1\right)$$
- **Zero Workload ($totalTargetQuestions === 0$)**:
  $$\text{completionPercentage} = \text{null}$$
  $$\text{totalTargetQuestions} = 0, \quad \text{totalCompletedQuestions} = 0$$
- **Safety Invariant**: When an active plan has zero scheduled daily question workload, the service MUST NOT divide by zero and MUST NOT fabricate `0.0%` completion. It returns `completionPercentage: null`.

---

## 16. Cognitive Profile Contract (`GET /api/v1/analytics/cognitive-profile`)

### 16.1 Request
- Method: `GET`
- Path: `/api/v1/analytics/cognitive-profile`
- Query Parameters:
  - `userId` (required string)
  - `topic` (optional canonical topic string)
  - `windowDays` (optional integer $1 \dots 90$, default: 30)

### 16.2 HTTP Query Normalization & Parameter Validation
HTTP query parameters arrive at the Express boundary as strings (or arrays if repeated). Controller validation MUST perform strict scalar normalization:

1. **`windowDays` Normalization Contract**:
   ```javascript
   const rawWindowDays = req.query.windowDays;
   ```
   - **Omitted (`rawWindowDays === undefined`)**:
     $$\text{windowDays} = \text{DEFAULT\_WINDOW\_DAYS}; \quad // 30$$
   - **Supplied**:
     1. Value must be one scalar string (`typeof rawWindowDays === 'string'`).
     2. Trim whitespace (`trimmed = rawWindowDays.trim()`).
     3. Blank string is invalid (`trimmed === ''` $\implies$ reject).
     4. Arrays/objects are invalid (repeated query parameters like `?windowDays=10&windowDays=20` or objects $\implies$ reject).
     5. Convert to Number (`const num = Number(trimmed)`). If `Number.isNaN(num)` $\implies$ reject.
     6. Require `Number.isInteger(num)`. Fractional numbers (e.g. `30.5`) $\implies$ reject.
     7. Require $1 \le \text{num} \le \text{MAX\_WINDOW\_DAYS}$ (90).
     - **Invalid Input Handling**: Any violation of the above rules MUST reject immediately with HTTP 400 `INVALID_WINDOW_DAYS`.
     - **Resolved Value**: `windowDays = num`.
     - **Authoritative Normalization Examples (Must Be Tested)**:
       - `?windowDays=1` $\implies 1$
       - `?windowDays=30` $\implies 30$
       - `?windowDays=90` $\implies 90$
       - `?windowDays=0` $\implies$ reject HTTP 400 `INVALID_WINDOW_DAYS`
       - `?windowDays=91` $\implies$ reject HTTP 400 `INVALID_WINDOW_DAYS`
       - `?windowDays=30.5` $\implies$ reject HTTP 400 `INVALID_WINDOW_DAYS`
       - `?windowDays=abc` $\implies$ reject HTTP 400 `INVALID_WINDOW_DAYS`
       - `?windowDays=` $\implies$ reject HTTP 400 `INVALID_WINDOW_DAYS`
       - Repeated/array parameter (e.g. `?windowDays=10&windowDays=20`) $\implies$ reject HTTP 400 `INVALID_WINDOW_DAYS`

2. **`topic` Normalization Contract**:
   ```javascript
   const rawTopic = req.query.topic;
   ```
   - **Omitted (`rawTopic === undefined`)**: `topic = null` (all canonical topics eligible for speed analysis).
   - **Supplied**:
     1. Value must be one scalar string (`typeof rawTopic === 'string'`). Arrays, repeated parameters, or objects reject with HTTP 400 `INVALID_TOPIC`.
     2. Trim whitespace (`trimmed = rawTopic.trim()`).
     3. Blank string is invalid (`trimmed === ''` $\implies$ reject with HTTP 400 `INVALID_TOPIC`).
     4. Canonical registry lookup: `patternRegistryService.topicExists(trimmed)` MUST be true. If false, reject with HTTP 400 `INVALID_TOPIC`.
     5. Resolved value: `topic = trimmed`.
   - Do not let Express query-string representation determine behavior accidentally.

3. **Sub-Analysis Scope Boundaries (`windowDays` and `topic`)**:
   - **Speed-Accuracy Matrix Scope**:
     - `windowDays` applies exclusively to the historical non-mock attempt scan:
       $$\text{attemptedAt} \ge \text{referenceNow} - (\text{windowDays} \times 86,400,000 \text{ ms})$$
     - When `topic` is supplied, the attempt query additionally requires $\text{Attempt.topic} === \text{topic}$.
     - When `topic` is omitted, attempts across all 24 canonical topics are eligible.
     - `analysisWindow.attemptsAnalyzed` reflects the bounded historical Attempt count inspected for the speed-accuracy matrix *after applying the optional topic filter and windowDays*.
   - **Stamina Curve Scope (Full-History & Topic Independent)**:
     - Cognitive stamina measures whole-exam sequence fatigue across full test progressions.
     - `windowDays` **DOES NOT** filter or constrain `staminaCurve`. `staminaCurve` evaluates all qualifying terminal finalized mock sessions regardless of when they occurred.
     - `topic` **DOES NOT** slice or filter `MockSession.questionSequence`. `staminaCurve` is evaluated identically whether `topic` is provided or omitted.
     - Stamina has its own dedicated evidence counters: `mockSessionsAnalyzed` and `totalQuestionsAnalyzed`.

### 16.3 Normal Full-Data Response
```json
{
  "success": true,
  "data": {
    "userId": "student_123",
    "algorithmVersion": "v1",
    "analysisWindow": {
      "windowDays": 30,
      "attemptsAnalyzed": 280
    },
    "speedAccuracyMatrix": {
      "quadrantCounts": {
        "accurateAndFast": 120,
        "accurateAndSlow": 85,
        "fastErrorRushing": 42,
        "slowErrorStruggling": 33
      },
      "insufficientBaselineCount": 0,
      "rushingRiskScore": 0.56,
      "medianTimeCorrectSeconds": 38.5,
      "medianTimeIncorrectSeconds": 24.2
    },
    "staminaCurve": {
      "mockSessionsAnalyzed": 5,
      "totalQuestionsAnalyzed": 300,
      "quartileAccuracy": [
        { "quartile": 1, "accuracy": 84.0, "totalQuestions": 75, "correctQuestions": 63 },
        { "quartile": 2, "accuracy": 79.5, "totalQuestions": 75, "correctQuestions": 60 },
        { "quartile": 3, "accuracy": 73.2, "totalQuestions": 75, "correctQuestions": 55 },
        { "quartile": 4, "accuracy": 65.0, "totalQuestions": 75, "correctQuestions": 49 }
      ],
      "fatigueDropoffPercent": 22.6
    }
  }
}
```

### 16.4 Zero-Baseline Guard Response ($Q_1$ Accuracy = 0.0%)
```json
{
  "success": true,
  "data": {
    "userId": "student_struggling_mock",
    "algorithmVersion": "v1",
    "analysisWindow": {
      "windowDays": 30,
      "attemptsAnalyzed": 20
    },
    "speedAccuracyMatrix": {
      "quadrantCounts": {
        "accurateAndFast": 2,
        "accurateAndSlow": 1,
        "fastErrorRushing": 8,
        "slowErrorStruggling": 9
      },
      "insufficientBaselineCount": 0,
      "rushingRiskScore": 0.47,
      "medianTimeCorrectSeconds": 45.0,
      "medianTimeIncorrectSeconds": 28.0
    },
    "staminaCurve": {
      "mockSessionsAnalyzed": 1,
      "totalQuestionsAnalyzed": 20,
      "quartileAccuracy": [
        { "quartile": 1, "accuracy": 0.0, "totalQuestions": 5, "correctQuestions": 0 },
        { "quartile": 2, "accuracy": 20.0, "totalQuestions": 5, "correctQuestions": 1 },
        { "quartile": 3, "accuracy": 0.0, "totalQuestions": 5, "correctQuestions": 0 },
        { "quartile": 4, "accuracy": 0.0, "totalQuestions": 5, "correctQuestions": 0 }
      ],
      "fatigueDropoffPercent": null,
      "fatigueReason": "zero_first_quartile_baseline"
    }
  }
}
```

### 16.5 Insufficient Data Response (Sparse Practice / No Mocks)
```json
{
  "success": true,
  "data": {
    "userId": "student_sparse",
    "algorithmVersion": "v1",
    "analysisWindow": {
      "windowDays": 30,
      "attemptsAnalyzed": 4
    },
    "speedAccuracyMatrix": {
      "quadrantCounts": {
        "accurateAndFast": 0,
        "accurateAndSlow": 0,
        "fastErrorRushing": 0,
        "slowErrorStruggling": 0
      },
      "insufficientBaselineCount": 4,
      "rushingRiskScore": null,
      "medianTimeCorrectSeconds": null,
      "medianTimeIncorrectSeconds": null
    },
    "staminaCurve": null,
    "staminaReason": "insufficient_terminal_mocks"
  }
}
```

---

## 17. Retention Contract (`GET /api/v1/analytics/retention`)

### 17.1 Request
- Method: `GET`
- Path: `/api/v1/analytics/retention`
- Query Parameters: `userId` (required string).

### 17.2 Normal Full-Data Response (Only Populated Buckets Returned)
```json
{
  "success": true,
  "data": {
    "userId": "student_123",
    "algorithmVersion": "v1",
    "currentState": {
      "activeRevisionItems": 18,
      "completedRevisionItems": 6,
      "dueTodayCount": 3,
      "overdueCount": 1,
      "stageDistribution": {
        "stage0_1day": 4,
        "stage1_3days": 5,
        "stage2_7days": 4,
        "stage3_14days": 3,
        "stage4_30days": 2
      }
    },
    "observedRetentionByGap": [
      { "gapBucket": "0.5-1.5d", "totalEvents": 40, "correctEvents": 37, "observedRetentionRate": 92.5 },
      { "gapBucket": "1.5-4.5d", "totalEvents": 33, "correctEvents": 28, "observedRetentionRate": 84.8 },
      { "gapBucket": "4.5-9.5d", "totalEvents": 28, "correctEvents": 22, "observedRetentionRate": 78.6 },
      { "gapBucket": "9.5-18.5d", "totalEvents": 21, "correctEvents": 15, "observedRetentionRate": 71.4 },
      { "gapBucket": "18.5-35.5d", "totalEvents": 15, "correctEvents": 10, "observedRetentionRate": 66.7 },
      { "gapBucket": ">35.5d", "totalEvents": 8, "correctEvents": 4, "observedRetentionRate": 50.0 }
    ],
    "evidence": {
      "revisionAttemptsAnalyzed": 150,
      "excludedNoPriorAttemptCount": 3,
      "excludedShortGapCount": 2,
      "excludedInvalidChronologyCount": 0
    }
  }
}
```

### 17.3 Insufficient Data Response (No Revision History Yet)
```json
{
  "success": true,
  "data": {
    "userId": "student_no_rev",
    "algorithmVersion": "v1",
    "currentState": {
      "activeRevisionItems": 0,
      "completedRevisionItems": 0,
      "dueTodayCount": 0,
      "overdueCount": 0,
      "stageDistribution": {
        "stage0_1day": 0,
        "stage1_3days": 0,
        "stage2_7days": 0,
        "stage3_14days": 0,
        "stage4_30days": 0
      }
    },
    "observedRetentionByGap": [],
    "evidence": {
      "revisionAttemptsAnalyzed": 0,
      "excludedNoPriorAttemptCount": 0,
      "excludedShortGapCount": 0,
      "excludedInvalidChronologyCount": 0
    }
  }
}
```

---

## 18. Goal Readiness Contract (`GET /api/v1/analytics/readiness/:goalId`)

### 18.1 Request
- Method: `GET`
- Path: `/api/v1/analytics/readiness/:goalId`
- Query Parameters: `userId` (required string).

### 18.2 Normal Full-Data Response (All Components Available)
```json
{
  "success": true,
  "data": {
    "goalId": "66a01234567890abcdef1234",
    "goalTitle": "CAT 2026 Quantitative",
    "targetDate": "2026-11-29T00:00:00.000Z",
    "algorithmVersion": "v1",
    "readinessStatus": "calculated",
    "readinessScore": 0.77,
    "components": {
      "planTargetCoverage": {
        "value": 0.85,
        "weight": 0.30,
        "effectiveWeight": 0.30,
        "completedTargets": 17,
        "totalTargets": 20,
        "quotaSatisfiedTargets": 12,
        "masterySatisfiedTargets": 15
      },
      "masteryDepth": {
        "value": 0.74,
        "weight": 0.35,
        "effectiveWeight": 0.35,
        "targetPatternsWithMastery": 20,
        "averageMastery": 0.74
      },
      "eligibleMockPerformance": {
        "value": 0.72,
        "weight": 0.25,
        "effectiveWeight": 0.25,
        "eligibleMocksCount": 3
      },
      "eligibleMockPacing": {
        "value": 0.80,
        "weight": 0.10,
        "effectiveWeight": 0.10,
        "averagePacingEfficiency": 0.80
      }
    },
    "criticalPrerequisiteBottlenecks": [
      {
        "targetPattern": "Time and Work — Alternate Days Work",
        "unmasteredPrerequisite": "Time and Work — Basic Work Rates",
        "prerequisiteMastery": 0.42,
        "masteryLabel": "developing"
      }
    ]
  }
}
```

### 18.3 Partial Data Response (Renormalized Without Mocks)
```json
{
  "success": true,
  "data": {
    "goalId": "66a01234567890abcdef1234",
    "goalTitle": "CAT 2026 Quantitative",
    "targetDate": "2026-11-29T00:00:00.000Z",
    "algorithmVersion": "v1",
    "readinessStatus": "calculated",
    "readinessScore": 0.79,
    "components": {
      "planTargetCoverage": {
        "value": 0.85,
        "weight": 0.30,
        "effectiveWeight": 0.4615,
        "completedTargets": 17,
        "totalTargets": 20,
        "quotaSatisfiedTargets": 12,
        "masterySatisfiedTargets": 15
      },
      "masteryDepth": {
        "value": 0.74,
        "weight": 0.35,
        "effectiveWeight": 0.5385,
        "targetPatternsWithMastery": 20,
        "averageMastery": 0.74
      },
      "eligibleMockPerformance": {
        "value": null,
        "weight": 0.25,
        "effectiveWeight": 0.0,
        "eligibleMocksCount": 0
      },
      "eligibleMockPacing": {
        "value": null,
        "weight": 0.10,
        "effectiveWeight": 0.0,
        "averagePacingEfficiency": null
      }
    },
    "criticalPrerequisiteBottlenecks": []
  }
}
```

### 18.4 Insufficient Data Response (No Linked Plan)
```json
{
  "success": true,
  "data": {
    "goalId": "66a01234567890abcdef1234",
    "goalTitle": "CAT 2026 Quantitative",
    "targetDate": "2026-11-29T00:00:00.000Z",
    "algorithmVersion": "v1",
    "readinessStatus": "insufficient_data",
    "readinessScore": null,
    "reason": "NO_STUDY_PLAN_LINKED_TO_GOAL",
    "components": {
      "planTargetCoverage": null,
      "masteryDepth": null,
      "eligibleMockPerformance": null,
      "eligibleMockPacing": null
    },
    "criticalPrerequisiteBottlenecks": []
  }
}
```

---

## 19. Speed-Accuracy Algorithm

### 19.1 Grouping Comparable Attempts
For each historical attempt $A_i$ within the analysis window (`attemptedAt >= referenceNow - windowDays * 86_400_000`):
- **Topic Filter Scope**: If the optional `topic` query parameter was provided to `/cognitive-profile`, the query strictly requires $\text{Attempt.topic} === \text{requestedTopic}$. When omitted, attempts across all canonical topics are loaded.
1. Extract tuple: `(userId, pattern, difficulty)`.
2. Find all **correct attempts** ($A_j.\text{isCorrect} === \text{true}$) by the same user on the same pattern at the exact same difficulty level within the window.

### 19.2 Baseline Calculation
1. If count of correct comparable attempts $< \text{MIN\_SPEED\_BASELINE\_SAMPLES}$ (3):
   - Classification: `insufficient_baseline`.
   - Increment `insufficientBaselineCount`.
   - Attempt is **NOT** placed into any of the 4 quadrants.
2. Otherwise:
   - Compute $T_{\text{median}}$ = median `timeTaken` across those correct attempts using the Section 20 Median Algorithm.

### 19.3 Quadrant Classification
With baseline $T_{\text{median}}$ established, classify attempt $A_i$ with time taken $t_i$:

```text
┌───────────────────────────────────────┬───────────────────────────────────────┐
│              CORRECT                  │               INCORRECT               │
├───────────────────────────────────────┼───────────────────────────────────────┤
│ t_i <= T_median                       │ t_i < 0.60 * T_median                 │
│ ──► accurateAndFast                   │ ──► fastErrorRushing                  │
│                                       │     (Potential rushing behavior)      │
├───────────────────────────────────────┼───────────────────────────────────────┤
│ t_i > T_median                        │ t_i >= 0.60 * T_median                │
│ ──► accurateAndSlow                   │ ──► slowErrorStruggling               │
│     (Concept grasp, deliberate pace)  │     (Conceptual difficulty/struggle)  │
└───────────────────────────────────────┴───────────────────────────────────────┘
```

**Invariant**: An individual attempt is **never** labeled "mastered". Quadrant labels denote execution traits (`accurateAndFast`, `accurateAndSlow`, `fastErrorRushing`, `slowErrorStruggling`).

### 19.4 Overall Aggregate Medians (DTO Serialization)
The `speedAccuracyMatrix` DTO exposes overall summary median times across all analyzed attempts:
- **`medianTimeCorrectSeconds`**:
  $$\text{medianTimeCorrectSeconds} = \text{median of } A.\text{timeTaken} \text{ across ALL bounded speed-analysis attempts where } A.\text{isCorrect} === \text{true}$$
  after applying `userId`, non-mock source filter (`practice`, `daily_plan`, `adaptive`, `revision`), `windowDays`, optional `topic` filter, and capped by `MAX_ATTEMPTS_ANALYZED` (1,000).
- **`medianTimeIncorrectSeconds`**:
  $$\text{medianTimeIncorrectSeconds} = \text{median of } A.\text{timeTaken} \text{ across the same bounded analytical set where } A.\text{isCorrect} === \text{false}$$
- **Empty Subsets**:
  - If the correct attempt subset is empty ($N_{\text{correct}} = 0$):
    $$\text{medianTimeCorrectSeconds} = \text{null}$$
  - If the incorrect attempt subset is empty ($N_{\text{incorrect}} = 0$):
    $$\text{medianTimeIncorrectSeconds} = \text{null}$$
- **Calculation Method**:
  - Medians are calculated directly on the raw scalar `timeTaken` values of the respective subset using the Section 20 Median Algorithm.
  - DTO presentation rounds to 2 decimal places via `roundTo(median, 2)`.
- **Strict Prohibitions**:
  - Do NOT average per-pattern medians.
  - Do NOT average difficulty-group medians.
  - Do NOT reuse $T_{\text{median}}$ from any pattern/difficulty group.
  These DTO medians are overall historical evidence summaries. Per-pattern+difficulty medians ($T_{\text{median}}$) remain exclusively for quadrant classification.

---

## 20. Median Algorithm

For a numeric array $V$ representing attempt times:
1. Filter out all non-finite values, nulls, undefined values, and negative values ($v < 0$).
2. If filtered length $N = 0$: return `null`.
3. Sort array $V$ in ascending numerical order: $v_0 \le v_1 \le \dots \le v_{N-1}$.
4. If $N$ is odd:
   $$\text{Median} = V\left[\lfloor N / 2 \rfloor\right]$$
5. If $N$ is even:
   $$\text{Median} = \frac{V[N/2 - 1] + V[N/2]}{2}$$

The median returns a JavaScript IEEE 754 float without premature rounding.

---

## 21. Rushing Risk

The **Rushing Risk Score** quantifies whether incorrect answers stem from rushing:

$$\text{RushingRisk} = \frac{\text{Count}(\text{fastErrorRushing})}{\text{Count}(\text{fastErrorRushing}) + \text{Count}(\text{slowErrorStruggling})}$$

### Boundary Conditions
- Value range: $[0.0, 1.0]$.
- If total classified incorrect attempts ($\text{fastErrorRushing} + \text{slowErrorStruggling}$) is $0$:
  $$\text{rushingRiskScore} = \text{null}$$
  *(Do NOT convert an undefined ratio to 0.0, which would falsely imply zero rushing risk).*

---

## 22. Cognitive Stamina & Quartile Partitioning

### 22.1 Qualifying Mock Sessions
Only mock sessions meeting ALL of the following criteria qualify for stamina curves:
1. `session.userId === requestingUserId`
2. `session.status IN ['submitted', 'expired']`
3. `session.finalizationState === 'completed'`
4. **Scope Independence (Topic & WindowDays Invariant)**:
   - `windowDays` applies **ONLY** to the speed-accuracy matrix attempt history. It **DOES NOT** filter or constrain `staminaCurve`.
   - `topic` applies **ONLY** to the speed-accuracy matrix attempt history. It **DOES NOT** slice or filter `MockSession.questionSequence`.
   - Cognitive stamina evaluates whole-exam sequence endurance across complete test progressions over the student's full eligible terminal finalized mock history, completely independent of `topic` and `windowDays`.

Active, created, started, abandoned, and unfinalized sessions are strictly excluded.

### 22.2 Sequence Ordering & Correctness
1. Question order is retrieved strictly from `MockSession.questionSequence` (sorted by `order` ascending).
2. For each question entry $q_j$, correctness is retrieved from the corresponding immutable `Attempt` where:
   - `source = 'mock'`
   - `sessionId = String(session._id)`
   - `questionId = q_j.questionId`
3. **Unanswered Questions**: If no finalized `Attempt` exists for a question in `questionSequence` (the student left it unanswered):
   - Correctness contribution = **0**.
   - It remains in the quartile denominator.
   - Zero synthetic attempt documents are created.

### 22.3 Deterministic Quartile Partitioning
For a mock session with $N$ questions:
- If $N < \text{STAMINA\_MIN\_QUESTIONS}$ (4):
  The session cannot form 4 quartiles and is non-partitionable. It is excluded from quartile aggregation (see Section 24 for multi-mock behavior).
- For $N \ge 4$, compute balanced bucket sizes:
  ```javascript
  const base = Math.floor(N / 4);
  const remainder = N % 4;

  const q1Len = base + (remainder >= 1 ? 1 : 0);
  const q2Len = base + (remainder >= 2 ? 1 : 0);
  const q3Len = base + (remainder >= 3 ? 1 : 0);
  const q4Len = base;
  ```

#### Partitioning Examples
- $N = 4 \implies [1, 1, 1, 1]$
- $N = 5 \implies [2, 1, 1, 1]$
- $N = 6 \implies [2, 2, 1, 1]$
- $N = 7 \implies [2, 2, 2, 1]$
- $N = 8 \implies [2, 2, 2, 2]$
- $N = 20 \implies [5, 5, 5, 5]$
- $N = 65 \implies [17, 16, 16, 16]$

Original question sequence order is strictly preserved.

---

## 23. Fatigue Drop-off

Across the aggregated quartile curve:
- Let $\text{Accuracy}(Q_1)$ be the percentage accuracy of the first quartile ($0.0 \dots 100.0$).
- Let $\text{Accuracy}(Q_4)$ be the percentage accuracy of the fourth quartile ($0.0 \dots 100.0$).

### Zero-Baseline Guard
If $\text{Accuracy}(Q_1) === 0.0$:
$$\text{fatigueDropoffPercent} = \text{null}, \quad \text{fatigueReason} = \text{'zero_first_quartile_baseline'}$$
*(Prevents dividing by zero or falsely reporting 0% fatigue when the baseline quartile had zero correct answers).*

### Normal Calculation
Otherwise:
$$\Delta_{\text{fatigue}} = \max\left(0.0, \frac{\text{Accuracy}(Q_1) - \text{Accuracy}(Q_4)}{\text{Accuracy}(Q_1)}\right) \times 100\%$$

In DTO responses, format $\Delta_{\text{fatigue}}$ to **1 decimal place** (e.g. `22.6`). Keep full precision internally.

---

## 24. Multiple Mock Stamina Aggregation & Small-Mock Exclusion

### 24.1 Small-Mock Handling & Evidence Counters
A terminal finalized mock with $N = \text{session.questionSequence.length} < 4$ is non-partitionable and CANNOT contribute to quartile aggregation:
- **`mockSessionsAnalyzed`**:
  $$\text{mockSessionsAnalyzed} = \text{Count of terminal finalized mock sessions with } N \ge 4 \text{ that actually contributed to quartile aggregation}$$
- **`totalQuestionsAnalyzed`**:
  $$\text{totalQuestionsAnalyzed} = \sum_{\text{contributing } s} |s.\text{questionSequence}|$$
  (summed strictly over contributing sessions with $N \ge 4$).

### 24.2 Fallback & Reason Contract
1. **No Terminal Finalized Mocks**: If the student has zero mock sessions meeting Section 22.1 criteria (`userId`, `submitted`/`expired`, `completed`):
   $$\text{staminaCurve} = \text{null}, \quad \text{staminaReason} = \text{'insufficient_terminal_mocks'}$$
2. **Terminal Finalized Mocks Exist, But None with $N \ge 4$**:
   If qualifying terminal finalized mocks exist but EVERY session has $N < 4$:
   $$\text{staminaCurve} = \text{null}, \quad \text{staminaReason} = \text{'insufficient_questions'}$$
3. **Mixed History (At Least One Mock with $N \ge 4$)**:
   If at least one terminal finalized mock has $N \ge 4$:
   - Ignore/exclude all small mocks with $N < 4$.
   - Aggregate exclusively the valid qualifying mocks with $N \ge 4$.
   - Example: A student with one 2-question finalized mock and one 20-question finalized mock yields `mockSessionsAnalyzed = 1`, `totalQuestionsAnalyzed = 20`, and the stamina curve is computed entirely from the 20-question mock.

### 24.3 Aggregation Algorithm
For all contributing mock sessions ($N \ge 4$):
1. Partition each contributing session $s$ into its four quartiles $Q_1(s), Q_2(s), Q_3(s), Q_4(s)$ using Section 22.3.
2. Aggregate raw counts per quartile across all contributing sessions:
   $$\text{totalQuestions}(Q_k) = \sum_{s} |Q_k(s)|$$
   $$\text{correctQuestions}(Q_k) = \sum_{s} \text{correctCount}(Q_k(s))$$
3. Compute quartile percentage accuracy once on aggregated totals:
   $$\text{Accuracy}(Q_k) = \frac{\text{correctQuestions}(Q_k)}{\text{totalQuestions}(Q_k)} \times 100\%$$
4. Compute $\Delta_{\text{fatigue}}$ once on the resulting aggregated curve using Section 23.

*Rationale*: Aggregating raw counts prevents small mocks from receiving disproportionate mathematical weight relative to full-length exams, while completely eliminating distortion from non-partitionable sub-4-question sessions.

---

## 25. Retention Gap Algorithm & Truncation Recovery

### 25.1 Authoritative Observation Event & Accounting Identity
- Only immutable `Attempt` records with:
  $$\text{Attempt.source} === \text{'revision'}$$
  inside the loaded bounded 1,000-attempt history that were inspected as observation candidates serve as retention observation candidates.
- `revisionAttemptsAnalyzed` is formally defined as:
  $$\text{revisionAttemptsAnalyzed} = \text{Count of bounded historical attempts where } \text{source} === \text{'revision'}$$
- **Strict Accounting Identity**:
  $$\text{revisionAttemptsAnalyzed} \equiv \text{bucketedRevisionObservationCount} + \text{excludedNoPriorAttemptCount} + \text{excludedShortGapCount} + \text{excludedInvalidChronologyCount}$$
  where:
  $$\text{bucketedRevisionObservationCount} = \sum_{b \in \text{observedRetentionByGap}} b.\text{totalEvents}$$
- **Disjoint Categorization Rule**: Every candidate revision attempt enters **exactly ONE** category:
  1. A retention gap bucket ($\text{gapDays} \ge 0.5\text{d}$)
  2. `excludedNoPriorAttemptCount` (no prior attempt for the same user, topic, and pattern exists inside or outside the 1,000-record window)
  3. `excludedShortGapCount` (preceding attempt exists, but $0 < \text{gapDays} < 0.5\text{d}$)
  4. `excludedInvalidChronologyCount` (lexicographical predecessor exists, but elapsed timestamp gap $\le 0$)
  An observation candidate is NEVER counted in multiple categories.
- Attempts with source `practice`, `daily_plan`, `adaptive`, or `mock` do NOT count as revision observations.
- Recovered predecessor anchors from outside the 1,000-document limit do NOT increment `revisionAttemptsAnalyzed` or `attemptsAnalyzed`.

### 25.2 Bounded Retention Query & In-Memory Sorting
Load the most recent bounded attempt history:
```javascript
const loadedAttempts = await Attempt.find({ userId })
  .sort({ attemptedAt: -1, _id: -1 })
  .limit(MAX_ATTEMPTS_ANALYZED); // 1000
```
Convert `loadedAttempts` to stable chronological ascending order:
```javascript
loadedAttempts.sort((a, b) => {
  const timeDiff = a.attemptedAt.getTime() - b.attemptedAt.getTime();
  if (timeDiff !== 0) return timeDiff;
  return a._id.toString().localeCompare(b._id.toString());
});
```

### 25.3 Boundary-Anchor Recovery Across 1,000-Document Truncation
For each revision attempt $A_k$ in `loadedAttempts`:
1. Search `loadedAttempts` for the immediately preceding attempt $A_{\text{prev}}$ matching:
   - `same (userId, topic, pattern)`
   - $A_{\text{prev}} < A_k$ under lexicographical order:
     $$(A_{\text{prev}}.\text{attemptedAt} < A_k.\text{attemptedAt}) \lor (A_{\text{prev}}.\text{attemptedAt} == A_k.\text{attemptedAt} \land A_{\text{prev}}._id < A_k._id)$$
2. **Boundary Anchor Recovery**: If NO preceding attempt exists in `loadedAttempts` (because the predecessor fell outside the 1,000-document limit), perform a single targeted read-only query:
   ```javascript
   const recoveredAnchor = await Attempt.findOne({
     userId,
     topic: A_k.topic,
     pattern: A_k.pattern,
     $or: [
       { attemptedAt: { $lt: A_k.attemptedAt } },
       { attemptedAt: A_k.attemptedAt, _id: { $lt: A_k._id } }
     ]
   })
   .sort({ attemptedAt: -1, _id: -1 });
   ```
3. If `recoveredAnchor` is found, treat it as $A_{\text{prev}}$ for $A_k$.
   - **Crucial Invariant**: Recovered boundary anchors **do NOT increment `revisionAttemptsAnalyzed` or `attemptsAnalyzed`**. They serve exclusively as chronological anchors.
4. If no predecessor exists even after boundary lookup:
   - Skip $A_k$ from gap retention calculations.
   - Increment `excludedNoPriorAttemptCount`.

### 25.4 Elapsed Gap Computation
$$\text{gapDays} = \frac{A_k.\text{attemptedAt} - A_{\text{prev}}.\text{attemptedAt}}{86,400,000 \text{ ms}}$$

### 25.5 Chronology & Sub-Half-Day Exclusions
1. If $\text{gapDays} \le 0$ (including same-timestamp attempts where $\text{gapDays} = 0$):
   - Exclude from gap buckets.
   - Increment `excludedInvalidChronologyCount`.
2. If $0 < \text{gapDays} < 0.5$:
   - Exclude from retention gap analytics.
   - Increment `excludedShortGapCount`.

### 25.6 Half-Open Buckets
Assign valid $\text{gapDays} \ge 0.5$ into exact half-open intervals $[\text{minDaysInclusive}, \text{maxDaysExclusive})$:

| Bucket Key | Exact Interval | Minimum (Inclusive) | Maximum (Exclusive) |
|---|:---:|:---:|:---:|
| `0.5-1.5d` | $[0.5, 1.5)$ | 0.5 days | 1.5 days |
| `1.5-4.5d` | $[1.5, 4.5)$ | 1.5 days | 4.5 days |
| `4.5-9.5d` | $[4.5, 9.5)$ | 4.5 days | 9.5 days |
| `9.5-18.5d` | $[9.5, 18.5)$ | 9.5 days | 18.5 days |
| `18.5-35.5d`| $[18.5, 35.5)$ | 18.5 days | 35.5 days |
| `>35.5d` | $[35.5, \infty)$ | 35.5 days | $\infty$ |

### 25.7 Retention Rate & Output
For each bucket:
$$\text{observedRetentionRate} = \text{roundTo}\left(\frac{\text{correct revision observations}}{\text{total revision observations}} \times 100, 1\right)$$
- **API Response Invariant**: Return **only populated buckets** (where $\text{totalEvents} > 0$).
- Output evidence counters: `revisionAttemptsAnalyzed`, `excludedNoPriorAttemptCount`, `excludedShortGapCount`, `excludedInvalidChronologyCount`.
- **V1 Invariant**: Zero Ebbinghaus fitting, zero exponential half-life fitting, and zero memory strength estimation. Empirical gap buckets only.

---

## 26. Readiness Components & Weight Renormalization

The **Goal Readiness Index** evaluates progress toward an owned `Goal` and linked `StudyPlan` whose targets have successfully passed the Section 12.3 Target Shape Normalization Gate:

### Component 1: Plan Target Coverage ($C_{\text{plan}}$, Base Weight $0.30$)
For each normalized target $T$ in `StudyPlan.targets` (`{ topic, pattern, targetQuestions?, targetMastery? }`):
1. Compute completed questions from matching `DailyObjective` records belonging to the plan:
   $$\text{completedQuestions}(T) = \sum \text{DailyObjective.patterns}[j].\text{completedQuestions}$$
   where $\text{DailyObjective.planId} = \text{plan}._id$, $\text{DailyObjective.topic} = T.\text{topic}$, and $\text{pattern.pattern} = T.\text{pattern}$.
2. **Quota Satisfaction**:
   - If $T.\text{targetQuestions}$ is a positive finite integer (`Number.isInteger(T.targetQuestions) && T.targetQuestions > 0`):
     $$\text{quotaAvailable}(T) = \text{true}, \quad \text{quotaSatisfied}(T) = (\text{completedQuestions}(T) \ge T.\text{targetQuestions})$$
   - If $T.\text{targetQuestions}$ is absent or null:
     $$\text{quotaAvailable}(T) = \text{false}, \quad \text{quotaSatisfied}(T) = \text{false}$$
     *(Never perform numerical comparison against `undefined`).*
3. **Mastery Satisfaction**:
   $$\text{effectiveTargetMastery} = T.\text{targetMastery} \text{ ?? } 0.85$$
   $$\text{masterySatisfied}(T) \iff \text{StudentProgress exists} \land \text{StudentProgress.mastery} \ge \text{effectiveTargetMastery}$$
4. **Target Satisfaction**:
   $$\text{targetSatisfied}(T) = \text{quotaSatisfied}(T) \lor \text{masterySatisfied}(T)$$
   *(A mastery-only target without targetQuestions can satisfy through the mastery branch).*
5. **Coverage Ratio**:
   $$C_{\text{plan}} = \frac{\text{Count of unique targets satisfying } \text{targetSatisfied}(T)}{|\text{StudyPlan.targets}|}$$
   - If $|\text{StudyPlan.targets}| === 0$: $C_{\text{plan}} = \text{null}$.
   - DTO exposes: `completedTargets`, `totalTargets`, `quotaSatisfiedTargets`, `masterySatisfiedTargets`.
   - **Note**: $\text{quotaSatisfiedTargets} + \text{masterySatisfiedTargets} \ge \text{completedTargets}$ because one target can satisfy both. They must never be summed to infer unique completed targets.

### Component 2: Mastery Depth ($M_{\text{depth}}$, Base Weight $0.35$)
1. For each target pattern in normalized `StudyPlan.targets`:
   - If `StudentProgress` exists for `(userId, target.topic, target.pattern)`: use stored `mastery` ($0.0 \dots 1.0$).
   - If `StudentProgress` is missing: use $0.0$.
2. Compute arithmetic mean:
   $$M_{\text{depth}} = \frac{\sum_{p \in \text{Targets}} \text{mastery}(p)}{|\text{Targets}|}$$
   - If $|\text{StudyPlan.targets}| === 0$: $M_{\text{depth}} = \text{null}$.
   - **`targetPatternsWithMastery` Evidence Counter**:
     $$\text{targetPatternsWithMastery} = \text{Count of normalized targets } T \in \text{StudyPlan.targets} \text{ for which an actual StudentProgress document exists}$$
     This is an evidence counter. It is NOT `StudyPlan.targets.length` unless every target has progress. Missing progress contributes $0.0$ to the numerator of $M_{\text{depth}}$, while the denominator remains the full normalized target count $|\text{StudyPlan.targets}|$.
     *(Example: 20 normalized plan target patterns with 15 having StudentProgress records yields `targetPatternsWithMastery = 15` and a masteryDepth denominator of 20).*
   - DTO exposes: `targetPatternsWithMastery`, `averageMastery` (`roundTo(M_depth, 2)`).
   - Zero Phase 4 recalculation calls.

### Component 3: Eligible Mock Performance ($P_{\text{mock}}$, Base Weight $0.25$)
1. Filter mock sessions using Section 27 Mock-to-Goal Attribution.
2. If eligible mocks count is $0$: $P_{\text{mock}} = \text{null}$.
3. For each eligible mock $m$:
   - Read persisted percentage from `m.resultSummary.overall.percentage` ($0.0 \dots 100.0$).
   - Normalized score = $\text{percentage} / 100.0$.
4. Compute arithmetic mean across eligible mocks:
   $$P_{\text{mock}} = \frac{\sum_{m \in \text{Eligible}} (\text{m.resultSummary.overall.percentage} / 100.0)}{|\text{Eligible Mocks}|}$$

### Component 4: Eligible Mock Pacing ($S_{\text{pacing}}$, Base Weight $0.10$)
For each eligible mock $m$:
1. Compute allowed average seconds:
   $$\text{allowedAverageSeconds} = \frac{m.\text{durationMinutes} \times 60}{m.\text{totalQuestions}}$$
   Requires: $m.\text{durationMinutes} > 0$ and $m.\text{totalQuestions} > 0$.
2. Compute actual average time across answered questions:
   $$\text{actualAverageTime} = \frac{\sum \text{Attempt.timeTaken for answered mock questions}}{\text{answeredAttemptCount}}$$
   Requires: $\text{answeredAttemptCount} > 0$ and $\text{actualAverageTime} > 0$.
3. If any requirement fails: $\text{pacingEfficiency}(m) = \text{null}$.
4. Otherwise:
   $$\text{pacingEfficiency}(m) = \min\left(1.0, \frac{\text{allowedAverageSeconds}}{\text{actualAverageTime}}\right)$$
5. Across all eligible mocks:
   - Average valid non-null per-mock pacing efficiencies.
   - If no eligible mock has valid pacing evidence: $S_{\text{pacing}} = \text{null}$.

### Dynamic Weight Renormalization
Let $\mathcal{C}$ be the set of available components with non-null values.
1. **Mandatory Minimum Check**:
   If $\mathcal{C}$ does not contain BOTH `planTargetCoverage` and `masteryDepth`:
   $$\text{readinessScore} = \text{null}, \quad \text{readinessStatus} = \text{'insufficient_data'}$$
2. Otherwise, renormalize base weights $w_c$:
   $$\text{effectiveWeight}(c) = \text{roundTo}\left(\frac{w_c}{\sum_{k \in \mathcal{C}} w_k}, 4\right)$$
   $$\text{readinessScore} = \text{roundTo}\left(\sum_{c \in \mathcal{C}} \frac{w_c}{\sum_{k \in \mathcal{C}} w_k} \cdot \text{value}(c), 2\right)$$

### 26.5 Critical Prerequisite Bottlenecks Algorithm
The readiness DTO exposes deterministic prerequisite bottlenecks for the plan targets:
```json
"criticalPrerequisiteBottlenecks": [
  {
    "targetPattern": "Time and Work — Alternate Days Work",
    "unmasteredPrerequisite": "Time and Work — Basic Work Rates",
    "prerequisiteMastery": 0.42,
    "masteryLabel": "developing"
  }
]
```

#### Deterministic Discovery Algorithm
1. **Target Iteration**: For each successfully normalized target `(target.topic, target.pattern)` in `StudyPlan.targets[]`:
2. **Immediate Prerequisite Lookup**: Retrieve canonical immediate prerequisites using the established platform helper:
   ```javascript
   const prereqs = hierarchyService.getPrerequisites(target.pattern) || [];
   ```
   *(Immediate DAG edges only; no recursive traversal in V1).*
3. **Prerequisite Mastery Evaluation**: For each immediate prerequisite pattern $q \in \text{prereqs}$:
   - Query user's `StudentProgress` document for pattern $q$.
   - If `StudentProgress` exists:
     $$\text{prerequisiteMastery} = \text{StudentProgress.mastery}$$
   - If `StudentProgress` is missing:
     $$\text{prerequisiteMastery} = 0.0$$
4. **Bottleneck Qualification Condition**:
   A prerequisite is a critical bottleneck if and only if:
   $$\text{prerequisiteMastery} < \text{PREREQUISITE\_UNMET\_THRESHOLD} \quad (0.70)$$
   *(If raw $\text{prerequisiteMastery} \ge 0.70$, it is satisfied and strictly excluded).*
5. **Mastery Label Mapping**:
   Map `masteryLabel` using the frozen Phase 4 thresholds:
   - $\text{prerequisiteMastery} < 0.40 \implies \text{'weak'}$ (includes missing progress where mastery is 0.0)
   - $\text{prerequisiteMastery} < 0.70 \implies \text{'developing'}$
   - $\text{prerequisiteMastery} < 0.85 \implies \text{'proficient'}$
   - $\text{prerequisiteMastery} \ge 0.85 \implies \text{'mastered'}$
   *(Note: Since the bottleneck qualification threshold is $< 0.70$, qualifying bottlenecks will normally carry `weak` or `developing`).*
6. **Output Record Generation**:
   For each qualifying bottleneck pair, emit:
   ```javascript
   {
     targetPattern: target.pattern,
     unmasteredPrerequisite: q,
     prerequisiteMastery: roundTo(prerequisiteMastery, 2),
     masteryLabel
   }
   ```
   *(If the same prerequisite pattern blocks multiple targets, emit separate records for each `(targetPattern, unmasteredPrerequisite)` pair).*
7. **Deterministic Multi-Key Sorting**:
   Sort the resulting bottleneck array deterministically using raw unrounded values:
   1. `prerequisiteMastery` ascending (raw unrounded float)
   2. Target pattern canonical registry index ascending (`patternRegistryService` index)
   3. Prerequisite pattern canonical registry index ascending (`patternRegistryService` index)
   4. `targetPattern` lexical fallback (`localeCompare`)
   5. `unmasteredPrerequisite` lexical fallback (`localeCompare`)
8. **V1 Cardinality**:
   Return all qualifying bottleneck pairs for the normalized plan targets (no arbitrary top-N truncation in V1).
9. **Zero-Side-Effect Guarantee**:
   - Zero Phase 4 mastery recalculation.
   - Zero `StudentProgress` records created.
   - Zero LLM calls or heuristic text parsing.

---

## 27. Mock-to-Goal Attribution

A completed mock session contributes to a goal's readiness index **ONLY when its scope deterministically matches the goal's study plan targets**:

### 1. Plan Target Pattern Set
$$\text{PlanTargetPatterns} = \left\{ (T.\text{topic}, T.\text{pattern}) \mid T \in \text{StudyPlan.targets} \right\}$$

### 2. Mock Scope Pattern Set
Extract `MockScopePatterns` from `MockSession.blueprintSnapshot.sections[].scope`:
- **`allCanonicalPatterns: true`**: Expands to all 278 canonical `{ topic, pattern }` pairs.
- **`patterns` specified**: Resolves canonical `{ topic, pattern }` pairs for each pattern name via the Phase 2 registry.
- **`topics` specified (patterns empty)**: Expands each topic into all canonical patterns belonging to that topic via the Phase 2 registry.
- **Ambiguous / Malformed Scope**: If scope cannot be reconstructed deterministically, the mock is NOT eligible.

### 3. Eligibility Predicate
A mock session $m$ is eligible for goal readiness **if and only if**:
1. `m.userId === requestingUserId`
2. `m.status IN ['submitted', 'expired']`
3. `m.finalizationState === 'completed'`
4. `m.mode === 'standard'` *(diagnostic mocks are excluded from V1 goal readiness)*
5. `PlanTargetPatterns` is non-empty
6. `MockScopePatterns` is non-empty
7. $\text{MockScopePatterns} \subseteq \text{PlanTargetPatterns}$ *(every pattern in the mock scope belongs to the plan targets)*

If ANY condition fails, the mock is strictly excluded from goal readiness.

---

## 28. Topic Diagnostic Mastery & Radar

Phase 8 strictly decouples **internal topic diagnostic candidate state** from **serialized `topicMasteryRadar` membership**.

### 28.1 Internal Topic Diagnostic Candidate State Evaluation
For each canonical topic in the 24-topic registry (and candidate study plan topics):
1. Query all `StudentProgress` documents for the user belonging to that topic.
2. If no progress documents exist ($|\text{Progress}| = 0$):
   $$\text{rawDiagnosticMastery} = \text{null}, \quad \text{diagnosticMastery} = \text{null}, \quad \text{diagnosticLabel} = \text{null}$$
   $$\text{patternsWithEvidence} = 0, \quad \text{rawCoverageRatio} = 0.0, \quad \text{coverageRatio} = 0.0$$
3. Otherwise, compute raw unrounded floating-point metrics:
   $$\text{rawDiagnosticMastery} = \frac{\sum_{p \in \text{Progress}} p.\text{mastery}}{|\text{Progress}|}$$
   $$\text{patternsWithEvidence} = |\text{Progress}|$$
   $$\text{rawCoverageRatio} = \frac{\text{patternsWithEvidence}}{\text{canonicalPatternsInTopic}}$$
   where `canonicalPatternsInTopic` is the count from the Phase 2 registry (e.g. 14 for Algebra).

### 28.2 Diagnostic Label Mapping (Operates Strictly on Raw Value)
Diagnostic label thresholds operate strictly on `rawDiagnosticMastery` (NOT on presentation-rounded values):
- $\text{rawDiagnosticMastery} < 0.40 \implies \text{'weak'}$
- $\text{rawDiagnosticMastery} < 0.70 \implies \text{'developing'}$
- $\text{rawDiagnosticMastery} < 0.85 \implies \text{'proficient'}$
- $\text{rawDiagnosticMastery} \ge 0.85 \implies \text{'mastered'}$
- $\text{rawDiagnosticMastery} === \text{null} \implies \text{null}$ *(Never label null as weak!)*

*Boundary Classification Truth*:
- If $\text{rawDiagnosticMastery} = 0.396$: $\text{raw} < 0.40 \implies \text{diagnosticLabel} = \text{'weak'}$, even though DTO displays `diagnosticMastery = 0.40`.
- If $\text{rawDiagnosticMastery} = 0.699$: $\text{raw} < 0.70 \implies \text{diagnosticLabel} = \text{'developing'}$, even though DTO displays `diagnosticMastery = 0.70`.
- If $\text{rawDiagnosticMastery} = 0.849$: $\text{raw} < 0.85 \implies \text{diagnosticLabel} = \text{'proficient'}$, even though DTO displays `diagnosticMastery = 0.85`.
The displayed rounded number must NEVER change the analytical classification.

Only after labeling and priority ranking are finalized, serialize presentation values:
$$\text{diagnosticMastery} = \text{roundTo}(\text{rawDiagnosticMastery}, 2)$$
$$\text{coverageRatio} = \text{roundTo}(\text{rawCoverageRatio}, 2)$$

### 28.3 topicMasteryRadar Serialized Output Membership Contract
Phase 8 enforces strict evidence-based membership for `topicMasteryRadar`:
- **Evidence-Only Serialization**:
  `topicMasteryRadar` contains **ONLY canonical topics for which at least one `StudentProgress` document exists** for the requesting user (`patternsWithEvidence > 0`).
- **Cardinality Mapping**:
  - $0$ progress-bearing topics $\implies \text{topicMasteryRadar} = []$.
  - $1$ progress-bearing topic $\implies$ exactly $1$ radar entry.
  - $24$ progress-bearing topics $\implies$ exactly $24$ radar entries.
- **Unstarted Active Plan Topics**:
  - An active-plan topic with no `StudentProgress` records MAY appear in `priorityFocusTopics` (as an explicit target of the student's owned study plan).
  - An active-plan topic with no `StudentProgress` records **MUST NOT appear in `topicMasteryRadar`** until actual progress evidence exists.
- **Internal Diagnostic State vs. Serialized Radar Membership**:
  - **Internal Topic Diagnostic Candidate State**: Evaluated across candidate topics (including unstarted active-plan target topics where $\text{rawDiagnosticMastery} = \text{null}$, $\text{patternsWithEvidence} = 0$, $\text{rawCoverageRatio} = 0.0$) to enable priority focus ranking.
  - **Serialized `topicMasteryRadar` Membership**: Strictly filtered to evidence-bearing topics ($\text{patternsWithEvidence} > 0$). Phase 8 never serializes fabricated radar entries with zero evidence or null diagnostic mastery.

---

## 29. Priority Focus Topics Candidate Set & Ranking

### 29.1 Candidate Topic Set
To prevent unstarted topics from automatically populating focus lists for new students:

$$\text{CandidateTopics} = \left\{ \text{topic} \mid \text{topic} \in \text{activePlan.targets} \lor \text{StudentProgress exists for user on topic} \right\}$$

- **New User Case**: No active plan and no progress records $\implies \text{CandidateTopics} = \emptyset \implies \text{priorityFocusTopics} = []$.
- **Unstarted Plan Topic**: Topic present in active plan targets with 0 progress records:
  $$\text{rawDiagnosticMastery} = \text{null}, \quad \text{patternsWithEvidence} = 0, \quad \text{rawCoverageRatio} = 0.0$$
  *(Eligible because it is an explicit target in the student's owned plan).*
- **Topic-Only Plan Target**: A target containing only `topic` (without `pattern`) makes that topic eligible in `CandidateTopics`.

### 29.2 Unmet Prerequisite Count Algorithm
For each candidate topic:
1. Collect the pattern set $\mathcal{P}_{\text{rel}}$ relevant to the student:
   $$\mathcal{P}_{\text{rel}} = \{ p \in \text{topic} \mid p \in \text{activePlan.targets} \lor \text{StudentProgress exists for } p \}$$
2. For each pattern $p \in \mathcal{P}_{\text{rel}}$, look up its immediate prerequisites from the Phase 2 DAG.
3. Form the set of unique prerequisite patterns $\mathcal{U}_{\text{prereqs}}$.
4. For each prerequisite pattern $q \in \mathcal{U}_{\text{prereqs}}$:
   - Check user's `StudentProgress` for $q$.
   - If missing or `mastery < 0.70` (`PREREQUISITE_UNMET_THRESHOLD`): count as **unmet**.
5. Sum unmet prerequisites for that candidate topic.

### 29.3 Ranking Comparator (Operates on Raw Precision)
Sort `CandidateTopics` using the deterministic 4-tier comparator using RAW unrounded values:
1. **Lowest Raw Diagnostic Mastery First**: `rawDiagnosticMastery === null` ranks first, otherwise `rawDiagnosticMastery` ascending.
2. **Highest Unmet Prerequisite Count**: Descending integer count.
3. **Lowest Raw Coverage Ratio**: `rawCoverageRatio` ascending.
4. **Canonical Topic Registry Order**: The zero-based position of that canonical topic in the actual Phase 2 canonical registry:
   $$\text{topicRegistryIndex}(T) = \text{patternRegistryService.getAllTopics().indexOf}(T)$$
   - Registry order is derived directly from the canonical registry order ($0 \dots 23$).
   - **Prohibition**: DO NOT alphabetically sort topic names before deriving the index.
   - **Defensive Fallback**: DO NOT replace canonical registry order with `topic.localeCompare(...)` unless used only as a defensive fallback if the registry lookup unexpectedly returns `-1`. Under valid canonical data, every topic must already have a registry index.

*Crucial Invariant*: Sorting MUST NEVER use the presentation-rounded values (`diagnosticMastery` or `coverageRatio`). Sorting on rounded values can produce non-deterministic order flips.

Take at most **3 topics** (`PRIORITY_FOCUS_TOPICS_LIMIT`).

---

## 30. Active Plan Completion vs Readiness Target Coverage

Phase 8 explicitly distinguishes between two different plan metrics:

```text
┌───────────────────────────────────────┬───────────────────────────────────────┐
│       ACTIVE PLAN COMPLETION          │         PLAN TARGET COVERAGE          │
│   (Dashboard activePlanSummary)       │         (Goal Readiness Index)        │
├───────────────────────────────────────┼───────────────────────────────────────┤
│ Continuous question progress ratio    │ Binary target satisfaction ratio      │
│ across all scheduled daily work.      │ across defined study plan targets.    │
│                                       │                                       │
│ If totalTargetQuestions > 0:          │ planTargetCoverage =                  │
│   completionPercentage =              │ count(targetSatisfied) /              │
│   sum(completed) / sum(target) * 100  │ count(StudyPlan.targets)              │
│ Else:                                 │                                       │
│   completionPercentage = null         │                                       │
│                                       │                                       │
│ Bounded in [0.0, 100.0] (1 decimal)   │ Bounded in [0.0, 1.0] (2 decimals)    │
│ or null if zero workload              │ or null if zero targets               │
└───────────────────────────────────────┴───────────────────────────────────────┘
```
- **Zero-Denominator Safety**: When an active plan has zero scheduled daily question workload (`totalTargetQuestions === 0`), `completionPercentage = null`, `totalTargetQuestions = 0`, and `totalCompletedQuestions = 0`. The service MUST NOT divide by zero and MUST NOT fabricate `0.0%` completion.

---

## 31. Query Bounds & Rolling Window Semantics

### 31.1 Query Limits
- `MAX_ATTEMPTS_ANALYZED = 1000`: Bounded query cap on historical attempt scans.
- `MAX_WINDOW_DAYS = 90`: Maximum allowable rolling window for cognitive profiles.
- `DEFAULT_WINDOW_DAYS = 30`: Default window when omitted.

### 31.2 Request Reference Timestamp
At the start of each request, the controller captures:
```javascript
const referenceNow = new Date();
```
`referenceNow` is passed down to all services for that request. This prevents date boundary drift between queries executed within the same HTTP transaction.

### 31.3 Rolling Window
$$\text{attemptedAt} \ge \text{referenceNow} - (\text{windowDays} \times 86,400,000 \text{ ms})$$

---

## 32. Security & Ownership Matrix

1. **User Identity Scoping**: Every database query requires an indexed `{ userId }` filter. No student can query another student's attempts or progress.
2. **Goal Ownership Isolation**:
   - Query: `Goal.findById(goalId)`.
   - Missing $\implies 404$ `GOAL_NOT_FOUND`.
   - Mismatched `goal.userId !== requestingUserId` $\implies 403$ `FORBIDDEN`.
3. **Assessment Integrity Barrier**: Active mock responses are quarantined from historical analytics until finalization is terminal and verified.
4. **Finalization Concurrency Safety**: Returns `409 FINALIZATION_IN_PROGRESS` if a finalization lease is active.

---

## 33. Privacy & Ownership Scope

- Analytics queries are scoped to the requesting `userId` under the platform's existing identifier-ownership model.
- Phase 8 introduces no JWT/authentication/RBAC layer and does NOT redefine platform security infrastructure.
- Analytics endpoints return **aggregated student metrics only**.
- Endpoints never serialize passwords, password hashes, auth tokens, external credentials, or IP addresses.
- Analytical profiles are accessed strictly via the specified query parameter `userId`, matching Phase 1–7 controller conventions.
- For Goal Readiness (`GET /api/v1/analytics/readiness/:goalId`):
  - Look up goal via `Goal.findById(goalId)`.
  - Missing goal $\implies 404$ `GOAL_NOT_FOUND`.
  - Mismatch `goal.userId !== requestingUserId` $\implies 403$ `FORBIDDEN`.

---

## 34. Cross-Phase Read-Only Guarantees

Phase 8 executes with strict read-only guarantees over persistent platform data:

```javascript
// PROHIBITED on all persistent models in Phase 8:
Model.prototype.save
Model.create
Model.insertMany
Model.updateOne
Model.updateMany
Model.findOneAndUpdate
Model.findByIdAndUpdate
Model.deleteOne
Model.deleteMany
Model.bulkWrite
```

Phase 8 integration tests verify that collection document counts and SHA-256 fingerprints before and after analytics execution are identical.

---

## 35. Performance Constraints

1. **Query Index Alignment**:
   - `attemptSchema`: uses compound index `{ userId: 1, attemptedAt: -1 }` and `{ userId: 1, topic: 1, pattern: 1, attemptedAt: -1 }`.
   - `studentProgressSchema`: uses unique index `{ userId: 1, topic: 1, pattern: 1 }`.
   - `revisionItemSchema`: uses `{ userId: 1, status: 1, nextReviewDate: 1 }`.
   - `mockSessionSchema`: uses `{ userId: 1, status: 1, createdAt: -1 }`.
2. **Bounded Result Sets**: All attempt queries are capped at 1,000 documents via `.limit(1000)`.
3. **In-Memory Derivation**: Aggregations execute in memory using pure Node.js array operations.

---

## 36. Migration & Rollback Strategy

1. **Database Migration**: **ZERO database migrations**. Phase 8 adds 0 collections and 0 schema fields.
2. **Rollback Strategy**:
   - Remove Phase 8 routes, controllers, middleware, and services.
   - The platform immediately returns to the verified Phase 7 baseline.
   - Zero database cleanup or schema rollback required.

---

## 37. Test Matrix (8 New Test Suites)

Implementation requires implementing exactly 8 new test suites (~100 tests covering all boundary conditions):

### 1. `tests/analytics/analyticsGuard.test.js`
- [ ] Returns 409 `FINALIZATION_IN_PROGRESS` when finalizationState is `in_progress`.
- [ ] Allows analytics when finalizationState is `completed` or `idle`.
- [ ] Quarantines active mock sessions (`created`, `started`) from queries.
- [ ] Returns 404 `USER_NOT_FOUND` when user does not exist.
- [ ] Returns 404 `GOAL_NOT_FOUND` when goal does not exist.
- [ ] Returns 403 `FORBIDDEN` when goal belongs to another student.
- [ ] Rejects invalid `topic` query parameter on `/cognitive-profile` with 400 `INVALID_TOPIC` (non-canonical, blank string, array/repeated, object).
- [ ] Accepts valid canonical `topic` scalar string (trimmed) on `/cognitive-profile`.
- [ ] Normalizes `windowDays` on `/cognitive-profile`: accepts scalar integer strings `?windowDays=1`, `?windowDays=30`, `?windowDays=90`.
- [ ] Rejects invalid `windowDays`: `?windowDays=0`, `?windowDays=91`, `?windowDays=30.5`, `?windowDays=abc`, `?windowDays=`, and repeated/array parameters with 400 `INVALID_WINDOW_DAYS`.
- [ ] Explicit parameter test cases: `?windowDays=1 => 1`, `?windowDays=30 => 30`, `?windowDays=90 => 90`, `?windowDays=0 => reject`, `?windowDays=91 => reject`, `?windowDays=30.5 => reject`, `?windowDays=abc => reject`, `?windowDays= => reject`, repeated/array parameter => reject.

### 2. `tests/analytics/speedAccuracyMatrix.test.js`
- [ ] Correctly calculates odd-count median.
- [ ] Correctly calculates even-count median.
- [ ] Accurately tests median boundary (`timeTaken <= median` vs `> median`).
- [ ] Accurately tests 0.60 rushing boundary.
- [ ] Returns `insufficient_baseline` when correct attempts $< 3$.
- [ ] Correctly categorizes `accurateAndFast`, `accurateAndSlow`, `fastErrorRushing`, `slowErrorStruggling`.
- [ ] Returns `rushingRiskScore = null` when classified incorrect attempts $= 0$.
- [ ] Never labels an attempt as "mastered".
- [ ] When `topic` is omitted: all eligible attempts across all canonical topics are analyzed.
- [ ] When `topic` is supplied: speed-accuracy matrix strictly filters to `Attempt.topic === requestedTopic`.
- [ ] `analysisWindow.attemptsAnalyzed` reflects the filtered speed-analysis Attempt count.
- [ ] Computes overall aggregate medians `medianTimeCorrectSeconds` and `medianTimeIncorrectSeconds` across bounded attempts.
- [ ] Tests odd correct sample, even correct sample, odd incorrect sample, even incorrect sample.
- [ ] Tests empty correct subset (`medianTimeCorrectSeconds: null`) and empty incorrect subset (`medianTimeIncorrectSeconds: null`).
- [ ] Tests topic-filtered medians and 1000-attempt bounded history medians.
- [ ] Proves DTO medians are overall bounded attempt summaries, never averages of per-pattern medians or $T_{\text{median}}$.

### 3. `tests/analytics/staminaCurve.test.js`
- [ ] Uses terminal finalized mock sessions only (`submitted`, `expired`, `completed`).
- [ ] Excludes active, created, started, abandoned, and unfinalized mocks.
- [ ] Uses `MockSession.questionSequence` for sequence ordering.
- [ ] Reads correctness from immutable mock `Attempt` records.
- [ ] Treats unanswered questions as 0 correct without synthetic attempt creation.
- [ ] Balanced quartile partitioning for $N = 4, 5, 6, 7, 8$.
- [ ] Terminal finalized mock with $N < 4$ is non-partitionable and excluded from quartile aggregation.
- [ ] If no terminal finalized mocks exist, returns `staminaCurve: null` with `staminaReason: 'insufficient_terminal_mocks'`.
- [ ] If terminal finalized mocks exist but all have $N < 4$, returns `staminaCurve: null` with `staminaReason: 'insufficient_questions'`.
- [ ] Mixed-history aggregation: 2-question mock + 20-question mock -> only 20-question mock contributes (`mockSessionsAnalyzed = 1`, `totalQuestionsAnalyzed = 20`).
- [ ] Zero-baseline guard: returns `fatigueDropoffPercent: null` with `fatigueReason: 'zero_first_quartile_baseline'` when $Q_1$ accuracy is 0.0%.
- [ ] Correctly aggregates raw counts across multiple qualifying mock sessions ($N \ge 4$).
- [ ] Topic filter does NOT slice or filter mock `questionSequence`; stamina curve output is identical with or without the optional `topic` parameter.
- [ ] Changing `windowDays` changes speed-history eligibility but does not change `staminaCurve` when mock history is otherwise unchanged.

### 4. `tests/analytics/retentionAnalytics.test.js`
- [ ] Exposes current factual `RevisionItem` state without non-existent fields.
- [ ] Correctly computes UTC logical-day boundaries for `dueTodayCount` and `overdueCount`.
- [ ] Verifies `activeRevisionItems === sum(stageDistribution)` across scheduled items.
- [ ] Uses only `source = 'revision'` attempts as observations.
- [ ] Anchors against immediate preceding attempt across any learning source.
- [ ] Correctly resolves timestamp collisions via `{ attemptedAt: 1, _id: 1 }` lexicographic sorting.
- [ ] Boundary recovery: handles 1,001+ attempt history by recovering predecessor outside loaded 1,000 without incrementing attempts analyzed.
- [ ] Same-timestamp predecessor produces `gapDays = 0` and increments `excludedInvalidChronologyCount`.
- [ ] Excludes sub-0.5-day gaps with `excludedShortGapCount`.
- [ ] Verifies exact half-open non-overlapping bucket intervals.
- [ ] Returns only populated buckets plus transparent evidence counts.
- [ ] Retention accounting identity always holds: `revisionAttemptsAnalyzed === bucketedRevisionObservationCount + excludedNoPriorAttemptCount + excludedShortGapCount + excludedInvalidChronologyCount`.
- [ ] Recovered predecessor anchor does NOT increment `revisionAttemptsAnalyzed`.
- [ ] Recovered anchor moves observation from `excludedNoPriorAttemptCount` into a valid retention bucket.
- [ ] Sub-half-day gap ($0 < \text{gap} < 0.5\text{d}$) counted exactly once in `excludedShortGapCount`.
- [ ] Non-positive gap ($\text{gap} \le 0$) counted exactly once in `excludedInvalidChronologyCount`.
- [ ] Verifies example DTO arithmetic reconciles: $150 = 145 + 3 + 2 + 0$.
- [ ] Cross-endpoint consistency: `dashboard.dueRevisionCount === retention.currentState.dueTodayCount` for the same reference timestamp and database state.

### 5. `tests/analytics/readinessService.test.js`
- [ ] Evaluates owned `StudyPlan` targets using quotaSatisfied OR masterySatisfied without assuming target status fields.
- [ ] Demonstrates clear distinction between readiness `planTargetCoverage` and dashboard `completionPercentage`.
- [ ] Enforces mock eligibility: `MockScopePatterns ⊆ PlanTargetPatterns`.
- [ ] Proves unrelated mocks, foreign mocks, active mocks, unfinalized mocks, and diagnostic mocks are excluded from readiness.
- [ ] Zero-denominator pacing safety: zero duration, zero questions, or zero answered attempts return `pacingEfficiency = null`.
- [ ] Correctly renormalizes weights when mock performance or pacing is missing.
- [ ] Returns `readinessScore: null` and `readinessStatus: 'insufficient_data'` when plan coverage or mastery depth is missing.
- [ ] Proves readiness score is bounded in $[0.0, 1.0]$ and never labeled pass probability.
- [ ] StudyPlan target normalization: valid topic-only target returns `insufficient_data` with `reason: 'UNSUPPORTED_STUDY_PLAN_TARGET_SHAPE'`.
- [ ] StudyPlan target normalization: target with pattern not belonging to topic rejected with `UNSUPPORTED_STUDY_PLAN_TARGET_SHAPE`.
- [ ] canonical pattern + owning topic => true (`patternRegistryService.patternBelongsToTopic('Basic Percentage Calculation', 'Percentage') === true`).
- [ ] canonical pattern + wrong topic => false (`patternRegistryService.patternBelongsToTopic('Basic Percentage Calculation', 'Algebra') === false`).
- [ ] Phase 8 passes arguments in the same order already used by Phase 4/6 (`patternRegistryService.patternBelongsToTopic(target.pattern, target.topic)`).
- [ ] no Phase 2 registry code is modified.
- [ ] StudyPlan target normalization: missing/null `targetQuestions` sets `quotaAvailable = false`, never compares against `undefined`.
- [ ] StudyPlan target normalization: mastery-only target satisfies through the mastery branch.
- [ ] StudyPlan target normalization: null `targetMastery` uses `0.85` compatibility default.
- [ ] StudyPlan target normalization: invalid present `targetMastery` (e.g. `< 0.0`, `> 1.0`, non-numeric) returns `UNSUPPORTED_STUDY_PLAN_TARGET_SHAPE` without silent fallback.
- [ ] StudyPlan target normalization: malformed target is never silently skipped or dropped.
- [ ] `targetPatternsWithMastery` counts only normalized targets where an actual `StudentProgress` document exists (e.g. 20 targets, 15 with progress => `targetPatternsWithMastery = 15`, `masteryDepth` denominator = 20).
- [ ] `criticalPrerequisiteBottlenecks`: missing progress => mastery 0.0, label `weak`.
- [ ] `criticalPrerequisiteBottlenecks`: mastery 0.699 => included, label `developing`.
- [ ] `criticalPrerequisiteBottlenecks`: mastery 0.70 => excluded.
- [ ] `criticalPrerequisiteBottlenecks`: same prerequisite blocking two targets => two target-prerequisite pairs.
- [ ] `criticalPrerequisiteBottlenecks`: deterministic multi-key ordering (mastery asc, target index asc, prereq index asc, lexical fallbacks).
- [ ] `criticalPrerequisiteBottlenecks`: immediate prerequisites only from `hierarchyService.getPrerequisites`, no recursive expansion in V1.
- [ ] `criticalPrerequisiteBottlenecks`: zero database writes, zero StudentProgress records created, zero Phase 4 recalculation calls.
- [ ] Precision: rounding cannot alter readiness inputs or intermediate component weights.

### 6. `tests/analytics/dashboardAggregateService.test.js`
- [ ] Deterministic active plan resolution: selects latest `startDate` with `_id` ascending tie-breaker.
- [ ] Excludes non-active study plans (`planned`, `completed`, `paused`, `cancelled`) from dashboard active plan summary.
- [ ] Computes `totalPracticeAttempts` and `overallAccuracy` strictly from bounded non-mock attempts (`practice`, `daily_plan`, `adaptive`, `revision`).
- [ ] Computes `totalMocksCompleted` strictly from terminal, finalized mock sessions.
- [ ] Candidate topic set: new user with no plan and no progress returns `priorityFocusTopics: []`.
- [ ] Plan with unstarted topic: topic is eligible with `rawDiagnosticMastery: null`.
- [ ] Topic-only plan target: topic is eligible as focus candidate in `CandidateTopics`.
- [ ] Progress-only topic: eligible as focus candidate.
- [ ] Unrelated canonical topics: excluded from focus list.
- [ ] Topic registry order: uses actual Phase 2 canonical registry order (`patternRegistryService.getAllTopics().indexOf(topic)`), NOT alphabetical sort.
- [ ] Test with two canonical topics whose registry order differs from alphabetical order proves registry position wins.
- [ ] Priority focus ranking comparator sorts using unrounded `rawDiagnosticMastery` and `rawCoverageRatio`.
- [ ] Computes `topicDiagnosticMastery` as arithmetic mean of pattern masteries.
- [ ] Diagnostic label uses `rawDiagnosticMastery`: raw 0.396 remains `weak` even though DTO displays `0.40`.
- [ ] Diagnostic label uses `rawDiagnosticMastery`: raw 0.699 remains `developing` even though DTO displays `0.70`.
- [ ] Diagnostic label uses `rawDiagnosticMastery`: raw 0.849 remains `proficient` even though DTO displays `0.85`.
- [ ] `topicMasteryRadar` membership: serialized radar contains ONLY canonical topics with $\ge 1$ `StudentProgress` document.
- [ ] `topicMasteryRadar` membership: new user with 0 progress returns `topicMasteryRadar = []`.
- [ ] `topicMasteryRadar` membership: 1 progress topic => 1 radar entry; 24 progress topics => 24 radar entries.
- [ ] `topicMasteryRadar` membership: unstarted plan topic appears in `priorityFocusTopics` but is excluded from `topicMasteryRadar`.
- [ ] Computes plan completion percentage strictly from `DailyObjective.patterns`.
- [ ] Active plan completion zero-denominator safety: `totalTargetQuestions > 0` => `completionPercentage = min(100, completed / target * 100)` (1 decimal); `totalTargetQuestions === 0` => `completionPercentage = null`, `totalTargetQuestions = 0`, `totalCompletedQuestions = 0` (never divide by zero, never fabricate 0.0%).
- [ ] Dashboard `dueRevisionCount` strictly equals `retention.currentState.dueTodayCount` and excludes overdue items.

### 7. `tests/analytics/analyticsApiIntegration.test.js`
- [ ] Supertest integration covering all 4 endpoints across diverse student histories.
- [ ] Verifies `algorithmVersion: 'v1'` in all payloads.
- [ ] Verifies normal, partial, and insufficient-data response shapes.
- [ ] Verifies validation error responses on invalid parameters (including invalid `topic` and invalid `windowDays`).
- [ ] Verifies numeric presentation policy (exact decimal places per field category).
- [ ] Verifies `staminaCurve` is identical with/without `?topic=` query parameter.
- [ ] Verifies `staminaCurve` is identical with different `?windowDays=` values.
- [ ] Verifies `attemptsAnalyzed` reflects topic-filtered non-mock attempt count.
- [ ] Cross-endpoint consistency test: `dashboard.dueRevisionCount === retention.currentState.dueTodayCount`.

### 8. `tests/analytics/phase8CrossPhaseIsolation.test.js`
- [ ] Proves Phase 8 creates strictly 0 database writes.
- [ ] Proves Mongoose model count remains exactly 13.
- [ ] Proves Phase 8 never calls `calculatePatternMastery` or mutates `StudentProgress`.

---

## 38. Baseline Verification

The pre-Phase-8 baseline is fully verified and green:

```text
================================================================================
                           FROZEN BASELINE VERIFICATION
================================================================================
Test Suites:             51 passed, 51 total
Tests:                   674 passed, 674 total
Snapshots:               0 total
Failures:                0
Time:                    354.755 s

Canonical Questions:     12,000 / 12,000 SHA-256 fingerprint matches
Canonical Topics:        24
Canonical Patterns:      278
Legacy Mappings:         308
Patterns w/ Prereqs:     218
Foundational Patterns:   60
Prerequisite Edges:      410
Prerequisite Cycles:     0
Mismatches / Missing:    0 / 0

Persistent Models:       Exactly 13 Mongoose models
MongoDB Collections:     Exactly 13 collections
================================================================================
```

---

## 39. Implementation Readiness Checklist

```text
[x] patternBelongsToTopic uses the actual existing argument order (pattern, topic)
[x] no new registry helper was invented
[x] focus-topic final tie-break uses actual canonical registry index, not alphabetical sort
[x] windowDays HTTP normalization is executable (scalar string parsing to integer in [1, 90], rejects arrays/floats/blanks)
[x] topicMasteryRadar membership is unambiguous (only topics with >=1 StudentProgress document serialized)
[x] new user radar returns []
[x] unstarted plan topic can be a focus topic without becoming fabricated radar evidence
[x] dueRevisionCount has one exact meaning (scheduled items with nextReviewDate in [todayStartUtc, tomorrowStartUtc))
[x] dashboard dueRevisionCount agrees with retention dueTodayCount
[x] active-plan completion cannot divide by zero (totalTargetQuestions === 0 => completionPercentage: null)
[x] aggregate correct/incorrect median fields have exact definitions (medianTimeCorrectSeconds, medianTimeIncorrectSeconds over bounded attempts)
[x] windowDays stamina scope is explicit (applies only to speed matrix, stamina evaluates whole terminal mock history)
[x] mixed small/full mock stamina behavior is deterministic (terminal mocks with N < 4 excluded from quartile aggregation)
[x] criticalPrerequisiteBottlenecks has an executable deterministic algorithm (immediate prereqs, threshold < 0.70, deterministic sort)
[x] targetPatternsWithMastery has one meaning (count of normalized targets with actual StudentProgress document)
[x] no ghost mocksWithPacingEvidence field remains
[x] every model-valid StudyPlan target shape has explicit Phase 8 handling
[x] no readiness formula compares against undefined targetQuestions
[x] no undefined pattern enters PlanTargetPatterns
[x] unsupported topic-only readiness target produces deterministic insufficient_data
[x] cognitive-profile topic filter semantics are frozen
[x] topic filter affects speed-accuracy exactly as specified
[x] stamina topic behavior is frozen and cannot be implemented two different ways
[x] attemptsAnalyzed semantics under topic filtering are explicit
[x] all internal math remains unrounded
[x] diagnostic labels use raw mastery
[x] focus ranking uses raw mastery and raw coverage
[x] roundTo is presentation-only
[x] revisionAttemptsAnalyzed has one exact meaning
[x] retention accounting identity is frozen
[x] retention DTO example arithmetic reconciles
[x] privacy text does not imply new authentication
[x] Goal type enum exactly matches Phase 3 (company, government, entrance, competitive, master, custom)
[x] Goal status enum exactly matches Phase 3 (planned, active, completed, paused, cancelled)
[x] active dashboard plan resolution is deterministic (startDate: -1, _id: 1)
[x] multiple-active-plan tie-break frozen
[x] goal readiness plan selection frozen (userId + goalId scoped, status active required)
[x] dashboard Attempt source set frozen (practice, daily_plan, adaptive, revision)
[x] totalPracticeAttempts meaning frozen (all non-mock learning attempts up to MAX_ATTEMPTS_ANALYZED)
[x] attemptsAnalyzed meaning frozen (actual count of returned bounded attempts)
[x] overallAccuracy denominator frozen (attemptsAnalyzed, null if 0)
[x] completed-mock count frozen (submitted/expired and completed finalizationState)
[x] retention MAX_ATTEMPTS_ANALYZED behavior is executable
[x] boundary predecessor outside the 1000-record window can be recovered
[x] same-timestamp predecessor ordering is mathematically consistent (lexicographical attemptedAt, _id)
[x] invalid chronology count behavior frozen (gapDays <= 0 increments excludedInvalidChronologyCount)
[x] activeRevisionItems definition frozen (scheduled status only)
[x] completedRevisionItems definition frozen (completed status only)
[x] dueTodayCount exact UTC range frozen ([todayStartUtc, tomorrowStartUtc))
[x] overdueCount exact UTC rule frozen (< todayStartUtc)
[x] stageDistribution population frozen (scheduled items only, sum equals activeRevisionItems)
[x] one exact numeric presentation policy exists (no "1 or 2 decimal places" ambiguity)
[x] every checklist claim has a normative implementation section
[x] actual AppError constructor convention verified (statusCode, code, message)
[x] actual API response helper/convention verified (sendSuccess / sendError)
[x] exactly four endpoints remain
[x] Phase 8 remains fully read-only (zero writes)
[x] zero new collections
[x] exactly 13 models
[x] zero dependencies
[x] no Phase 1–7 changes
[x] baseline remains 51 suites / 674 tests
[x] Phase 2 verification passes
[x] all 12,000 fingerprints match
[x] zero Phase 8 production files exist
```

---

```text
================================================================================
                         PHASE 8 DESIGN — VERIFIED
                      READY TO BEGIN IMPLEMENTATION
================================================================================
```
