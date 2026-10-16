'use strict';

const express = require('express');
const router = express.Router();
const attemptController = require('../controllers/attemptController');
const { enforcePrincipalUserId } = require('../middleware/authorize');

// POST   /api/v1/attempts                  — Submit attempt
// GET    /api/v1/attempts/user/:userId      — List attempts for user
// GET    /api/v1/attempts/:id               — Get single attempt

router.get('/user/:userId', enforcePrincipalUserId, attemptController.getAttemptsByUser);
router.post('/', attemptController.createAttempt);
router.get('/:id', attemptController.getAttempt);

module.exports = router;
