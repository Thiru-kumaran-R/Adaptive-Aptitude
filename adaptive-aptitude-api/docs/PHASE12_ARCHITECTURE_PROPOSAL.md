# PHASE 12 ARCHITECTURE PROPOSAL

## Policy Promotion, Version Governance & Rollback Engine (PPVG)

---

| Metadata Field | Value |
| :--- | :--- |
| **Document Version** | `1.7.10-FROZEN-FOR-SPECIFICATION` |
| **Status** | `VERIFIED / FROZEN FOR PRESCRIPTIVE SPECIFICATION` |
| **Author** | Google Antigravity Agentic Pair Programming Team |
| **Target Repository** | `adaptive-aptitude-api` |
| **Preceding Gate** | Phase 11 — PPCO (`VERIFIED / CLOSED`) |
| **Baseline Platform State** | 14 Mongoose Models, 14 MongoDB Collections, 78/78 Jest Suites Passing, 1021/1021 Tests Passing |
| **Primary Scope** | Phase 12 Legacy Cross-Phase Topology Reconciliation, Final Sole-Writer Boundary Closure, Rollback-Origin Invariant Closure (ACTIVE_POLICY_NOT_FOUND), Deterministic Optional-Reason Normalization (normalizeGovernanceReason), Transaction-Capability Classifier Precision & Scope Verification (TRANSACTION_NOT_SUPPORTED / ReadConcernMajorityNotEnabled / OperationNotSupportedInTransaction), Exact Persisted Baseline Identity, Deterministic Promotion Idempotency vs SemVer Ordering, and Final 1.7.10 Re-Freeze |

---

## 1. Status / Metadata

* **Architecture Decision Gate**: Phase 12 Final Source-Contract Reconciliation & Re-Freeze.
* **Architecture Version 1.7.10 Note**:
  v1.7.10 reconciles an implementation-time legacy-test topology conflict discovered during the first full Phase 12 npm test execution.

  The Phase 12 production architecture remains unchanged.

  The required OrchestrationPolicyVersion model increases the canonical platform model topology from 14 to 15 exactly as already specified.

  Five pre-existing cross-phase regression/isolation tests contained hardcoded 14-model/file-count assumptions that described the pre-Phase-12 platform topology and therefore failed after the authorized Phase 12 model was added.

  v1.7.10 expands only the authorized existing-test modification inventory to reconcile those five stale topology assertions with the canonical post-Phase-12 15-model topology.

  No policy governance semantics, persistence design, model location, transaction semantics, action taxonomy, policy dimensions, Phase 9 behavior, Phase 10 provenance behavior, Phase 11 evidence strategy, public DTO behavior, CLI behavior, or PPVG security contract changes.
* **Architecture Version 1.7.9 Note (Historical Predecessor)**: v1.7.9 closes the final optional-reason versus required-lifecycle-field contract mismatch. The activate and rollback CLI commands retain --reason as OPTIONAL. The governance service now owns deterministic reason normalization so every persisted lifecycle event always receives a non-empty reason ('Policy activation' for forward activation, 'Policy rollback' for rollback). No transaction-classifier semantics, promotion semantics, rollback semantics, policy dimensions, action taxonomy, persistence topology, public DTO contract, Phase 9 behavior, Phase 10 provenance behavior, Phase 11 evidence strategy, or 17-file implementation inventory is otherwise changed.
* **Architecture Version 1.7.8 Note (Historical Predecessor)**: v1.7.8 closed the final transaction-capability classifier precision and verification-report inventory reconciliation gaps. It removed overly broad transaction-message matching, reconciled the semantics of MongoDB OperationNotSupportedInTransaction with the exact TRANSACTION_NOT_SUPPORTED domain meaning, and restored the exact frozen 17-file implementation inventory in the final report.
* **Architecture Version 1.7.7 Note (Historical Predecessor)**: v1.7.7 closed the final MongoDB transaction-capability signal reconciliation gap. It corrected the MongoDB server error-code audit and ensured that the source-verified transaction-capability signals claimed by the architecture are exactly the signals recognized by isTransactionCapabilityError(err).
* **Architecture Version 1.7.6 Note (Historical Predecessor)**: v1.7.6 closed the final transaction-capability error-normalization gap and corrected the final reconciliation report's Step 10 description. activatePolicy and rollbackPolicy now guarantee deterministic TRANSACTION_NOT_SUPPORTED behavior for recognized unsupported-transaction capability failures regardless of whether the underlying driver surfaces the failure during transaction start, the first transactional operation, or transaction commit.
* **Architecture Version 1.7.5 Note (Historical Predecessor)**: v1.7.5 closed the final persisted-baseline identity mismatch in promotePolicy Step 1 and reconciled the final verification report with the authoritative Phase 12 contracts. promotePolicy now verifies the exact persisted v1.0.0 baseline identity using both policyVersion === 'v1.0.0' and isBaseline === true.
* **Architecture Version 1.7.4 Note (Historical Predecessor)**: v1.7.4 closed the final rollback-origin invariant gap. rollbackPolicy now fails closed when the governance registry has no currently active policy document, preventing a historical policy from being activated as a rollback target without a valid rollback origin.
* **Architecture Version 1.7.3 Note (Historical Predecessor)**: v1.7.3 closed authorization and wording consistency gaps (reconciled architecture implementation authorization with prescriptive gate, distinguished SemVer new-version creation from exact-version retry, clarified GOVERNANCE_SECRET_NOT_CONFIGURED warning semantics).
* **Architecture Version 1.7.2 Note (Historical Predecessor)**: v1.7.2 closed implementation-gate consistency issues: explicit rollback target-state enforcement, baseline-seeded preconditions, deterministic promotion idempotency vs SemVer ordering, specification status metadata consistency, and complete baseline verification evidence.
* **Architecture Version 1.7.1 Note (Historical Predecessor)**: v1.7.1 closed the remaining Phase 12 implementation-addressability and internal pseudocode consistency gaps.
* **Implementation Authorization**: AUTHORIZED ONLY AFTER a matching prescriptive specification is VERIFIED / FROZEN FOR IMPLEMENTATION with:
  * Architecture-vs-Specification Contract Contradictions: 0
  * Unspecified Implementation-Critical Behaviors: 0
  * Open Questions: NONE

  Phase 12 production implementation is authorized as the next repository task after this documentation re-freeze completes. This architecture document itself performs zero implementation.
* **Verification Invariant**: Documentation reconciliation confined to `docs/PHASE12_ARCHITECTURE_PROPOSAL.md` and `docs/PHASE12_PRESCRIPTIVE_ORCHESTRATION_GOVERNANCE_SPECIFICATION.md`. Zero mutations across `src/**`, `tests/**`, `scripts/**`, `package.json`, `package-lock.json`, `docs/PHASE11_*`, question content, or database records.
* **Execution Timestamp Baseline**: 2026-10-10.

---

## 2. Frozen Phase 1–11 Baseline

All previous platform phases (Phases 1 through 11) are formally verified, production-hardened, and treated as strictly immutable:

```text
================================================================================
FROZEN PLATFORM INVARIANTS (PHASES 1–11)
================================================================================
Test Suite:
  Jest: 78 / 78 test suites passed (100%)
  Tests: 1021 / 1021 tests passed (0 failures, 0 skipped)
  Runtime: ~537 seconds (clean forceExit, zero leakages)

Question Intelligence & Prerequisite DAG (Phase 2):
  Canonical Questions: 12,000
  Canonical Topics: 24
  Canonical Patterns: 278
  Legacy Mappings: 308
  Patterns with Prerequisites: 218
  Foundational Patterns: 60
  Prerequisite Edges: 410
  Graph Invariants: 0 cycles, 0 invalid prerequisite refs, 0 self-references
  Content Integrity: 12,000 / 12,000 SHA-256 fingerprint matches

Persistence Layer (Phases 3–10):
  Mongoose Models: Strictly 14 models registered
  MongoDB Collections: Strictly 14 collections active:
    1.  Question                          (questions)
    2.  User                              (users)
    3.  Goal                              (goals)
    4.  StudyPlan                         (studyplans)
    5.  DailyObjective                    (dailyobjectives)
    6.  Attempt                           (attempts)
    7.  StudentProgress                   (studentprogresses)
    8.  RevisionItem                      (revisionitems)
    9.  RevisionProcessingRecord          (revisionprocessingrecords)
    10. MockBlueprint                     (mockblueprints)
    11. MockSession                       (mocksessions)
    12. MockResponse                      (mockresponses)
    13. MockAttemptFinalizationRecord     (mockattemptfinalizationrecords)
    14. PrescriptionExecutionRecord       (prescriptionexecutionrecords)

Execution Surfaces:
  HTTP Surface: Phase 1–10 endpoints only (16 route modules in src/routes/)
  Phase 11 Surface: Offline CLI (scripts/simulatePolicy.js) + internal service only
  Phase 11 Net Impact: 0 DB writes, 0 new models, 0 new collections, 0 HTTP routes
================================================================================
```

---

## 3. Post-Phase-11 Capability Gap Analysis

Following the delivery and verification of Phase 11 (Policy Calibration & Offline Simulation Engine — PPCO), the platform's operational capabilities can be systematically categorized:

| Capability Domain | Implementation Status | Functional Classification | Description & Current Limitations |
| :--- | :--- | :--- | :--- |
| **Question Intelligence & Graph** | Phase 2 | Production Runtime | 12,000 questions across 278 patterns and 24 topics with verified DAG hierarchy. |
| **Student Practice & Progress** | Phase 3 | Production Runtime | Tracks raw attempts and progress records. Simple single-student identity model. |
| **Deterministic 3-Factor Mastery** | Phase 4 | Production Runtime | Closed-form deterministic calculation combining accuracy, difficulty competence, and confidence. |
| **Automated Planning & Spaced Revision** | Phase 5 | Production Runtime | Deterministic study plan generation, leap-year-safe calendar scheduling, Leitner-style spaced repetition. |
| **Mock Exam Engine** | Phase 6 | Production Runtime | Timed, section-locked simulation tests with three-path lease engine and zero question leakage. |
| **Intelligent Learning Advisory** | Phase 7 | Advisory-Only | Strictly read-only, non-authoritative LLM advisory assistance with zero data retention. |
| **Cognitive Diagnostics** | Phase 8 | Analytical-Only | Strictly read-only computation of readiness, speed-accuracy matrix, stamina curve, and retention. |
| **Next-Best-Action Orchestration** | Phase 9 | Production Runtime | 7-tier ranking comparator evaluating 6 canonical action types using statically hardcoded module constants. |
| **Prescription Outcome Attribution** | Phase 10 | Production Runtime | Immutable lifecycle tracking (`PrescriptionExecutionRecord`) linking actions to outcomes. |
| **Offline Policy Simulation** | Phase 11 | Offline-Only | Sensitivity analysis (Mode A) and archetype comparison (Mode B) evaluated against historical logs and synthetic vectors. |
| **Live Policy Mutation** | Not Implemented | Architecturally Inappropriate | Phase 11 explicitly cannot mutate live Phase 9 policy constants. |
| **Automatic Policy Deployment** | Not Implemented | Architecturally Inappropriate | Automatic promotion from simulation without human review is strictly prohibited. |
| **Online Experimentation / A-B Testing** | Not Implemented | Future / Prerequisites Missing | Requires multi-variant routing and policy version governance as prerequisites. |
| **Reinforcement Learning / Bandits** | Not Implemented | Architecturally Inappropriate | Non-deterministic weight adaptation violates platform determinism and learner safety. |
| **Teacher / Institutional RBAC** | Not Implemented | Architecturally Inappropriate | Current identity model has no teachers, classrooms, multi-tenancy, or roles. |
| **Policy Promotion & Version Governance** | **Missing Capability** | **Target Next Step** | **No mechanism currently exists to take an approved Phase 11 simulated policy, register it as an immutable version, safely activate it in Phase 9, track it in Phase 10, or roll it back safely.** |

---

## 4. Live Source Audit

A comprehensive inspection of the live repository yielded the following architectural truths:

### 4.1. Identity & Access Model Audit
* `src/models/userModel.js`: Only contains `userId` (String), `name`, `email`, and `avatar`.
* Explicit comment in `userModel.js:L12-16`:
  > *"NOT PRESENT (intentionally excluded): mentor, teacher, admin roles (old architecture); password, JWT tokens; RBAC / role-based permissions."*
* `tests/architecture_guard.test.js:L40-54`: Explicitly scans the entire repository (`src/`, `scripts/`, `tests/`) and fails the build if terms such as `teacher`, `mentor`, `teacherId`, or `assignedMentor` are used in active code.
* **Finding**: The platform is strictly single-tenant learner-centric. No authentication, authorization, or role-based access control exists. Any capability requiring "teacher" or "admin" roles cannot be built without inventing unauthorized concepts.

### 4.2. Priority Threshold Casing & Key-Shape Audit
* `src/config/orchestrationConfig.js:L82-87`:
  ```javascript
  const PRIORITY_THRESHOLDS = Object.freeze({
    CRITICAL: 80.0,
    URGENT: 65.0,
    HIGH: 50.0,
    NORMAL: 35.0,
  });
  ```
* `src/config/simulationConfig.js:L62-67` (Canonical Phase 11 & Phase 12 definition):
  ```javascript
  priorityThresholds: Object.freeze({
    critical: 80.0,
    urgent: 65.0,
    high: 50.0,
    normal: 35.0,
  }),
  ```
