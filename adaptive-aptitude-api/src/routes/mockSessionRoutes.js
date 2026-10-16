'use strict';

/**
 * mockSessionRoutes.js — API Routes for Mock Sessions
 */

const express = require('express');
const router = express.Router();
const controller = require('../controllers/mockSessionController');

router.post('/', controller.createSession);
router.post('/:id/start', controller.startSession);
router.get('/:id', controller.getSession);
router.get('/:id/questions/:questionId', controller.getQuestion);
router.post('/:id/responses', controller.saveResponse);
router.post('/:id/sections/:sectionId/complete', controller.completeSection);
router.post('/:id/submit', controller.submitSession);
router.post('/:id/abandon', controller.abandonSession);
router.get('/:id/result', controller.getResult);
router.get('/:id/review', controller.getReview);

module.exports = router;
