#!/usr/bin/env node
'use strict';

/**
 * Phase 11: Policy Simulation Offline CLI Script
 *
 * Implements offline policy simulation execution, input validation,
 * canonical artifact serialization, and byte-level artifact reuse / mismatch protection.
 */

const fs = require('node:fs');
const path = require('node:path');
const { SIMULATION_MODES } = require('../src/config/simulationConfig');
const { runPolicySimulation } = require('../src/services/simulation/policySimulationService');
const { canonicalizeJSON } = require('../src/utils/simulationFingerprint');

/**
 * Parses command-line arguments into structured options.
 *
 * @param {Array<string>} argv
 * @returns {Object}
 */
const parseCliArgs = (argv) => {
  const args = {};

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith('--')) {
      const eqIdx = arg.indexOf('=');
      if (eqIdx !== -1) {
        const key = arg.slice(2, eqIdx);
        const val = arg.slice(eqIdx + 1);
        args[key] = val;
      } else {
        const key = arg.slice(2);
        if (i + 1 < argv.length && !argv[i + 1].startsWith('--')) {
          args[key] = argv[++i];
        } else {
          args[key] = 'true';
        }
      }
    }
  }

  return args;
};

/**
 * Validates that an ISO timestamp string contains an explicit timezone offset.
 *
 * @param {string} str
 * @returns {boolean}
 */
const isOffsetAwareIsoString = (str) => {
  if (typeof str !== 'string') return false;
  // Requires T and either Z or timezone offset (+HH:MM, -HH:MM, +HHMM, -HHMM)
  const isoPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:?\d{2})$/;
  if (!isoPattern.test(str)) return false;
  const d = new Date(str);
  return !isNaN(d.getTime());
};

/**
 * Executes CLI workflow.
 *
 * @param {Array<string>} rawArgs
 * @returns {Promise<{ exitCode: number, report?: Object, reusedArtifact?: boolean, filePath?: string }>}
 */
