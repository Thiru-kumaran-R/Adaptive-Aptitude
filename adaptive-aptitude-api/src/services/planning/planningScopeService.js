'use strict';

/**
 * Planning Scope Service — Phase 5: Automated Planning Engine
 *
 * Validates requested scope against canonical registry, expands unmet
 * prerequisites recursively, filters mastered patterns, and performs
 * deterministic topological sequencing.
 */

const registryService = require('../patternRegistryService');
const hierarchyService = require('../hierarchyService');
const StudentProgress = require('../../models/studentProgressModel');
const registry = require('../../data/canonicalPatternRegistry.json');
const {
  PLANNING_TARGET_MASTERY,
  PREREQUISITE_READY_MASTERY,
  PLANNING_REASON_CODES,
} = require('../../config/planningConfig');

// Build canonical pattern index map (0 to 277)
const patternIndexMap = new Map();
let globalIdx = 0;
for (const topic of registry) {
  for (const pattern of topic.patterns || []) {
    patternIndexMap.set(pattern.name, globalIdx++);
  }
}

const getPatternRegistryIndex = (patternName) => {
  return patternIndexMap.has(patternName) ? patternIndexMap.get(patternName) : 999999;
};

/**
 * Validates scope inputs against canonical registry.
 *
 * @param {Object} scope
 * @returns {Array<{ topic: string, pattern: string }>} Initial resolved pattern pairs
 */
const validateAndResolveScope = (scope) => {
  if (!scope || typeof scope !== 'object') {
    const err = new Error('Planning scope is required: specify topics, patterns, or allCanonicalPatterns: true.');
    err.statusCode = 400;
    err.code = 'PLANNING_SCOPE_REQUIRED';
    throw err;
  }

  // Future verified syllabus registry hook: targetProfileId (0 verified profiles exist)
  if (scope.targetProfileId) {
    const err = new Error(
      `Target profile "${scope.targetProfileId}" not found. No verified syllabus profiles currently exist in the repository.`
    );
    err.statusCode = 404;
    err.code = 'TARGET_PROFILE_NOT_FOUND';
    throw err;
  }

  // Master mode: all canonical patterns
  if (scope.allCanonicalPatterns === true) {
    const all = [];
    for (const topic of registry) {
      for (const pattern of topic.patterns || []) {
        all.push({ topic: topic.topic, pattern: pattern.name });
      }
    }
    return all;
  }

  const { topics, patterns } = scope;

  if ((!topics || topics.length === 0) && (!patterns || patterns.length === 0)) {
    const err = new Error('Planning scope is required: specify topics, patterns, or allCanonicalPatterns: true.');
    err.statusCode = 400;
    err.code = 'PLANNING_SCOPE_REQUIRED';
    throw err;
  }

  // 1. Validate topics if provided
  if (topics && Array.isArray(topics)) {
    for (const t of topics) {
      if (!registryService.topicExists(t)) {
        const err = new Error(`Topic "${t}" does not exist in the canonical registry.`);
        err.statusCode = 400;
        err.code = 'INVALID_TOPIC';
        throw err;
      }
    }
  }

  // 2. Validate patterns if provided
  if (patterns && Array.isArray(patterns)) {
    for (const p of patterns) {
      if (!registryService.patternExists(p)) {
        const err = new Error(`Pattern "${p}" does not exist in the canonical registry.`);
        err.statusCode = 400;
        err.code = 'INVALID_PATTERN';
        throw err;
      }
      if (topics && topics.length > 0) {
        const belongs = topics.some((t) => registryService.patternBelongsToTopic(p, t));
        if (!belongs) {
          const err = new Error(`Pattern "${p}" does not belong to any of the supplied topics.`);
          err.statusCode = 400;
          err.code = 'PATTERN_TOPIC_MISMATCH';
          throw err;
        }
      }
    }
  }

  const resolved = [];
  const seenPatterns = new Set();

  // If specific patterns requested, use them directly
  if (patterns && patterns.length > 0) {
    for (const p of patterns) {
      if (!seenPatterns.has(p)) {
        seenPatterns.add(p);
        const topic = registryService.getTopicForPattern(p);
        resolved.push({ topic, pattern: p });
      }
    }
    return resolved;
  }

  // Otherwise expand all patterns under the supplied topics
  if (topics && topics.length > 0) {
    for (const t of topics) {
      const topicPatterns = registryService.getPatternsByTopic(t) || [];
      for (const p of topicPatterns) {
        if (!seenPatterns.has(p.name)) {
          seenPatterns.add(p.name);
          resolved.push({ topic: t, pattern: p.name });
        }
      }
    }
    return resolved;
  }

  return resolved;
};

/**
 * Recursively expands unmet prerequisites for a set of patterns and orders them.
 *
 * @param {string} userId
 * @param {Object} scope
 * @param {Object} [options]
 * @param {boolean} [options.includeMastered=false]
 * @returns {Promise<Object>}
 */
