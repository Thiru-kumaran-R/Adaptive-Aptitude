# PHASE 8 ARCHITECTURE PROPOSAL: COGNITIVE DIAGNOSTICS & LONGITUDINAL LEARNING ANALYTICS ENGINE

```text
Document Type:       Architecture & Capability Discovery Proposal
Status:              PHASE 8 PROPOSAL — VERIFIED
                     READY TO DRAFT AUTHORITATIVE PHASE 8 SPECIFICATION
Implementation:      PROHIBITED (Design Stage Only)
Target Phase:        Phase 8
Author:              DeepMind Antigravity Pair Programmer
Repository:          adaptive-aptitude-api
Frozen Baseline:     Phases 1–7 Verified (51 Suites, 674 Tests, 13 Models)
```

---

## 1. Executive Summary

With the successful verification and closure of **Phase 7 (Intelligent Learning & LLM Layer)**, the Adaptive Aptitude Platform rests upon an authoritative, verified foundation:
- **Phase 1 (Foundation)**: Express.js application, MongoDB Mongoose ODM, centralized error taxonomy (`AppError`), environment configuration, and health endpoints.
- **Phase 2 (Question Intelligence)**: 12,000 verified questions, 24 topics, 278 patterns, 410 prerequisite DAG edges, SHA-256 fingerprint verification.
- **Phase 3 (Student Learning Data)**: User profiles, Goals owning target dates and deadlines (`targetDate`, `startDate`, `targetScore`), StudyPlans, DailyObjectives, immutable Attempt records, and StudentProgress aggregate counters.
- **Phase 4 (Adaptive Decision Engine)**: Deterministic pattern mastery calculation (evaluating recent accuracy, overall accuracy, recent difficulty competence, and attempt confidence), prerequisite remediation gating, dynamic difficulty adaptation, and next-question selection.
- **Phase 5 (Planning & Revision)**: Automated calendar study planning, progress-aware replanning, 5-stage spaced revision engine ($1, 3, 7, 14, 30$ days), and durable idempotency receipts (`RevisionProcessingRecord`).
- **Phase 6 (Mock Simulation)**: Standard & Diagnostic Mock Blueprints, multi-section timed exam execution, atomic distributed finalization leases (30s lease, 5s heartbeat, automatic recovery), idempotent response finalization into immutable `Attempt` records, and deterministic signed scoring (`resultSummary`).
- **Phase 7 (Intelligent Learning Advisory)**: Socratic tutoring, 5-level progressive hints, mistake analysis, progress coaching, plan explanation, and mock review backed by Draft-07 schema validation, multi-representation leakage guards, Gemini REST transport, and safe deterministic fallbacks (or 502/503/504 when provider fails and no safe fallback can be constructed).

### The Core Problem
Despite recording rich student event data across practice questions, adaptive sessions, spaced revision intervals, and mock exams, the platform currently operates in **transactional silos**:
- Phase 4 evaluates mastery on an isolated per-pattern basis.
- Phase 5 evaluates daily objectives and revision stages without cross-topic longitudinal modeling.
- Phase 6 evaluates pacing and section scores strictly within a single mock session.
- Phase 7 provides episodic pedagogical coaching for single attempts or single exams.

The platform currently lacks a **Longitudinal Learning Analytics & Cognitive Diagnostic Engine** capable of synthesizing student behavior across time, topics, and modalities. Students and client applications have no visibility into:
1. **Goal Readiness**: A deterministic, multi-component readiness index indicating progress toward target goals.
2. **Speed-Accuracy Tradeoffs**: Quantifying whether mistakes stem from conceptual deficiency or time-pressure rushing.
3. **Spaced Retention Trends**: Empirically measuring knowledge retention across elapsed time intervals between learning events.
4. **Cognitive Stamina & Fatigue**: Quantifying performance drop-off across multi-section exam durations.
5. **Systemic Weakness Clustering**: Identifying cross-topic prerequisite bottlenecks that block progression across study targets.

### Proposed Solution
We propose **Phase 8: Cognitive Diagnostics & Longitudinal Learning Analytics Engine**.
Phase 8 is a **read-only, analytical intelligence layer** that consumes immutable historical data from Phases 2, 3, 4, 5, and 6 to compute multi-dimensional diagnostic profiles. Crucially, Phase 8:
- Requires **ZERO new MongoDB collections** and **ZERO new Mongoose models** (exactly 13 models preserved).
- Implements **ZERO mutations** to Phase 1–7 truth.
- Does **NOT recalculate Phase 4 mastery**, which remains the exclusive domain of Phase 4.
- Does **NOT infer official syllabi, external exam cutoffs, or peer percentiles**, as no official exam profile layer exists.
- Delivers **4 focused REST endpoints** directly powering student dashboards, performance analytics charts, and diagnostic reports.

---

## 2. Current Platform Capability Map

The following map defines the exact capabilities, data ownership, and boundaries across all implemented phases:

