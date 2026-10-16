#!/usr/bin/env node
'use strict';

/**
 * Phase 12: Prescriptive Policy Versioning & Governance (PPVG) CLI
 *
 * Implements administrative CLI interface for orchestration policy governance:
 *   - seed-baseline
 *   - promote
 *   - activate
 *   - rollback
 *   - list
 *   - show
 *
 * Enforces host-level trust boundary via POLICY_GOVERNANCE_SECRET and --confirm fallback.
 * Sole authorized script caller; never imports OrchestrationPolicyVersion directly.
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') });

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const mongoose = require('mongoose');

const policyGovernanceService = require('../src/services/governance/policyGovernanceService');

/**
 * Parses command-line arguments into command and options.
 */
const parseCliArgs = (argv) => {
  const args = {};
  let command = null;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (!command && !arg.startsWith('--')) {
      command = arg;
      continue;
    }

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
          args[key] = true;
        }
      }
    }
  }

  return { command, args };
};

/**
 * Verifies host-level trust gate covering all six commands.
 */
const verifyCliTrustGate = (args) => {
  const isProdOrStaging = ['production', 'staging'].includes(process.env.NODE_ENV);
  const secretEnv = process.env.POLICY_GOVERNANCE_SECRET;

  if (isProdOrStaging && (!secretEnv || secretEnv.length === 0)) {
    console.error('Error: POLICY_GOVERNANCE_SECRET is strictly required in production and staging environments.');
    return false;
  }

  if (secretEnv && secretEnv.length > 0) {
    if (!args.secret) {
      console.error('Error: --secret <val> is required when POLICY_GOVERNANCE_SECRET is set.');
      return false;
    }
    const secretBuffer = Buffer.from(String(args.secret));
    const envBuffer = Buffer.from(String(secretEnv));
    if (
      secretBuffer.length !== envBuffer.length ||
      !crypto.timingSafeEqual(secretBuffer, envBuffer)
    ) {
      console.error('Error: Invalid governance secret.');
      return false;
    }
  } else {
    if (!args.confirm) {
      console.error('Error: --confirm is required when POLICY_GOVERNANCE_SECRET is not configured.');
      return false;
    }
    console.warn(
      JSON.stringify({
        warning: 'GOVERNANCE_SECRET_NOT_CONFIGURED',
        message: 'Administrative CLI executed without POLICY_GOVERNANCE_SECRET configured.',
      })
    );
  }
  return true;
};

/**
 * Connects to MongoDB if not already connected.
 */
const ensureDbConnection = async () => {
  if (mongoose.connection.readyState === 1) {
    return false;
  }
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI environment variable is required.');
  }
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 });
  return true;
};

/**
 * Executes a CLI invocation and returns structured execution result.
 */
const runCli = async (argv, options = {}) => {
  const referenceNow = options.referenceNow || new Date();
  const { command, args } = parseCliArgs(argv);

  const KNOWN_COMMANDS = ['seed-baseline', 'promote', 'activate', 'rollback', 'list', 'show'];
  if (!command || !KNOWN_COMMANDS.includes(command)) {
    return {
      exitCode: 1,
      error: `Unknown or missing command. Allowed commands: ${KNOWN_COMMANDS.join(', ')}`,
    };
  }

  // 1. Enforce Trust Gate across all six commands
  const trustPassed = verifyCliTrustGate(args);
  if (!trustPassed) {
    return {
      exitCode: 1,
      error: 'Trust gate verification failed.',
    };
  }

  let openedConnection = false;
  try {
    openedConnection = await ensureDbConnection();

    switch (command) {
      case 'seed-baseline': {
        const operatorId = args.operatorId;
        if (!operatorId) {
          return { exitCode: 1, error: '--operatorId is required for seed-baseline.' };
        }
        const result = await policyGovernanceService.seedBaseline({
          operatorId,
          referenceNow,
        });
        return { exitCode: 0, data: result };
      }

      case 'promote': {
        const { policyDefinition, policyVersion, evidenceReport, operatorId, notes } = args;
        if (!policyDefinition) {
          return { exitCode: 1, error: '--policyDefinition <path> is required for promote.' };
        }
        if (!policyVersion) {
          return { exitCode: 1, error: '--policyVersion <vX.Y.Z> is required for promote.' };
        }
        if (!evidenceReport) {
          return { exitCode: 1, error: '--evidenceReport <path> is required for promote.' };
        }
        if (!operatorId) {
          return { exitCode: 1, error: '--operatorId is required for promote.' };
        }

        let parsedDefinition;
        try {
          const rawDef = fs.readFileSync(path.resolve(policyDefinition), 'utf8');
          parsedDefinition = JSON.parse(rawDef);
        } catch (err) {
          return { exitCode: 1, error: `Failed to read or parse policyDefinition file: ${err.message}` };
        }

        const result = await policyGovernanceService.promotePolicy({
          candidatePolicyDefinition: parsedDefinition,
          policyVersion,
          evidenceReportPath: evidenceReport,
          operatorId,
          notes: notes || '',
          referenceNow,
        });
        return { exitCode: 0, data: result };
      }

      case 'activate': {
        const { policyVersion, operatorId, reason } = args;
        if (!policyVersion) {
          return { exitCode: 1, error: '--policyVersion is required for activate.' };
        }
        if (!operatorId) {
          return { exitCode: 1, error: '--operatorId is required for activate.' };
        }

        const result = await policyGovernanceService.activatePolicy({
          targetVersion: policyVersion,
          operatorId,
          reason, // optional
          referenceNow,
        });
        return { exitCode: 0, data: result };
      }

      case 'rollback': {
        const { policyVersion, operatorId, reason } = args;
        if (!policyVersion) {
          return { exitCode: 1, error: '--policyVersion is required for rollback.' };
        }
        if (!operatorId) {
          return { exitCode: 1, error: '--operatorId is required for rollback.' };
        }

        const result = await policyGovernanceService.rollbackPolicy({
          targetVersion: policyVersion,
          operatorId,
          reason, // optional
          referenceNow,
        });
        return { exitCode: 0, data: result };
      }

      case 'list': {
        const { limit, status } = args;
        const result = await policyGovernanceService.listVersions({
          limit,
          status,
        });
        return { exitCode: 0, data: result };
      }

      case 'show': {
        const { policyVersion } = args;
        if (!policyVersion) {
          return { exitCode: 1, error: '--policyVersion is required for show.' };
        }
        const result = await policyGovernanceService.showPolicy({
          policyVersion,
        });
        return { exitCode: 0, data: result };
      }

      default:
        return { exitCode: 1, error: `Unhandled command "${command}".` };
    }
  } catch (err) {
    return {
      exitCode: 1,
      error: err.message,
      code: err.code,
      statusCode: err.statusCode,
    };
  } finally {
    if (openedConnection) {
      await mongoose.disconnect();
    }
  }
};

/**
 * Main script entry point.
 */
const main = async () => {
  const result = await runCli(process.argv.slice(2));
  if (result.exitCode === 0) {
    console.log(JSON.stringify(result.data, null, 2));
    process.exit(0);
  } else {
    console.error(JSON.stringify({ error: result.error, code: result.code }));
    process.exit(result.exitCode);
  }
};

if (require.main === module) {
  main();
}

module.exports = {
  runCli,
  parseCliArgs,
  verifyCliTrustGate,
};
