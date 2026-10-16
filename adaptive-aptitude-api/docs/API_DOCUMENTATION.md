# API Documentation — Adaptive Aptitude API v1

## Route Registration Overview

Question API routes are registered under:

`/api/v1/questions`

The application health endpoint is registered separately at:

`GET /health`

---

## Response Contracts

### Success Response Contract
All successful responses return HTTP status `200` with standard JSON envelope:

```json
{
  "success": true,
  "data": <payload>,
  "meta": {
    "count": 20
  }
}
```

### Paginated Response Contract
Endpoints returning paginated data include structured pagination metadata:

```json
{
  "success": true,
  "data": [
    {
      "_id": "66a01234567890abcdef1234",
      "question": "What is 25% of 200?",
      "answer": "50",
      "options": ["25", "50", "75", "100"],
      "explanation": "25% of 200 = (25/100) * 200 = 50.",
      "topic": "Percentage",
      "pattern": "Basic Percentage Calculation",
      "difficulty": 1
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 492,
    "totalPages": 25,
    "count": 20
  }
}
```

**Pagination Rules:**
- `page`: Optional integer $\ge 1$ (default: `1`). Invalid value returns `400 INVALID_PAGE`.
- `limit`: Optional integer $\ge 1$ and $\le 100$ (default: `20`, maximum: `100`). Invalid value returns `400 INVALID_LIMIT`.
- `total`: Total matching records in database.
- `totalPages`: Computed as `Math.ceil(total / limit)`.
- `count`: Number of records returned in current response.

### Random Endpoints Contract
Random endpoints select non-repeating questions via MongoDB `$sample`:

```json
{
  "success": true,
  "data": [ ... ],
  "meta": {
    "count": 5,
    "limit": 5
  }
}
```

**Random Selection Rules:**
- `limit`: Optional integer $\ge 1$ and $\le 100$ (default: `5`, maximum: `100`). Invalid value returns `400 INVALID_LIMIT`.
- Uniqueness: All returned question IDs within a single response are unique (guaranteed by `$sample`).
- Topic/Pattern ownership: Returned questions strictly belong to the requested topic and pattern.
- Difficulty filter: Supported via `?difficulty=N` (integer 1–10).

### Error Response Contract
All error responses use the standard JSON envelope:

```json
{
  "success": false,
  "error": {
    "code": "INVALID_DIFFICULTY",
    "message": "Difficulty must be an integer between 1 and 10."
  }
}
```

**Status Code Handling:**
- `200 OK`: Request succeeded.
- `400 Bad Request`: Invalid parameter, limit out of bounds, non-integer difficulty, malformed ID.
- `404 Not Found`: Unknown route, unresolvable topic slug, unresolvable pattern slug, topic-pattern mismatch, or question ID not found.
- `500 Internal Server Error`: Unhandled server error. Stack traces are included in `development` mode only and strictly omitted in `production` (`NODE_ENV=production`).

---

## URL Slug Resolution Rules

Slugs provide URL-safe routing at the API boundary without altering the stored canonical data.

- Transformation rule: Lowercase, remove characters other than `a-z`, `0-9`, whitespace, and hyphens, collapse spaces to hyphens.
- Storage invariant: Stored database records and canonical registry files **never** store slugs; they always store canonical names.
- Resolution: Slugs are resolved in-memory ($O(1)$) to canonical names before querying the database.

**Canonical Name vs Slug Examples:**
| Canonical Display Name | API URL Slug |
|------------------------|--------------|
| `Time, Speed and Distance` | `time-speed-and-distance` |
| `Problems on Ages` | `problems-on-ages` |
| `Percentage` | `percentage` |
| `Boats and Streams` | `boats-and-streams` |
| `Mixture and Alligation` | `mixture-and-alligation` |
| `Permutation and Combination` | `permutation-and-combination` |
| `Pipes and Cisterns` | `pipes-and-cisterns` |
| `Problems on Trains` | `problems-on-trains` |
| `Simple Interest` | `simple-interest` |
| `Compound Interest` | `compound-interest` |
| `Basic Percentage Calculation` | `basic-percentage-calculation` |
| `Coin Toss Problems` | `coin-toss-problems` |
| `Linear Equations & Systems of Equations` | `linear-equations-systems-of-equations` |

---

## Detailed Endpoint Specifications

### 1. Application Health Check
- **Route:** `GET /health`
- **Description:** Liveness check. Runs independently of database connections, question data, or legacy components.
- **Parameters:** None
- **Response `200`:**
  ```json
  {
    "success": true,
    "status": "ok"
  }
  ```

---

