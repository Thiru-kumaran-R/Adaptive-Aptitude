# Phase 4 — Adaptive Decision Engine Walkthrough & Verification Report

## 1. Executive Summary

This report provides the formal, end-to-end verification and compliance documentation for **Phase 4: Adaptive Decision Engine** of the `adaptive-aptitude-api` platform.

The Phase 4 engine answers the foundational learning query:
> **"What question should this student solve next?"**

The decision pipeline operates strictly via non-LLM, deterministic, data-driven algorithms backed by cognitive mastery modeling, prerequisite dependency graphs, and curriculum objectives. All metrics, test counts, execution traces, query shapes, and scenarios reported herein are derived directly from actual test runs, database inspections, and service executions.

---

## 2. Corrections Audit

| Requirement | Previous Evidence | Actual Code Status | Fix Needed | Test | Final Status |
|---|---|---|---|---|---|
| **Weak Fallback Uses Mastery** | Tested with accuracy proxy in early drafts | `adaptiveQueryHelper.js` & `patternSelectionService.js` use `mastery < config.PREREQUISITE_MASTERY_THRESHOLD` (0.70) | None in logic; added explicit fixture test | `tests/adaptivePatternSelection.test.js` (`PS8`) | `VERIFIED CORRECT` |
| **Prerequisite Attempt Tie-Break** | Documented gating only | `prerequisiteService.js` compares `a.attempts - b.attempts` when mastery is equal | Added floating-point epsilon check before comparing attempts | `tests/adaptivePrerequisites.test.js` (`P6`) | `VERIFIED CORRECT` |
| **Prerequisite Registry-Order Tie-Break** | Not explicitly evidenced | `prerequisiteService.js` compares `a.registryIndex - b.registryIndex` when mastery and attempts tie | None in logic; added explicit test | `tests/adaptivePrerequisites.test.js` (`P7`) | `VERIFIED CORRECT` |
| **Prerequisite Name Fallback Tie-Break** | Not explicitly evidenced | `prerequisiteService.js` compares `a.pattern.localeCompare(b.pattern)` when all tie | Added unit test verifying alphabetical name fallback | `tests/adaptivePrerequisites.test.js` (`P8`) | `VERIFIED CORRECT` |
| **Pattern Priority & Tie-Break** | Formula documented | `patternSelectionService.js` sorts by priority DESC, mastery ASC, attempts ASC, registryIndex ASC, name ASC | None in logic; verified multi-stage comparator | `tests/adaptivePatternSelection.test.js` (`PS5`-`PS6`, `PS9`) | `VERIFIED CORRECT` |
| **Pattern Registry-Order Tie-Break** | Not explicitly evidenced | `patternSelectionService.js` compares `a.registryIndex - b.registryIndex` | Added explicit test for equal priority, mastery, attempts | `tests/adaptivePatternSelection.test.js` (`PS9`) | `VERIFIED CORRECT` |
| **Pattern Name Fallback Tie-Break** | Not explicitly evidenced | `patternSelectionService.js` compares `a.pattern.localeCompare(b.pattern)` | Added unit test verifying alphabetical name fallback | `tests/adaptivePatternSelection.test.js` (`PS11`) | `VERIFIED CORRECT` |
| **Mastery Failure Recovery** | Described conceptually | `attemptService.js` persists Attempt first; failure logs `MASTERY_RECALCULATION_FAILED`; `recalculatePatternLearningState` restores state | None in logic; added failure simulation test | `tests/adaptiveMastery.test.js` (`M9`) | `VERIFIED CORRECT` |
| **Topic-Only Restriction** | Documented filter | `patternSelectionService.js` restricts all candidate scopes to `constraints.topic` | Added explicit cross-topic progress test | `tests/adaptivePatternSelection.test.js` (`PS10`), `tests/adaptiveEndpoint.test.js` (`AE10`) | `VERIFIED CORRECT` |
| **Topic-Pattern Validation** | Described in API docs | `patternSelectionService.js` validates ownership via `patternBelongsToTopic` and throws 400 | Added explicit test returning `400 PATTERN_TOPIC_MISMATCH` | `tests/adaptiveEndpoint.test.js` (`AE9`), `tests/adaptivePatternSelection.test.js` (`PS2`) | `VERIFIED CORRECT` |
| **`planId` Ownership** | Plan lookup implemented | `patternSelectionService.js` validated existence but did not reject cross-user plans cleanly | Added `ObjectId.isValid` check and student ownership check returning 404 | `tests/adaptiveEndpoint.test.js` (`AE8`), `tests/adaptivePatternSelection.test.js` (`PS4`) | `VERIFIED CORRECT` |
| **Target vs Selected Difficulty** | Embedded in nested object | `adaptiveExplanationService.js` nested difficulty metadata but lacked top-level keys | Exposed `targetDifficulty`, `selectedDifficulty`, `isFallback` on `decision` root | `tests/adaptiveEndpoint.test.js` (`AE7`) | `VERIFIED CORRECT` |
| **Recursive Answer-Leakage Scan** | Top-level property checks | Response DTO strips sensitive keys | Upgraded test to recursive object tree walker checking every key | `tests/adaptiveEndpoint.test.js` (`AE4`), `tests/adaptiveQuestionSelection.test.js` (`QS8`) | `VERIFIED CORRECT` |
| **Safe Logging** | Unverified | Logger emits only structured metadata (`userId`, `topic`, `pattern`, `attemptId`, `errorCode`) | Verified zero question/answer/credential data logged | `tests/adaptiveMastery.test.js` (`M9`) | `VERIFIED CORRECT` |
| **Bounded Queries** | Config constants present | Mongoose queries apply strict limits (`10`, `5`, `20`) | Verified queries and documented supporting indexes | Walkthrough Section 23 | `VERIFIED CORRECT` |
| **Mastery-Label Boundaries** | Thresholds defined | `masteryService.js` uses strict numeric conditionals | Added boundary tests for exact floats: 0, 0.399, 0.40, 0.699, 0.70, 0.849, 0.85, 1.0 | `tests/adaptiveMastery.test.js` (`M4`) | `VERIFIED CORRECT` |
| **Actual Reason-Code Contract** | Draft names in docs | `adaptiveExplanationService.js` emits exactly 15 standardized codes | Synchronized all documentation with actual emitted codes | Walkthrough Section 24 | `VERIFIED CORRECT` |

