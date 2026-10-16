'use strict';

/**
 * Auth Routes — Phase 14
 *
 * Exposes the 6 canonical Phase 14 authentication endpoints:
 *   POST /api/v1/auth/register
 *   POST /api/v1/auth/login
 *   POST /api/v1/auth/refresh
 *   POST /api/v1/auth/logout
 *   POST /api/v1/auth/revoke-all
 *   GET  /api/v1/auth/me
 */

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authRateLimiter, refreshRateLimiter } = require('../middleware/rateLimiter');
const authenticate = require('../middleware/authenticate');

router.post('/register', authRateLimiter, authController.register);
router.post('/login', authRateLimiter, authController.login);
router.post('/refresh', refreshRateLimiter, authController.refresh);
router.post('/logout', authenticate, authController.logout);
router.post('/revoke-all', authenticate, authController.revokeAll);
router.get('/me', authenticate, authController.getMe);

module.exports = router;