### 2. Get All Canonical Topics
- **Route:** `GET /api/v1/questions/topics`
- **Description:** Returns the ordered array of all 24 canonical topic names.
- **Parameters:** None
- **Response `200`:**
  ```json
  {
    "success": true,
    "data": [
      "Algebra",
      "Average",
      "Boats and Streams",
      "Calendar",
      "Clock",
      "Compound Interest",
      "Mixture and Alligation",
      "Number System",
      "Partnership",
      "Percentage",
      "Permutation and Combination",
      "Pipes and Cisterns",
      "Probability",
      "Problems on Ages",
      "Problems on Trains",
      "Profit and Loss",
      "Ratio and Proportion",
      "Simple Interest",
      "Stocks and Shares",
      "Surds and Indices",
      "Time and Work",
      "Time, Speed and Distance",
      "Trigonometry",
      "Volume and Surface Area"
    ],
    "meta": {
      "count": 24
    }
  }
  ```

---

### 3. Get Patterns by Topic
- **Route:** `GET /api/v1/questions/topic/:topic/patterns`
- **Description:** Returns canonical patterns belonging to the resolved topic.
- **Path Parameters:**
  - `:topic`: Canonical topic name or URL slug (e.g. `percentage` or `time-speed-and-distance`).
- **Response `200`:**
  ```json
  {
    "success": true,
    "data": [
      {
        "name": "Basic Percentage Calculation",
        "slug": "basic-percentage-calculation",
        "description": "Fundamental percentage calculations...",
        "questionCount": 50,
        "prerequisites": [],
        "aliases": []
      },
      {
        "name": "Successive Percentage Changes",
        "slug": "successive-percentage-changes",
        "description": "Problems involving sequential percentage adjustments...",
        "questionCount": 50,
        "prerequisites": ["Basic Percentage Calculation"],
        "aliases": []
      }
    ],
    "meta": {
      "topic": "Percentage",
      "count": 26
    }
  }
  ```
- **Error `404`:**
  ```json
  {
    "success": false,
    "error": {
      "code": "INVALID_TOPIC",
      "message": "Topic 'invalid-topic' not found. Use GET /api/v1/questions/topics for valid topics."
    }
  }
  ```

---

### 4. Get Questions by Topic (Paginated)
- **Route:** `GET /api/v1/questions/topic/:topic`
- **Description:** Paginated questions for a topic with optional difficulty filtering.
- **Path Parameters:**
  - `:topic`: Topic slug or canonical name.
- **Query Parameters:**
  - `page`: (optional) Integer $\ge 1$ (default: `1`).
  - `limit`: (optional) Integer $1 \le \text{limit} \le 100$ (default: `20`).
  - `difficulty`: (optional) Integer $1 \le \text{difficulty} \le 10$.
- **Response `200`:**
  ```json
  {
    "success": true,
    "data": [
      {
        "_id": "66fa1a2b3c4d5e6f7a8b9c0d",
        "question": "If price decreases by 10%...",
        "answer": "10%",
        "options": ["5%", "10%", "15%", "20%"],
        "explanation": "Calculation explanation...",
        "topic": "Percentage",
        "pattern": "Single Percentage Increase and Decrease",
        "difficulty": 3
      }
    ],
    "meta": {
      "page": 1,
      "limit": 20,
      "total": 492,
      "totalPages": 25,
      "count": 20
    }
  }
  ```
- **Errors:**
  - `404 INVALID_TOPIC`: Topic not found.
  - `400 INVALID_DIFFICULTY`: Difficulty not integer 1–10.
  - `400 INVALID_PAGE`: Page not integer $\ge 1$.
  - `400 INVALID_LIMIT`: Limit not integer 1–100.

---

### 5. Get Random Questions by Topic
- **Route:** `GET /api/v1/questions/topic/:topic/random`
- **Description:** Retrieves up to `limit` random unique questions for the topic.
- **Path Parameters:**
  - `:topic`: Topic slug or canonical name.
- **Query Parameters:**
  - `limit`: (optional) Integer $1 \le \text{limit} \le 100$ (default: `5`).
  - `difficulty`: (optional) Integer $1 \le \text{difficulty} \le 10$.
- **Response `200`:**
  ```json
  {
    "success": true,
    "data": [ ... ],
    "meta": {
      "count": 5,
      "limit": 5
    }
  }
  ```
- **Errors:**
  - `404 INVALID_TOPIC`: Topic not found.
  - `400 INVALID_LIMIT`: Limit not integer 1–100.
  - `400 INVALID_DIFFICULTY`: Difficulty not integer 1–10.

---

### 6. Get Questions by Topic and Pattern (Paginated)
- **Route:** `GET /api/v1/questions/topic/:topic/pattern/:pattern`
- **Description:** Paginated questions for a specific topic + pattern combination.
- **Path Parameters:**
  - `:topic`: Topic slug or canonical name.
  - `:pattern`: Pattern slug or canonical name.
