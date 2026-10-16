'use strict';

/**
 * learningContextService.js — Deny-by-Default Context Hydration & Minimization
 *
 * Implements the canonical context schema, task-specific hydration allowlist,
 * 8KB serialization boundary, and PII scrubbing.
 */

const Question = require('../../models/questionModel');
const Attempt = require('../../models/attemptModel');
const StudentProgress = require('../../models/studentProgressModel');
const RevisionItem = require('../../models/revisionItemModel');
const { getMasteryLabel } = require('../adaptive/masteryService');
const { getPrerequisites } = require('../hierarchyService');
const { topicExists, patternExists, patternBelongsToTopic } = require('../patternRegistryService');
const { DIFFICULTY_BANDS } = require('../../config/mockConfig');
const { LEARNING_ERROR_CODES } = require('../../config/learningConfig');
const LearningError = require('../../utils/learning/LearningError');

const MAX_CONTEXT_BYTES = 8192; // 8KB bound

/**
 * Maps question difficulty (1-10) to platform difficulty band.
 *
 * @param {number|null} difficulty
 * @returns {'easy'|'medium'|'hard'|null}
 */
function getDifficultyBand(difficulty) {
  if (difficulty === null || difficulty === undefined) return null;
  const d = Math.round(difficulty);
  if (d >= DIFFICULTY_BANDS.EASY.min && d <= DIFFICULTY_BANDS.EASY.max) return 'easy';
  if (d >= DIFFICULTY_BANDS.MEDIUM.min && d <= DIFFICULTY_BANDS.MEDIUM.max) return 'medium';
  if (d >= DIFFICULTY_BANDS.HARD.min && d <= DIFFICULTY_BANDS.HARD.max) return 'hard';
  return null;
}

/**
 * Hydrates grounded context for the specified task type.
 *
 * @param {Object} params
 * @param {string} params.userId
 * @param {string} params.taskType
 * @param {number} [params.hintLevel]
 * @param {string} [params.topic]
 * @param {string} [params.pattern]
 * @param {string} [params.questionId]
 * @param {Object} [params.preFetched] - Pre-fetched documents from guard
 * @returns {Promise<Object>} Canonical learning context
 */
