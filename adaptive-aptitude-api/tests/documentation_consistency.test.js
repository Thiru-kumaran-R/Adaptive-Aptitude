'use strict';

/**
 * tests/documentation_consistency.test.js — Phase 5 Documentation & Config Consistency Tests
 *
 * Verifies that critical algorithmic constants exported from planning and revision
 * configuration modules match the authoritative Phase 5 specifications.
 * Prevents documentation and runtime configuration drift.
 */

const planningConfig = require("../src/config/planningConfig");
const revisionConfig = require("../src/config/revisionConfig");

describe("Phase 5 Documentation & Configuration Consistency", () => {
  describe("Algorithm Versions", () => {
    it("enforces PLANNING_ALGORITHM_VERSION = 'v1'", () => {
      expect(planningConfig.PLANNING_ALGORITHM_VERSION).toBe("v1");
    });

    it("enforces REVISION_ALGORITHM_VERSION = 'v1'", () => {
      expect(revisionConfig.REVISION_ALGORITHM_VERSION).toBe("v1");
    });
  });

  describe("Planning Capacity Defaults", () => {
    it("enforces DEFAULT_DAILY_QUESTION_BUDGET = 30", () => {
      expect(planningConfig.DEFAULT_DAILY_QUESTION_BUDGET).toBe(30);
    });

    it("enforces DEFAULT_DAILY_MINUTES = 60", () => {
      expect(planningConfig.DEFAULT_DAILY_MINUTES).toBe(60);
    });

    it("enforces DEFAULT_QUESTIONS_PER_PATTERN = 10", () => {
      expect(planningConfig.DEFAULT_QUESTIONS_PER_PATTERN).toBe(10);
    });

    it("enforces DEFAULT_MAX_PATTERNS_PER_DAY = 3", () => {
      expect(planningConfig.DEFAULT_MAX_PATTERNS_PER_DAY).toBe(3);
    });

    it("enforces PREREQUISITE_READY_MASTERY = 0.70", () => {
      expect(planningConfig.PREREQUISITE_READY_MASTERY).toBe(0.70);
    });

    it("enforces PLANNING_TARGET_MASTERY = 0.85", () => {
      expect(planningConfig.PLANNING_TARGET_MASTERY).toBe(0.85);
    });
  });

  describe("Revision Engine Defaults", () => {
    it("enforces DEFAULT_REVISION_QUESTION_BUDGET = 20", () => {
      expect(revisionConfig.DEFAULT_REVISION_QUESTION_BUDGET).toBe(20);
    });

    it("enforces DEFAULT_REVISION_PATTERNS_PER_DAY = 4", () => {
      expect(revisionConfig.DEFAULT_REVISION_PATTERNS_PER_DAY).toBe(4);
    });

    it("enforces REVISION_INTERVAL_DAYS = [1, 3, 7, 14, 30]", () => {
      expect(revisionConfig.REVISION_INTERVAL_DAYS).toEqual([1, 3, 7, 14, 30]);
    });

    it("enforces REVISION_RECENT_INCORRECT_LOOKBACK_DAYS = 7", () => {
      expect(revisionConfig.REVISION_RECENT_INCORRECT_LOOKBACK_DAYS).toBe(7);
    });

    it("enforces REVISION_COMPLETION_MASTERY = 0.85", () => {
      expect(revisionConfig.REVISION_COMPLETION_MASTERY).toBe(0.85);
    });
  });

  describe("Horizon & Scope Boundaries", () => {
    it("enforces verified syllabus profiles = 0 (no implicit syllabi)", () => {
      // Goal presets only define allowed horizon duration keys, not topic/pattern lists
      for (const [goalType, presets] of Object.entries(planningConfig.GOAL_TYPE_PRESETS)) {
        for (const preset of presets) {
          expect(typeof preset).toBe("string");
          // Presets must be duration keys (e.g., '3d', '1m', 'custom')
          expect(preset).toMatch(/^(3d|7d|9d|1m|2m|3m|6m|custom)$/);
        }
      }
    });
  });
});
