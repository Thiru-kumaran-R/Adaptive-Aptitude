'use strict';

/**
 * mockBlueprintController.js — HTTP Controller for Mock Blueprints
 *
 * Enforces Phase 14 mutation closure: POST /api/v1/mock-blueprints -> 403 BLUEPRINT_MUTATION_CLOSED
 */

const mockBlueprintService = require('../services/mock/mockBlueprintService');

const createBlueprint = async (_req, res) => {
  return res.status(403).json({
    success: false,
    error: {
      code: 'BLUEPRINT_MUTATION_CLOSED',
      message: 'Mock blueprint creation is closed to learner HTTP access.'
    }
  });
};

const getBlueprints = async (req, res, next) => {
  try {
    const blueprints = await mockBlueprintService.getBlueprints(req.query);
    res.status(200).json({ success: true, data: blueprints });
  } catch (err) {
    next(err);
  }
};

const getBlueprintById = async (req, res, next) => {
  try {
    const blueprint = await mockBlueprintService.getBlueprintById(req.params.id);
    res.status(200).json({ success: true, data: blueprint });
  } catch (err) {
    next(err);
  }
};

const previewBlueprint = async (req, res, next) => {
  try {
    const previewResult = await mockBlueprintService.previewBlueprint(req.body);
    res.status(200).json({ success: true, data: previewResult });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createBlueprint,
  getBlueprints,
  getBlueprintById,
  previewBlueprint,
};