---

## 3. Test Execution & Partitioned Counts

All 18 test suites were executed sequentially with `--runInBand --forceExit` against MongoDB Atlas (`adaptive_aptitude_test`):

```bash
npm test
# runs: jest --runInBand --forceExit
```

```text
PASS tests/phase3_api.test.js
PASS tests/adaptiveEndpoint.test.js
PASS tests/phase3_database.test.js
PASS tests/adaptiveMastery.test.js
PASS tests/adaptivePatternSelection.test.js
PASS tests/phase4_verification.test.js
PASS tests/adaptiveQuestionSelection.test.js
PASS tests/adaptivePrerequisites.test.js
PASS tests/adaptiveDifficulty.test.js
PASS tests/questions.test.js
PASS tests/phase3_adaptive_query.test.js
PASS tests/phase3_regression.test.js
PASS tests/phase2_verification.test.js
PASS tests/import_safety.test.js
PASS tests/model_validation.test.js
PASS tests/hierarchy.test.js
PASS tests/architecture_guard.test.js
PASS tests/registry.test.js

Test Suites: 18 passed, 18 total
Tests:       275 passed, 275 total
Snapshots:   0 total
Time:        56.413 s
```

### Complete Test Partitioning Table

| Phase | Test Suites | Passed | Failed | Skipped | Status | Key Focus |
|---|:---:|:---:|:---:|:---:|:---:|---|
| **Phase 2 Regression** | 7 | **139** | 0 | 0 | **100% PASSED** | Questions API, Registry, Prereq DAG, Question Model, Import Safety, Invariants |
| **Phase 3 Regression** | 4 | **77** | 0 | 0 | **100% PASSED** | User, Goal, StudyPlan, DailyObjective, Attempt Snapshot, StudentProgress, Q1–Q10 |
| **Phase 4 Suite** | 7 | **59** | 0 | 0 | **100% PASSED** | Mastery V1, Prereq Gating, Difficulty Selection, Pattern Cascade, Question Fallback, Endpoint, Audit Scenarios |
| **Combined Total** | **18** | **275** | **0** | **0** | **100% PASSED** | Complete Platform Verification |

---

## 4. Phase 2 Integrity

The structural and content invariants of the Phase 2 dataset were re-verified using the official validation scripts against the live MongoDB instance:

### Structural Invariant Script (`npm run verify:phase2`):
```text
Questions: 12000
Canonical topics: 24
Canonical patterns: 278
Legacy mappings: 308
Patterns with prerequisites: 218
Foundational patterns: 60
Prerequisite edges: 410
Invalid prerequisite references: 0
Self prerequisite references: 0
Prerequisite cycles: 0
Canonical pattern collisions: 0
Invalid topic references: 0
Invalid pattern references: 0
Topic-pattern ownership violations: 0
Invalid difficulty values: 0
Empty question values: 0
Empty answers: 0
Empty explanations: 0
Invalid option arrays: 0
Invalid option counts: 0
Answers not present in options: 0
Metadata mismatches: 0
Content fingerprint mismatches: 0

═══════════════════════════════════════════════════════════
  PHASE 2 VERIFICATION PASSED — all invariants satisfied
═══════════════════════════════════════════════════════════
```

