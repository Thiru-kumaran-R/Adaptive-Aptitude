# PHASE 9 SPECIFICATION: PRESCRIPTIVE LEARNING ORCHESTRATION & NEXT-BEST-ACTION (NBA) ENGINE

```text
Document Type:       Authoritative Implementation Specification (Frozen Contract)
Status:              VERIFIED ARCHITECTURE IMPLEMENTATION CONTRACT
Target Phase:        Phase 9
Repository:          adaptive-aptitude-api
Frozen Baseline:     Phases 1–8 Verified (59 Suites, 763 Tests, Exactly 13 Models)
Persistence Boundary: Read-Only In-Memory Policy Layer (0 Writes, 0 Models, 0 Collections)
```

---

## 1. Status & Scope

This document is the **single authoritative implementation specification** for **Phase 9: Prescriptive Learning Orchestration & Next-Best-Action (NBA) Engine**.

### 1.1 Scope of Phase 9
Phase 9 bridges the platform's diagnostic intelligence (Phase 8), macro study schedules (Phase 5), micro-adaptive question delivery (Phase 4), and summative assessments (Phase 6) into deterministic, actionable learning directives. It provides:
1. **Real-Time Next-Best-Action (NBA) Arbitration**: Identifies the single most urgent, pedagogically sound activity a student should undertake at any instant.
2. **Daily Learning Agenda Assembly**: Synthesizes a structured daily learning journey broken into operational segments (`WARMUP_RETRIEVAL` $\to$ `PREREQUISITE_UNBLOCKING` $\to$ `CORE_CURRICULUM` $\to$ `PACING_OR_BENCHMARK`), strictly bounded by daily question budgets and stamina constraints.
3. **Cognitive Intervention Formulations**: Formulates targeted remediation alerts for diagnosed learning friction (critical prerequisite bottlenecks, overall rushing tendencies).
4. **Structured Execution Intent**: Emits unambiguous execution instructions via an authoritative discriminated union that decouples prescriptive arbitration from domain execution, providing route targets only for verified existing upstream endpoints.

### 1.2 Prohibitions & Out-of-Scope Activities
During Phase 9 design and implementation:
- **0 Database Writes**: Phase 9 code must never invoke write operations (`save`, `create`, `insertMany`, `updateOne`, `updateMany`, `findOneAndUpdate`, `findByIdAndUpdate`, `deleteOne`, `deleteMany`, `bulkWrite`) on any MongoDB collection.
- **0 New Mongoose Models**: The platform model count remains strictly **13**.
- **0 New MongoDB Collections**: Zero collection schemas or indexes added.
- **0 Phase 7 / LLM Invocations**: Phase 9 contains zero calls, imports, or dependencies on Gemini, LLM providers, prompt compilers, or Phase 7 controllers.
- **0 Upstream Engine Mutations**: Phase 9 does not recalculate mastery (Phase 4), replan schedules or transition revision items (Phase 5), assemble or score mocks (Phase 6), or modify analytics algorithms (Phase 8).

---

## 2. Frozen Platform Baseline

Phase 9 builds directly upon the verified and frozen platform state:

```text
Test Suites:            59 / 59 passed
Tests:                  763 / 763 passed
Failures:               0
Canonical Questions:    12,000 (100% SHA-256 fingerprint verified)
Canonical Topics:       24 (in frozen registry order)
Canonical Patterns:     278 (globally unique names, 0 collisions)
Legacy Mappings:        308 (100% resolved to canonical topic and pattern)
Prerequisite DAG:       218 patterns with prerequisites, 60 foundational patterns,
                        410 directed edges, 0 self-references, 0 invalid refs, 0 cycles
Mongoose Models:        Exactly 13 models registered across Phases 1–8
```

### Authoritative Model Inventory (Count: 13)
1. `Question` (`src/models/questionModel.js`) — Phase 2
2. `User` (`src/models/userModel.js`) — Phase 3
3. `Goal` (`src/models/goalModel.js`) — Phase 3
4. `StudyPlan` (`src/models/studyPlanModel.js`) — Phase 3
5. `DailyObjective` (`src/models/dailyObjectiveModel.js`) — Phase 3
6. `Attempt` (`src/models/attemptModel.js`) — Phase 3
7. `StudentProgress` (`src/models/studentProgressModel.js`) — Phase 3
8. `RevisionItem` (`src/models/revisionItemModel.js`) — Phase 5
9. `RevisionProcessingRecord` (`src/models/revisionProcessingRecordModel.js`) — Phase 5
10. `MockBlueprint` (`src/models/mockBlueprintModel.js`) — Phase 6
11. `MockSession` (`src/models/mockSessionModel.js`) — Phase 6
12. `MockResponse` (`src/models/mockResponseModel.js`) — Phase 6
13. `MockAttemptFinalizationRecord` (`src/models/mockAttemptFinalizationRecordModel.js`) — Phase 6

Phase 9 introduces **zero** new models. Model count remains strictly 13.

---

## 3. Phase 9 Primary Invariant

```text
Phase 9 is a deterministic, read-only, in-memory orchestration policy layer.
It decides WHAT the student should do next.
It does NOT perform domain execution.
```

### Formal Invariants:
1. **Read-Only Purity**: All operations are read-only (`find`, `findOne`, `findById`, `exists`, `lean`). Zero state is persisted or mutated by Phase 9 endpoints or services.
2. **Deterministic Reproducibility**: Given the same database state and request-level clock (`referenceNow`), all arbitration, agenda assembly, allocation, and intervention routines return bitwise identical DTO payloads.
3. **Execution Separation**: Phase 9 prescribes actions and returns metadata detailing what existing endpoint should be called. Phase 9 does not execute the learning action itself.
4. **Budget Conservation**: The sum of all question allocations across all daily agenda activities never exceeds the computed `dailyQuestionBudget`.
5. **Fail-Safe Degradation**: Missing progress, plans, or goals result in deterministic fallback actions (`DIAGNOSTIC_ASSESSMENT`), never unhandled exceptions or 500 crashes.

---

## 4. Ownership Boundaries & Layer Responsibilities

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              PHASE 9 ORCHESTRATION LAYER                                │
│  - GET /api/v1/orchestration/next-action                                               │
│  - GET /api/v1/orchestration/daily-agenda                                              │
│  - GET /api/v1/orchestration/interventions                                             │
└────────────────────────────────────────────────────────────────────────────────────────┘
          │                                 │                                 │
          ▼ (reads diagnostics)             ▼ (reads plan & debt)             ▼ (reads progress)
