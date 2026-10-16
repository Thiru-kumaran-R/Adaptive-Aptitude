'use strict';

/**
 * Topic Diagnostics & Priority Focus Service
 *
 * Implements Section 28 (Topic Diagnostic Mastery & Radar) and Section 29
 * (Priority Focus Topics Candidate Set & Ranking).
 *
 * Invariant:
 *   - Diagnostic labels and ranking comparators operate strictly on unrounded raw values.
 *   - topicMasteryRadar serializes ONLY evidence-bearing topics (>= 1 StudentProgress).
 *   - Ranking comparator uses Phase 2 canonical registry order, NOT alphabetical sort.
 */

const StudentProgress = require('../../models/studentProgressModel');
const patternRegistryService = require('../patternRegistryService');
const hierarchyService = require('../hierarchyService');
const {
  PRIORITY_FOCUS_TOPICS_LIMIT,
  PREREQUISITE_UNMET_THRESHOLD,
} = require('../../config/analyticsConfig');
const {
  roundTo,
  getMasteryLabel,
} = require('./analyticsMathUtils');

/**
 * Evaluates topic diagnostic metrics for a user across specified canonical topics or all topics.
 *
 * @param {string} userId
 * @param {Array<string>} [topicNames] Canonical topic names (defaults to all 24 canonical topics)
 * @returns {Promise<Map<string, Object>>} Map of topicName -> topic metrics object
 */
const evaluateTopicDiagnostics = async (userId, topicNames = null) => {
  const allCanonicalTopics = patternRegistryService.getAllTopics();
  const targetTopics = topicNames || allCanonicalTopics;

  // Load all progress records for the user in target topics
  const progressRecords = await StudentProgress.find({
    userId,
    topic: { $in: targetTopics },
  }).lean();

  // Group progress records by topic
  const progressByTopic = new Map();
  for (const record of progressRecords) {
    if (!progressByTopic.has(record.topic)) {
      progressByTopic.set(record.topic, []);
    }
    progressByTopic.get(record.topic).push(record);
  }

  const topicMetrics = new Map();

  for (const topic of targetTopics) {
    const topicPatterns = patternRegistryService.getPatternsByTopic(topic) || [];
    const canonicalPatternsInTopic = topicPatterns.length;
    const progressList = progressByTopic.get(topic) || [];
    const patternsWithEvidence = progressList.length;

    if (patternsWithEvidence === 0) {
      topicMetrics.set(topic, {
        topic,
        rawDiagnosticMastery: null,
        diagnosticMastery: null,
        diagnosticLabel: null,
        patternsWithEvidence: 0,
        canonicalPatternsInTopic,
        rawCoverageRatio: 0.0,
        coverageRatio: 0.0,
        hasEvidence: false,
      });
    } else {
      let masterySum = 0;
      for (const p of progressList) {
        masterySum += p.mastery;
      }
      const rawDiagnosticMastery = masterySum / patternsWithEvidence;
      const rawCoverageRatio = canonicalPatternsInTopic > 0
        ? patternsWithEvidence / canonicalPatternsInTopic
        : 0.0;

      const diagnosticLabel = getMasteryLabel(rawDiagnosticMastery);
      const diagnosticMastery = roundTo(rawDiagnosticMastery, 2);
      const coverageRatio = roundTo(rawCoverageRatio, 2);

      topicMetrics.set(topic, {
        topic,
        rawDiagnosticMastery,
        diagnosticMastery,
        diagnosticLabel,
        patternsWithEvidence,
        canonicalPatternsInTopic,
        rawCoverageRatio,
        coverageRatio,
        hasEvidence: true,
      });
    }
  }

  return topicMetrics;
};

/**
 * Computes serialized topicMasteryRadar entries (evidence-only).
 *
 * @param {Map<string, Object>} topicMetrics
 * @returns {Array<Object>}
 */
const buildTopicMasteryRadar = (topicMetrics) => {
  const radar = [];
  for (const [, metrics] of topicMetrics) {
    if (metrics.hasEvidence) {
      radar.push({
        topic: metrics.topic,
        diagnosticMastery: metrics.diagnosticMastery,
        diagnosticLabel: metrics.diagnosticLabel,
        patternsWithEvidence: metrics.patternsWithEvidence,
        canonicalPatternsInTopic: metrics.canonicalPatternsInTopic,
        coverageRatio: metrics.coverageRatio,
      });
    }
  }
  return radar;
};

/**
 * Computes Priority Focus Topics according to Section 29.
 *
 * @param {string} userId
 * @param {Object|null} activePlan
 * @param {Map<string, Object>} topicMetrics
 * @returns {Promise<Array<string>>}
 */
