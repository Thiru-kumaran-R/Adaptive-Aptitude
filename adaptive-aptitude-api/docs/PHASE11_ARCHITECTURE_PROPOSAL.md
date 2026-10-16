# PHASE 11 ARCHITECTURE PROPOSAL

## Policy Calibration & Offline Simulation Engine (PPCO)

---

| Metadata Field | Value |
| :--- | :--- |
| **Document Version** | `1.5.0-RECONCILED` |
| **Status** | `PROPOSED / VERIFIED FOR AUTHORITATIVE SPECIFICATION` |
| **Author** | Google Antigravity Agentic Team |
| **Target Repository** | `adaptive-aptitude-api` |
| **Preceding Gate** | Phase 10 — PAOA (`VERIFIED / CLOSED`) |
| **Baseline Platform State** | 14 Mongoose Models, 14 MongoDB Collections, 72/72 Jest Suites Passing, 936/936 Tests Passing |
| **Primary Scope** | Offline Policy Calibration, Observed-Action Sensitivity Analysis (Mode A), Synthetic Archetype Policy Comparison (Mode B), Adherence-Stratified Outcome Intelligence |

---

## 1. Executive Summary

With the formal verification and closure of **Phase 10 (Prescription Adherence & Learning Outcome Attribution Engine — PAOA)**, the adaptive aptitude learning platform possesses a complete, verified closed-loop pedagogical persistence foundation. The platform arbitrates pedagogical next-best-actions (Phase 9) and tracks whether prescribed study activities were activated, completed, abandoned, or expired, alongside empirical outcome snapshots across all six canonical action types.

However, an authoritative systemic gap remains: **the system possesses no capability to evaluate how its orchestration policies are behaving, how candidate policy configurations would behave, or where heuristic scoring weights produce priority inversions—without risking live student disruption.**

This document defines the fully reconciled architecture for **Phase 11: Policy Calibration & Offline Simulation Engine (PPCO)**.

PPCO establishes an offline, deterministic, and statistically rigorous intelligence harness that consumes historical Phase 10 records and evaluates candidate policy parameter variants across two strictly separated analytical modes:
1. **Mode A — Observed-Action Sensitivity Analysis (`OBSERVED_ACTION_SENSITIVITY`)**: Evaluates parameter sensitivity on historical actions that Phase 9 actually selected. It evaluates support on a strict per-parameter and score-precision basis via `support(record, candidatePolicyDelta)`, distinguishing raw IEEE-754 reconstructibility (`RAW_EXACT`, `scoreSource: RECONSTRUCTED_RAW`) from rounded DTO-anchored approximations (`PARTIAL`, `scoreSource: PERSISTED_ROUNDED_DTO`) and missing inputs (`UNSUPPORTED`). It strictly measures score and tier shift for the observed action, without falsely claiming alternative candidate selections.
2. **Mode B — Synthetic Archetype Policy Comparison (`ARCHETYPE_POLICY_COMPARISON`)**: Evaluates candidate policies side-by-side against six canonical, fully specified synthetic student archetype vectors containing complete candidate sets, executing live raw IEEE-754 scoring logic to calculate simulated action disagreement rates, rank shifts, and priority tier migrations.
3. **Adherence-Stratified Descriptive Outcome Intelligence**: Groups empirical Phase 10 completion and milestone rates across action types, priority tiers, and baseline bands, enforcing strict non-causal attribution language.
4. **Zero Live Contamination & Zero Database Expansion (Option A)**: Phase 11 operates strictly offline/internally. It introduces **0 new Mongoose models, 0 new MongoDB collections (retaining exactly 14 models and 14 collections), and 0 HTTP routes**. All simulation outputs are deterministic, SHA-256 fingerprinted local JSON report artifacts.

---

## 2. Frozen Phase 1–10 Capability Map

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

### Authoritative Phase 4 Contract Reconciliation
Phase 4 mastery is **strictly deterministic and non-probabilistic**. There is no Bayesian mastery, no exponential moving average (EMA), no latent-state probability, and no streak dampening. Time taken is explicitly excluded from mastery calculation. The frozen formulas from `src/services/adaptive/masteryService.js` are:

$$\text{rawMastery} = (0.55 \times \text{recentAccuracy}) + (0.25 \times \text{overallAccuracy}) + (0.20 \times \text{recentDifficultyCompetence})$$

$$\text{attemptConfidence} = \min\left(\frac{\text{totalAttempts}}{10}, 1.0\right)$$

$$\text{confidenceMultiplier} = 0.60 + (0.40 \times \text{attemptConfidence})$$

$$\text{finalMastery} = \text{clamp}(\text{rawMastery} \times \text{confidenceMultiplier}, 0.0, 1.0)$$

- Recent mastery window: exactly 10 attempts.
- Confidence full threshold: exactly 10 attempts.
- Prerequisite mastery threshold: $0.70$.
- Default start difficulty: 2.
- Difficulty step-up accuracy: $\ge 0.80$ (with $\ge 3$ attempts at current difficulty).
- Difficulty step-down accuracy: $< 0.40$.

### Frozen Persistence Invariant
The platform persistence baseline consists of **strictly 14 Mongoose models** mapped to **strictly 14 MongoDB collections**:
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

---

## 3. Post-Phase-10 Gap Analysis

With Phase 10 closed, the system records rich observational evidence regarding what was recommended, what was attempted, what was completed, and what subsequent learning state transitions occurred.

However, critical systemic questions cannot currently be answered:
1. **Policy Black-Box Behavior**: Are the static Phase 9 weights ($W_{\text{PREREQUISITE}} = 50.0$, $W_{\text{OVERDUE}} = 45.0$, $W_{\text{DUE\_TODAY}} = 35.0$, $W_{\text{CURRICULUM}} = 30.0$, $W_{\text{BENCHMARK}} = 25.0$, $W_{\text{PACING}} = 20.0$) producing balanced pedagogical prioritization across different student archetypes?
2. **Policy Sensitivity Blind Spots**: How sensitive are priority tiers to small adjustments in base weights, mastery-deficit scaling weights, or goal impact and temporal caps?
3. **Inability to Test Policy Innovations Safely**: If curriculum experts propose adjusting revision base weights, mastery-deficit scaling, goal-impact caps, temporal caps, or priority thresholds, there is currently **no sandbox** to evaluate this policy without modifying live production code and affecting active learners. (The continuous deadline proximity curve remains inherited and frozen in V1.)
4. **Absence of Systematic Disagreement Profiling**: When tuning heuristic scoring parameters, developers cannot quantify the *Simulated Action Disagreement Rate* across canonical student archetype vectors.

---

## 4. Live Source Audit

To ground Phase 11 in absolute architectural truth, a comprehensive audit of live source code was conducted:

| Module / File Path | Actual Export Name | Actual Signature / Functionality | Read / Write Behavior | Key Indexes & Semantics | Error Semantics |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `src/models/prescriptionExecutionRecordModel.js` | `PrescriptionExecutionRecord` | Mongoose Model (`prescriptionexecutionrecords`) | Read / Write (Phase 10 only) | 5 custom indexes: `{ prescriptionId: 1 }` (unique), `{ userId: 1, issuanceIdempotencyKey: 1 }` (unique), `{ nonTerminalSlotKey: 1 }` (unique partial), `{ userId: 1, issuedAt: -1 }`, `{ status: 1, expiresAt: 1 }` | Schema validation errors |
| `src/config/attributionConfig.js` | `attributionConfig` | Frozen Object | Read-only | `ALGORITHM_VERSION: 'v1'`, `PRESCRIPTION_TTL_HOURS: 24`, `SUMMARY_DEFAULT_WINDOW_DAYS: 30`, `SUMMARY_MAX_WINDOW_DAYS: 90`, `SUMMARY_EVALUATED_LIMIT: 500`, `SUMMARY_PROBE_LIMIT: 501` | Immutable |
| `src/services/attribution/attributionSummaryService.js` | `getAttributionSummary` | `async ({ userId, windowDays, actionType, referenceNow })` | Read-only | Queries `PrescriptionExecutionRecord` with `{ userId, issuedAt: { $gte, $lte } }`, sort `{ issuedAt: -1, _id: 1 }`, limit 501 | 400 `VALIDATION_ERROR` |
| `src/config/orchestrationConfig.js` | `orchestrationConfig` | Frozen Object / Named Exports | Read-only | Defines `ORCHESTRATION_ALGORITHM_VERSION: 'v1'`, base weights `BASE_WEIGHTS`, priority thresholds `PRIORITY_THRESHOLDS`, action taxonomy, reason codes | Immutable |
| `src/services/orchestration/urgencyScoringService.js` | `calculateUrgencyScore`, `compareCandidates`, `getBaseWeight`, `getPolicyPriorityClass` | Pure mathematical / comparator functions | In-memory / CPU-only | Computes internal raw unrounded IEEE-754 urgency score: $U = W_{\text{type}} + S_{\text{deficit}} + I_{\text{goal}} + T_{\text{temporal}}$; 7-tier deterministic ranking comparator | None (pure functions) |
| `src/services/orchestration/nextActionArbiter.js` & `dailyAgendaAssembler.js` | `formatActionDTO` | Pure serialization function | In-memory | Transforms internal raw candidate into public action DTO. Specifically executes `urgencyScore: roundTo(action.urgencyScore, 2)` (2 decimal places) | None |
| `src/services/orchestration/orchestrationUtils.js` | `roundTo` | `(value, decimals = 2) => Math.round(value * 10^decimals) / 10^decimals` | Pure utility | Applies standard IEEE-754 nearest-half-up rounding to fixed decimals | None |
| `src/services/attribution/attributionIssuanceService.js` | `issuePrescription` | `async ({ userId, originSurface, candidateAction, referenceNow, idempotencyKey })` | Read / Write | Persists `candidateAction.urgencyScore` (from formatted DTO) into `PrescriptionExecutionRecord.urgencyScore` | 400 / 409 / 500 errors |
| `src/services/analytics/readinessService.js` | `getGoalReadiness`, `reconstructMockScopePatterns` | `async (userId, goalId, referenceNow)` | Read-only | Evaluates mock exam readiness score ($0.0 - 1.0$), components DTO, critical prerequisite bottlenecks. *Note: `calculateReadinessIndex` does NOT exist.* | 404 / 403 / 400 errors |
| `src/services/analytics/speedAccuracyMatrixService.js` | `getSpeedAccuracyMatrix` | `async (userId, windowDays, topic, referenceNow)` | Read-only | Classifies rushing, sluggish, accurate quadrants, computes rushingRiskScore. *Note: `calculateSpeedAccuracyMatrix` does NOT exist.* | Read-only |
| `src/services/analytics/staminaAnalyticsService.js` | `getStaminaCurve` | `async (userId)` | Read-only | Whole-exam quartile endurance curve, fatigue drop-off calculation. | Read-only |
| `src/services/analytics/retentionAnalyticsService.js` | `getRetentionAnalytics` | `async (userId, referenceNow)` | Read-only | Spaced retention gap analysis, stage distribution, due/overdue counts. | Read-only |
| `src/services/analytics/dashboardAggregateService.js` | `getDashboardAnalytics` | `async (userId, referenceNow)` | Read-only | Multi-dimensional student summary, radar chart, focus topics. | Read-only |
| `src/services/analytics/topicDiagnosticsService.js` | `evaluateTopicDiagnostics`, `buildTopicMasteryRadar`, `computePriorityFocusTopics` | `async (userId, topicNames)` | Read-only | Diagnostic mastery across 24 canonical topics, unrounded ranking comparators. | Read-only |

### Audit Confirmation: Absence of Non-Existent Services
Live source inspection conclusively proves that **`learningVelocityService.js` DOES NOT EXIST** anywhere in the codebase. All references to it as an existing subsystem have been completely excised. Phase 8 analytics consists exclusively of the six services listed above.

---

## 5. Candidate Phase 11 Capabilities

Six distinct capabilities were evaluated for Phase 11:

