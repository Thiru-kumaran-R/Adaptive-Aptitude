# PHASE 12 — POLICY PROMOTION, VERSION GOVERNANCE & ROLLBACK ENGINE
# PRESCRIPTIVE ORCHESTRATION GOVERNANCE SPECIFICATION

Architecture:
1.7.10-FROZEN-FOR-SPECIFICATION

Specification Status:
VERIFIED / FROZEN FOR IMPLEMENTATION

---

## 1. Specification Status & Precedence

This document does not redesign Phase 12.

It translates the frozen architecture (version `1.7.10-FROZEN-FOR-SPECIFICATION`) into exact implementation contracts.

Where this specification and the architecture appear to conflict, the frozen architecture remains authoritative and the conflict must be reported instead of silently resolved.

---

## 2. Frozen Baseline Verification

### 2.1. Current Platform State (Pre-Implementation Baseline)
* **Mongoose Models**: 14
* **MongoDB Collections**: 14
* **Jest Test Suites**: 78 / 78 passing
* **Jest Total Tests**: 1021 / 1021 passing
* **Curriculum Questions**: 12,000 / 12,000 verified matching SHA-256
* **Curriculum Topology**:
  * Topics: 24
  * Patterns: 278
  * Legacy Mappings: 308
  * Prerequisite Patterns: 218
  * Foundational Patterns: 60
  * Prerequisite Edges: 410
  * Dependency Cycles: 0

### 2.2. Post-Phase-12 Target Invariant
* **Mongoose Models**: Strictly 15 (+1 new model)
* **MongoDB Collections**: Strictly 15 (+1 new collection)
* Do not assume or hardcode any final post-implementation Jest total in advance.

---

## 3. Exact Implementation File Inventory

Phase 12 is strictly confined to the following 22-file inventory:

### 3.1. New Production & Script Files (Exactly 3)
1. `src/models/orchestrationPolicyVersionModel.js` (Policy governance persistence model)
2. `src/services/governance/policyGovernanceService.js` (Sole production writer & governance engine)
3. `scripts/managePolicy.js` (CLI management utility)

### 3.2. Existing Production Files Modified (Exactly 9)
1. `src/services/orchestration/orchestrationUtils.js` (Threshold normalization & tier resolution)
2. `src/services/orchestration/urgencyScoringService.js` (Policy-driven urgency weight calculation)
3. `src/services/orchestration/candidateGenerationService.js` (Policy snapshot propagation)
4. `src/services/orchestration/nextActionArbiter.js` (Entry snapshot resolution & provenance attachment)
5. `src/services/orchestration/dailyAgendaAssembler.js` (Daily agenda single snapshot reuse)
6. `src/services/orchestration/interventionPolicyService.js` (Intervention policy single snapshot reuse)
7. `src/controllers/orchestrationController.js` (Unwrap & strip internal policy provenance before HTTP send)
8. `src/models/prescriptionExecutionRecordModel.js` (Schema extension & sparse governance index)
9. `src/services/attribution/attributionIssuanceService.js` (Same-call provenance stamping & paired override)

### 3.3. Existing Tests Modified (Exactly 7)
1. `tests/architecture_guard.test.js` (Model count 14 $\rightarrow$ 15, dual-scope sole-writer import guard)
2. `tests/attribution/attributionIssuance.test.js` (Model count 14 $\rightarrow$ 15, custom index count 5 $\rightarrow$ 6)
3. `tests/phase3_regression.test.js` (Reconciles `ALLOWED_MODELS` allowlist to include authorized `orchestrationPolicyVersionModel.js`)
4. `tests/learning/phase7CrossPhaseIsolation.test.js` (Reconciles platform Mongoose registered model count assertion 14 $\rightarrow$ 15)
5. `tests/analytics/phase8CrossPhaseIsolation.test.js` (Reconciles platform Mongoose registered model count assertion 14 $\rightarrow$ 15)
6. `tests/orchestration/phase9CrossPhaseIsolation.test.js` (Reconciles platform Mongoose registered model count assertion 14 $\rightarrow$ 15)
7. `tests/simulation/phase11CrossPhaseIsolation.test.js` (Reconciles `src/models` directory file count assertion 14 $\rightarrow$ 15)

### 3.4. New Tests Added (Exactly 3)
1. `tests/governance/policyGovernanceService.test.js` (17-step pipeline, validation, SemVer, model immutability)
2. `tests/governance/policyCli.test.js` (CLI trust boundary, timing-safe auth, parameter parsing)
3. `tests/governance/policyIntegration.test.js` (Transactions, rollback, Phase 9 runtime, Phase 10 provenance)

**Hard Constraint**: No additional Phase 12 production files, routes, controllers, models, background jobs, middleware modules, bootstrap scripts, or configuration files may be invented.

---

## 4. New Model Specification — OrchestrationPolicyVersion

* **Model Name**: `OrchestrationPolicyVersion`
* **File Path**: `src/models/orchestrationPolicyVersionModel.js`
* **Collection Name**: `orchestrationpolicyversions`
* **Timestamps**: Enabled (`createdAt`, `updatedAt` managed automatically by Mongoose)

### 4.1. Top-Level Field Schema

```javascript
const orchestrationPolicyVersionSchema = new mongoose.Schema(
  {
    policyVersion: {
      type: String,
      required: true,
      trim: true,
      match: /^v\d+\.\d+\.\d+$/,
      immutable: true
    },
    policyFingerprint: {
      type: String,
      required: true,
      trim: true,
      match: /^[a-f0-9]{64}$/,
      immutable: true
    },
    status: {
      type: String,
      required: true,
      enum: ['promoted', 'active', 'superseded', 'rolled_back'],
      default: 'promoted'
    },
    policyDefinition: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
      immutable: true
    },
    promotedBy: {
      type: String,
      required: true,
      trim: true,
      immutable: true
    },
    promotedAt: {
      type: Date,
      required: true,
      immutable: true
    },
    evidenceSimulationFingerprint: {
      type: String,
      default: null,
      trim: true,
      match: /^[a-f0-9]{64}$/,
      immutable: true
    },
    evidenceArtifactSha256: {
      type: String,
      default: null,
      trim: true,
      match: /^[a-f0-9]{64}$/,
      immutable: true
    },
    notes: {
      type: String,
      default: '',
      trim: true,
      immutable: true
    },
    isBaseline: {
      type: Boolean,
      required: true,
      default: false,
      immutable: true
    },
    lifecycleEvents: {
      type: [lifecycleEventSchema],
      default: []
    }
  },
  {
    collection: 'orchestrationpolicyversions',
    timestamps: true
  }
);
```

---

## 5. Immutable Fields Specification

Exactly 9 fields are frozen as immutable after document creation:
1. `policyVersion`
2. `policyFingerprint`
3. `policyDefinition`
4. `promotedBy`
5. `promotedAt`
6. `evidenceSimulationFingerprint`
7. `evidenceArtifactSha256`
8. `isBaseline`
9. `notes`

### 5.1. Immutable Field Invariant Table

| Field | Mongoose Type | Required / Default | Immutable | Baseline Value | Promoted Policy Value |
| :--- | :--- | :--- | :---: | :--- | :--- |
| `policyVersion` | `String` | Required | `true` | Strictly `'v1.0.0'` | `^v\d+\.\d+\.\d+$`<br>• New policy creation: requested version > highest stored version.<br>• Exact existing version: retry-only path resolved at Step 15; never creates another document. |
| `policyFingerprint` | `String` | Required | `true` | `generatePolicyFingerprint(BASELINE_POLICY)` | Recomputed 64-char hex SHA-256 |
| `policyDefinition` | `Mixed` | Required | `true` | Exact `BASELINE_POLICY` object | Validated 13-dimension object |
| `promotedBy` | `String` | Required | `true` | `'system'` or operator ID | Non-empty operator string |
| `promotedAt` | `Date` | Required | `true` | Passed `referenceNow` | Passed `referenceNow` |
| `evidenceSimulationFingerprint` | `String` | Default: `null` | `true` | Strictly `null` | 64-char hex `report.simulationFingerprint` |
| `evidenceArtifactSha256` | `String` | Default: `null` | `true` | Strictly `null` | 64-char hex raw artifact SHA-256 |
| `notes` | `String` | Default: `''` | `true` | `'Initial Phase 9 deterministic code baseline'` | Passed operator notes string |
| `isBaseline` | `Boolean` | Required (default: `false`) | `true` | Strictly `true` | Strictly `false` |

### 5.2. Mutation Enforcement
Only `status`, `lifecycleEvents`, and `updatedAt` may change during the document's lifecycle. Pre-save middleware verifies that none of the 9 immutable fields have been modified:

```javascript
orchestrationPolicyVersionSchema.pre('save', function (next) {
  if (!this.isNew) {
    const IMMUTABLE_FIELDS = [
      'policyVersion',
      'policyFingerprint',
      'policyDefinition',
      'promotedBy',
      'promotedAt',
      'evidenceSimulationFingerprint',
      'evidenceArtifactSha256',
      'isBaseline',
      'notes'
    ];
    for (const field of IMMUTABLE_FIELDS) {
      if (this.isModified(field)) {
        const err = new Error(`IMMUTABLE_FIELD_MUTATION: Field "${field}" is immutable and cannot be modified.`);
        err.code = 'IMMUTABLE_FIELD_MUTATION';
        return next(err);
      }
    }
  }
  return next();
});
```

---

## 6. Status State Machine Specification

### 6.1. Canonical State Set
* `promoted`: Stored and verified against Strategy B; awaiting activation.
* `active`: The single active policy governing Phase 9 runtime decisions.
* `superseded`: Previously active policy deactivated by forward `activatePolicy`.
* `rolled_back`: Previously active policy deactivated by backward `rollbackPolicy`.

```
                    ┌──────────────┐
                    │   promoted   │
                    └──────┬───────┘
                           │ activatePolicy
                           ▼
┌──────────────┐    ┌──────────────┐    ┌─────────────┐
│  rolled_back │◄───┤    active    ├───►│ superseded  │
└──────┬───────┘    └──────▲───────┘    └──────┬──────┘
       │                   │                   │
       └─────────── rollbackPolicy ────────────┘
```

### 6.2. Transition Rules Matrix

| Operation | Target State | Required History | Result |
| :--- | :--- | :--- | :--- |
| `activatePolicy` | `promoted` | N/A | Transitions to `active` |
| `activatePolicy` | `active` | N/A | Idempotent no-op (returns `{ policy: targetPolicy, idempotent: true }`) |
| `activatePolicy` | `superseded` | N/A | Rejected with `409 INVALID_STATE_TRANSITION` |
| `activatePolicy` | `rolled_back` | N/A | Rejected with `409 INVALID_STATE_TRANSITION` |
| `rollbackPolicy` | `promoted` | None | Rejected with `409 CANNOT_ROLLBACK_TO_UNACTIVATED_POLICY` |
| `rollbackPolicy` | `active` | Prior active | Rejected with `409 POLICY_ALREADY_ACTIVE` |
| `rollbackPolicy` | `superseded` | Contains `ACTIVATED` or `ROLLBACK_TARGET` | Eligible (subject to active origin existence and numeric SemVer direction) |
| `rollbackPolicy` | `rolled_back` | Contains `ACTIVATED` or `ROLLBACK_TARGET` | Eligible (subject to active origin existence and numeric SemVer direction) |
| `rollbackPolicy` | Any valid target | No active policy in registry | Rejected with `409 ACTIVE_POLICY_NOT_FOUND` |

Missing target version throws `404 POLICY_VERSION_NOT_FOUND`. Rollback target version $\ge$ active version throws `409 INVALID_ROLLBACK_DIRECTION`. Rollback requested when no active policy document exists throws `409 ACTIVE_POLICY_NOT_FOUND`.

#### Canonical `rollbackPolicy(targetVersion)` Preconditions:
1. Persisted `v1.0.0` baseline exists.
2. Target policy exists in `orchestrationpolicyversions`.
3. Target is not already active.
4. Target status is `superseded` or `rolled_back`.
5. Target lifecycle history contains `ACTIVATED` or `ROLLBACK_TARGET`.
6. Exactly one current active policy document exists (`status === 'active'`).
7. $targetVersion < currentActive.policyVersion$ using numeric SemVer comparison.
8. Only after all above conditions pass may mutations occur.

---

## 7. Lifecycle Event Contract

Every governance transition appends an immutable entry to `lifecycleEvents`.

### 7.1. Event Schema
```javascript
const lifecycleEventSchema = new mongoose.Schema(
  {
    eventType: {
      type: String,
      required: true,
      enum: ['PROMOTED', 'ACTIVATED', 'SUPERSEDED', 'ROLLBACK_ORIGIN', 'ROLLBACK_TARGET']
    },
    eventAt: {
      type: Date,
      required: true
    },
    operatorId: {
      type: String,
      required: true,
      trim: true
    },
    reason: {
      type: String,
      required: true,
      trim: true
    },
    fromPolicyVersion: {
      type: String,
      default: null
    },
    toPolicyVersion: {
      type: String,
      default: null
    },
    evidenceSimulationFingerprint: {
      type: String,
      default: null
    },
    evidenceArtifactSha256: {
      type: String,
      default: null
    }
  },
  { _id: true, timestamps: false }
);
```

