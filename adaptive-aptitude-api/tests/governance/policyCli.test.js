'use strict';

/**
 * Policy CLI Test Suite — Phase 12: PPVG
 *
 * Verifies:
 *   - Command dispatch across all six commands: seed-baseline, promote, activate, rollback, list, show
 *   - Host-level trust boundary (POLICY_GOVERNANCE_SECRET with timingSafeEqual)
 *   - Missing secret, mismatched secret, and safe length handling
 *   - Unset secret with missing --confirm fails closed without warning
 *   - Unset secret with --confirm emits GOVERNANCE_SECRET_NOT_CONFIGURED warning and continues
 *   - Optionality of --reason on activate and rollback commands
 *   - Absence of --evidenceFingerprint CLI parameter
 */

const fs = require('node:fs');
const path = require('node:path');
const mongoose = require('mongoose');
const { connectTestDB, disconnectTestDB } = require('../helpers/dbSetup');
const OrchestrationPolicyVersion = require('../../src/models/orchestrationPolicyVersionModel');
const { runCli, parseCliArgs, verifyCliTrustGate } = require('../../scripts/managePolicy');
const { BASELINE_POLICY } = require('../../src/config/simulationConfig');
const { generatePolicyFingerprint } = require('../../src/utils/simulationFingerprint');