### Candidate A — Policy Calibration & Offline Simulation Engine (PPCO)
- **Concept**: An offline intelligence and simulation harness that evaluates historical Phase 10 prescriptions and simulates alternative Phase 9 orchestration policies over historical snapshots and synthetic student archetypes.
- **Scope**: Observed-action sensitivity analysis, synthetic archetype policy comparison, adherence-stratified outcome summaries, and offline policy calibration reports.

### Candidate B — Goal Feasibility & Learning Velocity Forecasting Engine
- **Concept**: Longitudinal predictive modeling engine projecting expected goal completion dates based on historical attempt velocity.
- **Scope**: Forecasting milestone dates, estimating syllabus completion feasibility.
- **Evaluation**: Heavily overlaps with existing Phase 8 capabilities (`readinessService`, `dashboardAggregateService`, and `topicDiagnosticsService`), while completely ignoring the newly created Phase 10 adherence records.

### Candidate C — Institutional / Teacher Cohort Intelligence
- **Concept**: Multi-tenant aggregation engine providing class/cohort level dashboards and teacher assignment tools.
- **Evaluation**: The platform has **zero authentication, zero RBAC, and no concept of Teacher, Classroom, or School**. Introducing institutional concepts would require an unvetted identity architecture, violating single-student separation.

### Candidate D — Real-Time Intervention Personalization
- **Concept**: Dynamic feedback controller that alters Phase 9 next-action selection in real-time based on the student's immediate adherence history.
- **Evaluation**: Violates Phase 9's deterministic, idempotent arbitration contract. Risks creating destabilizing feedback loops (e.g., student abandons remediation $\rightarrow$ policy reduces remediation $\rightarrow$ prerequisite never unblocked).

### Candidate E — Controlled Experimentation / A/B Testing Framework
- **Concept**: Online randomized A/B experimentation platform assigning students to policy variants at runtime to measure causal treatment effects.
- **Evaluation**: Requires invasive runtime mutations to Phase 9 (injecting dynamic policy routers into live arbitration). Excessively complex operationally for the current single-instance deployment model.

### Candidate F — Feature Freeze / Hardening
- **Concept**: Terminating functional development and focusing solely on load testing, documentation, and maintenance.
- **Evaluation**: Leaves the closed-loop learning architecture incomplete. The system collects Phase 10 attribution data but possesses zero capability to analyze or leverage it to improve orchestration.

---

## 6. Corrected 12-Criterion Decision Matrix

To ensure rigorous evaluation, all six candidates were scored across **exactly 12 clearly distinct criteria** using weights totaling **strictly 100%**. Every weighted total is mathematically and deterministically verified:

$$\text{weightedTotal} = \sum_{i=1}^{12} (\text{weightDecimal}_i \times \text{score}_i)$$

| # | Criterion | Weight | Cand A: PPCO | Cand B: Forecast | Cand C: Cohort | Cand D: Real-Time | Cand E: A/B Test | Cand F: Freeze |
| :-: | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| 1 | **Educational Value** | 12% | 9.0 | 6.5 | 6.0 | 7.0 | 8.5 | 3.0 |
| 2 | **Architectural Fit (Node/Mongo)** | 12% | 9.5 | 8.0 | 4.0 | 6.5 | 5.0 | 10.0 |
| 3 | **Direct Use of Phase 10 Data** | 12% | 10.0 | 2.0 | 4.0 | 8.0 | 7.0 | 0.0 |
| 4 | **Non-Duplication with Phases 1–10** | 12% | 9.5 | 4.0 | 7.0 | 4.0 | 7.0 | 10.0 |
| 5 | **Deterministic Testability** | 10% | 10.0 | 7.0 | 7.0 | 4.0 | 5.0 | 10.0 |
| 6 | **Operational Simplicity** | 8% | 9.0 | 8.0 | 4.0 | 5.0 | 3.0 | 10.0 |
| 7 | **Persistence Complexity (Low Footprint)** | 8% | 10.0 | 7.0 | 4.0 | 6.0 | 4.0 | 10.0 |
| 8 | **API / Surface Simplicity** | 6% | 10.0 | 7.0 | 2.0 | 7.0 | 4.0 | 10.0 |
| 9 | **Data Sufficiency** | 6% | 8.5 | 6.0 | 5.0 | 6.0 | 5.0 | 10.0 |
| 10 | **Statistical Validity** | 6% | 9.0 | 6.0 | 6.0 | 5.0 | 9.0 | 10.0 |
| 11 | **Risk of Misleading Conclusions (Low Risk)**| 4% | 8.5 | 5.0 | 5.0 | 5.0 | 8.0 | 9.0 |
| 12 | **Future Extensibility** | 4% | 9.5 | 6.5 | 6.0 | 7.0 | 9.0 | 2.0 |
| **Σ** | **TOTAL WEIGHTED SCORE** | **100%** | **9.45 / 10** | **5.96 / 10** | **5.08 / 10** | **5.90 / 10** | **6.12 / 10** | **7.60 / 10** |

---

## 7. Mathematical Verification of All Six Candidate Totals

To prevent any arithmetic regression, each candidate total is derived explicitly from the displayed weights and raw scores:

$$\begin{aligned}
\text{Total} = \; & 0.12 \times S_1 + 0.12 \times S_2 + 0.12 \times S_3 + 0.12 \times S_4 + 0.10 \times S_5 + 0.08 \times S_6 \\
& + 0.08 \times S_7 + 0.06 \times S_8 + 0.06 \times S_9 + 0.06 \times S_{10} + 0.04 \times S_{11} + 0.04 \times S_{12}
\end{aligned}$$

1. **Candidate A (PPCO)**:
   - Calculation: $0.12(9.0 + 9.5 + 10.0 + 9.5) + 0.10(10.0) + 0.08(9.0 + 10.0) + 0.06(10.0 + 8.5 + 9.0) + 0.04(8.5 + 9.5)$
   - Intermediate Products: $0.12(38.0) + 1.00 + 0.08(19.0) + 0.06(27.5) + 0.04(18.0) = 4.56 + 1.00 + 1.52 + 1.65 + 0.72 = \mathbf{9.45}$
2. **Candidate B (Goal Feasibility & Learning Velocity Forecasting)**:
   - Calculation: $0.12(6.5 + 8.0 + 2.0 + 4.0) + 0.10(7.0) + 0.08(8.0 + 7.0) + 0.06(7.0 + 6.0 + 6.0) + 0.04(5.0 + 6.5)$
   - Intermediate Products: $0.12(20.5) + 0.70 + 0.08(15.0) + 0.06(19.0) + 0.04(11.5) = 2.46 + 0.70 + 1.20 + 1.14 + 0.46 = \mathbf{5.96}$
3. **Candidate C (Institutional / Teacher Cohort Intelligence)**:
   - Calculation: $0.12(6.0 + 4.0 + 4.0 + 7.0) + 0.10(7.0) + 0.08(4.0 + 4.0) + 0.06(2.0 + 5.0 + 6.0) + 0.04(5.0 + 6.0)$
   - Intermediate Products: $0.12(21.0) + 0.70 + 0.08(8.0) + 0.06(13.0) + 0.04(11.0) = 2.52 + 0.70 + 0.64 + 0.78 + 0.44 = \mathbf{5.08}$
4. **Candidate D (Real-Time Intervention Personalization)**:
   - Calculation: $0.12(7.0 + 6.5 + 8.0 + 4.0) + 0.10(4.0) + 0.08(5.0 + 6.0) + 0.06(7.0 + 6.0 + 5.0) + 0.04(5.0 + 7.0)$
   - Intermediate Products: $0.12(25.5) + 0.40 + 0.08(11.0) + 0.06(18.0) + 0.04(12.0) = 3.06 + 0.40 + 0.88 + 1.08 + 0.48 = \mathbf{5.90}$
5. **Candidate E (Controlled Experimentation / A/B Testing)**:
   - Calculation: $0.12(8.5 + 5.0 + 7.0 + 7.0) + 0.10(5.0) + 0.08(3.0 + 4.0) + 0.06(4.0 + 5.0 + 9.0) + 0.04(8.0 + 9.0)$
   - Intermediate Products: $0.12(27.5) + 0.50 + 0.08(7.0) + 0.06(18.0) + 0.04(17.0) = 3.30 + 0.50 + 0.56 + 1.08 + 0.68 = \mathbf{6.12}$
6. **Candidate F (Feature Freeze / Hardening)**:
   - Calculation: $0.12(3.0 + 10.0 + 0.0 + 10.0) + 0.10(10.0) + 0.08(10.0 + 10.0) + 0.06(10.0 + 10.0 + 10.0) + 0.04(9.0 + 2.0)$
   - Intermediate Products: $0.12(23.0) + 1.00 + 0.08(20.0) + 0.06(30.0) + 0.04(11.0) = 2.76 + 1.00 + 1.60 + 1.80 + 0.44 = \mathbf{7.60}$

**Verdict**: **Candidate A (PPCO) conclusively and objectively wins the selection matrix with a score of 9.45 / 10.**

---

## 8. Selected Capability: PPCO

**Selected Architecture**: **Policy Calibration & Offline Simulation Engine (PPCO)**.

PPCO operates as an offline evaluation engine with two distinct analytical modes:
1. **Mode A — Observed-Action Sensitivity Analysis**: Evaluates parameter sensitivity exclusively on the historical action selected by Phase 9, strictly avoiding claims about unpersisted alternative candidates.
2. **Mode B — Synthetic Archetype Policy Comparison**: Evaluates candidate policies against fully specified synthetic student archetype vectors where complete candidate sets exist, enabling exact calculation of simulated action disagreement rates and rank shifts.

---

## 9. Why PPCO Does Not Duplicate Phases 1–10

| Phase | Phase 1–10 Authoritative Boundary | Phase 11 PPCO Boundary | Distinction |
| :--- | :--- | :--- | :--- |
| **Phase 4** | Computes current student mastery ($M$) and streak updates | Reads frozen mastery values from snapshots | PPCO does not calculate student mastery or modify `StudentProgress`. |
| **Phase 5** | Schedules spaced revision and daily objectives | Analyzes historical revision adherence | PPCO does not generate study plans or schedule revision items. |
| **Phase 6** | Generates blueprints, delivers mock tests, scores exams | Analyzes benchmark mock completion outcomes | PPCO does not deliver mock sessions or score responses. |
| **Phase 7** | Generates LLM advisory hints, explanations, reviews | Strictly excluded | PPCO has zero LLM dependencies and does not evaluate natural language. |
| **Phase 8** | Computes live student readiness, velocity, and matrices | Compares policy parameter sensitivities | Phase 8 produces live longitudinal metrics for a student; PPCO evaluates policy algorithms offline. |
| **Phase 9** | Arbitrates live next-best-actions for active learners | Re-scores snapshots under hypothetical policies | Phase 9 executes live in production; PPCO executes offline for analysis only. |
| **Phase 10** | Tracks prescription lifecycle and attributes outcomes | Consumes attribution records as historical dataset | Phase 10 records what happened; PPCO evaluates how well the policy performed. |

---

## 10. Exact Ownership Boundary

### What Phase 11 PPCO OWNS
1. **Candidate Policy Parameter Definitions**: Validated configuration objects representing alternative Phase 9 scoring parameters (base weights, mastery-deficit scaling weight, goal-impact and temporal caps, priority thresholds).
2. **Mode A Observed-Action Sensitivity Engine**: Deterministic re-scoring of historical selected actions to measure score delta and tier migration, evaluated per-parameter and with explicit score precision.
3. **Mode B Synthetic Archetype Simulation Engine**: Deterministic execution of candidate policies across canonical multi-candidate archetype vectors to calculate simulated action disagreement rates.
4. **Adherence-Stratified Descriptive Aggregation**: Multi-dimensional grouping of Phase 10 completion and milestone rates across policy segments.
5. **Deterministic Report Generation**: Production of SHA-256 fingerprinted local JSON audit artifacts.

