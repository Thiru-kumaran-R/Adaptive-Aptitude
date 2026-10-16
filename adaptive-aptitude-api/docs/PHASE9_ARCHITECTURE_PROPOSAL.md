# PHASE 9 ARCHITECTURE PROPOSAL: PRESCRIPTIVE LEARNING ORCHESTRATION & NEXT-BEST-ACTION (NBA) ENGINE

```text
Document Type:       Architecture & Capability Discovery Proposal (Closed Policy Contract)
Status:              PHASE 9 PROPOSAL — VERIFIED
                     READY TO DRAFT AUTHORITATIVE PHASE 9 SPECIFICATION
Implementation:      PROHIBITED (Design & Specification Stage Only)
Target Phase:        Phase 9
Repository:          adaptive-aptitude-api
Frozen Baseline:     Phases 1–8 Verified (59 Suites, 763 Tests, Exactly 13 Models)
```

---

## 1. Executive Summary

With the formal verification and closure of **Phase 8 (Cognitive Diagnostics & Longitudinal Learning Analytics Engine)**, the Adaptive Aptitude Platform has achieved complete end-to-end coverage across foundational infrastructure, micro-adaptation, macro-planning, exam simulation, pedagogical advisory, and longitudinal diagnostics:

- **Phase 1 (Foundation)**: Express.js architecture, MongoDB Atlas ODM, centralized error taxonomy (`AppError`), unified async handling, testing harness.
- **Phase 2 (Question Intelligence Layer)**: 12,000 verified questions, 24 canonical topics, 278 patterns, 308 legacy mappings, 410 prerequisite edges DAG, SHA-256 integrity verification.
- **Phase 3 (Student Learning Data Layer)**: Identifiers, goals (`targetDate`, `targetScore`), study plans, daily objectives, immutable attempt records, student progress aggregates.
- **Phase 4 (Adaptive Decision Engine)**: Dynamic pattern mastery calculation, prerequisite gating ($0.70$ readiness threshold), rolling accuracy difficulty adaptation ($\pm 1$), and micro-level next-question selection (`GET /api/v1/adaptive/next-question`).
- **Phase 5 (Automated Planning & Revision Engine)**: Multi-week topological study planning, progress-aware dynamic replanning, 5-stage spaced revision engine ($1, 3, 7, 14, 30$ days), durable idempotency receipts (`RevisionProcessingRecord`).
- **Phase 6 (Mock Test & Exam Simulation Engine)**: Standard & Diagnostic Mock Blueprints, multi-section timed exam execution, distributed 30-second finalization leases, cryptographic receipts (`MockAttemptFinalizationRecord`), and deterministic scoring (`POST /api/v1/mock-sessions`).
- **Phase 7 (Intelligent Learning / LLM Advisory Layer)**: Socratic tutoring, 5-level progressive hints, mistake analysis, progress coaching, plan explanation, mock review, Draft-07 schema validation, multi-representation leakage guards, Gemini REST transport, and safe deterministic fallbacks (6 frozen POST endpoints).
- **Phase 8 (Cognitive Diagnostics & Longitudinal Analytics Engine)**: Read-only deterministic dashboard summaries, speed-accuracy matrix (quadrant classification, rushing risk), cognitive stamina curves (balanced quartiles, fatigue drop-off), spaced retention decay (half-open gap buckets, accounting identity), goal readiness index (dynamic weight renormalization), and priority focus ranking.

### The Meso-Level Decision Void
Despite having sophisticated micro-level question adaptation (Phase 4), macro-level schedule planning (Phase 5), summative assessments (Phase 6), pedagogical explanations (Phase 7), and longitudinal diagnostics (Phase 8), the platform currently suffers from an architectural gap between diagnosis and execution:
- **Diagnostic Paralysis**: Phase 8 diagnoses critical prerequisite bottlenecks, rushing risks, retention decay, and stamina fatigue, but **Phase 8 is permanently read-only and non-prescriptive**. It reports problems without prescribing solutions.
- **Execution Fragmentation**: When a student opens the application on any given day, what should they do right now? Should they clear overdue spaced revisions? Tackle an unmastered prerequisite blocking their study plan? Practice today's daily objective patterns? Take a mock exam because goal readiness lacks mock evidence? Or take a cognitive rest break because stamina fatigue is high?
- Currently, **no service in the backend resolves this question**. The client application would be forced to invent ad-hoc heuristics to sequence study activities.

### The Proposed Solution
We propose **Phase 9: Prescriptive Learning Orchestration & Next-Best-Action (NBA) Engine**.

Phase 9 is a **read-only, deterministic, in-memory policy and orchestration layer** that bridges Phase 8's diagnostic signals and Phase 5's daily targets directly into actionable learning directives. Crucially:
- It introduces **0 new MongoDB collections** and **0 new Mongoose models** (model count remains strictly **13**).
- It performs **0 database writes** (no mutations to domain entities).
- It consumes authoritative data from Phases 2–8 and produces deterministic action prescriptions.
- It operates strictly **before and independently of** any optional Phase 7 pedagogical narrative generation; LLM output never influences deterministic decisions.
- It exposes **3 focused REST endpoints** powering next-best-action widgets, daily study agendas, and cognitive intervention alerts.

---

## 2. Platform Gap Analysis & Execution Map

```text
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                CURRENT PLATFORM EXECUTION MAP                                    │
├──────────────────────────────────────────────────────────────────────────────────────────────────┤
│ MACRO PLANNING (Phase 5)         │ Multi-week calendar targets (DailyObjectives)                 │
│                                  │ Problem: Static calendar quotas; oblivious to live diagnostics│
├──────────────────────────────────┼───────────────────────────────────────────────────────────────┤
│ MICRO ADAPTATION (Phase 4)       │ Selects next single question inside a pre-chosen pattern      │
│                                  │ Problem: Blind to overall study day, revisions, and bottlenecks│
├──────────────────────────────────┼───────────────────────────────────────────────────────────────┤
│ SUMMATIVE ASSESSMENT (Phase 6)   │ Multi-section mock exams with distributed leases              │
│                                  │ Problem: Standalone evaluation; disconnected from daily study │
├──────────────────────────────────┼───────────────────────────────────────────────────────────────┤
│ PEDAGOGICAL ADVISORY (Phase 7)   │ Natural-language tutoring, hints, mistake reviews             │
│                                  │ Problem: Reactive conversational layer; does not orchestrate  │
├──────────────────────────────────┼───────────────────────────────────────────────────────────────┤
│ LONGITUDINAL ANALYTICS (Phase 8) │ Diagnostic truths (bottlenecks, rushing, retention, readiness) │
│                                  │ Problem: Strictly read-only; diagnoses but never prescribes   │
├──────────────────────────────────┴───────────────────────────────────────────────────────────────┤
│                                     THE ARCHITECTURAL GAP                                        │
│  No backend engine synthesizes these disparate components to answer:                             │
│  "What is the single highest-priority learning activity the student must execute RIGHT NOW,      │
│   in what sequence should today's study session unfold, and how should diagnosed cognitive       │
│   deficits be actively remediated?"                                                              │
└──────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Phase 9 Purpose & Boundaries

```text
Phase 9 exists to deterministically synthesize student progress, active study plans, spaced revision debts,
cognitive diagnostics, and prerequisite dependencies into prioritized, actionable learning directives
and real-time next-best-actions without mutating domain state or relying on non-deterministic LLM output.
```

### Primary Responsibilities
1. **Next-Best-Action (NBA) Arbiter**: Computes the single highest-urgency learning directive for any student at any moment in time.
2. **Daily Learning Agenda Assembler**: Sequences the student's study day into structured, stamina-informed operational segments (`WARMUP_RETRIEVAL` $\to$ `PREREQUISITE_UNBLOCKING` $\to$ `CORE_CURRICULUM` $\to$ `PACING_OR_BENCHMARK`).
3. **Cognitive Intervention Formulator**: Detects cognitive friction points (critical bottlenecks, rushing behavior) and formulates targeted remediation directives.
4. **Structured Execution Intent**: Emits structured domain intents cleanly separating *what should happen* from *how domain execution occurs*, providing target endpoint references only where verified existing routes exist.

### Explicit Non-Responsibilities (Preserving Phase 1–8 Ownership)
- Phase 9 does **NOT** select individual questions (owned exclusively by Phase 4 `adaptiveEngine` / `questionSelectionService`).
- Phase 9 does **NOT** generate multi-week calendar study plans or daily objectives (owned exclusively by Phase 5 `studyPlanGenerationService`).
- Phase 9 does **NOT** mutate spaced repetition intervals, stages, or items (owned exclusively by Phase 5 `revisionTransitionHelper`).
- Phase 9 does **NOT** assemble, time, score, or finalize mock exams (owned exclusively by Phase 6 `mockSessionService`).
- Phase 9 does **NOT** generate natural-language explanations or conversational coaching (owned exclusively by Phase 7 `learningController`).
- Phase 9 does **NOT** recalculate historical mastery, speed profiles, stamina curves, retention decay, or readiness (owned exclusively by Phase 4 and Phase 8).
- Phase 9 does **NOT** write to the database (strictly read-only, 0 writes).

---

## 4. Primary Invariant & Strict Pedagogical Priority Ladder

```text
================================================================================
PHASE 9 PRIMARY INVARIANT
================================================================================

1. ZERO PERSISTENT WRITES:
   Phase 9 introduces 0 new MongoDB collections and 0 new Mongoose models.
   Persistent model count remains strictly 13.
   Phase 9 performs 0 database writes (.save, .create, .update, .delete, etc.).

2. STRICT DETERMINISM & REPRODUCIBILITY:
   For an identical request timestamp (referenceNow) and student state,
   all Phase 9 urgency scores, ranking decisions, and action prescriptions
   must be 100% deterministic, mathematically reproducible, and free of random seeds.

3. HARD PEDAGOGICAL POLICY CLASSES (PRIORITY OVER NUMERIC SCORES):
   Prescription urgency follows an authoritative pedagogical priority ladder:
   Critical Prerequisite Bottlenecks and Overdue Spaced Revisions take STRICT
   mathematical precedence over regular forward curriculum advancement, enforced
   via discrete Policy Priority Classes BEFORE urgency scores are evaluated.

4. COGNITIVE SIGNAL REUSE (NO RECALCULATION):
   Phase 9 consumes authoritative diagnostic metrics directly from Phase 8
   services (prerequisite bottlenecks, rushing risk, stamina fatigue, retention
   state, goal readiness). Phase 9 NEVER recalculates Phase 8 formulas.

