# Phase 3 — Database Architecture

## Overview

Phase 3 adds the **Student Learning Data Layer** on top of the Phase 2 Question Intelligence Layer.

Phase 3 introduces 6 new collections:

| Collection | Model | Purpose |
|---|---|---|
| `users` | `userModel.js` | Student identity (userId: String) |
| `goals` | `goalModel.js` | Why the student is studying |
| `study_plans` | `studyPlanModel.js` | What the student plans to study |
| `daily_objectives` | `dailyObjectiveModel.js` | Today's learning work |
| `attempts` | `attemptModel.js` | Individual question attempt records |
| `student_progress` | `studentProgressModel.js` | Aggregate per-user/topic/pattern stats |

The existing `questions` collection from Phase 2 remains **unchanged**.

---

## Collection Schemas

### `users`

```
userId     String   required, unique   — Application-level student ID
name       String   required
email      String   optional
avatar     String   optional
createdAt  Date     auto
updatedAt  Date     auto
```

**Indexes:**
- `{ userId: 1 }` — unique
- `{ email: 1 }` — sparse

**Key design decision:** `userId` is a String (not ObjectId) throughout all Phase 3 collections. This preserves explicit student identifiers for the Phase 3 development and testing cycle.

---

### `goals`

```
userId        String   required, indexed
title         String   required
type          Enum     [company, government, entrance, competitive, master, custom]
targetName    String   optional
description   String   optional
startDate     Date     optional
targetDate    Date     optional (>= startDate when both provided)
targetScore   Number   optional, >= 0
priority      Integer  optional, 1–5
status        Enum     [planned, active, completed, paused, cancelled], default: planned
createdAt     Date     auto
updatedAt     Date     auto
```

**Validation rule:** `targetDate >= startDate` enforced via Mongoose pre-validate hook.

**Indexes:**
- `{ userId: 1, status: 1 }`
- `{ userId: 1, targetDate: 1 }`
- `{ userId: 1, priority: 1 }`

---

### `study_plans`

```
userId     String         required
goalId     ObjectId(Goal) required
name       String         required
scope      Enum           [short, medium, long]
phase      Enum           [foundation, core, pattern, advanced, revision, mock]
startDate  Date
endDate    Date
status     Enum           [planned, active, completed, paused, cancelled]
targets    Array          [{topic, pattern?, targetQuestions?, targetMastery?}]
createdAt  Date           auto
updatedAt  Date           auto
```

**Target validation (service layer):**
1. `topic` must exist in `canonicalPatternRegistry.json`
2. `pattern` (if provided) must exist in registry AND belong to the specified `topic`
3. Validation rejects with `INVALID_TOPIC`, `INVALID_PATTERN`, or `PATTERN_TOPIC_MISMATCH`
4. Invalid values are NEVER silently rewritten

**Indexes:**
- `{ userId: 1, goalId: 1, status: 1 }`
- `{ userId: 1, status: 1 }`
- `{ goalId: 1 }`

---

### `daily_objectives`

```
userId           String            required
planId           ObjectId(StudyPlan)  required
goalId           ObjectId(Goal)       required
date             Date              required (stored as midnight UTC)
topic            String            required (canonical)
patterns         Array             [{pattern, targetQuestions, completedQuestions, targetDifficulty?}]
targetMinutes    Number            optional
actualMinutes    Number            default: 0
status           Enum              [pending, in_progress, completed, skipped]
createdAt        Date              auto
updatedAt        Date              auto
```

**Unique constraint:** `{ userId: 1, planId: 1, date: 1 }` (unique compound index)

**Date normalization:** All dates are normalized to midnight UTC (`00:00:00.000Z`) by the service layer before writing. This prevents uniqueness bypass when the same calendar day is submitted with different clock times.

**Pattern-level `targetDifficulty`:** Stored per pattern entry, NOT at the objective level. Optional — Phase 4 may assign difficulty dynamically.

**Indexes:**
- `{ userId: 1, planId: 1, date: 1 }` — unique
- `{ userId: 1, date: -1 }`
- `{ userId: 1, planId: 1, status: 1 }`
- `{ planId: 1, date: -1 }`

---

### `attempts`