```text
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                ADAPTIVE APTITUDE PLATFORM v1                                    │
├─────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Phase 1 — Project Foundation                                                                    │
│ - Express.js REST application, MongoDB Mongoose ODM connection, centralized error handling      │
│ - Health check (/health), CORS, environment configuration (.env), Jest testing harness          │
├─────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Phase 2 — Question Intelligence Layer                                                           │
│ - 12,000 canonical questions across 24 topics and 278 patterns; 10 difficulty levels            │
│ - 410 prerequisite DAG edges, 60 foundational patterns, 218 patterns with prerequisites         │
│ - SHA-256 fingerprint verification (content + metadata), topic & pattern registry service       │
├─────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Phase 3 — Student Learning Data Layer                                                           │
│ - User: identity profile (userId: String, name, email, avatar). Target dates belong to Goal.    │
│ - Goal: target anchor (title, type, targetName, startDate, targetDate, targetScore, status)     │
│ - StudyPlan: target definitions (goalId, scope, phase, targets: [{ topic, pattern, target... }])│
│ - DailyObjective: calendar work (date normalized UTC, patterns: [{ completed, target... }])    │
│ - Attempt: immutable snapshot (questionId, topic, pattern, difficulty, isCorrect, timeTaken)    │
│ - StudentProgress: aggregate cache (attempts, correct, accuracy, mastery, highestDiffMastered)  │
├─────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Phase 4 — Adaptive Decision Engine                                                              │
│ - Pattern mastery: deterministic calculation from recent accuracy (55%), overall accuracy (25%),│
│   recent difficulty competence (20%), and attempt confidence multiplier (0.60 + 0.40 * conf)   │
│ - Mastery labels: 'weak' (<0.40), 'developing' (<0.70), 'proficient' (<0.85), 'mastered' (>=0.85)│
│ - Prerequisite eligibility gating (prerequisite ready threshold: 0.70)                          │
│ - Dynamic difficulty adaptation (rolling accuracy over >=3 attempts, +/-1 adjustment)          │
│ - Next-question selection engine (balancing remediation, reinforcement, and progression)        │
├─────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Phase 5 — Automated Planning & Revision Engine                                                  │
│ - Automated calendar schedule generation from goals, daily budgets, and DAG topological order   │
│ - Dynamic replanning (uncompleted objective redistribution across remaining calendar days)      │
│ - Spaced repetition engine (5 stages: 1, 3, 7, 14, 30 days; completion requires mastery >= 0.85)│
│ - Durable idempotency receipts (RevisionProcessingRecord) preventing duplicate attempt mutation │
├─────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Phase 6 — Mock Test & Exam Simulation Engine                                                    │
│ - Standard & Diagnostic Mock Blueprints (multi-section timing, question counts, topic scopes)   │
│ - Timed Mock Sessions (created -> started -> submitted/expired/abandoned lifecycle states)      │
│ - Atomic distributed finalization lease (30s duration, 5s heartbeat, automatic recovery)        │
│ - Idempotent response finalization into Phase 3 Attempt records; signed section & total scoring │
│ - Sectional accuracy, timing analytics, and resultSummary persistence                           │
├─────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Phase 7 — Intelligent Learning & LLM Advisory Layer                                             │
│ - Advisory pedagogical endpoints: /tutor, /hint (Levels 1–5), /explain-attempt,                 │
│   /explain-progress, /explain-plan, /mock-review                                                │
│ - Security Matrix: Global finalization lockout (409) and active mock leakage protection (403)   │
│ - Level 5 hint gate: Requires prior user-owned historical attempt; canonical answer untruncated │
│ - Multi-representation content leakage validator (numbers, words, percentages, fractions)       │
│ - Gemini REST transport (responseFormat.text, 8000ms timeout) & hermetic FakeLLMProvider        │
│ - Safe deterministic fallback when constructible; 502/503/504 when provider fails and no safe   │
│   fallback can be constructed                                                                   │
│ - Common response envelope ({ data, metadata, provenance }) with 3-tier factual provenance      │
│ - Process-local sliding window rate limiter (30 req/hr, 2 concurrent requests per user)         │
└─────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Platform Gap Analysis

We evaluated the current state of the platform across 15 standard architecture dimensions to identify architectural and functional gaps:

| Dimension | Current State in Phases 1–7 | Identified Gap | Severity | Adjacent Phase | Persistent State? | Algorithmic Modification? | Public API? | Frontend Required? | V1 vs Future |
|---|---|---|---|---|---|---|---|---|---|
| **1. Product Capability** | Rich API for discrete actions (practice, mock, tutor). | No unified student dashboard API summarizing holistic progress across goals. | High | Phase 3, 5, 6 | No (derived) | No | Yes | Yes | **V1 Essential** |
| **2. Learning Intelligence** | Mastery computed per pattern independently. | No cross-topic competency modeling, prerequisite blockage index, or cognitive diagnostic profiling. | High | Phase 4 | No (derived) | No | Yes | Yes | **V1 Essential** |
| **3. Assessment** | Mock tests scored per session independently. | No longitudinal score tracking across mocks or stamina/fatigue curve modeling. | High | Phase 6 | No (derived) | No | Yes | Yes | **V1 Essential** |
| **4. Personalization** | Adaptive next-question operates on immediate history. | Behavioral traits (e.g. speed-accuracy tradeoff, rushing tendencies) are unquantified. | Medium | Phase 3, 4 | No (derived) | No | Yes | Yes | **V1 Essential** |
| **5. Analytics** | Aggregate counters in `StudentProgress` and single-mock `resultSummary`. | Zero longitudinal trend analytics (weekly velocity, empirical gap retention curves). | Critical | Phase 3, 5, 6 | No (derived) | No | Yes | Yes | **V1 Essential** |
| **6. Teacher/Admin Capability** | Intentionally out of scope (student-centric). | No administrative analytics or cohort views. | Out of Scope | None | — | — | — | — | Future-Only |
| **7. Observability** | Process-local console logs; no telemetry. | No OpenTelemetry metrics or distributed tracing. | Medium | Phase 1, 7 | No | No | No | No | Future-Only |
| **8. Reliability** | Process-local in-memory rate limiting; single-node leases. | Rate limits are process-local; multi-instance deployment requires distributed coordination. | Medium | Phase 1, 7 | Redis | No | No | No | Future-Only |
| **9. Security** | Strict ownership checks (404 vs 403), assessment guards. | Token authentication relies on header/body injection without JWT verification. | Low | Phase 1 | DB / Tokens | No | Yes | Yes | Future-Only |
| **10. Scalability** | Indexes optimized for Phase 2–6 queries. | Longitudinal analytics over large attempt histories could require indexing or query limits. | High | Phase 3 | No (query limits) | No | No | No | **V1 Essential** |
| **11. Deployment** | Standard Node.js entrypoint; no Docker/K8s artifacts. | Containerization recipes are unstandardized. | Low | Phase 1 | No | No | No | No | Future-Only |
| **12. User Experience Integration** | Granular REST endpoints; multiple calls needed to assemble UI. | Frontend clients must issue 6+ distinct calls to render a comprehensive student profile. | High | Phase 3, 4, 5, 6 | No (aggregation) | No | Yes | Yes | **V1 Essential** |
| **13. Data Lifecycle** | Immutable Attempts grow indefinitely; no archival. | Attempt collection unbounded; no cold-storage or summary rollup strategy. | Medium | Phase 3 | Cold storage | No | No | No | Future-Only |
| **14. Experimentation** | Fixed parameters (planning budgets, Leitner days). | No A/B testing harness for adaptive weights or revision intervals. | Low | Phase 4, 5 | DB | No | No | No | Future-Only |
| **15. Model Evaluation** | Hermetic fake provider tests; schema validation. | No automated benchmark evaluation assessing LLM pedagogical efficacy over time. | Low | Phase 7 | DB / S3 | No | No | No | Future-Only |

---

## 4. Candidate Phase 8 Options

Based on the critical gaps identified, we formulated four viable Phase 8 candidate architectures:

### Candidate A: Cognitive Diagnostics & Longitudinal Learning Analytics Engine
- **Focus**: Unified student intelligence layer.
- **Description**: Synthesizes student history across practice (Phase 3), adaptive progression (Phase 4), spaced revisions (Phase 5), and mock exams (Phase 6) into actionable cognitive diagnostics:
  - *Observed Retention Curves*: Analyzes empirical correctness across elapsed time gaps between practice and revision events.
  - *Speed-Accuracy Matrix*: Identifies quadrant classification (`Accurate & Fast`, `Accurate & Slow`, `Fast Error / Rushing Candidate`, `Slow Error / Struggling Candidate`).
  - *Cognitive Fatigue Curves*: Analyzes performance degradation across question sequences within completed mock sessions.
  - *Goal Readiness Index*: Calculates goal-aligned readiness index combining plan target coverage, mastery depth, eligible mock performance, and mock pacing efficiency.
  - *Unified Student Dashboard API*: Single-call endpoint delivering holistic learning metrics.

### Candidate B: Standardized Exam Profile & Blueprint Compilation Engine
- **Focus**: Curriculum standardization.
- **Description**: Establishes a verified repository of target exam profiles (e.g. CAT, GATE General Aptitude, TCS NQT, GRE Quantitative, IBPS PO):
  - Defines official syllabus topic weightages, pattern distributions, section constraints, and negative marking rules.
  - Introduces a compiler that automatically generates Phase 6 `MockBlueprint`s and Phase 5 `StudyPlan` targets tailored to specific standardized exams.
  - Eliminates manual blueprint construction.

### Candidate C: Pedagogical Simulation & Offline Evaluation Harness
- **Focus**: Algorithmic validation & stress-testing.
- **Description**: An automated testing and simulation framework that models synthetic student personas (e.g., Struggling Student, Monotonic Fast Learner, Random Guesser, Crammer):
  - Simulates 10,000+ learning sessions to evaluate deterministic mastery convergence, difficulty stability, and absence of schedule deadlock.
  - Evaluates Phase 7 LLM explanation consistency across thousands of synthetic student queries.

### Candidate D: Distributed Resilience, Telemetry & Multi-Instance Infrastructure
- **Focus**: Platform infrastructure & operational hardening.
- **Description**: Replaces process-local constraints with distributed infrastructure:
  - Replaces in-memory sliding-window rate limiter with Redis-backed distributed token bucket.
  - Adds OpenTelemetry instrumentation for distributed tracing across database queries and Gemini REST calls.
  - Formalizes Prometheus `/metrics` endpoints and health/readiness probe contracts.

---

## 5. Candidate Comparison Matrix

Each candidate was evaluated on an 8-point rubric (1 = Poor/High Risk, 5 = Excellent/Low Risk):

| Evaluation Criteria | Weight | Candidate A (Cognitive Analytics) | Candidate B (Exam Profiles) | Candidate C (Simulation Harness) | Candidate D (Telemetry/Infra) |
|---|---|---|---|---|---|
| **User Value** | 20% | **5** (Immediate rich visual insights) | **4** (Streamlined exam prep) | **2** (Developer/internal only) | **2** (Operational/transparent) |
| **Architectural Necessity** | 15% | **5** (Closes longitudinal analysis gap) | **3** (Curricula configured manually) | **3** (Current tests already cover math) | **4** (Needed for cluster deploy) |
| **Dependency on Existing Phases** | 10% | **5** (Consumes Phase 2–6 data) | **4** (Depends on Phase 2, 5, 6) | **3** (Depends on Phase 4, 5, 7) | **5** (Independent of domain logic) |
| **Implementation Risk** | 15% | **4** (Pure deterministic math; low risk) | **3** (Requires curating external syllabi) | **4** (Isolated test code) | **3** (Adds external infra like Redis) |
| **Data-Model Complexity** | 10% | **5** (Zero new collections in V1) | **3** (Requires ExamProfile models) | **5** (Zero DB models) | **3** (Redis schemas / state) |
| **Cross-Phase Regression Risk** | 10% | **5** (Read-only; zero mutation of truth) | **4** (May affect blueprint generation) | **5** (Zero production changes) | **4** (Middleware alterations) |
| **Production-Readiness Impact**| 10% | **4** (Unlocks frontend dashboard launch) | **3** (Standardizes blueprint creation) | **2** (Internal verification) | **5** (Enables cluster deployment) |
| **Near-Term Usefulness** | 10% | **5** (Essential for any web/mobile UI) | **3** (Manual blueprints suffice for V1) | **2** (Platform math already verified) | **3** (Single-instance currently stable) |
| **Weighted Score (out of 5.0)**| 100%| **4.65** | **3.35** | **3.10** | **3.40** |

---

## 6. Recommended Phase 8 Selection

### Selected Architecture:
```text
PHASE 8 — COGNITIVE DIAGNOSTICS & LONGITUDINAL LEARNING ANALYTICS ENGINE
```

### Primary Problem It Solves
Phases 1–6 store comprehensive student interaction records (attempts, time spent, mastery updates, revision histories, mock responses, section scores), and Phase 7 provides episodic pedagogical coaching. However, **the platform has no engine to evaluate the student's longitudinal learning trajectory**. 

Without Phase 8, client applications cannot answer fundamental student questions:
- *"Am I making progress toward completing the targets in my study plan?"*
- *"Am I making errors because I don't understand the concept, or because I am rushing under time pressure?"*
- *"How does my retention degrade as the time gap between revision sessions increases?"*
- *"Does my accuracy degrade significantly after 45 minutes of testing in full-length mocks?"*
- *"Which foundational topics are blocking my progress across target patterns?"*

### Why It Should Be Next
1. **Unlocks the Frontend Ecosystem**: Phase 8 provides the comprehensive aggregation layer required by student dashboards, performance progress charts, and diagnostic reports without requiring clients to orchestrate multiple queries.
2. **Zero Invariant Regression**: It is strictly **read-only**. It reads deterministic truth from Phases 2, 3, 4, 5, and 6, and delivers structured analytical DTOs. It does not alter question truth, mastery formulas, planning algorithms, or mock scoring.
3. **Zero Persistent Overhead**: It computes analytics deterministically from existing immutable collections (`Attempt`, `StudentProgress`, `RevisionItem`, `MockSession`, `MockResponse`). It requires **0 new MongoDB collections** and **0 new Mongoose models**.
4. **Feeds Future Pedagogical Personalization**: The cognitive profiles derived in Phase 8 (e.g. speed-accuracy tradeoff, fatigue curves) provide rich grounded signals for future Phase 7 prompt context hydration.

### Why Other Candidates Should Wait
- **Candidate B (Exam Profiles)**: While valuable, manual blueprint creation in Phase 6 and study plan target creation in Phase 3 are fully functional. Formalizing standardized exam syllabi requires extensive external curricular research and introduces content maintenance overhead.
- **Candidate C (Simulation Harness)**: The existing 51 test suites and 674 unit/integration tests already rigorously verify mathematical correctness, edge cases, and idempotency. Simulation is a testing enhancement, not a user-facing platform capability.
- **Candidate D (Distributed Telemetry & Redis)**: Multi-instance Redis rate limiting and OpenTelemetry become necessary only when scaling horizontally across container clusters. The current process-local rate limiter and MongoDB connection pool easily support V1 single-instance production workloads.

---

## 7. Why This Phase Is Next

1. **Natural Architectural Progression**: The platform built its domain data layers (Phases 1–3), its decision engine (Phase 4), its planning/revision engine (Phase 5), its assessment engine (Phase 6), and its pedagogical explanation layer (Phase 7). The logical next layer is **holistic longitudinal evaluation**.
2. **Unidirectional Intelligence Pipeline**: Phase 8 consumes deterministic data from Phases 2–6. It produces pure analytical signals that can feed future Phase 7 contextual prompts. Crucially, **Phase 7 advisory outputs never feed Phase 8**; analytics is 100% grounded in verified historical facts.
3. **Readiness for UI Integration**: Modern EdTech clients cannot function on raw transactional endpoints alone. Phase 8 provides the executive summaries, radars, and breakdown charts needed for production web and mobile clients.

---

## 8. Scope

1. **Deterministic Goal Readiness Index ($R \in [0.0, 1.0]$ or `null`)**:
   - Evaluates progress toward an owned `Goal` and its associated `StudyPlan`.
   - Combines four deterministic components: `planTargetCoverage`, `masteryDepth`, `eligibleMockPerformance`, and `eligibleMockPacing`.
   - Applies dynamic weight renormalization when mock data is absent.
   - Refuses to report a score when minimum evidence is unmet (`readinessScore: null`, `readinessStatus: 'insufficient_data'`).
   - Strictly defined as a **readiness index**, never as a probability of passing or selection.
2. **Speed-Accuracy Tradeoff Analysis**:
   - Categorizes attempts into four behavioral quadrants:
     - `Accurate & Fast`
     - `Accurate & Slow`
     - `Fast Error / Rushing Candidate`
     - `Slow Error / Struggling Candidate`
   - Computes pattern-specific median time baselines from the user's correct attempts within an analysis window.
   - Handles sparse baseline data safely (`insufficient_baseline`) when correct attempts $< 3$.
   - Never classifies an attempt as "mastered" solely due to correctness.
3. **Spaced Repetition Retention Trends**:
   - Exposes current factual `RevisionItem` state (`activeRevisionItems`, `stageDistribution`, `dueTodayCount`, `overdueCount`, `completedRevisionItems`).
   - Computes empirical retention by elapsed time gap (`observedRetentionByGap`) for revision attempts (`source = 'revision'`) anchored against the immediate prior attempt for the same pattern.
   - Uses exact half-open mathematical intervals without boundary overlap.
   - Defers statistical half-life curve fitting from V1 in favor of transparent empirical gap buckets.
4. **Cognitive Stamina & Fatigue Modeling**:
   - Analyzes accuracy across question sequence quartiles ($Q_1 \dots Q_4$) in completed, terminal mock sessions.
   - Reads question order from `MockSession.questionSequence` and correctness from finalized `Attempt` records (`source = 'mock'`).
   - Treats unanswered questions in a quartile as 0 correct.
   - Handles small mocks ($< 4$ questions) safely (`staminaCurve: null`, `staminaReason: 'insufficient_questions'`).
   - If first quartile accuracy is 0%, returns `fatigueDropoffPercent: null` with `fatigueReason: 'zero_first_quartile_baseline'` (preventing false reports of zero fatigue).
5. **Unified Dashboard Aggregation API**:
   - Aggregates user profile, active plan summary, due revision counts, recent mock summary, and topic diagnostic radar in a single low-latency call.
   - Candidate topics for `priorityFocusTopics` are strictly grounded in active study plan targets or existing `StudentProgress` records (returning `[]` for new users without plans or progress).
   - Computes `topicDiagnosticMastery` as the arithmetic mean of Phase 4 pattern masteries for patterns with progress, exposing coverage ratios.
   - Computes active plan completion percentage strictly from `DailyObjective.patterns` completed vs target questions.

---

## 9. Non-Goals (Strict Invariants)

- **NO Teacher / Mentor / Institutional Roles**: Remains strictly single-student focused.
- **NO RBAC or Authentication Redesign**: Authentication remains out of scope for Phase 8; student identity is verified via `userId`.
- **NO New MongoDB Collections or Mongoose Models**: Exactly 13 models preserved. All metrics are computed dynamically on-demand.
- **NO Mutation of Phase 1–7 Truth**: Phase 8 performs ZERO database writes.
- **NO Recalculation or Modification of Phase 4 Mastery**: Phase 4 owns mastery; Phase 8 only reads persisted values and labels (`weak`, `developing`, `proficient`, `mastered`).
- **NO Planning or Revision Re-Implementation**: Phase 5 owns scheduling and stage progression; Phase 8 only observes factual state.
- **NO Mock Scoring Re-Calculation**: Phase 6 owns scoring and finalization; Phase 8 reads completed `resultSummary` and finalized `Attempt` records.
- **NO LLM in the Analytical Critical Path**: Diagnostics are 100% deterministic mathematical calculations. LLMs are never used to compute readiness, accuracy, stamina, or retention.
- **NO Fabricated Peer Comparisons, Percentiles, or Pass Probabilities**: Ranks and percentiles without cohort data remain strictly prohibited. All metrics benchmark against absolute criteria or self-history.
- **NO Invented Syllabus Truth or Unverified Exam Profiles**: Does not assume official syllabus weights, exam cutoffs, or standard time budgets.
- **NO Attribution of Unrelated Mocks to Goals**: Completed mocks contribute to goal readiness ONLY when their blueprint scope deterministically matches the goal's study plan targets. Diagnostic mocks are excluded from V1 goal readiness.

---

## 10. Architecture

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                             PHASE 8 ANALYTICS ARCHITECTURE                             │
└────────────────────────────────────────────────────────────────────────────────────────┘

                                Client Applications
                                         │
                          HTTP REST API (GET /api/v1/analytics/...)
                                         │
                          ┌──────────────▼─────────────┐
                          │   analyticsController.js   │
                          └──────────────┬─────────────┘
                                         │
                                         ▼
                          ┌────────────────────────────┐
                          │   analyticsGuard.js        │
                          │   - Finalization check(409)│
                          │   - Active mock exclusion  │
                          │   - Goal ownership (403/4) │
                          └──────────────┬─────────────┘
                                         │
     ┌───────────────────────────────────┼────────────────────────────────────┐
     │                                   │                                    │
     ▼                                   ▼                                    ▼
 ┌─────────────────────────┐ ┌─────────────────────────┐  ┌─────────────────────────┐
 │ readinessService.js     │ │ cognitiveProfileService │  │retentionAnalyticsService│
 │ - planTargetCoverage    │ │ - Speed vs Accuracy     │  │ - Current Revision state│
 │ - masteryDepth          │ │ - Mock stamina curve    │  │ - observedRetentionByGap│
 │ - eligibleMockPerf      │ │ - Sparse baseline guard │  │ - Exact gap buckets     │
 │ - eligibleMockPacing    │ │ - Zero-Q1 fatigue guard │  │ - Adherence metrics     │
 └───────────┬─────────────┘ └───────────┬─────────────┘  └───────────┬─────────────┘
             │                           │                            │
             └───────────────────────────┼────────────────────────────┘
                                         │
                                         ▼
                           ┌───────────────────────────┐
                           │ dashboardAggregateService │
                           │ - Candidate topic filter  │
                           │ - topicDiagnosticMastery  │
                           │ - priorityFocusTopics     │
                           │ - planCompletionPercent   │
                           └─────────────┬─────────────┘
                                         │
                                         ▼
                   Deterministic Platform Read-Only Data Layer
            ┌────────────────────────────┬────────────────────────────┐
            ▼                            ▼                            ▼
    Phase 3 Data                 Phase 5 Data                 Phase 6 Data
    - Attempt (Immutable)        - RevisionItem               - MockSession
    - StudentProgress            - DailyObjective             - MockResponse
    - StudyPlan / Goal           - RevisionProcessingRecord   - MockBlueprint
```