- **Query Parameters:**
  - `page`: (optional) Integer $\ge 1$ (default: `1`).
  - `limit`: (optional) Integer $1 \le \text{limit} \le 100$ (default: `20`).
  - `difficulty`: (optional) Integer $1 \le \text{difficulty} \le 10$.
- **Response `200`:**
  ```json
  {
    "success": true,
    "data": [ ... ],
    "meta": {
      "page": 1,
      "limit": 20,
      "total": 50,
      "totalPages": 3,
      "count": 20
    }
  }
  ```
- **Errors:**
  - `404 INVALID_TOPIC`: Topic not found.
  - `404 INVALID_PATTERN`: Pattern not found.
  - `404 PATTERN_TOPIC_MISMATCH`: Pattern exists but does not belong to the topic.
  - `400 INVALID_DIFFICULTY` / `INVALID_PAGE` / `INVALID_LIMIT`.

---

### 7. Get Random Questions by Topic and Pattern
- **Route:** `GET /api/v1/questions/topic/:topic/pattern/:pattern/random`
- **Description:** Retrieves up to `limit` random unique questions for a topic + pattern.
- **Path Parameters:**
  - `:topic`: Topic slug or canonical name.
  - `:pattern`: Pattern slug or canonical name.
- **Query Parameters:**
  - `limit`: (optional) Integer $1 \le \text{limit} \le 100$ (default: `5`).
  - `difficulty`: (optional) Integer $1 \le \text{difficulty} \le 10$.
- **Response `200`:**
  ```json
  {
    "success": true,
    "data": [ ... ],
    "meta": {
      "count": 5,
      "limit": 5
    }
  }
  ```
- **Errors:**
  - `404 INVALID_TOPIC`: Topic not found.
  - `404 INVALID_PATTERN`: Pattern not found.
  - `404 PATTERN_TOPIC_MISMATCH`: Pattern does not belong to the topic.
  - `400 INVALID_LIMIT`: Limit not integer 1–100.
  - `400 INVALID_DIFFICULTY`: Difficulty not integer 1–10.

---

### 8. Get Single Question by ID
- **Route:** `GET /api/v1/questions/:id`
- **Description:** Retrieves a question document by its 24-character hexadecimal MongoDB ObjectId.
- **Path Parameters:**
  - `:id`: 24-character hex string matching `^[a-fA-F0-9]{24}$`.
- **Response `200`:**
  ```json
  {
    "success": true,
    "data": {
      "_id": "66fa1a2b3c4d5e6f7a8b9c0d",
      "question": "What is 25% of 200?",
      "answer": "50",
      "options": ["25", "50", "75", "100"],
      "explanation": "25% of 200 = (25/100) * 200 = 50.",
      "topic": "Percentage",
      "pattern": "Basic Percentage Calculation",
      "difficulty": 1
    }
  }
  ```
- **Errors:**
  - `404 QUESTION_NOT_FOUND`: No question found with the given ID.
  - `404 NOT_FOUND`: When `:id` does not match the 24-hex-character route regex constraint.

---

## Error Codes Reference

| Error Code | HTTP Status | Trigger Condition |
|------------|-------------|-------------------|
| `INVALID_TOPIC` | 400 / 404 | Topic slug or name cannot be resolved in canonical registry |
| `INVALID_PATTERN` | 400 / 404 | Pattern slug or name cannot be resolved in canonical registry |
| `PATTERN_TOPIC_MISMATCH` | 400 / 404 | Pattern exists in registry but belongs to a different topic |
| `QUESTION_NOT_FOUND` | 404 | No question document matches the provided MongoDB ObjectId |
| `USER_NOT_FOUND` | 404 | No user found with the given userId |
| `USER_ALREADY_EXISTS` | 409 | A user with this userId already exists |
| `GOAL_NOT_FOUND` | 404 | Goal not found or does not belong to user |
| `STUDY_PLAN_NOT_FOUND` | 404 | Study plan not found or does not belong to user |
| `DAILY_OBJECTIVE_NOT_FOUND` | 404 | Daily objective not found or does not belong to user |
| `ATTEMPT_NOT_FOUND` | 404 | Attempt not found |
| `VALIDATION_ERROR` | 400 | Missing or invalid request field / schema validation failure |
| `DUPLICATE_KEY` | 409 | Unique index violation (e.g. duplicate objective on same user+plan+date) |
| `INVALID_DIFFICULTY` | 400 | Query `?difficulty` is not an integer between 1 and 10 |
| `INVALID_PAGE` | 400 | Query `?page` is not a positive integer ($\ge 1$) |
| `INVALID_LIMIT` | 400 | Query `?limit` is not an integer between 1 and 100 |
| `NOT_FOUND` | 404 | Route or resource does not exist |
| `INTERNAL_SERVER_ERROR` | 500 | Unhandled server error (no stack trace in production) |