```
userId         String            required
questionId     ObjectId(Question) required
topic          String            required — server-side snapshot from Question
pattern        String            required — server-side snapshot from Question
difficulty     Integer(1–10)     required — server-side snapshot from Question
selectedAnswer String            required — provided by client
correctAnswer  String            required — server-side snapshot from Question
isCorrect      Boolean           required — computed server-side
timeTaken      Number            required — seconds, >= 0
source         Enum              [practice, daily_plan, adaptive, revision, mock]
sessionId      String            optional
attemptedAt    Date              default: Date.now
```

**Historical snapshot strategy:**
The server loads the Question document and derives `topic`, `pattern`, `difficulty`, `correctAnswer`, `isCorrect` from it. The client only provides `userId`, `questionId`, `selectedAnswer`, `timeTaken`, `source`, `sessionId`.

**Immutability:** `questionId`, `topic`, `pattern`, `difficulty`, `selectedAnswer`, `correctAnswer`, `isCorrect`, `timeTaken`, `attemptedAt` are historical facts. They must not be mutated through normal update paths.

**Indexes:**
- `{ userId: 1, attemptedAt: -1 }`
- `{ userId: 1, topic: 1, attemptedAt: -1 }`
- `{ userId: 1, pattern: 1, attemptedAt: -1 }`
- `{ userId: 1, isCorrect: 1, attemptedAt: -1 }`
- `{ userId: 1, questionId: 1, attemptedAt: -1 }`
- `{ sessionId: 1 }` — sparse

---

### `student_progress`

```
userId                   String   required
topic                    String   required
pattern                  String   required
attempts                 Number   default: 0
correct                  Number   default: 0
incorrect                Number   default: 0
accuracy                 Number   default: 0   — (correct/attempts)*100
totalTimeSpent           Number   default: 0   — seconds
averageTime              Number   default: 0   — totalTimeSpent/attempts
mastery                  Number   default: 0   — RESERVED for Phase 4
highestDifficultyMastered Number  default: 0   — RESERVED for Phase 4
consecutiveCorrect       Number   default: 0
consecutiveIncorrect     Number   default: 0
lastAttemptAt            Date     optional
createdAt                Date     auto
updatedAt                Date     auto
```

**Unique constraint:** `{ userId: 1, topic: 1, pattern: 1 }` (unique compound index)

**Factual statistics (Phase 3 updates):** `attempts`, `correct`, `incorrect`, `accuracy`, `totalTimeSpent`, `averageTime`, `consecutiveCorrect`, `consecutiveIncorrect`, `lastAttemptAt`

**Reserved fields (Phase 4 will define):** `mastery`, `highestDifficultyMastered` — set to `0` by default; Phase 3 must NOT compute these.

**Indexes:**
- `{ userId: 1, topic: 1, pattern: 1 }` — unique
- `{ userId: 1, mastery: 1 }`
- `{ userId: 1, topic: 1 }`

---

## Referential Integrity

| Relationship | Enforcement |
|---|---|
| Goal → User | Service: `userExists(userId)` before create |
| StudyPlan → Goal | Service: `assertGoalOwnership(goalId, userId)` |
| DailyObjective → StudyPlan | Service: `assertPlanOwnership(planId, userId)` |
| DailyObjective → Goal | Service: `assertGoalOwnership(goalId, userId)` + plan.goalId must match |
| Attempt → Question | Service: `Question.findById(questionId)` — 404 if missing |
| Attempt → User | Service: `userExists(userId)` |
| StudentProgress → Attempt | Logical: rebuilt via `rebuildStudentProgress.js` |

---

## Consistency Strategy for Attempt + Progress

Phase 3 uses a conditional transaction strategy:

1. Attempt is created first (primary record — must never be lost)
2. StudentProgress is updated atomically using `findOneAndUpdate` + `$inc`
3. If MongoDB transactions are available (Atlas replica set): both operations are in one transaction
4. If transactions fail: Attempt is written first, progress update is best-effort; if it fails, the error is logged and the Attempt remains for repair via `rebuildStudentProgress.js`

---

## Progress Update Formula

On each Attempt recorded:

```
attempts       += 1
correct        += isCorrect ? 1 : 0
incorrect      += isCorrect ? 0 : 1
totalTimeSpent += timeTaken
lastAttemptAt   = attemptedAt
accuracy        = (correct / attempts) * 100    [recomputed]
averageTime     = totalTimeSpent / attempts     [recomputed]
consecutiveCorrect: +1 on correct, reset to 0 on incorrect
consecutiveIncorrect: +1 on incorrect, reset to 0 on correct
```

