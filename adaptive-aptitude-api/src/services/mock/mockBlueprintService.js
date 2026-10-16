'use strict';

/**
 * mockBlueprintService.js — Blueprint Management & Zero-Write Preview
 *
 * Implements:
 * 1. POST /api/v1/mock-blueprints
 * 2. GET /api/v1/mock-blueprints
 * 3. GET /api/v1/mock-blueprints/:id
 * 4. POST /api/v1/mock-blueprints/preview (Strictly zero writes across all 5 collections)
 */

const mongoose = require('mongoose');
const MockBlueprint = require('../../models/mockBlueprintModel');
const { BLUEPRINT_STATUS, MOCK_ERROR_CODES } = require('../../config/mockConfig');
const { validateAndNormalizeBlueprint } = require('./mockBlueprintValidationService');
const { assembleMockSessionQuestions, allocatePatternsForSection } = require('./mockAssemblerService');
const AppError = require('../../utils/AppError');

/**
 * Creates a validated, canonical MockBlueprint.
 */
const createBlueprint = async (rawData) => {
  const normalized = validateAndNormalizeBlueprint(rawData);
  const blueprint = await MockBlueprint.create(normalized);
  return blueprint;
};

/**
 * Retrieves all active blueprints.
 */
const getBlueprints = async (filter = {}) => {
  const query = { status: BLUEPRINT_STATUS.ACTIVE, ...filter };
  return await MockBlueprint.find(query).sort({ createdAt: -1 });
};

/**
 * Retrieves a single blueprint by ID.
 */
const getBlueprintById = async (blueprintId) => {
  if (!mongoose.Types.ObjectId.isValid(blueprintId)) {
    throw new AppError(404, MOCK_ERROR_CODES.MOCK_BLUEPRINT_NOT_FOUND, 'Mock blueprint not found.');
  }

  const blueprint = await MockBlueprint.findById(blueprintId);
  if (!blueprint) {
    throw new AppError(404, MOCK_ERROR_CODES.MOCK_BLUEPRINT_NOT_FOUND, 'Mock blueprint not found.');
  }

  return blueprint;
};

/**
 * Evaluates blueprint structure, pattern allocation, and question availability.
 * STRICT ZERO-WRITE GUARANTEE: Never writes to any collection.
 */
const previewBlueprint = async (rawData) => {
  const normalized = validateAndNormalizeBlueprint(rawData);

  // Evaluate pattern allocations per section
  const sectionPreviews = await Promise.all(
    normalized.sections.map(async (sec) => {
      const patternAllocations = await allocatePatternsForSection({
        section: sec,
        mode: normalized.mode,
        userId: rawData.userId,
      });

      return {
        sectionId: sec.sectionId,
        title: sec.title,
        questionCount: sec.questionCount,
        durationMinutes: sec.durationMinutes,
        patternAllocations,
      };
    })
  );

  // Perform dry-run question assembly to verify question bank availability
  await assembleMockSessionQuestions({
    blueprint: normalized,
    userId: rawData.userId,
    generationSeed: 'preview-seed-zero-write',
    dryRun: true,
  });

  return {
    blueprintFingerprint: normalized.blueprintFingerprint,
    mode: normalized.mode,
    navigationPolicy: normalized.navigationPolicy,
    totalQuestions: normalized.totalQuestions,
    durationMinutes: normalized.durationMinutes,
    effectiveExcludeRecentQuestions: normalized.effectiveExcludeRecentQuestions,
    sections: sectionPreviews,
    canGenerate: true,
  };
};

module.exports = {
  createBlueprint,
  getBlueprints,
  getBlueprintById,
  previewBlueprint,
};