---

## Phase 3 — Student Learning Data Layer APIs

### Users

#### POST `/api/v1/users`
Creates a student profile.
- **Request Body:**
  ```json
  {
    "userId": "student_001",
    "name": "Jane Doe",
    "email": "jane@example.com",
    "avatar": "https://example.com/avatar.png"
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "success": true,
    "data": {
      "userId": "student_001",
      "name": "Jane Doe",
      "email": "jane@example.com",
      "avatar": "https://example.com/avatar.png",
      "createdAt": "2026-09-30T10:00:00.000Z",
      "updatedAt": "2026-09-30T10:00:00.000Z"
    }
  }
  ```
- **Errors:** `400 VALIDATION_ERROR` (missing userId/name), `409 USER_ALREADY_EXISTS`

#### GET `/api/v1/users/:userId`
Retrieves a student profile.
- **Response (200 OK):** User document.
- **Errors:** `404 USER_NOT_FOUND`

---

### Goals

#### POST `/api/v1/goals`
Creates a goal. Validates that `userId` exists and `targetDate >= startDate`.
- **Request Body:**
  ```json
  {
    "userId": "student_001",
    "title": "GATE 2027",
    "type": "entrance",
    "targetName": "GATE CS",
    "description": "Prepare for GATE aptitude",
    "startDate": "2026-10-01",
    "targetDate": "2027-02-15",
    "priority": 5,
    "status": "planned"
  }
  ```
- **Allowed Types:** `company`, `government`, `entrance`, `competitive`, `master`, `custom`
- **Allowed Statuses:** `planned`, `active`, `completed`, `paused`, `cancelled`
- **Response (201 Created):** Goal document.
- **Errors:** `400 VALIDATION_ERROR`, `404 USER_NOT_FOUND`

#### GET `/api/v1/goals/user/:userId`
Lists all goals for a student.
- **Query Params:** `?status=active` (optional)
- **Response (200 OK):** Array of goals.

#### GET `/api/v1/goals/:id`
Retrieves a single goal by ID.
- **Query Params:** `?userId=student_001` (ownership validation)

#### PATCH `/api/v1/goals/:id`
Updates goal fields. Cannot mutate `userId`.
- **Request Body:** Partial goal fields.
- **Response (200 OK):** Updated goal.

#### DELETE `/api/v1/goals/:id`
Deletes a goal.
- **Query Params:** `?userId=student_001`

---

### Study Plans

#### POST `/api/v1/study-plans`
Creates a study plan linked to a goal. Validates that `goalId` exists and belongs to `userId`. Validates every target's `topic` and `pattern` against the canonical registry without silent rewriting.
- **Request Body:**
  ```json
  {
    "userId": "student_001",
    "goalId": "66a01234567890abcdef1234",
    "name": "Quantitative Foundation",
    "scope": "short",
    "phase": "foundation",
    "startDate": "2026-10-01",
    "endDate": "2026-10-31",
    "status": "active",
    "targets": [
      {
        "topic": "Percentage",
        "pattern": "Basic Percentage Calculation",
        "targetQuestions": 15
      }
    ]
  }
  ```
- **Allowed Scopes:** `short`, `medium`, `long`
- **Allowed Phases:** `foundation`, `core`, `pattern`, `advanced`, `revision`, `mock`
- **Response (201 Created):** StudyPlan document.
- **Errors:** `400 INVALID_TOPIC`, `400 PATTERN_TOPIC_MISMATCH`, `404 GOAL_NOT_FOUND`

#### GET `/api/v1/study-plans/user/:userId`
Lists all study plans for a student.
- **Query Params:** `?goalId=&status=&phase=&scope=`

#### GET `/api/v1/study-plans/:id`
Retrieves a single study plan.

#### PATCH `/api/v1/study-plans/:id`
Updates study plan fields. Target topics/patterns are re-validated if provided. Cannot mutate `userId` or `goalId`.

#### DELETE `/api/v1/study-plans/:id`
Deletes a study plan.

---

### Daily Objectives

