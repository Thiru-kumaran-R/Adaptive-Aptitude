'use strict';

/**
 * Hierarchy Service
 *
 * Validates and queries the prerequisite DAG (Directed Acyclic Graph)
 * embedded in the canonical pattern registry.
 *
 * All computations are derived from actual registry data — no hard-coded counts.
 */

const registry = require('../data/canonicalPatternRegistry.json');

// ── Build the adjacency map once ───────────────────────────────────────────

/** Map: patternName → Array<prerequisitePatternName> */
const patternPrereqMap = new Map();
/** Set: all canonical pattern names */
const allPatterns = new Set();

for (const topic of registry) {
  for (const pattern of topic.patterns || []) {
    allPatterns.add(pattern.name);
    patternPrereqMap.set(pattern.name, pattern.prerequisites || []);
  }
}

// ── Internal helpers ───────────────────────────────────────────────────────

/**
 * Detect cycles in the prerequisite DAG using iterative DFS (Tarjan-style
 * coloring: white=unvisited, gray=in-stack, black=done).
 *
 * @returns {string[]} Array of pattern names that participate in a cycle.
 */
const detectCycles = () => {
  const WHITE = 0;
  const GRAY = 1;
  const BLACK = 2;

  const color = new Map();
  for (const p of allPatterns) color.set(p, WHITE);

  const cycleInvolving = new Set();

  const dfs = (node) => {
    color.set(node, GRAY);

    for (const prereq of patternPrereqMap.get(node) || []) {
      if (!allPatterns.has(prereq)) continue; // invalid refs handled separately

      if (color.get(prereq) === GRAY) {
        cycleInvolving.add(node);
        cycleInvolving.add(prereq);
        return;
      }
      if (color.get(prereq) === WHITE) {
        dfs(prereq);
      }
    }

    color.set(node, BLACK);
  };

  for (const pattern of allPatterns) {
    if (color.get(pattern) === WHITE) {
      dfs(pattern);
    }
  }

  return [...cycleInvolving];
};

// ── Public API ─────────────────────────────────────────────────────────────

/**
 * Validates the prerequisite DAG and returns a detailed report.
 *
 * Checks:
 *  - All prerequisite references point to existing canonical patterns
 *  - No pattern references itself as a prerequisite
 *  - The graph is acyclic (no cycles)
 *
 * Returns computed values — never hard-coded success messages.
 *
 * @returns {{
 *   totalPatterns: number,
 *   foundational: number,
 *   withPrerequisites: number,
 *   totalEdges: number,
 *   invalidReferences: Array<{pattern: string, missingPrereq: string}>,
 *   selfReferences: Array<{pattern: string}>,
 *   cycles: string[],
 *   isValid: boolean
 * }}
 */
const validatePrerequisiteDAG = () => {
  const invalidReferences = [];
  const selfReferences = [];
  let withPrerequisites = 0;
  let totalEdges = 0;

  for (const [patternName, prereqs] of patternPrereqMap) {
    if (prereqs.length > 0) {
      withPrerequisites++;
      totalEdges += prereqs.length;
    }

    for (const prereq of prereqs) {
      if (prereq === patternName) {
        selfReferences.push({ pattern: patternName });
      }
      if (!allPatterns.has(prereq)) {
        invalidReferences.push({ pattern: patternName, missingPrereq: prereq });
      }
    }
  }

  const cycles = detectCycles();

  return {
    totalPatterns: allPatterns.size,
    foundational: allPatterns.size - withPrerequisites,
    withPrerequisites,
    totalEdges,
    invalidReferences,
    selfReferences,
    cycles,
    isValid:
      invalidReferences.length === 0 &&
      selfReferences.length === 0 &&
      cycles.length === 0,
  };
};

/**
 * Returns all prerequisite edges as { from, to } pairs.
 * Useful for graph visualization or further analysis.
 *
 * @returns {Array<{from: string, to: string}>}
 */
const getPrerequisiteEdges = () => {
  const edges = [];
  for (const [patternName, prereqs] of patternPrereqMap) {
    for (const prereq of prereqs) {
      edges.push({ from: patternName, to: prereq });
    }
  }
  return edges;
};

/**
 * Returns the prerequisites for a single pattern, or null if not found.
 * @param {string} patternName
 * @returns {string[]|null}
 */
const getPrerequisites = (patternName) => {
  return patternPrereqMap.has(patternName)
    ? patternPrereqMap.get(patternName)
    : null;
};

module.exports = {
  validatePrerequisiteDAG,
  getPrerequisiteEdges,
  getPrerequisites,
};
