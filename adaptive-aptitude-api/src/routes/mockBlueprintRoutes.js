'use strict';

/**
 * mockBlueprintRoutes.js — API Routes for Mock Blueprints
 */

const express = require('express');
const router = express.Router();
const controller = require('../controllers/mockBlueprintController');

router.post('/', controller.createBlueprint);
router.get('/', controller.getBlueprints);
router.post('/preview', controller.previewBlueprint);
router.get('/:id', controller.getBlueprintById);

module.exports = router;
