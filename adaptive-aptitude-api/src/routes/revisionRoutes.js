'use strict';

/**
 * Revision Routes — Phase 5: Spaced Revision Engine
 *
 * Mounts revision endpoints under /api/v1/revisions
 */

const express = require('express');
const router = express.Router();
const revisionController = require('../controllers/revisionController');
const { enforcePrincipalUserId } = require('../middleware/authorize');

router.get('/due', revisionController.getDue);
router.get('/plan', revisionController.getPlan);
router.get('/user/:userId', enforcePrincipalUserId, revisionController.getByUser);
router.get('/:id', revisionController.getById);
router.post('/rebuild', revisionController.rebuildState);

module.exports = router;
