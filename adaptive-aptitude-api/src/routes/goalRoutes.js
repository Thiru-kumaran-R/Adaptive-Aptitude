'use strict';

const express = require('express');
const router = express.Router();
const goalController = require('../controllers/goalController');
const { enforcePrincipalUserId } = require('../middleware/authorize');

// POST   /api/v1/goals                 — Create goal
// GET    /api/v1/goals/user/:userId    — List all goals for a user
// GET    /api/v1/goals/:id             — Get single goal
// PATCH  /api/v1/goals/:id             — Update goal
// DELETE /api/v1/goals/:id             — Delete goal

// IMPORTANT: register /user/:userId BEFORE /:id to avoid Express conflict
router.get('/user/:userId', enforcePrincipalUserId, goalController.getGoalsByUser);
router.post('/', goalController.createGoal);
router.get('/:id', goalController.getGoal);
router.patch('/:id', goalController.updateGoal);
router.delete('/:id', goalController.deleteGoal);

module.exports = router;