### Unidirectional Relationship with Phase 7
```text
┌─────────────────────────┐           ┌─────────────────────────┐
│         PHASE 8         │           │         PHASE 7         │
│  Cognitive Diagnostics  │──────────►│  Pedagogical Advisory   │
│   (Deterministic Math)  │  signals  │   (LLM Context Hydration│
└─────────────────────────┘ (future)  └─────────────────────────┘
            ▲
            │ ZERO input (Phase 7 LLM output is NOT platform truth)
            │
```

---

## 11. Ownership Boundaries

| Concern | Authoritative Owner | Phase 8 Access | Mutation Permitted? | Justification |
|---|---|---|---|---|
| **Question Bank & DAG** | Phase 2 | Read-Only | **NO** | Canonical question truth is permanently frozen. |
| **Attempt Records** | Phase 3 | Read-Only | **NO** | Historical attempts are immutable snapshots. |
| **StudentProgress** | Phase 3 / Phase 4 | Read-Only | **NO** | Aggregate counters and mastery belong strictly to Phase 3/4. |
| **Mastery Calculation** | Phase 4 | Read-Only | **NO** | Phase 4 owns deterministic mastery formula. Phase 8 consumes stored values. |
| **Adaptive Selection** | Phase 4 | Read-Only | **NO** | Next-question recommendations belong to Phase 4. |
| **Study Plans & Goals** | Phase 3 / Phase 5 | Read-Only | **NO** | Planning and replanning algorithms belong to Phase 5. |
| **Daily Objectives** | Phase 3 / Phase 5 | Read-Only | **NO** | Objective generation and completion tracking belong to Phase 3/5. |
| **Revision Ladder** | Phase 5 | Read-Only | **NO** | 5-stage Leitner transitions and receipts belong to Phase 5. |
| **Mock Scoring & Leases** | Phase 6 | Read-Only | **NO** | Finalization, scoring, and response states belong to Phase 6. |
| **Pedagogical Advice** | Phase 7 | None / Consumer | **NO** | Phase 7 LLM layer remains decoupled. Phase 8 signals feed future Phase 7 prompts only. |
| **Longitudinal Diagnostics** | **Phase 8** | **Owner** | **In-Memory** | Phase 8 owns mathematical derivation of longitudinal diagnostics. Zero database writes. |

