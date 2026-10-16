'use strict';

const express = require('express');
const router = express.Router();
const dailyObjectiveController = require('../controllers/dailyObjectiveController');
const { enforcePrincipalUserId } = require('../middleware/authorize');

// POST   /api/v1/daily-objectives                  — Create daily objective
// GET    /api/v1/daily-objectives/user/:userId      — List objectives for user
// GET    /api/v1/daily-objectives/:id               — Get single objective
// PATCH  /api/v1/daily-objectives/:id               — Update objective
// DELETE /api/v1/daily-objectives/:id               — Delete objective

router.get('/user/:userId', enforcePrincipalUserId, dailyObjectiveController.getDailyObjectivesByUser);
router.post('/', dailyObjectiveController.createDailyObjective);
router.get('/:id', dailyObjectiveController.getDailyObjective);
router.patch('/:id', dailyObjectiveController.updateDailyObjective);
router.delete('/:id', dailyObjectiveController.deleteDailyObjective);

module.exports = router;