### What Phase 11 PPCO DOES NOT OWN (Strictly Prohibited)
1. **NO Live Policy Mutation**: PPCO must **never** modify `src/config/orchestrationConfig.js` or alter runtime Phase 9 execution.
2. **NO Reinforcement Learning / Bandit Updates**: PPCO must **never** update weights in real-time based on student clicks or attempts.
3. **NO Production Route Overrides**: PPCO must **never** intercept or reroute requests to `/api/v1/orchestration/*`.
4. **NO Upstream Database Mutations**: PPCO must perform **zero writes** to collections 1 through 14.
5. **NO Causal Claims**: PPCO must **never** assert that a policy caused student learning gains.
6. **NO LLM Reliance**: PPCO must **never** invoke Phase 7 LLMs.
7. **NO Candidate Eligibility Alteration**: PPCO V1 must **never** modify prerequisite gating thresholds or candidate generation rules.

---

## 11. Authoritative Phase 10 Issuance Snapshot Contract

An independent audit of `src/models/prescriptionExecutionRecordModel.js`, `src/services/attribution/attributionIssuanceService.js`, and `docs/PHASE10_PRESCRIPTION_ADHERENCE_OUTCOME_ATTRIBUTION_SPECIFICATION.md` Section 10.1 establishes the frozen, canonical snapshot shapes.

Earlier drafts of the Phase 11 proposal inaccurately placed presentation DTO fields (`rationale`, `executionIntent`) and unpersisted analytics variables (`daysOverdue`, `targetExamDate`, `daysToTargetDate`, `rushingQuadrantCount`) inside `issuanceSnapshot`. Those claims are retracted and corrected below.

### Authoritative Frozen `issuanceSnapshot` Shapes

#### 1. PREREQUISITE_REMEDIATION
```javascript
{
  actionType: 'PREREQUISITE_REMEDIATION',
  prerequisitePattern: string,
  prerequisiteTopic: string,
  prerequisiteMastery: number,
  blockedTargetPattern: string,
  blockedTargetTopic: string,
  allPrerequisitesForTarget: [
    {
      pattern: string,
      mastery: number
    }
  ]
}
```

#### 2. RETENTION_RESCUE
```javascript
{
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
```
> [!NOTE]
> There is **no frozen `issuanceSnapshot.daysOverdue`** and no raw mastery in this snapshot. `daysOverdue` is deterministically derived from `nextReviewDate` and top-level `issuedAt`.

#### 3. CURRICULUM_ADVANCEMENT
```javascript
{
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
```

#### 4. PACING_CALIBRATION
```javascript
{
  actionType: 'PACING_CALIBRATION',
  topic: string,
  overallRushingRiskScore: number | null,
  rushingRiskWindowDays: 30
}
```
> [!NOTE]
> The canonical persisted field names are `overallRushingRiskScore` and `rushingRiskWindowDays: 30`. There is **no frozen `rushingRiskScore`**, no `windowDays`, no `rushingQuadrantCount`, and no `storedMastery` in this snapshot.

#### 5. EXAM_BENCHMARK
```javascript
{
  actionType: 'EXAM_BENCHMARK',
  goalId: string,
  planId: string | null,
  planTargetPatternsSnapshot: [
    { topic: string, pattern: string }
  ],
  readinessStatus: string,
  eligibleMocksCount: number | null
}
```
> [!NOTE]
> There is **no frozen `targetExamDate`** and **no `daysToTargetDate`** in this snapshot.

#### 6. DIAGNOSTIC_ASSESSMENT
```javascript
{
  actionType: 'DIAGNOSTIC_ASSESSMENT',
  actionSubtype: string,
  topic: string,
  pattern: string,
  storedMastery: number,
  existingAttemptCount: number
}
```

### Authoritative Frozen `outcomeSnapshot` Shapes
The verified canonical field name across all non-mock completions is **`attributedAttemptCount`** (singular):
1. **`PREREQUISITE_REMEDIATION`**: `attributedAttemptCount`, `prescribedQuestions`, `executionRequirementMet`, `baselinePrerequisiteMastery`, `finalPrerequisiteMastery`, `masteryDelta`, `prerequisiteThresholdMet`, `blockedTargetFullyUnlocked`, `targetMilestoneMet`.
2. **`RETENTION_RESCUE`**: `attributedAttemptCount`, `prescribedQuestions`, `executionRequirementMet`, `baselineStage`, `finalStage`, `finalStatus`, `lastOutcome`, `retentionRescued`, `targetMilestoneMet`.
3. **`CURRICULUM_ADVANCEMENT`**: `attributedAttemptCount`, `prescribedQuestions`, `executionRequirementMet`, `baselineMastery`, `finalMastery`, `masteryDelta`, `curriculumMilestoneMet`, `targetMilestoneMet`.
4. **`PACING_CALIBRATION`**: `attributedAttemptCount`, `prescribedQuestions`, `executionRequirementMet`, `baselineTopicRushingRisk`, `finalTopicRushingRisk`, `riskImproved`, `riskResolvedBelowThreshold`, `outcomeEvidenceStatus`, `targetMilestoneMet`.
5. **`EXAM_BENCHMARK`**: `benchmarkCompletionVerified`, `mockSessionId`, `executionRequirementMet`, `targetMilestoneMet`.
6. **`DIAGNOSTIC_ASSESSMENT`**: `attributedAttemptCount`, `prescribedQuestions`, `executionRequirementMet`, `finalMastery`, `targetMilestoneMet`.

---

## 12. Top-Level vs. Snapshot Field Location & Precision Matrix

Phase 9 public action DTOs and Phase 10 audit snapshots are distinct architectural concepts. Crucially, **`PrescriptionExecutionRecord.urgencyScore` stores the score from the Phase 9 public action DTO**, which is rounded to 2 decimal places by `formatActionDTO(action)`. It is NOT guaranteed to equal the internal unrounded raw IEEE-754 score computed prior to serialization.

The following matrix reconciles the literal runtime persistence location and precision of every relevant field:

| Field | Actual PrescriptionExecutionRecord Path | Persisted? | Historical Precision & Replay Relevance |
| :--- | :--- | :---: | :--- |
| `urgencyScore` | `urgencyScore` (top-level) | **YES** | **Persisted DTO Score (Rounded to 2 decimal places)**. Authoritative persisted/display score from Phase 9 public action DTO. Not guaranteed to equal the internal unrounded raw IEEE-754 urgency value used before DTO serialization. May be used for bounded/partial sensitivity analysis, but cannot by itself justify `RAW_EXACT` score reconstruction. |
| `priorityTier` | `priorityTier` (top-level) | **YES** | Authoritative mapped priority tier ('critical', 'urgent', 'high', 'normal', 'low'). |
| `policyPriorityClass` | `policyPriorityClass` (top-level) | **YES** | Authoritative priority class (0, 1, 2, or null). |
| `actionId` | `actionId` (top-level) | **YES** | Authoritative deterministic candidate identifier string. |
| `actionType` | `actionType` (top-level) | **YES** | Authoritative canonical action taxonomy enum. |
| `actionSubtype` | `actionSubtype` (top-level) | **YES** | Authoritative candidate subtype discriminator string. |
| `issuedAt` | `issuedAt` (top-level) | **YES** | Authoritative issuance reference timestamp ($Date$). Exact clock anchor for logical-day boundary calculations. |
| `rationale` | Action DTO only / NOT in canonical schema | **DTO ONLY** | Presentation/explanation payload only (`reasonCode`, `description`). Not an urgency scoring factor. Never used in mathematical simulation. |
| `executionIntent` | Action DTO only / Entity IDs top-level | **PARTIAL** | Dispatch payload. Entity keys (`revisionItemId`, `goalId`, `planId`) are persisted as dedicated top-level schema paths. Not a scoring factor. |
| `issuanceSnapshot` | `issuanceSnapshot` (top-level Mixed) | **YES** | Authoritative frozen algorithm evidence observed by Phase 9 at issuance time. Strictly action-discriminated schema. |
| `activationBaselineSnapshot` | `activationBaselineSnapshot` (top-level Mixed) | **YES** | Authoritative student state captured at activation (`null` if unactivated, expired, or superseded). |
| `outcomeSnapshot` | `outcomeSnapshot` (top-level Mixed) | **YES** | Authoritative outcome evaluation captured at completion (`null` if abandoned, expired, or superseded). |

---

## 13. Authoritative Phase 9 Scoring Semantics Baseline

Live inspection of `src/services/orchestration/urgencyScoringService.js` and `src/services/orchestration/candidateGenerationService.js` establishes the immutable baseline scoring contracts:

### Raw Urgency Score Formula
$$U = W_{\text{type}} + S_{\text{deficit}} + I_{\text{goal}} + T_{\text{temporal}}$$

Where:
1. **$W_{\text{type}}$ (Base Type Weights `BASE_WEIGHTS`)**:
   - `PREREQUISITE_REMEDIATION`: $50.0$ (Class 0)
   - `OVERDUE_REVISION`: $45.0$ (Class 0, subtype of `RETENTION_RESCUE`)
   - `DUE_TODAY_REVISION`: $35.0$ (Class 1, subtype of `RETENTION_RESCUE`)
   - `CURRICULUM_ADVANCEMENT`: $30.0$ (Class 2)
   - `EXAM_BENCHMARK`: $25.0$ (Class 2)
   - `PACING_CALIBRATION`: $20.0$ (Class 2)
   - `DIAGNOSTIC_ASSESSMENT`: $0.0$ (Class null, $U = \text{null}$, priority tier `'normal'`, non-scored fallback with no competitive base-weight key)
   - *Note*: There are **strictly six competitive scoring base-weight keys** in `BASE_WEIGHTS`. `OVERDUE_REVISION` and `DUE_TODAY_REVISION` are subtype-specific keys.
2. **$S_{\text{deficit}}$ (Mastery Deficit Component — `MAX_MASTERY_DEFICIT_WEIGHT = 25.0`)**:
   - Formula: $S_{\text{deficit}} = \max(0.0, 1.0 - \text{mastery}) \times \text{MAX\_MASTERY\_DEFICIT\_WEIGHT}$.
   - Mathematical Semantics: Scaling coefficient and maximum contribution at zero mastery.
   - `EXAM_BENCHMARK`: Strictly $0.0$.
   - `PACING_CALIBRATION`: $\max(0.0, 1.0 - \text{storedMastery}) \times 25.0$ if progress evidence exists and `storedMastery !== null`; otherwise strictly $0.0$.
   - All other scored actions (`PREREQUISITE_REMEDIATION`, `CURRICULUM_ADVANCEMENT`, `OVERDUE_REVISION`, `DUE_TODAY_REVISION`): $\max(0.0, 1.0 - \text{effectiveMastery}) \times 25.0$, where missing mastery defaults to $0.0$.
3. **$I_{\text{goal}}$ (Goal Impact Component — `MAX_GOAL_IMPACT_WEIGHT = 15.0`)**:
   - Formula: $I_{\text{goal}} = \min(\text{MAX\_GOAL\_IMPACT\_WEIGHT}, \text{baseAlignment} + \text{deadlineProximityBonus})$.
   - Mathematical Semantics: Upper bound / CAP on the sum of base alignment and deadline proximity bonus.
   - Base alignment: $+10.0$ if `actionType === 'EXAM_BENCHMARK'` or `isPlanAligned === true`; else $0.0$.
   - **Prerequisite Remediation Rule**: In Phase 9 (`candidateGenerationService.js` lines 479–486), prerequisite bottlenecks explicitly unblock active-plan targets, setting `isPlanAligned: true` and `deadlineProximityBonus: 0.0`. In the baseline Phase 9 V1 policy (where $\text{MAX\_GOAL\_IMPACT\_WEIGHT} = 15.0$), prerequisite goal impact evaluates to $\min(15.0, 10.0) = 10.0$. Under Phase 11 candidate policies where `maxGoalImpactWeight` may vary, candidate prerequisite goal impact evaluates to $\min(\text{candidatePolicy.maxGoalImpactWeight}, 10.0)$ (e.g., if candidate cap is $15.0 \implies 10.0$; if candidate cap is $20.0 \implies 10.0$; if candidate cap is $8.0 \implies 8.0$; if candidate cap is $0.0 \implies 0.0$).
   - `CURRICULUM_ADVANCEMENT`: Daily objectives are plan-aligned by definition (`isPlanAligned: true`), giving base alignment $+10.0$ plus continuous deadline proximity bonus ($0.0$ to $5.0$).
   - `OVERDUE_REVISION` / `DUE_TODAY_REVISION`: `isPlanAligned` is evaluated against active plan targets; deadline proximity bonus is $0.0$.
   - `PACING_CALIBRATION`: `isTopicPlanAligned` is evaluated against active plan targets; deadline proximity bonus is $0.0$.
