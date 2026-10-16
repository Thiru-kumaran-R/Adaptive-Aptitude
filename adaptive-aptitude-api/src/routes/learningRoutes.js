'use strict';

/**
 * learningRoutes.js — Express Router for Phase 7 Intelligent Learning API
 */

const express = require('express');
const learningController = require('../controllers/learningController');

const router = express.Router();

router.post('/tutor', learningController.tutor);
router.post('/hint', learningController.hint);
router.post('/explain-attempt', learningController.explainAttempt);
router.post('/explain-progress', learningController.explainProgress);
router.post('/explain-plan', learningController.explainPlan);
router.post('/mock-review', learningController.mockReview);

module.exports = router;
