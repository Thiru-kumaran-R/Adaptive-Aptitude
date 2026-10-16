'use strict';

const mongoose = require('mongoose');
const logger = require('../utils/logger');
const metrics = require('../utils/metrics');

/**
 * Returns the appropriate MongoDB URI for the current environment.
 * Tests use TEST_MONGODB_URI; all other environments use MONGODB_URI.
 */
const getMongoURI = () => {
  if (process.env.NODE_ENV === 'test') {
    if (!process.env.TEST_MONGODB_URI) {
      throw new Error(
        'TEST_MONGODB_URI is not defined. Set it in .env to point at adaptive_aptitude_test.'
      );
    }
    return process.env.TEST_MONGODB_URI;
  }

  if (!process.env.MONGODB_URI) {
    throw new Error(
      'MONGODB_URI is not defined. Set it in .env to point at adaptive_aptitude.'
    );
  }
  return process.env.MONGODB_URI;
};

let listenersRegistered = false;

const registerConnectionListeners = () => {
  if (listenersRegistered) return;
  listenersRegistered = true;

  mongoose.connection.on('connected', () => {
    try {
      metrics.setGauge('mongodb_connection_status', {}, 1);
    } catch (_err) {}
    logger.info({
      event: 'MONGODB_CONNECTED',
      component: 'database',
      message: 'MongoDB connection established'
    });
  });

  mongoose.connection.on('disconnected', () => {
    try {
      metrics.setGauge('mongodb_connection_status', {}, 0);
      metrics.incrementCounter('phase13_lifecycle_events_total', { event: 'DB_DISCONNECT' });
    } catch (_err) {}
    logger.warn({
      event: 'MONGODB_DISCONNECTED',
      component: 'database',
      message: 'MongoDB disconnected'
    });
  });

  mongoose.connection.on('reconnected', () => {
    try {
      metrics.setGauge('mongodb_connection_status', {}, 1);
    } catch (_err) {}
    logger.info({
      event: 'MONGODB_RECONNECTED',
      component: 'database',
      message: 'MongoDB reconnected'
    });
  });

  mongoose.connection.on('connecting', () => {
    try {
      metrics.setGauge('mongodb_connection_status', {}, 2);
    } catch (_err) {}
  });

  mongoose.connection.on('disconnecting', () => {
    try {
      metrics.setGauge('mongodb_connection_status', {}, 3);
    } catch (_err) {}
  });

  mongoose.connection.on('error', (err) => {
    logger.error({
      event: 'MONGODB_ERROR',
      component: 'database',
      message: err?.message || 'MongoDB connection error',
      errorCode: err?.code || 'UNKNOWN'
    });
  });
};

/**
 * Connect to MongoDB.
 * Throws on failure so the caller can decide how to handle it (server startup vs scripts).
 */
const connectDB = async () => {
  registerConnectionListeners();

  const uri = getMongoURI();

  const conn = await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 5000
  });

  return conn;
};

/**
 * Disconnect from MongoDB.
 * Used in test teardown and graceful shutdown.
 */
const disconnectDB = async () => {
  await mongoose.disconnect();
};

/**
 * Returns the current connection database name.
 * Useful for safety checks in import scripts.
 */
const getConnectedDBName = () => {
  return mongoose.connection.name || null;
};

module.exports = {
  connectDB,
  disconnectDB,
  getConnectedDBName,
  getMongoURI,
  registerConnectionListeners
};