4. **$T_{\text{temporal}}$ (Temporal Urgency Component — `MAX_TEMPORAL_WEIGHT = 10.0`)**:
   - Formula for `OVERDUE_REVISION`:
     $$T_{\text{temporal}} = \min(\text{MAX\_TEMPORAL\_WEIGHT}, \max(0, \text{daysOverdue}) \times \text{OVERDUE\_TEMPORAL\_POINTS\_PER\_DAY})$$
   - Mathematical Semantics: `MAX_TEMPORAL_WEIGHT` ($10.0$) is an upper bound / CAP. The per-day slope is $\text{OVERDUE\_TEMPORAL\_POINTS\_PER\_DAY} = 2.0$ urgency points per overdue day. This $2.0$ slope is an immutable inherited formula semantic and is **strictly non-tunable in V1**.
   - All other actions (including `EXAM_BENCHMARK`, `DUE_TODAY_REVISION`, `PREREQUISITE_REMEDIATION`, `CURRICULUM_ADVANCEMENT`, `PACING_CALIBRATION`): Strictly $0.0$.

### Priority Tier Thresholds (`PRIORITY_THRESHOLDS`)
Strictly descending numeric severity thresholds (`critical > urgent > high > normal`):
- `critical`: $U \ge 80.0$
- `urgent`: $65.0 \le U < 80.0$
- `high`: $50.0 \le U < 65.0$
- `normal`: $35.0 \le U < 50.0$
- `low`: $U < 35.0$ (implicit for any score below `normal`)
Validation invariant: $\text{critical} > \text{urgent} > \text{high} > \text{normal}$. Baseline values: $80.0 / 65.0 / 50.0 / 35.0$.

### 7-Tier Ranking Comparator (`compareCandidates`)
1. `policyPriorityClass` ascending (Class 0 < Class 1 < Class 2; null sorts last)
2. `urgencyScore` descending (higher urgency wins; null sorts last)
3. $W_{\text{type}}$ base weight descending
4. Raw stored mastery ascending (weaker mastery wins)
5. Canonical topic registry index ascending (0 to 23)
6. Canonical pattern registry index ascending (0 to 277; patternless uses $+\infty$)
7. Lexical deterministic fallback (`actionId`)

---

## 14. Raw Score Reconstruction & Score-Precision Audit

To avoid confusing rounded DTO scores with raw IEEE-754 precision, every action type was audited to determine whether its full original raw score can be reconstructed from persisted inputs:

### Action-Specific Raw Reconstruction Findings

1. **`PREREQUISITE_REMEDIATION` — RAW-RECONSTRUCTIBLE (`RAW_EXACT`)**:
   - Persisted inputs: `prerequisiteMastery` in snapshot, baseline $W=50.0$ in config, baseline $I_{\text{goal}} = 10.0$ (plan-aligned by definition; candidate component $\min(\text{candidatePolicy.maxGoalImpactWeight}, 10.0)$), $T_{\text{temporal}} = 0.0$.
   - **Verdict**: All 4 raw scoring inputs are known. Original raw score can be computed with 100% IEEE-754 precision independently of the rounded DTO score.

2. **`RETENTION_RESCUE` (`OVERDUE_REVISION` & `DUE_TODAY_REVISION`) — NOT RAW-RECONSTRUCTIBLE**:
   - Persisted inputs: `nextReviewDate` + `issuedAt` yield `daysOverdue` and $T_{\text{temporal}}$.
   - Missing inputs: Historical student mastery ($M$) and historical goal alignment (`isPlanAligned`) were **not frozen** in the snapshot.
   - **Verdict**: Full original raw score cannot be reconstructed. Replay anchored to persisted `urgencyScore` is anchored to a rounded DTO score.

3. **`CURRICULUM_ADVANCEMENT` — NOT RAW-RECONSTRUCTIBLE**:
   - Persisted inputs: `storedMastery` in snapshot ($S_{\text{deficit}}$ known), base alignment $+10.0$ known, $T_{\text{temporal}} = 0.0$.
   - Missing inputs: Historical continuous `deadlineProximityBonus` ($0.0$ to $5.0$) was **not frozen** in the snapshot.
   - **Verdict**: Full original raw score cannot be reconstructed.

4. **`PACING_CALIBRATION` — NOT RAW-RECONSTRUCTIBLE**:
   - Persisted inputs: `overallRushingRiskScore` in snapshot.
   - Missing inputs: Historical topic average mastery and conditional plan alignment (`isTopicPlanAligned`) were **not frozen**.
   - **Verdict**: Full original raw score cannot be reconstructed.

5. **`EXAM_BENCHMARK` — NOT RAW-RECONSTRUCTIBLE**:
   - Persisted inputs: $W=25.0$, $S_{\text{deficit}} = 0.0$, base alignment $+10.0$, $T_{\text{temporal}} = 0.0$.
   - Missing inputs: Historical continuous `deadlineProximityBonus` (derived from unpersisted goal target date) was **not frozen**.
   - **Verdict**: Full original raw score cannot be reconstructed.

6. **`DIAGNOSTIC_ASSESSMENT` — NON-SCORED FALLBACK**:
   - Unranked fallback action with `urgencyScore: null` and `priorityTier: 'normal'`.

### Score-Precision Provenance Matrix

| Action Type | Historical Score Source | Raw Score Reconstructible? | Persisted Score Rounded? | Candidate Raw Score Exact? | Tier Migration Exact? | Architectural Reason |
| :--- | :--- | :---: | :---: | :---: | :---: | :--- |
| **PREREQUISITE_REMEDIATION** | `issuanceSnapshot.prerequisiteMastery` + Config | **YES** | YES in DTO | **YES** | **YES** | All raw inputs ($W=50, M, I_{\text{base}}=10, T=0$) frozen. Candidate goal impact evaluates via $\min(\text{candidatePolicy.maxGoalImpactWeight}, 10.0)$. Raw IEEE-754 score reconstructed independently of DTO rounding. |
| **OVERDUE_REVISION** | Top-level `urgencyScore` (DTO) | **NO** | YES (2 decimals) | **NO** | **CONDITIONAL / PARTIAL** | Raw mastery and plan alignment missing. Derived `daysOverdue` exact, but total score anchored to rounded DTO. |
| **DUE_TODAY_REVISION** | Top-level `urgencyScore` (DTO) | **NO** | YES (2 decimals) | **NO** | **CONDITIONAL / PARTIAL** | Raw mastery and plan alignment missing. Total score anchored to rounded DTO. |
| **CURRICULUM_ADVANCEMENT** | Top-level `urgencyScore` (DTO) + `storedMastery` | **NO** | YES (2 decimals) | **NO** | **CONDITIONAL / PARTIAL** | Raw `storedMastery` frozen, but `deadlineProximityBonus` missing. Deficit delta exact, total score anchored to rounded DTO. |
| **PACING_CALIBRATION** | Top-level `urgencyScore` (DTO) | **NO** | YES (2 decimals) | **NO** | **CONDITIONAL / PARTIAL** | Topic mastery and plan alignment missing. Total score anchored to rounded DTO. |
| **EXAM_BENCHMARK** | Top-level `urgencyScore` (DTO) | **NO** | YES (2 decimals) | **NO** | **CONDITIONAL / PARTIAL** | `deadlineProximityBonus` missing. Total score anchored to rounded DTO. |
| **DIAGNOSTIC_ASSESSMENT** | Top-level `urgencyScore` (null) | N/A | N/A | N/A | N/A | Non-scored fallback action ($U = \text{null}$, tier `'normal'`). |

---

## 15. Parameter-Specific Replay Support & Component Substitution

### Architectural Principle: Two Component-Substitution Paths

Mode A distinguishes two fundamentally different substitution paths:

#### Path A — Reconstructed Raw Score (`scoreSource: RECONSTRUCTED_RAW`)
When all raw baseline scoring factors are historically available (`PREREQUISITE_REMEDIATION`):
$$\text{rawScore} = W + S_{\text{deficit}} + I_{\text{goal}} + T_{\text{temporal}}$$
$$\text{candidateRawScore} = W_{\text{cand}} + S_{\text{cand}} + I_{\text{cand}} + T_{\text{cand}}$$
- **Support**: **`EXACT`**
- **Score Source**: **`RECONSTRUCTED_RAW`**
- **Precision**: **`RAW_EXACT`**

#### Path B — Persisted Rounded Score Substitution (`scoreSource: PERSISTED_ROUNDED_DTO`)
When raw factors cannot all be reconstructed, but the policy change affects a known, uniquely attributable component (e.g., base weight variations on actions with unpersisted mastery/deadline factors):
$$\tilde{U}_{\text{cand}} = U_{\text{dto}} - C_{\text{baseline}} + C_{\text{candidate}}$$
- **Support**: **`PARTIAL`**
- **Score Source**: **`PERSISTED_ROUNDED_DTO`**
- **Precision**: **`DTO_ROUNDED_PARTIAL`**
- **Constraint**: Must **never** be labeled `EXACT raw replay`.

---

## 16. Parameter-Specific Sensitivity & Rounding-Interval Contract

Mode A support is evaluated conditionally: $\text{support}(\text{record}, \Delta_{\text{policy}}) \in \{\text{EXACT}, \text{PARTIAL}, \text{UNSUPPORTED}, \text{NOT\_APPLICABLE}\}$.

### 1. Base Weight Variations (`baseWeights`)
- `PREREQUISITE_REMEDIATION`: **`EXACT`** via Path A (`scoreSource: RECONSTRUCTED_RAW`).
- `OVERDUE_REVISION`, `DUE_TODAY_REVISION`, `CURRICULUM_ADVANCEMENT`, `PACING_CALIBRATION`, `EXAM_BENCHMARK`: **`PARTIAL`** via Path B (`scoreSource: PERSISTED_ROUNDED_DTO`).
- `DIAGNOSTIC_ASSESSMENT`: **`NOT_APPLICABLE`** (non-scored fallback; $U = \text{null}$; no competitive base-weight key).

### 2. Priority Threshold Variations (`priorityThresholds`)
Changing priority thresholds does not change the urgency score; it changes `priorityTier`.
- `PREREQUISITE_REMEDIATION`: **`EXACT`** (evaluated against reconstructed raw score).
- Scored actions with rounded score provenance: **`PARTIAL`** due to DTO rounding.
  - **Rounding-Interval Analysis**: The persisted DTO score $U_{\text{dto}}$ represents an internal value in the half-open interval:
    $$I_{\text{raw}} = [U_{\text{dto}} - 0.005, \; U_{\text{dto}} + 0.005)$$
  - If a candidate threshold $T$ falls inside $I_{\text{raw}}$, tier classification is **ambiguous**.
  - If all candidate thresholds lie outside $I_{\text{raw}}$, tier classification is deterministic, but still classified **`PARTIAL`** due to rounded input provenance.
- `DIAGNOSTIC_ASSESSMENT`: **`NOT_APPLICABLE`** (priority tier invariant `'normal'`).