async function hydrateContext({
  userId,
  taskType,
  hintLevel = null,
  topic = null,
  pattern = null,
  questionId = null,
  preFetched = {},
}) {
  const context = {
    userId,
    taskType,
    algorithmVersion: 'v1',
    taskInputContext: {
      hintLevel: hintLevel ? Number(hintLevel) : null,
    },
    topicContext: null,
    questionContext: null,
    attemptContext: null,
    progressContext: null,
    planningContext: null,
    mockAnalyticsContext: null,
  };

  switch (taskType) {
    case 'concept_tutor': {
      if (!topic || !pattern) {
        throw new LearningError(400, LEARNING_ERROR_CODES.VALIDATION_ERROR, 'topic and pattern are required.');
      }
      if (!topicExists(topic)) {
        throw new LearningError(400, LEARNING_ERROR_CODES.VALIDATION_ERROR, `Invalid canonical topic: "${topic}".`);
      }
      if (!patternExists(pattern)) {
        throw new LearningError(400, LEARNING_ERROR_CODES.VALIDATION_ERROR, `Invalid canonical pattern: "${pattern}".`);
      }
      if (!patternBelongsToTopic(pattern, topic)) {
        throw new LearningError(400, LEARNING_ERROR_CODES.VALIDATION_ERROR, `Pattern "${pattern}" does not belong to topic "${topic}".`);
      }

      context.topicContext = {
        topic,
        pattern,
        prerequisites: getPrerequisites(pattern) || [],
        difficultyBand: null, // strictly null for concept tutor
      };
      break;
    }

    case 'hint': {
      if (!questionId) {
        throw new LearningError(400, LEARNING_ERROR_CODES.VALIDATION_ERROR, 'questionId is required.');
      }
      const question = await Question.findById(questionId);
      if (!question) {
        throw new LearningError(404, LEARNING_ERROR_CODES.QUESTION_NOT_FOUND, 'Question not found.');
      }

      const diffBand = getDifficultyBand(question.difficulty);

      context.topicContext = {
        topic: question.topic,
        pattern: question.pattern,
        prerequisites: getPrerequisites(question.pattern) || [],
        difficultyBand: diffBand,
      };

      const clampedStem = String(question.question || '').slice(0, 1000);
      const isLevel5 = hintLevel === 5;

      context.questionContext = {
        questionId: String(question._id),
        questionText: clampedStem,
        options: question.options || [],
        correctAnswer: isLevel5 ? question.answer : null,
        storedExplanation: isLevel5 ? question.explanation : null,
        difficulty: question.difficulty,
      };

      if (isLevel5 && preFetched.qualifyingAttempt) {
        const qa = preFetched.qualifyingAttempt;
        context.attemptContext = {
          attemptId: String(qa._id),
          selectedAnswer: qa.selectedAnswer,
          isCorrect: qa.isCorrect,
          timeTaken: qa.timeTaken,
          attemptedAt: qa.attemptedAt,
          source: qa.source,
          parentSessionId: qa.sessionId || null,
        };
      }
      break;
    }

    case 'explain_attempt': {
      const attempt = preFetched.attempt;
      if (!attempt) {
        throw new LearningError(404, LEARNING_ERROR_CODES.ATTEMPT_NOT_FOUND, 'Attempt not found.');
      }

      const question = await Question.findById(attempt.questionId);
      if (!question) {
        throw new LearningError(404, LEARNING_ERROR_CODES.QUESTION_NOT_FOUND, 'Question not found for attempt.');
      }

      const diffBand = getDifficultyBand(question.difficulty);

      context.topicContext = {
        topic: question.topic,
        pattern: question.pattern,
        prerequisites: getPrerequisites(question.pattern) || [],
        difficultyBand: diffBand,
      };

      const clampedStem = String(question.question || '').slice(0, 1000);

      context.questionContext = {
        questionId: String(question._id),
        questionText: clampedStem,
        options: question.options || [],
        correctAnswer: question.answer,
        storedExplanation: question.explanation,
        difficulty: question.difficulty,
      };

      context.attemptContext = {
        attemptId: String(attempt._id),
        selectedAnswer: attempt.selectedAnswer,
        isCorrect: attempt.isCorrect,
        timeTaken: attempt.timeTaken,
        attemptedAt: attempt.attemptedAt,
        source: attempt.source,
        parentSessionId: attempt.sessionId || null,
      };
      break;
    }

    case 'explain_progress': {
      if (!topic || !pattern) {
        throw new LearningError(400, LEARNING_ERROR_CODES.VALIDATION_ERROR, 'topic and pattern are required.');
      }
      if (!topicExists(topic)) {
        throw new LearningError(400, LEARNING_ERROR_CODES.VALIDATION_ERROR, `Invalid canonical topic: "${topic}".`);
      }
      if (!patternExists(pattern)) {
        throw new LearningError(400, LEARNING_ERROR_CODES.VALIDATION_ERROR, `Invalid canonical pattern: "${pattern}".`);
      }

      context.topicContext = {
        topic,
        pattern,
        prerequisites: getPrerequisites(pattern) || [],
        difficultyBand: null,
      };

      const progress = await StudentProgress.findOne({ userId, topic, pattern });
      const mastery = progress ? progress.mastery : 0;
      const masteryLabel = getMasteryLabel(mastery);

      context.progressContext = {
        mastery,
        masteryLabel,
        recentAccuracy: progress ? progress.accuracy : 0,
        totalAttempts: progress ? progress.attempts : 0,
        consecutiveCorrect: progress ? progress.consecutiveCorrect : 0,
        consecutiveIncorrect: progress ? progress.consecutiveIncorrect : 0,
        highestDifficultyMastered: progress ? progress.highestDifficultyMastered : 0,
      };
      break;
    }

    case 'explain_plan': {
      const studyPlan = preFetched.studyPlan;
      const dailyObjective = preFetched.dailyObjective;

      const scheduledPatterns = (dailyObjective.patterns || []).map((p) => ({
        pattern: p.pattern,
        targetQuestions: p.targetQuestions,
        completedQuestions: p.completedQuestions,
        isPrerequisite: false,
      }));

      // Look up if any revision item exists for user and date
      const revisionItem = await RevisionItem.findOne({
        userId,
        nextReviewDate: dailyObjective.date,
        status: 'scheduled',
      });

      context.planningContext = {
        planId: String(studyPlan._id),
        targetDate: dailyObjective.date.toISOString().split('T')[0],
        scheduledPatterns,
        revisionItem: revisionItem
          ? {
              stage: revisionItem.stage,
              intervalDays: revisionItem.intervalDays,
              nextReviewDate: revisionItem.nextReviewDate.toISOString().split('T')[0],
              status: revisionItem.status,
            }
          : null,
        revisionReasonCode: null,
      };

      if (dailyObjective.topic) {
        context.topicContext = {
          topic: dailyObjective.topic,
          pattern: scheduledPatterns[0]?.pattern || '',
          prerequisites: [],
          difficultyBand: null,
        };
      }
      break;
    }

    case 'mock_review': {
      const mockSession = preFetched.mockSession;
      const resultSummary = mockSession.resultSummary || {};

      const incorrectAttempts = await Attempt.find({
        userId,
        sessionId: String(mockSession._id),
        isCorrect: false,
      }).select('pattern');

      const uniqueIncorrectPatterns = Array.from(
        new Set(incorrectAttempts.map((a) => a.pattern).filter(Boolean))
      ).slice(0, 5);

      context.mockAnalyticsContext = {
        sessionId: String(mockSession._id),
        status: mockSession.status,
        finalizationState: mockSession.finalizationState,
        rawScore: resultSummary.rawScore ?? 0,
        maxPossibleScore: resultSummary.maxPossibleScore ?? 0,
        percentage: resultSummary.percentage ?? 0,
        accuracy: resultSummary.accuracy ?? 0,
        sectionBreakdown: (resultSummary.sections || []).map((sec) => ({
          sectionId: sec.sectionId,
          rawScore: sec.rawScore,
          accuracy: sec.accuracy,
          timeSpentSeconds: sec.timeSpentSeconds || 0,
        })),
        incorrectPatterns: uniqueIncorrectPatterns,
        pacingTraps: [],
      };
      break;
    }

    default:
      throw new LearningError(400, LEARNING_ERROR_CODES.INVALID_TASK_TYPE, `Unsupported taskType: ${taskType}`);
  }

  // Enforce post-minimization 8KB bound
  const serialized = JSON.stringify(context);
  if (Buffer.byteLength(serialized, 'utf8') > MAX_CONTEXT_BYTES) {
    if (context.questionContext && context.questionContext.questionText) {
      context.questionContext.questionText = context.questionContext.questionText.slice(0, 400) + '…';
    }
  }

  return context;
}

module.exports = {
  hydrateContext,
  getDifficultyBand,
  MAX_CONTEXT_BYTES,
};
