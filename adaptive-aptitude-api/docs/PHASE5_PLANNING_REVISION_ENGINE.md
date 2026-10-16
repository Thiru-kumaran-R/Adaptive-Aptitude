# Phase 5 — Automated Planning, Daily Objectives & Revision Engine Specification

## 1. Architectural Overview

Phase 5 introduces the curriculum scheduling and reinforcement intelligence layer to `adaptive-aptitude-api`. While Phase 4 answers *"What question should this student solve next?"*, Phase 5 answers:
1. **What should the student study over the available preparation period?** (`StudyPlan` generation)
2. **What should the student work on today?** (`DailyObjective` generation)
3. **What unfinished work should be replanned?** (Progress-aware replanning)
4. **What previously weak or incorrectly answered concepts should be revised?** (Spaced repetition and mistake-driven revision)

Phase 5 builds directly upon Phase 1 (foundation), Phase 2 (canonical question intelligence & DAG), Phase 3 (student learning data layer), and Phase 4 (adaptive decision engine) without redesigning or duplicating their responsibilities.

```text
┌──────────────────────────────────────────────────────────┐
│                   PHASE 5 ORCHESTRATION                  │
├─────────────────────────┬────────────────────────────────┤
│    Automated Planning   │     Spaced Revision Engine     │
│  - Horizon resolution   │  - 5-stage spaced intervals    │
│  - Prerequisite expand  │  - Mistake-driven capture      │
│  - Topological sequence │  - Attempt idempotency         │
│  - Single-topic daily   │  - Recovery from attempt logs  │
│  - Progress replanning  │  - 1-day & 2-day revision plan │
└────────────┬────────────┴────────────────┬───────────────┘
             │                             │
             ▼                             ▼
┌─────────────────────────┐   ┌────────────────────────────┐
│      Phase 3 Data       │   │    Phase 4 Adaptive Engine │
│  - StudyPlan            │   │  - Pattern selection bonus │
│  - DailyObjective       │   │  - Difficulty adaptation   │
│  - RevisionItem         │   │  - Question selection      │
│  - RevisionProcessing...│   │  - Prerequisite redirects  │
│  - Attempt (Immutable)  │   │  - Mastery recalculation   │
│  - StudentProgress      │   │                            │
└─────────────────────────┘   └────────────────────────────┘
```

---

## 2. Centralized Date Management (`dateUtils.js`)

All date arithmetic, horizon calculations, and query filters in Phase 5 operate on standardized **logical dates** (midnight UTC, `00:00:00.000Z`).

### Pure Date Operations
* `normalizeLogicalDate(input)`: Converts any Date or ISO-8601 string to `00:00:00.000Z`.
* `getLogicalToday(referenceDate)`: Returns normalized today UTC, supporting a deterministic injected `referenceDate` for reproducible testing and simulation.
* `addLogicalDays(date, days)`: Adds integer days via UTC millisecond offsets.
* `addCalendarMonths(date, months)`: Performs true calendar month arithmetic respecting variable month lengths (28, 29, 30, 31 days) and year boundaries via UTC getters and setters.
* `compareLogicalDates(d1, d2)`: Returns `-1`, `0`, or `1` comparing two normalized timestamps.
* `daysBetweenInclusive(start, end)`: Computes `Math.round((end - start) / 86400000) + 1`.
* `formatLogicalDate(date)`: Emits consistent `YYYY-MM-DD` string representation.

---

## 3. Automated Study Plan & Daily Objective Generation

### 3.1 Horizon & Preset Calculations
Planning horizons are resolved from either a supported preset or explicit custom dates:
* **Day Presets**:
  * `3d`: 3 calendar days
  * `7d`: 7 calendar days
  * `9d`: 9 calendar days
* **Calendar Month Presets**:
  * `1m`: 1 calendar month
  * `2m`: 2 calendar months
  * `3m`: 3 calendar months
  * `6m`: 6 calendar months
* **Custom Dates**: Explicit `startDate` and `targetDate`. Valid explicit `startDate` + `targetDate` horizons may be used for any Goal type.
* **Conflict Validation**: If a client supplies both `durationPreset` AND `targetDate`, and they resolve to different end dates, the API returns HTTP `400 PLANNING_HORIZON_CONFLICT`. If they agree on the exact same end date, the request is accepted.