### 3. Mastery Deficit Parameter Variations (`maxMasteryDeficitWeight`)
- `PREREQUISITE_REMEDIATION`: **`EXACT`** (`prerequisiteMastery` is frozen in snapshot; full raw score reconstructible).
- `CURRICULUM_ADVANCEMENT`: **`PARTIAL`** (`storedMastery` is frozen, making the deficit component delta exact, but the candidate total score remains anchored to rounded DTO urgency due to missing deadline bonus).
- `OVERDUE_REVISION`, `DUE_TODAY_REVISION`, `PACING_CALIBRATION`: **`UNSUPPORTED`** (raw historical mastery was not frozen; missing inputs are never assumed zero).
- `EXAM_BENCHMARK`: Parameter has no deficit effect ($S_{\text{deficit}} = 0.0$ strictly invariant; deficit delta is strictly $0.0$; classified **`NOT_APPLICABLE / INVARIANT`** for this parameter delta).
- `DIAGNOSTIC_ASSESSMENT`: **`NOT_APPLICABLE`** ($U = \text{null}$).

### 4. Temporal Urgency Variations (`maxTemporalWeight`)
- `OVERDUE_REVISION`: **`PARTIAL`** (`daysOverdue` is deterministically derived from `nextReviewDate` + `issuedAt`, making the temporal component delta exact: $\min(\text{candidatePolicy.maxTemporalWeight}, \max(0, \text{daysOverdue}) \times 2.0)$, but the candidate total score remains anchored to rounded DTO urgency).
- All other actions (`PREREQUISITE_REMEDIATION`, `DUE_TODAY_REVISION`, `CURRICULUM_ADVANCEMENT`, `PACING_CALIBRATION`, `EXAM_BENCHMARK`): Temporal component invariant $T_{\text{temporal}} = 0.0$ (**`NOT_APPLICABLE / INVARIANT`**).
- Non-Tunable Invariant: The slope $\text{OVERDUE\_TEMPORAL\_POINTS\_PER\_DAY} = 2.0$ urgency points per overdue day is frozen from Phase 9 and **strictly non-tunable in V1**.

### 5. Goal Impact & Conditional Plan-Alignment Variations (`maxGoalImpactWeight`)
- `PREREQUISITE_REMEDIATION`: **`EXACT`** (baseline component $= 10.0$; candidate component $= \min(\text{candidatePolicy.maxGoalImpactWeight}, 10.0)$; raw mastery and alignment known; full raw score reconstructible).
- `CURRICULUM_ADVANCEMENT`: **`UNSUPPORTED`** in Mode A (`deadlineProximityBonus` was not frozen). In Mode B synthetic vectors, evaluates via $\min(\text{candidatePolicy.maxGoalImpactWeight}, 10.0 + \text{deadlineProximityBonus})$.
- `EXAM_BENCHMARK`: **`UNSUPPORTED`** in Mode A (`deadlineProximityBonus` / `targetExamDate` was not frozen). In Mode B synthetic vectors, evaluates via $\min(\text{candidatePolicy.maxGoalImpactWeight}, 10.0 + \text{deadlineProximityBonus})$.
- `OVERDUE_REVISION`, `DUE_TODAY_REVISION`: **`UNSUPPORTED`** in Mode A (historical `isPlanAligned` was conditional on active plan targets and was not frozen in the snapshot; querying mutable `StudyPlan` state retroactively is strictly prohibited). In Mode B synthetic vectors, evaluates via $\min(\text{candidatePolicy.maxGoalImpactWeight}, \text{isPlanAligned} ? 10.0 : 0.0)$ because deadline bonus is $0.0$.
- `PACING_CALIBRATION`: **`UNSUPPORTED`** in Mode A (historical `isTopicPlanAligned` was conditional and not frozen in the snapshot). In Mode B synthetic vectors, evaluates via $\min(\text{candidatePolicy.maxGoalImpactWeight}, \text{isTopicPlanAligned} ? 10.0 : 0.0)$ because deadline bonus is $0.0$.
- `DIAGNOSTIC_ASSESSMENT`: **`NOT_APPLICABLE`** (unscored fallback; $U = \text{null}$).

---

## 17. Complete Action-Aware V1 Policy Parameter Support Matrix

The following matrix authoritatively specifies Mode A replay support across every candidate parameter and action type:

| Candidate Policy Parameter | Prerequisite Remediation | Overdue Revision | Due-Today Revision | Curriculum Advancement | Pacing Calibration | Exam Benchmark | Diagnostic Assessment | Mode B (Synthetic Archetypes) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **`baseWeights`** | **EXACT** (`RECONSTRUCTED_RAW`) | **PARTIAL** (`ROUNDED_DTO`) | **PARTIAL** (`ROUNDED_DTO`) | **PARTIAL** (`ROUNDED_DTO`) | **PARTIAL** (`ROUNDED_DTO`) | **PARTIAL** (`ROUNDED_DTO`) | **NOT_APPLICABLE** ($U = \text{null}$) | **EXACT** (`SYNTHETIC_RAW`) |
| **`priorityThresholds`** | **EXACT** (`RECONSTRUCTED_RAW`) | **PARTIAL** (Interval audit) | **PARTIAL** (Interval audit) | **PARTIAL** (Interval audit) | **PARTIAL** (Interval audit) | **PARTIAL** (Interval audit) | **NOT_APPLICABLE** (Invariant) | **EXACT** (`SYNTHETIC_RAW`) |
| **`maxMasteryDeficitWeight`** | **EXACT** (`RECONSTRUCTED_RAW`) | **UNSUPPORTED** (Mastery missing) | **UNSUPPORTED** (Mastery missing) | **PARTIAL** (Deficit delta exact) | **UNSUPPORTED** (Mastery missing) | **NOT_APPLICABLE / INVARIANT** ($S=0.0$) | **NOT_APPLICABLE** ($U = \text{null}$) | **EXACT** (`SYNTHETIC_RAW`) |
| **`maxTemporalWeight`** | **NOT_APPLICABLE / INVARIANT** ($T=0$ invariant) | **PARTIAL** (Temporal delta exact) | **NOT_APPLICABLE / INVARIANT** ($T=0$ invariant) | **NOT_APPLICABLE / INVARIANT** ($T=0$ invariant) | **NOT_APPLICABLE / INVARIANT** ($T=0$ invariant) | **NOT_APPLICABLE / INVARIANT** ($T=0$ invariant) | **NOT_APPLICABLE** ($U = \text{null}$) | **EXACT** (`SYNTHETIC_RAW`) |
| **`maxGoalImpactWeight`** | **EXACT** (Baseline $= 10$; Cand $= \min(W_I, 10)$) | **UNSUPPORTED** (Alignment missing) | **UNSUPPORTED** (Alignment missing) | **UNSUPPORTED** (Bonus missing) | **UNSUPPORTED** (Alignment missing) | **UNSUPPORTED** (Date missing) | **NOT_APPLICABLE** ($U = \text{null}$) | **EXACT** (`SYNTHETIC_RAW`) |

---

## 18. Multi-Parameter Policy Delta Derivation & Mode A Replay Aggregation

### 18.1 Complete Candidate Policy vs. Baseline Delta Derivation
Candidate policies submitted to Phase 11 remain **complete, immutable policy objects** conforming to the Section 22 schema. Phase 11 derives the actual changed dimensions by computing the semantic difference between the candidate policy and the frozen Phase 9 baseline policy:
```javascript
const policyDelta = diffPolicy(BASELINE_POLICY, candidatePolicy);
```
The delta **MUST** be derived based on strictly changed numeric values. Phase 11 does not treat every property in a candidate policy object as changed merely because it is present in the schema.

### 18.2 Delta Granularity (Strictly 13 Canonical Tunable Dimensions)
The delta between candidate and baseline policies is evaluated across strictly 13 canonical tunable dimensions:
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

Safety flags such as `simulationOnly: true` are non-scoring metadata and never constitute a scoring delta. Furthermore, frozen non-tunable invariants (such as `OVERDUE_TEMPORAL_POINTS_PER_DAY = 2.0`, prerequisite gating threshold $0.70$, policy priority classes 0/1/2, and candidate generation rules) are excluded from candidate policies and must **never** appear in a valid policy delta.

### 18.3 Rejection of No-Op / Baseline-Equivalent Candidate Policies
The baseline Phase 9 policy is the benchmark reference and is automatically available internally to all simulation runners. A submitted candidate policy that is canonically and numerically identical to the baseline across all 13 tunable scoring dimensions must be rejected synchronously:
- **Error Code**: `INVALID_POLICY_DEFINITION`
- **Reason Code**: `CANDIDATE_POLICY_MATCHES_BASELINE`
- **Rationale**: Prevents wasting one of the bounded simulation candidate slots (`MAX_CANDIDATE_POLICIES = 5`) on a redundant baseline duplicate. The presence of `simulationOnly: true` does not differentiate a policy from baseline.

### 18.4 Action-Relevant Delta Filtering
A changed candidate policy dimension may have zero mathematical relevance to a given historical action. For example, if a candidate policy adjusts `baseWeights.EXAM_BENCHMARK`, that modification is completely irrelevant to a historical `PREREQUISITE_REMEDIATION` record. Such an irrelevant dimension is classified as `NOT_APPLICABLE` for that record and must **never** degrade prerequisite replay support to `PARTIAL` or `UNSUPPORTED`.

For every historical record, Phase 11 derives the action-relevant effective delta:
```javascript
const effectiveDelta = changedPolicyDimensions.filter(dimension =>
  dimensionAffects(record.actionType, record.actionSubtype, dimension)
);
```
Relevance mapping by action type/subtype:
- `baseWeights.<KEY>`: Affects only the historical record whose action type and subtype map to that specific key. (The six base-weight keys are evaluated independently).
- `maxMasteryDeficitWeight`: Affects `PREREQUISITE_REMEDIATION`, `CURRICULUM_ADVANCEMENT`, `PACING_CALIBRATION`, `OVERDUE_REVISION`, and `DUE_TODAY_REVISION`. Does not affect `EXAM_BENCHMARK` ($S=0.0$ invariant) or `DIAGNOSTIC_ASSESSMENT` ($U=\text{null}$).
- `maxTemporalWeight`: Affects `OVERDUE_REVISION` only. Does not affect any other action type ($T=0.0$ invariant).
- `maxGoalImpactWeight`: Affects all competitive scored action types (`PREREQUISITE_REMEDIATION`, `CURRICULUM_ADVANCEMENT`, `EXAM_BENCHMARK`, `OVERDUE_REVISION`, `DUE_TODAY_REVISION`, `PACING_CALIBRATION`). Does not affect `DIAGNOSTIC_ASSESSMENT`.
- `priorityThresholds.<TIER>`: Affects all competitive scored actions. Does not affect `DIAGNOSTIC_ASSESSMENT`.

### 18.5 Whole-Policy Support Precedence Contract
For each historical Phase 10 record and candidate policy, every dimension in `effectiveDelta` is evaluated against the authoritative support matrix (Section 17). Whole-policy replay support is then determined using strict precedence:
1. **Empty Effective Delta**: If `effectiveDelta` is empty (no changed dimensions affect this action):
   $$\text{overallSupport} = \mathbf{NOT\_APPLICABLE}$$
2. **Any Unsupported Dimension**: Else if **ANY** effective changed dimension is `UNSUPPORTED`:
   $$\text{overallSupport} = \mathbf{UNSUPPORTED}$$
3. **Any Partial Dimension**: Else if **ANY** effective changed dimension is `PARTIAL`:
   $$\text{overallSupport} = \mathbf{PARTIAL}$$
4. **All Exact**: Else (all effective changed dimensions are `EXACT`):
   $$\text{overallSupport} = \mathbf{EXACT}$$

In shorthand:
$$\mathbf{UNSUPPORTED} > \mathbf{PARTIAL} > \mathbf{EXACT}$$
`NOT_APPLICABLE` dimensions are neutral and ignored when at least one effective changed dimension exists.

### 18.6 Whole-Policy Completeness Rule (Never Silently Drop Unsupported Dimensions)
Phase 11 enforces an absolute integrity invariant: **never silently drop unsupported policy changes**.
If a candidate policy alters dimensions $A$ (supported), $B$ (supported), and $C$ (unsupported for the given record), the simulation engine must **NOT** evaluate only $A + B$ and present the resulting score as if it represented the candidate policy.
- The record's whole-policy result is strictly **`UNSUPPORTED`**.
- The output must explicitly declare `unsupportedDimensions: [C]` and set `estimatedCandidateUrgencyScore: null` and `candidateUrgencyScorePrecision: "UNAVAILABLE"`.
- Isolated per-parameter diagnostic evaluations may be returned under `parameterDiagnostics`, but must be strictly demarcated as diagnostic insights, never as whole-policy candidate results.

