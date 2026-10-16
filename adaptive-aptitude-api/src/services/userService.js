'use strict';

/**
 * User Service — Phase 3
 */

const User = require('../models/userModel');

const createUser = async ({ userId, name, email, avatar }) => {
  const existing = await User.findOne({ userId });
  if (existing) {
    const err = new Error(`User with userId "${userId}" already exists.`);
    err.statusCode = 409;
    err.code = 'USER_EXISTS';
    throw err;
  }
  const user = await User.create({ userId, name, email, avatar });
  return user;
};

const getUserById = async (userId) => {
  const user = await User.findOne({ userId });
  if (!user) {
    const err = new Error(`User "${userId}" not found.`);
    err.statusCode = 404;
    err.code = 'USER_NOT_FOUND';
    throw err;
  }
  return user;
};

const userExists = async (userId) => {
  const count = await User.countDocuments({ userId });
  return count > 0;
};

module.exports = { createUser, getUserById, userExists };
