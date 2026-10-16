'use strict';

/**
 * Authorize Middleware & Universal Principal User-ID Guards — Phase 14
 *
 * Implements authoritative caller identity validation and BOLA/IDOR defense.
 */

const Goal = require('../models/goalModel');
const StudyPlan = require('../models/studyPlanModel');
const Attempt = require('../models/attemptModel');
const MockSession = require('../models/mockSessionModel');
const DailyObjective = require('../models/dailyObjectiveModel');
const PrescriptionExecutionRecord = require('../models/prescriptionExecutionRecordModel');

/**
 * Universal Body/Query Principal Guard (Mounted at Step 13a in src/app.js)
 *
 * Enforces that any client-supplied userId in body or query matches req.user.userId
 * across all 74 protected business routes.
 */
function enforcePrincipalUserIdBodyQuery(req, res, next) {
  // Exact method + path bypass for tombstone routes ONLY
  const isTombstone =
    (req.method === 'POST' && (req.originalUrl === '/api/v1/users' || req.baseUrl + req.path === '/api/v1/users')) ||
    (req.method === 'POST' && (req.originalUrl === '/api/v1/mock-blueprints' || req.baseUrl + req.path === '/api/v1/mock-blueprints'));

  if (isTombstone) {
    return next();
  }

  // Fail-closed assertion: req.user must exist on all protected business routes
  if (!req.user || !req.user.userId) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authorization header is required.'
      }
    });
  }

  const suppliedUserIds = [
    req.query?.userId,
    req.body?.userId
  ].filter((value) => value !== undefined);

  for (const suppliedUserId of suppliedUserIds) {
    if (typeof suppliedUserId === 'string' && suppliedUserId.trim().length === 0) {
      continue;
    }
    if (Array.isArray(suppliedUserId)) {
      continue;
    }
    if (typeof suppliedUserId !== 'string' || suppliedUserId !== req.user.userId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'IDENTITY_MISMATCH',
          message: 'Caller identity does not match token subject.'
        }
      });
    }
  }

  next();
}

/**
 * Route-Level Principal Guard (Mounted in routers on routes with :userId parameters)
 *
 * Enforces that any client-supplied userId in req.params (or query/body)
 * matches the authenticated principal (req.user.userId).
 */
function enforcePrincipalUserId(req, res, next) {
  const suppliedUserIds = [
    req.params?.userId,
    req.query?.userId,
    req.body?.userId
  ].filter((value) => value !== undefined);

  for (const suppliedUserId of suppliedUserIds) {
    if (typeof suppliedUserId !== 'string' || suppliedUserId !== req.user.userId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'IDENTITY_MISMATCH',
          message: 'Caller identity does not match token subject.'
        }
      });
    }
  }

  next();
}

/**
 * Asserts document ownership against authenticated caller userId.
 */
function assertOwnership(document, userId, res) {
  if (!document || !userId || document.userId !== userId) {
    if (res) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'OWNERSHIP_VIOLATION',
          message: 'Access denied: caller does not own this resource.'
        }
      });
    }
    const error = new Error('Access denied: caller does not own this resource.');
    error.statusCode = 403;
    error.code = 'OWNERSHIP_VIOLATION';
    throw error;
  }
  return true;
}

async function verifyGoalOwnership(goalId, userId) {
  const goal = await Goal.findById(goalId);
  if (!goal) {
    const err = new Error('Goal not found.');
    err.statusCode = 404;
    err.code = 'GOAL_NOT_FOUND';
    throw err;
  }
  if (goal.userId !== userId) {
    const err = new Error('Access denied: caller does not own this resource.');
    err.statusCode = 403;
    err.code = 'OWNERSHIP_VIOLATION';
    throw err;
  }
  return goal;
}

async function verifyPlanOwnership(planId, userId) {
  const plan = await StudyPlan.findById(planId);
  if (!plan) {
    const err = new Error('Study plan not found.');
    err.statusCode = 404;
    err.code = 'STUDY_PLAN_NOT_FOUND';
    throw err;
  }
  if (plan.userId !== userId) {
    const err = new Error('Access denied: caller does not own this resource.');
    err.statusCode = 403;
    err.code = 'OWNERSHIP_VIOLATION';
    throw err;
  }
  return plan;
}

async function verifyAttemptOwnership(attemptId, userId) {
  const attempt = await Attempt.findById(attemptId);
  if (!attempt) {
    const err = new Error('Attempt not found.');
    err.statusCode = 404;
    err.code = 'ATTEMPT_NOT_FOUND';
    throw err;
  }
  if (attempt.userId !== userId) {
    const err = new Error('Access denied: caller does not own this resource.');
    err.statusCode = 403;
    err.code = 'OWNERSHIP_VIOLATION';
    throw err;
  }
  return attempt;
}

async function verifyMockSessionOwnership(sessionId, userId) {
  const session = await MockSession.findById(sessionId);
  if (!session) {
    const err = new Error('Mock session not found.');
    err.statusCode = 404;
    err.code = 'SESSION_NOT_FOUND';
    throw err;
  }
  if (session.userId !== userId) {
    const err = new Error('Access denied: caller does not own this resource.');
    err.statusCode = 403;
    err.code = 'OWNERSHIP_VIOLATION';
    throw err;
  }
  return session;
}

async function verifyDailyObjectiveOwnership(objectiveId, userId) {
  const objective = await DailyObjective.findById(objectiveId);
  if (!objective) {
    const err = new Error('Daily objective not found.');
    err.statusCode = 404;
    err.code = 'DAILY_OBJECTIVE_NOT_FOUND';
    throw err;
  }
  if (objective.userId !== userId) {
    const err = new Error('Access denied: caller does not own this resource.');
    err.statusCode = 403;
    err.code = 'OWNERSHIP_VIOLATION';
    throw err;
  }
  return objective;
}

async function verifyPrescriptionOwnership(prescriptionId, userId) {
  const prescription = await PrescriptionExecutionRecord.findOne({ prescriptionId });
  if (!prescription) {
    const err = new Error('Prescription not found.');
    err.statusCode = 404;
    err.code = 'PRESCRIPTION_NOT_FOUND';
    throw err;
  }
  if (prescription.userId !== userId) {
    const err = new Error('Access denied: caller does not own this resource.');
    err.statusCode = 403;
    err.code = 'OWNERSHIP_VIOLATION';
    throw err;
  }
  return prescription;
}

module.exports = {
  enforcePrincipalUserIdBodyQuery,
  enforcePrincipalUserId,
  assertOwnership,
  verifyGoalOwnership,
  verifyPlanOwnership,
  verifyAttemptOwnership,
  verifyMockSessionOwnership,
  verifyDailyObjectiveOwnership,
  verifyPrescriptionOwnership
};
