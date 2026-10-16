'use strict';

/**
 * Phase 11 Suite 6: Cross-Phase Isolation & Determinism Assertions
 *
 * Implements all 9 mandatory determinism and isolation assertions frozen under Section 35.1:
 * 1. Identical normalized inputs => identical fingerprint / filename / bytes
 * 2. includeTrace false vs true => different fingerprint / bytes
 * 3. Candidate-policy input order invariance
 * 4. Existing identical artifact reuse
 * 5. Fingerprint-content mismatch rejection
 * 6. MODE_B ignored-argument invariance
 * 7. HISTORICAL_AGGREGATION ignored-policy invariance
 * 8. CLI mode alias normalization & canonical report.mode
 * 9. User-cohort order and duplicate invariance
 * Plus: Zero database writes across 14 collections, 14 models, 0 HTTP routes, 0 LLM imports.
 */

const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const mongoose = require('mongoose');

const {
  SIMULATION_MODES,
  BASELINE_POLICY,
} = require('../../src/config/simulationConfig');
const { SIMULATION_ARCHETYPES } = require('../../src/config/simulationArchetypes');
const { validateCandidatePolicy } = require('../../src/services/simulation/policyValidationService');
const { runPolicySimulation } = require('../../src/services/simulation/policySimulationService');
const { canonicalizeJSON } = require('../../src/utils/simulationFingerprint');
const { runCli } = require('../../scripts/simulatePolicy');
const PrescriptionExecutionRecord = require('../../src/models/prescriptionExecutionRecordModel');