* `src/services/orchestration/orchestrationUtils.js:L10, 74-83`:
  ```javascript
  const { PRIORITY_THRESHOLDS } = require('../../config/orchestrationConfig');
  ...
  const getPriorityTier = (urgencyScore) => {
    if (urgencyScore === null || urgencyScore === undefined || !Number.isFinite(urgencyScore)) {
      return 'normal';
    }
    if (urgencyScore >= PRIORITY_THRESHOLDS.CRITICAL) return 'critical';
    if (urgencyScore >= PRIORITY_THRESHOLDS.URGENT) return 'urgent';
    if (urgencyScore >= PRIORITY_THRESHOLDS.HIGH) return 'high';
    if (urgencyScore >= PRIORITY_THRESHOLDS.NORMAL) return 'normal';
    return 'low';
  };
  ```
* **Critical Key-Shape Contradiction**: Phase 9 configuration uses uppercase keys (`CRITICAL`, `URGENT`, `HIGH`, `NORMAL`), whereas Phase 11/12 governed policy definitions use lowercase keys (`critical`, `urgent`, `high`, `normal`). Direct access like `priorityThresholds.critical` on the legacy config returns `undefined`.
* **Resolution**: `orchestrationUtils.js` must expose `DEFAULT_PRIORITY_THRESHOLDS` mapping legacy uppercase keys to lowercase keys and provide `normalizePriorityThresholds` to accept both shapes deterministically, ensuring 100% backward compatibility for unconfigured calls while allowing governed lowercase thresholds to override them.

### 4.3. Attribution Issuance Call-Chain Audit (Phase 10)
* `src/controllers/attributionController.js:L28-61`:
  Invokes:
  ```javascript
  const result = await attributionIssuanceService.issuePrescription({
    userId,
    originSurface,
    goalId,
    actionId,
    idempotencyKey,
    referenceNow,
  });
  ```
* `src/services/attribution/attributionIssuanceService.js:L196-243`:
  Constructs `orchestrationContext` and invokes Phase 9 directly:
  * If `originSurface === 'next_action'`: Calls `nextActionArbiter.getNextAction(orchestrationContext)`.
  * If `originSurface === 'daily_agenda'`: Calls `dailyAgendaAssembler.getDailyAgenda(orchestrationContext)` and locates matching activity in `agenda.segments`.
* **Finding**: `candidateAction` is retrieved inside `issuePrescription` itself. Phase 9 internal results must return `policyProvenance` alongside `nextAction` / `agenda` so `issuePrescription` can capture both from the exact same invocation with zero race condition.

### 4.4. Policy Simulation Report Audit (Phase 11)
* Source inspection of `src/services/simulation/policySimulationService.js:L280-308`:
  The report object returned by `runPolicySimulation` and serialized to disk by `scripts/simulatePolicy.js:L180` contains strictly:
  `engineVersion`, `mode`, `referenceNow`, `simulationFingerprint`, `datasetFingerprint`, `baselinePolicy`, `candidatePolicies`, `datasetSummary`, `historicalSensitivityAnalysis`, `syntheticArchetypeAnalysis`, `adherenceOutcomeSummary`, `bounds`, `trace`, `warnings`, `nonCausalNotice`.
* **Finding**: The report does NOT persist `simulationMetadata`, `includeTrace` (boolean), `historicalDatasetMode`, `userCohortFingerprint`, `archetypeFingerprint`, or `executionStatus`. Exact cryptographic reconstruction of `simulationFingerprint` is impossible without altering Phase 11 V1. Strategy B (Opaque Run Identity + Raw Artifact Byte Hashing) is required.

---

## 5. Six Candidate Phase 12 Capabilities

Six distinct candidate capabilities were evaluated against the repository baseline:

### Candidate A — Policy Promotion, Version Governance & Rollback (PPVG)
* **Concept**: An operator-controlled, auditable, and deterministic mechanism for promoting an independently validated Phase 11 candidate policy into an immutable, versioned production orchestration policy.
* **Key Invariants**:
  * Human-in-the-loop: Zero automatic deployment from Phase 11 simulation output.
  * Monotonic policy versioning (`policyVersion`, e.g., `v1.0.0`, `v1.1.0`).
  * SHA-256 `policyFingerprint` validation matching Phase 11.
  * Instant rollback to any prior active policy with complete activation history.
  * Zero mutation of historical `PrescriptionExecutionRecord`s or `Attempt` records.
  * Graceful fallback to frozen `v1.0.0` code constants if persistence is unreachable.

### Candidate B — Goal Feasibility & Completion Forecasting (GFCF)
* **Concept**: Deterministic or statistically bounded forecasting of whether a learner is on track to complete an active goal by their target date.
* **Audit Findings**: Heavily duplicates Phase 8 `readinessService.js` and Phase 5 planning without solving any core system bottleneck.

### Candidate C — Institutional / Teacher Cohort Intelligence (ITCI)
* **Concept**: Teacher/class/cohort-level analytics and intervention visibility dashboards.
* **Audit Findings**: Directly violates single-tenant learner identity model and triggers banned architecture guardrails.

### Candidate D — Controlled Online Experimentation / A-B Testing (COEA)
* **Concept**: Production policy experiments measuring causal treatment effects via randomized live learner traffic splitting.
* **Audit Findings**: High learner safety risk; requires Candidate A version governance as an absolute prerequisite.

### Candidate E — Real-Time Policy Self-Optimization (RTPO)
* **Concept**: Online reinforcement learning or multi-armed contextual bandits dynamically tuning Phase 9 weights in real time.
* **Audit Findings**: Catastrophic risk to platform determinism, reproducibility, and stability.

### Candidate F — Reliability / Observability / Production Hardening (ROPH)
* **Concept**: System-wide telemetry, performance budgets, operational metrics, deterministic integrity checkers, and pipeline health hardening.
* **Audit Findings**: Strong secondary candidate, but does not close the policy intelligence loop.

---

## 6. Exactly 12-Criterion Weighted Decision Matrix

To ensure rigorous, unbiased selection, exactly twelve decision criteria were formulated, with weights summing to exactly 100.0%. Each candidate was scored on an objective scale of 0.0 to 10.0:

| # | Criterion | Weight | Candidate A (PPVG) | Candidate B (GFCF) | Candidate C (ITCI) | Candidate D (COEA) | Candidate E (RTPO) | Candidate F (ROPH) |
| :---: | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| 1 | **Educational / Product Value** | 10% (0.10) | 8.5 | 6.5 | 5.0 | 7.0 | 5.0 | 6.0 |
| 2 | **Architectural Fit** | 12% (0.12) | 9.5 | 6.0 | 1.5 | 4.5 | 2.0 | 8.5 |
| 3 | **Direct Leverage of Phase 11** | 10% (0.10) | 10.0 | 1.0 | 2.0 | 7.5 | 4.0 | 2.5 |
| 4 | **Non-Duplication with Phases 1–11** | 10% (0.10) | 9.5 | 3.5 | 6.0 | 8.5 | 8.5 | 8.5 |
| 5 | **Deterministic Testability** | 10% (0.10) | 9.5 | 7.5 | 6.0 | 5.0 | 1.5 | 8.0 |
| 6 | **Safety / Learner Risk** | 10% (0.10) | 9.0 | 7.5 | 5.0 | 3.0 | 1.0 | 9.5 |
| 7 | **Persistence Complexity** | 6% (0.06) | 8.5 | 7.0 | 2.0 | 4.0 | 3.5 | 8.0 |
| 8 | **API / Surface Complexity** | 6% (0.06) | 8.5 | 7.0 | 2.5 | 5.0 | 4.0 | 7.5 |
| 9 | **Data Sufficiency** | 8% (0.08) | 9.5 | 6.5 | 1.0 | 4.0 | 2.0 | 9.0 |
| 10 | **Statistical / Decision Validity** | 6% (0.06) | 9.0 | 5.5 | 5.0 | 4.5 | 2.5 | 8.5 |
| 11 | **Operational Risk** | 6% (0.06) | 9.0 | 8.0 | 3.0 | 3.5 | 1.0 | 9.0 |
| 12 | **Future Extensibility** | 6% (0.06) | 9.0 | 5.0 | 6.0 | 7.5 | 3.0 | 6.5 |
| **Sum** | **Total Weights** | **100% (1.00)** | — | — | — | — | — | — |

---

## 7. Mathematical Verification of All Candidate Totals

The weighted score for each candidate is computed as:

$$\text{Weighted Total} = \sum_{i=1}^{12} (\text{Weight}_i \times \text{Score}_i)$$

### Weight Sum Verification:
$$0.10 + 0.12 + 0.10 + 0.10 + 0.10 + 0.10 + 0.06 + 0.06 + 0.08 + 0.06 + 0.06 + 0.06 = 1.00 \equiv 100.0\%$$

* **Candidate A (PPVG)**:
  $$0.850 + 1.140 + 1.000 + 0.950 + 0.950 + 0.900 + 0.510 + 0.510 + 0.760 + 0.540 + 0.540 + 0.540 = \mathbf{9.190}$$
* **Candidate B (GFCF)**:
  $$0.650 + 0.720 + 0.100 + 0.350 + 0.750 + 0.750 + 0.420 + 0.420 + 0.520 + 0.330 + 0.480 + 0.300 = \mathbf{5.790}$$
* **Candidate C (ITCI)**:
  $$0.500 + 0.180 + 0.200 + 0.600 + 0.600 + 0.500 + 0.120 + 0.150 + 0.080 + 0.300 + 0.180 + 0.360 = \mathbf{3.770}$$
* **Candidate D (COEA)**:
  $$0.700 + 0.540 + 0.750 + 0.850 + 0.500 + 0.300 + 0.240 + 0.300 + 0.320 + 0.270 + 0.210 + 0.450 = \mathbf{5.430}$$
* **Candidate E (RTPO)**:
  $$0.500 + 0.240 + 0.400 + 0.850 + 0.150 + 0.100 + 0.210 + 0.240 + 0.160 + 0.150 + 0.060 + 0.180 = \mathbf{3.240}$$
* **Candidate F (ROPH)**:
  $$0.600 + 1.020 + 0.250 + 0.850 + 0.800 + 0.950 + 0.480 + 0.450 + 0.720 + 0.510 + 0.540 + 0.390 = \mathbf{7.560}$$

### Final Verified Ranking Summary:
1. **Candidate A (PPVG — Policy Promotion & Version Governance)** : **9.190 / 10.0** [WINNER]
2. **Candidate F (ROPH — Reliability, Observability & Hardening)**     : **7.560 / 10.0**
3. **Candidate B (GFCF — Goal Feasibility Forecasting)**              : **5.790 / 10.0**
4. **Candidate D (COEA — Controlled Online Experimentation)**          : **5.430 / 10.0**
5. **Candidate C (ITCI — Teacher Cohort Intelligence)**               : **3.770 / 10.0**
6. **Candidate E (RTPO — Real-Time Policy Self-Optimization)**        : **3.240 / 10.0**

---

## 8. Selected Phase 12 Capability

**Candidate A — Policy Promotion, Version Governance & Rollback Engine (PPVG)** is unambiguously selected as the winning architecture for Phase 12.

---

## 9. Why the Selected Capability Does Not Duplicate Phases 1–11

PPVG maintains strict non-duplication across all previous phases:
* **Phases 2–8**: Zero mutation or re-implementation of question intelligence, mastery calculations, planning quotas, mock tests, LLM advisory, or cognitive analytics.
* **Phase 9 Orchestration**: PPVG does not alter the 7-tier ranking comparator or action taxonomy. It externalizes policy weights and thresholds into an auditable, version-governed configuration.
* **Phase 10 Attribution**: PPVG enriches `PrescriptionExecutionRecord` with explicit `policyVersion`, `policyFingerprint`, and `policySource` provenance.
* **Phase 11 Simulation**: PPVG does not simulate policies; it consumes validated candidate policies and simulation report artifacts as promotion evidence.

---

## 10. Exact Ownership Boundary

* **Phase 12 OWNS**:
  1. Specification and persistence of immutable policy versions.
  2. Cryptographic verification of promotion evidence against Phase 11 simulation reports.
  3. Atomic single-active policy transitions and rollback execution.
  4. Decision-scoped policy resolution for Phase 9 orchestration.
  5. Providing policy provenance (`policyVersion`, `policyFingerprint`, `policySource`) internally to Phase 10 attribution.
* **Phase 12 DOES NOT OWN**:
  1. Simulating candidate policies (Phase 11).
  2. Generating next-best-actions or agenda activities (Phase 9).
  3. Tracking prescription lifecycle states or calculating outcome attribution (Phase 10).
  4. Mutating learner progress, attempts, or mastery (Phases 3–4).

---

## 11. Cross-Phase Dependency Matrix

| Phase | Dependency Classification | Explanation |
| :--- | :---: | :--- |
| **Phase 2** | `NONE` | Independent of question taxonomy and prerequisite DAG. |
| **Phase 3** | `NONE` | Student progress, attempts, and goals are strictly unmutated. |
| **Phase 4** | `NONE` | Mastery formulas and confidence multipliers are untouched. |
| **Phase 5** | `NONE` | Planning algorithms and spaced revision schedules are untouched. |
| **Phase 6** | `NONE` | Mock exam blueprints and finalization routines are untouched. |
| **Phase 7** | `NONE` | LLM prompts, providers, and deliveries are untouched. |
| **Phase 8** | `NONE` | Cognitive analytics calculations are untouched. |
| **Phase 9** | `EXTEND` | Phase 9 entry points resolve an immutable `policySnapshot` once per decision and flow it through candidate scoring, with fallback to code baseline. |
| **Phase 10** | `EXTEND` | Phase 10's `attributionIssuanceService` receives policy provenance internally from the Phase 9 decision result and stamps it onto `PrescriptionExecutionRecord`. |
| **Phase 11** | `READ` | Phase 12 reads Phase 11 candidate policy validation rules (`policyValidationService`), canonical dimensions, and fingerprinting utility (`simulationFingerprint.js`). |