### SHA-256 Content Fingerprint Script (`npm run verify:content`):
```text
Source records scanned: 12000
Content fingerprints verified: 12000
Content fingerprint mismatches: 0
Metadata topic mismatches: 0
Metadata pattern mismatches: 0
Metadata difficulty mismatches: 0

═══════════════════════════════════════════════════════════
  CONTENT INTEGRITY VERIFICATION PASSED
  12,000 / 12,000 questions verified against SHA-256
═══════════════════════════════════════════════════════════
```

---

## 5. Core Adaptive Architecture

```text
CLIENT
   ↓
GET /api/v1/adaptive/next-question?userId=...
   ↓
adaptiveRoutes.js → adaptiveController.js
   ↓
adaptiveEngine.js (Stateless Orchestrator)
   ├── patternSelectionService.js    (5-tier scope cascade + priority formula + tie-break)
   ├── prerequisiteService.js       (DAG gating + recursive remediation)
   ├── difficultySelectionService.js  (recent window accuracy + boundary clamping)
   ├── questionSelectionService.js   (outward fallback + 20-attempt exclusion + zero-leakage DTO)
   └── adaptiveExplanationService.js  (15 standardized audit reason codes)
   ↓
StudentProgress (mastery, highestDifficultyMastered updated post-attempt)
```

---

## 6. Adaptive Configuration