---

## 12. Data Model Impact

### Zero New Collections Policy
Phase 8 V1 is **100% stateless** with respect to persistent MongoDB collections.
- Proposed new collections: **0**
- Proposed new Mongoose models: **0**
- Total repository Mongoose models: **13** (strictly preserved).

### Verification of Actual Model Fields
Phase 8 consumes strictly verified fields from existing Phase 1–7 models:
1. `Goal` (`src/models/goalModel.js`):
   - `userId` (String), `title`, `type`, `targetName`, `description`, `startDate`, `targetDate`, `targetScore`, `priority`, `status`.
   - *Note*: `targetDate` belongs to `Goal`, NOT `User`.
2. `StudyPlan` (`src/models/studyPlanModel.js`):
   - `userId`, `goalId`, `name`, `scope`, `phase`, `startDate`, `endDate`, `status`, `targets: [{ topic, pattern, targetQuestions, targetMastery }]`, `planningMeta`.
   - *Note*: `targets[]` does NOT have a `status` or `completed` field. Target satisfaction is derived from `DailyObjective` and `StudentProgress`.
3. `DailyObjective` (`src/models/dailyObjectiveModel.js`):
   - `userId`, `planId`, `goalId`, `date` (normalized midnight UTC), `topic`, `patterns: [{ pattern, targetQuestions, completedQuestions, targetDifficulty }]`, `targetMinutes`, `actualMinutes`, `status`.
4. `Attempt` (`src/models/attemptModel.js`):
   - `userId`, `questionId`, `topic`, `pattern`, `difficulty`, `selectedAnswer`, `correctAnswer`, `isCorrect`, `timeTaken` (seconds), `source`, `sessionId`, `attemptedAt`.
   - *Note*: Uses `timeTaken` (NOT `timeSpentSeconds`).
5. `StudentProgress` (`src/models/studentProgressModel.js`):
   - `userId`, `topic`, `pattern`, `attempts`, `correct`, `incorrect`, `accuracy`, `totalTimeSpent`, `averageTime`, `consecutiveCorrect`, `consecutiveIncorrect`, `lastAttemptAt`, `mastery`, `highestDifficultyMastered`.
6. `RevisionItem` (`src/models/revisionItemModel.js`):
   - `userId`, `goalId`, `planId`, `topic`, `pattern`, `stage` (0..4), `intervalDays` (1, 3, 7, 14, 30), `nextReviewDate`, `lastReviewedAt`, `lastOutcome`, `consecutiveRevisionSuccesses`, `status`, `triggerAttemptId`, `lastProcessedAttemptId`, `processedAttemptIds`, `algorithmVersion`.
   - *Note*: Does NOT contain `lastAttemptAt` or `failureCount`.
7. `MockSession` (`src/models/mockSessionModel.js`):
   - `userId`, `blueprintId`, `blueprintSnapshot`, `blueprintFingerprint`, `mode`, `navigationPolicy`, `questionSequence`, `sectionStates`, `totalQuestions`, `durationMinutes`, `status`, `finalizationState`, `resultSummary`.
8. `MockResponse` (`src/models/mockResponseModel.js`):
   - `sessionId`, `questionId`, `userId`, `sectionId`, `selectedAnswer`, `status`, `isMarkedForReview`, `isViewed`, `viewedAt`, `timeTakenSeconds`.
   - *Note*: Does NOT contain `isCorrect` or `timeSpentSeconds`. Correctness is read from finalized `Attempt` records.

### Required Index Verification
The existing compound indexes in `attemptModel.js`:
```javascript
attemptSchema.index({ userId: 1, attemptedAt: -1 });
attemptSchema.index({ userId: 1, topic: 1, pattern: 1, attemptedAt: -1 });
attemptSchema.index({ sessionId: 1 }, { sparse: true });
```
and `studentProgressModel.js`:
```javascript
studentProgressSchema.index({ userId: 1, topic: 1, pattern: 1 }, { unique: true });
```
fully support Phase 8 diagnostic queries without creating new indexes.

---

## 13. Proposed API Surface

Phase 8 introduces 4 focused, idempotent `GET` endpoints under `/api/v1/analytics`. All responses expose `algorithmVersion: 'v1'` and explicit evidence counters.

### 1. `GET /api/v1/analytics/dashboard`
- **Purpose**: Unified single-call dashboard payload for student clients.
- **Query Parameters**: `userId` (required string).
- **Access Control**: Active mock sessions exclude unfinalized mock data; global finalization in progress returns `409 FINALIZATION_IN_PROGRESS`.
- **Response Shape (Normal Full-Data)**:
  ```json
  {
    "success": true,
    "data": {
      "userId": "student_123",
      "algorithmVersion": "v1",
      "summary": {
        "totalPracticeAttempts": 342,
        "totalMocksCompleted": 5,
        "overallAccuracy": 78.4,
        "attemptsAnalyzed": 342
      },
      "topicMasteryRadar": [
        {
          "topic": "Percentage",
          "diagnosticMastery": 0.82,
          "diagnosticLabel": "proficient",
          "patternsWithEvidence": 12,
          "canonicalPatternsInTopic": 12,
          "coverageRatio": 1.0
        },
        {
          "topic": "Algebra",
          "diagnosticMastery": 0.45,
          "diagnosticLabel": "weak",
          "patternsWithEvidence": 6,
          "canonicalPatternsInTopic": 14,
          "coverageRatio": 0.43
        }
      ],
      "activePlanSummary": {
        "planId": "66a01234567890abcdef1234",
        "name": "CAT 2026 Core Quantitative",
        "startDate": "2026-10-01T00:00:00.000Z",
        "endDate": "2026-12-31T00:00:00.000Z",
        "completionPercentage": 42.5,
        "totalTargetQuestions": 300,
        "totalCompletedQuestions": 128
      },
      "dueRevisionCount": 3,
      "priorityFocusTopics": ["Algebra", "Surds and Indices", "Trigonometry"]
    }
  }
  ```
- **Response Shape (Partial / No Active Plan, Topics Grounded in Evidence)**:
  ```json
  {
    "success": true,
    "data": {
      "userId": "student_123",
      "algorithmVersion": "v1",
      "summary": {
        "totalPracticeAttempts": 15,
        "totalMocksCompleted": 0,
        "overallAccuracy": 60.0,
        "attemptsAnalyzed": 15
      },
      "topicMasteryRadar": [
        {
          "topic": "Percentage",
          "diagnosticMastery": 0.50,
          "diagnosticLabel": "developing",
          "patternsWithEvidence": 2,
          "canonicalPatternsInTopic": 12,
          "coverageRatio": 0.17
        }
      ],
      "activePlanSummary": null,
      "dueRevisionCount": 0,
      "priorityFocusTopics": ["Percentage"]
    }
  }
  ```
- **Response Shape (Insufficient Data / New User with No Plan and No Progress)**:
  ```json
  {
    "success": true,
    "data": {
      "userId": "student_new",
      "algorithmVersion": "v1",
      "summary": {
        "totalPracticeAttempts": 0,
        "totalMocksCompleted": 0,
        "overallAccuracy": null,
        "attemptsAnalyzed": 0
      },
      "topicMasteryRadar": [],
      "activePlanSummary": null,
      "dueRevisionCount": 0,
      "priorityFocusTopics": []
    }
  }
  ```

