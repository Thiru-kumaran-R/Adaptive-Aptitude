'use strict';

const express = require('express');
const router = express.Router();
const studentProgressController = require('../controllers/studentProgressController');
const { enforcePrincipalUserId } = require('../middleware/authorize');

// NOTE: Static sub-paths must be registered BEFORE /:userId to avoid Express conflicts.

// GET /api/v1/progress/prerequisites/:patternName
// Q10: prerequisite data for a pattern (static path — register FIRST)
router.get('/prerequisites/:patternName', studentProgressController.getPrerequisiteData);

// GET /api/v1/progress/:userId
// Q1: all progress for a user
router.get('/:userId', enforcePrincipalUserId, studentProgressController.getProgressByUser);

// GET /api/v1/progress/:userId/topics
// Q1 (topic-filtered): progress grouped by topic
router.get('/:userId/topics', enforcePrincipalUserId, studentProgressController.getProgressByTopic);

// GET /api/v1/progress/:userId/patterns?topic=...
// Q2: progress by pattern within a topic
router.get('/:userId/patterns', enforcePrincipalUserId, studentProgressController.getProgressByPattern);

// GET /api/v1/progress/:userId/weakest?topic=...&limit=...
// Q4: weakest patterns by accuracy
router.get('/:userId/weakest', enforcePrincipalUserId, studentProgressController.getWeakestPatterns);

// GET /api/v1/progress/:userId/difficulty-distribution?topic=...&pattern=...
// Q7: difficulty distribution of attempts
router.get('/:userId/difficulty-distribution', enforcePrincipalUserId, studentProgressController.getDifficultyDistribution);

// GET /api/v1/progress/:userId/accuracy-over-time?topic=...&pattern=...
// Q8: accuracy over time
router.get('/:userId/accuracy-over-time', enforcePrincipalUserId, studentProgressController.getAccuracyOverTime);

// GET /api/v1/progress/:userId/by-source
// Q9: attempt counts by source type
router.get('/:userId/by-source', enforcePrincipalUserId, studentProgressController.getAttemptsBySource);

module.exports = router;
