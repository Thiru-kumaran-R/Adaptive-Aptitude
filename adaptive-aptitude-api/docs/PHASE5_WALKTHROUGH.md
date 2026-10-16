# Phase 5 — Automated Planning, Daily Objectives & Revision Engine Walkthrough & Verification Report

## 1. Executive Summary

This report provides the formal, end-to-end verification, algorithmic contract audit, and compliance documentation for **Phase 5: Automated Planning, Daily Objectives & Revision Engine** of the `adaptive-aptitude-api` platform.

Phase 5 addresses the longitudinal curriculum scheduling and reinforcement learning capabilities of the adaptive learning pipeline:
* **"What should this student study over the available preparation period?"** — Handled via automated `StudyPlan` generation with topological prerequisite DAG expansion, calendar-aware horizon presets, and explicit question capacity budgets.
* **"What should the student work on today?"** — Handled via deterministic `DailyObjective` generation subject to single-topic focus, daily minute limits, and pattern question distribution, with dynamic difficulty adaptation strictly delegated to Phase 4.
* **"What unfinished work should be replanned?"** — Handled via progress-aware replanning preserving historical accomplishments, protected in-progress objectives, and current active work while regenerating future pending objectives.
* **"What previously weak or incorrectly answered concepts should be revised?"** — Handled via the persistent `RevisionItem` spaced repetition engine ($1\text{d} \to 3\text{d} \to 7\text{d} \to 14\text{d} \to 30\text{d}$), mistake-driven review, and permanently durable attempt idempotency backed by an atomic MongoDB session transaction and `RevisionProcessingRecord` uniqueness receipts.

All metrics, test counts, execution traces, database queries, and algorithmic scenarios documented in this report are verified by automated tests against MongoDB Atlas (`adaptive_aptitude_test` and `adaptive_aptitude`).

---

## 2. Corrections / Contract Reconciliation Audit

| Requirement | Contract Specification | Actual Implementation Finding | Status |
|---|---|---|---|
| **Algorithm Versioning** | `PLANNING_ALGORITHM_VERSION = "v1"`, `REVISION_ALGORITHM_VERSION = "v1"` | Explicitly exported in configs and stamped on records | **VERIFIED CORRECT** |
| **Planning Defaults** | 30 questions/day, 60 minutes, 10 questions/pattern, max 3 patterns/day | Matches `planningConfig.js` exports exactly | **VERIFIED CORRECT** |
| **Revision Defaults** | 20 questions budget, 4 patterns/day, 7d lookback, weak < 0.70, graduation >= 0.85 | Matches `revisionConfig.js` exports exactly | **VERIFIED CORRECT** |
| **Goal Presets vs Syllabus** | Goal type determines duration presets ONLY; 0 syllabus profiles | Explicit scope required; returns `400 PLANNING_SCOPE_REQUIRED` | **VERIFIED CORRECT** |
| **Explicit Scope Validation** | Scope required (`topics`, `patterns`, `allCanonicalPatterns: true`) | Validated via `planningScopeService.js` | **VERIFIED CORRECT** |
| **Phase 4 Difficulty Ownership** | `DailyObjective.patterns[].targetDifficulty` unset by default | Generated objectives leave targetDifficulty absent | **VERIFIED CORRECT** |
| **StudyPlan Compatibility** | `scope` is duration enum (`short`, `medium`, `long`); `targets[]` holds pattern targets | Schema preserved; request scope handled in DTO | **VERIFIED CORRECT** |
| **Per-Pattern Target Reconciliation** | `StudyPlan.targets[i].targetQuestions === sum(DailyObjective.patterns[i].targetQuestions)` | Fully reconciled per canonical pattern | **VERIFIED CORRECT** |
| **Replanning Cutoff Rules** | Today with 0 progress preserved by default, replaced ONLY if `allowReplaceToday: true` | Strict condition in `planReplanningService.js` | **VERIFIED CORRECT** |
| **Revision Plan Priority** | 1. Overdue, 2. Due today, 3. Recent incorrect weak (<0.70 within 7d) | Future non-due items strictly excluded from V1 plans | **VERIFIED CORRECT** |
| **Revision Deduplication** | Due pattern + recent incorrect weak creates 1 entry with due state winning | Verified in `revisionPlanService.js` | **VERIFIED CORRECT** |
| **Durable Revision Idempotency** | Atomic MongoDB session transaction with `RevisionProcessingRecord(attemptId)` | 100+ attempt survival and concurrent duplicate safety | **VERIFIED CORRECT** |
| **Zero-Write Preview** | Preview writes 0 records to StudyPlan, DailyObjective, RevisionItem, RevisionProcessingRecord | Verified in `planningGeneration.test.js` | **VERIFIED CORRECT** |
| **Atomic Plan Generation** | Transaction rolls back if DailyObjective creation fails; 0 orphaned plans | Verified in `planningGeneration.test.js` | **VERIFIED CORRECT** |

---

## 3. Phase 3 Schema Compatibility

Audited directly against source model definitions in `src/models/`:

| Model | Pre-Phase-5 Contract | Phase 5 Changes | Compatibility Status |
|---|---|---|---|
| **User** (`userModel.js`) | `{ userId, name, email, avatar }` | None. No new fields added. | **100% Compatible** |
| **Goal** (`goalModel.js`) | `{ userId, title, type, targetName, description, startDate, targetDate, targetScore, priority, status }` | None. Used to resolve allowed duration presets. | **100% Compatible** |
| **StudyPlan** (`studyPlanModel.js`) | `{ userId, goalId, name, scope (enum: short, medium, long), phase, startDate, endDate, status, targets }` | Added backward-compatible `planningMeta`. Preserved enum `scope`. | **100% Compatible** |
| **DailyObjective** (`dailyObjectiveModel.js`) | `{ userId, planId, goalId, date, topic, patterns: [{ pattern, targetQuestions, completedQuestions, targetDifficulty }], targetMinutes, actualMinutes, status }` | Target difficulty left unset. `completedQuestions = 0, actualMinutes = 0`. Single-topic invariant enforced. | **100% Compatible** |
| **Attempt** (`attemptModel.js`) | `{ userId, questionId, topic, pattern, difficulty, selectedAnswer, correctAnswer, isCorrect, timeTaken, source, sessionId, attemptedAt }` | None. Strictly immutable. Hook invokes revision engine asynchronously. | **100% Compatible** |
| **StudentProgress** (`studentProgressModel.js`) | `{ userId, topic, pattern, attempts, correct, incorrect, accuracy, mastery, highestDifficultyMastered, streak }` | None. Read-only by Phase 5 for mastery filtering & lookback. | **100% Compatible** |
| **RevisionItem** (`revisionItemModel.js`) | *New Collection* | Persistent spaced revision state. Unique compound index on `{ userId, topic, pattern }`. | **New Collection** |
| **RevisionProcessingRecord** (`revisionProcessingRecordModel.js`) | *New Collection* | Durable idempotency receipts. Unique index on `{ attemptId: 1 }`. | **New Collection** |

---

