'use strict';

/**
 * fallbackService.js — Strictly Grounded Deterministic Fallback Builders
 *
 * Implements deterministic fallback generation adhering to public schemas,
 * length bounds, and non-fabrication invariants across all six tasks.
 */

const { composeAuthorizedLevel5Hint, boundAuthoritativeText } = require('../../utils/learning/authoritativeTextUtils');
const { validateHintContentLeakage } = require('../../utils/learning/hintLeakageUtils');
const { PLANNING_REASON_CODES } = require('../../config/planningConfig');

/**
 * 1. Concept Tutor Deterministic Fallback
 */
function buildTutorFallback({ topic, pattern }) {
  return {
    topic,
    pattern,
    conceptExplanation: 'A verified deterministic explanation is not available while the language model service is unavailable.',
    formulaSummary: null,
    workedExample: null,
    keyTakeaway: 'Review the canonical pattern and prerequisites before continuing.',
  };
}

/**
 * 2. Progressive Hint Deterministic Fallback
 */
function buildHintFallback({ hintLevel, question, topicContext }) {
  const level = Number(hintLevel);

  if (level === 5) {
    const composed = composeAuthorizedLevel5Hint({
      answer: question.answer,
      explanation: question.explanation,
      maxLength: 600,
    });

    return {
      hintLevel: 5,
      hint: composed,
      revealsAnswer: true,
      nextAction: 'view_explanation',
    };
  }

  const pattern = topicContext?.pattern || question.pattern || 'canonical pattern';
  let hintText = '';
  let nextAction = 'try_calculation';

  switch (level) {
    case 1:
      hintText = `Focus on the core concept of the ${pattern} pattern. Identify the known quantities and the unknown to solve.`;
      nextAction = 'try_calculation';
      break;
    case 2:
      hintText = `Recall the general strategy for ${pattern}. Set up the mathematical relationship before substituting values.`;
      nextAction = 'try_calculation';
      break;
    case 3:
      hintText = `Assign variables based on the given quantities in the problem stem, and write down the corresponding formula.`;
      nextAction = 'try_calculation';
      break;
    case 4:
      hintText = `Substitute the known values into the equation and carry out the preliminary simplification.`;
      nextAction = 'review_formula';
      break;
    default:
      hintText = `Review the problem stem and apply the core principles of ${pattern}.`;
      nextAction = 'try_calculation';
      break;
  }

  // Self-validation: check for answer leakage
  const isSafe = validateHintContentLeakage(hintText, false, question);
  if (!isSafe) {
    // Fail-closed degradation to static number-free template
    hintText = 'Review the problem statement and identify the given quantities.';
    nextAction = 'try_calculation';
  }

  return {
    hintLevel: level,
    hint: hintText,
    revealsAnswer: false,
    nextAction,
  };
}

/**
 * 3. Mistake Explanation Deterministic Fallback
 */
function buildAttemptExplanationFallback({ attempt, question, topicContext }) {
  const isCorrect = attempt.isCorrect === true;
  const pattern = topicContext?.pattern || question.pattern || 'canonical pattern';

  const boundedExplanation = boundAuthoritativeText(question.explanation, 800) || 'The stored canonical explanation is unavailable.';

  if (isCorrect) {
    return {
      conceptSummary: `You applied the ${pattern} pattern correctly.`,
      mistakeExplanation: 'Your selected answer matches the canonical answer.',
      correctApproach: boundedExplanation,
      revisionSuggestion: pattern,
      confidence: null,
    };
  }

  return {
    conceptSummary: `Review the ${pattern} pattern.`,
    mistakeExplanation: 'Your selected answer differs from the canonical answer.',
    correctApproach: boundedExplanation,
    revisionSuggestion: pattern,
    confidence: null,
  };
}

/**
 * 4. Progress Coaching Deterministic Fallback
 */
function buildProgressFallback({ progressContext, topicContext }) {
  const pattern = topicContext?.pattern || 'this pattern';
  const mastery = progressContext?.mastery ?? 0;
  const masteryLabel = progressContext?.masteryLabel ?? 'weak';

  const strengths = [];
  if (progressContext && progressContext.consecutiveCorrect > 1) {
    strengths.push(`Current streak: ${progressContext.consecutiveCorrect} correct attempts.`);
  }
  if (progressContext && progressContext.recentAccuracy >= 80) {
    strengths.push(`Strong recent accuracy of ${progressContext.recentAccuracy}%.`);
  }

  const weaknesses = [];
  if (progressContext && progressContext.consecutiveIncorrect > 1) {
    weaknesses.push(`Recent difficulty with ${progressContext.consecutiveIncorrect} consecutive incorrect attempts.`);
  }

  return {
    masteryInterpretation: `Current mastery for ${pattern} is ${mastery} (${masteryLabel}).`,
    strengths: strengths.slice(0, 4),
    weaknesses: weaknesses.slice(0, 4),
    recommendedAction: 'Continue targeted practice on recommended patterns to advance mastery.',
  };
}

/**
 * 5. Study Plan Deterministic Fallback
 */
function buildPlanFallback({ studyPlan, dailyObjective, revisionItem = null, revisionReasonCode = null }) {
  const planId = String(studyPlan._id);
  const targetDate = dailyObjective.date instanceof Date
    ? dailyObjective.date.toISOString().split('T')[0]
    : String(dailyObjective.date);

  const patterns = dailyObjective.patterns || [];
  const targetQuestions = patterns.reduce((sum, p) => sum + (p.targetQuestions || 0), 0);
  const completedQuestions = patterns.reduce((sum, p) => sum + (p.completedQuestions || 0), 0);

  let revisionSummary = null;
  if (revisionItem) {
    const revDate = revisionItem.nextReviewDate instanceof Date
      ? revisionItem.nextReviewDate.toISOString().split('T')[0]
      : String(revisionItem.nextReviewDate);
    revisionSummary = `Stage ${revisionItem.stage} revision due on ${revDate}.`;
  }

  return {
    planId,
    targetDate,
    objectiveSummary: `Scheduled daily objective: ${targetQuestions} questions (${completedQuestions} completed).`,
    schedulingReasons: [PLANNING_REASON_CODES.PLAN_GENERATED],
    revisionSummary,
    recommendedAction: 'Complete the assigned daily question quota.',
  };
}

/**
 * 6. Mock Review Deterministic Fallback
 */
function buildMockReviewFallback({ mockSession, resultSummary = {} }) {
  const rawScore = resultSummary.rawScore ?? 0;
  const maxScore = resultSummary.maxPossibleScore ?? 0;
  const pct = resultSummary.percentage ?? 0;
  const accuracy = resultSummary.accuracy ?? 0;

  const sectionDiagnostics = (mockSession.sectionStates || []).map((sec) => {
    const secResult = (resultSummary.sections || []).find((s) => String(s.sectionId) === String(sec.sectionId));
    const secAccuracy = secResult?.accuracy ?? 0;
    return {
      sectionId: String(sec.sectionId),
      diagnosticMessage: `Section completed with accuracy ${secAccuracy}%.`,
      performanceTier: null,
    };
  });

  return {
    overallScoreInterpretation: `Overall score: ${rawScore}/${maxScore} (${pct}%). Accuracy: ${accuracy}%.`,
    sectionDiagnostics,
    pacingObservations: 'Pacing observations unavailable in degraded mode.',
    priorityRevisionPatterns: [],
  };
}

module.exports = {
  buildTutorFallback,
  buildHintFallback,
  buildAttemptExplanationFallback,
  buildProgressFallback,
  buildPlanFallback,
  buildMockReviewFallback,
};
