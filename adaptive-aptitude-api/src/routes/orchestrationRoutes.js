'use strict';

/**
 * Orchestration Routes — Phase 9: Prescriptive Learning Orchestration & Next-Best-Action (NBA) Engine
 *
 * Mounts:
 *   GET /api/v1/orchestration/next-action
 *   GET /api/v1/orchestration/daily-agenda
 *   GET /api/v1/orchestration/interventions
 *
 * Protected globally by orchestrationGuard.
 */

const express = require('express');
const orchestrationGuard = require('../middlewares/orchestrationGuard');
const orchestrationController = require('../controllers/orchestrationController');

const router = express.Router();

// Enforce dedicated orchestration guard across all Phase 9 routes
router.use(orchestrationGuard);

router.get('/next-action', orchestrationController.getNextAction);
router.get('/daily-agenda', orchestrationController.getDailyAgenda);
router.get('/interventions', orchestrationController.getInterventions);

module.exports = router;
