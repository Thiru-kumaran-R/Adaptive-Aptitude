'use strict';

/**
 * Analytics Routes — Phase 8: Cognitive Diagnostics & Longitudinal Learning Analytics Engine
 *
 * Mounts:
 *   GET /api/v1/analytics/dashboard
 *   GET /api/v1/analytics/cognitive-profile
 *   GET /api/v1/analytics/retention
 *   GET /api/v1/analytics/readiness/:goalId
 */

const express = require('express');
const analyticsGuard = require('../middlewares/analyticsGuard');
const analyticsController = require('../controllers/analyticsController');

const router = express.Router();

// Enforce analytics guard across all Phase 8 routes
router.use(analyticsGuard);

router.get('/dashboard', analyticsController.getDashboard);
router.get('/cognitive-profile', analyticsController.getCognitiveProfile);
router.get('/retention', analyticsController.getRetention);
router.get('/readiness/:goalId', analyticsController.getReadiness);

module.exports = router;
