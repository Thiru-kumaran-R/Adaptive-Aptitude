'use strict';

/**
 * Revision Controller — Phase 5: Spaced Revision Engine
 *
 * Implements HTTP endpoints for due revisions, 1-day/2-day revision plans,
 * user revision inventory, and historical state recovery.
 */

const { getDueRevisions } = require('../services/revision/revisionQueryService');
const { generateRevisionPlan } = require('../services/revision/revisionPlanService');
const {
  rebuildRevisionState,
  rebuildUserRevisionState,
} = require('../services/revision/revisionRecoveryService');
const RevisionItem = require('../models/revisionItemModel');
const { userExists } = require('../services/userService');

const getDue = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { date, referenceDate, topic, planId, goalId, limit } = req.query;
    const items = await getDueRevisions(userId, {
      date,
      referenceDate,
      topic,
      planId,
      goalId,
      limit,
    });
    res.status(200).json({ success: true, count: items.length, data: items });
  } catch (err) {
    next(err);
  }
};

const getPlan = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { days, questionBudget, patternsPerDay, referenceDate, date, topic, planId, goalId } =
      req.query;
    const plan = await generateRevisionPlan(userId, {
      days,
      questionBudget,
      patternsPerDay,
      referenceDate: referenceDate || date,
      topic,
      planId,
      goalId,
    });
    res.status(200).json({ success: true, data: plan });
  } catch (err) {
    next(err);
  }
};

const getByUser = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    if (!(await userExists(userId))) {
      const err = new Error(`User "${userId}" not found.`);
      err.statusCode = 404;
      err.code = 'USER_NOT_FOUND';
      throw err;
    }
    const { topic, status } = req.query;
    const query = { userId };
    if (topic) query.topic = topic;
    if (status) query.status = status;

    const items = await RevisionItem.find(query).sort({ nextReviewDate: 1 });
    res.status(200).json({ success: true, count: items.length, data: items });
  } catch (err) {
    next(err);
  }
};

const getById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const item = await RevisionItem.findById(id);
    if (!item) {
      const err = new Error('Revision item not found.');
      err.statusCode = 404;
      err.code = 'REVISION_NOT_FOUND';
      throw err;
    }
    if (item.userId !== req.user.userId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'OWNERSHIP_VIOLATION',
          message: 'Access denied: caller does not own this resource.'
        }
      });
    }
    res.status(200).json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
};

const rebuildState = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { topic, pattern, referenceDate } = req.body;

    let result;
    if (topic && pattern) {
      result = await rebuildRevisionState(userId, topic, pattern, { referenceDate });
    } else {
      result = await rebuildUserRevisionState(userId, { referenceDate });
    }

    res.status(200).json({
      success: true,
      message: 'Revision state successfully rebuilt.',
      data: result,
    });
  } catch (err) {
    console.error(JSON.stringify({ event: 'REVISION_REBUILD_FAILED', error: err.message }));
    next(err);
  }
};

module.exports = {
  getDue,
  getPlan,
  getByUser,
  getById,
  rebuildState,
};