`mastery` and `highestDifficultyMastered` are NOT updated in Phase 3.

---

## Adaptive Query Helper (Q1–Q10)

| Query | Purpose |
|---|---|
| Q1 `progressByTopic` | All progress records for user, optionally filtered by topic |
| Q2 `progressByPattern` | Progress records for user within a specific topic |
| Q3 `recentAttempts` | N most recent Attempt documents, sorted by attemptedAt DESC |
| Q4 `weakestPatterns` | Progress sorted by accuracy ASC (lowest accuracy first) |
| Q5 `attemptedQuestionIds` | Distinct questionIds attempted by user (for seen-question filtering) |
| Q6 `unattemptedQuestions` | Questions not yet attempted by user in a topic/pattern |
| Q7 `difficultyDistribution` | Attempt counts per difficulty level (1–10) |
| Q8 `accuracyOverTime` | Running accuracy time series from Attempt history |
| Q9 `attemptsBySource` | Attempt counts per source type (practice, daily_plan, etc.) |
| Q10 `prerequisiteData` | Factual prerequisite list from canonical registry (no eligibility decisions) |

**Phase 3 Boundary:** Q1–Q10 are DATA QUERIES ONLY. They return stored facts. Phase 4 will make adaptive decisions using these as inputs.

---

## API Endpoints

All endpoints are under `/api/v1`.

| Method | Path | Description |
|---|---|---|
| POST | `/users` | Create user |
| GET | `/users/:userId` | Get user |
| POST | `/goals` | Create goal |
| GET | `/goals/user/:userId` | List goals for user |
| GET | `/goals/:id` | Get goal |
| PATCH | `/goals/:id` | Update goal |
| DELETE | `/goals/:id` | Delete goal |
| POST | `/study-plans` | Create study plan |
| GET | `/study-plans/user/:userId` | List study plans for user |
| GET | `/study-plans/:id` | Get study plan |
| PATCH | `/study-plans/:id` | Update study plan |
| DELETE | `/study-plans/:id` | Delete study plan |
| POST | `/daily-objectives` | Create daily objective |
| GET | `/daily-objectives/user/:userId` | List objectives for user |
| GET | `/daily-objectives/:id` | Get objective |
| PATCH | `/daily-objectives/:id` | Update objective |
| DELETE | `/daily-objectives/:id` | Delete objective |
| POST | `/attempts` | Submit attempt |
| GET | `/attempts/user/:userId` | List attempts for user |
| GET | `/attempts/:id` | Get attempt |
| GET | `/progress/:userId` | All progress for user |
| GET | `/progress/:userId/topics` | Q1: progress by topic |
| GET | `/progress/:userId/patterns` | Q2: progress by pattern (requires ?topic=) |
| GET | `/progress/:userId/weakest` | Q4: weakest patterns |
| GET | `/progress/:userId/difficulty-distribution` | Q7: difficulty distribution |
| GET | `/progress/:userId/accuracy-over-time` | Q8: accuracy over time |
| GET | `/progress/:userId/by-source` | Q9: attempts by source |
| GET | `/progress/prerequisites/:patternName` | Q10: prerequisite data |

---

## Phase Boundaries

### What is NOT implemented in Phase 3

- Authentication (no JWT, no passwords, no OAuth)
- Adaptive question selection
- Automatic difficulty adjustment
- Mastery thresholds or mastery computation
- Prerequisite gating (eligibility decisions)
- Pattern promotion
- Automatic study plan generation or replanning
- Revision scheduling or spaced repetition
- Mock test adaptation
- LLM tutoring or LLM question generation

### Phase 4 Reserved Fields

These fields exist in the schema but are set to `0` and must not be computed in Phase 3:
- `StudentProgress.mastery`
- `StudentProgress.highestDifficultyMastered`

---

## Scripts

| Script | Command | Purpose |
|---|---|---|
| `rebuildStudentProgress.js` | `npm run rebuild:progress` | Rebuild progress aggregates from Attempt history |

**Usage:**
```bash
# Dry run (no writes)
node scripts/rebuildStudentProgress.js --userId=student_001

# Execute rebuild for one user
node scripts/rebuildStudentProgress.js --userId=student_001 --confirm

# Rebuild all users
node scripts/rebuildStudentProgress.js --all --confirm
```