---

### 2. `GET /api/v1/analytics/cognitive-profile`
- **Purpose**: Speed-accuracy tradeoff and cognitive stamina profiling.
- **Query Parameters**: `userId` (required), `topic` (optional), `windowDays` (optional integer, default: 30, max: 90).
- **Access Control**: Active mock sessions exclude unfinalized mock data; global finalization returns `409 FINALIZATION_IN_PROGRESS`.
- **Response Shape (Normal Full-Data)**:
  ```json
  {
    "success": true,
    "data": {
      "userId": "student_123",
      "algorithmVersion": "v1",
      "analysisWindow": {
        "windowDays": 30,
        "attemptsAnalyzed": 280
      },
      "speedAccuracyMatrix": {
        "quadrantCounts": {
          "accurateAndFast": 120,
          "accurateAndSlow": 85,
          "fastErrorRushing": 42,
          "slowErrorStruggling": 33
        },
        "insufficientBaselineCount": 0,
        "rushingRiskScore": 0.56,
        "medianTimeCorrectSeconds": 38.5,
        "medianTimeIncorrectSeconds": 24.2
      },
      "staminaCurve": {
        "mockSessionsAnalyzed": 5,
        "totalQuestionsAnalyzed": 300,
        "quartileAccuracy": [
          { "quartile": 1, "accuracy": 84.0, "totalQuestions": 75, "correctQuestions": 63 },
          { "quartile": 2, "accuracy": 79.5, "totalQuestions": 75, "correctQuestions": 60 },
          { "quartile": 3, "accuracy": 73.2, "totalQuestions": 75, "correctQuestions": 55 },
          { "quartile": 4, "accuracy": 65.0, "totalQuestions": 75, "correctQuestions": 49 }
        ],
        "fatigueDropoffPercent": 22.6
      }
    }
  }
  ```
- **Response Shape (Zero-Q1 Accuracy Fatigue Guard)**:
  ```json
  {
    "success": true,
    "data": {
      "userId": "student_struggling_mock",
      "algorithmVersion": "v1",
      "analysisWindow": {
        "windowDays": 30,
        "attemptsAnalyzed": 20
      },
      "speedAccuracyMatrix": {
        "quadrantCounts": {
          "accurateAndFast": 2,
          "accurateAndSlow": 1,
          "fastErrorRushing": 8,
          "slowErrorStruggling": 9
        },
        "insufficientBaselineCount": 0,
        "rushingRiskScore": 0.47,
        "medianTimeCorrectSeconds": 45.0,
        "medianTimeIncorrectSeconds": 28.0
      },
      "staminaCurve": {
        "mockSessionsAnalyzed": 1,
        "totalQuestionsAnalyzed": 20,
        "quartileAccuracy": [
          { "quartile": 1, "accuracy": 0.0, "totalQuestions": 5, "correctQuestions": 0 },
          { "quartile": 2, "accuracy": 20.0, "totalQuestions": 5, "correctQuestions": 1 },
          { "quartile": 3, "accuracy": 0.0, "totalQuestions": 5, "correctQuestions": 0 },
          { "quartile": 4, "accuracy": 0.0, "totalQuestions": 5, "correctQuestions": 0 }
        ],
        "fatigueDropoffPercent": null,
        "fatigueReason": "zero_first_quartile_baseline"
      }
    }
  }
  ```
- **Response Shape (Insufficient Data / No Mocks)**:
  ```json
  {
    "success": true,
    "data": {
      "userId": "student_sparse",
      "algorithmVersion": "v1",
      "analysisWindow": {
        "windowDays": 30,
        "attemptsAnalyzed": 4
      },
      "speedAccuracyMatrix": {
        "quadrantCounts": {
          "accurateAndFast": 0,
          "accurateAndSlow": 0,
          "fastErrorRushing": 0,
          "slowErrorStruggling": 0
        },
        "insufficientBaselineCount": 4,
        "rushingRiskScore": null,
        "medianTimeCorrectSeconds": null,
        "medianTimeIncorrectSeconds": null
      },
      "staminaCurve": null,
      "staminaReason": "insufficient_terminal_mocks"
    }
  }
  ```

---

### 3. `GET /api/v1/analytics/retention`
- **Purpose**: Spaced revision adherence and empirical gap-bucket retention analysis.
- **Query Parameters**: `userId` (required).
- **Access Control**: Active mock sessions exclude unfinalized mock data; global finalization returns `409 FINALIZATION_IN_PROGRESS`.
- **Response Shape (Normal Full-Data — Only Populated Buckets Returned)**:
  ```json
  {
    "success": true,
    "data": {
      "userId": "student_123",
      "algorithmVersion": "v1",
      "currentState": {
        "activeRevisionItems": 18,
        "completedRevisionItems": 6,
        "dueTodayCount": 3,
        "overdueCount": 1,
        "stageDistribution": {
          "stage0_1day": 4,
          "stage1_3days": 5,
          "stage2_7days": 4,
          "stage3_14days": 3,
          "stage4_30days": 2
        }
      },
      "observedRetentionByGap": [
        { "gapBucket": "0.5-1.5d", "totalEvents": 40, "correctEvents": 37, "observedRetentionRate": 92.5 },
        { "gapBucket": "1.5-4.5d", "totalEvents": 33, "correctEvents": 28, "observedRetentionRate": 84.8 },
        { "gapBucket": "4.5-9.5d", "totalEvents": 28, "correctEvents": 22, "observedRetentionRate": 78.6 },
        { "gapBucket": "9.5-18.5d", "totalEvents": 21, "correctEvents": 15, "observedRetentionRate": 71.4 },
        { "gapBucket": "18.5-35.5d", "totalEvents": 15, "correctEvents": 10, "observedRetentionRate": 66.7 },
        { "gapBucket": ">35.5d", "totalEvents": 8, "correctEvents": 4, "observedRetentionRate": 50.0 }
      ],
      "evidence": {
        "revisionAttemptsAnalyzed": 145,
        "excludedNoPriorAttemptCount": 3,
        "excludedShortGapCount": 2
      }
    }
  }
  ```
- **Response Shape (Insufficient Data / No Revisions Yet)**:
  ```json
  {
    "success": true,
    "data": {
      "userId": "student_no_rev",
      "algorithmVersion": "v1",
      "currentState": {
        "activeRevisionItems": 0,
        "completedRevisionItems": 0,
        "dueTodayCount": 0,
        "overdueCount": 0,
        "stageDistribution": {
          "stage0_1day": 0,
          "stage1_3days": 0,
          "stage2_7days": 0,
          "stage3_14days": 0,
          "stage4_30days": 0
        }
      },
      "observedRetentionByGap": [],
      "evidence": {
        "revisionAttemptsAnalyzed": 0,
        "excludedNoPriorAttemptCount": 0,
        "excludedShortGapCount": 0
      }
    }
  }
  ```

---

### 4. `GET /api/v1/analytics/readiness/:goalId`
- **Purpose**: Deep-dive readiness breakdown for a specific learning goal.
- **Query Parameters**: `userId` (required).
- **Access Control**: Two-step goal ownership verification (`Goal.findById(goalId)`):
  - Missing goal $\to$ `404 GOAL_NOT_FOUND`.
  - Mismatching `userId` $\to$ `403 FORBIDDEN`.
  - Global finalization $\to$ `409 FINALIZATION_IN_PROGRESS`.
- **Response Shape (Normal Full-Data with Eligible Mocks)**:
  ```json
  {
    "success": true,
    "data": {
      "goalId": "66a01234567890abcdef1234",
      "goalTitle": "CAT 2026 Quantitative",
      "targetDate": "2026-11-29T00:00:00.000Z",
      "algorithmVersion": "v1",
      "readinessStatus": "calculated",
      "readinessScore": 0.77,
      "components": {
        "planTargetCoverage": {
          "value": 0.85,
          "weight": 0.30,
          "effectiveWeight": 0.30,
          "completedTargets": 17,
          "totalTargets": 20,
          "quotaSatisfiedTargets": 12,
          "masterySatisfiedTargets": 15
        },
        "masteryDepth": {
          "value": 0.74,
          "weight": 0.35,
          "effectiveWeight": 0.35,
          "targetPatternsWithMastery": 20,
          "averageMastery": 0.74
        },
        "eligibleMockPerformance": {
          "value": 0.72,
          "weight": 0.25,
          "effectiveWeight": 0.25,
          "eligibleMocksCount": 3
        },
        "eligibleMockPacing": {
          "value": 0.80,
          "weight": 0.10,
          "effectiveWeight": 0.10,
          "averagePacingEfficiency": 0.80
        }
      },
      "criticalPrerequisiteBottlenecks": [
        {
          "targetPattern": "Time and Work — Alternate Days Work",
          "unmasteredPrerequisite": "Time and Work — Basic Work Rates",
          "prerequisiteMastery": 0.42,
          "masteryLabel": "developing"
        }
      ]
    }
  }
  ```
