'use strict';

/**
 * Policy Governance Service — Phase 12: Prescriptive Policy Versioning & Governance (PPVG)
 *
 * Serves as the sole authoritative writer and persistence owner for OrchestrationPolicyVersion.
 * Implements baseline seeding, Strategy B offline evidence promotion pipeline (17 steps),
 * atomic activation/rollback multi-document transactions, capability classifier,
 * reason normalization, and deep-frozen runtime snapshot resolution.
 */

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const mongoose = require('mongoose');

const OrchestrationPolicyVersion = require('../../models/orchestrationPolicyVersionModel');
const { generatePolicyFingerprint } = require('../../utils/simulationFingerprint');
const { validateCandidatePolicy } = require('../simulation/policyValidationService');
const { BASELINE_POLICY } = require('../../config/simulationConfig');
const AppError = require('../../utils/AppError');

// ── SemVer Helper Functions ───────────────────────────────────────────────
const parseSemVer = (versionStr) => {
  const match = /^v(\d+)\.(\d+)\.(\d+)$/.exec(versionStr);
  if (!match) return null;
  return [parseInt(match[1], 10), parseInt(match[2], 10), parseInt(match[3], 10)];
};

const isSemVerHigher = (vA, vB) => {
  const a = parseSemVer(vA);
  const b = parseSemVer(vB);
  if (!a || !b) return false;
  if (a[0] !== b[0]) return a[0] > b[0];
  if (a[1] !== b[1]) return a[1] > b[1];
  return a[2] > b[2];
};

const isSemVerLower = (vA, vB) => {
  return isSemVerHigher(vB, vA);
};

// ── Canonical Policy Definition Comparison Helper ─────────────────────────
const CANONICAL_ACTION_TYPES = [
  'PREREQUISITE_REMEDIATION',
  'OVERDUE_REVISION',
  'DUE_TODAY_REVISION',
  'CURRICULUM_ADVANCEMENT',
  'EXAM_BENCHMARK',
  'PACING_CALIBRATION',
];

const CANONICAL_PRIORITY_TIERS = ['critical', 'urgent', 'high', 'normal'];

const deepEqualCanonicalPolicy = (a, b) => {
  if (!a || !b || typeof a !== 'object' || typeof b !== 'object') return false;
  if (!a.baseWeights || !b.baseWeights || typeof a.baseWeights !== 'object' || typeof b.baseWeights !== 'object') {
    return false;
  }
  for (const at of CANONICAL_ACTION_TYPES) {
    if (a.baseWeights[at] !== b.baseWeights[at]) return false;
  }
  if (a.maxMasteryDeficitWeight !== b.maxMasteryDeficitWeight) return false;
  if (a.maxGoalImpactWeight !== b.maxGoalImpactWeight) return false;
  if (a.maxTemporalWeight !== b.maxTemporalWeight) return false;

  if (
    !a.priorityThresholds ||
    !b.priorityThresholds ||
    typeof a.priorityThresholds !== 'object' ||
    typeof b.priorityThresholds !== 'object'
  ) {
    return false;
  }
  for (const tier of CANONICAL_PRIORITY_TIERS) {
    if (a.priorityThresholds[tier] !== b.priorityThresholds[tier]) return false;
  }

  return true;
};

// ── Deep Freeze Helper ────────────────────────────────────────────────────
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

// ── Fallback Snapshot Builder ─────────────────────────────────────────────
const buildFallbackSnapshot = (source = 'CODE_BASELINE_FALLBACK') => {
  const clonedDefinition = JSON.parse(JSON.stringify(BASELINE_POLICY));
  return deepFreeze({
    policyVersion: 'v1.0.0',
    policyFingerprint: generatePolicyFingerprint(BASELINE_POLICY),
    policyDefinition: clonedDefinition,
    source,
  });
};

// ── Deterministic Reason Normalization Helper ─────────────────────────────
const normalizeGovernanceReason = ({ reason, isRollback }) => {
  if (typeof reason === 'string' && reason.trim().length > 0) {
    return reason.trim();
  }

  return isRollback
    ? 'Policy rollback'
    : 'Policy activation';
};

// ── Transaction Capability Classifier ─────────────────────────────────────
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

  // 2. MongoDB Server code 20 (IllegalOperation)
  if (err.code === 20 || err.codeName === 'IllegalOperation') {
    if (
      /Transaction numbers are only allowed on a replica set member or mongos/i.test(msg) ||
      /Cannot start transaction on standalone/i.test(msg)
    ) {
      return true;
    }
  }

  // 3. MongoDB Server code 148 (ReadConcernMajorityNotEnabled)
  if (err.code === 148 || err.codeName === 'ReadConcernMajorityNotEnabled') {
    if (/prepareTransaction.*(?:is\s+)?not supported/i.test(msg)) {
      return true;
    }
  }

  // 4. Note on MongoDB Server code 263 (OperationNotSupportedInTransaction):
  // Indicates command/operation restrictions inside an existing transaction, NOT deployment incapability.
  // Preserved as original error; returns false.

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