### 18.7 Multi-Parameter RAW_EXACT Execution Path
When `overallSupport === 'EXACT'`, all raw baseline inputs are historically preserved. Phase 11 evaluates the candidate policy by executing pure IEEE-754 candidate scoring with all effective parameters applied simultaneously:
$$\text{candidateRawScore} = W_{\text{cand}} + S_{\text{cand}} + I_{\text{cand}} + T_{\text{cand}}$$
where:
- $W_{\text{cand}} = \text{candidatePolicy.baseWeights}[W_{\text{key}}]$
- $S_{\text{cand}} = \max(0.0, 1.0 - \text{prerequisiteMastery}) \times \text{candidatePolicy.maxMasteryDeficitWeight}$
- $I_{\text{cand}} = \min(\text{candidatePolicy.maxGoalImpactWeight}, 10.0)$
- $T_{\text{cand}} = 0.0$

Candidate priority thresholds are applied directly to the unrounded candidate raw score:
- **Precision**: `RAW_EXACT`
- **Score Source**: `RECONSTRUCTED_RAW`
- **Intermediate Rounding**: Strictly forbidden prior to tier mapping.

### 18.8 Multi-Parameter PARTIAL Path & Shifted Rounding Interval Propagation
When `overallSupport === 'PARTIAL'`, full raw inputs cannot be reconstructed, but every effective score-changing component delta is mathematically known. The combined component delta is computed:
$$\Delta_{\text{total}} = \Delta W_{\text{type}} + \Delta S_{\text{deficit}} + \Delta I_{\text{goal}} + \Delta T_{\text{temporal}}$$
The estimated candidate score is anchored to the persisted rounded DTO score:
$$\tilde{U}_{\text{cand}} = U_{\text{dto}} + \Delta_{\text{total}}$$
- **Precision**: `DTO_ROUNDED_PARTIAL`
- **Score Source**: `PERSISTED_ROUNDED_DTO`
- **Classification**: Strictly `PARTIAL` (never upgraded to `EXACT`).

**Rounding Interval Propagation**:
The historical rounded DTO score $U_{\text{dto}}$ represents a raw true score in the half-open interval:
$$I_{\text{raw}} = [U_{\text{dto}} - 0.005, \; U_{\text{dto}} + 0.005)$$
Under the exact component shift $\Delta_{\text{total}}$, the candidate true raw score lies within the shifted interval:
$$I_{\text{cand}} = [U_{\text{dto}} - 0.005 + \Delta_{\text{total}}, \; U_{\text{dto}} + 0.005 + \Delta_{\text{total}})$$
Candidate priority thresholds are evaluated against $I_{\text{cand}}$:
- If any candidate threshold falls inside $I_{\text{cand}}$:
  $$\text{thresholdBoundaryAmbiguous} = \mathbf{true}$$
- If all candidate thresholds fall outside $I_{\text{cand}}$:
  $$\text{thresholdBoundaryAmbiguous} = \mathbf{false}$$
  Tier classification is deterministic across the entire interval, but support remains **`PARTIAL`** due to rounded historical provenance.

### 18.9 Threshold Application Order (Score Deltas First, Candidate Thresholds Second)
When a candidate policy modifies BOTH score-producing parameters ($W, S, I, T$) AND priority thresholds:
1. **Step 1**: Compute candidate score $\tilde{U}_{\text{cand}}$ and shifted raw interval $I_{\text{cand}}$.
2. **Step 2**: Apply the **candidate policy's priority thresholds** to the candidate score / interval.
3. **Step 3**: Derive candidate priority tier and threshold ambiguity.

Phase 11 must **never** evaluate the old baseline score against candidate thresholds and subsequently apply score deltas. Candidate thresholds always apply to candidate score state.

### 18.10 Mode A Output Contract & Diagnostics Schema
Mode A record-level simulation outputs must declare whole-policy support, score provenance, precision, changed dimensions, and parameter diagnostics:
```javascript
{
  prescriptionId: "rx_...",
  actionType: "PREREQUISITE_REMEDIATION",
  actionSubtype: "BLOCKING_PREREQUISITE",
  
  overallSupport: "EXACT",                      // EXACT | PARTIAL | UNSUPPORTED | NOT_APPLICABLE
  scoreSource: "RECONSTRUCTED_RAW",              // RECONSTRUCTED_RAW | PERSISTED_ROUNDED_DTO | NOT_AVAILABLE
  candidateUrgencyScorePrecision: "RAW_EXACT",   // RAW_EXACT | DTO_ROUNDED_PARTIAL | UNAVAILABLE

  reconstructedRawUrgencyScore: 68.75,           // number | null (null if not raw reconstructible)
  persistedDtoUrgencyScore: 68.75,               // number | null (from PrescriptionExecutionRecord)
  estimatedCandidateUrgencyScore: 73.75,         // number | null (null if UNSUPPORTED or NOT_APPLICABLE)
  
  baselinePriorityTier: "urgent",
  candidatePriorityTier: "urgent",               // null if UNSUPPORTED or NOT_APPLICABLE
  tierShiftDetected: false,
  thresholdBoundaryAmbiguous: false,             // true if candidate threshold lies inside shifted raw interval
  
  changedDimensions: [                           // All dimensions in candidate delta
    "baseWeights.PREREQUISITE_REMEDIATION",
    "maxMasteryDeficitWeight"
  ],
  effectiveDimensions: [                         // Dimensions affecting this record
    "baseWeights.PREREQUISITE_REMEDIATION",
    "maxMasteryDeficitWeight"
  ],
  unsupportedDimensions: [],                     // Populated if overallSupport === 'UNSUPPORTED'
  
  parameterDiagnostics: [                        // Per-dimension diagnostic audit
    {
      dimension: "baseWeights.PREREQUISITE_REMEDIATION",
      support: "EXACT",
      reasonCode: "RECONSTRUCTED_RAW"
    },
    {
      dimension: "maxMasteryDeficitWeight",
      support: "EXACT",
      reasonCode: "RAW_MASTERY_FROZEN"
    }
  ]
}
```

### 18.11 Normative Multi-Parameter Replay Examples

#### Example A — Prerequisite Remediation (All Effective Dimensions EXACT)
- **Candidate Changes**:
  - `baseWeights.PREREQUISITE_REMEDIATION: 55.0` (baseline: 50.0)
  - `maxMasteryDeficitWeight: 20.0` (baseline: 25.0)
  - `maxGoalImpactWeight: 12.0` (baseline: 15.0)
  - `priorityThresholds.urgent: 60.0` (baseline: 65.0)
- **Historical Record**: `PREREQUISITE_REMEDIATION` with `prerequisiteMastery = 0.40`.
- **Replay Execution**: All 4 changed dimensions are `EXACT` for prerequisite remediation ($W_{\text{cand}} = 55.0$, $S_{\text{cand}} = 0.60 \times 20.0 = 12.0$, $I_{\text{cand}} = \min(12.0, 10.0) = 10.0$, $T_{\text{cand}} = 0.0$).
- **Result**:
  - `candidateRawScore = 55.0 + 12.0 + 10.0 + 0.0 = 77.0`
  - `overallSupport = "EXACT"`
  - `scoreSource = "RECONSTRUCTED_RAW"`
  - `candidateUrgencyScorePrecision = "RAW_EXACT"`
  - `candidatePriorityTier = "urgent"` (since $77.0 \ge 60.0$)

#### Example B — Curriculum Advancement (Partial-Only Component Deltas)
- **Candidate Changes**:
  - `baseWeights.CURRICULUM_ADVANCEMENT: 35.0` (baseline: 30.0, delta $= +5.0$)
  - `maxMasteryDeficitWeight: 20.0` (baseline: 25.0)
  - `priorityThresholds.high: 52.0` (baseline: 50.0)
- **Historical Record**: `CURRICULUM_ADVANCEMENT` with `storedMastery = 0.60`, `persistedDtoUrgencyScore = 48.00`.
- **Replay Execution**:
  - Base weight delta: $+5.0$ (`PARTIAL`)
  - Deficit delta: $(1.0 - 0.60) \times 20.0 - (1.0 - 0.60) \times 25.0 = 8.0 - 10.0 = -2.0$ (`PARTIAL`)
  - Combined delta: $\Delta_{\text{total}} = +5.0 - 2.0 = +3.0$
  - Shifted interval: $[48.00 - 0.005 + 3.0, 48.00 + 0.005 + 3.0) = [50.995, 51.005)$
  - Threshold audit: Candidate `high` threshold ($52.0$) lies outside $[50.995, 51.005)$.
- **Result**:
  - `estimatedCandidateUrgencyScore = 51.00`
  - `overallSupport = "PARTIAL"`
  - `scoreSource = "PERSISTED_ROUNDED_DTO"`
  - `candidateUrgencyScorePrecision = "DTO_ROUNDED_PARTIAL"`
  - `thresholdBoundaryAmbiguous = false`
  - `candidatePriorityTier = "normal"` ($51.00 < 52.0$)

#### Example C — Curriculum Advancement with Unsupported Dimension
- **Candidate Changes**:
  - `baseWeights.CURRICULUM_ADVANCEMENT: 35.0` (baseline: 30.0, `PARTIAL`)
  - `maxMasteryDeficitWeight: 20.0` (baseline: 25.0, `PARTIAL`)
  - `maxGoalImpactWeight: 10.0` (baseline: 15.0, `UNSUPPORTED` due to unpersisted historical deadline bonus)
- **Historical Record**: `CURRICULUM_ADVANCEMENT`.
- **Precedence Rule**: $\text{UNSUPPORTED} > \text{PARTIAL} > \text{EXACT} \implies \text{overallSupport} = \mathbf{UNSUPPORTED}$.
- **Result**:
  - `overallSupport = "UNSUPPORTED"`
  - `unsupportedDimensions = ["maxGoalImpactWeight"]`
  - `estimatedCandidateUrgencyScore = null`
  - `candidateUrgencyScorePrecision = "UNAVAILABLE"`
  - Complete candidate score is **strictly withheld**. Isolated diagnostics are reported under `parameterDiagnostics`.

#### Example D — Irrelevant Base-Weight Modification
- **Candidate Changes**:
  - `baseWeights.EXAM_BENCHMARK: 35.0` (baseline: 25.0)
- **Historical Record**: `PREREQUISITE_REMEDIATION`.
- **Filtering**: `baseWeights.EXAM_BENCHMARK` does not affect prerequisite remediation (`dimensionAffects` returns false).
- **Result**:
  - `effectiveDelta = []`
  - `overallSupport = "NOT_APPLICABLE"`
  - `estimatedCandidateUrgencyScore = null`
  - No score shift or tier shift evaluated for this record.

---

## 19. Mode Separation: Historical Sensitivity vs. Synthetic Archetypes

| Architectural Dimension | Mode A — Observed-Action Sensitivity (`OBSERVED_ACTION_SENSITIVITY`) | Mode B — Synthetic Archetype Comparison (`ARCHETYPE_POLICY_COMPARISON`) |
| :--- | :--- | :--- |
| **Data Source** | Historical Phase 10 `PrescriptionExecutionRecord` documents | 6 Canonical Deterministic Archetype Vectors (`simulationArchetypes.js`) |
| **Candidate Sets** | Single historical selected action per record (alternatives unpersisted) | Complete candidate sets across all 6 action types per archetype |
| **Scoring Execution** | Parameter-specific reconstruction & component substitution | Live pure IEEE-754 candidate policy simulation execution before serialization |
| **Primary Outputs** | Urgency score shift ($\Delta U$), priority tier migration matrix | Winning action disagreement rate, rank shift, priority tier shift |
| **Permitted Metrics** | Observed adherence rate, observed milestone attainment rate | Simulated action selection frequency, comparator rank delta |
| **Replay Scope** | Parameter-specific (`EXACT`, `PARTIAL`, `UNSUPPORTED`) | Full parameter coverage across all allowed V1 scoring parameters |
| **Prohibited Claims** | Never claims alternative winning action or counterfactual choice | Never claims historical student truth or longitudinal causal efficacy |

