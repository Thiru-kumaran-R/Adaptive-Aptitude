# Adaptive Aptitude API

A backend API for an adaptive aptitude-learning platform.

**Current completed scope: Phase 1 (Foundation) + Phase 2 (Question Intelligence Layer) + Phase 3 (Student Learning Data Layer) + Phase 4 (Adaptive Decision Engine) + Phase 5 (Automated Planning, Daily Objectives & Revision Engine) + Phase 6 (Mock Test & Exam Simulation Engine)**

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js |
| Framework | Express.js |
| Database | MongoDB (Atlas) |
| ODM | Mongoose |
| Environment | dotenv |
| Testing | Jest + Supertest |
| Dev server | nodemon |

No `express-validator` — custom validation middleware is used throughout.

---

## Project Structure

```
adaptive-aptitude-api/
├── src/
│   ├── config/
│   │   ├── database.js
│   │   ├── adaptiveConfig.js              — Phase 4: Centralized engine config
│   │   ├── planningConfig.js              — Phase 5: Planning engine config
│   │   └── revisionConfig.js              — Phase 5: Revision engine config
│   ├── controllers/
│   │   ├── questionController.js           — Phase 2
│   │   ├── userController.js               — Phase 3
│   │   ├── goalController.js               — Phase 3
│   │   ├── studyPlanController.js          — Phase 3
│   │   ├── dailyObjectiveController.js     — Phase 3
│   │   ├── attemptController.js            — Phase 3
│   │   ├── studentProgressController.js    — Phase 3
│   │   ├── adaptiveController.js           — Phase 4: Adaptive API
│   │   ├── planningController.js           — Phase 5: Planning API
│   │   └── revisionController.js           — Phase 5: Revision API
│   ├── data/
│   │   ├── canonicalPatternRegistry.json  — 24 topics, 278 patterns
│   │   └── legacyPatternMapping.json      — 308 legacy mappings
│   ├── middleware/
│   │   ├── errorHandler.js
│   │   └── notFound.js
│   ├── models/
│   │   ├── questionModel.js               — Phase 2
│   │   ├── userModel.js                   — Phase 3
│   │   ├── goalModel.js                   — Phase 3
│   │   ├── studyPlanModel.js              — Phase 3/5
│   │   ├── dailyObjectiveModel.js         — Phase 3/5
│   │   ├── attemptModel.js                — Phase 3
│   │   ├── studentProgressModel.js        — Phase 3/4
│   │   ├── revisionItemModel.js           — Phase 5: Spaced revision item
│   │   ├── revisionProcessingRecordModel.js — Phase 5: Durable idempotency receipt
│   │   ├── mockBlueprintModel.js          — Phase 6: Mock blueprint
│   │   ├── mockSessionModel.js            — Phase 6: Mock session & distributed lease
│   │   ├── mockResponseModel.js           — Phase 6: Mock response & draft state
│   │   └── mockAttemptFinalizationRecordModel.js — Phase 6: Cryptographic receipt
│   ├── routes/
│   │   ├── questionRoutes.js              — Phase 2
│   │   ├── userRoutes.js                  — Phase 3
│   │   ├── goalRoutes.js                  — Phase 3
│   │   ├── studyPlanRoutes.js             — Phase 3
│   │   ├── dailyObjectiveRoutes.js        — Phase 3
│   │   ├── attemptRoutes.js               — Phase 3
│   │   ├── progressRoutes.js              — Phase 3
│   │   ├── adaptiveRoutes.js              — Phase 4: Next Question routes
│   │   ├── planningRoutes.js              — Phase 5: Planning routes
│   │   ├── revisionRoutes.js              — Phase 5: Revision routes
│   │   ├── mockBlueprintRoutes.js         — Phase 6: Blueprint routes
│   │   └── mockSessionRoutes.js           — Phase 6: Session & assessment routes
│   ├── services/
│   │   ├── hierarchyService.js            — Phase 2: prerequisite DAG
│   │   ├── patternRegistryService.js      — Phase 2: registry lookups
│   │   ├── questionService.js             — Phase 2: question queries
│   │   ├── userService.js                 — Phase 3
│   │   ├── goalService.js                 — Phase 3
│   │   ├── studyPlanService.js            — Phase 3
│   │   ├── dailyObjectiveService.js       — Phase 3
│   │   ├── attemptService.js              — Phase 3 (with Phase 4 & 5 post-commit hooks)
│   │   ├── studentProgressService.js      — Phase 3
│   │   ├── adaptiveQueryHelper.js         — Phase 3: Q1–Q10 data queries
│   │   ├── adaptive/                      — Phase 4: Adaptive Decision Engine
│   │   │   ├── masteryService.js
│   │   │   ├── prerequisiteService.js
│   │   │   ├── patternSelectionService.js
│   │   │   ├── difficultySelectionService.js
│   │   │   ├── questionSelectionService.js
│   │   │   ├── adaptiveExplanationService.js
│   │   │   └── adaptiveEngine.js
│   │   ├── planning/                      — Phase 5: Automated Planning Engine
│   │   │   ├── planningScopeService.js
│   │   │   ├── dailyObjectiveGenerationService.js
│   │   │   ├── studyPlanGenerationService.js
│   │   │   ├── planningPreviewService.js
│   │   │   ├── planReplanningService.js
│   │   │   └── planningEngine.js
│   │   └── revision/                      — Phase 5: Spaced Revision Engine
│   │       ├── revisionTransitionHelper.js
│   │       ├── revisionSchedulerService.js
│   │       ├── revisionRecoveryService.js
│   │       ├── revisionQueryService.js
│   │       └── revisionPlanService.js
│   ├── utils/
│   │   ├── apiResponse.js
│   │   ├── asyncHandler.js
│   │   └── dateUtils.js                   — Phase 5: Centralized logical date utils
│   ├── validators/questionValidator.js
│   ├── app.js
│   └── server.js
├── scripts/
│   ├── importQuestions.js          — Full import pipeline
│   ├── validateQuestions.js        — Pre-import validation only
│   ├── verifyPhase2.js             — Post-import structural verification
│   ├── verifyContentIntegrity.js   — SHA-256 content + metadata check
│   └── rebuildStudentProgress.js   — Phase 3: repair progress aggregates
├── tests/
│   ├── helpers/
│   │   ├── dbSetup.js
│   │   └── seedData.js
│   ├── architecture_guard.test.js
│   ├── hierarchy.test.js
│   ├── import_safety.test.js
│   ├── model_validation.test.js
│   ├── phase2_verification.test.js
│   ├── phase3_database.test.js     — Phase 3: Tests A–G
│   ├── phase3_api.test.js          — Phase 3: Tests H–K
│   ├── phase3_adaptive_query.test.js — Phase 3: Q1–Q10
│   ├── phase3_regression.test.js   — Phase 3: regression + boundary
│   ├── adaptiveMastery.test.js     — Phase 4: Tests M1–M8
│   ├── adaptivePrerequisites.test.js — Phase 4: Tests P1–P5
│   ├── adaptiveDifficulty.test.js  — Phase 4: Tests D1–D7
│   ├── adaptivePatternSelection.test.js — Phase 4: Tests PS1–PS7
│   ├── adaptiveQuestionSelection.test.js — Phase 4: Tests QS1–QS9
│   ├── adaptiveEndpoint.test.js    — Phase 4: Tests AE1–AE7
│   ├── phase4_verification.test.js — Phase 4: Scenarios 1–5
│   ├── questions.test.js
│   ├── registry.test.js
│   ├── dateUtils.test.js           — Phase 5: Logical date operations
│   ├── planningGeneration.test.js  — Phase 5: Plan & objective generation
│   ├── planningReplanning.test.js  — Phase 5: Progress-aware replanning
│   ├── revisionEngine.test.js      — Phase 5: Spaced repetition transitions
│   └── revisionPlan.test.js        — Phase 5: Dedicated revision sessions
├── docs/
│   ├── API_DOCUMENTATION.md
│   ├── PHASE2_WALKTHROUGH.md
│   ├── PHASE3_DATABASE_ARCHITECTURE.md
│   ├── PHASE3_WALKTHROUGH.md
│   ├── PHASE4_ADAPTIVE_ENGINE.md
│   ├── PHASE4_WALKTHROUGH.md
│   ├── PHASE5_PLANNING_REVISION_ENGINE.md
│   └── PHASE5_WALKTHROUGH.md
├── .env.example
├── .gitignore
├── jest.config.js
├── package.json
└── README.md
```