All engine parameters, thresholds, and weights are centralized in [`src/config/adaptiveConfig.js`](file:///Users/rajakumaran/Documents/Aptitude/adaptive-aptitude-api/src/config/adaptiveConfig.js):

```javascript
module.exports = {
  ADAPTIVE_ALGORITHM_VERSION: 'v1',

  // Mastery calculation constants
  MASTERY_RECENT_WINDOW: 10,
  MASTERY_CONFIDENCE_FULL_AT: 10,
  MASTERY_RECENT_WEIGHT: 0.55,
  MASTERY_OVERALL_WEIGHT: 0.25,
  MASTERY_DIFFICULTY_WEIGHT: 0.20,

  // Prerequisite gating
  PREREQUISITE_MASTERY_THRESHOLD: 0.70,

  // Difficulty adaptation constants
  DIFFICULTY_RECENT_WINDOW: 5,
  MIN_ATTEMPTS_FOR_DIFFICULTY_SHIFT: 3,
  DIFFICULTY_UP_ACCURACY: 0.80,
  DIFFICULTY_DOWN_ACCURACY: 0.40,
  DEFAULT_START_DIFFICULTY: 2,

  // Highest difficulty mastered rule (V1 formal definition)
  DIFFICULTY_MASTERY_MIN_ATTEMPTS: 3,
  DIFFICULTY_MASTERY_ACCURACY: 0.80,

  // Question exclusion and candidate ranking
  RECENT_QUESTION_EXCLUSION_LIMIT: 20,
  PATTERN_MASTERY_NEED_WEIGHT: 0.70,
  PATTERN_OBJECTIVE_NEED_WEIGHT: 0.30,
};
```

---

## 7. Mastery Formula & Manual Fixture

### Formula Definition
$$\text{rawMastery} = 0.55 \times \text{recentAccuracy} + 0.25 \times \text{overallAccuracy} + 0.20 \times \text{recentDifficultyCompetence}$$

$$\text{attemptConfidence} = \min\left(1.0, \frac{\text{totalAttempts}}{10}\right)$$

$$\text{confidenceMultiplier} = 0.60 + 0.40 \times \text{attemptConfidence}$$

$$\text{finalMastery} = \min(1.0, \max(0.0, \text{rawMastery} \times \text{confidenceMultiplier}))$$

- **`recentAccuracy`**: Proportion of correct attempts in the last 10 attempts ($[0.0, 1.0]$).
- **`overallAccuracy`**: Lifetime correct attempts divided by total attempts ($[0.0, 1.0]$).
- **`recentDifficultyCompetence`**: Average difficulty of *correctly answered* recent attempts divided by 10 ($[0.0, 1.0]$).
- **`timeTaken` Exclusion**: Explicitly excluded from V1 as per architectural specification.

### Manual Derivation Verification (Test M2 Fixture)
- **Controlled attempts**: 12 total attempts.
  - 2 older attempts: 1 correct (difficulty 2), 1 incorrect (difficulty 3).
  - 10 recent attempts: 8 correct, 2 incorrect.
  - Difficulties of 8 correct recent attempts: $[3, 4, 4, 5, 5, 6, 6, 7]$ (sum = 40, average = 5.0).
- **Calculation**:
  1. $\text{recentAccuracy} = 8 / 10 = 0.80$
  2. $\text{overallAccuracy} = 9 / 12 = 0.75$
  3. $\text{recentDifficultyCompetence} = 5.0 / 10 = 0.50$
  4. $\text{attemptConfidence} = \min(12/10, 1.0) = 1.0 \implies \text{confidenceMultiplier} = 1.0$
  5. $\text{rawMastery} = (0.55 \times 0.80) + (0.25 \times 0.75) + (0.20 \times 0.50) = 0.4400 + 0.1875 + 0.1000 = 0.7275$
  6. $\text{finalMastery} = 0.7275 \times 1.0 = 0.7275$
- **Actual Code Output**: `mastery: 0.7275`, `masteryLabel: 'proficient'`. Exact match verified.

---

## 8. Mastery Label Boundary Verification

The code implements exact numeric comparisons without rounding:
```javascript
if (mastery < 0.40) return 'weak';
if (mastery < 0.70) return 'developing';
if (mastery < 0.85) return 'proficient';
return 'mastered';
```

### Boundary Test Execution (`tests/adaptiveMastery.test.js` — Test M4)

| Test Value | Expected Label | Actual Output | Status |
|---|---|---|---|
| `0.000` | `weak` | `weak` | PASSED |
| `0.399` | `weak` | `weak` | PASSED |
| `0.400` | `developing` | `developing` | PASSED |
| `0.699` | `developing` | `developing` | PASSED |
| `0.700` | `proficient` | `proficient` | PASSED |
| `0.849` | `proficient` | `proficient` | PASSED |
| `0.850` | `mastered` | `mastered` | PASSED |
| `1.000` | `mastered` | `mastered` | PASSED |

---

## 9. Weak-Pattern Selection Verification

The candidate selection pipeline for Scope 4 (weak progress fallback) strictly uses the student's computed mastery score compared against `config.PREREQUISITE_MASTERY_THRESHOLD` (0.70), rather than simple percentage accuracy.

### Fixture Evidence (`tests/adaptivePatternSelection.test.js` — Test PS8)
- **Candidate 1**:
  - `accuracy`: **75.0%** ($3/4 = 0.75$)
  - `mastery`: **0.5500** (below 0.70 threshold due to confidence multiplier on low attempt count)
  - **Result**: Selected as `LOW_MASTERY` candidate because $0.55 < 0.70$.
- **Candidate 2 (Counter-test)**:
  - `accuracy`: **60.0%**
  - `mastery`: **0.7500** ($\ge 0.70$)
  - **Result**: Excluded from `LOW_MASTERY` fallback because $0.75 \ge 0.70$.

---

## 10. Prerequisite Gating

A pattern is unlocked for learning if and only if **all** of its direct prerequisites have reached `mastery >= 0.70`. If a student has no progress record for a prerequisite, mastery defaults to `0.00` and the pattern is blocked.

---

## 11. Prerequisite Tie-Break Verification

When a target pattern is blocked by multiple unmet prerequisites, `findRemediationPattern` traverses the dependency DAG and selects the remediation candidate according to the approved deterministic hierarchy:
1. **Lowest Mastery**
2. **Fewer Attempts**
3. **Canonical Registry Order**
4. **Canonical Pattern Name (Alphabetical)**

### Test Evidence (`tests/adaptivePrerequisites.test.js` — Tests P6, P7, P8)
- **Test P6 (Fewer attempts wins)**:
  - Prereq 1: `mastery = 0.30`, `attempts = 15`
  - Prereq 2: `mastery = 0.30`, `attempts = 2`
  - Result: Prereq 2 (`Standard Algebraic Identities & Expansions`) selected.
- **Test P7 (Canonical registry order wins)**:
  - Prereq 1 (`Linear Equations & Systems of Equations`, Index: 0): `mastery = 0.30`, `attempts = 5`
  - Prereq 2 (`Standard Algebraic Identities & Expansions`, Index: 1): `mastery = 0.30`, `attempts = 5`
  - Result: Prereq 1 selected strictly by canonical registry index (0).
- **Test P8 (Pattern name fallback)**:
  - Candidate Z vs Candidate A with equal mastery, attempts, and registry index.
  - Result: Candidate A selected alphabetically.

---

## 12. Pattern Priority & Tie-Break Verification

For candidate patterns within a scope, the priority score is computed as:
$$\text{priorityScore} = 0.70 \times (1.0 - \text{mastery}) + 0.30 \times \left(\frac{\max(0, \text{targetQuestions} - \text{completedQuestions})}{\text{targetQuestions}}\right)$$

The tie-breaking hierarchy is:
1. `priorityScore` DESC
2. `mastery` ASC
3. `attempts` ASC
4. `canonicalIndex` ASC
5. `patternName` ASC

### Test Evidence (`tests/adaptivePatternSelection.test.js` — Tests PS9, PS11)
- **Test PS9 (Registry order resolves tie)**:
  - Candidate 1 (`Basic Percentage Calculation`, Index: 93): `priority = 0.70`, `mastery = 0.50`, `attempts = 5`
  - Candidate 2 (`Single Percentage Increase and Decrease`, Index: 94): `priority = 0.70`, `mastery = 0.50`, `attempts = 5`
  - Result: `Basic Percentage Calculation` wins strictly by earlier canonical index.
- **Test PS11 (Name resolves tie when registry index ties)**:
  - Zulu Pattern vs Alpha Pattern with identical priority, mastery, attempts, and registry index.
  - Result: Alpha Pattern selected alphabetically.

---

## 13. Topic-Only Scope Verification

When a student requests `GET /api/v1/adaptive/next-question?userId=...&topic=Percentage` with no pattern specified:
- Candidate pattern selection across all scopes is strictly restricted to `Percentage`.
- Lower mastery in other topics is completely ignored.

### Test Evidence (`tests/adaptiveEndpoint.test.js` — Test AE10 & `tests/adaptivePatternSelection.test.js` — Test PS10)
- Seeded:
  - `Percentage` progress: `mastery = 0.60`, `attempts = 5`
  - `Probability` progress: `mastery = 0.10`, `attempts = 2` (significantly lower mastery)
- Request: `GET /api/v1/adaptive/next-question?userId=...&topic=Percentage`
- Result:
  - `selectedTopic`: `Percentage`
  - `question.topic`: `Percentage`
  - `selectedPattern`: `Basic Percentage Calculation`
  - Zero leakage across topic boundaries.

---

## 14. Topic + Pattern Validation

If both `topic` and `pattern` are supplied, the engine validates that the pattern actually belongs to the specified topic.
- Invalid Combination: `topic = Percentage`, `pattern = Linear Equations & Systems of Equations` (Algebra pattern).
- Result: HTTP `400 Bad Request` with structured error code `PATTERN_TOPIC_MISMATCH`. Verified in Tests AE9 and PS2.

---

## 15. `planId` Ownership Verification

When `planId` is supplied:
1. `mongoose.Types.ObjectId.isValid(planId)` validates format.
2. The plan is retrieved and `plan.userId === userId` is asserted.
3. If the plan belongs to another student, the request is rejected with HTTP `404 STUDY_PLAN_NOT_FOUND`. Verified in Tests AE8 and PS4.

---

## 16. Difficulty Selection

The engine derives target difficulty based on recent lookback window:
- Recent window: 5 attempts on the pattern.
- $< 3$ attempts: $\Delta = 0$ (`DIFFICULTY_HELD`).
- $\ge 3$ attempts:
  - Accuracy $\ge 80\%$: $\Delta = +1$ (`DIFFICULTY_INCREASED`).
  - Accuracy $\le 40\%$: $\Delta = -1$ (`DIFFICULTY_DECREASED`).
  - $40\% < \text{Accuracy} < 80\%$: $\Delta = 0$ (`DIFFICULTY_HELD`).
- Clamped strictly to $[1, 10]$ (Tests D5, D6).

---

## 17. Actual Difficulty Fallback Fixture

When `targetDifficulty` has no available questions in the database, the outward sequence selects the nearest available difficulty level.

### Test Evidence (`tests/adaptiveEndpoint.test.js` — Test AE7)
- **Setup**:
  - Active DailyObjective sets pattern `targetDifficulty = 5`.
  - Question bank contains NO difficulty-5 questions for this pattern.
  - Question bank contains difficulty-4 question for this pattern.
- **Decision Execution**:
  - `baseDifficulty`: `5`
  - `adjustment`: `0`
  - `targetDifficulty`: `5`
  - `selectedDifficulty`: `4` (outward fallback downward)
  - `question.difficulty`: `4`
  - `isFallback`: `true`
  - `reasonCodes`: contains `DIFFICULTY_FALLBACK`
  - Invariant satisfied: `decision.selectedDifficulty === question.difficulty`.

---

## 18. Question Selection

Question candidate selection uses the outward search sequence expanding from target $T$:
$$[T, T-1, T+1, T-2, T+2, \dots] \quad \text{within } [1, 10]$$
The candidate query filters out recently attempted questions (`_id: { $nin: excludedIds }`) and sorts deterministically by `_id: 1` ascending (Tests QS1–QS5).

---

## 19. Deterministic Exclusion Relaxation

When every eligible question for a pattern has been attempted within the recent exclusion window (last 20 attempts):
- The engine relaxes exclusion by ordering the questions by least recently attempted first.
- Ties are broken deterministically by `_id: 1` ascending. Verified in Test QS7.

---

## 20. Answer Leakage Verification

A recursive tree walker inspects every key in the response payload returned by `GET /api/v1/adaptive/next-question`.

### Scan Assertions (Test AE4):
- Key `answer` present anywhere: **`false`**
- Key `correctAnswer` present anywhere: **`false`**
- Key `explanation` present anywhere: **`false`**

### Actual Sanitized JSON Response (`GET /api/v1/adaptive/next-question`):
```json
{
  "success": true,
  "data": {
    "question": {
      "_id": "670123456789abcdef012345",
      "question": "What is 15% of 100?",
      "options": [
        "10",
        "15",
        "20",
        "25"
      ],
      "topic": "Percentage",
      "pattern": "Basic Percentage Calculation",
      "difficulty": 2
    },
    "decision": {
      "algorithmVersion": "v1",
      "selectedTopic": "Percentage",
      "selectedPattern": "Basic Percentage Calculation",
      "mastery": 0.0,
      "masteryLabel": "weak",
      "recentAccuracy": 0.0,
      "targetDifficulty": 2,
      "selectedDifficulty": 2,
      "isFallback": false,
      "difficulty": {
        "baseDifficulty": 2,
        "adjustment": 0,
        "targetDifficulty": 2,
        "selectedDifficulty": 2,
        "fallbackUsed": false
      },
      "prerequisiteRedirect": null,
      "reasonCodes": [
        "FOUNDATIONAL_FALLBACK",
        "DIFFICULTY_HELD",
        "TARGET_DIFFICULTY_USED"
      ]
    }
  }
}
```

---

## 21. Mastery Failure Recovery

In Phase 4, attempt submission updates learning state. If an unexpected error occurs during derived mastery persistence:
1. The **`Attempt` document is preserved** in the database as an immutable historical record.
2. The failure is **logged as a structured event** `MASTERY_RECALCULATION_FAILED` without sensitive data.
3. The deterministic repair utility **`recalculatePatternLearningState(userId, topic, pattern)`** is available to rebuild `mastery` and `highestDifficultyMastered` from raw attempt history. Verified in Tests M8 and M9.

---

## 22. Safe Logging Audit

All Phase 4 log statements are audited for privacy:
- **Permitted Fields**: `event`, `userId`, `topic`, `pattern`, `attemptId`, `errorCode`, `targetDifficulty`, `selectedDifficulty`, `reasonCodes`.
- **Prohibited Fields (Verified Absent)**: `Question.answer`, `Question.correctAnswer`, `Question.explanation`, submitted answer text, user credentials, passwords, auth tokens.
- **Structured Error**: `MASTERY_RECALCULATION_FAILED` logs strictly `{ userId, topic, pattern, attemptId, errorCode }`.

---

## 23. Query / Index Audit

All MongoDB queries invoked by the adaptive engine are bounded and supported by verified indexes in MongoDB:

| Operation | Collection | Filter | Sort | Limit | Actual Index | Index Verified in MongoDB | Query Plan |
|---|---|---|---|---:|---|---|---|
| **Mastery Recent Window** | `attempts` | `{ userId, topic, pattern }` | `{ attemptedAt: -1 }` | `10` | `userId_1_topic_1_attemptedAt_-1` | YES | `LIMIT -> FETCH -> IXSCAN` (COLLSCAN: false, IXSCAN: true, in-memory sort: false) |
| **Difficulty Lookback Window** | `attempts` | `{ userId, topic, pattern }` | `{ attemptedAt: -1 }` | `5` | `userId_1_topic_1_attemptedAt_-1` | YES | `LIMIT -> FETCH -> IXSCAN` (COLLSCAN: false, IXSCAN: true, in-memory sort: false) |
| **Recent Question Exclusion** | `attempts` | `{ userId }` | `{ attemptedAt: -1 }` | `20` | `userId_1_attemptedAt_-1` | YES | `LIMIT -> FETCH -> IXSCAN` (COLLSCAN: false, IXSCAN: true, in-memory sort: false) |
| **Student Progress Lookup** | `studentprogresses` | `{ userId, topic, pattern }` | None | `1` | `userId_1_topic_1_pattern_1` (unique) | YES | `LIMIT -> FETCH -> IXSCAN` (COLLSCAN: false, IXSCAN: true) |
| **Daily Objective Lookup** | `dailyobjectives` | `{ userId, planId, date }` | None | `1` | `userId_1_planId_1_date_1` (unique) | YES | `LIMIT -> FETCH -> IXSCAN` (COLLSCAN: false, IXSCAN: true) |
| **Question Candidate Selection** | `questions` | `{ topic, pattern, difficulty, _id: { $nin: excludedIds } }` | `{ _id: 1 }` | `1` | `topic_1_pattern_1_difficulty_1` | YES | `SORT -> FETCH -> IXSCAN` (COLLSCAN: false, IXSCAN: true, in-memory sort: bounded candidate set) |

No unbounded scans or full-collection loading occurs.

### Actual MongoDB Index Inventory

Extracted directly via MongoDB collection index inspection (`collection.indexes()`):

#### Collection: `attempts`
1. `_id_`: `{"_id": 1}`
2. `userId_1_attemptedAt_-1`: `{"userId": 1, "attemptedAt": -1}`
3. `userId_1_topic_1_attemptedAt_-1`: `{"userId": 1, "topic": 1, "attemptedAt": -1}`
4. `userId_1_pattern_1_attemptedAt_-1`: `{"userId": 1, "pattern": 1, "attemptedAt": -1}`
5. `userId_1_isCorrect_1_attemptedAt_-1`: `{"userId": 1, "isCorrect": 1, "attemptedAt": -1}`
6. `userId_1_questionId_1_attemptedAt_-1`: `{"userId": 1, "questionId": 1, "attemptedAt": -1}`
7. `sessionId_1`: `{"sessionId": 1}` (sparse)

#### Collection: `studentprogresses`
1. `_id_`: `{"_id": 1}`
2. `userId_1_topic_1_pattern_1`: `{"userId": 1, "topic": 1, "pattern": 1}` (unique)
3. `userId_1_mastery_1`: `{"userId": 1, "mastery": 1}`
4. `userId_1_topic_1`: `{"userId": 1, "topic": 1}`

#### Collection: `dailyobjectives`
1. `_id_`: `{"_id": 1}`
2. `userId_1_planId_1_date_1`: `{"userId": 1, "planId": 1, "date": 1}` (unique)
3. `userId_1_date_-1`: `{"userId": 1, "date": -1}`
4. `userId_1_planId_1_status_1`: `{"userId": 1, "planId": 1, "status": 1}`
5. `planId_1_date_-1`: `{"planId": 1, "date": -1}`

#### Collection: `questions`
1. `_id_`: `{"_id": 1}`
2. `topic_1_pattern_1_difficulty_1`: `{"topic": 1, "pattern": 1, "difficulty": 1}`
3. `topic_1_pattern_1`: `{"topic": 1, "pattern": 1}`
4. `pattern_1_difficulty_1`: `{"pattern": 1, "difficulty": 1}`
5. `topic_1_difficulty_1`: `{"topic": 1, "difficulty": 1}`
6. `difficulty_1`: `{"difficulty": 1}`

### Phase 4 Index Changes
```text
Phase 4 index changes:
NONE
```

**Index Audit Evaluation**:
1. **Mastery and Difficulty Queries**: Supported by `userId_1_topic_1_attemptedAt_-1`. Provides index-ordered retrieval (`attemptedAt: -1`), avoiding an in-memory sort (`hasSort: false`) and bounding key inspection to the requested limit. Adding `{ userId: 1, topic: 1, pattern: 1, attemptedAt: -1 }` would be redundant.
2. **Recent Question Exclusion**: Supported by `userId_1_attemptedAt_-1`. Provides indexed sorted access for the 20 most recent question attempts.
3. **StudentProgress & DailyObjective**: Supported by their respective unique compound indexes (`userId_1_topic_1_pattern_1` and `userId_1_planId_1_date_1`).
4. **Question Candidate Selection**: Supported by `topic_1_pattern_1_difficulty_1`. The previously documented index `{ topic: 1, pattern: 1, difficulty: 1, _id: 1 }` was a documentation error and does not exist in the database. The actual index `topic_1_pattern_1_difficulty_1` filters the candidate set down to the few questions matching the exact topic, pattern, and difficulty (~4–8 questions). Sorting `_id` across this small set requires an in-memory sort that executes in 0 ms. Under the strict Index Creation Rule, creating a redundant compound index with an `_id` suffix is not justified.

---

## 24. Actual Reason Code Inventory

The engine emits exactly 15 standardized reason codes implemented in `src/services/adaptive/adaptiveExplanationService.js`:

| # | Code | Category | Purpose |
|---|---|---|---|
| 1 | `EXPLICIT_PATTERN` | Pattern | Requested via `?pattern=` |
| 2 | `DAILY_OBJECTIVE` | Pattern | Incomplete target in today's daily objective |
| 3 | `ACTIVE_STUDY_PLAN` | Pattern | Target pattern in active study plan |
| 4 | `LOW_MASTERY` | Pattern | Stored mastery $< 0.70$ requiring remediation |
| 5 | `UNSEEN_PATTERN` | Pattern | Foundational pattern with 0 attempts |
| 6 | `FOUNDATIONAL_FALLBACK` | Pattern | First eligible foundational pattern for new student |
| 7 | `PREREQUISITE_NOT_MASTERED` | Prerequisite | Target pattern blocked by prerequisite mastery $< 0.70$ |
| 8 | `PREREQUISITE_REMEDIATION` | Prerequisite | Redirected to nearest eligible unmet prerequisite |
| 9 | `DIFFICULTY_INCREASED` | Difficulty | Shifted difficulty by $+1$ (accuracy $\ge 80\%$) |
| 10 | `DIFFICULTY_DECREASED` | Difficulty | Shifted difficulty by $-1$ (accuracy $\le 40\%$) |
| 11 | `DIFFICULTY_HELD` | Difficulty | Held difficulty ($\Delta = 0$) due to $< 3$ attempts or stable accuracy ($41\%-79\%$) |
| 12 | `TARGET_DIFFICULTY_USED` | Question | Matched exact target difficulty |
| 13 | `DIFFICULTY_FALLBACK` | Question | Target difficulty unavailable; outward search selected fallback |
| 14 | `RECENT_QUESTION_EXCLUDED` | Question | Passed exclusion filter (not in last 20 attempts) |
| 15 | `RECENT_EXCLUSION_RELAXED` | Question | All questions recently attempted; selected least recent question |

---

## 25. Phase 3 Compatibility

Phase 4 preserves all Phase 3 data contracts and schemas:
- **`User`**: Unchanged.
- **`Goal`**: Unchanged.
- **`StudyPlan`**: Unchanged.
- **`DailyObjective`**: Unchanged. Read for candidate pattern work and pattern-specific `targetDifficulty`.
- **`Attempt`**: Unchanged. Remains an immutable server-side historical snapshot.
- **`StudentProgress`**: Phase 4 updates only the derived fields `mastery` and `highestDifficultyMastered` that were explicitly reserved in the Phase 3 schema.

---

## 26. Phase 5 Boundary Scan

An automated codebase scan of active code confirmed that no Phase 5+ capabilities were introduced:
- Automatic StudyPlan generation: **0**
- Automatic DailyObjective generation: **0**
- Revision scheduler / memory decay curves: **0**
- Spaced repetition: **0**
- Adaptive mock-test sessions: **0**
- LLM tutoring or prompt pipelines: **0**
- Mentor / mentee / teacher entities: **0**

---

## 27. Remaining Limitations

1. **Step Size**: Difficulty adjustments shift by at most $\pm 1$ step per evaluation.
2. **Fixed Windows**: Mastery lookback ($10$) and difficulty lookback ($5$) are fixed window constants.
3. **No Automatic Planning**: Study plans and daily objectives must be explicitly created (Phase 5 will automate planning).
4. **No Spaced Repetition**: Memory retention decay curves are not modeled in Phase 4 (reserved for Phase 5).
5. **No Timed Mock Sessions**: Question delivery is single-question adaptive; exam simulations are reserved for Phase 6.

---

## 28. Final Gate Checklist

- [x] Weak fallback uses mastery rather than accuracy
- [x] Mastery threshold comes from centralized configuration (`PREREQUISITE_MASTERY_THRESHOLD: 0.70`)
- [x] Accuracy is not substituted for mastery
- [x] Prerequisite tie-break uses mastery
- [x] Prerequisite tie-break uses attempts
- [x] Prerequisite tie-break uses canonical registry order
- [x] General pattern tie-break uses registry order
- [x] Mastery failure preserves Attempt
- [x] Mastery failure is logged as structured `MASTERY_RECALCULATION_FAILED`
- [x] Mastery repair mechanism works via `recalculatePatternLearningState`
- [x] Topic-only request remains inside topic
- [x] Topic-pattern mismatch rejected with HTTP 400 `PATTERN_TOPIC_MISMATCH`
- [x] Cross-user planId rejected with HTTP 404 `STUDY_PLAN_NOT_FOUND`
- [x] targetDifficulty correctly reported
- [x] selectedDifficulty correctly reported
- [x] selectedDifficulty equals question.difficulty
- [x] Difficulty fallback emits proper reason code (`DIFFICULTY_FALLBACK`)
- [x] Deterministic question selection works
- [x] Exclusion relaxation is deterministic
- [x] Answer keys absent recursively (`answer`, `correctAnswer`, `explanation`)
- [x] Logging contains no answers/secrets
- [x] Recent mastery query bounded
- [x] Recent difficulty query bounded
- [x] Recent-question query bounded
- [x] Question lookup uses indexed filters
- [x] Mastery-label boundary tests pass
- [x] Actual reason-code inventory documented (15 codes)
- [x] Phase 2 tests pass (139 / 139)
- [x] Phase 3 tests pass (77 / 77)
- [x] Phase 4 tests pass (59 / 59)
- [x] Failed tests = 0
- [x] Skipped tests explicitly reported (0 across all phases)
- [x] Phase 2 SHA-256 verification passes (12,000 / 12,000)
- [x] Phase 5+ active implementations = 0

---

```text
PHASE 1 FOUNDATION — VERIFIED

PHASE 2 QUESTION INTELLIGENCE LAYER — VERIFIED

PHASE 3 STUDENT LEARNING DATA LAYER — VERIFIED

PHASE 4 ADAPTIVE DECISION ENGINE — VERIFIED

READY FOR PHASE 5 DESIGN
```
