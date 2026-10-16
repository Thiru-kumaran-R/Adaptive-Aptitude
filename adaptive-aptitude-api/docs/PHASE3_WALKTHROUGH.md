# Phase 3 — Student Learning Data Layer — Walkthrough

## Executive Summary

```
Test Suites: 11 passed, 11 total
Tests:       216 passed, 216 total
Snapshots:   0 total
Time:        ~22 s
Database:    MongoDB Atlas (adaptive_aptitude & adaptive_aptitude_test)
Phase 2 Invariants: 100% Preserved (12,000 questions, 24 topics, 278 patterns, 0 regressions)
```

---

## 1. Phase 2 Regression Status

Running `npm run verify:phase2` and `npm run verify:content`:

- **Total Questions:** 12,000 (Expected: 12,000) — Match: ✅
- **Canonical Topics:** 24 (Expected: 24) — Match: ✅
- **Canonical Patterns:** 278 (Expected: 278) — Match: ✅
- **Legacy Pattern Mappings:** 308 (Expected: 308) — Match: ✅
- **Patterns with Prerequisites:** 218 — Match: ✅
- **Foundational Patterns (0 prerequisites):** 60 — Match: ✅
- **Prerequisite DAG Edges:** 410 — Match: ✅
- **Cycles / Self-references / Dangling References:** 0 — Match: ✅
- **SHA-256 Content Fingerprint Integrity:** 12,000 / 12,000 match (0 mismatches) — Match: ✅
- **Metadata (Topic, Pattern, Difficulty) Preservation:** 12,000 / 12,000 match — Match: ✅
- **Phase 2 Test Suites Passing:**
  - `tests/questions.test.js`: 53 tests ✅
  - `tests/phase2_verification.test.js`: 21 tests ✅
  - `tests/registry.test.js`: 24 tests ✅
  - `tests/hierarchy.test.js`: 13 tests ✅
  - `tests/model_validation.test.js`: 16 tests ✅
  - `tests/import_safety.test.js`: 7 tests ✅

---

## 2. Models Created

All 6 Phase 3 models are in `src/models/`, alongside the verified `questionModel.js`:

1. [`userModel.js`](file:///Users/rajakumaran/Documents/Aptitude/adaptive-aptitude-api/src/models/userModel.js)
   - Student identity record (`userId`, `name`, `email`, `avatar`, timestamps).
2. [`goalModel.js`](file:///Users/rajakumaran/Documents/Aptitude/adaptive-aptitude-api/src/models/goalModel.js)
   - Reason for studying (`userId`, `title`, `type`, `targetName`, `description`, `startDate`, `targetDate`, `targetScore`, `priority`, `status`, timestamps).
   - Pre-validate hook strictly enforces `targetDate >= startDate`.
3. [`studyPlanModel.js`](file:///Users/rajakumaran/Documents/Aptitude/adaptive-aptitude-api/src/models/studyPlanModel.js)
   - Period-based study plan (`userId`, `goalId`, `name`, `scope`, `phase`, `startDate`, `endDate`, `status`, `targets: [{topic, pattern, targetQuestions, targetMastery}]`, timestamps).
   - Target topics and patterns validated against canonical registry.
4. [`dailyObjectiveModel.js`](file:///Users/rajakumaran/Documents/Aptitude/adaptive-aptitude-api/src/models/dailyObjectiveModel.js)
   - Today's assigned learning work (`userId`, `planId`, `goalId`, `date`, `topic`, `patterns: [{pattern, targetQuestions, completedQuestions, targetDifficulty}]`, `targetMinutes`, `actualMinutes`, `status`, timestamps).
   - Unique compound index on `{ userId, planId, date }`.
5. [`attemptModel.js`](file:///Users/rajakumaran/Documents/Aptitude/adaptive-aptitude-api/src/models/attemptModel.js)
   - Historical individual question attempt record (`userId`, `questionId`, `topic`, `pattern`, `difficulty`, `selectedAnswer`, `correctAnswer`, `isCorrect`, `timeTaken`, `source`, `sessionId`, `attemptedAt`).
   - `timestamps: false`, `versionKey: false`. Question metadata snapshot stored directly on the document.
6. [`studentProgressModel.js`](file:///Users/rajakumaran/Documents/Aptitude/adaptive-aptitude-api/src/models/studentProgressModel.js)
   - Aggregate per-user/topic/pattern performance (`userId`, `topic`, `pattern`, `attempts`, `correct`, `incorrect`, `accuracy`, `averageTime`, `totalTimeSpent`, `mastery`, `highestDifficultyMastered`, `consecutiveCorrect`, `consecutiveIncorrect`, `lastAttemptAt`, timestamps).
   - Unique compound index on `{ userId, topic, pattern }`.

---

## 3. Collection Relationships

```text
               User (userId: String)
                 │
                 ├── Goal (_id: ObjectId, userId: String)
                 │     │
                 │     └── StudyPlan (_id: ObjectId, goalId: ObjectId, userId: String)
                 │            │
                 │            └── DailyObjective (planId: ObjectId, goalId: ObjectId, userId: String)
                 │                   │
                 │                   └── patterns: [{ pattern, targetQuestions, targetDifficulty? }]
                 │
                 ├── Attempt (userId: String, questionId: ObjectId, topic, pattern, difficulty, isCorrect)
                 │
                 └── StudentProgress (userId: String, topic: String, pattern: String)
```

**Ownership & Integrity Rules:**
- Cross-user references are rejected: a student cannot attach a StudyPlan to another student's Goal, or a DailyObjective to another student's Plan.
- A DailyObjective's `goalId` must match the parent StudyPlan's `goalId`.
- Every referenced `topic` and `pattern` in StudyPlans and DailyObjectives must be validated against `canonicalPatternRegistry.json`. Mismatches or non-existent items are rejected with explicit error codes (`INVALID_TOPIC`, `PATTERN_TOPIC_MISMATCH`).

---

## 4. Index Report

Actual indexes retrieved directly from the MongoDB database (`db.collection.getIndexes()`):

### `users`
- `_id_`: `{"_id": 1}`
- `userId_1`: `{"userId": 1}` **[UNIQUE]**
- `email_1`: `{"email": 1}` (sparse)

### `goals`
- `_id_`: `{"_id": 1}`
- `userId_1_status_1`: `{"userId": 1, "status": 1}`
- `userId_1_targetDate_1`: `{"userId": 1, "targetDate": 1}`
- `userId_1_priority_1`: `{"userId": 1, "priority": 1}`

### `study_plans`
- `_id_`: `{"_id": 1}`
- `userId_1_goalId_1_status_1`: `{"userId": 1, "goalId": 1, "status": 1}`
- `userId_1_status_1`: `{"userId": 1, "status": 1}`
- `goalId_1`: `{"goalId": 1}`

### `daily_objectives`
- `_id_`: `{"_id": 1}`
- `userId_1_planId_1_date_1`: `{"userId": 1, "planId": 1, "date": 1}` **[UNIQUE]**
- `userId_1_date_-1`: `{"userId": 1, "date": -1}`
- `userId_1_planId_1_status_1`: `{"userId": 1, "planId": 1, "status": 1}`
- `planId_1_date_-1`: `{"planId": 1, "date": -1}`

### `attempts`
- `_id_`: `{"_id": 1}`
- `userId_1_attemptedAt_-1`: `{"userId": 1, "attemptedAt": -1}`
- `userId_1_topic_1_attemptedAt_-1`: `{"userId": 1, "topic": 1, "attemptedAt": -1}`
- `userId_1_pattern_1_attemptedAt_-1`: `{"userId": 1, "pattern": 1, "attemptedAt": -1}`
- `userId_1_isCorrect_1_attemptedAt_-1`: `{"userId": 1, "isCorrect": 1, "attemptedAt": -1}`
- `userId_1_questionId_1_attemptedAt_-1`: `{"userId": 1, "questionId": 1, "attemptedAt": -1}`
- `sessionId_1`: `{"sessionId": 1}` (sparse)

### `student_progress`
- `_id_`: `{"_id": 1}`
- `userId_1_topic_1_pattern_1`: `{"userId": 1, "topic": 1, "pattern": 1}` **[UNIQUE]**
- `userId_1_mastery_1`: `{"userId": 1, "mastery": 1}`
- `userId_1_topic_1`: `{"userId": 1, "topic": 1}`

### `questions` (Unchanged from Phase 2)
- `_id_`: `{"_id": 1}`
- `topic_1_pattern_1_difficulty_1`: `{"topic": 1, "pattern": 1, "difficulty": 1}`
- `topic_1_pattern_1`: `{"topic": 1, "pattern": 1}`
- `pattern_1_difficulty_1`: `{"pattern": 1, "difficulty": 1}`
- `topic_1_difficulty_1`: `{"topic": 1, "difficulty": 1}`
- `difficulty_1`: `{"difficulty": 1}`

---

## 5. User Identity Strategy

- `userId: String` is used uniformly as the student identifier across all student-related models (`User`, `Goal`, `StudyPlan`, `DailyObjective`, `Attempt`, `StudentProgress`).
- It is never represented as an `ObjectId` in student identity contexts.
- Parent references to other entities (`goalId`, `planId`, `questionId`) use MongoDB `ObjectId`.
- Verified in `tests/phase3_database.test.js` (Test A1–A5).

---

## 6. DailyObjective Verification

- **Compound Uniqueness:** `{ userId, planId, date }` is enforced as unique in MongoDB. Verified in Test B1.
- **Multiple Plans on Same Date:** A student can have distinct objectives for different study plans on the exact same date. Verified in Test B2.
- **Date Normalization:** Dates are normalized to midnight UTC (`00:00:00.000Z`) by `normalizeToMidnightUTC`. This prevents bypassing the unique constraint using different times on the same calendar day (e.g. 08:00 vs 22:00 UTC). Verified in Test B3.
- **Pattern-Level `targetDifficulty`:** Stored per item in `patterns[]`, optional, validated as integer 1–10. Different patterns within the same daily objective can specify different target difficulties or omit it entirely. Verified in Tests C1–C3.

---

## 7. Attempt Verification

- **Server-Side Snapshot:** When recording an attempt (`POST /api/v1/attempts`), the client only sends `userId`, `questionId`, `selectedAnswer`, `timeTaken`, `source`, `sessionId`. The server fetches the authoritative Question and writes snapshot fields: `topic`, `pattern`, `difficulty`, `correctAnswer`, `isCorrect`. Verified in Tests D1, K1.
- **Server-Side Correctness:** `isCorrect` is computed strictly on the backend via `selectedAnswer.trim() === question.answer.trim()`. The client cannot manipulate `isCorrect`. Verified in Tests D2, K2.
- **Historical Immutability:** Historical fields (`questionId`, `topic`, `pattern`, `difficulty`, `selectedAnswer`, `correctAnswer`, `isCorrect`, `timeTaken`, `attemptedAt`) cannot be mutated through API updates. No modifying update endpoints exist for attempts.

---

## 8. StudentProgress Verification

- **Atomic Deterministic Aggregates:**
  - `attempts += 1`
  - `correct += isCorrect ? 1 : 0`
  - `incorrect += isCorrect ? 0 : 1`
  - `totalTimeSpent += timeTaken`
  - `accuracy = (correct / attempts) * 100`
  - `averageTime = totalTimeSpent / attempts`
  - `consecutiveCorrect`: +1 on correct, reset to 0 on incorrect
  - `consecutiveIncorrect`: +1 on incorrect, reset to 0 on correct
- **Streak & Two-Phase Update:** Implemented in `studentProgressService.js` to ensure atomic increment and streak reset without `$inc`/`$set` path conflicts in MongoDB. Verified in Tests F1, F2, F5.
- **Reserved State Fields:**
  - `mastery`: Defaults to `0`, remains `0` after Phase 3 updates. Verified in Tests F3, PB4.
  - `highestDifficultyMastered`: Defaults to `0`, remains `0` after Phase 3 updates. Verified in Tests F4, PB5.
- **Aggregate Rebuild Utility:**
  - `scripts/rebuildStudentProgress.js` recomputes all StudentProgress records directly from immutable Attempt history.
  - Verified in Test F6.

---

## 9. Q1–Q10 Verification

All queries in `src/services/adaptiveQueryHelper.js` retrieve existing stored data without making adaptive decisions:

| Query | Function | Verification Test | Result |
|---|---|---|---|
| **Q1** | `Q1_progressByTopic(userId, topic?)` | `Q1a, Q1b, Q1c` | Returns all progress or filtered by topic |
| **Q2** | `Q2_progressByPattern(userId, topic)` | `Q2a` | Returns pattern-level progress for a topic |
| **Q3** | `Q3_recentAttempts(userId, { limit, topic, pattern, source })` | `Q3a, Q3b` | Returns attempts sorted by `attemptedAt: -1` |
| **Q4** | `Q4_weakestPatterns(userId, limit)` | `Q4a, Q4b, Q4c` | Sorts by stored `accuracy: 1, attempts: -1` |
| **Q5** | `Q5_attemptedQuestionIds(userId, { topic, pattern })` | `Q5a, Q5b` | Returns distinct `questionId`s attempted |
| **Q6** | `Q6_unattemptedQuestions(userId, { topic, pattern, limit })` | Query helper | Finds questions with `_id: { $nin: attemptedIds }` |
| **Q7** | `Q7_difficultyDistribution(userId, { topic, pattern })` | `Q7a, Q7a2` | Returns attempt count, correct, and incorrect per difficulty (1–10) |
| **Q8** | `Q8_accuracyOverTime(userId, { topic, pattern, limit })` | `Q8a` | Returns time-series with `runningAccuracy` |
| **Q9** | `Q9_attemptsBySource(userId)` | `Q9a, Q9b` | Returns attempt breakdown by source type |
| **Q10** | `Q10_prerequisiteData(patternName)` | `Q10a–Q10f` | Returns registry prerequisite data without eligibility decisions |

**Phase 3 Boundary on Q10:**
Q10 returns only factual data (`pattern`, `topic`, `prerequisites`, `prerequisiteCount`, `dependents`, `dependentCount`, `isFoundational`).
It **never** outputs: `eligible`, `notEligible`, `prerequisiteSatisfied`, `readyForPattern`, or `canAdvance`. Verified in Test Q10c.

---

## 10. Referential Integrity

Enforced at the service layer before any write operation:
- Goal creation checks `userExists(userId)` $\to$ `404 USER_NOT_FOUND`. Verified in Test I3.
- StudyPlan creation checks `assertGoalOwnership(goalId, userId)` $\to$ `404 GOAL_NOT_FOUND`.
- DailyObjective creation checks ownership across the entire hierarchy (`userId` $\to$ `planId` $\to$ `goalId`).
- Target patterns in StudyPlans and DailyObjectives must exist in the canonical registry and belong to the specified topic $\to$ `400 INVALID_TOPIC`, `400 PATTERN_TOPIC_MISMATCH`. Verified in Tests J2, J3.
- Attempt creation checks `Question.findById(questionId)` $\to$ `404 QUESTION_NOT_FOUND`.

---

## 11. API Routes

All Phase 3 routes are registered under `/api/v1` in `src/app.js`:

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/users` | Create student profile |
| `GET` | `/api/v1/users/:userId` | Get student profile |
| `POST` | `/api/v1/goals` | Create goal |
| `GET` | `/api/v1/goals/user/:userId` | List goals for student |
| `GET` | `/api/v1/goals/:id` | Get goal by ID |
| `PATCH` | `/api/v1/goals/:id` | Update goal |
| `DELETE` | `/api/v1/goals/:id` | Delete goal |
| `POST` | `/api/v1/study-plans` | Create study plan with target validation |
| `GET` | `/api/v1/study-plans/user/:userId` | List study plans for student |
| `GET` | `/api/v1/study-plans/:id` | Get study plan by ID |
| `PATCH` | `/api/v1/study-plans/:id` | Update study plan |
| `DELETE` | `/api/v1/study-plans/:id` | Delete study plan |
| `POST` | `/api/v1/daily-objectives` | Create daily objective (unique `{userId, planId, date}`) |
| `GET` | `/api/v1/daily-objectives/user/:userId` | List daily objectives (paginated + filtered) |
| `GET` | `/api/v1/daily-objectives/:id` | Get daily objective by ID |
| `PATCH` | `/api/v1/daily-objectives/:id` | Update daily objective |
| `DELETE` | `/api/v1/daily-objectives/:id` | Delete daily objective |
| `POST` | `/api/v1/attempts` | Record question attempt (server-side snapshot) |
| `GET` | `/api/v1/attempts/user/:userId` | List attempts for student (paginated) |
| `GET` | `/api/v1/attempts/:id` | Get attempt by ID |
| `GET` | `/api/v1/progress/:userId` | List all progress records for student |
| `GET` | `/api/v1/progress/:userId/topics` | (Q1) Progress by topic |
| `GET` | `/api/v1/progress/:userId/patterns` | (Q2) Progress by pattern |
| `GET` | `/api/v1/progress/:userId/weakest` | (Q4) Weakest patterns |
| `GET` | `/api/v1/progress/:userId/difficulty-distribution` | (Q7) Difficulty distribution |
| `GET` | `/api/v1/progress/:userId/accuracy-over-time` | (Q8) Accuracy over time |
| `GET` | `/api/v1/progress/:userId/by-source` | (Q9) Attempts by source |
| `GET` | `/api/v1/progress/prerequisites/:patternName` | (Q10) Factual prerequisite data |

---

## 12. Test Results

Executed with Jest & Supertest across 11 test suites:

```text
Test Suites: 11 passed, 11 total
Tests:       216 passed, 216 total
Snapshots:   0 total
Time:        ~22 s
```

### Breakdown by Suite

1. `tests/phase3_database.test.js` — **25 passed** (Tests A–G: models, uniqueness, snapshot, progress formula, date validation)
2. `tests/phase3_api.test.js` — **19 passed** (Tests H–K: HTTP endpoints, validation, attempt snapshot via HTTP)
3. `tests/phase3_adaptive_query.test.js` — **22 passed** (Q1–Q10 queries, boundary checks)
4. `tests/phase3_regression.test.js` — **11 passed** (Phase 2 regression, model boundary, Phase 4 term exclusion, legacy term scan)
5. `tests/questions.test.js` — **53 passed** (Phase 2 question endpoints)
6. `tests/phase2_verification.test.js` — **21 passed** (Phase 2 dataset and database invariants)
7. `tests/registry.test.js` — **24 passed** (Canonical registry lookups and stats)
8. `tests/model_validation.test.js` — **16 passed** (Question model validation)
9. `tests/hierarchy.test.js` — **13 passed** (Prerequisite DAG validation)
10. `tests/import_safety.test.js` — **7 passed** (Import safeguards)
11. `tests/architecture_guard.test.js` — **5 passed** (Zero legacy terms, Phase 4 boundary verification)

---

## 13. Phase Boundary Confirmation

Phase 3 is purely the **Student Learning Data Layer**. The following later-phase systems are **NOT** implemented:

- **No Adaptive Question Selection Engine** (Phase 4)
- **No Automatic Difficulty Adjustment** (Phase 4)
- **No Mastery Calculation Formula** (`mastery` is 0, reserved for Phase 4)
- **No Prerequisite Gating** (no `eligible`, `readyForPattern`, or `canAdvance` evaluations)
- **No Pattern Promotion** (Phase 4)
- **No Automatic Study Plan Generation or Replanning** (Phase 5)
- **No Spaced Repetition or Revision Scheduling** (Phase 5)
- **No Mock-Test Engine** (Phase 6)
- **No LLM Tutoring or Question Generation** (Phase 7)
- **No Teacher/Mentor Subsystems** (permanently excluded from this architecture)

All automated boundary checks pass (Tests PB1, PB2, PB3, PB4, PB5, PB6 in `tests/phase3_regression.test.js` and Section 11 in `tests/architecture_guard.test.js`).