---

## Installation

```bash
git clone <repo>
cd adaptive-aptitude-api
npm install
```

---

## Environment Setup

```bash
cp .env.example .env
```

Edit `.env`:

```env
PORT=5000
MONGODB_URI=mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/adaptive_aptitude
TEST_MONGODB_URI=mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/adaptive_aptitude_test
NODE_ENV=development
```

> **Never commit `.env`** — it is in `.gitignore`.

Optionally set `QUESTIONS_BANK_PATH` to the absolute path of your question bank JSON directory if it is not at the default location (`../Questions bank` relative to this project).

---

## Running Locally

```bash
npm run dev     # Development (nodemon)
npm start       # Production
```

Health check:
```
GET http://localhost:5000/health
```

---

## Question Import Process

The import pipeline validates all 12,000 source questions before touching the database.

### Step 1: Validate source data (no DB writes)

```bash
npm run validate:questions
```

### Step 2: Dry-run import (validation only, no DB writes)

```bash
npm run import:questions
```

### Step 3: Clean import (requires explicit flag)

```bash
npm run import:questions -- --clean
```

**Safety checks enforced before any deletion:**
- `NODE_ENV` must not be `production`
- Connected database must be `adaptive_aptitude`
- `--clean` flag must be explicitly provided
- Only the `questions` collection is cleared — `dropDatabase()` is never called
- All 12,000 source records are fully validated BEFORE the collection is cleared

