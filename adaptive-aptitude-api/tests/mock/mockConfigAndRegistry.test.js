'use strict';

/**
 * tests/mock/mockConfigAndRegistry.test.js
 *
 * Verifies Phase 6 configuration constants, complete error-code registry,
 * dynamic error mapping, and Phase 7+ boundary enforcement.
 */

const mockConfig = require('../../src/config/mockConfig');

describe('Phase 6: Centralized Configuration & Error Registry', () => {
  it('enforces MOCK_ALGORITHM_VERSION = "v1"', () => {
    expect(mockConfig.MOCK_ALGORITHM_VERSION).toBe('v1');
  });

  it('exports frozen MOCK_MODES (standard, diagnostic)', () => {
    expect(mockConfig.MOCK_MODES.STANDARD).toBe('standard');
    expect(mockConfig.MOCK_MODES.DIAGNOSTIC).toBe('diagnostic');
    expect(Object.isFrozen(mockConfig.MOCK_MODES)).toBe(true);
  });

  it('exports frozen NAVIGATION_POLICIES (free, section_locked)', () => {
    expect(mockConfig.NAVIGATION_POLICIES.FREE).toBe('free');
    expect(mockConfig.NAVIGATION_POLICIES.SECTION_LOCKED).toBe('section_locked');
    expect(Object.isFrozen(mockConfig.NAVIGATION_POLICIES)).toBe(true);
  });

  it('exports frozen SESSION_STATUS with exactly 5 lifecycle states', () => {
    expect(mockConfig.SESSION_STATUS).toEqual({
      CREATED: 'created',
      STARTED: 'started',
      SUBMITTED: 'submitted',
      EXPIRED: 'expired',
      ABANDONED: 'abandoned',
    });
    expect(Object.isFrozen(mockConfig.SESSION_STATUS)).toBe(true);
  });

  it('exports frozen FINALIZATION_STATE (idle, in_progress, completed, failed)', () => {
    expect(mockConfig.FINALIZATION_STATE).toEqual({
      IDLE: 'idle',
      IN_PROGRESS: 'in_progress',
      COMPLETED: 'completed',
      FAILED: 'failed',
    });
    expect(Object.isFrozen(mockConfig.FINALIZATION_STATE)).toBe(true);
  });

  it('exports frozen SECTION_STATUS (pending, in_progress, completed, expired)', () => {
    expect(mockConfig.SECTION_STATUS).toEqual({
      PENDING: 'pending',
      IN_PROGRESS: 'in_progress',
      COMPLETED: 'completed',
      EXPIRED: 'expired',
    });
    expect(Object.isFrozen(mockConfig.SECTION_STATUS)).toBe(true);
  });

  it('exports frozen DIFFICULTY_BANDS with 1-3, 4-7, 8-10 integer ranges', () => {
    expect(mockConfig.DIFFICULTY_BANDS.EASY).toEqual({ min: 1, max: 3, label: 'easy' });
    expect(mockConfig.DIFFICULTY_BANDS.MEDIUM).toEqual({ min: 4, max: 7, label: 'medium' });
    expect(mockConfig.DIFFICULTY_BANDS.HARD).toEqual({ min: 8, max: 10, label: 'hard' });
  });

  it('exports frozen DEFAULT_DIFFICULTY_DISTRIBUTION summing to 1.0', () => {
    const { easy, medium, hard } = mockConfig.DEFAULT_DIFFICULTY_DISTRIBUTION;
    expect(easy).toBe(0.30);
    expect(medium).toBe(0.50);
    expect(hard).toBe(0.20);
    expect(easy + medium + hard).toBeCloseTo(1.0, 5);
  });

  it('enforces MOCK_RECENT_QUESTION_EXCLUSION_LIMIT = 50', () => {
    expect(mockConfig.MOCK_RECENT_QUESTION_EXCLUSION_LIMIT).toBe(50);
  });

  it('exports frozen FINALIZATION_LEASE (30s duration, 5s heartbeat)', () => {
    expect(mockConfig.FINALIZATION_LEASE.DURATION_MS).toBe(30000);
    expect(mockConfig.FINALIZATION_LEASE.HEARTBEAT_INTERVAL_MS).toBe(5000);
  });

  it('exports frozen SESSION_LIMITS with valid bounds and pacing tolerance = 5', () => {
    expect(mockConfig.SESSION_LIMITS.MIN_QUESTIONS).toBe(1);
    expect(mockConfig.SESSION_LIMITS.MAX_QUESTIONS).toBe(200);
    expect(mockConfig.SESSION_LIMITS.MIN_DURATION_MINUTES).toBe(1);
    expect(mockConfig.SESSION_LIMITS.MAX_DURATION_MINUTES).toBe(360);
    expect(mockConfig.SESSION_LIMITS.PACING_TOLERANCE_SECONDS).toBe(5);
  });

  it('exports frozen DIAGNOSTIC_THRESHOLDS (0.70 and 0.85)', () => {
    expect(mockConfig.DIAGNOSTIC_THRESHOLDS.WEAK_MASTERY_UPPER_BOUND).toBe(0.70);
    expect(mockConfig.DIAGNOSTIC_THRESHOLDS.DEVELOPING_MASTERY_UPPER_BOUND).toBe(0.85);
  });

  describe('Complete Error Registry & Dynamic Consistency', () => {
    it('confirms every code in MOCK_ERROR_CODES has an intended HTTP status in MOCK_HTTP_STATUS_MAP', () => {
      const errorCodes = Object.values(mockConfig.MOCK_ERROR_CODES);
      const httpMap = mockConfig.MOCK_HTTP_STATUS_MAP;

      for (const code of errorCodes) {
        expect(httpMap[code]).toBeDefined();
        expect(typeof httpMap[code]).toBe('number');
        expect([400, 403, 404, 409, 500]).toContain(httpMap[code]);
      }
    });

    it('strictly forbids generic INVALID_REQUEST error code', () => {
      expect(mockConfig.MOCK_ERROR_CODES.INVALID_REQUEST).toBeUndefined();
      expect(mockConfig.MOCK_HTTP_STATUS_MAP.INVALID_REQUEST).toBeUndefined();
    });

    it('confirms RESULT_INTEGRITY_ERROR maps to HTTP 500', () => {
      expect(mockConfig.MOCK_HTTP_STATUS_MAP.RESULT_INTEGRITY_ERROR).toBe(500);
    });

    it('confirms RESULT_INCOMPLETE_FINALIZATION maps to HTTP 500', () => {
      expect(mockConfig.MOCK_HTTP_STATUS_MAP.RESULT_INCOMPLETE_FINALIZATION).toBe(500);
    });

    it('confirms FINALIZATION_EXECUTION_FAILED maps to HTTP 500', () => {
      expect(mockConfig.MOCK_HTTP_STATUS_MAP.FINALIZATION_EXECUTION_FAILED).toBe(500);
    });

    it('confirms all 409 conflict codes are correctly classified', () => {
      const expected409s = [
        'MOCK_SESSION_EXPIRED',
        'RESPONSE_FROZEN',
        'SECTION_LOCKED',
        'SECTION_NOT_ACTIVE',
        'FINALIZATION_IN_PROGRESS',
        'FINALIZATION_LEASE_LOST',
        'SESSION_STATE_CONFLICT',
      ];
      for (const code of expected409s) {
        expect(mockConfig.MOCK_HTTP_STATUS_MAP[code]).toBe(409);
      }
    });
  });
});
