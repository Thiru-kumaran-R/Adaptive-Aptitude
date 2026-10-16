# PHASE 10 — PRESCRIPTION ADHERENCE & LEARNING OUTCOME ATTRIBUTION ENGINE (PAOA)
## Architecture Proposal

**Document Status**: `PHASE 10 ARCHITECTURE PROPOSAL — VERIFIED / FROZEN`  
**Current Phase State**: `AUTHORITATIVE SPECIFICATION VERIFIED`  
**Recommendation**: `READY FOR PHASE 10 IMPLEMENTATION`  
**Last Revised**: 2026-10-08  
**Phase Gate**: Architecture is frozen. Production implementation is authorized only against the verified Phase 10 authoritative implementation specification.

---

## 1. Executive Summary

Phase 9 delivers a fully deterministic, zero-write prescriptive orchestration engine capable of recommending the student's next best action across six canonical action types. However, because Phase 9 never persists its recommendations, the platform cannot observe whether students follow its prescriptions or whether those prescriptions achieve their intended learning outcomes.

**Phase 10: Prescription Adherence & Learning Outcome Attribution Engine (PAOA)** closes this gap. Its responsibilities are exactly:

1. **Server-Authoritative Issuance (Option A)**: Invoke existing Phase 9 read-only services with exact upstream request context parity, freeze the returned prescription into an immutable `issuanceSnapshot`, and return a verifiable `prescriptionId` execution lease.
2. **Atomic Activation & Baseline Freeze**: Transition prescriptions from `issued` to `active`, atomically freezing an `activationBaselineSnapshot` capturing student state immediately before execution starts.
3. **Attributed Attempt Observation**: Link student attempts back to the originating prescription by matching `Attempt.sessionId = prescriptionId` (for non-mock action types only).
4. **Execution Completion & Outcome Evaluation**: Deterministically verify whether prescribed execution requirements were completed (`executionRequirementMet`) and evaluate whether type-specific target milestones occurred (`targetMilestoneMet`), comparing post-execution state strictly against `activationBaselineSnapshot`.
5. **Adherence Analytics**: Expose a bounded, persistence-read-only summary of adherence rates and execution-linked outcome deltas per user, without claiming causal treatment effects.

> [!IMPORTANT]
> Phase 10 measures **observed outcome association** after attributed execution. It does NOT establish causal treatment effects. No randomized counterfactual exists. Confounding factors (parallel self-directed practice, independent mastery growth, external study) are explicitly acknowledged.

**Phase 10 selected capability**: `Prescription Adherence & Learning Outcome Attribution Engine`  
**Canonical abbreviation**: `PAOA` — used exclusively throughout this document.  
**Phase 9 boundary**: Phase 9 remains unmodified — zero writes, three GET endpoints unchanged, formal closure preserved.

---

## 2. Frozen Phase 1–9 Capability Map

The platform architecture entering Phase 10 comprises nine verified, frozen phases:

| Phase | Subsystem | Core Domain | Authoritative Ownership | Write Footprint |
|---|---|---|---|---|
| **Phase 1** | Platform Foundation | Express, Mongoose, AppError, env config | HTTP runtime, error handling, DB setup | Core writes |
| **Phase 2** | Question Intelligence Layer | `Question` (12,000 items), `patternRegistryService`, `hierarchyService` | Canonical questions, 24 topics, 278 patterns, 410 prerequisite edges, SHA-256 fingerprints | Read-only frozen truth |
| **Phase 3** | Student Learning Data Layer | `User`, `Goal`, `StudyPlan`, `DailyObjective`, `Attempt`, `StudentProgress` | Immutable attempt event log, in-place derived progress aggregates, goal containers, daily study quotas | Stateful CRUD |
| **Phase 4** | Adaptive Decision Engine | `masteryService`, `adaptiveEngine`, `patternSelectionService`, `questionSelectionService` | Next-question selection, outward difficulty stepping, prerequisite gating (threshold = 0.70), recent question exclusion (RECENT_QUESTION_EXCLUSION_LIMIT = 20) | Read-only decision (writes via Attempt) |
| **Phase 5** | Automated Planning & Spaced Revision | `studyPlanGenerator`, `revisionSchedulerService`, `revisionTransitionHelper`, `RevisionItem`, `RevisionProcessingRecord` | Multi-day horizon planning, daily objective generation, Leitner ladder (1, 3, 7, 14, 30 days), idempotent transitions | Stateful mutation & scheduling |
| **Phase 6** | Mock Test & Exam Simulation | `MockBlueprint`, `MockSession`, `MockResponse`, `MockAttemptFinalizationRecord` | Blueprint generation, section-locked sessions, 30-second finalization lease, server-side signed scoring, attempt adaptation | Active simulation service |
| **Phase 7** | LLM Advisory Layer | `learningContextService`, `promptRegistryService`, `responseValidator`, `learningProviderFactory` | Six advisory endpoints (tutor, hint, explain-attempt, explain-plan, explain-progress, mock-review), zero-retention privacy | Read-only advisory; 0 writes, 0 authoritative truth |
| **Phase 8** | Cognitive Diagnostics & Analytics | `dashboardAggregateService`, `cognitiveProfileService`, `speedAccuracyMatrixService`, `staminaAnalyticsService`, `retentionAnalyticsService`, `readinessService` | Deterministic longitudinal analytics: rushing risk, stamina drop-off, memory decay, goal readiness, prerequisite bottleneck radar | Read-only analytics; 0 writes |
| **Phase 9** | Prescriptive Orchestration & NBA Engine | `orchestrationGuard`, `urgencyScoringService`, `candidateGenerationService`, `nextActionArbiter`, `dailyAgendaAssembler`, `interventionPolicyService` | 7-tier deterministic NBA ranking, 4-segment Daily Agenda assembly, cognitive rest checkpoints, intervention policies, execution intents | Read-only prescriptive; 0 writes, 0 LLM |

### Phase 4 Mastery Contract (Actual Source Facts)

Mastery is computed deterministically from immutable `Attempt` history by `masteryService.calculatePatternMastery` (`src/services/adaptive/masteryService.js`):

```text
MASTERY_RECENT_WINDOW           = 10   (src/config/adaptiveConfig.js)
MASTERY_CONFIDENCE_FULL_AT      = 10
MASTERY_RECENT_WEIGHT           = 0.55
MASTERY_OVERALL_WEIGHT          = 0.25
MASTERY_DIFFICULTY_WEIGHT       = 0.20
RECENT_QUESTION_EXCLUSION_LIMIT = 20

rawMastery   = 0.55 * recentAccuracy
             + 0.25 * overallAccuracy
             + 0.20 * recentDifficultyCompetence

finalMastery = rawMastery * (0.60 + 0.40 * min(totalAttempts / 10, 1))
             clamped to [0.0, 1.0]

If totalAttempts === 0: mastery = 0
```

`timeTaken` is **explicitly excluded** from Phase 4 V1 mastery; no EMA or Bayesian components exist.

**StudentProgress is current derived state** — not a historical snapshot store. Mastery is fully rebuildable from Attempt history via `recalculateAndPersistPatternMastery`. Phase 10 captures snapshots not because historical replay is impossible, but because an attribution record must freeze the exact baseline state and algorithm context observed at prescription time so later policy or version changes do not alter the interpretation of the original prescription.

### Phase 5 Revision Transition Rules (Actual Source Facts)

From `src/services/revision/revisionTransitionHelper.js`:

```text
REVISION_INTERVAL_DAYS     = [1, 3, 7, 14, 30]   (stages 0–4)
REVISION_COMPLETION_MASTERY = 0.85

Rule 1: source='revision' AND isCorrect=false
  → stage=0, intervalDays=1, status='scheduled', lastOutcome='incorrect'
  → reasonCode: REVISION_FAILURE_RESET

Rule 2: source='revision' AND isCorrect=true
  → stage < 4: advance to next stage, status='scheduled'
    reasonCode: REVISION_SUCCESS_ADVANCED
  → stage >= 4 AND mastery >= 0.85: status='completed', stage=4, intervalDays=30
    reasonCode: REVISION_FINAL_STAGE_COMPLETED
  → stage >= 4 AND mastery < 0.85: status='scheduled', stage=4, intervalDays=30
    reasonCode: REVISION_FINAL_STAGE_EXTENDED

Rule 3: source != 'revision' AND isCorrect=false
  → stage=0, intervalDays=1, status='scheduled'
  → reasonCode: INCORRECT_ATTEMPT_SCHEDULED

Rule 4: source != 'revision' AND isCorrect=true
  → No revision state change

Idempotency: lastProcessedAttemptId + processedAttemptIds ring buffer (cap 50)
```

### Phase 6 Mock Attempt sessionId Contract (Actual Source Facts)

From `src/services/mock/mockFinalizationService.js` and `src/models/attemptModel.js`:

- Mock Attempts: `Attempt.source = 'mock'` and `Attempt.sessionId = MockSession._id.toString()`.
- A partial unique index on `{ sessionId, questionId }` with `partialFilterExpression: { source: 'mock' }` enforces exactly one mock Attempt per session/question pair.
- Finalization integrity check: `linkedAttempt.sessionId !== sessionId.toString() || linkedAttempt.source !== 'mock'`.

**Consequence for PAOA**: `EXAM_BENCHMARK` prescriptions MUST NOT set `Attempt.sessionId = prescriptionId`. PAOA attributes exam benchmarks via a `mockSessionId` reference on `PrescriptionExecutionRecord` instead.

### Phase 9 Action DTO Fields (Actual Source Facts)

Phase 9 strictly distinguishes **public formatActionDTO fields** from **internal candidate/scoring fields**.

#### 1. Public DTO Fields Emitted by `formatActionDTO(action)` (`src/services/orchestration/nextActionArbiter.js`)

```javascript
{
  actionId,              // buildActionId template string
  actionType,            // 'PREREQUISITE_REMEDIATION' | 'RETENTION_RESCUE' | 'CURRICULUM_ADVANCEMENT'
                         // | 'PACING_CALIBRATION' | 'EXAM_BENCHMARK' | 'DIAGNOSTIC_ASSESSMENT'
  actionSubtype,         // 'BLOCKING_PREREQUISITE' | 'OVERDUE_REVISION' | 'DUE_TODAY_REVISION'
                         // | 'DAILY_OBJECTIVE_TARGET' | 'RUSHING_REMEDIATION' | 'GOAL_BENCHMARK_MOCK'
                         // | 'FOUNDATIONAL_DIAGNOSTIC' | 'FOUNDATIONAL_REINFORCEMENT'
  policyPriorityClass,   // 0 | 1 | 2 | null (null for DIAGNOSTIC_ASSESSMENT)
  urgencyScore,          // number rounded to 2 decimals | null (null for DIAGNOSTIC_ASSESSMENT)
  priorityTier,          // 'critical' | 'urgent' | 'high' | 'normal' | 'low'
  topic,                 // canonical topic string | null (EXAM_BENCHMARK has null pattern)
  pattern,               // canonical pattern string | null
  prescribedQuestions,   // integer (0 for EXAM_BENCHMARK)
  estimatedMinutes,      // number | null
  rationale: {
    reasonCode,          // string
    description          // string
  },
  executionIntent: {     // Discriminated union by capability (built by executionIntentBuilder.js):
    capability,          // 'ADAPTIVE_PRACTICE' | 'REVISION_PRACTICE' | 'MOCK_ASSESSMENT' | 'DIAGNOSTIC_ASSESSMENT'
    // Concrete fields populated depending on capability:
    // ADAPTIVE_PRACTICE:   { topic, pattern, planId, questionDelivery, attemptSubmissionContext }
    // REVISION_PRACTICE:   { revisionItemId, topic, pattern, questionDelivery, attemptSubmissionContext }
    // MOCK_ASSESSMENT:     { goalId, requiresBlueprintSelection, targetEndpoint, estimatedDurationMinutes }
    // DIAGNOSTIC_ASSESSMENT: { deliveryMode, prescribedQuestionCount, topic, pattern, questionDelivery, attemptSubmissionContext }
  },
  blockedTarget: {       // Emitted conditionally on public action DTO for BLOCKING_PREREQUISITE
    topic,               // Canonical topic string
    pattern              // Canonical pattern string
  }
}
```

#### 2. Internal Phase 9 Candidate & Scoring Fields (NOT Public DTO Fields)

The following fields exist solely within internal candidate objects in `candidateGenerationService.js` and `interventionPolicyService.js` and are **never** top-level public DTO fields:

- `candidate.storedMastery`: Internal scoring feature read from `StudentProgress`.
- `candidate.isPlanAligned`: Internal boolean planning filter.
- `candidate.baseWeight`: Internal policy base weight.
- `candidate.topicIndex`, `candidate.patternIndex`: Internal registry indices for deterministic tie-breaking.
- `candidate.rawActionQuestions`: Internal unallocated question count before agenda budget clipping.
- Internal candidate entity fields (`candidate.revisionItemId`, `candidate.goalId`, `candidate.planId`) are packaged inside `candidate.executionIntent`, NOT top-level DTO properties.

> [!IMPORTANT]
> Phase 10 consumes ONLY source-proven public fields (`action.actionId`, ..., `action.executionIntent.*`, and `action.blockedTarget`). Internal candidate fields are never assumed to exist on the public DTO.

`ORCHESTRATION_ALGORITHM_VERSION = 'v1'` is defined in `src/config/orchestrationConfig.js`. Phase 10 issuance explicitly captures this value into `PrescriptionExecutionRecord.orchestrationAlgorithmVersion` without relying on schema defaults.

---

## 3. Post-Phase-9 Platform Gap Analysis

### 3.1 The Stateless Prescription Disconnect

Phase 9 operates under a strict zero-write boundary:
- `GET /api/v1/orchestration/next-action` — stateless NBA computation.
- `GET /api/v1/orchestration/daily-agenda` — stateless agenda assembly.
- `GET /api/v1/orchestration/interventions` — stateless intervention evaluation.

Because Phase 9 never persists its prescriptions, the platform cannot observe:
1. **Whether a prescription was issued**: A student may request `next-action` repeatedly. No record exists of any recommendation.
2. **Whether a student followed the prescription**: `Attempt.sessionId` is optional and carries no canonical link to an orchestration action.
3. **Whether the prescribed action achieved its target outcome**: No mechanism compares pre- vs post-prescription mastery, revision stage, or rushing risk for a specific attributed execution window.

### 3.2 The Historical State Rationale

`StudentProgress` is updated in-place via `findOneAndUpdate`. While historical mastery can in principle be recalculated from immutable `Attempt` history, an attribution record must freeze the **exact baseline state and algorithm context observed at prescription time** so later policy/version changes or subsequent independent practice do not alter the interpretation of the original prescription.

### 3.3 The Attribution Void

`POST /api/v1/attempts` accepts an optional `sessionId: String` field. Currently, no caller sets this to a prescription token. Without a server-issued `prescriptionId` and client-side attribution of `Attempt.sessionId = prescriptionId`, there is no authoritative link between attempts and the prescriptions that prompted them.

---

## 4. End-to-End Learning Loop Analysis

```text
Phase 2 (Question Bank)
  ↓
Phase 3 (Attempts, Progress)
  ↓
Phase 4 (Mastery Calculation)
  ↓
Phase 5 (Spaced Revision)
  ↓
Phase 6 (Mock Simulation)
  ↓
Phase 8 (Cognitive Diagnostics)
  ↓
Phase 9 (Stateless Prescriptions: NBA, Agenda)
  ↓
[ GAP: Prescriptions vanish immediately upon emission ]
  ↓
Phase 10 (PAOA):
  1. Issue prescription → Persist immutable issuanceSnapshot + prescriptionId
  2. Activate prescription → Capture activationBaselineSnapshot immediately before work
  3. Student solves questions with Attempt.sessionId = prescriptionId
  4. Complete prescription → Verify executionRequirementMet, evaluate targetMilestoneMet
  5. Summary analytics → Query-bounded adherence rates and outcome shifts
```

---

## 5. Candidate Architecture Options

### Candidate 1: Prescription Adherence & Learning Outcome Attribution Engine (PAOA)
- **Scope**: Tracks prescription issuance, execution adherence, and outcome attribution.
- **Write Footprint**: 1 new model (`PrescriptionExecutionRecord`), exactly 4 routes.