---

## Phase 2 Verification

After import:

```bash
npm run verify:phase2     # Structural verification (counts, distributions, DAG)
npm run verify:content    # SHA-256 content + metadata integrity
```

---

## Running Tests

```bash
npm test
```

Tests require:
- `TEST_MONGODB_URI` set in `.env` (separate test database)
- `MONGODB_URI` set if you want `phase2_verification.test.js` to check the imported data (skipped gracefully if not available)

---

## API Examples

```bash
# Topics
GET /api/v1/questions/topics

# Patterns for a topic (slug or canonical name)
GET /api/v1/questions/topic/percentage/patterns
GET /api/v1/questions/topic/time-speed-and-distance/patterns

# Paginated questions
GET /api/v1/questions/topic/percentage?page=1&limit=20
GET /api/v1/questions/topic/percentage?difficulty=5

# Random questions (max 100)
GET /api/v1/questions/topic/percentage/random?limit=5

# Pattern-level queries
GET /api/v1/questions/topic/percentage/pattern/basic-percentage-calculation
GET /api/v1/questions/topic/percentage/pattern/basic-percentage-calculation/random?limit=3

# Single question
GET /api/v1/questions/<mongodb-id>

# Phase 4 Adaptive Recommendation — Next Question
GET /api/v1/adaptive/next-question?userId=student_001
GET /api/v1/adaptive/next-question?userId=student_001&topic=percentage
GET /api/v1/adaptive/next-question?userId=student_001&planId=<planId>

# Phase 5 Automated Planning & Revisions
POST /api/v1/planning/generate (userId, goalId, durationPreset: "7d", dailyMinutes: 45)
POST /api/v1/planning/preview (zero-write dry-run)
POST /api/v1/planning/plans/:planId/replan (userId, referenceDate)
GET  /api/v1/revisions/due?userId=student_001
GET  /api/v1/revisions/plan?userId=student_001&days=2&questionBudget=20
POST /api/v1/revisions/rebuild (userId)
```

---

## Architecture Overview

```
CLIENT
   ↓
GET /api/v1/adaptive/next-question?userId=...
   ↓
adaptiveRoutes.js → adaptiveController.js
   ↓
adaptiveEngine.js (Stateless Orchestrator)
   ├── patternSelectionService.js   (5-tier scope cascade + priority formula)
   ├── prerequisiteService.js      (DAG validation + recursive remediation)
   ├── difficultySelectionService.js (recent window accuracy + boundary clamping)
   ├── questionSelectionService.js  (outward fallback + 20-attempt exclusion + zero-leakage DTO)
   └── adaptiveExplanationService.js (15 standardized audit reason codes)
   ↓
Updates StudentProgress (mastery, highestDifficultyMastered)
```