### 7.2. Event Type Field Invariant Matrix

| Event Type | Method / Origin | `fromPolicyVersion` | `toPolicyVersion` | `evidenceSimulationFingerprint` | `evidenceArtifactSha256` |
| :--- | :--- | :---: | :---: | :---: | :---: |
| `PROMOTED` | `seedBaseline` | `null` | `'v1.0.0'` | `null` | `null` |
| `PROMOTED` | `promotePolicy` | `null` | `policyVersion` | `report.simulationFingerprint` | `evidenceArtifactSha256` |
| `ACTIVATED` | `seedBaseline` | `null` | `'v1.0.0'` | `null` | `null` |
| `ACTIVATED` | Forward `activatePolicy` | `currentActive.policyVersion` | `targetPolicy.policyVersion` | `targetPolicy.evidenceSimulationFingerprint` | `targetPolicy.evidenceArtifactSha256` |
| `SUPERSEDED` | Deactivated by `activatePolicy` | `currentActive.policyVersion` | `targetPolicy.policyVersion` | `null` | `null` |
| `ROLLBACK_ORIGIN` | Deactivated by `rollbackPolicy` | `currentActive.policyVersion` | `targetPolicy.policyVersion` | `null` | `null` |
| `ROLLBACK_TARGET` | Activated by `rollbackPolicy` | `currentActive.policyVersion` | `targetPolicy.policyVersion` | `targetPolicy.evidenceSimulationFingerprint` | `targetPolicy.evidenceArtifactSha256` |

* **Activation Evidence Invariant**: For forward `ACTIVATED` and backward `ROLLBACK_TARGET` events, the evidence hashes are populated directly from the target policy document being activated (`targetPolicy.evidenceSimulationFingerprint` and `targetPolicy.evidenceArtifactSha256`). For `v1.0.0` baseline, these values are naturally `null`. For all governed promoted policies, these values are non-null 64-character hex strings.
* **Rollback Non-Null Origin Invariant**: A successful rollback requires a strictly non-null active origin policy (`currentActive`). Therefore, `ROLLBACK_ORIGIN.fromPolicyVersion`, `ROLLBACK_ORIGIN.toPolicyVersion`, `ROLLBACK_TARGET.fromPolicyVersion`, and `ROLLBACK_TARGET.toPolicyVersion` are strictly non-null version strings matching `currentActive.policyVersion` and `targetPolicy.policyVersion`. A successful rollback must NEVER create `ROLLBACK_TARGET.fromPolicyVersion = null`.

---

## 8. Append-Only Snapshot Implementation

Historical lifecycle events are permanent audit records that must never be modified, truncated, replaced, or reordered.

### 8.1. Snapshot Capture & Refresh Protocol
Mongoose document hooks utilize `this.$locals.originalLifecycleEvents` to maintain an in-memory baseline of persisted events:
1. `post('init')`: Hydrates from MongoDB. Captures deep clone:
   ```javascript
   function captureLifecycleSnapshot(doc) {
     if (!doc.$locals) doc.$locals = {};
     doc.$locals.originalLifecycleEvents = JSON.parse(JSON.stringify(doc.lifecycleEvents || []));
   }
   orchestrationPolicyVersionSchema.post('init', function () {
     captureLifecycleSnapshot(this);
   });
   ```
2. `post('save')`: Executes upon every successful `.save()`. Refreshes the snapshot to match the newly committed state:
   ```javascript
   orchestrationPolicyVersionSchema.post('save', function () {
     captureLifecycleSnapshot(this);
   });
   ```
3. `pre('save')`: Validates append-only integrity prior to persistence:
   ```javascript
   orchestrationPolicyVersionSchema.pre('save', function (next) {
     if (this.isNew) {
       return next();
     }

     const originalEvents = this.$locals && this.$locals.originalLifecycleEvents
       ? this.$locals.originalLifecycleEvents
       : [];
     const currentEvents = this.lifecycleEvents || [];

     if (currentEvents.length < originalEvents.length) {
       const err = new Error('LIFECYCLE_MUTATION_PROHIBITED: Historical lifecycle events cannot be truncated or removed.');
       err.code = 'LIFECYCLE_MUTATION_PROHIBITED';
       return next(err);
     }

     for (let i = 0; i < originalEvents.length; i++) {
       const orig = originalEvents[i];
       const curr = currentEvents[i].toObject ? currentEvents[i].toObject() : currentEvents[i];

       if (
         orig.eventType !== curr.eventType ||
         new Date(orig.eventAt).getTime() !== new Date(curr.eventAt).getTime() ||
         orig.operatorId !== curr.operatorId ||
         orig.reason !== curr.reason ||
         orig.fromPolicyVersion !== curr.fromPolicyVersion ||
         orig.toPolicyVersion !== curr.toPolicyVersion ||
         orig.evidenceSimulationFingerprint !== curr.evidenceSimulationFingerprint ||
         orig.evidenceArtifactSha256 !== curr.evidenceArtifactSha256
       ) {
         const err = new Error(`LIFECYCLE_MUTATION_PROHIBITED: Historical lifecycle event at index ${i} cannot be modified.`);
         err.code = 'LIFECYCLE_MUTATION_PROHIBITED';
         return next(err);
       }
     }

     return next();
   });
   ```

### 8.2. Same-Document Multi-Save Support
Refreshing `$locals.originalLifecycleEvents` in `post('save')` ensures that legitimate sequential saves on the same in-memory instance succeed without triggering false-positive `LIFECYCLE_MUTATION_PROHIBITED` errors.

---

## 9. Transaction Abort Instance Discard Rule

```text
A Mongoose document instance used in an aborted governance transaction
must be discarded permanently.

It must never be reused after abort.

Any retry or subsequent operation must query a fresh document from MongoDB.
```

When an abort occurs, in-memory Mongoose documents retain mutated field states, dirty tracking flags, and internal arrays that no longer mirror the database state. Both service pseudocode and integration tests enforce this rule.

---

## 10. Conditional Evidence Validation Specification

Model-level pre-validation guarantees evidence integrity based on `isBaseline`:

```javascript
orchestrationPolicyVersionSchema.pre('validate', function (next) {
  if (this.isBaseline === true) {
    if (this.evidenceSimulationFingerprint !== null || this.evidenceArtifactSha256 !== null) {
      return next(new Error('Baseline policy documents must have null evidence hashes.'));
    }
  } else if (this.isBaseline === false) {
    const shaRegex = /^[a-f0-9]{64}$/;
    if (!this.evidenceSimulationFingerprint || !shaRegex.test(this.evidenceSimulationFingerprint)) {
      return next(new Error('Promoted policies require valid 64-char lowercase hex evidenceSimulationFingerprint.'));
    }
    if (!this.evidenceArtifactSha256 || !shaRegex.test(this.evidenceArtifactSha256)) {
      return next(new Error('Promoted policies require valid 64-char lowercase hex evidenceArtifactSha256.'));
    }
  }
  return next();
});
```

---

## 11. Phase 11 Policy Validation Ownership Specification

Phase 11 strictly owns policy definition schema validation. Phase 12 does not duplicate or maintain an independent policy bounds table.

### 11.1. Authoritative Reuse
Step 4 of `promotePolicy` calls the canonical Phase 11 validator:
```javascript
const { validateCandidatePolicy } = require('../simulation/policyValidationService');

// Step 4: Validate Candidate Policy Definition
validateCandidatePolicy(candidatePolicyDefinition);
```

### 11.2. Source-Verified Phase 11 Validation Contracts
As verified in `src/services/simulation/policyValidationService.js`:
* `candidatePolicyDefinition` must be a plain Object.
* `simulationOnly === true` is strictly required for candidates.
* All canonical keys must be present. Unknown keys are rejected with `UNKNOWN_PROPERTY`.
* Prohibited eligibility keys (e.g. `minPrerequisiteMastery`) are rejected with `PROHIBITED_ELIGIBILITY_MUTATION`.
* All 13 governed dimensions must be finite Numbers (`!Number.isFinite(v)` throws `NON_NUMERIC_VALUE`).
* **Canonical Ranges**:
  * `baseWeights.*`: $[0.0, 100.0]$ inclusive.
  * `maxMasteryDeficitWeight`: $[0.0, 50.0]$ inclusive.
  * `maxGoalImpactWeight`: $[0.0, 30.0]$ inclusive.
  * `maxTemporalWeight`: $[0.0, 20.0]$ inclusive.
  * `priorityThresholds.*`: $[0.0, 100.0]$ inclusive finite Numbers (not integers).
* **Threshold Strict Hierarchy**:
  $$\text{critical} > \text{urgent} > \text{high} > \text{normal}$$
  Equal adjacent thresholds throw `THRESHOLD_ORDER_VIOLATION`.
* Candidate must differ from `BASELINE_POLICY` in at least one governed dimension (`CANDIDATE_POLICY_MATCHES_BASELINE`).

Phase 12 propagates all Phase 11 domain errors directly without re-wrapping.

---

## 12. Canonical 13 Governed Dimensions

The exact 13 dimensions governed by `policyDefinition`:
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

---

## 13. Non-Tunable Phase 9 Constants & Priority Classes

The following constants and structural classifications remain hard invariants and must never appear in `policyDefinition`:
* `OVERDUE_TEMPORAL_POINTS_PER_DAY = 2.0`
* Prerequisite mastery readiness threshold: `0.70`
* **Policy Priority Classes**: `Class 0`, `Class 1`, `Class 2` (Frozen Phase 9 comparator/eligibility semantics, strictly distinct from display/urgency priority tiers `critical`, `urgent`, `high`, `normal`).
* Candidate eligibility rules and gating functions
* The 6 canonical action types
* The strict 7-tier candidate ranking comparator

---

## 14. Exact Six Action Types

Phase 9 evaluates strictly 6 canonical action types:
1. `PREREQUISITE_REMEDIATION`
2. `RETENTION_RESCUE`
3. `CURRICULUM_ADVANCEMENT`
4. `PACING_CALIBRATION`
5. `EXAM_BENCHMARK`
6. `DIAGNOSTIC_ASSESSMENT`

No additions, removals, renamings, or aliases are permitted.

---

## 15. Policy Fingerprint Contract

Phase 12 strictly imports `generatePolicyFingerprint` from `src/utils/simulationFingerprint.js`:
```javascript
const { generatePolicyFingerprint } = require('../../utils/simulationFingerprint');
```
* **Utility Source**: `src/utils/simulationFingerprint.js`
* **Duplicate Phase 12 Implementation**: Strictly **NONE**
* All candidate fingerprint computations, report candidate recomputations, baseline fingerprint generation, and duplicate fingerprint comparisons use this single authoritative utility.

---

## 16. Strategy B Evidence Contract

```text
Opaque Phase 11 Run Identity + Exact Candidate Verification + Raw Artifact Integrity
```

1. **`report.simulationFingerprint`**: The opaque Phase 11 simulation run identity. Phase 12 verifies its format (64-character lowercase hex) but does not reassemble or reconstruct it.
2. **`report.mode`**: Canonical Phase 11 simulation mode. The report MUST declare `report.mode`. Allowed qualifying modes:
   * `ARCHETYPE_POLICY_COMPARISON` (Mode B synthetic comparison)
   * `COMBINED` (Mode A + Mode B dual analysis)
   * Disallowed standalone modes: `OBSERVED_ACTION_SENSITIVITY` (Mode A standalone), `HISTORICAL_AGGREGATION`.
   * Explicit confirmation: `STANDARD_SWEEP` and `EXHAUSTIVE_SWEEP` are NOT Phase 11 V1 modes.
3. **`evidenceArtifactSha256`**: Exact raw SHA-256 digest computed by Phase 12 directly over the read evidence artifact file bytes before JSON parsing.

---

## 17. Exact 17-Step promotePolicy Pipeline

Execution follows the strict, frozen 17-step sequential pipeline:

```javascript
const promotePolicy = async ({
  candidatePolicyDefinition,
  policyVersion,
  evidenceReportPath,
  operatorId,
  notes = '',
  referenceNow
}) => {
  // Step 1: Validate Baseline Seeded
  const baseline = await OrchestrationPolicyVersion.findOne({
    policyVersion: 'v1.0.0',
    isBaseline: true
  });
  if (!baseline) {
    throw new AppError(
      409,
      'BASELINE_NOT_SEEDED',
      'Baseline policy (v1.0.0) must be seeded before promotion.'
    );
  }

  // Step 2: Validate Requested SemVer Syntax
  if (!/^v\d+\.\d+\.\d+$/.test(policyVersion)) {
    throw new AppError(400, 'VALIDATION_ERROR', `Invalid SemVer format "${policyVersion}". Expected "vX.Y.Z".`);
  }
  if (policyVersion === 'v1.0.0') {
    throw new AppError(400, 'VALIDATION_ERROR', 'v1.0.0 is permanently reserved for baseline policy.');
  }

  // Step 3: Verify Monotonic SemVer Progression / Retry Eligibility
  const allVersions = await OrchestrationPolicyVersion.find({}, 'policyVersion').lean();
  let hasExactVersionMatch = false;
  let highestStoredVersion = null;
  for (const doc of allVersions) {
    if (doc.policyVersion === policyVersion) {
      hasExactVersionMatch = true;
    }
    if (!highestStoredVersion || isSemVerHigher(doc.policyVersion, highestStoredVersion)) {
      highestStoredVersion = doc.policyVersion;
    }
  }

  if (highestStoredVersion) {
    if (isSemVerHigher(policyVersion, highestStoredVersion)) {
      // Case A: strictly higher than highest stored version -> eligible to continue
    } else if (hasExactVersionMatch) {
      // Case B: exact match with existing stored version -> permit continuation through evidence verification; defer idempotency vs conflict resolution to Step 15
    } else {
      // Case C: lower than highest stored version and nonexistent -> reject
      throw new AppError(
        409,
        'POLICY_VERSION_ALREADY_EXISTS',
        `Version ${policyVersion} is not higher than existing ${highestStoredVersion}.`
      );
    }
  }

  // Step 4: Validate Candidate Policy Definition (Calls Phase 11 Validator)
  validateCandidatePolicy(candidatePolicyDefinition);

  // Step 5: Generate/Recompute Candidate Policy Fingerprint
  const candidateFingerprint = generatePolicyFingerprint(candidatePolicyDefinition);

  // Step 6: Read Raw Evidence Artifact File Bytes
  let rawReportBuffer;
  try {
    rawReportBuffer = fs.readFileSync(path.resolve(evidenceReportPath));
  } catch (err) {
    throw new AppError(400, 'VALIDATION_ERROR', `Failed to read evidence artifact at "${evidenceReportPath}".`);
  }

  // Step 7: Parse Report Object
  let report;
  try {
    report = JSON.parse(rawReportBuffer.toString('utf8'));
  } catch (err) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Evidence report is not valid JSON.');
  }

  // Step 8: Validate Engine Version
  if (report.engineVersion !== 'v1') {
    throw new AppError(400, 'VALIDATION_ERROR', `Evidence report engineVersion must be "v1", received "${report.engineVersion}".`);
  }

  // Step 9: Validate Simulation Mode Qualification
  const ALLOWED_MODES = ['ARCHETYPE_POLICY_COMPARISON', 'COMBINED'];
  if (!ALLOWED_MODES.includes(report.mode)) {
    throw new AppError(400, 'INSUFFICIENT_EVIDENCE_MODE', `Simulation mode "${report.mode}" is insufficient for promotion. Requires ARCHETYPE_POLICY_COMPARISON or COMBINED.`);
  }

  // Step 10: Validate Structural Report Shape
  if (!report.simulationFingerprint || !/^[a-f0-9]{64}$/.test(report.simulationFingerprint)) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Evidence report missing valid 64-char lowercase hex simulationFingerprint.');
  }
  if (!report.datasetFingerprint || !/^[a-f0-9]{64}$/.test(report.datasetFingerprint)) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Evidence report missing valid 64-char lowercase hex datasetFingerprint.');
  }
  if (!report.baselinePolicy || typeof report.baselinePolicy !== 'object') {
    throw new AppError(400, 'VALIDATION_ERROR', 'Evidence report missing valid baselinePolicy.');
  }
  if (!Array.isArray(report.candidatePolicies) || report.candidatePolicies.length === 0) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Evidence report must contain non-empty candidatePolicies array.');
  }
  if (report.mode === 'ARCHETYPE_POLICY_COMPARISON') {
    if (!report.syntheticArchetypeAnalysis || !Array.isArray(report.syntheticArchetypeAnalysis.archetypes) || report.syntheticArchetypeAnalysis.archetypes.length === 0) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Mode B report missing syntheticArchetypeAnalysis.archetypes array.');
    }
  }
  if (report.mode === 'COMBINED') {
    if (!report.syntheticArchetypeAnalysis || !Array.isArray(report.syntheticArchetypeAnalysis.archetypes) || report.syntheticArchetypeAnalysis.archetypes.length === 0 || !report.historicalSensitivityAnalysis) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Combined mode report missing required analysis sections.');
    }
  }

  // Step 11: Locate Exact Candidate in Report
  const candidateEntry = report.candidatePolicies.find((c) => c.policyFingerprint === candidateFingerprint);
  if (!candidateEntry) {
    throw new AppError(400, 'VALIDATION_ERROR', `Candidate fingerprint ${candidateFingerprint} not found in evidence report.`);
  }

  // Step 12: Recompute Report Candidate Fingerprint
  const recomputedReportFingerprint = generatePolicyFingerprint(candidateEntry.policyDefinition);
  if (recomputedReportFingerprint !== candidateFingerprint || candidateEntry.policyFingerprint !== candidateFingerprint) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Recomputed candidate policy fingerprint does not match report entry.');
  }

  // Step 13: Verify Exact 13-Dimension Definition Match
  if (!deepEqualCanonicalPolicy(candidatePolicyDefinition, candidateEntry.policyDefinition)) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Candidate policy definition does not match report policy definition bit-for-bit.');
  }

  // Step 14: Compute Raw Artifact SHA-256 Digest
  const evidenceArtifactSha256 = crypto.createHash('sha256').update(rawReportBuffer).digest('hex');

  // Step 15: Duplicate / Conflict Registry Invariance Check
  const existingFingerprintDoc = await OrchestrationPolicyVersion.findOne({
    policyFingerprint: candidateFingerprint
  });

  const existingVersionDoc = await OrchestrationPolicyVersion.findOne({
    policyVersion
  });

  if (existingVersionDoc) {
    if (existingVersionDoc.policyFingerprint === candidateFingerprint) {
      return {
        policy: existingVersionDoc,
        idempotent: true
      };
    }

    throw new AppError(
      409,
      'POLICY_VERSION_ALREADY_EXISTS',
      `Policy version ${policyVersion} already exists with a different fingerprint.`
    );
  }

  if (existingFingerprintDoc) {
    return {
      policy: existingFingerprintDoc,
      idempotent: true
    };
  }

  // Step 16: Construct OrchestrationPolicyVersion (Instantiation only occurs after Steps 1-15 pass)
  const newPolicy = new OrchestrationPolicyVersion({
    policyVersion,
    policyFingerprint: candidateFingerprint,
    status: 'promoted',
    policyDefinition: candidatePolicyDefinition,
    promotedBy: operatorId,
    promotedAt: referenceNow,
    evidenceSimulationFingerprint: report.simulationFingerprint,
    evidenceArtifactSha256,
    notes,
    isBaseline: false,
    lifecycleEvents: [
      {
        eventType: 'PROMOTED',
        eventAt: referenceNow,
        operatorId,
        reason: notes || 'Policy promoted via managePolicy CLI',
        fromPolicyVersion: null,
        toPolicyVersion: policyVersion,
        evidenceSimulationFingerprint: report.simulationFingerprint,
        evidenceArtifactSha256
      }
    ]
  });

  // Step 17: Save Promoted Document
  await newPolicy.save();
  return { policy: newPolicy, idempotent: false };
};
```

**Zero Persistence Rule**: If any check in Steps 1–15 throws an error, zero documents are instantiated, and zero writes occur in MongoDB.

---

## 18. promotePolicy Signature Specification

```javascript
/**
 * Promotes a candidate policy after verifying qualifying Strategy B simulation evidence.
 *
 * @param {Object} params
 * @param {Object} params.candidatePolicyDefinition - 13-dimension policy object conforming to Phase 11
 * @param {string} params.policyVersion - Semantic version string (e.g. 'v1.1.0')
 * @param {string} params.evidenceReportPath - Absolute or relative filesystem path to simulation report
 * @param {string} params.operatorId - Non-empty audit identifier of invoking operator
 * @param {string} [params.notes=''] - Optional operational notes
 * @param {Date} params.referenceNow - Explicit reference timestamp
 * @returns {Promise<{ policy: Object, idempotent: boolean }>}
 */
```

---

## 19. Reference Clock Invariant

All state-mutating service methods receive an explicit `referenceNow`:
* `seedBaseline({ operatorId, referenceNow })`
* `promotePolicy({ ..., referenceNow })`
* `activatePolicy({ ..., referenceNow })`
* `rollbackPolicy({ ..., referenceNow })`

The service implementation contains **zero calls** to `new Date()` or `Date.now()`. The calling CLI or test fixture captures the timestamp once and passes it explicitly.

---

## 20. SemVer Contract

* **Syntax**: Strictly matches `/^v\d+\.\d+\.\d+$/`.
* **Parsing**: Extracted into integer tuple $(major, minor, patch)$ via regex matching.
* **Tuple Ordering Helper**:
  ```javascript
  const parseSemVer = (versionStr) => {
    const match = /^v(\d+)\.(\d+)\.(\d+)$/.exec(versionStr);
    if (!match) return null;
    return [parseInt(match[1], 10), parseInt(match[2], 10), parseInt(match[3], 10)];
  };

  const isSemVerHigher = (vA, vB) => {
    const a = parseSemVer(vA);
    const b = parseSemVer(vB);
    if (a[0] !== b[0]) return a[0] > b[0];
    if (a[1] !== b[1]) return a[1] > b[1];
    return a[2] > b[2];
  };

  const isSemVerLower = (vA, vB) => {
    return isSemVerHigher(vB, vA);
  };
  ```
* Lexical comparison is strictly forbidden. $v1.10.0 > v1.9.0$.

---

## 21. Duplicate & Idempotency Contract

Query ordering in Step 15 guarantees safe idempotency and conflict resolution:
1. Query both `policyFingerprint` and `policyVersion`:
   * **Same version + same fingerprint**: Existing version document has matching `policyFingerprint` $\rightarrow$ return existing document with `{ idempotent: true }` (zero writes).
   * **Same version + different fingerprint**: Existing version document has differing `policyFingerprint` $\rightarrow$ throw `409 POLICY_VERSION_ALREADY_EXISTS` (zero writes).
   * **Higher version + existing fingerprint**: Existing fingerprint document found under an earlier version $\rightarrow$ return existing document with `{ idempotent: true }` (zero duplicate documents created, zero writes).
   * **Higher version + new fingerprint**: Neither collision exists $\rightarrow$ proceed to document construction (Step 16) and save (Step 17).
   * **Lower nonexistent version**: Rejected in Step 3 before evidence verification or persistence.

---

## 22. Baseline Seeding Contract

* **Method**: `policyGovernanceService.seedBaseline({ operatorId, referenceNow })`
* **Trigger**: Solely via administrative CLI:
  ```bash
  node scripts/managePolicy.js seed-baseline --operatorId <string> [--secret <value>]
  ```
* **Behavior**:
  * If `v1.0.0` already exists: returns `{ policy: existingBaseline, idempotent: true }` without mutation.
  * If not exists: constructs `v1.0.0` with `status: 'active'`, `isBaseline: true`, `policyDefinition: BASELINE_POLICY`, null evidence hashes, `notes: 'Initial Phase 9 deterministic code baseline'`, and initial `PROMOTED` and `ACTIVATED` lifecycle events:
    ```javascript
    const baselineDoc = new OrchestrationPolicyVersion({
      policyVersion: 'v1.0.0',
      policyFingerprint: generatePolicyFingerprint(BASELINE_POLICY),
      status: 'active',
      policyDefinition: BASELINE_POLICY,
      promotedBy: operatorId || 'system',
      promotedAt: referenceNow,
      evidenceSimulationFingerprint: null,
      evidenceArtifactSha256: null,
      notes: 'Initial Phase 9 deterministic code baseline',
      isBaseline: true,
      lifecycleEvents: [
        {
          eventType: 'PROMOTED',
          eventAt: referenceNow,
          operatorId: operatorId || 'system',
          reason: 'Initial platform baseline seed',
          fromPolicyVersion: null,
          toPolicyVersion: 'v1.0.0',
          evidenceSimulationFingerprint: null,
          evidenceArtifactSha256: null
        },
        {
          eventType: 'ACTIVATED',
          eventAt: referenceNow,
          operatorId: operatorId || 'system',
          reason: 'Initial platform baseline activation',
          fromPolicyVersion: null,
          toPolicyVersion: 'v1.0.0',
          evidenceSimulationFingerprint: null,
          evidenceArtifactSha256: null
        }
      ]
    });
    ```
  * Zero automatic startup or Express middleware seeding.

---

## 23. Active Policy Resolution & Deep Immutability Contract

Runtime lookup executed at entry to Phase 9 orchestration:
```javascript
const deepFreeze = (obj) => {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  Object.freeze(obj);
  Object.keys(obj).forEach((key) => {
    deepFreeze(obj[key]);
  });
  return obj;
};

const resolveActivePolicySnapshot = async (referenceNow) => {
  try {
    const activeDoc = await OrchestrationPolicyVersion.findOne({ status: 'active' })
      .read('primary')
      .readConcern('local')
      .lean();

    if (!activeDoc) {
      console.warn(JSON.stringify({
        event: 'POLICY_REGISTRY_UNSEEDED_FALLBACK',
        timestamp: referenceNow.toISOString(),
        message: 'No active policy version found in database. Falling back to CODE_BASELINE_FALLBACK.'
      }));
      return buildFallbackSnapshot('CODE_BASELINE_FALLBACK');
    }

    const clonedDefinition = JSON.parse(JSON.stringify(activeDoc.policyDefinition));

    return deepFreeze({
      policyVersion: activeDoc.policyVersion,
      policyFingerprint: activeDoc.policyFingerprint,
      policyDefinition: clonedDefinition,
      source: activeDoc.isBaseline ? 'CODE_BASELINE' : 'GOVERNED_POLICY'
    });
  } catch (err) {
    console.warn(JSON.stringify({
      event: 'POLICY_REGISTRY_QUERY_FAILURE_FALLBACK',
      timestamp: referenceNow.toISOString(),
      errorCode: err.code || 'DB_ERROR',
      message: 'Active policy lookup failed. Falling back to CODE_BASELINE_FALLBACK.'
    }));
    return buildFallbackSnapshot('CODE_BASELINE_FALLBACK');
  }
};
```

