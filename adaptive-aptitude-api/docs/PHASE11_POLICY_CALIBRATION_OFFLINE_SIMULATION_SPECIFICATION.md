# PHASE 11 SPECIFICATION: POLICY CALIBRATION & OFFLINE SIMULATION ENGINE (PPCO)

```text
Document Type:       Authoritative Implementation Specification (Frozen Contract)
Status:              VERIFIED ARCHITECTURE IMPLEMENTATION CONTRACT — RECONCILED / FROZEN
Target Phase:        Phase 11
Repository:          adaptive-aptitude-api
Frozen Baseline:     Phases 1–10 Verified (72 Suites, 936 Tests, Exactly 14 Models, Exactly 14 Collections)
Persistence Boundary: 0 New Mongoose Models, 0 New MongoDB Collections
Execution Surface:   Offline CLI & Internal Service (0 HTTP Routes, 0 Controllers, src/app.js Unmodified)
Runtime File Boundary: Exactly 10 New Phase 11 Production/Runtime Files
Test Suite Boundary:  Exactly 6 New Phase 11 Test Suites (Target: 78 Total Suites)
```

---

## 1. Status / Metadata

| Metadata Field | Canonical Specification Value |
| :--- | :--- |
| **Document Title** | Phase 11 Implementation Specification: Policy Calibration & Offline Simulation Engine (PPCO) |
| **Document Version** | `1.2.0-RECONCILED` |
| **Status** | `FROZEN / READY FOR INDEPENDENT REVIEW` |
| **Repository** | `adaptive-aptitude-api` |
| **Engine Identifier** | `PPCO` (Policy Calibration & Offline Simulation Engine) |
| **Engine Version** | `v1` (`SIMULATION_ENGINE_VERSION: 'v1'`) |
| **Preceding Gate** | Phase 10 — PAOA (`VERIFIED / CLOSED`) |
| **Upstream Baseline State** | 14 Mongoose Models, 14 MongoDB Collections, 72/72 Jest Suites Passing, 936/936 Tests Passing |
| **Graph Hierarchy** | 12,000 Questions, 24 Topics, 278 Patterns, 410 Prerequisite Edges, 0 Cycles, 12,000/12,000 SHA-256 Matches |
| **Database Migrations** | `0` (Zero Schema Alteration, Zero New Collections) |
| **HTTP Surface** | `0` Routes (CLI + Internal Service Only; `src/app.js` Unmodified) |
| **Primary Production Files** | Exactly 10 New Files (`src/config/*`, `src/services/simulation/*`, `src/utils/*`, `scripts/*`) |
| **Primary Test Suites** | Exactly 6 Dedicated Test Suites under `tests/simulation/` |

---

## 2. Purpose

Phase 11 establishes an offline, deterministic, and statistically rigorous intelligence harness that evaluates historical Phase 10 prescription adherence records and simulates candidate orchestration policies across two strictly separated analytical modes:

1. **Mode A — Observed-Action Sensitivity Analysis (`OBSERVED_ACTION_SENSITIVITY`)**:
   - Re-scores exclusively the pedagogical action historically selected by the production Phase 9 engine.
   - Evaluates support on a strict per-parameter and score-precision basis via `support(record, candidatePolicyDelta)`.
   - Distinguishes raw IEEE-754 reconstructibility (`RAW_EXACT`, `scoreSource: RECONSTRUCTED_RAW`) from rounded DTO-anchored approximations (`PARTIAL`, `scoreSource: PERSISTED_ROUNDED_DTO`) and unpersisted inputs (`UNSUPPORTED`).
   - Propagates shifted half-open rounding intervals to audit priority tier boundaries.
   - Strictly measures urgency score and priority tier shifts for the observed action, **never claiming counterfactual alternative winners or candidate disagreement**.

2. **Mode B — Synthetic Archetype Policy Comparison (`ARCHETYPE_POLICY_COMPARISON`)**:
   - Compares candidate policies against baseline Phase 9 configuration across **exactly six canonical deterministic synthetic student archetype vectors**.
   - Contains complete competing candidate sets across canonical action types.
   - Executes pure IEEE-754 scoring logic and the authoritative 7-tier deterministic ranking comparator to calculate simulated action disagreement rates, rank deltas, and priority tier migrations.
   - Requires zero database reads and zero historical records to execute.

3. **Adherence-Stratified Descriptive Outcome Intelligence**:
   - Groups empirical Phase 10 completion and milestone rates across historical action types, priority tiers, and algorithm versions.
   - Strictly enforces non-causal attribution language and assigns **zero observational learning outcomes to un-deployed candidate policies**.

4. **Zero-Persistence & Zero-HTTP Execution**:
   - Operates strictly as an offline CLI (`scripts/simulatePolicy.js`) and internal programmatic service (`src/services/simulation/policySimulationService.js`).
   - Introduces **0 new Mongoose models, 0 new MongoDB collections, and 0 HTTP routes**.
   - Emits deterministic, SHA-256 fingerprinted local JSON report artifacts.

---

## 3. Frozen Upstream Baseline

Entering Phase 11, the platform encompasses ten complete, verified, and immutable phases:

```text
┌────────────────────────────────────────────────────────────────────────┐
│ Phase 2: Question Intelligence & Graph Hierarchy                       │
│ 12,000 Questions | 24 Topics | 278 Patterns | 410 Prerequisite Edges  │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
┌──────────────────────────────────▼─────────────────────────────────────┐
│ Phase 3: Student Learning State & Persistence                          │
│ Question, User, Goal, StudyPlan, DailyObjective, Attempt               │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
┌──────────────────────────────────▼─────────────────────────────────────┐
│ Phase 4: Adaptive Decision Engine                                      │
│ StudentProgress, Deterministic 3-Factor Mastery, Confidence Factor     │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
┌──────────────────────────────────▼─────────────────────────────────────┐
│ Phase 5: Planning & Spaced Revision Engine                             │
│ RevisionItem, RevisionProcessingRecord, Daily Planning Quotas          │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
┌──────────────────────────────────▼─────────────────────────────────────┐
│ Phase 6: Mock Exam Simulation Engine                                   │
│ MockBlueprint, MockSession, MockResponse, Finalization Record          │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
┌──────────────────────────────────▼─────────────────────────────────────┐
│ Phase 7: Intelligent Learning Layer (LLM Advisory)                     │
│ Strictly Read-Only Advisory, Zero Retention, 6 Pedagogical Tasks       │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
┌──────────────────────────────────▼─────────────────────────────────────┐
│ Phase 8: Cognitive & Longitudinal Analytics Engine                     │
│ Readiness, Speed-Accuracy Matrix, Stamina, Retention, Zero Writes     │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
┌──────────────────────────────────▼─────────────────────────────────────┐
│ Phase 9: Prescriptive Learning Orchestration & Next-Best-Action Engine │
│ 7-Tier Comparator, 6 Canonical Action Types, Daily Agenda Assembly     │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
┌──────────────────────────────────▼─────────────────────────────────────┐
│ Phase 10: Prescription Adherence & Outcome Attribution Engine (PAOA)   │
│ PrescriptionExecutionRecord, Idempotent Lifecycle, Outcome Snapshots   │
└────────────────────────────────────────────────────────────────────────┘
```

### 3.1 Verification Invariants
The baseline platform satisfies the following immutable invariants:
- **Jest Test Suite**: Exactly 72 suites passed, 936 tests passed, 0 failures.
- **Graph Topology**: 24 canonical topics, 278 canonical patterns, 410 prerequisite edges, 60 foundational patterns, 0 cycles.
- **Content Integrity**: 12,000 questions, 12,000/12,000 SHA-256 matches against source documents.
- **Persistence Footprint**: Exactly 14 Mongoose models mapped to exactly 14 MongoDB collections:
  1. `Question` (`questions`)
  2. `User` (`users`)
  3. `Goal` (`goals`)
  4. `StudyPlan` (`studyplans`)
  5. `DailyObjective` (`dailyobjectives`)
  6. `Attempt` (`attempts`)
  7. `StudentProgress` (`studentprogresses`)
  8. `RevisionItem` (`revisionitems`)
  9. `RevisionProcessingRecord` (`revisionprocessingrecords`)
  10. `MockBlueprint` (`mockblueprints`)
  11. `MockSession` (`mocksessions`)
  12. `MockResponse` (`mockresponses`)
  13. `MockAttemptFinalizationRecord` (`mockattemptfinalizationrecords`)
  14. `PrescriptionExecutionRecord` (`prescriptionexecutionrecords`)

### 3.2 Non-Existent Subsystems Confirmed
Live source inspection conclusively confirms that:
- `learningVelocityService.js` **does not exist** anywhere in the repository.
- Phase 8 analytics consists strictly of `readinessService.js`, `speedAccuracyMatrixService.js`, `staminaAnalyticsService.js`, `retentionAnalyticsService.js`, `dashboardAggregateService.js`, and `topicDiagnosticsService.js`.
- Phase 4 mastery is deterministic and non-probabilistic: no Bayesian Knowledge Tracing, no EMA, no latent-state probability, and no time-dampening.

---

## 4. Ownership Boundary

### 4.1 What Phase 11 PPCO OWNS
1. Candidate policy schema validation and semantic difference derivation (`diffPolicy`).
2. Action-relevant parameter filtering (`dimensionAffects`).
3. Mode A observed-action re-scoring over historical `PrescriptionExecutionRecord` documents.
4. Mode A whole-policy support aggregation (`UNSUPPORTED > PARTIAL > EXACT`), rounding-interval propagation, and diagnostic reporting.
5. Mode B synthetic multi-candidate simulation across six canonical student archetype vectors.
6. Pure IEEE-754 candidate scoring and 7-tier ranking comparator execution.
7. Descriptive, non-causal aggregation of historical Phase 10 adherence and outcome records.
8. Bounded multi-user dataset loading with `+1` sentinel truncation detection.
9. Deterministic SHA-256 fingerprinting of policies, datasets, and structured simulation metadata.
10. Deterministic compact canonical JSON report serialization to local filesystem.
11. Offline administrative CLI execution (`scripts/simulatePolicy.js`).

### 4.2 What Phase 11 PPCO DOES NOT OWN (Strictly Prohibited)
1. **NO Live Orchestration Mutation**: PPCO must **never** modify `src/config/orchestrationConfig.js` or alter runtime Phase 9 next-action arbitration.
2. **NO Online Reinforcement Learning**: PPCO must **never** update weights in real-time or execute contextual bandits.
3. **NO Database Writes**: PPCO must execute **strictly zero writes** to MongoDB collections 1 through 14.
4. **NO Prerequisite Eligibility Alteration**: PPCO must **never** alter the prerequisite mastery gating threshold ($0.70$) or candidate eligibility rules.
5. **NO Question Sizing / Budget Alteration**: PPCO must **never** modify daily agenda question quotas or block budgets.
6. **NO HTTP Surface Exposure**: PPCO must **never** expose Express endpoints or register route handlers.
7. **NO Causal Claims**: PPCO must **never** claim causal lift or counterfactual student learning outcomes for un-deployed candidate policies.
8. **NO LLM Reliance**: PPCO must **never** invoke Phase 7 LLMs.

---

## 5. Persistence / HTTP Boundary

Phase 11 V1 authoritatively adopts **Option A (Zero New Persistence Collections, Zero HTTP Routes)**:

```text
┌─────────────────────────────────────────────────────────────┐
│ PERSISTENCE CONTRACT                                        │
│   New Mongoose Models:       0                              │
│   New MongoDB Collections:   0                              │
│   Database Migrations:       0                              │
│   Total Platform Models:     14                             │
│   Total Platform Collections:14                             │
├─────────────────────────────────────────────────────────────┤
│ HTTP / SURFACE CONTRACT                                     │
│   New HTTP Routes:           0                              │
│   New Controllers:           0                              │
│   Express Route Mounts:      0                              │
│   Modifications to app.js:   0                              │
│   Authorized Execution:      Offline CLI / Internal Service │
└─────────────────────────────────────────────────────────────┘
```

- **Output Artifacts**: Local versioned JSON report files written to `reports/simulations/`. Filesystem reports are analytical outputs, not database entities.
- **Route Immunity**: `src/app.js` is frozen. No `/api/v1/simulation/*` endpoints are authorized.

---

## 6. Runtime File Boundary

The Phase 11 production and runtime implementation is strictly bounded to **exactly 10 new files**:

| # | File Path | Type | Primary Export / Responsibility | Allowed Production Dependencies | Forbidden Dependencies | Writes to DB? |
| :-: | :--- | :--- | :--- | :--- | :--- | :---: |
| 1 | `src/config/simulationConfig.js` | Config | `simulationConfig`, `SIMULATION_BOUNDS`, `BASELINE_POLICY`, `SIMULATION_ENGINE_VERSION` | None (pure config) | Any service/model | NO |
| 2 | `src/config/simulationArchetypes.js` | Config | `SIMULATION_ARCHETYPES` (Exactly 6 canonical vectors) | None (pure static config) | `patternRegistryService`, any Phase 1–8 service/model | NO |
| 3 | `src/services/simulation/policyValidationService.js` | Service | `validateCandidatePolicy`, `diffPolicy`, `dimensionAffects` | `src/config/simulationConfig.js` | Upstream write services | NO |
| 4 | `src/services/simulation/observedActionSensitivityService.js` | Service | `evaluateObservedActionSensitivity`, `evaluateRecordSensitivity` (Mode A) | `simulationConfig.js`, `policyValidationService.js`, `orchestrationUtils.js` | Live Phase 9 arbiter | NO |
| 5 | `src/services/simulation/syntheticPolicyComparisonService.js` | Service | `compareSyntheticArchetypes`, `simulateArchetype`, `calculatePureUrgencyScore` (Mode B) | `simulationConfig.js`, `simulationArchetypes.js` | Live Phase 9 arbiter | NO |
| 6 | `src/services/simulation/adherenceOutcomeAggregationService.js` | Service | `aggregateAdherenceOutcomes`, `resolveEffectiveStatus` (Descriptive Phase 10 aggregation) | `simulationConfig.js` | Any write service | NO |
| 7 | `src/services/simulation/cohortSimulationService.js` | Service | `loadHistoricalCohortRecords` (Bounded Phase 10 querying) | `PrescriptionExecutionRecord`, `simulationConfig.js` | Collections 1–13 | NO |
| 8 | `src/services/simulation/policySimulationService.js` | Service | `runPolicySimulation` (Top-level orchestrator) | All Phase 11 simulation services & `simulationFingerprint.js` | `node:fs`, Express / app.js | NO |
| 9 | `src/utils/simulationFingerprint.js` | Utility | `generatePolicyFingerprint`, `generateDatasetFingerprint`, `generateSimulationFingerprint`, `canonicalizeJSON` | `node:crypto` only | `node:fs`, `node:path`, any DB model | NO |
| 10 | `scripts/simulatePolicy.js` | CLI | Executable Node.js script for offline simulation & artifact writing | `policySimulationService.js`, `simulationConfig.js`, `simulationFingerprint.js`, `node:fs`, `node:path` | Express / HTTP | NO |

### Boundary Sufficiency Declaration
An exhaustive architectural audit verifies that these **10 files are fully sufficient** to implement all PPCO requirements. No additional source modules, helper utilities, or architectural expansions are authorized.

---

## 7. Engine Configuration

File: `src/config/simulationConfig.js`

```javascript
'use strict';

const SIMULATION_ENGINE_VERSION = 'v1';

const SIMULATION_BOUNDS = Object.freeze({
  MAX_USERS_PER_RUN: 50,
  MAX_SAMPLE_RECORDS: 1000,
  MAX_WINDOW_DAYS: 90,
  DEFAULT_WINDOW_DAYS: 30,
  MAX_CANDIDATE_POLICIES: 5,
  MAX_EXECUTION_TIME_MS: 15000,
  MIN_HISTORICAL_RECORDS: 5,
});

const SIMULATION_MODES = Object.freeze({
  MODE_A: 'OBSERVED_ACTION_SENSITIVITY',
  MODE_B: 'ARCHETYPE_POLICY_COMPARISON',
  HISTORICAL_AGGREGATION: 'HISTORICAL_AGGREGATION',
  COMBINED: 'COMBINED',
});

const SUPPORT_LEVELS = Object.freeze({
  EXACT: 'EXACT',
  PARTIAL: 'PARTIAL',
  UNSUPPORTED: 'UNSUPPORTED',
  NOT_APPLICABLE: 'NOT_APPLICABLE',
});

const SCORE_SOURCES = Object.freeze({
  RECONSTRUCTED_RAW: 'RECONSTRUCTED_RAW',
  PERSISTED_ROUNDED_DTO: 'PERSISTED_ROUNDED_DTO',
  SYNTHETIC_RAW: 'SYNTHETIC_RAW',
  NOT_AVAILABLE: 'NOT_AVAILABLE',
});

const SCORE_PRECISIONS = Object.freeze({
  RAW_EXACT: 'RAW_EXACT',
  DTO_ROUNDED_PARTIAL: 'DTO_ROUNDED_PARTIAL',
  UNAVAILABLE: 'UNAVAILABLE',
});
```

### Participation of Engine Version
`SIMULATION_ENGINE_VERSION` (`'v1'`):
1. Embeds in top-level JSON report artifacts under `report.engineVersion`.
2. Participates in `simulationFingerprint` structured hashing.
3. Enforces compatibility: reject candidate policies requiring future engine capabilities.
4. Verified in automated test assertions across all Phase 11 suites.

---

## 8. Baseline Policy

The canonical immutable baseline policy object represents the production Phase 9 V1 configuration:

```javascript
const BASELINE_POLICY = Object.freeze({
  simulationOnly: false,

  baseWeights: Object.freeze({
    PREREQUISITE_REMEDIATION: 50.0,
    OVERDUE_REVISION: 45.0,
    DUE_TODAY_REVISION: 35.0,
    CURRICULUM_ADVANCEMENT: 30.0,
    EXAM_BENCHMARK: 25.0,
    PACING_CALIBRATION: 20.0,
  }),

  maxMasteryDeficitWeight: 25.0,
  maxGoalImpactWeight: 15.0,
  maxTemporalWeight: 10.0,

  priorityThresholds: Object.freeze({
    critical: 80.0,
    urgent: 65.0,
    high: 50.0,
    normal: 35.0,
  }),
});

const OVERDUE_TEMPORAL_POINTS_PER_DAY = 2.0; // Immutable inherited Phase 9 slope
```

---

## 9. Candidate Policy Schema

Every candidate policy must be an immutable, fully specified object conforming to this exact shape:

```javascript
{
  simulationOnly: true,

  baseWeights: {
    PREREQUISITE_REMEDIATION: number,
    OVERDUE_REVISION: number,
    DUE_TODAY_REVISION: number,
    CURRICULUM_ADVANCEMENT: number,
    EXAM_BENCHMARK: number,
    PACING_CALIBRATION: number
  },

  maxMasteryDeficitWeight: number,
  maxGoalImpactWeight: number,
  maxTemporalWeight: number,

  priorityThresholds: {
    critical: number,
    urgent: number,
    high: number,
    normal: number
  }
}
```

---

## 10. Validation Rules & Reason Precedence

File: `src/services/simulation/policyValidationService.js`

Candidate policy validation enforces this **strict deterministic reason precedence**:

```text
1. Confirm Plain Object
   - If not a non-null plain object -> throw INVALID_POLICY_DEFINITION (INVALID_OBJECT_SHAPE)

2. Detect Explicitly Prohibited Mutation Keys
   - If policy contains 'prerequisiteGatingThreshold', 'rushingRiskThreshold',
     'overdueTemporalPointsPerDay', 'actionTaxonomy', or candidate generation filters
     -> throw INVALID_POLICY_DEFINITION (PROHIBITED_ELIGIBILITY_MUTATION)

3. Detect Other Unknown Keys
   - If policy contains any property outside:
     ['simulationOnly', 'baseWeights', 'maxMasteryDeficitWeight',
      'maxGoalImpactWeight', 'maxTemporalWeight', 'priorityThresholds']
     -> throw INVALID_POLICY_DEFINITION (UNKNOWN_PROPERTY)

4. Validate Required Keys
   - simulationOnly !== true -> throw INVALID_POLICY_DEFINITION (INVALID_SIMULATION_FLAG)
   - Missing required keys in baseWeights or priorityThresholds -> throw INVALID_POLICY_DEFINITION (MISSING_REQUIRED_KEY)

5. Validate Numeric Values & Bounds
   - Any value is NaN, Infinity, -Infinity, non-number -> throw INVALID_POLICY_DEFINITION (NON_NUMERIC_VALUE)
   - baseWeights values not in [0.0, 100.0] -> throw INVALID_POLICY_DEFINITION (VALUE_OUT_OF_BOUNDS)
   - maxMasteryDeficitWeight not in [0.0, 50.0] -> throw INVALID_POLICY_DEFINITION (VALUE_OUT_OF_BOUNDS)
   - maxGoalImpactWeight not in [0.0, 30.0] -> throw INVALID_POLICY_DEFINITION (VALUE_OUT_OF_BOUNDS)
   - maxTemporalWeight not in [0.0, 20.0] -> throw INVALID_POLICY_DEFINITION (VALUE_OUT_OF_BOUNDS)
   - priorityThresholds values not in [0.0, 100.0] -> throw INVALID_POLICY_DEFINITION (VALUE_OUT_OF_BOUNDS)

6. Validate Threshold Order Invariant
   - If not (critical > urgent > high > normal) -> throw INVALID_POLICY_DEFINITION (THRESHOLD_ORDER_VIOLATION)

7. Detect Baseline Duplicate
   - If all 13 tunable scoring dimensions exactly match BASELINE_POLICY -> throw INVALID_POLICY_DEFINITION (CANDIDATE_POLICY_MATCHES_BASELINE)
```

---

## 11. Policy Delta Contract

Function: `diffPolicy(BASELINE_POLICY, candidatePolicy)`

### 11.1 The 13 Tunable Dimensions (Deterministic Order)
The difference between baseline and candidate is evaluated across strictly 13 canonical dimensions in this exact order:
1. `baseWeights.PREREQUISITE_REMEDIATION`
2. `baseWeights.OVERDUE_REVISION`
3. `baseWeights.DUE_TODAY_REVISION`
4. `baseWeights.CURRICULUM_ADVANCEMENT`
5. `baseWeights.EXAM_BENCHMARK`
6. `baseWeights.PACING_CALIBRATION`
7. `maxMasteryDeficitWeight`
8. `maxGoalImpactWeight`
9. `maxTemporalWeight`
10. `priorityThresholds.critical`
11. `priorityThresholds.urgent`
12. `priorityThresholds.high`
13. `priorityThresholds.normal`

### 11.2 Semantic Equality Algorithm
1. Perform exact JavaScript numeric equality comparison: `baselineValue === candidateValue`.
2. If `false`, record the dimension string and compute `delta = candidateValue - baselineValue`.
3. Return `changedDimensions` as an array of strings in the 13-dimension canonical order.
4. Return `deltas` as a key-value map: `{ [dimension]: delta }`.
5. Exclude `simulationOnly` and non-scoring metadata from the delta.

---

## 12. Dimension Relevance Contract

Function: `dimensionAffects(actionType, actionSubtype, dimension)`

Returns a boolean indicating whether a changed dimension has mathematical relevance to a candidate action:

| Dimension | Relevant Action Types / Subtypes | Mathematical Justification |
| :--- | :--- | :--- |
| `baseWeights.PREREQUISITE_REMEDIATION` | `PREREQUISITE_REMEDIATION` | Directly sets $W_{\text{type}}$ |
| `baseWeights.OVERDUE_REVISION` | `RETENTION_RESCUE` with subtype `OVERDUE_REVISION` | Directly sets $W_{\text{type}}$ |
| `baseWeights.DUE_TODAY_REVISION` | `RETENTION_RESCUE` with subtype `DUE_TODAY_REVISION` | Directly sets $W_{\text{type}}$ |
| `baseWeights.CURRICULUM_ADVANCEMENT` | `CURRICULUM_ADVANCEMENT` | Directly sets $W_{\text{type}}$ |
| `baseWeights.EXAM_BENCHMARK` | `EXAM_BENCHMARK` | Directly sets $W_{\text{type}}$ |
| `baseWeights.PACING_CALIBRATION` | `PACING_CALIBRATION` | Directly sets $W_{\text{type}}$ |
| `maxMasteryDeficitWeight` | `PREREQUISITE_REMEDIATION`, `OVERDUE_REVISION`, `DUE_TODAY_REVISION`, `CURRICULUM_ADVANCEMENT`, `PACING_CALIBRATION` | Scales deficit component $S$. Does NOT affect `EXAM_BENCHMARK` ($S=0$ invariant) or `DIAGNOSTIC_ASSESSMENT` ($U=\text{null}$) |
| `maxTemporalWeight` | `RETENTION_RESCUE` with subtype `OVERDUE_REVISION` | Caps temporal component $T$. Does NOT affect any other action ($T=0$ invariant) |
| `maxGoalImpactWeight` | All six competitive scored keys | Caps goal component $I$. Does NOT affect `DIAGNOSTIC_ASSESSMENT` |
| `priorityThresholds.*` | All six competitive scored keys | Determines `priorityTier`. Does NOT affect `DIAGNOSTIC_ASSESSMENT` (tier invariant `'normal'`) |
| Any Dimension | `DIAGNOSTIC_ASSESSMENT` | Returns `false` for all scoring dimensions ($U=\text{null}$, tier `'normal'`) |