> [!IMPORTANT]
> **Goal-Type Presets & Explicit Scope**:
> * Goal-type presets (`company` $\rightarrow$ `['3d', '7d', '9d']`, `government`/`entrance`/`competitive`/`master` $\rightarrow$ `['1m', '2m', '3m', '6m']`, `custom` $\rightarrow$ `['custom']`) are supported/recommended convenience horizons.
> * Explicit valid `startDate` + `targetDate` horizons may also be used for any Goal type (e.g. an explicit 5-day horizon for a company goal, or a 45-day horizon for a government goal).
> * Company goals are NOT restricted to only 3/7/9 days, and explicit custom dates are NOT exclusive to custom goals.
> * Goal type never determines curriculum scope or syllabus. Learning scope must be explicitly supplied (via `scope.topics`, `scope.patterns`, or `scope.allCanonicalPatterns: true`). Requests without explicit scope fail with HTTP `400 PLANNING_SCOPE_REQUIRED`. No verified curriculum profiles currently exist in the repository (verified syllabus profiles = 0).

### 3.2 Scope Resolution & Prerequisite Expansion
1. **Explicit Scope Required**: Planning requires explicit `scope` (`topics`, `patterns`, or `allCanonicalPatterns: true`). Missing scope triggers `400 PLANNING_SCOPE_REQUIRED`. If an unverified `targetProfileId` is supplied, it triggers `404 TARGET_PROFILE_NOT_FOUND`.
2. **Validation**: Every requested topic and pattern is validated against `canonicalPatternRegistry.json`. Unknown entities trigger `400 INVALID_TOPIC` or `400 INVALID_PATTERN`.
3. **Mastery Filtering & Override**: Patterns with existing `mastery >= 0.85` in `StudentProgress` are skipped from normal learning capacity by default (`PLANNING_TARGET_MASTERY = 0.85`). When explicitly requested via `includeMastered: true`, already-mastered patterns remain eligible for planning, consume normal capacity, and are preserved across replanning via `planningMeta.includeMastered` without resetting stored student progress or mastery.
4. **Prerequisite Expansion**: For every included pattern, its prerequisites are recursively resolved via `hierarchyService.getPrerequisites(pattern)`. Any prerequisite with `mastery < 0.70` (`PREREQUISITE_READY_MASTERY = 0.70`) is automatically added to the plan scope. Prerequisites that already satisfy `mastery >= 0.70` are NOT rescheduled.
5. **Topological Ordering**: Patterns are ordered so that all foundational and prerequisite patterns appear before any dependent patterns. Ties are broken deterministically by canonical registry index and pattern name.

### 3.3 Authoritative Capacity Model & Allocation Constraints
* **Authoritative Defaults**:
  * `PLANNING_ALGORITHM_VERSION = "v1"`
  * `DEFAULT_DAILY_QUESTION_BUDGET = 30` (min: 1, max: 200)
  * `DEFAULT_DAILY_MINUTES = 60` (min: 1, max: 600)
  * `DEFAULT_QUESTIONS_PER_PATTERN = 10`
  * `DEFAULT_MAX_PATTERNS_PER_DAY = 3` (min: 1, max: 10)
  * `PREREQUISITE_READY_MASTERY = 0.70`
  * `PLANNING_TARGET_MASTERY = 0.85`
* **Capacity Invariants**: The planning engine enforces BOTH constraints simultaneously:
  $$\sum_{p \in \text{day}} p.\text{targetQuestions} \le \text{dailyQuestionBudget}$$
  $$\text{DailyObjective.targetMinutes} \le \text{dailyMinutes}$$
  `DailyObjective.targetMinutes` and `actualMinutes` ($0$) exist strictly at the root document level; no persistent `patterns[].targetMinutes` exists. Pattern minute distribution is transient only.
* **Deterministic Distribution**: Questions are divided evenly across patterns assigned to each day. For example:
  * 30 questions / 3 patterns $\rightarrow$ 10 / 10 / 10
  * 20 questions / 3 patterns $\rightarrow$ 7 / 7 / 6
  Minutes are allocated proportionally based on questions. Pacing estimates (120s baseline) exist purely as supplemental metadata and do NOT override the explicit question budget.
