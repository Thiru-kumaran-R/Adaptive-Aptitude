'use strict';

/**
 * mockBlueprintValidationService.js — Phase 6 Blueprint Validation & Canonical Fingerprinting
 *
 * Enforces explicit scope forms, section timing rules, difficulty distributions,
 * server-derived fields, and canonical SHA-256 fingerprint generation.
 */

const crypto = require('crypto');
const AppError = require('../../utils/AppError');
const {
  MOCK_MODES,
  NAVIGATION_POLICIES,
  SESSION_LIMITS,
  DEFAULT_DIFFICULTY_DISTRIBUTION,
  DEFAULT_GLOBAL_SCORING,
  MOCK_ERROR_CODES,
  MOCK_ALGORITHM_VERSION,
} = require('../../config/mockConfig');
const registryService = require('../patternRegistryService');

/**
 * Validates section scope against canonical registry.
 * Exactly one of four forms allowed:
 * 1. Topics only
 * 2. Patterns only
 * 3. Topics + Patterns (every pattern must belong to one of the topics)
 * 4. All canonical patterns (topics/patterns omitted/empty)
 */
const validateSectionScope = (scope, sectionIndex) => {
  if (!scope || typeof scope !== 'object') {
    throw new AppError(
      400,
      MOCK_ERROR_CODES.MOCK_SCOPE_REQUIRED,
      `Section [${sectionIndex}] scope is required.`
    );
  }

  const isAllCanonical = scope.allCanonicalPatterns === true;
  const rawTopics = Array.isArray(scope.topics) ? scope.topics.filter(Boolean) : [];
  const rawPatterns = Array.isArray(scope.patterns) ? scope.patterns.filter(Boolean) : [];

  if (isAllCanonical) {
    if (rawTopics.length > 0 || rawPatterns.length > 0) {
      throw new AppError(
        400,
        MOCK_ERROR_CODES.INVALID_SECTION_SCOPE,
        `Section [${sectionIndex}] specifies allCanonicalPatterns: true but also includes topics or patterns.`
      );
    }
    return {
      allCanonicalPatterns: true,
      topics: [],
      patterns: [],
    };
  }

  if (rawTopics.length === 0 && rawPatterns.length === 0) {
    throw new AppError(
      400,
      MOCK_ERROR_CODES.MOCK_SCOPE_REQUIRED,
      `Section [${sectionIndex}] must specify topics, patterns, or allCanonicalPatterns: true.`
    );
  }

  // Validate topics
  for (const t of rawTopics) {
    if (!registryService.topicExists(t)) {
      throw new AppError(
        400,
        MOCK_ERROR_CODES.INVALID_TOPIC,
        `Section [${sectionIndex}] references non-canonical topic "${t}".`
      );
    }
  }

  // Validate patterns
  for (const p of rawPatterns) {
    if (!registryService.patternExists(p)) {
      throw new AppError(
        400,
        MOCK_ERROR_CODES.INVALID_PATTERN,
        `Section [${sectionIndex}] references non-canonical pattern "${p}".`
      );
    }
  }

  // Topics + Patterns: every supplied pattern MUST belong to one of the specified topics
  if (rawTopics.length > 0 && rawPatterns.length > 0) {
    const topicSet = new Set(rawTopics);
    for (const p of rawPatterns) {
      const ownerTopic = registryService.getTopicForPattern(p);
      if (!ownerTopic || !topicSet.has(ownerTopic)) {
        throw new AppError(
          400,
          MOCK_ERROR_CODES.INVALID_SECTION_SCOPE,
          `Section [${sectionIndex}] pattern "${p}" does not belong to any supplied topic in [${rawTopics.join(', ')}].`
        );
      }
    }
  }

  return {
    allCanonicalPatterns: false,
    topics: rawTopics,
    patterns: rawPatterns,
  };
};

/**
 * Validates difficulty distribution object.
 * Returns normalized object or default.
 */
const validateDifficultyDistribution = (dist, sectionIndex) => {
  if (!dist) {
    return { ...DEFAULT_DIFFICULTY_DISTRIBUTION };
  }

  const easy = Number(dist.easy);
  const medium = Number(dist.medium);
  const hard = Number(dist.hard);

  if (
    Number.isNaN(easy) || easy < 0 || easy > 1 ||
    Number.isNaN(medium) || medium < 0 || medium > 1 ||
    Number.isNaN(hard) || hard < 0 || hard > 1
  ) {
    throw new AppError(
      400,
      MOCK_ERROR_CODES.INVALID_DIFFICULTY_DISTRIBUTION,
      `Section [${sectionIndex}] difficulty weights must be numbers between 0 and 1.`
    );
  }

  const sum = easy + medium + hard;
  if (Math.abs(sum - 1.0) > 0.001) {
    throw new AppError(
      400,
      MOCK_ERROR_CODES.INVALID_DIFFICULTY_DISTRIBUTION,
      `Section [${sectionIndex}] difficulty weights must sum to 1.0 (got ${sum}).`
    );
  }

  return { easy, medium, hard };
};