---

## 13. Pure Scoring Contract

Function: `calculatePureUrgencyScore(action, candidatePolicy)`

Pure Phase 11 simulation mathematically reproduces Phase 9 raw behavior under candidate parameters:

$$U = W + S + I + T$$

### 13.1 Component Formulas
1. **Base Type Weight ($W$)**:
   - `actionSubtype === 'OVERDUE_REVISION'`: `candidatePolicy.baseWeights.OVERDUE_REVISION`
   - `actionSubtype === 'DUE_TODAY_REVISION'`: `candidatePolicy.baseWeights.DUE_TODAY_REVISION`
   - `candidatePolicy.baseWeights[actionType] !== undefined`: `candidatePolicy.baseWeights[actionType]`
   - Otherwise: `0.0`
2. **Mastery Deficit ($S$)**:
   - `EXAM_BENCHMARK`: strictly `0.0`.
   - `PACING_CALIBRATION`: if `hasProgressEvidence === false` or `storedMastery === null`, strictly `0.0`; else $\max(0.0, 1.0 - \text{storedMastery}) \times \text{candidatePolicy.maxMasteryDeficitWeight}$.
   - All other scored actions: $\max(0.0, 1.0 - \text{effectiveMastery}) \times \text{candidatePolicy.maxMasteryDeficitWeight}$ (where missing mastery defaults to `0.0`).
3. **Goal Impact ($I$)**:
   $$I = \min(\text{candidatePolicy.maxGoalImpactWeight}, \text{baseAlignment} + \text{deadlineProximityBonus})$$
   - Base alignment: $+10.0$ if `actionType === 'EXAM_BENCHMARK'` or `isPlanAligned === true`; else `0.0`.
   - `PREREQUISITE_REMEDIATION`: $\text{baseAlignment} = 10.0$, $\text{deadlineProximityBonus} = 0.0 \implies I = \min(\text{candidatePolicy.maxGoalImpactWeight}, 10.0)$.
   - `CURRICULUM_ADVANCEMENT`: $I = \min(\text{candidatePolicy.maxGoalImpactWeight}, 10.0 + \text{deadlineProximityBonus})$.
   - `EXAM_BENCHMARK`: $I = \min(\text{candidatePolicy.maxGoalImpactWeight}, 10.0 + \text{deadlineProximityBonus})$.
   - `OVERDUE_REVISION` / `DUE_TODAY_REVISION` / `PACING_CALIBRATION`: $\text{deadlineProximityBonus} = 0.0 \implies I = \min(\text{candidatePolicy.maxGoalImpactWeight}, \text{isPlanAligned} ? 10.0 : 0.0)$.
4. **Temporal Urgency ($T$)**:
   - `OVERDUE_REVISION`: $\min(\text{candidatePolicy.maxTemporalWeight}, \max(0, \text{daysOverdue}) \times 2.0)$.
   - All other actions: strictly `0.0`.
5. **Full Precision Preservation & No Implicit Rounding**:
   - Full IEEE-754 precision is retained throughout scoring, tier derivation, ranking, and report object assembly.
   - Phase 11 V1 performs no implicit analytical-score rounding in report artifacts.
   - `canonicalizeJSON()` serializes the finite JavaScript number exactly according to JSON numeric serialization semantics without rounding.
   - Any future presentation-only rounding would occur only after analytical decisions and would require a new explicit contract.

---

## 14. Deadline Proximity & Historical DaysOverdue Contract

### 14.1 Continuous Deadline Proximity Formula
The continuous deadline proximity formula is inherited from Phase 9 and **strictly frozen / non-tunable in V1**:

```javascript
const calculateContinuousDeadlineProximityBonus = (targetDate, referenceNow) => {
  if (!targetDate) return { daysToDeadline: null, deadlineProximityBonus: 0.0 };

  const rawDays = Math.floor(
    (new Date(targetDate).getTime() - new Date(referenceNow).getTime()) / 86400000
  );
  const daysToDeadline = Math.max(0, rawDays);

  const deadlineProximityBonus =
    daysToDeadline < 30
      ? Math.min(5.0, Math.max(0.0, (30 - daysToDeadline) / 30.0) * 5.0)
      : 0.0;

  return { daysToDeadline, deadlineProximityBonus };
};
```

### 14.2 Historical `daysOverdue` Reconstruction (Mode A)
In Mode A, `daysOverdue` is deterministically reconstructed from the historical snapshot using the **historical issuance clock** (`record.issuedAt`), **NOT** the simulation run's `referenceNow`:

```javascript
const reconstructHistoricalDaysOverdue = (record) => {
  if (record.actionSubtype !== 'OVERDUE_REVISION') return 0;
  if (!record.issuanceSnapshot || !record.issuanceSnapshot.nextReviewDate) return 0;

  const d = new Date(record.issuedAt);
  const todayStartUtc = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
  const nextReviewDate = new Date(record.issuanceSnapshot.nextReviewDate);

  if (nextReviewDate >= todayStartUtc) return 0;

  return Math.max(0, Math.floor((todayStartUtc.getTime() - nextReviewDate.getTime()) / 86400000));
};
```

---

## 15. Comparator Contract

Function: `compareCandidates(a, b, candidatePolicy)`

Candidates are ranked using Phase 9's authoritative 7-tier deterministic comparator:

1. **Tier 1 — Policy Priority Class (Ascending)**:
   Class 0 (Blocking/Overdue) < Class 1 (Due Today) < Class 2 (Curriculum/Benchmark/Pacing). Null (Diagnostic) sorts last.
2. **Tier 2 — Urgency Score (Descending)**:
   Higher $U$ wins. Null sorts last.
3. **Tier 3 — Candidate Base Weight (Descending)**:
   Evaluated using **candidate policy's base weights** ($W_{\text{cand}}$). No baseline base-weight leakage.
4. **Tier 4 — Stored Mastery (Ascending)**:
   Weaker mastery wins. Missing mastery treated as `0.0`.
5. **Tier 5 — Canonical Topic Registry Index (Ascending)**:
   Topic index $0$ to $23$ in registry order. Non-topic actions use $999999$.
6. **Tier 6 — Canonical Pattern Registry Index (Ascending)**:
   Derived via `effectivePatternIndex = (candidate.pattern == null) ? Infinity : candidate.patternIndex`.
   Pattern index $0$ to $277$. Patternless actions sort last (+$\infty$).
7. **Tier 7 — Lexical Fallback**:
   Strictly preserves Phase 9:
   ```javascript
   const patternNameA = a.pattern || '';
   const patternNameB = b.pattern || '';
   const patternComp = patternNameA.localeCompare(patternNameB);
   if (patternComp !== 0) return patternComp;
   return (a.actionId || '').localeCompare(b.actionId || '');
   ```

> [!NOTE]
> The Phase 11 architecture proposal's abbreviated statement `"Lexical deterministic fallback (actionId)"` is descriptive shorthand only.
> Per live Phase 9 source truth (`src/services/orchestration/urgencyScoringService.js`), the authoritative Tier-7 comparator order is:
> 1. pattern name lexical comparison (`patternNameA.localeCompare(patternNameB)`)
> 2. actionId lexical comparison (`(a.actionId || '').localeCompare(b.actionId || '')`)
> Live Phase 9 source code takes absolute precedence over abbreviated architecture prose.

---

## 16. Phase 10 Historical Data Contract

File: `src/models/prescriptionExecutionRecordModel.js`

### 16.1 Persisted vs. Reconstructed Precision
- **`PrescriptionExecutionRecord.urgencyScore`**: Stores the Phase 9 public action DTO score, **rounded to 2 decimal places**. It is NOT internal unrounded raw IEEE-754 urgency.
- **`issuanceSnapshot`**: Contains algorithm evidence at issuance time:
  - `PREREQUISITE_REMEDIATION`: contains `prerequisiteMastery`, `blockedTargetPattern`, `blockedTargetTopic`. Raw reconstructible!
  - `RETENTION_RESCUE`: contains `nextReviewDate`, `intervalDays`, `stage`. Missing raw mastery and goal alignment.
  - `CURRICULUM_ADVANCEMENT`: contains `storedMastery`. Missing continuous deadline bonus.
  - `PACING_CALIBRATION`: contains `overallRushingRiskScore`. Missing topic mastery and goal alignment.
  - `EXAM_BENCHMARK`: contains `readinessStatus`. Missing goal target date / deadline bonus.
  - `DIAGNOSTIC_ASSESSMENT`: contains `storedMastery`. Non-scored fallback ($U=\text{null}$).

### 16.2 Retroactive State Query Prohibition
Phase 11 must **never query current mutable upstream models** (`StudentProgress`, `StudyPlan`, `Goal`, `RevisionItem`) to fill historical gaps. Doing so corrupts audit reproducibility with time-skewed data.

---

## 17. Mode A Support Matrix

The authoritative support matrix specifies replay support per candidate parameter and action type:

| Candidate Policy Parameter | Prerequisite Remediation | Overdue Revision | Due-Today Revision | Curriculum Advancement | Pacing Calibration | Exam Benchmark | Diagnostic Assessment | Mode B (Synthetic Archetypes) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **`baseWeights`** | **EXACT** (`RECONSTRUCTED_RAW`) | **PARTIAL** (`ROUNDED_DTO`) | **PARTIAL** (`ROUNDED_DTO`) | **PARTIAL** (`ROUNDED_DTO`) | **PARTIAL** (`ROUNDED_DTO`) | **PARTIAL** (`ROUNDED_DTO`) | **NOT_APPLICABLE** ($U = \text{null}$) | **EXACT** (`SYNTHETIC_RAW`) |
| **`priorityThresholds`** | **EXACT** (`RECONSTRUCTED_RAW`) | **PARTIAL** (Interval audit) | **PARTIAL** (Interval audit) | **PARTIAL** (Interval audit) | **PARTIAL** (Interval audit) | **PARTIAL** (Interval audit) | **NOT_APPLICABLE** (Invariant) | **EXACT** (`SYNTHETIC_RAW`) |
| **`maxMasteryDeficitWeight`** | **EXACT** (`RECONSTRUCTED_RAW`) | **UNSUPPORTED** (Mastery missing) | **UNSUPPORTED** (Mastery missing) | **PARTIAL** (Deficit delta exact) | **UNSUPPORTED** (Mastery missing) | **NOT_APPLICABLE / INVARIANT** ($S=0$) | **NOT_APPLICABLE** ($U = \text{null}$) | **EXACT** (`SYNTHETIC_RAW`) |
| **`maxTemporalWeight`** | **NOT_APPLICABLE / INVARIANT** ($T=0$ invariant) | **PARTIAL** (Temporal delta exact) | **NOT_APPLICABLE / INVARIANT** ($T=0$ invariant) | **NOT_APPLICABLE / INVARIANT** ($T=0$ invariant) | **NOT_APPLICABLE / INVARIANT** ($T=0$ invariant) | **NOT_APPLICABLE / INVARIANT** ($T=0$ invariant) | **NOT_APPLICABLE** ($U = \text{null}$) | **EXACT** (`SYNTHETIC_RAW`) |
| **`maxGoalImpactWeight`** | **EXACT** (Baseline $= 10$; Cand $= \min(W_I, 10)$) | **UNSUPPORTED** (Alignment missing) | **UNSUPPORTED** (Alignment missing) | **UNSUPPORTED** (Bonus missing) | **UNSUPPORTED** (Alignment missing) | **UNSUPPORTED** (Date missing) | **NOT_APPLICABLE** ($U = \text{null}$) | **EXACT** (`SYNTHETIC_RAW`) |

---

## 18. Mode A Precision / Rounding Contract

### 18.1 Precision Enums & Historical DTO Evidence Semantics
- `RAW_EXACT`: Reconstructed with 100% IEEE-754 precision from raw persisted inputs (`scoreSource: RECONSTRUCTED_RAW`). Newly computed analytical values do NOT receive new implicit rounding.
- `DTO_ROUNDED_PARTIAL`: Anchored to persisted rounded DTO score ($U_{\text{dto}}$) plus exact component delta ($\Delta_{\text{total}}$) (`scoreSource: PERSISTED_ROUNDED_DTO`). Historical Phase 9 DTO evidence (`persistedDtoUrgencyScore`) may already be rounded to 2 decimals by Phase 9 and remains exactly what was persisted. Newly computed delta components and analytical scores do NOT receive new implicit rounding.
- `UNAVAILABLE`: Cannot be evaluated due to unsupported dimensions (`scoreSource: NOT_AVAILABLE`).