┌──────────────────────────┐      ┌──────────────────────────┐      ┌──────────────────────────┐
│   Phase 8: Analytics     │      │     Phase 5: Planning    │      │  Phase 3/4: Progress     │
│ - readinessService       │      │ - StudyPlan (active)     │      │ - StudentProgress (read) │
│ - speedAccuracyMatrix    │      │ - DailyObjective (today) │      │ - Question registry      │
│ - staminaAnalytics       │      │ - RevisionItem (due)     │      │ - Hierarchy DAG          │
│ - retentionAnalytics     │      │                          │      │                          │
└──────────────────────────┘      └──────────────────────────┘      └──────────────────────────┘
```

### Boundary Table:
| Platform Layer | Authoritative Owner | Phase 9 Relationship |
| :--- | :--- | :--- |
| **Question Bank & Hierarchy** | Phase 2 (`Question`, registry, hierarchy) | Read-only consumer. Queries pattern indices, slugs, prerequisites. |
| **Student History & Progress** | Phase 3 (`User`, `Attempt`, `StudentProgress`) | Read-only consumer. Reads stored mastery, attempts, and streaks. |
| **Micro Question Selection** | Phase 4 (`adaptiveEngine`, `masteryService`) | Prescription target. Emits execution intent pointing to `GET /api/v1/adaptive/next-question`. |
| **Macro Planning & Scheduling** | Phase 5 (`studyPlanService`, `revisionScheduler`) | Read-only consumer. Reads active plans, daily objectives, and scheduled revision items. |
| **Summative Assessment** | Phase 6 (`mockSessionService`, `mockBlueprint`) | Prescription target. Checks for active mocks; prescribes benchmark intents. |
| **Pedagogical LLM Layer** | Phase 7 (`learningController`, prompts) | **Total isolation**. Zero calls or imports in Phase 9. |
| **Cognitive Diagnostics** | Phase 8 (`readinessService`, `staminaAnalytics`, etc.) | Read-only consumer. Reuses diagnostic outputs; does not re-implement formulas. |

---

## 5. Existing Source Contract Audit

Before formalizing Phase 9 contracts, all upstream repository files have been inspected and verified:

### 5.1 Models & Field Types
- **`User`** (`src/models/userModel.js`):
  - `userId`: String (required, unique, trimmed).
- **`Goal`** (`src/models/goalModel.js`):
  - `userId`: String (required, trimmed).
  - `status`: String enum `['planned', 'active', 'completed', 'paused', 'cancelled']`.
  - `targetDate`: Date (optional).
  - `priority`: Number (1–5).
- **`StudyPlan`** (`src/models/studyPlanModel.js`):
  - `userId`: String, `goalId`: ObjectId.
  - `status`: String enum `['planned', 'active', 'completed', 'paused', 'cancelled']`.
  - `startDate`: Date, `endDate`: Date.
  - `targets`: Array of `{ topic: String, pattern: String, targetQuestions: Number, targetMastery: Number }`.
- **`DailyObjective`** (`src/models/dailyObjectiveModel.js`):
  - `userId`: String, `planId`: ObjectId, `goalId`: ObjectId.
  - `date`: Date (normalized to midnight UTC).
  - `topic`: String.
  - `patterns`: Array of `{ pattern: String, targetQuestions: Number, completedQuestions: Number, targetDifficulty: Number }`.
  - `status`: String enum `['pending', 'in_progress', 'completed', 'skipped']`.
  - Compound unique index: `{ userId: 1, planId: 1, date: 1 }`.
- **`RevisionItem`** (`src/models/revisionItemModel.js`):
  - `userId`: String, `topic`: String, `pattern`: String.
  - `stage`: Number (0–4), `intervalDays`: Number.
  - `nextReviewDate`: Date (required, normalized UTC).
  - `status`: String enum `['scheduled', 'completed', 'paused']`.
  - Compound unique index: `{ userId: 1, topic: 1, pattern: 1 }`.
  - Supporting index: `{ userId: 1, status: 1, nextReviewDate: 1 }`.
- **`StudentProgress`** (`src/models/studentProgressModel.js`):
  - `userId`: String, `topic`: String, `pattern`: String.
  - `mastery`: Number (0.0 to 1.0, default 0.0).
  - `attempts`: Number, `correct`: Number, `incorrect`: Number.
  - Compound unique index: `{ userId: 1, topic: 1, pattern: 1 }`.
- **`MockSession`** (`src/models/mockSessionModel.js`):
  - `userId`: String, `status`: String enum `['created', 'started', 'submitted', 'expired', 'abandoned']`.
  - `finalizationState`: String enum `['idle', 'in_progress', 'completed', 'failed']`.
  - `questionSequence`: Array of `{ questionId, sectionId, order, topic, pattern, difficulty }`.
- **`Attempt`** (`src/models/attemptModel.js`):
  - `userId`: String, `questionId`: ObjectId, `isCorrect`: Boolean, `timeTaken`: Number.
  - `source`: String enum `['practice', 'daily_plan', 'adaptive', 'revision', 'mock']`.
  - `sessionId`: String (optional).

### 5.2 Upstream Service Functions
- **`patternRegistryService`** (`src/services/patternRegistryService.js`):
  - `getAllTopics()`: returns ordered array of 24 canonical topic strings.
  - `getAllCanonicalPatterns()`: returns array of `{ topic, pattern }` in canonical order.
  - `getPatternRegistryIndex(patternName)`: returns 0-based integer index (0..277) or 999999.
  - `getTopicForPattern(patternName)`: returns canonical topic name string.
  - `topicExists(topic)`: boolean.
  - `patternExists(pattern)`: boolean.
  - `patternBelongsToTopic(pattern, topic)`: boolean.
  - `buildSlug(name)`: deterministic URL-safe slug generator.
- **`hierarchyService`** (`src/services/hierarchyService.js`):
  - `getPrerequisites(patternName)`: returns `string[]` of prerequisite pattern names or `[]` for foundational patterns.
- **`readinessService`** (`src/services/analytics/readinessService.js`):
  - `getGoalReadiness(userId, goalId, referenceNow)`: returns `{ readinessStatus, readinessScore, components: { eligibleMockPerformance: { eligibleMocksCount } }, criticalPrerequisiteBottlenecks }`.
- **`speedAccuracyMatrixService`** (`src/services/analytics/speedAccuracyMatrixService.js`):
  - `getSpeedAccuracyMatrix(userId, windowDays, topic, referenceNow)`: returns `{ analysisWindow: { windowDays, attemptsAnalyzed }, speedAccuracyMatrix: { quadrantCounts, insufficientBaselineCount, rushingRiskScore, medianTimeCorrectSeconds, medianTimeIncorrectSeconds } }`.
- **`staminaAnalyticsService`** (`src/services/analytics/staminaAnalyticsService.js`):
  - `getStaminaCurve(userId)`: returns `{ staminaCurve: { mockSessionsAnalyzed, totalQuestionsAnalyzed, fatigueDropoffPercent }, staminaReason }`.
- **`retentionAnalyticsService`** (`src/services/analytics/retentionAnalyticsService.js`):
  - `getRetentionAnalytics(userId, referenceNow)`: returns spaced retention decay metrics and accounting identities.
- **`analyticsMathUtils`** (`src/services/analytics/analyticsMathUtils.js`):
  - `getLogicalDayBoundaries(referenceNow)`: returns `{ todayStartUtc, tomorrowStartUtc }`.
  - `roundTo(val, decimals)`: deterministic rounding helper.
- **`AppError`** (`src/utils/AppError.js`):
  - `new AppError(statusCode, code, message)`: standard platform error class.
- **`apiResponse`** (`src/utils/apiResponse.js`):
  - `sendSuccess(res, data, meta, statusCode)`: standard success envelope `{ success: true, data, meta }`.
  - `sendError(res, code, message, statusCode)`: standard error envelope `{ success: false, error: { code, message } }`.

---

## 6. API Surface

Phase 9 exposes **exactly three HTTP GET endpoints** mounted at `/api/v1/orchestration`:

```text
GET /api/v1/orchestration/next-action
GET /api/v1/orchestration/daily-agenda
GET /api/v1/orchestration/interventions
```

There is **no fourth endpoint**. There are **no POST, PUT, PATCH, or DELETE endpoints** in Phase 9.

### Endpoint Matrix:
| Endpoint | Method | Query Parameters | Primary Response Key | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `/api/v1/orchestration/next-action` | `GET` | `userId` (req), `goalId` (opt) | `data.nextAction` | Returns the single highest-priority learning activity, fallback action, or null if active mock / no action. |
| `/api/v1/orchestration/daily-agenda` | `GET` | `userId` (req), `goalId` (opt) | `data.agenda` | Returns the structured, budgeted sequence of activities for today. |
| `/api/v1/orchestration/interventions` | `GET` | `userId` (req), `goalId` (opt) | `data.interventions` | Returns active diagnostic friction alerts (bottlenecks, rushing). |

---

## 7. Request Validation & Normalization

All Phase 9 endpoints apply identical request validation rules:

### 7.1 `userId` Parameter (Required)
- Must be provided as a query parameter: `?userId=...`.
- Must be a scalar string (reject arrays or objects).
- Must be trimmed: `userId = req.query.userId.trim()`.
- If missing, non-string, or empty after trimming:
  - Return **`400 VALIDATION_ERROR`** (`"userId query parameter is required and must be a non-empty string."`).
- If user does not exist in `User` collection:
  - Check via `User.exists({ userId })` or `User.findOne({ userId })`.
  - If null, return **`404 USER_NOT_FOUND`** (`"User \"<userId>\" not found."`).

### 7.2 `goalId` Parameter (Optional)
- May be omitted: `req.query.goalId === undefined`.
- If provided:
  - Must be a single scalar string: `typeof goalId === 'string'`.
  - Must be a valid 24-character hexadecimal MongoDB ObjectId: `/^[0-9a-fA-F]{24}$/.test(goalId)`.
  - If invalid syntax: return **`400 VALIDATION_ERROR`** (`"Invalid goalId format. Must be a 24-character hexadecimal string."`).
  - Retrieve goal: `const goal = await Goal.findById(goalId).lean()`.
  - If not found: return **`404 GOAL_NOT_FOUND`** (`"Goal \"<goalId>\" not found."`).
  - **Ownership Verification**: Check `goal.userId === userId`.
    - If mismatch: return **`403 FORBIDDEN`** (`"Access denied: Goal does not belong to user \"<userId>\"."`).
    - **Crucial**: Do NOT collapse 403 into 404. Ownership mismatch must return 403.

---

## 8. Dedicated Orchestration Guard

Phase 9 defines and owns its own dedicated Express middleware:

```text
src/middlewares/orchestrationGuard.js
```

Phase 9 **must NOT import or reuse** Phase 8's `analyticsGuard`.

### Guard Responsibilities & Execution Order:
1. **Clock Initialization**:
   ```javascript
   const referenceNow = req.referenceNow || new Date();
   ```
   Captures exactly one timestamp for the entire request lifecycle.
2. **`userId` Validation & Existence Check**:
   Validates format and verifies existence in `User` collection.
3. **Optional `goalId` Resolution & Ownership Check**:
   Validates syntax, loads Goal, and strictly verifies `goal.userId === userId`.
4. **Finalization Lockout Barrier**:
   Checks whether the user has any mock session currently undergoing distributed finalization:
   ```javascript
   const activeFinalization = await MockSession.findOne({
     userId,
     finalizationState: 'in_progress',
   }).lean();
   if (activeFinalization) {
     return next(new AppError(409, 'FINALIZATION_IN_PROGRESS',
       'A mock session finalization is currently in progress. Orchestration queries are locked until finalization completes.'));
   }
   ```
5. **Context Attachment**:
   Attaches the validated context to `req.orchestrationContext`:
   ```javascript
   req.orchestrationContext = {
     userId,
     goal: resolvedGoal || null,
     goalId: resolvedGoal ? String(resolvedGoal._id) : null,
     explicitGoalProvided: Boolean(resolvedGoal),
     referenceNow,
   };
   next();
   ```

---

## 9. Request-Level Clock

All date, time, and temporal calculations across all Phase 9 services and downstream analytical calls must consume the single request-level clock:

```javascript
const referenceNow = req.orchestrationContext.referenceNow;
```

### Downstream Usages of `referenceNow`:
- Deriving logical UTC day boundaries:
  ```javascript
  const { todayStartUtc, tomorrowStartUtc } = getLogicalDayBoundaries(referenceNow);
  ```
- Goal deadline arithmetic: `daysToDeadline = Math.max(0, Math.floor((goal.targetDate.getTime() - referenceNow.getTime()) / 86400000))`.
- Scheduled revision classification: `nextReviewDate < todayStartUtc` vs `todayStartUtc <= nextReviewDate < tomorrowStartUtc`.
- DailyObjective lookup: matching `date` in `[todayStartUtc, tomorrowStartUtc)`.
- Passing to Phase 8 service calls:
  - `readinessService.getGoalReadiness(userId, goalId, referenceNow)`
  - `speedAccuracyMatrixService.getSpeedAccuracyMatrix(userId, 30, null, referenceNow)`
  - `retentionAnalyticsService.getRetentionAnalytics(userId, referenceNow)`

No Phase 9 service may call `new Date()` internally during request evaluation.

---

## 10. Active Mock Prescription Safety

Before generating action candidates or assembling agendas, Phase 9 checks for an active, unfinalized mock test:

```javascript
const activeMock = await MockSession.findOne({
  userId,
  status: { $in: ['created', 'started'] },
}).lean();
```

### Endpoint Behavior when Active Mock Exists:

#### 1. `GET /api/v1/orchestration/next-action`:
Prescribes zero new learning activities to prevent cognitive splintering during exam simulation:
```json
{
  "success": true,
  "data": {
    "status": "active_mock_in_progress",
    "reason": "ACTIVE_MOCK_SESSION_EXISTS",
    "activeMockSessionId": "65b...",
    "nextAction": null
  },
  "meta": {
    "referenceNow": "2026-10-06T18:00:00.000Z"
  }
}
```

#### 2. `GET /api/v1/orchestration/daily-agenda`:
Returns an empty agenda contract with disabled execution:
```json
{
  "success": true,
  "data": {
    "status": "active_mock_in_progress",
    "reason": "ACTIVE_MOCK_SESSION_EXISTS",
    "activeMockSessionId": "65b...",
    "agenda": {
      "dailyQuestionBudget": 0,
      "totalPrescribedQuestions": 0,
      "totalEstimatedMinutes": 0,
      "segments": []
    }
  },
  "meta": {
    "referenceNow": "2026-10-06T18:00:00.000Z"
  }
}
```

#### 3. `GET /api/v1/orchestration/interventions`:
Diagnostic interventions **remain fully observable** even during an active mock (`status: 'calculated'`), as diagnostic states are passive and do not prescribe interactive study tasks.

---

## 11. Action Taxonomy & Subtypes

Phase 9 defines **exactly six canonical action types** and **eight action subtypes**:

```text
Action Type                 Action Subtype                 Description
───────────────────────────────────────────────────────────────────────────────────────────
PREREQUISITE_REMEDIATION    BLOCKING_PREREQUISITE          Remediates an unmastered prerequisite
                                                           that directly blocks a curriculum pattern.
───────────────────────────────────────────────────────────────────────────────────────────
RETENTION_RESCUE            OVERDUE_REVISION               Reviews a spaced repetition item past due.
                            DUE_TODAY_REVISION             Reviews a spaced repetition item due today.
───────────────────────────────────────────────────────────────────────────────────────────
CURRICULUM_ADVANCEMENT      DAILY_OBJECTIVE_TARGET         Solves target patterns assigned in today's
                                                           active DailyObjective.
───────────────────────────────────────────────────────────────────────────────────────────
PACING_CALIBRATION          RUSHING_REMEDIATION            Calibrates pacing for a student exhibiting high
                                                           overall rushing risk (>= 0.60), anchoring drill
                                                           delivery to a deterministically selected active
                                                           focus topic.
───────────────────────────────────────────────────────────────────────────────────────────
EXAM_BENCHMARK              GOAL_BENCHMARK_MOCK            Full exam simulation required when approaching
                                                           a goal deadline without mock evidence.
───────────────────────────────────────────────────────────────────────────────────────────
DIAGNOSTIC_ASSESSMENT       FOUNDATIONAL_DIAGNOSTIC        Initial diagnostic for new students with 0 history.
                            FOUNDATIONAL_REINFORCEMENT     Reinforcement for students without an active plan.