#### POST `/api/v1/daily-objectives`
Creates a daily objective. Enforces compound uniqueness `{ userId, planId, date }`. Date is normalized to midnight UTC (`00:00:00.000Z`). Validates ownership chain: User $\to$ StudyPlan $\to$ Goal.
- **Request Body:**
  ```json
  {
    "userId": "student_001",
    "planId": "66a01234567890abcdef1234",
    "goalId": "66a01234567890abcdef1235",
    "date": "2026-10-01",
    "topic": "Percentage",
    "patterns": [
      {
        "pattern": "Basic Percentage Calculation",
        "targetQuestions": 10,
        "targetDifficulty": 3
      },
      {
        "pattern": "Successive Percentage Changes",
        "targetQuestions": 5
      }
    ],
    "targetMinutes": 45
  }
  ```
- **Pattern-Level `targetDifficulty`:** Optional integer 1–10 per pattern.
- **Response (201 Created):** DailyObjective document.
- **Errors:** `400 VALIDATION_ERROR`, `409 DUPLICATE_KEY` (same user+plan+date)

#### GET `/api/v1/daily-objectives/user/:userId`
Lists objectives for a student with pagination and filtering.
- **Query Params:** `?planId=&date=&status=&page=1&limit=20`

#### GET `/api/v1/daily-objectives/:id`
Retrieves a single objective.

#### PATCH `/api/v1/daily-objectives/:id`
Updates completion counters, actualMinutes, pattern status. Cannot mutate `userId`, `planId`, `goalId`, or `date`.

#### DELETE `/api/v1/daily-objectives/:id`
Deletes an objective.

---

### Attempts

#### POST `/api/v1/attempts`
Records an individual question attempt. Derives snapshot fields (`topic`, `pattern`, `difficulty`, `correctAnswer`, `isCorrect`) server-side from the Question document. Updates `StudentProgress` aggregates atomically.
- **Request Body (Client):**
  ```json
  {
    "userId": "student_001",
    "questionId": "66a01234567890abcdef1234",
    "selectedAnswer": "50",
    "timeTaken": 25,
    "source": "daily_plan",
    "sessionId": "session_abc123"
  }
  ```
- **Allowed Sources:** `practice`, `daily_plan`, `adaptive`, `revision`, `mock`
- **Response (201 Created):**
  ```json
  {
    "success": true,
    "data": {
      "_id": "66b...",
      "userId": "student_001",
      "questionId": "66a01234567890abcdef1234",
      "topic": "Percentage",
      "pattern": "Basic Percentage Calculation",
      "difficulty": 1,
      "selectedAnswer": "50",
      "correctAnswer": "50",
      "isCorrect": true,
      "timeTaken": 25,
      "source": "daily_plan",
      "sessionId": "session_abc123",
      "attemptedAt": "2026-09-30T10:30:00.000Z"
    }
  }
  ```
- **Errors:** `400 VALIDATION_ERROR`, `404 QUESTION_NOT_FOUND`, `404 USER_NOT_FOUND`

#### GET `/api/v1/attempts/user/:userId`
Lists attempts for a student (paginated).
- **Query Params:** `?topic=&pattern=&isCorrect=true&source=&page=1&limit=20`

#### GET `/api/v1/attempts/:id`
Retrieves a single attempt. Historical snapshot fields cannot be modified via HTTP endpoints.

---

### Student Progress

Read-only endpoints for factual student learning statistics. Public mutation of `mastery` or `highestDifficultyMastered` is prohibited.

#### GET `/api/v1/progress/:userId`
Lists all progress records for a student across all topics and patterns.
- **Query Params:** `?page=1&limit=50&topic=&pattern=`

#### GET `/api/v1/progress/:userId/topics`
(Q1) Returns all progress records, optionally filtered by `?topic=`.

#### GET `/api/v1/progress/:userId/patterns?topic=Percentage`
(Q2) Returns progress records for all patterns within the specified topic.

#### GET `/api/v1/progress/:userId/weakest`
(Q4) Returns patterns with attempts $> 0$ sorted by stored accuracy ascending (lowest accuracy first).

#### GET `/api/v1/progress/:userId/difficulty-distribution`
(Q7) Returns attempt count, correct, and incorrect breakdown grouped by difficulty level (1–10).

#### GET `/api/v1/progress/:userId/accuracy-over-time`
(Q8) Returns chronological time-series of running accuracy from Attempt history.

#### GET `/api/v1/progress/:userId/by-source`
(Q9) Returns attempt breakdown grouped by attempt source (`practice`, `daily_plan`, etc.).

#### GET `/api/v1/progress/prerequisites/:patternName`
(Q10) Returns stored prerequisite data from canonical registry:
```json
{
  "success": true,
  "data": {
    "pattern": "Basic Percentage Calculation",
    "topic": "Percentage",
    "prerequisites": [],
    "prerequisiteCount": 0,
    "dependents": ["Successive Percentage Changes"],
    "dependentCount": 4,
    "isFoundational": true
  }
}
```
*Note: Returns factual data only. Does NOT return adaptive eligibility determinations.*