/**
 * Validates scoring parameters.
 */
const validateScoring = (scoring, contextName = 'Blueprint') => {
  if (!scoring) return null;

  const correctMarks = Number(scoring.correctMarks);
  const incorrectMarks = Number(scoring.incorrectMarks ?? 0);
  const unansweredMarks = Number(scoring.unansweredMarks ?? 0);

  if (Number.isNaN(correctMarks) || correctMarks <= 0) {
    throw new AppError(
      400,
      MOCK_ERROR_CODES.INVALID_SCORING,
      `${contextName} correctMarks must be strictly positive (> 0).`
    );
  }

  if (Number.isNaN(incorrectMarks) || incorrectMarks > 0) {
    throw new AppError(
      400,
      MOCK_ERROR_CODES.INVALID_SCORING,
      `${contextName} incorrectMarks must be non-positive (<= 0).`
    );
  }

  if (Number.isNaN(unansweredMarks) || unansweredMarks > 0) {
    throw new AppError(
      400,
      MOCK_ERROR_CODES.INVALID_SCORING,
      `${contextName} unansweredMarks must be non-positive (<= 0).`
    );
  }

  return { correctMarks, incorrectMarks, unansweredMarks };
};

/**
 * Normalizes blueprint structure for deterministic SHA-256 fingerprinting.
 */
const normalizeMockBlueprintForFingerprint = (blueprint) => {
  const mode = String(blueprint.mode).toLowerCase();
  const effectiveExcludeRecentQuestions =
    typeof blueprint.excludeRecentQuestions === 'boolean'
      ? blueprint.excludeRecentQuestions
      : mode === MOCK_MODES.DIAGNOSTIC;

  const navigationPolicy = blueprint.navigationPolicy || NAVIGATION_POLICIES.FREE;
  const globalScoring = {
    correctMarks: Number(blueprint.scoring?.correctMarks ?? DEFAULT_GLOBAL_SCORING.correctMarks),
    incorrectMarks: Number(blueprint.scoring?.incorrectMarks ?? DEFAULT_GLOBAL_SCORING.incorrectMarks),
    unansweredMarks: Number(blueprint.scoring?.unansweredMarks ?? DEFAULT_GLOBAL_SCORING.unansweredMarks),
  };

  // Section order is SEMANTIC and preserved
  const sections = (blueprint.sections || []).map((sec, idx) => {
    const secScoring = sec.scoring
      ? {
          correctMarks: Number(sec.scoring.correctMarks ?? globalScoring.correctMarks),
          incorrectMarks: Number(sec.scoring.incorrectMarks ?? globalScoring.incorrectMarks),
          unansweredMarks: Number(sec.scoring.unansweredMarks ?? globalScoring.unansweredMarks),
        }
      : { ...globalScoring };

    const isAllCanonical = Boolean(sec.scope?.allCanonicalPatterns);
    const topics = !isAllCanonical && sec.scope?.topics ? [...sec.scope.topics].sort() : [];
    const patterns = !isAllCanonical && sec.scope?.patterns ? [...sec.scope.patterns].sort() : [];

    const diffDist = sec.difficultyDistribution
      ? {
          easy: Number(sec.difficultyDistribution.easy ?? DEFAULT_DIFFICULTY_DISTRIBUTION.easy),
          medium: Number(sec.difficultyDistribution.medium ?? DEFAULT_DIFFICULTY_DISTRIBUTION.medium),
          hard: Number(sec.difficultyDistribution.hard ?? DEFAULT_DIFFICULTY_DISTRIBUTION.hard),
        }
      : { ...DEFAULT_DIFFICULTY_DISTRIBUTION };

    return {
      sectionId: String(sec.sectionId),
      order: idx, // Server-derived index
      questionCount: Number(sec.questionCount),
      durationMinutes:
        sec.durationMinutes !== null && sec.durationMinutes !== undefined
          ? Number(sec.durationMinutes)
          : null,
      scope: {
        allCanonicalPatterns: isAllCanonical,
        topics,
        patterns,
      },
      difficultyDistribution: diffDist,
      scoring: secScoring,
    };
  });

  return {
    mode,
    navigationPolicy,
    durationMinutes: Number(blueprint.durationMinutes),
    totalQuestions: sections.reduce((sum, s) => sum + s.questionCount, 0),
    excludeRecentQuestions: effectiveExcludeRecentQuestions,
    scoring: globalScoring,
    sections,
  };
};