const computePriorityFocusTopics = async (userId, activePlan, topicMetrics) => {
  // 1. Determine CandidateTopics
  const candidateTopicSet = new Set();

  if (activePlan && Array.isArray(activePlan.targets)) {
    for (const t of activePlan.targets) {
      if (t && t.topic && patternRegistryService.topicExists(t.topic)) {
        candidateTopicSet.add(t.topic);
      }
    }
  }

  for (const [topic, metrics] of topicMetrics) {
    if (metrics.hasEvidence) {
      candidateTopicSet.add(topic);
    }
  }

  if (candidateTopicSet.size === 0) {
    return [];
  }

  // Pre-fetch all user StudentProgress across all topics for prerequisite evaluation
  const allUserProgress = await StudentProgress.find({ userId }).lean();
  const userProgressMap = new Map();
  for (const up of allUserProgress) {
    userProgressMap.set(up.pattern, up);
  }

  // Active plan target patterns set
  const activePlanPatterns = new Set();
  if (activePlan && Array.isArray(activePlan.targets)) {
    for (const t of activePlan.targets) {
      if (t && t.pattern) {
        activePlanPatterns.add(t.pattern);
      }
    }
  }

  // 2. Evaluate each candidate topic
  const allCanonicalTopics = patternRegistryService.getAllTopics();
  const candidates = [];

  for (const topic of candidateTopicSet) {
    const metrics = topicMetrics.get(topic) || {
      topic,
      rawDiagnosticMastery: null,
      rawCoverageRatio: 0.0,
    };

    // 2.1 Collect relevant pattern set Prel
    const topicPatterns = patternRegistryService.getPatternsByTopic(topic) || [];
    const pRel = [];
    for (const p of topicPatterns) {
      const pName = p.name;
      if (activePlanPatterns.has(pName) || userProgressMap.has(pName)) {
        pRel.push(pName);
      }
    }

    // 2.2 Collect unique immediate prerequisites
    const uniquePrereqs = new Set();
    for (const pName of pRel) {
      const prereqs = hierarchyService.getPrerequisites(pName) || [];
      for (const q of prereqs) {
        uniquePrereqs.add(q);
      }
    }

    // 2.3 Count unmet prerequisites
    let unmetPrerequisiteCount = 0;
    for (const q of uniquePrereqs) {
      const progress = userProgressMap.get(q);
      const mastery = progress ? progress.mastery : 0.0;
      if (mastery < PREREQUISITE_UNMET_THRESHOLD) {
        unmetPrerequisiteCount += 1;
      }
    }

    // Canonical registry index (0 to 23)
    let registryIndex = allCanonicalTopics.indexOf(topic);
    if (registryIndex === -1) {
      registryIndex = 999999;
    }

    candidates.push({
      topic,
      rawDiagnosticMastery: metrics.rawDiagnosticMastery,
      unmetPrerequisiteCount,
      rawCoverageRatio: metrics.rawCoverageRatio,
      registryIndex,
    });
  }

  // 3. Multi-tier deterministic sort using raw values
  candidates.sort((a, b) => {
    // 1. Lowest Raw Diagnostic Mastery First (null ranks first)
    if (a.rawDiagnosticMastery === null && b.rawDiagnosticMastery !== null) {
      return -1;
    }
    if (a.rawDiagnosticMastery !== null && b.rawDiagnosticMastery === null) {
      return 1;
    }
    if (a.rawDiagnosticMastery !== null && b.rawDiagnosticMastery !== null) {
      if (a.rawDiagnosticMastery !== b.rawDiagnosticMastery) {
        return a.rawDiagnosticMastery - b.rawDiagnosticMastery;
      }
    }

    // 2. Highest Unmet Prerequisite Count descending
    if (a.unmetPrerequisiteCount !== b.unmetPrerequisiteCount) {
      return b.unmetPrerequisiteCount - a.unmetPrerequisiteCount;
    }

    // 3. Lowest Raw Coverage Ratio ascending
    if (a.rawCoverageRatio !== b.rawCoverageRatio) {
      return a.rawCoverageRatio - b.rawCoverageRatio;
    }

    // 4. Canonical Topic Registry Index ascending
    if (a.registryIndex !== b.registryIndex) {
      return a.registryIndex - b.registryIndex;
    }

    // Defensive fallback
    return a.topic.localeCompare(b.topic);
  });

  return candidates.slice(0, PRIORITY_FOCUS_TOPICS_LIMIT).map((c) => c.topic);
};

module.exports = {
  evaluateTopicDiagnostics,
  buildTopicMasteryRadar,
  computePriorityFocusTopics,
};