- **Response Shape (Partial Data / Weight Renormalized without Mocks)**:
  ```json
  {
    "success": true,
    "data": {
      "goalId": "66a01234567890abcdef1234",
      "goalTitle": "CAT 2026 Quantitative",
      "targetDate": "2026-11-29T00:00:00.000Z",
      "algorithmVersion": "v1",
      "readinessStatus": "calculated",
      "readinessScore": 0.79,
      "components": {
        "planTargetCoverage": {
          "value": 0.85,
          "weight": 0.30,
          "effectiveWeight": 0.4615,
          "completedTargets": 17,
          "totalTargets": 20,
          "quotaSatisfiedTargets": 12,
          "masterySatisfiedTargets": 15
        },
        "masteryDepth": {
          "value": 0.74,
          "weight": 0.35,
          "effectiveWeight": 0.5385,
          "targetPatternsWithMastery": 20,
          "averageMastery": 0.74
        },
        "eligibleMockPerformance": {
          "value": null,
          "weight": 0.25,
          "effectiveWeight": 0.0,
          "eligibleMocksCount": 0
        },
        "eligibleMockPacing": {
          "value": null,
          "weight": 0.10,
          "effectiveWeight": 0.0,
          "averagePacingEfficiency": null
        }
      },
      "criticalPrerequisiteBottlenecks": []
    }
  }
  ```
- **Response Shape (Insufficient Data / No StudyPlan Tied to Goal)**:
  ```json
  {
    "success": true,
    "data": {
      "goalId": "66a01234567890abcdef1234",
      "goalTitle": "CAT 2026 Quantitative",
      "targetDate": "2026-11-29T00:00:00.000Z",
      "algorithmVersion": "v1",
      "readinessStatus": "insufficient_data",
      "readinessScore": null,
      "reason": "NO_STUDY_PLAN_LINKED_TO_GOAL",
      "components": {
        "planTargetCoverage": null,
        "masteryDepth": null,
        "eligibleMockPerformance": null,
        "eligibleMockPacing": null
      },
      "criticalPrerequisiteBottlenecks": []
    }
  }
  ```

---

## 14. Deterministic Algorithms & Mathematical Models

All Phase 8 mathematical calculations are pure, deterministic functions configured via `src/config/analyticsConfig.js`:

```javascript
// src/config/analyticsConfig.js
module.exports = Object.freeze({
  ANALYTICS_ALGORITHM_VERSION: 'v1',
  DEFAULT_WINDOW_DAYS: 30,
  MAX_WINDOW_DAYS: 90,
  MAX_ATTEMPTS_ANALYZED: 1000,
  MIN_SPEED_BASELINE_SAMPLES: 3,
  SPEED_RUSHING_THRESHOLD_MULTIPLIER: 0.60,
  READINESS_WEIGHTS: Object.freeze({
    planTargetCoverage: 0.30,
    masteryDepth: 0.35,
    eligibleMockPerformance: 0.25,
    eligibleMockPacing: 0.10,
  }),
  MIN_READINESS_REQUIRED_COMPONENTS: Object.freeze(['planTargetCoverage', 'masteryDepth']),
  STAMINA_MIN_QUESTIONS: 4,
  PRIORITY_FOCUS_TOPICS_LIMIT: 3,
  GAP_RETENTION_BUCKETS: Object.freeze([
    { key: '0.5-1.5d',  minDaysInclusive: 0.5,  maxDaysExclusive: 1.5 },
    { key: '1.5-4.5d',  minDaysInclusive: 1.5,  maxDaysExclusive: 4.5 },
    { key: '4.5-9.5d',  minDaysInclusive: 4.5,  maxDaysExclusive: 9.5 },
    { key: '9.5-18.5d', minDaysInclusive: 9.5,  maxDaysExclusive: 18.5 },
    { key: '18.5-35.5d',minDaysInclusive: 18.5, maxDaysExclusive: 35.5 },
    { key: '>35.5d',    minDaysInclusive: 35.5, maxDaysExclusive: Infinity },
  ]),
});
```

### A. Speed-Accuracy Quadrant Classification
For an attempt $i$ on pattern $P$ at difficulty $D$:
1. Baseline Time $T_{\text{median}}(u, P, D)$ is computed as the **median `timeTaken` across correct attempts** by the same user $u$ on pattern $P$ at difficulty $D$ within the analysis window.
2. If total correct attempts by $u$ on $(P, D) < \text{MIN\_SPEED\_BASELINE\_SAMPLES}$ (3):
   $$\text{classification} = \text{"insufficient\_baseline"}$$
3. Otherwise, classify attempt $i$ with elapsed time $t_i$:
   - **Accurate & Fast**: $\text{isCorrect} = \text{true} \land t_i \le T_{\text{median}}$
   - **Accurate & Slow**: $\text{isCorrect} = \text{true} \land t_i > T_{\text{median}}$
   - **Fast Error / Rushing Candidate**: $\text{isCorrect} = \text{false} \land t_i < 0.60 \cdot T_{\text{median}}$
   - **Slow Error / Struggling Candidate**: $\text{isCorrect} = \text{false} \land t_i \ge 0.60 \cdot T_{\text{median}}$

The **Rushing Risk Score** is:
$$\text{RushingRisk} = \frac{\text{Count}(\text{Fast Error / Rushing Candidate})}{\text{Total Classified Incorrect Attempts}}$$
If total classified incorrect attempts is zero, $\text{RushingRisk} = \text{null}$.

### B. Cognitive Fatigue / Stamina Drop-off
Within completed, terminal mock sessions (`status IN ['submitted', 'expired']`, `finalizationState = 'completed'`):
1. Question order is retrieved strictly from `MockSession.questionSequence`.
2. For each question in the sequence, correctness is retrieved from the corresponding immutable `Attempt` (`source = 'mock'`, `sessionId = MockSession._id`, `questionId`).
3. **Unanswered Questions**: If no `Attempt` exists for a question in `questionSequence` (because the student left it unanswered), that question contributes **0 correct** to quartile accuracy.
4. If `totalQuestions < 4`: $\text{staminaCurve} = \text{null}$, $\text{staminaReason} = \text{"insufficient\_questions"}$.
5. Otherwise, partition the sequence into 4 balanced quartiles ($Q_1, Q_2, Q_3, Q_4$).
6. For each quartile:
   $$\text{Accuracy}(Q_k) = \frac{\sum_{j \in Q_k} \mathbb{I}(\text{Attempt}_j.\text{isCorrect} == \text{true})}{|Q_k|} \times 100\%$$
7. **Zero-Baseline Guard**:
   If $\text{Accuracy}(Q_1) === 0$:
   $$\text{fatigueDropoffPercent} = \text{null}, \quad \text{fatigueReason} = \text{'zero\_first\_quartile\_baseline'}$$
   *(Prevents falsely reporting 0% fatigue when the baseline quartile had zero correct answers).*
8. Otherwise, the **Fatigue Drop-off** across all qualifying mock sessions is:
   $$\Delta_{\text{fatigue}} = \max\left(0, \frac{\text{Accuracy}(Q_1) - \text{Accuracy}(Q_4)}{\text{Accuracy}(Q_1)}\right) \times 100\%$$

### C. Goal Readiness Index ($R \in [0.0, 1.0]$)
For an owned `Goal` and linked `StudyPlan` (`StudyPlan.goalId === Goal._id`):

#### 1. Plan Target Coverage ($C_{\text{plan}}$)
For each target $T$ in `StudyPlan.targets` (`{ topic, pattern, targetQuestions, targetMastery }`):
- Factual question progress is derived strictly from `DailyObjective`:
  $$\text{completedQuestions}(T) = \sum \text{DailyObjective.patterns}[j].\text{completedQuestions}$$
  where $\text{DailyObjective.planId} = \text{plan}._id$, $\text{DailyObjective.topic} = T.\text{topic}$, and $\text{pattern.pattern} = T.\text{pattern}$.
- **Quota Satisfaction**: $\text{quotaSatisfied}(T) \iff \text{completedQuestions}(T) \ge T.\text{targetQuestions}$.
- **Mastery Satisfaction**: $\text{masterySatisfied}(T) \iff \text{StudentProgress exists} \land \text{StudentProgress.mastery} \ge (T.\text{targetMastery} \text{ ?? } 0.85)$.
- **Target Satisfaction**:
  $$\text{targetSatisfied}(T) = \text{quotaSatisfied}(T) \lor \text{masterySatisfied}(T)$$
- Then:
  $$C_{\text{plan}} = \frac{\text{Count of targets satisfying } \text{targetSatisfied}(T)}{|\text{StudyPlan.targets}|}$$
  If $|\text{StudyPlan.targets}| === 0$: $C_{\text{plan}} = \text{null}$, $\text{readinessStatus} = \text{"insufficient\_data"}$.

*Crucial Distinction*: `planTargetCoverage` measures binary target satisfaction for goal readiness, whereas dashboard `activePlanSummary.completionPercentage` measures aggregate question completion across all daily objectives:
$$\text{completionPercentage} = \min\left(100.0, \frac{\sum_{\text{objectives}} \sum_{\text{patterns}} \text{completedQuestions}}{\sum_{\text{objectives}} \sum_{\text{patterns}} \text{targetQuestions}} \times 100\%\right)$$

#### 2. Mastery Depth ($M_{\text{depth}}$)
Arithmetic mean of stored Phase 4 `mastery` values from `StudentProgress` across the canonical patterns defined in `StudyPlan.targets`. Missing `StudentProgress` is treated as mastery = 0.0.
Requires at least 1 target pattern; otherwise $M_{\text{depth}} = \text{null}$.