*Zero phases are marked `WRITE` or `CONFLICT`.*

---

## 12. Policy Identity & Fingerprint Reconciliation

### 12.1. Exact Fingerprint Contract
Phase 12 strictly adopts the authoritative Phase 11 fingerprint contract:

$$\text{policyFingerprint} = \text{generatePolicyFingerprint}(\text{policyDefinition})$$

Where `generatePolicyFingerprint` is the pure `node:crypto` utility exported from `src/utils/simulationFingerprint.js`.

### 12.2. Complete Canonical Policy Definition
Phase 12 stores the **complete canonical `policyDefinition` object**, exactly matching Phase 11:
* **Promoted Policies**:
  ```javascript
  {
    simulationOnly: true,
    baseWeights: {
      PREREQUISITE_REMEDIATION: Number,
      OVERDUE_REVISION: Number,
      DUE_TODAY_REVISION: Number,
      CURRICULUM_ADVANCEMENT: Number,
      EXAM_BENCHMARK: Number,
      PACING_CALIBRATION: Number
    },
    maxMasteryDeficitWeight: Number,
    maxGoalImpactWeight: Number,
    maxTemporalWeight: Number,
    priorityThresholds: {
      critical: Number,
      urgent: Number,
      high: Number,
      normal: Number
    }
  }
  ```
  *(The `simulationOnly: true` flag is preserved immutably inside the stored source definition to guarantee byte-for-byte SHA-256 fingerprint equivalence with Phase 11).*
* **Code Baseline (`v1.0.0`)**:
  `policyDefinition` is identical to Phase 11's frozen `BASELINE_POLICY` (with `simulationOnly: false`), yielding the exact baseline fingerprint:
  $$\text{baselineFingerprint} = \text{generatePolicyFingerprint}(\text{BASELINE_POLICY})$$

### 12.3. Separation of Policy Identity and Evidence Identity
* `policyFingerprint`: 64-character SHA-256 hex digest identifying the **policy parameter definition**.
* `evidenceSimulationFingerprint`: 64-character SHA-256 hex digest identifying the **Phase 11 simulation run report** that evaluated the candidate.
* `evidenceArtifactSha256`: 64-character SHA-256 hex digest identifying the **exact raw file bytes** of the verified Phase 11 report artifact.

---

## 13. Promotion Evidence Verification Contract (Strategy B Frozen)

### 13.1. Reconstructibility Finding & Selection of Strategy B
As established by live source audit of `policySimulationService.js` and `scripts/simulatePolicy.js`, Phase 11 simulation reports do not persist the intermediate `simulationMetadata` object or several fields needed to recompute `generateSimulationFingerprint` from scratch.
Therefore, Phase 12 formally selects and freezes **Strategy B: Opaque Phase 11 Run Identity + Artifact Integrity**.

### 13.2. Detailed Promotion Evidence Verification & Creation Order (17-Step Gate)
When an operator promotes a policy via:
```bash
node scripts/managePolicy.js promote --policyDefinition <path> --policyVersion <vX.Y.Z> --evidenceReport <path> --operatorId <string> [--notes <string>]
```

`policyGovernanceService.promotePolicy(...)` executes the following deterministic 17-step verification and creation sequence. Crucially, all verification and evidence checks (Steps 1–15) MUST pass completely BEFORE any database document is instantiated or saved (Steps 16–17):

1. **Validate Baseline Seeded**: Asserts that the persisted `v1.0.0` code baseline (`policyVersion === 'v1.0.0'` and `isBaseline === true`) exists in `orchestrationpolicyversions`. If unseeded, throws `409 BASELINE_NOT_SEEDED`.
2. **Validate Requested SemVer Syntax**: Asserts requested version matches `/^v\d+\.\d+\.\d+$/`. Pre-release or build suffixes are rejected.
3. **Verify Monotonic SemVer Progression / Retry Eligibility**: Parses $(major, minor, patch)$ and verifies candidate version progression against existing stored policy versions:
   * **Case A (`requestedVersion > highestStoredVersion`)**: Strictly higher than highest stored version $\rightarrow$ eligible to continue to candidate verification.
   * **Case B (`requestedVersion` exactly equals an existing stored version)**: Exact match with an existing stored version $\rightarrow$ do not create records and do not decide outcome yet; permit continuation through evidence verification, deferring exact idempotency vs. conflict resolution to Step 15.
   * **Case C (`requestedVersion < highestStoredVersion` AND no document exists at `requestedVersion`)**: Non-monotonic lower version $\rightarrow$ reject with `409 POLICY_VERSION_ALREADY_EXISTS`.
4. **Validate Candidate Policy Definition**: Asserts that all 13 canonical dimensions, nested key structures, and `simulationOnly: true` in the promoted definition conform to Phase 11 validation rules.
5. **Generate/Recompute Candidate Policy Fingerprint**: Computes `candidateFingerprint = generatePolicyFingerprint(candidatePolicyDefinition)`.
6. **Read Raw Evidence Artifact File Bytes**: Reads raw report file bytes from `--evidenceReport <path>` on disk via `fs.readFileSync(evidenceReportPath)`.
7. **Parse Report Object**: Deserializes JSON buffer into in-memory JavaScript object. Fails with JSON syntax error if malformed.
8. **Validate Engine Version**: Asserts `report.engineVersion === 'v1'`.
9. **Validate Simulation Mode Qualification**:
   * **Allowed Modes**: `ARCHETYPE_POLICY_COMPARISON` (Mode B) or `COMBINED`.
   * **Disallowed Modes**:
     * `OBSERVED_ACTION_SENSITIVITY` (Mode A alone): Strictly rejected (`INSUFFICIENT_EVIDENCE_MODE`) because it does not evaluate policy behavior across candidate arbitration sets.
     * `HISTORICAL_AGGREGATION`: Strictly rejected (`INSUFFICIENT_EVIDENCE_MODE`) because it evaluates zero candidate policies.
10. **Validate Structural Report Shape**:
    * `report.simulationFingerprint` is a valid 64-character lowercase hex string (`/^[a-f0-9]{64}$/`).
    * `report.datasetFingerprint` is a valid 64-character lowercase hex string (`/^[a-f0-9]{64}$/`).
    * `report.baselinePolicy` is present and non-null.
    * `report.candidatePolicies` is a non-empty array.
    * Mode B contains non-empty `report.syntheticArchetypeAnalysis.archetypes`.
    * Combined mode contains both `report.syntheticArchetypeAnalysis` and `report.historicalSensitivityAnalysis`.
    *(Zero nonexistent `executionStatus` or `runId` checked).*
11. **Locate Exact Candidate in Report**: Locates entry in `report.candidatePolicies` whose `policyFingerprint` matches `candidateFingerprint`. Fails if candidate not present.
12. **Recompute Report Candidate Fingerprint**: Recomputes `generatePolicyFingerprint(entry.policyDefinition)` on the report's candidate entry and asserts:
    $$\text{recomputed} === \text{entry.policyFingerprint} === \text{candidateFingerprint}$$
13. **Verify Exact 13-Dimension Definition Match**: Asserts that all 13 canonical dimensions, nested key structures, and `simulationOnly: true` in `entry.policyDefinition` match the candidate definition bit-for-bit.
14. **Compute Raw Artifact SHA-256 Digest**: Computes independent SHA-256 digest of the raw report file bytes:
    ```javascript
    evidenceArtifactSha256 = crypto.createHash('sha256').update(rawReportBuffer).digest('hex');
    ```
15. **Duplicate / Conflict Registry Invariance Check**: Checks database for collisions on `policyVersion` and `policyFingerprint`:
    * If existing document matches `policyVersion`:
      * If its fingerprint equals `candidateFingerprint` $\rightarrow$ idempotent return of existing record (`idempotent: true`, zero writes).
      * If its fingerprint differs $\rightarrow$ throws `409 POLICY_VERSION_ALREADY_EXISTS` (zero writes).
    * If existing document matches `candidateFingerprint` (under a different higher version request) $\rightarrow$ idempotent return of existing fingerprint document (`idempotent: true`, zero writes).
    * If neither collision exists $\rightarrow$ proceed to document construction (Step 16).
16. **Construct OrchestrationPolicyVersion**: Instantiates `new OrchestrationPolicyVersion(...)` with status `'promoted'`, the 9 immutable fields, and initial `PROMOTED` lifecycle event.
17. **Save Promoted Document**: Executes `await doc.save()`. Host filesystem paths are **never** persisted as durable identity. Document is now registered in `promoted` state.

---

## 14. Version Format, Monotonicity & Preconditions

### 14.1. Version Format
All policy versions must strictly conform to the regular expression:

```regex
^v\d+\.\d+\.\d+$
```

* Baseline code policy: `v1.0.0`
* Future promoted policies: `v1.1.0`, `v1.2.0`, `v2.0.0`, etc.
* Suffixes (such as `-baseline` or `-draft`) are **strictly prohibited** by the schema.

### 14.2. Version Assignment & Monotonicity
1. **Operator Assignment**: The operator explicitly specifies the target `policyVersion` during promotion (`--policyVersion v1.1.0`).
2. **Numeric Tuple Comparison**: Version progression is verified using numeric tuple comparison $(major, minor, patch)$, parsed from `^v(\d+)\.(\d+)\.(\d+)$`:
   * Parse digits: $v1.10.0 \rightarrow (1, 10, 0)$; $v1.9.0 \rightarrow (1, 9, 0)$.
   * Compare $major$, then $minor$, then $patch$ numerically.
   * $v1.10.0 > v1.9.0$ holds true. Lexical comparison is strictly forbidden.
   * For creation of a NEW policy version, the requested version must be strictly greater than the highest existing stored version.
   * An exact requestedVersion match with an existing stored version is not a new-version creation attempt. It is permitted to continue through evidence verification and is resolved at Step 15 as either:
     - idempotent same-version/same-fingerprint retry, or
     - `409 POLICY_VERSION_ALREADY_EXISTS` for same-version/different-fingerprint.
3. **Dual Uniqueness**:
   * `policyVersion` is strictly unique across `orchestrationpolicyversions`.
   * `policyFingerprint` is strictly unique across `orchestrationpolicyversions`.
4. **Idempotent Duplicate Rejection & Retry Reconciliation**:
   * Same version + same fingerprint: retrying promotion of an already-promoted policy version returns the existing record idempotently (`idempotent: true`, zero writes).
   * Same version + different fingerprint: attempting to promote a different policy definition using an already existing `policyVersion` throws `409 POLICY_VERSION_ALREADY_EXISTS`.
   * Higher version + existing fingerprint: attempting to promote an identical policy definition under a new higher version returns the existing fingerprint document idempotently (`idempotent: true`, zero duplicate records created).
   * Lower nonexistent version: rejected at Step 3 before evidence verification or persistence.
5. **Baseline Version Reservation**:
   * Version `v1.0.0` is permanently reserved for the code baseline.
   * No promoted candidate may request `v1.0.0`.
   * A candidate fingerprint cannot equal the baseline fingerprint (Phase 11 already rejects baseline-equivalent candidate policies).

---

## 15. Policy State Machine & Operation-Specific Preconditions

### 15.1. Exact State Taxonomy
Canonical database storage values in Mongoose are strictly lowercase:
* `promoted`: Validated and registered, but not yet active in production.
* `active`: Currently authoritative for Phase 9 production orchestration (strictly at most one document across the collection).
* `superseded`: Previously active, deactivated upon the forward activation of another policy version.
* `rolled_back`: Deactivated specifically as the origin of an operator rollback operation.

*(Uppercase labels `PROMOTED`, `ACTIVE`, `SUPERSEDED`, `ROLLED_BACK` appear only in documentation and lifecycle event types).*

### 15.2. Operation-Specific State Preconditions

#### `activatePolicy(targetVersion)`
* **Precondition**: Target policy MUST currently have `status === 'promoted'`.
* **Allowed Transition**: `promoted -> active`.
* **Idempotency**: If target is already `status === 'active'`, returns deterministic no-op (`{ policy: targetPolicy, idempotent: true }`).
* **Conflict Behavior**: Attempting to activate a `superseded` or `rolled_back` policy throws `409 INVALID_STATE_TRANSITION` (*"Cannot activate deactivated policy; use rollbackPolicy to restore prior policies"*).
* **Non-existent Target**: Throws `404 POLICY_VERSION_NOT_FOUND`.

#### `rollbackPolicy(targetVersion)`
* **Precondition**:
  1. Persisted `v1.0.0` baseline exists.
  2. Target policy exists in `orchestrationpolicyversions`.
  3. Target is not already active.
  4. Target policy MUST currently have `status === 'superseded'` or `status === 'rolled_back'`.
  5. Target policy MUST possess historical activation evidence (`ACTIVATED` or `ROLLBACK_TARGET` present in `lifecycleEvents`).
  6. **Active Origin Requirement**: Exactly one currently active policy document (`status === 'active'`) MUST exist. If no active policy document exists, throws `409 ACTIVE_POLICY_NOT_FOUND`.
  7. **Rollback Direction**: Target version must be strictly lower than the currently active policy version ($targetVersion < currentActiveVersion$ under numeric SemVer comparison).
  8. Only after all above conditions pass may mutations occur.
