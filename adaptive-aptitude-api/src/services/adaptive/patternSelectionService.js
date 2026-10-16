'use strict';

/**
 * src/services/adaptive/patternSelectionService.js
 *
 * Implements candidate pattern discovery, scoring, and deterministic tie-breaking.
 *
 * Candidate Scope Priority:
 *   1. Explicit valid pattern supplied in request
 *   2. Today's active DailyObjective (patterns with remainingQuestions > 0)
 *   3. Active StudyPlan targets
 *   4. Existing weak/developing StudentProgress patterns (mastery < 0.70)
 *   5. Canonical foundational patterns
 *
 * Priority Formula:
 *   masteryNeed = 1 - mastery
 *   objectiveNeedRatio = remainingQuestions / targetQuestions (if from incomplete DailyObjective, else 0)
 *   patternPriority = 0.70 * masteryNeed + 0.30 * objectiveNeedRatio
 *
 * Deterministic Tie-Breaking:
 *   1. Higher patternPriority
 *   2. Lower mastery
 *   3. Fewer attempts
 *   4. Canonical registry order
 *   5. Canonical pattern name
 */

const mongoose = require('mongoose');
const DailyObjective = require('../../models/dailyObjectiveModel');
const StudyPlan = require('../../models/studyPlanModel');
const StudentProgress = require('../../models/studentProgressModel');
const registryService = require('../patternRegistryService');
const hierarchyService = require('../hierarchyService');
const prerequisiteService = require('./prerequisiteService');
const config = require('../../config/adaptiveConfig');
const { normalizeToMidnightUTC } = require('../dailyObjectiveService');

/**
 * Select the next pattern for a user based on constraints and candidate hierarchy.
 *
 * @param {string} userId
 * @param {{ topic?: string, pattern?: string, planId?: string }} constraints
 * @returns {Promise<{
 *   pattern: string,
 *   topic: string,
 *   reasonCodes: string[],
 *   mastery: number,
 *   masteryLabel: string,
 *   prerequisiteRedirect: boolean,
 *   requestedPattern?: string,
 *   targetDifficulty?: number
 * }>}
 */