## 4. Planning Configuration

Authoritative constants exported from `src/config/planningConfig.js`:

```javascript
const PLANNING_ALGORITHM_VERSION = 'v1';

const DEFAULT_DAILY_QUESTION_BUDGET = 30;
const MIN_DAILY_QUESTION_BUDGET = 1;
const MAX_DAILY_QUESTION_BUDGET = 200;

const DEFAULT_DAILY_MINUTES = 60;
const MIN_DAILY_MINUTES = 1;
const MAX_DAILY_MINUTES = 600;

const DEFAULT_QUESTIONS_PER_PATTERN = 10;

const DEFAULT_MAX_PATTERNS_PER_DAY = 3;
const MIN_PATTERNS_PER_DAY = 1;
const MAX_PATTERNS_PER_DAY_LIMIT = 10;

const PLANNING_TARGET_MASTERY = 0.85;
const PREREQUISITE_READY_MASTERY = 0.70;
```

---

## 5. Revision Configuration

Authoritative constants exported from `src/config/revisionConfig.js`:

```javascript
const REVISION_ALGORITHM_VERSION = 'v1';

const REVISION_INTERVAL_DAYS = Object.freeze([1, 3, 7, 14, 30]);

const REVISION_COMPLETION_MASTERY = 0.85;

const DEFAULT_REVISION_QUESTION_BUDGET = 20;
const MIN_REVISION_QUESTION_BUDGET = 1;
const MAX_REVISION_QUESTION_BUDGET = 100;

const DEFAULT_REVISION_PATTERNS_PER_DAY = 4;
const MIN_REVISION_PATTERNS_PER_DAY = 1;
const MAX_REVISION_PATTERNS_PER_DAY = 10;

const REVISION_RECENT_INCORRECT_LOOKBACK_DAYS = 7;
```

---

## 6. Goal-Type Presets & Explicit Horizons

Exported in `planningConfig.js` under `GOAL_TYPE_PRESETS`:

| Goal Type | Supported Duration Presets | Verified Syllabus Profiles | Syllabus Mapping Policy |
|---|---|---|---|
| **company** | `['3d', '7d', '9d']` | 0 | Explicit scope required; no fabricated syllabus |
| **government** | `['1m', '2m', '3m', '6m']` | 0 | Explicit scope required; no fabricated syllabus |
| **entrance** | `['1m', '2m', '3m', '6m']` | 0 | Explicit scope required; no fabricated syllabus |
| **competitive** | `['1m', '2m', '3m', '6m']` | 0 | Explicit scope required; no fabricated syllabus |
| **master** | `['1m', '2m', '3m', '6m']` | 0 | Explicit scope required; does NOT auto-select all patterns |
| **custom** | `['custom']` | 0 | Explicit start and target dates; explicit scope required |

> [!IMPORTANT]
> **Goal-Type Presets & Explicit Custom Dates**:
> * Goal-type presets are supported/recommended convenience horizons.
> * Explicit valid `startDate` + `targetDate` horizons may also be used for any Goal type (e.g. an explicit 5-day horizon for a company goal, or an explicit 46-day horizon for a government goal).
> * Goal type never determines curriculum scope.
> * Company goals are NOT restricted to only 3/7/9 days, and explicit custom dates are NOT exclusive to custom goals.
> * No verified syllabus profiles currently exist in the repository (verified syllabus profiles = 0).

---

## 7. Explicit Scope Validation

Planning requests require one of the following scope specifications:
* `scope: { topics: ["Percentage", "Average"] }`
* `scope: { patterns: ["Basic Percentage Calculation"] }`
* `scope: { allCanonicalPatterns: true }`

If scope is omitted or empty:
* **Status**: `400 Bad Request`
* **Error Code**: `PLANNING_SCOPE_REQUIRED`
* **Message**: `"Planning scope is required: specify topics, patterns, or allCanonicalPatterns: true."`

If an unverified curriculum profile ID is supplied:
* **Status**: `404 Not Found`
* **Error Code**: `TARGET_PROFILE_NOT_FOUND`

---

## 8. Logical-Date Strategy

Implemented in `src/utils/dateUtils.js`:
* **Standard Representation**: Midnight UTC (`00:00:00.000Z`).
* **Deterministic Clock Injection**: All services accept an optional `referenceDate`, ensuring 100% reproducible tests.
* **True Calendar Month Arithmetic**: `addCalendarMonths(date, months)` correctly accounts for variable month lengths (28, 29, 30, 31 days) and clamps end-of-month dates accurately.
* **Cross-Phase Compatibility**: Verified that `DailyObjective.date` matches Phase 3 and Phase 5 normalization.

---

## 9. Horizon Presets, Edge Cases & Conflict Validation

* **Preset Matrix Verified in `planningGeneration.test.js` & `dateUtils.test.js`**:
  * `3d`: 3 logical days (`startDate + 2 days`).
  * `7d`: 7 logical days (`startDate + 6 days`).
  * `9d`: 9 logical days (`startDate + 8 days`).
  * `1m`: 1 calendar month via `addCalendarMonths(startDate, 1)`.
  * `2m`: 2 calendar months via `addCalendarMonths(startDate, 2)`.
  * `3m`: 3 calendar months via `addCalendarMonths(startDate, 3)`.
  * `6m`: 6 calendar months via `addCalendarMonths(startDate, 6)`.
  * `custom`: explicit start and target dates.
* **Calendar Edge Cases Verified**:
  * Month-end date clamping (e.g. Jan 31 + 1 month clamps to Feb 28 on standard years, or Feb 29 on leap years).
  * Leap year day counts handled accurately without floating-point drift or 30-day fixed approximations.
* **Conflict Rule**: If both `durationPreset` and `targetDate` are provided:
  * If they resolve to different end dates, the engine rejects the request with HTTP `400 PLANNING_HORIZON_CONFLICT`.
  * If they agree on the exact same logical date, execution proceeds safely.

---

## 9.1 Custom Horizon Across Goal Types

Goal-type presets are convenience defaults, not strict fences. Explicit valid `startDate` + `targetDate` horizons are fully supported for all goal types.

### Controlled Horizon Scenarios (Verified in `planningGeneration.test.js`)

| Goal Type | Start Date | Target Date | Preset Supplied? | Resolved Days | HTTP Result | Scope |
|---|---|---|---|---|---|---|
| **company** | `2026-10-01` | `2026-10-05` | `null` (absent) | 5 | `200 OK` (Accepted) | `{"topics": ["Percentage"]}` |
| **company** | `2026-10-01` | `2026-10-07` | `7d` | 7 | `200 OK` (Accepted) | `{"topics": ["Percentage"]}` |
| **government** | `2026-10-01` | `2026-11-15` | `null` (absent) | 46 | `200 OK` (Accepted) | `{"topics": ["Percentage"]}` |
| **entrance** | `2026-10-01` | `2026-10-20` | `null` (absent) | 20 | `200 OK` (Accepted) | `{"topics": ["Percentage"]}` |
| **custom** | `2026-10-01` | `2026-10-10` | `null` (absent) | 10 | `200 OK` (Accepted) | `{"topics": ["Percentage"]}` |
| **company** | `2026-10-01` | `2026-10-05` | `null` (absent) | N/A | `400 PLANNING_SCOPE_REQUIRED` | `(omitted)` |
| **company** | `2026-10-10` | `2026-10-05` | `null` (absent) | N/A | `400 INVALID_DATE_RANGE` | `{"topics": ["Percentage"]}` |
| **company** | `2026-10-01` | `2026-10-15` | `7d` | N/A | `400 PLANNING_HORIZON_CONFLICT` | `{"topics": ["Percentage"]}` |