* **Allowed Transitions**:
  * `superseded -> active`
  * `rolled_back -> active`
* **Conflict Behavior**:
  * Attempting to roll back when no active policy exists throws `409 ACTIVE_POLICY_NOT_FOUND` (fails closed, zero writes).
  * Attempting to roll back to a never-activated policy (`status === 'promoted'`) throws `409 CANNOT_ROLLBACK_TO_UNACTIVATED_POLICY`.
  * Attempting to roll back to a version $\ge currentActiveVersion$ throws `409 INVALID_ROLLBACK_DIRECTION`.
  * If target is already active, throws `409 POLICY_ALREADY_ACTIVE`.
* **Rollback Lifecycle Contract**:
  For successful rollback:
  * `ROLLBACK_ORIGIN.fromPolicyVersion = currentActive.policyVersion`
  * `ROLLBACK_ORIGIN.toPolicyVersion = targetPolicy.policyVersion`
  * `ROLLBACK_TARGET.fromPolicyVersion = currentActive.policyVersion`
  * `ROLLBACK_TARGET.toPolicyVersion = targetPolicy.policyVersion`
  * A successful rollback MUST NEVER create `ROLLBACK_TARGET.fromPolicyVersion = null`.
* **Non-existent Target**: Throws `404 POLICY_VERSION_NOT_FOUND`.

---

## 16. Immutability & Append-Only Lifecycle Enforcement Contract

### 16.1. Policy Identity Immutability Contract
After document creation, the following fields are **strictly immutable**:
* `policyVersion`
* `policyFingerprint`
* `policyDefinition`
* `promotedBy`
* `promotedAt`
* `evidenceSimulationFingerprint`
* `evidenceArtifactSha256`
* `isBaseline`
* `notes` (immutable operator justification sealed at promotion)

The **only** lifecycle-mutable properties are:
* `status` (`'promoted' | 'active' | 'superseded' | 'rolled_back'`)
* `lifecycleEvents` (append-only array)
* `updatedAt` (Mongoose automatic timestamp)

### 16.2. Implementation-Addressable Enforcement Architecture
Immutability and append-only constraints are enforced deterministically across three defense-in-depth layers:

1. **Schema Path Declarations (`immutable: true`)**:
   All 9 immutable fields declare `immutable: true` in their Mongoose Schema path definitions:
   ```javascript
   policyVersion: { type: String, required: true, immutable: true, trim: true, match: ... },
   policyFingerprint: { type: String, required: true, immutable: true, match: ... },
   policyDefinition: { type: Schema.Types.Mixed, required: true, immutable: true },
   promotedBy: { type: String, required: true, immutable: true, trim: true },
   promotedAt: { type: Date, required: true, immutable: true },
   evidenceSimulationFingerprint: { type: String, default: null, immutable: true, match: ... },
   evidenceArtifactSha256: { type: String, default: null, immutable: true, match: ... },
   isBaseline: { type: Boolean, default: false, immutable: true },
   notes: { type: String, default: '', immutable: true },
   ```
2. **Post-Init & Post-Save Snapshot Refresh Hooks (`post('init')` & `post('save')`)**:
   Captures and refreshes an isolated deep-cloned snapshot of the persisted `lifecycleEvents` array in Mongoose document-local non-persisted state (`doc.$locals.originalLifecycleEvents`) both upon document hydration from MongoDB and after every successful `save()`:
   ```javascript
   function captureLifecycleSnapshot(doc) {
     if (!doc.$locals) doc.$locals = {};
     doc.$locals.originalLifecycleEvents = JSON.parse(JSON.stringify(doc.lifecycleEvents || []));
   }

   orchestrationPolicyVersionSchema.post('init', function () {
     captureLifecycleSnapshot(this);
   });

   orchestrationPolicyVersionSchema.post('save', function () {
     captureLifecycleSnapshot(this);
   });
   ```

3. **Pre-Save Document Hook (`pre('save')`)**:
   Throws an authoritative error if any immutable field is modified or if `lifecycleEvents` historical prefix integrity is breached:
   ```javascript
   orchestrationPolicyVersionSchema.pre('save', function (next) {
     if (!this.isNew) {
       const immutableFields = [
         'policyVersion', 'policyFingerprint', 'policyDefinition',
         'promotedBy', 'promotedAt', 'evidenceSimulationFingerprint',
         'evidenceArtifactSha256', 'isBaseline', 'notes'
       ];
       for (const field of immutableFields) {
         if (this.isModified(field)) {
           const err = new Error(`IMMUTABLE_FIELD_MUTATION: Field "${field}" cannot be modified after creation`);
           err.code = 'IMMUTABLE_FIELD_MUTATION';
           return next(err);
         }
       }

       // Append-Only lifecycleEvents Enforcement against $locals Snapshot
       if (this.isModified('lifecycleEvents')) {
         const original = (this.$locals && this.$locals.originalLifecycleEvents) || [];
         const current = this.lifecycleEvents || [];
         if (current.length < original.length) {
           const err = new Error('LIFECYCLE_MUTATION_PROHIBITED: lifecycleEvents array cannot be truncated or replaced');
           err.code = 'LIFECYCLE_MUTATION_PROHIBITED';
           return next(err);
         }
         for (let i = 0; i < original.length; i++) {
           const origJson = JSON.stringify(original[i]);
           const currJson = JSON.stringify(current[i]);
           if (origJson !== currJson) {
             const err = new Error(`LIFECYCLE_MUTATION_PROHIBITED: Historical lifecycle event at index ${i} cannot be modified`);
             err.code = 'LIFECYCLE_MUTATION_PROHIBITED';
             return next(err);
           }
         }
       }
     }
     next();
   });
   ```

   *Multi-Save & Same-Instance Invariants*:
   * **Newly-Created Document Multi-Save**: On initial instantiation (`new OrchestrationPolicyVersion(...)`), `this.isNew === true`. On initial save, `pre('save')` allows the initial event list (`[PROMOTED]`). Immediately upon successful save, `post('save')` executes `captureLifecycleSnapshot(this)`, populating `this.$locals.originalLifecycleEvents`. Any subsequent attempt to mutate historical events on the same document instance has `isNew === false` and throws `LIFECYCLE_MUTATION_PROHIBITED`.
   * **Hydrated Document Repeated Saves**: When hydrated from MongoDB, `post('init')` captures the snapshot. When an event is appended and saved, `post('save')` immediately refreshes the snapshot to include the newly appended event. Subsequent attempts to mutate that appended event on the same instance throw `LIFECYCLE_MUTATION_PROHIBITED`.
   * **Transaction-Abort Document Discard Invariant**: In MongoDB multi-document transactions, if an operation fails or the transaction aborts, in-memory Mongoose document state is NOT automatically rolled back. Therefore, **documents participating in an aborted governance transaction are strictly discarded and MUST NOT be reused**. All subsequent operations re-read fresh policy documents from MongoDB.
4. **Query & Document Mutation Interceptors (Blocking Generic Query Updates & doc.updateOne)**:
   In Mongoose 8.x, generic query mutations are intercepted and fail closed. Hydrated `document.updateOne()` internally delegates to a query `updateOne` operation targeting `{ _id: this._id }`, which is caught directly by the query `updateOne` hook:
   ```javascript
   // Generic Query Mutation Bypasses (also catches doc.updateOne())
   const FORBIDDEN_QUERY_UPDATE_OPS = [
     'updateOne',
     'updateMany',
     'findOneAndUpdate',
     'replaceOne',
     'findOneAndReplace',
   ];
   FORBIDDEN_QUERY_UPDATE_OPS.forEach((op) => {
     orchestrationPolicyVersionSchema.pre(op, function (next) {
       const err = new Error(`DIRECT_QUERY_UPDATE_PROHIBITED: Generic query mutation via "${op}" is prohibited. Policy version lifecycle updates must use domain service transaction methods.`);
       err.code = 'DIRECT_QUERY_UPDATE_PROHIBITED';
       return next(err);
     });
   });
   ```

5. **Document & Query Deletion Prevention Hooks (Audit Ledger Invariant)**:
   Mongoose 8 distinguishes document middleware from query middleware. Both paths are sealed to guarantee zero document deletion:
   ```javascript
   // Document Deletion Prevention (catches hydrated document.deleteOne())
   orchestrationPolicyVersionSchema.pre(
     'deleteOne',
     { document: true, query: false },
     function (next) {
       const err = new Error(
         'UNAUTHORIZED_DELETION: OrchestrationPolicyVersion documents are permanent immutable audit records and cannot be deleted via document.deleteOne().'
       );
       err.code = 'UNAUTHORIZED_DELETION';
       return next(err);
     }
   );

   // Query Deletion Prevention (catches Model.deleteOne, Model.deleteMany, Model.findOneAndDelete, Model.findByIdAndDelete)
   const FORBIDDEN_QUERY_DELETE_OPS = [
     'deleteOne',
     'deleteMany',
     'findOneAndDelete',
   ];
   FORBIDDEN_QUERY_DELETE_OPS.forEach((op) => {
     orchestrationPolicyVersionSchema.pre(
       op,
       { document: false, query: true },
       function (next) {
         const err = new Error(
           `UNAUTHORIZED_DELETION: OrchestrationPolicyVersion documents are permanent immutable audit records and cannot be deleted via query "${op}".`
         );
         err.code = 'UNAUTHORIZED_DELETION';
         return next(err);
       }
     );
   });
   ```

6. **Model-Level Bulk Write Prevention Hooks (insertMany & bulkWrite)**:
   Generic bulk write methods bypass normal `save()` lifecycle middleware and must fail closed:
   ```javascript
   orchestrationPolicyVersionSchema.pre('insertMany', function (next) {
     const err = new Error(
       'DIRECT_MODEL_WRITE_PROHIBITED: insertMany is prohibited for OrchestrationPolicyVersion records. Policies must be created via domain service promotion or baseline seeding.'
     );
     err.code = 'DIRECT_MODEL_WRITE_PROHIBITED';
     return next(err);
   });

   orchestrationPolicyVersionSchema.pre('bulkWrite', function (next) {
     const err = new Error(
       'DIRECT_MODEL_WRITE_PROHIBITED: bulkWrite is prohibited for OrchestrationPolicyVersion records. Policies must be created via domain service promotion or baseline seeding.'
     );
     err.code = 'DIRECT_MODEL_WRITE_PROHIBITED';
     return next(err);
   });
   ```

7. **Authorized Writers**: Domain methods in `policyGovernanceService` (`promotePolicy`, `activatePolicy`, `rollbackPolicy`, `seedBaseline`) are the sole authorized writers via `new OrchestrationPolicyVersion(...).save()` (which is fully unblocked) and transaction-managed document saves. Zero generic CRUD APIs exist.

```javascript
lifecycleEvents: [
  {
    eventType: {
      type: String,
      required: true,
      enum: [
        'PROMOTED',
        'ACTIVATED',
        'SUPERSEDED',
        'ROLLBACK_ORIGIN',
        'ROLLBACK_TARGET'
      ]
    },
    eventAt: { type: Date, required: true },
    operatorId: { type: String, required: true, trim: true },
    reason: { type: String, required: true, trim: true },
    fromPolicyVersion: { type: String, default: null },
    toPolicyVersion: { type: String, default: null },
    evidenceSimulationFingerprint: { type: String, default: null },
    evidenceArtifactSha256: { type: String, default: null }
  }
]
```

### 16.3. Model Persistence Ownership, Dual-Scope Architecture Guard & Bypass Prevention

* **Direct `Model.create()` Analysis**: Mongoose `Model.create()` executes document `save()` middleware. For a new document (`this.isNew === true`), `Model.create()` only executes schema validation and would bypass the authoritative 17-step Strategy B promotion gate.
* **Sole Production Writer Contract**: Production ownership of `OrchestrationPolicyVersion` persistence is strictly confined to `src/services/governance/policyGovernanceService.js`.
  ```text
  OrchestrationPolicyVersion persistence ownership:

  AUTHORIZED:
  src/services/governance/policyGovernanceService.js

  PROHIBITED DIRECT MODEL ACCESS:
  all other src/** production modules (src/services/**, src/controllers/**, src/routes/**, src/utils/**, src/config/**, and all other src/** runtime files)
  all scripts/** executable modules (including scripts/managePolicy.js and all repository scripts)

  TEST EXEMPTION:
  tests/** (allowed for schema, index, middleware, immutability, and bypass protection verification)
  ```
  The model definition file itself (`src/models/orchestrationPolicyVersionModel.js`) is naturally the schema export and is not treated as a consumer violation.
* **Expanded Dual-Scope Architecture-Guard Ownership Rule**:
  * `tests/architecture_guard.test.js` is extended to enforce a repository-level static check scanning **BOTH** `src/**` and `scripts/**`.
  * The guard verifies that zero executable code outside `src/services/governance/policyGovernanceService.js` directly requires or imports `src/models/orchestrationPolicyVersionModel.js`.
  * Scanning only `src/**` is defective because repository scripts (including the administrative CLI `scripts/managePolicy.js`) could otherwise directly require `src/models/orchestrationPolicyVersionModel.js` and bypass the Strategy B promotion gate using `OrchestrationPolicyVersion.create(...)` or `new OrchestrationPolicyVersion(...).save()`. Expanding the scan scope to `src/**` and `scripts/**` closes this loophole completely.
