'use strict';

const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');
const userService = require('../services/userService');

const createUser = asyncHandler(async (_req, res) => {
  return res.status(410).json({
    success: false,
    error: {
      code: 'USER_CREATION_ENDPOINT_DEPRECATED',
      message: 'Direct user creation via POST /api/v1/users is permanently deprecated. Use POST /api/v1/auth/register.'
    }
  });
});

const getUser = asyncHandler(async (req, res) => {
  const userId = req.user?.userId || req.params.userId;
  const user = await userService.getUserById(userId);
  return sendSuccess(res, user);
});

module.exports = { createUser, getUser };