/**
 * Computes canonical SHA-256 fingerprint for a normalized blueprint.
 */
const computeBlueprintFingerprint = (blueprint) => {
  const normalized = normalizeMockBlueprintForFingerprint(blueprint);
  return crypto.createHash('sha256').update(JSON.stringify(normalized)).digest('hex');
};

/**
 * Complete validation of raw client blueprint input.
 * Returns validated, server-derived normalized blueprint ready for persistence or generation.
 */
const validateAndNormalizeBlueprint = (raw) => {
  if (!raw || typeof raw !== 'object') {
    throw new AppError(400, MOCK_ERROR_CODES.INVALID_BLUEPRINT, 'Blueprint payload is required.');
  }

  // 1. Mode Validation (strictly precedes fingerprint)
  const mode = String(raw.mode || '').trim().toLowerCase();
  if (!Object.values(MOCK_MODES).includes(mode)) {
    throw new AppError(
      400,
      MOCK_ERROR_CODES.INVALID_BLUEPRINT,
      `mode must be one of: ${Object.values(MOCK_MODES).join(', ')}.`
    );
  }

  // 2. Navigation Policy
  const navigationPolicy = String(raw.navigationPolicy || NAVIGATION_POLICIES.FREE).trim().toLowerCase();
  if (!Object.values(NAVIGATION_POLICIES).includes(navigationPolicy)) {
    throw new AppError(
      400,
      MOCK_ERROR_CODES.INVALID_BLUEPRINT,
      `navigationPolicy must be one of: ${Object.values(NAVIGATION_POLICIES).join(', ')}.`
    );
  }

  // 3. Global Duration
  const durationMinutes = Number(raw.durationMinutes);
  if (
    Number.isNaN(durationMinutes) ||
    !Number.isInteger(durationMinutes) ||
    durationMinutes < SESSION_LIMITS.MIN_DURATION_MINUTES ||
    durationMinutes > SESSION_LIMITS.MAX_DURATION_MINUTES
  ) {
    throw new AppError(
      400,
      MOCK_ERROR_CODES.INVALID_BLUEPRINT,
      `durationMinutes must be an integer between ${SESSION_LIMITS.MIN_DURATION_MINUTES} and ${SESSION_LIMITS.MAX_DURATION_MINUTES}.`
    );
  }

  // 4. Global Scoring
  const validatedGlobalScoring = raw.scoring
    ? validateScoring(raw.scoring, 'Blueprint')
    : { ...DEFAULT_GLOBAL_SCORING };

  // 5. Sections Array
  if (!Array.isArray(raw.sections) || raw.sections.length === 0) {
    throw new AppError(400, MOCK_ERROR_CODES.INVALID_BLUEPRINT, 'Blueprint must contain at least one section.');
  }

  const seenSectionIds = new Set();
  let totalQuestionCount = 0;
  let totalSectionDuration = 0;
  let timedSectionCount = 0;

  const validatedSections = raw.sections.map((sec, idx) => {
    if (!sec || typeof sec !== 'object') {
      throw new AppError(400, MOCK_ERROR_CODES.INVALID_BLUEPRINT, `Section [${idx}] is invalid.`);
    }

    const sectionId = String(sec.sectionId || '').trim();
    if (!sectionId) {
      throw new AppError(400, MOCK_ERROR_CODES.INVALID_BLUEPRINT, `Section [${idx}] sectionId is required.`);
    }
    if (seenSectionIds.has(sectionId)) {
      throw new AppError(400, MOCK_ERROR_CODES.INVALID_BLUEPRINT, `Duplicate sectionId "${sectionId}".`);
    }
    seenSectionIds.add(sectionId);

    const title = String(sec.title || sectionId).trim();

    const qCount = Number(sec.questionCount);
    if (
      Number.isNaN(qCount) ||
      !Number.isInteger(qCount) ||
      qCount < SESSION_LIMITS.MIN_QUESTIONS ||
      qCount > SESSION_LIMITS.MAX_QUESTIONS
    ) {
      throw new AppError(
        400,
        MOCK_ERROR_CODES.INVALID_BLUEPRINT,
        `Section "${sectionId}" questionCount must be an integer between ${SESSION_LIMITS.MIN_QUESTIONS} and ${SESSION_LIMITS.MAX_QUESTIONS}.`
      );
    }
    totalQuestionCount += qCount;

    // Scope validation
    const scope = validateSectionScope(sec.scope, idx);

    // Difficulty distribution
    const difficultyDistribution = sec.difficultyDistribution
      ? validateDifficultyDistribution(sec.difficultyDistribution, idx)
      : null;

    // Section scoring
    const secScoring = sec.scoring ? validateScoring(sec.scoring, `Section "${sectionId}"`) : null;

    // Section timing
    let secDuration = null;
    if (sec.durationMinutes !== null && sec.durationMinutes !== undefined) {
      const dur = Number(sec.durationMinutes);
      if (Number.isNaN(dur) || !Number.isInteger(dur) || dur < 1) {
        throw new AppError(
          400,
          MOCK_ERROR_CODES.INVALID_SECTION_TIMING,
          `Section "${sectionId}" durationMinutes must be a positive integer.`
        );
      }
      secDuration = dur;
      totalSectionDuration += dur;
      timedSectionCount++;
    }

    return {
      sectionId,
      title,
      order: idx, // Server-derived
      questionCount: qCount,
      durationMinutes: secDuration,
      scope,
      difficultyDistribution,
      scoring: secScoring,
    };
  });

  // Total questions bounds
  if (totalQuestionCount < SESSION_LIMITS.MIN_QUESTIONS || totalQuestionCount > SESSION_LIMITS.MAX_QUESTIONS) {
    throw new AppError(
      400,
      MOCK_ERROR_CODES.INVALID_BLUEPRINT,
      `Total questions (${totalQuestionCount}) must be between ${SESSION_LIMITS.MIN_QUESTIONS} and ${SESSION_LIMITS.MAX_QUESTIONS}.`
    );
  }

  if (raw.totalQuestions !== undefined && raw.totalQuestions !== null) {
    if (Number(raw.totalQuestions) !== totalQuestionCount) {
      throw new AppError(
        400,
        MOCK_ERROR_CODES.INVALID_BLUEPRINT,
        `Supplied totalQuestions (${raw.totalQuestions}) does not match derived sum of section question counts (${totalQuestionCount}).`
      );
    }
  }

  // 6. Section Timing & Navigation Reconciliation
  if (navigationPolicy === NAVIGATION_POLICIES.FREE) {
    if (timedSectionCount > 0) {
      throw new AppError(
        400,
        MOCK_ERROR_CODES.INVALID_SECTION_TIMING,
        'Free navigation blueprints cannot define section durations (must be null).'
      );
    }
  } else if (navigationPolicy === NAVIGATION_POLICIES.SECTION_LOCKED) {
    // Either all sections timed, or all untimed
    if (timedSectionCount > 0 && timedSectionCount < validatedSections.length) {
      throw new AppError(
        400,
        MOCK_ERROR_CODES.INVALID_SECTION_TIMING,
        'Partial section timing is not allowed. All sections must define durationMinutes, or all must be untimed (null).'
      );
    }
    if (timedSectionCount === validatedSections.length) {
      if (totalSectionDuration > durationMinutes) {
        throw new AppError(
          400,
          MOCK_ERROR_CODES.INVALID_SECTION_TIMING,
          `Sum of section durations (${totalSectionDuration}m) cannot exceed global duration (${durationMinutes}m).`
        );
      }
    }
  }

  // 7. Effective Exclude Recent Questions
  const effectiveExcludeRecentQuestions =
    typeof raw.excludeRecentQuestions === 'boolean'
      ? raw.excludeRecentQuestions
      : mode === MOCK_MODES.DIAGNOSTIC;

  // 8. Canonical Fingerprint Calculation
  const blueprintFingerprint = computeBlueprintFingerprint({
    mode,
    navigationPolicy,
    durationMinutes,
    totalQuestions: totalQuestionCount,
    excludeRecentQuestions: effectiveExcludeRecentQuestions,
    scoring: validatedGlobalScoring,
    sections: validatedSections,
  });

  return {
    title: String(raw.title || 'Mock Test Blueprint').trim(),
    description: String(raw.description || '').trim(),
    mode,
    navigationPolicy,
    durationMinutes,
    totalQuestions: totalQuestionCount,
    scoring: validatedGlobalScoring,
    excludeRecentQuestions: typeof raw.excludeRecentQuestions === 'boolean' ? raw.excludeRecentQuestions : null,
    effectiveExcludeRecentQuestions,
    sections: validatedSections,
    blueprintFingerprint,
    algorithmVersion: MOCK_ALGORITHM_VERSION,
  };
};

module.exports = {
  validateSectionScope,
  validateDifficultyDistribution,
  validateScoring,
  normalizeMockBlueprintForFingerprint,
  computeBlueprintFingerprint,
  validateAndNormalizeBlueprint,
};