---

## Phase 4 — Adaptive Decision Engine API

### Next Question Recommendation

#### `GET /api/v1/adaptive/next-question`
Answers "What question should this student solve next?" based on cognitive state, objectives, prerequisite eligibility, and recent performance.

- **Query Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | `userId` | string | **Yes** | Student ID (e.g. `student_001`) |
  | `topic` | string | No | Topic filter (name or URL slug) |
  | `pattern` | string | No | Explicit pattern request (name or URL slug) |
  | `planId` | string | No | Scopes selection to this study plan |
  | `objectiveId` | string | No | Scopes selection to this daily objective |

- **Security & Content Integrity:**
  - **Zero Answer Leakage**: Sensitive fields (`answer`, `correctAnswer`, `explanation`) are strictly stripped from the returned question payload.
  - **Authoritative Snapshot**: Answers and explanations are validated and recorded server-side when submitted via `POST /api/v1/attempts`.

- **Success Response (`200 OK`):**
  ```json
  {
    "success": true,
    "data": {
      "question": {
        "_id": "66a01234567890abcdef1234",
        "question": "What is 25% of 200?",
        "options": ["25", "50", "75", "100"],
        "topic": "Percentage",
        "pattern": "Basic Percentage Calculation",
        "difficulty": 1
      },
      "decision": {
        "algorithmVersion": "v1",
        "selectedTopic": "Percentage",
        "selectedPattern": "Basic Percentage Calculation",
        "mastery": 0.0,
        "masteryLabel": "weak",
        "recentAccuracy": 0.0,
        "targetDifficulty": 1,
        "selectedDifficulty": 1,
        "isFallback": false,
        "difficulty": {
          "baseDifficulty": 1,
          "adjustment": 0,
          "targetDifficulty": 1,
          "selectedDifficulty": 1,
          "fallbackUsed": false
        },
        "prerequisiteRedirect": null,
        "reasonCodes": [
          "DAILY_OBJECTIVE",
          "DIFFICULTY_HELD",
          "TARGET_DIFFICULTY_USED"
        ]
      }
    }
  }
  ```

- **Error Responses:**
  - `400 VALIDATION_ERROR`: Missing `userId`, or `topic`/`pattern` mismatch.
  - `404 USER_NOT_FOUND`: Specified `userId` does not exist.
  - `404 STUDY_PLAN_NOT_FOUND`: Specified `planId` not found or does not belong to user.
  - `404 DAILY_OBJECTIVE_NOT_FOUND`: Specified `objectiveId` not found or does not belong to user.
  - `404 NO_QUESTION_AVAILABLE`: No question available matching selection criteria.

---

## Phase 5: Automated Planning & Revision Engine

Phase 5 introduces long-term preparation planning, daily objective scheduling, dynamic progress-aware replanning, and spaced-repetition revision management.

### Planning Endpoints

> **Scope Requirement**: Goal type controls duration presets only and does NOT imply a default syllabus. Plan generation and preview require an explicit `scope`: either `scope.topics`, `scope.patterns`, or `scope.allCanonicalPatterns: true`. Omitting scope returns `400 PLANNING_SCOPE_REQUIRED`.

#### POST `/api/v1/planning/generate`
Generates a committed `StudyPlan` and associated `DailyObjective` documents for a student.

- **Request Body:**
  ```json
  {
    "userId": "student_001",
    "goalId": "66a01234567890abcdef1235",
    "name": "TCS Prep Plan",
    "durationPreset": "7d",
    "dailyMinutes": 45,
    "maxPatternsPerDay": 3,
    "referenceDate": "2026-10-01",
    "scope": {
      "topics": ["Percentage", "Time, Speed and Distance"]
    }
  }
  ```
- **Supported Presets:** `3d`, `7d`, `9d`, `1m`, `2m`, `3m`, `6m`.
- **Custom Horizon:** Supply `startDate` (`YYYY-MM-DD`) and `targetDate` (`YYYY-MM-DD`). Supplying both `durationPreset` and `targetDate` returns `400 PLANNING_HORIZON_CONFLICT`.
- **Success Response (`201 Created`):**
  ```json
  {
    "success": true,
    "data": {
      "plan": { ... },
      "objectivesCount": 7,
      "prerequisitesAdded": 2,
      "warnings": []
    }
  }
  ```

#### POST `/api/v1/planning/preview`
Simulates plan and daily objective generation with **ZERO** database writes.
- **Request Body:** Same as `/generate`.
- **Success Response (`200 OK`):**
  ```json
  {
    "success": true,
    "data": {
      "horizon": { "days": 7, "startDate": "2026-10-01", "targetDate": "2026-10-07" },
      "proposedPlan": { ... },
      "objectives": [ ... ],
      "prerequisitesAdded": 1,
      "warnings": []
    }
  }
  ```

