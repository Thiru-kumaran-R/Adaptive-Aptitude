'use strict';

/**
 * Policy Governance Service Test Suite — Phase 12: PPVG
 *
 * Verifies:
 *   - OrchestrationPolicyVersion schema invariants, 9 immutable fields, and 3 custom indexes
 *   - $locals append-only lifecycle snapshot and multi-save support
 *   - Query mutation, document update, deletion, and bulk write bypass protections
 *   - Baseline seeding, exact baseline identity precondition
 *   - SemVer numeric progression and monotonicity
 *   - 17-step Strategy B promotion gate and idempotency matrix
 *   - Deterministic reason normalization and optionality
 *   - listVersions and showPolicy inquiries
 */

const fs = require('node:fs');
const path = require('node:path');
const mongoose = require('mongoose');

const { connectTestDB, disconnectTestDB } = require('../helpers/dbSetup');
const OrchestrationPolicyVersion = require('../../src/models/orchestrationPolicyVersionModel');
const policyGovernanceService = require('../../src/services/governance/policyGovernanceService');
const { generatePolicyFingerprint } = require('../../src/utils/simulationFingerprint');
const { BASELINE_POLICY } = require('../../src/config/simulationConfig');

describe('Policy Governance Service Suite', () => {
  const referenceNow = new Date('2026-10-10T12:00:00.000Z');
  let testEvidencePath;

  beforeAll(async () => {
    await connectTestDB();

    // Prepare a temporary valid Strategy B evidence artifact
    const candidateDef = JSON.parse(JSON.stringify(BASELINE_POLICY));
    candidateDef.simulationOnly = true;
    candidateDef.baseWeights.PREREQUISITE_REMEDIATION = 35.0; // modified
    const candidateFingerprint = generatePolicyFingerprint(candidateDef);

    const validReport = {
      engineVersion: 'v1',
      mode: 'ARCHETYPE_POLICY_COMPARISON',
      referenceNow: referenceNow.toISOString(),
      simulationFingerprint: 'a'.repeat(64),
      datasetFingerprint: 'b'.repeat(64),
      baselinePolicy: BASELINE_POLICY,
      candidatePolicies: [
        {
          policyFingerprint: candidateFingerprint,
          policyDefinition: candidateDef,
        },
      ],
      datasetSummary: {},
      historicalSensitivityAnalysis: null,
      syntheticArchetypeAnalysis: {
        archetypes: [{ archetypeId: 'archetype_1', metrics: {} }],
      },
      adherenceOutcomeSummary: {},
      bounds: {},
      trace: {},
      warnings: [],
      nonCausalNotice: 'Notice',
    };

    testEvidencePath = path.join(__dirname, 'test_evidence_report.json');
    fs.writeFileSync(testEvidencePath, JSON.stringify(validReport, null, 2), 'utf8');
  });

  afterAll(async () => {
    if (fs.existsSync(testEvidencePath)) {
      fs.unlinkSync(testEvidencePath);
    }
    await disconnectTestDB();
  });

  beforeEach(async () => {
    await mongoose.connection.collection('orchestrationpolicyversions').deleteMany({});
  });

  // ── 1. Fingerprint Utility Source Verification ───────────────────────────
  describe('1. Fingerprint Utility Source', () => {
    it('proves generatePolicyFingerprint is imported from simulationFingerprint.js', () => {
      const util = require('../../src/utils/simulationFingerprint');
      expect(typeof util.generatePolicyFingerprint).toBe('function');
      const fp = util.generatePolicyFingerprint(BASELINE_POLICY);
      expect(fp).toMatch(/^[a-f0-9]{64}$/);
    });
  });

  // ── 2. Model Invariants, Immutability & Indexes ───────────────────────────
  describe('2. Model Schema Invariants & 9 Immutable Fields', () => {
    it('verifies exactly 3 custom indexes on OrchestrationPolicyVersion', () => {
      const indexes = OrchestrationPolicyVersion.schema.indexes();
      expect(indexes).toHaveLength(3);

      const [idx1, idx2, idx3] = indexes;
      expect(idx1[0]).toEqual({ policyVersion: 1 });
      expect(idx1[1].unique).toBe(true);

      expect(idx2[0]).toEqual({ policyFingerprint: 1 });
      expect(idx2[1].unique).toBe(true);

      expect(idx3[0]).toEqual({ status: 1 });
      expect(idx3[1].unique).toBe(true);
      expect(idx3[1].partialFilterExpression).toEqual({ status: 'active' });
    });

    it('prevents modifying any of the 9 immutable fields on existing document', async () => {
      await policyGovernanceService.seedBaseline({ referenceNow });
      const candidateDef = JSON.parse(JSON.stringify(BASELINE_POLICY));
      candidateDef.simulationOnly = true;
      candidateDef.baseWeights.PREREQUISITE_REMEDIATION = 35.0;

      const promoted = await policyGovernanceService.promotePolicy({
        candidatePolicyDefinition: candidateDef,
        policyVersion: 'v1.1.0',
        evidenceReportPath: testEvidencePath,
        operatorId: 'test_op',
        referenceNow,
        notes: 'Initial promotion test notes',
      });

      const docId = promoted.policy._id;

      // 1. policyVersion
      const d1 = await OrchestrationPolicyVersion.findById(docId);
      d1.policyVersion = 'v1.1.1';
      await expect(d1.save()).rejects.toThrow(/IMMUTABLE_FIELD_MUTATION/);

      // 2. policyFingerprint
      const d2 = await OrchestrationPolicyVersion.findById(docId);
      d2.policyFingerprint = 'c'.repeat(64);
      await expect(d2.save()).rejects.toThrow(/IMMUTABLE_FIELD_MUTATION/);

      // 3. policyDefinition
      const d3 = await OrchestrationPolicyVersion.findById(docId);
      d3.policyDefinition = BASELINE_POLICY;
      await expect(d3.save()).rejects.toThrow(/IMMUTABLE_FIELD_MUTATION/);

      // 4. promotedBy
      const d4 = await OrchestrationPolicyVersion.findById(docId);
      d4.promotedBy = 'attacker_op';
      await expect(d4.save()).rejects.toThrow(/IMMUTABLE_FIELD_MUTATION/);

      // 5. promotedAt
      const d5 = await OrchestrationPolicyVersion.findById(docId);
      d5.promotedAt = new Date('2026-01-01T00:00:00.000Z');
      await expect(d5.save()).rejects.toThrow(/IMMUTABLE_FIELD_MUTATION/);

      // 6. evidenceSimulationFingerprint
      const d6 = await OrchestrationPolicyVersion.findById(docId);
      d6.evidenceSimulationFingerprint = 'd'.repeat(64);
      await expect(d6.save()).rejects.toThrow(/IMMUTABLE_FIELD_MUTATION/);

      // 7. evidenceArtifactSha256
      const d7 = await OrchestrationPolicyVersion.findById(docId);
      d7.evidenceArtifactSha256 = 'e'.repeat(64);
      await expect(d7.save()).rejects.toThrow(/IMMUTABLE_FIELD_MUTATION/);

      // 8. isBaseline
      const d8 = await OrchestrationPolicyVersion.findById(docId);
      d8.isBaseline = true;
      await expect(d8.save()).rejects.toThrow(/IMMUTABLE_FIELD_MUTATION/);

      // 9. notes
      const d9 = await OrchestrationPolicyVersion.findById(docId);
      d9.notes = 'Tampered notes';
      await expect(d9.save()).rejects.toThrow(/IMMUTABLE_FIELD_MUTATION/);

      // Legitimate governance mutation (status, lifecycleEvents) succeeds
      const cleanDoc = await OrchestrationPolicyVersion.findById(docId);
      cleanDoc.status = 'superseded';
      cleanDoc.lifecycleEvents.push({
        eventType: 'SUPERSEDED',
        eventAt: referenceNow,
        operatorId: 'test_op',
        reason: 'Superseded',
        fromPolicyVersion: 'v1.1.0',
        toPolicyVersion: 'v1.2.0',
      });
      const savedDoc = await cleanDoc.save();
      expect(savedDoc.status).toBe('superseded');
      expect(savedDoc.lifecycleEvents).toHaveLength(2);
    });

    it('enforces append-only lifecycleEvents and permits multi-save on same instance', async () => {
      const seeded = await policyGovernanceService.seedBaseline({ referenceNow });
      const doc = await OrchestrationPolicyVersion.findById(seeded.policy._id);

      // Modifying historical event throws LIFECYCLE_MUTATION_PROHIBITED
      doc.lifecycleEvents[0].reason = 'Tampered reason';
      await expect(doc.save()).rejects.toThrow(/LIFECYCLE_MUTATION_PROHIBITED/);

      // Truncating events throws LIFECYCLE_MUTATION_PROHIBITED
      const cleanDoc = await OrchestrationPolicyVersion.findById(seeded.policy._id);
      cleanDoc.lifecycleEvents = [];
      await expect(cleanDoc.save()).rejects.toThrow(/LIFECYCLE_MUTATION_PROHIBITED/);

      // Reordering historical events throws LIFECYCLE_MUTATION_PROHIBITED
      const reorderDoc = await OrchestrationPolicyVersion.findById(seeded.policy._id);
      if (reorderDoc.lifecycleEvents.length >= 2) {
        const temp = reorderDoc.lifecycleEvents[0];
        reorderDoc.lifecycleEvents[0] = reorderDoc.lifecycleEvents[1];
        reorderDoc.lifecycleEvents[1] = temp;
        await expect(reorderDoc.save()).rejects.toThrow(/LIFECYCLE_MUTATION_PROHIBITED/);
      }

      // Multi-save same instance with appended event succeeds
      const multiSaveDoc = await OrchestrationPolicyVersion.findById(seeded.policy._id);
      multiSaveDoc.lifecycleEvents.push({
        eventType: 'SUPERSEDED',
        eventAt: referenceNow,
        operatorId: 'operator_1',
        reason: 'Superseded test',
      });
      await multiSaveDoc.save();

      // Second save on same instance with another append
      multiSaveDoc.lifecycleEvents.push({
        eventType: 'ROLLBACK_TARGET',
        eventAt: referenceNow,
        operatorId: 'operator_1',
        reason: 'Rollback test',
      });
      await multiSaveDoc.save();
      expect(multiSaveDoc.lifecycleEvents).toHaveLength(4);
    });
  });

  // ── 3. Write and Delete Bypass Protections ────────────────────────────────
  describe('3. Write/Delete Bypass Protections', () => {
    it('blocks all five query update operations and document update with DIRECT_QUERY_UPDATE_PROHIBITED', async () => {
      const seeded = await policyGovernanceService.seedBaseline({ referenceNow });
      const doc = await OrchestrationPolicyVersion.findById(seeded.policy._id);

      // 1. Model.updateOne
      await expect(
        OrchestrationPolicyVersion.updateOne({ policyVersion: 'v1.0.0' }, { $set: { status: 'superseded' } })
      ).rejects.toThrow(/DIRECT_QUERY_UPDATE_PROHIBITED/);

      // 2. hydratedDocument.updateOne
      await expect(
        doc.updateOne({ $set: { status: 'superseded' } })
      ).rejects.toThrow(/DIRECT_QUERY_UPDATE_PROHIBITED/);

      // 3. Model.updateMany
      await expect(
        OrchestrationPolicyVersion.updateMany({}, { $set: { status: 'superseded' } })
      ).rejects.toThrow(/DIRECT_QUERY_UPDATE_PROHIBITED/);

      // 4. Model.findOneAndUpdate
      await expect(
        OrchestrationPolicyVersion.findOneAndUpdate({ policyVersion: 'v1.0.0' }, { $set: { status: 'superseded' } })
      ).rejects.toThrow(/DIRECT_QUERY_UPDATE_PROHIBITED/);

      // 5. Model.replaceOne
      await expect(
        OrchestrationPolicyVersion.replaceOne({ policyVersion: 'v1.0.0' }, { policyVersion: 'v1.0.0', status: 'superseded' })
      ).rejects.toThrow(/DIRECT_QUERY_UPDATE_PROHIBITED/);

      // 6. Model.findOneAndReplace
      await expect(
        OrchestrationPolicyVersion.findOneAndReplace({ policyVersion: 'v1.0.0' }, { policyVersion: 'v1.0.0', status: 'superseded' })
      ).rejects.toThrow(/DIRECT_QUERY_UPDATE_PROHIBITED/);
    });

    it('blocks deletions with UNAUTHORIZED_DELETION (document and query, including findByIdAndDelete)', async () => {
      const seeded = await policyGovernanceService.seedBaseline({ referenceNow });
      const doc = await OrchestrationPolicyVersion.findById(seeded.policy._id);

      // 1. document.deleteOne
      await expect(
        doc.deleteOne()
      ).rejects.toThrow(/UNAUTHORIZED_DELETION/);

      // 2. Model.deleteOne
      await expect(
        OrchestrationPolicyVersion.deleteOne({ policyVersion: 'v1.0.0' })
      ).rejects.toThrow(/UNAUTHORIZED_DELETION/);

      // 3. Model.deleteMany
      await expect(
        OrchestrationPolicyVersion.deleteMany({})
      ).rejects.toThrow(/UNAUTHORIZED_DELETION/);

      // 4. Model.findOneAndDelete
      await expect(
        OrchestrationPolicyVersion.findOneAndDelete({ policyVersion: 'v1.0.0' })
      ).rejects.toThrow(/UNAUTHORIZED_DELETION/);

      // 5. Model.findByIdAndDelete
      const fakeId = new mongoose.Types.ObjectId();
      await expect(
        OrchestrationPolicyVersion.findByIdAndDelete(fakeId)
      ).rejects.toThrow(/UNAUTHORIZED_DELETION/);
    });

    it('blocks bulk writes with DIRECT_MODEL_WRITE_PROHIBITED', async () => {
      await expect(
        OrchestrationPolicyVersion.insertMany([])
      ).rejects.toThrow(/DIRECT_MODEL_WRITE_PROHIBITED/);

      await expect(
        OrchestrationPolicyVersion.bulkWrite([])
      ).rejects.toThrow(/DIRECT_MODEL_WRITE_PROHIBITED/);
    });
  });

  // ── 4. Baseline Seeding & Identity ────────────────────────────────────────
  describe('4. Baseline Seeding & Exact Identity Invariant', () => {
    it('seeds baseline v1.0.0 idempotently with active status and baseline events', async () => {
      const first = await policyGovernanceService.seedBaseline({ operatorId: 'test_op', referenceNow });
      expect(first.idempotent).toBe(false);
      expect(first.policy.policyVersion).toBe('v1.0.0');
      expect(first.policy.isBaseline).toBe(true);
      expect(first.policy.status).toBe('active');
      expect(first.policy.notes).toBe('Initial Phase 9 deterministic code baseline');
      expect(first.policy.lifecycleEvents).toHaveLength(2);

      const second = await policyGovernanceService.seedBaseline({ operatorId: 'test_op', referenceNow });
      expect(second.idempotent).toBe(true);
      expect(second.policy._id.toString()).toBe(first.policy._id.toString());
    });

    it('rejects promotePolicy when baseline is not seeded', async () => {
      await expect(
        policyGovernanceService.promotePolicy({
          candidatePolicyDefinition: BASELINE_POLICY,
          policyVersion: 'v1.1.0',
          evidenceReportPath: testEvidencePath,
          operatorId: 'test_op',
          referenceNow,
        })
      ).rejects.toThrow(/BASELINE_NOT_SEEDED/);
    });
  });

  // ── 5. SemVer Ordering & Promotion Pipeline ───────────────────────────────
  describe('5. SemVer Contract & 17-Step Promotion Pipeline', () => {
    it('verifies numeric SemVer comparison (v1.10.0 > v1.9.0)', () => {
      expect(policyGovernanceService.isSemVerHigher('v1.10.0', 'v1.9.0')).toBe(true);
      expect(policyGovernanceService.isSemVerLower('v1.9.0', 'v1.10.0')).toBe(true);
      expect(policyGovernanceService.isSemVerHigher('v1.2.0', 'v1.1.9')).toBe(true);
    });

    it('rejects v1.0.0 promotion because it is reserved for baseline', async () => {
      await policyGovernanceService.seedBaseline({ referenceNow });
      await expect(
        policyGovernanceService.promotePolicy({
          candidatePolicyDefinition: BASELINE_POLICY,
          policyVersion: 'v1.0.0',
          evidenceReportPath: testEvidencePath,
          operatorId: 'test_op',
          referenceNow,
        })
      ).rejects.toThrow(/v1\.0\.0 is permanently reserved/);
    });

    it('rejects non-qualifying simulation modes with INSUFFICIENT_EVIDENCE_MODE', async () => {
      await policyGovernanceService.seedBaseline({ referenceNow });

      const invalidReportPath = path.join(__dirname, 'test_invalid_mode_report.json');
      const candidateDef = JSON.parse(JSON.stringify(BASELINE_POLICY));
      candidateDef.simulationOnly = true;
      candidateDef.baseWeights.PREREQUISITE_REMEDIATION = 35.0;
      const candidateFingerprint = generatePolicyFingerprint(candidateDef);

      fs.writeFileSync(
        invalidReportPath,
        JSON.stringify({
          engineVersion: 'v1',
          mode: 'OBSERVED_ACTION_SENSITIVITY',
          referenceNow: referenceNow.toISOString(),
          simulationFingerprint: 'a'.repeat(64),
          datasetFingerprint: 'b'.repeat(64),
          baselinePolicy: BASELINE_POLICY,
          candidatePolicies: [{ policyFingerprint: candidateFingerprint, policyDefinition: candidateDef }],
        }),
        'utf8'
      );

      try {
        await expect(
          policyGovernanceService.promotePolicy({
            candidatePolicyDefinition: candidateDef,
            policyVersion: 'v1.1.0',
            evidenceReportPath: invalidReportPath,
            operatorId: 'test_op',
            referenceNow,
          })
        ).rejects.toThrow(/INSUFFICIENT_EVIDENCE_MODE/);
      } finally {
        if (fs.existsSync(invalidReportPath)) fs.unlinkSync(invalidReportPath);
      }
    });

    it('promotes candidate policy successfully and handles complete Step-15 idempotency matrix', async () => {
      await policyGovernanceService.seedBaseline({ referenceNow });

      const candidateDef = JSON.parse(JSON.stringify(BASELINE_POLICY));
      candidateDef.simulationOnly = true;
      candidateDef.baseWeights.PREREQUISITE_REMEDIATION = 35.0;

      // Case 4: Higher version + new fingerprint -> creates new promoted document
      const result1 = await policyGovernanceService.promotePolicy({
        candidatePolicyDefinition: candidateDef,
        policyVersion: 'v1.1.0',
        evidenceReportPath: testEvidencePath,
        operatorId: 'test_op',
        referenceNow,
      });
      expect(result1.idempotent).toBe(false);
      expect(result1.policy.status).toBe('promoted');

      const countAfterPromote = await OrchestrationPolicyVersion.countDocuments();
      expect(countAfterPromote).toBe(2); // v1.0.0 + v1.1.0

      // Case 1: Exact retry (same version, same fingerprint) -> idempotent success, zero writes
      const result2 = await policyGovernanceService.promotePolicy({
        candidatePolicyDefinition: candidateDef,
        policyVersion: 'v1.1.0',
        evidenceReportPath: testEvidencePath,
        operatorId: 'test_op',
        referenceNow,
      });
      expect(result2.idempotent).toBe(true);
      expect(result2.policy.policyVersion).toBe('v1.1.0');
      const countAfterRetry = await OrchestrationPolicyVersion.countDocuments();
      expect(countAfterRetry).toBe(2);

      // Case 3: Higher version + same fingerprint -> return existing v1.1.0 document, idempotent: true, zero new doc, zero writes
      const result3 = await policyGovernanceService.promotePolicy({
        candidatePolicyDefinition: candidateDef,
        policyVersion: 'v1.2.0',
        evidenceReportPath: testEvidencePath,
        operatorId: 'test_op',
        referenceNow,
      });
      expect(result3.idempotent).toBe(true);
      expect(result3.policy.policyVersion).toBe('v1.1.0');
      const countAfterHigherSameFp = await OrchestrationPolicyVersion.countDocuments();
      expect(countAfterHigherSameFp).toBe(2);

      // Case 2: Same version (v1.1.0) + different fingerprint -> throws 409 POLICY_VERSION_ALREADY_EXISTS, zero writes
      const differentDef = JSON.parse(JSON.stringify(BASELINE_POLICY));
      differentDef.simulationOnly = true;
      differentDef.baseWeights.PREREQUISITE_REMEDIATION = 40.0;
      const diffFp = generatePolicyFingerprint(differentDef);

      const diffReportPath = path.join(__dirname, 'test_diff_evidence_report.json');
      fs.writeFileSync(
        diffReportPath,
        JSON.stringify({
          engineVersion: 'v1',
          mode: 'ARCHETYPE_POLICY_COMPARISON',
          referenceNow: referenceNow.toISOString(),
          simulationFingerprint: 'a'.repeat(64),
          datasetFingerprint: 'b'.repeat(64),
          baselinePolicy: BASELINE_POLICY,
          candidatePolicies: [{ policyFingerprint: diffFp, policyDefinition: differentDef }],
          syntheticArchetypeAnalysis: { archetypes: [{ archetypeId: 'archetype_1', metrics: {} }] },
        }),
        'utf8'
      );

      try {
        await expect(
          policyGovernanceService.promotePolicy({
            candidatePolicyDefinition: differentDef,
            policyVersion: 'v1.1.0',
            evidenceReportPath: diffReportPath,
            operatorId: 'test_op',
            referenceNow,
          })
        ).rejects.toThrow(/already exists with a different fingerprint/);
      } finally {
        if (fs.existsSync(diffReportPath)) fs.unlinkSync(diffReportPath);
      }
      const countAfterDiffReject = await OrchestrationPolicyVersion.countDocuments();
      expect(countAfterDiffReject).toBe(2);

      // Case 5: Lower nonexistent version (v1.0.5) when v1.1.0 exists -> rejected at Step 3 with 409
      await expect(
        policyGovernanceService.promotePolicy({
          candidatePolicyDefinition: candidateDef,
          policyVersion: 'v1.0.5',
          evidenceReportPath: testEvidencePath,
          operatorId: 'test_op',
          referenceNow,
        })
      ).rejects.toThrow(/POLICY_VERSION_ALREADY_EXISTS/);
    });

    it('validates exact Step-10 report shape and proves bounds/datasetSummary are not required', async () => {
      await policyGovernanceService.seedBaseline({ referenceNow });

      const candidateDef = JSON.parse(JSON.stringify(BASELINE_POLICY));
      candidateDef.simulationOnly = true;
      candidateDef.baseWeights.PREREQUISITE_REMEDIATION = 30.0;
      const candidateFp = generatePolicyFingerprint(candidateDef);

      // Report WITHOUT bounds and WITHOUT datasetSummary
      const minimalReportPath = path.join(__dirname, 'test_minimal_step10_report.json');
      fs.writeFileSync(
        minimalReportPath,
        JSON.stringify({
          engineVersion: 'v1',
          mode: 'ARCHETYPE_POLICY_COMPARISON',
          referenceNow: referenceNow.toISOString(),
          simulationFingerprint: '1'.repeat(64),
          datasetFingerprint: '2'.repeat(64),
          baselinePolicy: BASELINE_POLICY,
          candidatePolicies: [{ policyFingerprint: candidateFp, policyDefinition: candidateDef }],
          syntheticArchetypeAnalysis: { archetypes: [{ archetypeId: 'arch_1', metrics: {} }] },
        }),
        'utf8'
      );

      try {
        const res = await policyGovernanceService.promotePolicy({
          candidatePolicyDefinition: candidateDef,
          policyVersion: 'v1.1.0',
          evidenceReportPath: minimalReportPath,
          operatorId: 'test_op',
          referenceNow,
        });
        expect(res.idempotent).toBe(false);
        expect(res.policy.policyVersion).toBe('v1.1.0');
      } finally {
        if (fs.existsSync(minimalReportPath)) fs.unlinkSync(minimalReportPath);
      }
    });

    it('rejects malformed Step-10 structural evidence shapes', async () => {
      await policyGovernanceService.seedBaseline({ referenceNow });

      const candidateDef = JSON.parse(JSON.stringify(BASELINE_POLICY));
      candidateDef.simulationOnly = true;
      candidateDef.baseWeights.PREREQUISITE_REMEDIATION = 35.0;
      const candidateFp = generatePolicyFingerprint(candidateDef);

      const makeReport = (overrides) => {
        const report = {
          engineVersion: 'v1',
          mode: 'ARCHETYPE_POLICY_COMPARISON',
          referenceNow: referenceNow.toISOString(),
          simulationFingerprint: 'a'.repeat(64),
          datasetFingerprint: 'b'.repeat(64),
          baselinePolicy: BASELINE_POLICY,
          candidatePolicies: [{ policyFingerprint: candidateFp, policyDefinition: candidateDef }],
          syntheticArchetypeAnalysis: { archetypes: [{ archetypeId: 'arch_1', metrics: {} }] },
          ...overrides,
        };
        const p = path.join(__dirname, `test_shape_${Date.now()}_${Math.random().toString(36).substring(2)}.json`);
        fs.writeFileSync(p, JSON.stringify(report), 'utf8');
        return p;
      };

      // 1. Missing simulationFingerprint
      const p1 = makeReport({ simulationFingerprint: null });
      await expect(
        policyGovernanceService.promotePolicy({
          candidatePolicyDefinition: candidateDef,
          policyVersion: 'v1.1.0',
          evidenceReportPath: p1,
          operatorId: 'test_op',
          referenceNow,
        })
      ).rejects.toThrow(/simulationFingerprint/);
      fs.unlinkSync(p1);

      // 2. Non-hex datasetFingerprint
      const p2 = makeReport({ datasetFingerprint: 'not-a-valid-64-hex-string' });
      await expect(
        policyGovernanceService.promotePolicy({
          candidatePolicyDefinition: candidateDef,
          policyVersion: 'v1.1.0',
          evidenceReportPath: p2,
          operatorId: 'test_op',
          referenceNow,
        })
      ).rejects.toThrow(/datasetFingerprint/);
      fs.unlinkSync(p2);

      // 3. Missing baselinePolicy
      const p3 = makeReport({ baselinePolicy: null });
      await expect(
        policyGovernanceService.promotePolicy({
          candidatePolicyDefinition: candidateDef,
          policyVersion: 'v1.1.0',
          evidenceReportPath: p3,
          operatorId: 'test_op',
          referenceNow,
        })
      ).rejects.toThrow(/baselinePolicy/);
      fs.unlinkSync(p3);

      // 4. Empty candidatePolicies
      const p4 = makeReport({ candidatePolicies: [] });
      await expect(
        policyGovernanceService.promotePolicy({
          candidatePolicyDefinition: candidateDef,
          policyVersion: 'v1.1.0',
          evidenceReportPath: p4,
          operatorId: 'test_op',
          referenceNow,
        })
      ).rejects.toThrow(/candidatePolicies/);
      fs.unlinkSync(p4);

      // 5. Missing archetypes in ARCHETYPE_POLICY_COMPARISON
      const p5 = makeReport({ syntheticArchetypeAnalysis: { archetypes: [] } });
      await expect(
        policyGovernanceService.promotePolicy({
          candidatePolicyDefinition: candidateDef,
          policyVersion: 'v1.1.0',
          evidenceReportPath: p5,
          operatorId: 'test_op',
          referenceNow,
        })
      ).rejects.toThrow(/archetypes/);
      fs.unlinkSync(p5);

      // 6. COMBINED mode missing historicalSensitivityAnalysis
      const p6 = makeReport({ mode: 'COMBINED', historicalSensitivityAnalysis: null });
      await expect(
        policyGovernanceService.promotePolicy({
          candidatePolicyDefinition: candidateDef,
          policyVersion: 'v1.1.0',
          evidenceReportPath: p6,
          operatorId: 'test_op',
          referenceNow,
        })
      ).rejects.toThrow(/Combined mode report missing required analysis/);
      fs.unlinkSync(p6);
    });
  });

  // ── 6. Deterministic Reason Normalization Helper ──────────────────────────
  describe('6. Deterministic Reason Normalization', () => {
    it('normalizes undefined, null, empty, and whitespace-only reasons to canonical defaults', () => {
      // Forward activation
      expect(policyGovernanceService.normalizeGovernanceReason({ reason: undefined, isRollback: false })).toBe(
        'Policy activation'
      );
      expect(policyGovernanceService.normalizeGovernanceReason({ reason: null, isRollback: false })).toBe(
        'Policy activation'
      );
      expect(policyGovernanceService.normalizeGovernanceReason({ reason: '', isRollback: false })).toBe(
        'Policy activation'
      );
      expect(policyGovernanceService.normalizeGovernanceReason({ reason: '   ', isRollback: false })).toBe(
        'Policy activation'
      );

      // Rollback
      expect(policyGovernanceService.normalizeGovernanceReason({ reason: undefined, isRollback: true })).toBe(
        'Policy rollback'
      );
      expect(policyGovernanceService.normalizeGovernanceReason({ reason: null, isRollback: true })).toBe(
        'Policy rollback'
      );
      expect(policyGovernanceService.normalizeGovernanceReason({ reason: '', isRollback: true })).toBe(
        'Policy rollback'
      );
      expect(policyGovernanceService.normalizeGovernanceReason({ reason: '   ', isRollback: true })).toBe(
        'Policy rollback'
      );

      // Explicit non-empty
      expect(
        policyGovernanceService.normalizeGovernanceReason({ reason: '  emergency rollback  ', isRollback: true })
      ).toBe('emergency rollback');
    });
  });

  // ── 7. List and Show Inquiries ───────────────────────────────────────────
  describe('7. listVersions & showPolicy', () => {
    it('lists stored versions and displays details for a specific version', async () => {
      await policyGovernanceService.seedBaseline({ referenceNow });

      const list = await policyGovernanceService.listVersions();
      expect(list).toHaveLength(1);
      expect(list[0].policyVersion).toBe('v1.0.0');

      const shown = await policyGovernanceService.showPolicy({ policyVersion: 'v1.0.0' });
      expect(shown.policyVersion).toBe('v1.0.0');

      await expect(policyGovernanceService.showPolicy({ policyVersion: 'v9.9.9' })).rejects.toThrow(
        /POLICY_VERSION_NOT_FOUND/
      );
    });
  });
});