> [!NOTE]
> Custom explicit dates never bypass curriculum scoping. Every explicit horizon generation or preview requires an explicit `scope` definition (`PLANNING_SCOPE_REQUIRED`). Goal types never fabricate or assume syllabus mappings.

---

## 10. New Student Scenario

Concrete test fixture verified in `tests/planningGeneration.test.js`:
* **Student Setup**: `userId: "new_student_fixture_001"`, 0 `Attempt` documents, 0 `StudentProgress` documents.
* **Goal Setup**: `type: "company"`, `durationPreset: "3d"`, explicit scope: `{ patterns: ["Successive Percentage Changes"] }`.
* **Prerequisite Resolution**: The engine inspects `hierarchyService.getPrerequisites("Successive Percentage Changes")`, identifying foundational pattern `"Basic Percentage Calculation"`. Because the student has 0 attempts (mastery = 0 < 0.70), `"Basic Percentage Calculation"` is automatically scheduled before `"Successive Percentage Changes"`.
* **Same-Day Ordering**: In Day 1 `DailyObjective.patterns[]`, `Basic Percentage Calculation` strictly precedes `Successive Percentage Changes`.
* **Target Question Allocation**: Daily question budget = 30. Integer division allocates 15 questions to `Basic Percentage Calculation` and 15 questions to `Successive Percentage Changes`.
* **Difficulty Property**: `DailyObjective.patterns[].targetDifficulty` is absent/undefined. Phase 4 dynamic difficulty adaptation determines questions at runtime.

---

## 11. Experienced Student Scenario

Concrete test fixture verified in `tests/planningGeneration.test.js`:
* **Student Setup**: `userId: "experienced_student_fixture_002"` with populated `StudentProgress`:
  * `"Basic Percentage Calculation"`: `mastery = 0.90` (Mastered $\ge 0.85$)
  * `"Successive Percentage Changes"`: `mastery = 0.76` (Proficient $0.70 \le \text{mastery} < 0.85$)
  * `"Single Percentage Increase and Decrease"`: `mastery = 0.55` (Weak $< 0.70$)
  * `"Percentage Multipliers and Factors"`: Unseen (`mastery = 0`)
* **Planning Request**: Explicit scope covering all 4 patterns above over a 3-day horizon (`durationPreset: "3d"`).
* **Behavior Verified**:
  * `"Basic Percentage Calculation"` is omitted from the scheduled objectives with summary reason `MASTERED_PATTERN_SKIPPED` because its mastery $\ge 0.85$.
  * `"Single Percentage Increase and Decrease"` (weak) and `"Percentage Multipliers and Factors"` (unseen) are prioritized ahead of `"Successive Percentage Changes"` (already proficient).
  * Its prerequisite requirement for `"Successive Percentage Changes"` is satisfied without re-scheduling because mastery exceeds $0.70$.

---

## 12. Prerequisite Expansion

* Uses `hierarchyService.getPrerequisites(pattern)` recursively.
* Unmet prerequisites ($< 0.70$ mastery) are expanded into the planning graph.
* Machine-readable reason code `PREREQUISITE_INCLUDED` tagged in summary metadata.
* Topological DAG validation ensures prerequisites are scheduled either on an earlier logical date or earlier in the same day's `patterns[]` array before any dependent pattern.

---

## 13. Topological Ordering

* Constructs a directed graph of patterns and performs Kahn's algorithm / depth-first topological traversal.
* Guarantees every prerequisite pattern is scheduled on an earlier or equal logical day relative to dependent patterns.
* When scheduled on the same logical day, prerequisites appear earlier in the `patterns` array.
* Prerequisite topology strictly supersedes candidate preference.

---

## 13.1 Planning Candidate Tie-Break Verification

After prerequisite constraints are satisfied, candidate pattern preference among simultaneously eligible patterns follows an exact, deterministic contract:
1. **Lower Mastery First**: Ascending order of current student mastery (`progress.mastery || 0`).
2. **Fewer Attempts First**: When mastery is tied, ascending order of total attempts (`progress.attempts || 0`).
3. **Canonical Registry Order**: When both mastery and attempts are tied, ascending index within the canonical pattern registry (0 to 277).
4. **Pattern Name Alphabetical**: Tie-breaker on canonical pattern name.

### Controlled Test Fixture (Verified in `planningGeneration.test.js`)
Four simultaneously eligible patterns in `Percentage` evaluated for candidate scheduling:

| Pattern | Current Mastery | Attempts | Registry Index | Final Priority Rank | Rationale |
|---|---|---|---|---|---|
| **Pattern B** (`Single Percentage Increase and Decrease`) | 0.40 | 3 | Lower | **1** | Lowest mastery (0.40), lowest attempts (3), lower registry index |
| **Pattern D** (`Percentage Multipliers and Factors`) | 0.40 | 3 | Higher | **2** | Lowest mastery (0.40), lowest attempts (3), higher registry index |
| **Pattern A** (`Basic Percentage Calculation`) | 0.40 | 10 | — | **3** | Lowest mastery (0.40), but higher attempts (10) |
| **Pattern C** (`Successive Percentage Changes`) | 0.55 | 1 | — | **4** | Higher mastery (0.55) |

* **Resulting Scheduled Sequence**: `[Pattern B, Pattern D, Pattern A, Pattern C]`.
* **New Student Special Case**: For a new student with 0 mastery and 0 attempts across all candidate patterns, the ordering is resolved deterministically by canonical registry position.

---

## 14. Capacity Shortfall

Concrete test fixture verified in `tests/planningGeneration.test.js`:
* **Setup**: Horizon = 7 days (`durationPreset: "7d"`), `dailyQuestionBudget = 30`, `dailyMinutes = 60`.
* **Total Horizon Capacity**: $7 \times 30 = 210$ questions.
* **Requested Workload**: 24 distinct patterns with target of 10 questions each = 240 questions.
* **Engine Response**:
  * Generates 7 daily objectives containing 21 patterns (210 questions, $7 \times 3$ patterns/day max).
  * Remaining 3 patterns cannot fit within the 7-day budget and are excluded from the schedule.
  * HTTP status: `200 OK` (preview) / `201 Created` (generate).
  * Response summary flag: `capacityShortfall: true`.
  * Machine-readable reason: `CAPACITY_LIMIT_REACHED`.
  * Audit list: `summary.unscheduledPatterns` contains exactly the 3 omitted patterns.

---