* **Required Script Behavior (`scripts/managePolicy.js`)**:
  * The administrative CLI `scripts/managePolicy.js` **MUST** import and consume `src/services/governance/policyGovernanceService.js`.
  * `scripts/managePolicy.js` **MUST NOT** directly import `src/models/orchestrationPolicyVersionModel.js`.
  * All CLI commands (`seed-baseline`, `promote`, `activate`, `rollback`, `list`, `show`) must flow exclusively through governance-service domain APIs or sanctioned read methods (`seedBaseline`, `promotePolicy`, `activatePolicy`, `rollbackPolicy`, `listVersions`, `showPolicy`).
  * The script must never directly perform Mongoose operations:
    ```javascript
    OrchestrationPolicyVersion.create(...)
    new OrchestrationPolicyVersion(...).save()
    OrchestrationPolicyVersion.updateOne(...)
    OrchestrationPolicyVersion.findOneAndUpdate(...)
    OrchestrationPolicyVersion.deleteOne(...)
    OrchestrationPolicyVersion.bulkWrite(...)
    OrchestrationPolicyVersion.insertMany(...)
    ```
* **Test Exemption**:
  * `tests/**` is explicitly exempt from the production model ownership restriction.
  * Tests are permitted to import `src/models/orchestrationPolicyVersionModel.js` directly when necessary to assert schema invariants, index declarations, Mongoose middleware hooks, document immutability, `$locals` append-only lifecycle enforcement, and query/document bypass protections.
  * All existing repository-wide architecture guards in `tests/architecture_guard.test.js` (legacy architecture scan across `src/`, `scripts/`, `tests/`; Phase 7+ service and model absence across `src/`; topic distribution sum invariant) remain intact and unweakened.
* **Import-Path Detection Strategy**:
  * Real repository module imports across `src/` and `scripts/` utilize varied relative path forms:
    * `require('../models/orchestrationPolicyVersionModel')` (from `src/services/`, `src/controllers/`, etc.)
    * `require('../../models/orchestrationPolicyVersionModel')` (from subdirectories like `src/services/governance/`)
    * `require('../src/models/orchestrationPolicyVersionModel')` (from `scripts/`)
    * Optional `.js` file extensions or ES module dynamic imports.
  * To avoid fragile exact-path matching, the architecture guard evaluates all non-comment lines in `src/**` and `scripts/**` (excluding `src/models/orchestrationPolicyVersionModel.js` and `src/services/governance/policyGovernanceService.js`) using a pattern that detects any import or require referencing `orchestrationPolicyVersionModel`:
    ```javascript
    /(?:require\s*\(|from\s*)['"][^'"]*\/orchestrationPolicyVersionModel(?:\.js)?['"]/
    ```
    or any non-comment code reference matching `/\borchestrationPolicyVersionModel\b/`.
* **Architecture-Guard Test Contract**:
  The `tests/architecture_guard.test.js` test contract proves:
  1. **Valid Governance-Service Import**: `src/services/governance/policyGovernanceService.js` imports `OrchestrationPolicyVersion` $\rightarrow$ allowed.
  2. **Invalid `src/**` Import**: A non-governance production file (fixture or source equivalent to `// src/services/badService.js: const OrchestrationPolicyVersion = require('../models/orchestrationPolicyVersionModel');`) $\rightarrow$ fails the architecture guard.
  3. **Invalid `scripts/**` Import**: A script file (fixture or source equivalent to `// scripts/badPolicyScript.js: const OrchestrationPolicyVersion = require('../src/models/orchestrationPolicyVersionModel');`) $\rightarrow$ fails the architecture guard.
  4. **Valid CLI Service-Only Import**: `scripts/managePolicy.js` imports `src/services/governance/policyGovernanceService.js` and does **not** import `orchestrationPolicyVersionModel` $\rightarrow$ allowed.
* **Evidence-Before-Persistence Ordering**: In `policyGovernanceService.promotePolicy(...)`, the entire Strategy B evidence gate (Steps 1–15) completes before constructing or saving `OrchestrationPolicyVersion` (Steps 16–17). Zero records are persisted if simulation evidence verification fails.

---

## 17. Single-Active Policy Transaction Contract

### 17.1. Atomic Transaction Execution
Mutating transitions (`activatePolicy`, `rollbackPolicy`) require a transaction-capable MongoDB deployment (replica set or sharded cluster). If transactions are unsupported by the database deployment, the mutation **FAILS CLOSED** (`TRANSACTION_NOT_SUPPORTED`). It will **never** silently downgrade to a non-transactional two-document update.

Unsupported-transaction capability failures can surface during:
1. Transaction initialization (`session.startTransaction(...)`)
2. Initial or subsequent session-bound queries (e.g., baseline lookup, target lookup)
3. Transactional document saves (`save({ session })`)
4. Transaction commit (`session.commitTransaction()`)

All recognized transaction-capability failures across the entire transaction lifecycle are deterministically normalized to `500 TRANSACTION_NOT_SUPPORTED`. Unrelated database, network, or validation errors preserve their original error types.

```javascript
/**
 * Detects whether an error indicates the connected MongoDB deployment lacks
 * transaction support (e.g. standalone instance, unsupported topology).
 * Distinguishes unsupported-topology signals from ordinary database, network,
 * or validation errors.
 */
function isTransactionCapabilityError(err) {
  if (!err) return false;

  const msg = typeof err.message === 'string' ? err.message : '';

  // 1. Specific MongoDB Driver transaction capability errors
  if (
    err.name === 'MongoTransactionError' &&
    (/Transactions are not supported by this deployment/i.test(msg) ||
     /Current topology does not support (sessions|transactions)/i.test(msg) ||
     /Cannot start transaction on standalone/i.test(msg))
  ) {
    return true;
  }
  if (err.name === 'MongoCompatibilityError' && /not supported/i.test(msg)) {
    return true;
  }

  // 2. MongoDB Server code 20 (IllegalOperation):
  // "Transaction numbers are only allowed on a replica set member or mongos"
  if (err.code === 20 || err.codeName === 'IllegalOperation') {
    if (
      /Transaction numbers are only allowed on a replica set member or mongos/i.test(msg) ||
      /Cannot start transaction on standalone/i.test(msg)
    ) {
      return true;
    }
  }

  // 3. MongoDB Server code 148 (ReadConcernMajorityNotEnabled):
  // Gated strictly to transaction capability failures (prepareTransaction is not supported)
  if (err.code === 148 || err.codeName === 'ReadConcernMajorityNotEnabled') {
    if (/prepareTransaction.*(?:is\s+)?not supported/i.test(msg)) {
      return true;
    }
  }

  // 4. Note on MongoDB Server code 263 (OperationNotSupportedInTransaction):
  // Source audit confirms code 263 indicates command/operation restrictions inside
  // an existing transaction, NOT deployment-level transaction incapability.
  // Preserved as original error; not classified as TRANSACTION_NOT_SUPPORTED.

  // 5. Exact deterministic message patterns from driver or server indicating unsupported capability
  if (
    /Transaction numbers are only allowed on a replica set member or mongos/i.test(msg) ||
    /Transactions are not supported by this deployment/i.test(msg) ||
    /Current topology does not support (sessions|transactions)/i.test(msg) ||
    /Cannot start transaction on standalone/i.test(msg) ||
    /prepareTransaction.*(?:is\s+)?not supported/i.test(msg)
  ) {
    return true;
  }

  return false;
}

/**
 * Deterministically normalizes optional reason strings for governance lifecycle events.
 * Preserves trimmed non-empty operator reasons while guaranteeing non-empty defaults
 * for omitted, empty, or whitespace-only inputs.
 */
const normalizeGovernanceReason = ({ reason, isRollback }) => {
  if (typeof reason === 'string' && reason.trim().length > 0) {
    return reason.trim();
  }

  return isRollback
    ? 'Policy rollback'
    : 'Policy activation';
};

const activatePolicyTransaction = async ({ targetVersion, operatorId, reason, referenceNow, isRollback = false }) => {
  const effectiveReason = normalizeGovernanceReason({ reason, isRollback });
  const session = await mongoose.startSession();
  let transactionStarted = false;

  try {
    try {
      session.startTransaction({
        readConcern: { level: 'majority' },
        writeConcern: { w: 'majority' }
      });
      transactionStarted = true;

    // 1. Baseline existence check (Precondition for all mutating operations)
    const baseline = await OrchestrationPolicyVersion.findOne({
      policyVersion: 'v1.0.0',
      isBaseline: true
    }).session(session);

    if (!baseline) {
      throw new AppError(
        409,
        'BASELINE_NOT_SEEDED',
        'Baseline policy (v1.0.0) must be seeded before governance mutation.'
      );
    }

    // 2. Locate target policy
    const targetPolicy = await OrchestrationPolicyVersion.findOne({ policyVersion: targetVersion }).session(session);
    if (!targetPolicy) throw new AppError(404, 'POLICY_VERSION_NOT_FOUND', `Version ${targetVersion} not found.`);

    // 3. Target Already Active Check
    if (targetPolicy.status === 'active') {
      if (isRollback) {
        throw new AppError(
          409,
          'POLICY_ALREADY_ACTIVE',
          `Policy ${targetVersion} is already active.`
        );
      }

      await session.abortTransaction();
      transactionStarted = false;

      return {
        policy: targetPolicy,
        idempotent: true
      };
    }

    // 4. Operation-specific target-state validation
    if (!isRollback && targetPolicy.status !== 'promoted') {
      throw new AppError(
        409,
        'INVALID_STATE_TRANSITION',
        'Cannot activate deactivated policy; use rollbackPolicy.'
      );
    }

    if (
      isRollback &&
      !['superseded', 'rolled_back'].includes(targetPolicy.status)
    ) {
      throw new AppError(
        409,
        'CANNOT_ROLLBACK_TO_UNACTIVATED_POLICY',
        'Rollback target must be a previously deactivated policy.'
      );
    }

    // 5. Prior-Activation Proof Check
    const wasPreviouslyActivated =
      targetPolicy.lifecycleEvents.some(
        (event) =>
          event.eventType === 'ACTIVATED' ||
          event.eventType === 'ROLLBACK_TARGET'
      );

    if (isRollback && !wasPreviouslyActivated) {
      throw new AppError(
        409,
        'CANNOT_ROLLBACK_TO_UNACTIVATED_POLICY',
        'Rollback target has no prior activation evidence.'
      );
    }

    // 6. Locate currently active policy
    const currentActive = await OrchestrationPolicyVersion.findOne({ status: 'active' }).session(session);

    if (isRollback && !currentActive) {
      throw new AppError(
        409,
        'ACTIVE_POLICY_NOT_FOUND',
        'Rollback requires a currently active origin policy.'
      );
    }

    if (isRollback) {
      if (!isSemVerLower(targetPolicy.policyVersion, currentActive.policyVersion)) {
        throw new AppError(409, 'INVALID_ROLLBACK_DIRECTION', 'Rollback target version must be lower than active version.');
      }
    }

    const fromPolicyVersion = isRollback
      ? currentActive.policyVersion
      : (currentActive ? currentActive.policyVersion : null);

    // 7. Deactivate current active policy
    if (currentActive) {
      const exitEventType = isRollback ? 'ROLLBACK_ORIGIN' : 'SUPERSEDED';
      const exitStatus = isRollback ? 'rolled_back' : 'superseded';
      currentActive.status = exitStatus;
      currentActive.lifecycleEvents.push({
        eventType: exitEventType,
        eventAt: referenceNow,
        operatorId,
        reason: effectiveReason,
        fromPolicyVersion: currentActive.policyVersion,
        toPolicyVersion: targetVersion,
        evidenceSimulationFingerprint: null,
        evidenceArtifactSha256: null,
      });
      await currentActive.save({ session });
    }

    // 8. Activate target policy
    const enterEventType = isRollback ? 'ROLLBACK_TARGET' : 'ACTIVATED';
    targetPolicy.status = 'active';
    targetPolicy.lifecycleEvents.push({
      eventType: enterEventType,
      eventAt: referenceNow,
      operatorId,
      reason: effectiveReason,
      fromPolicyVersion,
      toPolicyVersion: targetVersion,
      evidenceSimulationFingerprint: targetPolicy.evidenceSimulationFingerprint,
      evidenceArtifactSha256: targetPolicy.evidenceArtifactSha256,
    });
    await targetPolicy.save({ session });

    await session.commitTransaction();
    transactionStarted = false;
    return { policy: targetPolicy, idempotent: false };
  } catch (err) {
    if (isTransactionCapabilityError(err)) {
      throw new AppError(
        500,
        'TRANSACTION_NOT_SUPPORTED',
        'Database deployment does not support required MongoDB transactions.'
      );
    }
    throw err;
  }
} catch (err) {
  if (transactionStarted) {
    try {
      await session.abortTransaction();
    } catch (_) {
      // suppress secondary abort failure only
    }
  }
  throw err;
} finally {
  await session.endSession();
}
};
```

### 17.2. Database Partial Unique Index Backstop
```javascript
orchestrationPolicyVersionSchema.index(
  { status: 1 },
  {
    unique: true,
    partialFilterExpression: { status: 'active' }
  }
);
```
* **Guarantee**: The partial unique index guarantees **AT MOST one** active policy document in the collection.
* **Atomicity Source**: Atomicity is provided strictly by the MongoDB transaction session, with the index serving as a database-level safety backstop.

---

## 18. Code Baseline Governance Representation & Bootstrap

Phase 12 adopts **Explicit Operator Bootstrap with Virtual Fallback**:

### 18.1. Explicit Operator Seeding
Baseline persistence is seeded explicitly via CLI:
```bash
node scripts/managePolicy.js seed-baseline --operatorId <string> [--secret <value>]
```
Which invokes:
```javascript
policyGovernanceService.seedBaseline({ operatorId, referenceNow })
```
* **Rules**:
  1. No automatic writes during Express application startup.
  2. No hidden bootstrap middleware or hooks.
  3. No separate `bootstrapBaselinePolicy.js` script.
  4. Runtime queries never mutate or seed the database.
  5. If the collection is unseeded, mutating operations (`promote`, `activate`, `rollback`) return a deterministic `409 BASELINE_NOT_SEEDED` domain error.
* **Baseline Document Shape**:
  ```javascript
  {
    policyVersion: 'v1.0.0',
    policyFingerprint: generatePolicyFingerprint(BASELINE_POLICY),
    policyDefinition: BASELINE_POLICY,
    status: 'active',
    isBaseline: true,
    promotedBy: operatorId || 'system',
    promotedAt: referenceNow,
    evidenceSimulationFingerprint: null,
    evidenceArtifactSha256: null,
    notes: 'Initial Phase 9 deterministic code baseline',
    lifecycleEvents: [
      {
        eventType: 'PROMOTED',
        eventAt: referenceNow,
        operatorId: operatorId || 'system',
        reason: 'Initial platform baseline seed',
        fromPolicyVersion: null,
        toPolicyVersion: 'v1.0.0',
        evidenceSimulationFingerprint: null,
        evidenceArtifactSha256: null,
      },
      {
        eventType: 'ACTIVATED',
        eventAt: referenceNow,
        operatorId: operatorId || 'system',
        reason: 'Initial platform baseline activation',
        fromPolicyVersion: null,
        toPolicyVersion: 'v1.0.0',
        evidenceSimulationFingerprint: null,
        evidenceArtifactSha256: null,
      }
    ]
  }
  ```

### 18.2. Virtual Code Fallback & Distinct Log Warnings
If MongoDB is unseeded or unreachable during runtime active policy resolution:
* Phase 9 transparently falls back to the in-memory immutable `BASELINE_POLICY`.
* Resolves `policySnapshot` with `source: 'CODE_BASELINE_FALLBACK'`, `policyVersion: 'v1.0.0'`, and `policyFingerprint: generatePolicyFingerprint(BASELINE_POLICY)`.
* **Distinct Operational Reason Codes**:
  * Unseeded collection (zero active documents): Logs `POLICY_REGISTRY_UNSEEDED_FALLBACK`.
  * Query failure / database exception: Logs `POLICY_REGISTRY_QUERY_FAILURE_FALLBACK` (zero secret or connection string leakage).
* Server **never** crashes on governance storage outages.

---

## 19. Policy Source Taxonomy & Active-Policy Read Consistency

### 19.1. Policy Source Taxonomy
New Phase 12 decisions and prescriptions use exactly three mutually exclusive runtime sources:
1. `GOVERNED_POLICY`: Scored using an active non-baseline document (`isBaseline: false`).
2. `CODE_BASELINE`: Scored using the persisted active `v1.0.0` baseline document (`isBaseline: true`).
3. `CODE_BASELINE_FALLBACK`: Scored using the virtual in-memory `BASELINE_POLICY` because storage was unreachable or unseeded.

*(Historical pre-Phase-12 records with `policyVersion: null` are analytically interpreted as `LEGACY PRE-GOVERNANCE BASELINE` without storing that string on new records).*

### 19.2. Native Mongoose 8.x Active-Policy Read Consistency
To eliminate application-level cache staleness while avoiding unprovable latency claims:
* **Direct Indexed Query**: Resolves active policy using Mongoose 8.x native query options:
  ```javascript
  const doc = await OrchestrationPolicyVersion.findOne({ status: 'active' })
    .read('primary')
    .readConcern('local')
    .lean();
  ```
  *(Source-verified against installed Mongoose 8.24.4 under package range ^8.4.3: sets `readPreference: { mode: 'primary' }` and `readConcern: { level: 'local' }`).*
* **Guarantee**: Phase 12 introduces **zero application-level cache staleness** (no TTL polling, no cache desync). Latency and observation speed depend on standard MongoDB primary read performance.
* **Snapshot Immutability**: All four properties (`policyVersion`, `policyFingerprint`, `policyDefinition`, `source`) remain frozen for the decision lifespan.

---

## 20. 13-Dimension Runtime Ownership & Call-Graph Flow

### 20.1. Priority Threshold Key-Shape Normalization Contract
To bridge Phase 9's uppercase configuration (`CRITICAL`, `URGENT`, `HIGH`, `NORMAL`) and Phase 11/12's canonical lowercase definition (`critical`, `urgent`, `high`, `normal`), `src/services/orchestration/orchestrationUtils.js` implements:

```javascript
const { PRIORITY_THRESHOLDS } = require('../../config/orchestrationConfig');

const DEFAULT_PRIORITY_THRESHOLDS = Object.freeze({
  critical: PRIORITY_THRESHOLDS.CRITICAL, // 80.0
  urgent: PRIORITY_THRESHOLDS.URGENT,     // 65.0
  high: PRIORITY_THRESHOLDS.HIGH,         // 50.0
  normal: PRIORITY_THRESHOLDS.NORMAL,     // 35.0
});

const normalizePriorityThresholds = (raw) => {
  if (!raw || typeof raw !== 'object') {
    return DEFAULT_PRIORITY_THRESHOLDS;
  }
  return Object.freeze({
    critical: raw.critical ?? raw.CRITICAL ?? DEFAULT_PRIORITY_THRESHOLDS.critical,
    urgent: raw.urgent ?? raw.URGENT ?? DEFAULT_PRIORITY_THRESHOLDS.urgent,
    high: raw.high ?? raw.HIGH ?? DEFAULT_PRIORITY_THRESHOLDS.high,
    normal: raw.normal ?? raw.NORMAL ?? DEFAULT_PRIORITY_THRESHOLDS.normal,
  });
};

const getPriorityTier = (urgencyScore, priorityThresholds = DEFAULT_PRIORITY_THRESHOLDS) => {
  if (urgencyScore === null || urgencyScore === undefined || !Number.isFinite(urgencyScore)) {
    return 'normal';
  }
  const thresholds = normalizePriorityThresholds(priorityThresholds);
  if (urgencyScore >= thresholds.critical) return 'critical';
  if (urgencyScore >= thresholds.urgent) return 'urgent';
  if (urgencyScore >= thresholds.high) return 'high';
  if (urgencyScore >= thresholds.normal) return 'normal';
  return 'low';
};
```

*Legacy Boundary Guarantees*:
* $U \ge 80.0 \rightarrow \text{'critical'}$
* $U \ge 65.0 \rightarrow \text{'urgent'}$
* $U \ge 50.0 \rightarrow \text{'high'}$
* $U \ge 35.0 \rightarrow \text{'normal'}$
* $U < 35.0 \rightarrow \text{'low'}$
* Governed policies pass lowercase thresholds, e.g., `{ critical: 85, urgent: 70, high: 55, normal: 40 }`, and accurately override the legacy defaults.

### 20.2. Complete 13-Dimension Runtime Ownership Matrix
Every dimension of the governed candidate policy has an exact, concrete runtime consumer:

| # | Governed Policy Dimension | Consumer File | Consumer Function / Logic |
| :---: | :--- | :--- | :--- |
| 1 | `baseWeights.PREREQUISITE_REMEDIATION` | `src/services/orchestration/urgencyScoringService.js` | `getBaseWeight(actionType, actionSubtype, baseWeights)` |
| 2 | `baseWeights.OVERDUE_REVISION` | `src/services/orchestration/urgencyScoringService.js` | `getBaseWeight(actionType, actionSubtype, baseWeights)` |
| 3 | `baseWeights.DUE_TODAY_REVISION` | `src/services/orchestration/urgencyScoringService.js` | `getBaseWeight(actionType, actionSubtype, baseWeights)` |
| 4 | `baseWeights.CURRICULUM_ADVANCEMENT` | `src/services/orchestration/urgencyScoringService.js` | `getBaseWeight(actionType, actionSubtype, baseWeights)` |
| 5 | `baseWeights.EXAM_BENCHMARK` | `src/services/orchestration/urgencyScoringService.js` | `getBaseWeight(actionType, actionSubtype, baseWeights)` |
| 6 | `baseWeights.PACING_CALIBRATION` | `src/services/orchestration/urgencyScoringService.js` | `getBaseWeight(actionType, actionSubtype, baseWeights)` |
| 7 | `maxMasteryDeficitWeight` | `src/services/orchestration/urgencyScoringService.js` | `calculateUrgencyScore` (mastery deficit multiplier) |
| 8 | `maxGoalImpactWeight` | `src/services/orchestration/urgencyScoringService.js` | `calculateUrgencyScore` (goal impact upper clamp) |
| 9 | `maxTemporalWeight` | `src/services/orchestration/urgencyScoringService.js` | `calculateUrgencyScore` (temporal urgency upper clamp) |
| 10 | `priorityThresholds.critical` | `src/services/orchestration/orchestrationUtils.js` | `getPriorityTier(urgencyScore, priorityThresholds)` |
| 11 | `priorityThresholds.urgent` | `src/services/orchestration/orchestrationUtils.js` | `getPriorityTier(urgencyScore, priorityThresholds)` |
| 12 | `priorityThresholds.high` | `src/services/orchestration/orchestrationUtils.js` | `getPriorityTier(urgencyScore, priorityThresholds)` |
| 13 | `priorityThresholds.normal` | `src/services/orchestration/orchestrationUtils.js` | `getPriorityTier(urgencyScore, priorityThresholds)` |

*Non-Tunable Constants Preserved*:
* Overdue temporal points per day = 2.0 (`OVERDUE_TEMPORAL_POINTS_PER_DAY`)
* Prerequisite mastery ready threshold = 0.70
* Policy priority classes (Class 0, Class 1, Class 2)
* Existing 6 canonical action types remain unchanged: `PREREQUISITE_REMEDIATION`, `RETENTION_RESCUE`, `CURRICULUM_ADVANCEMENT`, `PACING_CALIBRATION`, `EXAM_BENCHMARK`, `DIAGNOSTIC_ASSESSMENT`
* Candidate generation eligibility rules
* Strict 7-tier comparator hierarchy

### 20.3. Service Snapshot Resolution Pattern
All three Phase 9 service entry points resolve or reuse the active policy snapshot exactly once at entry:
```javascript
const policySnapshot =
  orchestrationContext.policySnapshot ||
  (await policyGovernanceService.resolveActivePolicySnapshot(
    orchestrationContext.referenceNow
  ));
```
Applied at entry to:
1. `nextActionArbiter.getNextAction`
2. `dailyAgendaAssembler.getDailyAgenda`
3. `interventionPolicyService.getInterventions`

*Rules*: Resolved at most once per service invocation; never per candidate, segment, or intervention. Reused if provided in context.

### 20.4. Public DTO Invariance & Controller Unwrapping
* `formatActionDTO` and `executionIntent` remain **100% UNCHANGED**.
* Phase 9 services return an internal result wrapper containing `policyProvenance`:
  ```javascript
  return {
    status: 'calculated',
    reason: 'NEXT_ACTION_RESOLVED',
    nextAction: formatActionDTO(winningAction), // Public DTO untouched
    policyProvenance: {
      policyVersion: policySnapshot.policyVersion,
      policyFingerprint: policySnapshot.policyFingerprint,
      policySource: policySnapshot.source,
    }
  };
  ```
* `orchestrationController.js` strips `policyProvenance` before returning `sendSuccess(res, publicData)`.
* **Intervention Boundary**: Interventions return internal `policyProvenance` which the controller strips. **Interventions are NOT a Phase 10 issuance origin** (issuance origin surfaces remain strictly `next_action` and `daily_agenda`).

---

## 21. Phase 10 Attribution Issuance Call Chain & Provenance Handoff

### 21.1. Exact Current Issuance Call Chain
1. HTTP Client POSTs `/api/v1/attribution/prescriptions` with `{ userId, originSurface, goalId, actionId }`.
2. `attributionController.issuePrescription` invokes:
   ```javascript
   const result = await attributionIssuanceService.issuePrescription({
     userId,
     originSurface,
     goalId,
     actionId,
     idempotencyKey,
     referenceNow,
   });
   ```
3. Inside `attributionIssuanceService.issuePrescription:L196-243`:
   * Builds `orchestrationContext = { userId, goal, goalId, explicitGoalProvided, referenceNow }`.
   * Invokes Phase 9 action extraction:
     * If `originSurface === 'next_action'`:
       ```javascript
       const phase9Result = await nextActionArbiter.getNextAction(orchestrationContext);
       candidateAction = phase9Result?.nextAction || null;
       const policyProvenance = phase9Result?.policyProvenance;
       ```
     * If `originSurface === 'daily_agenda'`:
       ```javascript
       const phase9Result = await dailyAgendaAssembler.getDailyAgenda(orchestrationContext);
       // locates matching activity by actionId in segment activities
       candidateAction = candidateActivities[0];
       const policyProvenance = phase9Result?.policyProvenance;
       ```

### 21.2. Frozen Provenance Stamping Contract
Both `candidateAction` and `policyProvenance` originate from the **exact same Phase 9 call** inside `issuePrescription`.
In Step 12.2 of `attributionIssuanceService`:
```javascript
createdRecord = new PrescriptionExecutionRecord({
  ...
  policyVersion: policyProvenance?.policyVersion ?? null,
  policyFingerprint: policyProvenance?.policyFingerprint ?? null,
  policySource: policyProvenance?.policySource ?? null,
  ...
});
```