#### 3. Eligible Mock Attribution & Performance ($P_{\text{mock}}$)
A completed mock is attributed to a goal **ONLY when a deterministic scope match is proven** between the mock blueprint/session snapshot and the owned StudyPlan targets:
- Define `PlanTargetPatterns` = Set of canonical `{ topic, pattern }` pairs in `StudyPlan.targets`.
- Define `MockScopePatterns` = Set of canonical `{ topic, pattern }` pairs derived from `session.blueprintSnapshot.sections[].scope` (expanded to canonical topic patterns via Phase 2 registry if topic-only or allCanonicalPatterns).
- **Eligibility Predicate**:
  1. `mock.userId === requestingUserId`
  2. `status IN ['submitted', 'expired']`
  3. `finalizationState === 'completed'`
  4. `mode === 'standard'` *(diagnostic mocks are excluded from V1 goal readiness)*
  5. `PlanTargetPatterns` is non-empty
  6. `MockScopePatterns` is non-empty
  7. `MockScopePatterns ⊆ PlanTargetPatterns` *(every mock scope pattern is within the plan target patterns)*
- If no eligible standard mocks exist or scope is ambiguous: $P_{\text{mock}} = \text{null}$.
- If eligible mocks exist: $P_{\text{mock}} = \text{mean percentage score across eligible mocks} / 100.0$.

#### 4. Eligible Mock Pacing ($S_{\text{pacing}}$)
Measures self-contained pacing efficiency strictly within eligible mocks:
- `allowedAverageSeconds = (mock.durationMinutes * 60) / mock.totalQuestions`
  Requires: `durationMinutes > 0` and `totalQuestions > 0`.
- `actualAverageTime = sum(timeTaken for finalized answered mock Attempts) / answeredAttemptCount`
  Requires: `answeredAttemptCount > 0` and `actualAverageTime > 0`.
- If any requirement fails (e.g. 0 answered questions): $\text{pacingEfficiency} = \text{null}$.
- Otherwise:
  $$\text{pacingEfficiency} = \min\left(1.0, \frac{\text{allowedAverageSeconds}}{\text{actualAverageTime}}\right)$$
- If no eligible mocks exist: $S_{\text{pacing}} = \text{null}$.

#### 5. Weight Renormalization
Let $\mathcal{C} = \{ c \mid c \neq \text{null} \}$.
If $\mathcal{C}$ does not contain both `planTargetCoverage` and `masteryDepth`:
$$\text{readinessScore} = \text{null}, \quad \text{readinessStatus} = \text{"insufficient\_data"}$$
Otherwise:
$$\text{readinessScore} = \frac{\sum_{c \in \mathcal{C}} w_c \cdot \text{value}(c)}{\sum_{c \in \mathcal{C}} w_c}$$
where base weights are $w_1 = 0.30, w_2 = 0.35, w_3 = 0.25, w_4 = 0.10$.

### D. Observed Retention by Elapsed Gap
1. **Observation Event**: Only immutable `Attempt` records with `A_k.source === 'revision'` serve as retention observations.
2. **Prior Anchor**: For each revision Attempt $A_k$, find the immediately preceding Attempt $A_{\text{prev}}$ for the same $(u, \text{topic}, \text{pattern})$ with $A_{\text{prev}}.\text{attemptedAt} < A_k.\text{attemptedAt}$ across ANY learning source (`practice`, `daily_plan`, `adaptive`, `revision`, `mock`).
3. If no prior Attempt exists: skip $A_k$ from gap retention and increment `excludedNoPriorAttemptCount`.
4. Compute elapsed gap:
   $$\text{gapDays} = \frac{A_k.\text{attemptedAt} - A_{\text{prev}}.\text{attemptedAt}}{86,400,000 \text{ ms}}$$
5. If $\text{gapDays} \le 0$: exclude as invalid chronology.
6. If $\text{gapDays} < 0.5$: exclude from gap analytics as sub-half-day review and increment `excludedShortGapCount`.
7. Assign $\text{gapDays}$ to its exact half-open bucket $[\text{minDaysInclusive}, \text{maxDaysExclusive})$:
   - `0.5-1.5d`: $[0.5, 1.5)$
   - `1.5-4.5d`: $[1.5, 4.5)$
   - `4.5-9.5d`: $[4.5, 9.5)$
   - `9.5-18.5d`: $[9.5, 18.5)$
   - `18.5-35.5d`: $[18.5, 35.5)$
   - `>35.5d`: $[35.5, \infty)$
8. In each bucket, compute:
   $$\text{RetentionRate} = \frac{\text{Count of correct revision observations}}{\text{Total revision observations in bucket}} \times 100\%$$
9. The API response returns **only populated buckets** (where $\text{totalEvents} > 0$), accompanied by evidence counters (`revisionAttemptsAnalyzed`, `excludedNoPriorAttemptCount`, `excludedShortGapCount`).

### E. Topic Diagnostic Mastery & Radar
For each canonical topic in the topic registry:
1. Retrieve all `StudentProgress` documents for the user belonging to that topic.
2. Compute:
   $$\text{topicDiagnosticMastery} = \frac{\sum_{p \in \text{Progress}} p.\text{mastery}}{|\text{Progress}|}$$
   If $|\text{Progress}| == 0$, $\text{topicDiagnosticMastery} = \text{null}$.
3. Map to Phase 8 diagnostic label:
   - $< 0.40 \implies \text{'weak'}$
   - $< 0.70 \implies \text{'developing'}$
   - $< 0.85 \implies \text{'proficient'}$
   - $\ge 0.85 \implies \text{'mastered'}$
   *(Clearly labeled as a Phase 8 diagnostic aggregate, NOT authoritative Phase 4 pattern mastery).*
4. Expose `patternsWithEvidence = |Progress|`, `canonicalPatternsInTopic`, and `coverageRatio = patternsWithEvidence / canonicalPatternsInTopic`.

### F. Priority Focus Topics Candidate Set & Ranking
To prevent unstarted topics from automatically populating focus lists for new users:
1. **Candidate Set Definition**:
   $$\text{CandidateTopics} = \{ \text{topic} \mid \text{topic} \in \text{activePlan.targets} \lor \text{StudentProgress exists for user on topic} \}$$
   - If $\text{CandidateTopics} = \emptyset$ (e.g. new user with no active plan and no progress records):
     $$\text{priorityFocusTopics} = []$$
2. **Unstarted Plan Topics**:
   A topic in the active plan with no progress records has:
   $$\text{topicDiagnosticMastery} = \text{null}, \quad \text{patternsWithEvidence} = 0, \quad \text{coverageRatio} = 0$$
3. **Ranking Comparator (applied to CandidateTopics)**:
   - Null diagnostic mastery first, otherwise mastery ascending.
   - Unmet prerequisite count descending.
   - `coverageRatio` ascending.
   - Canonical topic registry order index.
   Take the top 3 topics (`PRIORITY_FOCUS_TOPICS_LIMIT`).

---

## 15. Cross-Phase Integration & Access Control

Phase 8 introduces a dedicated `src/middlewares/analyticsGuard.js` to enforce analytical access invariants:

### 1. Global Finalization Lockout (`409 FINALIZATION_IN_PROGRESS`)
Before running any analytics query, inspect `MockSession` for the user:
```javascript
const inProgressMock = await MockSession.findOne({
  userId,
  finalizationState: 'in_progress'
});
if (inProgressMock) {
  throw new AppError(
    'Analytics unavailable while mock finalization is in progress.',
    409,
    'FINALIZATION_IN_PROGRESS'
  );
}
```
*Rationale*: Prevents clients from inferring mock results through analytics while finalization lease scoring is executing.

### 2. Active Mock Session Isolation
If a user has a mock session with `status IN ['created', 'started']`:
- The analytical endpoints execute successfully.
- However, all queries over `MockSession`, `MockResponse`, and `Attempt` **strictly exclude records tied to non-terminal mock sessions**.
- Draft responses are never read into longitudinal metrics.

### 3. Goal Ownership Verification
For `GET /api/v1/analytics/readiness/:goalId`:
```javascript
const goal = await Goal.findById(goalId);
if (!goal) {
  throw new AppError('Goal not found.', 404, 'GOAL_NOT_FOUND');
}
if (String(goal.userId) !== String(userId)) {
  throw new AppError('Forbidden: goal belongs to another user.', 403, 'FORBIDDEN');
}
```

---

## 16. Security & Privacy

1. **User Data Scoping**: All analytics service queries require explicit, indexed `{ userId }` filtering. No cross-tenant or cohort scanning occurs.
2. **Assessment Integrity**: Active mock exams are shielded from real-time score leakage via `analyticsGuard`.
3. **No PII Transmission**: Analytical outputs consist purely of aggregated counts, percentages, and canonical pattern identifiers.
4. **Zero Untrusted Code Execution**: All mathematical models are pure, bounded arithmetic functions with zero eval or external dependency requirements.

---

## 17. Concurrency & Failure Recovery

1. **Stateless Idempotency**: All Phase 8 endpoints are idempotent HTTP `GET` operations. They perform zero database writes and acquire zero distributed locks.
2. **Crash Resilience**: If an analytical calculation throws or times out, client requests fail safely with standard 500 error responses without leaving dangling state or corrupted documents.
3. **Write Isolation**: Because Phase 8 never mutates data, it cannot introduce deadlocks with Phase 4 mastery updates, Phase 5 replanning, or Phase 6 finalization.

---

## 18. Testing Strategy & Frozen Baseline