`deepFreeze` recursively freezes `policySnapshot`, `policySnapshot.policyDefinition`, `baseWeights`, and `priorityThresholds`. Any attempt to mutate nested properties throws a `TypeError` in strict mode.

---

## 24. Fallback Contract

* If collection is empty or unseeded: resolves `CODE_BASELINE_FALLBACK`, emits structured warning `POLICY_REGISTRY_UNSEEDED_FALLBACK`.
* If database lookup fails (network timeout, connection drop): resolves `CODE_BASELINE_FALLBACK`, emits structured warning `POLICY_REGISTRY_QUERY_FAILURE_FALLBACK`.
* Fallback returns deep-frozen code `BASELINE_POLICY` snapshot. Zero database writes occur during fallback.

---

## 25. Single-Active Policy Transaction Contract & Canonical Session Lifecycle

Mutating transitions (`activatePolicy`, `rollbackPolicy`) execute within a multi-document MongoDB transaction with a single, leak-free session lifecycle.

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
        (e) => e.eventType === 'ACTIVATED' || e.eventType === 'ROLLBACK_TARGET'
      );

    if (isRollback && !wasPreviouslyActivated) {
      throw new AppError(
        409,
        'CANNOT_ROLLBACK_TO_UNACTIVATED_POLICY',
        'Rollback target has no prior activation evidence.'
      );
    }

    // 6. Locate currently active policy & evaluate rollback direction
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

    if (currentActive) {
      currentActive.status = isRollback ? 'rolled_back' : 'superseded';
      currentActive.lifecycleEvents.push({
        eventType: isRollback ? 'ROLLBACK_ORIGIN' : 'SUPERSEDED',
        eventAt: referenceNow,
        operatorId,
        reason: effectiveReason,
        fromPolicyVersion: currentActive.policyVersion,
        toPolicyVersion: targetVersion,
        evidenceSimulationFingerprint: null,
        evidenceArtifactSha256: null
      });
      await currentActive.save({ session });
    }

    targetPolicy.status = 'active';
    targetPolicy.lifecycleEvents.push({
      eventType: isRollback ? 'ROLLBACK_TARGET' : 'ACTIVATED',
      eventAt: referenceNow,
      operatorId,
      reason: effectiveReason,
      fromPolicyVersion: isRollback ? currentActive.policyVersion : (currentActive ? currentActive.policyVersion : null),
      toPolicyVersion: targetVersion,
      evidenceSimulationFingerprint: targetPolicy.evidenceSimulationFingerprint,
      evidenceArtifactSha256: targetPolicy.evidenceArtifactSha256
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
      // Suppress secondary abort errors
    }
  }
  throw err;
} finally {
  await session.endSession();
}
};
```

---

## 26. Index Topology Specification

`src/models/orchestrationPolicyVersionModel.js` declares exactly three schema-level custom indexes:

```javascript
// 1. Version uniqueness lookup
orchestrationPolicyVersionSchema.index(
  { policyVersion: 1 },
  { unique: true }
);

// 2. Fingerprint uniqueness / duplicate lookup
orchestrationPolicyVersionSchema.index(
  { policyFingerprint: 1 },
  { unique: true }
);

// 3. Single-Active Partial Unique Index
orchestrationPolicyVersionSchema.index(
  { status: 1 },
  {
    unique: true,
    partialFilterExpression: { status: 'active' }
  }
);
```

* ZERO field-level `index: true` or `unique: true` declarations.
* NO list-query compound index.

---

## 27. Prescription Execution Record Extension

`src/models/prescriptionExecutionRecordModel.js` adds top-level schema fields:
* `policyVersion`: `{ type: String, default: null }`
* `policyFingerprint`: `{ type: String, default: null }`
* `policySource`: `{ type: String, enum: ['GOVERNED_POLICY', 'CODE_BASELINE', 'CODE_BASELINE_FALLBACK'], default: null }`

### 27.1. Dedicated Sparse Index
```javascript
prescriptionExecutionRecordSchema.index(
  {
    policyVersion: 1,
    policyFingerprint: 1
  },
  {
    sparse: true
  }
);
```
Contains **no** `userId` and **no** `issuedAt`.

---

## 28. Platform Custom-Index Delta

* `OrchestrationPolicyVersion`: **+3**
* `PrescriptionExecutionRecord`: **+1** (moves from 5 to 6)
* **Total Platform Custom-Index Delta**: Strictly **+4**

---

## 29. Query Update Write-Bypass Protection

All direct Mongoose query mutations and document updates are intercepted by schema middleware hooks and throw `DIRECT_QUERY_UPDATE_PROHIBITED`:

```javascript
const FORBIDDEN_QUERY_UPDATE_OPS = [
  'updateOne',
  'updateMany',
  'findOneAndUpdate',
  'replaceOne',
  'findOneAndReplace'
];

FORBIDDEN_QUERY_UPDATE_OPS.forEach((op) => {
  orchestrationPolicyVersionSchema.pre(op, function (next) {
    const err = new Error(`DIRECT_QUERY_UPDATE_PROHIBITED: Generic query mutation via "${op}" is prohibited.`);
    err.code = 'DIRECT_QUERY_UPDATE_PROHIBITED';
    return next(err);
  });
});
```
Because Mongoose `document.updateOne()` delegates internally to the query `updateOne` path, both query and document update calls throw `DIRECT_QUERY_UPDATE_PROHIBITED`. Zero `DIRECT_DOCUMENT_UPDATE_PROHIBITED` error codes exist.

---

## 30. Deletion Protection

Deletions are intercepted and throw `UNAUTHORIZED_DELETION`:

```javascript
// Document deletion (hydrated doc.deleteOne())
orchestrationPolicyVersionSchema.pre('deleteOne', { document: true, query: false }, function (next) {
  const err = new Error('UNAUTHORIZED_DELETION: OrchestrationPolicyVersion documents cannot be deleted.');
  err.code = 'UNAUTHORIZED_DELETION';
  return next(err);
});

// Query deletions
const FORBIDDEN_QUERY_DELETE_OPS = ['deleteOne', 'deleteMany', 'findOneAndDelete'];
FORBIDDEN_QUERY_DELETE_OPS.forEach((op) => {
  orchestrationPolicyVersionSchema.pre(op, { document: false, query: true }, function (next) {
    const err = new Error(`UNAUTHORIZED_DELETION: Query deletion via "${op}" is prohibited.`);
    err.code = 'UNAUTHORIZED_DELETION';
    return next(err);
  });
});
```

* **Mongoose Delegation Contract**: `Model.findByIdAndDelete(...)` is intercepted because Mongoose delegates it internally to the `findOneAndDelete` query middleware hook. Zero separate `findByIdAndDelete` middleware registrations are created. Tests prove that `Model.findByIdAndDelete(...)` throws `UNAUTHORIZED_DELETION`.

---

## 31. Bulk Write Protection

Model-level bulk write methods throw `DIRECT_MODEL_WRITE_PROHIBITED`:

```javascript
orchestrationPolicyVersionSchema.pre('insertMany', function (next) {
  const err = new Error('DIRECT_MODEL_WRITE_PROHIBITED: insertMany is prohibited.');
  err.code = 'DIRECT_MODEL_WRITE_PROHIBITED';
  return next(err);
});

orchestrationPolicyVersionSchema.pre('bulkWrite', function (next) {
  const err = new Error('DIRECT_MODEL_WRITE_PROHIBITED: bulkWrite is prohibited.');
  err.code = 'DIRECT_MODEL_WRITE_PROHIBITED';
  return next(err);
});
```

---

## 32. Sole-Writer Architecture Boundary

```text
AUTHORIZED DIRECT MODEL CONSUMER:
src/services/governance/policyGovernanceService.js