```

No implementation may introduce any other action type or subtype without a formal specification version upgrade.

### 11.1 Checkpoint Disambiguation:
`COGNITIVE_REST` is an **ergonomic agenda checkpoint**, NOT a competitive learning action:
- `COGNITIVE_REST` is **NOT a seventh action type**.
- `FATIGUE_PREVENTION_PAUSE` is **NOT a ninth action subtype**.
- Checkpoints never appear as `nextAction`.
- Checkpoints do NOT consume a learning activity slot (`MAX_AGENDA_ACTIVITIES`).
- Checkpoints do NOT participate in urgency scoring and have no `policyPriorityClass`.
- Checkpoints consume strictly `0` questions and have `executionIntent: null`.

---

## 12. Policy Priority Classes

To guarantee strict pedagogical precedence without brittle floating-point tuning, Phase 9 partitions action types into **three hard policy priority classes**:

```text
┌─────────────────────────────────────────────────────────────────────────────────┐
│ CLASS 0 — PROTECTIVE / BLOCKING (Highest Hard Priority)                         │
│   • PREREQUISITE_REMEDIATION (BLOCKING_PREREQUISITE)                           │
│   • RETENTION_RESCUE (OVERDUE_REVISION)                                        │
│   Rationale: Immediate blocking prerequisites and decaying memory debt MUST be  │
│   resolved before advancing forward curriculum.                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│ CLASS 1 — DUE RETENTION                                                         │
│   • RETENTION_RESCUE (DUE_TODAY_REVISION)                                      │
│   Rationale: Due-today spaced repetition items preserve existing knowledge and  │
│   take precedence over new curriculum learning.                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│ CLASS 2 — STANDARD SCORED                                                       │
│   • EXAM_BENCHMARK (GOAL_BENCHMARK_MOCK)                                       │
│   • PACING_CALIBRATION (RUSHING_REMEDIATION)                                   │
│   • CURRICULUM_ADVANCEMENT (DAILY_OBJECTIVE_TARGET)                             │
│   Rationale: Standard forward advancement, pacing fixes, and benchmark tests.  │
├─────────────────────────────────────────────────────────────────────────────────┤
│ FALLBACKS (Non-Competitive)                                                     │
│   • DIAGNOSTIC_ASSESSMENT (FOUNDATIONAL_DIAGNOSTIC)                             │
│   • DIAGNOSTIC_ASSESSMENT (FOUNDATIONAL_REINFORCEMENT)                          │
│   policyPriorityClass = null, urgencyScore = null                               │
│   Rationale: Admitted only when history or study plans are absent.              │
└─────────────────────────────────────────────────────────────────────────────────┘
```

**Normative Rule**: Any candidate in Class 0 strictly beats any candidate in Class 1 or Class 2, regardless of urgency scores. Any candidate in Class 1 strictly beats any candidate in Class 2.

---

## 13. Urgency Scoring Model

For competitive candidates within a policy priority class, the engine computes a composite urgency score $U(a) \in [20.0, 100.0]$:

$$U(a) = W_{\text{type}} + S_{\text{deficit}} + I_{\text{goal}} + T_{\text{temporal}}$$

### 13.1 Base Type Weights ($W_{\text{type}}$)
Centralized in `src/config/orchestrationConfig.js`:
- `PREREQUISITE_REMEDIATION`: $50.0$
- `OVERDUE_REVISION`: $45.0$
- `DUE_TODAY_REVISION`: $35.0$
- `CURRICULUM_ADVANCEMENT`: $30.0$
- `EXAM_BENCHMARK`: $25.0$
- `PACING_CALIBRATION`: $20.0$

### 13.2 Component Maximum Bounds
- $\text{MAX\_MASTERY\_DEFICIT\_WEIGHT} = 25.0$
- $\text{MAX\_GOAL\_IMPACT\_WEIGHT} = 15.0$
- $\text{MAX\_TEMPORAL\_WEIGHT} = 10.0$

Theoretical maximum: $50.0 + 25.0 + 15.0 + 10.0 = 100.0$.

### 13.3 Action-Specific Mastery Deficit Semantics ($S_{\text{deficit}}$):
Do not apply a single global missing-progress rule. Every action type evaluates mastery deficit according to its domain contract:
1. **`PREREQUISITE_REMEDIATION`**:
   $$S_{\text{deficit}} = \max(0, 1 - M_{\text{prereq}}) \times 25.0$$
   $M_{\text{prereq}}$ is the authoritative prerequisite bottleneck mastery reported directly by Phase 8's readiness service (`criticalPrerequisiteBottlenecks[].prerequisiteMastery`).
2. **`RETENTION_RESCUE`**:
   $$S_{\text{deficit}} = \max(0, 1 - M_{\text{pattern}}) \times 25.0$$
   $M_{\text{pattern}}$ is loaded from `StudentProgress` for `(userId, item.topic, item.pattern)`. If no record exists, $M_{\text{pattern}} = 0.0$ strictly for urgency scoring.
3. **`CURRICULUM_ADVANCEMENT`**:
   $$S_{\text{deficit}} = \max(0, 1 - M_{\text{target}}) \times 25.0$$
   $M_{\text{target}}$ is loaded from `StudentProgress` for `(userId, obj.topic, pattern.pattern)`. If no record exists, $M_{\text{target}} = 0.0$.
4. **`PACING_CALIBRATION`**:
   Focus topic mastery $M_{\text{topic}}$ is computed as the arithmetic mean of stored masteries across patterns within `pacingTargetTopic`.
   - **Crucial Rule**: If **NO progress records** exist for the topic, $S_{\text{deficit}} = 0.0$ (NOT mastery = 0.0, avoiding artificial deficit inflation when no evidence exists).
   - If progress records exist: $S_{\text{deficit}} = \max(0, 1 - M_{\text{topic}}) \times 25.0$.
5. **`EXAM_BENCHMARK`**:
   $$S_{\text{deficit}} = 0.0$$
   Benchmark assessments measure summative readiness across an entire blueprint, not pattern deficit.
6. **Diagnostic Fallbacks (`DIAGNOSTIC_ASSESSMENT`)**:
   Missing progress defaults to $0.0$ strictly for fallback ranking sorting order; `urgencyScore` remains `null`.

### 13.4 Goal Impact ($I_{\text{goal}}$) & Continuous Deadline Proximity Bonus:
- Base plan alignment: $+10.0$ if the action's target pattern/topic belongs to the `selectedActivePlan`.
- Continuous Deadline Proximity Bonus ($D_{\text{bonus}} \in [0.0, 5.0]$):
  For an **ACTIVE Goal** with a valid `targetDate`:
  ```javascript
  const rawDays = Math.floor(
    (
      new Date(goal.targetDate).getTime()
      - referenceNow.getTime()
    ) / 86400000
  );

  daysToDeadline = Math.max(0, rawDays);

  if (daysToDeadline < 30) {
    deadlineProximityBonus = Math.min(
      5.0,
      Math.max(
        0.0,
        (30 - daysToDeadline) / 30.0
      ) * 5.0
    );
  } else {
    deadlineProximityBonus = 0.0;
  }
  ```

  **Precision Invariant**:
  `deadlineProximityBonus` remains an unrounded raw `Number` through scoring, ranking, priority-tier calculation, and candidate arbitration.
  If `deadlineProximityBonus` is ever exposed directly in a response DTO, round only the serialized DTO value to the specification-defined presentation precision.
  The rounded DTO value MUST NOT be fed back into any internal calculation.
  - If no active goal exists or `targetDate` is missing/null/invalid:
    `daysToDeadline = null`, `deadlineProximityBonus = 0.0`.
  - If target date is in the past (`rawDays <= 0`):
    `daysToDeadline = 0`, `deadlineProximityBonus = 5.0`.
  - **No Bucketing**: The linear continuous formula must be preserved exactly. Bucketed discrete jumps ($0\text{--}7 \to 5$, $8\text{--}14 \to 3$, $15\text{--}30 \to 1$) are strictly forbidden.
- Total Goal Impact:
  $$I_{\text{goal}} = \min(15.0, \text{baseAlignment} + \text{deadlineProximityBonus})$$

### 13.5 Temporal Urgency ($T_{\text{temporal}}$):
- **`OVERDUE_REVISION`**:
  $$\text{daysOverdue} = \max\left(0, \left\lfloor \frac{\text{todayStartUtc} - \text{nextReviewDate}}{86400000} \right\rfloor\right)$$
  $$T_{\text{temporal}} = \min(10.0, \text{daysOverdue} \times 2.0)$$
- **`EXAM_BENCHMARK`**:
  $$T_{\text{temporal}} = 0.0$$
  *Deadline urgency for mock exams is governed exclusively by `deadlineProximityBonus` in $I_{\text{goal}}$. The unauthorized temporal component $(14 - \text{daysToDeadline}) / 14 \times 10$ is strictly prohibited to prevent double-counting.*
- **All other action types** (`PREREQUISITE_REMEDIATION`, `DUE_TODAY_REVISION`, `CURRICULUM_ADVANCEMENT`, `PACING_CALIBRATION`):
  $$T_{\text{temporal}} = 0.0$$

---

## 14. 7-Tier Ranking Comparator

When ranking candidate actions (for Next-Best-Action arbitration or within agenda segments), the engine applies a **strict 7-tier deterministic comparator**:

```javascript
const compareCandidates = (a, b) => {
  // 1. policyPriorityClass ascending (Class 0 < Class 1 < Class 2)
  if (a.policyPriorityClass !== b.policyPriorityClass) {
    return a.policyPriorityClass - b.policyPriorityClass;
  }

  // 2. urgencyScore descending (higher urgency wins)
  if (a.urgencyScore !== b.urgencyScore) {
    return b.urgencyScore - a.urgencyScore;
  }

  // 3. W_type base weight descending
  if (a.baseWeight !== b.baseWeight) {
    return b.baseWeight - a.baseWeight;
  }

  // 4. Raw stored mastery ascending (weaker mastery wins)
  const masteryA = a.storedMastery ?? 0.0;
  const masteryB = b.storedMastery ?? 0.0;
  if (masteryA !== masteryB) {
    return masteryA - masteryB;
  }

  // 5. Canonical topic registry index ascending (0 to 23)
  const topicIdxA = a.topicIndex ?? 999999;
  const topicIdxB = b.topicIndex ?? 999999;
  if (topicIdxA !== topicIdxB) {
    return topicIdxA - topicIdxB;
  }

  // 6. Canonical pattern registry index ascending (0 to 277)
  // Patternless actions (e.g. PACING_CALIBRATION, EXAM_BENCHMARK) assign +Infinity
  const patternIdxA = a.pattern ? a.patternIndex : Infinity;
  const patternIdxB = b.pattern ? b.patternIndex : Infinity;
  if (patternIdxA !== patternIdxB) {
    return patternIdxA - patternIdxB;
  }

  // 7. Lexical deterministic fallback
  const patternNameA = a.pattern || '';
  const patternNameB = b.pattern || '';
  const patternComp = patternNameA.localeCompare(patternNameB);
  if (patternComp !== 0) return patternComp;

  return a.actionId.localeCompare(b.actionId);
};
```

### Invariants:
- Never call `getPatternRegistryIndex` with a null or undefined pattern. Patternless actions explicitly use `+Infinity`.
- Compare using **raw unrounded numeric values**. Do NOT round before comparison.

---

## 15. Priority Tiers & Thresholds

Every competitive action receives a discrete `priorityTier` based on its raw urgency score $U$:

```text
Urgency Score Range       Priority Tier
────────────────────────────────────────
U >= 80.0                 critical
65.0 <= U < 80.0          urgent
50.0 <= U < 65.0          high
35.0 <= U < 50.0          normal
U < 35.0                  low
```

Allowed severity and priority tier values across Phase 9 are strictly:
`critical`, `urgent`, `high`, `normal`, `low`.
The label `"medium"` is **strictly prohibited** anywhere in Phase 9.

### Fallback Priority Tier:
For `DIAGNOSTIC_ASSESSMENT` actions (`FOUNDATIONAL_DIAGNOSTIC` and `FOUNDATIONAL_REINFORCEMENT`), `urgencyScore` is `null` and `policyPriorityClass` is `null`. By explicit normative policy, their `priorityTier` is assigned to **`"normal"`**.

---

## 16. Goal & StudyPlan Resolution

Goal and StudyPlan resolution follows a strict deterministic branching algorithm:

```javascript
let selectedActivePlan = null;
let selectedGoal = null;

if (explicitGoalProvided) {
  selectedGoal = validatedOwnedGoal;

  selectedActivePlan = await StudyPlan.findOne({
    userId,
    goalId: selectedGoal._id,
    status: 'active',
  })
  .sort({
    startDate: -1,
    _id: 1,
  })
  .lean();

} else {
  selectedActivePlan = await StudyPlan.findOne({
    userId,
    status: 'active',
  })
  .sort({
    startDate: -1,
    _id: 1,
  })
  .lean();

  if (selectedActivePlan && selectedActivePlan.goalId) {
    selectedGoal = await Goal.findById(selectedActivePlan.goalId).lean();
  }
}
```

### Critical Resolution Invariants:
1. **Explicit Goal Isolation**:
   ```text
   explicit goalId + no active plan for that goal
   → selectedActivePlan = null
   → NEVER select another goal's active plan
   ```
   If a student requests an explicit `goalId`, failure to find an active plan for that goal **MUST NOT** fall back to any other plan owned by the student.
2. **Deterministic Multi-Plan Resolution**:
   When searching without an explicit goal, multiple active plans are ordered deterministically by `startDate` descending, then `_id` ascending.
3. **No-Active-Plan State**:
   If `selectedActivePlan === null`, standard competitive actions requiring a study plan cannot generate; the engine enters the `FOUNDATIONAL_REINFORCEMENT` fallback state (or `NO_ELIGIBLE_ACTION` if candidates are exhausted).

---

## 17. DailyObjective Resolution

Using `selectedActivePlan`, the engine resolves today's active objective:

```javascript
let activeDailyObjective = null;

if (selectedActivePlan) {
  activeDailyObjective = await DailyObjective.findOne({
    userId,
    planId: selectedActivePlan._id,
    date: { $gte: todayStartUtc, $lt: tomorrowStartUtc },
    status: { $in: ['pending', 'in_progress'] },
  }).lean();
}
```

### Invariants:
- Any objective with status `'completed'` or `'skipped'` is ignored and yields `activeDailyObjective = null`.
- If no matching objective exists for today in `[todayStartUtc, tomorrowStartUtc)`, `activeDailyObjective = null`.

---

## 18. Daily Question Budgeting

The overall study question budget for today is derived deterministically:

```javascript
let dailyQuestionBudget = 30; // DEFAULT

