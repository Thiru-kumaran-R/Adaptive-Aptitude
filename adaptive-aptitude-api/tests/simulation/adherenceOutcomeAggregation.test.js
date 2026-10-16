'use strict';

/**
 * Phase 11 Suite 4: Adherence Outcome Aggregation Tests
 *
 * Verifies in-memory effective expiry resolution, resolved adherence denominator,
 * milestone evaluation exclusion, and non-causal candidate isolation.
 */

const {
  resolveEffectiveStatus,
  aggregateAdherenceOutcomes,
} = require('../../src/services/simulation/adherenceOutcomeAggregationService');

describe('Suite 4: Adherence Outcome Aggregation Tests', () => {
  const referenceNow = new Date('2026-10-09T12:00:00.000Z');

  describe('1. In-Memory Effective Expiry Resolution', () => {
    it('leaves unexpired issued and active records unchanged', () => {
      const issuedUnexpired = {
        status: 'issued',
        expiresAt: new Date('2026-10-10T00:00:00.000Z'), // Future
      };
      const activeUnexpired = {
        status: 'active',
        expiresAt: new Date('2026-10-10T00:00:00.000Z'), // Future
      };

      expect(resolveEffectiveStatus(issuedUnexpired, referenceNow)).toBe('issued');
      expect(resolveEffectiveStatus(activeUnexpired, referenceNow)).toBe('active');
    });

    it('resolves both issued and active states to expired when referenceNow >= expiresAt', () => {
      const issuedExpired = {
        status: 'issued',
        expiresAt: new Date('2026-10-08T00:00:00.000Z'), // Past
      };
      const activeExpired = {
        status: 'active',
        expiresAt: new Date('2026-10-09T12:00:00.000Z'), // Exact match
      };

      expect(resolveEffectiveStatus(issuedExpired, referenceNow)).toBe('expired');
      expect(resolveEffectiveStatus(activeExpired, referenceNow)).toBe('expired');
    });

    it('preserves all terminal states immutably even if past expiresAt', () => {
      const past = new Date('2026-10-01T00:00:00.000Z');
      expect(resolveEffectiveStatus({ status: 'completed', expiresAt: past }, referenceNow)).toBe('completed');
      expect(resolveEffectiveStatus({ status: 'abandoned', expiresAt: past }, referenceNow)).toBe('abandoned');
      expect(resolveEffectiveStatus({ status: 'superseded', expiresAt: past }, referenceNow)).toBe('superseded');
      expect(resolveEffectiveStatus({ status: 'expired', expiresAt: past }, referenceNow)).toBe('expired');
    });
  });

  describe('2. Execution Adherence Formula', () => {
    it('calculates adherence rate over resolved records and excludes unexpired items', () => {
      const records = [
        // 2 Completed
        { status: 'completed', expiresAt: new Date('2026-10-01Z') },
        { status: 'completed', expiresAt: new Date('2026-10-01Z') },
        // 1 Abandoned
        { status: 'abandoned', expiresAt: new Date('2026-10-01Z') },
        // 1 Superseded
        { status: 'superseded', expiresAt: new Date('2026-10-01Z') },
        // 1 Effectively expired issued
        { status: 'issued', expiresAt: new Date('2026-10-01Z') },
        // 1 Unexpired issued (excluded from resolved denominator)
        { status: 'issued', expiresAt: new Date('2026-10-20Z') },
        // 1 Unexpired active (excluded from resolved denominator)
        { status: 'active', expiresAt: new Date('2026-10-20Z') },
      ];

      const summary = aggregateAdherenceOutcomes({ records, referenceNow });

      expect(summary.totalRecords).toBe(7);
      // Resolved: 2 completed + 1 abandoned + 1 superseded + 1 expired = 5
      expect(summary.resolvedCount).toBe(5);
      expect(summary.unresolvedCount).toBe(2);
      expect(summary.statusCounts.completed).toBe(2);
      expect(summary.statusCounts.abandoned).toBe(1);
      expect(summary.statusCounts.superseded).toBe(1);
      expect(summary.statusCounts.expired).toBe(1);
      expect(summary.statusCounts.issued).toBe(1);
      expect(summary.statusCounts.active).toBe(1);

      // Adherence rate: 2 / 5 = 0.40
      expect(summary.executionAdherenceRate).toBe(0.40);
    });

    it('returns null executionAdherenceRate when resolvedCount is zero', () => {
      const records = [
        { status: 'issued', expiresAt: new Date('2026-10-20Z') },
        { status: 'active', expiresAt: new Date('2026-10-20Z') },
      ];

      const summary = aggregateAdherenceOutcomes({ records, referenceNow });
      expect(summary.resolvedCount).toBe(0);
      expect(summary.executionAdherenceRate).toBeNull();
    });
  });

  describe('3. Milestone Success Rate & Null Exclusion', () => {
    it('evaluates milestoneSuccessRate strictly excluding null milestone targets', () => {
      const records = [
        {
          status: 'completed',
          outcomeSnapshot: { targetMilestoneMet: true },
        },
        {
          status: 'completed',
          outcomeSnapshot: { targetMilestoneMet: false },
        },
        {
          status: 'completed',
          outcomeSnapshot: { targetMilestoneMet: null }, // unfinalized pacing/mock, excluded
        },
        {
          status: 'completed',
          outcomeSnapshot: {}, // missing, excluded
        },
      ];

      const summary = aggregateAdherenceOutcomes({ records, referenceNow });

      expect(summary.milestoneEvaluatedCount).toBe(2);
      expect(summary.milestoneMetCount).toBe(1);
      expect(summary.milestoneSuccessRate).toBe(0.50);
    });

    it('returns null milestoneSuccessRate when milestoneEvaluatedCount is zero', () => {
      const records = [
        {
          status: 'completed',
          outcomeSnapshot: { targetMilestoneMet: null },
        },
      ];

      const summary = aggregateAdherenceOutcomes({ records, referenceNow });
      expect(summary.milestoneEvaluatedCount).toBe(0);
      expect(summary.milestoneSuccessRate).toBeNull();
    });
  });

  describe('4. Action Type Distribution & Non-Causal Neutrality', () => {
    it('accurately tallies actionTypeCounts without attributing causality to candidate policies', () => {
      const records = [
        { status: 'completed', actionType: 'PREREQUISITE_REMEDIATION' },
        { status: 'completed', actionType: 'CURRICULUM_ADVANCEMENT' },
        { status: 'abandoned', actionType: 'CURRICULUM_ADVANCEMENT' },
      ];

      const summary = aggregateAdherenceOutcomes({ records, referenceNow });

      expect(summary.actionTypeCounts['PREREQUISITE_REMEDIATION']).toBe(1);
      expect(summary.actionTypeCounts['CURRICULUM_ADVANCEMENT']).toBe(2);
    });
  });
});
