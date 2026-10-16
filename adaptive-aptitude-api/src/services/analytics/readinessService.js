'use strict';

/**
 * Goal Readiness Service
 *
 * Implements Section 12, 18, 26, 27:
 *   - Goal ownership and 404/403 validation
 *   - Linked active study plan resolution
 *   - Target shape normalization gate (strict pattern-addressability)
 *   - Plan target coverage with quota and mastery branches
 *   - Mastery depth with targetPatternsWithMastery evidence counter
 *   - Standard-mock-only goal attribution (MockScopePatterns ⊆ PlanTargetPatterns)
 *   - Pacing efficiency with zero-denominator safety
 *   - Dynamic weight renormalization
 *   - Deterministic critical prerequisite bottlenecks
 */

const mongoose = require('mongoose');
const Goal = require('../../models/goalModel');
const StudyPlan = require('../../models/studyPlanModel');
const DailyObjective = require('../../models/dailyObjectiveModel');
const StudentProgress = require('../../models/studentProgressModel');
const MockSession = require('../../models/mockSessionModel');
const Attempt = require('../../models/attemptModel');
const patternRegistryService = require('../patternRegistryService');
const hierarchyService = require('../hierarchyService');
const AppError = require('../../utils/AppError');
const {
  ANALYTICS_ALGORITHM_VERSION,
  READINESS_WEIGHTS,
  PREREQUISITE_UNMET_THRESHOLD,
} = require('../../config/analyticsConfig');
const {
  roundTo,
  getMasteryLabel,
} = require('./analyticsMathUtils');

/**
 * Reconstructs the canonical (topic, pattern) scope from a mock session's blueprintSnapshot.
 *
 * @param {Object} blueprintSnapshot
 * @returns {Array<{ topic: string, pattern: string }>|null} Array of canonical pairs, or null if ambiguous
 */
const reconstructMockScopePatterns = (blueprintSnapshot) => {
  if (!blueprintSnapshot || !Array.isArray(blueprintSnapshot.sections) || blueprintSnapshot.sections.length === 0) {
    return null;
  }

  const scopePatternsMap = new Map();

  for (const section of blueprintSnapshot.sections) {
    const scope = section.scope;
    if (!scope) return null;

    if (scope.allCanonicalPatterns === true) {
      const allCanonical = patternRegistryService.getAllCanonicalPatterns();
      for (const p of allCanonical) {
        scopePatternsMap.set(`${p.topic}:::${p.pattern}`, p);
      }
    } else if (Array.isArray(scope.patterns) && scope.patterns.length > 0) {
      for (const patName of scope.patterns) {
        const owningTopic = patternRegistryService.getTopicForPattern(patName);
        if (!owningTopic) return null;
        scopePatternsMap.set(`${owningTopic}:::${patName}`, { topic: owningTopic, pattern: patName });
      }
    } else if (Array.isArray(scope.topics) && scope.topics.length > 0) {
      for (const topName of scope.topics) {
        const topicPatterns = patternRegistryService.getPatternsByTopic(topName);
        if (!topicPatterns) return null;
        for (const p of topicPatterns) {
          scopePatternsMap.set(`${topName}:::${p.name}`, { topic: topName, pattern: p.name });
        }
      }
    } else {
      return null;
    }
  }

  return Array.from(scopePatternsMap.values());
};

/**
 * Computes Goal Readiness Index and diagnostics for a student's goal.
 *
 * @param {string} userId
 * @param {string} goalId
 * @param {Date} referenceNow
 * @returns {Promise<Object>}
 */
