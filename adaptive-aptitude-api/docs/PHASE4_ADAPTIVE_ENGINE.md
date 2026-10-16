# Phase 4 — Adaptive Decision Engine Specification

## 1. Executive Summary & Architectural Principles

The **Adaptive Decision Engine** is the core intelligence layer of the Adaptive Aptitude Learning Platform. It answers the fundamental question:

> **"What question should this student solve next?"**

### Core Architectural Principles

1. **Strictly Non-LLM & Deterministic**:
   All decisions are computed via deterministic, data-driven algorithms based on cognitive learning state, recent attempt history, prerequisite dependency graphs, and curriculum objectives. No generative models or stochastic black boxes are used.

2. **Explainable by Design**:
   Every decision generates a structured audit trail explaining:
   - Why the pattern was selected (`patternReasonCode`)
   - Why the difficulty was chosen (`difficultyReasonCode`)
   - Why the question was served (`questionReasonCode`)
   - What alternatives were evaluated, prerequisite status, and fallback paths

3. **Zero Answer Leakage**:
   The response DTO served to clients strictly strips all sensitive fields (`answer`, `correctAnswer`, `explanation`), preventing client inspection during question delivery.

4. **Stateless Orchestrator**:
   The engine reads student progress, goals, study plans, daily objectives, and recent attempts, computes the optimal decision, selects the question, and persists derived mastery updates without holding session state in memory.

5. **Strict Architectural Phase Boundaries**:
   - **Phase 1 (Foundation)**: Express, MongoDB configuration, and health endpoints preserved.
   - **Phase 2 (Question Intelligence)**: 12,000 questions, 24 topics, 278 patterns, 308 legacy mappings, and the prerequisite DAG remain strictly read-only and immutable.
   - **Phase 3 (Student Learning Data)**: Attempt history remains an immutable append-only ledger. Phase 4 updates only derived fields: `StudentProgress.mastery` and `StudentProgress.highestDifficultyMastered`.
   - **Phase 5+ Exclusion**: Automatic study plan generation, spaced repetition, mock tests, and LLM tutoring are strictly excluded.

---

## 2. Centralized Adaptive Configuration