### 18.2 Rounding Interval Propagation
The persisted score $U_{\text{dto}}$ represents an internal raw score in the half-open interval:

$$I_{\text{raw}} = [U_{\text{dto}} - 0.005, \; U_{\text{dto}} + 0.005)$$

When applying exact component delta $\Delta_{\text{total}}$, the candidate raw score lies within the shifted interval:

$$I_{\text{cand}} = [U_{\text{dto}} - 0.005 + \Delta_{\text{total}}, \; U_{\text{dto}} + 0.005 + \Delta_{\text{total}})$$

### 18.3 Boundary Ambiguity Contract
Candidate priority thresholds are audited against $I_{\text{cand}}$:
- If any candidate threshold $T$ satisfies $U_{\text{dto}} - 0.005 + \Delta_{\text{total}} \le T < U_{\text{dto}} + 0.005 + \Delta_{\text{total}}$:
  $$\text{thresholdBoundaryAmbiguous} = \mathbf{true}$$
  Candidate priority tier is classified conservatively using $\tilde{U}_{\text{cand}} = U_{\text{dto}} + \Delta_{\text{total}}$, but flagged ambiguous.
- If all candidate thresholds lie strictly outside $I_{\text{cand}}$:
  $$\text{thresholdBoundaryAmbiguous} = \mathbf{false}$$
  Tier classification is mathematically unambiguous across the entire interval, but support remains **`PARTIAL`** due to rounded historical provenance.

---

## 19. Multi-Parameter Aggregation

### 19.1 Action-Relevant Effective Delta Derivation
For each historical record:
1. Derive all changed dimensions: `changedDimensions = diffPolicy(BASELINE, candidate).changedDimensions`.
2. Filter to action-relevant dimensions: `effectiveDimensions = changedDimensions.filter(d => dimensionAffects(record.actionType, record.actionSubtype, d))`.

### 19.2 Support Precedence Contract
Evaluate support for each dimension in `effectiveDimensions` against Section 17. Aggregated whole-policy support:

$$\mathbf{UNSUPPORTED} > \mathbf{PARTIAL} > \mathbf{EXACT}$$

- If `effectiveDimensions.length === 0`: `overallSupport = 'NOT_APPLICABLE'`.
- Else if **ANY** effective dimension is `UNSUPPORTED`: `overallSupport = 'UNSUPPORTED'`.
- Else if **ANY** effective dimension is `PARTIAL`: `overallSupport = 'PARTIAL'`.
- Else: `overallSupport = 'EXACT'`.

### 19.3 Completeness Invariant (Never Silently Drop Unsupported Dimensions)
If any effective dimension is `UNSUPPORTED`:
- Whole-policy result must be strictly **`UNSUPPORTED`**.
- `estimatedCandidateUrgencyScore = null`.
- `candidatePriorityTier = null`.
- `candidateUrgencyScorePrecision = 'UNAVAILABLE'`.
- `tierShiftDetected = null`.
- `thresholdBoundaryAmbiguous = null`.
- `unsupportedDimensions` lists all unsupported dimensions.
- Isolated diagnostic deltas are reported under `parameterDiagnostics`, but never presented as whole-policy candidate results.

### 19.4 Threshold Application Order
When a candidate policy modifies BOTH score-producing parameters and priority thresholds:
1. **Step 1**: Calculate candidate score ($\tilde{U}_{\text{cand}}$) and shifted interval ($I_{\text{cand}}$).
2. **Step 2**: Apply **candidate priority thresholds** to the candidate score and interval.
3. **Step 3**: Derive `candidatePriorityTier` and `thresholdBoundaryAmbiguous`.
Baseline score must **never** be evaluated against candidate thresholds before applying score deltas.

---

## 20. Mode A Result Schema & Nullability

### 20.1 Internal Mode A Record Result (Full Diagnostic Trace)
Each evaluated historical record emits this exact internal structure:

```javascript
{
  prescriptionId: string,
  actionType: string,
  actionSubtype: string,

  overallSupport: 'EXACT' | 'PARTIAL' | 'UNSUPPORTED' | 'NOT_APPLICABLE',
  scoreSource: 'RECONSTRUCTED_RAW' | 'PERSISTED_ROUNDED_DTO' | 'NOT_AVAILABLE',
  candidateUrgencyScorePrecision: 'RAW_EXACT' | 'DTO_ROUNDED_PARTIAL' | 'UNAVAILABLE',

  reconstructedRawUrgencyScore: number | null,
  persistedDtoUrgencyScore: number | null,
  estimatedCandidateUrgencyScore: number | null,

  baselinePriorityTier: string,
  candidatePriorityTier: string | null,
  tierShiftDetected: boolean | null,
  thresholdBoundaryAmbiguous: boolean | null,

  changedDimensions: string[],
  effectiveDimensions: string[],
  unsupportedDimensions: string[],

  parameterDiagnostics: [
    {
      dimension: string,
      support: 'EXACT' | 'PARTIAL' | 'UNSUPPORTED' | 'NOT_APPLICABLE',
      reasonCode: string,
      baselineValue: number,
      candidateValue: number,
      componentDelta: number | null
    }
  ]
}
```

### 20.2 Strict Nullability Rules
- If `overallSupport === 'UNSUPPORTED'` or `overallSupport === 'NOT_APPLICABLE'`:
  - `candidatePriorityTier = null`
  - `estimatedCandidateUrgencyScore = null`
  - `candidateUrgencyScorePrecision = 'UNAVAILABLE'`
  - `tierShiftDetected = null` (strictly null, NEVER false)
  - `thresholdBoundaryAmbiguous = null` (strictly null, NEVER false)

### 20.3 Parameter Diagnostic Reason Codes (Closed Enum)
- `RAW_EVIDENCE_AVAILABLE`: Exact raw inputs preserved in snapshot.
- `ROUNDED_DTO_BASELINE`: Base weight delta applied to rounded DTO score.
- `RAW_MASTERY_FROZEN`: Snapshot contains frozen raw mastery.
- `HISTORICAL_MASTERY_UNAVAILABLE`: Raw mastery missing from snapshot.
- `PLAN_ALIGNMENT_UNAVAILABLE`: Historical active-plan alignment missing.
- `DEADLINE_BONUS_UNAVAILABLE`: Historical continuous deadline bonus missing.
- `INVARIANT_NOT_APPLICABLE`: Parameter has zero mathematical relevance to action.
- `IRRELEVANT_ACTION_DIMENSION`: Dimension filtered out by `dimensionAffects`.

---

## 21. Mode B Architecture

Mode B evaluates candidate policies across **six canonical deterministic synthetic student archetype vectors**.

- **Complete Candidate Sets**: Each archetype contains competing candidate actions spanning multiple action types.
- **Pure Scoring**: Executes raw IEEE-754 scoring logic (`calculatePureUrgencyScore`) without DTO rounding.
- **Comparator Execution**: Executes the authoritative 7-tier ranking comparator (`compareCandidates`) using candidate parameters for Tier 3 base weights.
- **Zero Database Dependency**: All candidate inputs are fully specified in memory.
- **Metrics**: Calculates winning action disagreement, rank deltas, and tier migrations.

---

## 22. Six Exact Archetype Definitions

File: `src/config/simulationArchetypes.js`

**Allowed Runtime Dependencies: NONE (Pure Static Config).**  
All candidate vectors contain explicit, canonical topics (from registry 0–23) and patterns (from registry 0–277). Patternless actions use `patternIndex: null` to maintain strict JSON serializability (no JavaScript `Infinity` in config):