// ── Baseline Seeding ──────────────────────────────────────────────────────
const seedBaseline = async ({ operatorId = 'system', referenceNow }) => {
  const existingBaseline = await OrchestrationPolicyVersion.findOne({
    policyVersion: 'v1.0.0',
  });

  if (existingBaseline) {
    return {
      policy: existingBaseline,
      idempotent: true,
    };
  }

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
      },
    ],
  });

  await baselineDoc.save();

  return {
    policy: baselineDoc,
    idempotent: false,
  };
};

// ── Strategy B Promotion Pipeline (17 Steps) ──────────────────────────────
const promotePolicy = async ({
  candidatePolicyDefinition,
  policyVersion,
  evidenceReportPath,
  operatorId,
  notes = '',
  referenceNow,
}) => {
  // Step 1: Validate Baseline Seeded
  const baseline = await OrchestrationPolicyVersion.findOne({
    policyVersion: 'v1.0.0',
    isBaseline: true,
  });
  if (!baseline) {
    throw new AppError(
      409,
      'BASELINE_NOT_SEEDED',
      'BASELINE_NOT_SEEDED: Baseline policy (v1.0.0) must be seeded before promotion.'
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
        `POLICY_VERSION_ALREADY_EXISTS: Version ${policyVersion} is not higher than existing ${highestStoredVersion}.`
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
    throw new AppError(
      400,
      'INSUFFICIENT_EVIDENCE_MODE',
      `INSUFFICIENT_EVIDENCE_MODE: Simulation mode "${report.mode}" is insufficient for promotion. Requires ARCHETYPE_POLICY_COMPARISON or COMBINED.`
    );
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
    if (
      !report.syntheticArchetypeAnalysis ||
      !Array.isArray(report.syntheticArchetypeAnalysis.archetypes) ||
      report.syntheticArchetypeAnalysis.archetypes.length === 0
    ) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Mode B report missing syntheticArchetypeAnalysis.archetypes array.');
    }
  }
  if (report.mode === 'COMBINED') {
    if (
      !report.syntheticArchetypeAnalysis ||
      !Array.isArray(report.syntheticArchetypeAnalysis.archetypes) ||
      report.syntheticArchetypeAnalysis.archetypes.length === 0 ||
      !report.historicalSensitivityAnalysis
    ) {
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
    policyFingerprint: candidateFingerprint,
  });

  const existingVersionDoc = await OrchestrationPolicyVersion.findOne({
    policyVersion,
  });

  if (existingVersionDoc) {
    if (existingVersionDoc.policyFingerprint === candidateFingerprint) {
      return {
        policy: existingVersionDoc,
        idempotent: true,
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
      idempotent: true,
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
        evidenceArtifactSha256,
      },
    ],
  });

  // Step 17: Save Promoted Document
  await newPolicy.save();
  return { policy: newPolicy, idempotent: false };
};