### Candidate 2: Platform Policy Calibration & Offline Simulation Engine (PPCO)
- **Scope**: Evaluates historical student cohorts against counterfactual orchestration policies.
- **Write Footprint**: 2 new models, simulation workers.

### Candidate 3: Institutional Mentor & Cohort Supervision Telemetry (IMST)
- **Scope**: Multi-tenant cohort reporting for teachers/mentors.
- **Write Footprint**: 3 new models, role management.

### Candidate 4: Longitudinal Velocity & Goal Feasibility Forecaster (LVGF)
- **Scope**: Monte Carlo milestone feasibility forecasting.
- **Write Footprint**: 1 new model, heavy numerical simulation.

### Candidate 5: Interactive Socratic Remediation Engine (ICRE)
- **Scope**: Dynamic multi-turn remediation dialogue.
- **Write Footprint**: Heavy interactive sessions, breaks no-LLM policy.

### OPTION 0: Feature Freeze (No Phase 10)
- **Scope**: Platform stops at Phase 9.

---

## 6. Candidate Comparison Matrix

| Evaluation Dimension | Weight | Cand. 1: PAOA | Cand. 2: PPCO | Cand. 3: IMST | Cand. 4: LVGF | Cand. 5: ICRE | Opt. 0: Freeze |
|---|---|---|---|---|---|---|---|
| Educational Feedback Loop Closure | 25% | **9.5** | 7.0 | 6.0 | 5.5 | 8.0 | 2.0 |
| Architectural Alignment with Phases 1–9 | 20% | **9.5** | 8.0 | 6.5 | 7.0 | 5.0 | 10.0 |
| Feasibility & Testability | 20% | **9.0** | 7.0 | 6.5 | 6.0 | 4.0 | 10.0 |
| Minimal Operational Risk | 15% | **9.0** | 8.5 | 7.0 | 7.5 | 4.0 | 10.0 |
| Student Learning Impact | 20% | **9.0** | 6.5 | 7.0 | 7.0 | 8.5 | 1.0 |
| **Weighted Score** | **100%** | **9.25** | 7.35 | 6.55 | 6.55 | 6.15 | 6.40 |

---

## 7. Selected Phase 10 Capability: PAOA

**Candidate 1: Prescription Adherence & Learning Outcome Attribution Engine (PAOA)** is the selected Phase 10 architecture.

It directly completes the educational feedback loop opened by Phase 9 without altering frozen Phase 1–9 contracts.

---

## 8. Why PAOA Does Not Duplicate Phases 1–9

| Capability | Phase 1–9 Subsystem | Phase 10 (PAOA) Role | Redundancy Assessment |
|---|---|---|---|
| Attempt Tracking | Phase 3 (`Attempt`) | Reads `Attempt.sessionId = prescriptionId` | Zero duplication: PAOA creates no attempt log |
| Mastery Computation | Phase 4 (`masteryService`) | Reads `StudentProgress.mastery` | Zero duplication: PAOA computes no raw mastery |
| Revision Scheduling | Phase 5 (`revisionTransitionHelper`) | Verifies `RevisionProcessingRecord` settlement | Zero duplication: PAOA schedules no intervals |
| Mock Finalization | Phase 6 (`mockFinalizationService`) | Verifies terminal mock session completion | Zero duplication: PAOA scores no mocks |
| Longitudinal Analytics | Phase 8 (`readinessService`, `speedAccuracyMatrixService`) | Captures snapshots for pre/post evaluation | Zero duplication: PAOA defines no new metrics |
| Prescriptive Decisions | Phase 9 (`nextActionArbiter`, `dailyAgendaAssembler`) | Invokes Phase 9 services directly | Zero duplication: PAOA implements zero selection heuristics |

---

## 9. Adherence Definition Decision: OPTION A (Full Issuance Tracking)

Phase 10 adopts **OPTION A — Full Prescription Issuance Tracking**:

- Every call to `POST /api/v1/attribution/prescriptions` persists a `PrescriptionExecutionRecord` in `status: 'issued'`.
- If a student requests a prescription but never executes it, the record transitions to `superseded` (if a newer prescription is requested) or `expired` (when `referenceNow >= expiresAt`).
- Full lifecycle visibility allows the platform to compute true adherence rates across all resolved prescriptions, distinguishing active adherence from drop-off.

---

## 10. Canonical Model & Collection Name

**Model Name**: `PrescriptionExecutionRecord` (used exclusively throughout this proposal)
- Mongoose: `mongoose.model('PrescriptionExecutionRecord', ...)`
- Model File: `src/models/prescriptionExecutionRecordModel.js`

**Collection Name**: `prescriptionexecutionrecords`
- Follows actual Mongoose auto-pluralization convention observed across all 13 existing models:
  - `MockAttemptFinalizationRecord` → `mockattemptfinalizationrecords`
  - `RevisionProcessingRecord` → `revisionprocessingrecords`
  - `PrescriptionExecutionRecord` → `prescriptionexecutionrecords`

**Model count**: 13 → **14** upon Phase 10 implementation.  
**Collection count**: 13 → **14** upon Phase 10 implementation.

---

## 11. Server-Authoritative Prescription Issuance Contract

### 11.1 Upstream Request Context Parity

Phase 10 issuance directly invokes Phase 9 services without modifying Phase 9 routes. To maintain exact algorithmic fidelity, Phase 10 reproduces the exact request context constructed by Phase 9's `orchestrationGuard` (`src/middlewares/orchestrationGuard.js`):

```javascript
const referenceNow = req.referenceNow || new Date();

const orchestrationContext = {
  userId: trimmedUserId,
  goal: resolvedGoal || null,
  goalId: resolvedGoal ? String(resolvedGoal._id) : null,
  explicitGoalProvided: Boolean(resolvedGoal),
  referenceNow,
};
```

Phase 10 MUST NOT reduce this context to `{ userId, goal, referenceNow }`. In Phase 9, `goalId` and `explicitGoalProvided` govern study plan resolution and candidate scoping.

### 11.2 Request-Level Clock Invariance

Each Phase 10 endpoint captures exactly one `referenceNow = req.referenceNow || new Date()` at entry and reuses it consistently across all participating operations:
- For issuance: barrier check, Phase 9 execution, `issuedAt`, `lastActivityAt = issuedAt`, snapshot captures, `expiresAt = issuedAt + 24 hours`, and response metadata.
- For activation: barrier check, lazy expiry CAS (`referenceNow >= expiresAt`), baseline capture, `activatedAt`, and `lastActivityAt = activatedAt`.
- For completion: barrier check, attempt window queries, mock lifecycle verification (`startedAt >= activatedAt`), `completedAt`, and `lastActivityAt = completedAt` (or `abandonedAt` and `lastActivityAt = abandonedAt`).
- For summary: effective status evaluations in memory (`referenceNow >= expiresAt` for non-terminal records) and window cutoffs.

Zero independent clock instantiations are permitted within any single request.

### 11.3 Independent Finalization Barrier

Because Phase 10 invokes Phase 9 services directly, it bypasses Phase 9 route middleware. Phase 10 issuance independently evaluates the finalization lock barrier before invoking any Phase 9 calculation:

```javascript
const activeFinalization = await MockSession.findOne({
  userId: trimmedUserId,
  finalizationState: 'in_progress',
});

if (activeFinalization) {
  throw new AppError(409, 'FINALIZATION_IN_PROGRESS', 'Mock test finalization in progress.');
}
```

#### Extended Barrier for Direct Analytics Consumption
Phase 10 also bypasses Phase 8 route middleware when it directly calls Phase 8 services. Therefore, **any Phase 10 operation that directly reads Phase 8 analytics** (e.g., `speedAccuracyMatrixService.getSpeedAccuracyMatrix`, `readinessService.getGoalReadiness`) MUST check `MockSession.findOne({ userId, finalizationState: 'in_progress' })` and reject with `409 FINALIZATION_IN_PROGRESS` before reading unstable analytical truth. This applies to:
- Issuance (Phase 9 calls Phase 8)
- Pacing activation & completion (direct `getSpeedAccuracyMatrix` call)
- Exam benchmark activation (direct `getGoalReadiness` call)

### 11.4 No-Issuable-Action Invariant

Phase 9 may legitimately return `nextAction: null` (e.g., when an active mock session exists or candidate pools are exhausted). Similarly, a daily agenda may contain no matching learning actions.

**Invariant**: Phase 10 MUST NOT persist a `PrescriptionExecutionRecord` when Phase 9 yields no concrete issuable action:
- If Phase 9 returns `nextAction === null`: Phase 10 emits `409 NO_ISSUABLE_PRESCRIPTION` with zero database writes.
- If the requested agenda `actionId` cannot be matched: Phase 10 emits `409 NO_ISSUABLE_PRESCRIPTION` with zero database writes.

### 11.5 Phase 9 Public Returned Action Object Mapping

The object returned by `nextActionArbiter.getNextAction(context)` (`nextAction`) or an activity in `dailyAgendaAssembler.getDailyAgenda(context)` (`activity`) is formatted strictly by `formatActionDTO(action)`. Phase 10 persists fields extracted directly from this public returned DTO:

| Phase 10 Field | Public Phase 9 Source Path | Authoritative Source Rule |
|---|---|---|
| `actionId` | `action.actionId` | Direct public DTO field |
| `actionType` | `action.actionType` | Direct public DTO field |
| `actionSubtype` | `action.actionSubtype` | Direct public DTO field |
| `policyPriorityClass` | `action.policyPriorityClass` | Direct public DTO field |
| `urgencyScore` | `action.urgencyScore` | Direct public DTO field |
| `priorityTier` | `action.priorityTier` | Direct public DTO field |
| `topic` | `action.topic` | Direct public DTO field |
| `pattern` | `action.pattern` | Direct public DTO field |
| `prescribedQuestions` | `action.prescribedQuestions` | Direct public DTO field |
| `estimatedMinutes` | `action.estimatedMinutes` | Direct public DTO field |
| `rationale` | `action.rationale` | Direct public DTO field (`{ reasonCode, description }`) |
| `executionIntent` | `action.executionIntent` | Direct public DTO field |
| `revisionItemId` | `action.executionIntent.revisionItemId` | Direct from `RevisionPracticeIntent` (`RETENTION_RESCUE`) |
| `planId` | `action.executionIntent.planId` | Direct from `AdaptivePracticeIntent` (`CURRICULUM_ADVANCEMENT`, `PREREQUISITE_REMEDIATION`) |
| `goalId` | `action.executionIntent.goalId` | Direct from `MockAssessmentIntent` (`EXAM_BENCHMARK`) |
| `blockedTargetPattern` | `action.blockedTarget.pattern` | Direct from public `action.blockedTarget` (`PREREQUISITE_REMEDIATION`) |
| `blockedTargetTopic` | `action.blockedTarget.topic` | Direct from public `action.blockedTarget` (`PREREQUISITE_REMEDIATION`) |

#### Blocked Target Integrity Invariant
For `PREREQUISITE_REMEDIATION` (`actionSubtype === 'BLOCKING_PREREQUISITE'`), Phase 10 consumes `action.blockedTarget.topic` and `action.blockedTarget.pattern` directly from the public Phase 9 action DTO.
- The previous reconstruction algorithm that scanned `StudyPlan.targets` and `hierarchyService.getPrerequisites(...)` is **permanently deleted** because re-resolution is redundant and ambiguous when a prerequisite blocks multiple plan targets.
- **Integrity Rule**: If `actionSubtype === 'BLOCKING_PREREQUISITE'` and public `action.blockedTarget` is absent or malformed:
  - Treat as a Phase 9 DTO integrity failure.
  - Throw `new AppError(500, 'ATTRIBUTION_ISSUANCE_FAILED', 'Phase 9 DTO integrity failure: blockedTarget is missing for BLOCKING_PREREQUISITE.')`.
  - Zero prescription write. Phase 10 does NOT guess.

Phase 10 has ZERO dependency on internal Phase 9 candidate fields that are stripped during DTO serialization.

### 11.6 Daily Agenda Action Extraction

When `originSurface = 'daily_agenda'`, the client provides an `actionId`. Phase 10 extracts the action using strict rules:
1. **Search Scope**: Search ONLY within `agenda.segments[].activities[]`.
2. **Exclude Checkpoints**: `agenda.checkpoints[]` contains cognitive rest items (`executionIntent: null`) which are NOT learning actions and are strictly unissuable.
3. **Cardinality Verification**:
   - Exactly 1 activity matches `actionId`: Prescribed and persisted.
   - 0 activities match `actionId`: Throws `new AppError(409, 'NO_ISSUABLE_PRESCRIPTION', 'Requested actionId not found in active agenda learning activities.')`. Zero writes.
   - > 1 activities match `actionId`: Throws `new AppError(500, 'ATTRIBUTION_ISSUANCE_FAILED', 'Duplicate actionId found in agenda activities.')`. Zero writes.

### 11.7 Error Propagation Parity

Phase 10 preserves Phase 9 domain error semantics:
- Any `AppError` thrown by Phase 9 services is propagated with its exact status code and code.
- Unexpected errors are wrapped in `new AppError(500, 'ATTRIBUTION_ISSUANCE_FAILED', 'Prescription issuance failed due to an internal calculation error.')`.

### 11.8 Issuance Idempotency, Request Fingerprint & Concurrent Race Resolution

Prescription issuance requires an `Idempotency-Key` header:
- Header: `Idempotency-Key: <non-empty string, max 128 chars>`
- Canonical Request Fingerprint: Computed deterministically over the normalized request payload using frozen property ordering:
  ```javascript
  function computeIssuanceFingerprint(userId, originSurface, goalId, actionId) {
    const normalizedPayload = {
      userId: String(userId).trim(),
      originSurface,
      goalId: goalId ? String(goalId) : null,
      actionId: actionId ? String(actionId) : null,
    };

    return crypto
      .createHash('sha256')
      .update(JSON.stringify(normalizedPayload))
      .digest('hex');
  }
  ```
- **Sequential Replay Behavior**:
  - `same userId + same Idempotency-Key + same requestFingerprint`: Returns HTTP `200 OK` with existing prescription record. Zero writes. Zero recomputation.
  - `same userId + same Idempotency-Key + DIFFERENT requestFingerprint`: Throws `new AppError(409, 'IDEMPOTENCY_KEY_REUSE_MISMATCH', 'Idempotency key reused with mismatched request parameters.')`. Zero writes.
- **Same-Key Replay After Expiration**:
  - When an identical request (`same userId + same Idempotency-Key + same requestFingerprint`) arrives when `referenceNow >= existing.expiresAt`:
    - It represents the SAME logical issuance request.
    - The engine MUST NOT create a new prescription (`rx_2`).
    - The engine MUST NOT supersede `rx_1`.
    - The engine MUST NOT recompute Phase 8/9.
    - Returns HTTP `200 OK` with the existing prescription record.
    - Zero database writes are performed (does not mutate DB solely for replay).
    - The response DTO exposes `effectiveStatus: 'expired'` and `isExpired: true`, ensuring an expired lease cannot masquerade as an executable lease while preserving zero-write replay.
- **Concurrent Same-Key Issuance Race Resolution**:
  - When two requests arrive simultaneously with the same `userId` and same `Idempotency-Key`:
    1. Exactly one transaction succeeds in committing the new prescription (returning HTTP `201 Created`).
    2. The losing request encounters a MongoDB `E11000 duplicate key error` on `{ userId: 1, issuanceIdempotencyKey: 1 }`.
    3. The losing handler intercepts this specific collision, re-reads `{ userId, issuanceIdempotencyKey }`, and evaluates the stored fingerprint:
       - If `stored.issuanceRequestFingerprint === computedFingerprint`: Returns HTTP `200 OK` with the winning prescription (zero additional writes).
       - If `stored.issuanceRequestFingerprint !== computedFingerprint`: Throws HTTP 409 `IDEMPOTENCY_KEY_REUSE_MISMATCH`.
    4. The engine **NEVER** surfaces a generic `PRESCRIPTION_ISSUANCE_CONFLICT` for a same-key/same-fingerprint race when the winning record is available.

---

## 12. Prescription Snapshot Fields & Record Contract

The `PrescriptionExecutionRecord` encapsulates complete immutable audit context, dual pre-execution snapshots, and terminal outcome facts:

```javascript
// Identity & Idempotency
prescriptionId:                { type: String, required: true, trim: true }, // 'rx_<ObjectId>'
userId:                        { type: String, required: true, trim: true },
issuanceIdempotencyKey:        { type: String, required: true },
issuanceRequestFingerprint:    { type: String, required: true },
nonTerminalSlotKey:            { type: String, default: null }, // 'userId' when non-terminal; null when terminal
phase10AlgorithmVersion:       { type: String, required: true, trim: true },   // Captured from attributionConfig.ALGORITHM_VERSION
orchestrationAlgorithmVersion: { type: String, required: true, trim: true },   // Captured from orchestrationConfig.ORCHESTRATION_ALGORITHM_VERSION

// Prescription Definition (Frozen from Phase 9 DTO)
originSurface:                 { type: String, required: true, enum: ['next_action', 'daily_agenda'] },
actionId:                      { type: String, required: true },
actionType:                    { type: String, required: true, enum: [
                                   'PREREQUISITE_REMEDIATION', 'RETENTION_RESCUE', 'CURRICULUM_ADVANCEMENT',
                                   'PACING_CALIBRATION', 'EXAM_BENCHMARK', 'DIAGNOSTIC_ASSESSMENT'
                                 ]},
actionSubtype:                 { type: String, required: true },
policyPriorityClass:           { type: Number, default: null },
urgencyScore:                  { type: Number, default: null },
priorityTier:                  { type: String, required: true, enum: ['critical', 'urgent', 'high', 'normal', 'low'] },

// Target & Scoping Identifiers
topic:                         { type: String, default: null },
pattern:                       { type: String, default: null },
prescribedQuestions:           { type: Number, required: true, min: 0 },
estimatedMinutes:              { type: Number, default: null },
blockedTargetTopic:            { type: String, default: null },
blockedTargetPattern:          { type: String, default: null },
revisionItemId:                { type: mongoose.Schema.Types.ObjectId, ref: 'RevisionItem', default: null },
goalId:                        { type: mongoose.Schema.Types.ObjectId, ref: 'Goal', default: null },
planId:                        { type: mongoose.Schema.Types.ObjectId, ref: 'StudyPlan', default: null },
mockSessionId:                 { type: mongoose.Schema.Types.ObjectId, ref: 'MockSession', default: null }, // Root linkage for EXAM_BENCHMARK

// Dual Pre-Execution Snapshots
issuanceSnapshot:              { type: Object, required: true },           // Captured at issuance; never mutated
activationBaselineSnapshot:    { type: Object, default: null },            // Captured atomically at activation

// Lifecycle Timestamps & State
status:                        { type: String, required: true, default: 'issued',
                                 enum: ['issued', 'active', 'completed', 'abandoned', 'superseded', 'expired'] },
issuedAt:                      { type: Date, required: true },
activatedAt:                   { type: Date, default: null },
completedAt:                   { type: Date, default: null },
abandonedAt:                   { type: Date, default: null },
supersededAt:                  { type: Date, default: null },
supersededByPrescriptionId:    { type: String, default: null }, // 'rx_<ObjectId>' of superseding prescription; null if not superseded
expiresAt:                     { type: Date, required: true },
lastActivityAt:                { type: Date, default: null },

// Outcome Evidence
executionRequirementMet:       { type: Boolean, default: null },
targetMilestoneMet:            { type: Boolean, default: null },           // null when insufficient evidence
outcomeSnapshot:               { type: Object, default: null }             // Populated at terminal completion
```

### Schema Invariants & Design Decisions

1. **Algorithm Version Capturing (No Schema Defaults)**:
   - `phase10AlgorithmVersion` and `orchestrationAlgorithmVersion` are `required: true` strings with no schema defaults.
   - At issuance, `phase10AlgorithmVersion` is set explicitly from `attributionConfig.ALGORITHM_VERSION` (`'v1'`).
   - At issuance, `orchestrationAlgorithmVersion` is set explicitly from `orchestrationConfig.ORCHESTRATION_ALGORITHM_VERSION` (`'v1'`).
   - This ensures that if orchestration or attribution algorithms evolve, historical records remain unambiguously tied to the actual version that issued them, rather than an implicit schema default.

2. **`lastActivityAt` Lifecycle Semantics**:
   - `lastActivityAt` tracks the most recent authoritative lifecycle transition:
     - At issuance: `lastActivityAt = issuedAt`
     - At activation: `lastActivityAt = activatedAt`
     - At completion: `lastActivityAt = completedAt`
     - At abandonment: `lastActivityAt = abandonedAt`
     - At supersession: `lastActivityAt = supersededAt`
     - At expiry materialization: `lastActivityAt = referenceNow`
   - Provides an unambiguous audit trail for when the record last underwent a state mutation.

3. **`expiredAt` Decision (Option A — No `expiredAt`)**:
   - Phase 10 adopts **Option A**: `expiresAt` itself is the authoritative instant at which the prescription expired.
   - Status materialization occurs lazily when evaluated on write endpoints or dynamically in-memory on read endpoints.
   - Adding a separate `expiredAt` field would create redundant timestamp semantics; therefore, `expiresAt` remains the sole temporal boundary of expiration.

4. **Root `mockSessionId` Persistence & Immutability**:
   - For non-benchmark prescriptions: `mockSessionId = null`.
   - For completed `EXAM_BENCHMARK` prescriptions: the root field `mockSessionId` is populated with the verified `MockSession._id` during the completion CAS operation, mirroring its presence in `outcomeSnapshot`.
   - Once completed, `mockSessionId` is immutable; subsequent idempotent replay returns the stored completed record without replacing or reevaluating the linked session.

### Database Indexes