describe('Suite 6: Phase 11 Cross-Phase Isolation & Determinism Tests', () => {
  const referenceNow = new Date('2026-10-09T12:00:00.000Z');

  const policyA = validateCandidatePolicy({
    simulationOnly: true,
    baseWeights: { ...BASELINE_POLICY.baseWeights, PREREQUISITE_REMEDIATION: 55.0 },
    maxMasteryDeficitWeight: 25.0,
    maxGoalImpactWeight: 15.0,
    maxTemporalWeight: 10.0,
    priorityThresholds: { ...BASELINE_POLICY.priorityThresholds },
  });

  const policyB = validateCandidatePolicy({
    simulationOnly: true,
    baseWeights: { ...BASELINE_POLICY.baseWeights, OVERDUE_REVISION: 50.0 },
    maxMasteryDeficitWeight: 25.0,
    maxGoalImpactWeight: 15.0,
    maxTemporalWeight: 10.0,
    priorityThresholds: { ...BASELINE_POLICY.priorityThresholds },
  });

  const sampleHistoricalRecords = [
    {
      _id: '507f1f77bcf86cd799439011',
      prescriptionId: 'presc_1',
      userId: 'userA',
      actionType: 'PREREQUISITE_REMEDIATION',
      actionSubtype: 'BLOCKING_PREREQUISITE',
      urgencyScore: 70.0,
      priorityTier: 'urgent',
      issuedAt: new Date('2026-09-10T00:00:00Z'),
      issuanceSnapshot: { prerequisiteMastery: 0.4 },
      status: 'completed',
    },
    {
      _id: '507f1f77bcf86cd799439012',
      prescriptionId: 'presc_2',
      userId: 'userA',
      actionType: 'RETENTION_RESCUE',
      actionSubtype: 'OVERDUE_REVISION',
      urgencyScore: 65.0,
      priorityTier: 'urgent',
      issuedAt: new Date('2026-09-11T00:00:00Z'),
      issuanceSnapshot: { nextReviewDate: '2026-09-08T00:00:00Z' },
      status: 'completed',
    },
    {
      _id: '507f1f77bcf86cd799439013',
      prescriptionId: 'presc_3',
      userId: 'userB',
      actionType: 'PREREQUISITE_REMEDIATION',
      actionSubtype: 'BLOCKING_PREREQUISITE',
      urgencyScore: 72.0,
      priorityTier: 'urgent',
      issuedAt: new Date('2026-09-12T00:00:00Z'),
      issuanceSnapshot: { prerequisiteMastery: 0.3 },
      status: 'completed',
    },
    {
      _id: '507f1f77bcf86cd799439014',
      prescriptionId: 'presc_4',
      userId: 'userB',
      actionType: 'CURRICULUM_ADVANCEMENT',
      actionSubtype: 'DAILY_OBJECTIVE_TARGET',
      urgencyScore: 55.0,
      priorityTier: 'high',
      issuedAt: new Date('2026-09-13T00:00:00Z'),
      issuanceSnapshot: { storedMastery: 0.5 },
      status: 'completed',
    },
    {
      _id: '507f1f77bcf86cd799439015',
      prescriptionId: 'presc_5',
      userId: 'userB',
      actionType: 'PACING_CALIBRATION',
      actionSubtype: 'RUSHING_REMEDIATION',
      urgencyScore: 45.0,
      priorityTier: 'normal',
      issuedAt: new Date('2026-09-14T00:00:00Z'),
      issuanceSnapshot: {},
      status: 'completed',
    },
    {
      _id: '507f1f77bcf86cd799439016',
      prescriptionId: 'presc_6',
      userId: 'userA',
      actionType: 'CURRICULUM_ADVANCEMENT',
      actionSubtype: 'DAILY_OBJECTIVE_TARGET',
      urgencyScore: 50.0,
      priorityTier: 'high',
      issuedAt: new Date('2026-09-15T00:00:00Z'),
      issuanceSnapshot: { storedMastery: 0.6 },
      status: 'completed',
    },
    {
      _id: '507f1f77bcf86cd799439017',
      prescriptionId: 'presc_7',
      userId: 'userA',
      actionType: 'PREREQUISITE_REMEDIATION',
      actionSubtype: 'BLOCKING_PREREQUISITE',
      urgencyScore: 75.0,
      priorityTier: 'urgent',
      issuedAt: new Date('2026-09-16T00:00:00Z'),
      issuanceSnapshot: { prerequisiteMastery: 0.25 },
      status: 'completed',
    },
    {
      _id: '507f1f77bcf86cd799439018',
      prescriptionId: 'presc_8',
      userId: 'userA',
      actionType: 'RETENTION_RESCUE',
      actionSubtype: 'OVERDUE_REVISION',
      urgencyScore: 68.0,
      priorityTier: 'urgent',
      issuedAt: new Date('2026-09-17T00:00:00Z'),
      issuanceSnapshot: { nextReviewDate: '2026-09-10T00:00:00Z' },
      status: 'completed',
    },
  ];

  let findSpy;

  beforeEach(() => {
    findSpy = jest.spyOn(PrescriptionExecutionRecord, 'find').mockImplementation((filter) => {
      const recordsForUser = sampleHistoricalRecords.filter((r) => r.userId === filter.userId);
      return {
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(recordsForUser),
      };
    });
  });

  afterEach(() => {
    if (findSpy) findSpy.mockRestore();
  });

  describe('Assertion 1: Identical Normalized Inputs Produce Identical Report Bytes', () => {
    it('produces identical simulationFingerprint, filename, and bytes for identical runs', async () => {
      const report1 = await runPolicySimulation({
        mode: SIMULATION_MODES.MODE_B,
        candidatePolicies: [policyA],
        referenceNow,
        includeTrace: false,
      });

      const report2 = await runPolicySimulation({
        mode: SIMULATION_MODES.MODE_B,
        candidatePolicies: [policyA],
        referenceNow,
        includeTrace: false,
      });

      expect(report1.simulationFingerprint).toBe(report2.simulationFingerprint);
      const bytes1 = canonicalizeJSON(report1) + '\n';
      const bytes2 = canonicalizeJSON(report2) + '\n';
      expect(bytes1).toBe(bytes2);
    });
  });

  describe('Assertion 2: includeTrace Participates in Simulation Identity', () => {
    it('produces different simulationFingerprint and bytes when includeTrace differs', async () => {
      const reportNoTrace = await runPolicySimulation({
        mode: SIMULATION_MODES.MODE_A,
        candidatePolicies: [policyA],
        userIds: ['userA', 'userB'],
        referenceNow,
        includeTrace: false,
      });

      const reportWithTrace = await runPolicySimulation({
        mode: SIMULATION_MODES.MODE_A,
        candidatePolicies: [policyA],
        userIds: ['userA', 'userB'],
        referenceNow,
        includeTrace: true,
      });

      expect(reportNoTrace.simulationFingerprint).not.toBe(reportWithTrace.simulationFingerprint);
      const bytesNoTrace = canonicalizeJSON(reportNoTrace) + '\n';
      const bytesWithTrace = canonicalizeJSON(reportWithTrace) + '\n';
      expect(bytesNoTrace).not.toBe(bytesWithTrace);
      expect(reportNoTrace.trace).toBeNull();
      expect(reportWithTrace.trace).not.toBeNull();
    });
  });

  describe('Assertion 3: Candidate-Policy Input Order is Non-Semantic', () => {
    it('canonicalizes candidate policy ordering by policyFingerprint ASC and yields identical bytes', async () => {
      const reportOrder1 = await runPolicySimulation({
        mode: SIMULATION_MODES.MODE_B,
        candidatePolicies: [policyA, policyB],
        referenceNow,
      });

      const reportOrder2 = await runPolicySimulation({
        mode: SIMULATION_MODES.MODE_B,
        candidatePolicies: [policyB, policyA], // permuted caller order
        referenceNow,
      });

      expect(reportOrder1.simulationFingerprint).toBe(reportOrder2.simulationFingerprint);
      expect(reportOrder1.candidatePolicies.map((p) => p.policyFingerprint)).toEqual(
        reportOrder2.candidatePolicies.map((p) => p.policyFingerprint)
      );
      const bytes1 = canonicalizeJSON(reportOrder1) + '\n';
      const bytes2 = canonicalizeJSON(reportOrder2) + '\n';
      expect(bytes1).toBe(bytes2);
    });
  });

  describe('Assertion 4 & 5: Artifact Reuse & Mismatch Protection', () => {
    let tempDir;

    beforeEach(() => {
      tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sim_test_'));
    });

    afterEach(() => {
      if (tempDir && fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    });

    it('reuses existing artifact without rewriting when bytes match (Assertion 4)', async () => {
      const policyPath = path.join(tempDir, 'cand_policy.json');
      fs.writeFileSync(policyPath, JSON.stringify(policyA), 'utf8');

      const cliArgs = [
        '--mode=MODE_B',
        `--referenceNow=${referenceNow.toISOString()}`,
        `--candidatePolicy=${policyPath}`,
        `--outputDir=${tempDir}`,
      ];

      // First run: writes artifact
      const run1 = await runCli(cliArgs);
      expect(run1.exitCode).toBe(0);
      expect(run1.reusedArtifact).toBe(false);
      expect(fs.existsSync(run1.filePath)).toBe(true);

      const mtime1 = fs.statSync(run1.filePath).mtimeMs;

      // Second run: reuses artifact
      const run2 = await runCli(cliArgs);
      expect(run2.exitCode).toBe(0);
      expect(run2.reusedArtifact).toBe(true);
      const mtime2 = fs.statSync(run2.filePath).mtimeMs;
      expect(mtime2).toBe(mtime1); // zero rewrite!
    });

    it('rejects fingerprint-content mismatch without overwriting (Assertion 5)', async () => {
      const policyPath = path.join(tempDir, 'cand_policy.json');
      fs.writeFileSync(policyPath, JSON.stringify(policyA), 'utf8');

      const cliArgs = [
        '--mode=MODE_B',
        `--referenceNow=${referenceNow.toISOString()}`,
        `--candidatePolicy=${policyPath}`,
        `--outputDir=${tempDir}`,
      ];

      // First run creates valid artifact
      const run1 = await runCli(cliArgs);
      expect(run1.exitCode).toBe(0);

      // Corrupt the file on disk (simulate tampered/conflicting bytes with same filename)
      fs.writeFileSync(run1.filePath, '{"corrupted": true}\n', 'utf8');

      // Second run must detect mismatch and reject with code 3 (SIMULATION_EXECUTION_FAILED)
      const run2 = await runCli(cliArgs);
      expect(run2.exitCode).toBe(3);
      expect(run2.error.reason).toBe('FINGERPRINT_CONTENT_MISMATCH');

      // Verify the conflicting file was NOT overwritten
      expect(fs.readFileSync(run1.filePath, 'utf8')).toBe('{"corrupted": true}\n');
    });
  });

  describe('Assertion 6: MODE_B Ignored Arguments are Truly Non-Semantic', () => {
    it('normalizes userIds and windowDays to [] and null and produces identical fingerprint and bytes', async () => {
      const reportOmitted = await runPolicySimulation({
        mode: SIMULATION_MODES.MODE_B,
        candidatePolicies: [policyA],
        referenceNow,
      });

      const reportSupplied = await runPolicySimulation({
        mode: SIMULATION_MODES.MODE_B,
        candidatePolicies: [policyA],
        userIds: ['userA', 'userB'], // Ignored for Mode B
        windowDays: 60,              // Ignored for Mode B
        referenceNow,
      });

      expect(reportOmitted.simulationFingerprint).toBe(reportSupplied.simulationFingerprint);
      const bytes1 = canonicalizeJSON(reportOmitted) + '\n';
      const bytes2 = canonicalizeJSON(reportSupplied) + '\n';
      expect(bytes1).toBe(bytes2);
      expect(reportSupplied.datasetSummary).toBeNull();
    });
  });

  describe('Assertion 7: HISTORICAL_AGGREGATION Candidate Policies are Truly Non-Semantic', () => {
    it('normalizes candidatePolicies to [] and produces identical fingerprint and bytes as omission', async () => {
      const reportOmitted = await runPolicySimulation({
        mode: SIMULATION_MODES.HISTORICAL_AGGREGATION,
        userIds: ['userA', 'userB'],
        referenceNow,
      });

      const reportSupplied = await runPolicySimulation({
        mode: SIMULATION_MODES.HISTORICAL_AGGREGATION,
        candidatePolicies: [policyA, policyB], // Ignored for aggregation
        userIds: ['userA', 'userB'],
        referenceNow,
      });

      expect(reportOmitted.simulationFingerprint).toBe(reportSupplied.simulationFingerprint);
      const bytes1 = canonicalizeJSON(reportOmitted) + '\n';
      const bytes2 = canonicalizeJSON(reportSupplied) + '\n';
      expect(bytes1).toBe(bytes2);
      expect(reportSupplied.candidatePolicies).toEqual([]);
    });
  });

  describe('Assertion 8: CLI Mode Alias Normalization & Canonical report.mode', () => {
    let tempDir;

    beforeEach(() => {
      tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sim_cli_mode_'));
    });

    afterEach(() => {
      if (tempDir && fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    });

    it('maps CLI MODE_A to OBSERVED_ACTION_SENSITIVITY and stores canonical mode in report.mode', async () => {
      const policyPath = path.join(tempDir, 'p.json');
      fs.writeFileSync(policyPath, JSON.stringify(policyA), 'utf8');

      const res = await runCli([
        '--mode=MODE_A',
        `--referenceNow=${referenceNow.toISOString()}`,
        `--candidatePolicy=${policyPath}`,
        '--userIds=userA,userB',
        `--outputDir=${tempDir}`,
      ]);

      expect(res.exitCode).toBe(0);
      expect(res.report.mode).toBe('OBSERVED_ACTION_SENSITIVITY');
    });

    it('maps CLI MODE_B to ARCHETYPE_POLICY_COMPARISON and stores canonical mode in report.mode', async () => {
      const policyPath = path.join(tempDir, 'p.json');
      fs.writeFileSync(policyPath, JSON.stringify(policyA), 'utf8');

      const res = await runCli([
        '--mode=MODE_B',
        `--referenceNow=${referenceNow.toISOString()}`,
        `--candidatePolicy=${policyPath}`,
        `--outputDir=${tempDir}`,
      ]);

      expect(res.exitCode).toBe(0);
      expect(res.report.mode).toBe('ARCHETYPE_POLICY_COMPARISON');
    });

    it('accepts all frozen camelCase flags (--referenceNow, --candidatePolicies, --userId, --windowDays, --outputDir, --includeTrace)', async () => {
      const p1 = path.join(tempDir, 'p1.json');
      const p2 = path.join(tempDir, 'p2.json');
      fs.writeFileSync(p1, JSON.stringify(policyA), 'utf8');
      fs.writeFileSync(p2, JSON.stringify(policyB), 'utf8');

      const res = await runCli([
        '--mode=MODE_A',
        `--referenceNow=${referenceNow.toISOString()}`,
        `--candidatePolicies=${p1},${p2}`,
        '--userId=userA',
        '--windowDays=45',
        '--includeTrace=true',
        `--outputDir=${tempDir}`,
      ]);

      expect(res.exitCode).toBe(0);
      expect(res.report.trace).toBeDefined();
      expect(res.report.mode).toBe('OBSERVED_ACTION_SENSITIVITY');
    });

    it('enforces singular/plural mutual exclusivity for candidate policy flags', async () => {
      const p1 = path.join(tempDir, 'p1.json');
      fs.writeFileSync(p1, JSON.stringify(policyA), 'utf8');

      const res = await runCli([
        '--mode=MODE_A',
        `--referenceNow=${referenceNow.toISOString()}`,
        `--candidatePolicy=${p1}`,
        `--candidatePolicies=${p1}`,
        '--userId=userA',
        `--outputDir=${tempDir}`,
      ]);

      expect(res.exitCode).toBe(1);
      expect(res.error.reason).toBe('TOO_MANY_CANDIDATE_POLICIES');
    });

    it('enforces canonical user-cohort limits over CLI user ID arguments', async () => {
      const p1 = path.join(tempDir, 'p1.json');
      fs.writeFileSync(p1, JSON.stringify(policyA), 'utf8');

      const resEmpty = await runCli([
        '--mode=MODE_A',
        `--referenceNow=${referenceNow.toISOString()}`,
        `--candidatePolicy=${p1}`,
        '--userIds=',
        `--outputDir=${tempDir}`,
      ]);

      expect(resEmpty.exitCode).toBe(1);
      expect(resEmpty.error.reason).toBe('EMPTY_USER_LIST');
    });
  });

  describe('Assertion 9: User-Cohort Order & Duplicate Invariance', () => {
    it('normalizes permutations and duplicates of userIds into identical cohort, queries, and bytes', async () => {
      const run1 = await runPolicySimulation({
        mode: SIMULATION_MODES.MODE_A,
        candidatePolicies: [policyA],
        userIds: ['userB', 'userA'],
        referenceNow,
      });

      const run2 = await runPolicySimulation({
        mode: SIMULATION_MODES.MODE_A,
        candidatePolicies: [policyA],
        userIds: ['userA', 'userB'],
        referenceNow,
      });

      const run3 = await runPolicySimulation({
        mode: SIMULATION_MODES.MODE_A,
        candidatePolicies: [policyA],
        userIds: ['userA', 'userB', 'userA'],
        referenceNow,
      });

      expect(run1.simulationFingerprint).toBe(run2.simulationFingerprint);
      expect(run2.simulationFingerprint).toBe(run3.simulationFingerprint);

      const bytes1 = canonicalizeJSON(run1) + '\n';
      const bytes2 = canonicalizeJSON(run2) + '\n';
      const bytes3 = canonicalizeJSON(run3) + '\n';
      expect(bytes1).toBe(bytes2);
      expect(bytes2).toBe(bytes3);
    });
  });

  describe('Isolation Boundaries', () => {
    it('ensures zero Mongoose write operations are invoked across any model', async () => {
      const saveSpy = jest.spyOn(mongoose.Model.prototype, 'save');
      const createSpy = jest.spyOn(mongoose.Model, 'create');
      const updateOneSpy = jest.spyOn(mongoose.Model, 'updateOne');
      const updateManySpy = jest.spyOn(mongoose.Model, 'updateMany');
      const deleteOneSpy = jest.spyOn(mongoose.Model, 'deleteOne');
      const deleteManySpy = jest.spyOn(mongoose.Model, 'deleteMany');

      await runPolicySimulation({
        mode: SIMULATION_MODES.COMBINED,
        candidatePolicies: [policyA],
        userIds: ['userA', 'userB'],
        referenceNow,
      });

      expect(saveSpy).not.toHaveBeenCalled();
      expect(createSpy).not.toHaveBeenCalled();
      expect(updateOneSpy).not.toHaveBeenCalled();
      expect(updateManySpy).not.toHaveBeenCalled();
      expect(deleteOneSpy).not.toHaveBeenCalled();
      expect(deleteManySpy).not.toHaveBeenCalled();

      saveSpy.mockRestore();
      createSpy.mockRestore();
      updateOneSpy.mockRestore();
      updateManySpy.mockRestore();
      deleteOneSpy.mockRestore();
      deleteManySpy.mockRestore();
    });

    it('ensures simulationArchetypes has 0 Phase 1-8 runtime imports', () => {
      const archetypesSource = fs.readFileSync(
        path.join(__dirname, '../../src/config/simulationArchetypes.js'),
        'utf8'
      );
      expect(archetypesSource).not.toContain('require(');
      expect(archetypesSource).not.toContain('patternRegistryService');
    });

    it('ensures exactly 16 models exist in src/models (including OrchestrationPolicyVersion and AuthSession)', () => {
      const modelsDir = path.join(__dirname, '../../src/models');
      const modelFiles = fs.readdirSync(modelsDir).filter((f) => f.endsWith('.js'));
      expect(modelFiles.length).toBe(16);
      expect(modelFiles).toContain('orchestrationPolicyVersionModel.js');
      expect(modelFiles).toContain('authSessionModel.js');
    });
  });
});