// ── Atomic Multi-Document Transaction Core ────────────────────────────────
const activatePolicyTransaction = async ({
  targetVersion,
  operatorId,
  reason,
  referenceNow,
  isRollback = false,
}) => {
  const effectiveReason = normalizeGovernanceReason({ reason, isRollback });
  const session = await mongoose.startSession();
  let transactionStarted = false;

  try {
    try {
      session.startTransaction({
        readConcern: { level: 'majority' },
        writeConcern: { w: 'majority' },
      });
      transactionStarted = true;

      // 1. Baseline existence check (Precondition for all mutating operations)
      const baseline = await OrchestrationPolicyVersion.findOne({
        policyVersion: 'v1.0.0',
        isBaseline: true,
      }).session(session);

      if (!baseline) {
        throw new AppError(
          409,
          'BASELINE_NOT_SEEDED',
          'BASELINE_NOT_SEEDED: Baseline policy (v1.0.0) must be seeded before governance mutation.'
        );
      }

      // 2. Locate target policy
      const targetPolicy = await OrchestrationPolicyVersion.findOne({ policyVersion: targetVersion }).session(session);
      if (!targetPolicy) throw new AppError(404, 'POLICY_VERSION_NOT_FOUND', `POLICY_VERSION_NOT_FOUND: Version ${targetVersion} not found.`);

      // 3. Target Already Active Check
      if (targetPolicy.status === 'active') {
        if (isRollback) {
          throw new AppError(
            409,
            'POLICY_ALREADY_ACTIVE',
            `POLICY_ALREADY_ACTIVE: Policy ${targetVersion} is already active.`
          );
        }

        await session.abortTransaction();
        transactionStarted = false;

        return {
          policy: targetPolicy,
          idempotent: true,
        };
      }

      // 4. Operation-specific target-state validation
      if (!isRollback && targetPolicy.status !== 'promoted') {
        throw new AppError(
          409,
          'INVALID_STATE_TRANSITION',
          'INVALID_STATE_TRANSITION: Cannot activate deactivated policy; use rollbackPolicy.'
        );
      }

      if (
        isRollback &&
        !['superseded', 'rolled_back'].includes(targetPolicy.status)
      ) {
        throw new AppError(
          409,
          'CANNOT_ROLLBACK_TO_UNACTIVATED_POLICY',
          'CANNOT_ROLLBACK_TO_UNACTIVATED_POLICY: Rollback target must be a previously deactivated policy.'
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
          'CANNOT_ROLLBACK_TO_UNACTIVATED_POLICY: Rollback target has no prior activation evidence.'
        );
      }

      // 6. Locate currently active policy & evaluate rollback direction
      const currentActive = await OrchestrationPolicyVersion.findOne({ status: 'active' }).session(session);

      if (isRollback && !currentActive) {
        throw new AppError(
          409,
          'ACTIVE_POLICY_NOT_FOUND',
          'ACTIVE_POLICY_NOT_FOUND: Rollback requires a currently active origin policy.'
        );
      }

      if (isRollback) {
        if (!isSemVerLower(targetPolicy.policyVersion, currentActive.policyVersion)) {
          throw new AppError(409, 'INVALID_ROLLBACK_DIRECTION', 'INVALID_ROLLBACK_DIRECTION: Rollback target version must be lower than active version.');
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
          evidenceArtifactSha256: null,
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
          'TRANSACTION_NOT_SUPPORTED: Database deployment does not support required MongoDB transactions.'
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

const activatePolicy = async ({
  targetVersion,
  operatorId,
  reason,
  referenceNow,
}) => {
  return activatePolicyTransaction({
    targetVersion,
    operatorId,
    reason,
    referenceNow,
    isRollback: false,
  });
};

const rollbackPolicy = async ({
  targetVersion,
  operatorId,
  reason,
  referenceNow,
}) => {
  return activatePolicyTransaction({
    targetVersion,
    operatorId,
    reason,
    referenceNow,
    isRollback: true,
  });
};

// ── Active Policy Snapshot Resolution ─────────────────────────────────────
const resolveActivePolicySnapshot = async (referenceNow = new Date()) => {
  try {
    const activeDoc = await OrchestrationPolicyVersion.findOne({ status: 'active' })
      .read('primary')
      .readConcern('local')
      .lean();

    if (!activeDoc) {
      console.warn(
        JSON.stringify({
          event: 'POLICY_REGISTRY_UNSEEDED_FALLBACK',
          timestamp: referenceNow.toISOString(),
          message: 'No active policy version found in database. Falling back to CODE_BASELINE_FALLBACK.',
        })
      );
      return buildFallbackSnapshot('CODE_BASELINE_FALLBACK');
    }

    const clonedDefinition = JSON.parse(JSON.stringify(activeDoc.policyDefinition));

    return deepFreeze({
      policyVersion: activeDoc.policyVersion,
      policyFingerprint: activeDoc.policyFingerprint,
      policyDefinition: clonedDefinition,
      source: activeDoc.isBaseline ? 'CODE_BASELINE' : 'GOVERNED_POLICY',
    });
  } catch (err) {
    console.warn(
      JSON.stringify({
        event: 'POLICY_REGISTRY_QUERY_FAILURE_FALLBACK',
        timestamp: referenceNow.toISOString(),
        errorCode: err.code || 'DB_ERROR',
        message: 'Active policy lookup failed. Falling back to CODE_BASELINE_FALLBACK.',
      })
    );
    return buildFallbackSnapshot('CODE_BASELINE_FALLBACK');
  }
};

// ── List & Show Registry Inquiries ────────────────────────────────────────
const listVersions = async ({ limit, status } = {}) => {
  const query = {};
  if (status) {
    query.status = status;
  }

  let cursor = OrchestrationPolicyVersion.find(query).sort({ createdAt: -1 }).lean();
  if (limit && Number(limit) > 0) {
    cursor = cursor.limit(Number(limit));
  }

  return cursor;
};

const showPolicy = async ({ policyVersion }) => {
  if (!policyVersion) {
    throw new AppError(400, 'VALIDATION_ERROR', 'policyVersion is required.');
  }

  const doc = await OrchestrationPolicyVersion.findOne({ policyVersion }).lean();
  if (!doc) {
    throw new AppError(404, 'POLICY_VERSION_NOT_FOUND', `POLICY_VERSION_NOT_FOUND: Policy version "${policyVersion}" not found.`);
  }

  return doc;
};

module.exports = {
  seedBaseline,
  promotePolicy,
  activatePolicy,
  rollbackPolicy,
  resolveActivePolicySnapshot,
  listVersions,
  showPolicy,
  normalizeGovernanceReason,
  isTransactionCapabilityError,
  parseSemVer,
  isSemVerHigher,
  isSemVerLower,
};