if (activeDailyObjective && Array.isArray(activeDailyObjective.patterns)) {
  const remainingTargetQuestions = activeDailyObjective.patterns.reduce(
    (sum, p) => sum + Math.max(0, (p.targetQuestions || 0) - (p.completedQuestions || 0)),
    0
  );

  if (remainingTargetQuestions > 0) {
    dailyQuestionBudget = Math.max(10, Math.min(50, remainingTargetQuestions));
  }
}
```

### Invariants:
- $\text{MIN\_DAILY\_QUESTION\_BUDGET} = 10$
- $\text{MAX\_DAILY\_QUESTION\_BUDGET} = 50$
- $\text{DEFAULT\_DAILY\_QUESTION\_BUDGET} = 30$

---

## 19. Retention Rescue Candidate Generation & Global Scope

### 19.1 Global User Debt Principle
Spaced retention debt is **global protective memory debt**. When a student reviews an item, preventing memory decay protects overall cognitive readiness.
**Normative Invariant**: Even when an optional `goalId` is provided in the query string, the query for due/overdue revision items scans **ALL** scheduled items for the user, not just items tagged with that `goalId`:

```javascript
const candidateRevisions = await RevisionItem.find({
  userId,
  status: 'scheduled',
  nextReviewDate: { $lt: tomorrowStartUtc },
}).lean();
```

Items with `nextReviewDate >= tomorrowStartUtc` are future items and strictly excluded.

### 19.2 Classification & Scoring:
- **`OVERDUE_REVISION`** (Class 0):
  Condition: `item.nextReviewDate < todayStartUtc`
  Base weight: $W_{\text{type}} = 45.0$
  Temporal urgency: $T_{\text{temporal}} = \min(10.0, \text{daysOverdue} \times 2.0)$
- **`DUE_TODAY_REVISION`** (Class 1):
  Condition: `todayStartUtc <= item.nextReviewDate < tomorrowStartUtc`
  Base weight: $W_{\text{type}} = 35.0$
  Temporal urgency: $T_{\text{temporal}} = 0.0$

### 19.3 Progress, Goal Impact & Question Sizing:
- Load `StudentProgress` for `(userId, item.topic, item.pattern)`. If absent, $M = 0.0$ strictly for urgency scoring.
- $S_{\text{deficit}} = \max(0, 1 - M) \times 25.0$.
- $I_{\text{goal}} = 10.0$ if the revision pattern belongs to `selectedActivePlan.targets`; otherwise $0.0$.
- **Authoritative Retention Sizing Contract**:
  ```javascript
  const rawRetentionQuestions = Math.min(10, remainingRevisionBudget);
  ```
  Admission requires: `remainingRevisionBudget >= 1`.
  *(No fixed retention value of 5 remains. Final allocation obeys remainingRevisionBudget, remainingDailyBudget, remainingSegmentBudget, and maxQuestionsPerBlock).*
- Deterministic ID:
  `nba_retention_rescue_{topicSlug}_{patternSlug}_{revisionItemId}`

---

## 20. Prerequisite Remediation Candidate Generation

Candidate prerequisite bottlenecks are derived directly from Phase 8's verified readiness service:

```javascript
let bottlenecks = [];
if (selectedGoal && selectedGoal.status === 'active') {
  const readiness = await readinessService.getGoalReadiness(userId, selectedGoal._id, referenceNow);
  bottlenecks = readiness.criticalPrerequisiteBottlenecks || [];
}
```

### Invariants:
1. **Plan Alignment**: Only bottlenecks where `targetPattern` is an active target in `selectedActivePlan` generate actions.
2. **Mastery Threshold**: Only bottlenecks where prerequisite mastery $M < 0.70$ qualify.
3. **Scoring**:
   - Class: **Class 0**
   - $W_{\text{type}} = 50.0$
   - $S_{\text{deficit}} = \max(0, 1 - M_{\text{prereq}}) \times 25.0$
   - $I_{\text{goal}} = 10.0$
   - $T_{\text{temporal}} = 0.0$
4. **Prescribed Question Sizing**:
   $$Q = 5 + \lfloor (1 - M_{\text{prereq}}) \times 5 \rfloor \quad \in [5, 10]$$
5. **Deterministic ID**:
   `nba_prerequisite_remediation_{prereqTopicSlug}_{prereqPatternSlug}_blocks_{blockedTargetPatternSlug}`

---

## 21. Curriculum Advancement Candidate Generation

Curriculum candidates represent the student's forward daily objective assignments:

### Invariants:
1. Generated **only** if `activeDailyObjective` exists.
2. Evaluated for each pattern entry in `activeDailyObjective.patterns` where:
   $$\text{remainingTargetQuestions} = \text{targetQuestions} - \text{completedQuestions} > 0$$
3. Stored mastery $M$ loaded from `StudentProgress`. If absent, $M = 0.0$.
4. Scoring:
   - Class: **Class 2**
   - $W_{\text{type}} = 30.0$
   - $S_{\text{deficit}} = \max(0, 1 - M) \times 25.0$
   - $I_{\text{goal}} = \min(15.0, 10.0 + \text{deadlineProximityBonus})$ using the continuous formula
   - $T_{\text{temporal}} = 0.0$
5. **Quota Protection**:
   $$\text{rawQuestions} = \min(15, \text{remainingTargetQuestions})$$
   Phase 9 will never prescribe more questions than remain in the objective's quota.
6. **Deterministic ID**:
   `nba_curriculum_advancement_{topicSlug}_{patternSlug}`

---

## 22. Exam Benchmark Policy

An exam benchmark assesses exam preparedness via a full mock test simulation:

### 22.1 Eligibility Criteria (Requires ALL):
1. `selectedGoal` exists and has `status === 'active'`.
2. `selectedGoal.targetDate` is valid and in the future or today: $0 \le \text{daysToDeadline} < 14$.
3. Phase 8 goal readiness status is not `'insufficient_data'`.
4. Phase 8 goal readiness reports `eligibleMocksCount === 0`.
   *(Crucial: This signifies no eligible goal-aligned mock evidence on record, NOT zero mocks globally).*

### 22.2 Scoring & Attributes:
- Class: **Class 2**
- $W_{\text{type}} = 25.0$
- $S_{\text{deficit}} = 0.0$
- $I_{\text{goal}} = \min(15.0, 10.0 + \text{deadlineProximityBonus})$ using the continuous formula
- $T_{\text{temporal}} = 0.0$ *(Strictly zero. No unauthorized temporal bonus; deadline urgency is not double-counted).*
- Prescribed questions: **0 practice questions** (does not consume daily practice question budget).
- Execution intent:
  - `capability`: `'MOCK_ASSESSMENT'`
  - `goalId`: `String(selectedGoal._id)`
  - `requiresBlueprintSelection`: `true`
  - `targetEndpoint`: `null` (Phase 9 does not fabricate or select a MockBlueprint)
  - `estimatedDurationMinutes`: `null` (unknown prior to blueprint selection)
- Deterministic ID: `nba_exam_benchmark_{goalId}`

---

## 23. Pacing Calibration Policy

A pacing calibration action addresses diagnosed rapid guessing and rushing habits:

### 23.1 Eligibility Signal:
Read from Phase 8's speed-accuracy matrix:
```javascript
const matrix = await speedAccuracyMatrixService.getSpeedAccuracyMatrix(userId, 30, null, referenceNow);
const rushingRisk = matrix.speedAccuracyMatrix.rushingRiskScore;
```
Qualifies iff: `rushingRisk !== null && rushingRisk >= 0.60`.

**Factuality Invariant**: This represents a **student-level global rushing risk** ($rushingRiskScore \ge 0.60$ across classified errors in the 30-day window). The selected topic is the **practice anchor**, NOT the diagnosed cause. The rationale must never claim topic-specific rushing causality.

### 23.2 Target Topic Resolution Hierarchy:
- **Priority A (Remaining Objective Targets)**:
  If today's `activeDailyObjective` has patterns with `remainingTargetQuestions > 0`, rank those candidate patterns by:
  1. Stored mastery ascending (missing progress = 0.0)
  2. `remainingTargetQuestions` descending
  3. Canonical topic index ascending
  4. Canonical pattern index ascending
  5. Lexical fallback
  The winner's topic becomes `pacingTargetTopic`.
- **Priority B (Active Plan Targets)**:
  If Priority A yields nothing but `selectedActivePlan` has target topics:
  Deduplicate topics, sort by canonical topic index ascending, and select the first.
- **Priority C (Deterministic Suppression)**:
  If no deterministic topic can be resolved via Priority A or B:
  **DO NOT generate PACING_CALIBRATION**.
  **DO NOT generate RUSHING_CALIBRATION intervention**.
  Never pick a random, hard-coded, or arbitrary topic.

### 23.3 Scoring & Intent:
- Class: **Class 2**
- $W_{\text{type}} = 20.0$
- Topic mastery $M_{\text{topic}}$: arithmetic mean of stored mastery across patterns in `pacingTargetTopic`.
  - If **NO progress records** exist for the topic: $S_{\text{deficit}} = 0.0$ (NOT mastery = 0.0).
  - With records: $S_{\text{deficit}} = \max(0, 1 - M_{\text{topic}}) \times 25.0$.
- $I_{\text{goal}} = 10.0$ if `pacingTargetTopic` is in `selectedActivePlan.targets`; else $0.0$.
- $T_{\text{temporal}} = 0.0$.
- **Authoritative Raw Question Count**:
  $$\text{rawQuestions} = 5$$
  *(Pacing drill is strictly sized to 5 deliberate calibration questions. No pacing count of 10 remains).*
- Execution intent:
  - `capability`: `'ADAPTIVE_PRACTICE'`
  - `topic`: `pacingTargetTopic`
  - `pattern`: `null`
  - `planId`: `selectedActivePlan ? String(selectedActivePlan._id) : null`
  - `questionDelivery`: endpoint `'/api/v1/adaptive/next-question'`, method `'GET'`, params `{ userId, topic: pacingTargetTopic }`
  - `attemptSubmissionContext`: endpoint `'/api/v1/attempts'`, method `'POST'`, source `'practice'`
- Deterministic ID: `nba_pacing_calibration_{topicSlug}_all`

---

## 24. Diagnostic Fallbacks

When normal competitive candidate generation cannot proceed due to missing user history or missing study plans, the engine falls back to deterministic diagnostic actions:

### 24.1 New-User Fallback (`FOUNDATIONAL_DIAGNOSTIC`)
- **Trigger**: `Attempt.countDocuments({ userId }) === 0` AND `StudentProgress.countDocuments({ userId }) === 0`.
- Response contract:
  - `status`: `'insufficient_data'`
  - `reason`: `'NEW_USER_NO_HISTORY'`
  - `actionType`: `'DIAGNOSTIC_ASSESSMENT'`
  - `actionSubtype`: `'FOUNDATIONAL_DIAGNOSTIC'`
  - `policyPriorityClass`: `null`
  - `urgencyScore`: `null`
  - `priorityTier`: `'normal'`
- **Target Selection (Live Source Registry Truth)**:
  Filter `patternRegistryService.getAllCanonicalPatterns()` where `hierarchyService.getPrerequisites(pattern).length === 0`.
  Select the **first foundational pattern** in canonical registry order:
  **Topic: `"Algebra"`, Pattern: `"Linear Equations & Systems of Equations"`**.
  *(Slug: `algebra` / `linear-equations-systems-of-equations`).*
- **Sizing**: `prescribedQuestions = 10`. Sequential adaptive delivery via `GET /api/v1/adaptive/next-question`. Not a mock exam.
- **Deterministic ID**:
  `nba_diagnostic_assessment_foundational_diagnostic_algebra_linear-equations-systems-of-equations`

### 24.2 No-Active-Plan Fallback (`FOUNDATIONAL_REINFORCEMENT`)
- **Trigger**: Student has history (attempts or progress > 0), but `selectedActivePlan === null`.
- Response contract:
  - `status`: `'partial_data'`
  - `reason`: `'NO_ACTIVE_STUDY_PLAN'`
  - `actionType`: `'DIAGNOSTIC_ASSESSMENT'`
  - `actionSubtype`: `'FOUNDATIONAL_REINFORCEMENT'`
  - `policyPriorityClass`: `null`
  - `urgencyScore`: `null`
  - `priorityTier`: `'normal'`
- **Target Selection**:
  Take all 60 foundational patterns and sort by:
  1. Stored mastery ascending (missing = 0.0 strictly for fallback sorting)
  2. Canonical topic index ascending
  3. Canonical pattern index ascending
  4. Lexical fallback
  Select the top pattern. If student has zero mastery across all 60, the winner is also Topic `"Algebra"`, Pattern `"Linear Equations & Systems of Equations"`.
- **Sizing**: `prescribedQuestions = 10`.
- **Deterministic ID**:
  `nba_diagnostic_assessment_foundational_reinforcement_{topicSlug}_{patternSlug}`

---

## 25. Daily Agenda Assembly & Operational Segments

`GET /api/v1/orchestration/daily-agenda` structures the student's study day into **four ordered operational segments**:

```text
Sequence   Segment Name               Eligible Action Types                Cap
─────────────────────────────────────────────────────────────────────────────
1          WARMUP_RETRIEVAL           RETENTION_RESCUE (Overdue/Due-Today) 1
2          PREREQUISITE_UNBLOCKING    PREREQUISITE_REMEDIATION             1
3          CORE_CURRICULUM            CURRICULUM_ADVANCEMENT               2
4          PACING_OR_BENCHMARK        PACING_CALIBRATION or EXAM_BENCHMARK 1
```

### Global Agenda Invariants:
1. **Global Action Cap**: `MAX_AGENDA_ACTIVITIES = 4`.
   The total number of learning activities across all segments cannot exceed 4.
2. **Omission of Empty Segments**: Any segment with 0 admitted actions is completely omitted from the response.
3. **Contiguous Segment Indexing**: Admitted segments are re-indexed contiguously from `1..N`.
4. **Pacing vs Benchmark Competition**:
   If both qualify for Segment 4, the candidate with higher `urgencyScore` is admitted. If tied, `EXAM_BENCHMARK` wins because its base weight ($25.0$) exceeds pacing ($20.0$). At most **one** activity appears in Segment 4.

---

## 26. Segment Budgets & Budget Conservation

### 26.1 Segment Budget Limits:
- **`WARMUP_RETRIEVAL`**:
  $$\text{revisionBudget} = \lfloor \text{dailyQuestionBudget} \times 0.20 \rfloor$$
  $$\text{rawRetentionQuestions} = \min(10, \text{remainingRevisionBudget})$$
  No hidden minimum. If $\text{remainingRevisionBudget} < 1$, the action is omitted.
- **`PREREQUISITE_UNBLOCKING`**:
  $$\text{remainingSegmentBudget} = \text{remainingDailyBudget}$$
- **`CORE_CURRICULUM`**:
  $$\text{remainingSegmentBudget} = \text{remainingDailyBudget}$$
- **`PACING_OR_BENCHMARK`**:
  - `PACING_CALIBRATION`: $\text{rawQuestions} = 5$; $\text{remainingSegmentBudget} = \text{remainingDailyBudget}$.
  - `EXAM_BENCHMARK`: Consumes **0 practice questions**; does not decrement practice budget.

---

## 27. Unified Allocator

Every question-based candidate action passes through the **Unified Allocator**:

```javascript
const allocateQuestions = (rawQuestions, remainingDailyBudget, remainingSegmentBudget, maxQuestionsPerBlock) => {
  const allocated = Math.min(
    rawQuestions,
    remainingDailyBudget,
    remainingSegmentBudget,
    maxQuestionsPerBlock
  );
  return allocated >= 1 ? allocated : 0;
};
```

### Invariants:
- If `allocated < 1`, the candidate is omitted completely.
- After admission:
  ```javascript
  remainingDailyBudget -= allocated;
  remainingSegmentBudget -= allocated;
  globalLearningActionCount += 1;
  ```
- **Hard Conservation Invariant**:
  $$\sum \text{allocatedQuestions} \le \text{dailyQuestionBudget}$$

---

## 28. Stamina Analysis & Cognitive Rest

### 28.1 Stamina Block Cap (`maxQuestionsPerBlock`):
The engine reads Phase 8's stamina curve:
```javascript
const staminaResult = await staminaAnalyticsService.getStaminaCurve(userId);
const curve = staminaResult.staminaCurve;
```
If `curve && curve.fatigueDropoffPercent > 25.0` AND:
- `curve.mockSessionsAnalyzed > 0`
- `curve.totalQuestionsAnalyzed > 0`
- Values are finite numbers:
$$\text{questionsPerQuartile} = \left\lfloor \frac{\text{totalQuestionsAnalyzed}}{4 \times \text{mockSessionsAnalyzed}} \right\rfloor$$
$$\text{maxQuestionsPerBlock} = \min(10, \max(5, \text{questionsPerQuartile}))$$
Otherwise (stamina evidence missing, non-finite, or $\le 25\%$ drop-off):
$$\text{maxQuestionsPerBlock} = 15$$

### 28.2 Cognitive Rest Ergonomic Checkpoint (`COGNITIVE_REST`):
`COGNITIVE_REST` is an **ergonomic agenda checkpoint**, NOT a competitive learning action:
- It has NO `actionType`, NO `actionSubtype`, NO `urgencyScore`, NO `policyPriorityClass`, NO `priorityTier`.
- It prescribes `0` questions.
- Duration: Fixed `10` minutes (`estimatedMinutes = 10`).
- Execution intent: strictly `null`.
- **Does NOT consume a learning action slot** (does not count toward `MAX_AGENDA_ACTIVITIES`).
- **Does NOT consume question budget** (`allocatedQuestions = 0`).
- **Never returned as a `nextAction`**.

#### Authoritative Checkpoint DTO Schema:
```typescript
type CognitiveRestCheckpoint = {
  checkpointId: string;
  checkpointType: 'COGNITIVE_REST';
  afterSegmentIndex: number;
  beforeSegmentIndex: number;
  prescribedQuestions: 0;
  estimatedMinutes: 10;
  rationale: {
    reasonCode: 'FATIGUE_DROP_OFF_DETECTED';
    description: string;
  };
  executionIntent: null;
};
```

#### Exact Checkpoint Insertion Semantics:
When `curve && curve.fatigueDropoffPercent > 25.0` with verified stamina samples:
Given $N$ admitted non-empty learning segments:
- If $N \le 1$: `checkpoints = []` (no rest checkpoint for 0 or 1 segment)
- If $N \ge 2$: `checkpoints.length = N - 1`

A checkpoint exists strictly between every pair of consecutive admitted learning segments:
- Segment 1 $\to$ Cognitive Rest (`afterSegmentIndex: 1, beforeSegmentIndex: 2`) $\to$ Segment 2 $\to$ Cognitive Rest (`afterSegmentIndex: 2, beforeSegmentIndex: 3`) $\to$ Segment 3 ...
- **Never inserted before the first learning segment**.
- **Never inserted after the final learning segment**.
- If `fatigueDropoffPercent <= 25.0` or stamina data is absent/insufficient: `checkpoints = []`.
- `totalEstimatedMinutes` in the daily agenda includes checkpoint minutes (each 10 min).
- `AgendaSegment.activities` contains **ONLY** canonical learning actions and **NEVER** contains checkpoints.

---

## 29. Execution Intent Formulations

Phase 9 separates *what to do* from *how to do it* by returning structured, discriminated execution intents:

### 29.1 Authoritative Discriminated Union:

```typescript
type AdaptivePracticeIntent = {
  capability: 'ADAPTIVE_PRACTICE';
  topic: string;
  pattern: string | null;
  planId: string | null;
  questionDelivery: {
    endpoint: '/api/v1/adaptive/next-question';
    method: 'GET';
    params: Record<string, string>;
  };
  attemptSubmissionContext: {
    endpoint: '/api/v1/attempts';
    method: 'POST';
    source: 'practice';
  };
};