```javascript
'use strict';

const SIMULATION_ARCHETYPES = Object.freeze([
  // ── ARCHETYPE 1 ────────────────────────────────────────────────────────────
  {
    archetypeId: 'arch_foundational_prerequisite_bottleneck',
    name: 'Foundational Prerequisite Bottleneck',
    description: 'Learner with low mastery in a foundational prerequisite blocking subsequent curriculum progression.',
    candidates: [
      {
        actionId: 'nba_prereq_algebra_linear_eq',
        actionType: 'PREREQUISITE_REMEDIATION',
        actionSubtype: 'BLOCKING_PREREQUISITE',
        policyPriorityClass: 0,
        storedMastery: 0.35,
        hasProgressEvidence: true,
        isPlanAligned: true,
        deadlineProximityBonus: 0.0,
        daysToDeadline: null,
        daysOverdue: 0,
        topic: 'Algebra',
        pattern: 'Linear Equations & Systems of Equations',
        topicIndex: 0,
        patternIndex: 0
      },
      {
        actionId: 'nba_curr_percentage_basic',
        actionType: 'CURRICULUM_ADVANCEMENT',
        actionSubtype: 'DAILY_OBJECTIVE_TARGET',
        policyPriorityClass: 2,
        storedMastery: 0.60,
        hasProgressEvidence: true,
        isPlanAligned: true,
        deadlineProximityBonus: 2.5,
        daysToDeadline: 15,
        daysOverdue: 0,
        topic: 'Percentage',
        pattern: 'Basic Percentage Calculation',
        topicIndex: 9,
        patternIndex: 99
      },
      {
        actionId: 'nba_rev_time_work_unitary',
        actionType: 'RETENTION_RESCUE',
        actionSubtype: 'DUE_TODAY_REVISION',
        policyPriorityClass: 1,
        storedMastery: 0.75,
        hasProgressEvidence: true,
        isPlanAligned: true,
        deadlineProximityBonus: 0.0,
        daysToDeadline: null,
        daysOverdue: 0,
        topic: 'Time and Work',
        pattern: 'Basic Unitary & Two/Three Person Work',
        topicIndex: 20,
        patternIndex: 243
      },
      {
        actionId: 'nba_pace_profit_loss_all',
        actionType: 'PACING_CALIBRATION',
        actionSubtype: 'RUSHING_REMEDIATION',
        policyPriorityClass: 2,
        storedMastery: 0.50,
        hasProgressEvidence: true,
        isPlanAligned: false,
        deadlineProximityBonus: 0.0,
        daysToDeadline: null,
        daysOverdue: 0,
        topic: 'Profit and Loss',
        pattern: null,
        topicIndex: 15,
        patternIndex: null
      }
    ]
  },

  // ── ARCHETYPE 2 ────────────────────────────────────────────────────────────
  {
    archetypeId: 'arch_overdue_spaced_revision_debt',
    name: 'Overdue Spaced Revision Debt',
    description: 'Learner with overdue spaced revision items accumulating temporal urgency competing with curriculum.',
    candidates: [
      {
        actionId: 'nba_rev_algebra_linear_eq_od',
        actionType: 'RETENTION_RESCUE',
        actionSubtype: 'OVERDUE_REVISION',
        policyPriorityClass: 0,
        storedMastery: 0.55,
        hasProgressEvidence: true,
        isPlanAligned: true,
        deadlineProximityBonus: 0.0,
        daysToDeadline: null,
        daysOverdue: 6,
        topic: 'Algebra',
        pattern: 'Linear Equations & Systems of Equations',
        topicIndex: 0,
        patternIndex: 0
      },
      {
        actionId: 'nba_rev_percentage_single_od',
        actionType: 'RETENTION_RESCUE',
        actionSubtype: 'OVERDUE_REVISION',
        policyPriorityClass: 0,
        storedMastery: 0.65,
        hasProgressEvidence: true,
        isPlanAligned: false,
        deadlineProximityBonus: 0.0,
        daysToDeadline: null,
        daysOverdue: 2,
        topic: 'Percentage',
        pattern: 'Single Percentage Increase and Decrease',
        topicIndex: 9,
        patternIndex: 100
      },
      {
        actionId: 'nba_curr_profit_loss_article',
        actionType: 'CURRICULUM_ADVANCEMENT',
        actionSubtype: 'DAILY_OBJECTIVE_TARGET',
        policyPriorityClass: 2,
        storedMastery: 0.40,
        hasProgressEvidence: true,
        isPlanAligned: true,
        deadlineProximityBonus: 1.0,
        daysToDeadline: 24,
        daysOverdue: 0,
        topic: 'Profit and Loss',
        pattern: 'Article vs. Value Equivalence (LCM / Balancing Method)',
        topicIndex: 15,
        patternIndex: 197
      },
      {
        actionId: 'nba_exam_mock_001',
        actionType: 'EXAM_BENCHMARK',
        actionSubtype: 'GOAL_BENCHMARK_MOCK',
        policyPriorityClass: 2,
        storedMastery: null,
        hasProgressEvidence: true,
        isPlanAligned: true,
        deadlineProximityBonus: 3.0,
        daysToDeadline: 12,
        daysOverdue: 0,
        topic: null,
        pattern: null,
        topicIndex: 999999,
        patternIndex: null
      }
    ]
  },

  // ── ARCHETYPE 3 ────────────────────────────────────────────────────────────
  {
    archetypeId: 'arch_due_today_revision_pressure',
    name: 'Due-Today Revision Pressure',
    description: 'Learner with revision items due today competing against daily curriculum progression.',
    candidates: [
      {
        actionId: 'nba_rev_average_ap_series_due',
        actionType: 'RETENTION_RESCUE',
        actionSubtype: 'DUE_TODAY_REVISION',
        policyPriorityClass: 1,
        storedMastery: 0.70,
        hasProgressEvidence: true,
        isPlanAligned: true,
        deadlineProximityBonus: 0.0,
        daysToDeadline: null,
        daysOverdue: 0,
        topic: 'Average',
        pattern: 'Arithmetic Progression & Consecutive Series',
        topicIndex: 1,
        patternIndex: 10
      },
      {
        actionId: 'nba_rev_number_system_class_due',
        actionType: 'RETENTION_RESCUE',
        actionSubtype: 'DUE_TODAY_REVISION',
        policyPriorityClass: 1,
        storedMastery: 0.50,
        hasProgressEvidence: true,
        isPlanAligned: false,
        deadlineProximityBonus: 0.0,
        daysToDeadline: null,
        daysOverdue: 0,
        topic: 'Number System',
        pattern: 'Classification of Numbers',
        topicIndex: 7,
        patternIndex: 74
      },
      {
        actionId: 'nba_curr_tsd_basic_speed',
        actionType: 'CURRICULUM_ADVANCEMENT',
        actionSubtype: 'DAILY_OBJECTIVE_TARGET',
        policyPriorityClass: 2,
        storedMastery: 0.30,
        hasProgressEvidence: true,
        isPlanAligned: true,
        deadlineProximityBonus: 4.0,
        daysToDeadline: 6,
        daysOverdue: 0,
        topic: 'Time, Speed and Distance',
        pattern: 'Basic Speed-Distance-Time & Unit Conversions',
        topicIndex: 21,
        patternIndex: 251
      }
    ]
  },

  // ── ARCHETYPE 4 ────────────────────────────────────────────────────────────
  {
    archetypeId: 'arch_core_curriculum_progression',
    name: 'Core Curriculum Progression',
    description: 'Steady learner with satisfied prerequisites advancing through active daily objectives.',
    candidates: [
      {
        actionId: 'nba_curr_algebra_identities',
        actionType: 'CURRICULUM_ADVANCEMENT',
        actionSubtype: 'DAILY_OBJECTIVE_TARGET',
        policyPriorityClass: 2,
        storedMastery: 0.45,
        hasProgressEvidence: true,
        isPlanAligned: true,
        deadlineProximityBonus: 3.5,
        daysToDeadline: 9,
        daysOverdue: 0,
        topic: 'Algebra',
        pattern: 'Standard Algebraic Identities & Expansions',
        topicIndex: 0,
        patternIndex: 1
      },
      {
        actionId: 'nba_curr_number_system_divisibility',
        actionType: 'CURRICULUM_ADVANCEMENT',
        actionSubtype: 'DAILY_OBJECTIVE_TARGET',
        policyPriorityClass: 2,
        storedMastery: 0.20,
        hasProgressEvidence: true,
        isPlanAligned: true,
        deadlineProximityBonus: 1.5,
        daysToDeadline: 21,
        daysOverdue: 0,
        topic: 'Number System',
        pattern: 'Divisibility Rules & Applications',
        topicIndex: 7,
        patternIndex: 75
      },
      {
        actionId: 'nba_pace_average_all',
        actionType: 'PACING_CALIBRATION',
        actionSubtype: 'RUSHING_REMEDIATION',
        policyPriorityClass: 2,
        storedMastery: 0.70,
        hasProgressEvidence: true,
        isPlanAligned: true,
        deadlineProximityBonus: 0.0,
        daysToDeadline: null,
        daysOverdue: 0,
        topic: 'Average',
        pattern: null,
        topicIndex: 1,
        patternIndex: null
      }
    ]
  },

  // ── ARCHETYPE 5 ────────────────────────────────────────────────────────────
  {
    archetypeId: 'arch_rushing_pacing_calibration_risk',
    name: 'Rushing / Pacing Calibration Risk',
    description: 'Learner exhibiting severe rushing risk on unmastered material requiring pacing calibration.',
    candidates: [
      {
        actionId: 'nba_pace_percentage_severe',
        actionType: 'PACING_CALIBRATION',
        actionSubtype: 'RUSHING_REMEDIATION',
        policyPriorityClass: 2,
        storedMastery: 0.35,
        hasProgressEvidence: true,
        isPlanAligned: true,
        deadlineProximityBonus: 0.0,
        daysToDeadline: null,
        daysOverdue: 0,
        topic: 'Percentage',
        pattern: null,
        topicIndex: 9,
        patternIndex: null
      },
      {
        actionId: 'nba_pace_boats_streams_no_evidence',
        actionType: 'PACING_CALIBRATION',
        actionSubtype: 'RUSHING_REMEDIATION',
        policyPriorityClass: 2,
        storedMastery: null,
        hasProgressEvidence: false,
        isPlanAligned: false,
        deadlineProximityBonus: 0.0,
        daysToDeadline: null,
        daysOverdue: 0,
        topic: 'Boats and Streams',
        pattern: null,
        topicIndex: 2,
        patternIndex: null
      },
      {
        actionId: 'nba_curr_profit_loss_chain',
        actionType: 'CURRICULUM_ADVANCEMENT',
        actionSubtype: 'DAILY_OBJECTIVE_TARGET',
        policyPriorityClass: 2,
        storedMastery: 0.50,
        hasProgressEvidence: true,
        isPlanAligned: true,
        deadlineProximityBonus: 2.0,
        daysToDeadline: 18,
        daysOverdue: 0,
        topic: 'Profit and Loss',
        pattern: 'Chain Transactions & Successive Ownership Transfer',
        topicIndex: 15,
        patternIndex: 198
      }
    ]
  },

  // ── ARCHETYPE 6 ────────────────────────────────────────────────────────────
  {
    archetypeId: 'arch_goal_benchmark_deadline_proximity',
    name: 'Goal Benchmark Deadline Proximity',
    description: 'Learner approaching exam deadline within 14 days activating mock test benchmark competition.',
    candidates: [
      {
        actionId: 'nba_exam_benchmark_urgent',
        actionType: 'EXAM_BENCHMARK',
        actionSubtype: 'GOAL_BENCHMARK_MOCK',
        policyPriorityClass: 2,
        storedMastery: null,
        hasProgressEvidence: true,
        isPlanAligned: true,
        deadlineProximityBonus: 4.5,
        daysToDeadline: 3,
        daysOverdue: 0,
        topic: null,
        pattern: null,
        topicIndex: 999999,
        patternIndex: null
      },
      {
        actionId: 'nba_curr_time_work_leaving',
        actionType: 'CURRICULUM_ADVANCEMENT',
        actionSubtype: 'DAILY_OBJECTIVE_TARGET',
        policyPriorityClass: 2,
        storedMastery: 0.55,
        hasProgressEvidence: true,
        isPlanAligned: true,
        deadlineProximityBonus: 4.5,
        daysToDeadline: 3,
        daysOverdue: 0,
        topic: 'Time and Work',
        pattern: 'Work Leaving & Joining',
        topicIndex: 20,
        patternIndex: 244
      },
      {
        actionId: 'nba_diag_algebra_inequalities',
        actionType: 'DIAGNOSTIC_ASSESSMENT',
        actionSubtype: 'FOUNDATIONAL_DIAGNOSTIC',
        policyPriorityClass: null,
        storedMastery: 0.0,
        hasProgressEvidence: true,
        isPlanAligned: false,
        deadlineProximityBonus: 0.0,
        daysToDeadline: null,
        daysOverdue: 0,
        topic: 'Algebra',
        pattern: 'Inequalities & Modulus Functions',
        topicIndex: 0,
        patternIndex: 2
      }
    ]
  }
]);

module.exports = {
  SIMULATION_ARCHETYPES,
};
```

---

## 23. Mode B Result Schema

File: `src/services/simulation/syntheticPolicyComparisonService.js`

Mode B simulation produces the following exact structure:

```javascript
{
  archetypeId: string,
  archetypeName: string,

  baselinePolicyResult: {
    winnerActionId: string,
    winnerActionType: string,
    winnerUrgencyScore: number | null,
    winnerPriorityTier: string,
    ranking: [
      {
        rank: number,
        actionId: string,
        actionType: string,
        urgencyScore: number | null,
        priorityTier: string
      }
    ]
  },

  candidatePolicyResults: [
    {
      policyFingerprint: string,
      winnerActionId: string,
      winnerActionType: string,
      winnerUrgencyScore: number | null,
      winnerPriorityTier: string,
      actionDisagreement: boolean,
      winnerRankDelta: number,
      ranking: [
        {
          rank: number,
          actionId: string,
          actionType: string,
          urgencyScore: number | null,
          priorityTier: string,
          rankDeltaFromBaseline: number
        }
      ],
      tierMigrations: [
        {
          actionId: string,
          baselineTier: string,
          candidateTier: string,
          tierShifted: boolean
        }
      ]
    }
  ]
}
```

---

## 24. Historical Dataset Loader

File: `src/services/simulation/cohortSimulationService.js`

### 24.1 User-ID Normalization & Cohort Identity Contract
Before historical querying, dataset loading, `userCount` calculation, user-cohort fingerprinting, and simulation fingerprinting, user IDs are normalized exactly once at the boundary:

```javascript
const normalizeUserIds = userIds =>
  [...new Set(
    (userIds || [])
      .map(userId => String(userId).trim())
      .filter(userId => userId.length > 0)
  )].sort((a, b) => a.localeCompare(b));
```

- The normalized array is the canonical cohort identity.
- Whitespace-only strings and empty strings are removed.
- Duplicate IDs are deduplicated before querying.
- Cohort input order is non-semantic: caller permutations such as `["userB", "userA"]`, `["userA", "userB"]`, and `["userA", "userB", "userA"]` all normalize to `["userA", "userB"]`.
- For historical modes (`OBSERVED_ACTION_SENSITIVITY`, `HISTORICAL_AGGREGATION`, `COMBINED`), enforce:
  $$1 \le \text{normalizedUserIds.length} \le 50$$
  If empty, throws `DATASET_LIMIT_EXCEEDED` (`EMPTY_USER_LIST`). If $> 50$, throws `DATASET_LIMIT_EXCEEDED` (`TOO_MANY_USERS`).

### 24.2 Query Contract & Deduplication
- `loadHistoricalCohortRecords()` must receive normalized user IDs:
  ```javascript
  loadHistoricalCohortRecords({
    userIds: normalizedUserIds,
    windowDays,
    referenceNow
  })
  ```
- Queries strictly `PrescriptionExecutionRecord`. Zero reads to models 1–13.
- Exactly one query maximum per normalized unique user. Duplicate caller IDs must never result in duplicate MongoDB queries.
- Derives query start: `windowStartUtc = new Date(referenceNow.getTime() - windowDays * 86400000)`.
- For each unique user ID, uses existing compound index `{ userId: 1, issuedAt: -1 }`:

```javascript
const perUserLimit = Math.min(
  MAX_SAMPLE_RECORDS,
  Math.ceil(MAX_SAMPLE_RECORDS / normalizedUserIds.length)
);
const perUserProbeLimit = perUserLimit + 1; // +1 sentinel probe

const probe = await PrescriptionExecutionRecord.find({
  userId,
  issuedAt: {
    $gte: windowStartUtc,
    $lte: referenceNow
  }
})
.sort({ issuedAt: -1, _id: 1 })
.limit(perUserProbeLimit)
.lean();

const userHasMore = probe.length > perUserLimit;
const selected = probe.slice(0, perUserLimit);
```

### 24.3 Deterministic Merge, Truncation & Exhaustiveness
- `sourceWasTruncated = anyUserHasMore === true;`
- Merge all selected records across users and sort deterministically:
  $$\text{Sort Order}: \quad \text{issuedAt DESC} \implies \text{userId ASC} \implies \_id \text{ ASC}$$
- Truncate array to `MAX_SAMPLE_RECORDS = 1000`.
- Final truncation flags:
  ```javascript
  const isTruncated = sourceWasTruncated || mergedBeforeGlobalCap.length > MAX_SAMPLE_RECORDS;
  const isExhaustive = !isTruncated;
  ```
- Include both `isTruncated` and `isExhaustive` in `datasetSummary`.

