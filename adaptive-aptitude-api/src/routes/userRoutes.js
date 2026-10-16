'use strict';

const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { enforcePrincipalUserId } = require('../middleware/authorize');

// POST   /api/v1/users          — Tombstone: 410 USER_CREATION_ENDPOINT_DEPRECATED
// GET    /api/v1/users/:userId  — Get user by userId (requires matching principal)

router.post('/', userController.createUser);
router.get('/:userId', enforcePrincipalUserId, userController.getUser);

module.exports = router;