type RevisionPracticeIntent = {
  capability: 'REVISION_PRACTICE';
  revisionItemId: string;
  topic: string;
  pattern: string;
  questionDelivery: {
    endpoint: '/api/v1/adaptive/next-question';
    method: 'GET';
    params: {
      userId: string;
      topic: string;
      pattern: string;
    };
  };
  attemptSubmissionContext: {
    endpoint: '/api/v1/attempts';
    method: 'POST';
    source: 'revision';
    revisionItemId: string;
  };
};

type MockAssessmentIntent = {
  capability: 'MOCK_ASSESSMENT';
  goalId: string;
  requiresBlueprintSelection: true;
  targetEndpoint: null;
  estimatedDurationMinutes: null;
};

type DiagnosticAssessmentIntent = {
  capability: 'DIAGNOSTIC_ASSESSMENT';
  deliveryMode: 'SEQUENTIAL_ADAPTIVE';
  prescribedQuestionCount: 10;
  topic: string;
  pattern: string;
  questionDelivery: {
    endpoint: '/api/v1/adaptive/next-question';
    method: 'GET';
    params: {
      userId: string;
      topic: string;
      pattern: string;
    };
  };
  attemptSubmissionContext: {
    endpoint: '/api/v1/attempts';
    method: 'POST';
    source: 'practice';
  };
};

type ExecutionIntent =
  | AdaptivePracticeIntent
  | RevisionPracticeIntent
  | MockAssessmentIntent
  | DiagnosticAssessmentIntent;
```

### 29.2 Canonical Intent Mappings:
1. **Prerequisite Remediation**:
   - `AdaptivePracticeIntent` (`pattern`: prerequisite pattern, `planId`: `String(selectedActivePlan._id)`).
2. **Revision Rescue**:
   - `RevisionPracticeIntent` (`source: 'revision'`, `revisionItemId`: string).
   - *Phase 9 enforces that question delivery alone never advances revision state; transition occurs strictly on attempt submission.*
3. **Curriculum Advancement**:
   - `AdaptivePracticeIntent` (`pattern`: target pattern, `planId`: `String(selectedActivePlan._id)`).
4. **Pacing Calibration**:
   - `AdaptivePracticeIntent` (`pattern`: `null`, `planId`: `selectedActivePlan ? String(selectedActivePlan._id) : null`).
5. **Exam Benchmark**:
   - `MockAssessmentIntent` (`requiresBlueprintSelection: true`, `targetEndpoint: null`, `estimatedDurationMinutes: null`).
6. **Diagnostic Assessment (Fallbacks)**:
   - `DiagnosticAssessmentIntent` (`deliveryMode: 'SEQUENTIAL_ADAPTIVE'`, `prescribedQuestionCount: 10`).

Phase 9 **never invents new endpoints**. All routes point to verified Phase 4, 5, or 6 endpoints.

---

## 30. Cognitive Interventions

`GET /api/v1/orchestration/interventions` returns diagnostic intervention cards:

### 30.1 V1 Intervention Categories:
1. **`PREREQUISITE_BOTTLENECK`**:
   - Eligibility: Sourced from Phase 8 readiness `criticalPrerequisiteBottlenecks` where prerequisite mastery $M < 0.70$ and target pattern belongs to `selectedActivePlan`.
   - Severity: **Derived strictly from corresponding action `priorityTier`**.
   - Verified Template:
     `intv_prerequisite_bottleneck_{prereqTopicSlug}_{prereqPatternSlug}_blocks_{blockedTargetPatternSlug}`
   - Details: Identifies the prerequisite and the blocked target. Distinct targets blocked by the same prerequisite produce distinct interventions.
2. **`RUSHING_CALIBRATION`**:
   - Eligibility: Phase 8 `rushingRiskScore >= 0.60` AND `pacingTargetTopic` resolved.
   - Severity: **Derived strictly from corresponding action `priorityTier`**.
   - Verified Template:
     `intv_rushing_calibration_{topicSlug}_all`
   - Details: Explains the student-level rushing risk and recommends paced practice on the anchor `pacingTargetTopic`.
   - If `pacingTargetTopic` is suppressed, this intervention is also suppressed.

### 30.2 Strict Severity Derivation Invariant:
```javascript
intervention.severity = correspondingAction.priorityTier;
```
Allowed severity values across all interventions are strictly:
`critical`, `urgent`, `high`, `normal`, `low`.
The label `"medium"` is **strictly prohibited**.

---

## 31. Deterministic Action & Intervention IDs

All action and intervention IDs are constructed using deterministic templates:

### 31.1 Deterministic Slug Generator:
Uses Phase 2 `patternRegistryService.buildSlug(name)`:
```javascript
const buildSlug = (name) =>
  name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-');
```

### 31.2 Canonical Action ID Templates:
- Prerequisite:
  `nba_prerequisite_remediation_{prereqTopicSlug}_{prereqPatternSlug}_blocks_{blockedTargetPatternSlug}`
- Retention:
  `nba_retention_rescue_{topicSlug}_{patternSlug}_{revisionItemId}`
- Curriculum:
  `nba_curriculum_advancement_{topicSlug}_{patternSlug}`
- Pacing:
  `nba_pacing_calibration_{topicSlug}_all`
- Benchmark:
  `nba_exam_benchmark_{goalId}`
- Foundational Diagnostic:
  `nba_diagnostic_assessment_foundational_diagnostic_{topicSlug}_{patternSlug}`
- Foundational Reinforcement:
  `nba_diagnostic_assessment_foundational_reinforcement_{topicSlug}_{patternSlug}`

### 31.3 Canonical Intervention ID Templates:
- Prerequisite Bottleneck:
  `intv_prerequisite_bottleneck_{prereqTopicSlug}_{prereqPatternSlug}_blocks_{blockedTargetPatternSlug}`
- Rushing Calibration:
  `intv_rushing_calibration_{topicSlug}_all`

### 31.4 Collision-Safety Invariant:
If two actions differ in subtype or resource identity, their `actionId` must differ.
Specifically:
```text
nba_diagnostic_assessment_foundational_diagnostic_algebra_linear-equations-systems-of-equations
≠
nba_diagnostic_assessment_foundational_reinforcement_algebra_linear-equations-systems-of-equations
```

---

## 32. Deterministic Rationale Templates

Phase 9 does not perform LLM calls. All rationales use deterministic templates:

```text
Action Subtype                Reason Code                   Template
────────────────────────────────────────────────────────────────────────────────────────────────
BLOCKING_PREREQUISITE         UNMET_PREREQUISITE_BLOCK      "Prerequisite \"{prereqPattern}\" ({prereqMastery}% mastery) blocks curriculum target \"{targetPattern}\"."
OVERDUE_REVISION              SPACED_MEMORY_DECAY_OVERDUE   "Spaced revision for \"{pattern}\" is overdue by {daysOverdue} days. Immediate review required to prevent memory loss."
DUE_TODAY_REVISION            SPACED_RETENTION_DUE          "Scheduled revision for \"{pattern}\" is due today."
DAILY_OBJECTIVE_TARGET        DAILY_CURRICULUM_QUOTA        "Daily study plan target for \"{pattern}\". {remainingQuestions} questions remaining to complete objective."
RUSHING_REMEDIATION           HIGH_RUSHING_RISK_DETECTED    "Overall rushing risk is high: {rushingRiskPercent}% of classified errors were fast rushing errors. Complete a deliberate 5-question pacing drill on the current focus topic: {topic}."
GOAL_BENCHMARK_MOCK           DEADLINE_MOCK_EVIDENCE_NEEDED "Goal deadline is in {daysToDeadline} days with no eligible goal-aligned mock evidence on record."
FOUNDATIONAL_DIAGNOSTIC       NEW_STUDENT_BASELINE          "Initial diagnostic assessment on foundational pattern \"{pattern}\"."
FOUNDATIONAL_REINFORCEMENT    FOUNDATIONAL_MASTERY_BUILDING "Foundational skill reinforcement on \"{pattern}\" ({mastery}% mastery)."
```

---

## 33. Duration Estimation

Duration estimation consumes Phase 8's speed-accuracy matrix:

```javascript
const timing = matrix.speedAccuracyMatrix;
let secondsPerQuestion = 90; // FALLBACK_SECONDS_PER_QUESTION

if (timing && Number.isFinite(timing.medianTimeCorrectSeconds) && timing.medianTimeCorrectSeconds > 0) {
  secondsPerQuestion = timing.medianTimeCorrectSeconds;
}

