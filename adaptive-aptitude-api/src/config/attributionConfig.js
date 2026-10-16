'use strict';

/**
 * Attribution Configuration — Phase 10: Prescription Adherence & Learning Outcome Attribution Engine (PAOA)
 */
const attributionConfig = Object.freeze({
  ALGORITHM_VERSION: 'v1',

  PRESCRIPTION_TTL_HOURS: 24,

  SUMMARY_DEFAULT_WINDOW_DAYS: 30,
  SUMMARY_MAX_WINDOW_DAYS: 90,

  SUMMARY_EVALUATED_LIMIT: 500,
  SUMMARY_PROBE_LIMIT: 501,
});

module.exports = attributionConfig;