### 24.4 Minimum Dataset Gate by Mode
- `OBSERVED_ACTION_SENSITIVITY` (CLI alias: `MODE_A`): requires evaluated records $\ge 5$; otherwise throws `INSUFFICIENT_HISTORICAL_DATA` (`LESS_THAN_MINIMUM_RECORDS`).
- `HISTORICAL_AGGREGATION`: requires evaluated records $\ge 5$; otherwise throws `INSUFFICIENT_HISTORICAL_DATA` (`LESS_THAN_MINIMUM_RECORDS`).
- `COMBINED`: requires evaluated records $\ge 5$; otherwise throws `INSUFFICIENT_HISTORICAL_DATA` (`LESS_THAN_MINIMUM_RECORDS`).
- `ARCHETYPE_POLICY_COMPARISON` (CLI alias: `MODE_B`): requires 0 historical records. Can execute with `userIds = []` and historical dataset absent.

---

## 25. Historical Outcome Aggregation & Effective Expiry

File: `src/services/simulation/adherenceOutcomeAggregationService.js`

### 25.1 Effective Expiry Resolution
Phase 10 authoritative semantics treat **BOTH non-terminal states** (`issued` and `active`) as effectively expired if `referenceNow >= record.expiresAt`. Terminal states are never reinterpreted:

```javascript
const resolveEffectiveStatus = (record, referenceNow) => {
  if (
    (record.status === 'issued' || record.status === 'active') &&
    referenceNow >= record.expiresAt
  ) {
    return 'expired';
  }
  return record.status;
};
```

The return type of `resolveEffectiveStatus(record, referenceNow)` is strictly:

```text
'issued' | 'active' | 'completed' | 'abandoned' | 'superseded' | 'expired'
```

### 25.2 Execution Adherence Formula
- `resolvedCount = completed + abandoned + superseded + effectivelyExpired`.
- `executionAdherenceRate = resolvedCount > 0 ? (completed / resolvedCount) : null`.
- Persisted `issued` or `active` records that have not passed expiry remain unresolved and are excluded from the denominator.

### 25.3 Milestone Success Formula
- `milestoneEvaluatedCount`: Count of completed records where `outcomeSnapshot.targetMilestoneMet !== null`.
- `milestoneSuccessRate = milestoneEvaluatedCount > 0 ? (milestoneMetCount / milestoneEvaluatedCount) : null`.
- Prescriptions with `targetMilestoneMet === null` (e.g., unfinalized mock sessions or insufficient pacing evidence) are excluded from the milestone denominator.

### 25.4 Non-Causal Prohibition
Candidate policies must **never receive observational outcome attribution**. Reports must explicitly segregate historical observed outcomes (which belong to the baseline policy) from candidate simulated shifts.

---

## 26. Determinism & Reference Clock Contract

### 26.1 Strict Requirement & Input Boundary Normalization
- `referenceNow` is strictly required across all simulation modes.
- CLI Input: `--referenceNow=<offset-aware ISO-8601 string>` (e.g., `2026-10-09T12:00:00.000Z`, `2026-10-09T17:30:00+05:30`). Ambiguous date-only strings (`2026-10-09`) or local clock strings without timezone (`2026-10-09T12:00:00`) are rejected synchronously with `DATASET_LIMIT_EXCEEDED` (`MISSING_REFERENCE_NOW`).
- The CLI validates the string and performs the single input-boundary normalization:
  ```javascript
  const referenceNow = new Date(referenceNowInput);
  ```
- It passes this validated JavaScript `Date` instance to the programmatic service:
  ```javascript
  runPolicySimulation({
    mode,
    candidatePolicies,
    userIds,
    windowDays,
    referenceNow, // REQUIRED valid Date instance
    includeTrace
  });
  ```
- All downstream analytical services receive that exact same `Date` instance.

### 26.2 System Clock Prohibition
- No downstream service may replace or default `referenceNow` using `Date.now()`, `new Date()`, current UTC, or local system clock.
- Deterministic conversions derived from existing timestamps remain allowed and must never act as a replacement analytical clock.

### 26.3 Operational Timer Isolation
- Operational execution limits (15,000 ms) are measured strictly via monotonic `process.hrtime.bigint()`.
- The operational timer is completely isolated from analytical calculations and never enters fingerprints, scoring, candidate ranking, or analytical report fields.

---

## 27. Fingerprinting Contract

File: `src/utils/simulationFingerprint.js`

Uses `node:crypto` SHA-256 with canonical JSON serialization. Zero `node:fs` or `node:path` imports.

### 27.1 Canonical JSON Serialization (`canonicalizeJSON`)
1. **Strict Rejection**: Throws `INVALID_POLICY_DEFINITION` or serialization error on `undefined`, `function`, `symbol`, `BigInt`, `NaN`, `Infinity`, or `-Infinity`. No silent stripping.
2. **BSON ObjectId Normalization**: Instances of BSON `ObjectId` (or objects with `.toHexString()`) are converted to lowercase 24-character hex strings before hashing.
3. **Date Normalization**: Serialized via `.toISOString()`.
4. **Object Key Sorting**: Keys recursively sorted lexicographically.
5. **Array Preservation**: Array order preserved exactly.

### 27.2 Policy Fingerprint
$$\text{policyFingerprint} = \text{SHA-256}(\text{canonicalCandidatePolicyJSON})$$
Hashes the complete normalized candidate policy object.

### 27.3 Dataset Fingerprint by Mode
- **`OBSERVED_ACTION_SENSITIVITY` (CLI alias: `MODE_A`) / `HISTORICAL_AGGREGATION`**: `SHA-256(canonicalOrderedRecordsJSON)`.
- **`ARCHETYPE_POLICY_COMPARISON` (CLI alias: `MODE_B`)**: `SHA-256(canonicalJSON(SIMULATION_ARCHETYPES))`.
- **`COMBINED`**: `SHA-256(canonicalOrderedRecordsJSON)`.

### 27.4 User-Cohort Fingerprint Formula
For historical modes, the user-cohort identity is derived strictly using the normalized unique user ID array:

```javascript
const normalizedUserIds = normalizeUserIds(userIds);

const userCohortFingerprint = isModeB
  ? null
  : generateDatasetFingerprint(normalizedUserIds);
```

Equivalent mathematical definition:
$$\text{userCohortFingerprint} = \text{SHA-256}(\text{canonicalizeJSON}(\text{sorted unique trimmed userIds}))$$

- For `ARCHETYPE_POLICY_COMPARISON` (Mode B): `userCohortFingerprint = null`.
- Reuses the existing frozen `generateDatasetFingerprint()` utility (no new utility functions or export contracts).
- Default reports strictly emit `userCohortFingerprint` and `userCount`; raw user IDs are never leaked to default report artifacts.

### 27.5 Simulation Fingerprint
Hashes a structured canonical metadata object containing all output-affecting parameters, using the canonical internal mode:

```javascript
const isModeB = mode === SIMULATION_MODES.MODE_B;
const isModeA = mode === SIMULATION_MODES.MODE_A;
const isHistoricalAggregation = mode === SIMULATION_MODES.HISTORICAL_AGGREGATION;

const simulationMetadata = {
  engineVersion: SIMULATION_ENGINE_VERSION,
  mode, // Canonical SIMULATION_MODES value, NOT raw CLI alias
  referenceNow: referenceNow.toISOString(),
  policyFingerprints: candidatePolicyFingerprints.slice().sort(), // Sorted ASC
  datasetFingerprint,
  windowDays: isModeB ? null : windowDays,
  includeTrace,
  historicalDatasetMode: isModeB ? 'NONE' : 'INDEXED_COHORT',
  userCohortFingerprint: isModeB ? null : userCohortFingerprint,
  archetypeFingerprint: (isModeA || isHistoricalAggregation)
    ? null
    : generateDatasetFingerprint(SIMULATION_ARCHETYPES)
};

const simulationFingerprint = crypto.createHash('sha256').update(canonicalizeJSON(simulationMetadata)).digest('hex');
```

---

## 28. Report Artifact Schema & Byte-Deterministic Serialization

File: `scripts/simulatePolicy.js` writes report to `reports/simulations/sim_<simulationFingerprint>.json`.

### 28.1 Canonical Report Byte Contract
Report serialization uses the already-frozen canonical JSON serializer:

```javascript
const artifactBytes = canonicalizeJSON(report) + '\n';
```

`canonicalizeJSON()` must:
- preserve finite JavaScript number values exactly according to JSON numeric serialization semantics (it does NOT perform numeric score rounding; full IEEE-754 precision is retained)
- normalize Date to ISO string
- normalize ObjectId to lowercase hex
- sort object keys lexicographically
- preserve array order
- reject unsupported values (`undefined`, `function`, `symbol`, `BigInt`, `NaN`, `Infinity`, `-Infinity`)

Emits compact canonical JSON followed by exactly one trailing newline (`\n`).
The same report object with identical normalized inputs produces bit-for-bit identical bytes.

### 28.2 Identical Artifact Reuse Contract
- If target artifact file already exists:
  - Read existing file bytes.
  - Verify existing bytes strictly equal `artifactBytes`.
  - If equal: do not rewrite; return `reusedArtifact: true`.
  - If bytes differ: throw `SIMULATION_EXECUTION_FAILED` with reason `FINGERPRINT_CONTENT_MISMATCH`. Never overwrite differing content with the same fingerprint.

### 28.3 Top-Level Report Schema & Canonical `report.mode`
The report strictly stores the canonical internal mode (never raw CLI aliases):
- CLI `--mode=MODE_A` $\implies$ `report.mode = "OBSERVED_ACTION_SENSITIVITY"`
- CLI `--mode=MODE_B` $\implies$ `report.mode = "ARCHETYPE_POLICY_COMPARISON"`
- CLI `--mode=HISTORICAL_AGGREGATION` $\implies$ `report.mode = "HISTORICAL_AGGREGATION"`
- CLI `--mode=COMBINED` $\implies$ `report.mode = "COMBINED"`

```javascript
{
  engineVersion: "v1",
  mode: "COMBINED", // Canonical internal mode string
  referenceNow: "2026-10-09T00:00:00.000Z",

  simulationFingerprint: "a1b2c3...",
  datasetFingerprint: "d4e5f6...",

  baselinePolicy: { /* Full canonical baseline policy */ },
  candidatePolicies: [
    {
      policyFingerprint: "p1q2...",
      policyDefinition: { /* Full candidate policy */ },
      changedDimensions: [ /* 13-dimension delta */ ]
    }
  ],

  datasetSummary: {
    userCount: 5,
    recordCount: 150,
    windowDays: 30,
    windowStart: "2026-09-09T00:00:00.000Z",
    windowEnd: "2026-10-09T00:00:00.000Z",
    isTruncated: false,
    isExhaustive: true
  },

  historicalSensitivityAnalysis: { /* Mode A sanitized aggregate results */ },
  syntheticArchetypeAnalysis: { /* Mode B results */ },
  adherenceOutcomeSummary: { /* Descriptive historical outcomes */ },

  bounds: {
    maxUsers: 50,
    maxSampleRecords: 1000,
    maxWindowDays: 90,
    maxExecutionTimeMs: 15000
  },

  trace: null, // Populated ONLY if includeTrace: true
  warnings: [],
  nonCausalNotice: "Phase 10 records are observational. Candidate-policy simulations do not establish causal treatment effects or historical counterfactual student outcomes."
}
```

### 28.4 Mode-Specific Field Nullability
- **`OBSERVED_ACTION_SENSITIVITY`** (CLI alias: `MODE_A`): `historicalSensitivityAnalysis` = object, `syntheticArchetypeAnalysis` = null, `adherenceOutcomeSummary` = null, `datasetSummary` = object.
- **`ARCHETYPE_POLICY_COMPARISON`** (CLI alias: `MODE_B`): `historicalSensitivityAnalysis` = null, `syntheticArchetypeAnalysis` = object, `adherenceOutcomeSummary` = null, `datasetSummary` = null.
- **`HISTORICAL_AGGREGATION`**: `historicalSensitivityAnalysis` = null, `syntheticArchetypeAnalysis` = null, `adherenceOutcomeSummary` = object, `datasetSummary` = object, `candidatePolicies` = [].
- **`COMBINED`**: all three analysis objects populated, `datasetSummary` = object.

---

## 29. Privacy & Trace Projection

- **Default Setting**: `includeTrace = false`.
- **Default Report Projection**: Default reports strictly omit `userId`, `prescriptionId`, student names, emails, and IP addresses. `historicalSensitivityAnalysis` contains sanitized statistical distributions (score shifts, tier migration matrices, support percentages).
- **Trace Property**:
  - `includeTrace: false` $\implies$ `report.trace = null`.
  - `includeTrace: true` $\implies$ `report.trace = { historicalSensitivityRecords: [ ...sanitizedTraceRecords ] }`.
  - Trace records may contain `prescriptionId`, `actionType`, `actionSubtype`, `support`, and `precision`, but **NEVER** `userId`, student email, name, or password.