---

## 20. Phase 9 Parity Test Contract

Future parity tests must verify the Phase 11 pure simulation scorer against the **LIVE raw Phase 9 scorer before any DTO formatting**:

$$\text{Phase 11 Pure Scorer}(\text{Candidate Vector}, \text{Baseline V1 Policy}) \equiv \text{urgencyScoringService.calculateUrgencyScore}(\text{Candidate Vector})$$

The baseline candidate policy maps exactly to frozen Phase 9 configuration:
- `baseWeights`:
  - `PREREQUISITE_REMEDIATION: 50.0`
  - `OVERDUE_REVISION: 45.0`
  - `DUE_TODAY_REVISION: 35.0`
  - `CURRICULUM_ADVANCEMENT: 30.0`
  - `EXAM_BENCHMARK: 25.0`
  - `PACING_CALIBRATION: 20.0`
- `maxMasteryDeficitWeight: 25.0`
- `maxGoalImpactWeight: 15.0`
- `maxTemporalWeight: 10.0`
- `priorityThresholds`:
  - `critical: 80.0`
  - `urgent: 65.0`
  - `high: 50.0`
  - `normal: 35.0`

Parity tests must assert:
1. Identical IEEE-754 `urgencyScore` before `roundTo`.
2. Identical `baseWeight`, `masteryDeficit`, `goalImpact`, and `temporalUrgency` components.
3. Identical `priorityTier` mapping.
4. Identical 7-tier ranking comparator ordering (`compareCandidates`).

---

## 21. Six Canonical Deterministic Archetypes (Mode B)

Phase 11 V1 defines **exactly six canonical deterministic archetype scenarios**, each containing a complete candidate set:
1. **Archetype 1 — Foundational Prerequisite Bottleneck**: A student with low prerequisite mastery ($M = 0.35$) blocking subsequent curriculum progression.
2. **Archetype 2 — Overdue Spaced Revision Debt**: A student with multiple overdue revision items accumulating temporal urgency.
3. **Archetype 3 — Due-Today Revision Pressure**: A student with active daily revision items due on the current logical date.
4. **Archetype 4 — Core Curriculum Progression**: A steady learner with completed prerequisites advancing through active daily objectives.
5. **Archetype 5 — Rushing / Pacing Calibration Risk**: A student exhibiting severe rushing risk ($> 0.60$) on unmastered patterns.
6. **Archetype 6 — Goal Benchmark Deadline Proximity**: A student within 14 days of target exam deadline requiring full-length mock simulation.

---

## 22. Candidate Policy V1 Scope, Parameter Validation & Pure Simulation Formulas

### Allowed Scoring Parameters (V1 Scope)
Candidate policies are immutable configuration objects defining:
1. `baseWeights`: Exactly six competitive scoring base-weight keys ($0.0 \le W \le 100.0$):
   - `PREREQUISITE_REMEDIATION` (baseline: 50.0)
   - `OVERDUE_REVISION` (baseline: 45.0)
   - `DUE_TODAY_REVISION` (baseline: 35.0)
   - `CURRICULUM_ADVANCEMENT` (baseline: 30.0)
   - `EXAM_BENCHMARK` (baseline: 25.0)
   - `PACING_CALIBRATION` (baseline: 20.0)
   *Note*: `OVERDUE_REVISION` and `DUE_TODAY_REVISION` are subtype-specific retention rescue scoring keys. `DIAGNOSTIC_ASSESSMENT` is non-scored ($U = \text{null}$, tier `'normal'`) and must **not** receive a tunable base-weight key in V1.
2. `maxMasteryDeficitWeight`: Mastery-deficit scaling weight and maximum contribution at zero mastery ($0.0 \le S \le 50.0$; baseline: 25.0).
3. `maxGoalImpactWeight`: Cap / maximum bound for goal alignment component ($0.0 \le I \le 30.0$; baseline: 15.0). Base alignment remains $10.0$ when plan aligned or for `EXAM_BENCHMARK`.
4. `maxTemporalWeight`: Cap / maximum bound for temporal urgency component ($0.0 \le T \le 20.0$; baseline: 10.0).
5. Inherited Frozen Temporal Slope:
   $\text{OVERDUE\_TEMPORAL\_POINTS\_PER\_DAY} = 2.0$ urgency points per overdue day.
   This slope represents inherited Phase 9 formula semantics (`Math.max(0, daysOverdue) * 2.0`) and is **strictly frozen and non-tunable in V1**. Candidate policies may vary the cap `maxTemporalWeight`, but may **not** vary the slope `overdueTemporalPointsPerDay`.
6. `priorityThresholds`: Strictly descending numeric severity thresholds ($0.0 \le \text{threshold} \le 100.0$):
   - `critical`: baseline 80.0
   - `urgent`: baseline 65.0
   - `high`: baseline 50.0
   - `normal`: baseline 35.0
   *Validation Invariant*: $\text{critical} > \text{urgent} > \text{high} > \text{normal}$. `low` is implicit for any score strictly below `normal`.

### Canonical Conceptual Candidate Policy V1 Shape
The architecture freezes the canonical conceptual candidate policy schema:
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

### Exact Pure Simulation Formulas
Mode B and raw-exact Mode A calculations must execute pure IEEE-754 candidate-policy simulation formulas without intermediate rounding:

1. **Mastery Deficit ($S$)**:
   $$S = \max(0.0, 1.0 - \text{mastery}) \times \text{candidatePolicy.maxMasteryDeficitWeight}$$
   Subject to action-specific applicability:
   - `EXAM_BENCHMARK`: $S = 0.0$ strictly invariant.
   - `PACING_CALIBRATION`: If no progress evidence exists or `storedMastery === null`, $S = 0.0$; else $\max(0.0, 1.0 - \text{storedMastery}) \times \text{candidatePolicy.maxMasteryDeficitWeight}$.
   - All other scored actions (`PREREQUISITE_REMEDIATION`, `CURRICULUM_ADVANCEMENT`, `OVERDUE_REVISION`, `DUE_TODAY_REVISION`):
     $$S = \max(0.0, 1.0 - \text{effectiveMastery}) \times \text{candidatePolicy.maxMasteryDeficitWeight}$$
     where missing mastery defaults to $0.0$.

2. **Goal Impact ($I$)**:
   $$I = \min(\text{candidatePolicy.maxGoalImpactWeight}, \text{baseAlignment} + \text{deadlineProximityBonus})$$
   - Base alignment: $+10.0$ if `actionType === 'EXAM_BENCHMARK'` or `isPlanAligned === true`; else $0.0$.
   - For `PREREQUISITE_REMEDIATION`: $\text{baseAlignment} = 10.0$, $\text{deadlineProximityBonus} = 0.0 \implies I = \min(\text{candidatePolicy.maxGoalImpactWeight}, 10.0)$.
   - For `CURRICULUM_ADVANCEMENT`: $I = \min(\text{candidatePolicy.maxGoalImpactWeight}, 10.0 + \text{deadlineProximityBonus})$.
   - For `EXAM_BENCHMARK`: $I = \min(\text{candidatePolicy.maxGoalImpactWeight}, 10.0 + \text{deadlineProximityBonus})$.
   - For `RETENTION_RESCUE` (`OVERDUE_REVISION` / `DUE_TODAY_REVISION`) and `PACING_CALIBRATION`:
     $$I = \min(\text{candidatePolicy.maxGoalImpactWeight}, \text{isPlanAligned} ? 10.0 : 0.0)$$
     because deadline bonus is strictly $0.0$ for these actions.

3. **Temporal Urgency ($T$)**:
   - For `OVERDUE_REVISION`:
     $$T = \min(\text{candidatePolicy.maxTemporalWeight}, \max(0, \text{daysOverdue}) \times 2.0)$$
   - For all other live V1 actions (including `EXAM_BENCHMARK`, `DUE_TODAY_REVISION`, `PREREQUISITE_REMEDIATION`, `CURRICULUM_ADVANCEMENT`, `PACING_CALIBRATION`):
     $$T = 0.0$$

4. **Composite Urgency Score ($U$)**:
   $$U = W + S + I + T$$

5. **Analytical Execution Without Intermediate Rounding**:
   Calculations maintain full unrounded IEEE-754 precision. No rounding occurs before:
   - Priority tier derivation:
     ```javascript
     if (U >= candidatePolicy.priorityThresholds.critical) return 'critical';
     if (U >= candidatePolicy.priorityThresholds.urgent) return 'urgent';
     if (U >= candidatePolicy.priorityThresholds.high) return 'high';
     if (U >= candidatePolicy.priorityThresholds.normal) return 'normal';
     return 'low';
     ```
   - Candidate ranking comparison (7-tier deterministic ranking comparator)
   - Rank ordering
   DTO/report rounding (`roundTo(score, 2)`), if any, occurs strictly after analytical ranking decisions are concluded.

### Mode B Policy Support & Pure Simulation Ownership
Mode B evaluates candidate policies across synthetic archetype vectors where all raw inputs (`storedMastery`, `isPlanAligned`, `deadlineProximityBonus`, `daysOverdue`) are fully specified. Therefore, Mode B support is **`EXACT`** across every allowed candidate-policy dimension.
Crucially, "exact" denotes **exact mathematical execution of Phase 11 candidate-policy pure simulation formulas over the supplied synthetic vectors**. It does **NOT** mean Phase 9 production code currently accepts dynamic parameters. Live Phase 9 code remains frozen, untouched, and unparameterized. Phase 11 encapsulates and owns pure simulation parameterization.

### Mode B Multi-Parameter Execution Order & Isolation Contract
Because synthetic archetype scenarios contain complete candidate action sets, candidate policies apply **all allowed changed dimensions simultaneously**. The deterministic execution sequence is:
1. **Validate complete candidate policy** against Section 22 schema and bounds; reject if matches baseline.
2. **Score every synthetic candidate** using the candidate policy parameters ($W, S, I, T$).
3. **Derive candidate priority tiers** using candidate priority thresholds.
4. **Execute the exact 7-tier deterministic ranking comparator** (`compareCandidates`).
5. **Derive simulated winning action**.
6. **Derive complete candidate rank order**.
7. **Compare against baseline policy result** to calculate simulated action disagreement rate, rank deltas, and tier shifts.

**Baseline vs. Candidate Isolation**:
Simulations maintain two strictly isolated, immutable result representations:
- `baselinePolicyResult`: Computed using frozen Phase 9 V1 baseline policy constants.
- `candidatePolicyResult`: Computed using validated candidate policy parameters.
Phase 11 must **never** mutate `baselinePolicyResult` in place or leak candidate state into the baseline evaluation. No rounded DTO values participate in Mode B analytical ranking.

### Strictly Prohibited Modifications
Candidate policies must **never** modify:
- Prerequisite gating threshold ($0.70$) — alters candidate eligibility.
- Action taxonomy or policy priority classes (Class 0, Class 1, Class 2).
- Candidate generation rules or question sizing logic.
- Active plan resolution semantics.
- Non-scored fallback semantics for `DIAGNOSTIC_ASSESSMENT`.
- Overdue temporal slope ($2.0$ points/day).

---

## 23. Persistence V1 Decision: Option A Frozen

Phase 11 V1 authoritatively adopts **Option A (0 New Collections)**:
- **Mongoose Models**: **Strictly 14** (Unchanged).
- **MongoDB Collections**: **Strictly 14** (Unchanged).
- **Execution**: In-memory execution via CLI / internal service.
- **Outputs**: Deterministic, versioned JSON report files written to `reports/simulations/`. Filesystem artifacts are generated outputs, **not** database persistence.

---

## 24. Execution Surface V1 Decision: Zero HTTP Routes