const resolvePlanningScope = async (userId, scope, options = {}) => {
  const includeMastered = options.includeMastered === true || scope?.includeMastered === true;
  const initialPairs = validateAndResolveScope(scope);

  // Fetch all student progress for this user
  const allProgress = await StudentProgress.find({ userId }).lean();
  const progressMap = new Map();
  for (const p of allProgress) {
    progressMap.set(`${p.topic}:::${p.pattern}`, p);
    progressMap.set(p.pattern, p);
  }

  const getMastery = (patternName) => {
    return progressMap.get(patternName)?.mastery || 0;
  };
  const getAttempts = (patternName) => {
    return progressMap.get(patternName)?.attempts ?? progressMap.get(patternName)?.totalAttempts ?? 0;
  };

  const requestedPatternNames = new Set(initialPairs.map((pair) => pair.pattern));
  const expandedPatternNames = new Set(requestedPatternNames);
  const prerequisitesAdded = new Set();
  const reasonCodes = new Set();

  if (scope.allCanonicalPatterns) {
    reasonCodes.add(PLANNING_REASON_CODES.ALL_CANONICAL_SCOPE);
  } else {
    reasonCodes.add(PLANNING_REASON_CODES.EXPLICIT_SCOPE);
  }

  // Recursive unmet prerequisite expansion
  const queue = [...requestedPatternNames];
  const visited = new Set();

  while (queue.length > 0) {
    const currentPattern = queue.shift();
    if (visited.has(currentPattern)) continue;
    visited.add(currentPattern);

    const prereqs = hierarchyService.getPrerequisites(currentPattern) || [];

    for (const prereq of prereqs) {
      const prereqMastery = getMastery(prereq);

      // Unmet prerequisite if mastery < PREREQUISITE_READY_MASTERY (0.70)
      if (prereqMastery < PREREQUISITE_READY_MASTERY) {
        if (!expandedPatternNames.has(prereq)) {
          expandedPatternNames.add(prereq);
          prerequisitesAdded.add(prereq);
          reasonCodes.add(PLANNING_REASON_CODES.PREREQUISITE_INCLUDED);
        }
        queue.push(prereq);
      }
    }
  }

  // Filter mastered patterns (mastery >= PLANNING_TARGET_MASTERY = 0.85) unless includeMastered is true
  const patternsToSchedule = [];
  const patternsAlreadyMastered = [];

  for (const pat of expandedPatternNames) {
    const mastery = getMastery(pat);
    if (!includeMastered && mastery >= PLANNING_TARGET_MASTERY) {
      patternsAlreadyMastered.push(pat);
      reasonCodes.add(PLANNING_REASON_CODES.MASTERED_PATTERN_SKIPPED);
    } else {
      patternsToSchedule.push(pat);
    }
  }

  // Build dependency subgraph over patternsToSchedule
  const candidateSet = new Set(patternsToSchedule);
  const inDegree = new Map();
  const adjList = new Map(); // prereq -> dependents

  for (const pat of candidateSet) {
    inDegree.set(pat, 0);
    adjList.set(pat, []);
  }

  for (const pat of candidateSet) {
    const prereqs = hierarchyService.getPrerequisites(pat) || [];
    for (const prereq of prereqs) {
      if (candidateSet.has(prereq)) {
        inDegree.set(pat, inDegree.get(pat) + 1);
        adjList.get(prereq).push(pat);
      }
    }
  }

  // Deterministic Topological Sort
  // Queue of patterns with 0 unsatisfied prerequisites in candidateSet
  const eligible = [];
  for (const [pat, deg] of inDegree.entries()) {
    if (deg === 0) eligible.push(pat);
  }

  const tieBreakComparator = (a, b) => {
    const masteryA = getMastery(a);
    const masteryB = getMastery(b);
    if (masteryA !== masteryB) return masteryA - masteryB; // lower mastery first

    const attA = getAttempts(a);
    const attB = getAttempts(b);
    if (attA !== attB) return attA - attB; // fewer attempts first

    const idxA = getPatternRegistryIndex(a);
    const idxB = getPatternRegistryIndex(b);
    if (idxA !== idxB) return idxA - idxB; // canonical registry order

    return a.localeCompare(b); // canonical name
  };

  eligible.sort(tieBreakComparator);

  const orderedPatternNames = [];

  while (eligible.length > 0) {
    const nextPat = eligible.shift();
    orderedPatternNames.push(nextPat);

    for (const dependent of adjList.get(nextPat) || []) {
      const newDeg = inDegree.get(dependent) - 1;
      inDegree.set(dependent, newDeg);
      if (newDeg === 0) {
        eligible.push(dependent);
      }
    }
    eligible.sort(tieBreakComparator);
  }

  // Map back to pattern objects with topic and metadata
  const orderedPatterns = orderedPatternNames.map((pat) => {
    const topic = registryService.getTopicForPattern(pat);
    const mastery = getMastery(pat);
    const attempts = getAttempts(pat);
    const isPrerequisite = prerequisitesAdded.has(pat);

    if (attempts === 0) reasonCodes.add(PLANNING_REASON_CODES.NEW_PATTERN_PRIORITY);
    if (mastery < PREREQUISITE_READY_MASTERY) reasonCodes.add(PLANNING_REASON_CODES.LOW_MASTERY_PRIORITY);

    return {
      topic,
      pattern: pat,
      mastery,
      attempts,
      isPrerequisite,
      registryIndex: getPatternRegistryIndex(pat),
    };
  });

  return {
    patternsRequested: requestedPatternNames.size,
    prerequisitesAdded: Array.from(prerequisitesAdded),
    patternsAlreadyMastered,
    orderedPatterns,
    reasonCodes: Array.from(reasonCodes),
  };
};

module.exports = {
  validateAndResolveScope,
  resolvePlanningScope,
  getPatternRegistryIndex,
};