const selectCandidatePattern = async (userId, constraints = {}) => {
  const reasonCodes = [];
  let candidateScope = null; // 'EXPLICIT' | 'DAILY_OBJECTIVE' | 'STUDY_PLAN' | 'PROGRESS_FALLBACK' | 'FOUNDATIONAL_FALLBACK'

  // ── Validation of constraints ──────────────────────────────────────────────

  // 1. Topic constraint validation
  let filterTopic = null;
  if (constraints.topic) {
    const resolvedTopic = registryService.resolveTopicSlug(constraints.topic);
    if (!resolvedTopic) {
      const err = new Error(`Topic "${constraints.topic}" not found in canonical registry.`);
      err.statusCode = 400;
      err.code = 'INVALID_TOPIC';
      throw err;
    }
    filterTopic = resolvedTopic;
  }

  // 2. Plan constraint validation
  let planFilterId = null;
  if (constraints.planId) {
    if (!mongoose.Types.ObjectId.isValid(constraints.planId)) {
      const err = new Error(`StudyPlan "${constraints.planId}" not found or does not belong to user.`);
      err.statusCode = 404;
      err.code = 'STUDY_PLAN_NOT_FOUND';
      throw err;
    }
    const plan = await StudyPlan.findById(constraints.planId);
    if (!plan || plan.userId !== userId) {
      const err = new Error(`StudyPlan "${constraints.planId}" not found or does not belong to user.`);
      err.statusCode = 404;
      err.code = 'STUDY_PLAN_NOT_FOUND';
      throw err;
    }
    planFilterId = plan._id;
  }

  // ── Priority 1: Explicit pattern request ───────────────────────────────────
  if (constraints.pattern) {
    const resolvedPattern = registryService.resolvePatternSlug(constraints.pattern);
    if (!resolvedPattern) {
      const err = new Error(`Pattern "${constraints.pattern}" not found in canonical registry.`);
      err.statusCode = 400;
      err.code = 'INVALID_PATTERN';
      throw err;
    }

    // If topic is also provided, validate pattern belongs to topic
    if (filterTopic) {
      if (!registryService.patternBelongsToTopic(resolvedPattern, filterTopic)) {
        const err = new Error(`Pattern "${resolvedPattern}" does not belong to topic "${filterTopic}".`);
        err.statusCode = 400;
        err.code = 'PATTERN_TOPIC_MISMATCH';
        throw err;
      }
    } else {
      filterTopic = registryService.getTopicForPattern(resolvedPattern);
    }

    reasonCodes.push('EXPLICIT_PATTERN');

    // Evaluate prerequisites
    const remResult = await prerequisiteService.findRemediationPattern(userId, resolvedPattern);
    if (remResult.redirected) {
      reasonCodes.push('PREREQUISITE_NOT_MASTERED');
      reasonCodes.push('PREREQUISITE_REMEDIATION');
    }

    const prog = await StudentProgress.findOne({
      userId,
      topic: remResult.selectedTopic,
      pattern: remResult.selectedPattern,
    }).lean();

    const mastery = prog ? prog.mastery : 0;

    // Check if student has an active DailyObjective today defining targetDifficulty for this pattern
    const today = normalizeToMidnightUTC(new Date());
    const dailyObjective = await DailyObjective.findOne({
      userId,
      date: today,
      'patterns.pattern': remResult.selectedPattern,
    }).lean();

    let patternTargetDifficulty;
    if (dailyObjective && Array.isArray(dailyObjective.patterns)) {
      const matched = dailyObjective.patterns.find(
        (p) => p.pattern === remResult.selectedPattern
      );
      if (matched && matched.targetDifficulty) {
        patternTargetDifficulty = matched.targetDifficulty;
      }
    }

    return {
      pattern: remResult.selectedPattern,
      topic: remResult.selectedTopic,
      reasonCodes,
      mastery,
      prerequisiteRedirect: remResult.redirected,
      requestedPattern: resolvedPattern,
      targetDifficulty: patternTargetDifficulty,
    };
  }

  // ── Priority 2: Today's active DailyObjective ──────────────────────────────
  const today = normalizeToMidnightUTC(new Date());
  const objQuery = { userId, date: today };
  if (planFilterId) {
    objQuery.planId = planFilterId;
  }
  if (filterTopic) {
    objQuery.topic = filterTopic;
  }

  const dailyObjective = await DailyObjective.findOne(objQuery).lean();

  let candidatePool = [];

  if (dailyObjective && Array.isArray(dailyObjective.patterns)) {
    for (const patObj of dailyObjective.patterns) {
      const remainingQuestions = Math.max(
        (patObj.targetQuestions || 0) - (patObj.completedQuestions || 0),
        0
      );
      if (remainingQuestions > 0) {
        candidatePool.push({
          pattern: patObj.pattern,
          topic: dailyObjective.topic,
          targetQuestions: patObj.targetQuestions || 1,
          remainingQuestions,
          targetDifficulty: patObj.targetDifficulty,
          fromDailyObjective: true,
        });
      }
    }
    if (candidatePool.length > 0) {
      candidateScope = 'DAILY_OBJECTIVE';
      reasonCodes.push('DAILY_OBJECTIVE');
    }
  }

  // ── Priority 3: Active StudyPlan targets ───────────────────────────────────
  if (candidatePool.length === 0) {
    const planQuery = { userId, status: 'active' };
    if (planFilterId) {
      planQuery._id = planFilterId;
    }

    const activePlans = await StudyPlan.find(planQuery).lean();
    for (const plan of activePlans) {
      for (const target of plan.targets || []) {
        if (!filterTopic || target.topic === filterTopic) {
          if (target.pattern) {
            candidatePool.push({
              pattern: target.pattern,
              topic: target.topic,
              targetQuestions: target.targetQuestions || 0,
              remainingQuestions: 0,
              fromDailyObjective: false,
            });
          }
        }
      }
    }
    if (candidatePool.length > 0) {
      candidateScope = 'ACTIVE_STUDY_PLAN';
      reasonCodes.push('ACTIVE_STUDY_PLAN');
    }
  }

  // ── Priority 4: Existing weak/developing StudentProgress patterns ─────────
  if (candidatePool.length === 0) {
    const progQuery = {
      userId,
      mastery: { $lt: config.PREREQUISITE_MASTERY_THRESHOLD },
    };
    if (filterTopic) {
      progQuery.topic = filterTopic;
    }

    const weakProgress = await StudentProgress.find(progQuery)
      .sort({ mastery: 1, attempts: -1 })
      .limit(20)
      .lean();

    for (const wp of weakProgress) {
      candidatePool.push({
        pattern: wp.pattern,
        topic: wp.topic,
        targetQuestions: 0,
        remainingQuestions: 0,
        fromDailyObjective: false,
      });
    }
    if (candidatePool.length > 0) {
      candidateScope = 'LOW_MASTERY';
      reasonCodes.push('LOW_MASTERY');
    }
  }

  // ── Priority 5: Canonical foundational patterns fallback ──────────────────
  if (candidatePool.length === 0) {
    candidateScope = 'FOUNDATIONAL_FALLBACK';
    reasonCodes.push('FOUNDATIONAL_FALLBACK');

    const foundational = [];
    const allTopics = filterTopic ? [filterTopic] : registryService.getAllTopics();

    for (const top of allTopics) {
      const patternEntries = registryService.getPatternsByTopic(top) || [];
      for (const patEntry of patternEntries) {
        const patName = typeof patEntry === 'string' ? patEntry : patEntry.name;
        const prereqs = hierarchyService.getPrerequisites(patName);
        if (!prereqs || prereqs.length === 0) {
          foundational.push({
            pattern: patName,
            topic: top,
            targetQuestions: 0,
            remainingQuestions: 0,
            fromDailyObjective: false,
          });
        }
      }
    }
    candidatePool = foundational;
  }

  // ── Score each candidate in the pool ───────────────────────────────────────
  // Retrieve progress for all candidate patterns
  const candidateNames = [...new Set(candidatePool.map((c) => c.pattern))];
  const progressList = await StudentProgress.find({
    userId,
    pattern: { $in: candidateNames },
  }).lean();

  const progressMap = new Map(progressList.map((p) => [p.pattern, p]));

  const scoredCandidates = [];

  for (const cand of candidatePool) {
    const p = progressMap.get(cand.pattern);
    const mastery = p ? p.mastery : 0;
    const attempts = p ? p.attempts : 0;

    const masteryNeed = 1 - mastery;
    const objectiveNeedRatio =
      cand.fromDailyObjective && cand.targetQuestions > 0
        ? cand.remainingQuestions / cand.targetQuestions
        : 0;

    const priorityScore =
      config.PATTERN_MASTERY_NEED_WEIGHT * masteryNeed +
      config.PATTERN_OBJECTIVE_NEED_WEIGHT * objectiveNeedRatio;

    scoredCandidates.push({
      ...cand,
      mastery,
      attempts,
      masteryNeed,
      objectiveNeedRatio,
      priorityScore,
      registryIndex: prerequisiteService.getPatternRegistryIndex(cand.pattern),
    });
  }

  // ── Deterministic sorting of candidates ────────────────────────────────────
  scoredCandidates.sort((a, b) => {
    // 1. Higher priority score first
    if (Math.abs(b.priorityScore - a.priorityScore) > 1e-9) {
      return b.priorityScore - a.priorityScore;
    }
    // 2. Lower mastery first
    if (Math.abs(a.mastery - b.mastery) > 1e-9) {
      return a.mastery - b.mastery;
    }
    // 3. Fewer attempts first
    if (a.attempts !== b.attempts) {
      return a.attempts - b.attempts;
    }
    // 4. Canonical registry order index
    if (a.registryIndex !== b.registryIndex) {
      return a.registryIndex - b.registryIndex;
    }
    // 5. Pattern name
    return a.pattern.localeCompare(b.pattern);
  });

  const topCandidate = scoredCandidates[0];

  // If top candidate has 0 attempts and was not found in progress, note UNSEEN_PATTERN
  if (topCandidate.attempts === 0 && !reasonCodes.includes('FOUNDATIONAL_FALLBACK')) {
    reasonCodes.push('UNSEEN_PATTERN');
  }

  // Check prerequisite remediation for the selected candidate
  const remResult = await prerequisiteService.findRemediationPattern(
    userId,
    topCandidate.pattern
  );

  let finalPattern = topCandidate.pattern;
  let finalTopic = topCandidate.topic;
  let prerequisiteRedirect = false;

  if (remResult.redirected) {
    finalPattern = remResult.selectedPattern;
    finalTopic = remResult.selectedTopic;
    prerequisiteRedirect = true;
    reasonCodes.push('PREREQUISITE_NOT_MASTERED');
    reasonCodes.push('PREREQUISITE_REMEDIATION');
  }

  const finalProgress = progressMap.get(finalPattern) || (await StudentProgress.findOne({
    userId,
    topic: finalTopic,
    pattern: finalPattern,
  }).lean());

  const finalMastery = finalProgress ? finalProgress.mastery : 0;

  return {
    pattern: finalPattern,
    topic: finalTopic,
    reasonCodes,
    mastery: finalMastery,
    prerequisiteRedirect,
    requestedPattern: prerequisiteRedirect ? topCandidate.pattern : undefined,
    targetDifficulty: topCandidate.targetDifficulty,
    candidateScoreDetails: {
      masteryNeed: topCandidate.masteryNeed,
      objectiveNeedRatio: topCandidate.objectiveNeedRatio,
      priorityScore: topCandidate.priorityScore,
    },
  };
};

module.exports = {
  selectCandidatePattern,
};
