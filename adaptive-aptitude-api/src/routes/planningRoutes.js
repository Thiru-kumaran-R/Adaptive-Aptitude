'use strict';

/**
 * Planning Routes — Phase 5: Automated Planning Engine
 *
 * Mounts planning endpoints under /api/v1/planning
 */

const express = require('express');
const router = express.Router();
const planningController = require('../controllers/planningController');

router.post('/preview', planningController.preview);
router.post('/generate', planningController.generate);
router.post('/plans/:planId/replan', planningController.replan);
router.get('/plans/:planId/schedule', planningController.getSchedule);

module.exports = router;