> [!IMPORTANT]
> **Zero Field-Level Index Annotations**: The schema contains ZERO field-level `unique: true` and ZERO field-level `index: true` declarations. This completely eliminates duplicate index creation by Mongoose.
>
> Exactly **FIVE** custom indexes are registered explicitly on `PrescriptionExecutionRecordSchema` (MongoDB's default `_id` is built-in and not counted among the five):

```javascript
// 1. Primary token lookup (unique)
PrescriptionExecutionRecordSchema.index(
  { prescriptionId: 1 },
  { unique: true }
);

// 2. Issuance retry / idempotency scope (unique)
PrescriptionExecutionRecordSchema.index(
  { userId: 1, issuanceIdempotencyKey: 1 },
  { unique: true }
);

// 3. Active-slot single-prescription invariant (unique partial)
PrescriptionExecutionRecordSchema.index(
  { nonTerminalSlotKey: 1 },
  {
    unique: true,
    partialFilterExpression: {
      nonTerminalSlotKey: { $type: 'string' }
    }
  }
);

// 4. User prescription history & pagination (compound descending)
PrescriptionExecutionRecordSchema.index(
  { userId: 1, issuedAt: -1 }
);

// 5. Status lifecycle & lazy expiry evaluation (compound ascending)
PrescriptionExecutionRecordSchema.index(
  { status: 1, expiresAt: 1 }
);
```

---

## 13. Attempt Attribution Contract

### 13.1 Non-Mock Prescriptions

For all action types **except** `EXAM_BENCHMARK`:
```text
Attempt.sessionId = prescriptionId
```

**Runtime Safety & Non-Conflicting Invariant**:
- `src/models/attemptModel.js` defines `sessionId: { type: String, required: false, trim: true }` with a sparse index `{ sessionId: 1 }`.
- The partial unique index `{ sessionId, questionId }` is strictly filtered by `{ source: 'mock' }`. Non-mock attempts have no session uniqueness constraints.
- Therefore, setting `sessionId = prescriptionId` on non-mock attempts creates zero index collisions.

Expected sources by action type:

| Action Type | Expected `Attempt.source` | Attribution Query Requirements |
|---|---|---|
| `PREREQUISITE_REMEDIATION` | `'practice'` | `topic`, `pattern`, `sessionId`, `attemptedAt >= activatedAt` |
| `RETENTION_RESCUE` | `'revision'` | `topic`, `pattern`, `sessionId`, `attemptedAt >= activatedAt` |
| `CURRICULUM_ADVANCEMENT` | `'practice'` | `topic`, `pattern`, `sessionId`, `attemptedAt >= activatedAt` |
| `PACING_CALIBRATION` | `'practice'` | `topic`, `sessionId`, `attemptedAt >= activatedAt` (`pattern` optional) |
| `DIAGNOSTIC_ASSESSMENT` | `'practice'` | `topic`, `pattern`, `sessionId`, `attemptedAt >= activatedAt` |
| `EXAM_BENCHMARK` | `'mock'` | N/A — see Section 13.2 |

### 13.2 EXAM_BENCHMARK Preservation of Mock Session ID & Execution Attribution Boundary

`EXAM_BENCHMARK` prescriptions **MUST NOT** set `Attempt.sessionId = prescriptionId`.
- Phase 6 mock finalization strictly requires `Attempt.source === 'mock'` and `Attempt.sessionId === MockSession._id.toString()`.
- Overwriting `Attempt.sessionId` would break Phase 6 result rebuild parity and violate the mock unique index.
- **Contract**: The mock test runs normally. At completion, the client supplies `mockSessionId`. Phase 10 verifies the mock session against frozen Phase 8 scope-alignment rules without modifying the `Attempt` record.

#### Benchmark Execution Attribution Boundary
The execution-linked baseline is captured at `activatedAt`. Therefore, a benchmark mock must NOT count if its execution began before activation.
- `MockSession.startedAt` must exist (`mockSession.startedAt instanceof Date`).
- Validation rule:
  ```javascript
  const mockStartedAfterActivation =
    mockSession.startedAt instanceof Date &&
    mockSession.startedAt >= prescription.activatedAt;
  ```
- **Pre-Activation Creation Invariant**: If a student created a mock session document before activation (`mockSession.createdAt < prescription.activatedAt`), but started execution after activation (`mockSession.startedAt >= prescription.activatedAt`), this is explicitly **VALID**. Benchmark execution begins at `startedAt`, not at session document creation.
- Auxiliary audit information: `createdAt` and `issuedAt` are preserved in `outcomeSnapshot`, but the execution attribution boundary is strictly `startedAt >= activatedAt`.

### 13.3 Attributed Attempt Query (Non-Mock)

```javascript
const attributedAttempts = await Attempt.find({
  userId: prescription.userId,
  sessionId: prescription.prescriptionId,
  source: expectedSource,
  topic: prescribedTopic,
  ...(prescribedPattern ? { pattern: prescribedPattern } : {}),
  attemptedAt: { $gte: prescription.activatedAt, $lte: referenceNow }
}).sort({ attemptedAt: 1, _id: 1 });
```

---

## 14. Passive Attribution Fallback: Explicitly Removed

The following passive inference behavior is **completely rejected and forbidden**:

```text
REJECTED: If client omits prescriptionId, infer attribution from attempts
within 60 minutes matching user/topic/pattern/source.
```

Any attempt submitted without `sessionId = prescriptionId` is strictly **`UNATTRIBUTED`**. It updates Phase 3 progress and Phase 5 revision state normally, but Phase 10 ignores it for prescription adherence and milestone achievement.

---

## 15. Lifecycle State Machine

### 15.1 State Definitions

- **`issued`**: Prescription minted and persisted; student has not yet begun execution.
- **`active`**: Student acknowledged prescription via `/activate`; `activationBaselineSnapshot` captured; execution lease running.
- **`completed`**: Terminal state reached when prescribed execution requirements are fully satisfied (`executionRequirementMet = true`).
- **`abandoned`**: Terminal state reached when student or client explicitly terminates the prescription before fulfilling execution requirements (`body.abandon === true`).
- **`superseded`**: Terminal state reached when a newer prescription is issued for the same user, atomically retiring this prescription.
- **`expired`**: Terminal state reached when `referenceNow >= expiresAt` for a previously `issued` or `active` prescription that was not completed, abandoned, or superseded first.

Terminal states: `completed`, `abandoned`, `superseded`, `expired`. Transitions out of terminal states are strictly forbidden.

### 15.2 Expiry Boundary & Terminal Precedence Invariants

1. **Authoritative Expiry Boundary**:
   A prescription is expired iff:
   ```text
   referenceNow >= expiresAt
   ```
   Equivalent query form for valid/unexpired records:
   ```javascript
   expiresAt: { $gt: referenceNow }
   ```
   Therefore:
   - `referenceNow < expiresAt` → valid (unexpired).
   - `referenceNow >= expiresAt` → expired.

2. **Terminal States Outrank Expiry**:
   Expiry applies strictly to non-terminal records (`issued` and `active`). Expiry **NEVER** retroactively invalidates a record once it reaches a terminal state:
   - `completed` prescription with `referenceNow >= expiresAt` → remains `completed`.
   - `abandoned` prescription with `referenceNow >= expiresAt` → remains `abandoned`.
   - `superseded` prescription with `referenceNow >= expiresAt` → remains `superseded`.
   - `expired` prescription with `referenceNow >= expiresAt` → remains `expired`.
   A terminal record is NEVER reinterpreted as expired.

3. **Issued Prescriptions Cannot Complete Directly**:
   The lifecycle strictly mandates:
   `issued → active → completed` OR `issued → active → abandoned`.
   Calling `POST /api/v1/attribution/prescriptions/:prescriptionId/complete` on a record in `issued` status throws `409 PRESCRIPTION_STATE_CONFLICT`, even if execution attempts exist. A prescription MUST be activated before completion or abandonment.

### 15.3 Allowed State Transitions

```text
issued  → active       (via POST /api/v1/attribution/prescriptions/:prescriptionId/activate)
issued  → expired      (lazy CAS evaluation when referenceNow >= expiresAt)
issued  → superseded   (atomic transaction when new prescription is issued)

active  → completed    (via POST /api/v1/attribution/prescriptions/:prescriptionId/complete, execution requirement met)
active  → abandoned    (via POST /api/v1/attribution/prescriptions/:prescriptionId/complete with body.abandon === true)
active  → superseded   (atomic transaction when new prescription is issued)
active  → expired      (lazy CAS evaluation when referenceNow >= expiresAt)
```

### 15.4 Execution Completion vs Outcome Success & Abandonment Lifecycle

Phase 10 strictly decouples execution completion from pedagogical milestone achievement, and formally defines explicit abandonment:

1. **`executionRequirementMet`**: Did the student complete the required work?
   - Question-bearing actions: `attributedAttempts.length >= prescribedQuestions`.
   - Exam benchmark: Valid linked `MockSession` satisfies terminal completion, start-time attribution (`startedAt >= activatedAt`), and goal scope alignment.
2. **`status = completed`**: Requires `executionRequirementMet === true`. It indicates that the prescribed learning activity was performed.
3. **`targetMilestoneMet`**: Did the pedagogical milestone succeed?
   - May legitimately be `true` (milestone met), `false` (milestone missed), or `null` (insufficient post-evidence).
   - A student who completes all 5 prescribed questions but fails to achieve 0.70 prerequisite mastery has:
     `status: 'completed'`, `executionRequirementMet: true`, `targetMilestoneMet: false`.
4. **Execution Incomplete Guard**: Calling `POST /api/v1/attribution/prescriptions/:prescriptionId/complete` without satisfying execution requirements (and without `body.abandon === true`) throws `new AppError(409, 'PRESCRIPTION_EXECUTION_INCOMPLETE', 'Prescribed questions are incomplete.')`. The record remains `active`.
5. **Abandonment Lifecycle (`body.abandon === true`)**:
   - Client sends `POST /api/v1/attribution/prescriptions/:prescriptionId/complete` with `{ userId, abandon: true }`.
   - Prescription record must be in `active` status.
   - Bypasses normal `executionRequirementMet` completion checks.
   - For `EXAM_BENCHMARK`, `mockSessionId` is **NOT required** when abandoning.
   - Does NOT claim pedagogical milestone success or failure.
   - State transition:
     - `status = 'abandoned'`
     - `abandonedAt = referenceNow`
     - `lastActivityAt = referenceNow`
     - `nonTerminalSlotKey = null`
     - `executionRequirementMet = false`
     - `targetMilestoneMet = null`
     - `outcomeSnapshot = { abandoned: true, abandonedAt: referenceNow, reason: 'USER_ABANDONED' }`
   - **Safe Retry Invariant**: If a prescription is already in `abandoned` status and receives a retry request with `body.abandon === true`, the endpoint returns HTTP `200 OK` with the stored abandoned record without modifying timestamps or writing duplicate history.

---

## 16. Action-Specific Pre-Execution Snapshot Contracts

Phase 10 splits pre-execution recording into two distinct, non-overlapping snapshots:
1. **`issuanceSnapshot`**: Captures why the prescription was issued and the exact algorithm evidence observed by Phase 9. Stored at issuance (`POST /api/v1/attribution/prescriptions`) and never mutated.
2. **`activationBaselineSnapshot`**: Captures the student's exact state immediately before attributed execution begins. Captured atomically during activation (`POST /api/v1/attribution/prescriptions/:prescriptionId/activate`).

All outcome deltas and progress comparisons **MUST strictly compare against `activationBaselineSnapshot`**. This ensures any self-directed or independent practice completed between issuance and activation is not incorrectly attributed to the prescription.

### 16.1 PREREQUISITE_REMEDIATION

```javascript
issuanceSnapshot: {
  actionType: 'PREREQUISITE_REMEDIATION',
  prerequisitePattern: string,
  prerequisiteTopic: string,
  prerequisiteMastery: number,     // StudentProgress.mastery at issuance (0 if absent)
  blockedTargetPattern: string,
  blockedTargetTopic: string,
  allPrerequisitesForTarget: [
    { pattern: string, mastery: number }
  ]
}

activationBaselineSnapshot: {
  actionType: 'PREREQUISITE_REMEDIATION',
  prerequisitePattern: string,
  prerequisiteTopic: string,
  prerequisiteMastery: number,     // StudentProgress.mastery at activation (0 if absent)
  blockedTargetPattern: string,
  blockedTargetTopic: string,
  allPrerequisitesForTarget: [
    { pattern: string, mastery: number }
  ]
}
```

### 16.2 RETENTION_RESCUE

```javascript
issuanceSnapshot: {
  actionType: 'RETENTION_RESCUE',
  revisionItemId: string,
  topic: string,
  pattern: string,
  stage: number,
  intervalDays: number,
  nextReviewDate: Date,
  status: string,
  lastOutcome: string | null,
  lastProcessedAttemptId: string | null
}

activationBaselineSnapshot: {
  actionType: 'RETENTION_RESCUE',
  revisionItemId: string,
  topic: string,
  pattern: string,
  stage: number,                   // RevisionItem.stage at activation
  intervalDays: number,
  nextReviewDate: Date,
  status: string,
  lastOutcome: string | null,
  lastProcessedAttemptId: string | null
}
```

### 16.3 CURRICULUM_ADVANCEMENT

```javascript
issuanceSnapshot: {
  actionType: 'CURRICULUM_ADVANCEMENT',
  topic: string,
  pattern: string,
  planId: string,
  dailyObjectiveId: string,
  patternTargetQuestions: number,
  patternCompletedQuestions: number,
  patternRemainingQuestions: number,
  storedMastery: number
}

activationBaselineSnapshot: {
  actionType: 'CURRICULUM_ADVANCEMENT',
  topic: string,
  pattern: string,
  planId: string,
  dailyObjectiveId: string,
  patternTargetQuestions: number,
  patternCompletedQuestions: number,  // Read from DailyObjective at activation
  patternRemainingQuestions: number,  // Derived at activation
  storedMastery: number               // StudentProgress.mastery at activation
}
```

#### Curriculum Issuance Snapshot Resolution & Integrity Invariant
The public Phase 9 action DTO does not expose internal daily quota counters at the top level. Therefore, Phase 10 resolves `dailyObjectiveId` and quota counters deterministically from the authoritative `DailyObjective` using the EXACT logical-day semantics Phase 9 uses (`src/services/orchestration/candidateGenerationService.js`):
1. **Logical Day Boundaries**: Compute `{ todayStartUtc, tomorrowStartUtc } = analyticsMathUtils.getLogicalDayBoundaries(referenceNow)`.
2. **Authoritative Query**:
   ```javascript
   const activeDailyObjective = await DailyObjective.findOne({
     userId,
     planId: action.executionIntent.planId,
     date: { $gte: todayStartUtc, $lt: tomorrowStartUtc },
     status: { $in: ['pending', 'in_progress'] },
   }).lean();
   ```
3. **Pattern Entry Resolution**: Find the matching entry in `activeDailyObjective.patterns.find(p => p.pattern === action.pattern)`.
4. **Counter Extraction**:
   - `dailyObjectiveId = String(activeDailyObjective._id)`
   - `patternTargetQuestions = patternEntry.targetQuestions`
   - `patternCompletedQuestions = patternEntry.completedQuestions`
   - `patternRemainingQuestions = Math.max(0, patternEntry.targetQuestions - patternEntry.completedQuestions)`
   - `storedMastery = currentProgress ? currentProgress.mastery : 0`
5. **Integrity Rule**: If Phase 9 emitted `CURRICULUM_ADVANCEMENT` but the matching active `DailyObjective` or pattern entry cannot be resolved:
   - Treat as an issuance integrity failure.
   - Throw `new AppError(500, 'ATTRIBUTION_ISSUANCE_FAILED', 'Phase 9 emitted CURRICULUM_ADVANCEMENT but active DailyObjective/pattern could not be resolved.')`.
   - Zero prescription write. Quota fields are NEVER fabricated.

### 16.4 PACING_CALIBRATION

Pacing calibration distinguishes between **issuance policy evidence** (why pacing was prescribed) and **activation topic baseline** (the baseline against which completion is evaluated):

#### A. Issuance Policy Evidence
Phase 9 pacing eligibility is determined by the overall bounded Phase 8 call:
`speedAccuracyMatrixService.getSpeedAccuracyMatrix(userId, 30, null, referenceNow)`.
At issuance, Phase 10 makes the SAME verified read-only call using the SAME issuance `referenceNow`:
```javascript
const result = await speedAccuracyMatrixService.getSpeedAccuracyMatrix(userId, 30, null, referenceNow);

issuanceSnapshot: {
  actionType: 'PACING_CALIBRATION',
  topic: action.topic,
  overallRushingRiskScore: result?.speedAccuracyMatrix?.rushingRiskScore ?? null,
  rushingRiskWindowDays: 30
}
```
This freezes the policy evidence explaining WHY pacing was prescribed.

#### B. Activation Topic Baseline
At activation, Phase 10 captures the topic-level baseline for the specific prescribed focus topic:
```javascript
const topicResult = await speedAccuracyMatrixService.getSpeedAccuracyMatrix(userId, 30, prescription.topic, referenceNow);

activationBaselineSnapshot: {
  actionType: 'PACING_CALIBRATION',
  topic: prescription.topic,
  topicRushingRiskScore: topicResult?.speedAccuracyMatrix?.rushingRiskScore ?? null,
  rushingRiskWindowDays: 30
}
```
At completion, the post-execution state is compared strictly against `activationBaselineSnapshot.topicRushingRiskScore`, NOT against the overall issuance policy risk score. Both direct Phase 8 calls remain protected by the finalization barrier.

### 16.5 EXAM_BENCHMARK

```javascript
issuanceSnapshot: {
  actionType: 'EXAM_BENCHMARK',
  goalId: string,
  planId: string | null,
  planTargetPatternsSnapshot: [    // Canonical { topic, pattern } targets frozen from StudyPlan; [] if no plan
    { topic: string, pattern: string }
  ],
  readinessStatus: string,
  eligibleMocksCount: number | null
}

activationBaselineSnapshot: {
  actionType: 'EXAM_BENCHMARK',
  goalId: string,
  planId: string | null,
  readinessStatus: string,         // Queried via readinessService.getGoalReadiness at activation
  eligibleMocksCount: number | null
}
```

#### Exam Benchmark Resolution Contract
Every snapshot field is grounded in an authoritative source:
1. `goalId`: Extracted directly from `action.executionIntent.goalId` (`MockAssessmentIntent`).
2. `planId`: Resolved using the EXACT same deterministic selected-active-plan query Phase 9 uses (`src/services/orchestration/candidateGenerationService.js`):
   ```javascript
   const selectedActivePlan = await StudyPlan.findOne({
     userId,
     goalId,
     status: 'active',
   })
     .sort({ startDate: -1, _id: 1 })
     .lean();
   ```
   If no active plan exists, `planId = null` and `planTargetPatternsSnapshot = []`.
3. `planTargetPatternsSnapshot`: `selectedActivePlan.targets.map(t => ({ topic: t.topic, pattern: t.pattern }))`.
4. `readinessStatus` and `eligibleMocksCount`: At issuance, Phase 10 calls the verified Phase 8 service using the SAME issuance `referenceNow`:
   ```javascript
   const readinessResult = await readinessService.getGoalReadiness(userId, goalId, referenceNow);
   // readinessStatus = readinessResult.readinessStatus
   // eligibleMocksCount = readinessResult?.components?.eligibleMockPerformance?.eligibleMocksCount ?? 0
   ```
5. **Activation Independence**: `EXAM_BENCHMARK` activation freezes the pre-execution readiness baseline and does NOT require a `mockSessionId`. The client executes the mock test and attaches `mockSessionId` only upon calling `POST /api/v1/attribution/prescriptions/:prescriptionId/complete`. All direct readiness calls are protected by the finalization barrier.

### 16.6 DIAGNOSTIC_ASSESSMENT

```javascript
issuanceSnapshot: {
  actionType: 'DIAGNOSTIC_ASSESSMENT',
  actionSubtype: string,
  topic: string,
  pattern: string,
  storedMastery: number,
  existingAttemptCount: number
}

activationBaselineSnapshot: {
  actionType: 'DIAGNOSTIC_ASSESSMENT',
  actionSubtype: string,
  topic: string,
  pattern: string,
  storedMastery: number,           // StudentProgress.mastery at activation
  existingAttemptCount: number     // Attempt count at activation
}
```

---

## 17. Action-Specific Outcome Evaluation Contracts

Outcome evaluation occurs at `POST /api/v1/attribution/prescriptions/:prescriptionId/complete`. PAOA strictly consumes authoritative Phase 3/5/6/8 persisted state and never recalculates domain formulas.

### 17.1 PREREQUISITE_REMEDIATION Outcome

```javascript
// Step 1: Validate execution requirement
const attributedAttempts = await getAttributedAttempts(prescription);
const executionRequirementMet = (attributedAttempts.length >= prescription.prescribedQuestions);

if (!executionRequirementMet && !isExplicitAbandon) {
  throw new AppError(409, 'PRESCRIPTION_EXECUTION_INCOMPLETE', 'Prescribed questions are incomplete.');
}

// Step 2: Read current progress
const currentProgress = await StudentProgress.findOne({ userId, topic, pattern });
const finalMastery = currentProgress ? currentProgress.mastery : 0;
const masteryDelta = finalMastery - prescription.activationBaselineSnapshot.prerequisiteMastery;

// Step 3: Evaluate prerequisite threshold
const prerequisiteThresholdMet = (finalMastery >= 0.70);

// Step 4: Evaluate blocked target unlock separately
const targetPrereqs = prescription.activationBaselineSnapshot.allPrerequisitesForTarget || [];
const targetPrereqProgress = await StudentProgress.find({
  userId,
  pattern: { $in: targetPrereqs.map(p => p.pattern) }
});
const blockedTargetFullyUnlocked = targetPrereqs.length > 0 && targetPrereqs.every(prereq => {
  const p = targetPrereqProgress.find(x => x.pattern === prereq.pattern);
  return p && p.mastery >= 0.70;
});

const targetMilestoneMet = prerequisiteThresholdMet;

outcomeSnapshot: {
  actionType: 'PREREQUISITE_REMEDIATION',
  attributedAttemptCount: attributedAttempts.length,
  prescribedQuestions: prescription.prescribedQuestions,
  executionRequirementMet,
  baselinePrerequisiteMastery: prescription.activationBaselineSnapshot.prerequisiteMastery,
  finalPrerequisiteMastery: finalMastery,
  masteryDelta,
  prerequisiteThresholdMet,
  blockedTargetFullyUnlocked,
  targetMilestoneMet
}
```

### 17.2 RETENTION_RESCUE Outcome (Phase 5 Processing Readiness & Final-Attempt Rule)

```javascript
// Step 1: Validate execution requirement
const attributedAttempts = await getAttributedAttempts(prescription);
const executionRequirementMet = (attributedAttempts.length >= prescription.prescribedQuestions);

if (!executionRequirementMet && !isExplicitAbandon) {
  throw new AppError(409, 'PRESCRIPTION_EXECUTION_INCOMPLETE', 'Prescribed revision questions are incomplete.');
}

// Step 2: Determine final attributed revision attempt
// Deterministic order: attemptedAt ASC, _id ASC
attributedAttempts.sort((a, b) => a.attemptedAt - b.attemptedAt || String(a._id).localeCompare(String(b._id)));
const finalAttempt = attributedAttempts[attributedAttempts.length - 1];

// Step 3: Phase 5 processing readiness check via RevisionProcessingRecord
const isProcessed = await RevisionProcessingRecord.exists({ attemptId: finalAttempt._id });
if (!isProcessed && !isExplicitAbandon) {
  throw new AppError(409, 'REVISION_PROCESSING_PENDING', 'Phase 5 revision processing has not yet completed for attributed attempts.');
}

// Step 4: Read current RevisionItem and confirm alignment
const revisionItem = await RevisionItem.findById(prescription.revisionItemId);
if (!revisionItem || String(revisionItem.lastProcessedAttemptId) !== String(finalAttempt._id)) {
  if (!isExplicitAbandon) {
    throw new AppError(409, 'REVISION_PROCESSING_PENDING', 'RevisionItem state does not reflect final attributed attempt.');
  }
}

// Step 5: Authoritative Phase 5 transition validation
const baselineStage = prescription.activationBaselineSnapshot.stage;
const retentionRescued = (
  revisionItem &&
  revisionItem.lastOutcome === 'correct' &&
  (
    revisionItem.stage > baselineStage ||                            // REVISION_SUCCESS_ADVANCED
    revisionItem.status === 'completed' ||                           // REVISION_FINAL_STAGE_COMPLETED
    (revisionItem.stage === 4 && baselineStage === 4 &&              // REVISION_FINAL_STAGE_EXTENDED
     revisionItem.intervalDays === 30 && revisionItem.status === 'scheduled')
  )
);

const targetMilestoneMet = Boolean(retentionRescued);

outcomeSnapshot: {
  actionType: 'RETENTION_RESCUE',
  attributedAttemptCount: attributedAttempts.length,
  prescribedQuestions: prescription.prescribedQuestions,
  executionRequirementMet,
  baselineStage,
  finalStage: revisionItem ? revisionItem.stage : baselineStage,
  baselineStatus: prescription.activationBaselineSnapshot.status,
  finalStatus: revisionItem ? revisionItem.status : 'unknown',
  lastOutcome: revisionItem ? revisionItem.lastOutcome : null,
  retentionRescued,
  targetMilestoneMet
}
```

### 17.3 CURRICULUM_ADVANCEMENT Outcome (Mastery Progression Contract)

> [!IMPORTANT]
> **Source Audit Confirmation**: A source audit of `src/services/attemptService.js` proves that creating an `Attempt` (with any `source`, including `'practice'`) does NOT increment `DailyObjective.patterns[].completedQuestions`. That counter is managed solely via manual/service updates.
> 
> Therefore, Phase 10 MUST NOT define curriculum success on `DailyObjective.patterns[].completedQuestions` reaching quota, as that counter never changes during adaptive practice without unauthorized Phase 3 modifications.
>
> Instead, Phase 10 evaluates curriculum outcome strictly on **observable mastery progression** from Phase 4:

```javascript
// Step 1: Validate execution requirement
const attributedAttempts = await getAttributedAttempts(prescription);
const executionRequirementMet = (attributedAttempts.length >= prescription.prescribedQuestions);

if (!executionRequirementMet && !isExplicitAbandon) {
  throw new AppError(409, 'PRESCRIPTION_EXECUTION_INCOMPLETE', 'Prescribed curriculum questions are incomplete.');
}

// Step 2: Read current progress and calculate mastery progression
const currentProgress = await StudentProgress.findOne({ userId, topic, pattern });
const finalMastery = currentProgress ? currentProgress.mastery : 0;
const baselineMastery = prescription.activationBaselineSnapshot.storedMastery;
const masteryDelta = finalMastery - baselineMastery;

// Step 3: Evaluate pedagogical milestone
// Pattern mastery increased, or pattern is proficient at planning target mastery (>= 0.85)
const masteryImproved = (masteryDelta > 0);
const planningTargetMasteryMet = (finalMastery >= 0.85);
const targetMilestoneMet = masteryImproved || planningTargetMasteryMet;

outcomeSnapshot: {
  actionType: 'CURRICULUM_ADVANCEMENT',
  attributedAttemptCount: attributedAttempts.length,
  prescribedQuestions: prescription.prescribedQuestions,
  executionRequirementMet,
  baselineMastery,
  finalMastery,
  masteryDelta,
  masteryImproved,
  planningTargetMasteryMet,
  targetMilestoneMet
}
```

### 17.4 PACING_CALIBRATION Outcome (Verified Phase 8 API Call)

```javascript
// Step 1: Extended finalization barrier check
const activeFinalization = await MockSession.findOne({ userId, finalizationState: 'in_progress' });
if (activeFinalization) {
  throw new AppError(409, 'FINALIZATION_IN_PROGRESS', 'Mock test finalization in progress.');
}

// Step 2: Validate execution requirement
const attributedAttempts = await getAttributedAttempts(prescription);
const executionRequirementMet = (attributedAttempts.length >= prescription.prescribedQuestions);

if (!executionRequirementMet && !isExplicitAbandon) {
  throw new AppError(409, 'PRESCRIPTION_EXECUTION_INCOMPLETE', 'Prescribed pacing questions are incomplete.');
}

// Step 3: Query post-execution rushing risk from Phase 8 via verified API
const result = await speedAccuracyMatrixService.getSpeedAccuracyMatrix(
  userId,
  prescription.activationBaselineSnapshot.rushingRiskWindowDays,
  prescription.topic,
  referenceNow
);
const postRisk = result?.speedAccuracyMatrix?.rushingRiskScore ?? null;
const baselineRisk = prescription.activationBaselineSnapshot.topicRushingRiskScore;

// Step 4: Handle post-execution evidence availability
let outcomeEvidenceStatus;
let riskImproved = null;
let riskResolvedBelowThreshold = null;
let targetMilestoneMet = null;

if (postRisk === null) {
  // Phase 8 returns null when evidence is insufficient; Phase 10 does not invent a cause
  outcomeEvidenceStatus = 'INSUFFICIENT_POST_EVIDENCE';
} else {
  outcomeEvidenceStatus = 'SUFFICIENT';
  riskImproved = baselineRisk !== null ? (postRisk < baselineRisk) : null;
  riskResolvedBelowThreshold = (postRisk < 0.60);
  targetMilestoneMet = riskResolvedBelowThreshold;
}

outcomeSnapshot: {
  actionType: 'PACING_CALIBRATION',
  attributedAttemptCount: attributedAttempts.length,
  prescribedQuestions: prescription.prescribedQuestions,
  executionRequirementMet,
  baselineRushingRiskScore: baselineRisk,
  finalRushingRiskScore: postRisk,
  riskImproved,
  riskResolvedBelowThreshold,
  outcomeEvidenceStatus,
  targetMilestoneMet // May be null if insufficient evidence; never falsely marked as failure
}
```

### 17.5 EXAM_BENCHMARK Outcome (Phase 8 Scope-Based Goal Alignment & Execution Attribution)

```javascript
// Step 1: Read and validate client-supplied MockSession
// Note: mockSessionId is required ONLY when not explicitly abandoning
if (!isExplicitAbandon) {
  if (!mockSessionId) {
    throw new AppError(400, 'VALIDATION_ERROR', 'mockSessionId is required to complete EXAM_BENCHMARK.');
  }
}

const mockSession = await MockSession.findById(mockSessionId);

if (!mockSession) {
  throw new AppError(404, 'MOCK_SESSION_NOT_FOUND', 'Mock session not found.');
}
if (String(mockSession.userId) !== String(prescription.userId)) {
  throw new AppError(403, 'FORBIDDEN', 'Access to foreign mock session is prohibited.');
}

// Step 2: Authoritative Phase 6 lifecycle verification & execution time attribution
const mockStartedAfterActivation = (
  mockSession.startedAt instanceof Date &&
  mockSession.startedAt >= prescription.activatedAt
);

const isTerminalAndCompleted = (
  ['submitted', 'expired'].includes(mockSession.status) &&
  mockSession.finalizationState === 'completed' &&
  mockSession.mode === 'standard' &&
  mockStartedAfterActivation
);

// Step 3: Authoritative Phase 8 goal-readiness scope alignment
// A mock test is goal-aligned iff MockScopePatterns ⊆ PlanTargetPatterns
const planTargetPatterns = prescription.issuanceSnapshot.planTargetPatternsSnapshot || [];
const mockScopePatterns = extractCanonicalPatternsFromBlueprint(mockSession.blueprintSnapshot);

const isScopeValid = (
  planTargetPatterns.length > 0 &&
  mockScopePatterns.length > 0 &&
  mockScopePatterns.every(mp =>
    planTargetPatterns.some(tp => tp.topic === mp.topic && tp.pattern === mp.pattern)
  )
);

const benchmarkCompletionVerified = Boolean(isTerminalAndCompleted && isScopeValid);
const executionRequirementMet = benchmarkCompletionVerified;
const targetMilestoneMet = benchmarkCompletionVerified;

if (!executionRequirementMet && !isExplicitAbandon) {
  throw new AppError(409, 'PRESCRIPTION_EXECUTION_INCOMPLETE', 'Mock benchmark execution verification failed.');
}

outcomeSnapshot: {
  actionType: 'EXAM_BENCHMARK',
  mockSessionId: String(mockSession._id),
  mockSessionStatus: mockSession.status,
  finalizationState: mockSession.finalizationState,
  mockStartedAt: mockSession.startedAt,
  mockCreatedAt: mockSession.createdAt,
  activatedAt: prescription.activatedAt,
  isScopeAligned: isScopeValid,
  benchmarkCompletionVerified,
  executionRequirementMet,
  targetMilestoneMet
};

// Root mockSessionId linkage is persisted on CAS:
// PrescriptionExecutionRecord.mockSessionId = mockSession._id
```

### 17.6 DIAGNOSTIC_ASSESSMENT Outcome

```javascript
// Step 1: Validate execution requirement
const attributedAttempts = await getAttributedAttempts(prescription);
const executionRequirementMet = (attributedAttempts.length >= prescription.prescribedQuestions);

if (!executionRequirementMet && !isExplicitAbandon) {
  throw new AppError(409, 'PRESCRIPTION_EXECUTION_INCOMPLETE', 'Prescribed diagnostic questions are incomplete.');
}

// Step 2: Read current progress
const currentProgress = await StudentProgress.findOne({ userId, topic, pattern });
const finalMastery = currentProgress ? currentProgress.mastery : 0;
const masteryDelta = finalMastery - prescription.activationBaselineSnapshot.storedMastery;

let baselineEvidenceCreated = null;
let targetMilestoneMet;

if (prescription.actionSubtype === 'FOUNDATIONAL_DIAGNOSTIC') {
  baselineEvidenceCreated = (finalMastery > 0 || attributedAttempts.length > 0);
  targetMilestoneMet = executionRequirementMet && baselineEvidenceCreated;
} else {
  // FOUNDATIONAL_REINFORCEMENT
  targetMilestoneMet = executionRequirementMet;
}

outcomeSnapshot: {
  actionType: 'DIAGNOSTIC_ASSESSMENT',
  actionSubtype: prescription.actionSubtype,
  attributedAttemptCount: attributedAttempts.length,
  prescribedQuestions: prescription.prescribedQuestions,
  executionRequirementMet,
  baselineMastery: prescription.activationBaselineSnapshot.storedMastery,
  finalMastery,
  masteryDelta,
  baselineEvidenceCreated,
  targetMilestoneMet
}
```

---

## 18. Observational Attribution & Non-Causal Semantics

### 18.1 Observational / Non-Causal Terminology
All outcome attribution metrics produced by Phase 10 must be formally designated as **observational associations** rather than definitive causal claims. In educational psychometrics and adaptive learning environments, external confounders (prior student ability, unmonitored external study, fatigue, motivation, spaced repetition intervals) cannot be eliminated without controlled A/B randomized trials.

Therefore, Phase 10 establishes the following linguistic and analytical invariants:
1. **Terminology Standard**:
   - Use: *Attributed Delta*, *Post-Prescription Observation*, *Observed Pre/Post Association*, *Prescription Completion Status*, *Associated Mastery Shift*.
   - Never Use: *Prescription Caused*, *Causal Lift*, *Direct Impact Percentage*, *Proved Skill Acquisition*, *Intervention Effectiveness*.
2. **Attribution Scope**:
   - Phase 10 records whether a user *complied* with an authoritative Phase 9 prescription (`executionRequirementMet`) and whether the relevant psychometric indicators met the specified *milestone criteria* (`targetMilestoneMet`).
   - The engine explicitly documents that non-prescribed practice, elapsed time, and natural regression may contribute to the observed score delta.

### 18.2 Confounding Factors Warning
Every analytical summary and detailed attribution payload must document the observational nature of the metrics. In API documentation and response schemas, an explicit `attributionNotice` or metadata disclaimer affirms:
```text
"Metrics reflect observed pre/post psychometric changes following prescription execution. Observed shifts represent statistical associations within natural study flows and are not randomized controlled causal proofs."
```

---

## 19. Expiry, Supersession & Concurrency Control

### 19.1 Active Slot Invariant (`nonTerminalSlotKey`)
A core database-level invariant of the Phase 10 architecture is that **a user may possess at most ONE non-terminal prescription at any given moment**.
The lifecycle states are categorized as:
- **Non-Terminal States**: `issued`, `active`.
- **Terminal States**: `completed`, `expired`, `superseded`, `abandoned`.

To enforce this invariant with 100% database authority (preventing race conditions from concurrent HTTP requests), `PrescriptionExecutionRecord` incorporates a synthetic indexing field:
```javascript
nonTerminalSlotKey: {
  type: String,
  default: null
}
```
**Slot Key Mechanics**:
- When a record is created in `issued` or transitioned to `active`, `nonTerminalSlotKey` is set to `record.userId.toString()`.
- When a record transitions to ANY terminal state (`completed`, `expired`, `superseded`, `abandoned`), `nonTerminalSlotKey` is atomically set to `null`.
- A unique partial index enforces exclusivity:
```javascript
PrescriptionExecutionRecordSchema.index(
  { nonTerminalSlotKey: 1 },
  {
    unique: true,
    partialFilterExpression: { nonTerminalSlotKey: { $type: 'string' } }
  }
);
```

#### Collision Error Classification
A MongoDB `E11000 duplicate key error` during issuance may originate from two completely different indexes:
1. **Collision on `{ userId: 1, issuanceIdempotencyKey: 1 }` (Identity Duplicate)**:
   - Indicates a concurrent or repeated request with the same idempotency key.
   - Handled via deterministic fingerprint re-read: returns HTTP `200 OK` if fingerprints match, or HTTP 409 `IDEMPOTENCY_KEY_REUSE_MISMATCH` if mismatched.
2. **Collision on `{ nonTerminalSlotKey: 1 }` (Active Slot Conflict)**:
   - Indicates that another active or issued prescription already occupies the user's execution slot.
   - Handled by rolling back and throwing HTTP 409 `PRESCRIPTION_ISSUANCE_CONFLICT` (unless resolved by the supersession transaction retry).
- The engine strictly distinguishes these errors and NEVER collapses them into one generic code.

### 19.2 Atomic Transactional Supersession & Transaction Retry Policy
When a user requests a new prescription while an active or issued non-terminal prescription already exists:
1. Issuance executes inside a **MongoDB multi-document transaction** via a replica-set session (`client.startSession()`).
2. Within the transaction:
   - The existing non-terminal record is queried:
     ```javascript
     const existing = await PrescriptionExecutionRecord.findOne({
       userId,
       status: { $in: ['issued', 'active'] }
     }).session(session);
     ```
   - If found, the existing non-terminal record is classified using the request's single `referenceNow`:
     ```javascript
     if (existing) {
       if (referenceNow >= existing.expiresAt) {
         existing.status = 'expired';
         existing.nonTerminalSlotKey = null;
         existing.lastActivityAt = referenceNow;

         // MUST remain null because no prescription superseded it.
         existing.supersededAt = null;
         existing.supersededByPrescriptionId = null;

         await existing.save({ session });
       } else {
         existing.status = 'superseded';
         existing.supersededAt = referenceNow;
         existing.supersededByPrescriptionId = newPrescriptionId;
         existing.lastActivityAt = referenceNow;
         existing.nonTerminalSlotKey = null;

         await existing.save({ session });
       }
     }
     ```
   - The new record is inserted with `nonTerminalSlotKey = userId.toString()`, `lastActivityAt = referenceNow`.
   - The transaction commits atomically.
3. **Predecessor Terminal-State Invariant**:
   - `existing issued/active` AND `referenceNow < expiresAt` → `status = 'superseded'` by new prescription (`supersededAt = referenceNow`, `supersededByPrescriptionId = newPrescriptionId`).
   - `existing issued/active` AND `referenceNow >= expiresAt` → `status = 'expired'` before new prescription is inserted (`supersededAt = null`, `supersededByPrescriptionId = null`).
   - **Forbidden Invariant**: An already-expired non-terminal prescription MUST NOT be relabelled as `superseded`. Historical lifecycle classification remains strictly truthful.
4. **Effect on Adherence Analytics**:
   - Both `expired` and `superseded` states are counted as resolved non-adherence for `executionAdherenceRate` (denominator is unchanged).
   - However, `statusCounts.expired` and `statusCounts.superseded` remain semantically and historically accurate.
5. **Transaction Retry Policy**:
   - For transient transaction conflicts (`TransientTransactionError`, `UnknownTransactionCommitResult`), Phase 10 executes a **single bounded retry** (max 1 retry with exponential backoff/jitter).
   - If the retry fails or write conflict persists, the engine rolls back and throws:
     ```javascript
     throw new AppError(
       409,
       'PRESCRIPTION_ISSUANCE_CONFLICT',
       'Concurrent prescription issuance conflict. Please retry.'
     );
     ```
   - Phase 10 **NEVER** falls back to unsafe, non-transactional sequential writes that could leave multiple un-superseded records or partial updates.

### 19.3 Expiry Lifecycle Evaluation & Atomic Materialization CAS
A prescription has an authoritative lifespan determined by `expiresAt` (default: 24 hours from issuance, matching the daily agenda planning cycle).
- **Authoritative Rule**: A prescription is expired iff `referenceNow >= expiresAt`. Query form `expiresAt: { $gt: referenceNow }` indicates still valid.
- **Terminal Exemption**: Expiry applies ONLY to `status in ['issued', 'active']`. Terminal records (`completed`, `abandoned`, `superseded`, `expired`) are permanently immutable and are never reinterpreted as expired.
- **Write Endpoints**: On write endpoints (`/activate`, `/complete`), non-terminal records are evaluated against `referenceNow >= existing.expiresAt`.
  If expired, the transition to `expired` is executed atomically via CAS:
  ```javascript
  const expiredRecord = await PrescriptionExecutionRecord.findOneAndUpdate(
    {
      prescriptionId,
      userId,
      status: { $in: ['issued', 'active'] },
      expiresAt: { $lte: referenceNow }
    },
    {
      $set: {
        status: 'expired',
        nonTerminalSlotKey: null,
        lastActivityAt: referenceNow
      }
    },
    { new: true }
  );
  ```
  If another request already transitioned the record (`expiredRecord` is null), the engine re-reads the record and applies terminal-state precedence.
- **Read-Only Endpoints**: On `GET /api/v1/attribution/users/:userId/summary`, records are evaluated dynamically in-memory with **effective expiry** without issuing database writes (see Section 23).

---

## 20. Idempotency & Write Semantics

### 20.1 Issuance Idempotency & Request Fingerprinting
Issuance (`POST /api/v1/attribution/prescriptions`) mandates the `Idempotency-Key` HTTP header.
To protect against ambiguous replay or key reuse with different payloads, Phase 10 computes a deterministic **request fingerprint**:
```javascript
const crypto = require('crypto');

function computeIssuanceFingerprint(userId, originSurface, goalId, actionId) {
  const normalizedPayload = {
    userId: String(userId).trim(),
    originSurface,
    goalId: goalId ? String(goalId) : null,
    actionId: actionId ? String(actionId) : null,
  };

  return crypto
    .createHash('sha256')
    .update(JSON.stringify(normalizedPayload))
    .digest('hex');
}
```

#### Canonical Serialization & Delimiter Prohibition
1. **Forbidden Delimiter Concatenation**:
   Delimiter-based joining (e.g. `.join(':')`) is **strictly forbidden and permanently removed**. Identifier strings may contain delimiter characters (`:`, `/`, `-`, `_`), making string concatenation ambiguous.
2. **Frozen Property Order**:
   The normalized JSON payload MUST be constructed in this exact property order:
   `userId`, `originSurface`, `goalId`, `actionId`.
3. **Excluded Attributes**:
   The fingerprint strictly excludes `referenceNow`, `Idempotency-Key`, HTTP headers, and undefined properties. The `Idempotency-Key` scopes the idempotency lease; the request fingerprint guarantees semantic request equality.
4. *Identity Note*: The fingerprint uses the explicit request `userId` (validated scalar string), NOT an implicit request-attached authenticated identity.

**Unique Database Index**:
```javascript
PrescriptionExecutionRecordSchema.index(
  { userId: 1, issuanceIdempotencyKey: 1 },
  { unique: true }
);
```

**Replay Validation Semantics**:
1. When `POST /api/v1/attribution/prescriptions` receives `Idempotency-Key`:
   - Checks if a record already exists with `{ userId, issuanceIdempotencyKey }`.
2. **Fingerprint Match (Identical Request)**:
   - If `existing.issuanceRequestFingerprint === computedFingerprint`:
     - Returns HTTP `200 OK` with the existing prescription payload.
     - Performs **zero database writes** and zero Phase 8/9 service calls.
3. **Same-Key Replay After Expiry**:
   - If `referenceNow >= existing.expiresAt` during an identical replay:
     - The engine MUST NOT create a new prescription (`rx_2`).
     - The engine MUST NOT supersede `rx_1`.
     - The engine MUST NOT recompute Phase 8/9.
     - Returns HTTP `200 OK` with the stored prescription DTO.
     - Performs **zero database writes** (does not mutate DB solely for replay).
     - Response DTO exposes `effectiveStatus: 'expired'` and `isExpired: true`.
4. **Stored Status vs Effective Status**:
   - Clearly distinguishes *persisted status* from *effective status as of referenceNow* on zero-write read/replay paths.
   - An expired lease is never presented to the student as executable simply because MongoDB still stores `status: 'issued'`.
5. **Fingerprint Mismatch (Mismatched Request)**:
   - If `existing.issuanceRequestFingerprint !== computedFingerprint`:
     - Throws:
       ```javascript
       throw new AppError(
         409,
         'IDEMPOTENCY_KEY_REUSE_MISMATCH',
         'Idempotency key reuse with mismatched request payload.'
       );
       ```
     - Performs **zero database writes**.

### 20.2 Activation Compare-And-Swap (CAS)
Prescription activation (`POST /api/v1/attribution/prescriptions/:prescriptionId/activate`) transitions an `issued` prescription to `active` and captures `activationBaselineSnapshot`.
To prevent duplicate activation, race conditions, or replaying expired leases:

```javascript
// Step 1: Pre-flight check & existence
const existing = await PrescriptionExecutionRecord.findOne({ prescriptionId, userId });
if (!existing) {
  throw new AppError(404, 'PRESCRIPTION_NOT_FOUND', 'Prescription not found.');
}

// Step 2: Non-terminal expiry check (evaluated BEFORE active replay)
if (
  ['issued', 'active'].includes(existing.status) &&
  referenceNow >= existing.expiresAt
) {
  await PrescriptionExecutionRecord.findOneAndUpdate(
    {
      prescriptionId,
      userId,
      status: { $in: ['issued', 'active'] },
      expiresAt: { $lte: referenceNow }
    },
    {
      $set: {
        status: 'expired',
        nonTerminalSlotKey: null,
        lastActivityAt: referenceNow
      }
    }
  );
  throw new AppError(409, 'PRESCRIPTION_STATE_CONFLICT', 'Prescription has expired.');
}

// Step 3: Idempotent re-activation return (only while still unexpired)
if (existing.status === 'active') {
  return existing; // HTTP 200 OK idempotent replay
}

// Step 4: Verify issued status
if (existing.status !== 'issued') {
  throw new AppError(
    409,
    'PRESCRIPTION_STATE_CONFLICT',
    `Cannot activate prescription in status "${existing.status}".`
  );
}

// Step 5: Atomic CAS transition to active
const updated = await PrescriptionExecutionRecord.findOneAndUpdate(
  {
    prescriptionId,
    userId,
    status: 'issued',
    expiresAt: { $gt: referenceNow }
  },
  {
    $set: {
      status: 'active',
      activatedAt: referenceNow,
      lastActivityAt: referenceNow,
      activationBaselineSnapshot: capturedBaseline
    }
  },
  { new: true }
);

if (!updated) {
  // CAS lost race: resolve current state
  const current = await PrescriptionExecutionRecord.findOne({ prescriptionId, userId });
  if (current && current.status === 'active' && referenceNow < current.expiresAt) {
    return current; // HTTP 200 OK
  }
  throw new AppError(409, 'PRESCRIPTION_STATE_CONFLICT', 'Concurrent state transition conflict during activation.');
}

return updated;
```

### 20.3 Completion Compare-And-Swap (CAS) & Concurrency Control
Prescription completion (`POST /api/v1/attribution/prescriptions/:prescriptionId/complete`) must never perform an unsafe "read active → compute → unconditional save" sequence. Completion is protected by strict **Compare-And-Swap (CAS)** concurrency semantics and exact precedence handling:

```javascript
// Step 1: Pre-flight check & existence
const existing = await PrescriptionExecutionRecord.findOne({ prescriptionId, userId });
if (!existing) {
  throw new AppError(404, 'PRESCRIPTION_NOT_FOUND', 'Prescription not found.');
}

// Step 2: Safe idempotent replay for completed states (checked BEFORE expiry)
// Terminal completed record is frozen; elapsed time never invalidates it
if (existing.status === 'completed') {
  return existing; // HTTP 200 OK idempotent return (zero writes)
}

// Step 3: Safe idempotent replay for abandoned states (checked BEFORE expiry)
if (existing.status === 'abandoned' && body.abandon === true) {
  return existing; // HTTP 200 OK safe retry return (zero writes)
}

// Step 4: Reject terminal states that cannot be completed
if (['superseded', 'expired'].includes(existing.status)) {
  throw new AppError(
    409,
    'PRESCRIPTION_STATE_CONFLICT',
    `Cannot complete prescription in terminal status "${existing.status}".`
  );
}
if (existing.status === 'abandoned') {
  throw new AppError(
    409,
    'PRESCRIPTION_STATE_CONFLICT',
    'Prescription was previously abandoned and cannot be completed.'
  );
}

// Step 5: Issued prescriptions CANNOT complete directly
if (existing.status === 'issued') {
  throw new AppError(
    409,
    'PRESCRIPTION_STATE_CONFLICT',
    'Cannot complete prescription in "issued" status. Prescription must be activated before completion.'
  );
}

// Step 6: Non-terminal expiry evaluation (only reached when status is 'active')
if (referenceNow >= existing.expiresAt) {
  await PrescriptionExecutionRecord.findOneAndUpdate(
    {
      prescriptionId,
      userId,
      status: { $in: ['issued', 'active'] },
      expiresAt: { $lte: referenceNow }
    },
    {
      $set: {
        status: 'expired',
        nonTerminalSlotKey: null,
        lastActivityAt: referenceNow
      }
    }
  );
  throw new AppError(409, 'PRESCRIPTION_STATE_CONFLICT', 'Prescription has expired.');
}

// Step 7: Handle explicit abandonment path
if (body.abandon === true) {
  const abandonedRecord = await PrescriptionExecutionRecord.findOneAndUpdate(
    {
      prescriptionId,
      userId,
      status: 'active',
      expiresAt: { $gt: referenceNow }
    },
    {
      $set: {
        status: 'abandoned',
        abandonedAt: referenceNow,
        lastActivityAt: referenceNow,
        nonTerminalSlotKey: null,
        executionRequirementMet: false,
        targetMilestoneMet: null,
        outcomeSnapshot: {
          abandoned: true,
          abandonedAt: referenceNow,
          reason: 'USER_ABANDONED'
        }
      }
    },
    { new: true }
  );

  if (!abandonedRecord) {
    const current = await PrescriptionExecutionRecord.findOne({ prescriptionId, userId });
    if (current && current.status === 'abandoned') {
      return current; // HTTP 200 OK safe retry
    }
    throw new AppError(409, 'PRESCRIPTION_STATE_CONFLICT', 'Concurrent state transition conflict during abandonment.');
  }

  return abandonedRecord;
}

// Step 8: Normal outcome calculation & execution checks
// - For EXAM_BENCHMARK: mockSessionId required, ownership check, startedAt >= activatedAt check
// - For question-bearing: count attributed attempts (sessionId === prescriptionId), check prescribedQuestions
// - For RETENTION_RESCUE: check RevisionProcessingRecord and RevisionItem alignment
// - Evaluate targetMilestoneMet and build outcomeSnapshot

// Step 9: Atomic CAS transition to completed
const casUpdate = {
  status: 'completed',
  completedAt: referenceNow,
  lastActivityAt: referenceNow,
  nonTerminalSlotKey: null,
  executionRequirementMet,
  targetMilestoneMet,
  outcomeSnapshot
};

if (existing.actionType === 'EXAM_BENCHMARK') {
  casUpdate.mockSessionId = mockSession._id;
}

const completedRecord = await PrescriptionExecutionRecord.findOneAndUpdate(
  {
    prescriptionId,
    userId,
    status: 'active',
    expiresAt: { $gt: referenceNow }
  },
  {
    $set: casUpdate
  },
  { new: true }
);

if (!completedRecord) {
  // CAS lost race: evaluate current state
  const current = await PrescriptionExecutionRecord.findOne({ prescriptionId, userId });
  if (current && current.status === 'completed') {
    // Concurrent request completed it; return the already-frozen result without overwriting
    return current; // HTTP 200 OK
  }
  if (current && ['abandoned', 'superseded', 'expired'].includes(current.status)) {
    throw new AppError(
      409,
      'PRESCRIPTION_STATE_CONFLICT',
      `Prescription was transitioned to "${current.status}" by a concurrent operation.`
    );
  }
  throw new AppError(
    409,
    'PRESCRIPTION_STATE_CONFLICT',
    'Concurrent state modification detected during prescription completion.'
  );
}

return completedRecord;
```

**Concurrency Guarantees**:
- Parallel completion calls execute safely without race conditions.
- A concurrent second completion request NEVER overwrites the first frozen outcome, `mockSessionId`, or `completedAt` timestamp.
- Losing a race against another completion request safely returns the existing record with HTTP `200 OK`.
- Losing a race against abandonment, supersession, or expiration returns `409 PRESCRIPTION_STATE_CONFLICT`.

---

## 21. Security, Authorization & Ownership Boundary

Authentication/RBAC is outside Phase 10 V1. Security is identifier-based ownership validation only.

Phases 1–9 do not implement JWT, Bearer tokens, session cookies, OAuth, RBAC, or request-attached user identity contexts. Phase 10 strictly preserves this platform invariant. Phase 10 is NOT cryptographically authenticated.

### 21.1 Identifier Ownership & Tenant Isolation
All Phase 10 operations require an explicit `userId` parameter (in the request body for POST routes, or in the URL path for GET routes).

1. **User Identity Validation**:
   - `userId` must be a scalar string, trimmed, non-empty.
   - `userId` must exist in the authoritative User collection (`await userExists(userId)`).
   - If `userId` is missing, blank, or invalid: throws `new AppError(400, 'VALIDATION_ERROR', 'userId is required and must be a valid non-empty string.')`.
   - If `userId` does not exist in the database: throws `new AppError(404, 'USER_NOT_FOUND', 'User not found.')`.

2. **Application-Level Ownership Enforcement**:
   - Every query filter on `PrescriptionExecutionRecord` includes `{ prescriptionId, userId: requestingUserId }`.
   - If a prescription exists but is owned by a different user (`String(record.userId) !== String(requestingUserId)`):
     ```javascript
     throw new AppError(403, 'FORBIDDEN', 'Access to foreign prescription record is forbidden.');
     ```
   - If no prescription exists with `prescriptionId`:
     ```javascript
     throw new AppError(404, 'PRESCRIPTION_NOT_FOUND', 'Prescription not found.');
     ```

### 21.2 MockSession Ownership Validation
For `EXAM_BENCHMARK` prescriptions, the client supplies `mockSessionId` when calling `POST /api/v1/attribution/prescriptions/:prescriptionId/complete`. Phase 10 enforces strict two-stage validation:

1. **Existence Check**:
   ```javascript
   const session = await MockSession.findById(mockSessionId);
   if (!session) {
     throw new AppError(404, 'MOCK_SESSION_NOT_FOUND', 'Mock session not found.');
   }
   ```
2. **Ownership Check**:
   ```javascript
   if (String(session.userId) !== String(requestingUserId)) {
     throw new AppError(403, 'FORBIDDEN', 'Access to foreign mock session is forbidden.');
   }
   ```
This cleanly distinguishes non-existent sessions (`404 MOCK_SESSION_NOT_FOUND`) from attempts to attach foreign sessions (`403 FORBIDDEN`).

---

## 22. Proposed API Contract Specification

Phase 10 exposes **EXACTLY FOUR** canonical HTTP routes under `/api/v1/attribution`:

### 22.1 `POST /api/v1/attribution/prescriptions`
Issues a new server-authoritative prescription execution record based on the current Phase 9 recommendation or daily agenda activity.

- **Headers**:
  - `Idempotency-Key: <required non-empty string, max 128 chars>`
- **Request Body**:
  ```json
  {
    "userId": "required string",
    "originSurface": "next_action | daily_agenda",
    "goalId": "optional ObjectId string",
    "actionId": "required only for daily_agenda"
  }
  ```
- **Responses**:
  - `201 Created`: Successfully issued new prescription (`PrescriptionExecutionRecord`).
  - `200 OK`: Idempotent replay of identical prior request matching fingerprint.
  - `400 Bad Request`: `VALIDATION_ERROR` (missing Idempotency-Key, missing/empty userId, invalid originSurface, missing actionId for daily_agenda).
  - `404 Not Found`: `USER_NOT_FOUND` or `GOAL_NOT_FOUND`.
  - `409 Conflict`:
    - `IDEMPOTENCY_KEY_REUSE_MISMATCH`: Key reused with different request payload.
    - `NO_ISSUABLE_PRESCRIPTION`: Agenda has no matching actionable activity or arbiter yielded no action.
    - `FINALIZATION_IN_PROGRESS`: Mock finalization active during readiness/Phase 8 read.
    - `PRESCRIPTION_ISSUANCE_CONFLICT`: Concurrency conflict during supersession transaction.
  - `500 Internal Server Error`: `ATTRIBUTION_ISSUANCE_FAILED` (Phase 9 DTO integrity failure or unresolvable DailyObjective quota).

### 22.2 `POST /api/v1/attribution/prescriptions/:prescriptionId/activate`
Activates an `issued` prescription and atomically freezes the pre-execution `activationBaselineSnapshot`.

- **Headers**: None required (no authentication headers).
- **Request Body**:
  ```json
  {
    "userId": "required string"
  }
  ```
- **Responses**:
  - `200 OK`: Prescription activated, baseline captured (or idempotent replay if already active and unexpired).
  - `400 Bad Request`: `VALIDATION_ERROR` (missing or non-string userId).
  - `403 Forbidden`: `FORBIDDEN` (prescription owned by another user).
  - `404 Not Found`: `USER_NOT_FOUND` or `PRESCRIPTION_NOT_FOUND`.
  - `409 Conflict`:
    - `PRESCRIPTION_STATE_CONFLICT`: Prescription already terminal, expired (`referenceNow >= expiresAt`), or superseded.
    - `FINALIZATION_IN_PROGRESS`: Mock finalization active during baseline capture.

### 22.3 `POST /api/v1/attribution/prescriptions/:prescriptionId/complete`
Validates adherence criteria, queries attributed attempts, evaluates target milestones, and atomically transitions the record to `completed` via CAS (or to `abandoned` if `body.abandon === true`).

- **Headers**: None required.
- **Request Body**:
  ```json
  {
    "userId": "required string",
    "abandon": "optional boolean",
    "mockSessionId": "required when completing EXAM_BENCHMARK and abandon !== true; otherwise omitted"
  }
  ```
- **Responses**:
  - `200 OK`: Completed (final `outcomeSnapshot` sealed, root `mockSessionId` persisted for benchmark) OR abandoned (if body.abandon === true); idempotent replay if already in target terminal state.
  - `400 Bad Request`: `VALIDATION_ERROR` (missing userId, missing mockSessionId for benchmark normal completion).
  - `403 Forbidden`: `FORBIDDEN` (prescription or mock session owned by another user).
  - `404 Not Found`: `USER_NOT_FOUND`, `PRESCRIPTION_NOT_FOUND`, or `MOCK_SESSION_NOT_FOUND`.
  - `409 Conflict`:
    - `PRESCRIPTION_EXECUTION_INCOMPLETE`: Prescribed questions not satisfied (when body.abandon !== true), or mock started before activation.
    - `PRESCRIPTION_STATE_CONFLICT`: Record not active (e.g. issued, expired, superseded, or previously abandoned), or concurrent state modification detected.
    - `REVISION_PROCESSING_PENDING`: Downstream Phase 5 state not yet recorded for final revision attempt.
    - `FINALIZATION_IN_PROGRESS`: Mock finalization active during post-evaluation.

### 22.4 `GET /api/v1/attribution/users/:userId/summary`
Retrieves bounded, read-only analytics summarizing prescription completion, execution adherence, and learning outcome progression for the specified user.

- **Path Parameters**:
  - `userId`: required string
- **Query Parameters**:
  - `windowDays`: integer between 1 and 90 (default: 30).
  - `actionType`: optional filter validated against the six canonical action types.
- **Responses**:
  - `200 OK`: Summary DTO with evaluatedPrescriptionCount, statusCounts, resolvedPrescriptionCount, executionAdherenceRate, milestonesEvaluated, milestonesMet, milestonesInsufficientEvidence, milestoneSuccessRate, and bounded prescription history.
  - `400 Bad Request`: `VALIDATION_ERROR` (invalid windowDays or unknown actionType).
  - `404 Not Found`: `USER_NOT_FOUND`.

---

## 23. Analytics & Summary Query Bounds

### 23.1 Bounded Query Limits (Limit 501 / Cap 500)
To prevent unconstrained memory allocation and database degradation:
1. `GET /api/v1/attribution/users/:userId/summary` queries `PrescriptionExecutionRecord` within `[referenceNow - windowDays, referenceNow]` up to **501 documents**, filtering by optional validated `actionType`:
   ```javascript
   const filter = {
     userId,
     issuedAt: { $gte: windowStart, $lte: referenceNow }
   };

   if (actionType !== undefined) {
     const CANONICAL_ACTION_TYPES = [
       'PREREQUISITE_REMEDIATION',
       'RETENTION_RESCUE',
       'CURRICULUM_ADVANCEMENT',
       'PACING_CALIBRATION',
       'EXAM_BENCHMARK',
       'DIAGNOSTIC_ASSESSMENT'
     ];
     if (!CANONICAL_ACTION_TYPES.includes(actionType)) {
       throw new AppError(400, 'VALIDATION_ERROR', `Invalid actionType "${actionType}". Must be one of canonical action types.`);
     }
     filter.actionType = actionType;
   }

   const probeRecords = await PrescriptionExecutionRecord.find(filter)
     .sort({
       issuedAt: -1,
       _id: 1
     })
     .limit(501)
     .lean();

   const isTruncated = probeRecords.length > 500;
   const isExhaustive = !isTruncated;
   const evaluatedRecords = isTruncated ? probeRecords.slice(0, 500) : probeRecords;
   ```
2. **Deterministic Summary Ordering & Tie-Break Contract**:
   - Canonical query sort order:
     1. `issuedAt` descending
     2. `_id` ascending
   - This exact ordering governs the 501-record probe, the 500-record evaluated set, returned prescription history, and all summary metric aggregations.
   - When multiple prescriptions share the exact same `issuedAt` timestamp, `_id` tie-breaking guarantees that boundary membership and the 501st sentinel selection are 100% deterministic across repeated requests.
3. **Optional Index Note**:
   - The proposed index `{ userId: 1, issuedAt: -1 }` remains for the proposal stage. Deterministic `_id` tie-breaking is enforced as an explicit query contract. If implementation profiling later demonstrates that a 3-field compound index `{ userId: 1, issuedAt: -1, _id: 1 }` optimizes index-only scans, that index can be evaluated during the authoritative specification performance audit.
4. **Sentinel Record Exclusion**:
   - The 501st document serves solely as an overflow probe sentinel to set `isTruncated = true` and `isExhaustive = false`.
   - **ALL metrics, aggregates, and returned history MUST use `evaluatedRecords` strictly**:
     - Exactly 500 records: `isTruncated = false`, `isExhaustive = true`.
     - 501 records: `isTruncated = true`, `isExhaustive = false`, evaluated first 500 only.
   - The 501st sentinel record is NEVER included in status counts, adherence rates, or milestone metrics.

### 23.2 Truly Read-Only In-Memory Expiry Evaluation
To preserve strict read-only query semantics (zero database mutations on GET):
- The summary endpoint **NEVER** invokes `findOneAndUpdate` or writes `status: 'expired'` to MongoDB.
- For each record returned:
  ```javascript
  const isEffectivelyExpired = 
    (record.status === 'issued' || record.status === 'active') &&
    referenceNow >= record.expiresAt;
    
  const effectiveStatus = isEffectivelyExpired ? 'expired' : record.status;
  ```
- Terminal states (`completed`, `abandoned`, `superseded`, `expired`) retain their recorded status regardless of wall clock time.
- All aggregate metrics and status counts are calculated strictly using `effectiveStatus` as of `referenceNow`.

### 23.3 Metrics Calculation, Status Counts & Denominator Semantics

#### 1. Separation of Evaluated Prescriptions and Status Counts
Do not overload `totalIssued` to mean "currently status=issued". Phase 10 provides explicit, unambiguous metrics:
```javascript
const evaluatedPrescriptionCount = evaluatedRecords.length; // evaluated count (bounded to 500)

const statusCounts = {
  issued: evaluatedRecords.filter(r => effectiveStatus(r) === 'issued').length,
  active: evaluatedRecords.filter(r => effectiveStatus(r) === 'active').length,
  completed: evaluatedRecords.filter(r => effectiveStatus(r) === 'completed').length,
  abandoned: evaluatedRecords.filter(r => effectiveStatus(r) === 'abandoned').length,
  superseded: evaluatedRecords.filter(r => effectiveStatus(r) === 'superseded').length,
  expired: evaluatedRecords.filter(r => effectiveStatus(r) === 'expired').length,
};
```

#### 2. Execution Adherence Rate (Non-Tautological Formula)
Under OPTION A (Full Issuance Tracking), computing adherence as `completed / completed` is tautological (always 1.0). Adherence measures whether resolved prescriptions resulted in full execution compliance versus non-compliance:

```javascript
// Resolved prescriptions have reached an outcome:
const resolvedRecords = evaluatedRecords.filter(r =>
  ['completed', 'abandoned', 'superseded', 'expired'].includes(effectiveStatus(r))
);

const completedRecords = evaluatedRecords.filter(
  r => effectiveStatus(r) === 'completed'
);

const resolvedPrescriptionCount = resolvedRecords.length;

// completed = adhered
// abandoned, superseded, expired = resolved non-adherence
// issued, active = still unresolved (excluded from denominator)
const executionAdherenceRate = resolvedRecords.length > 0
  ? roundTo(completedRecords.length / resolvedRecords.length, 2)
  : null;
```
*Numeric Convention*: Following Phase 8 standards, an empty denominator yields `null` (not a misleading `0.0`).

#### 3. Milestone Success Rate (Null-Exclusion Denominator)
Pedagogical milestone evaluation measures whether executed prescriptions achieved their pedagogical goal.
```javascript
const milestoneEvaluatedRecords = completedRecords.filter(
  r => r.targetMilestoneMet !== null && r.targetMilestoneMet !== undefined
);

const milestonesEvaluated = milestoneEvaluatedRecords.length;
const milestonesMet = milestoneEvaluatedRecords.filter(
  r => r.targetMilestoneMet === true
).length;
const milestonesInsufficientEvidence = completedRecords.filter(
  r => r.targetMilestoneMet === null || r.targetMilestoneMet === undefined
).length;

const milestoneSuccessRate = milestonesEvaluated > 0
  ? roundTo(milestonesMet / milestonesEvaluated, 2)
  : null;
```
*Denominator Rule*:
- Denominator includes ONLY completed prescriptions where `targetMilestoneMet !== null`.
- Abandoned, expired, superseded, and insufficient-evidence (`targetMilestoneMet === null`) prescriptions are **strictly excluded** from the denominator. They are never counted as milestone failures.

---

## 24. Failure Modes & Edge Case Recovery

| Failure Mode | Detection / Guard | Immediate Response | Recovery Path |
|---|---|---|---|
| **Invalid User Identity** | Missing, blank, or non-string `userId` | HTTP 400 `VALIDATION_ERROR` | Client supplies a valid, non-empty `userId` string. |
| **Non-Existent User** | `!(await userExists(userId))` | HTTP 404 `USER_NOT_FOUND` | Client provides an existing user ID. Zero DB mutation. |
| **Foreign Prescription Tampering** | `String(record.userId) !== String(requestingUserId)` | HTTP 403 `FORBIDDEN` | Access to foreign prescription record is rejected immediately. |
| **Foreign Mock Session Tampering** | `String(session.userId) !== String(requestingUserId)` | HTTP 403 `FORBIDDEN` | Attaching foreign mock session is rejected immediately. |
| **Non-Existent Prescription** | `PrescriptionExecutionRecord.findOne` is null | HTTP 404 `PRESCRIPTION_NOT_FOUND` | Client provides a valid prescription ID. |
| **Non-Existent Mock Session** | `MockSession.findById(mockSessionId) === null` | HTTP 404 `MOCK_SESSION_NOT_FOUND` | Client provides valid session ID from `/api/v1/mock/session/start`. |
| **Missing Benchmark Session ID** | `mockSessionId` absent when completing benchmark with `abandon !== true` | HTTP 400 `VALIDATION_ERROR` | Client supplies `mockSessionId` for normal completion. |
| **Concurrent Mock Finalization** | `MockSession.findOne({ userId, finalizationState: 'in_progress' })` | HTTP 409 `FINALIZATION_IN_PROGRESS` | Client retries after finalization completes; protects against reading mutating Attempt truth. |
| **Idempotency Key Reuse Mismatch** | `existing.issuanceRequestFingerprint !== computedFingerprint` | HTTP 409 `IDEMPOTENCY_KEY_REUSE_MISMATCH` | Client must generate a unique UUID for a logically distinct request. Zero DB mutation. |
| **Active Slot Collision** | Duplicate key on `{ nonTerminalSlotKey: 1 }` | HTTP 409 `PRESCRIPTION_ISSUANCE_CONFLICT` | Client retries; supersession transaction retires prior active lease. |
| **Attempting Completion on Issued Record** | Calling `/complete` when `status === 'issued'` | HTTP 409 `PRESCRIPTION_STATE_CONFLICT` | Client must activate prescription via `/activate` before completing. |
| **Premature Completion Attempt** | Attributed Attempt count < prescribedQuestions count | HTTP 409 `PRESCRIPTION_EXECUTION_INCOMPLETE` | Client executes remaining questions with `sessionId = prescriptionId`, then retries completion (or completes with `abandon: true`). |
| **Benchmark Started Before Activation** | `mockSession.startedAt < prescription.activatedAt` | HTTP 409 `PRESCRIPTION_EXECUTION_INCOMPLETE` | Benchmark execution must begin after prescription activation. |
| **Downstream Phase 5 Revision Lag** | Attributed attempt not present in `RevisionProcessingRecord` or Item lag | HTTP 409 `REVISION_PROCESSING_PENDING` | Record remains `active`. Client retries after post-attempt background processing settles. |
| **Prescription Expiration** | `referenceNow >= record.expiresAt` on non-terminal record | HTTP 409 `PRESCRIPTION_STATE_CONFLICT` | Record marked `expired`, slot key cleared. Client requests a fresh prescription via `POST /api/v1/attribution/prescriptions`. |
| **Prescription State Conflict** | Operating on invalid status (e.g. activating terminal record) | HTTP 409 `PRESCRIPTION_STATE_CONFLICT` | Operation rejected; client inspects current prescription status. |
| **Invalid Summary actionType** | `actionType` query param not in canonical six types | HTTP 400 `VALIDATION_ERROR` | Client provides a canonical action type or omits filter. |
| **No Issuable Next Action** | Phase 9 returns `null` or empty agenda activity list | HTTP 409 `NO_ISSUABLE_PRESCRIPTION` | Client prompted to refresh diagnostic state or configure active goal. |
| **Issuance Integrity Failure** | Missing DTO `blockedTarget` on prereq or missing active `DailyObjective` on curriculum | HTTP 500 `ATTRIBUTION_ISSUANCE_FAILED` | Zero prescription write. Upstream data/DTO integrity failure isolated. |
| **Insufficient Post Evidence** | Phase 8 `rushingRiskScore === null` post-test | Record completed; `targetMilestoneMet = null` | Denominator safely excludes prescription from failure statistics; client advised on data sufficiency. |

---

## 25. Implementation File Plan & Future Test Strategy

### 25.1 Implementation File & Directory Architecture
During the authorized Phase 10 implementation, Phase 10 introduces exactly ten new Phase 10 production files and one minimal additive modification to the existing `src/app.js` route registration:

```text
src/
├── config/
│   └── attributionConfig.js                     # Phase 10 configuration constants
│
├── models/
│   └── prescriptionExecutionRecordModel.js      # Canonical Model 14 (prescriptionexecutionrecords)
│
├── services/
│   └── attribution/
│       ├── attributionIssuanceService.js        # Orchestration & Phase 9 extraction
│       ├── attributionActivationService.js      # Baseline snapshots & slot enforcement
│       ├── attributionCompletionService.js      # Outcome evaluation & Attempt validation
│       └── attributionSummaryService.js         # Bounded query & read-only aggregation
│
├── utils/
│   └── attributionFingerprint.js                # Deterministic SHA-256 request hasher
│
├── middlewares/
│   └── attributionGuard.js                      # Request clock, payload validation, finalization barrier
│
├── controllers/
│   └── attributionController.js                 # 4 HTTP route handlers
│
└── routes/
    └── attributionRoutes.js                     # Express router mount at /api/v1/attribution
```

#### Existing Production File Modification: `src/app.js`
The **only** permitted modification to an existing production file during Phase 10 is:
```text
src/app.js
```
**Permitted modification**:
Minimal additive Phase 10 route registration only:
```javascript
// In src/app.js:
const attributionRoutes = require('./routes/attributionRoutes');

// API v1 — Phase 10: Prescription Adherence & Learning Outcome Attribution Engine
app.use('/api/v1/attribution', attributionRoutes);
```
No other existing production file may be modified. All existing Phase 1–9 route handlers, controllers, services, models, schemas, indexes, and middleware behaviors remain 100% byte-for-byte unchanged.

#### Module Ownership & Boundaries

1. **`src/config/attributionConfig.js` Ownership**:
   Encapsulates Phase 10-owned operational constants:
   ```javascript
   const attributionConfig = Object.freeze({
     ALGORITHM_VERSION: 'v1',

     PRESCRIPTION_TTL_HOURS: 24,

     SUMMARY_DEFAULT_WINDOW_DAYS: 30,
     SUMMARY_MAX_WINDOW_DAYS: 90,

     SUMMARY_EVALUATED_LIMIT: 500,
     SUMMARY_PROBE_LIMIT: 501,
   });

   module.exports = attributionConfig;
   ```
   Does NOT duplicate upstream-domain constants (e.g. prerequisite mastery threshold `0.70`, planning target mastery `0.85`, rushing-risk threshold `0.60`, or Phase 9 algorithm version `'v1'`). Those remain strictly owned by their respective upstream modules.

2. **`src/middlewares/attributionGuard.js` Ownership**:
   Responsibility boundary matches the authoritative specification:
   - Validates request-level Phase 10 identity/input rules.
   - Captures and propagates the single unified request `referenceNow`.
   - Evaluates mock finalization barrier (`MockSession.finalizationState === 'in_progress'`) at mandatory application points.
   - Enforces explicit `String userId` semantics.
   - Introduces zero authentication / RBAC mechanisms.
   - Performs zero Phase 1–9 writes.

### 25.2 Authoritative 6-Suite Future Test Strategy
Implementation verification will mandate exactly **6 dedicated test suites** under `tests/attribution/`:

1. **`tests/attribution/attributionIssuance.test.js`**:
   - Extraction of all 6 Phase 9 canonical action types from public DTOs.
   - Rejection of daily agenda checkpoints (`COGNITIVE_REST`) with `409 NO_ISSUABLE_PRESCRIPTION`.
   - Identifier-based ownership validation (`userId` required string, `404 USER_NOT_FOUND`).
   - Idempotency replay (200 OK on same fingerprint) vs rejection (409 on mismatched fingerprint).
   - Canonical JSON fingerprint serialization:
     - Same normalized request payload → identical fingerprint.
     - Same request parameters with later `referenceNow` → identical fingerprint.
     - Different `actionId`, `goalId`, or `originSurface` → different fingerprint.
     - Delimiter-containing identifiers (`:`, `/`, `-`, `_`) verified to prove JSON serialization eliminates delimiter collision ambiguities.
   - Same-key replay after expiry:
     - Identical request replayed when `referenceNow >= record.expiresAt` → returns HTTP 200 with same `prescriptionId` (`rx_1`), zero writes, does NOT create `rx_2`, does NOT supersede `rx_1`, does NOT recompute Phase 8/9; response DTO exposes `effectiveStatus: 'expired'` and `isExpired: true`.
   - Same-key concurrent issuance idempotency: two simultaneous requests with same userId, same Idempotency-Key, same fingerprint -> one 201, one 200, same prescriptionId, exactly one DB record created (no artificial supersession, no generic conflict).
   - Unique index collision distinction: `{ userId, issuanceIdempotencyKey }` collision handled via replay vs `{ nonTerminalSlotKey }` collision handled via `409 PRESCRIPTION_ISSUANCE_CONFLICT`.
   - Predecessor expiry vs supersession classification in issuance transaction:
     - Existing record in `status = 'issued'` with `expiresAt < referenceNow` + new issuance arrives → old record transitions to `expired` (`supersededAt = null`, `supersededByPrescriptionId = null`, `nonTerminalSlotKey = null`), new record inserted as `issued` (`nonTerminalSlotKey = userId`).
     - Existing record in `status = 'active'` with `expiresAt === referenceNow` + new issuance arrives → old record transitions to `expired`, NOT `superseded`.
     - Existing record in `status = 'issued'` or `'active'` with `referenceNow < expiresAt` + new issuance arrives → old record transitions to `superseded` (`supersededAt = referenceNow`, `supersededByPrescriptionId = newPrescriptionId`), new record inserted as `issued`.
   - Transaction retry policy: single bounded retry on transient transaction errors before rollback with 409 conflict; zero unsafe sequential fallback.
   - Version snapshots: `phase10AlgorithmVersion` frozen from `attributionConfig.ALGORITHM_VERSION` ('v1') and `orchestrationAlgorithmVersion` frozen from `orchestrationConfig.ORCHESTRATION_ALGORITHM_VERSION` ('v1') without schema defaults.
   - Mock finalization barrier blocking issuance with `409 FINALIZATION_IN_PROGRESS`.
   - Public DTO `blockedTarget` consumption for `BLOCKING_PREREQUISITE` (and integrity error `500 ATTRIBUTION_ISSUANCE_FAILED` on missing `blockedTarget`).
   - Direct read-only Phase 8 call for overall pacing risk policy evidence at issuance.
   - Deterministic `StudyPlan` resolution and Phase 8 readiness call for `EXAM_BENCHMARK` snapshot.
   - Deterministic `DailyObjective` logical-day resolution for `CURRICULUM_ADVANCEMENT` quota snapshot.
   - Initial timestamp invariants: `issuedAt === referenceNow`, `lastActivityAt === referenceNow`.

2. **`tests/attribution/attributionActivation.test.js`**:
   - CAS state transition from `issued` to `active`, updating `activatedAt` and `lastActivityAt`.
   - Expiry boundary tests: `referenceNow < expiresAt` valid; `referenceNow === expiresAt` expired; `referenceNow > expiresAt` expired.
   - Activation expiry order: active + unexpired -> 200 idempotent replay; active + expired -> materializes expired and throws `409 PRESCRIPTION_STATE_CONFLICT` (never returns expired active lease as valid).
   - Identifier-based ownership validation without authentication headers (`403 FORBIDDEN` on foreign prescription).
   - Capturing topic-level baseline for `PACING_CALIBRATION` via `speedAccuracyMatrixService.getSpeedAccuracyMatrix(userId, 30, prescription.topic, referenceNow)`.
   - Capturing pre-execution readiness baseline for `EXAM_BENCHMARK` without requiring `mockSessionId` at activation.
   - Finalization barrier blocking activation when mock finalization is running.

3. **`tests/attribution/attributionCompletion.test.js`**:
   - CAS atomic state transition on completion, updating `completedAt` and `lastActivityAt`.
   - Expiry boundary tests on completion: `referenceNow < expiresAt` valid; `referenceNow >= expiresAt` expired.
   - Terminal replay after expiry: completed prescription with `referenceNow >= expiresAt` returns 200 with same frozen completed record (zero writes); abandoned prescription with `referenceNow >= expiresAt` returns 200 with same frozen abandoned record (zero writes) when `abandon: true`. Terminal state wins over expiry.
   - Completion replay order: completed/abandoned terminal status checked BEFORE expiry evaluation.
   - Issued prescriptions cannot complete directly: `status = issued` + `/complete` returns `409 PRESCRIPTION_STATE_CONFLICT` even if attempts exist.
   - Accurate counting of attributed Attempts (`Attempt.sessionId === prescriptionId`).
   - Rejection with `409 PRESCRIPTION_EXECUTION_INCOMPLETE` if attempt count < prescribedQuestions.
   - Race prevention: `409 REVISION_PROCESSING_PENDING` when Phase 5 `RevisionProcessingRecord` is unconfirmed or `RevisionItem.lastProcessedAttemptId` lags.
   - Explicit abandonment via `POST .../complete` with `body.abandon === true`: sets `status = 'abandoned'`, `abandonedAt`, `lastActivityAt`, `nonTerminalSlotKey = null`, `executionRequirementMet = false`, `targetMilestoneMet = null`, with safe retry replay returning HTTP `200 OK`.
   - Benchmark abandonment: `EXAM_BENCHMARK` + `abandon: true` without `mockSessionId` succeeds as valid abandonment; `EXAM_BENCHMARK` + `abandon: false` without `mockSessionId` returns `400 VALIDATION_ERROR`.
   - Benchmark start attribution: mock started before activation (`mockSession.startedAt < prescription.activatedAt`) cannot satisfy benchmark; mock created before activation but started after activation (`mockSession.createdAt < prescription.activatedAt` BUT `mockSession.startedAt >= prescription.activatedAt`) is VALID; mock started at or after activation is VALID.
   - Root `mockSessionId` persistence: on successful EXAM_BENCHMARK completion, `PrescriptionExecutionRecord.mockSessionId === mockSession._id`; immutable on idempotent replay.
   - Milestone evaluation across all 6 canonical action types:
     - `PREREQUISITE_REMEDIATION`: prerequisite mastery threshold ($\ge 0.70$) + blocked target unlock evidence.
     - `RETENTION_RESCUE`: Phase 5 processed final attributed revision attempt resulting in stage advancement, final completion, stage-4 extension, or reset.
     - `CURRICULUM_ADVANCEMENT`: observable pattern mastery progression (`masteryDelta > 0` OR `finalMastery >= 0.85`).
     - `PACING_CALIBRATION`: topic rushing risk post-state below 0.60 or `null` insufficient evidence.
     - `EXAM_BENCHMARK`: valid standard terminal finalized MockSession, ownership validation, started-after-activation timing, frozen plan-scope subset alignment.
     - `DIAGNOSTIC_ASSESSMENT`: execution completion + subtype-specific baseline evidence rules.

4. **`tests/attribution/attributionConcurrency.test.js`**:
   - Concurrent issuance requests racing for `nonTerminalSlotKey` (one succeeds, one receives 409 conflict or supersedes cleanly).
   - Concurrent same-key issuance requests (one receives 201, one receives 200 with identical record).
   - Zero sequential fallback on transaction abort.
   - Parallel activation requests executing atomically via CAS.
   - Parallel completion requests executing atomically via CAS (second request receives 200 OK idempotent result or 409 conflict; never overwrites frozen outcome, `mockSessionId`, or timestamp).
   - Expiry materialization CAS: atomic transition to expired prevents duplicate expiry writes.

5. **`tests/attribution/attributionSummary.test.js`**:
   - Limit 501 / Cap 500 query boundary verification (`isTruncated`, `isExhaustive`).
   - 501 sentinel exclusion: when 501 records match, `probeRecords.length === 501`, `evaluatedRecords.length === 500`, `evaluatedPrescriptionCount === 500`, `isTruncated === true`, `isExhaustive === false`; all metrics (statusCounts, adherence rate, milestone rate) sum over only 500 records; sentinel 501st record is strictly excluded from all aggregates.
   - Deterministic summary ordering & tie-breaking:
     - When > 500 records exist with identical `issuedAt` timestamps, sorting by `{ issuedAt: -1, _id: 1 }` guarantees that repeated requests select the exact same 500 evaluated records and the exact same 501st sentinel.
     - Zero nondeterministic boundary membership under clock collisions.
   - Truly read-only behavior: zero database writes executed during `GET /api/v1/attribution/users/:userId/summary`.
   - In-memory effective status calculation for expired records as of `referenceNow` (`referenceNow >= expiresAt` for non-terminal records; terminal records never reinterpreted as expired).
   - Correct execution adherence rate formula: `completed / resolvedRecords` (where resolved = completed, abandoned, superseded, expired); returns `null` when 0 resolved.
   - Separation of evaluated prescription count (`evaluatedPrescriptionCount`) from current status counts (`statusCounts: { issued, active, completed, abandoned, superseded, expired }`).
   - Milestone success rate denominator: strictly completed records with non-null milestone (`targetMilestoneMet !== null`); excludes abandoned, expired, superseded, and insufficient-evidence null milestones.
   - Query filter: `actionType` omitted -> all canonical action types queried; valid canonical `actionType` -> query filtered by `actionType`; invalid `actionType` -> `400 VALIDATION_ERROR`.

6. **`tests/attribution/attributionFinalizationBarrier.test.js`**:
   - Comprehensive barrier verification across issuance, pacing activation, pacing completion, and exam activation while `MockSession.finalizationState === 'in_progress'`.

---

## 26. Source Audit & Service API Confirmations

A rigorous audit of the live repository codebase confirms the following concrete contracts:

1. **`AppError` Constructor Contract**:
   - Live Source: `src/utils/AppError.js`
   - Verified Constructor: `constructor(statusCode, code, message)`
   - Verified Order: `new AppError(statusCode, code, message)` everywhere.
2. **Phase 8 Speed-Accuracy Matrix API**:
   - Live Source: `src/services/analytics/speedAccuracyMatrixService.js`
   - Verified Export: `speedAccuracyMatrixService.getSpeedAccuracyMatrix(userId, windowDays, topic, referenceNow)`
   - Verified Return Shape: `{ speedAccuracyMatrix: { rushingRiskScore, medianTimeCorrectSeconds, medianTimeIncorrectSeconds, quadrantCounts } }`
   - Non-Existent API: `calculateSpeedAccuracyMatrix` does **not** exist in the repository and has been eradicated from documentation.
3. **Phase 8 Readiness API**:
   - Live Source: `src/services/analytics/readinessService.js`
   - Verified Export: `readinessService.getGoalReadiness(userId, goalId, referenceNow)`
4. **Phase 8 Stamina & Retention Analytics APIs**:
   - Live Source: `src/services/analytics/staminaAnalyticsService.js`
   - Live Source: `src/services/analytics/retentionAnalyticsService.js`
5. **Phase 9 Orchestration & Guard Paths**:
   - Live Source: `src/middlewares/orchestrationGuard.js` (plural `middlewares`).
   - Live Source: `src/services/orchestration/nextActionArbiter.js` (`getNextAction`, `formatActionDTO`).
   - Live Source: `src/services/orchestration/dailyAgendaAssembler.js` (`getDailyAgenda`).
   - Live Source: `src/services/orchestration/orchestrationUtils.js` (`getLogicalDayBoundaries`, `buildActionId`).
   - Live Source: `src/config/orchestrationConfig.js` (`ORCHESTRATION_ALGORITHM_VERSION = 'v1'`).
   - Public DTO verification: Phase 9 public action DTOs expose top-level metadata (`actionId`, `actionType`, `actionSubtype`, `policyPriorityClass`, `urgencyScore`, `priorityTier`, `topic`, `pattern`, `prescribedQuestions`, `estimatedMinutes`), `blockedTarget` (for `BLOCKING_PREREQUISITE`), and concrete `executionIntent`. Missing entity IDs (`revisionItemId`, `planId`, `goalId`) are safely extracted from `executionIntent` or resolved via authoritative database lookups without modifying Phase 9.
6. **Phase 3 Attempt & DailyObjective Progression**:
   - Live Source: `src/services/attemptService.js`
   - Live Exported Function: `attemptService.createAttempt({ userId, questionId, selectedAnswer, timeTaken, source, sessionId })`
   - HTTP Endpoint: `POST /api/v1/attempts`
   - Source Audit Discovery: `attemptService.createAttempt` updates `StudentProgress` but **never** updates `DailyObjective.patterns[].completedQuestions` for practice attempts.
   - Contract Reconciliation: Phase 10 curriculum advancement milestone is grounded in observable `StudentProgress` pattern mastery progression (`masteryDelta > 0 || finalMastery >= 0.85`), preventing any dependency on modifying frozen Phase 3 code.
7. **Phase 5 Revision Processing Truth**:
   - Live Sources: `src/models/revisionProcessingRecordModel.js` and `src/models/revisionItemModel.js`
   - Verification: Downstream spaced repetition scheduling records are tracked in `RevisionProcessingRecord` keyed by `attemptId`. Phase 10 audits the latest attributed attempt and enforces `409 REVISION_PROCESSING_PENDING` if processing evidence has not settled or if `RevisionItem.lastProcessedAttemptId` does not match the final attributed attempt.

---

## 27. Architectural Invariants & Gates

The Phase 10 proposal strictly adheres to the following platform boundaries:
- **Zero Phase 1–9 Edits**: All Phase 1–9 production code, models, schemas, and routes remain frozen and untouched.
- **Model / Collection Count**:
  - Baseline (Phases 1–9): 13 models, 13 collections.
  - Proposal Phase: Exactly 13 models, 13 collections (zero added).
  - Implementation Phase (Projected): Exactly 14 models, 14 collections.
- **Test Baseline**: All 66 test suites and 876 tests remain 100% green with zero failures.
- **Content Integrity**: All 12,000 canonical questions and 278 patterns remain unmodified.

---

## 28. Final Recommendation & Proposal Gate

The architecture for **Phase 10: Prescription Adherence & Learning Outcome Attribution Engine (PAOA)** has achieved complete lifecycle, idempotency, snapshot, and attribution closeout with the live repository codebase.

All constructor signatures, service exports, lifecycle invariants, concurrency controls, and failure paths have been rigorously audited and proven sound against the existing system.

```text
================================================================================
PHASE 10 ARCHITECTURE PROPOSAL — VERIFIED / FROZEN
PHASE 10 AUTHORITATIVE SPECIFICATION — VERIFIED
READY FOR PHASE 10 IMPLEMENTATION
================================================================================
```