const estimatedMinutes = Math.ceil((prescribedQuestions * secondsPerQuestion) / 60);
```

### Invariants:
- `PACING_CALIBRATION`: Calculated with `prescribedQuestions = 5`.
- `COGNITIVE_REST`: Exactly `10` minutes.
- `EXAM_BENCHMARK` (before blueprint selection): `null`.
- Agenda `totalEstimatedMinutes`: Sum of all admitted learning activity durations plus cognitive rest minutes.

---

## 34. Numeric Precision Policy

```text
Calculation Stage             Precision Strategy
─────────────────────────────────────────────────────────────────────
Internal Scoring & Ranking    Raw IEEE-754 double precision (no rounding)
Urgency Score (DTO)           roundTo(U, 2)
Mastery Deficit & Mastery     roundTo(M, 2)
Rushing Risk Score            roundTo(R, 2)
Percentages                   roundTo(P, 1)
Question Counts               Integers strictly (via Math.floor / Math.min)
Estimated Minutes             Integers strictly (via Math.ceil)
```

No presentation-rounded value may be used for ranking or allocation decisions.

---

## 35. Complete DTO Schemas

The following sections define complete, normative DTO schemas without placeholders.

### 35.1 `GET /api/v1/orchestration/next-action` Variants

#### 35.1.1 Normal Success State (Curriculum Advancement)
```json
{
  "success": true,
  "data": {
    "status": "calculated",
    "reason": "NEXT_ACTION_RESOLVED",
    "nextAction": {
      "actionId": "nba_curriculum_advancement_algebra_linear-equations-systems-of-equations",
      "actionType": "CURRICULUM_ADVANCEMENT",
      "actionSubtype": "DAILY_OBJECTIVE_TARGET",
      "policyPriorityClass": 2,
      "urgencyScore": 55.0,
      "priorityTier": "high",
      "topic": "Algebra",
      "pattern": "Linear Equations & Systems of Equations",
      "prescribedQuestions": 10,
      "estimatedMinutes": 15,
      "rationale": {
        "reasonCode": "DAILY_CURRICULUM_QUOTA",
        "description": "Daily study plan target for \"Linear Equations & Systems of Equations\". 10 questions remaining to complete objective."
      },
      "executionIntent": {
        "capability": "ADAPTIVE_PRACTICE",
        "topic": "Algebra",
        "pattern": "Linear Equations & Systems of Equations",
        "planId": "65b1234567890abcdef12345",
        "questionDelivery": {
          "endpoint": "/api/v1/adaptive/next-question",
          "method": "GET",
          "params": {
            "userId": "student-1",
            "topic": "Algebra",
            "pattern": "Linear Equations & Systems of Equations",
            "planId": "65b1234567890abcdef12345"
          }
        },
        "attemptSubmissionContext": {
          "endpoint": "/api/v1/attempts",
          "method": "POST",
          "source": "practice"
        }
      }
    }
  },
  "meta": {
    "referenceNow": "2026-10-06T18:00:00.000Z"
  }
}
```

#### 35.1.2 Normal Success State (Pacing Calibration — 5 Questions)
```json
{
  "success": true,
  "data": {
    "status": "calculated",
    "reason": "NEXT_ACTION_RESOLVED",
    "nextAction": {
      "actionId": "nba_pacing_calibration_percentage_all",
      "actionType": "PACING_CALIBRATION",
      "actionSubtype": "RUSHING_REMEDIATION",
      "policyPriorityClass": 2,
      "urgencyScore": 37.5,
      "priorityTier": "normal",
      "topic": "Percentage",
      "pattern": null,
      "prescribedQuestions": 5,
      "estimatedMinutes": 8,
      "rationale": {
        "reasonCode": "HIGH_RUSHING_RISK_DETECTED",
        "description": "Overall rushing risk is high: 68.0% of classified errors were fast rushing errors. Complete a deliberate 5-question pacing drill on the current focus topic: Percentage."
      },
      "executionIntent": {
        "capability": "ADAPTIVE_PRACTICE",
        "topic": "Percentage",
        "pattern": null,
        "planId": "65b1234567890abcdef12345",
        "questionDelivery": {
          "endpoint": "/api/v1/adaptive/next-question",
          "method": "GET",
          "params": {
            "userId": "student-1",
            "topic": "Percentage"
          }
        },
        "attemptSubmissionContext": {
          "endpoint": "/api/v1/attempts",
          "method": "POST",
          "source": "practice"
        }
      }
    }
  },
  "meta": {
    "referenceNow": "2026-10-06T18:00:00.000Z"
  }
}
```

#### 35.1.3 Normal Success State (Retention Rescue — Sized via min(10, budget))
```json
{
  "success": true,
  "data": {
    "status": "calculated",
    "reason": "NEXT_ACTION_RESOLVED",
    "nextAction": {
      "actionId": "nba_retention_rescue_percentage_basic-percentage-calculation_65b999888777666555444333",
      "actionType": "RETENTION_RESCUE",
      "actionSubtype": "OVERDUE_REVISION",
      "policyPriorityClass": 0,
      "urgencyScore": 73.0,
      "priorityTier": "urgent",
      "topic": "Percentage",
      "pattern": "Basic Percentage Calculation",
      "prescribedQuestions": 6,
      "estimatedMinutes": 9,
      "rationale": {
        "reasonCode": "SPACED_MEMORY_DECAY_OVERDUE",
        "description": "Spaced revision for \"Basic Percentage Calculation\" is overdue by 4 days. Immediate review required to prevent memory loss."
      },
      "executionIntent": {
        "capability": "REVISION_PRACTICE",
        "revisionItemId": "65b999888777666555444333",
        "topic": "Percentage",
        "pattern": "Basic Percentage Calculation",
        "questionDelivery": {
          "endpoint": "/api/v1/adaptive/next-question",
          "method": "GET",
          "params": {
            "userId": "student-1",
            "topic": "Percentage",
            "pattern": "Basic Percentage Calculation"
          }
        },
        "attemptSubmissionContext": {
          "endpoint": "/api/v1/attempts",
          "method": "POST",
          "source": "revision",
          "revisionItemId": "65b999888777666555444333"
        }
      }
    }
  },
  "meta": {
    "referenceNow": "2026-10-06T18:00:00.000Z"
  }
}
```

#### 35.1.4 Normal Success State (Exam Benchmark)
```json
{
  "success": true,
  "data": {
    "status": "calculated",
    "reason": "NEXT_ACTION_RESOLVED",
    "nextAction": {
      "actionId": "nba_exam_benchmark_65b111222333444555666777",
      "actionType": "EXAM_BENCHMARK",
      "actionSubtype": "GOAL_BENCHMARK_MOCK",
      "policyPriorityClass": 2,
      "urgencyScore": 38.83,
      "priorityTier": "normal",
      "topic": null,
      "pattern": null,
      "prescribedQuestions": 0,
      "estimatedMinutes": null,
      "rationale": {
        "reasonCode": "DEADLINE_MOCK_EVIDENCE_NEEDED",
        "description": "Goal deadline is in 7 days with no eligible goal-aligned mock evidence on record."
      },
      "executionIntent": {
        "capability": "MOCK_ASSESSMENT",
        "goalId": "65b111222333444555666777",
        "requiresBlueprintSelection": true,
        "targetEndpoint": null,
        "estimatedDurationMinutes": null
      }
    }
  },
  "meta": {
    "referenceNow": "2026-10-06T18:00:00.000Z"
  }
}
```

#### 35.1.5 New-User Fallback State
```json
{
  "success": true,
  "data": {
    "status": "insufficient_data",
    "reason": "NEW_USER_NO_HISTORY",
    "nextAction": {
      "actionId": "nba_diagnostic_assessment_foundational_diagnostic_algebra_linear-equations-systems-of-equations",
      "actionType": "DIAGNOSTIC_ASSESSMENT",
      "actionSubtype": "FOUNDATIONAL_DIAGNOSTIC",
      "policyPriorityClass": null,
      "urgencyScore": null,
      "priorityTier": "normal",
      "topic": "Algebra",
      "pattern": "Linear Equations & Systems of Equations",
      "prescribedQuestions": 10,
      "estimatedMinutes": 15,
      "rationale": {
        "reasonCode": "NEW_STUDENT_BASELINE",
        "description": "Initial diagnostic assessment on foundational pattern \"Linear Equations & Systems of Equations\"."
      },
      "executionIntent": {
        "capability": "DIAGNOSTIC_ASSESSMENT",
        "deliveryMode": "SEQUENTIAL_ADAPTIVE",
        "prescribedQuestionCount": 10,
        "topic": "Algebra",
        "pattern": "Linear Equations & Systems of Equations",
        "questionDelivery": {
          "endpoint": "/api/v1/adaptive/next-question",
          "method": "GET",
          "params": {
            "userId": "usr_newbie",
            "topic": "Algebra",
            "pattern": "Linear Equations & Systems of Equations"
          }
        },
        "attemptSubmissionContext": {
          "endpoint": "/api/v1/attempts",
          "method": "POST",
          "source": "practice"
        }
      }
    }
  },
  "meta": {
    "referenceNow": "2026-10-06T18:00:00.000Z"
  }
}
```

#### 35.1.6 No-Plan Fallback State
```json
{
  "success": true,
  "data": {
    "status": "partial_data",
    "reason": "NO_ACTIVE_STUDY_PLAN",
    "nextAction": {
      "actionId": "nba_diagnostic_assessment_foundational_reinforcement_algebra_linear-equations-systems-of-equations",
      "actionType": "DIAGNOSTIC_ASSESSMENT",
      "actionSubtype": "FOUNDATIONAL_REINFORCEMENT",
      "policyPriorityClass": null,
      "urgencyScore": null,
      "priorityTier": "normal",
      "topic": "Algebra",
      "pattern": "Linear Equations & Systems of Equations",
      "prescribedQuestions": 10,
      "estimatedMinutes": 15,
      "rationale": {
        "reasonCode": "FOUNDATIONAL_MASTERY_BUILDING",
        "description": "Foundational skill reinforcement on \"Linear Equations & Systems of Equations\" (0.0% mastery)."
      },
      "executionIntent": {
        "capability": "DIAGNOSTIC_ASSESSMENT",
        "deliveryMode": "SEQUENTIAL_ADAPTIVE",
        "prescribedQuestionCount": 10,
        "topic": "Algebra",
        "pattern": "Linear Equations & Systems of Equations",
        "questionDelivery": {
          "endpoint": "/api/v1/adaptive/next-question",
          "method": "GET",
          "params": {
            "userId": "usr_planless",
            "topic": "Algebra",
            "pattern": "Linear Equations & Systems of Equations"
          }
        },
        "attemptSubmissionContext": {
          "endpoint": "/api/v1/attempts",
          "method": "POST",
          "source": "practice"
        }
      }
    }
  },
  "meta": {
    "referenceNow": "2026-10-06T18:00:00.000Z"
  }
}
```

#### 35.1.7 No-Eligible-Action State
```json
{
  "success": true,
  "data": {
    "status": "calculated",
    "reason": "NO_ELIGIBLE_ACTION",
    "nextAction": null
  },
  "meta": {
    "referenceNow": "2026-10-06T18:00:00.000Z"
  }
}
```

#### 35.1.8 Active-Mock State
```json
{
  "success": true,
  "data": {
    "status": "active_mock_in_progress",
    "reason": "ACTIVE_MOCK_SESSION_EXISTS",
    "activeMockSessionId": "65b555444333222111000aaa",
    "nextAction": null
  },
  "meta": {
    "referenceNow": "2026-10-06T18:00:00.000Z"
  }
}
```

---

### 35.2 `GET /api/v1/orchestration/daily-agenda` Variants

#### 35.2.1 Normal Success State (Fully Articulated Segments, Activities & Cognitive Rest Checkpoints)
```json
{
  "success": true,
  "data": {
    "status": "calculated",
    "reason": "DAILY_AGENDA_ASSEMBLED",
    "agenda": {
      "dailyQuestionBudget": 30,
      "totalPrescribedQuestions": 21,
      "totalEstimatedMinutes": 52,
      "segments": [
        {
          "segmentIndex": 1,
          "segmentName": "WARMUP_RETRIEVAL",
          "segmentBudget": 6,
          "allocatedQuestions": 6,
          "activities": [
            {
              "actionId": "nba_retention_rescue_percentage_basic-percentage-calculation_65b999888777666555444333",
              "actionType": "RETENTION_RESCUE",
              "actionSubtype": "OVERDUE_REVISION",
              "policyPriorityClass": 0,
              "urgencyScore": 73.0,
              "priorityTier": "urgent",
              "topic": "Percentage",
              "pattern": "Basic Percentage Calculation",
              "prescribedQuestions": 6,
              "estimatedMinutes": 9,
              "rationale": {
                "reasonCode": "SPACED_MEMORY_DECAY_OVERDUE",
                "description": "Spaced revision for \"Basic Percentage Calculation\" is overdue by 4 days. Immediate review required to prevent memory loss."
              },
              "executionIntent": {
                "capability": "REVISION_PRACTICE",
                "revisionItemId": "65b999888777666555444333",
                "topic": "Percentage",
                "pattern": "Basic Percentage Calculation",
                "questionDelivery": {
                  "endpoint": "/api/v1/adaptive/next-question",
                  "method": "GET",
                  "params": {
                    "userId": "student-1",
                    "topic": "Percentage",
                    "pattern": "Basic Percentage Calculation"
                  }
                },
                "attemptSubmissionContext": {
                  "endpoint": "/api/v1/attempts",
                  "method": "POST",
                  "source": "revision",
                  "revisionItemId": "65b999888777666555444333"
                }
              }
            }
          ]
        },
        {
          "segmentIndex": 2,
          "segmentName": "CORE_CURRICULUM",
          "segmentBudget": 24,
          "allocatedQuestions": 10,
          "activities": [
            {
              "actionId": "nba_curriculum_advancement_algebra_linear-equations-systems-of-equations",
              "actionType": "CURRICULUM_ADVANCEMENT",
              "actionSubtype": "DAILY_OBJECTIVE_TARGET",
              "policyPriorityClass": 2,
              "urgencyScore": 55.0,
              "priorityTier": "high",
              "topic": "Algebra",
              "pattern": "Linear Equations & Systems of Equations",
              "prescribedQuestions": 10,
              "estimatedMinutes": 15,
              "rationale": {
                "reasonCode": "DAILY_CURRICULUM_QUOTA",
                "description": "Daily study plan target for \"Linear Equations & Systems of Equations\". 10 questions remaining to complete objective."
              },
              "executionIntent": {
                "capability": "ADAPTIVE_PRACTICE",
                "topic": "Algebra",
                "pattern": "Linear Equations & Systems of Equations",
                "planId": "65b1234567890abcdef12345",
                "questionDelivery": {
                  "endpoint": "/api/v1/adaptive/next-question",
                  "method": "GET",
                  "params": {
                    "userId": "student-1",
                    "topic": "Algebra",
                    "pattern": "Linear Equations & Systems of Equations",
                    "planId": "65b1234567890abcdef12345"
                  }
                },
                "attemptSubmissionContext": {
                  "endpoint": "/api/v1/attempts",
                  "method": "POST",
                  "source": "practice"
                }
              }
            }
          ]
        },
        {
          "segmentIndex": 3,
          "segmentName": "PACING_OR_BENCHMARK",
          "segmentBudget": 14,
          "allocatedQuestions": 5,
          "activities": [
            {
              "actionId": "nba_pacing_calibration_percentage_all",
              "actionType": "PACING_CALIBRATION",
              "actionSubtype": "RUSHING_REMEDIATION",
              "policyPriorityClass": 2,
              "urgencyScore": 37.5,
              "priorityTier": "normal",
              "topic": "Percentage",
              "pattern": null,
              "prescribedQuestions": 5,
              "estimatedMinutes": 8,
              "rationale": {
                "reasonCode": "HIGH_RUSHING_RISK_DETECTED",
                "description": "Overall rushing risk is high: 68.0% of classified errors were fast rushing errors. Complete a deliberate 5-question pacing drill on the current focus topic: Percentage."
              },
              "executionIntent": {
                "capability": "ADAPTIVE_PRACTICE",
                "topic": "Percentage",
                "pattern": null,
                "planId": "65b1234567890abcdef12345",
                "questionDelivery": {
                  "endpoint": "/api/v1/adaptive/next-question",
                  "method": "GET",
                  "params": {
                    "userId": "student-1",
                    "topic": "Percentage"
                  }
                },
                "attemptSubmissionContext": {
                  "endpoint": "/api/v1/attempts",
                  "method": "POST",
                  "source": "practice"
                }
              }
            }
          ]
        }
      ],
      "checkpoints": [
        {
          "checkpointId": "rest_between_1_2",
          "checkpointType": "COGNITIVE_REST",
          "afterSegmentIndex": 1,
          "beforeSegmentIndex": 2,
          "prescribedQuestions": 0,
          "estimatedMinutes": 10,
          "rationale": {
            "reasonCode": "FATIGUE_DROP_OFF_DETECTED",
            "description": "Stamina analysis indicates greater than 25% fatigue drop-off. Take a 10-minute cognitive rest before the next learning segment."
          },
          "executionIntent": null
        },
        {
          "checkpointId": "rest_between_2_3",
          "checkpointType": "COGNITIVE_REST",
          "afterSegmentIndex": 2,
          "beforeSegmentIndex": 3,
          "prescribedQuestions": 0,
          "estimatedMinutes": 10,
          "rationale": {
            "reasonCode": "FATIGUE_DROP_OFF_DETECTED",
            "description": "Stamina analysis indicates greater than 25% fatigue drop-off. Take a 10-minute cognitive rest before the next learning segment."
          },
          "executionIntent": null
        }
      ]
    }
  },
  "meta": {
    "referenceNow": "2026-10-06T18:00:00.000Z"
  }
}
```

#### 35.2.2 Fallback State (Diagnostic Agenda)
```json
{
  "success": true,
  "data": {
    "status": "insufficient_data",
    "reason": "NEW_USER_NO_HISTORY",
    "agenda": {
      "dailyQuestionBudget": 10,
      "totalPrescribedQuestions": 10,
      "totalEstimatedMinutes": 15,
      "segments": [
        {
          "segmentIndex": 1,
          "segmentName": "CORE_CURRICULUM",
          "segmentBudget": 10,
          "allocatedQuestions": 10,
          "activities": [
            {
              "actionId": "nba_diagnostic_assessment_foundational_diagnostic_algebra_linear-equations-systems-of-equations",
              "actionType": "DIAGNOSTIC_ASSESSMENT",
              "actionSubtype": "FOUNDATIONAL_DIAGNOSTIC",
              "policyPriorityClass": null,
              "urgencyScore": null,
              "priorityTier": "normal",
              "topic": "Algebra",
              "pattern": "Linear Equations & Systems of Equations",
              "prescribedQuestions": 10,
              "estimatedMinutes": 15,
              "rationale": {
                "reasonCode": "NEW_STUDENT_BASELINE",
                "description": "Initial diagnostic assessment on foundational pattern \"Linear Equations & Systems of Equations\"."
              },
              "executionIntent": {
                "capability": "DIAGNOSTIC_ASSESSMENT",
                "deliveryMode": "SEQUENTIAL_ADAPTIVE",
                "prescribedQuestionCount": 10,
                "topic": "Algebra",
                "pattern": "Linear Equations & Systems of Equations",
                "questionDelivery": {
                  "endpoint": "/api/v1/adaptive/next-question",
                  "method": "GET",
                  "params": {
                    "userId": "usr_newbie",
                    "topic": "Algebra",
                    "pattern": "Linear Equations & Systems of Equations"
                  }
                },
                "attemptSubmissionContext": {
                  "endpoint": "/api/v1/attempts",
                  "method": "POST",
                  "source": "practice"
                }
              }
            }
          ]
        }
      ],
      "checkpoints": []
    }
  },
  "meta": {
    "referenceNow": "2026-10-06T18:00:00.000Z"
  }
}
```

#### 35.2.3 Empty Agenda State (No-Eligible-Action)
```json
{
  "success": true,
  "data": {
    "status": "calculated",
    "reason": "NO_ELIGIBLE_ACTION",
    "agenda": {
      "dailyQuestionBudget": 30,
      "totalPrescribedQuestions": 0,
      "totalEstimatedMinutes": 0,
      "segments": [],
      "checkpoints": []
    }
  },
  "meta": {
    "referenceNow": "2026-10-06T18:00:00.000Z"
  }
}
```

#### 35.2.4 Active Mock Agenda State
```json
{
  "success": true,
  "data": {
    "status": "active_mock_in_progress",
    "reason": "ACTIVE_MOCK_SESSION_EXISTS",
    "activeMockSessionId": "65b555444333222111000aaa",
    "agenda": {
      "dailyQuestionBudget": 0,
      "totalPrescribedQuestions": 0,
      "totalEstimatedMinutes": 0,
      "segments": [],
      "checkpoints": []
    }
  },
  "meta": {
    "referenceNow": "2026-10-06T18:00:00.000Z"
  }
}
```

---

### 35.3 `GET /api/v1/orchestration/interventions` Variants

#### 35.3.1 Normal Success State (Showing Prerequisite Bottleneck & Rushing Calibration)
```json
{
  "success": true,
  "data": {
    "status": "calculated",
    "interventions": [
      {
        "interventionId": "intv_prerequisite_bottleneck_ratio-and-proportion_ratio-basics_blocks_time-and-work-problems",
        "category": "PREREQUISITE_BOTTLENECK",
        "severity": "critical",
        "topic": "Ratio and Proportion",
        "pattern": "Ratio Basics",
        "blockedTarget": {
          "topic": "Time and Work",
          "pattern": "Time and Work Problems"
        },
        "rationale": "Prerequisite \"Ratio Basics\" (35% mastery) blocks curriculum target \"Time and Work Problems\"."
      },
      {
        "interventionId": "intv_rushing_calibration_percentage_all",
        "category": "RUSHING_CALIBRATION",
        "severity": "normal",
        "topic": "Percentage",
        "pattern": null,
        "blockedTarget": null,
        "rationale": "Overall rushing risk is high: 68.0% of classified errors were fast rushing errors. Complete a deliberate 5-question pacing drill on the current focus topic: Percentage."
      }
    ]
  },
  "meta": {
    "referenceNow": "2026-10-06T18:00:00.000Z"
  }
}
```

#### 35.3.2 Empty Interventions State
```json
{
  "success": true,
  "data": {
    "status": "calculated",
    "interventions": []
  },
  "meta": {
    "referenceNow": "2026-10-06T18:00:00.000Z"
  }
}
```

#### 35.3.3 Interventions During Active Mock (Remains Observable)
```json
{
  "success": true,
  "data": {
    "status": "calculated",
    "interventions": [
      {
        "interventionId": "intv_prerequisite_bottleneck_ratio-and-proportion_ratio-basics_blocks_time-and-work-problems",
        "category": "PREREQUISITE_BOTTLENECK",
        "severity": "critical",
        "topic": "Ratio and Proportion",
        "pattern": "Ratio Basics",
        "blockedTarget": {
          "topic": "Time and Work",
          "pattern": "Time and Work Problems"
        },
        "rationale": "Prerequisite \"Ratio Basics\" (35% mastery) blocks curriculum target \"Time and Work Problems\"."
      }
    ]
  },
  "meta": {
    "referenceNow": "2026-10-06T18:00:00.000Z"
  }
}
```

---

### 35.4 Comprehensive Field Dictionary & Precision Matrix

| Field Path | Type | Required | Nullable | Source | Precision / Allowed Values |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `status` | String | Yes | No | Controller State | `'calculated'`, `'partial_data'`, `'insufficient_data'`, `'active_mock_in_progress'` |
| `reason` | String | Yes | No | Arbitration State | `'NEXT_ACTION_RESOLVED'`, `'NEW_USER_NO_HISTORY'`, `'NO_ACTIVE_STUDY_PLAN'`, `'NO_ELIGIBLE_ACTION'`, `'ACTIVE_MOCK_SESSION_EXISTS'`, `'DAILY_AGENDA_ASSEMBLED'` |
| `activeMockSessionId` | String | Conditional — required iff status === `'active_mock_in_progress'` | No | `MockSession._id` | Valid 24-char hex string when active mock exists; absent otherwise |
| `nextAction` | Object | Yes | Yes | Arbiter Output | Object containing the single prescribed action, or `null` for `NO_ELIGIBLE_ACTION` / `ACTIVE_MOCK_SESSION_EXISTS` |
| `nextAction.actionId` | String | Conditional — required iff `nextAction != null` | No | Template Generator | Deterministic slug identifier |
| `nextAction.actionType` | String | Conditional — required iff `nextAction != null` | No | Taxonomy | Exactly the 6 canonical action types: `'PREREQUISITE_REMEDIATION'`, `'RETENTION_RESCUE'`, `'CURRICULUM_ADVANCEMENT'`, `'PACING_CALIBRATION'`, `'EXAM_BENCHMARK'`, `'DIAGNOSTIC_ASSESSMENT'` (`COGNITIVE_REST` is strictly prohibited) |
| `nextAction.actionSubtype` | String | Conditional — required iff `nextAction != null` | No | Taxonomy | Exactly the 8 canonical action subtypes: `'BLOCKING_PREREQUISITE'`, `'OVERDUE_REVISION'`, `'DUE_TODAY_REVISION'`, `'DAILY_OBJECTIVE_TARGET'`, `'RUSHING_REMEDIATION'`, `'GOAL_BENCHMARK_MOCK'`, `'FOUNDATIONAL_DIAGNOSTIC'`, `'FOUNDATIONAL_REINFORCEMENT'` (`FATIGUE_PREVENTION_PAUSE` is strictly prohibited) |
| `nextAction.policyPriorityClass` | Number | Conditional — required iff `nextAction != null` | Yes | Arbitration | `0`, `1`, `2`, or `null` for diagnostic fallbacks |
| `nextAction.urgencyScore` | Number | Conditional — required iff `nextAction != null` | Yes | Scoring Model | Raw IEEE-754 double rounded to 2 decimals for DTO; `null` for diagnostic fallbacks |
| `nextAction.priorityTier` | String | Conditional — required iff `nextAction != null` | No | Scoring / Fallback | Strictly `'critical'`, `'urgent'`, `'high'`, `'normal'`, `'low'` (`'medium'` is strictly prohibited) |
| `nextAction.topic` | String | Conditional — required iff `nextAction != null` | Yes | Candidate Data | Canonical topic string or `null` for `EXAM_BENCHMARK` |
| `nextAction.pattern` | String | Conditional — required iff `nextAction != null` | Yes | Candidate Data | Canonical pattern string or `null` for `PACING_CALIBRATION` and `EXAM_BENCHMARK` |
| `nextAction.prescribedQuestions` | Number | Conditional — required iff `nextAction != null` | No | Allocator / Policy | Integer strictly: `5` for pacing, `10` for diagnostics, `0` for benchmark, $\le 15$ for curriculum, $\min(10, \text{budget})$ for retention |
| `nextAction.estimatedMinutes` | Number | Conditional — required iff `nextAction != null` | Yes | Speed-Accuracy | Integer ceil: minutes; `null` for `EXAM_BENCHMARK` prior to blueprint selection |
| `nextAction.rationale.reasonCode` | String | Conditional — required iff `nextAction != null` | No | Template Enum | Reason code string |
| `nextAction.rationale.description` | String | Conditional — required iff `nextAction != null` | No | Template Compiler | Non-empty descriptive string |
| `nextAction.executionIntent` | Object | Conditional — required iff `nextAction != null` | No | Intent Builder | Discriminated union of 4 types (`AdaptivePracticeIntent`, `RevisionPracticeIntent`, `MockAssessmentIntent`, `DiagnosticAssessmentIntent`) |
| `agenda.dailyQuestionBudget` | Number | Yes | No | Budgeter | Integer $\in [10, 50]$, or `0` for active mock |
| `agenda.totalPrescribedQuestions` | Number | Yes | No | Assembler | Integer sum of prescribed questions across all segment activities ($\le \text{dailyQuestionBudget}$) |
| `agenda.totalEstimatedMinutes` | Number | Yes | No | Assembler | Integer ceil: sum of all admitted activity durations plus checkpoint minutes |
| `agenda.segments[]` | Array | Yes | No | Assembler | Array of operational segments (omitted if 0 activities admitted) |
| `agenda.segments[].segmentIndex` | Number | Yes | No | Assembler | 1-based contiguous integer index (`1..N`) |
| `agenda.segments[].segmentName` | String | Yes | No | Segment Taxonomy | `'WARMUP_RETRIEVAL'`, `'PREREQUISITE_UNBLOCKING'`, `'CORE_CURRICULUM'`, `'PACING_OR_BENCHMARK'` |
| `agenda.segments[].segmentBudget` | Number | Yes | No | Allocator | Integer question budget allocated to segment |
| `agenda.segments[].allocatedQuestions` | Number | Yes | No | Allocator | Integer sum of questions allocated to admitted activities in segment |
| `agenda.segments[].activities[]` | Array | Yes | No | Assembler | Array of canonical Learning Action DTOs (strictly zero checkpoints in activities) |
| `agenda.checkpoints[]` | Array | Yes | No | Assembler | Array of `CognitiveRestCheckpoint` (length $\max(0, N - 1)$ when fatigue drop-off $> 25\%$; empty `[]` otherwise) |
| `agenda.checkpoints[].checkpointId` | String | Yes | No | Assembler | Deterministic ID string (e.g. `rest_between_1_2`) |
| `agenda.checkpoints[].checkpointType` | String | Yes | No | Checkpoint Taxonomy | Strictly `'COGNITIVE_REST'` |
| `agenda.checkpoints[].afterSegmentIndex` | Number | Yes | No | Assembler | 1-based index of the immediately preceding admitted learning segment |
| `agenda.checkpoints[].beforeSegmentIndex` | Number | Yes | No | Assembler | 1-based index of the immediately succeeding admitted learning segment |
| `agenda.checkpoints[].prescribedQuestions` | Number | Yes | No | Checkpoint Spec | Strictly `0` |
| `agenda.checkpoints[].estimatedMinutes` | Number | Yes | No | Checkpoint Spec | Strictly `10` |
| `agenda.checkpoints[].rationale.reasonCode` | String | Yes | No | Checkpoint Spec | Strictly `'FATIGUE_DROP_OFF_DETECTED'` |
| `agenda.checkpoints[].rationale.description` | String | Yes | No | Checkpoint Spec | Non-empty descriptive string |
| `agenda.checkpoints[].executionIntent` | Null | Yes | Yes | Checkpoint Spec | Strictly `null` |
| `interventions[]` | Array | Yes | No | Policy Engine | Array of active diagnostic intervention cards (empty `[]` if none) |
| `interventions[].interventionId` | String | Yes | No | Template Generator | Deterministic `intv_...` template string |
| `interventions[].category` | String | Yes | No | Category Enum | `'PREREQUISITE_BOTTLENECK'`, `'RUSHING_CALIBRATION'` |
| `interventions[].severity` | String | Yes | No | Derived PriorityTier | Strictly matches corresponding action `priorityTier`: `'critical'`, `'urgent'`, `'high'`, `'normal'`, `'low'` |
| `interventions[].topic` | String | Yes | No | Candidate Data | Canonical topic string |
| `interventions[].pattern` | String | Conditional — required iff category === `'PREREQUISITE_BOTTLENECK'` | Yes | Candidate Data | Canonical pattern string or `null` for `RUSHING_CALIBRATION` |
| `interventions[].blockedTarget` | Object | Conditional — required iff category === `'PREREQUISITE_BOTTLENECK'` | Yes | Candidate Data | `{ topic, pattern }` of blocked curriculum pattern, or `null` for `RUSHING_CALIBRATION` |
| `interventions[].rationale` | String | Yes | No | Template Compiler | Non-empty rationale description |
| `meta.referenceNow` | String | Yes | No | Request Clock | ISO-8601 UTC timestamp string |

---

## 36. Centralized Error Contracts

Phase 9 constructs standard platform errors using `new AppError(statusCode, code, message)`:

```text
HTTP Status   Error Code                            Condition
──────────────────────────────────────────────────────────────────────────────────────────
400           VALIDATION_ERROR                      Missing/malformed userId or goalId syntax
403           FORBIDDEN                             Goal belongs to another user
404           USER_NOT_FOUND                        User does not exist
404           GOAL_NOT_FOUND                        Provided goalId does not exist
409           FINALIZATION_IN_PROGRESS              User has a mock session finalizing
500           ORCHESTRATION_CALCULATION_FAILED      Internal calculation or assembly failure
```

---

## 37. Performance Bounds & Zero-Write Boundary

1. **Bounded Scanning**: Attempts are queried exclusively via bounded windows or Phase 8 aggregations. No unbounded collection scans.
2. **Batch Reading**: `StudentProgress` and `RevisionItem` documents are fetched in batch using `$in` queries where applicable.
3. **Zero Writes**: Phase 9 strictly executes zero write operations across all collections.
4. **Zero LLM Calls**: Phase 9 does not instantiate LLM adapters or make outbound HTTP calls to generative models.

---

## 38. Future Module Plan & Test Strategy

### 38.1 Future Module Structure:
```text
src/config/orchestrationConfig.js
src/middlewares/orchestrationGuard.js
src/controllers/orchestrationController.js
src/routes/orchestrationRoutes.js
src/services/orchestration/
  urgencyScoringService.js
  candidateGenerationService.js
  nextActionArbiter.js
  dailyAgendaAssembler.js
  interventionPolicyService.js
  executionIntentBuilder.js
  orchestrationUtils.js