#### POST `/api/v1/planning/plans/:planId/replan`
Re-evaluates remaining unfinished work against current progress, preserving past completed objectives and today's objective (if progress exists), while regenerating future pending objectives.
- **Request Body:**
  ```json
  {
    "userId": "student_001",
    "referenceDate": "2026-10-03"
  }
  ```
- **Success Response (`200 OK`):**
  ```json
  {
    "success": true,
    "data": {
      "planId": "66a01234567890abcdef1236",
      "preservedCount": 2,
      "deletedCount": 5,
      "generatedCount": 5,
      "regeneratedObjectives": [ ... ]
    }
  }
  ```

---

### Revision Endpoints

#### GET `/api/v1/revisions/due`
Retrieves all revision items due for review on or before the reference date, sorted deterministically by overdue first, lower mastery first, topic, pattern.
- **Query Parameters:** `?userId=student_001&referenceDate=2026-10-05`
- **Success Response (`200 OK`):**
  ```json
  {
    "success": true,
    "data": [
      {
        "topic": "Percentage",
        "pattern": "Basic Percentage Calculation",
        "stage": 1,
        "intervalDays": 3,
        "nextReviewDate": "2026-10-02T00:00:00.000Z",
        "mastery": 0.45,
        "reasonCode": "OVERDUE_REVISION"
      }
    ]
  }
  ```

#### GET `/api/v1/revisions/plan`
Generates a dedicated 1-day or 2-day revision session bounded by question budgets and daily pattern limits.
- **Query Parameters:** `?userId=student_001&days=2&questionBudget=20&patternsPerDay=3&referenceDate=2026-10-01`
- **Success Response (`200 OK`):**
  ```json
  {
    "success": true,
    "data": {
      "days": 2,
      "totalQuestions": 20,
      "schedule": [
        {
          "dayNumber": 1,
          "date": "2026-10-01",
          "totalQuestions": 10,
          "patterns": [
            {
              "topic": "Percentage",
              "pattern": "Basic Percentage Calculation",
              "targetQuestions": 5,
              "source": "due_revision",
              "reasonCode": "DUE_TODAY"
            }
          ]
        }
      ]
    }
  }
  ```

#### POST `/api/v1/revisions/rebuild`
Replays all historical user attempts in chronological order to reconstruct exact `RevisionItem` state offline.
- **Request Body:**
  ```json
  {
    "userId": "student_001"
  }
  ```
- **Success Response (`200 OK`):**
  ```json
  {
    "success": true,
    "data": {
      "userId": "student_001",
      "attemptsReplayed": 42,
      "revisionItemsCreated": 6,
      "completedCount": 2,
      "scheduledCount": 4
    }
  }
  ```

---

## 8. Phase 6: Mock Test & Exam Simulation Engine

### Mock Blueprints

#### POST `/api/v1/mock-blueprints`
Creates a new mock test blueprint with canonical validation, signed scoring rules, explicit section scopes, and SHA-256 fingerprinting.
- **Request Body:**
  ```json
  {
    "title": "Full Quantitative Aptitude Diagnostic",
    "description": "Standard benchmark test covering Percentage and Ratio",
    "mode": "standard",
    "navigationPolicy": "free",
    "durationMinutes": 60,
    "sections": [
      {
        "sectionId": "sec-quant-1",
        "title": "Quantitative Section",
        "questionCount": 10,
        "scope": {
          "topics": ["Percentage"]
        },
        "difficultyDistribution": {
          "easy": 0.30,
          "medium": 0.50,
          "hard": 0.20
        }
      }
    ]
  }
  ```
- **Response (201 Created):** Returns created blueprint with server-derived `blueprintFingerprint`, `totalQuestions`, and `algorithmVersion`.

#### GET `/api/v1/mock-blueprints`
Lists all active mock test blueprints.
- **Query Params:** `?mode=standard&status=active`
- **Response (200 OK):** Array of blueprint objects.

#### GET `/api/v1/mock-blueprints/:id`
Retrieves a specific blueprint by ID.
- **Response (200 OK):** Blueprint document.
- **Errors:** `404 MOCK_BLUEPRINT_NOT_FOUND`

#### POST `/api/v1/mock-blueprints/preview`
Zero-write dry-run preview evaluating candidate availability, section timing, diagnostic rankings, and difficulty distributions without persisting records.
- **Response (200 OK):** Preview analysis summary with `canGenerate: true`.

---

### Mock Sessions

