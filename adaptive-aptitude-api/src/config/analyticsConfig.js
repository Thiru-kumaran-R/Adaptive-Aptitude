'use strict';

/**
 * Phase 8 Central Analytics Configuration
 *
 * Authoritative constants and contracts for Cognitive Diagnostics &
 * Longitudinal Learning Analytics Engine.
 */

const ANALYTICS_ALGORITHM_VERSION = 'v1';

// Bounded query and rolling window limits
const DEFAULT_WINDOW_DAYS = 30;
const MAX_WINDOW_DAYS = 90;
const MAX_ATTEMPTS_ANALYZED = 1000;

// Speed-accuracy matrix configuration
const MIN_SPEED_BASELINE_SAMPLES = 3;
const SPEED_RUSHING_THRESHOLD_MULTIPLIER = 0.60;

// Cognitive stamina configuration
const STAMINA_MIN_QUESTIONS = 4;

// Dashboard configuration
const PRIORITY_FOCUS_TOPICS_LIMIT = 3;

// Mastery label thresholds (aligned with Phase 4)
const MASTERY_THRESHOLDS = {
  WEAK: 0.40,
  DEVELOPING: 0.70,
  PROFICIENT: 0.85,
};

// Goal readiness component base weights and requirements
const READINESS_WEIGHTS = {
  planTargetCoverage: 0.30,
  masteryDepth: 0.35,
  eligibleMockPerformance: 0.25,
  eligibleMockPacing: 0.10,
};

const MIN_READINESS_REQUIRED_COMPONENTS = [
  'planTargetCoverage',
  'masteryDepth',
];

const PREREQUISITE_UNMET_THRESHOLD = 0.70;

// Retention half-open gap buckets: [minDaysInclusive, maxDaysExclusive)
const RETENTION_GAP_BUCKETS = [
  { key: '0.5-1.5d', minDaysInclusive: 0.5, maxDaysExclusive: 1.5 },
  { key: '1.5-4.5d', minDaysInclusive: 1.5, maxDaysExclusive: 4.5 },
  { key: '4.5-9.5d', minDaysInclusive: 4.5, maxDaysExclusive: 9.5 },
  { key: '9.5-18.5d', minDaysInclusive: 9.5, maxDaysExclusive: 18.5 },
  { key: '18.5-35.5d', minDaysInclusive: 18.5, maxDaysExclusive: 35.5 },
  { key: '>35.5d', minDaysInclusive: 35.5, maxDaysExclusive: Infinity },
];

// Analytical learning attempt sources (non-mock practice history)
const NON_MOCK_ATTEMPT_SOURCES = ['practice', 'daily_plan', 'adaptive', 'revision'];

module.exports = {
  ANALYTICS_ALGORITHM_VERSION,
  DEFAULT_WINDOW_DAYS,
  MAX_WINDOW_DAYS,
  MAX_ATTEMPTS_ANALYZED,
  MIN_SPEED_BASELINE_SAMPLES,
  SPEED_RUSHING_THRESHOLD_MULTIPLIER,
  STAMINA_MIN_QUESTIONS,
  PRIORITY_FOCUS_TOPICS_LIMIT,
  MASTERY_THRESHOLDS,
  READINESS_WEIGHTS,
  MIN_READINESS_REQUIRED_COMPONENTS,
  PREREQUISITE_UNMET_THRESHOLD,
  RETENTION_GAP_BUCKETS,
  NON_MOCK_ATTEMPT_SOURCES,
};