---

## 30. CLI Contract & Input Matrix

File: `scripts/simulatePolicy.js`

### 30.1 CLI Mode Alias Normalization
The CLI accepts exactly four external mode aliases via `--mode`:
- `MODE_A`
- `MODE_B`
- `HISTORICAL_AGGREGATION`
- `COMBINED`

The CLI MUST immediately normalize the external CLI alias at the input boundary into its canonical internal mode:
```javascript
const canonicalMode = SIMULATION_MODES[cliMode];
if (!canonicalMode) {
  throw new Error(`Invalid CLI simulation mode: ${cliMode}`);
}
```

Mapping:
| External CLI `--mode` | Canonical Internal `SIMULATION_MODES` Value | Semantics |
| :--- | :--- | :--- |
| `MODE_A` | `SIMULATION_MODES.MODE_A` (`"OBSERVED_ACTION_SENSITIVITY"`) | Historical replay sensitivity analysis |
| `MODE_B` | `SIMULATION_MODES.MODE_B` (`"ARCHETYPE_POLICY_COMPARISON"`) | Synthetic archetype pure comparator simulation |
| `HISTORICAL_AGGREGATION` | `SIMULATION_MODES.HISTORICAL_AGGREGATION` (`"HISTORICAL_AGGREGATION"`) | Historical cohort descriptive adherence aggregation |
| `COMBINED` | `SIMULATION_MODES.COMBINED` (`"COMBINED"`) | Unified multi-analysis run |

`runPolicySimulation()` receives **ONLY** the canonical internal value:
```javascript
runPolicySimulation({
  mode: canonicalMode, // canonical SIMULATION_MODES value, NOT raw CLI alias
  candidatePolicies,
  userIds,
  windowDays,
  referenceNow,
  includeTrace
});
```

Raw CLI aliases (`MODE_A`, `MODE_B`) never leak into internal orchestration services, fingerprint calculations, or report objects.

### 30.2 Normative CLI Mode Input Matrix

| CLI Mode Alias | Canonical Internal Mode | `referenceNow` | `candidatePolicies` | `userIds` | `windowDays` |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`MODE_A`** | `OBSERVED_ACTION_SENSITIVITY` | **REQUIRED** (offset-aware ISO-8601) | **REQUIRED** (1..5 JSON file paths) | **REQUIRED** (1..50 user IDs) | **OPTIONAL** (default: 30) |
| **`MODE_B`** | `ARCHETYPE_POLICY_COMPARISON` | **REQUIRED** (offset-aware ISO-8601) | **REQUIRED** (1..5 JSON file paths) | **IGNORED $\to$ `[]`** | **IGNORED $\to$ `null`** |
| **`HISTORICAL_AGGREGATION`** | `HISTORICAL_AGGREGATION` | **REQUIRED** (offset-aware ISO-8601) | **IGNORED $\to$ `[]`** | **REQUIRED** (1..50 user IDs) | **OPTIONAL** (default: 30) |
| **`COMBINED`** | `COMBINED` | **REQUIRED** (offset-aware ISO-8601) | **REQUIRED** (1..5 JSON file paths) | **REQUIRED** (1..50 user IDs) | **OPTIONAL** (default: 30) |

### 30.3 Normalization of Irrelevant Arguments
- For `MODE_B` (`ARCHETYPE_POLICY_COMPARISON`): If `--userId` or `--userIds` is passed, it is accepted without error but normalized to `[]`. If `--windowDays` is passed, it is normalized to `null`. Zero historical database queries are executed.
- For `HISTORICAL_AGGREGATION`: If `--candidatePolicy` or `--candidatePolicies` is passed, it is accepted without error but normalized to `[]` and `policyFingerprints = []`.
- Ignored arguments do not affect `simulationFingerprint`, do not affect report bytes, do not trigger DB reads, and do not appear as effective simulation inputs.

### 30.3 CLI Syntax
```bash
node scripts/simulatePolicy.js \
  --mode=<MODE> \
  --referenceNow=<ISO-8601> \
  [--candidatePolicies=<path1.json,path2.json,...>] \
  [--candidatePolicy=<path.json>] \
  [--userId=<ID> | --userIds=<ID1,ID2,...>] \
  [--windowDays=<DAYS>] \
  [--outputDir=<DIR>] \
  [--includeTrace=<BOOLEAN>]
```

### 30.4 Arguments & Options
- `--mode`: **REQUIRED**. Accepted values: `MODE_A`, `MODE_B`, `HISTORICAL_AGGREGATION`, `COMBINED`.
- `--referenceNow`: **REQUIRED**. Offset-aware ISO-8601 timestamp string (e.g., `2026-10-09T00:00:00.000Z`). Missing or date-only format throws error.
- `--candidatePolicies`: Comma-separated list of 1 to 5 file paths to candidate JSON files. Required for `MODE_A`, `MODE_B`, and `COMBINED`.
- `--candidatePolicy`: Singular alias for exactly one file path. Mutually exclusive with `--candidatePolicies`.
- `--userId` / `--userIds`: 1 to 50 user IDs. Required for `MODE_A`, `HISTORICAL_AGGREGATION`, and `COMBINED`.
- `--windowDays`: Integer $1 \le \text{windowDays} \le 90$ (default: 30).
- `--outputDir`: Output directory path (default: `reports/simulations/`).
- `--includeTrace`: `true` or `false` (default: `false`).

### 30.5 Exit Codes
- `0`: Simulation completed successfully.
- `1`: Validation error (`INVALID_POLICY_DEFINITION`, `DATASET_LIMIT_EXCEEDED`, missing CLI flags).
- `2`: Insufficient historical data (`INSUFFICIENT_HISTORICAL_DATA`).
- `3`: Simulation execution failure or circuit breaker tripped (`SIMULATION_EXECUTION_FAILED`).

---

## 31. Domain Error Taxonomy

| Error Code | Primary Reason Codes | Trigger Condition |
| :--- | :--- | :--- |
| `INVALID_POLICY_DEFINITION` | `CANDIDATE_POLICY_MATCHES_BASELINE`, `INVALID_SIMULATION_FLAG`, `INVALID_OBJECT_SHAPE`, `PROHIBITED_ELIGIBILITY_MUTATION`, `UNKNOWN_PROPERTY`, `MISSING_REQUIRED_KEY`, `NON_NUMERIC_VALUE`, `VALUE_OUT_OF_BOUNDS`, `THRESHOLD_ORDER_VIOLATION` | Candidate policy schema or boundary violation |
| `INSUFFICIENT_HISTORICAL_DATA` | `LESS_THAN_MINIMUM_RECORDS` | Fewer than 5 historical records found for user cohort in Mode A / Aggregation / Combined |
| `DATASET_LIMIT_EXCEEDED` | `TOO_MANY_USERS`, `EMPTY_USER_LIST`, `INVALID_WINDOW_DAYS`, `TOO_MANY_CANDIDATE_POLICIES`, `EMPTY_CANDIDATE_POLICIES`, `MISSING_REFERENCE_NOW` | Request violates hard safety bounds or omitted required clock |
| `UNSUPPORTED_REPLAY_PARAMETER` | `DIMENSION_UNSUPPORTED_FOR_ACTION` | Exceptional internal integrity violation: caller attempts raw calculation on unsupported dimension |
| `HISTORICAL_INPUT_UNAVAILABLE` | `MISSING_RAW_MASTERY`, `MISSING_GOAL_ALIGNMENT`, `MISSING_DEADLINE_BONUS` | Exceptional internal integrity violation: expected snapshot fields missing on EXACT branch |
| `SIMULATION_EXECUTION_FAILED` | `CIRCUIT_BREAKER_TRIGGERED`, `FINGERPRINT_CONTENT_MISMATCH`, `UNEXPECTED_ENGINE_FAILURE` | CPU budget exceeded (>15,000 ms), existing artifact bytes mismatch, or unhandled failure |

---

## 32. Performance Bounds & Operational Circuit Breaker

### 32.1 Hard Safety Bounds
- `MAX_USERS_PER_RUN = 50`
- `MAX_SAMPLE_RECORDS = 1000`
- `MAX_WINDOW_DAYS = 90`
- `DEFAULT_WINDOW_DAYS = 30`
- `MAX_CANDIDATE_POLICIES = 5`
- `MAX_EXECUTION_TIME_MS = 15000`

### 32.2 Operational Monotonic Circuit Breaker
- Evaluated using `process.hrtime.bigint()`.
- Cooperative deadline checks at:
  1. Each user iteration in `cohortSimulationService`.
  2. Each record batch in `observedActionSensitivityService`.
  3. Each archetype evaluation in `syntheticPolicyComparisonService`.
- If elapsed time exceeds 15,000 ms, the engine immediately throws `SIMULATION_EXECUTION_FAILED` with reason `CIRCUIT_BREAKER_TRIGGERED`.

---

## 33. Cross-Phase Isolation

File: `tests/simulation/phase11CrossPhaseIsolation.test.js`

1. **Zero Database Writes**: Static and dynamic assertions prove 0 calls to write methods across all 14 models.
2. **Zero Model Registration**: Mongoose models count remains strictly 14.
3. **Zero HTTP Routes**: Express route count remains unchanged; `src/app.js` unmodified.
4. **Zero Phase 1–8 Production Dependencies**: `src/config/simulationArchetypes.js` imports zero Phase 1–8 modules (including `patternRegistryService`).
5. **Zero Phase 7 Imports**: No imports of LLM providers or adapters.

---

## 34. Complete Export Signatures Contract

Every Phase 11 production service exports strictly frozen function names and signatures:

### 34.1 `policyValidationService.js`
- `validateCandidatePolicy(candidatePolicy)`: Pure function. Returns frozen normalized candidate policy or throws `INVALID_POLICY_DEFINITION`.
- `diffPolicy(baselinePolicy, candidatePolicy)`: Pure function. Returns `{ changedDimensions: string[], deltas: Record<string, number> }`.
- `dimensionAffects(actionType, actionSubtype, dimension)`: Pure function. Returns `boolean`.

### 34.2 `observedActionSensitivityService.js`
- `evaluateRecordSensitivity({ record, candidatePolicy, policyDelta })`: Pure function. Returns Internal Mode A Record Result object.
- `evaluateObservedActionSensitivity({ records, candidatePolicies })`: Pure function. Returns sanitized `historicalSensitivityAnalysis` and optional trace records.

### 34.3 `syntheticPolicyComparisonService.js`
- `calculatePureUrgencyScore(action, candidatePolicy)`: Pure mathematical function. Returns `{ urgencyScore, priorityTier, baseWeight, masteryDeficit, goalImpact, temporalUrgency }`.
- `simulateArchetype({ archetype, candidatePolicy })`: Pure function. Returns candidate simulation result for one archetype.
- `compareSyntheticArchetypes({ archetypes, candidatePolicies })`: Pure function. Returns `syntheticArchetypeAnalysis` across all archetypes.

### 34.4 `adherenceOutcomeAggregationService.js`
- `resolveEffectiveStatus(record, referenceNow)`: Pure function. Returns `'issued' | 'active' | 'completed' | 'abandoned' | 'superseded' | 'expired'`.
- `aggregateAdherenceOutcomes({ records, referenceNow })`: Pure function. Returns `adherenceOutcomeSummary` object.

### 34.5 `cohortSimulationService.js`
- `loadHistoricalCohortRecords({ userIds, windowDays, referenceNow })`: Async function. Receives normalized unique user IDs (`userIds = normalizeUserIds(rawUserIds)` with $1 \le \text{length} \le 50$). Performs bounded queries to `PrescriptionExecutionRecord` (maximum one query per normalized unique user). Returns `{ records: object[], isTruncated: boolean, isExhaustive: boolean }`.

### 34.6 `policySimulationService.js`
- `runPolicySimulation({ mode, candidatePolicies, userIds, windowDays, referenceNow, includeTrace })`: Async function. Coordinates loading, validation, simulation, and report assembly. Parameter `mode` must be a canonical `SIMULATION_MODES` value (`'OBSERVED_ACTION_SENSITIVITY'`, `'ARCHETYPE_POLICY_COMPARISON'`, `'HISTORICAL_AGGREGATION'`, `'COMBINED'`), NOT a raw CLI alias. Accepts a valid `Date` instance for `referenceNow`. Returns in-memory report object. Does NOT perform filesystem I/O.