* **Single Topic Invariant**: Each `DailyObjective` is strictly bound to exactly **ONE** canonical topic (`dailyObjectiveModel.js` schema constraint).
* **Target Reconciliation Invariant**: The parent `StudyPlan` target question count is maintained per-pattern in `StudyPlan.targets`:
  $$\text{StudyPlan.targets.find}(t \Rightarrow t.\text{pattern} === P).\text{targetQuestions} === \sum_{\text{objectives}} \text{DailyObjective.patterns.filter}(x \Rightarrow x.\text{pattern} === P).\text{map}(x \Rightarrow x.\text{targetQuestions})$$
  for each canonical pattern $P$ scheduled.
* **Shortfall Reporting**: If the requested workload exceeds the available horizon capacity, the engine schedules as many patterns as fit and reports `CAPACITY_LIMIT_REACHED` along with `unscheduledPatterns` and `capacityShortfall: true` without silently discarding items.
* **Zero-Write Preview**: `POST /api/v1/planning/preview` generates a complete prospective plan and daily schedule projection without writing any documents to `StudyPlan`, `DailyObjective`, `RevisionItem`, or `RevisionProcessingRecord`.
* **Atomic Plan Generation**: Plan generation executes `StudyPlan` and `DailyObjective` insertion within a MongoDB session transaction. If objective creation fails, the transaction is aborted and rolls back, leaving 0 orphaned records.

---

## 4. Progress-Aware Replanning Engine

Replanning adjusts future objectives while preserving historical learning records:

### 4.1 Immutability & Cutoff Rules
* **Reference Date Cutoff**: Replanning accepts a deterministic `referenceDate` (default: normalized today).
* **Past Objectives (`date < cutoff`)**: Strictly preserved without modification.
* **Completed Objectives (`status === "completed"`)**: Strictly preserved without modification.
* **Today\x27s Objective (`date === cutoff`)**:
  * If the objective has progress (`completedQuestions > 0` or `status === "in_progress"`), it is strictly preserved.
  * If the objective has zero progress (`completedQuestions === 0`), it is **preserved by default**. It is replaced ONLY when `allowReplaceToday = true` is explicitly set in the request.
* **Future Objectives (`date > cutoff`)**:
  * Future `in_progress` objectives: strictly preserved.
  * Future `pending` objectives: deleted and regenerated based on remaining unmastered patterns in the plan scope.

### 4.2 Determinism & Idempotency
Executing replanning multiple times against the identical student progress and date state yields an identical regenerated schedule.

---

## 5. Spaced Revision Engine

The revision system ensures long-term knowledge retention using a 5-stage spaced repetition schedule and mistake-driven review.

### 5.1 Authoritative Revision Defaults
* `REVISION_ALGORITHM_VERSION = "v1"`
* `REVISION_INTERVAL_DAYS = [1, 3, 7, 14, 30]`
* `DEFAULT_REVISION_QUESTION_BUDGET = 20` (min: 1, max: 100)
* `DEFAULT_REVISION_PATTERNS_PER_DAY = 4` (min: 1, max: 10)
* `REVISION_RECENT_INCORRECT_LOOKBACK_DAYS = 7`
* `WEAK_MASTERY_THRESHOLD = 0.70`
* `REVISION_COMPLETION_MASTERY = 0.85` (final stage graduation)

### 5.2 Transition State Machine
The transition logic is encapsulated in a pure helper (`revisionTransitionHelper.js`) shared by live attempts and historical rebuilds:
1. **Rule 1: Revision Failure (`source === "revision"` AND `isCorrect === false`)**:
   * Reset `stage = 0`, `intervalDays = 1`, `consecutiveRevisionSuccesses = 0`, `status = "scheduled"`.
   * Next review scheduled for tomorrow (`+1` day).
2. **Rule 2: Revision Success (`source === "revision"` AND `isCorrect === true`)**:
   * If `stage < 4`: Advance `stage = stage + 1`, update `intervalDays = [1, 3, 7, 14, 30][stage]`.
   * If `stage === 4` (30-day stage):
     * If `mastery >= 0.85`: Mark `status = "completed"` (`REVISION_FINAL_STAGE_COMPLETED`).
     * If `mastery < 0.85`: Keep `status = "scheduled"`, reset review for `+30` days (`REVISION_FINAL_STAGE_EXTENDED`). Entering Stage 4 is not graduation; the student must pass the 30-day review with mastery $\ge 0.85$.