Phase 11 V1 exposes:
1. **Offline CLI Tool**: `scripts/simulatePolicy.js`
2. **Internal Programmatic Service**: `src/services/simulation/policySimulationService.js`
3. **HTTP Routes**: **STRICTLY ZERO** (No `/api/v1/simulation/*` or `/api/v1/attribution/*/policy-simulation`).

**Rationale**: The platform lacks administrative RBAC. Exposing cluster-wide analytical simulations on unauthenticated HTTP endpoints violates the security boundary.

---

## 25. Indexed Dataset Query Strategy

To prevent unindexed cluster-wide table scans, PPCO queries are strictly bounded around explicit user IDs:
```javascript
const SIMULATION_BOUNDS = Object.freeze({
  MAX_USERS_PER_RUN: 50,          // Maximum 50 explicit users per run
  MAX_SAMPLE_RECORDS: 1000,       // Global cap across all merged user records
  MAX_WINDOW_DAYS: 90,           // Maximum historical lookback
  DEFAULT_WINDOW_DAYS: 30,
  MAX_CANDIDATE_POLICIES: 5,      // Maximum 5 candidate policies compared
  MAX_EXECUTION_TIME_MS: 15000,   // 15 second CPU circuit breaker
});
```

The CLI requires `--userId <id>` or `--userIds <id1,id2,...>`. For each user, queries utilize the existing compound index `{ userId: 1, issuedAt: -1 }`:
```javascript
PrescriptionExecutionRecord.find({
  userId,
  issuedAt: { $gte: windowStart, $lte: referenceNow }
})
.sort({ issuedAt: -1, _id: 1 })
.limit(perUserLimit)
.lean();
```
Results are merged in memory and capped at `MAX_SAMPLE_RECORDS = 1000`. Unindexed `find({})` cluster scans are strictly prohibited.

---

## 26. Performance Contract: Hard Bounds vs. Non-Normative Targets

- **Hard Safety Bounds**:
  - `MAX_USERS_PER_RUN`: 50
  - `MAX_SAMPLE_RECORDS`: 1,000
  - `MAX_WINDOW_DAYS`: 90
  - `MAX_CANDIDATE_POLICIES`: 5
  - `MAX_EXECUTION_TIME_MS`: 15,000
- **Non-Normative Performance Targets** (Subject to post-implementation benchmark):
  - Target memory envelope: $\le 15\text{ MB}$ RSS overhead.
  - Target typical CPU execution: $\le 1000\text{ ms}$ for 1,000 snapshots across 3 policies.
  - Database queries: Bounded $N \le 50$ indexed per-user queries.

---

## 27. Determinism, Reproducibility & Fingerprinting

Simulation outputs are 100% reproducible from explicit inputs:
- `referenceNow` must be supplied explicitly; `Date.now()` is forbidden in core calculations.
- `Math.random()` is strictly forbidden.
- **Fingerprint Formula**:
  $$\text{policyFingerprint} = \text{SHA-256}(\text{canonicalCandidatePolicyJSON})$$
  $$\text{datasetFingerprint} = \text{SHA-256}(\text{canonicalOrderedRecordsJSON})$$
  $$\text{simulationFingerprint} = \text{SHA-256}(\text{policyFingerprint} + \text{datasetFingerprint} + \text{referenceNow} + \text{engineVersion})$$
- **Policy Fingerprint Invariant**: The policy fingerprint hashes the **complete, normalized canonical candidate policy object** (including all base weights, component bounds, and priority thresholds), **never merely the policy delta**. Two candidate policies with identical canonical definitions produce identical fingerprints; delta derivation is strictly an internal execution aid and does not define policy identity.
- Default artifact filename: `reports/simulations/sim_<simulationFingerprint>.json`.

---

## 28. File-Artifact Privacy Contract

Generated simulation reports must **never** expose student personal identifiable information (PII):
- Default aggregate reports strictly omit `userId`, `prescriptionId`, email, name, and IP addresses.
- Datasets are referenced solely by record counts and dataset SHA-256 fingerprints.
- Record-level debugging traces are strictly opt-in development artifacts (`--includeTrace=true`) and never generated by default.

---

## 29. Statistical Validity & Non-Causal Constraints

### Fundamental Principle
Because Phase 10 collects observational data from students interacting with a single production policy (Phase 9 v1), **the data cannot establish causal counterfactual treatment effects**:
- Unobserved counterfactuals do not exist in the database.
- Observed completion rates reflect both student conscientiousness and action difficulty.

### Mandatory Language & Epistemic Boundaries

| Strictly Prohibited Language | Authoritative Required Terminology |
| :--- | :--- |
| ❌ "Policy B caused a 14% improvement" | ✅ "Observed milestone rate among historical completed prescriptions under baseline policy" |
| ❌ "Candidate Policy B achieved a higher observed milestone rate" | ✅ "Candidate Policy B re-prioritizes this action archetype in 68% of simulated scenarios (simulated action selection frequency)" |
| ❌ "Students would have scored 10% higher under Policy B" | ✅ "Observed milestone association by historical action type and persisted priority tier" |
| ❌ "Causal treatment effect" | ✅ "Observed completion association / rate under historical orchestrationAlgorithmVersion" |
| ❌ "Counterfactual truth" | ✅ "Decision-audit re-scoring over frozen snapshots (Mode A)" |
| ❌ "Historical policy disagreement rate" | ✅ "Simulated action disagreement rate (Mode B only)" |

**Statistical Output Segregation**:
Historical Phase 10 observed metrics reflect only the deployed production policy. Candidate policies are unobserved and un-deployed; they possess **strictly zero observed student learning outcomes**. Aggregation reports must clearly separate:
1. **Descriptive Historical Attribution**:
   - "Observed milestone rate among historical completed prescriptions"
   - "Observed milestone association by historical action type"
   - "Observed milestone association by persisted priority tier"
   - "Observed completion rate under historical orchestrationAlgorithmVersion"
2. **Simulated Candidate Analytics**:
   - Simulated urgency score shift ($\Delta U$)
   - Simulated priority tier migration
   - Simulated comparator rank delta
   - Simulated action disagreement rate (Mode B)

---

## 30. Proposed File Architecture

```text
src/
├── config/
│   ├── simulationConfig.js                  // Bounds, thresholds, execution limits
│   └── simulationArchetypes.js              // Exactly 6 canonical synthetic archetype vectors
├── services/
│   └── simulation/
│       ├── policyValidationService.js       // Schema validation for candidate policies
│       ├── observedActionSensitivityService.js // Mode A: historical selected action re-scoring
│       ├── syntheticPolicyComparisonService.js // Mode B: archetype multi-candidate simulation
│       ├── adherenceOutcomeAggregationService.js // Descriptive Phase 10 outcome aggregation
│       ├── cohortSimulationService.js       // Bounded multi-user dataset loading & merging
│       └── policySimulationService.js       // Main simulation coordinator
├── utils/
│   └── simulationFingerprint.js             // SHA-256 fingerprinting utilities
scripts/
└── simulatePolicy.js                        // Offline administrative CLI execution script
tests/
└── simulation/
    ├── policyValidation.test.js
    ├── observedActionSensitivity.test.js
    ├── syntheticPolicyComparison.test.js
    ├── adherenceOutcomeAggregation.test.js
    ├── benchmarkCohortSimulation.test.js
    └── phase11CrossPhaseIsolation.test.js
```

---

## 31. Domain Error Model

PPCO is an offline CLI and internal service; it exposes **0 HTTP status codes**. Errors are thrown as structured domain errors:
- `INVALID_POLICY_DEFINITION`: Policy violates schema, parameter bounds, contains eligibility modifications, or matches baseline (`CANDIDATE_POLICY_MATCHES_BASELINE`).
- `INSUFFICIENT_HISTORICAL_DATA`: Fewer than 5 records found for requested user set.
- `DATASET_LIMIT_EXCEEDED`: Query exceeds safety bounds.
- `UNSUPPORTED_REPLAY_PARAMETER`: Policy alters non-reconstructible parameters for given record.
- `HISTORICAL_INPUT_UNAVAILABLE`: Record missing raw scoring factors required for replay.
- `SIMULATION_EXECUTION_FAILED`: Internal processing failure.

---

## 32. Cross-Phase Dependency Matrix

| Phase | Read Dependency | Write Dependency | Notes |
| :---: | :---: | :---: | :--- |
| **Phase 1–8** | **STRICTLY ZERO** | **STRICTLY ZERO** | Mode A reads only Phase 10; Mode B uses static synthetic archetypes. |
| **Phase 9** | Read Config / Formulas | **STRICTLY ZERO** | Reads `orchestrationConfig.js` for baseline truth. Zero live modifications. |
| **Phase 10** | Read `PrescriptionExecutionRecord` | **STRICTLY ZERO** | Reads historical records via compound index `{ userId: 1, issuedAt: -1 }`. |

---

## 33. Future Test Architecture

A comprehensive suite of **exactly 6 dedicated test suites** will be implemented in Phase 11:
1. `policyValidation.test.js`: Validates candidate policy schema, boundary rules, rejection of eligibility mutations, and rejection of baseline duplicates (`CANDIDATE_POLICY_MATCHES_BASELINE`).
2. `observedActionSensitivity.test.js`: Tests Mode A multi-parameter aggregation, `RAW_EXACT` vs `DTO_ROUNDED_PARTIAL` vs `UNSUPPORTED` vs `NOT_APPLICABLE` support precedence (`UNSUPPORTED > PARTIAL > EXACT`), neutral `NOT_APPLICABLE` filtering, irrelevant base-weight decoupling, combined component-delta arithmetic, shifted rounding intervals, candidate threshold application order (score first, thresholds second), and whole-policy unsupported enforcement (never silently evaluating supported subsets).
3. `syntheticPolicyComparison.test.js`: Tests Mode B multi-candidate simulation with simultaneous multi-parameter execution, exact 7-tier ranking comparator against live raw Phase 9 IEEE-754 scoring logic, isolated baseline vs candidate states, action disagreement rates, and rank shifts.
4. `adherenceOutcomeAggregation.test.js`: Tests descriptive grouping of Phase 10 adherence and milestone attainment.
5. `benchmarkCohortSimulation.test.js`: Tests execution across all 6 canonical student archetypes.
6. `phase11CrossPhaseIsolation.test.js`: Statically and dynamically proves zero writes across 14 collections, zero Phase 7/LLM imports, and 0 HTTP routes.

---

## 34. Model & Collection Count Impact

- Mongoose Models: **Strictly 14** (Unchanged).
- MongoDB Collections: **Strictly 14** (Unchanged).
- Zero database migrations, zero schema alterations.

---

## 35. Risks & Mitigations

1. **Risk of Conflating DTO Precision with Raw Precision**: Treating rounded DTO urgency as raw IEEE-754 values risks false precision.
   *Mitigation*: Enforce `scoreSource: PERSISTED_ROUNDED_DTO` and classify as `PARTIAL`.
2. **Computational Overhead of Large Datasets**: Scanning excessive records could block the event loop.
   *Mitigation*: Enforce `MAX_USERS_PER_RUN = 50` and `MAX_SAMPLE_RECORDS = 1000`.
3. **Contamination of Live Logic**: Accidental import of candidate policies into live arbitration.
   *Mitigation*: Enforce `simulationOnly: true` flags and static cross-phase isolation tests.

---

## 36. Open Questions for Independent Review

**Open Questions: NONE.**  
All architectural contracts, precision rules, and historical replay parameters for Phase 11 V1 are authoritatively resolved, source-verified, and frozen.

---

## 37. Recommendation

It is authoritatively recommended to proceed with **Candidate A: Policy Calibration & Offline Simulation Engine (PPCO)** utilizing **Option A (0 new DB collections, 0 HTTP routes, CLI/service execution with local JSON artifacts)**.

---

## 38. Phase Gate

```text
================================================================================
PHASE 11 ARCHITECTURE PROPOSAL — VERIFIED / READY FOR AUTHORITATIVE SPECIFICATION
================================================================================
```
