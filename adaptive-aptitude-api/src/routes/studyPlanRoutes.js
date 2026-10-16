'use strict';

const express = require('express');
const router = express.Router();
const studyPlanController = require('../controllers/studyPlanController');
const { enforcePrincipalUserId } = require('../middleware/authorize');

// POST   /api/v1/study-plans                 — Create study plan
// GET    /api/v1/study-plans/user/:userId    — List study plans for user
// GET    /api/v1/study-plans/:id             — Get single study plan
// PATCH  /api/v1/study-plans/:id             — Update study plan
// DELETE /api/v1/study-plans/:id             — Delete study plan

router.get('/user/:userId', enforcePrincipalUserId, studyPlanController.getStudyPlansByUser);
router.post('/', studyPlanController.createStudyPlan);
router.get('/:id', studyPlanController.getStudyPlan);
router.patch('/:id', studyPlanController.updateStudyPlan);
router.delete('/:id', studyPlanController.deleteStudyPlan);

module.exports = router;
