'use strict';

/**
 * mockScoringService.js — Universal Signed Scoring & Analytics Engine for Phase 6
 *
 * Implements one pure, deterministic scoring function: calculateMockResult(...)
 * Used identically for both initial finalization and rebuildMockResult(...).
 * Zero drift permitted.
 */

const { DEFAULT_GLOBAL_SCORING } = require('../../config/mockConfig');

const roundTo = (num, decimals = 4) => {
  const factor = Math.pow(10, decimals);
  return Math.round((num + Number.EPSILON) * factor) / factor;
};

/**
 * Pure deterministic calculation of mock assessment results across all 6 domains:
 * overall, sections, topics, patterns, difficulties, pacing.
 *
 * @param {Object} params
 * @param {Object} params.session MockSession document or snapshot
 * @param {Array} params.questionSequence Array of question entries with order, topic, pattern, difficulty, sectionId
 * @param {Array} params.responses Array of MockResponse objects/snapshots
 * @param {Map<string, Object>} params.attemptsByQuestionId Map of questionId string -> Attempt object
 * @returns {Object} resultSummary conforming to Phase 6 contract
 */
const calculateMockResult = ({ session, questionSequence, responses = [], attemptsByQuestionId = new Map() }) => {
  const sessionId = session._id ? session._id.toString() : session.sessionId?.toString();
  const mode = session.mode;

  // 1. Build map of effective scoring per section
  const blueprintSnapshot = session.blueprintSnapshot || {};
  const sectionsList = blueprintSnapshot.sections || session.sections || [];
  const globalScoring = {
    correctMarks: Number(blueprintSnapshot.scoring?.correctMarks ?? session.scoring?.correctMarks ?? DEFAULT_GLOBAL_SCORING.correctMarks),
    incorrectMarks: Number(blueprintSnapshot.scoring?.incorrectMarks ?? session.scoring?.incorrectMarks ?? DEFAULT_GLOBAL_SCORING.incorrectMarks),
    unansweredMarks: Number(blueprintSnapshot.scoring?.unansweredMarks ?? session.scoring?.unansweredMarks ?? DEFAULT_GLOBAL_SCORING.unansweredMarks),
  };

  const sectionScoringMap = new Map();
  for (const sec of sectionsList) {
    sectionScoringMap.set(sec.sectionId, {
      correctMarks: Number(sec.scoring?.correctMarks ?? globalScoring.correctMarks),
      incorrectMarks: Number(sec.scoring?.incorrectMarks ?? globalScoring.incorrectMarks),
      unansweredMarks: Number(sec.scoring?.unansweredMarks ?? globalScoring.unansweredMarks),
    });
  }

  // Fallback scoring resolver
  const getSectionScoring = (secId) => {
    return sectionScoringMap.get(secId) || globalScoring;
  };

  // 2. Build map of response by questionId
  const responseMap = new Map();
  for (const resp of responses) {
    const qIdStr = resp.questionId ? resp.questionId.toString() : String(resp.questionId);
    responseMap.set(qIdStr, resp);
  }

  // 3. Process each question in sequence
  // Aggregation buckets
  const sectionAgg = new Map();
  const topicAgg = new Map();
  const patternAgg = new Map();
  const difficultyAgg = new Map();

  const pacingAnswered = [];
  let overallTotalQuestions = 0;
  let overallAnswered = 0;
  let overallUnanswered = 0;
  let overallCorrect = 0;
  let overallIncorrect = 0;
  let overallRawScore = 0;
  let overallMaxPossibleScore = 0;
  let overallTotalTimeSeconds = 0;

  // Initialize sectionAgg in blueprint order
  for (const sec of sectionsList) {
    sectionAgg.set(sec.sectionId, {
      sectionId: sec.sectionId,
      order: sec.order ?? 0,
      totalQuestions: 0,
      answered: 0,
      unanswered: 0,
      correct: 0,
      incorrect: 0,
      rawScore: 0,
      maxPossibleScore: 0,
      totalTimeSeconds: 0,
    });
  }

  // Sort question sequence by order
  const sortedSeq = [...questionSequence].sort((a, b) => a.order - b.order);

  for (const qEntry of sortedSeq) {
    const qIdStr = qEntry.questionId.toString();
    const secId = qEntry.sectionId;
    const topic = qEntry.topic;
    const pattern = qEntry.pattern;
    const difficulty = qEntry.difficulty;

    const scoring = getSectionScoring(secId);
    const resp = responseMap.get(qIdStr);
    const isAnswered = Boolean(resp && resp.selectedAnswer !== null && resp.selectedAnswer !== undefined);
    const attempt = attemptsByQuestionId.get(qIdStr);

    overallTotalQuestions++;
    overallMaxPossibleScore += scoring.correctMarks;

    let isCorrect = false;
    let timeTaken = 0;

    if (isAnswered) {
      overallAnswered++;
      isCorrect = attempt ? Boolean(attempt.isCorrect) : false;
      timeTaken = Number(resp.timeTakenSeconds ?? attempt?.timeTaken ?? 0);
      overallTotalTimeSeconds += timeTaken;

      if (isCorrect) {
        overallCorrect++;
        overallRawScore += scoring.correctMarks;
      } else {
        overallIncorrect++;
        overallRawScore += scoring.incorrectMarks;
      }

      pacingAnswered.push({
        questionId: qIdStr,
        sectionId: secId,
        timeTakenSeconds: timeTaken,
        isCorrect,
        order: qEntry.order,
      });
    } else {
      overallUnanswered++;
      overallRawScore += scoring.unansweredMarks;
      timeTaken = Number(resp?.timeTakenSeconds ?? 0);
      overallTotalTimeSeconds += timeTaken;
    }

    // Helper to update an aggregate record
    const updateBucket = (map, key, initFn) => {
      if (!map.has(key)) {
        map.set(key, initFn());
      }
      const b = map.get(key);
      b.totalQuestions++;
      b.maxPossibleScore += scoring.correctMarks;
      b.totalTimeSeconds += timeTaken;

      if (isAnswered) {
        b.answered++;
        if (isCorrect) {
          b.correct++;
          b.rawScore += scoring.correctMarks;
        } else {
          b.incorrect++;
          b.rawScore += scoring.incorrectMarks;
        }
      } else {
        b.unanswered++;
        b.rawScore += scoring.unansweredMarks;
      }
    };

    // Update section bucket
    updateBucket(sectionAgg, secId, () => ({
      sectionId: secId,
      order: qEntry.order,
      totalQuestions: 0,
      answered: 0,
      unanswered: 0,
      correct: 0,
      incorrect: 0,
      rawScore: 0,
      maxPossibleScore: 0,
      totalTimeSeconds: 0,
    }));

    // Update topic bucket
    updateBucket(topicAgg, topic, () => ({
      topic,
      totalQuestions: 0,
      answered: 0,
      unanswered: 0,
      correct: 0,
      incorrect: 0,
      rawScore: 0,
      maxPossibleScore: 0,
      totalTimeSeconds: 0,
    }));

    // Update pattern bucket
    const patternKey = `${topic}:::${pattern}`;
    updateBucket(patternAgg, patternKey, () => ({
      topic,
      pattern,
      totalQuestions: 0,
      answered: 0,
      unanswered: 0,
      correct: 0,
      incorrect: 0,
      rawScore: 0,
      maxPossibleScore: 0,
      totalTimeSeconds: 0,
    }));

    // Update difficulty bucket
    updateBucket(difficultyAgg, difficulty, () => ({
      difficulty,
      totalQuestions: 0,
      answered: 0,
      unanswered: 0,
      correct: 0,
      incorrect: 0,
      rawScore: 0,
      maxPossibleScore: 0,
      totalTimeSeconds: 0,
    }));
  }

  // 4. Format metrics helper
  const finalizeMetrics = (b) => {
    const accuracy = b.answered > 0 ? roundTo((b.correct / b.answered) * 100, 2) : 0;
    const rawScore = roundTo(b.rawScore, 4);
    const maxPossibleScore = roundTo(b.maxPossibleScore, 4);
    const percentage = maxPossibleScore > 0 ? roundTo((rawScore / maxPossibleScore) * 100, 2) : 0;
    const averageTimeSeconds = b.answered > 0 ? roundTo(b.totalTimeSeconds / b.answered, 2) : 0;

    return {
      totalQuestions: b.totalQuestions,
      answered: b.answered,
      unanswered: b.unanswered,
      correct: b.correct,
      incorrect: b.incorrect,
      accuracy,
      rawScore,
      maxPossibleScore,
      percentage,
      totalTimeSeconds: b.totalTimeSeconds,
      averageTimeSeconds,
    };
  };

  // Overall domain
  const overall = {
    ...finalizeMetrics({
      totalQuestions: overallTotalQuestions,
      answered: overallAnswered,
      unanswered: overallUnanswered,
      correct: overallCorrect,
      incorrect: overallIncorrect,
      rawScore: overallRawScore,
      maxPossibleScore: overallMaxPossibleScore,
      totalTimeSeconds: overallTotalTimeSeconds,
    }),
  };

  // Sections domain (ordered by section order)
  const sections = Array.from(sectionAgg.values())
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map((b) => ({
      sectionId: b.sectionId,
      ...finalizeMetrics(b),
    }));

  // Topics domain (ordered by topic name)
  const topics = Array.from(topicAgg.values())
    .sort((a, b) => a.topic.localeCompare(b.topic))
    .map((b) => ({
      topic: b.topic,
      ...finalizeMetrics(b),
    }));

  // Patterns domain (ordered by topic, then pattern)
  const patterns = Array.from(patternAgg.values())
    .sort((a, b) => a.topic.localeCompare(b.topic) || a.pattern.localeCompare(b.pattern))
    .map((b) => ({
      topic: b.topic,
      pattern: b.pattern,
      ...finalizeMetrics(b),
    }));

  // Difficulties domain (ordered by difficulty ascending 1..10)
  const difficulties = Array.from(difficultyAgg.values())
    .sort((a, b) => a.difficulty - b.difficulty)
    .map((b) => ({
      difficulty: b.difficulty,
      ...finalizeMetrics(b),
    }));

  // Pacing domain
  const slowestAnswered = [...pacingAnswered]
    .sort((a, b) => b.timeTakenSeconds - a.timeTakenSeconds || a.order - b.order)
    .slice(0, 5)
    .map(({ questionId, sectionId, timeTakenSeconds, isCorrect }) => ({
      questionId,
      sectionId,
      timeTakenSeconds,
      isCorrect,
    }));

  const fastestAnswered = [...pacingAnswered]
    .sort((a, b) => a.timeTakenSeconds - b.timeTakenSeconds || a.order - b.order)
    .slice(0, 5)
    .map(({ questionId, sectionId, timeTakenSeconds, isCorrect }) => ({
      questionId,
      sectionId,
      timeTakenSeconds,
      isCorrect,
    }));

  const averageTimePerAnsweredQuestion =
    overallAnswered > 0 ? roundTo(overallTotalTimeSeconds / overallAnswered, 2) : 0;

  const pacing = {
    totalTimeSeconds: overallTotalTimeSeconds,
    averageTimePerAnsweredQuestion,
    slowestAnsweredQuestions: slowestAnswered,
    fastestAnsweredQuestions: fastestAnswered,
  };

  return {
    sessionId,
    mode,
    overall,
    sections,
    topics,
    patterns,
    difficulties,
    pacing,
  };
};

module.exports = {
  calculateMockResult,
  roundTo,
};
