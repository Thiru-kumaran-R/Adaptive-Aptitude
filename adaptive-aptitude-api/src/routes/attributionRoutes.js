'use strict';

/**
 * Attribution Routes — Phase 10: Prescription Adherence & Learning Outcome Attribution Engine (PAOA)
 *
 * Mounts:
 *   POST /api/v1/attribution/prescriptions
 *   POST /api/v1/attribution/prescriptions/:prescriptionId/activate
 *   POST /api/v1/attribution/prescriptions/:prescriptionId/complete
 *   GET  /api/v1/attribution/users/:userId/summary
 *
 * Protected by attributionGuard and enforcePrincipalUserId param guard.
 */

const express = require('express');
const attributionGuard = require('../middlewares/attributionGuard');
const attributionController = require('../controllers/attributionController');
const { enforcePrincipalUserId } = require('../middleware/authorize');

const router = express.Router();

router.post(
  '/prescriptions',
  attributionGuard,
  attributionController.issuePrescription
);

router.post(
  '/prescriptions/:prescriptionId/activate',
  attributionGuard,
  attributionController.activatePrescription
);

router.post(
  '/prescriptions/:prescriptionId/complete',
  attributionGuard,
  attributionController.completePrescription
);

router.get(
  '/users/:userId/summary',
  enforcePrincipalUserId,
  attributionGuard,
  attributionController.getSummary
);

module.exports = router;