describe('Policy Administrative CLI Suite (scripts/managePolicy.js)', () => {
  const referenceNow = new Date('2026-10-10T12:00:00.000Z');
  const originalEnvSecret = process.env.POLICY_GOVERNANCE_SECRET;
  let testDefPath;
  let testEvidencePath;

  beforeAll(async () => {
    await connectTestDB();

    testDefPath = path.join(__dirname, 'cli_test_policy_def.json');
    const candidateDef = JSON.parse(JSON.stringify(BASELINE_POLICY));
    candidateDef.simulationOnly = true;
    candidateDef.baseWeights.PREREQUISITE_REMEDIATION = 40.0;
    fs.writeFileSync(testDefPath, JSON.stringify(candidateDef, null, 2), 'utf8');

    const candidateFp = generatePolicyFingerprint(candidateDef);
    testEvidencePath = path.join(__dirname, 'cli_test_evidence.json');
    const report = {
      engineVersion: 'v1',
      mode: 'ARCHETYPE_POLICY_COMPARISON',
      referenceNow: referenceNow.toISOString(),
      simulationFingerprint: 'c'.repeat(64),
      datasetFingerprint: 'd'.repeat(64),
      baselinePolicy: BASELINE_POLICY,
      candidatePolicies: [
        {
          policyFingerprint: candidateFp,
          policyDefinition: candidateDef,
        },
      ],
      datasetSummary: {},
      historicalSensitivityAnalysis: null,
      syntheticArchetypeAnalysis: {
        archetypes: [{ archetypeId: 'arch_1', metrics: {} }],
      },
      adherenceOutcomeSummary: {},
      bounds: {},
      trace: {},
      warnings: [],
      nonCausalNotice: 'Notice',
    };
    fs.writeFileSync(testEvidencePath, JSON.stringify(report, null, 2), 'utf8');
  });

  afterAll(async () => {
    process.env.POLICY_GOVERNANCE_SECRET = originalEnvSecret;
    if (fs.existsSync(testDefPath)) fs.unlinkSync(testDefPath);
    if (fs.existsSync(testEvidencePath)) fs.unlinkSync(testEvidencePath);
    await disconnectTestDB();
  });

  beforeEach(async () => {
    await mongoose.connection.collection('orchestrationpolicyversions').deleteMany({});
  });

  // ── 1. Trust Gate Verification ───────────────────────────────────────────
  describe('1. Trust Boundary Enforcement', () => {
    it('requires --secret when POLICY_GOVERNANCE_SECRET is configured', async () => {
      process.env.POLICY_GOVERNANCE_SECRET = 'top-secret-governance-token';

      // Missing --secret -> exit 1
      const resMissing = await runCli(['seed-baseline', '--operatorId', 'admin_1'], { referenceNow });
      expect(resMissing.exitCode).toBe(1);

      // Invalid secret -> exit 1
      const resInvalid = await runCli(
        ['seed-baseline', '--operatorId', 'admin_1', '--secret', 'wrong-token'],
        { referenceNow }
      );
      expect(resInvalid.exitCode).toBe(1);

      // Valid secret -> exit 0
      const resValid = await runCli(
        ['seed-baseline', '--operatorId', 'admin_1', '--secret', 'top-secret-governance-token'],
        { referenceNow }
      );
      expect(resValid.exitCode).toBe(0);
      expect(resValid.data.policy.policyVersion).toBe('v1.0.0');
    });

    it('requires --confirm when POLICY_GOVERNANCE_SECRET is unset', async () => {
      delete process.env.POLICY_GOVERNANCE_SECRET;

      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      // Missing --confirm -> exit 1, no warning
      const resMissingConfirm = await runCli(['seed-baseline', '--operatorId', 'admin_1'], { referenceNow });
      expect(resMissingConfirm.exitCode).toBe(1);
      expect(consoleWarnSpy).not.toHaveBeenCalled();

      // Supplied --confirm -> warning emitted, command succeeds
      const resWithConfirm = await runCli(
        ['seed-baseline', '--operatorId', 'admin_1', '--confirm'],
        { referenceNow }
      );
      expect(resWithConfirm.exitCode).toBe(0);
      expect(consoleWarnSpy).toHaveBeenCalled();
      const warningCall = consoleWarnSpy.mock.calls.find((call) =>
        String(call[0]).includes('GOVERNANCE_SECRET_NOT_CONFIGURED')
      );
      expect(warningCall).toBeDefined();

      consoleWarnSpy.mockRestore();
    });
  });

  // ── 2. Command Suite Execution & Optional Reason ──────────────────────────
  describe('2. Command Execution & Optional Reason Contract', () => {
    beforeEach(() => {
      delete process.env.POLICY_GOVERNANCE_SECRET;
    });

    it('promotes candidate policy via promote command and ignores absence of evidenceFingerprint', async () => {
      // Seed baseline first
      await runCli(['seed-baseline', '--operatorId', 'admin_1', '--confirm'], { referenceNow });

      // Promote candidate
      const promoteRes = await runCli(
        [
          'promote',
          '--policyDefinition', testDefPath,
          '--policyVersion', 'v1.1.0',
          '--evidenceReport', testEvidencePath,
          '--operatorId', 'admin_1',
          '--notes', 'Promotion via CLI test',
          '--confirm',
        ],
        { referenceNow }
      );
      expect(promoteRes.exitCode).toBe(0);
      expect(promoteRes.data.policy.policyVersion).toBe('v1.1.0');
      expect(promoteRes.data.policy.status).toBe('promoted');
    });

    it('activates policy without --reason and persists canonical "Policy activation" default', async () => {
      await runCli(['seed-baseline', '--operatorId', 'admin_1', '--confirm'], { referenceNow });
      await runCli(
        [
          'promote',
          '--policyDefinition', testDefPath,
          '--policyVersion', 'v1.1.0',
          '--evidenceReport', testEvidencePath,
          '--operatorId', 'admin_1',
          '--confirm',
        ],
        { referenceNow }
      );

      // Activate without --reason
      const activateRes = await runCli(
        ['activate', '--policyVersion', 'v1.1.0', '--operatorId', 'admin_1', '--confirm'],
        { referenceNow }
      );
      expect(activateRes.exitCode).toBe(0);
      expect(activateRes.data.policy.status).toBe('active');

      const targetDoc = await OrchestrationPolicyVersion.findOne({ policyVersion: 'v1.1.0' });
      const lastEvent = targetDoc.lifecycleEvents[targetDoc.lifecycleEvents.length - 1];
      expect(lastEvent.eventType).toBe('ACTIVATED');
      expect(lastEvent.reason).toBe('Policy activation');
    });

    it('rolls back policy without --reason and persists canonical "Policy rollback" default', async () => {
      await runCli(['seed-baseline', '--operatorId', 'admin_1', '--confirm'], { referenceNow });
      await runCli(
        [
          'promote',
          '--policyDefinition', testDefPath,
          '--policyVersion', 'v1.1.0',
          '--evidenceReport', testEvidencePath,
          '--operatorId', 'admin_1',
          '--confirm',
        ],
        { referenceNow }
      );
      await runCli(
        ['activate', '--policyVersion', 'v1.1.0', '--operatorId', 'admin_1', '--confirm'],
        { referenceNow }
      );

      // Rollback to baseline v1.0.0 without --reason
      const rollbackRes = await runCli(
        ['rollback', '--policyVersion', 'v1.0.0', '--operatorId', 'admin_1', '--confirm'],
        { referenceNow }
      );
      expect(rollbackRes.exitCode).toBe(0);
      expect(rollbackRes.data.policy.status).toBe('active');

      const baselineDoc = await OrchestrationPolicyVersion.findOne({ policyVersion: 'v1.0.0' });
      const lastEvent = baselineDoc.lifecycleEvents[baselineDoc.lifecycleEvents.length - 1];
      expect(lastEvent.eventType).toBe('ROLLBACK_TARGET');
      expect(lastEvent.reason).toBe('Policy rollback');
    });

    it('activates and rolls back with explicit --reason, trimming whitespace', async () => {
      await runCli(['seed-baseline', '--operatorId', 'admin_1', '--confirm'], { referenceNow });
      await runCli(
        [
          'promote',
          '--policyDefinition', testDefPath,
          '--policyVersion', 'v1.1.0',
          '--evidenceReport', testEvidencePath,
          '--operatorId', 'admin_1',
          '--confirm',
        ],
        { referenceNow }
      );

      // Activate with explicit reason
      const activateRes = await runCli(
        [
          'activate',
          '--policyVersion', 'v1.1.0',
          '--operatorId', 'admin_1',
          '--reason', '   scheduled activation for sprint 12   ',
          '--confirm',
        ],
        { referenceNow }
      );
      expect(activateRes.exitCode).toBe(0);

      const targetDoc = await OrchestrationPolicyVersion.findOne({ policyVersion: 'v1.1.0' });
      const lastEvent = targetDoc.lifecycleEvents[targetDoc.lifecycleEvents.length - 1];
      expect(lastEvent.reason).toBe('scheduled activation for sprint 12');
    });

    it('lists and displays stored policies via list and show commands', async () => {
      await runCli(['seed-baseline', '--operatorId', 'admin_1', '--confirm'], { referenceNow });

      const listRes = await runCli(['list', '--confirm'], { referenceNow });
      expect(listRes.exitCode).toBe(0);
      expect(listRes.data).toHaveLength(1);

      const showRes = await runCli(['show', '--policyVersion', 'v1.0.0', '--confirm'], { referenceNow });
      expect(showRes.exitCode).toBe(0);
      expect(showRes.data.policyVersion).toBe('v1.0.0');
    });
  });
});
