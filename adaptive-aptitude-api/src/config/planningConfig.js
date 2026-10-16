'use strict';

/**
 * Planning Configuration — Phase 5: Automated Planning Engine
 *
 * Centralized planning constants, capacity boundaries, presets,
 * and machine-readable reason codes.
 */

const PLANNING_ALGORITHM_VERSION = 'v1';

const DEFAULT_DAILY_QUESTION_BUDGET = 30;
const MIN_DAILY_QUESTION_BUDGET = 1;
const MAX_DAILY_QUESTION_BUDGET = 200;

const DEFAULT_DAILY_MINUTES = 60;
const MIN_DAILY_MINUTES = 1;
const MAX_DAILY_MINUTES = 600;

const DEFAULT_QUESTIONS_PER_PATTERN = 10;

const DEFAULT_MAX_PATTERNS_PER_DAY = 3;
const MIN_PATTERNS_PER_DAY = 1;
const MAX_PATTERNS_PER_DAY_LIMIT = 10;

const PLANNING_TARGET_MASTERY = 0.85;
const PREREQUISITE_READY_MASTERY = 0.70;

const DURATION_PRESETS = Object.freeze({
  '3d': { key: '3d', type: 'days', count: 3, label: '3 Days' },
  '7d': { key: '7d', type: 'days', count: 7, label: '7 Days' },
  '9d': { key: '9d', type: 'days', count: 9, label: '9 Days' },
  '1m': { key: '1m', type: 'months', count: 1, label: '1 Month' },
  '2m': { key: '2m', type: 'months', count: 2, label: '2 Months' },
  '3m': { key: '3m', type: 'months', count: 3, label: '3 Months' },
  '6m': { key: '6m', type: 'months', count: 6, label: '6 Months' },
});

const PLANNING_REASON_CODES = Object.freeze({
  EXPLICIT_SCOPE: 'EXPLICIT_SCOPE',
  ALL_CANONICAL_SCOPE: 'ALL_CANONICAL_SCOPE',
  PREREQUISITE_INCLUDED: 'PREREQUISITE_INCLUDED',
  MASTERED_PATTERN_SKIPPED: 'MASTERED_PATTERN_SKIPPED',
  NEW_PATTERN_PRIORITY: 'NEW_PATTERN_PRIORITY',
  LOW_MASTERY_PRIORITY: 'LOW_MASTERY_PRIORITY',
  CAPACITY_LIMIT_REACHED: 'CAPACITY_LIMIT_REACHED',
  PLANNING_SCOPE_REQUIRED: 'PLANNING_SCOPE_REQUIRED',
  PLAN_GENERATED: 'PLAN_GENERATED',
  PLAN_PARTIALLY_SCHEDULED: 'PLAN_PARTIALLY_SCHEDULED',
  FUTURE_OBJECTIVES_REPLANNED: 'FUTURE_OBJECTIVES_REPLANNED',
});

const GOAL_TYPE_PRESETS = Object.freeze({
  company: ['3d', '7d', '9d'],
  government: ['1m', '2m', '3m', '6m'],
  entrance: ['1m', '2m', '3m', '6m'],
  competitive: ['1m', '2m', '3m', '6m'],
  master: ['1m', '2m', '3m', '6m'],
  custom: ['custom'],
});

module.exports = {
  PLANNING_ALGORITHM_VERSION,
  DEFAULT_DAILY_QUESTION_BUDGET,
  MIN_DAILY_QUESTION_BUDGET,
  MAX_DAILY_QUESTION_BUDGET,
  DEFAULT_DAILY_MINUTES,
  MIN_DAILY_MINUTES,
  MAX_DAILY_MINUTES,
  DEFAULT_QUESTIONS_PER_PATTERN,
  DEFAULT_MAX_PATTERNS_PER_DAY,
  MAX_PATTERNS_PER_DAY: DEFAULT_MAX_PATTERNS_PER_DAY,
  MIN_PATTERNS_PER_DAY,
  MAX_PATTERNS_PER_DAY_LIMIT,
  PLANNING_TARGET_MASTERY,
  PREREQUISITE_READY_MASTERY,
  DURATION_PRESETS,
  GOAL_TYPE_PRESETS,
  PLANNING_REASON_CODES,
};