### 34.7 `simulationFingerprint.js`
- `canonicalizeJSON(value)`: Pure function. Returns compact canonical JSON string or throws on invalid types.
- `generatePolicyFingerprint(policy)`: Pure function. Returns SHA-256 hex string.
- `generateDatasetFingerprint(dataset)`: Pure function. Returns SHA-256 hex string.
- `generateSimulationFingerprint(metadata)`: Pure function. Returns SHA-256 hex string.

---

## 35. Future Test Contract

Phase 11 implementation must be verified by **exactly six dedicated test suites**:

| # | Test Suite Path | Primary Target Capabilities Tested |
| :-: | :--- | :--- |
| 1 | `tests/simulation/policyValidation.test.js` | Schema validation, prohibited mutation reason precedence, required `referenceNow` at boundary, candidate policy fingerprint ASC sorting, single/plural policy flag validation, baseline duplicate rejection. |
| 2 | `tests/simulation/observedActionSensitivity.test.js` | Mode A support precedence (`UNSUPPORTED > PARTIAL > EXACT`), historical `daysOverdue` reconstruction using `record.issuedAt`, strict nullability (`candidatePriorityTier: null`, `tierShiftDetected: null`), shifted rounding interval audit, expected `UNSUPPORTED` returns structured result without throwing. |
| 3 | `tests/simulation/syntheticPolicyComparison.test.js` | Mode B pure scoring against Phase 9 raw logic, static archetype vectors (0 runtime dependencies), `patternIndex: null` to `Infinity` comparator mapping, 7-tier ranking comparator parity, analytical score precision (unrounded IEEE-754 scores with $>2$ decimal places preserved without implicit rounding). |
| 4 | `tests/simulation/adherenceOutcomeAggregation.test.js` | Effective expiry for both `issued` and `active` records, terminal state immutability, `resolvedCount` adherence denominator, milestone denominator exclusion for null milestones, zero candidate attribution. |
| 5 | `tests/simulation/benchmarkCohortSimulation.test.js` | Per-user `+1` sentinel probe, `isTruncated: true` when single user has more records, `isExhaustive: false`, minimum historical record gate ($\ge 5$) for Mode A/Aggregation/Combined, Mode B execution with 0 records, user ID deduplication before querying, removal of blank/whitespace IDs, 1..50 cohort limit enforced on normalized count, query count $\le$ normalized unique user count. |
| 6 | `tests/simulation/phase11CrossPhaseIsolation.test.js` | Zero writes across 14 collections, zero model registration (14 models), zero HTTP routes (`src/app.js` untouched), zero runtime import of `patternRegistryService`, byte-deterministic report serialization (`canonicalizeJSON(report) + '\n'`), identical artifact reuse, fingerprint mismatch rejection, `includeTrace` fingerprint divergence, candidate-policy order invariance, `MODE_B` input normalization, `HISTORICAL_AGGREGATION` candidate-policy normalization, CLI mode alias normalization (`MODE_A` $\to$ `OBSERVED_ACTION_SENSITIVITY`, `MODE_B` $\to$ `ARCHETYPE_POLICY_COMPARISON`), canonical `report.mode` storage, user-cohort order and duplicate invariance (`['userB', 'userA']` vs `['userA', 'userB', 'userA']`). |

### 35.1 Mandatory Cross-Phase Isolation & Determinism Assertions (`tests/simulation/phase11CrossPhaseIsolation.test.js`)

Future implementation must explicitly implement tests proving all of the following nine assertions:

1. **Identical Normalized Inputs Produce Identical Report Bytes**:
   Given identical fully normalized simulation inputs:
   - same mode
   - same `referenceNow`
   - same candidate policies
   - same normalized policy ordering
   - same dataset
   - same normalized user cohort
   - same `windowDays`
   - same `includeTrace`
   - same engine version
   The generated `simulationFingerprint`, artifact filename (`sim_<simulationFingerprint>.json`), and artifact bytes (`canonicalizeJSON(report) + '\n'`) must be strictly identical.

2. **`includeTrace` Participates in Simulation Identity**:
   Given all other normalized inputs are identical:
   - `includeTrace: false` versus `includeTrace: true`
   must produce:
   - different `simulationFingerprint`
   - different report bytes
   because `includeTrace` is explicitly part of the frozen simulation fingerprint metadata and alters the report projection.
   Tests must assert:
   ```javascript
   fingerprint(false) !== fingerprint(true)
   ```
   Trace projection changes are never permitted to reuse the same simulation fingerprint.

3. **Candidate-Policy Input Order is Non-Semantic**:
   Given the same set of candidate policy definitions supplied in different caller order (e.g., `[A, B, C]`, `[C, A, B]`, `[B, C, A]`), the implementation must canonicalize execution and report ordering using `policyFingerprint ASC` and prove:
   - same canonical `candidatePolicies` ordering
   - same `policyFingerprint` sequence
   - same `simulationFingerprint`
   - same report bytes
   Caller ordering permutations must never affect simulation identity or output bytes.

4. **Existing Identical Artifact Reuse**:
   When `reports/simulations/sim_<simulationFingerprint>.json` already exists and its bytes exactly match the newly generated artifact bytes:
   - `reusedArtifact === true`
   - zero filesystem rewrite must occur.

5. **Fingerprint-Content Mismatch Rejection**:
   When the target filename has the same `simulationFingerprint` but the existing bytes differ from the newly generated bytes:
   - The engine must throw exactly `SIMULATION_EXECUTION_FAILED` with reason `FINGERPRINT_CONTENT_MISMATCH`.
   - The conflicting artifact must never be overwritten.

6. **`MODE_B` Ignored Arguments are Truly Non-Semantic**:
   For `MODE_B`, supplying `userIds` or `windowDays` must normalize to:
   ```javascript
   userIds = [];
   windowDays = null;
   ```
   and tests must prove:
   - zero historical `PrescriptionExecutionRecord` database queries
   - same normalized effective inputs as omission
   - same `simulationFingerprint` as omission
   - same report bytes as omission.

7. **`HISTORICAL_AGGREGATION` Candidate Policies are Truly Non-Semantic**:
   For `HISTORICAL_AGGREGATION`, supplying either `--candidatePolicy` or `--candidatePolicies` must normalize to:
   ```javascript
   candidatePolicies = [];
   policyFingerprints = [];
   ```
   and tests must prove:
   - same normalized effective inputs as omission
   - same `simulationFingerprint` as omission
   - same report bytes as omission.
   Candidate policy files supplied to this mode must not influence analytical output.

8. **CLI Mode Alias Normalization & Canonical `report.mode` Storage**:
   Tests must explicitly prove:
   - CLI `MODE_A` normalizes to `SIMULATION_MODES.MODE_A` (`OBSERVED_ACTION_SENSITIVITY`).
   - CLI `MODE_B` normalizes to `SIMULATION_MODES.MODE_B` (`ARCHETYPE_POLICY_COMPARISON`).
   - CLI `HISTORICAL_AGGREGATION` normalizes to `SIMULATION_MODES.HISTORICAL_AGGREGATION` (`HISTORICAL_AGGREGATION`).
   - CLI `COMBINED` normalizes to `SIMULATION_MODES.COMBINED` (`COMBINED`).
   - Internal Mode B branch strictly uses `mode === SIMULATION_MODES.MODE_B`.
   - Different CLI aliases can never survive past input boundary normalization.
   - `report.mode` stores the canonical internal mode string (e.g., `"OBSERVED_ACTION_SENSITIVITY"`).
   - `simulationFingerprint` hashes this canonical internal mode string.

9. **User-Cohort Order and Duplicate Invariance**:
   Inputs representing the same cohort with different ordering or duplicate elements:
   ```javascript
   ["userB", "userA"]
   ["userA", "userB"]
   ["userA", "userB", "userA"]
   ```
   must normalize via `normalizeUserIds` to the identical canonical cohort `["userA", "userB"]` and prove:
   - exactly 2 database queries executed (one query per unique user)
   - identical query count
   - identical merged historical dataset
   - identical `userCohortFingerprint`
   - identical `simulationFingerprint`
   - identical report bytes.

### 35.2 User Cohort Deduplication & Limit Enforcement Assertions (`tests/simulation/benchmarkCohortSimulation.test.js`)
Tests must explicitly prove:
- Duplicate user IDs passed in `userIds` are deduplicated before querying.
- Blank/whitespace user IDs are filtered out during normalization.
- Normalized unique user count is strictly used for the 1..50 bounds enforcement ($1 \le \text{normalizedUserIds.length} \le 50$).
- Total MongoDB query count $\le$ normalized unique user count (duplicate caller IDs never issue redundant queries).

### 35.3 Analytical Score Precision Assertions (`tests/simulation/syntheticPolicyComparison.test.js`)
Tests must explicitly prove:
- A synthetic raw score containing more than two decimal places (e.g., `83.33333333333333`) is NOT implicitly rounded in the Phase 11 analytical result or report object before serialization.
- `canonicalizeJSON(report)` serializes the unrounded finite JavaScript number exactly according to standard JSON numeric semantics.
- Full IEEE-754 precision is preserved throughout scoring, ranking, and artifact emission.


---

## 36. Implementation File Matrix

| File Path | Type | Responsibility | Exports | Allowed Production Dependencies |
| :--- | :--- | :--- | :--- | :--- |
| `src/config/simulationConfig.js` | Config | Frozen bounds, enums, baseline policy | `simulationConfig`, `SIMULATION_BOUNDS`, `BASELINE_POLICY`, `SIMULATION_ENGINE_VERSION` | None (pure config) |
| `src/config/simulationArchetypes.js` | Config | Six canonical synthetic archetypes | `SIMULATION_ARCHETYPES` | None (pure static config) |
| `src/services/simulation/policyValidationService.js` | Service | Validates candidate policies, computes deltas | `validateCandidatePolicy`, `diffPolicy`, `dimensionAffects` | `simulationConfig.js` |
| `src/services/simulation/observedActionSensitivityService.js` | Service | Mode A sensitivity evaluation over historical records | `evaluateObservedActionSensitivity`, `evaluateRecordSensitivity` | `simulationConfig.js`, `policyValidationService.js`, `orchestrationUtils.js` |
| `src/services/simulation/syntheticPolicyComparisonService.js` | Service | Mode B archetype simulation and comparator ranking | `compareSyntheticArchetypes`, `simulateArchetype`, `calculatePureUrgencyScore` | `simulationConfig.js`, `simulationArchetypes.js` |
| `src/services/simulation/adherenceOutcomeAggregationService.js` | Service | Descriptive historical outcome aggregation | `aggregateAdherenceOutcomes`, `resolveEffectiveStatus` | `simulationConfig.js` |
| `src/services/simulation/cohortSimulationService.js` | Service | Bounded querying of PrescriptionExecutionRecord | `loadHistoricalCohortRecords` | `PrescriptionExecutionRecord`, `simulationConfig.js` |
| `src/services/simulation/policySimulationService.js` | Service | Top-level simulation orchestrator | `runPolicySimulation` | All Phase 11 simulation services & `simulationFingerprint.js` |
| `src/utils/simulationFingerprint.js` | Utility | SHA-256 fingerprinting & canonical JSON serialization | `generatePolicyFingerprint`, `generateDatasetFingerprint`, `generateSimulationFingerprint`, `canonicalizeJSON` | `node:crypto` only |
| `scripts/simulatePolicy.js` | CLI | Offline execution CLI script & artifact file writer | Executable script | `policySimulationService.js`, `simulationConfig.js`, `simulationFingerprint.js`, `node:fs`, `node:path` |

---

## 37. Acceptance Gate

```text
================================================================================
PHASE 11 PRODUCTION ACCEPTANCE CRITERIA
================================================================================
1. All 72 baseline suites and 936 baseline tests continue passing.
2. Exactly 6 new Phase 11 test suites pass (Total: 78 suites).
3. 14 Mongoose models remain registered (0 new models).
4. 14 MongoDB collections remain in database (0 new collections).
5. 0 HTTP routes registered; src/app.js unmodified.
6. referenceNow is strictly required across all modes; zero system-clock fallback.
7. simulationArchetypes.js has 0 runtime dependencies (0 Phase 1–8 imports).
8. Effective expiry correctly resolves both issued and active states when referenceNow >= expiresAt.
9. Cohort loading uses +1 sentinel probe; isTruncated and isExhaustive are truthful.
10. Mode A / Aggregation / Combined require >= 5 records; Mode B requires 0 records.
11. Patternless actions use patternIndex: null in vectors and derive Infinity in comparator.
12. Identical report runs reuse existing artifact without rewriting; byte mismatch throws error.
13. Default report projections expose 0 student PII or prescription IDs.
14. Phase 2 verification passes: 12,000 questions, 24 topics, 278 patterns, 410 edges, 0 cycles.
15. Content integrity passes: 12,000 / 12,000 SHA-256 matches.
================================================================================
```
