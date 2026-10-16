'use strict';

/**
 * Phase 11 Suite 5: Benchmark Cohort Simulation Tests
 *
 * Verifies user ID normalization, query deduplication, 1..50 bounds enforcement,
 * +1 sentinel probe, deterministic multi-user merge, and minimum historical data gate.
 */

const PrescriptionExecutionRecord = require('../../src/models/prescriptionExecutionRecordModel');
const {
  loadHistoricalCohortRecords,
  normalizeUserIds,
} = require('../../src/services/simulation/cohortSimulationService');
const { runPolicySimulation } = require('../../src/services/simulation/policySimulationService');
const {
  SIMULATION_MODES,
  BASELINE_POLICY,
} = require('../../src/config/simulationConfig');
const { validateCandidatePolicy } = require('../../src/services/simulation/policyValidationService');

describe('Suite 5: Benchmark Cohort Simulation Tests', () => {
  const referenceNow = new Date('2026-10-09T12:00:00.000Z');

  describe('1. User ID Normalization & Cohort Deduplication', () => {
    it('trims whitespace, filters empty strings, deduplicates, and sorts lexicographically', () => {
      const rawUserIds = ['  userB  ', 'userA', '', '   ', 'userB', 'userA', 'userC '];
      const normalized = normalizeUserIds(rawUserIds);

      expect(normalized).toEqual(['userA', 'userB', 'userC']);
    });

    it('enforces 1 <= normalizedUserIds.length <= 50', async () => {
      // Empty user list
      await expect(
        loadHistoricalCohortRecords({
          userIds: ['  ', ''],
          referenceNow,
        })
      ).rejects.toThrow(/EMPTY_USER_LIST/);

      // Over 50 unique users
      const tooMany = Array.from({ length: 51 }, (_, i) => `user_${String(i).padStart(3, '0')}`);
      await expect(
        loadHistoricalCohortRecords({
          userIds: tooMany,
          referenceNow,
        })
      ).rejects.toThrow(/TOO_MANY_USERS/);
    });

    it('issues at most one query per normalized unique user regardless of input duplicates', async () => {
      const findSpy = jest.spyOn(PrescriptionExecutionRecord, 'find').mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]),
      });

      const duplicateInput = ['userB', 'userA', 'userB', 'userA', 'userB'];
      await loadHistoricalCohortRecords({
        userIds: duplicateInput,
        referenceNow,
      });

      // Exactly 2 queries should be executed (for userA and userB)
      expect(findSpy).toHaveBeenCalledTimes(2);

      const queriedUsers = findSpy.mock.calls.map((call) => call[0].userId);
      expect(queriedUsers).toEqual(['userA', 'userB']);

      findSpy.mockRestore();
    });
  });

  describe('2. Sentinel Probing & Truncation Detection', () => {
    it('sets isTruncated = true and isExhaustive = false when a user returns limit + 1 sentinel record', async () => {
      // For 1 user, perUserLimit = 1000, probeLimit = 1001.
      // Simulate probe returning 1001 items.
      const fakeRecords = Array.from({ length: 1001 }, (_, i) => ({
        _id: `id_${i}`,
        userId: 'userA',
        issuedAt: new Date(Date.now() - i * 1000),
      }));

      const findSpy = jest.spyOn(PrescriptionExecutionRecord, 'find').mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(fakeRecords),
      });

      const result = await loadHistoricalCohortRecords({
        userIds: ['userA'],
        referenceNow,
      });

      expect(result.records.length).toBe(1000); // Sliced to limit
      expect(result.isTruncated).toBe(true);
      expect(result.isExhaustive).toBe(false);

      findSpy.mockRestore();
    });

    it('sets isTruncated = false and isExhaustive = true when no user exceeds limit', async () => {
      const fakeRecords = Array.from({ length: 5 }, (_, i) => ({
        _id: `id_${i}`,
        userId: 'userA',
        issuedAt: new Date(Date.now() - i * 1000),
      }));

      const findSpy = jest.spyOn(PrescriptionExecutionRecord, 'find').mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(fakeRecords),
      });

      const result = await loadHistoricalCohortRecords({
        userIds: ['userA'],
        referenceNow,
      });

      expect(result.records.length).toBe(5);
      expect(result.isTruncated).toBe(false);
      expect(result.isExhaustive).toBe(true);

      findSpy.mockRestore();
    });
  });

  describe('3. Deterministic Merge Ordering', () => {
    it('sorts merged records across users by issuedAt DESC => userId ASC => _id ASC', async () => {
      const recordsUserA = [
        { _id: 'rec_2', userId: 'userA', issuedAt: new Date('2026-09-01T12:00:00Z') },
        { _id: 'rec_1', userId: 'userA', issuedAt: new Date('2026-09-02T12:00:00Z') },
      ];
      const recordsUserB = [
        { _id: 'rec_3', userId: 'userB', issuedAt: new Date('2026-09-02T12:00:00Z') }, // Same issuedAt as rec_1
        { _id: 'rec_4', userId: 'userB', issuedAt: new Date('2026-09-01T08:00:00Z') },
      ];

      const findSpy = jest.spyOn(PrescriptionExecutionRecord, 'find');
      findSpy.mockImplementation((filter) => ({
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(filter.userId === 'userA' ? recordsUserA : recordsUserB),
      }));

      const result = await loadHistoricalCohortRecords({
        userIds: ['userB', 'userA'],
        referenceNow,
      });

      // Expected order:
      // 1. 2026-09-02: userA rec_1 precedes userB rec_3 (issuedAt same, userA < userB)
      // 2. 2026-09-02: userB rec_3
      // 3. 2026-09-01T12: userA rec_2
      // 4. 2026-09-01T08: userB rec_4
      expect(result.records.map((r) => r._id)).toEqual(['rec_1', 'rec_3', 'rec_2', 'rec_4']);

      findSpy.mockRestore();
    });
  });

  describe('4. Minimum Historical Data Gate (>= 5 Records)', () => {
    it('throws INSUFFICIENT_HISTORICAL_DATA when fewer than 5 historical records exist for historical mode', async () => {
      const findSpy = jest.spyOn(PrescriptionExecutionRecord, 'find').mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([
          { _id: 'r1', userId: 'u1', issuedAt: new Date() },
          { _id: 'r2', userId: 'u1', issuedAt: new Date() },
        ]), // Only 2 records, minimum is 5
      });

      const candidatePolicy = validateCandidatePolicy({
        simulationOnly: true,
        baseWeights: { ...BASELINE_POLICY.baseWeights, PREREQUISITE_REMEDIATION: 52.0 },
        maxMasteryDeficitWeight: 25.0,
        maxGoalImpactWeight: 15.0,
        maxTemporalWeight: 10.0,
        priorityThresholds: { ...BASELINE_POLICY.priorityThresholds },
      });

      await expect(
        runPolicySimulation({
          mode: SIMULATION_MODES.MODE_A,
          candidatePolicies: [candidatePolicy],
          userIds: ['u1'],
          referenceNow,
        })
      ).rejects.toThrow(/INSUFFICIENT_HISTORICAL_DATA/);

      findSpy.mockRestore();
    });

    it('allows Mode B to execute successfully with 0 historical records and zero queries', async () => {
      const findSpy = jest.spyOn(PrescriptionExecutionRecord, 'find');

      const candidatePolicy = validateCandidatePolicy({
        simulationOnly: true,
        baseWeights: { ...BASELINE_POLICY.baseWeights, CURRICULUM_ADVANCEMENT: 32.0 },
        maxMasteryDeficitWeight: 25.0,
        maxGoalImpactWeight: 15.0,
        maxTemporalWeight: 10.0,
        priorityThresholds: { ...BASELINE_POLICY.priorityThresholds },
      });

      const report = await runPolicySimulation({
        mode: SIMULATION_MODES.MODE_B,
        candidatePolicies: [candidatePolicy],
        userIds: [], // 0 userIds
        referenceNow,
      });

      expect(findSpy).not.toHaveBeenCalled();
      expect(report.mode).toBe('ARCHETYPE_POLICY_COMPARISON');
      expect(report.syntheticArchetypeAnalysis).toBeDefined();
      expect(report.historicalSensitivityAnalysis).toBeNull();
      expect(report.datasetSummary).toBeNull();

      findSpy.mockRestore();
    });
  });
});