---

## Phase Roadmap

| Phase | Scope | Status |
|-------|-------|--------|
| **Phase 1** | Project foundation (Express, MongoDB, health endpoint) | ✅ Complete |
| **Phase 2** | Question intelligence layer (12k questions, 24 topics, 278 patterns, APIs) | ✅ Complete |
| **Phase 3** | Student learning data layer (User, Goal, StudyPlan, DailyObjective, Attempt, StudentProgress, Q1–Q10) | ✅ Complete |
| **Phase 4** | Adaptive decision engine (mastery computation, eligibility gating, difficulty selection) | ✅ Complete |
| Phase 5 | Study planning and revision intelligence | 🔲 Not started |
| Phase 6 | Mock-test engine and analytics | 🔲 Not started |
| Phase 7 | LLM tutoring / explanations / misconception analysis | 🔲 Not started |
| Phase 8 | Frontend integration and full product workflows | 🔲 Not started |

---

## Phase 3 & 4 Architecture (Implemented)

```
USER
 │
 ├── GOALS
 │      └── STUDY PLANS
 │             └── DAILY OBJECTIVES (unique per user+plan+date)
 │
 ├── ATTEMPTS  (server-side snapshot: topic, pattern, difficulty, correctAnswer, isCorrect)
 │
 └── STUDENT PROGRESS  (aggregate: attempts, accuracy, streaks, mastery, highestDifficultyMastered)
         ↑
 ┌───────┴────────────────────────────────────────┐
 │ PHASE 4 ADAPTIVE DECISION ENGINE               │
 │ • Evaluates Cognitive Mastery & Prerequisites │
 │ • Selects Optimal Next Pattern & Difficulty    │
 │ • Delivers Sanitized Next Question             │
 └────────────────────────────────────────────────┘
```

---

## Phase 6: Mock Test & Exam Simulation Engine

Phase 6 provides standardized exam simulations, targeted diagnostic assessments, draft response state management, millisecond-exact session timing, and crash-proof, distributed finalization with resilient three-path lease recovery:
- **Modes**: Standard (fixed benchmark) and Diagnostic (4-bucket student mastery ranking: Weak, Unseen, Developing, Mastered).
- **Difficulty Distribution**: Deterministic largest-remainder allocation ($30\%$ Easy, $50\%$ Medium, $20\%$ Hard).
- **Navigation Policies**: Free navigation and Section-locked navigation with transactional section deadlines.
- **Concurrency & Leases**: Optimistic response freeze contention (`responseMutationVersion`) and three-path distributed lease recovery (Path A initial acquisition, Path B1 crash recovery, Path B2 failed-state retry).
- **Answered-Only Attempts**: Only answered questions create Phase 3 Attempts and cryptographic receipts; unanswered questions create neither.
- **Result Parity**: Pure `calculateMockResult` function guarantees bit-for-bit parity between initial completion and `rebuildMockResult`.

See [`docs/PHASE6_MOCK_TEST_ENGINE.md`](docs/PHASE6_MOCK_TEST_ENGINE.md) and [`docs/PHASE6_WALKTHROUGH.md`](docs/PHASE6_WALKTHROUGH.md) for full architecture and verification evidence.

---

## Phase 3 & 6 Scripts

```bash
# Rebuild progress aggregates from Attempt history (dry-run)
npm run rebuild:progress -- --userId=student_001

# Execute rebuild
npm run rebuild:progress -- --userId=student_001 --confirm
npm run rebuild:progress -- --all --confirm

# Phase 6 index audit and executionStats analysis
node scripts/auditPhase6Indexes.js
```

---

## Verification & Dataset

- **Tests:** 33 test suites, 508 tests, 0 failures (`npx jest --runInBand --forceExit`)
- **12,000 questions** across 24 canonical aptitude topics
- **278 canonical patterns** with 410 prerequisite edges
- **308 legacy pattern mappings** for compatibility
- **12,000 / 12,000 SHA-256 content fingerprints verified** (`npm run verify:content`)
- Single `questions` collection in `adaptive_aptitude` database
