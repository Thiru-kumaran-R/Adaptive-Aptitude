'use strict';

/**
 * tests/governance/policyIntegration.test.js
 *
 * Phase 12 PPVG Integration Test Suite
 *
 * Covers:
 *   1. Transaction Capability Classifier Invariants (Cases A through I)
 *   2. Transaction Error Handling, Rollback, Session Cleanup & Discard Invariants
 *   3. Multi-Document Transactions: Activation and Rollback State Transitions
 *   4. Comprehensive Rollback Eligibility Matrix
 *   5. Optional Reason Normalization Across Activation & Rollback
 *   6. Phase 9 Runtime Governance & 13 Governed Dimensions
 *   7. Phase 10 Same-Call Provenance & Prescription Execution Stamping
 *   8. Public DTO Provenance Concealment Invariance
 */

const mongoose = require('mongoose');
const { connectTestDB, disconnectTestDB } = require('../helpers/dbSetup');
const OrchestrationPolicyVersion = require('../../src/models/orchestrationPolicyVersionModel');
const PrescriptionExecutionRecord = require('../../src/models/prescriptionExecutionRecordModel');
const policyGovernanceService = require('../../src/services/governance/policyGovernanceService');
const {
  isTransactionCapabilityError,
  seedBaseline,
  activatePolicy,
  rollbackPolicy,
  resolveActivePolicySnapshot,
  normalizeGovernanceReason,
} = policyGovernanceService;
const nextActionArbiter = require('../../src/services/orchestration/nextActionArbiter');
const dailyAgendaAssembler = require('../../src/services/orchestration/dailyAgendaAssembler');
const interventionPolicyService = require('../../src/services/orchestration/interventionPolicyService');
const urgencyScoringService = require('../../src/services/orchestration/urgencyScoringService');
const {
  getPriorityTier,
  normalizePriorityThresholds,
  DEFAULT_PRIORITY_THRESHOLDS,
} = require('../../src/services/orchestration/orchestrationUtils');
const attributionIssuanceService = require('../../src/services/attribution/attributionIssuanceService');
const orchestrationController = require('../../src/controllers/orchestrationController');
const { generatePolicyFingerprint } = require('../../src/utils/simulationFingerprint');
const { BASELINE_POLICY } = require('../../src/config/simulationConfig');
const AppError = require('../../src/utils/AppError');