5. SEPARATION OF INTENT FROM EXECUTION:
   Phase 9 determines WHAT SHOULD HAPPEN via structured executionIntent.
   Existing Phase 4/5/6 services decide HOW DOMAIN EXECUTION OCCURS.
   Phase 9 never invents non-existent routes or modifies earlier APIs.

6. SEPARATION OF DECISION & PEDAGOGICAL NARRATIVE:
   All Phase 9 prescriptions, urgency rankings, and rationale templates are
   finalized deterministically in memory. Phase 9 never invokes LLM services.
   Phase 7 integration is strictly out-of-scope for Phase 9 V1.

7. HARD AGENDA BUDGET CONSERVATION & GLOBAL ACTION CAP:
   The total prescribed practice questions across all agenda segments must NEVER
   exceed dailyQuestionBudget. Total admitted learning actions must NEVER exceed
   MAX_AGENDA_ACTIVITIES = 4. No segment minimum or candidate count may override
   these authoritative caps.

================================================================================
```

### 4.1 Strict Pedagogical Policy Precedence
To prevent high-mastery curriculum advancement from outscoring critical low-mastery prerequisite bottlenecks or overdue spaced revisions due to accumulated goal/deficit bonuses, candidate ranking enforces a **discrete Policy Priority Class**:

```text
POLICY CLASS 0 — PROTECTIVE / BLOCKING (Highest Priority)
  - PREREQUISITE_REMEDIATION (Critical prerequisite bottleneck M < 0.70 blocking active plan)
  - RETENTION_RESCUE / OVERDUE_REVISION (RevisionItem nextReviewDate < todayStartUtc)

POLICY CLASS 1 — DUE RETENTION
  - RETENTION_RESCUE / DUE_TODAY_REVISION (RevisionItem nextReviewDate in [todayStartUtc, tomorrowStartUtc))

POLICY CLASS 2 — OTHER SCORED ACTIONS (Curriculum, Pacing, Benchmarks)
  - EXAM_BENCHMARK (Active goal deadline < 14 days, eligibleMocksCount === 0)
  - PACING_CALIBRATION (Rushing risk score >= 0.60)
  - CURRICULUM_ADVANCEMENT (Active DailyObjective targets with remainingTargetQuestions > 0)

NON-SCORED FALLBACKS (Outside Ranked Pool)
  - DIAGNOSTIC_ASSESSMENT / FOUNDATIONAL_DIAGNOSTIC (Brand-new user with 0 attempts; U(a) = null, policyPriorityClass = null)
  - DIAGNOSTIC_ASSESSMENT / FOUNDATIONAL_REINFORCEMENT (Existing-history user with no plan; U(a) = null, policyPriorityClass = null)
```

### 4.2 Authoritative 7-Tier Ranking Ladder
When arbitrating the Next-Best-Action or ranking candidates for agenda admission:
1. **Policy Priority Class**: Ascending (`policyPriorityClass: 0` beats `1`, `1` beats `2`).
2. **Urgency Score $U(a)$**: Descending within the same policy class.
3. **Base Type Weight $W_{\text{type}}$**: Descending.
4. **Current Stored Mastery**: Ascending (deeper deficit wins).
5. **Canonical Topic Registry Index**: Ascending (`getAllTopics().indexOf(topic)`).
6. **Canonical Pattern Registry Index**: Ascending (`getPatternRegistryIndex(pattern)`; patternless actions $= +\infty$).
7. **Lexical Deterministic Fallback**: `patternName.localeCompare(otherPatternName)` (patternless actions fallback to `''`).

---

## 5. Route Reconciliation & Verified Execution Inventory

### 5.1 Reconciliation with Actual Existing Phase 3/4/5/6 APIs
The repository route definitions, controllers, and parameter bindings have been audited against active source:

| Target Domain | Actual Route File | Verified Endpoint | Method | Required Inputs | Existing Execution Status |
|---|---|---|---|---|---|
| **Phase 4 Adaptive Practice** | `src/routes/adaptiveRoutes.js` | `/api/v1/adaptive/next-question` | **GET** | `userId` (required string), `topic?`, `pattern?`, `planId?` | **VERIFIED EXISTING** (Query params, NOT POST) |
| **Phase 3/5 Attempt Submission** | `src/routes/attemptRoutes.js` | `/api/v1/attempts` | **POST** | `userId`, `questionId`, `selectedAnswer`, `timeTaken`, `source` | **VERIFIED EXISTING** (`source` controls Phase 5 revision transition) |
| **Phase 5 Spaced Revisions** | `src/routes/revisionRoutes.js` | `/api/v1/revisions/due` | **GET** | `userId`, `date?`, `topic?`, `planId?`, `goalId?` | **VERIFIED EXISTING** (Query only) |
| **Phase 5 Non-Existent Route** | *None* | `/api/v1/revisions/process-due` | **DOES NOT EXIST** | N/A | **REMOVED FROM PROPOSAL** |
| **Phase 6 Mock Creation** | `src/routes/mockSessionRoutes.js` | `/api/v1/mock-sessions` | **POST** | `userId`, `blueprintId` OR inline `blueprint` | Requires blueprint reference. Cannot be called without valid blueprint. |
| **Phase 7 Coach Briefing** | *None* | `/api/v1/learning/coach-briefing` | **DOES NOT EXIST** | N/A | **REMOVED FROM PROPOSAL** (Phase 7 is closed) |

### 5.2 Complete Execution Intent Semantics

#### Adaptive Practice Intent (Prerequisite Remediation or Core Curriculum)
```javascript
executionIntent: {
  capability: 'ADAPTIVE_PRACTICE',
  topic: 'Time and Work',
  pattern: 'Basic Unitary & Two/Three Person Work',
  planId: '66f1234567890abcdef12345',
  questionDelivery: {
    endpoint: '/api/v1/adaptive/next-question',
    method: 'GET',
    params: {
      userId: 'usr_12345',
      topic: 'Time and Work',
      pattern: 'Basic Unitary & Two/Three Person Work',
      planId: '66f1234567890abcdef12345'
    }
  },
  attemptSubmissionContext: {
    endpoint: '/api/v1/attempts',
    method: 'POST',
    source: 'practice'
  }
}
```

#### Revision Practice Intent (Retention Rescue)
In Phase 5, fetching a question via `GET /api/v1/adaptive/next-question` delivers a practice item. However, **only submitting an attempt with `source: 'revision'` causes Phase 5 `revisionSchedulerService.processAttempt(...)` to advance or reset the `RevisionItem`**. Submitting with `source: 'practice'` does NOT advance the revision stage. Phase 9 exposes full execution context so the client can preserve `source: 'revision'` and `revisionItemId`:

```javascript
executionIntent: {
  capability: 'REVISION_PRACTICE',
  revisionItemId: '66f9876543210abcdef54321',
  topic: 'Percentage',
  pattern: 'Basic Percentage Calculation',
  questionDelivery: {
    endpoint: '/api/v1/adaptive/next-question',
    method: 'GET',
    params: {
      userId: 'usr_12345',
      topic: 'Percentage',
      pattern: 'Basic Percentage Calculation'
    }
  },
  attemptSubmissionContext: {
    endpoint: '/api/v1/attempts',
    method: 'POST',
    source: 'revision',
    revisionItemId: '66f9876543210abcdef54321'
  }
}
```

#### Mock Assessment Intent (Exam Benchmark)
Phase 9 does not fabricate blueprints. The client must route the user to blueprint selection before calling `POST /api/v1/mock-sessions`:
```javascript
executionIntent: {
  capability: 'MOCK_ASSESSMENT',
  goalId: '66f1234567890abcdef12345',
  requiresBlueprintSelection: true,
  targetEndpoint: null
}
```

#### Diagnostic Assessment Intent (Sequential Adaptive Baseline / Reinforcement)
`DIAGNOSTIC_ASSESSMENT` is a sequential adaptive exercise delivered via repeated Phase 4 adaptive queries (`GET /api/v1/adaptive/next-question`), NOT a Phase 6 mock session:
```javascript
executionIntent: {
  capability: 'DIAGNOSTIC_ASSESSMENT',
  deliveryMode: 'SEQUENTIAL_ADAPTIVE',
  prescribedQuestionCount: 10,
  topic: 'Algebra',
  pattern: 'Linear Equations & Systems of Equations',
    questionDelivery: {
      endpoint: '/api/v1/adaptive/next-question',
      method: 'GET',
      params: {
        userId: 'usr_newbie',
        topic: 'Algebra',
        pattern: 'Linear Equations & Systems of Equations'
      }
    },
    attemptSubmissionContext: {
      endpoint: '/api/v1/attempts',
      method: 'POST',
      source: 'practice'
    }
  }
}
```

#### Pacing Calibration Intent (Rushing Remediation Drill)
Once `pacingTargetTopic` is resolved, execution intent is deterministic and targets the topic level with `pattern: null`:
```javascript
executionIntent: {
  capability: 'ADAPTIVE_PRACTICE',
  topic: pacingTargetTopic,
  pattern: null,
  planId: selectedActivePlan?._id ?? null,
  questionDelivery: {
    endpoint: '/api/v1/adaptive/next-question',
    method: 'GET',
    params: {
      userId,
      topic: pacingTargetTopic,
      planId: selectedActivePlan?._id ?? undefined
    }
  },
  attemptSubmissionContext: {
    endpoint: '/api/v1/attempts',
    method: 'POST',
    source: 'practice'
  }
}
```

---

## 6. Action Taxonomy & Subtype Weight Matrix

### 6.1 Authoritative V1 Action Taxonomy
Phase 9 operates on exactly **six canonical action types**:

1. `PREREQUISITE_REMEDIATION`: Targeted practice on an unmastered prerequisite pattern ($M < 0.70$) blocking an active study plan target.
2. `RETENTION_RESCUE`: Spaced retrieval practice on an overdue or due-today `RevisionItem`.
3. `CURRICULUM_ADVANCEMENT`: Forward practice on an active target pattern in today's `DailyObjective`.
4. `PACING_CALIBRATION`: A deliberate pacing drill triggered by student-level rushing risk and anchored to a deterministically selected active learning topic.
5. `EXAM_BENCHMARK`: Full-length summative mock assessment when active goal deadline is impending ($< 14$ days) and mock evidence is absent.
6. `DIAGNOSTIC_ASSESSMENT`: Baseline diagnostic assessment or planless foundational reinforcement. Non-scored fallback outside normal urgency ranking ($U(a) = \text{null}$, $\text{policyPriorityClass} = \text{null}$).

### 6.2 Action Subtypes and Base Weights $W_{\text{type}}$

| Action Type | Action Subtype | Policy Class | Base Weight $W_{\text{type}}$ | Trigger / Eligibility Condition |
|---|---|---|---|---|
| `PREREQUISITE_REMEDIATION` | `BLOCKING_PREREQUISITE` | **Class 0** | **50.0** | Prerequisite bottleneck ($M < 0.70$) blocking active plan target |
| `RETENTION_RESCUE` | `OVERDUE_REVISION` | **Class 0** | **45.0** | $\text{nextReviewDate} < \text{todayStartUtc}$ ($\implies \text{daysOverdue} \ge 1$) |
| `RETENTION_RESCUE` | `DUE_TODAY_REVISION` | **Class 1** | **35.0** | $\text{nextReviewDate} \in [\text{todayStartUtc}, \text{tomorrowStartUtc})$ |
| `CURRICULUM_ADVANCEMENT` | `DAILY_OBJECTIVE_TARGET` | **Class 2** | **30.0** | Target pattern in today's `DailyObjective` with $\text{remainingTargetQuestions} > 0$ |
| `EXAM_BENCHMARK` | `GOAL_BENCHMARK_MOCK` | **Class 2** | **25.0** | Active goal exists, $\text{status} = \text{'active'}$, $0 \le \text{daysToDeadline} < 14$, `eligibleMocksCount === 0` |
| `PACING_CALIBRATION` | `RUSHING_REMEDIATION` | **Class 2** | **20.0** | Phase 8 student-level `rushingRiskScore >= 0.60` anchored to deterministic active learning topic |
| `DIAGNOSTIC_ASSESSMENT` | `FOUNDATIONAL_DIAGNOSTIC` | **None** | **N/A** | Brand-new student with 0 attempts; fallback outside scored ranking |
| `DIAGNOSTIC_ASSESSMENT` | `FOUNDATIONAL_REINFORCEMENT` | **None** | **N/A** | Existing history, no active StudyPlan; fallback outside scored ranking |

---

## 7. Deterministic Urgency Scoring Function & Applicability Matrix

### 7.1 Mathematical Scoring Function
Every candidate action $a$ in the competitive pool is scored deterministically:

$$U(a) = W_{\text{type}}(a) + S_{\text{deficit}}(a) + I_{\text{goal}}(a) + T_{\text{temporal}}(a)$$

where $U(a) \in [20.0, 100.0]$.

### 7.2 Urgency Factor Applicability Matrix

| Action Type | Mastery Deficit $S_{\text{deficit}}$ | Goal Impact $I_{\text{goal}}$ | Temporal Factor $T_{\text{temporal}}$ |
|---|---|---|---|
| `PREREQUISITE_REMEDIATION` | **Active**: $\max(0, 1 - M_{\text{prereq}}) \times 25.0$ | **Active**: Fixed $10.0$ (blocks active plan target) | **Inactive**: Fixed $0.0$ |
| `RETENTION_RESCUE` | **Active**: $\max(0, 1 - M_{\text{pattern}}) \times 25.0$ | **Conditional**: $10.0$ if pattern in active plan; else $0.0$ | **Active**: Overdue: $\min(10.0, \text{daysOverdue} \times 2.0)$; Due Today: $0.0$ |
| `CURRICULUM_ADVANCEMENT` | **Active**: $\max(0, 1 - M_{\text{target}}) \times 25.0$ | **Active**: $10.0 + \text{deadlineProximityBonus}$ | **Inactive**: Fixed $0.0$ (no undefined midpoint bonus) |
| `PACING_CALIBRATION` | **Active**: $\max(0, 1.0 - \text{topicMastery}) \times 25.0$ if records exist; else $0.0$ | **Conditional**: $10.0$ iff `pacingTargetTopic` in `selectedActivePlan.targets`; else $0.0$ | **Inactive**: Fixed $0.0$ |
| `EXAM_BENCHMARK` | **Inactive**: Fixed $0.0$ | **Active**: $10.0 + \text{deadlineProximityBonus}$ | **Inactive**: Fixed $0.0$ |
| `DIAGNOSTIC_ASSESSMENT` | **Excluded**: Non-scored fallback ($U(a) = \text{null}$) | **Excluded** | **Excluded** |

*Rules on Mastery and Deficit Inputs*:
- For `PACING_CALIBRATION`: $\text{topicMastery}$ is the arithmetic mean of existing stored `StudentProgress.mastery` records for `(userId, topic = pacingTargetTopic)`. Stored Phase 4 mastery is read directly without recalculation. If no `StudentProgress` records exist for that topic, $S_{\text{deficit}} = 0.0$ (**no evidence $\implies$ no mastery-deficit bonus**, rather than treating missing records as 0.0 mastery which would falsely inflate urgency).
- For `RETENTION_RESCUE`: Missing `StudentProgress` for an individual revision item pattern evaluates to $M = 0.0$ for urgency deficit scoring ($S_{\text{deficit}} = 25.0$) without persisting any phantom record.
- Missing pattern mastery is NEVER set to 0.0 for patternless actions merely to inflate urgency.

---

## 8. Goal, Plan & DailyObjective Resolution Semantics

### 8.1 Request Clock Anchor
All date calculations use a single request-level `referenceNow = req.referenceNow || new Date()`.
Logical day boundaries are derived using Phase 8's verified `getLogicalDayBoundaries(referenceNow)`:
- `todayStartUtc`: Midnight UTC of current date.
- `tomorrowStartUtc`: Midnight UTC of next calendar date ($todayStartUtc + 86,400,000\text{ ms}$).

### 8.2 Exact Deadline Arithmetic & Active Goal Constraint
For a selected goal with `targetDate`:
```javascript
let daysToDeadline = null;
let deadlineProximityBonus = 0.0;