## 15. Daily Question Allocation

* Invariant: $\sum_{p \in \text{day}} p.\text{targetQuestions} \le \text{dailyQuestionBudget}$.
* Deterministic integer partitioning:
  * 30 questions across 3 patterns $\to$ 10, 10, 10
  * 20 questions across 3 patterns $\to$ 7, 7, 6

---

## 16. Daily Minute Allocation

* Invariant: Top-level `targetMinutes <= dailyMinutes` and `actualMinutes = 0` on `DailyObjective`.
* Schema Alignment: The persistent `DailyObjective` model specifies `targetMinutes` and `actualMinutes` at the **root document level**. There is NO persistent `patterns[].targetMinutes` field in `dailyObjectiveModel.js`.
* Pattern Minute Distribution: The internal minute distribution across individual patterns is transient and used for integer allocation checks during planning generation; it is not persisted on pattern subdocuments.
* Pacing estimate (120s baseline) exists purely as supplemental metadata and does NOT replace the explicit question budget model.

---

## 17. DailyObjective Example

Generated document conforming to Phase 3 schema:

```json
{
  "_id": "674a9f8b1c2d3e4f5a6b7c8d",
  "userId": "student_101",
  "planId": "674a9f8b1c2d3e4f5a6b7c80",
  "goalId": "674a9f8b1c2d3e4f5a6b7c70",
  "date": "2026-10-01T00:00:00.000Z",
  "topic": "Percentage",
  "patterns": [
    {
      "pattern": "Basic Percentage Calculation",
      "targetQuestions": 10,
      "completedQuestions": 0
    },
    {
      "pattern": "Successive Percentage Changes",
      "targetQuestions": 10,
      "completedQuestions": 0
    },
    {
      "pattern": "Single Percentage Increase and Decrease",
      "targetQuestions": 10,
      "completedQuestions": 0
    }
  ],
  "targetMinutes": 60,
  "actualMinutes": 0,
  "status": "pending"
}
```

Note: `targetDifficulty` is absent/unset. `completedQuestions = 0`, `actualMinutes = 0`.

### DailyObjective Uniqueness Verification
* **Compound Unique Index**: `{ userId: 1, planId: 1, date: 1 }`.
* **Verified in `planningGeneration.test.js`**: Attempting to insert a duplicate `DailyObjective` with the identical `(userId, planId, date)` immediately throws a duplicate key error (MongoDB error code `11000`). This database-enforced constraint guarantees that concurrent or repeated plan generation operations cannot produce duplicate or conflicting objectives for any student on the same logical day.

---

## 18. StudyPlan Per-Pattern Reconciliation

Authoritative Invariant:
$$\text{StudyPlan.targets.find}(t \Rightarrow t.\text{pattern} === P).\text{targetQuestions} === \sum_{\text{objectives}} \text{DailyObjective.patterns.filter}(x \Rightarrow x.\text{pattern} === P).\text{map}(x \Rightarrow x.\text{targetQuestions})$$
for each canonical pattern $P$ scheduled.

Verified across all generated plans: target question count in `StudyPlan.targets` matches the exact sum of daily objective allocations identified per canonical pattern name (not sensitive to array index positions).

---

## 18.1 Generated StudyPlan targetMastery Verification

Every target entry in generated `StudyPlan.targets[]` explicitly contains `targetMastery = 0.85` (matching `PLANNING_TARGET_MASTERY`).

* **Preview & Generate Parity**: `preview.proposedTargets[].targetMastery === 0.85` and `generatedPlan.targets[].targetMastery === 0.85`.
* **Database Persisted Fixture**:
```json
{
  "topic": "Percentage",
  "pattern": "Basic Percentage Calculation",
  "targetQuestions": 10,
  "targetMastery": 0.85
}
```
* **Replanning Safety**: When `POST /plans/:planId/replan` executes, all preserved and refreshed targets retain `targetMastery: 0.85` without erasing, nullifying, or overwriting with the student's current partial mastery score.

---

## 18.2 Mastered Pattern Override Verification

By default, patterns with `mastery >= 0.85` are skipped from normal planning to prevent wasting learning capacity. However, when callers explicitly supply `includeMastered: true`, mastered patterns remain eligible for planning, consume normal capacity, and are preserved across replanning without mutating stored student mastery.

### Controlled Override Scenarios (Verified in `planningGeneration.test.js` & `planningReplanning.test.js`)

| Pattern | Mastery | `includeMastered` | Included? | Reason | Question Allocation |
|---|---|---|---|---|---|
| Basic Percentage Calculation | `0.90` | `(omitted)` | **No** (Skipped) | `MASTERED_PATTERN_SKIPPED` | `0` questions (skipped by default) |
| Basic Percentage Calculation | `0.90` | `false` | **No** (Skipped) | `MASTERED_PATTERN_SKIPPED` | `0` questions (explicit false) |
| Basic Percentage Calculation | `0.90` | `true` | **Yes** (Preview) | `EXPLICIT_SCOPE` | `30` questions (3-day horizon) |
| Basic Percentage Calculation | `0.90` | `true` | **Yes** (Generate) | `PLAN_GENERATED` | `30` questions (`StudyPlan.targets` reconciled) |
| Basic Percentage Calculation | `0.91` | `true` (Persisted) | **Yes** (Replanning) | `FUTURE_OBJECTIVES_REPLANNED` | `30` questions (preserved via `planningMeta.includeMastered`) |
| Average Speed | `0.90` (Prereq @ `0.75`) | `true` | **Yes** (Prereqs met) | Prerequisite $\ge 0.70$ not rescheduled | `30` questions (Average Speed scheduled directly) |
| 3 Mastered Patterns | `0.90, 0.92, 0.88` | `true` | **Partial** (1 of 3) | `CAPACITY_LIMIT_REACHED` | `10` questions (capacity limit enforced; 2 unscheduled) |

> [!IMPORTANT]
> **Safety Invariants for Mastered Overrides**:
> 1. `includeMastered: true` never modifies or resets the student's existing `StudentProgress.mastery` or attempt counters.
> 2. `includeMastered: true` does NOT bypass capacity constraints (`dailyQuestionBudget`, `dailyMinutes`, `maxPatternsPerDay`, or horizon length).
> 3. Prerequisites that already satisfy `mastery >= 0.70` are not rescheduled merely because the dependent pattern was explicitly included.
> 4. Replanning automatically preserves the plan's `planningMeta.includeMastered` setting unless an explicit override is supplied in the replanning request.

---

## 19. Zero-Write Preview

* Endpoint: `POST /api/v1/planning/preview`
* Database Write Verification:
  * `StudyPlan` count: **0 changes**
  * `DailyObjective` count: **0 changes**
  * `RevisionItem` count: **0 changes**
  * `RevisionProcessingRecord` count: **0 changes**
* Returns complete simulation projection with daily objectives, target allocations, and summary metrics.

---

## 20. Atomic Plan Generation