#### POST `/api/v1/mock-sessions`
Creates an assessment session from a `blueprintId` or inline `blueprint`. Assembles questions deterministically using seeded PRNG and largest-remainder allocation.
- **Request Body:**
  ```json
  {
    "blueprintId": "66a01234567890abcdef1234",
    "userId": "student_001",
    "generationSeed": "optional-custom-seed"
  }
  ```
- **Response (201 Created):** MockSession document in `created` status with ordered `questionSequence`.

#### POST `/api/v1/mock-sessions/:id/start`
Starts the session, establishes server-authoritative `startedAt` and `expiresAt` timestamps, and activates the first section. Idempotent on repeated calls.
- **Request Body:** `{ "userId": "student_001" }`
- **Response (200 OK):** Updated session in `started` status.

#### GET `/api/v1/mock-sessions/:id`
Retrieves session status, timing, and question summary DTOs (without correct answers).
- **Query Params:** `?userId=student_001`
- **Response (200 OK):** Session summary with response state indicators (`isAnswered`, `isMarkedForReview`, `isViewed`).

#### GET `/api/v1/mock-sessions/:id/questions/:questionId`
Views a question during test taking. Records draft `viewed` state and sanitizes DTO to strictly forbid answer leakage.
- **Query Params:** `?userId=student_001`
- **Response (200 OK):** Sanitized question DTO + current draft response state.
- **Errors:** `409 SECTION_LOCKED` (under section-locked navigation when accessing outside active section).

#### POST `/api/v1/mock-sessions/:id/responses`
Saves draft response, edits answer, clears answer, or toggles review flag under response freeze contention barrier.
- **Request Body:**
  ```json
  {
    "userId": "student_001",
    "questionId": "66a01234567890abcdef1234",
    "selectedAnswer": "Option A",
    "isMarkedForReview": true,
    "clearAnswer": false,
    "timeTakenSeconds": 35
  }
  ```
- **Response (200 OK):** Updated `MockResponse` state.
- **Errors:** `400 INVALID_OPTION`, `400 INVALID_TIME_TAKEN`, `409 RESPONSE_FROZEN`, `409 MOCK_SESSION_EXPIRED`.

#### POST `/api/v1/mock-sessions/:id/sections/:sectionId/complete`
Manually completes active section under `section_locked` navigation. Atomically advances to next section or triggers final-section finalization barrier.
- **Response (200 OK):** Next active section state or finalized result summary.

#### POST `/api/v1/mock-sessions/:id/submit`
Submits session and initiates distributed finalization. Idempotent upon completion.
- **Request Body:** `{ "userId": "student_001" }`
- **Response (200 OK):** Authoritative `resultSummary` across all 6 analytics domains.
- **Errors:** `409 MOCK_SESSION_EXPIRED`, `409 FINALIZATION_IN_PROGRESS`.

#### POST `/api/v1/mock-sessions/:id/abandon`
Abandons an unfinalized session. Permanently denies post-test review and scoring.
- **Response (200 OK):** Updated session in `abandoned` status.
- **Errors:** `409 SESSION_STATE_CONFLICT` (if finalization lease already acquired).

#### GET `/api/v1/mock-sessions/:id/result`
Retrieves finalized result summary and analytics.
- **Query Params:** `?userId=student_001`
- **Response (200 OK):** Complete scoring and 6-domain analytics.
- **Errors:** `400 MOCK_SESSION_NOT_TERMINAL`, `409 FINALIZATION_IN_PROGRESS`.

#### GET `/api/v1/mock-sessions/:id/review`
Exposes post-test review with questions, student answers, correct answers, explanations, and step-by-step solutions. Accessible strictly after terminal `submitted` or `expired` status.
- **Query Params:** `?userId=student_001`
- **Response (200 OK):** Array of review question DTOs with full solutions.
- **Errors:** `400 MOCK_SESSION_NOT_TERMINAL` (rejected for active or abandoned sessions).

---

## Phase Boundary Invariant

This API is strictly bounded to **Phases 1 through 6**:
- Phase 1: Project Foundation & Database Setup
- Phase 2: Question Intelligence Layer & Prerequisite DAG
- Phase 3: Student Learning Data Layer
- Phase 4: Adaptive Decision Engine
- Phase 5: Automated Planning, Daily Objectives & Revision Engine
- Phase 6: Mock Test & Exam Simulation Engine

Intentionally **NOT** implemented in this phase (Reserved for Phase 7+):
- Authentication, Authorization, JWT, passwords, OAuth, RBAC
- LLM tutoring, synthetic hints, and misconception analysis (Phase 7)
- Predictive cross-cohort percentiles and employability scoring (Phase 7+)
- Biometric and video proctoring (Phase 7+)
- Frontend client application (Phase 8)
- Mentor, Mentee, Teacher subsystems (permanently excluded)



