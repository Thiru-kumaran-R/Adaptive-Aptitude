'use strict';

/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',

  // Run tests sequentially — required because tests share a MongoDB connection
  // and some tests seed/clean the test database
  testRunner: 'jest-circus/runner',

  // Per-test timeout — generous for DB operations and Atlas connection latency
  // when running all 11 test suites sequentially with --runInBand
  testTimeout: 60000,

  // Test file patterns
  testMatch: ['**/tests/**/*.test.js'],

  // Collect coverage from src/ only
  collectCoverageFrom: ['src/**/*.js', '!src/server.js'],

  // Verbose output
  verbose: true,

  // Ensure Jest exits after all tests complete (prevent hanging connections)
  forceExit: true,
};