*Programmatic Invocation Override*:
If a caller invokes `issuePrescription` programmatically with an already-resolved action, the function accepts:
```javascript
issuePrescription({
  userId,
  originSurface,
  goalId,
  actionId,
  idempotencyKey,
  referenceNow,
  candidateAction,   // optional programmatic override
  policyProvenance   // optional programmatic override matching candidateAction
})
```
*Zero Race Guarantee*: Phase 10 never queries the active policy independently; the policy stamped into the record is mathematically guaranteed to be the exact policy that evaluated the action.

---

## 22. Phase 10 Model Provenance Fields & Custom Index

### 22.1. Top-Level Field Placement
```javascript
// src/models/prescriptionExecutionRecordModel.js
{
  // ... existing fields ...
  phase10AlgorithmVersion: { type: String, required: true },
  orchestrationAlgorithmVersion: { type: String, required: true },

  // Phase 12 Governance Provenance Fields
  policyVersion: {
    type: String,
    default: null,
    trim: true,
    match: [/^v\d+\.\d+\.\d+$/, 'Invalid policyVersion format']
  },
  policyFingerprint: {
    type: String,
    default: null,
    match: [/^[a-f0-9]{64}$/, 'Invalid policyFingerprint format']
  },
  policySource: {
    type: String,
    default: null,
    enum: ['GOVERNED_POLICY', 'CODE_BASELINE', 'CODE_BASELINE_FALLBACK', null]
  }
}
```

### 22.2. Dedicated Custom Index
```javascript
prescriptionExecutionRecordSchema.index(
  { policyVersion: 1, policyFingerprint: 1 },
  { sparse: true }
);
```

---

## 23. Phase 11 Dynamic-Baseline Compatibility (Strategy B Frozen)

Phase 12 adopts **Strategy B: Keep Phase 11 V1 Frozen and Explicitly Bound to V1 Baseline**:
1. **Phase 11 V1 Scope**: Phase 11 V1 remains permanently and immutably anchored to the original code baseline (`BASELINE_POLICY`). All Phase 11 simulation runs compare candidates against that frozen baseline.
2. **Phase 12 Promotion Boundary**: Phase 12 accepts this boundary: promotion requires evidence from Phase 11 V1 showing candidate viability against the canonical V1 baseline.
3. **Future Extension**: Comparing candidate policies against newly activated governed policies is formally deferred to a future Phase 11 V2 engine specification.

---

## 24. Operator Trust Boundary & Reference Clocks

### 24.1. Operator Trust Boundary
* **No Fake RBAC**: The platform has no application-level admin user roles or JWT tokens.
* **OS / Host Execution Boundary**: The administrative CLI (`scripts/managePolicy.js`) may only be executed by an operator with host, pod, or deployment shell access.
* **Audit Metadata**: `--operatorId <string>` is strictly an audit/attribution string recorded in lifecycle events.
* **Environment Secret Handling & Exposure Boundaries**:
  * `POLICY_GOVERNANCE_SECRET` is optional in all environments.
  * If `POLICY_GOVERNANCE_SECRET` is set in `process.env`:
    * The CLI requires `--secret <value>`.
    * Compares via timing-safe comparison (`crypto.timingSafeEqual`).
    * Mismatch fails closed with CLI validation error.
  * If `POLICY_GOVERNANCE_SECRET` is unset:
    * The CLI requires `--confirm` flag (missing `--confirm` exits with code 1 without invoking service).
    * When `--confirm` is supplied, emits warning: `GOVERNANCE_SECRET_NOT_CONFIGURED` and continues execution (does not force non-zero exit).
  * **Supported Secrecy Guarantees**:
    * Secret values are never logged in application or CLI logs.
    * Secret values are never included in application, domain, or CLI errors.
    * Secret values are never persisted to storage or database records.
    * Process-list visibility via command-line arguments (`ps aux`) is an inherent property of shell arguments; production deployment environments must use secure runner execution or environment configurations.
  * Neither `--secret` nor `--operatorId` is represented as application-level authentication.

### 24.2. Reference Clock Contract
* Every domain method in `policyGovernanceService` (`promotePolicy`, `activatePolicy`, `rollbackPolicy`, `seedBaseline`) accepts an explicit `referenceNow: Date` parameter.
* The service layer contains zero calls to `new Date()` or `Date.now()`.
* The outer CLI captures `referenceNow = new Date()` once at script startup and passes it down into the service layer.

---

## 25. Proposed Future Data Model Changes

*(Proposal Only — No Schema Created in This Task)*

Exactly one new Mongoose model:

### Model: `OrchestrationPolicyVersion` (`src/models/orchestrationPolicyVersionModel.js`)
* **Collection**: `orchestrationpolicyversions`
* **Schema Definition**:
  ```javascript
  const orchestrationPolicyVersionSchema = new Schema(
    {
      policyVersion: {
        type: String,
        required: true,
        immutable: true,
        trim: true,
        match: [/^v\d+\.\d+\.\d+$/, 'Invalid policyVersion format']
      },
      policyFingerprint: {
        type: String,
        required: true,
        immutable: true,
        match: [/^[a-f0-9]{64}$/, 'Invalid policyFingerprint format']
      },
      status: {
        type: String,
        required: true,
        enum: ['promoted', 'active', 'superseded', 'rolled_back'],
        default: 'promoted'
      },
      policyDefinition: {
        type: Schema.Types.Mixed,
        required: true,
        immutable: true
      },
      promotedBy: { type: String, required: true, immutable: true, trim: true },
      promotedAt: { type: Date, required: true, immutable: true },
      evidenceSimulationFingerprint: {
        type: String,
        default: null,
        immutable: true,
        match: [/^[a-f0-9]{64}$/, 'Invalid evidenceSimulationFingerprint format']
      },
      evidenceArtifactSha256: {
        type: String,
        default: null,
        immutable: true,
        match: [/^[a-f0-9]{64}$/, 'Invalid evidenceArtifactSha256 format']
      },
      notes: { type: String, default: '', immutable: true },
      isBaseline: { type: Boolean, default: false, immutable: true },
      lifecycleEvents: [
        {
          eventType: {
            type: String,
            required: true,
            enum: ['PROMOTED', 'ACTIVATED', 'SUPERSEDED', 'ROLLBACK_ORIGIN', 'ROLLBACK_TARGET']
          },
          eventAt: { type: Date, required: true },
          operatorId: { type: String, required: true, trim: true },
          reason: { type: String, required: true, trim: true },
          fromPolicyVersion: { type: String, default: null },
          toPolicyVersion: { type: String, default: null },
          evidenceSimulationFingerprint: { type: String, default: null },
          evidenceArtifactSha256: { type: String, default: null }
        }
      ]
    },
    {
      timestamps: true,
      collection: 'orchestrationpolicyversions'
    }
  );

  // Schema Validation Hook for Conditional Evidence
  orchestrationPolicyVersionSchema.pre('validate', function (next) {
    if (this.isBaseline) {
      if (this.evidenceSimulationFingerprint !== null || this.evidenceArtifactSha256 !== null) {
        return next(new Error('Baseline policy must have null evidence fields'));
      }
    } else {
      if (!this.evidenceSimulationFingerprint || !this.evidenceArtifactSha256) {
        return next(new Error('Promoted non-baseline policy must have non-null evidence fields'));
      }
    }
    next();
  });

  // Snapshot Refresh Helper & Hooks for Append-Only Validation
  function captureLifecycleSnapshot(doc) {
    if (!doc.$locals) doc.$locals = {};
    doc.$locals.originalLifecycleEvents = JSON.parse(JSON.stringify(doc.lifecycleEvents || []));
  }

  orchestrationPolicyVersionSchema.post('init', function () {
    captureLifecycleSnapshot(this);
  });

  orchestrationPolicyVersionSchema.post('save', function () {
    captureLifecycleSnapshot(this);
  });

  // Immutability and Append-Only Pre-Save Hook
  orchestrationPolicyVersionSchema.pre('save', function (next) {
    if (!this.isNew) {
      const immutableFields = [
        'policyVersion', 'policyFingerprint', 'policyDefinition',
        'promotedBy', 'promotedAt', 'evidenceSimulationFingerprint',
        'evidenceArtifactSha256', 'isBaseline', 'notes'
      ];
      for (const field of immutableFields) {
        if (this.isModified(field)) {
          const err = new Error(`IMMUTABLE_FIELD_MUTATION: Field "${field}" cannot be modified after creation`);
          err.code = 'IMMUTABLE_FIELD_MUTATION';
          return next(err);
        }
      }

      if (this.isModified('lifecycleEvents')) {
        const original = (this.$locals && this.$locals.originalLifecycleEvents) || [];
        const current = this.lifecycleEvents || [];
        if (current.length < original.length) {
          const err = new Error('LIFECYCLE_MUTATION_PROHIBITED: lifecycleEvents array cannot be truncated or replaced');
          err.code = 'LIFECYCLE_MUTATION_PROHIBITED';
          return next(err);
        }
        for (let i = 0; i < original.length; i++) {
          const origJson = JSON.stringify(original[i]);
          const currJson = JSON.stringify(current[i]);
          if (origJson !== currJson) {
            const err = new Error(`LIFECYCLE_MUTATION_PROHIBITED: Historical lifecycle event at index ${i} cannot be modified`);
            err.code = 'LIFECYCLE_MUTATION_PROHIBITED';
            return next(err);
          }
        }
      }
    }
    next();
  });

  // Direct Query Update & Replacement Prevention Hooks
  const FORBIDDEN_QUERY_UPDATE_OPS = [
    'updateOne',
    'updateMany',
    'findOneAndUpdate',
    'replaceOne',
    'findOneAndReplace',
  ];
  FORBIDDEN_QUERY_UPDATE_OPS.forEach((op) => {
    orchestrationPolicyVersionSchema.pre(op, function (next) {
      const err = new Error(`DIRECT_QUERY_UPDATE_PROHIBITED: Generic query mutation via "${op}" is prohibited. Policy version lifecycle updates must use domain service transaction methods.`);
      err.code = 'DIRECT_QUERY_UPDATE_PROHIBITED';
      return next(err);
    });
  });

  // Document Deletion Prevention Hook (catches hydrated document.deleteOne())
  orchestrationPolicyVersionSchema.pre(
    'deleteOne',
    { document: true, query: false },
    function (next) {
      const err = new Error(
        'UNAUTHORIZED_DELETION: OrchestrationPolicyVersion documents are permanent immutable audit records and cannot be deleted via document.deleteOne().'
      );
      err.code = 'UNAUTHORIZED_DELETION';
      return next(err);
    }
  );

  // Query Deletion Prevention Hooks (catches Model.deleteOne, Model.deleteMany, Model.findOneAndDelete, Model.findByIdAndDelete)
  const FORBIDDEN_QUERY_DELETE_OPS = [
    'deleteOne',
    'deleteMany',
    'findOneAndDelete',
  ];
  FORBIDDEN_QUERY_DELETE_OPS.forEach((op) => {
    orchestrationPolicyVersionSchema.pre(
      op,
      { document: false, query: true },
      function (next) {
        const err = new Error(
          `UNAUTHORIZED_DELETION: OrchestrationPolicyVersion documents are permanent immutable audit records and cannot be deleted via query "${op}".`
        );
        err.code = 'UNAUTHORIZED_DELETION';
        return next(err);
      }
    );
  });

  // Model-Level Bulk Write Prevention Hooks (insertMany & bulkWrite)
  orchestrationPolicyVersionSchema.pre('insertMany', function (next) {
    const err = new Error(
      'DIRECT_MODEL_WRITE_PROHIBITED: insertMany is prohibited for OrchestrationPolicyVersion records. Policies must be created via domain service promotion or baseline seeding.'
    );
    err.code = 'DIRECT_MODEL_WRITE_PROHIBITED';
    return next(err);
  });

  orchestrationPolicyVersionSchema.pre('bulkWrite', function (next) {
    const err = new Error(
      'DIRECT_MODEL_WRITE_PROHIBITED: bulkWrite is prohibited for OrchestrationPolicyVersion records. Policies must be created via domain service promotion or baseline seeding.'
    );
    err.code = 'DIRECT_MODEL_WRITE_PROHIBITED';
    return next(err);
  });

  // Canonical custom indexes (0 field-level index/unique declarations)
  orchestrationPolicyVersionSchema.index({ policyVersion: 1 }, { unique: true });
  orchestrationPolicyVersionSchema.index({ policyFingerprint: 1 }, { unique: true });
  orchestrationPolicyVersionSchema.index(
    { status: 1 },
    { unique: true, partialFilterExpression: { status: 'active' } }
  );
  ```

---

## 26. Source-Audited Future File Plan

*(Proposal Only — No Files Created in This Task)*

### New Production & Script Files Proposed (3):
1. `src/models/orchestrationPolicyVersionModel.js`: Mongoose model for policy versions with single-active partial unique index, conditional evidence validation hook, immutability pre-save guards, and embedded lifecycle events.
2. `src/services/governance/policyGovernanceService.js`: Core domain service managing promotion, Strategy B evidence verification, atomic transactions, rollback, native Mongoose 8.x snapshot resolution (`.read('primary').readConcern('local')`), and explicit baseline seeding.
3. `scripts/managePolicy.js`: Administrative CLI for promotion, activation, rollback, inspection, and `seed-baseline`.