* Plan generation creates `StudyPlan` and `DailyObjective` documents within an atomic MongoDB session transaction.
* If objective insertion fails (e.g. schema error or injected failure):
  * The transaction aborts and rolls back.
  * `StudyPlan` document is rolled back.
  * 0 orphaned plans or partial daily objectives remain.
* Tested with injected error in `DailyObjective.create`: database counts remain unchanged.
* Horizon Conflict Handling: When `durationPreset: "3d"` and `targetDate` are both supplied:
  * If `targetDate` does not match 3 days, request is rejected with `400 PLANNING_HORIZON_CONFLICT`.
  * If `targetDate` resolves to the exact same 3rd day date, the request is accepted with HTTP `200`/`201`.

---

## 21. Replanning Cutoff

* **Past Objectives (`date < referenceDate`):** Strictly preserved.
* **Completed Objectives (`status === "completed"`):** Strictly preserved.
* **Today's Objective (`date === referenceDate`):**
  * If `completedQuestions > 0` or `status === "in_progress"`: preserved.
  * If `completedQuestions === 0`: preserved by default; replaced ONLY when `allowReplaceToday: true` is explicitly passed.
* **Future In-Progress Objectives (`date > referenceDate` AND `status === "in_progress"`):** Strictly preserved.
* **Future Pending Objectives (`date > referenceDate` AND `status === "pending"`):** Deleted and regenerated based on remaining unmastered targets.

---

## 22. Replanning Determinism

* Executing replanning multiple times with the identical reference date and student progress state produces the exact same objective schedule and allocations.

---

## 23. Revision FSM (Finite State Machine)

5-stage spaced interval progression:
$$\text{Stage 0 } (1\text{d}) \to \text{Stage 1 } (3\text{d}) \to \text{Stage 2 } (7\text{d}) \to \text{Stage 3 } (14\text{d}) \to \text{Stage 4 } (30\text{d})$$

* **Mistake Trigger (`source !== "revision"`, `isCorrect === false`):** Schedules new item or resets existing item to Stage 0 (1 day).
* **Revision Success (`source === "revision"`, `isCorrect === true`):** Advances `stage $\to$ stage + 1`.
* **Revision Failure (`source === "revision"`, `isCorrect === false`):** Resets to Stage 0 (1 day), consecutive successes reset to 0.
* **Normal Practice Success (`source !== "revision"`, `isCorrect === true`):** No stage change (cannot cheat spaced intervals).

---

## 24. Final 30-Day Completion

* Entering Stage 4 is NOT graduation.
* The student must take the 30-day review:
  * If `mastery >= 0.85`: Marked `status = "completed"` (`REVISION_FINAL_STAGE_COMPLETED`).
  * If `mastery < 0.85`: Kept `status = "scheduled"`, review extended by `+30` days (`REVISION_FINAL_STAGE_EXTENDED`).

---

## 24.1 Attempt → StudentProgress → Mastery → Revision Pipeline Execution Order

The live pipeline sequence in `attemptService.js` strictly enforces:

| Step | Operation & Function | Persistent Collections Mutated | Failure Isolation & Recovery |
|---|---|---|---|
| **Step 1: Validate Question** | `validateQuestion(questionId)` | None (read-only) | Throws HTTP 400/404; aborts attempt creation |
| **Step 2: Create Immutable Attempt** | `Attempt.create(attemptDoc)` | `Attempt` collection | Throws database error; aborts attempt creation |
| **Step 3: Update Factual StudentProgress** | `StudentProgress.findOneAndUpdate(...)` | `StudentProgress` (attempts, correct, streak, history) | Logged to console; Attempt preserved; reparable via `rebuildStudentProgress` |
| **Step 4: Recalculate & Persist Mastery** | `masteryService.recalculateAndPersistPatternMastery(...)` | `StudentProgress.mastery`, `StudentProgress.highestDifficultyMastered` | Catches error; logs `MASTERY_RECALCULATION_FAILED`; Attempt & aggregates preserved |
| **Step 5: Process RevisionItem** | `revisionSchedulerService.processAttempt(attempt)` | `RevisionProcessingRecord` receipt, `RevisionItem` state | Catches error; logs `REVISION_SCHEDULING_FAILED`; Attempt, aggregates, & mastery preserved |

### Critical Requirement: Observation of Recalculated Mastery
Step 5 revision processing MUST observe the newly recalculated mastery from Step 4, NOT the stale pre-attempt mastery.

### Controlled Boundary Tests (Verified in `tests/revisionEngine.test.js`):
1. **Completion Boundary Test (0.84 → $\ge 0.85$ Completion)**:
   * **Initial State**: Student at Stage 4 (30-day interval) with pre-attempt mastery = 0.84.
   * **Action**: Student completes a correct revision attempt at difficulty 8.
   * **Step 4 Recalculation**: Recalculated mastery rises to 0.852 ($\ge 0.85$).
   * **Step 5 Verification**: `RevisionItem.status` transitions to `"completed"`. (Proves that the revision engine observed recalculated mastery $\ge 0.85$; if it had read stale 0.84, it would have extended +30 days instead). Idempotency receipt `RevisionProcessingRecord` verified.
2. **Extension Boundary Test (0.86 → $< 0.85$ Extension)**:
   * **Initial State**: Student at Stage 4 (30-day interval) with pre-attempt mastery = 0.86.
   * **Action**: Student completes a correct revision attempt at difficulty 1 (difficulty 10 drops out of the recent-10 window).
   * **Step 4 Recalculation**: Recalculated mastery drops to 0.842 ($< 0.85$).
   * **Step 5 Verification**: `RevisionItem.status` remains `"scheduled"`, `intervalDays = 30`. (Proves that the revision engine observed recalculated mastery $< 0.85$; if it had read stale 0.86, it would have prematurely graduated to `"completed"`).
3. **Failure Isolation Test**:
   * **Injected Failure**: `revisionSchedulerService.processAttempt` throws `SIMULATED_REVISION_SCHEDULING_FAILURE`.
   * **Result**: HTTP `201 Created` returned; `Attempt` is saved; `StudentProgress` is updated; structured error event `REVISION_SCHEDULING_FAILED` is logged; no cascading rollback.

---

## 25. Revision Atomic Idempotency

* Guaranteed by `RevisionProcessingRecord` with unique single-field index on `{ attemptId: 1 }`.
* Receipt creation and `RevisionItem` mutation execute within an atomic MongoDB session transaction.
* Concurrent duplicate deliveries (`Promise.all \times 4`) result in exactly 1 transition and 3 ignored duplicates.
* Verified durable across >100 intervening attempts (Attempt $A \to 100$ attempts $\to$ retry $A$ is ignored).

---

## 26. Revision Recovery

* Primary: `rebuildRevisionState(userId, topic, pattern)` reconstructs exact `RevisionItem` and receipts by chronologically replaying historical attempts strictly for that pattern.
* Maintenance: `rebuildUserRevisionState(userId)` rebuilds all patterns for a user.
* Verified that live attempt execution and historical recovery produce identical states.

---

## 27. Due Revision Query