### Frozen Regression Baseline Invariant
Before and after Phase 8, the existing Phase 1–7 baseline must remain untouched and completely green:
```text
Existing Suites: 51
Existing Tests:  674
Passing:         674 (100%)
Failures:        0
Phase 2 Graph:   12,000 questions, 24 topics, 278 patterns, 410 edges, 0 cycles
Content Hash:    12,000 / 12,000 SHA-256 fingerprint matches
Mongoose Models: Exactly 13
```

### Proposed Phase 8 Test Suite Matrix (Estimated 8 New Suites, ~80 Tests)
1. `tests/analytics/analyticsGuard.test.js`:
   - Finalization lockout: returns 409 when `finalizationState = 'in_progress'`.
   - Active mock isolation: excludes unfinalized mock data from queries.
   - Goal ownership: returns 404 for nonexistent goal, 403 for mismatched user.
2. `tests/analytics/speedAccuracyMatrix.test.js`:
   - Quadrant classification: accurateAndFast, accurateAndSlow, fastErrorRushing, slowErrorStruggling.
   - Sparse baseline: returns `insufficient_baseline` when correct attempts $< 3$.
   - Never classifies attempt as "mastered" solely due to correctness.
   - Computes rushing risk score accurately.
3. `tests/analytics/staminaCurve.test.js`:
   - Uses terminal finalized mock sessions only (`submitted`, `expired`, `completed`).
   - Uses `MockSession.questionSequence` and immutable `Attempt` (`source = 'mock'`).
   - Treats unanswered questions as 0 correct.
   - Short mocks ($< 4$ questions) return `staminaCurve: null` without dividing by zero.
   - Zero-baseline guard: returns `fatigueDropoffPercent: null` with `fatigueReason: 'zero_first_quartile_baseline'` when $Q_1$ accuracy is 0%.
4. `tests/analytics/retentionAnalytics.test.js`:
   - Exposes current factual `RevisionItem` state without assuming non-existent fields (`lastAttemptAt`, `failureCount`).
   - Uses only `source = 'revision'` attempts as observations.
   - Anchors against immediate preceding attempt across any source.
   - Excludes sub-0.5-day gaps with `excludedShortGapCount`.
   - Verifies exact half-open non-overlapping bucket intervals.
   - Returns only populated buckets plus transparent evidence counts.
5. `tests/analytics/readinessService.test.js`:
   - Evaluates owned explicit `StudyPlan` targets using quotaSatisfied OR masterySatisfied without assuming target status fields.
   - Proves clear distinction between readiness `planTargetCoverage` and dashboard question `completionPercentage`.
   - Mock attribution: requires `MockScopePatterns ⊆ PlanTargetPatterns`.
   - Proves unrelated mocks, foreign mocks, active mocks, unfinalized mocks, and diagnostic mocks are excluded from readiness.
   - Zero-denominator pacing safety: zero duration, zero questions, or zero answered attempts return `pacingEfficiency = null` without dividing by zero.
   - Dynamic weight renormalization when mock components are null.
   - Insufficient evidence returns `readinessScore: null`, `readinessStatus: 'insufficient_data'`.
   - Proves readiness is an index, never called pass probability.
6. `tests/analytics/dashboardAggregateService.test.js`:
   - Candidate topic set: new user with no plan and no progress returns `priorityFocusTopics: []`.
   - Plan with unstarted topic: topic is eligible with `diagnosticMastery: null`.
   - Progress-only topic: eligible as focus candidate.
   - Unrelated canonical topics: excluded from focus list.
   - Tie breaks by canonical registry order.
   - Computes `topicDiagnosticMastery` as arithmetic mean of pattern masteries.
   - Clearly distinguishes diagnostic label from Phase 4 pattern mastery.
   - Computes plan completion percentage strictly from `DailyObjective.patterns`.
7. `tests/analytics/analyticsApiIntegration.test.js`:
   - Supertest integration covering all 4 endpoints across diverse student histories.
   - Verifies `algorithmVersion: 'v1'` in all payloads.
   - Verifies normal, partial, and insufficient-data response shapes.
8. `tests/analytics/phase8CrossPhaseIsolation.test.js`:
   - Proves Phase 8 creates strictly 0 database writes.
   - Proves Mongoose model count remains exactly 13.
   - Proves Phase 8 never calls `calculatePatternMastery` or mutates `StudentProgress`.

---

## 19. Migration & Rollback Strategy

1. **Database Migration**: **ZERO migrations required**. Phase 8 introduces 0 new collections and 0 schema modifications.
2. **Rollback Strategy**: If Phase 8 code requires rollback, simply reverting the Git commit immediately restores the platform to Phase 7 baseline. No database cleanup, migration rollback, or data repair is needed.

---

## 20. Risks & Mitigation

| Risk | Severity | Mitigation Strategy |
|---|---|---|
| **Query Performance on Large Attempt History** | Medium | Centralized `MAX_ATTEMPTS_ANALYZED = 1000` and `MAX_WINDOW_DAYS = 90` limits. Leverages existing compound indexes on `{ userId, attemptedAt }`. |
| **Active Mock Result Leakage** | Critical | Enforce centralized `analyticsGuard` checks: active mock session data is strictly omitted from analytical aggregations until terminal and finalized. |
| **In-Progress Finalization Race** | High | Immediately return `409 FINALIZATION_IN_PROGRESS` if a finalization lease is active. |
| **Formula Over-Fitting & False Authority** | Medium | Readiness index is linear, transparent, and bounded in $[0.0, 1.0]$. Refuses to declare "pass probability" or "percentile" without real cohort calibration. |
| **Model & Collection Bloat** | High | Strictly enforce **0 new collections**. All analytics remain on-demand derived views over historical facts. |

---

## 21. Alternatives Considered

1. **Persistent Analytical Rollup Collections**:
   - *Considered*: Creating a `StudentCognitiveProfile` MongoDB collection updated on every attempt.
   - *Rejected*: Introduces high write contention, potential state desynchronization, and complex distributed transaction requirements during high-throughput mock exams. On-demand derivation is fast, strictly consistent, and requires zero schema overhead.
2. **Standardized Exam Profiles (Candidate B)**:
   - *Considered*: Building an exam profile compilation engine.
   - *Deferred*: High external research dependency and content curation risk. Manual Phase 6 blueprints and Phase 5 study plans already suffice for V1.
3. **Statistical Ebbinghaus Curve Fitting**:
   - *Considered*: Non-linear least squares fitting for memory half-life $R = e^{-t/S}$.
   - *Rejected for V1*: Highly unstable on sparse revision sample sizes ($< 10$ attempts) and introduces numerical fitting failures. Replaced with transparent empirical gap buckets.

---

## 22. Implementation Readiness Checklist

```text
[x] priorityFocusTopics candidate set is explicitly defined (active plan targets OR progress records)
[x] new-user focus list matches candidate-set behavior (priorityFocusTopics = [])
[x] planTargetCoverage uses only actual StudyPlan/DailyObjective/StudentProgress fields
[x] no nonexistent target completion field is assumed on StudyPlan.targets
[x] plan readiness coverage and dashboard question completion are explicitly distinguished
[x] exact mock-to-goal attribution predicate is frozen (MockScopePatterns ⊆ PlanTargetPatterns)
[x] diagnostic mocks have explicit eligibility behavior (excluded from V1 readiness)
[x] ambiguous mock scope is excluded from readiness
[x] retention observation event is explicitly source = 'revision'
[x] retention anchor is immediate prior same-pattern Attempt across any learning source
[x] bucket intervals cannot overlap (exact half-open [minDaysInclusive, maxDaysExclusive))
[x] sub-0.5-day gap behavior defined (excluded from retention analytics with counter)
[x] retention evidence/exclusion counts are explicit (revisionAttemptsAnalyzed, excludedNoPriorAttemptCount, excludedShortGapCount)
[x] pacing cannot divide by zero (duration > 0, questions > 0, answered > 0, actualTime > 0 required)
[x] fatigue zero-baseline behavior cannot falsely report zero fatigue (fatigueDropoffPercent = null when Q1 accuracy = 0)
[x] all API examples match algorithms and documented response contracts
[x] Phase 4 mastery described accurately (deterministic, zero Bayesian/EMA language)
[x] all referenced model fields verified against actual Phase 1–7 Mongoose schemas
[x] User model targetDate removed; verified Goal owns targetDate
[x] RevisionItem non-existent fields (lastAttemptAt, failureCount) removed
[x] MockResponse non-existent fields (isCorrect, timeSpentSeconds) removed
[x] Invented syllabus truth removed; replaced with planTargetCoverage
[x] Goal readiness tied to owned explicit StudyPlan targets
[x] Readiness index framed as deterministic index, never pass probability
[x] Speed-accuracy quadrant names corrected (never "Mastered & Fast")
[x] Dedicated analyticsGuard specified (finalization lockout 409, active mock exclusion)
[x] Unidirectional data flow: Phase 8 feeds future Phase 7; Phase 7 never feeds Phase 8
[x] ANALYTICS_ALGORITHM_VERSION = 'v1' and centralized analyticsConfig.js defined
[x] Frozen baseline verified (51 suites, 674 tests, 12,000 questions, 12,000 SHA-256 hashes)
[x] Zero Phase 8 production code written
[x] Zero Phase 1–7 behavior modified
[x] Exactly 13 Mongoose models remain
```

---

```text
================================================================================
           PHASE 8 PROPOSAL — VERIFIED
   READY TO DRAFT AUTHORITATIVE PHASE 8 SPECIFICATION
================================================================================
```
