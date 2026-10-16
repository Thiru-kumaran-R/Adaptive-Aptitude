'use strict';

/**
 * Pattern Registry Service
 *
 * Loads the verified canonical pattern registry and legacy mappings at module
 * initialization time (synchronous JSON require). All lookups are O(1) via
 * pre-built Maps and Sets.
 *
 * IMPORTANT: This service provides READ-ONLY lookup. It never modifies stored
 * canonical names. Slug resolution is API-boundary behavior only.
 */

const registry = require('../data/canonicalPatternRegistry.json');
const legacyMappings = require('../data/legacyPatternMapping.json');

// ── Internal lookup structures ─────────────────────────────────────────────

/** Map: canonical topic name → topic entry object */
const topicByName = new Map();

/** Map: topic slug → canonical topic name */
const topicBySlug = new Map();

/** Map: canonical pattern name → canonical topic name */
const patternToTopic = new Map();

/** Map: pattern slug → canonical pattern name */
const patternBySlug = new Map();

/** Map: canonical topic name → Set<canonical pattern name> */
const topicPatterns = new Map();

/** Set: all canonical pattern names */
const allPatternNames = new Set();

// ── Slug builder ───────────────────────────────────────────────────────────

/**
 * Convert a canonical display name to a URL-safe slug.
 * Example: "Time, Speed and Distance" → "time-speed-and-distance"
 *          "Percentage" → "percentage"
 *
 * Strategy:
 *  1. Lowercase
 *  2. Remove characters that are not letters, digits, spaces, or hyphens
 *  3. Collapse whitespace → hyphens
 */
const buildSlug = (name) => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
};

// ── Build all maps from registry ───────────────────────────────────────────

for (const topicEntry of registry) {
  const topicName = topicEntry.topic;
  const topicSlug = buildSlug(topicName);

  topicByName.set(topicName, topicEntry);
  topicBySlug.set(topicSlug, topicName);

  const patternSet = new Set();
  topicPatterns.set(topicName, patternSet);

  for (const pattern of topicEntry.patterns || []) {
    const patternName = pattern.name;
    const patternSlug = buildSlug(patternName);

    allPatternNames.add(patternName);
    patternToTopic.set(patternName, topicName);
    patternBySlug.set(patternSlug, patternName);
    patternSet.add(patternName);
  }
}

// ── Public API ─────────────────────────────────────────────────────────────

/**
 * Returns the ordered list of all 24 canonical topic names.
 * Order matches the registry file order.
 */
const getAllTopics = () => registry.map((t) => t.topic);

/**
 * Returns the full registry entry for a topic, or null.
 * @param {string} topicName Canonical topic name
 */
const getTopicEntry = (topicName) => topicByName.get(topicName) || null;

/**
 * Returns the array of pattern objects for a topic, or null if not found.
 * @param {string} topicName Canonical topic name
 */
const getPatternsByTopic = (topicName) => {
  const entry = topicByName.get(topicName);
  return entry ? entry.patterns || [] : null;
};

/**
 * Returns true if the canonical topic name exists in the registry.
 * @param {string} name Canonical topic name
 */
const topicExists = (name) => topicByName.has(name);

/**
 * Returns true if the canonical pattern name exists in the registry.
 * @param {string} name Canonical pattern name
 */
const patternExists = (name) => allPatternNames.has(name);

/**
 * Returns true if a canonical pattern belongs to the given canonical topic.
 * @param {string} patternName
 * @param {string} topicName
 */
const patternBelongsToTopic = (patternName, topicName) => {
  const set = topicPatterns.get(topicName);
  return set ? set.has(patternName) : false;
};

/**
 * Resolves a URL slug to a canonical topic name.
 * Also accepts an exact canonical name as a pass-through.
 *
 * This is API-boundary behavior ONLY. It does NOT modify stored names.
 *
 * Examples:
 *   "time-speed-and-distance" → "Time, Speed and Distance"
 *   "percentage"              → "Percentage"
 *   "Percentage"              → "Percentage"  (canonical pass-through)
 *
 * @param {string} slug
 * @returns {string|null} Canonical topic name, or null if unresolved
 */
const resolveTopicSlug = (slug) => {
  // 1. Try slug lookup
  const bySlug = topicBySlug.get(slug);
  if (bySlug) return bySlug;

  // 2. Try canonical name pass-through (already canonical)
  if (topicByName.has(slug)) return slug;

  // 3. Try slug of the input itself
  const slugOfInput = buildSlug(slug);
  return topicBySlug.get(slugOfInput) || null;
};

/**
 * Resolves a URL slug to a canonical pattern name.
 * Also accepts an exact canonical name as a pass-through.
 *
 * This is API-boundary behavior ONLY. It does NOT modify stored names.
 *
 * @param {string} slug
 * @returns {string|null} Canonical pattern name, or null if unresolved
 */
const resolvePatternSlug = (slug) => {
  // 1. Try slug lookup
  const bySlug = patternBySlug.get(slug);
  if (bySlug) return bySlug;

  // 2. Try canonical name pass-through
  if (allPatternNames.has(slug)) return slug;

  // 3. Try slug of the input
  const slugOfInput = buildSlug(slug);
  return patternBySlug.get(slugOfInput) || null;
};

/**
 * Returns the canonical topic name that owns the given pattern, or null.
 * @param {string} patternName Canonical pattern name
 */
const getTopicForPattern = (patternName) => patternToTopic.get(patternName) || null;

/**
 * Returns the raw legacy mappings array.
 */
const getLegacyMappings = () => legacyMappings;

/**
 * Looks up a single legacy mapping entry by legacy topic + legacy pattern.
 * @param {string} legacyTopic
 * @param {string} legacyPattern
 * @returns {Object|null}
 */
const resolveLegacyPattern = (legacyTopic, legacyPattern) => {
  return (
    legacyMappings.find(
      (m) => m.legacyTopic === legacyTopic && m.legacyPattern === legacyPattern
    ) || null
  );
};

/**
 * Returns summary statistics about the registry.
 * Computed from actual data, not hard-coded.
 */
const getRegistryStats = () => ({
  topicCount: topicByName.size,
  patternCount: allPatternNames.size,
  legacyMappingCount: legacyMappings.length,
});

// Canonical pattern index map (0 to 277)
const patternIndexMap = new Map();
let globalPatternIdx = 0;
for (const topicEntry of registry) {
  for (const pattern of topicEntry.patterns || []) {
    patternIndexMap.set(pattern.name, globalPatternIdx++);
  }
}

/**
 * Returns the 0-based global canonical index of a pattern (0 to 277).
 * Falls back to 999999 if not found.
 * @param {string} patternName
 * @returns {number}
 */
const getPatternRegistryIndex = (patternName) => {
  return patternIndexMap.has(patternName) ? patternIndexMap.get(patternName) : 999999;
};

/**
 * Returns array of all canonical pattern objects with topic and pattern name in registry order.
 * @returns {Array<{ topic: string, pattern: string }>}
 */
const getAllCanonicalPatterns = () => {
  const result = [];
  for (const topicEntry of registry) {
    for (const pattern of topicEntry.patterns || []) {
      result.push({ topic: topicEntry.topic, pattern: pattern.name });
    }
  }
  return result;
};

module.exports = {
  getAllTopics,
  getTopicEntry,
  getPatternsByTopic,
  topicExists,
  patternExists,
  patternBelongsToTopic,
  resolveTopicSlug,
  resolvePatternSlug,
  getTopicForPattern,
  getLegacyMappings,
  resolveLegacyPattern,
  getRegistryStats,
  buildSlug,
  getPatternRegistryIndex,
  getAllCanonicalPatterns,
};