3. **Rule 3: Non-Revision Incorrect Attempt (`source !== "revision"` AND `isCorrect === false`)**:
   * Schedule new item or reset existing item to `stage = 0`, `intervalDays = 1`, scheduled for tomorrow (`INCORRECT_ATTEMPT_SCHEDULED`).
4. **Rule 4: Non-Revision Correct Attempt (`source !== "revision"` AND `isCorrect === true`)**:
   * No stage advancement. Normal practice does not consume or advance spaced revision stages.
5. **Durable Idempotency & Atomic Concurrency**:
   * Backed by `RevisionProcessingRecord` collection with unique index on `{ attemptId: 1 }`.
   * Receipt creation and `RevisionItem` update execute within an atomic MongoDB session transaction.
   * If `attemptId` duplicate occurs, the transaction aborts and returns `REVISION_DUPLICATE_IGNORED` without mutating `RevisionItem`.
   * If `RevisionItem` persistence fails, the transaction rolls back so no receipt remains committed.
   * Guaranteed idempotent across >100 intervening attempts and concurrent duplicate deliveries.

### 5.3 Attempt Hook & Isolation
`attemptService.createAttempt` executes revision processing in **Step 6** after transaction commit. If revision processing encounters an error:
* The Attempt is completely preserved and immutable.
* A structured error event `REVISION_SCHEDULING_FAILED` is logged safely without PII or question answers.
* The error never rolls back the Attempt or throws to the client.

### 5.4 Daily Objective Completed Count Invariant
Attempts with `source === "revision"` update student accuracy, progress aggregates, and mastery, but **NEVER** increment `DailyObjective.patterns[].completedQuestions`. Daily objectives measure primary new curriculum progress.

### 5.5 State Recovery (`rebuildRevisionState`)
Pattern-scoped recovery `rebuildRevisionState(userId, topic, pattern)` is the primary recovery mechanism:
* Clears existing `RevisionItem` and `RevisionProcessingRecord` receipts scoped strictly to the specified `{ userId, topic, pattern }`.
* Replays all historical attempts in chronological order (`{ attemptedAt: 1 }`), restoring exact state and receipts without affecting other patterns.
* `rebuildUserRevisionState(userId)` is available as an operational maintenance utility.

---

## 6. Revision Planning (1-Day & 2-Day Plans)

The endpoint `GET /api/v1/revisions/plan` constructs short-term dedicated revision sessions from 3 distinct priority sources:
1. **Source 1: Overdue RevisionItems** (`status === "scheduled"`, `nextReviewDate < referenceDate`).
2. **Source 2: RevisionItems Due Today** (`status === "scheduled"`, `nextReviewDate === referenceDate`).
3. **Source 3: Supplemental Recent Incorrect Weak Patterns** (Patterns attempted incorrectly within a 7-day lookback with current `mastery < 0.70`).

> [!NOTE]
> **Exclusion of Future Revisions**: Future RevisionItems with `nextReviewDate > referenceDate` are strictly **EXCLUDED** from V1 revision plans and never consume current daily capacity.

### Allocation & Budgeting
* Bounded by `questionBudget` (default 20, max 100) and `patternsPerDay` (default 4, max 10).
* For multi-day plans (days = 2), budgets and patterns-per-day limits are applied **independently to each logical day**.
* **Deduplication**: If a pattern is both due/overdue and also has a recent incorrect attempt, it appears only once in the plan, with due/overdue revision state taking priority.

---

## 7. Phase 4 Ownership Preservation

Phase 5 strictly defers to Phase 4 for:
* Selection of specific question IDs.
* Runtime difficulty adaptation (+1, -1, hold).
* Prerequisite question delivery when a student struggles.
* Dynamic baseline difficulty selection.

In generated `DailyObjective.patterns[]`, `targetDifficulty` is left **absent/unset** by default, allowing Phase 4 to adapt dynamically at runtime.

---

## 8. Known Limitations

* No verified external company/exam syllabus mappings
* No LLM-based planning
* No predictive completion/velocity model
* No external calendar integration
* No Phase 6 mock-test engine
* No population-learned forgetting curve
* Fixed deterministic revision intervals
* One primary topic per DailyObjective
* No authentication / RBAC in Phase 5 (identifier consistency checks only)
