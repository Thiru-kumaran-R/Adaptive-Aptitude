'use strict';

/**
 * Stamina Analytics Service
 *
 * Implements Section 22, 23, 24:
 *   - Whole-exam sequence endurance across complete terminal finalized mock history
 *   - Topic and windowDays invariant (evaluates full mock history independently)
 *   - Deterministic quartile partitioning (N >= 4 balanced bucket formula)
 *   - Small-mock exclusion (N < 4 sessions excluded from quartile aggregation)
 *   - Raw count aggregation across multiple sessions
 *   - Fatigue drop-off calculation with zero-first-quartile baseline guard
 */

const MockSession = require('../../models/mockSessionModel');
const Attempt = require('../../models/attemptModel');
const { STAMINA_MIN_QUESTIONS } = require('../../config/analyticsConfig');
const { roundTo } = require('./analyticsMathUtils');

/**
 * Computes the cognitive stamina curve across qualifying terminal finalized mock sessions.
 *
 * @param {string} userId
 * @returns {Promise<Object>}
 */
const getStaminaCurve = async (userId) => {
  // 1. Load all eligible terminal finalized mock sessions
  const terminalSessions = await MockSession.find({
    userId,
    status: { $in: ['submitted', 'expired'] },
    finalizationState: 'completed',
  }).lean();

  if (terminalSessions.length === 0) {
    return {
      staminaCurve: null,
      staminaReason: 'insufficient_terminal_mocks',
    };
  }

  // 2. Filter contributing sessions having N >= STAMINA_MIN_QUESTIONS (4)
  const contributingSessions = terminalSessions.filter(
    (s) => Array.isArray(s.questionSequence) && s.questionSequence.length >= STAMINA_MIN_QUESTIONS
  );

  if (contributingSessions.length === 0) {
    return {
      staminaCurve: null,
      staminaReason: 'insufficient_questions',
    };
  }

  const mockSessionsAnalyzed = contributingSessions.length;
  let totalQuestionsAnalyzed = 0;

  // Track raw counts per quartile across all contributing sessions
  const quartileRaw = [
    { total: 0, correct: 0 },
    { total: 0, correct: 0 },
    { total: 0, correct: 0 },
    { total: 0, correct: 0 },
  ];

  for (const session of contributingSessions) {
    const seq = [...session.questionSequence].sort((a, b) => a.order - b.order);
    const n = seq.length;
    totalQuestionsAnalyzed += n;

    // Load actual mock attempts for this session to verify correctness
    const mockAttempts = await Attempt.find({
      userId,
      source: 'mock',
      sessionId: String(session._id),
    }).lean();

    const attemptMap = new Map();
    for (const att of mockAttempts) {
      attemptMap.set(String(att.questionId), att.isCorrect === true);
    }

    // Determine balanced quartile lengths
    const base = Math.floor(n / 4);
    const remainder = n % 4;

    const qLens = [
      base + (remainder >= 1 ? 1 : 0),
      base + (remainder >= 2 ? 1 : 0),
      base + (remainder >= 3 ? 1 : 0),
      base,
    ];

    let offset = 0;
    for (let k = 0; k < 4; k++) {
      const qLen = qLens[k];
      const slice = seq.slice(offset, offset + qLen);
      offset += qLen;

      let qCorrect = 0;
      for (const item of slice) {
        if (attemptMap.get(String(item.questionId)) === true) {
          qCorrect += 1;
        }
      }

      quartileRaw[k].total += qLen;
      quartileRaw[k].correct += qCorrect;
    }
  }

  // Compute aggregate accuracy per quartile
  const quartileAccuracy = [];
  for (let k = 0; k < 4; k++) {
    const total = quartileRaw[k].total;
    const correct = quartileRaw[k].correct;
    const acc = total > 0 ? roundTo((correct / total) * 100, 1) : 0.0;

    quartileAccuracy.push({
      quartile: k + 1,
      accuracy: acc,
      totalQuestions: total,
      correctQuestions: correct,
    });
  }

  // 3. Fatigue drop-off calculation (unrounded raw precision internally)
  const rawQ1Accuracy = quartileRaw[0].total > 0 ? (quartileRaw[0].correct / quartileRaw[0].total) * 100 : 0.0;
  const rawQ4Accuracy = quartileRaw[3].total > 0 ? (quartileRaw[3].correct / quartileRaw[3].total) * 100 : 0.0;

  let fatigueDropoffPercent = null;
  let fatigueReason = null;

  if (rawQ1Accuracy === 0.0) {
    fatigueDropoffPercent = null;
    fatigueReason = 'zero_first_quartile_baseline';
  } else {
    const rawDropoff = Math.max(0.0, (rawQ1Accuracy - rawQ4Accuracy) / rawQ1Accuracy) * 100;
    fatigueDropoffPercent = roundTo(rawDropoff, 1);
  }

  const staminaCurve = {
    mockSessionsAnalyzed,
    totalQuestionsAnalyzed,
    quartileAccuracy,
    fatigueDropoffPercent,
  };

  if (fatigueReason) {
    staminaCurve.fatigueReason = fatigueReason;
  }

  return {
    staminaCurve,
    staminaReason: null,
  };
};

module.exports = {
  getStaminaCurve,
};