const runCli = async (rawArgs) => {
  try {
    const args = parseCliArgs(rawArgs);

    // 1. Validate Mode
    const rawMode = args.mode;
    if (!rawMode) {
      const err = new Error('DATASET_LIMIT_EXCEEDED: MISSING_MODE - CLI argument --mode is required');
      err.code = 'DATASET_LIMIT_EXCEEDED';
      err.reason = 'MISSING_MODE';
      throw err;
    }

    const canonicalMode = SIMULATION_MODES[rawMode];
    if (!canonicalMode) {
      const err = new Error(`DATASET_LIMIT_EXCEEDED: INVALID_MODE - Invalid CLI simulation mode: ${rawMode}`);
      err.code = 'DATASET_LIMIT_EXCEEDED';
      err.reason = 'INVALID_MODE';
      throw err;
    }

    // 2. Validate referenceNow
    const rawReferenceNow = args.referenceNow;
    if (!rawReferenceNow) {
      const err = new Error('DATASET_LIMIT_EXCEEDED: MISSING_REFERENCE_NOW - --referenceNow is required');
      err.code = 'DATASET_LIMIT_EXCEEDED';
      err.reason = 'MISSING_REFERENCE_NOW';
      throw err;
    }

    if (!isOffsetAwareIsoString(rawReferenceNow)) {
      const err = new Error('DATASET_LIMIT_EXCEEDED: MISSING_REFERENCE_NOW - --referenceNow must be an offset-aware ISO-8601 string');
      err.code = 'DATASET_LIMIT_EXCEEDED';
      err.reason = 'MISSING_REFERENCE_NOW';
      throw err;
    }

    const referenceNow = new Date(rawReferenceNow);

    // 3. Parse candidate policies
    if (args.candidatePolicy && args.candidatePolicies) {
      const err = new Error('DATASET_LIMIT_EXCEEDED: TOO_MANY_CANDIDATE_POLICIES - Cannot supply both --candidatePolicy and --candidatePolicies');
      err.code = 'DATASET_LIMIT_EXCEEDED';
      err.reason = 'TOO_MANY_CANDIDATE_POLICIES';
      throw err;
    }

    let policyPaths = [];
    if (args.candidatePolicies) {
      policyPaths = args.candidatePolicies.split(',').map((p) => p.trim()).filter(Boolean);
    } else if (args.candidatePolicy) {
      policyPaths = [args.candidatePolicy.trim()];
    }

    const candidatePolicies = [];
    for (const pPath of policyPaths) {
      const resolvedPath = path.resolve(process.cwd(), pPath);
      if (!fs.existsSync(resolvedPath)) {
        const err = new Error(`DATASET_LIMIT_EXCEEDED: POLICY_FILE_NOT_FOUND - Candidate policy file not found: ${pPath}`);
        err.code = 'DATASET_LIMIT_EXCEEDED';
        err.reason = 'POLICY_FILE_NOT_FOUND';
        throw err;
      }
      const rawContent = fs.readFileSync(resolvedPath, 'utf8');
      try {
        const parsed = JSON.parse(rawContent);
        candidatePolicies.push(parsed);
      } catch (parseErr) {
        const err = new Error(`INVALID_POLICY_DEFINITION: INVALID_JSON - Failed to parse JSON in ${pPath}: ${parseErr.message}`);
        err.code = 'INVALID_POLICY_DEFINITION';
        err.reason = 'INVALID_OBJECT_SHAPE';
        throw err;
      }
    }

    // 4. Parse user IDs
    let userIds = [];
    if (args.userIds) {
      userIds = args.userIds.split(',').map((u) => u.trim()).filter(Boolean);
    } else if (args.userId) {
      userIds = [args.userId.trim()];
    }

    // 5. Parse windowDays
    let windowDays = undefined;
    if (args.windowDays) {
      const parsed = Number(args.windowDays);
      if (!Number.isInteger(parsed)) {
        const err = new Error('DATASET_LIMIT_EXCEEDED: INVALID_WINDOW_DAYS - windowDays must be an integer');
        err.code = 'DATASET_LIMIT_EXCEEDED';
        err.reason = 'INVALID_WINDOW_DAYS';
        throw err;
      }
      windowDays = parsed;
    }

    // 6. Parse includeTrace & outputDir
    const includeTrace = args.includeTrace === 'true';
    const outputDir = path.resolve(process.cwd(), args.outputDir || 'reports/simulations');

    // 7. Execute Simulation
    const report = await runPolicySimulation({
      mode: canonicalMode,
      candidatePolicies,
      userIds,
      windowDays,
      referenceNow,
      includeTrace,
    });

    // 8. Canonical Report Serialization
    const artifactBytes = canonicalizeJSON(report) + '\n';
    const artifactFilename = `sim_${report.simulationFingerprint}.json`;
    const targetFilePath = path.join(outputDir, artifactFilename);

    fs.mkdirSync(outputDir, { recursive: true });

    let reusedArtifact = false;
    if (fs.existsSync(targetFilePath)) {
      const existingBytes = fs.readFileSync(targetFilePath, 'utf8');
      if (existingBytes === artifactBytes) {
        reusedArtifact = true;
      } else {
        const err = new Error('SIMULATION_EXECUTION_FAILED: FINGERPRINT_CONTENT_MISMATCH - Target file exists with different content');
        err.code = 'SIMULATION_EXECUTION_FAILED';
        err.reason = 'FINGERPRINT_CONTENT_MISMATCH';
        err.reasonCode = 'FINGERPRINT_CONTENT_MISMATCH';
        throw err;
      }
    } else {
      fs.writeFileSync(targetFilePath, artifactBytes, 'utf8');
    }

    return {
      exitCode: 0,
      report,
      reusedArtifact,
      filePath: targetFilePath,
    };
  } catch (err) {
    let exitCode = 3;
    if (
      err.code === 'INVALID_POLICY_DEFINITION' ||
      err.code === 'DATASET_LIMIT_EXCEEDED'
    ) {
      exitCode = 1;
    } else if (err.code === 'INSUFFICIENT_HISTORICAL_DATA') {
      exitCode = 2;
    } else if (err.code === 'SIMULATION_EXECUTION_FAILED') {
      exitCode = 3;
    }

    return {
      exitCode,
      error: err,
    };
  }
};

/**
 * Main executable entry point.
 */
const main = async () => {
  const result = await runCli(process.argv.slice(2));
  if (result.exitCode === 0) {
    console.log(
      JSON.stringify({
        success: true,
        simulationFingerprint: result.report.simulationFingerprint,
        reusedArtifact: result.reusedArtifact,
        filePath: result.filePath,
      })
    );
    process.exit(0);
  } else {
    console.error(
      JSON.stringify({
        success: false,
        exitCode: result.exitCode,
        error: result.error ? result.error.message : 'Unknown error',
        code: result.error ? result.error.code : undefined,
        reason: result.error ? result.error.reason : undefined,
      })
    );
    process.exit(result.exitCode);
  }
};

if (require.main === module) {
  main();
}

module.exports = {
  runCli,
  parseCliArgs,
  isOffsetAwareIsoString,
};