```

### 38.2 Future Test Suite Plan (7 Suites):
1. `tests/orchestration/orchestrationGuard.test.js`
2. `tests/orchestration/urgencyScoring.test.js`
3. `tests/orchestration/nextActionArbiter.test.js`
4. `tests/orchestration/dailyAgendaAssembler.test.js`
5. `tests/orchestration/interventionPolicies.test.js`
6. `tests/orchestration/orchestrationApiIntegration.test.js`
7. `tests/orchestration/phase9CrossPhaseIsolation.test.js`

### 38.3 Verification Test Assertions:
The test suites will verify all reconciled contracts:
- **Canonical action taxonomy**:
  - `canonical action types count == 6`
  - `canonical action subtypes count == 8`
  - `COGNITIVE_REST is not an actionType`
  - `FATIGUE_PREVENTION_PAUSE is not an actionSubtype`
  - `COGNITIVE_REST never appears as nextAction`
  - `agenda activity arrays contain only canonical learning actions`
- **Cognitive rest ergonomic checkpoints**:
  - `rest checkpoints do not affect MAX_AGENDA_ACTIVITIES`
  - `rest checkpoints consume 0 question budget`
  - `N active learning segments with high fatigue produce exactly max(0, N - 1) checkpoints`
  - `checkpoint placement is strictly between segments`
  - `no rest checkpoint before the first segment and no rest checkpoint after final segment`
  - `totalEstimatedMinutes includes rest duration (10 minutes per checkpoint)`
- **Explicit goalId plan isolation**: goal A explicitly requested, goal A has no active plan, goal B has active plan $\to$ goal B plan MUST NOT be selected; `selectedActivePlan = null`.
- **Pacing raw question count**: `rawQuestions(PACING_CALIBRATION)` is exactly 5 across candidate generation, agenda allocation, execution DTOs, rationales, duration, and tests.
- **Retention question sizing**: `rawRetentionQuestions = Math.min(10, remainingRevisionBudget)`. Requires `remainingRevisionBudget >= 1`. No fixed retention value of 5 remains.
- **Continuous deadline proximity bonus**: Exact continuous formula boundaries. Past date ($rawDays \le 0$) yields $daysToDeadline = 0$ and bonus $5.0$. Zero bucketed discretizations.
- **Exam benchmark scoring**: $W_{\text{type}} = 25.0$, $S_{\text{deficit}} = 0.0$, $I_{\text{goal}} = \min(15.0, 10.0 + D_{\text{bonus}})$, $T_{\text{temporal}} = 0.0$. Zero double-counting.
- **Curriculum advancement scoring**: $W_{\text{type}} = 30.0$, $S_{\text{deficit}} = \max(0, 1-M)*25$, $I_{\text{goal}} = \min(15.0, 10.0 + D_{\text{bonus}})$, $T_{\text{temporal}} = 0.0$.
- **Intervention severity**: Exactly equals the corresponding deterministic action `priorityTier`. Zero `'medium'` severities.
- **Verified intervention IDs**: Matches `intv_prerequisite_bottleneck_...` and `intv_rushing_calibration_...` templates.
- **Live registry foundational first pattern**: Topic `"Algebra"`, Pattern `"Linear Equations & Systems of Equations"`.
- **Phase 8 speed matrix DTO consumption**: Consumes `speedAccuracyMatrix.medianTimeCorrectSeconds`.
- **Execution intent discriminated union**: Validates all four capability forms (`AdaptivePracticeIntent`, `RevisionPracticeIntent`, `MockAssessmentIntent`, `DiagnosticAssessmentIntent`).
- **Revision intent preservation**: Emits `source: 'revision'` and `revisionItemId`.
- **Diagnostic sequential adaptive intent**: Emits `deliveryMode: 'SEQUENTIAL_ADAPTIVE'` and `prescribedQuestionCount: 10`.
- **No-eligible-action contract**: Valid known user with empty candidates yields `status: 'calculated'`, `reason: 'NO_ELIGIBLE_ACTION'`, `nextAction: null`, empty agenda segments, and empty interventions list via `sendSuccess`.
- **Fully populated DTO schemas**: Validates all success, fallback, empty, and active mock schemas with exact field conditionality (`nextAction.*` conditionally required iff `nextAction != null`).
- **Unified budget conservation**: $\sum \text{allocatedQuestions} \le \text{dailyQuestionBudget}$.
- **Zero database writes**: Proof of 0 mutations across all 13 models.

---

## 39. Phase 9 Implementation Readiness Checklist

- [x] Proposal policy contracts preserved
- [x] Source-derived factual discrepancies reconciled
- [x] Explicit goalId cannot fall through to unrelated active plan
- [x] Exactly three GET endpoints
- [x] Six action types / eight subtypes
- [x] Cognitive rest is checkpoint-only
- [x] Canonical action type count remains exactly 6
- [x] Canonical action subtype count remains exactly 8
- [x] nextAction field conditionality matches null states
- [x] checkpoint DTO is completely frozen
- [x] Policy classes exact (Class 0, Class 1, Class 2, Fallbacks)
- [x] Urgency formulas exact ($W_{\text{type}} + S_{\text{deficit}} + I_{\text{goal}} + T_{\text{temporal}}$)
- [x] Continuous deadline bonus restored (linear continuous formula, max 5.0)
- [x] EXAM_BENCHMARK T_temporal = 0
- [x] Pacing raw count = 5
- [x] Retention raw count contract is min(10, remainingRevisionBudget)
- [x] No conflicting retention count remains
- [x] Intervention severity = priorityTier
- [x] Intervention IDs match proposal (`intv_...`)
- [x] Foundational first pattern verified against actual registry (`Algebra` / `Linear Equations & Systems of Equations`)
- [x] Phase 8 speed return shape verified against actual service (`speedAccuracyMatrix.medianTimeCorrectSeconds`)
- [x] ExecutionIntent discriminated union supports all four capability forms
- [x] Revision intent preserves source='revision'
- [x] No eligible-action DTO frozen
- [x] All fallback DTOs frozen
- [x] All active-mock DTOs frozen
- [x] All normal success DTOs frozen
- [x] No placeholder DTO comments remain
- [x] Pacing factuality preserved (student-level rushing risk + anchor topic)
- [x] Budget conservation exact
- [x] Action caps exact (max 4 activities)
- [x] Stamina guards exact
- [x] Cognitive rest placement exact (between segments, 10 minutes)
- [x] Zero writes
- [x] Zero LLM calls
- [x] Zero new collections
- [x] Exactly 13 models
- [x] Zero dependencies
- [x] Baseline Jest passes
- [x] Phase 2 verification passes
- [x] 12,000/12,000 fingerprints match
- [x] Zero Phase 9 production files created

---

========================================================
PHASE 9 DESIGN — VERIFIED

READY TO BEGIN IMPLEMENTATION
========================================================