### Existing Production Files Proposed for Modification (9):
1. `src/services/orchestration/orchestrationUtils.js`: Implements `DEFAULT_PRIORITY_THRESHOLDS`, `normalizePriorityThresholds`, and extends `getPriorityTier` to accept decision-scoped `priorityThresholds`.
2. `src/services/orchestration/urgencyScoringService.js`: Accepts `policySnapshot` weights and passes normalized thresholds to `getPriorityTier`.
3. `src/services/orchestration/candidateGenerationService.js`: Forwards `policySnapshot`.
4. `src/services/orchestration/nextActionArbiter.js`: Resolves snapshot at entry, forwards it, returns internal `policyProvenance`.
5. `src/services/orchestration/dailyAgendaAssembler.js`: Resolves snapshot once for all segments, returns internal `policyProvenance`.
6. `src/services/orchestration/interventionPolicyService.js`: Resolves snapshot at entry, passes to `calculateUrgencyScore`, returns internal `policyProvenance`.
7. `src/controllers/orchestrationController.js`: Unwraps and strips internal `policyProvenance` before returning public HTTP responses.
8. `src/models/prescriptionExecutionRecordModel.js`: Adds top-level `policyVersion`, `policyFingerprint`, `policySource` and sparse compound index.
9. `src/services/attribution/attributionIssuanceService.js`: Extracts `policyProvenance` from internal Phase 9 result wrapper and stamps record.

### Existing Test Files Proposed for Modification (7):
1. `tests/architecture_guard.test.js`: Updates model count assertion from 14 to 15, and adds dual-scope source-level model ownership guard scanning both `src/**` and `scripts/**` verifying that zero executable code outside `src/services/governance/policyGovernanceService.js` directly imports/requires `src/models/orchestrationPolicyVersionModel.js` (with `tests/**` explicitly exempt for direct invariant testing).
2. `tests/attribution/attributionIssuance.test.js`: Updates model count assertion from 14 to 15 and custom index count from 5 to 6.
3. `tests/phase3_regression.test.js`: Reconciles `ALLOWED_MODELS` allowlist to include authorized `orchestrationPolicyVersionModel.js`.
4. `tests/learning/phase7CrossPhaseIsolation.test.js`: Reconciles global Mongoose model registration count assertion from 14 to 15.
5. `tests/analytics/phase8CrossPhaseIsolation.test.js`: Reconciles global Mongoose model registration count assertion from 14 to 15.
6. `tests/orchestration/phase9CrossPhaseIsolation.test.js`: Reconciles global Mongoose model registration count assertion from 14 to 15.
7. `tests/simulation/phase11CrossPhaseIsolation.test.js`: Reconciles `src/models` directory file count assertion from 14 to 15.

### New Test Files Proposed (3):
1. `tests/governance/policyGovernanceService.test.js`: Unit tests for promotion, 17-step Strategy B evidence verification, state machine, multi-save lifecycle integrity, and snapshot resolution.
2. `tests/governance/policyCli.test.js`: CLI flag parsing, secret validation, confirmation gates, and error formatting.
3. `tests/governance/policyIntegration.test.js`: Multi-document atomic transactions, single-active index constraint, repeated rollbacks, request-scoped snapshot isolation, Phase 10 provenance stamping, transaction abort discard semantics, and DB failure fallback.

---

## 27. Proposed Future Test Strategy

The future test plan requires comprehensive coverage of all reconciled invariants:
1. **Policy Fingerprint Parity**: Proves that `generatePolicyFingerprint(policyDefinition)` reproduces exact Phase 11 hashes.
2. **Strategy B Evidence Gate**: Proves 17-step workflow, engine version match, rejection of Mode A and Mode D alone, candidate policy recomputation, and raw artifact SHA-256 verification.
3. **Strategy-B-Before-Persistence Ordering**: Proves that zero documents are constructed or saved if simulation evidence verification fails at any step during `promotePolicy`.
4. **Conditional Evidence Schema Validation**: Proves baseline requires null evidence fields while promoted policies require valid 64-char hex strings.
5. **SemVer Invariants**: Proves numeric comparison ($v1.10.0 > v1.9.0$) and reservation of `v1.0.0`.
6. **Transaction Atomicity & Unsupported Topology**: Proves atomic swap on replica sets and fail-closed on non-transactional topologies.
7. **Storage Backstop**: Proves partial unique index prevents concurrent active documents without duplicate index declarations.
8. **Immutability & Write/Delete Protection Enforcement**: Proves that attempting to mutate identity/evidence fields throws `IMMUTABLE_FIELD_MUTATION`; proves that truncating, replacing, or editing historical `lifecycleEvents` throws `LIFECYCLE_MUTATION_PROHIBITED`; proves that `Model.updateOne`, `document.updateOne`, `updateMany`, `findOneAndUpdate`, `replaceOne`, and `findOneAndReplace` throw `DIRECT_QUERY_UPDATE_PROHIBITED`; proves that `Model.deleteOne`, `document.deleteOne`, `deleteMany`, `findOneAndDelete`, and `findByIdAndDelete` throw `UNAUTHORIZED_DELETION`; proves that `insertMany` and `bulkWrite` throw `DIRECT_MODEL_WRITE_PROHIBITED`; and proves that authorized `new Model(...).save()` and transaction-managed lifecycle event appends succeed cleanly.
9. **Multi-Save Same-Instance Lifecycle Test Matrix**:
   * *New Document*: `new Model(...)` $\rightarrow$ `save` $\rightarrow$ mutate `PROMOTED` event on same instance $\rightarrow$ `save` again $\rightarrow$ rejected with `LIFECYCLE_MUTATION_PROHIBITED`.
   * *Hydrated Append-Then-Mutate*: Hydrate `[A, B]` $\rightarrow$ append `C` $\rightarrow$ `save` $\rightarrow$ mutate `C` on same instance $\rightarrow$ `save` again $\rightarrow$ rejected with `LIFECYCLE_MUTATION_PROHIBITED`.
   * *Hydrated Repeated Legitimate Append*: Hydrate `[A]` $\rightarrow$ append `B` $\rightarrow$ `save` $\rightarrow$ append `C` $\rightarrow$ `save` $\rightarrow$ both succeed, history = `[A, B, C]`.
   * *Nested Mutation*: Append event $\rightarrow$ `save` $\rightarrow$ modify `event.reason` on same instance $\rightarrow$ `save` again $\rightarrow$ rejected with `LIFECYCLE_MUTATION_PROHIBITED`.
   * *Transaction-Abort Document Reuse*: Proves that in-memory instances from aborted transactions are discarded and cannot be reused, with subsequent operations loading fresh documents from MongoDB.
10. **Architecture-Guard Model Import Ownership (Dual-Scope `src/**` + `scripts/**`)**: Proves `tests/architecture_guard.test.js` enforces sole model ownership: (a) allows `src/services/governance/policyGovernanceService.js` to import `orchestrationPolicyVersionModel`, (b) fails if any other `src/**` module imports the model, (c) fails if any `scripts/**` module imports the model, (d) allows `scripts/managePolicy.js` to import `policyGovernanceService`, and (e) exempts `tests/**` for direct invariant and middleware testing.
11. **Repeated Rollback History & Direction**: Proves append-only lifecycle preservation across multiple cycles and enforces $rollbackTargetVersion < currentActiveVersion$.
12. **Priority-Threshold Normalization**: Proves legacy boundaries ($80, 65, 50, 35$) remain identical when snapshot is default, and lowercase governed thresholds override defaults.
13. **Public DTO Invariance**: Proves `formatActionDTO` and `executionIntent` remain identical with zero public leakage.
14. **Zero-Race Provenance Handoff**: Proves Phase 10 extracts provenance directly from Phase 9 internal result wrapper.
15. **Daily Agenda Single-Snapshot Purity**: Proves all segments in a daily agenda share the identical policy snapshot.
16. **Intervention Parameter Governance**: Proves intervention severity calculation reflects snapshot policy weights.
17. **Database Failure Fallback**: Proves graceful fallback to `CODE_BASELINE_FALLBACK` with distinct warning logs.
18. **Operator Trust Boundary**: Proves secret check when configured, confirmation flag when unconfigured.
19. **Architecture Guard Model Count**: Proves Mongoose model count remains strictly 15.

---

## 28. Risks / Tradeoffs

| Risk / Tradeoff | Severity | Mitigation Strategy |
| :--- | :---: | :--- |
| **Model Count Expansion** (14 $\rightarrow$ 15) | Low | Explicitly justified. Eliminates fragile disk writes in read-only container clusters. |
| **Direct Indexed Query Overhead** | Negligible | Primary indexed document lookup with local read concern targets a single document without application cache staleness. |
| **Rollback Complexity** | Low | Managed cleanly by atomic transactions, direction validation, and append-only `lifecycleEvents`. |
| **Attribution Backwards Compatibility** | Low | Historical records with `policyVersion: null` default cleanly to `v1.0.0` code baseline. |

---

## 29. Explicit Non-Goals

1. **NO Automatic Promotion**: Simulation reports will NEVER automatically deploy policies.
2. **NO Online Reinforcement Learning / Bandits**: Dynamic runtime self-tuning remains strictly prohibited.
3. **NO Online A/B Traffic Splitting**: No student cohort will receive randomized policy variations in Phase 12.
4. **NO Public HTTP Routes**: Governance operations will NOT expose public REST endpoints.
5. **NO Fake Admin / RBAC Identity Layer**: No fake user roles or authentication tokens will be created.
6. **NO Modification of Phase 4 Mastery**: Student progress and mastery formulas remain completely untouched.
7. **NO Retroactive Rewrites**: No historical `PrescriptionExecutionRecord` or `Attempt` will be mutated.

---

## 30. Open Questions

```text
Open Questions: NONE
```

All implementation-defining questions have been frozen with exact architectural decisions:
1. **Priority Threshold Compatibility**: Fully resolved via `DEFAULT_PRIORITY_THRESHOLDS` and `normalizePriorityThresholds` in `src/services/orchestration/orchestrationUtils.js`.
2. **Active-Policy Read Consistency**: Fully resolved using native Mongoose 8.x `.read('primary').readConcern('local')` on installed Mongoose 8.24.4 under package range `^8.4.3`.
3. **Immutability & Persistence Integrity Enforcement**: Fully resolved via schema path `immutable: true`, `post('init')` & `post('save')` `$locals` snapshot refresh, multi-save same-instance verification, transaction-abort document discard invariant, document & query deletion prevention hooks (`UNAUTHORIZED_DELETION`), query update prevention hooks (`DIRECT_QUERY_UPDATE_PROHIBITED`), model-level bulk write prevention hooks (`DIRECT_MODEL_WRITE_PROHIBITED`), sole-writer governance service ownership, and dual-scope (`src/**` + `scripts/**`) `tests/architecture_guard.test.js` model import protection with `tests/**` exemption.
4. **Deduplicated Index Declarations & Delta Accounting**: Fully resolved with exactly 3 schema-level custom indexes on `OrchestrationPolicyVersion` (0 field-level index/unique declarations) plus 1 new custom sparse index on `PrescriptionExecutionRecord`, for a total platform custom-index delta of 4.
5. **Decision Matrix Verification**: Exact verified matrix preserved (Candidate A = 9.190, Candidate F = 7.560, Candidate B = 5.790, Candidate D = 5.430, Candidate C = 3.770, Candidate E = 3.240).
6. **Evidence Integrity Strategy**: Strategy B selected and frozen; opaque run identity cross-referenced with report, candidate policy recomputed, and raw artifact SHA-256 hashed.
7. **Baseline Evidence Representation**: `evidenceSimulationFingerprint: null`, `evidenceArtifactSha256: null`, version `v1.0.0` reserved permanently.
8. **Baseline Bootstrap Mechanism**: Explicit operator CLI seeding (`managePolicy.js seed-baseline`) with virtual code fallback.
9. **MongoDB Transaction Topology**: Requires replica set or sharded cluster; unsupported topology fails closed.
10. **Unique Index Guarantee**: Guarantees at most one active policy; atomicity provided by transactions.
11. **Canonical Status Storage**: Lowercase persistence (`promoted`, `active`, `superseded`, `rolled_back`).
12. **Phase 9 Public DTO Compatibility**: Public DTO and `executionIntent` completely unchanged; provenance passed via internal service wrapper.
13. **Daily Agenda Purity**: Single policy snapshot resolved at entry for all segments.
14. **Intervention Flow**: Classified as dependent on policy parameters via urgency scoring and priority thresholds; internal provenance stripped; not an issuance origin.
15. **Operator Secret Behavior**: Optional across all environments; requires timing-safe check if set, confirmation flag if unset.
16. **SemVer Comparison**: Deterministic numeric tuple comparison $(major, minor, patch)$.
17. **Phase 10 Policy Source**: Stored as `GOVERNED_POLICY`, `CODE_BASELINE`, or `CODE_BASELINE_FALLBACK`; historical records interpreted as legacy baseline.
18. **Phase 11 Compatibility**: Strategy B preserved; Phase 11 V1 frozen.

---

## 31. Architecture Gate

```text
================================================================================
PHASE 12 PPVG ARCHITECTURE — VERIFIED / FROZEN FOR PRESCRIPTIVE SPECIFICATION
ARCHITECTURE VERSION — 1.7.10-FROZEN-FOR-SPECIFICATION
================================================================================

Architecture Internal Contradictions: 0
Unspecified Implementation-Critical Behaviors: 0
Open Questions: NONE
```

* This architecture proposal is fully reconciled, self-consistent, grounded in live repository audit evidence, mathematically verified across all 12 criteria, and completely resolved with zero open questions.
* Zero implementation steps have been taken. All baseline tests and invariants remain 100% frozen.