const getGoalReadiness = async (userId, goalId, referenceNow = new Date()) => {
  // 1. Validate Goal ID syntax
  if (!mongoose.Types.ObjectId.isValid(goalId)) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Invalid goalId format.');
  }

  // 2. Goal Existence & Ownership Validation
  const goal = await Goal.findById(goalId).lean();
  if (!goal) {
    throw new AppError(404, 'GOAL_NOT_FOUND', `Goal with id "${goalId}" was not found.`);
  }

  if (goal.userId !== userId) {
    throw new AppError(403, 'FORBIDDEN', 'Access to goal denied. You do not own this goal.');
  }

  const baseResponse = {
    goalId: String(goal._id),
    goalTitle: goal.title,
    targetDate: goal.targetDate ? goal.targetDate.toISOString() : null,
    algorithmVersion: ANALYTICS_ALGORITHM_VERSION,
  };

  // 3. Resolve Linked Active StudyPlan
  const linkedPlanDocs = await StudyPlan.find({
    goalId: goal._id,
    userId,
    status: 'active',
  })
    .sort({ startDate: -1, _id: 1 })
    .limit(1)
    .lean();

  if (linkedPlanDocs.length === 0) {
    return {
      ...baseResponse,
      readinessStatus: 'insufficient_data',
      readinessScore: null,
      reason: 'NO_STUDY_PLAN_LINKED_TO_GOAL',
      components: {
        planTargetCoverage: null,
        masteryDepth: null,
        eligibleMockPerformance: null,
        eligibleMockPacing: null,
      },
      criticalPrerequisiteBottlenecks: [],
    };
  }

  const linkedPlan = linkedPlanDocs[0];
  const targets = linkedPlan.targets;

  if (!Array.isArray(targets) || targets.length === 0) {
    return {
      ...baseResponse,
      readinessStatus: 'insufficient_data',
      readinessScore: null,
      reason: 'STUDY_PLAN_HAS_NO_TARGETS',
      components: {
        planTargetCoverage: null,
        masteryDepth: null,
        eligibleMockPerformance: null,
        eligibleMockPacing: null,
      },
      criticalPrerequisiteBottlenecks: [],
    };
  }

  // 4. Target Shape Normalization Gate
  const normalizedTargets = [];
  for (const t of targets) {
    if (!t || typeof t.topic !== 'string' || typeof t.pattern !== 'string') {
      return {
        ...baseResponse,
        readinessStatus: 'insufficient_data',
        readinessScore: null,
        reason: 'UNSUPPORTED_STUDY_PLAN_TARGET_SHAPE',
        components: {
          planTargetCoverage: null,
          masteryDepth: null,
          eligibleMockPerformance: null,
          eligibleMockPacing: null,
        },
        criticalPrerequisiteBottlenecks: [],
      };
    }

    const trimmedTopic = t.topic.trim();
    const trimmedPattern = t.pattern.trim();

    if (!trimmedTopic || !trimmedPattern) {
      return {
        ...baseResponse,
        readinessStatus: 'insufficient_data',
        readinessScore: null,
        reason: 'UNSUPPORTED_STUDY_PLAN_TARGET_SHAPE',
        components: {
          planTargetCoverage: null,
          masteryDepth: null,
          eligibleMockPerformance: null,
          eligibleMockPacing: null,
        },
        criticalPrerequisiteBottlenecks: [],
      };
    }

    if (!patternRegistryService.topicExists(trimmedTopic) || !patternRegistryService.patternExists(trimmedPattern)) {
      return {
        ...baseResponse,
        readinessStatus: 'insufficient_data',
        readinessScore: null,
        reason: 'UNSUPPORTED_STUDY_PLAN_TARGET_SHAPE',
        components: {
          planTargetCoverage: null,
          masteryDepth: null,
          eligibleMockPerformance: null,
          eligibleMockPacing: null,
        },
        criticalPrerequisiteBottlenecks: [],
      };
    }

    // Authoritative Phase 2/4/6 argument order: patternBelongsToTopic(pattern, topic)
    if (!patternRegistryService.patternBelongsToTopic(trimmedPattern, trimmedTopic)) {
      return {
        ...baseResponse,
        readinessStatus: 'insufficient_data',
        readinessScore: null,
        reason: 'UNSUPPORTED_STUDY_PLAN_TARGET_SHAPE',
        components: {
          planTargetCoverage: null,
          masteryDepth: null,
          eligibleMockPerformance: null,
          eligibleMockPacing: null,
        },
        criticalPrerequisiteBottlenecks: [],
      };
    }

    // targetQuestions validation
    let quotaAvailable = false;
    let targetQuestions = null;
    if (t.targetQuestions !== undefined && t.targetQuestions !== null) {
      if (!Number.isInteger(t.targetQuestions) || t.targetQuestions <= 0) {
        return {
          ...baseResponse,
          readinessStatus: 'insufficient_data',
          readinessScore: null,
          reason: 'UNSUPPORTED_STUDY_PLAN_TARGET_SHAPE',
          components: {
            planTargetCoverage: null,
            masteryDepth: null,
            eligibleMockPerformance: null,
            eligibleMockPacing: null,
          },
          criticalPrerequisiteBottlenecks: [],
        };
      }
      quotaAvailable = true;
      targetQuestions = t.targetQuestions;
    }

    // targetMastery validation
    let effectiveTargetMastery = 0.85;
    if (t.targetMastery !== undefined && t.targetMastery !== null) {
      if (typeof t.targetMastery !== 'number' || !Number.isFinite(t.targetMastery) || t.targetMastery < 0 || t.targetMastery > 1) {
        return {
          ...baseResponse,
          readinessStatus: 'insufficient_data',
          readinessScore: null,
          reason: 'UNSUPPORTED_STUDY_PLAN_TARGET_SHAPE',
          components: {
            planTargetCoverage: null,
            masteryDepth: null,
            eligibleMockPerformance: null,
            eligibleMockPacing: null,
          },
          criticalPrerequisiteBottlenecks: [],
        };
      }
      effectiveTargetMastery = t.targetMastery;
    }

    normalizedTargets.push({
      topic: trimmedTopic,
      pattern: trimmedPattern,
      quotaAvailable,
      targetQuestions,
      effectiveTargetMastery,
    });
  }

  // Pre-load supporting data: DailyObjectives, StudentProgress, Mocks, Attempts
  const [dailyObjectives, studentProgressDocs] = await Promise.all([
    DailyObjective.find({ planId: linkedPlan._id, userId }).lean(),
    StudentProgress.find({ userId }).lean(),
  ]);

  const progressByPattern = new Map();
  for (const sp of studentProgressDocs) {
    progressByPattern.set(`${sp.topic}:::${sp.pattern}`, sp);
  }

  // ── Component 1: Plan Target Coverage (C_plan, Base Weight 0.30) ─────────────
  let completedTargets = 0;
  let quotaSatisfiedTargets = 0;
  let masterySatisfiedTargets = 0;
  const totalTargets = normalizedTargets.length;

  for (const nt of normalizedTargets) {
    let completedQuestions = 0;
    for (const obj of dailyObjectives) {
      if (obj.topic === nt.topic && Array.isArray(obj.patterns)) {
        for (const p of obj.patterns) {
          if (p.pattern === nt.pattern && Number.isFinite(p.completedQuestions)) {
            completedQuestions += p.completedQuestions;
          }
        }
      }
    }

    const quotaSatisfied = nt.quotaAvailable && completedQuestions >= nt.targetQuestions;
    if (quotaSatisfied) {
      quotaSatisfiedTargets += 1;
    }

    const progress = progressByPattern.get(`${nt.topic}:::${nt.pattern}`);
    const masterySatisfied = Boolean(progress && progress.mastery >= nt.effectiveTargetMastery);
    if (masterySatisfied) {
      masterySatisfiedTargets += 1;
    }

    const targetSatisfied = quotaSatisfied || masterySatisfied;
    if (targetSatisfied) {
      completedTargets += 1;
    }
  }

  const rawPlanTargetCoverage = totalTargets > 0 ? completedTargets / totalTargets : null;

  // ── Component 2: Mastery Depth (M_depth, Base Weight 0.35) ───────────────────
  let sumMastery = 0;
  let targetPatternsWithMastery = 0;

  for (const nt of normalizedTargets) {
    const progress = progressByPattern.get(`${nt.topic}:::${nt.pattern}`);
    if (progress) {
      targetPatternsWithMastery += 1;
      sumMastery += progress.mastery;
    }
  }

  const rawMasteryDepth = totalTargets > 0 ? sumMastery / totalTargets : null;

  // ── Component 3 & 4: Mock Performance & Pacing ──────────────────────────────
  // Build PlanTargetPatterns set
  const planTargetKeySet = new Set();
  for (const nt of normalizedTargets) {
    planTargetKeySet.add(`${nt.topic}:::${nt.pattern}`);
  }

  const terminalStandardMocks = await MockSession.find({
    userId,
    status: { $in: ['submitted', 'expired'] },
    finalizationState: 'completed',
    mode: 'standard',
  }).lean();

  const eligibleMocks = [];
  for (const session of terminalStandardMocks) {
    const scopePatterns = reconstructMockScopePatterns(session.blueprintSnapshot);
    if (!scopePatterns || scopePatterns.length === 0) {
      continue;
    }

    // Verify MockScopePatterns ⊆ PlanTargetPatterns
    let isSubset = true;
    for (const p of scopePatterns) {
      if (!planTargetKeySet.has(`${p.topic}:::${p.pattern}`)) {
        isSubset = false;
        break;
      }
    }

    if (isSubset) {
      eligibleMocks.push(session);
    }
  }

  // Component 3: Eligible Mock Performance
  let rawMockPerformance = null;
  const eligibleMocksCount = eligibleMocks.length;

  if (eligibleMocksCount > 0) {
    let sumPercentage = 0;
    for (const em of eligibleMocks) {
      const pct = em.resultSummary?.overall?.percentage ?? 0;
      sumPercentage += pct / 100.0;
    }
    rawMockPerformance = sumPercentage / eligibleMocksCount;
  }

  // Component 4: Eligible Mock Pacing
  let rawMockPacing = null;
  const validPacingEfficiencies = [];

  for (const em of eligibleMocks) {
    if (em.durationMinutes > 0 && em.totalQuestions > 0) {
      const allowedAverageSeconds = (em.durationMinutes * 60) / em.totalQuestions;

      const mockAttempts = await Attempt.find({
        userId,
        source: 'mock',
        sessionId: String(em._id),
      }).lean();

      const answeredAttemptCount = mockAttempts.length;
      if (answeredAttemptCount > 0) {
        let sumTime = 0;
        for (const ma of mockAttempts) {
          sumTime += ma.timeTaken;
        }
        const actualAverageTime = sumTime / answeredAttemptCount;

        if (actualAverageTime > 0) {
          const efficiency = Math.min(1.0, allowedAverageSeconds / actualAverageTime);
          validPacingEfficiencies.push(efficiency);
        }
      }
    }
  }

  if (validPacingEfficiencies.length > 0) {
    let sumEff = 0;
    for (const eff of validPacingEfficiencies) {
      sumEff += eff;
    }
    rawMockPacing = sumEff / validPacingEfficiencies.length;
  }

  // ── Dynamic Weight Renormalization ──────────────────────────────────────────
  if (rawPlanTargetCoverage === null || rawMasteryDepth === null) {
    return {
      ...baseResponse,
      readinessStatus: 'insufficient_data',
      readinessScore: null,
      components: {
        planTargetCoverage: null,
        masteryDepth: null,
        eligibleMockPerformance: null,
        eligibleMockPacing: null,
      },
      criticalPrerequisiteBottlenecks: [],
    };
  }

  const componentValues = [
    { key: 'planTargetCoverage', rawValue: rawPlanTargetCoverage, baseWeight: READINESS_WEIGHTS.planTargetCoverage },
    { key: 'masteryDepth', rawValue: rawMasteryDepth, baseWeight: READINESS_WEIGHTS.masteryDepth },
    { key: 'eligibleMockPerformance', rawValue: rawMockPerformance, baseWeight: READINESS_WEIGHTS.eligibleMockPerformance },
    { key: 'eligibleMockPacing', rawValue: rawMockPacing, baseWeight: READINESS_WEIGHTS.eligibleMockPacing },
  ];

  let totalActiveBaseWeight = 0;
  for (const cv of componentValues) {
    if (cv.rawValue !== null) {
      totalActiveBaseWeight += cv.baseWeight;
    }
  }

  let rawReadinessScore = 0;
  const componentsDto = {};

  for (const cv of componentValues) {
    if (cv.rawValue !== null) {
      const normalizedWeight = cv.baseWeight / totalActiveBaseWeight;
      const effectiveWeight = roundTo(normalizedWeight, 4);
      rawReadinessScore += normalizedWeight * cv.rawValue;

      if (cv.key === 'planTargetCoverage') {
        componentsDto.planTargetCoverage = {
          value: roundTo(cv.rawValue, 2),
          weight: cv.baseWeight,
          effectiveWeight,
          completedTargets,
          totalTargets,
          quotaSatisfiedTargets,
          masterySatisfiedTargets,
        };
      } else if (cv.key === 'masteryDepth') {
        componentsDto.masteryDepth = {
          value: roundTo(cv.rawValue, 2),
          weight: cv.baseWeight,
          effectiveWeight,
          targetPatternsWithMastery,
          averageMastery: roundTo(cv.rawValue, 2),
        };
      } else if (cv.key === 'eligibleMockPerformance') {
        componentsDto.eligibleMockPerformance = {
          value: roundTo(cv.rawValue, 2),
          weight: cv.baseWeight,
          effectiveWeight,
          eligibleMocksCount,
        };
      } else if (cv.key === 'eligibleMockPacing') {
        componentsDto.eligibleMockPacing = {
          value: roundTo(cv.rawValue, 2),
          weight: cv.baseWeight,
          effectiveWeight,
          averagePacingEfficiency: roundTo(cv.rawValue, 2),
        };
      }
    } else {
      if (cv.key === 'eligibleMockPerformance') {
        componentsDto.eligibleMockPerformance = {
          value: null,
          weight: cv.baseWeight,
          effectiveWeight: 0.0,
          eligibleMocksCount: 0,
        };
      } else if (cv.key === 'eligibleMockPacing') {
        componentsDto.eligibleMockPacing = {
          value: null,
          weight: cv.baseWeight,
          effectiveWeight: 0.0,
          averagePacingEfficiency: null,
        };
      }
    }
  }

  const readinessScore = roundTo(rawReadinessScore, 2);

  // ── Critical Prerequisite Bottlenecks ───────────────────────────────────────
  const bottleneckCandidates = [];

  for (const nt of normalizedTargets) {
    const immediatePrereqs = hierarchyService.getPrerequisites(nt.pattern) || [];

    for (const q of immediatePrereqs) {
      const owningTopic = patternRegistryService.getTopicForPattern(q);
      const progress = progressByPattern.get(`${owningTopic}:::${q}`);
      const rawMastery = progress ? progress.mastery : 0.0;

      if (rawMastery < PREREQUISITE_UNMET_THRESHOLD) {
        const masteryLabel = getMasteryLabel(rawMastery);
        bottleneckCandidates.push({
          targetPattern: nt.pattern,
          unmasteredPrerequisite: q,
          prerequisiteMastery: roundTo(rawMastery, 2),
          rawMastery,
          masteryLabel,
          targetRegistryIndex: patternRegistryService.getPatternRegistryIndex(nt.pattern),
          prereqRegistryIndex: patternRegistryService.getPatternRegistryIndex(q),
        });
      }
    }
  }

  // Deterministic sorting
  bottleneckCandidates.sort((a, b) => {
    // 1. prerequisiteMastery ascending (raw)
    if (a.rawMastery !== b.rawMastery) {
      return a.rawMastery - b.rawMastery;
    }
    // 2. target pattern canonical registry index ascending
    if (a.targetRegistryIndex !== b.targetRegistryIndex) {
      return a.targetRegistryIndex - b.targetRegistryIndex;
    }
    // 3. prerequisite canonical registry index ascending
    if (a.prereqRegistryIndex !== b.prereqRegistryIndex) {
      return a.prereqRegistryIndex - b.prereqRegistryIndex;
    }
    // 4. targetPattern lexical fallback
    const targetComp = a.targetPattern.localeCompare(b.targetPattern);
    if (targetComp !== 0) return targetComp;
    // 5. unmasteredPrerequisite lexical fallback
    return a.unmasteredPrerequisite.localeCompare(b.unmasteredPrerequisite);
  });

  const criticalPrerequisiteBottlenecks = bottleneckCandidates.map((b) => ({
    targetPattern: b.targetPattern,
    unmasteredPrerequisite: b.unmasteredPrerequisite,
    prerequisiteMastery: b.prerequisiteMastery,
    masteryLabel: b.masteryLabel,
  }));

  return {
    ...baseResponse,
    readinessStatus: 'calculated',
    readinessScore,
    components: componentsDto,
    criticalPrerequisiteBottlenecks,
  };
};

module.exports = {
  getGoalReadiness,
  reconstructMockScopePatterns,
};
