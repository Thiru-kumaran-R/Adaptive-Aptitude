'use strict';

/**
 * src/services/adaptive/questionSelectionService.js
 *
 * Implements deterministic question selection with:
 *   - Recent question ID exclusion (up to RECENT_QUESTION_EXCLUSION_LIMIT = 20)
 *   - Outward difficulty fallback search (T, T-1, T+1, T-2, T+2, ...)
 *   - Deterministic selection among equally eligible questions (MongoDB _id ascending)
 *   - Deterministic exclusion relaxation (least recently attempted, tie-broken by _id ascending)
 *   - True NO_QUESTION_AVAILABLE error handling
 *   - ZERO ANSWER LEAKAGE: Sanitizes Question DTO to completely omit answer, correctAnswer, and explanation
 */

const Question = require('../../models/questionModel');
const Attempt = require('../../models/attemptModel');
const config = require('../../config/adaptiveConfig');

/**
 * Generate outward difficulty sequence centered around target T in range [1, 10].
 * Example: T = 5 => [5, 4, 6, 3, 7, 2, 8, 1, 9, 10]
 *
 * @param {number} target - Target difficulty (1-10)
 * @returns {number[]} Sequence of difficulties
 */
const getOutwardDifficultySequence = (target) => {
  const sequence = [target];
  for (let step = 1; step <= 9; step++) {
    const down = target - step;
    const up = target + step;
    if (down >= 1 && !sequence.includes(down)) {
      sequence.push(down);
    }
    if (up <= 10 && !sequence.includes(up)) {
      sequence.push(up);
    }
  }
  return sequence;
};

/**
 * Sanitize a question document to prevent answer leakage.
 * Omits answer, correctAnswer, explanation, and internal properties.
 *
 * @param {object} rawQuestion
 * @returns {{ _id: any, question: string, options: string[], topic: string, pattern: string, difficulty: number }}
 */
const sanitizeQuestionDTO = (rawQuestion) => {
  return {
    _id: rawQuestion._id,
    question: rawQuestion.question,
    options: rawQuestion.options,
    topic: rawQuestion.topic,
    pattern: rawQuestion.pattern,
    difficulty: rawQuestion.difficulty,
  };
};

/**
 * Select a single question deterministically for a user, topic, pattern, and targetDifficulty.
 *
 * @param {string} userId
 * @param {string} topic
 * @param {string} pattern
 * @param {number} targetDifficulty
 * @returns {Promise<{
 *   question: object,
 *   selectedDifficulty: number,
 *   fallbackUsed: boolean,
 *   reasonCodes: string[]
 * }>}
 */
const selectQuestion = async (userId, topic, pattern, targetDifficulty) => {
  const reasonCodes = [];

  // 1. Retrieve user's recently attempted question IDs
  const recentAttempts = await Attempt.find({ userId })
    .sort({ attemptedAt: -1 })
    .limit(config.RECENT_QUESTION_EXCLUSION_LIMIT)
    .select('questionId attemptedAt')
    .lean();

  const excludedQuestionIds = recentAttempts.map((a) => a.questionId);

  // 2. Generate outward difficulty sequence
  const diffSequence = getOutwardDifficultySequence(targetDifficulty);

  let selectedQuestion = null;
  let selectedDifficulty = targetDifficulty;
  let fallbackUsed = false;

  // 3. Search outward for questions matching (topic, pattern, diff) excluding recent
  for (const diff of diffSequence) {
    const query = {
      topic,
      pattern,
      difficulty: diff,
    };
    if (excludedQuestionIds.length > 0) {
      query._id = { $nin: excludedQuestionIds };
    }

    // Deterministic selection: sort by _id ascending and take the first
    const match = await Question.findOne(query).sort({ _id: 1 }).lean();

    if (match) {
      selectedQuestion = match;
      selectedDifficulty = diff;
      if (diff !== targetDifficulty) {
        fallbackUsed = true;
        reasonCodes.push('DIFFICULTY_FALLBACK');
      }
      if (excludedQuestionIds.length > 0) {
        reasonCodes.push('RECENT_QUESTION_EXCLUDED');
      }
      break;
    }
  }

  // 4. If no question found, check if exclusion relaxation is needed
  if (!selectedQuestion) {
    const anyQuestionsForPattern = await Question.find({ topic, pattern }).lean();

    if (anyQuestionsForPattern.length === 0) {
      const err = new Error(`No question is available for the selected pattern "${pattern}".`);
      err.statusCode = 404;
      err.code = 'NO_QUESTION_AVAILABLE';
      throw err;
    }

    // All available questions were in the recent exclusion set: relax exclusion
    reasonCodes.push('RECENT_EXCLUSION_RELAXED');

    // Retrieve last attempt time for each candidate question to find least recently attempted
    const candidateScores = [];

    for (const q of anyQuestionsForPattern) {
      const lastAttempt = await Attempt.findOne({ userId, questionId: q._id })
        .sort({ attemptedAt: -1 })
        .select('attemptedAt')
        .lean();

      const lastAttemptTime = lastAttempt && lastAttempt.attemptedAt
        ? new Date(lastAttempt.attemptedAt).getTime()
        : 0;

      candidateScores.push({
        question: q,
        lastAttemptTime,
        diffDistance: Math.abs(q.difficulty - targetDifficulty),
      });
    }

    // Deterministic sort:
    // 1) lowest lastAttemptTime (least recently attempted)
    // 2) smallest difficulty distance from target
    // 3) _id ascending
    candidateScores.sort((a, b) => {
      if (a.lastAttemptTime !== b.lastAttemptTime) {
        return a.lastAttemptTime - b.lastAttemptTime;
      }
      if (a.diffDistance !== b.diffDistance) {
        return a.diffDistance - b.diffDistance;
      }
      return a.question._id.toString().localeCompare(b.question._id.toString());
    });

    selectedQuestion = candidateScores[0].question;
    selectedDifficulty = selectedQuestion.difficulty;

    if (selectedDifficulty !== targetDifficulty) {
      fallbackUsed = true;
      reasonCodes.push('DIFFICULTY_FALLBACK');
    }
  }

  return {
    question: sanitizeQuestionDTO(selectedQuestion),
    selectedDifficulty,
    fallbackUsed,
    reasonCodes,
  };
};

module.exports = {
  getOutwardDifficultySequence,
  sanitizeQuestionDTO,
  selectQuestion,
};