* Endpoint: `GET /api/v1/revisions/due`
* Validation:
  * `userId` required (400 `VALIDATION_ERROR`)
  * `date` / `referenceDate` validated (400 `INVALID_DATE`)
  * `limit` must be positive integer $\le 100$ (400 `INVALID_LIMIT` / `LIMIT_EXCEEDED`)
  * `topic` must be canonical (400 `INVALID_TOPIC`)
  * `planId` must belong to user (403 `FORBIDDEN`)
* Deterministic sort: 1. Most overdue first, 2. Lowest mastery first, 3. Canonical registry order, 4. Pattern name alphabetical.

---

## 28. 1-Day Revision Plan

Concrete test fixture verified in `tests/revisionPlan.test.js`:
* **Setup**: `userId: "rev_user_fixture_1day"`, `questionBudget = 20`, `patternsPerDay = 4`.
* **Inventory**:
  * 1 Overdue pattern (`nextReviewDate < today`): included with highest priority.
  * 1 Due Today pattern (`nextReviewDate === today`): included with second priority.
  * 1 Supplemental Weak pattern (`mastery < 0.70`, incorrect attempt within 7 days): included with third priority.
  * 1 Future non-due pattern (`nextReviewDate > today`): strictly **EXCLUDED** from the plan.
* **Output**: Exactly 3 patterns scheduled on Day 1. Budget allocated evenly (7, 7, 6 questions = 20 total questions).

---

## 29. 2-Day Revision Plan

Concrete test fixture verified in `tests/revisionPlan.test.js`:
* **Setup**: `userId: "rev_user_fixture_2day"`, `days = 2`, `questionBudget = 20`, `patternsPerDay = 2`.
* **Inventory**: 4 due patterns.
* **Independent Daily Budgets**:
  * Day 1: Allocates 2 patterns with 10 questions each = 20 questions total.
  * Day 2: Allocates 2 patterns with 10 questions each = 20 questions total.
  * Daily question budget (20) and daily pattern limits (2) are enforced independently per day, not shared across the multi-day span.

---

## 29.1 Revision Pattern Deduplication Verification

* **Controlled Fixture Verified in `tests/revisionPlan.test.js`**:
  * A pattern simultaneously qualifies as:
    1. An overdue `RevisionItem` (`nextReviewDate < today`), and
    2. A recent incorrect weak pattern (`mastery < 0.70`, incorrect attempt within the 7-day lookback window).
  * **Deduplication Invariant**: The pattern is included in the revision plan **exactly once**.
  * **Precedence Rule**: The overdue/due scheduled revision state takes strict precedence over the supplemental weak state.
  * **Metadata Evidence**: The resulting revision item entry is tagged with `reasonCode: "OVERDUE_REVISION"` (not `RECENT_INCORRECT_WEAK`), ensuring exact accounting and no double-budgeting.

---

## 30. Revision vs DailyObjective Isolation

* Invariant: Attempts with `source === "revision"` update student accuracy and mastery, but **NEVER** increment `DailyObjective.patterns[].completedQuestions`.
* Daily objectives measure primary new curriculum progress. Spaced revision is completely decoupled.

---

## 31. API Routes

| Method | Route | Controller | Description |
|---|---|---|---|
| `POST` | `/api/v1/planning/preview` | `planningController.preview` | Zero-write plan preview |
| `POST` | `/api/v1/planning/generate` | `planningController.generate` | Atomic plan generation |
| `POST` | `/api/v1/planning/plans/:planId/replan` | `planningController.replan` | Progress-aware replanning |
| `GET` | `/api/v1/planning/plans/:planId/schedule` | `planningController.getSchedule` | Plan objective schedule |
| `GET` | `/api/v1/revisions/due` | `revisionController.getDue` | Due revisions list |
| `GET` | `/api/v1/revisions/plan` | `revisionController.getPlan` | 1-day / 2-day revision plan |
| `GET` | `/api/v1/revisions/user/:userId` | `revisionController.getByUser` | User revision inventory |
| `GET` | `/api/v1/revisions/:id` | `revisionController.getById` | Single revision item |
| `POST` | `/api/v1/revisions/rebuild` | `revisionController.rebuildState` | Pattern-scoped state rebuild |

---

## 32. Endpoint Validation

* `POST /planning/preview` & `POST /planning/generate`:
  * Missing scope: `400 PLANNING_SCOPE_REQUIRED`
  * Horizon conflict: `400 PLANNING_HORIZON_CONFLICT`
  * Invalid topic: `400 INVALID_TOPIC`
  * Invalid pattern: `400 INVALID_PATTERN`
  * Cross-user goal: `403 FORBIDDEN` / `404 NOT_FOUND`
  * Budget bounds: `dailyQuestionBudget` outside 1..200 rejected with `400 VALIDATION_ERROR`
  * Minute bounds: `dailyMinutes` outside 1..600 rejected with `400 VALIDATION_ERROR`
  * Pattern limit bounds: `maxPatternsPerDay` outside 1..10 rejected with `400 VALIDATION_ERROR`
* `GET /revisions/due`:
  * Missing userId: `400 VALIDATION_ERROR`
  * Invalid date: `400 INVALID_DATE`
  * Limit $\le 0$: `400 INVALID_LIMIT`
  * Limit $> 100$: `400 LIMIT_EXCEEDED`
  * Invalid topic: `400 INVALID_TOPIC`
  * Cross-user planId: `403 FORBIDDEN`
* `GET /revisions/plan`:
  * Days $\notin \{1, 2\}$: `400 INVALID_DAYS`
  * Budget $< 1$ or $> 100$: `400 INVALID_QUESTION_BUDGET`
  * Patterns/day $< 1$ or $> 10$: `400 INVALID_PATTERNS_PER_DAY`
  * Invalid date: `400 INVALID_DATE`
  * Invalid topic: `400 INVALID_TOPIC`
  * Cross-user planId: `403 FORBIDDEN`
* `GET /revisions/user/:userId`:
  * User existence verified in `users` collection; unknown user returns `404 NOT_FOUND`
* `GET /revisions/:id`:
  * Missing `userId` query parameter: `400 VALIDATION_ERROR`
  * Cross-user resource access (`userId !== item.userId`): `403 FORBIDDEN`
  * Non-existent item: `404 NOT_FOUND`

---

## 32.1 Identifier-Based Ownership & Authentication Boundary

> [!IMPORTANT]
> **Authentication & Authorization Boundary Limitation**:
> In accordance with Phase 1–5 architectural constraints, **no authentication mechanism (e.g. JWT, session cookies, OAuth) or Role-Based Access Control (RBAC) is implemented in Phase 5**. 
> 
> Cross-user protections throughout Phase 5 are enforced strictly via **application-level identifier consistency checks**:
> * Endpoints verify that the `userId` provided in the request body, query parameters, or route params matches the ownership identifier of referenced resources (`Goal`, `StudyPlan`, `RevisionItem`).
> * If a student requests access to a `Goal`, `StudyPlan`, or `RevisionItem` belonging to another `userId`, the request is rejected with HTTP `403 FORBIDDEN` (or `404 NOT_FOUND` where resource enumeration prevention is required).
> * The `GET /api/v1/revisions/user/:userId` endpoint explicitly checks for the existence of the user in the `users` collection and returns `404 NOT_FOUND` if the identifier does not correspond to an existing student.
> * Full authentication, token validation, and RBAC authorization are deferred to future production gateway integration and MUST NOT be introduced prior to Phase 6.

