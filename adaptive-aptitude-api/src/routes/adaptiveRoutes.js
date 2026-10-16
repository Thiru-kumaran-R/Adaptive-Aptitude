'use strict';

/**
 * src/routes/adaptiveRoutes.js
 *
 * Routes for the Adaptive Decision Engine.
 * Mounted at /api/v1/adaptive.
 */

const express = require('express');
const router = express.Router();
const adaptiveController = require('../controllers/adaptiveController');

// GET /api/v1/adaptive/next-question?userId=...&topic=...&pattern=...&planId=...
router.get('/next-question', adaptiveController.getNextQuestion);

module.exports = router;
