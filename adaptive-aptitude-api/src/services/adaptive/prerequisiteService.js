'use strict';

/**
 * src/services/adaptive/prerequisiteService.js
 *
 * Evaluates prerequisite eligibility and performs recursive prerequisite
 * remediation traversal over the canonical DAG.
 *
 * Rules:
 *   - A pattern is eligible if ALL its prerequisites have mastery >= PREREQUISITE_MASTERY_THRESHOLD (0.70).
 *   - Foundational patterns (0 prerequisites) are always eligible.
 *   - Missing StudentProgress is treated as mastery = 0.
 *   - If a pattern has unmet prerequisites, recursively traverse to the nearest
 *     eligible prerequisite pattern, prioritizing:
 *       1. lowest mastery first
 *       2. fewer attempts first
 *       3. canonical registry order
 *       4. canonical pattern name
 */

const hierarchyService = require('../hierarchyService');
const registryService = require('../patternRegistryService');
const StudentProgress = require('../../models/studentProgressModel');
const config = require('../../config/adaptiveConfig');
const registry = require('../../data/canonicalPatternRegistry.json');

// Build canonical pattern index map (0 to 277)
const patternIndexMap = new Map();
let globalIdx = 0;
for (const topic of registry) {
  for (const pattern of topic.patterns || []) {
    patternIndexMap.set(pattern.name, globalIdx++);
  }
}

/**
 * Get canonical index of a pattern (0 to 277).
 */
const getPatternRegistryIndex = (patternName) => {
  return patternIndexMap.has(patternName) ? patternIndexMap.get(patternName) : 999999;
};

/**
 * Evaluate whether a user satisfies all direct prerequisites for a pattern.
 *
 * @param {string} userId
 * @param {string} patternName
 * @returns {Promise<{
 *   eligible: boolean,
 *   prerequisites: Array<{ pattern: string, mastery: number, attempts: number, satisfied: boolean }>,
 *   unmetPrerequisites: Array<{ pattern: string, mastery: number, attempts: number }>
 * }>}
 */
const evaluatePrerequisites = async (userId, patternName) => {
  const directPrereqs = hierarchyService.getPrerequisites(patternName) || [];

  if (directPrereqs.length === 0) {
    return {
      eligible: true,
      prerequisites: [],
      unmetPrerequisites: [],
    };
  }

  // Retrieve StudentProgress records for all direct prerequisites
  const progressRecords = await StudentProgress.find({
    userId,
    pattern: { $in: directPrereqs },
  }).lean();

  const progressByPattern = new Map(progressRecords.map((p) => [p.pattern, p]));

  const prerequisites = [];
  const unmetPrerequisites = [];

  for (const prereqName of directPrereqs) {
    const p = progressByPattern.get(prereqName);
    const mastery = p ? p.mastery : 0;
    const attempts = p ? p.attempts : 0;
    const satisfied = mastery >= config.PREREQUISITE_MASTERY_THRESHOLD;

    const prereqInfo = {
      pattern: prereqName,
      mastery,
      attempts,
      satisfied,
      registryIndex: getPatternRegistryIndex(prereqName),
    };

    prerequisites.push(prereqInfo);
    if (!satisfied) {
      unmetPrerequisites.push(prereqInfo);
    }
  }

  return {
    eligible: unmetPrerequisites.length === 0,
    prerequisites,
    unmetPrerequisites,
  };
};

/**
 * Recursively find the nearest eligible prerequisite pattern for remediation.
 *
 * @param {string} userId
 * @param {string} targetPattern
 * @returns {Promise<{
 *   selectedPattern: string,
 *   selectedTopic: string,
 *   redirected: boolean,
 *   requestedPattern: string,
 *   blockedPrerequisites: Array<{ pattern: string, mastery: number }>
 * }>}
 */
const findRemediationPattern = async (userId, targetPattern) => {
  const evalResult = await evaluatePrerequisites(userId, targetPattern);

  if (evalResult.eligible) {
    const topic = registryService.getTopicForPattern(targetPattern);
    return {
      selectedPattern: targetPattern,
      selectedTopic: topic,
      redirected: false,
      requestedPattern: targetPattern,
      blockedPrerequisites: [],
    };
  }

  // Target is blocked: sort unmet prerequisites
  // Order: 1) lowest mastery, 2) fewer attempts, 3) registry index, 4) pattern name
  const sortedUnmet = [...evalResult.unmetPrerequisites].sort((a, b) => {
    if (Math.abs(a.mastery - b.mastery) > 1e-9) {
      return a.mastery - b.mastery;
    }
    if (a.attempts !== b.attempts) {
      return a.attempts - b.attempts;
    }
    if (a.registryIndex !== b.registryIndex) {
      return a.registryIndex - b.registryIndex;
    }
    return a.pattern.localeCompare(b.pattern);
  });

  const primaryUnmet = sortedUnmet[0];

  // Recursively inspect prerequisites of the chosen unmet pattern
  const remediationResult = await findRemediationPattern(userId, primaryUnmet.pattern);

  return {
    selectedPattern: remediationResult.selectedPattern,
    selectedTopic: registryService.getTopicForPattern(remediationResult.selectedPattern),
    redirected: true,
    requestedPattern: targetPattern,
    blockedPrerequisites: evalResult.unmetPrerequisites.map((u) => ({
      pattern: u.pattern,
      mastery: u.mastery,
    })),
  };
};

module.exports = {
  getPatternRegistryIndex,
  evaluatePrerequisites,
  findRemediationPattern,
};