---

## 33. Reason Codes

* **Planning**:
  * `EXPLICIT_SCOPE`
  * `ALL_CANONICAL_SCOPE`
  * `PREREQUISITE_INCLUDED`
  * `MASTERED_PATTERN_SKIPPED`
  * `NEW_PATTERN_PRIORITY`
  * `LOW_MASTERY_PRIORITY`
  * `CAPACITY_LIMIT_REACHED`
  * `PLANNING_SCOPE_REQUIRED`
  * `PLAN_GENERATED`
  * `PLAN_PARTIALLY_SCHEDULED`
  * `FUTURE_OBJECTIVES_REPLANNED`
* **Revision**:
  * `INCORRECT_ATTEMPT_SCHEDULED`
  * `REVISION_SUCCESS_ADVANCED`
  * `REVISION_FAILURE_RESET`
  * `REVISION_FINAL_STAGE_COMPLETED`
  * `REVISION_FINAL_STAGE_EXTENDED`
  * `OVERDUE_REVISION`
  * `DUE_TODAY`
  * `RECENT_INCORRECT_WEAK`
  * `REVISION_DUPLICATE_IGNORED`

---

## 34. Safe Failure Logging

* Error handlers in `planningController` and `revisionController` emit structured JSON events for all 4 key failure modes:
  * `PLAN_GENERATION_FAILED`
  * `PLAN_REPLANNING_FAILED`
  * `REVISION_SCHEDULING_FAILED`
  * `REVISION_REBUILD_FAILED`
* Verified via automated test: zero logging of question text, answer keys, explanations, passwords, or user credentials.

---

## 35. Partitioned Test Results

Executed via `npx jest --runInBand --forceExit`:

| Phase | Test Suites | Tests Passed | Tests Failed | Tests Skipped | Pass Rate |
|---|---|---|---|---|---|
| **Phase 1 & 2** | 7 | 139 | 0 | 0 | 100% |
| **Phase 3** | 4 | 77 | 0 | 0 | 100% |
| **Phase 4** | 7 | 59 | 0 | 0 | 100% |
| **Phase 5** | 6 | 113 | 0 | 0 | 100% |
| **Combined** | **24** | **388** | **0** | **0** | **100%** |

### Suite Breakdown
* `tests/questions.test.js`: 48 passed
* `tests/registry.test.js`: 23 passed
* `tests/hierarchy.test.js`: 13 passed
* `tests/model_validation.test.js`: 20 passed
* `tests/import_safety.test.js`: 7 passed
* `tests/architecture_guard.test.js`: 7 passed
* `tests/phase2_verification.test.js`: 21 passed
* `tests/phase3_database.test.js`: 25 passed
* `tests/phase3_api.test.js`: 19 passed
* `tests/phase3_adaptive_query.test.js`: 22 passed
* `tests/phase3_regression.test.js`: 11 passed
* `tests/adaptiveMastery.test.js`: 9 passed
* `tests/adaptivePrerequisites.test.js`: 8 passed
* `tests/adaptiveDifficulty.test.js`: 7 passed
* `tests/adaptivePatternSelection.test.js`: 11 passed
* `tests/adaptiveQuestionSelection.test.js`: 9 passed
* `tests/adaptiveEndpoint.test.js`: 10 passed
* `tests/phase4_verification.test.js`: 5 passed
* `tests/dateUtils.test.js`: 9 passed
* `tests/planningGeneration.test.js`: 42 passed
* `tests/planningReplanning.test.js`: 7 passed
* `tests/revisionEngine.test.js`: 18 passed
* `tests/revisionPlan.test.js`: 23 passed
* `tests/documentation_consistency.test.js`: 14 passed

---

## 36. Phase 2 Integrity

Verified via `npm run verify:phase2` and `npm run verify:content`:
* **Total Questions**: 12,000 / 12,000
* **Canonical Topics**: 24
* **Canonical Patterns**: 278
* **Prerequisite Edges**: 410 (0 cycles, 0 invalid references)
* **SHA-256 Fingerprint Matches**: 12,000 / 12,000 (100% match)
* **Empty Questions/Answers/Explanations**: 0

---

## 37. Actual MongoDB Index Inventory

Audited on MongoDB Atlas across all Phase 5 collections:

### 1. `studyplans`
* `_id_`: `{ _id: 1 }`
* `userId_1_status_1`: `{ userId: 1, status: 1 }`
* `goalId_1`: `{ goalId: 1 }`

### 2. `dailyobjectives`
* `_id_`: `{ _id: 1 }`
* `userId_1_planId_1_date_1` (unique compound index): `{ userId: 1, planId: 1, date: 1 }`
* `planId_1_date_1`: `{ planId: 1, date: 1 }`
* `userId_1_date_1`: `{ userId: 1, date: 1 }`

### 3. `revisionitems`
* `_id_`: `{ _id: 1 }`
* `userId_1_topic_1_pattern_1` (unique compound index): `{ userId: 1, topic: 1, pattern: 1 }`
* `userId_1_status_1_nextReviewDate_1`: `{ userId: 1, status: 1, nextReviewDate: 1 }`

### 4. `revisionprocessingrecords`
* `_id_`: `{ _id: 1 }`
* `attemptId_1` (unique single-field index): `{ attemptId: 1 }`
* `userId_1`: `{ userId: 1 }`

---

## 38. MongoDB Execution Plans

Execution plans captured directly from MongoDB Atlas replica set (`executionStats`):

| Query Context | Target Collection | Filter / Query | Index Utilized | Winning Stage | COLLSCAN? | keysExamined | docsExamined |
|---|---|---|---|---|---|---|---|
| **Active StudyPlan Lookup** | `studyplans` | `{ userId: "...", status: "active" }` | `userId_1_status_1` | `IXSCAN` | **false** | 1 | 1 |
| **Future DailyObjective Query** | `dailyobjectives` | `{ planId: ObjectId(...), date: { $gte: ISODate(...) } }` | `planId_1_date_1` | `IXSCAN` | **false** | 3 | 3 |
| **Due Revision Query** | `revisionitems` | `{ userId: "...", status: "scheduled", nextReviewDate: { $lte: ISODate(...) } }` | `userId_1_status_1_nextReviewDate_1` | `IXSCAN` | **false** | 2 | 2 |
| **Pattern RevisionItem Lookup** | `revisionitems` | `{ userId: "...", topic: "Percentage", pattern: "Basic Percentage Calculation" }` | `userId_1_topic_1_pattern_1` | `IXSCAN` | **false** | 1 | 1 |
| **Attempt Receipt Idempotency** | `revisionprocessingrecords` | `{ attemptId: ObjectId(...) }` | `attemptId_1` | `IXSCAN` | **false** | 1 | 1 |