PROHIBITED DIRECT MODEL ACCESS:
all other src/** production modules
all scripts/** executable modules

TEST EXEMPTION:
tests/** (exempt for direct invariant testing)
```

---

## 33. Dual-Scope Architecture Guard Contract

`tests/architecture_guard.test.js` is extended to scan both `src/` and `scripts/`:

```javascript
describe('Phase 12 Architecture Guard: OrchestrationPolicyVersion Sole-Writer Enforcement', () => {
  const rootDir = path.resolve(__dirname, '..');
  const srcFiles = getSourceFiles(path.join(rootDir, 'src'));
  const scriptFiles = getSourceFiles(path.join(rootDir, 'scripts'));
  const guardedFiles = [...srcFiles, ...scriptFiles];

  it('proves zero production or script files outside policyGovernanceService import orchestrationPolicyVersionModel', () => {
    // Detects require(...), import ... from ..., dynamic import(...), with or without .js, varied relative paths
    const importRegex = /(?:require\s*\(|from\s*|import\s*\()\s*['"][^'"]*\/orchestrationPolicyVersionModel(?:\.js)?['"]/;
    const tokenRegex = /\borchestrationPolicyVersionModel\b/;
    const violations = [];

    for (const file of guardedFiles) {
      if (file.endsWith('orchestrationPolicyVersionModel.js')) continue;
      if (file.endsWith('policyGovernanceService.js')) continue;

      const content = fs.readFileSync(file, 'utf8');
      const lines = content.split('\n');
      lines.forEach((line, idx) => {
        const trimmed = line.trim();
        if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) return;
        if (importRegex.test(trimmed) || tokenRegex.test(trimmed)) {
          violations.push(`${file}:${idx + 1}: ${trimmed}`);
        }
      });
    }

    expect(violations).toEqual([]);
  });
});
```

---

## 34. CLI Contract Specification & Flag Resolution

Executed via: `node scripts/managePolicy.js <command> [options]`

### 34.1. Commands & Flags

| Command | Required Flags | Optional Flags | Action |
| :--- | :--- | :--- | :--- |
| `seed-baseline` | `--operatorId <string>` | `--secret <val>`, `--confirm` | Seeds `v1.0.0` code baseline. |
| `promote` | `--policyDefinition <path>`, `--policyVersion <vX.Y.Z>`, `--evidenceReport <path>`, `--operatorId <string>` | `--notes <string>`, `--secret <val>`, `--confirm` | Verifies Strategy B evidence and registers policy. |
| `activate` | `--policyVersion <vX.Y.Z>`, `--operatorId <string>` | `--reason <string>`, `--secret <val>`, `--confirm` | Atomically activates promoted policy. |
| `rollback` | `--policyVersion <vX.Y.Z>`, `--operatorId <string>` | `--reason <string>`, `--secret <val>`, `--confirm` | Atomically rolls back to lower prior version. |
| `list` | — | `--limit <n>`, `--status <enum>`, `--secret <val>`, `--confirm` | Lists all stored policy versions. |
| `show` | `--policyVersion <vX.Y.Z>` | `--secret <val>`, `--confirm` | Prints full policy document and lifecycle history. |

### 34.2. Removal of `--evidenceFingerprint` CLI Flag
The v1.7.1 architecture removed the semantically undefined `--evidenceFingerprint` CLI argument.
Phase 12 therefore exposes no `evidenceFingerprint` CLI flag, service parameter, error code, or verification gate.

---

## 35. CLI Trust Boundary Specification

* **Environment Variable**: `POLICY_GOVERNANCE_SECRET`
* **Coverage**: The trust gate protects **all six CLI commands** (`seed-baseline`, `promote`, `activate`, `rollback`, `list`, `show`).
* **When Configured**: CLI requires `--secret <val>` and compares using `crypto.timingSafeEqual`. Missing `--secret` or mismatch fails closed with code 1.
* **When Unset**: CLI requires `--confirm` flag. Missing `--confirm` exits with code 1 without invoking any governance service method. When `--confirm` is supplied, emits warning `GOVERNANCE_SECRET_NOT_CONFIGURED` and continues authorized command execution (does not force non-zero exit).
* **Secrecy Contract**: Secrets are never logged or stored. Process argument visibility in `ps aux` is explicitly acknowledged as a host boundary property.
* **Boundary Invariant**: CLI secret validation is outside `policyGovernanceService.promotePolicy`'s 17-step Strategy B gate.

```javascript
const verifyCliTrustGate = (args) => {
  const secretEnv = process.env.POLICY_GOVERNANCE_SECRET;
  if (secretEnv && secretEnv.length > 0) {
    if (!args.secret) {
      console.error('Error: --secret <val> is required when POLICY_GOVERNANCE_SECRET is set.');
      process.exit(1);
    }
    const secretBuffer = Buffer.from(args.secret);
    const envBuffer = Buffer.from(secretEnv);
    if (
      secretBuffer.length !== envBuffer.length ||
      !crypto.timingSafeEqual(secretBuffer, envBuffer)
    ) {
      console.error('Error: Invalid governance secret.');
      process.exit(1);
    }
  } else {
    if (!args.confirm) {
      console.error('Error: --confirm is required when POLICY_GOVERNANCE_SECRET is not configured.');
      process.exit(1);
    }
    console.warn(JSON.stringify({
      warning: 'GOVERNANCE_SECRET_NOT_CONFIGURED',
      message: 'Administrative CLI executed without POLICY_GOVERNANCE_SECRET configured.'
    }));
  }
};
```

---

## 36. Governance Service Public API Specification

Exported methods in `src/services/governance/policyGovernanceService.js`:
* `seedBaseline({ operatorId, referenceNow })`
* `promotePolicy({ candidatePolicyDefinition, policyVersion, evidenceReportPath, operatorId, notes, referenceNow })`
* `activatePolicy({ targetVersion, operatorId, reason, referenceNow })`
* `rollbackPolicy({ targetVersion, operatorId, reason, referenceNow })`
* `resolveActivePolicySnapshot(referenceNow)`
* `listVersions({ limit, status })`
* `showPolicy({ policyVersion })`
* `normalizeGovernanceReason({ reason, isRollback })`

### 36.1. Reason Parameter Optionality & Deterministic Normalization Contract
* **Optionality**: `reason` is strictly **OPTIONAL** for both `activatePolicy` and `rollbackPolicy` across CLI and programmatic service invocations.
* **Deterministic Normalization**: Handled exclusively by `normalizeGovernanceReason({ reason, isRollback })`:
  * If `reason` is a non-empty string after trimming (`reason.trim().length > 0`), returns `reason.trim()`.
  * If `reason` is `undefined`, `null`, empty string `''`, or whitespace-only, returns deterministic default:
    * Forward activation: strictly `'Policy activation'`
    * Rollback: strictly `'Policy rollback'`
* **Single Effective Reason Invariant**: Both lifecycle events written within the same transaction (`SUPERSEDED` and `ACTIVATED` for forward activation; `ROLLBACK_ORIGIN` and `ROLLBACK_TARGET` for rollback) receive the exact same `effectiveReason`.
* **Programmatic Compatibility**: Direct service calls omitting `reason` succeed and persist the canonical default without throwing schema validation errors.

---

## 37. Phase 9 Runtime Integration Specification

All Phase 9 entry points resolve `policySnapshot` once per request:
* `nextActionArbiter.getNextAction(orchestrationContext)`
* `dailyAgendaAssembler.getDailyAgenda(orchestrationContext)`
* `interventionPolicyService.getInterventions(orchestrationContext)`

```javascript
const policySnapshot =
  orchestrationContext.policySnapshot ||
  await policyGovernanceService.resolveActivePolicySnapshot(orchestrationContext.referenceNow);
```

---

## 38. Policy Snapshot Propagation Specification

The resolved `policySnapshot` propagates through candidate generation:
1. `candidateGenerationService.generateCandidatePool(context, policySnapshot)`
2. Forwards to `calculateUrgencyScore` and `getPriorityTier`.

---

## 39. Priority Threshold Normalization Specification

In `src/services/orchestration/orchestrationUtils.js`:

```javascript
const { PRIORITY_THRESHOLDS } = require('../../config/orchestrationConfig');

const DEFAULT_PRIORITY_THRESHOLDS = Object.freeze({
  critical: PRIORITY_THRESHOLDS.CRITICAL,
  urgent: PRIORITY_THRESHOLDS.URGENT,
  high: PRIORITY_THRESHOLDS.HIGH,
  normal: PRIORITY_THRESHOLDS.NORMAL,
});

const normalizePriorityThresholds = (raw) => {
  if (!raw || typeof raw !== 'object') {
    return DEFAULT_PRIORITY_THRESHOLDS;
  }

  return Object.freeze({
    critical:
      raw.critical ??
      raw.CRITICAL ??
      DEFAULT_PRIORITY_THRESHOLDS.critical,

    urgent:
      raw.urgent ??
      raw.URGENT ??
      DEFAULT_PRIORITY_THRESHOLDS.urgent,

    high:
      raw.high ??
      raw.HIGH ??
      DEFAULT_PRIORITY_THRESHOLDS.high,

    normal:
      raw.normal ??
      raw.NORMAL ??
      DEFAULT_PRIORITY_THRESHOLDS.normal,
  });
};

const getPriorityTier = (
  urgencyScore,
  priorityThresholds = DEFAULT_PRIORITY_THRESHOLDS
) => {
  if (
    urgencyScore === null ||
    urgencyScore === undefined ||
    !Number.isFinite(urgencyScore)
  ) {
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

* **Legacy Parity Invariant**: When `urgencyScore` is `null`, `undefined`, `NaN`, `Infinity`, or `-Infinity`, `getPriorityTier` returns `'normal'`.

---

## 40. Urgency Scoring Governance Specification

In `src/services/orchestration/urgencyScoringService.js`:
* `baseWeights`: Overrides base action type weights.
* `maxMasteryDeficitWeight`: Overrides default `25.0`.
* `maxGoalImpactWeight`: Overrides default `15.0`.
* `maxTemporalWeight`: Overrides default `10.0`.
* `priorityThresholds`: Passed to `getPriorityTier`.

---

## 41. Internal Phase 9 Provenance Specification

Phase 9 internal service wrappers return:
```javascript
policyProvenance: {
  policyVersion: policySnapshot.policyVersion,
  policyFingerprint: policySnapshot.policyFingerprint,
  policySource: policySnapshot.source
}
```

---

## 42. Controller Provenance Stripping Specification

In `src/controllers/orchestrationController.js`:
* Consumes the existing repository success helper:
  `sendSuccess(res, publicData, { referenceNow: context.referenceNow.toISOString() });`
* `policyProvenance` is unwrapped and removed before passing `publicData` to `sendSuccess`.
* Public HTTP DTOs remain completely identical to Phase 9 contracts. Zero change to response envelope or status codes.

---

## 43. Phase 10 Exact-Call Provenance Specification

In `src/services/attribution/attributionIssuanceService.js`:
* `policyProvenance` is extracted directly from the same Phase 9 call that generated the action:
  ```javascript
  const result = await nextActionArbiter.getNextAction(orchestrationContext);
  const policyProvenance = result.policyProvenance;
  ```
* Zero independent active-policy database queries are executed in Phase 10 issuance.

---

## 44. Programmatic Action / Provenance Pairing Specification

When `issuePrescription` receives an explicit `candidateAction`:
* It MUST also receive `policyProvenance` as a mandatory paired unit.
* Providing `candidateAction` without `policyProvenance` throws `400 VALIDATION_ERROR` ("Programmatic candidateAction requires accompanying policyProvenance.").

---

## 45. Public DTO Invariance Specification

Phase 12 introduces **zero new fields** to public Phase 9 DTOs (`formatActionDTO`, `executionIntent`).

---

## 46. Canonical Governance Error Codes Specification

Phase 12 preserves strictly the canonical governance error codes defined by the frozen architecture:

| Error Code | Triggering Operation | HTTP Status | CLI Exit | Transaction Behavior |
| :--- | :--- | :---: | :---: | :--- |
| `BASELINE_NOT_SEEDED` | `promotePolicy`, `activatePolicy`, `rollbackPolicy` | 409 | 1 | Pre-persistence / Pre-mutation check |
| `POLICY_VERSION_ALREADY_EXISTS` | `promotePolicy` (Step 3, Step 15) | 409 | 1 | Pre-persistence check |
| `POLICY_VERSION_NOT_FOUND` | `activatePolicy`, `rollbackPolicy` | 404 | 1 | Transaction aborts |
| `POLICY_ALREADY_ACTIVE` | `rollbackPolicy` (already active) | 409 | 1 | Transaction aborts |
| `INVALID_STATE_TRANSITION` | `activatePolicy` (superseded/rolled_back) | 409 | 1 | Transaction aborts |
| `CANNOT_ROLLBACK_TO_UNACTIVATED_POLICY` | `rollbackPolicy` (no activation proof) | 409 | 1 | Transaction aborts |
| `INVALID_ROLLBACK_DIRECTION` | `rollbackPolicy` (target $\ge$ active) | 409 | 1 | Transaction aborts |
| `ACTIVE_POLICY_NOT_FOUND` | `rollbackPolicy` (no active origin document) | 409 | 1 | Transaction aborts |
| `INSUFFICIENT_EVIDENCE_MODE` | `promotePolicy` (Step 9) | 400 | 1 | Pre-persistence check |
| `IMMUTABLE_FIELD_MUTATION` | Document save pre-hook | 400 | 1 | Save rejected |
| `LIFECYCLE_MUTATION_PROHIBITED` | Document save pre-hook | 400 | 1 | Save rejected |
| `DIRECT_QUERY_UPDATE_PROHIBITED` | Query update pre-hook | 400 | 1 | Query rejected |
| `DIRECT_MODEL_WRITE_PROHIBITED` | Bulk write pre-hook | 400 | 1 | Bulk write rejected |
| `UNAUTHORIZED_DELETION` | Deletion pre-hook | 400 | 1 | Deletion rejected |
| `GOVERNANCE_SECRET_NOT_CONFIGURED` | CLI without secret + with `--confirm` (Warning) | — | 0 (authorized command continues) | Warning emitted on confirmed no-secret execution path |
| `TRANSACTION_NOT_SUPPORTED` | `activatePolicy`, `rollbackPolicy` (unsupported topology) | 500 | 1 | Transaction fails closed |

* **Missing `--confirm` Abort**: If `POLICY_GOVERNANCE_SECRET` is unset and `--confirm` is omitted, CLI argument/trust-gate validation fails closed, prints error to stderr, and exits with code 1 without invoking any governance service method (`GOVERNANCE_SECRET_NOT_CONFIGURED` warning is NOT emitted).
* **`GOVERNANCE_SECRET_NOT_CONFIGURED` Warning Semantics**: Classified strictly as a Warning (not a blocking error). Triggered only when `POLICY_GOVERNANCE_SECRET` is unset AND `--confirm` is supplied. It does not force a non-zero exit; authorized CLI command execution proceeds.
* **`ACTIVE_POLICY_NOT_FOUND` Error Contract**: Triggered strictly when `rollbackPolicy` executes and no document with `status === 'active'` exists in the registry. Fails closed with HTTP 409, CLI exit 1, aborts the transaction with zero writes and zero lifecycle events appended. Discards transaction document instances. Registry state is incompatible with rollback because no active origin policy exists.
* **`TRANSACTION_NOT_SUPPORTED` Error Contract**: Triggered during `activatePolicy` or `rollbackPolicy` when the connected MongoDB deployment lacks replica set multi-document transaction capability, whether surfaced during transaction start (`session.startTransaction()`), session-bound queries, document saves, or transaction commit (`session.commitTransaction()`). Detected strictly via `isTransactionCapabilityError(err)` checking driver classes (`MongoTransactionError`, `MongoCompatibilityError`), server code 20 (`IllegalOperation` with replica set / standalone capability messages), server code 148 (`ReadConcernMajorityNotEnabled` strictly when message demonstrates transaction preparation capability failure e.g. `prepareTransaction.*(?:is\s+)?not supported`), and deterministic capability message patterns (`"Transaction numbers are only allowed on a replica set member or mongos"`, `"Transactions are not supported by this deployment"`, `"Current topology does not support sessions"`, `"Current topology does not support transactions"`, `"Cannot start transaction on standalone"`, `"prepareTransaction ... is not supported"`). Fails closed with HTTP 500, CLI exit 1, aborts any started transaction (suppressing secondary abort errors), discards transaction document instances, and ends the session exactly once. Server code 263 (`OperationNotSupportedInTransaction`), ordinary database/validation errors, network errors, and non-transaction/ordinary code 148 errors are NOT misclassified as `TRANSACTION_NOT_SUPPORTED` and retain their original error types.

---

## 47. Operational Logging & Warning Contract

* `POLICY_REGISTRY_UNSEEDED_FALLBACK`: Emitted when no active policy exists in database.
* `POLICY_REGISTRY_QUERY_FAILURE_FALLBACK`: Emitted when database read fails.
* `GOVERNANCE_SECRET_NOT_CONFIGURED`: Emitted only on the confirmed no-secret execution path (when `POLICY_GOVERNANCE_SECRET` is unset and `--confirm` is passed).
* Zero logging of secrets, connection strings, or raw file bodies.

---

## 48. Operational Migration & Rollout Sequence

1. Deploy code, models, and index updates to production cluster.
2. Verify replica set MongoDB topology supports transactions.
3. Verify collection indexes build cleanly.
4. Run explicit operator baseline seed:
   ```bash
   node scripts/managePolicy.js seed-baseline --operatorId deployment-bootstrap --confirm
   ```
5. Confirm active `v1.0.0` policy record in database.
6. Phase 9 runtime automatically resolves `v1.0.0` as `CODE_BASELINE`.

---

## 49. Comprehensive Test Plan Matrix

| Test Suite / Area | Test File | Cases Verified |
| :--- | :--- | :--- |
| **Fingerprint Utility Source** | `tests/governance/policyGovernanceService.test.js` | Proves `generatePolicyFingerprint` is imported from `src/utils/simulationFingerprint.js` and not from `policySimulationService`. |
| **Phase 11 Validation Parity** | `tests/governance/policyGovernanceService.test.js` | 13 dimension bounds, finite numbers, ordering, baseline duplicate. |
| **Strategy B 17-Step Gate** | `tests/governance/policyGovernanceService.test.js` | Strict Step 1–17 order, `report.mode` qualification (`ARCHETYPE_POLICY_COMPARISON`, `COMBINED`), rejection of `OBSERVED_ACTION_SENSITIVITY` and `HISTORICAL_AGGREGATION`, artifact SHA-256. |
| **SemVer & Monotonicity** | `tests/governance/policyGovernanceService.test.js` | Numeric comparison, $v1.10.0 > v1.9.0$, baseline $v1.0.0$ reservation. |
| **Promotion Idempotency & Retry Reconciliation** | `tests/governance/policyGovernanceService.test.js` | (1) Same version + same fingerprint returns existing doc idempotently (`idempotent: true`, 0 writes); (2) Same version + different fingerprint throws `409 POLICY_VERSION_ALREADY_EXISTS` (0 writes); (3) Higher version + existing fingerprint returns existing doc idempotently (`idempotent: true`, 0 duplicate docs); (4) Higher version + new fingerprint creates promoted doc; (5) Lower nonexistent version rejected before persistence in Step 3. Steps 4–14 evidence verification executes before Step 15 idempotency resolution. |
| **Baseline-Seed Precondition & Identity** | `tests/governance/policyGovernanceService.test.js` | Verifies exact persisted baseline identity query contract (`{ policyVersion: 'v1.0.0', isBaseline: true }`) across all 3 mutating operations (`promotePolicy`, `activatePolicy`, `rollbackPolicy`): (1) Case 1: `policyVersion === 'v1.0.0'` AND `isBaseline === true` $\rightarrow$ valid persisted baseline satisfying prerequisite; (2) Case 2: `policyVersion !== 'v1.0.0'` AND `isBaseline === true` $\rightarrow$ MUST NOT satisfy prerequisite, throws `409 BASELINE_NOT_SEEDED`; (3) Case 3: `policyVersion === 'v1.0.0'` AND `isBaseline === false` $\rightarrow$ MUST NOT satisfy prerequisite, throws `409 BASELINE_NOT_SEEDED`; (4) Case 4: No matching `{ policyVersion: 'v1.0.0', isBaseline: true }` document in registry $\rightarrow$ throws `409 BASELINE_NOT_SEEDED`. |
| **Model Immutability & Lifecycle**| `tests/governance/policyGovernanceService.test.js` | 9 immutable fields, baseline `toPolicyVersion === 'v1.0.0'`, notes `'Initial Phase 9 deterministic code baseline'`, reasons, append-only history, multi-save same-instance. |
| **Write/Delete Bypasses** | `tests/governance/policyGovernanceService.test.js` | `updateOne`, `document.updateOne`, `deleteOne`, `deleteMany`, `findOneAndDelete`, `findByIdAndDelete` blocked via `findOneAndDelete`, `insertMany`, `bulkWrite`. |
| **CLI Command Suite** | `tests/governance/policyCli.test.js` | `promote`, `activate`, `rollback`, `seed-baseline`, `list`, `show`. Proves no `--evidenceFingerprint` flag accepted. |
| **CLI Operator Trust Boundary** | `tests/governance/policyCli.test.js` | (1) ENV secret configured + correct `--secret` $\rightarrow$ trust gate passes; (2) ENV secret configured + missing `--secret` $\rightarrow$ exit 1; (3) ENV secret configured + incorrect `--secret` $\rightarrow$ exit 1; (4) ENV secret unset + missing `--confirm` $\rightarrow$ exit 1 (`GOVERNANCE_SECRET_NOT_CONFIGURED` warning NOT emitted, governance service not invoked); (5) ENV secret unset + `--confirm` $\rightarrow$ `GOVERNANCE_SECRET_NOT_CONFIGURED` warning emitted, governance service invocation proceeds, warning itself does not force exit 1. Verified across all 6 CLI commands (`seed-baseline`, `promote`, `activate`, `rollback`, `list`, `show`). |
| **Atomic Transactions & Capability Normalization** | `tests/governance/policyIntegration.test.js` | Multi-doc transactions, single-active unique index, forward `ACTIVATED` evidence hashes, `ROLLBACK_TARGET` evidence hashes, transaction abort instance discard, clean session termination. Verifies 10 transaction-capability and negative-control error cases across BOTH `activatePolicy` and `rollbackPolicy`: (1) **Case A**: `session.startTransaction` raises recognized capability error $\rightarrow$ `500 TRANSACTION_NOT_SUPPORTED`, CLI exit 1, zero non-transactional fallback, session ended exactly once; (2) **Case B**: `startTransaction` succeeds but initial session-bound query raises capability error $\rightarrow$ `500 TRANSACTION_NOT_SUPPORTED`, abort attempted, zero writes, session ended exactly once; (3) **Case C**: mutations succeed but `commitTransaction` raises capability error $\rightarrow$ `500 TRANSACTION_NOT_SUPPORTED`, fail closed, zero successful transition reported, abort attempted, session ended exactly once; (4) **Case D**: transactional query raises unrelated database/network error $\rightarrow$ original error preserved (NOT misclassified as `TRANSACTION_NOT_SUPPORTED`), abort attempted, session ended exactly once; (5) **Case E**: `abortTransaction` throws secondary error following primary failure $\rightarrow$ secondary abort error suppressed, canonical primary error preserved, session ended exactly once; (6) **Case F**: `code === 148` / `ReadConcernMajorityNotEnabled` with verified prepareTransaction unsupported condition $\rightarrow$ `isTransactionCapabilityError(err) === true`, normalized to `500 TRANSACTION_NOT_SUPPORTED`, abort attempted, session ended exactly once; (7) **Case G1**: `code === 148` ordinary failure without capability message $\rightarrow$ `isTransactionCapabilityError(err) === false`, original error preserved, NOT converted to `TRANSACTION_NOT_SUPPORTED`; (8) **Case G2**: `code === 148` message contains generic word "transaction" but no verified capability pattern $\rightarrow$ `isTransactionCapabilityError(err) === false`, original error preserved, proves absence of accidental broad alternation; (9) **Case H**: `code === 263` / `OperationNotSupportedInTransaction` ordinary unsupported-in-transaction operation $\rightarrow$ `isTransactionCapabilityError(err) === false`, original error preserved, proves operation restrictions within transaction do not indicate deployment incapability; (10) **Case I**: Code 263 deployment capability form $\rightarrow$ NOT APPLICABLE (source audit confirms code 263 does not indicate deployment transaction incapability). |
| **Comprehensive Rollback State & History Matrix** | `tests/governance/policyIntegration.test.js` | (1) `promoted` + no activation history $\rightarrow$ `409 CANNOT_ROLLBACK_TO_UNACTIVATED_POLICY`; (2) `promoted` + fabricated `ACTIVATED` history $\rightarrow$ `409 CANNOT_ROLLBACK_TO_UNACTIVATED_POLICY`; (3) `promoted` + fabricated `ROLLBACK_TARGET` history $\rightarrow$ `409 CANNOT_ROLLBACK_TO_UNACTIVATED_POLICY`; (4) `superseded` + no activation history $\rightarrow$ `409 CANNOT_ROLLBACK_TO_UNACTIVATED_POLICY`; (5) `rolled_back` + no activation history $\rightarrow$ `409 CANNOT_ROLLBACK_TO_UNACTIVATED_POLICY`; (6) `superseded` + `ACTIVATED` history $\rightarrow$ eligible subject to SemVer direction; (7) `superseded` + `ROLLBACK_TARGET` history $\rightarrow$ eligible subject to SemVer direction; (8) `rolled_back` + `ACTIVATED` history $\rightarrow$ eligible subject to SemVer direction; (9) `rolled_back` + `ROLLBACK_TARGET` history $\rightarrow$ eligible subject to SemVer direction; (10) `active` target $\rightarrow$ `409 POLICY_ALREADY_ACTIVE`; (11) `superseded` + `ACTIVATED` history but NO active document in registry $\rightarrow$ `409 ACTIVE_POLICY_NOT_FOUND` (zero writes, aborts); (12) `rolled_back` + `ROLLBACK_TARGET` history but NO active document in registry $\rightarrow$ `409 ACTIVE_POLICY_NOT_FOUND` (zero writes, aborts). |
| **Target Already Active Behavior** | `tests/governance/policyIntegration.test.js` | Proves forward `activatePolicy` on active target returns idempotent `{ policy: targetPolicy, idempotent: true }`; backward `rollbackPolicy` on active target throws `POLICY_ALREADY_ACTIVE`. |
| **Snapshot Isolation & Fallback**| `tests/governance/policyIntegration.test.js` | Primary/local reads, unseeded fallback, query failure fallback, deep snapshot immutability test. |
| **Phase 9 Runtime Scoring & Priority Classes** | `tests/governance/policyIntegration.test.js` | 13 dimensions consumed, policy priority classes remain `Class 0`, `Class 1`, `Class 2`, threshold normalization from config, invalid urgency score (`null`/`NaN`/`Infinity`) tiering to `'normal'`. |
| **Phase 10 Provenance Stamping** | `tests/governance/policyIntegration.test.js` | Stamped from same call, zero independent lookup, paired override. |
| **Architecture Guard** | `tests/architecture_guard.test.js` | Model count = 15, sole-writer scan across `src/**` and `scripts/**`, dynamic import and relative path detection. |
| **Attribution Model & Index** | `tests/attribution/attributionIssuance.test.js` | Model count = 15, index count 5 $\rightarrow$ 6. |
| **Governance Reason Normalization & Optionality** | `tests/governance/policyGovernanceService.test.js`, `tests/governance/policyIntegration.test.js`, `tests/governance/policyCli.test.js` | Verifies deterministic reason normalization and optionality across service and CLI: (1) `activatePolicy` with explicit reason $\rightarrow$ trimmed supplied reason persisted on both `SUPERSEDED` and `ACTIVATED`; (2) `activatePolicy` with omitted/undefined reason $\rightarrow$ succeeds, persists default `'Policy activation'` on both events; (3) `rollbackPolicy` with explicit reason $\rightarrow$ trimmed supplied reason persisted on both `ROLLBACK_ORIGIN` and `ROLLBACK_TARGET`; (4) `rollbackPolicy` with omitted/undefined reason $\rightarrow$ succeeds, persists default `'Policy rollback'` on both events; (5) Empty string `''` reason $\rightarrow$ deterministic operation default; (6) Whitespace-only string reason $\rightarrow$ deterministic operation default; (7) Paired lifecycle events written within the same transaction receive the exact same `effectiveReason`; (8) CLI commands `activate` and `rollback` executed without `--reason` flag invoke governance service successfully without argument validation failures. |

---

## 50. Phase 11 Validation Boundary Test Cases

1. `baseWeights.*`: $0.0$ accepted, $100.0$ accepted, $-0.1$ rejected, $100.1$ rejected.
2. `maxMasteryDeficitWeight`: $0.0$ accepted, $50.0$ accepted, $-0.1$ rejected, $50.1$ rejected.
3. `maxGoalImpactWeight`: $0.0$ accepted, $30.0$ accepted, $-0.1$ rejected, $30.1$ rejected.
4. `maxTemporalWeight`: $0.0$ accepted, $20.0$ accepted, $-0.1$ rejected, $20.1$ rejected.
5. `priorityThresholds.*`: $0.0$ accepted, $100.0$ accepted, $-0.1$ rejected, $100.1$ rejected (finite numbers).
6. Non-finite values: `NaN` rejected, `Infinity` rejected, `'50.0'` string rejected.
7. Strict ordering: `80 > 65 > 50 > 35` accepted; `80 > 65 > 65 > 35` rejected.
8. Baseline match: candidate identical to `BASELINE_POLICY` rejected.
9. Structural: `simulationOnly: false` rejected; missing dimension rejected; unknown key rejected.

---

## 51. Scope & Implementation Boundaries

* Zero implementation code is executed during this task.
* All code examples in this document represent prescriptive implementation contracts.

---

## 52. Explicit Non-Goals

1. NO automatic promotion of simulation candidates.
2. NO online reinforcement learning or dynamic bandit policies.
3. NO online A/B testing or cohort traffic splitting.
4. NO public REST API routes for policy governance.
5. NO fake RBAC or application user role tokens.
6. NO changes to Phase 4 mastery formulas.
7. NO retroactive modifications to historical attempts or attribution records.

---

## 53. Mechanical Implementation Checklist

### 1. `src/models/orchestrationPolicyVersionModel.js` (NEW)
- [ ] Implement Mongoose schema with 13 top-level fields.
- [ ] Declare `immutable: true` on the 9 immutable fields.
- [ ] Add `pre('validate')` conditional evidence check (`isBaseline` vs promoted).
- [ ] Add `post('init')` and `post('save')` lifecycle snapshot refresh into `$locals`.
- [ ] Add `pre('save')` immutability check and append-only lifecycle validator.
- [ ] Add pre-query update hooks throwing `DIRECT_QUERY_UPDATE_PROHIBITED`.
- [ ] Add pre-delete hooks for `deleteOne`, `deleteMany`, `findOneAndDelete` throwing `UNAUTHORIZED_DELETION`.
- [ ] Add pre-bulkWrite and pre-insertMany hooks throwing `DIRECT_MODEL_WRITE_PROHIBITED`.
- [ ] Declare 3 schema custom indexes (0 field-level index/unique declarations).

### 2. `src/services/governance/policyGovernanceService.js` (NEW)
- [ ] Import `generatePolicyFingerprint` from `../../utils/simulationFingerprint`.
- [ ] Implement `seedBaseline` with idempotent handling, `notes: 'Initial Phase 9 deterministic code baseline'`, and baseline lifecycle events.
- [ ] Implement `promotePolicy` adhering to the exact 17-step pipeline (evaluating `report.mode`).
- [ ] Implement `activatePolicy` using multi-document transactions, single-active swap, idempotent return when target active, and target evidence propagation.
- [ ] Implement `rollbackPolicy` enforcing numeric direction, prior activation proof (`ACTIVATED` or `ROLLBACK_TARGET`), `409 POLICY_ALREADY_ACTIVE` if target is currently active, and target evidence propagation.
- [ ] Enforce single canonical transaction lifecycle with `try/catch/finally` ending session exactly once and discarding aborted document instances.
- [ ] Implement `resolveActivePolicySnapshot` with deep-freeze, primary/local query options, and fallback.
- [ ] Implement `listVersions` and `showPolicy`.
- [ ] Ensure all mutating methods accept `referenceNow: Date` (zero `new Date()`).

### 3. `scripts/managePolicy.js` (NEW)
- [ ] Implement command parser for `seed-baseline`, `promote`, `activate`, `rollback`, `list`, `show`.
- [ ] Ensure `promote` does NOT accept or parse `--evidenceFingerprint`.
- [ ] Implement operator secret verification with `crypto.timingSafeEqual` covering all 6 commands.
- [ ] Enforce `--confirm` when secret is unset on all 6 commands.
- [ ] Capture `new Date()` at script startup and pass as `referenceNow`.
- [ ] Import only `policyGovernanceService` (zero direct model imports).

### 4. `src/services/orchestration/orchestrationUtils.js` (MODIFIED)
- [ ] Export `DEFAULT_PRIORITY_THRESHOLDS` derived from `PRIORITY_THRESHOLDS` in `src/config/orchestrationConfig.js`.
- [ ] Export `normalizePriorityThresholds` returning frozen object.
- [ ] Update `getPriorityTier` to accept custom thresholds and return `'normal'` for non-finite/null urgency scores.

### 5. `src/services/orchestration/urgencyScoringService.js` (MODIFIED)
- [ ] Update `calculateUrgencyScore` to accept `policySnapshot`.
- [ ] Override base weights, mastery deficit, goal impact, and temporal weights from snapshot.
- [ ] Route normalized thresholds to `getPriorityTier`.

### 6. `src/services/orchestration/candidateGenerationService.js` (MODIFIED)
- [ ] Forward `policySnapshot` through candidate generation without altering policy priority classes (`Class 0`, `Class 1`, `Class 2`).

### 7. `src/services/orchestration/nextActionArbiter.js` (MODIFIED)
- [ ] Resolve or accept `policySnapshot` at entry.
- [ ] Return internal `policyProvenance`.

### 8. `src/services/orchestration/dailyAgendaAssembler.js` (MODIFIED)
- [ ] Resolve or accept `policySnapshot` once for all segments.
- [ ] Return internal `policyProvenance`.

### 9. `src/services/orchestration/interventionPolicyService.js` (MODIFIED)
- [ ] Resolve or accept `policySnapshot` at entry.
- [ ] Return internal `policyProvenance`.

### 10. `src/controllers/orchestrationController.js` (MODIFIED)
- [ ] Strip internal `policyProvenance` and delegate clean data to existing `sendSuccess` response pathway.

### 11. `src/models/prescriptionExecutionRecordModel.js` (MODIFIED)
- [ ] Add schema fields `policyVersion`, `policyFingerprint`, `policySource`.
- [ ] Add sparse index `{ policyVersion: 1, policyFingerprint: 1 }`.

### 12. `src/services/attribution/attributionIssuanceService.js` (MODIFIED)
- [ ] Extract `policyProvenance` directly from Phase 9 result wrapper.
- [ ] Stamp record without independent database lookups.
- [ ] Require paired `candidateAction` and `policyProvenance` for programmatic calls.

### 13. `tests/architecture_guard.test.js` (MODIFIED)
- [ ] Assert model count === 15.
- [ ] Add dual-scope sole-writer import check scanning `src/**` and `scripts/**`.

### 14. `tests/attribution/attributionIssuance.test.js` (MODIFIED)
- [ ] Assert model count === 15.
- [ ] Assert `PrescriptionExecutionRecord` custom index count === 6.

### 15. New Test Files (NEW)
- [ ] Create `tests/governance/policyGovernanceService.test.js`.
- [ ] Create `tests/governance/policyCli.test.js`.
- [ ] Create `tests/governance/policyIntegration.test.js`.

---

## 54. Traceability Matrix

| Frozen Architecture Contract | Proposal Section | Spec Section | Target Implementation File | Target Test File | Key Acceptance Assertion | Spec Match |
| :--- | :---: | :---: | :--- | :--- | :--- | :---: |
| **Fingerprint Utility Source** | 12 | 15 | `policyGovernanceService.js` | `policyGovernanceService.test.js` | Imported strictly from `src/utils/simulationFingerprint.js`. Zero duplicate implementation. | PASS |
| **Policy Model Schema** | 25.1 | 4, 5, 26 | `orchestrationPolicyVersionModel.js` | `policyGovernanceService.test.js` | Schema invariants, 9 immutable fields, 3 indexes. | PASS |
| **17-Step Promotion Gate** | 13.2 | 17 | `policyGovernanceService.js` | `policyGovernanceService.test.js` | Exactly Steps 1–17 execute. Steps 1–15 pass before doc instantiation. | PASS |
| **Phase 11 Validator Reuse** | 13.1, 13.2 | 11 | `policyGovernanceService.js` | `policyGovernanceService.test.js` | Step 4 calls Phase 11 `validateCandidatePolicy`. | PASS |
| **Phase 11 Report Mode Field** | 13.2 | 16, 17 | `policyGovernanceService.js` | `policyGovernanceService.test.js` | Evaluates `report.mode`; accepts Mode B/Combined; rejects Mode A/Historical standalone. | PASS |
| **SemVer Numeric Ordering** | 14 | 20 | `policyGovernanceService.js` | `policyGovernanceService.test.js` | $v1.10.0 > v1.9.0$, baseline reserved. | PASS |
| **State Machine Transitions** | 15 | 6 | `policyGovernanceService.js` | `policyGovernanceService.test.js` | Preconditions, status transitions, error codes. | PASS |
| **Rollback Target State Enforcement** | 15.2 | 6.2, 25 | `policyGovernanceService.js` | `policyIntegration.test.js` | Rejects non-deactivated targets (`promoted`) even if fabricated history present (`409 CANNOT_ROLLBACK_TO_UNACTIVATED_POLICY`). | PASS |
| **Rollback Historical Activation Proof** | 15.2 | 6.2, 25 | `policyGovernanceService.js` | `policyIntegration.test.js` | Rejects rollback targets without `ACTIVATED` or `ROLLBACK_TARGET` in history. | PASS |
| **Rollback Already Active** | 15.2 | 6.2, 25 | `policyGovernanceService.js` | `policyIntegration.test.js` | `rollbackPolicy` on active target throws `POLICY_ALREADY_ACTIVE`. Forward `activatePolicy` returns idempotent no-op. | PASS |
| **Baseline-Seed Precondition — Promote** | 13.2 | 17, 46 | `policyGovernanceService.js` | `policyGovernanceService.test.js` | `promotePolicy` on unseeded collection returns `409 BASELINE_NOT_SEEDED`. | PASS |
| **Baseline-Seed Precondition — Activate** | 17.1 | 25, 46 | `policyGovernanceService.js` | `policyGovernanceService.test.js` | `activatePolicy` on unseeded collection returns `409 BASELINE_NOT_SEEDED`. | PASS |
| **Baseline-Seed Precondition — Rollback** | 17.1 | 25, 46 | `policyGovernanceService.js` | `policyGovernanceService.test.js` | `rollbackPolicy` on unseeded collection returns `409 BASELINE_NOT_SEEDED`. | PASS |
| **Promotion Retry / SemVer Reconciliation** | 13.2, 14.2 | 17, 21 | `policyGovernanceService.js` | `policyGovernanceService.test.js` | Step 3 permits exact version match to proceed to Step 15 for deterministic idempotency vs conflict resolution. | PASS |
| **Same-Version Same-Fingerprint Idempotency** | 13.2, 14.2 | 17, 21 | `policyGovernanceService.js` | `policyGovernanceService.test.js` | Retrying same version + same fingerprint returns existing record idempotently with zero database writes. | PASS |
| **Same-Version Different-Fingerprint Conflict** | 13.2, 14.2 | 17, 21 | `policyGovernanceService.js` | `policyGovernanceService.test.js` | Submitting same version + different fingerprint throws `409 POLICY_VERSION_ALREADY_EXISTS` with zero writes. | PASS |
| **Append-Only Lifecycle** | 16.1 | 7, 8 | `orchestrationPolicyVersionModel.js` | `policyGovernanceService.test.js` | Post-init/save snapshot, rejects mutation. | PASS |
| **Activation Evidence Preservation** | 16.1 | 7, 25 | `orchestrationPolicyVersionModel.js` | `policyIntegration.test.js` | `ACTIVATED` and `ROLLBACK_TARGET` preserve target hashes. | PASS |
| **Write/Delete Protections** | 16.2 | 29, 30, 31 | `orchestrationPolicyVersionModel.js` | `policyGovernanceService.test.js` | Throws `DIRECT_QUERY_UPDATE_PROHIBITED`, `UNAUTHORIZED_DELETION`. `findByIdAndDelete` delegates to `findOneAndDelete`. | PASS |
| **Transaction Atomicity & Cleanup** | 17 | 25 | `policyGovernanceService.js` | `policyIntegration.test.js` | Multi-doc transactions, single endSession in finally, discard on abort. | PASS |
| **Sole-Writer Enforcement** | 16.3 | 32, 33 | `tests/architecture_guard.test.js` | `architecture_guard.test.js` | Scans `src/**` + `scripts/**`, detects varied relative paths, zero rogue imports. | PASS |
| **CLI Trust Boundary** | 24 | 34, 35 | `scripts/managePolicy.js` | `policyCli.test.js` | Timing-safe secret check on all 6 commands, exit codes. | PASS |
| **Removed Undefined Evidence Fingerprint CLI Flag** | 13.2, 24 | 34.2 | `scripts/managePolicy.js` | `policyCli.test.js` | v1.7.1 architecture removed undefined CLI flag; no CLI flag or service parameter exists in v1.7.1. | PASS |
| **Baseline Seeding Literals** | 18 | 22 | `policyGovernanceService.js` | `policyGovernanceService.test.js` | Notes `'Initial Phase 9 deterministic code baseline'`, reason `'Initial platform baseline seed'`. | PASS |
| **Active Policy Resolution** | 19 | 23, 24 | `policyGovernanceService.js` | `policyIntegration.test.js` | Primary/local read concern, deep-frozen snapshot, fallback. | PASS |
| **Policy Priority Classes** | 20 | 13 | `candidateGenerationService.js` | `policyIntegration.test.js` | Preserves non-tunable `Class 0`, `Class 1`, `Class 2` distinct from tiers. | PASS |
| **Threshold Normalization** | 19.3 | 39 | `orchestrationUtils.js` | `policyIntegration.test.js` | Derives from `PRIORITY_THRESHOLDS`, invalid score returns `'normal'`. | PASS |
| **Phase 9 Provenance** | 21 | 41, 42 | `nextActionArbiter.js`, etc. | `policyIntegration.test.js` | Attached internally, stripped by controller before `sendSuccess`. | PASS |
| **Phase 10 Provenance Stamping** | 22 | 43, 44 | `attributionIssuanceService.js` | `policyIntegration.test.js` | Stamped from same call, paired override. | PASS |
| **Index Expansion Delta** | 22.2, 25.1 | 26, 27, 28 | Both models | `attributionIssuance.test.js` | Delta === +4, model count === 15. | PASS |
| **Public DTO Invariance** | 21.1 | 45 | `orchestrationController.js` | `policyIntegration.test.js` | Zero provenance leakage in public API. | PASS |
| **Governance Service Idempotent Return Contract** | 15.2, 17 | 6.2, 25 | `policyGovernanceService.js` | `policyIntegration.test.js` | Returns `{ policy: targetPolicy, idempotent: true }` on idempotent forward activation. | PASS |
| **Canonical Specification Status** | 1 | 1 | `docs/PHASE12_PRESCRIPTIVE_...` | Verification Audit | Top metadata matches bottom pre-implementation gate: `VERIFIED / FROZEN FOR IMPLEMENTATION`. | PASS |
| **Full Regression Suite Verification** | 2 | 2, 49 | All test suites | All test suites | Full test command executes across repository with 100% pass rate. | PASS |
| **Architecture Implementation Authorization** | 1 | 1 | `docs/PHASE12_ARCHITECTURE_...` | Verification Audit | Architecture implementation authorization statement reconciled with verified/frozen prescriptive gate. | PASS |
| **New-Version vs Exact-Retry SemVer Semantics** | 14.2 | 20, 21 | `policyGovernanceService.js` | `policyGovernanceService.test.js` | Distinguishes monotonic new-version creation ($> \text{stored}$) from exact requestedVersion retry eligibility (Step 3 $\rightarrow$ Step 15). | PASS |
| **Specification policyVersion Table Semantics** | 14.1 | 5.1 | `orchestrationPolicyVersionModel.js` | `policyGovernanceService.test.js` | Schema table accurately specifies regex format without implying every valid invocation requires $> \text{stored}$. | PASS |
| **GOVERNANCE_SECRET_NOT_CONFIGURED Warning Classification** | 24.1 | 35, 46, 47 | `scripts/managePolicy.js` | `policyCli.test.js` | Formally classified as Warning on confirmed no-secret path; does not independently force exit 1. | PASS |
| **Missing --confirm Abort Semantics** | 24.1 | 35, 46, 49 | `scripts/managePolicy.js` | `policyCli.test.js` | Missing `--confirm` while secret unset exits with code 1 without emitting warning or calling governance service. | PASS |
| **Rollback Active-Origin Requirement** | 15.2 | 6.2, 25 | `policyGovernanceService.js` | `policyIntegration.test.js` | Rollback requires exactly one currently active origin policy before direction check or mutation. | PASS |
| **Rollback Missing-Active Fail-Closed Behavior** | 15.2, 17.1 | 6.2, 25 | `policyGovernanceService.js` | `policyIntegration.test.js` | Missing active policy document aborts rollback transaction with `409 ACTIVE_POLICY_NOT_FOUND` and 0 writes. | PASS |
| **Rollback Non-Null fromPolicyVersion** | 16.1 | 7.2, 25 | `orchestrationPolicyVersionModel.js` | `policyIntegration.test.js` | Rollback lifecycle events guarantee non-null fromPolicyVersion matching active origin policy version. | PASS |
| **ACTIVE_POLICY_NOT_FOUND Error Contract** | 15.2, 17.1 | 46, 49 | `policyGovernanceService.js` | `policyIntegration.test.js` | Formally declared 409 error code for rollback attempted without active origin policy document. | PASS |
| **Exact Persisted Baseline Identity — promotePolicy** | 13.1, 18 | 18, 49 | `policyGovernanceService.js` | `policyGovernanceService.test.js` | promotePolicy Step 1 asserts exact persisted baseline identity: policyVersion === 'v1.0.0' AND isBaseline === true. | PASS |
| **Exact Persisted Baseline Identity — activatePolicy** | 15.2, 18 | 25, 49 | `policyGovernanceService.js` | `policyIntegration.test.js` | activatePolicy asserts exact persisted baseline identity: policyVersion === 'v1.0.0' AND isBaseline === true. | PASS |
| **Exact Persisted Baseline Identity — rollbackPolicy** | 15.2, 18 | 25, 49 | `policyGovernanceService.js` | `policyIntegration.test.js` | rollbackPolicy asserts exact persisted baseline identity: policyVersion === 'v1.0.0' AND isBaseline === true. | PASS |
| **Canonical 13 Governed Dimensions** | 3.1 | 5.2, 50 | `orchestrationPolicyVersionModel.js` | `policyGovernanceService.test.js` | 13 canonical dimensions verified: 6 baseWeights, 3 max weights, 4 priorityThresholds. | PASS |
| **Canonical Six Action Types** | 3.2 | 13 | `candidateGenerationService.js` | `policyIntegration.test.js` | Preserves frozen Phase 9 taxonomy: PREREQUISITE_REMEDIATION, RETENTION_RESCUE, CURRICULUM_ADVANCEMENT, PACING_CALIBRATION, EXAM_BENCHMARK, DIAGNOSTIC_ASSESSMENT. | PASS |
| **Canonical Governance Error Set** | 17 | 46 | Both files | `policyIntegration.test.js` | Canonical Phase 12 error set preserved without invented codes; GOVERNANCE_SECRET_NOT_CONFIGURED is a non-blocking warning. | PASS |
| **Promotion Step Ordering** | 13.1 | 18 | `policyGovernanceService.js` | `policyGovernanceService.test.js` | Enforces exact 17-step pipeline: Step 1 Baseline -> Step 2 SemVer Syntax -> Step 3 Monotonicity/Retry -> Step 4 Candidate Validation -> Steps 5-15 Evidence Verification -> Step 16 Instantiation -> Step 17 Save. | PASS |
| **Promotion Non-Transactional Evidence Pipeline** | 13.1, 17.1 | 18, 24 | `policyGovernanceService.js` | `policyGovernanceService.test.js` | promotePolicy follows evidence-before-persistence pipeline with single document save; multi-document transactions reserved strictly for activate/rollback. | PASS |
| **Transaction Capability Error Detection** | 17.1 | 25 | `policyGovernanceService.js` | `policyIntegration.test.js` | isTransactionCapabilityError detects driver/server unsupported-topology error signals. | PASS |
| **Unsupported Transaction Failure During Start** | 17.1 | 25, 49 | `policyGovernanceService.js` | `policyIntegration.test.js` | Failure during session.startTransaction normalizes to 500 TRANSACTION_NOT_SUPPORTED and ends session once. | PASS |
| **Unsupported Transaction Failure During Session Operation** | 17.1 | 25, 49 | `policyGovernanceService.js` | `policyIntegration.test.js` | Failure during transactional query/save normalizes to 500 TRANSACTION_NOT_SUPPORTED, aborts, and ends session once. | PASS |
| **Unsupported Transaction Failure During Commit** | 17.1 | 25, 49 | `policyGovernanceService.js` | `policyIntegration.test.js` | Failure during session.commitTransaction normalizes to 500 TRANSACTION_NOT_SUPPORTED, aborts, and ends session once. | PASS |
| **Unrelated Database Error Non-Misclassification** | 17.1 | 25, 49 | `policyGovernanceService.js` | `policyIntegration.test.js` | Unrelated database/network errors preserve their original error types and are not misclassified as capability errors. | PASS |
| **Abort Secondary-Error Suppression** | 17.1 | 25, 49 | `policyGovernanceService.js` | `policyIntegration.test.js` | Secondary errors during abortTransaction are suppressed; original primary failure is preserved. | PASS |
| **Session End Exactly Once** | 17.1 | 25, 49 | `policyGovernanceService.js` | `policyIntegration.test.js` | session.endSession() is executed exactly once in finally block across all success and error paths. | PASS |
| **Promotion Step 10 Structural Shape Contract** | 13.1 | 18, 49 | `policyGovernanceService.js` | `policyGovernanceService.test.js` | Step 10 validates structural report shape (fingerprints, baselinePolicy, candidatePolicies, mode sections) without nonexistent metric/regression fields. | PASS |
| **MongoDB Error-Code Source Accuracy** | 17.1 | 25, 46 | Server Audit | `policyIntegration.test.js` | MongoDB server error codes audited against installed driver/server contract: code 20 is IllegalOperation, code 148 is ReadConcernMajorityNotEnabled, code 263 is OperationNotSupportedInTransaction. | PASS |
| **Code 148 Correct Identity** | 17.1 | 25, 46 | Server Audit | `policyIntegration.test.js` | Code 148 correctly identified as ReadConcernMajorityNotEnabled (zero references to ActionNotSupportedOnSession). | PASS |
| **Code 148 Strict Capability Message Gating** | 17.1 | 25, 49 | `policyGovernanceService.js` | `policyIntegration.test.js` | Case F: Code 148 strictly gated with `/prepareTransaction.*(?:is\s+)?not supported/i`, recognized by isTransactionCapabilityError and normalized to 500 TRANSACTION_NOT_SUPPORTED. | PASS |
| **Code 148 Generic-Transaction Negative Control** | 17.1 | 25, 49 | `policyGovernanceService.js` | `policyIntegration.test.js` | Case G1 & G2: Code 148 without capability pattern or with generic word "transaction" is NOT converted to TRANSACTION_NOT_SUPPORTED; original error preserved. | PASS |
| **Code 20 Strict Capability Message Gating** | 17.1 | 25, 49 | `policyGovernanceService.js` | `policyIntegration.test.js` | Code 20 strictly gated with replica set / standalone messages; generic "|transaction" alternation removed. | PASS |
| **Code 263 Semantic Classification** | 17.1 | 25, 49 | `policyGovernanceService.js` | `policyIntegration.test.js` | Code 263 OperationNotSupportedInTransaction source-verified as operation-level restriction within transaction rather than deployment-level transaction incapability. | PASS |
| **Code 263 Non-Capability Negative Control** | 17.1 | 25, 49 | `policyGovernanceService.js` | `policyIntegration.test.js` | Case H: Code 263 returns isTransactionCapabilityError === false and preserves original MongoDB error; Case I documented as NOT APPLICABLE. | PASS |
| **Report-vs-Helper Transaction Signal Equivalence** | 17.1 | 25 | Architecture / Spec | `policyIntegration.test.js` | Report audit, architecture proposal, and specification helper recognize the exact same transaction-capability signals. | PASS |
| **TRANSACTION_NOT_SUPPORTED Semantic Accuracy** | 17.1 | 46 | Both files | `policyIntegration.test.js` | TRANSACTION_NOT_SUPPORTED strictly reserved for missing deployment transaction capability; never misapplied to ordinary database errors, validation errors, or operation-level transaction restrictions. | PASS |
| **Exact 22-File Inventory** | 1 | 53 | Full Project | Architecture Guard | Exact frozen 22-file implementation inventory preserved: 3 new production/script files + 9 modified production files + 7 modified existing test files + 3 new test files = 22 files. | PASS |
| **Legacy Cross-Phase Topology Reconciliation** | 1 | 53 | 5 Legacy Tests | npm test | Reconciles 5 historical regression/isolation tests to canonical 15-model platform topology without weakening phase isolation. | PASS |
| **No Migration Script** | 1 | 53 | Full Project | Architecture Guard | Verified absence of migration script in Phase 12 inventory; zero extra files beyond the frozen 22. | PASS |
| **Optional CLI Reason Contract** | 24 | 34, 36 | `scripts/managePolicy.js` | `policyCli.test.js` | --reason flag remains OPTIONAL for both activate and rollback CLI commands; omitting it does not fail argument parsing. | PASS |
| **Required Lifecycle Reason Preservation** | 16.1 | 7.1 | `orchestrationPolicyVersionModel.js` | `policyGovernanceService.test.js` | LifecycleEventSchema reason field preserved strictly as required: true, trim: true; schema integrity is not weakened. | PASS |
| **Activation Default Reason** | 17.1 | 25, 36 | `policyGovernanceService.js` | `policyIntegration.test.js` | Omitted, empty, or whitespace-only reason on forward activation deterministically normalizes to 'Policy activation'. | PASS |
| **Rollback Default Reason** | 17.1 | 25, 36 | `policyGovernanceService.js` | `policyIntegration.test.js` | Omitted, empty, or whitespace-only reason on rollback deterministically normalizes to 'Policy rollback'. | PASS |
| **Explicit Reason Trimming** | 17.1 | 25, 36 | `policyGovernanceService.js` | `policyIntegration.test.js` | Non-empty operator reason is trimmed of leading/trailing whitespace and preserved as supplied. | PASS |
| **Paired Lifecycle Effective Reason Consistency** | 17.1 | 25, 36 | `policyGovernanceService.js` | `policyIntegration.test.js` | Both lifecycle events in the same transaction (SUPERSEDED/ACTIVATED or ROLLBACK_ORIGIN/ROLLBACK_TARGET) receive the exact same effectiveReason. | PASS |
| **Programmatic Omitted-Reason Compatibility** | 17.1 | 25, 36 | `policyGovernanceService.js` | `policyGovernanceService.test.js` | Programmatic service calls activatePolicy and rollbackPolicy omitting reason succeed and apply deterministic normalization without validation error. | PASS |
| **22-File Inventory Preserved** | 1 | 53 | Full Project | Architecture Guard | Exact frozen 22-file implementation inventory preserved: 3 new + 9 modified production + 7 modified test + 3 new test = 22 files. | PASS |

---

## 55. Pre-Implementation Acceptance Gate

```text
================================================================================
PHASE 12 PPVG PRESCRIPTIVE SPECIFICATION — VERIFIED / FROZEN FOR IMPLEMENTATION
ARCHITECTURE VERSION — 1.7.10-FROZEN-FOR-SPECIFICATION
================================================================================

Architecture-vs-Specification Contract Contradictions: 0
Unspecified Implementation-Critical Behaviors: 0
Open Questions: NONE
```
