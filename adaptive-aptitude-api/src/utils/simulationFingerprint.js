'use strict';

const crypto = require('node:crypto');

/**
 * Phase 11: Simulation Fingerprint & Canonical JSON Utility
 *
 * Provides deterministic hashing and canonical JSON serialization.
 * Pure node:crypto dependency. Zero filesystem or database dependencies.
 */

/**
 * Recursively canonicalizes a value into a deterministic JSON string.
 *
 * Invariants:
 * 1. Strict Rejection: Throws error on undefined, function, symbol, BigInt, NaN, Infinity, -Infinity.
 * 2. BSON ObjectId: Converted to lowercase 24-character hex string.
 * 3. Date: Serialized via .toISOString().
 * 4. Object keys: Recursively sorted lexicographically.
 * 5. Array preservation: Array order strictly preserved.
 * 6. Finite numbers: Preserved exactly according to standard JSON numeric serialization.
 *
 * @param {*} value
 * @returns {string} Compact canonical JSON string
 */
const canonicalizeJSON = (value) => {
  const serialize = (val) => {
    if (val === null) {
      return 'null';
    }

    if (val === undefined) {
      const err = new TypeError('canonicalizeJSON: undefined is not permitted in canonical JSON');
      err.code = 'INVALID_POLICY_DEFINITION';
      throw err;
    }

    const type = typeof val;

    if (type === 'function' || type === 'symbol' || type === 'bigint') {
      const err = new TypeError(`canonicalizeJSON: Type "${type}" is not permitted in canonical JSON`);
      err.code = 'INVALID_POLICY_DEFINITION';
      throw err;
    }

    if (type === 'number') {
      if (!Number.isFinite(val)) {
        const err = new TypeError(`canonicalizeJSON: Non-finite number "${val}" is not permitted in canonical JSON`);
        err.code = 'INVALID_POLICY_DEFINITION';
        throw err;
      }
      return JSON.stringify(val);
    }

    if (type === 'string' || type === 'boolean') {
      return JSON.stringify(val);
    }

    // Date normalization
    if (val instanceof Date) {
      if (isNaN(val.getTime())) {
        const err = new TypeError('canonicalizeJSON: Invalid Date instance');
        err.code = 'INVALID_POLICY_DEFINITION';
        throw err;
      }
      return JSON.stringify(val.toISOString());
    }

    // BSON ObjectId normalization (or object with toHexString)
    if (typeof val.toHexString === 'function') {
      const hex = val.toHexString();
      return JSON.stringify(String(hex).toLowerCase());
    }

    // Array preservation
    if (Array.isArray(val)) {
      const items = val.map((item) => serialize(item));
      return `[${items.join(',')}]`;
    }

    // Plain object normalization with lexicographically sorted keys
    if (type === 'object') {
      const sortedKeys = Object.keys(val).sort();
      const entries = sortedKeys.map((key) => {
        const serializedKey = JSON.stringify(key);
        const serializedVal = serialize(val[key]);
        return `${serializedKey}:${serializedVal}`;
      });
      return `{${entries.join(',')}}`;
    }

    const err = new TypeError(`canonicalizeJSON: Unsupported value type "${type}"`);
    err.code = 'INVALID_POLICY_DEFINITION';
    throw err;
  };

  return serialize(value);
};

/**
 * Computes SHA-256 fingerprint of a candidate policy definition.
 *
 * @param {Object} policy Normalized candidate policy object
 * @returns {string} SHA-256 hex string
 */
const generatePolicyFingerprint = (policy) => {
  const canonicalStr = canonicalizeJSON(policy);
  return crypto.createHash('sha256').update(canonicalStr).digest('hex');
};

/**
 * Computes SHA-256 fingerprint of a dataset or user cohort.
 *
 * @param {Array|Object} dataset
 * @returns {string} SHA-256 hex string
 */
const generateDatasetFingerprint = (dataset) => {
  const canonicalStr = canonicalizeJSON(dataset);
  return crypto.createHash('sha256').update(canonicalStr).digest('hex');
};

/**
 * Computes SHA-256 fingerprint of structured simulation metadata.
 *
 * @param {Object} metadata
 * @returns {string} SHA-256 hex string
 */
const generateSimulationFingerprint = (metadata) => {
  const canonicalStr = canonicalizeJSON(metadata);
  return crypto.createHash('sha256').update(canonicalStr).digest('hex');
};

module.exports = {
  canonicalizeJSON,
  generatePolicyFingerprint,
  generateDatasetFingerprint,
  generateSimulationFingerprint,
};