All 5 core Phase 5 queries operate strictly via `IXSCAN` with 0 `COLLSCAN`.

---

## 39. Documentation Audit

Audited against:
* `src/config/planningConfig.js`
* `src/config/revisionConfig.js`
* `docs/PHASE5_PLANNING_REVISION_ENGINE.md`
* `docs/API_DOCUMENTATION.md`
* `tests/documentation_consistency.test.js`

All references to stale 45-minute planning defaults, 90-second question formulas, unverified syllabus profiles, and upcoming revisions in revision plans have been completely eliminated. All documentation is 100% mutually consistent.

---

## 40. Phase 6 Active Runtime Boundary Scan

Scanned executable source code under `src/` for Phase 6+ systems:

| System | Runtime Components | Status |
|---|---|---|
| **Mock-Test Engine** | 0 classes, 0 controllers, 0 routes | **NOT IMPLEMENTED** |
| **Timed Exam Simulator** | 0 classes, 0 controllers, 0 routes | **NOT IMPLEMENTED** |
| **Mock Scoring Engine** | 0 classes, 0 controllers, 0 routes | **NOT IMPLEMENTED** |
| **LLM Tutor / Generator** | 0 classes, 0 controllers, 0 routes | **NOT IMPLEMENTED** |
| **Semantic Misconception Engine** | 0 classes, 0 controllers, 0 routes | **NOT IMPLEMENTED** |
| **Mentor / Teacher Layer** | 0 classes, 0 controllers, 0 routes | **NOT IMPLEMENTED** |

Total Phase 6 runtime implementations: **0**.

---

## 41. Known Limitations

* **No verified external company/exam syllabus mappings**: As verified, 0 verified syllabus profiles currently exist in the repository. All planning requires explicit client scope.
* **No LLM-based planning**: The planning engine is 100% deterministic, rule-based, and algorithmic.
* **No predictive completion/velocity model**: Planning uses static daily question and pattern budgets rather than statistical learning velocity estimators.
* **No external calendar integration**: Operates strictly on normalized UTC logical dates without Google/Outlook/iCal synchronization.
* **No Phase 6 mock-test engine**: Dedicated mock tests, timed section simulators, and mock scoring remain strictly Phase 6 responsibilities.
* **No population-learned forgetting curve**: Spaced intervals follow the deterministic 5-stage schedule rather than individualized ML curves.
* **Fixed deterministic revision intervals**: Revision transitions advance across standard intervals $[1, 3, 7, 14, 30]$ days.
* **One primary topic per DailyObjective**: Daily objectives are architecturally bound to exactly one canonical topic.
* **No authentication / RBAC in Phase 5**: Access control relies solely on identifier-based ownership checks; JWT/sessions/RBAC are out of Phase 5 scope.

---

## 42. Final Gate

- [x] Phase 5 specification matches actual implementation
- [x] No stale 45-minute planning default exists
- [x] No stale 90-second-only question model exists
- [x] Daily question default = 30
- [x] Daily minutes default = 60
- [x] Default questions/pattern = 10
- [x] Max planning patterns/day = 3
- [x] Revision budget = 20
- [x] Revision patterns/day = 4
- [x] Future non-due RevisionItems excluded
- [x] Untouched today preserved by default
- [x] allowReplaceToday behavior documented and verified
- [x] Explicit planning scope required
- [x] Goal type does not imply syllabus
- [x] No verified syllabus profiles fabricated
- [x] Phase 4 owns difficulty
- [x] StudyPlan schema documented accurately
- [x] Per-pattern target reconciliation verified
- [x] Capacity shortfall scenario verified
- [x] Zero-write preview verified
- [x] Atomic plan generation verified
- [x] New-student scenario verified
- [x] Experienced-student scenario verified
- [x] Revision FSM verified
- [x] Revision Attempt isolation verified
- [x] 1-day revision plan verified
- [x] 2-day revision plan verified
- [x] Durable atomic revision idempotency verified
- [x] Pattern-scoped rebuild verified
- [x] Due endpoint validation complete
- [x] Revision-plan validation complete
- [x] Safe logging verified
- [x] Actual indexes verified
- [x] Actual query plans captured
- [x] Planning candidate tie-break verified (lower mastery -> fewer attempts -> canonical registry order -> pattern name)
- [x] Pipeline execution order verified (Attempt -> StudentProgress -> Mastery -> Revision with fresh recalculated mastery)
- [x] Generated StudyPlan targetMastery verified (0.85 across preview, generate, and replanning)
- [x] Identifier-based ownership and authentication boundary limitation documented accurately
- [x] DailyObjective compound uniqueness verified on `{ userId: 1, planId: 1, date: 1 }`
- [x] Revision plan deduplication verified between overdue items and recent incorrect weak concepts
- [x] Mastered patterns skipped by default (`mastery >= 0.85` -> `MASTERED_PATTERN_SKIPPED`)
- [x] `includeMastered = false` skips mastered patterns
- [x] `includeMastered = true` includes explicitly requested mastered patterns
- [x] `includeMastered` respects capacity constraints
- [x] `includeMastered` works consistently across preview and generate parity
- [x] Replanning preserves intentional `includeMastered` semantics via `planningMeta.includeMastered`
- [x] Company goal supports normal 3d/7d/9d presets
- [x] Company goal may use valid explicit custom dates (e.g. 5-day horizon)
- [x] Government/entrance/competitive/master goals may use valid explicit custom dates (e.g. 46-day horizon)
- [x] Custom goal explicit dates still work
- [x] Explicit custom horizon still requires explicit learning scope (`PLANNING_SCOPE_REQUIRED`)
- [x] Preset/date conflict rule remains correct (`400 PLANNING_HORIZON_CONFLICT`)
- [x] Invalid date ordering rejected (`400 INVALID_DATE_RANGE`)
- [x] Complete Phase 5 limitations documented
- [x] Phase 1/2 regressions pass (7 suites, 139 tests)
- [x] Phase 3 regressions pass (4 suites, 77 tests)
- [x] Phase 4 regressions pass (7 suites, 59 tests)
- [x] Phase 5 tests pass (6 suites, 113 tests)
- [x] Total combined regression suite passes (24 suites, 388 tests)
- [x] Failed tests = 0
- [x] Skipped tests = 0
- [x] Phase 2 integrity passes
- [x] 12,000 / 12,000 SHA-256 fingerprints match
- [x] Phase 6 runtime implementation count = 0
- [x] One authoritative Phase 5 specification exists
- [x] One authoritative Phase 5 walkthrough exists
- [x] All documentation is mutually consistent

```text
PHASE 1 FOUNDATION — VERIFIED

PHASE 2 QUESTION INTELLIGENCE LAYER — VERIFIED

PHASE 3 STUDENT LEARNING DATA LAYER — VERIFIED

PHASE 4 ADAPTIVE DECISION ENGINE — VERIFIED

PHASE 5 PLANNING & REVISION ENGINE — VERIFIED

READY FOR PHASE 6 DESIGN
```