// Deadline urgency ONLY applies if the goal is active
if (goal.status === 'active' && goal.targetDate && !isNaN(new Date(goal.targetDate).getTime())) {
  const targetDateUtc = new Date(goal.targetDate).getTime();
  const diffMs = targetDateUtc - referenceNow.getTime();
  const rawDays = Math.floor(diffMs / 86400000);

  // Clamping: past target dates clamp to 0; future dates remain non-negative
  daysToDeadline = Math.max(0, rawDays);

  if (daysToDeadline < 30) {
    deadlineProximityBonus = Math.min(5.0, Math.max(0.0, (30 - daysToDeadline) / 30.0) * 5.0);
  } else {
    deadlineProximityBonus = 0.0;
  }
}
```
*Internal deadline proximity is raw precision. Any rounding is presentation-only.*
- Missing `targetDate` or `goal.status !== 'active'`: `daysToDeadline = null`, `deadlineProximityBonus = 0.0`.
- Past `targetDate`: clamped to $0$ days remaining; `deadlineProximityBonus = 5.0`.
- No `NaN`, `Infinity`, or negative values can emerge.

### 8.3 Optional `goalId` Resolution Scope
Both `GET /next-action` and `GET /daily-agenda` accept an optional `goalId` query parameter:

1. **If `goalId` is supplied**:
   - Validate ObjectId syntax (24-char hex string). If invalid $\implies$ `400 VALIDATION_ERROR`.
   - Query `Goal.findById(goalId)`. If not found $\implies$ `404 GOAL_NOT_FOUND`.
   - Verify ownership: `goal.userId === userId`. If foreign $\implies$ `403 FORBIDDEN`.
   - Resolve linked active study plan:
     ```javascript
     StudyPlan.find({ userId, goalId: goal._id, status: 'active' })
       .sort({ startDate: -1, _id: 1 })
       .limit(1)
     ```
2. **If `goalId` is omitted**:
   - Reuse verified Phase 8 active plan resolution rule:
     ```javascript
     StudyPlan.find({ userId, status: 'active' })
       .sort({ startDate: -1, _id: 1 })
       .limit(1)
     ```
   - If an active plan is found and possesses `plan.goalId`, query `Goal.findById(plan.goalId)` to resolve goal context. If no active plan or no linked goal exists, goal context is `null`.

### 8.4 Exact "Today's DailyObjective" Resolution
Under the selected active study plan (`selectedActivePlan`), today's objective is resolved using the single request-level `referenceNow`:

1. **Derive UTC Logical Day Boundaries**:
   ```javascript
   const todayStartUtc = new Date(Date.UTC(
     referenceNow.getUTCFullYear(),
     referenceNow.getUTCMonth(),
     referenceNow.getUTCDate(),
     0, 0, 0, 0
   ));
   const tomorrowStartUtc = new Date(Date.UTC(
     referenceNow.getUTCFullYear(),
     referenceNow.getUTCMonth(),
     referenceNow.getUTCDate() + 1,
     0, 0, 0, 0
   ));
   ```

2. **Query Unfinished DailyObjective**:
   Under the verified `DailyObjective` schema enum (`['pending', 'in_progress', 'completed', 'skipped']`), unfinished objectives are strictly `['pending', 'in_progress']`:
   ```javascript
   const activeDailyObjective = selectedActivePlan
     ? await DailyObjective.findOne({
         userId,
         planId: selectedActivePlan._id,
         date: {
           $gte: todayStartUtc,
           $lt: tomorrowStartUtc,
         },
         status: {
           $in: ['pending', 'in_progress'],
         },
       }).lean()
     : null;
   ```

3. **Normative Resolution Contract**:
   - Matches: Today's objective + selected active plan + user ownership + unfinished objective state (`status in ['pending', 'in_progress']`).
   - If no such document exists, or if today's objective is already in a finished state (`status === 'completed'` or `status === 'skipped'`), then:
     $$\text{activeDailyObjective} = \text{null}$$

### 8.5 Goal-Scoped vs Global Signals Normative Matrix
Phase 9 enforces an explicit, authoritative scope contract across candidate generation and signal resolution:

| Signal / Candidate | Evaluated Scope | Normative Boundary & Rationale |
|---|---|---|
| `PREREQUISITE_REMEDIATION` | **Selected active plan** | Prerequisite bottlenecks only evaluate patterns blocking active target patterns in `selectedActivePlan`. |
| `CURRICULUM_ADVANCEMENT` | **Selected active plan + today's `DailyObjective`** | Forward curriculum actions exist strictly for remaining target quotas in today's active objective under `selectedActivePlan`. |
| `EXAM_BENCHMARK` | **Selected active `Goal`** | Summative mock assessment requires an active goal with impending deadline ($< 14$d) and zero mock history. |
| `PACING_CALIBRATION` Target Topic | **Selected active learning context** | Anchored to today's remaining objective target (Priority A) or active plan targets (Priority B). |
| `RETENTION_RESCUE` | **Global user revision debt** | Retention debt is global protective student debt. Evaluates all scheduled `RevisionItem` records owned by `userId`. |
| `DIAGNOSTIC_ASSESSMENT` | **User fallback state** | Non-scored fallback triggered when user has no attempt history or no active study plan. |

### 8.6 Global Protective Retention Debt Policy (Even When `goalId` is Supplied)
When an optional `goalId` is supplied in the request:
- `RETENTION_RESCUE` candidates are drawn from **all** due/overdue scheduled `RevisionItem` records owned by that user across the entire platform (`userId`).
- **Rationale**: Overdue spaced-repetition debt represents previously learned material at immediate risk of memory decay. Protecting acquired retention is globally protective of the student, regardless of which specific goal context is currently being viewed.
- **Goal Impact Coupling**:
  - If a revision item's pattern belongs to `selectedActivePlan`, it receives the goal impact bonus:
    $$I_{\text{goal}} = 10.0$$
  - If the revision item's pattern does NOT belong to `selectedActivePlan`, it receives:
    $$I_{\text{goal}} = 0.0$$
- **Policy Class Invariant**:
  - `OVERDUE_REVISION` strictly retains **Class 0** ($W_{\text{type}} = 45.0$).
  - `DUE_TODAY_REVISION` strictly retains **Class 1** ($W_{\text{type}} = 35.0$).
- Under no circumstances does supplying `goalId` filter out or hide global overdue/due revision debt.

---

## 9. Diagnostic Eligibility Contracts & Candidate Generation

### 9.1 Item-Level Retention Candidate Sourcing
Phase 9 evaluates item-level `RevisionItem` records directly from MongoDB (independent of Phase 8 aggregate counts):
```javascript
const dueRevisionItems = await RevisionItem.find({
  userId,
  status: 'scheduled',
  nextReviewDate: { $lt: tomorrowStartUtc },
}).lean();
```
- **Global Scope**: Queries all scheduled items for `userId`. It is NOT filtered by `goalId` or `planId` because retention debt is global protective debt.
- Future items (`nextReviewDate >= tomorrowStartUtc`) are **strictly excluded**.
- Subtype Classification:
  - If `item.nextReviewDate < todayStartUtc`: Subtype is `OVERDUE_REVISION` (Policy Class 0, $W_{\text{type}} = 45.0$).
  - If `todayStartUtc <= item.nextReviewDate < tomorrowStartUtc`: Subtype is `DUE_TODAY_REVISION` (Policy Class 1, $W_{\text{type}} = 35.0$).
- Pattern mastery is retrieved from `StudentProgress.findOne({ userId, topic: item.topic, pattern: item.pattern })` (or batch in-memory Map), defaulting to `0.0` for urgency deficit scoring ($S_{\text{deficit}} = 25.0$) if no record exists without persisting phantom records.

### 9.2 Curriculum Candidate Eligibility
A `CURRICULUM_ADVANCEMENT` candidate is generated for a pattern if and only if:
1. `activeDailyObjective !== null`.
2. The pattern belongs to `activeDailyObjective.patterns`.
3. $\text{remainingTargetQuestions} = \max(0, \text{targetQuestions} - \text{completedQuestions}) > 0$.

If today's objective is absent, or if all patterns in the objective have $\text{remainingTargetQuestions} === 0$, **zero `CURRICULUM_ADVANCEMENT` candidates are generated**.

### 9.3 Exam Benchmark Eligibility Rule
An `EXAM_BENCHMARK` candidate action is generated if and only if:
1. An active Goal is resolved AND `goal.status === 'active'`.
2. `goal.targetDate` exists and is a valid date.
3. `daysToDeadline >= 0 && daysToDeadline < 14`.
4. Phase 8 goal readiness reports `readiness.readinessStatus !== 'insufficient_data'`.
5. Phase 8 goal readiness reports `readiness.components.eligibleMockPerformance.eligibleMocksCount === 0`.

*Rationale Wording*:
`"Goal deadline is in {daysToDeadline} day(s) and no eligible goal-aligned mock evidence is available for this active goal. Complete a full mock benchmark to assess exam readiness."`

### 9.4 Pacing Calibration Eligibility & Deterministic Target Topic Resolution

#### 9.4.1 Eligibility
A `PACING_CALIBRATION` candidate action may exist if and only if:
1. Phase 8 `speedAccuracyMatrixService.getSpeedAccuracyMatrix(userId, 30, null, referenceNow)` is evaluated.
2. `rushingRiskScore !== null`.
3. `rushingRiskScore >= 0.60`.

*Crucial Architecture Invariant*: This call produces a **student-level overall rushing-risk signal** across all attempted topics. It does NOT prove that any specific topic caused the rushing behavior.

#### 9.4.2 Target Topic Resolution Hierarchy
To anchor the deliberate pacing drill to an active learning context, Phase 9 resolves `pacingTargetTopic` using this exact deterministic hierarchy:

- **Priority A — Today's Remaining Curriculum**:
  If `activeDailyObjective !== null` and at least one pattern in `activeDailyObjective.patterns` has:
  $$\text{remainingTargetQuestions} = \max(0, \text{targetQuestions} - \text{completedQuestions}) > 0$$
  construct eligible target patterns. Select the pacing topic from the highest-priority remaining target pattern using:
  1. Stored pattern mastery ascending (`StudentProgress.mastery`, missing progress $\implies 0.0$ for this tie-break only).
  2. `remainingTargetQuestions` descending (larger remaining quota wins).
  3. Canonical topic registry index ascending (`getAllTopics().indexOf(target.topic)`).
  4. Canonical pattern registry index ascending (`getPatternRegistryIndex(target.pattern)`).
  5. Lexical pattern fallback (`target.pattern.localeCompare(...)`).
  Then:
  $$\text{pacingTargetTopic} = \text{selectedTarget.topic}$$

- **Priority B — Active StudyPlan Targets**:
  If Priority A has no eligible remaining targets, but `selectedActivePlan !== null` and possesses at least one valid target topic:
  1. Deduplicate canonical target topics from `selectedActivePlan.targets`.
  2. Sort by canonical topic registry index ascending (`getAllTopics().indexOf(topic)`).
  3. Select the first topic:
  $$\text{pacingTargetTopic} = \text{first canonical target topic}$$

- **Priority C — No Deterministic Topic (Candidate Suppression)**:
  If neither Priority A nor Priority B produces a topic:
  $$\text{Do NOT generate } \text{PACING\_CALIBRATION}$$
  *Prohibitions*:
  - Do NOT choose a random topic.
  - Do NOT use alphabetical ordering.
  - Do NOT hard-code "Number System" or any other arbitrary topic.
  - Do NOT claim Phase 8 identified a topic-specific rushing risk.
  - Do NOT derive a topic from the student-level rushing metric.

#### 9.4.3 Corrected Action Semantics & Rationale Template
- **Canonical Action Description**:
  `PACING_CALIBRATION`: A deliberate pacing drill triggered by student-level rushing risk and anchored to a deterministically selected active learning topic.
- **Authoritative Rationale Template**:
  `"Overall rushing risk is high: {rushingRiskPercent}% of classified errors were fast rushing errors. Complete a deliberate 5-question pacing drill on the current focus topic: {topic}."`
  *(Phase 9 never claims that `{topic}` specifically caused the rushing behavior)*.

#### 9.4.4 Pacing Topic Mastery Deficit Factor ($S_{\text{deficit}}$)
After `pacingTargetTopic` is selected:
$$\text{topicMastery} = \text{arithmetic mean of existing } \text{StudentProgress.mastery} \text{ records for } (userId, \text{topic} = \text{pacingTargetTopic})$$
- Stored Phase 4 mastery is read directly from database/in-memory records; mastery is never recalculated.
- **Zero-Evidence Rule**: If no `StudentProgress` records exist for that topic:
  $$S_{\text{deficit}} = 0.0$$
  *(No evidence $\implies$ no mastery-deficit bonus, rather than treating missing records as 0.0 mastery which would falsely inflate urgency)*.
- If records exist:
  $$S_{\text{deficit}} = \max(0, 1.0 - \text{topicMastery}) \times 25.0$$

#### 9.4.5 Pacing Goal-Impact Factor ($I_{\text{goal}}$) & Temporal Factor ($T_{\text{temporal}}$)
- $$I_{\text{goal}} = \begin{cases} 10.0 & \text{iff } \text{pacingTargetTopic} \in \text{selectedActivePlan.targets} \\ 0.0 & \text{otherwise} \end{cases}$$
- $$T_{\text{temporal}} = 0.0$$
*(No other urgency factors are permitted in V1 for `PACING_CALIBRATION`)*.

---

## 10. Budgeting, Allocation & Question Allocation Pipeline

### 10.1 Daily Question Budget
$$\text{dailyQuestionBudget} = \begin{cases} \min(50, \max(10, \sum \max(0, \text{targetQuestions} - \text{completedQuestions}))) & \text{if activeDailyObjective} \neq \text{null and remainingTargetQuestions} > 0 \\ 30 & \text{otherwise} \end{cases}$$

This guarantees that a fully completed daily objective (where remaining target questions is 0) does not manufacture a phantom 10-question curriculum quota; the daily envelope safely defaults to 30 questions for revision, prerequisite, and pacing activities.

### 10.2 Segment Budgets & Remaining Capacity
Each segment defines an explicit, deterministic `remainingSegmentBudget` without any undefined variables:

1. **`WARMUP_RETRIEVAL`**:
   $$\text{segmentBudget}(\text{WARMUP\_RETRIEVAL}) = \text{revisionBudget} = \lfloor \text{dailyQuestionBudget} \times 0.20 \rfloor$$
   $$\text{remainingSegmentBudget} = \text{revisionBudget} - \text{questions already allocated to RETENTION\_RESCUE actions}$$

2. **`PREREQUISITE_UNBLOCKING`**:
   $$\text{segmentBudget}(\text{PREREQUISITE\_UNBLOCKING}) = \text{remainingDailyBudget (at the moment the segment begins)}$$
   Each admitted action reduces `remainingDailyBudget`, and therefore the segment's remaining capacity:
   $$\text{remainingSegmentBudget} = \text{remainingDailyBudget}$$
   *(No second arbitrary percentage cap is introduced)*.

3. **`CORE_CURRICULUM`**:
   $$\text{segmentBudget}(\text{CORE\_CURRICULUM}) = \text{remainingDailyBudget (at the moment the segment begins)}$$
   $$\text{remainingSegmentBudget} = \text{remainingDailyBudget}$$
   Curriculum allocation is additionally bounded by `patternRemainingTargetQuestions` for each pattern.

4. **`PACING_OR_BENCHMARK`**:
   - For `PACING_CALIBRATION`: The segment budget is `remainingDailyBudget`. Question allocation is still capped by $\text{rawQuestions} = 5$ and `maxQuestionsPerBlock`.
   - For `EXAM_BENCHMARK`: Question budget consumption is exactly $0$ because it is a summative mock assessment, not Phase 4 practice-question allocation.

### 10.3 Per-Action Raw Question Formulas
1. `PREREQUISITE_REMEDIATION`:
   $$\text{rawQuestions} = 5 + \lfloor (1.0 - M_{\text{prereq}}) \times 5.0 \rfloor \in [5, 10]$$
2. `RETENTION_RESCUE`:
   $$\text{rawQuestions} = \min(10, \text{remainingRevisionBudget})$$
3. `CURRICULUM_ADVANCEMENT`:
   $$\text{rawQuestions} = \min(15, \text{patternRemainingTargetQuestions})$$
4. `PACING_CALIBRATION`: Fixed $5$ questions.
5. `EXAM_BENCHMARK`: Exactly $0$ questions.
6. `DIAGNOSTIC_ASSESSMENT`: Exactly $10$ questions (preferred count).

### 10.4 The Unified Final Allocation Pipeline
Every question-based candidate action $a$ is evaluated by the unified allocator:

```javascript
allocatedQuestions = Math.min(
  rawActionQuestions,
  remainingDailyBudget,
  remainingSegmentBudget,
  maxQuestionsPerBlock
);
```

Every variable in this formula is strictly and deterministically defined:
- `rawActionQuestions`: Sourced from the per-action formula (Section 10.3).
- `remainingDailyBudget`: Initialized to `dailyQuestionBudget` (Section 10.1) and decremented as learning actions are admitted.
- `remainingSegmentBudget`: Initialized per segment according to Section 10.2 and decremented as actions are admitted within that segment.
- `maxQuestionsPerBlock`: Bounded by cognitive stamina ($10$ if $\Delta_{\text{fatigue}} > 25\%$, else $15$).

**Zero Arbitrary Minimums**:
- If `allocatedQuestions < 1`: The action is **omitted**.
- Otherwise: The allocated count is valid. The allocator is permitted to shrink block sizes to satisfy budget caps without artificial minimum thresholds (no hidden "minimum 3" or "minimum 5" after the allocator; the action's raw formula already expresses its preferred size, and budget conservation is authoritative).

Exception:
- `EXAM_BENCHMARK` is not a question action and legitimately has $\text{allocatedQuestions} = 0$.

### 10.5 Action Admission Counts & Global Limit
- **Per-Segment Learning Action Caps**:
  - `WARMUP_RETRIEVAL`: Maximum **1** learning action.
  - `PREREQUISITE_UNBLOCKING`: Maximum **1** learning action.
  - `CORE_CURRICULUM`: Maximum **2** learning actions.
  - `PACING_OR_BENCHMARK`: Maximum **1** learning action (at most one of pacing or benchmark).

- **Authoritative Global Cap**:
  $$\text{totalAdmittedLearningActions} \le \text{MAX\_AGENDA\_ACTIVITIES} = 4$$
  Because the theoretical per-segment maximum sum is $5$ ($1 + 1 + 2 + 1$), the global cap of $\text{MAX\_AGENDA\_ACTIVITIES} = 4$ is authoritative. Candidates are processed in normal segment order ($1 \to 4$) and deterministic candidate rank until:
  $$\text{admittedLearningActions} === 4$$
  then no additional learning action may enter the agenda.

- **`COGNITIVE_REST` Checkpoints**:
  `COGNITIVE_REST` is an ergonomic checkpoint inserted dynamically after high fatigue; it does **NOT** count toward `MAX_AGENDA_ACTIVITIES` because it is not a learning action.

### 10.6 Deterministic Multiple-Candidate Admission Algorithm Inside Each Segment
Within each segment:
1. **Generate Candidates**: Generate all eligible candidates for the segment.
2. **Rank Candidates**: Rank them using the frozen 7-tier ranking ladder (Section 4.2).
3. **Iterate in Ranked Order**: Process candidates in descending ranked order.
4. **Calculate Allocation**: For each candidate, calculate final `allocatedQuestions`:
   ```javascript
   allocatedQuestions = Math.min(
     rawActionQuestions,
     remainingDailyBudget,
     remainingSegmentBudget,
     maxQuestionsPerBlock
   );
   ```
   *(For `CURRICULUM_ADVANCEMENT`, bounded additionally by `patternRemainingTargetQuestions`; for `RETENTION_RESCUE`, bounded by `remainingRevisionBudget`)*.
5. **Evaluate Allocation**:
   - If `allocatedQuestions < 1`: Omit the action.
   - Otherwise: The allocated count is valid and the action is admitted.
6. **Update Budgets & Counters**:
   - Decrement `remainingDailyBudget` by `allocatedQuestions`.
   - Decrement `remainingSegmentBudget` by `allocatedQuestions`.
   - If action is `RETENTION_RESCUE`, decrement `remainingRevisionBudget` by `allocatedQuestions`.
   - Increment `admittedLearningActions`.
7. **Stop Condition**:
   Stop admitting actions within the segment when:
   - Segment action cap is reached, OR
   - Global action cap is reached (`admittedLearningActions === MAX_AGENDA_ACTIVITIES` [4]), OR
   - Remaining daily question budget is zero (`remainingDailyBudget === 0`).
8. **Pacing vs Benchmark Exclusion**:
   For `PACING_OR_BENCHMARK`, exactly one of pacing or benchmark may appear when both qualify (highest urgency score wins, breaking ties via Section 4.2).

---

## 11. Daily Learning Agenda Sequencing & Ergonomics

### 11.1 Segment Sequencing & Dynamic Omission
The agenda structures the study day into four pedagogical stages:

```text
┌────────────────────────────────────────────────────────────────────────┐
│                      STRUCTURED DAILY LEARNING AGENDA                  │
├────────────────────────────────────────────────────────────────────────┤
│ SEGMENT 1: WARMUP_RETRIEVAL (Spaced Retention Rescue)                  │
│ - Max 1 action; allocated questions <= revisionBudget                  │
├────────────────────────────────────────────────────────────────────────┤
│ SEGMENT 2: PREREQUISITE_UNBLOCKING (Remediation)                       │
│ - Max 1 action; unmastered prerequisites blocking active targets       │
├────────────────────────────────────────────────────────────────────────┤
│ SEGMENT 3: CORE_CURRICULUM (Daily Plan Advancement)                    │
│ - Max 2 actions; allocated questions <= remainingTargetQuestions       │
├────────────────────────────────────────────────────────────────────────┤
│ SEGMENT 4: PACING_OR_BENCHMARK (Synthesis & Calibration)               │
│ - Max 1 action: Pacing drill (if rushing) OR Mock exam (if benchmark)  │
└────────────────────────────────────────────────────────────────────────┘
```

**Segment Omission Rule**:
If no eligible actions qualify for a segment, **the segment is omitted completely**.
Active segments are re-indexed contiguously starting from 1 (`segmentIndex: 1, 2, ...`).

### 11.2 Segment 4 Choice Precedence (Pacing vs Benchmark)
If both `PACING_CALIBRATION` and `EXAM_BENCHMARK` qualify:
1. Higher urgency score $U(a)$ is selected.
2. If scores are equal, `EXAM_BENCHMARK` takes precedence ($W_{\text{type}} = 25.0 > 20.0$).

### 11.3 Stamina-Informed Block Capping & Cognitive Rest
Using Phase 8 stamina analytics:
- Let $\Delta_{\text{fatigue}} = \text{staminaCurve.fatigueDropoffPercent}$.
- If $\Delta_{\text{fatigue}} > 25.0\%$:
  - Calculate:
    $$\text{questionsPerQuartile} = \left\lfloor \frac{\text{staminaCurve.totalQuestionsAnalyzed}}{4 \times \text{staminaCurve.mockSessionsAnalyzed}} \right\rfloor$$
  - The maximum continuous questions per block is capped at:
    $$\text{maxQuestionsPerBlock} = \min(10, \max(5, \text{questionsPerQuartile}))$$
  - A mandatory `COGNITIVE_REST` checkpoint is inserted between agenda segments.
- If $\Delta_{\text{fatigue}} \le 25.0\%$ or unavailable:
  - $\text{maxQuestionsPerBlock} = 15$.
  - No mandatory rest checkpoint is inserted.

### 11.4 Cognitive Rest Semantics
`COGNITIVE_REST` is an **agenda checkpoint**, NOT a competitive learning action:
- `prescribedQuestions = 0`
- `executionPayload = null`
- `estimatedMinutes = 10` (`COGNITIVE_REST_MINUTES = 10` in `orchestrationConfig.js`)
- It is never returned as `nextAction`.
- It does NOT count against `MAX_AGENDA_ACTIVITIES`.

---

## 12. Estimation, Tiers, Deterministic IDs & Rationale Templates

### 12.1 Estimated Duration Algorithm
Phase 8's verified `speedAccuracyMatrixService.getSpeedAccuracyMatrix(userId, 30, null, referenceNow)` provides a single student-level `speedAccuracyMatrix.medianTimeCorrectSeconds`.

$$\text{secondsPerQuestion} = (\text{medianTimeCorrectSeconds} > 0) ? \text{medianTimeCorrectSeconds} : \text{FALLBACK_SECONDS_PER_QUESTION} (90)$$

$$\text{estimatedDurationMinutes} = \left\lceil \frac{\text{prescribedQuestions} \times \text{secondsPerQuestion}}{60} \right\rceil$$

Special Cases:
- `COGNITIVE_REST`: Fixed 10 minutes.
- `EXAM_BENCHMARK`: `estimatedDurationMinutes = null` (mock duration is determined upon Phase 6 blueprint selection).

### 12.2 Priority Tier & Intervention Severity Mapping
Urgency scores map deterministically to priority tiers and intervention severities:

| Urgency Score Range | Priority Tier / Severity | Cognitive Urgency |
|---|---|---|
| $U(a) \ge 80.0$ | `critical` | Blocking prerequisite bottleneck or severely overdue retention debt |
| $65.0 \le U(a) < 80.0$ | `urgent` | Due-today revision or impending goal milestone |
| $50.0 \le U(a) < 65.0$ | `high` | Active daily objective target practice |
| $35.0 \le U(a) < 50.0$ | `normal` | Routine curriculum practice or pacing drill |
| $U(a) < 35.0$ | `low` | Optional reinforcement |

### 12.3 Deterministic ID Generation (Collision-Free)
- Prerequisite Remediation (distinguishing same prereq blocking multiple targets):
  `nba_prerequisite_remediation_{prereqTopicSlug}_{prereqPatternSlug}_blocks_{blockedTargetPatternSlug}`
- Retention Rescue:
  `nba_retention_rescue_{topicSlug}_{patternSlug}_{revisionItemId}`
- Curriculum Advancement:
  `nba_curriculum_advancement_{topicSlug}_{patternSlug}`
- Pacing Calibration:
  `nba_pacing_calibration_{topicSlug}_all`
- Exam Benchmark:
  `nba_exam_benchmark_{goalId}`
- Diagnostic Assessment (Subtype-Aware):
  - Foundational Diagnostic Assessment:
    `nba_diagnostic_assessment_foundational_diagnostic_{topicSlug}_{patternSlug}`
  - Foundational Reinforcement Assessment:
    `nba_diagnostic_assessment_foundational_reinforcement_{topicSlug}_{patternSlug}`
- Prerequisite Bottleneck Intervention:
  `intv_prerequisite_bottleneck_{prereqTopicSlug}_{prereqPatternSlug}_blocks_{blockedTargetPatternSlug}`
- Rushing Calibration Intervention:
  `intv_rushing_calibration_{topicSlug}_all`

### 12.4 General Deterministic-ID Invariant
For any two Phase 9 actions that differ in canonical action subtype or owned resource identity, their deterministic `actionId` must differ.
At minimum:
$$\text{actionId}(\text{FOUNDATIONAL\_DIAGNOSTIC}) \neq \text{actionId}(\text{FOUNDATIONAL\_REINFORCEMENT})$$
for identical topic and pattern inputs.

Preserved Uniqueness Dimensions:
- Prerequisite blocked target: `_blocks_{blockedTargetPatternSlug}`
- Revision item identity: `_{revisionItemId}`
- Goal benchmark identity: `_{goalId}`
- Topic-level pacing drill: `_{topicSlug}_all`

---

## 13. Edge Cases & Fallback Policies

### 13.1 Brand-New-User Fallback
- **Trigger**: Student has 0 attempts and 0 progress records.
- **Contract**:
  - `status: "insufficient_data"`
  - `reason: "NEW_USER_NO_HISTORY"`
  - `actionType: "DIAGNOSTIC_ASSESSMENT"`
  - `actionSubtype: "FOUNDATIONAL_DIAGNOSTIC"`
  - `actionId: "nba_diagnostic_assessment_foundational_diagnostic_{topicSlug}_{patternSlug}"`
  - `urgencyScore: null`
  - `policyPriorityClass: null`
  - `priorityTier: "normal"`
  - Selected pattern: First foundational pattern in canonical registry order, resolved via `getAllCanonicalPatterns()` filtered by `hierarchyService.getPrerequisites(pattern) === []` (Topic: "Algebra", Pattern: "Linear Equations & Systems of Equations").
  - `prescribedQuestionCount: 10`
  - Sequential adaptive delivery intent.

### 13.2 No-Active-Plan Fallback
- **Trigger**: Student has attempt history, but no active `StudyPlan`.
- **Contract**:
  - `status: "partial_data"`
  - `reason: "NO_ACTIVE_STUDY_PLAN"`
  - `actionType: "DIAGNOSTIC_ASSESSMENT"`
  - `actionSubtype: "FOUNDATIONAL_REINFORCEMENT"`
  - `actionId: "nba_diagnostic_assessment_foundational_reinforcement_{topicSlug}_{patternSlug}"`
  - `urgencyScore: null`
  - `policyPriorityClass: null`
  - `priorityTier: "normal"`
  - Candidate set: All 60 foundational patterns resolved via `getAllCanonicalPatterns()` where `getPrerequisites(p) === []`.
  - Sort order:
    1. Lowest stored mastery (`storedMastery`, missing progress defaults to $0.0$ for this fallback ordering only).
    2. Canonical topic index ascending.
    3. Canonical pattern index ascending.
    4. Lexical pattern fallback.
  - Selected pattern: First candidate in sorted list.
  - Preferred prescribed count: `10` questions.
  - **Endpoint Differentiation**:
    - For `GET /next-action`: Returns preferred prescribed count (`10` questions) directly because no daily agenda allocation has yet occurred.
    - For `GET /daily-agenda`: The fallback action passes through the unified allocator, bounded by `dailyQuestionBudget` (30) and `maxQuestionsPerBlock` (10 or 15).

### 13.3 Active Mock Session Policy
If a student has a mock session with status `created` or `started`:
- `GET /next-action` returns:
  ```json
  {
    "success": true,
    "data": {
      "status": "active_mock_in_progress",
      "reason": "ACTIVE_MOCK_SESSION_EXISTS",
      "activeMockSessionId": "66f11223344556677889900a",
      "message": "A mock exam session is currently in progress. Complete or submit the active mock exam before starting new practice activities.",
      "nextAction": null
    }
  }
  ```
- `GET /daily-agenda` returns status `"active_mock_in_progress"` with agenda segments disabled.
- `GET /interventions` returns cognitive interventions normally (diagnostics remain observable).

---

## 14. Architecture & Security Boundaries

### 14.1 Dedicated `src/middlewares/orchestrationGuard.js`
Phase 9 implements and owns its dedicated middleware:
1. **User ID Validation**: Validates `userId` is a non-empty scalar string (`400 VALIDATION_ERROR`).
2. **User Existence**: Queries `User.exists({ userId })` (`404 USER_NOT_FOUND`).
3. **Optional Goal Validation**: If `goalId` is provided:
   - Validates 24-character hex ObjectId syntax (`400 VALIDATION_ERROR`).
   - Queries `Goal.findById(goalId)` (`404 GOAL_NOT_FOUND`).
   - Asserts ownership `goal.userId === userId` (`403 FORBIDDEN`).
4. **Finalization Lease Check**: Queries `MockSession.findOne({ userId, finalizationState: 'in_progress' })` (`409 FINALIZATION_IN_PROGRESS`).
5. **Reference Clock Attachment**: Sets `req.referenceNow = new Date()`.

Phase 9 owns its guard; it does NOT import `analyticsGuard.js` from Phase 8.

---

## 15. Complete API Surface Contracts

Phase 9 exposes exactly **three idempotent GET endpoints** under `/api/v1/orchestration`:

```text
GET /api/v1/orchestration/next-action
GET /api/v1/orchestration/daily-agenda
GET /api/v1/orchestration/interventions
```

### 15.1 `GET /api/v1/orchestration/next-action`

#### Full Data Response (Standard Active Plan)
```json
{
  "success": true,
  "data": {
    "algorithmVersion": "v1",
    "status": "ready",
    "userId": "usr_12345",
    "goalId": "66f1234567890abcdef12345",
    "nextAction": {
      "actionId": "nba_prerequisite_remediation_time_and_work_basic_unitary_work_blocks_work_leaving_joining",
      "actionType": "PREREQUISITE_REMEDIATION",
      "actionSubtype": "BLOCKING_PREREQUISITE",
      "policyPriorityClass": 0,
      "urgencyScore": 87.5,
      "priorityTier": "critical",
      "topic": "Time and Work",
      "pattern": "Basic Unitary & Two/Three Person Work",
      "blockedTargetPattern": "Work Leaving & Joining",
      "prescribedQuestionCount": 8,
      "estimatedDurationMinutes": 12,
      "rationale": {
        "reasonCode": "UNMASTERED_PREREQUISITE_BLOCKING_GOAL",
        "description": "Prerequisite pattern \"Basic Unitary & Two/Three Person Work\" has mastery 0.55 (developing), below the 0.70 threshold. Master this pattern to unlock \"Work Leaving & Joining\" in your active study plan.",
        "currentMastery": 0.55,
        "targetMasteryThreshold": 0.70
      },
      "executionIntent": {
        "capability": "ADAPTIVE_PRACTICE",
        "topic": "Time and Work",
        "pattern": "Basic Unitary & Two/Three Person Work",
        "planId": "66f1234567890abcdef12345",
        "questionDelivery": {
          "endpoint": "/api/v1/adaptive/next-question",
          "method": "GET",
          "params": {
            "userId": "usr_12345",
            "topic": "Time and Work",
            "pattern": "Basic Unitary & Two/Three Person Work",
            "planId": "66f1234567890abcdef12345"
          }
        },
        "attemptSubmissionContext": {
          "endpoint": "/api/v1/attempts",
          "method": "POST",
          "source": "practice"
        }
      }
    }
  }
}
```

#### No-Active-Plan Fallback Response
```json
{
  "success": true,
  "data": {
    "algorithmVersion": "v1",
    "status": "partial_data",
    "reason": "NO_ACTIVE_STUDY_PLAN",
    "userId": "usr_planless",
    "goalId": null,
    "nextAction": {
      "actionId": "nba_diagnostic_assessment_foundational_reinforcement_algebra_linear-equations-systems-of-equations",
      "actionType": "DIAGNOSTIC_ASSESSMENT",
      "actionSubtype": "FOUNDATIONAL_REINFORCEMENT",
      "policyPriorityClass": null,
      "urgencyScore": null,
      "priorityTier": "normal",
      "topic": "Algebra",
      "pattern": "Linear Equations & Systems of Equations",
      "blockedTargetPattern": null,
      "prescribedQuestionCount": 10,
      "estimatedDurationMinutes": 15,
      "rationale": {
        "reasonCode": "NO_PLAN_FOUNDATIONAL_PRACTICE",
        "description": "No active study plan found. Practice foundational pattern \"Linear Equations & Systems of Equations\" (mastery: 0.0) to build prerequisite strength.",
        "currentMastery": 0.0,
        "targetMasteryThreshold": 0.70
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
  }
}
```

---

### 15.2 `GET /api/v1/orchestration/daily-agenda`

```json
{
  "success": true,
  "data": {
    "algorithmVersion": "v1",
    "status": "ready",
    "userId": "usr_12345",
    "date": "2026-10-06",
    "summary": {
      "dailyQuestionBudget": 30,
      "totalPrescribedQuestions": 28,
      "estimatedTotalMinutes": 44,
      "segmentCount": 3,
      "staminaCapApplied": true,
      "maxQuestionsPerBlock": 10
    },
    "agendaSegments": [
      {
        "segmentIndex": 1,
        "segmentType": "WARMUP_RETRIEVAL",
        "title": "Spaced Revision Warm-up",
        "prescribedQuestions": 6,
        "estimatedMinutes": 10,
        "actions": [
          {
            "actionId": "nba_retention_rescue_percentage_basic_percentage_66f9876543210abcdef54321",
            "actionType": "RETENTION_RESCUE",
            "actionSubtype": "OVERDUE_REVISION",
            "policyPriorityClass": 0,
            "topic": "Percentage",
            "pattern": "Basic Percentage Calculation",
            "urgencyScore": 75.0,
            "priorityTier": "urgent",
            "prescribedQuestions": 6,
            "estimatedMinutes": 10,
            "executionIntent": {
              "capability": "REVISION_PRACTICE",
              "revisionItemId": "66f9876543210abcdef54321",
              "topic": "Percentage",
              "pattern": "Basic Percentage Calculation",
              "questionDelivery": {
                "endpoint": "/api/v1/adaptive/next-question",
                "method": "GET",
                "params": {
                  "userId": "usr_12345",
                  "topic": "Percentage",
                  "pattern": "Basic Percentage Calculation"
                }
              },
              "attemptSubmissionContext": {
                "endpoint": "/api/v1/attempts",
                "method": "POST",
                "source": "revision",
                "revisionItemId": "66f9876543210abcdef54321"
              }
            }
          }
        ]
      },
      {
        "segmentIndex": 2,
        "segmentType": "PREREQUISITE_UNBLOCKING",
        "title": "Foundational Remediation",
        "prescribedQuestions": 8,
        "estimatedMinutes": 12,
        "actions": [
          {
            "actionId": "nba_prerequisite_remediation_time_and_work_basic_unitary_work_blocks_work_leaving_joining",
            "actionType": "PREREQUISITE_REMEDIATION",
            "actionSubtype": "BLOCKING_PREREQUISITE",
            "policyPriorityClass": 0,
            "topic": "Time and Work",
            "pattern": "Basic Unitary & Two/Three Person Work",
            "urgencyScore": 87.5,
            "priorityTier": "critical",
            "prescribedQuestions": 8,
            "estimatedMinutes": 12,
            "executionIntent": {
              "capability": "ADAPTIVE_PRACTICE",
              "topic": "Time and Work",
              "pattern": "Basic Unitary & Two/Three Person Work",
              "planId": "66f1234567890abcdef12345",
              "questionDelivery": {
                "endpoint": "/api/v1/adaptive/next-question",
                "method": "GET",
                "params": {
                  "userId": "usr_12345",
                  "topic": "Time and Work",
                  "pattern": "Basic Unitary & Two/Three Person Work",
                  "planId": "66f1234567890abcdef12345"
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
        "segmentType": "CORE_CURRICULUM",
        "title": "Daily Plan Target Practice",
        "prescribedQuestions": 14,
        "estimatedMinutes": 22,
        "actions": [
          {
            "actionId": "nba_curriculum_advancement_time_and_work_work_leaving_joining",
            "actionType": "CURRICULUM_ADVANCEMENT",
            "actionSubtype": "DAILY_OBJECTIVE_TARGET",
            "policyPriorityClass": 2,
            "topic": "Time and Work",
            "pattern": "Work Leaving & Joining",
            "urgencyScore": 62.0,
            "priorityTier": "high",
            "prescribedQuestions": 14,
            "estimatedMinutes": 22,
            "executionIntent": {
              "capability": "ADAPTIVE_PRACTICE",
              "topic": "Time and Work",
              "pattern": "Work Leaving & Joining",
              "planId": "66f1234567890abcdef12345",
              "questionDelivery": {
                "endpoint": "/api/v1/adaptive/next-question",
                "method": "GET",
                "params": {
                  "userId": "usr_12345",
                  "topic": "Time and Work",
                  "pattern": "Work Leaving & Joining",
                  "planId": "66f1234567890abcdef12345"
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
    ]
  }
}
```

---

### 15.3 `GET /api/v1/orchestration/interventions`

```json
{
  "success": true,
  "data": {
    "algorithmVersion": "v1",
    "status": "ready",
    "userId": "usr_12345",
    "interventionCount": 2,
    "interventions": [
      {
        "interventionId": "intv_prerequisite_bottleneck_time_and_work_basic_unitary_work_blocks_work_leaving_joining",
        "category": "PREREQUISITE_BOTTLENECK",
        "severity": "critical",
        "topic": "Time and Work",
        "unmasteredPrerequisite": "Basic Unitary & Two/Three Person Work",
        "blockedTargetPattern": "Work Leaving & Joining",
        "mastery": 0.55,
        "threshold": 0.70,
        "prescribedAction": "Complete 8 practice questions in Basic Unitary & Two/Three Person Work before attempting Work Leaving & Joining."
      },
      {
        "interventionId": "intv_rushing_calibration_percentage_all",
        "category": "RUSHING_CALIBRATION",
        "severity": "high",
        "topic": "Percentage",
        "rushingRiskScore": 0.67,
        "prescribedAction": "Overall rushing risk is high: 67% of classified errors were fast rushing errors. Complete a deliberate 5-question pacing drill on the current focus topic: Percentage."
      }
    ]
  }
}
```

### 15.4 Authoritative Rushing Calibration Intervention Policy
- **Target Topic Binding**: The `RUSHING_CALIBRATION` cognitive intervention must use the **exact same `pacingTargetTopic`** resolved by the pacing action policy (Section 9.4.2). It must NEVER independently select another topic.
- **Deterministic ID**: `intv_rushing_calibration_{topicSlug}_all`
- **Authoritative Prescribed Action Rationale**:
  `"Overall rushing risk is high: {rushingRiskPercent}% of classified errors were fast rushing errors. Complete a deliberate 5-question pacing drill on the current focus topic: {topic}."`
  *(Must always identify overall student rushing risk + selected active focus topic; never claim topic-specific rushing evidence)*.
- **Candidate Suppression Invariant**: If no deterministic pacing target topic can be resolved (Priority C in Section 9.4.2), **do NOT emit `RUSHING_CALIBRATION` intervention**, even if overall student-level `rushingRiskScore >= 0.60`.

---

## 16. Authoritative Upstream Service Export Audit

| Exporting Module | Verified Exported Function | Phase 9 Consumption |
|---|---|---|
| `src/services/patternRegistryService.js` | `getAllCanonicalPatterns()`, `getAllTopics()`, `getPatternRegistryIndex(pattern)` | Resolves canonical topic and pattern orders and indices. |
| `src/services/hierarchyService.js` | `getPrerequisites(patternName)` | Validates prerequisite DAG edges and identifies foundational patterns (`prereqs === []`). |
| `src/services/analytics/readinessService.js` | `getGoalReadiness(userId, goalId, referenceNow)` | Reads `criticalPrerequisiteBottlenecks`, `readinessStatus`, and `components.eligibleMockPerformance.eligibleMocksCount`. |
| `src/services/analytics/speedAccuracyMatrixService.js` | `getSpeedAccuracyMatrix(userId, windowDays, topic, referenceNow)` | Single bounded call `(userId, 30, null, referenceNow)` reads overall `rushingRiskScore` and `speedAccuracyMatrix.medianTimeCorrectSeconds`. |
| `src/services/analytics/staminaAnalyticsService.js` | `getStaminaCurve(userId)` | Reads `fatigueDropoffPercent`, `totalQuestionsAnalyzed`, and `mockSessionsAnalyzed`. |
| `src/services/analytics/retentionAnalyticsService.js` | `getRetentionAnalytics(userId, referenceNow)` | Reads `dueTodayCount` and `overdueCount`. |
| `src/services/analytics/dashboardAggregateService.js` | `getDashboardAnalytics(userId, referenceNow)` | Reads active plan summary and practice aggregates. |
| `src/services/analytics/topicDiagnosticsService.js` | `computePriorityFocusTopics(userId, activePlan, topicMetrics)` | Identifies high-priority focus topics for planless fallbacks. |
| `src/services/analytics/analyticsMathUtils.js` | `getLogicalDayBoundaries(referenceDate)` | Derives `todayStartUtc` and `tomorrowStartUtc`. |

---

## 17. Central Configuration Plan (`src/config/orchestrationConfig.js`)

```javascript
'use strict';

module.exports = {
  ALGORITHM_VERSION: 'v1',

  // Policy Priority Classes
  POLICY_CLASSES: {
    PROTECTIVE_BLOCKING: 0,
    DUE_RETENTION: 1,
    STANDARD_SCORED: 2,
  },

  // Urgency Base Type Weights
  BASE_WEIGHTS: {
    PREREQUISITE_REMEDIATION: 50.0,
    OVERDUE_REVISION: 45.0,
    DUE_TODAY_REVISION: 35.0,
    CURRICULUM_ADVANCEMENT: 30.0,
    EXAM_BENCHMARK: 25.0,
    PACING_CALIBRATION: 20.0,
  },

  // Scoring Weights & Caps
  MAX_MASTERY_DEFICIT_WEIGHT: 25.0,
  MAX_GOAL_IMPACT_WEIGHT: 15.0,
  MAX_TEMPORAL_WEIGHT: 10.0,

  // Thresholds
  PREREQUISITE_GATING_THRESHOLD: 0.70,
  RUSHING_RISK_THRESHOLD: 0.60,
  EXAM_DEADLINE_WINDOW_DAYS: 14,
  FATIGUE_DROPOFF_THRESHOLD_PERCENT: 25.0,

  // Daily Question Budget Limits
  DEFAULT_DAILY_QUESTION_BUDGET: 30,
  MIN_DAILY_QUESTION_BUDGET: 10,
  MAX_DAILY_QUESTION_BUDGET: 50,
  REVISION_BUDGET_RATIO: 0.20,

  // Question Count Bounds per Block & Activity Caps
  DEFAULT_MAX_QUESTIONS_PER_BLOCK: 15,
  FATIGUED_MIN_QUESTIONS_PER_BLOCK: 5,
  FATIGUED_MAX_QUESTIONS_PER_BLOCK: 10,
  MAX_AGENDA_ACTIVITIES: 4,

  // Durations
  FALLBACK_SECONDS_PER_QUESTION: 90,
  COGNITIVE_REST_MINUTES: 10,

  // Priority Tiers
  PRIORITY_TIERS: {
    CRITICAL: 80.0,
    URGENT: 65.0,
    HIGH: 50.0,
    NORMAL: 35.0,
  },
};
```

---

## 18. Test Strategy & Contract Coverage Plan

Phase 9 will introduce **7 focused test suites** providing 100% contract coverage:

1. `tests/orchestration/orchestrationGuard.test.js`:
   - Validates `userId` presence, empty string, 404 unknown user.
   - Validates `goalId` syntax (400), existence (404), foreign ownership (403).
   - Validates 409 `FINALIZATION_IN_PROGRESS` lease lockout.
   - Validates active mock session prescription lockout (`MockSession.status IN ['created', 'started']`).
   - Validates request-level clock attachment (`req.referenceNow`).
2. `tests/orchestration/urgencyScoring.test.js`:
   - Proves Policy Class 0 (`PREREQUISITE_REMEDIATION` and `OVERDUE_REVISION`) beats Policy Class 2 (`CURRICULUM_ADVANCEMENT`) regardless of urgency score magnitude.
   - Proves Policy Class 1 (`DUE_TODAY_REVISION`) beats Policy Class 2.
   - Mathematical accuracy of $U(a) = W_{\text{type}} + S_{\text{deficit}} + I_{\text{goal}} + T_{\text{temporal}}$.
   - Factor applicability matrix adherence across all 6 action types.
   - Patternless actions (`EXAM_BENCHMARK`, topic-level `PACING_CALIBRATION`) do not call `getPatternRegistryIndex` with null (use $+\infty$, lexical fallback `''`).
   - Exact overdue boundary tests (yesterday $\implies$ overdue; today $\implies$ due today).
   - Inactive goal (`status !== 'active'`) produces $0.0$ proximity bonus and cannot trigger benchmark.
   - Priority tier classification boundary tests ($80.0, 65.0, 50.0, 35.0$).
3. `tests/orchestration/nextActionArbiter.test.js`:
   - Candidate generation across bottleneck, revision, plan, pacing, and mock categories.
   - Same prerequisite blocking two targets generates distinct deterministic action IDs (`blocks_{target}`).
   - Precedence: Critical prerequisite bottlenecks take precedence over curriculum advancement.
   - Brand-new-user fallback: First foundational pattern from `getAllCanonicalPatterns()` where `getPrerequisites(p) === []`, subtype `FOUNDATIONAL_DIAGNOSTIC`, status `insufficient_data`.
   - No-plan fallback: Lowest mastery foundational pattern, subtype `FOUNDATIONAL_REINFORCEMENT`, status `partial_data`, outside scored pool ($U(a) = \text{null}$).
   - Deterministic action ID and reason code template validation.
4. `tests/orchestration/dailyAgendaAssembler.test.js`:
   - Allocation, budgeting, and sequencing tests as detailed in the authoritative test coverage matrix below.
   - Stamina question capping: $\Delta_{\text{fatigue}} > 25\%$ enforces block cap and inserts `COGNITIVE_REST`.
   - Empty segment omission and contiguous 1-based reindexing.
5. `tests/orchestration/interventionPolicies.test.js`:
   - Prerequisite bottleneck intervention generation ($M < 0.70$) with distinct target-inclusive IDs.
   - Rushing calibration intervention generation ($\ge 0.60$) using only authoritative rushing percentage facts.
   - Intervention severity derives deterministically from action priority tier (`severity = priorityTier`).
   - Exclusion of qualitative retention cliffs.
6. `tests/orchestration/orchestrationApiIntegration.test.js`:
   - Supertest end-to-end testing across all 3 routes.
   - Validates execution payloads: Phase 4 target endpoint is strictly `GET /api/v1/adaptive/next-question`.
   - Validates revision execution payload provides `attemptSubmissionContext` with `source: 'revision'` and `revisionItemId`.
   - Validates mock assessment emits `requiresBlueprintSelection: true`, `targetEndpoint: null`, and `estimatedDurationMinutes: null`.
   - Validates diagnostic assessment explicitly represents sequential adaptive delivery.
7. `tests/orchestration/phase9CrossPhaseIsolation.test.js`:
   - Proves model count remains strictly **13**.
   - Spies on all 13 models to prove strictly **0 database writes**.
   - Proves zero LLM calls and static file isolation from Phase 7.
   - Proves zero modifications to Phase 1–8 runtime behavior.

### 18.1 Authoritative Allocation & Fallback Test Coverage Matrix
The following 34 specific contract assertions must be verified:
- [ ] `remainingSegmentBudget` defined for every question-bearing segment
- [ ] no "minimum viable block" ambiguity
- [ ] WARMUP max 1 learning action
- [ ] PREREQUISITE max 1 learning action
- [ ] CORE_CURRICULUM max 2 learning actions
- [ ] PACING_OR_BENCHMARK max 1 action
- [ ] global `MAX_AGENDA_ACTIVITIES = 4`
- [ ] cognitive rest does not consume action-cap slot
- [ ] 5 theoretically eligible segment actions still produce $\le 4$ learning actions
- [ ] today's DailyObjective is scoped to user + selected plan + logical date
- [ ] completed / unavailable DailyObjective is not treated as active curriculum
- [ ] no DailyObjective means zero `DAILY_OBJECTIVE_TARGET` candidates
- [ ] `remainingTargetQuestions = 0` produces no curriculum candidate
- [ ] completed objective falls back to default daily budget
- [ ] no-active-plan fallback does not use `DAILY_OBJECTIVE_TARGET` semantics
- [ ] no-plan fallback is outside scored pool
- [ ] retention actions are sourced from actual `RevisionItem` records
- [ ] future `RevisionItems` are excluded
- [ ] overdue/due-today classification is exact
- [ ] allocation loop decrements budgets after every admitted action
- [ ] overall `rushingRiskScore >= 0.60` does not by itself fabricate a topic
- [ ] `activeDailyObjective` remaining target supplies deterministic `pacingTargetTopic`
- [ ] pacing target ranking uses stored mastery, remaining quota, then canonical indices
- [ ] no DailyObjective + active plan falls back to canonical first plan target topic
- [ ] no active learning topic suppresses `PACING_CALIBRATION`
- [ ] pacing rationale says overall rushing risk, not topic-specific rushing risk
- [ ] pacing with no topic `StudentProgress` receives $S_{\text{deficit}} = 0.0$
- [ ] pacing goal bonus only applies when selected topic belongs to selected active plan
- [ ] pacing intervention and pacing action use the same selected topic
- [ ] `FOUNDATIONAL_DIAGNOSTIC` and `FOUNDATIONAL_REINFORCEMENT` produce different `actionId`s for identical topic/pattern
- [ ] diagnostic subtype is encoded in `actionId`
- [ ] supplied `goalId` does not silently hide global due revision debt
- [ ] unrelated revision receives goal impact $0.0$
- [ ] related revision receives goal impact $10.0$

---

## 19. Frozen Baseline & Verification Gate

All documentation reconciliation preserves the verified platform baseline:

```text
═══════════════════════════════════════════════════════════════════════════════
                          VERIFIED PLATFORM BASELINE
═══════════════════════════════════════════════════════════════════════════════

Full Jest Test Suite:       59 passed, 59 total suites
Full Jest Tests:            763 passed, 763 total tests
Test Failures:              0

Question Bank Total:        12,000 canonical questions
Topics:                     24 canonical topics
Patterns:                   278 canonical patterns
Legacy Mappings:            308 legacy mappings
Patterns with Prereqs:      218 patterns
Foundational Patterns:      60 patterns
Prerequisite Edges:         410 edges
Prerequisite Cycles:        0

Content Integrity:          12,000 / 12,000 SHA-256 fingerprint matches
Mismatches / Corrupted:     0

Persistent Mongoose Models: Exactly 13
Phase 8 Added Collections:  0
Phase 8 Added Dependencies: 0
Phase 9 Proposed Models:    0
Phase 9 Proposed Deps:      0
═══════════════════════════════════════════════════════════════════════════════
```

---

## 20. Reconciliation Audit Checklist

- [x] `remainingSegmentBudget` is defined for every segment.
- [x] No undefined minimum viable block remains (if allocated $< 1$, omit; otherwise valid).
- [x] Action admission counts are deterministic.
- [x] `MAX_AGENDA_ACTIVITIES = 4` is actually enforced by the agenda algorithm.
- [x] Per-segment action caps are explicit (Warmup: 1, Prerequisite: 1, Core Curriculum: 2, Pacing/Benchmark: 1).
- [x] Global action cap takes precedence over per-segment capacity.
- [x] Cognitive-rest checkpoints do not consume the learning-action count.
- [x] Global action cap and segment caps cannot conflict nondeterministically.
- [x] Today's DailyObjective exact lookup is frozen (`userId`, `selectedActivePlan._id`, date boundaries, `status in ['pending', 'in_progress']`).
- [x] Completed DailyObjective does not create false curriculum workload (falls back to default 30 budget).
- [x] Curriculum candidates require actual remaining DailyObjective quota ($\text{remainingTargetQuestions} > 0$).
- [x] `pacingTargetTopic` has one exact deterministic resolution rule (Priority A $\to$ Priority B $\to$ Priority C suppression).
- [x] Overall rushing risk is never mislabeled as topic-specific evidence.
- [x] Pacing target mastery factor is frozen ($S_{\text{deficit}} = 0.0$ when no records exist).
- [x] Pacing goal-impact factor is frozen ($I_{\text{goal}} = 10.0$ iff in active plan targets; else $0.0$).
- [x] Pacing execution intent is deterministic and routes via Phase 4 adaptive question delivery.
- [x] Pacing intervention uses the same target topic as the pacing action policy.
- [x] No pacing action or intervention is emitted when no deterministic topic exists.
- [x] Diagnostic subtypes cannot share `actionId` (encoded with `foundational_diagnostic` vs `foundational_reinforcement`).
- [x] General deterministic-ID invariant is frozen for all action subtypes and resource identities.
- [x] `goalId` vs global revision-debt scope is explicit (retention debt is global protective debt).
- [x] Unrelated global revision debt receives zero selected-goal bonus ($I_{\text{goal}} = 0.0$).
- [x] Selected-plan revision receives the defined goal-impact bonus ($I_{\text{goal}} = 10.0$).
- [x] All previously fixed Phase 9 contracts remain intact.
- [x] No-plan fallback no longer contradicts `CURRICULUM_ADVANCEMENT` taxonomy (uses `DIAGNOSTIC_ASSESSMENT / FOUNDATIONAL_REINFORCEMENT`).
- [x] No-plan fallback DTO is completely frozen (`partial_data`, `NO_ACTIVE_STUDY_PLAN`, outside scored pool).
- [x] Item-level retention candidate source is defined from `RevisionItem` records.
- [x] Future revisions are strictly excluded.
- [x] Overdue / due-today item classification is exact.
- [x] Allocation loop decrements budgets after every admitted action.
- [x] Total practice questions remain strictly within `dailyQuestionBudget`.
- [x] Strict pedagogical precedence is mathematically guaranteed (Policy Class 0 beats 1, 1 beats 2).
- [x] Revision practice preserves `source='revision'` in `attemptSubmissionContext`.
- [x] No false claim that question delivery alone advances `RevisionItem`.
- [x] Exactly three Phase 9 GET APIs remain.
- [x] Phase 9 remains fully read-only with 0 writes and 0 new collections.
- [x] Exactly 13 models.
- [x] Zero dependencies.
- [x] Zero Phase 9 production files.
- [x] 59 / 59 suites remain green.
- [x] 763 / 763 tests remain green.
- [x] Phase 2 verification passes.
- [x] All 12,000 fingerprints match.
