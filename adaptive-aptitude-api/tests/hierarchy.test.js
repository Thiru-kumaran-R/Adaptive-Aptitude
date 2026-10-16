'use strict';

/**
 * tests/hierarchy.test.js
 *
 * Prerequisite DAG validation tests.
 * No database connection required — works from registry JSON.
 *
 * Verifies:
 *  - 278 total patterns
 *  - 218 patterns with prerequisites
 *  - 60 foundational patterns
 *  - 410 prerequisite edges
 *  - 0 invalid prerequisite references
 *  - 0 self-references
 *  - 0 cycles
 */

const { validatePrerequisiteDAG, getPrerequisiteEdges, getPrerequisites } =
  require('../src/services/hierarchyService');

describe('Prerequisite DAG Validation', () => {
  let dagReport;

  beforeAll(() => {
    dagReport = validatePrerequisiteDAG();
  });

  describe('Graph structure', () => {
    it('should have exactly 278 total patterns', () => {
      expect(dagReport.totalPatterns).toBe(278);
    });

    it('should have exactly 218 patterns with prerequisites', () => {
      expect(dagReport.withPrerequisites).toBe(218);
    });

    it('should have exactly 60 foundational patterns (no prerequisites)', () => {
      expect(dagReport.foundational).toBe(60);
    });

    it('foundational + with-prerequisites should equal total', () => {
      expect(dagReport.foundational + dagReport.withPrerequisites).toBe(dagReport.totalPatterns);
    });

    it('should have exactly 410 prerequisite edges', () => {
      expect(dagReport.totalEdges).toBe(410);
    });
  });

  describe('Graph validity', () => {
    it('should have 0 invalid prerequisite references', () => {
      if (dagReport.invalidReferences.length > 0) {
        console.error('Invalid references found:', dagReport.invalidReferences);
      }
      expect(dagReport.invalidReferences).toHaveLength(0);
    });

    it('should have 0 self-references', () => {
      if (dagReport.selfReferences.length > 0) {
        console.error('Self-references found:', dagReport.selfReferences);
      }
      expect(dagReport.selfReferences).toHaveLength(0);
    });

    it('should have 0 cycles', () => {
      if (dagReport.cycles.length > 0) {
        console.error('Cycles found involving:', dagReport.cycles);
      }
      expect(dagReport.cycles).toHaveLength(0);
    });

    it('isValid should be true', () => {
      expect(dagReport.isValid).toBe(true);
    });
  });

  describe('Edge count consistency', () => {
    it('getPrerequisiteEdges() count matches totalEdges in report', () => {
      const edges = getPrerequisiteEdges();
      expect(edges).toHaveLength(dagReport.totalEdges);
    });

    it('all edges reference existing patterns', () => {
      const registry = require('../src/data/canonicalPatternRegistry.json');
      const allPatterns = new Set(
        registry.flatMap((t) => (t.patterns || []).map((p) => p.name))
      );
      const edges = getPrerequisiteEdges();
      for (const edge of edges) {
        expect(allPatterns.has(edge.from)).toBe(true);
        expect(allPatterns.has(edge.to)).toBe(true);
      }
    });
  });

  describe('getPrerequisites()', () => {
    it('returns null for a non-existent pattern', () => {
      expect(getPrerequisites('NonExistentPattern')).toBeNull();
    });

    it('returns an empty array for a foundational pattern', () => {
      // Linear Equations & Systems of Equations is foundational in Algebra
      const prereqs = getPrerequisites('Linear Equations & Systems of Equations');
      expect(Array.isArray(prereqs)).toBe(true);
      expect(prereqs).toHaveLength(0);
    });
  });
});
