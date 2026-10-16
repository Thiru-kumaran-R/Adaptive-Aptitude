'use strict';

/**
 * tests/registry.test.js
 *
 * Pure JSON tests for the canonical pattern registry and legacy mappings.
 * No database connection required.
 *
 * Verifies:
 *  - 24 canonical topics
 *  - 278 canonical patterns
 *  - Global pattern name uniqueness (0 collisions)
 *  - 308 legacy mappings
 *  - All 308 legacy mappings resolve to valid canonical topic + pattern
 *  - patternRegistryService functions work correctly
 */

const registryService = require('../src/services/patternRegistryService');
const legacyMappings = require('../src/data/legacyPatternMapping.json');
const registry = require('../src/data/canonicalPatternRegistry.json');

describe('Canonical Pattern Registry', () => {
  describe('Topic counts', () => {
    it('should have exactly 24 canonical topics', () => {
      const topics = registryService.getAllTopics();
      expect(topics).toHaveLength(24);
    });

    it('should include all expected canonical topic names', () => {
      const topics = registryService.getAllTopics();
      const expected = [
        'Algebra', 'Average', 'Boats and Streams', 'Calendar', 'Clock',
        'Compound Interest', 'Mixture and Alligation', 'Number System',
        'Partnership', 'Percentage', 'Permutation and Combination',
        'Pipes and Cisterns', 'Probability', 'Problems on Ages',
        'Problems on Trains', 'Profit and Loss', 'Ratio and Proportion',
        'Simple Interest', 'Stocks and Shares', 'Surds and Indices',
        'Time and Work', 'Time, Speed and Distance', 'Trigonometry',
        'Volume and Surface Area',
      ];
      for (const t of expected) {
        expect(topics).toContain(t);
      }
    });

    it('canonical topic "Time, Speed and Distance" uses exact comma form', () => {
      const topics = registryService.getAllTopics();
      expect(topics).toContain('Time, Speed and Distance');
      // Must NOT contain the no-comma variant as a topic name
      expect(topics).not.toContain('Time Speed and Distance');
    });
  });

  describe('Pattern counts', () => {
    it('should have exactly 278 canonical patterns total', () => {
      const totalPatterns = registry.reduce(
        (sum, t) => sum + (t.patterns || []).length,
        0
      );
      expect(totalPatterns).toBe(278);
    });

    it('pattern names should be globally unique (0 collisions)', () => {
      const names = registry.flatMap((t) => (t.patterns || []).map((p) => p.name));
      const uniqueNames = new Set(names);
      expect(uniqueNames.size).toBe(names.length);
      expect(names.length).toBe(278);
    });
  });

  describe('Legacy mappings', () => {
    it('should have exactly 308 legacy mappings', () => {
      expect(legacyMappings).toHaveLength(308);
    });

    it('all 308 legacy mappings should resolve to valid canonical topic', () => {
      const invalidTopics = legacyMappings.filter(
        (m) => !registryService.topicExists(m.canonicalTopic)
      );
      expect(invalidTopics).toHaveLength(0);
    });

    it('all 308 legacy mappings should resolve to valid canonical pattern', () => {
      const invalidPatterns = legacyMappings.filter(
        (m) => !registryService.patternExists(m.canonicalPattern)
      );
      expect(invalidPatterns).toHaveLength(0);
    });

    it('each legacy mapping canonical pattern should belong to its canonical topic', () => {
      const mismatches = legacyMappings.filter(
        (m) => !registryService.patternBelongsToTopic(m.canonicalPattern, m.canonicalTopic)
      );
      expect(mismatches).toHaveLength(0);
    });
  });

  describe('registryService functions', () => {
    it('topicExists() returns true for known topic', () => {
      expect(registryService.topicExists('Percentage')).toBe(true);
    });

    it('topicExists() returns false for unknown topic', () => {
      expect(registryService.topicExists('NonExistentTopic')).toBe(false);
    });

    it('patternExists() returns true for known pattern', () => {
      expect(registryService.patternExists('Basic Percentage Calculation')).toBe(true);
    });

    it('patternExists() returns false for unknown pattern', () => {
      expect(registryService.patternExists('Made Up Pattern XYZ')).toBe(false);
    });

    it('patternBelongsToTopic() returns true for valid combo', () => {
      expect(registryService.patternBelongsToTopic('Basic Percentage Calculation', 'Percentage')).toBe(true);
    });

    it('patternBelongsToTopic() returns false for invalid combo', () => {
      expect(registryService.patternBelongsToTopic('Basic Percentage Calculation', 'Algebra')).toBe(false);
    });

    it('resolveTopicSlug() resolves slug to canonical name', () => {
      expect(registryService.resolveTopicSlug('percentage')).toBe('Percentage');
      expect(registryService.resolveTopicSlug('problems-on-ages')).toBe('Problems on Ages');
      expect(registryService.resolveTopicSlug('time-speed-and-distance')).toBe('Time, Speed and Distance');
    });

    it('resolveTopicSlug() returns null for unknown slug', () => {
      expect(registryService.resolveTopicSlug('nonexistent-topic')).toBeNull();
    });

    it('resolvePatternSlug() resolves known pattern slug', () => {
      const resolved = registryService.resolvePatternSlug('basic-percentage-calculation');
      expect(resolved).toBe('Basic Percentage Calculation');
    });

    it('getPatternsByTopic() returns patterns array for valid topic', () => {
      const patterns = registryService.getPatternsByTopic('Percentage');
      expect(Array.isArray(patterns)).toBe(true);
      expect(patterns.length).toBeGreaterThan(0);
    });

    it('getPatternsByTopic() returns null for invalid topic', () => {
      expect(registryService.getPatternsByTopic('InvalidTopic')).toBeNull();
    });

    it('getRegistryStats() returns correct counts', () => {
      const stats = registryService.getRegistryStats();
      expect(stats.topicCount).toBe(24);
      expect(stats.patternCount).toBe(278);
      expect(stats.legacyMappingCount).toBe(308);
    });

    it('buildSlug() produces correct slugs', () => {
      expect(registryService.buildSlug('Percentage')).toBe('percentage');
      expect(registryService.buildSlug('Problems on Ages')).toBe('problems-on-ages');
      expect(registryService.buildSlug('Time, Speed and Distance')).toBe('time-speed-and-distance');
    });
  });

  describe('No legacy architecture in registry data', () => {
    it('registry topics do not include mentor/teacher concepts', () => {
      const topics = registryService.getAllTopics();
      const forbidden = ['mentor', 'mentee', 'teacher', 'classroom'];
      for (const f of forbidden) {
        expect(topics.map((t) => t.toLowerCase())).not.toContain(f);
      }
    });
  });
});
