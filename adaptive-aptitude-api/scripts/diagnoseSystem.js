'use strict';

require('dotenv').config();

const mongoose = require('mongoose');
const { performance } = require('node:perf_hooks');
const database = require('../src/config/database');
const policyGovernanceService = require('../src/services/governance/policyGovernanceService');

const EXPECTED_COLLECTIONS = [
  'questions',
  'users',
  'goals',
  'studyplans',
  'dailyobjectives',
  'attempts',
  'studentprogresses',
  'revisionitems',
  'revisionprocessingrecords',
  'mockblueprints',
  'mocksessions',
  'mockresponses',
  'mockattemptfinalizationrecords',
  'prescriptionexecutionrecords',
  'orchestrationpolicyversions',
  'authsessions'
];

const EXPECTED_POLICY_INDEXES = [
  { key: { _id: 1 }, unique: false },
  { key: { policyVersion: 1 }, unique: true },
  { key: { policyFingerprint: 1 }, unique: true },
  { key: { status: 1 }, unique: true, partialFilterExpression: { status: 'active' } }
];

const runDiagnostics = async (options = {}) => {
  const isJson = options.json ?? process.argv.includes('--json');
  let exitCode = 0;
  const warnings = [];

  let databaseHealthy = false;
  let pingMs = 0;
  let topologyType = 'UNKNOWN';
  let transactionsSupported = false;
  let setName = null;

  let collectionsHealthy = false;
  let presentCollectionsCount = 0;
  let missingCollections = [];
  let unexpectedAppCollections = [];

  let activeVersion = null;
  let policySource = null;
  let topologyValid = false;
  let activeCount = 0;
  let indexesPresent = [];
  let indexesMissing = [];

  try {
    // 1. Database Connection & Reachability
    await database.connectDB();
    databaseHealthy = (mongoose.connection.readyState === 1);

    // 2. Topology Inspection
    const hello = await mongoose.connection.db.admin().command({ hello: 1 });
    if (hello.setName) {
      topologyType = 'REPLICA_SET';
      setName = hello.setName;
    } else if (hello.msg === 'isdbgrid') {
      topologyType = 'MONGOS';
    } else if (hello.isWritablePrimary !== undefined || hello.ismaster) {
      topologyType = 'STANDALONE';
    }
    transactionsSupported = (topologyType === 'REPLICA_SET' || topologyType === 'MONGOS');

    // 3. Dual/Active Ping
    const pingStart = performance.now();
    await mongoose.connection.db.admin().ping({ maxTimeMS: 2000 });
    pingMs = Math.round(performance.now() - pingStart);

    // 4. Collection Verification
    const existingCollections = await mongoose.connection.db.listCollections().toArray();
    presentCollectionsCount = existingCollections.length;
    const existingNames = new Set(existingCollections.map((c) => c.name));

    missingCollections = EXPECTED_COLLECTIONS.filter((name) => !existingNames.has(name));
    unexpectedAppCollections = existingCollections
      .map((c) => c.name)
      .filter((name) => !EXPECTED_COLLECTIONS.includes(name) && !name.startsWith('system.'));

    collectionsHealthy = (missingCollections.length === 0 && unexpectedAppCollections.length === 0);

    // 5. Phase 12 Governance Diagnostic Operations (Read-Only)
    const referenceNow = new Date();
    const snapshot = await policyGovernanceService.resolveActivePolicySnapshot(referenceNow);
    activeVersion = snapshot.policyVersion;
    policySource = snapshot.source;

    // Operation 2: listVersions
    await policyGovernanceService.listVersions({
      limit: 10,
      status: 'active'
    });

    // Operation 3: showPolicy
    await policyGovernanceService.showPolicy({
      policyVersion: snapshot.policyVersion
    });

    // Operation 4: Physical MongoDB Index Inspection
    const physicalIndexes = await mongoose.connection.db
      .collection('orchestrationpolicyversions')
      .indexes();

    for (const expected of EXPECTED_POLICY_INDEXES) {
      const match = physicalIndexes.find((idx) => {
        const expectedKeys = Object.keys(expected.key);
        const actualKeys = Object.keys(idx.key || {});
        if (expectedKeys.length !== actualKeys.length) return false;
        if (!expectedKeys.every((k) => idx.key[k] === expected.key[k])) return false;
        if (expected.unique && !idx.unique) return false;
        if (expected.partialFilterExpression) {
          if (!idx.partialFilterExpression) return false;
          for (const pk of Object.keys(expected.partialFilterExpression)) {
            if (idx.partialFilterExpression[pk] !== expected.partialFilterExpression[pk]) return false;
          }
        }
        return true;
      });

      const desc = `${JSON.stringify(expected.key)}${expected.unique ? ' [unique]' : ''}${expected.partialFilterExpression ? ` [partialFilter: ${JSON.stringify(expected.partialFilterExpression)}]` : ''}`;
      if (match) {
        indexesPresent.push(desc);
      } else {
        indexesMissing.push(desc);
      }
    }

    const indexesHealthy = (indexesMissing.length === 0);

    // Operation 5: Active Count
    activeCount = await mongoose.connection.db
      .collection('orchestrationpolicyversions')
      .countDocuments({ status: 'active' });

    topologyValid = (activeCount === 1);

    const overallHealthy =
      databaseHealthy &&
      collectionsHealthy &&
      indexesHealthy &&
      topologyValid;

    const status = overallHealthy ? 'HEALTHY' : 'UNHEALTHY';
    if (!overallHealthy) {
      exitCode = 1;
    }

    const report = {
      status,
      database: {
        connected: databaseHealthy,
        pingMs,
        topology: {
          type: topologyType,
          transactionsSupported,
          ...(setName ? { setName } : {})
        }
      },
      collections: {
        expected: EXPECTED_COLLECTIONS.length,
        present: presentCollectionsCount,
        missing: missingCollections,
        unexpectedApplicationCollections: unexpectedAppCollections
      },
      policyGovernance: {
        activeVersion,
        source: policySource,
        topologyValid,
        activeCount,
        indexesPresent,
        indexesMissing
      },
      warnings
    };

    if (isJson) {
      console.log(JSON.stringify(report, null, 2));
    } else {
      console.log('================================================================================');
      console.log('OPERATOR SYSTEM DIAGNOSTIC REPORT');
      console.log('================================================================================');
      console.log(`System Status: ${report.status}`);
      console.log(`Database Connected: ${report.database.connected} (Ping: ${report.database.pingMs}ms)`);
      console.log(`Database Topology: ${report.database.topology.type} (Transactions: ${report.database.topology.transactionsSupported})`);
      console.log(`Collections: ${report.collections.present} / ${report.collections.expected} expected (Missing: ${report.collections.missing.length}, Unexpected: ${report.collections.unexpectedApplicationCollections.length})`);
      console.log(`Governance Active Version: ${report.policyGovernance.activeVersion} (${report.policyGovernance.source})`);
      console.log(`Governance Active Count: ${report.policyGovernance.activeCount} (Valid Topology: ${report.policyGovernance.topologyValid})`);
      console.log(`Policy Indexes Healthy: ${report.policyGovernance.indexesMissing.length === 0}`);
      console.log('================================================================================');
    }

    return { report, exitCode };
  } catch (err) {
    exitCode = 1;
    const errorReport = {
      status: 'UNHEALTHY',
      error: err.message,
      stack: err.stack,
      warnings
    };
    if (isJson) {
      console.log(JSON.stringify(errorReport, null, 2));
    } else {
      console.error('[Diagnostic Failure]:', err.message);
    }
    return { report: errorReport, exitCode };
  } finally {
    try {
      await database.disconnectDB();
    } catch (_err) {}
  }
};

if (require.main === module) {
  runDiagnostics().then(({ exitCode }) => {
    process.exit(exitCode);
  });
}

module.exports = {
  runDiagnostics,
  EXPECTED_COLLECTIONS,
  EXPECTED_POLICY_INDEXES
};