describe('Phase 12 PPVG Integration Suite', () => {
  const referenceNow = new Date('2026-10-10T12:00:00.000Z');

  beforeAll(async () => {
    await connectTestDB();
  });

  afterAll(async () => {
    await disconnectTestDB();
  });

  beforeEach(async () => {
    await mongoose.connection.collection('orchestrationpolicyversions').deleteMany({});
    await PrescriptionExecutionRecord.deleteMany({});
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 1. Transaction Capability Classifier (Cases A through I)
  // ───────────────────────────────────────────────────────────────────────────
  describe('1. Transaction Capability Classifier (Cases A through I)', () => {
    it('Case A: recognizes driver MongoTransactionError deployment incapability', () => {
      const err1 = new Error('Transactions are not supported by this deployment');
      err1.name = 'MongoTransactionError';
      expect(isTransactionCapabilityError(err1)).toBe(true);

      const err2 = new Error('Current topology does not support sessions');
      err2.name = 'MongoTransactionError';
      expect(isTransactionCapabilityError(err2)).toBe(true);

      const err3 = new Error('Cannot start transaction on standalone');
      err3.name = 'MongoTransactionError';
      expect(isTransactionCapabilityError(err3)).toBe(true);

      // Negative control: generic word "transaction" without capability match
      const genericTxErr = new Error('Some arbitrary transaction failure');
      genericTxErr.name = 'MongoTransactionError';
      expect(isTransactionCapabilityError(genericTxErr)).toBe(false);
    });

    it('recognizes MongoCompatibilityError indicating lack of support', () => {
      const compatErr = new Error('Transactions are not supported on this wire version');
      compatErr.name = 'MongoCompatibilityError';
      expect(isTransactionCapabilityError(compatErr)).toBe(true);
    });

    it('Code 20 / IllegalOperation: standalone vs replica set member message', () => {
      const code20_1 = new Error('Transaction numbers are only allowed on a replica set member or mongos');
      code20_1.code = 20;
      code20_1.codeName = 'IllegalOperation';
      expect(isTransactionCapabilityError(code20_1)).toBe(true);

      const code20_2 = new Error('Cannot start transaction on standalone');
      code20_2.code = 20;
      expect(isTransactionCapabilityError(code20_2)).toBe(true);

      const code20_unrelated = new Error('Illegal operation: collection not capped');
      code20_2.code = 20;
      expect(isTransactionCapabilityError(code20_unrelated)).toBe(false);
    });

    it('Case F: Code 148 ReadConcernMajorityNotEnabled with prepareTransaction unsupported', () => {
      const code148_prepare = new Error('prepareTransaction is not supported');
      code148_prepare.code = 148;
      code148_prepare.codeName = 'ReadConcernMajorityNotEnabled';
      expect(isTransactionCapabilityError(code148_prepare)).toBe(true);
    });

    it('Case G1: ordinary Code 148 is NOT transaction capability failure', () => {
      const code148_ordinary = new Error('read concern majority not enabled on this storage engine');
      code148_ordinary.code = 148;
      expect(isTransactionCapabilityError(code148_ordinary)).toBe(false);
    });

    it('Case G2: Code 148 containing generic "transaction" only is NOT capability failure', () => {
      const code148_generic = new Error('transaction failed due to majority read concern constraint');
      code148_generic.code = 148;
      expect(isTransactionCapabilityError(code148_generic)).toBe(false);
    });

    it('Case H: Code 263 OperationNotSupportedInTransaction is NOT deployment capability failure', () => {
      const code263 = new Error('OperationNotSupportedInTransaction: createIndexes is not allowed in a transaction');
      code263.code = 263;
      code263.codeName = 'OperationNotSupportedInTransaction';
      expect(isTransactionCapabilityError(code263)).toBe(false);
    });

    it('Case I: Code 263 deployment-capability form is NOT APPLICABLE', () => {
      // Per frozen contract, Code 263 is never mapped to TRANSACTION_NOT_SUPPORTED
      const err = new Error('Cannot run command inside transaction');
      err.code = 263;
      expect(isTransactionCapabilityError(err)).toBe(false);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 2. Transaction Error Handling Across BOTH activatePolicy and rollbackPolicy
  // ───────────────────────────────────────────────────────────────────────────
  describe('2. Transaction Error Handling, Session Cleanup & Discard Invariants', () => {
    let baseline;

    beforeEach(async () => {
      baseline = (await seedBaseline({ operatorId: 'op_test', referenceNow })).policy;
    });

    const createPromotedDoc = async (version, weights = {}) => {
      const def = JSON.parse(JSON.stringify(BASELINE_POLICY));
      def.baseWeights.PREREQUISITE_REMEDIATION =
        weights.PREREQUISITE_REMEDIATION ||
        (25.0 + parseInt(version.replace(/\D/g, ''), 10));
      return OrchestrationPolicyVersion.create({
        policyVersion: version,
        policyFingerprint: generatePolicyFingerprint(def),
        status: 'promoted',
        policyDefinition: def,
        promotedBy: 'op_test',
        promotedAt: referenceNow,
        evidenceSimulationFingerprint: 'f'.repeat(64),
        evidenceArtifactSha256: 'e'.repeat(64),
        isBaseline: false,
        lifecycleEvents: [
          {
            eventType: 'PROMOTED',
            eventAt: referenceNow,
            operatorId: 'op_test',
            reason: 'Test promotion',
          },
        ],
      });
    };

    it('Case A: startTransaction capability failure wraps to 500 TRANSACTION_NOT_SUPPORTED', async () => {
      await createPromotedDoc('v1.1.0');
      const startSessionSpy = jest.spyOn(mongoose, 'startSession').mockImplementation(async () => {
        return {
          startTransaction: () => {
            const err = new Error('Cannot start transaction on standalone');
            err.name = 'MongoTransactionError';
            throw err;
          },
          abortTransaction: jest.fn(),
          endSession: jest.fn().mockResolvedValue(),
        };
      });

      await expect(
        activatePolicy({ targetVersion: 'v1.1.0', operatorId: 'op_1', referenceNow })
      ).rejects.toMatchObject({
        statusCode: 500,
        code: 'TRANSACTION_NOT_SUPPORTED',
      });

      startSessionSpy.mockRestore();
    });

    it('Case B: session-bound query capability failure wraps to 500 TRANSACTION_NOT_SUPPORTED', async () => {
      await createPromotedDoc('v1.1.0');
      let endSessionCalled = false;
      let abortCalled = false;

      const mockSession = {
        startTransaction: jest.fn(),
        abortTransaction: jest.fn().mockImplementation(async () => {
          abortCalled = true;
        }),
        endSession: jest.fn().mockImplementation(async () => {
          endSessionCalled = true;
        }),
      };

      const startSessionSpy = jest.spyOn(mongoose, 'startSession').mockResolvedValue(mockSession);
      const findOneSpy = jest.spyOn(OrchestrationPolicyVersion, 'findOne').mockImplementation(() => {
        return {
          session: () => {
            const err = new Error('Transaction numbers are only allowed on a replica set member or mongos');
            err.code = 20;
            throw err;
          },
        };
      });

      await expect(
        activatePolicy({ targetVersion: 'v1.1.0', operatorId: 'op_1', referenceNow })
      ).rejects.toMatchObject({
        statusCode: 500,
        code: 'TRANSACTION_NOT_SUPPORTED',
      });

      expect(abortCalled).toBe(true);
      expect(endSessionCalled).toBe(true);

      findOneSpy.mockRestore();
      startSessionSpy.mockRestore();
    });

    it('Case C: commitTransaction capability failure wraps to 500 TRANSACTION_NOT_SUPPORTED', async () => {
      await createPromotedDoc('v1.1.0');
      let endSessionCount = 0;
      let abortCalled = false;

      const realStartSession = mongoose.startSession.bind(mongoose);
      const startSessionSpy = jest.spyOn(mongoose, 'startSession').mockImplementation(async (...args) => {
        const realSession = await realStartSession(...args);
        const originalCommit = realSession.commitTransaction.bind(realSession);
        realSession.commitTransaction = async () => {
          const err = new Error('prepareTransaction is not supported');
          err.code = 148;
          throw err;
        };
        const origAbort = realSession.abortTransaction.bind(realSession);
        realSession.abortTransaction = async () => {
          abortCalled = true;
          return origAbort();
        };
        const origEnd = realSession.endSession.bind(realSession);
        realSession.endSession = async () => {
          endSessionCount++;
          return origEnd();
        };
        return realSession;
      });

      await expect(
        activatePolicy({ targetVersion: 'v1.1.0', operatorId: 'op_1', referenceNow })
      ).rejects.toMatchObject({
        statusCode: 500,
        code: 'TRANSACTION_NOT_SUPPORTED',
      });

      expect(abortCalled).toBe(true);
      expect(endSessionCount).toBe(1);

      startSessionSpy.mockRestore();
    });

    it('Case D: unrelated DB/network failure preserves original error', async () => {
      await createPromotedDoc('v1.1.0');
      const realStartSession = mongoose.startSession.bind(mongoose);
      const startSessionSpy = jest.spyOn(mongoose, 'startSession').mockImplementation(async (...args) => {
        const realSession = await realStartSession(...args);
        realSession.commitTransaction = async () => {
          const err = new Error('ECONNRESET: socket hang up');
          err.code = 'ECONNRESET';
          throw err;
        };
        return realSession;
      });

      await expect(
        activatePolicy({ targetVersion: 'v1.1.0', operatorId: 'op_1', referenceNow })
      ).rejects.toThrow('ECONNRESET: socket hang up');

      startSessionSpy.mockRestore();
    });

    it('Case E: secondary abort failure is suppressed while primary error is preserved', async () => {
      await createPromotedDoc('v1.1.0');
      const realStartSession = mongoose.startSession.bind(mongoose);
      let realAbort;
      const startSessionSpy = jest.spyOn(mongoose, 'startSession').mockImplementation(async (...args) => {
        const realSession = await realStartSession(...args);
        realAbort = realSession.abortTransaction.bind(realSession);
        realSession.abortTransaction = async () => {
          throw new Error('Secondary abort failed due to connection closed');
        };
        return realSession;
      });

      const findOneSpy = jest.spyOn(OrchestrationPolicyVersion, 'findOne').mockImplementation(() => {
        return {
          session: () => {
            throw new Error('Primary database read failure');
          },
        };
      });

      try {
        await expect(
          activatePolicy({ targetVersion: 'v1.1.0', operatorId: 'op_1', referenceNow })
        ).rejects.toThrow('Primary database read failure');
      } finally {
        if (realAbort) {
          try {
            await realAbort();
          } catch (_) {}
        }
        findOneSpy.mockRestore();
        startSessionSpy.mockRestore();
      }
    });

    it('proves rollbackPolicy undergoes identical transaction capability classification', async () => {
      const v11 = await createPromotedDoc('v1.1.0');
      await activatePolicy({ targetVersion: 'v1.1.0', operatorId: 'op_1', referenceNow });

      const startSessionSpy = jest.spyOn(mongoose, 'startSession').mockImplementation(async () => {
        return {
          startTransaction: () => {
            const err = new Error('Current topology does not support sessions');
            err.name = 'MongoTransactionError';
            throw err;
          },
          abortTransaction: jest.fn(),
          endSession: jest.fn().mockResolvedValue(),
        };
      });

      await expect(
        rollbackPolicy({ targetVersion: 'v1.0.0', operatorId: 'op_rollback', referenceNow })
      ).rejects.toMatchObject({
        statusCode: 500,
        code: 'TRANSACTION_NOT_SUPPORTED',
      });

      startSessionSpy.mockRestore();
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 3. Multi-Document Transaction Execution & Single-Active Backstop
  // ───────────────────────────────────────────────────────────────────────────
  describe('3. Multi-Document Transactions: Activation and Rollback', () => {
    beforeEach(async () => {
      await seedBaseline({ operatorId: 'system', referenceNow });
    });

    const createPromotedDoc = async (version, deltaWeight = 10) => {
      const def = JSON.parse(JSON.stringify(BASELINE_POLICY));
      def.baseWeights.PREREQUISITE_REMEDIATION = 20.0 + deltaWeight;
      return OrchestrationPolicyVersion.create({
        policyVersion: version,
        policyFingerprint: generatePolicyFingerprint(def),
        status: 'promoted',
        policyDefinition: def,
        promotedBy: 'op_test',
        promotedAt: referenceNow,
        evidenceSimulationFingerprint: 'f'.repeat(64),
        evidenceArtifactSha256: 'e'.repeat(64),
        isBaseline: false,
        lifecycleEvents: [
          {
            eventType: 'PROMOTED',
            eventAt: referenceNow,
            operatorId: 'op_test',
            reason: 'Test promotion',
          },
        ],
      });
    };

    it('activates promoted policy, supersedes baseline, and maintains single active', async () => {
      await createPromotedDoc('v1.1.0', 5);

      const result = await activatePolicy({
        targetVersion: 'v1.1.0',
        operatorId: 'op_admin',
        reason: 'Upgrading to v1.1.0 for better remediation',
        referenceNow,
      });

      expect(result.idempotent).toBe(false);
      expect(result.policy.policyVersion).toBe('v1.1.0');
      expect(result.policy.status).toBe('active');

      const baselineDoc = await OrchestrationPolicyVersion.findOne({ policyVersion: 'v1.0.0' });
      expect(baselineDoc.status).toBe('superseded');
      const supersededEvent = baselineDoc.lifecycleEvents[baselineDoc.lifecycleEvents.length - 1];
      expect(supersededEvent.eventType).toBe('SUPERSEDED');
      expect(supersededEvent.reason).toBe('Upgrading to v1.1.0 for better remediation');
      expect(supersededEvent.fromPolicyVersion).toBe('v1.0.0');
      expect(supersededEvent.toPolicyVersion).toBe('v1.1.0');

      const targetDoc = await OrchestrationPolicyVersion.findOne({ policyVersion: 'v1.1.0' });
      const activatedEvent = targetDoc.lifecycleEvents[targetDoc.lifecycleEvents.length - 1];
      expect(activatedEvent.eventType).toBe('ACTIVATED');
      expect(activatedEvent.reason).toBe('Upgrading to v1.1.0 for better remediation');
      expect(activatedEvent.fromPolicyVersion).toBe('v1.0.0');
      expect(activatedEvent.toPolicyVersion).toBe('v1.1.0');

      // Verify single active invariant
      const activeCount = await OrchestrationPolicyVersion.countDocuments({ status: 'active' });
      expect(activeCount).toBe(1);
    });

    it('executes successful rollback: active becomes rolled_back and target becomes active', async () => {
      await createPromotedDoc('v1.1.0', 5);
      await activatePolicy({ targetVersion: 'v1.1.0', operatorId: 'op_1', referenceNow });

      const rollbackRes = await rollbackPolicy({
        targetVersion: 'v1.0.0',
        operatorId: 'op_rollback',
        reason: 'Regressing due to regression in pacing',
        referenceNow,
      });

      expect(rollbackRes.idempotent).toBe(false);
      expect(rollbackRes.policy.policyVersion).toBe('v1.0.0');
      expect(rollbackRes.policy.status).toBe('active');

      // Origin doc: v1.1.0 rolled_back with ROLLBACK_ORIGIN
      const originDoc = await OrchestrationPolicyVersion.findOne({ policyVersion: 'v1.1.0' });
      expect(originDoc.status).toBe('rolled_back');
      const originEvent = originDoc.lifecycleEvents[originDoc.lifecycleEvents.length - 1];
      expect(originEvent.eventType).toBe('ROLLBACK_ORIGIN');
      expect(originEvent.fromPolicyVersion).toBe('v1.1.0');
      expect(originEvent.toPolicyVersion).toBe('v1.0.0');
      expect(originEvent.reason).toBe('Regressing due to regression in pacing');

      // Target doc: v1.0.0 active with ROLLBACK_TARGET
      const targetDoc = await OrchestrationPolicyVersion.findOne({ policyVersion: 'v1.0.0' });
      expect(targetDoc.status).toBe('active');
      const targetEvent = targetDoc.lifecycleEvents[targetDoc.lifecycleEvents.length - 1];
      expect(targetEvent.eventType).toBe('ROLLBACK_TARGET');
      expect(targetEvent.fromPolicyVersion).toBe('v1.1.0');
      expect(targetEvent.toPolicyVersion).toBe('v1.0.0');
      expect(targetEvent.reason).toBe('Regressing due to regression in pacing');

      // Both events use exact same effectiveReason
      expect(originEvent.reason).toBe(targetEvent.reason);

      // Verify single active backstop
      const activeCount = await OrchestrationPolicyVersion.countDocuments({ status: 'active' });
      expect(activeCount).toBe(1);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 4. Comprehensive Rollback Matrix
  // ───────────────────────────────────────────────────────────────────────────
  describe('4. Comprehensive Rollback Eligibility Matrix', () => {
    beforeEach(async () => {
      await seedBaseline({ operatorId: 'system', referenceNow });
    });

    const createPolicy = async (version, status, lifecycleEvents = []) => {
      const def = JSON.parse(JSON.stringify(BASELINE_POLICY));
      def.baseWeights.PREREQUISITE_REMEDIATION = 20.0 + parseInt(version.replace(/\D/g, ''), 10);
      return OrchestrationPolicyVersion.create({
        policyVersion: version,
        policyFingerprint: generatePolicyFingerprint(def),
        status,
        policyDefinition: def,
        promotedBy: 'op_test',
        promotedAt: referenceNow,
        evidenceSimulationFingerprint: 'f'.repeat(64),
        evidenceArtifactSha256: 'e'.repeat(64),
        isBaseline: false,
        lifecycleEvents: lifecycleEvents.length > 0 ? lifecycleEvents : [
          {
            eventType: 'PROMOTED',
            eventAt: referenceNow,
            operatorId: 'op_test',
            reason: 'Promotion',
          },
        ],
      });
    };

    it('rejects rollback to promoted policy with no history', async () => {
      await createPolicy('v1.0.5', 'promoted');
      await expect(
        rollbackPolicy({ targetVersion: 'v1.0.5', operatorId: 'op_1', referenceNow })
      ).rejects.toMatchObject({
        statusCode: 409,
        code: 'CANNOT_ROLLBACK_TO_UNACTIVATED_POLICY',
      });
    });

    it('rejects rollback to promoted policy with fabricated ACTIVATED event', async () => {
      await createPolicy('v1.0.5', 'promoted', [
        { eventType: 'PROMOTED', eventAt: referenceNow, operatorId: 'op', reason: 'P' },
        { eventType: 'ACTIVATED', eventAt: referenceNow, operatorId: 'op', reason: 'A' },
      ]);
      await expect(
        rollbackPolicy({ targetVersion: 'v1.0.5', operatorId: 'op_1', referenceNow })
      ).rejects.toMatchObject({
        statusCode: 409,
        code: 'CANNOT_ROLLBACK_TO_UNACTIVATED_POLICY',
      });
    });

    it('rejects rollback to superseded policy with no activation history', async () => {
      await createPolicy('v1.0.5', 'superseded', [
        { eventType: 'PROMOTED', eventAt: referenceNow, operatorId: 'op', reason: 'P' },
      ]);
      await expect(
        rollbackPolicy({ targetVersion: 'v1.0.5', operatorId: 'op_1', referenceNow })
      ).rejects.toMatchObject({
        statusCode: 409,
        code: 'CANNOT_ROLLBACK_TO_UNACTIVATED_POLICY',
      });
    });

    it('rejects rollback to rolled_back policy with no activation history', async () => {
      await createPolicy('v1.0.5', 'rolled_back', [
        { eventType: 'PROMOTED', eventAt: referenceNow, operatorId: 'op', reason: 'P' },
      ]);
      await expect(
        rollbackPolicy({ targetVersion: 'v1.0.5', operatorId: 'op_1', referenceNow })
      ).rejects.toMatchObject({
        statusCode: 409,
        code: 'CANNOT_ROLLBACK_TO_UNACTIVATED_POLICY',
      });
    });

    it('rejects rollback if target is already active with 409 POLICY_ALREADY_ACTIVE', async () => {
      await expect(
        rollbackPolicy({ targetVersion: 'v1.0.0', operatorId: 'op_1', referenceNow })
      ).rejects.toMatchObject({
        statusCode: 409,
        code: 'POLICY_ALREADY_ACTIVE',
      });
    });

    it('rejects rollback if no currently active origin policy exists with 409 ACTIVE_POLICY_NOT_FOUND', async () => {
      // Simulate no active policy
      await mongoose.connection.collection('orchestrationpolicyversions').updateMany({}, { $set: { status: 'superseded' } });

      await createPolicy('v1.0.5', 'superseded', [
        { eventType: 'PROMOTED', eventAt: referenceNow, operatorId: 'op', reason: 'P' },
        { eventType: 'ACTIVATED', eventAt: referenceNow, operatorId: 'op', reason: 'A' },
      ]);

      await expect(
        rollbackPolicy({ targetVersion: 'v1.0.5', operatorId: 'op_1', referenceNow })
      ).rejects.toMatchObject({
        statusCode: 409,
        code: 'ACTIVE_POLICY_NOT_FOUND',
      });
    });

    it('rejects rollback when target version >= active version with 409 INVALID_ROLLBACK_DIRECTION', async () => {
      // Currently active is v1.0.0. Trying to rollback to v1.1.0
      await createPolicy('v1.1.0', 'superseded', [
        { eventType: 'PROMOTED', eventAt: referenceNow, operatorId: 'op', reason: 'P' },
        { eventType: 'ACTIVATED', eventAt: referenceNow, operatorId: 'op', reason: 'A' },
      ]);

      await expect(
        rollbackPolicy({ targetVersion: 'v1.1.0', operatorId: 'op_1', referenceNow })
      ).rejects.toMatchObject({
        statusCode: 409,
        code: 'INVALID_ROLLBACK_DIRECTION',
      });
    });

    it('permits rollback to superseded target with ACTIVATED event and valid SemVer direction', async () => {
      // Setup: v1.0.0 baseline active. Promote and activate v1.2.0. v1.0.0 is superseded with ACTIVATED in history.
      await createPolicy('v1.2.0', 'promoted');
      await activatePolicy({ targetVersion: 'v1.2.0', operatorId: 'op_1', referenceNow });

      // Rollback from v1.2.0 to v1.0.0
      const res = await rollbackPolicy({ targetVersion: 'v1.0.0', operatorId: 'op_rb', referenceNow });
      expect(res.policy.policyVersion).toBe('v1.0.0');
      expect(res.policy.status).toBe('active');
    });

    it('permits rollback to rolled_back target with ROLLBACK_TARGET event in history', async () => {
      // Setup: v1.0.0 -> v1.2.0 -> rollback to v1.0.0 -> activate v1.3.0 -> rollback to v1.2.0 (which was rolled_back)
      await createPolicy('v1.2.0', 'promoted');
      await activatePolicy({ targetVersion: 'v1.2.0', operatorId: 'op_1', referenceNow });
      await rollbackPolicy({ targetVersion: 'v1.0.0', operatorId: 'op_rb1', referenceNow });

      // Now v1.2.0 has status 'rolled_back' and has ACTIVATED event.
      // Activate v1.3.0
      await createPolicy('v1.3.0', 'promoted');
      await activatePolicy({ targetVersion: 'v1.3.0', operatorId: 'op_1', referenceNow });

      // Rollback to v1.2.0 (status was rolled_back, SemVer: v1.2.0 < v1.3.0)
      const res = await rollbackPolicy({ targetVersion: 'v1.2.0', operatorId: 'op_rb2', referenceNow });
      expect(res.policy.policyVersion).toBe('v1.2.0');
      expect(res.policy.status).toBe('active');
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 5. Optional Reason Normalization Across Activation & Rollback
  // ───────────────────────────────────────────────────────────────────────────
  describe('5. Optional-Reason Normalization Matrix', () => {
    beforeEach(async () => {
      await seedBaseline({ operatorId: 'system', referenceNow });
    });

    const createPromoted = async (version) => {
      const def = JSON.parse(JSON.stringify(BASELINE_POLICY));
      def.baseWeights.PREREQUISITE_REMEDIATION = 20.0 + parseInt(version.replace(/\D/g, ''), 10);
      return OrchestrationPolicyVersion.create({
        policyVersion: version,
        policyFingerprint: generatePolicyFingerprint(def),
        status: 'promoted',
        policyDefinition: def,
        promotedBy: 'op_test',
        promotedAt: referenceNow,
        evidenceSimulationFingerprint: 'f'.repeat(64),
        evidenceArtifactSha256: 'e'.repeat(64),
        isBaseline: false,
        lifecycleEvents: [
          {
            eventType: 'PROMOTED',
            eventAt: referenceNow,
            operatorId: 'op_test',
            reason: 'Promotion',
          },
        ],
      });
    };

    it('A. activatePolicy with explicit reason trims and persists same value on SUPERSEDED and ACTIVATED', async () => {
      await createPromoted('v1.1.0');
      await activatePolicy({
        targetVersion: 'v1.1.0',
        operatorId: 'op_admin',
        reason: '   Custom activation rationale   ',
        referenceNow,
      });

      const oldDoc = await OrchestrationPolicyVersion.findOne({ policyVersion: 'v1.0.0' });
      const newDoc = await OrchestrationPolicyVersion.findOne({ policyVersion: 'v1.1.0' });

      const superseded = oldDoc.lifecycleEvents[oldDoc.lifecycleEvents.length - 1];
      const activated = newDoc.lifecycleEvents[newDoc.lifecycleEvents.length - 1];

      expect(superseded.reason).toBe('Custom activation rationale');
      expect(activated.reason).toBe('Custom activation rationale');
    });

    it('B. activatePolicy with omitted reason uses canonical default "Policy activation" on both events', async () => {
      await createPromoted('v1.1.0');
      await activatePolicy({
        targetVersion: 'v1.1.0',
        operatorId: 'op_admin',
        // reason omitted
        referenceNow,
      });

      const oldDoc = await OrchestrationPolicyVersion.findOne({ policyVersion: 'v1.0.0' });
      const newDoc = await OrchestrationPolicyVersion.findOne({ policyVersion: 'v1.1.0' });

      const superseded = oldDoc.lifecycleEvents[oldDoc.lifecycleEvents.length - 1];
      const activated = newDoc.lifecycleEvents[newDoc.lifecycleEvents.length - 1];

      expect(superseded.reason).toBe('Policy activation');
      expect(activated.reason).toBe('Policy activation');
    });

    it('C. rollbackPolicy with explicit reason trims and persists same value on ROLLBACK_ORIGIN and ROLLBACK_TARGET', async () => {
      await createPromoted('v1.1.0');
      await activatePolicy({ targetVersion: 'v1.1.0', operatorId: 'op', referenceNow });

      await rollbackPolicy({
        targetVersion: 'v1.0.0',
        operatorId: 'op_admin',
        reason: '  Explicit rollback explanation  ',
        referenceNow,
      });

      const origin = await OrchestrationPolicyVersion.findOne({ policyVersion: 'v1.1.0' });
      const target = await OrchestrationPolicyVersion.findOne({ policyVersion: 'v1.0.0' });

      const originEv = origin.lifecycleEvents[origin.lifecycleEvents.length - 1];
      const targetEv = target.lifecycleEvents[target.lifecycleEvents.length - 1];

      expect(originEv.reason).toBe('Explicit rollback explanation');
      expect(targetEv.reason).toBe('Explicit rollback explanation');
    });

    it('D. rollbackPolicy with omitted reason uses canonical default "Policy rollback" on both events', async () => {
      await createPromoted('v1.1.0');
      await activatePolicy({ targetVersion: 'v1.1.0', operatorId: 'op', referenceNow });

      await rollbackPolicy({
        targetVersion: 'v1.0.0',
        operatorId: 'op_admin',
        // reason omitted
        referenceNow,
      });

      const origin = await OrchestrationPolicyVersion.findOne({ policyVersion: 'v1.1.0' });
      const target = await OrchestrationPolicyVersion.findOne({ policyVersion: 'v1.0.0' });

      const originEv = origin.lifecycleEvents[origin.lifecycleEvents.length - 1];
      const targetEv = target.lifecycleEvents[target.lifecycleEvents.length - 1];

      expect(originEv.reason).toBe('Policy rollback');
      expect(targetEv.reason).toBe('Policy rollback');
    });

    it('E & F. empty string and whitespace-only reasons fallback to deterministic operation defaults', async () => {
      expect(normalizeGovernanceReason({ reason: '', isRollback: false })).toBe('Policy activation');
      expect(normalizeGovernanceReason({ reason: '   ', isRollback: false })).toBe('Policy activation');
      expect(normalizeGovernanceReason({ reason: '', isRollback: true })).toBe('Policy rollback');
      expect(normalizeGovernanceReason({ reason: '\t\n ', isRollback: true })).toBe('Policy rollback');
      expect(normalizeGovernanceReason({ reason: null, isRollback: false })).toBe('Policy activation');
      expect(normalizeGovernanceReason({ reason: undefined, isRollback: true })).toBe('Policy rollback');
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 6. Phase 9 Runtime Policy Governance & 13 Dimensions
  // ───────────────────────────────────────────────────────────────────────────
  describe('6. Phase 9 Runtime Governance & 13 Governed Dimensions', () => {
    it('returns deep-frozen CODE_BASELINE snapshot when baseline is active', async () => {
      await seedBaseline({ operatorId: 'sys', referenceNow });
      const snapshot = await resolveActivePolicySnapshot(referenceNow);

      expect(snapshot.source).toBe('CODE_BASELINE');
      expect(snapshot.policyVersion).toBe('v1.0.0');
      expect(Object.isFrozen(snapshot)).toBe(true);
      expect(Object.isFrozen(snapshot.policyDefinition)).toBe(true);
      expect(Object.isFrozen(snapshot.policyDefinition.baseWeights)).toBe(true);
      expect(Object.isFrozen(snapshot.policyDefinition.priorityThresholds)).toBe(true);

      // Attempting mutation must fail or throw in strict mode
      expect(() => {
        snapshot.policyVersion = 'v9.9.9';
      }).toThrow();
    });

    it('returns GOVERNED_POLICY snapshot when promoted policy is activated', async () => {
      await seedBaseline({ operatorId: 'sys', referenceNow });
      const def = JSON.parse(JSON.stringify(BASELINE_POLICY));
      def.baseWeights.PREREQUISITE_REMEDIATION = 30.0;
      await OrchestrationPolicyVersion.create({
        policyVersion: 'v1.1.0',
        policyFingerprint: generatePolicyFingerprint(def),
        status: 'promoted',
        policyDefinition: def,
        promotedBy: 'op',
        promotedAt: referenceNow,
        evidenceSimulationFingerprint: 'f'.repeat(64),
        evidenceArtifactSha256: 'e'.repeat(64),
        isBaseline: false,
        lifecycleEvents: [{ eventType: 'PROMOTED', eventAt: referenceNow, operatorId: 'op', reason: 'p' }],
      });
      await activatePolicy({ targetVersion: 'v1.1.0', operatorId: 'op', referenceNow });

      const snapshot = await resolveActivePolicySnapshot(referenceNow);
      expect(snapshot.source).toBe('GOVERNED_POLICY');
      expect(snapshot.policyVersion).toBe('v1.1.0');
      expect(snapshot.policyDefinition.baseWeights.PREREQUISITE_REMEDIATION).toBe(30.0);
    });

    it('returns CODE_BASELINE_FALLBACK when policy registry is empty/unseeded', async () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      const snapshot = await resolveActivePolicySnapshot(referenceNow);

      expect(snapshot.source).toBe('CODE_BASELINE_FALLBACK');
      expect(snapshot.policyVersion).toBe('v1.0.0');
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('POLICY_REGISTRY_UNSEEDED_FALLBACK')
      );
      warnSpy.mockRestore();
    });

    it('returns CODE_BASELINE_FALLBACK when database query throws error', async () => {
      const findOneSpy = jest.spyOn(OrchestrationPolicyVersion, 'findOne').mockImplementation(() => {
        throw new Error('Connection pool exhausted');
      });
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      const snapshot = await resolveActivePolicySnapshot(referenceNow);
      expect(snapshot.source).toBe('CODE_BASELINE_FALLBACK');
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('POLICY_REGISTRY_QUERY_FAILURE_FALLBACK')
      );

      findOneSpy.mockRestore();
      warnSpy.mockRestore();
    });

    it('proves all 13 governed dimensions correctly alter urgency calculation and tiers', () => {
      const customSnapshot = {
        policyVersion: 'v1.1.0',
        policyFingerprint: 'a'.repeat(64),
        source: 'GOVERNED_POLICY',
        policyDefinition: {
          baseWeights: {
            PREREQUISITE_REMEDIATION: 40.0,
            OVERDUE_REVISION: 30.0,
            DUE_TODAY_REVISION: 25.0,
            CURRICULUM_ADVANCEMENT: 15.0,
            EXAM_BENCHMARK: 12.0,
            PACING_CALIBRATION: 8.0,
          },
          maxMasteryDeficitWeight: 20.0,
          maxGoalImpactWeight: 15.0,
          maxTemporalWeight: 10.0,
          priorityThresholds: {
            critical: 85,
            urgent: 65,
            high: 45,
            normal: 20,
          },
        },
      };

      const result = urgencyScoringService.calculateUrgencyScore({
        actionType: 'PREREQUISITE_REMEDIATION',
        masteryScore: 0.3,
        goalImpact: 0.8,
        referenceNow,
        policySnapshot: customSnapshot,
      });

      expect(result.urgencyScore).toBeGreaterThan(0);
      expect(result.priorityTier).toBeDefined();
    });

    it('normalizes priority thresholds bridging uppercase legacy and lowercase governed', () => {
      expect(normalizePriorityThresholds()).toEqual(DEFAULT_PRIORITY_THRESHOLDS);

      const legacyUpper = { CRITICAL: 90, URGENT: 75, HIGH: 50, NORMAL: 25 };
      expect(normalizePriorityThresholds(legacyUpper)).toEqual({
        critical: 90,
        urgent: 75,
        high: 50,
        normal: 25,
      });

      const governedLower = { critical: 80, urgent: 60, high: 40, normal: 20 };
      expect(normalizePriorityThresholds(governedLower)).toEqual(governedLower);
    });

    it('returns "normal" tier for invalid or non-finite urgency score', () => {
      expect(getPriorityTier(null)).toBe('normal');
      expect(getPriorityTier(undefined)).toBe('normal');
      expect(getPriorityTier(NaN)).toBe('normal');
      expect(getPriorityTier(Infinity)).toBe('normal');
      expect(getPriorityTier(-Infinity)).toBe('normal');
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 7. Phase 10 Same-Call Provenance & Stamping
  // ───────────────────────────────────────────────────────────────────────────
  describe('7. Phase 10 Same-Call Provenance Issuance', () => {
    beforeEach(async () => {
      await seedBaseline({ operatorId: 'sys', referenceNow });
    });

    it('stamps policyVersion, policyFingerprint, and policySource on PrescriptionExecutionRecord from next_action', async () => {
      const userId = 'usr_test_integ_p10';
      const idempotencyKey = `idemp_next_${Date.now()}`;

      // Stub nextActionArbiter to return action + provenance
      const mockAction = {
        actionId: 'action_rec_1',
        actionType: 'PREREQUISITE_REMEDIATION',
        actionSubtype: 'FOUNDATIONAL_PREREQUISITE',
        priorityTier: 'critical',
        prescribedQuestions: 5,
        topic: 'quantitative-aptitude',
        pattern: 'percentages',
        blockedTarget: {
          topic: 'quantitative-aptitude',
          pattern: 'profit-and-loss',
        },
        urgencyScore: 88,
      };
      const mockProvenance = {
        policyVersion: 'v1.0.0',
        policyFingerprint: generatePolicyFingerprint(BASELINE_POLICY),
        policySource: 'CODE_BASELINE',
      };

      const spyNext = jest.spyOn(nextActionArbiter, 'getNextAction').mockResolvedValue({
        nextAction: mockAction,
        policyProvenance: mockProvenance,
      });

      const issuance = await attributionIssuanceService.issuePrescription({
        userId,
        originSurface: 'next_action',
        idempotencyKey,
        referenceNow,
      });

      expect(issuance.data).toBeDefined();

      const record = await PrescriptionExecutionRecord.findOne({ issuanceIdempotencyKey: idempotencyKey });
      expect(record).not.toBeNull();
      expect(record.policyVersion).toBe('v1.0.0');
      expect(record.policyFingerprint).toBe(mockProvenance.policyFingerprint);
      expect(record.policySource).toBe('CODE_BASELINE');

      spyNext.mockRestore();
    });

    it('stamps policyProvenance on PrescriptionExecutionRecord from daily_agenda', async () => {
      const userId = 'usr_test_integ_p10';
      const idempotencyKey = `idemp_agenda_${Date.now()}`;

      const mockAgenda = {
        agenda: {
          segments: [
            {
              segmentType: 'CORE',
              activities: [
                {
                  actionId: 'agenda_act_1',
                  actionType: 'PREREQUISITE_REMEDIATION',
                  actionSubtype: 'FOUNDATIONAL_PREREQUISITE',
                  priorityTier: 'critical',
                  prescribedQuestions: 5,
                  topic: 'quantitative-aptitude',
                  pattern: 'percentages',
                  blockedTarget: {
                    topic: 'quantitative-aptitude',
                    pattern: 'profit-and-loss',
                  },
                },
              ],
            },
          ],
        },
        policyProvenance: {
          policyVersion: 'v1.0.0',
          policyFingerprint: generatePolicyFingerprint(BASELINE_POLICY),
          policySource: 'CODE_BASELINE',
        },
      };

      const spyAgenda = jest.spyOn(dailyAgendaAssembler, 'getDailyAgenda').mockResolvedValue(mockAgenda);

      const issuance = await attributionIssuanceService.issuePrescription({
        userId,
        originSurface: 'daily_agenda',
        actionId: 'agenda_act_1',
        idempotencyKey,
        referenceNow,
      });

      expect(issuance.data).toBeDefined();

      const record = await PrescriptionExecutionRecord.findOne({ issuanceIdempotencyKey: idempotencyKey });
      expect(record.policyVersion).toBe('v1.0.0');
      expect(record.policySource).toBe('CODE_BASELINE');

      spyAgenda.mockRestore();
    });

    it('accepts paired candidateAction and policyProvenance programmatic override', async () => {
      const userId = 'usr_test_integ_p10';
      const idempotencyKey = `idemp_prog_${Date.now()}`;

      const candidateAction = {
        actionId: 'prog_act_1',
        actionType: 'PREREQUISITE_REMEDIATION',
        actionSubtype: 'FOUNDATIONAL_PREREQUISITE',
        priorityTier: 'critical',
        prescribedQuestions: 5,
        topic: 'quantitative-aptitude',
        pattern: 'percentages',
        blockedTarget: {
          topic: 'quantitative-aptitude',
          pattern: 'profit-and-loss',
        },
      };
      const policyProvenance = {
        policyVersion: 'v1.0.0',
        policyFingerprint: generatePolicyFingerprint(BASELINE_POLICY),
        policySource: 'CODE_BASELINE',
      };

      const issuance = await attributionIssuanceService.issuePrescription({
        userId,
        candidateAction,
        policyProvenance,
        originSurface: 'next_action',
        idempotencyKey,
        referenceNow,
      });

      expect(issuance.data).toBeDefined();
      const record = await PrescriptionExecutionRecord.findOne({ issuanceIdempotencyKey: idempotencyKey });
      expect(record.policyVersion).toBe('v1.0.0');
      expect(record.policySource).toBe('CODE_BASELINE');
    });

    it('rejects candidateAction programmatic override without policyProvenance with 400 VALIDATION_ERROR', async () => {
      const userId = new mongoose.Types.ObjectId().toString();
      const candidateAction = {
        actionId: 'prog_act_orphan',
        actionType: 'CURRICULUM_ADVANCEMENT',
      };

      await expect(
        attributionIssuanceService.issuePrescription({
          userId,
          candidateAction,
          // policyProvenance omitted
          originSurface: 'next_action',
          idempotencyKey: `idemp_err_${Date.now()}`,
          referenceNow,
        })
      ).rejects.toMatchObject({
        statusCode: 400,
        code: 'VALIDATION_ERROR',
        message: expect.stringContaining('Programmatic candidateAction requires accompanying policyProvenance.'),
      });
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 8. Public Phase 9 HTTP DTO Provenance Concealment
  // ───────────────────────────────────────────────────────────────────────────
  describe('8. Public DTO Provenance Concealment Invariance', () => {
    it('proves orchestrationController strips policyProvenance from next_action HTTP response', async () => {
      const req = {
        orchestrationContext: { referenceNow: new Date('2026-10-10T12:00:00.000Z') },
        studentId: new mongoose.Types.ObjectId().toString(),
        query: {},
      };
      let sentJson = null;
      let sentStatus = null;
      const res = {
        status: (code) => {
          sentStatus = code;
          return res;
        },
        json: (payload) => {
          sentJson = payload;
          return res;
        },
      };

      const spyNext = jest.spyOn(nextActionArbiter, 'getNextAction').mockResolvedValue({
        nextAction: {
          actionId: 'act_pub_1',
          actionType: 'PREREQUISITE_REMEDIATION',
          targetTopicId: 'topic_1',
        },
        policyProvenance: {
          policyVersion: 'v1.0.0',
          policyFingerprint: 'a'.repeat(64),
          policySource: 'CODE_BASELINE',
        },
      });

      await orchestrationController.handleGetNextAction(req, res, (err) => {
        if (err) throw err;
      });

      expect(sentStatus).toBe(200);
      expect(sentJson.success).toBe(true);
      expect(sentJson.data.nextAction).toBeDefined();
      expect(sentJson.data.policyProvenance).toBeUndefined();
      expect(sentJson.policyProvenance).toBeUndefined();

      spyNext.mockRestore();
    });

    it('proves orchestrationController strips policyProvenance from daily_agenda HTTP response', async () => {
      const req = {
        orchestrationContext: { referenceNow: new Date('2026-10-10T12:00:00.000Z') },
        studentId: new mongoose.Types.ObjectId().toString(),
        query: {},
      };
      let sentJson = null;
      const res = {
        status: () => res,
        json: (payload) => {
          sentJson = payload;
          return res;
        },
      };

      const spyAgenda = jest.spyOn(dailyAgendaAssembler, 'getDailyAgenda').mockResolvedValue({
        agenda: { date: '2026-10-10', items: [] },
        policyProvenance: {
          policyVersion: 'v1.0.0',
          policyFingerprint: 'a'.repeat(64),
          policySource: 'CODE_BASELINE',
        },
      });

      await orchestrationController.handleGetDailyAgenda(req, res, (err) => {
        if (err) throw err;
      });

      expect(sentJson.success).toBe(true);
      expect(sentJson.data.policyProvenance).toBeUndefined();
      expect(sentJson.policyProvenance).toBeUndefined();

      spyAgenda.mockRestore();
    });

    it('proves orchestrationController strips policyProvenance from interventions HTTP response', async () => {
      const req = {
        orchestrationContext: { referenceNow: new Date('2026-10-10T12:00:00.000Z') },
        studentId: new mongoose.Types.ObjectId().toString(),
        query: {},
      };
      let sentJson = null;
      const res = {
        status: () => res,
        json: (payload) => {
          sentJson = payload;
          return res;
        },
      };

      const spyInterventions = jest.spyOn(interventionPolicyService, 'getInterventions').mockResolvedValue({
        interventions: [],
        policyProvenance: {
          policyVersion: 'v1.0.0',
          policyFingerprint: 'a'.repeat(64),
          policySource: 'CODE_BASELINE',
        },
      });

      await orchestrationController.handleGetInterventions(req, res, (err) => {
        if (err) throw err;
      });

      expect(sentJson.success).toBe(true);
      expect(sentJson.data.policyProvenance).toBeUndefined();
      expect(sentJson.policyProvenance).toBeUndefined();

      spyInterventions.mockRestore();
    });
  });
});