All engine parameters, thresholds, and weights are centralized in [`src/config/adaptiveConfig.js`](file:///Users/rajakumaran/Documents/Aptitude/adaptive-aptitude-api/src/config/adaptiveConfig.js):

```javascript
module.exports = {
  // Algorithm version for auditability and response metadata
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

## 3. Algorithm Specifications

### 3.1 Mastery Calculation Formula (V1)

Mastery represents a student's demonstrated competence on a specific pattern. It is bounded in $[0.00, 1.00]$.

$$\text{rawMastery} = 0.55 \times \text{recentAccuracy} + 0.25 \times \text{overallAccuracy} + 0.20 \times \text{recentDifficultyCompetence}$$

$$\text{attemptConfidence} = \min\left(1.0, \frac{\text{totalAttempts}}{10}\right)$$

$$\text{confidenceMultiplier} = 0.60 + 0.40 \times \text{attemptConfidence}$$

$$\text{finalMastery} = \min(1.0, \max(0.0, \text{rawMastery} \times \text{confidenceMultiplier}))$$

#### Component Definitions:
1. **Recent Accuracy** ($\text{recentAccuracy}$): Proportion of correct attempts within the last 10 attempts on that pattern ($[0.0, 1.0]$).
2. **Overall Accuracy** ($\text{overallAccuracy}$): Total correct attempts divided by total attempts on that pattern ($[0.0, 1.0]$).
3. **Recent Difficulty Competence** ($\text{recentDifficultyCompetence}$): Average difficulty of *correctly answered* recent attempts divided by 10 ($[0.0, 1.0]$).
4. **Confidence Multiplier**: $0.60 + 0.40 \times \min(\text{totalAttempts} / 10, 1.0)$, providing a baseline of 0.60 scaling up to 1.00 at 10 attempts.

*Note: `timeTaken` is explicitly excluded from Phase 4 V1 mastery calculation as population timing baselines are not yet established.*

#### Mastery Classification Labels:
| Mastery Range | Classification Label | Status Description |
|---|---|---|
| $< 0.40$ (or 0 attempts) | `weak` | Low mastery, requires practice / remediation |
| $0.40 \le m < 0.70$ | `developing` | In progress, working toward prerequisite clearance |
| $0.70 \le m < 0.85$ | `proficient` | Meets prerequisite threshold ($\ge 0.70$) |
| $\ge 0.85$ | `mastered` | High competence |

#### Highest Difficulty Mastered Rule:
A difficulty level $d \in [1, 10]$ is considered "mastered" if and only if:
1. Total attempts at difficulty $d \ge 3$
2. Accuracy at difficulty $d \ge 80\%$ ($0.80$)

The `highestDifficultyMastered` is the maximum integer $d \in [1, 10]$ satisfying these criteria, or `0` if none qualify.

---

### 3.2 Prerequisite Gating & DAG Remediation

A pattern is **eligible** to be served if and only if **all** of its canonical prerequisites have a mastery score of at least **0.70**:

$$\forall p \in \text{prerequisites}(\text{targetPattern}): \text{mastery}(p) \ge 0.70$$

- Foundational patterns (0 prerequisites) are always eligible.
- Missing progress records for prerequisites are treated as mastery $= 0.00$.

#### Recursive DAG Remediation
When a target pattern is blocked by an unmet prerequisite:
1. The engine inspects all unmet prerequisites of the target.
2. For each unmet prerequisite, it recursively checks if that prerequisite's own prerequisites are met.
3. The recursion finds the **nearest eligible unmet prerequisite** in the dependency chain.
4. If multiple prerequisites are unmet at the same level, the engine breaks ties deterministically by selecting the lowest mastery score, and then alphabetically by pattern name.

---

### 3.3 Pattern Selection Pipeline

Pattern selection identifies the optimal pattern using a 5-tier scope cascade:

```text
Scope 1: Explicit pattern query param (?pattern=...)
   ↓ (if not provided)
Scope 2: Today's DailyObjective (incomplete patterns)
   ↓ (if none / completed)
Scope 3: Active StudyPlan target patterns
   ↓ (if none)
Scope 4: Weakest patterns from StudentProgress (accuracy < 70%)
   ↓ (if none)
Scope 5: Foundational patterns from Canonical Registry
```

#### Pattern Priority Formula
When multiple candidate patterns exist in a scope, each candidate is scored:

$$\text{patternNeed} = 1.0 - \text{mastery}$$

$$\text{objectiveNeedRatio} = \frac{\max(0, \text{targetQuestions} - \text{completedQuestions})}{\text{targetQuestions}}$$

$$\text{priorityScore} = 0.70 \times \text{patternNeed} + 0.30 \times \text{objectiveNeedRatio}$$

- Patterns already at mastery $\ge 0.90$ have priority depressed to avoid over-practice.
- Tie-breaking is strictly deterministic:
  1. Higher `priorityScore`
  2. Lower `mastery`
  3. Lower `attempts` count
  4. Alphabetical by `patternName`

---

### 3.4 Difficulty Selection Rules

Difficulty selection determines the target difficulty level ($1 \le D \le 10$) using the student's recent performance on the selected pattern:

1. **Base Difficulty**:
   - If the pattern is in today's `DailyObjective` with a specified `targetDifficulty`, start with that value.
   - Otherwise, start with $\max(\text{DEFAULT\_START\_DIFFICULTY}, \text{highestDifficultyMastered})$.
   - For new students with zero history, start with default $D = 2$.

2. **Recent Window Evaluation**:
   - Retrieve the last 5 attempts for `{ userId, pattern }`, ordered descending by `attemptedAt`.
   - If the window contains $< 3$ attempts, **hold difficulty** ($\Delta = 0$) due to insufficient evidence.

3. **Performance Adaptation ($\ge 3$ attempts)**:
   - Calculate recent window accuracy: $\text{recentAccuracy} = \frac{\text{recentCorrect}}{\text{recentAttempts}}$.
   - If $\text{recentAccuracy} \ge 0.80$: **Increase difficulty** ($\Delta = +1$).
   - If $\text{recentAccuracy} \le 0.40$: **Decrease difficulty** ($\Delta = -1$).
   - If $0.40 < \text{recentAccuracy} < 0.80$: **Hold difficulty** ($\Delta = 0$).

4. **Boundary Clamping**:
   - $\text{targetDifficulty} = \min(10, \max(1, \text{baseDifficulty} + \Delta))$

---

### 3.5 Question Selection & Outward Fallback Sequence

Once `{ topic, pattern, targetDifficulty }` is established:

1. **Exclusion List**:
   - Retrieve the last 20 attempted `questionId`s for the user to prevent immediate repetition.

2. **Outward Difficulty Sequence Generator**:
   The engine searches for available questions expanding outward from the target difficulty:
   $$\text{Sequence}(T) = [T, T-1, T+1, T-2, T+2, \dots] \quad \text{clamped to } [1, 10]$$
   *(Example for $T=5$: $[5, 4, 6, 3, 7, 2, 8, 1, 9, 10]$)*

3. **Deterministic Query**:
   - Queries MongoDB: `{ topic, pattern, difficulty: d, _id: { $nin: excludedIds } }`.
   - Sorted by `_id: 1` (deterministic ordering).
   - If a match is found, it is served.

4. **Deterministic Exclusion Relaxation**:
   - If all questions in the pattern are in the exclusion list, the engine relaxes exclusion by ordering the candidate pool by least recently attempted first, breaking ties by `_id: 1`.

5. **Response Sanitization**:
   - The selected Question document is sanitized: `answer`, `correctAnswer`, and `explanation` are deleted before returning.

---

## 4. Reason Codes Reference (15 Standard Reason Codes)

The engine provides full explainability through 15 standardized reason codes implemented in `src/services/adaptive/adaptiveExplanationService.js`:

### Pattern Selection Reason Codes:
- `EXPLICIT_PATTERN`: Pattern was explicitly requested by client via `?pattern=`.
- `DAILY_OBJECTIVE`: Selected from active DailyObjective incomplete targets.
- `ACTIVE_STUDY_PLAN`: Selected from active StudyPlan target patterns based on need priority.
- `LOW_MASTERY`: Selected from student progress records where `mastery < 0.70`.
- `UNSEEN_PATTERN`: Selected foundational pattern that student has not yet attempted.
- `FOUNDATIONAL_FALLBACK`: Selected first eligible foundational pattern from registry when no prior progress exists.

### Prerequisite Gating Reason Codes:
- `PREREQUISITE_NOT_MASTERED`: Target pattern blocked because one or more prerequisites have `mastery < 0.70`.
- `PREREQUISITE_REMEDIATION`: Redirected to nearest eligible unmet prerequisite in dependency DAG.

### Difficulty Adjustment Reason Codes:
- `DIFFICULTY_INCREASED`: Shifted target difficulty by +1 (recent accuracy $\ge 80\%$ with $\ge 3$ attempts).
- `DIFFICULTY_DECREASED`: Shifted target difficulty by -1 (recent accuracy $\le 40\%$ with $\ge 3$ attempts).
- `DIFFICULTY_HELD`: Maintained difficulty ($\Delta = 0$) due to insufficient evidence ($< 3$ attempts) or stable accuracy ($41\%-79\%$).

### Question Selection & Fallback Reason Codes:
- `TARGET_DIFFICULTY_USED`: Question matched exact `targetDifficulty`.
- `DIFFICULTY_FALLBACK`: Target difficulty was unavailable; outward search selected nearest available difficulty.
- `RECENT_QUESTION_EXCLUDED`: Question passed exclusion filter (not in student's last 20 attempts).
- `RECENT_EXCLUSION_RELAXED`: All available questions were recently attempted; served least recently attempted question.

---

## 5. API Specification: `GET /api/v1/adaptive/next-question`

### Query Parameters:
| Parameter | Type | Required | Description |
|---|---|---|---|
| `userId` | string | **Yes** | Student ID |
| `topic` | string | No | Topic filter (name or slug) |
| `pattern` | string | No | Specific pattern (name or slug) |
| `planId` | string | No | Scopes selection to this study plan |
| `objectiveId` | string | No | Scopes selection to this daily objective |

### Response Example (`200 OK`):
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

---

## 6. Known Limitations & Phase 5+ Scope

1. **V1 Simplicity**: Difficulty adjustments adjust by at most $\pm 1$ step at a time; large performance leaps do not jump multiple levels in a single step.
2. **Fixed Window**: The recent difficulty window is fixed at 5 attempts.
3. **No Automatic Objective Generation**: Daily objectives and study plans must be explicitly created (Phase 5 will automate planning).
4. **No Spaced Repetition**: Memory retention decay curves are not modeled in Phase 4 (reserved for Phase 5).
5. **No Timed Mock Sessions**: Adaptive question delivery is question-by-question; timed exam simulations are reserved for Phase 6.
