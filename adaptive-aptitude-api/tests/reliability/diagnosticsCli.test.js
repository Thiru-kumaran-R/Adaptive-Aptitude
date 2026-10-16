'use strict';

const mongoose = require('mongoose');
const { runDiagnostics, EXPECTED_COLLECTIONS } = require('../../scripts/diagnoseSystem');
const policyGovernanceService = require('../../src/services/governance/policyGovernanceService');
const database = require('../../src/config/database');

describe('Phase 13 Operator Diagnostic CLI Verification', () => {
  let origReadyState;
  let origDb;

  beforeEach(() => {
    origReadyState = mongoose.connection.readyState;
    origDb = mongoose.connection.db;

    Object.defineProperty(mongoose.connection, 'readyState', {
      value: 1,
      writable: true,
      configurable: true
    });

    jest.spyOn(database, 'connectDB').mockResolvedValue();
    jest.spyOn(database, 'disconnectDB').mockResolvedValue();
  });

  afterEach(() => {
    mongoose.connection.db = origDb;
    Object.defineProperty(mongoose.connection, 'readyState', {
      value: origReadyState,
      writable: true,
      configurable: true
    });
    jest.restoreAllMocks();
  });

  it('runs successfully and reports HEALTHY (exit 0) when all 5 operations and 16 collections pass', async () => {
    const adminCommandMock = jest.fn().mockResolvedValue({
      setName: 'rs0',
      isWritablePrimary: true
    });
    const adminPingMock = jest.fn().mockResolvedValue({ ok: 1 });

    const listCollectionsMock = jest.fn().mockReturnValue({
      toArray: jest.fn().mockResolvedValue(EXPECTED_COLLECTIONS.map((name) => ({ name })))
    });

    const indexesMock = jest.fn().mockResolvedValue([
      { key: { _id: 1 }, unique: false },
      { key: { policyVersion: 1 }, unique: true },
      { key: { policyFingerprint: 1 }, unique: true },
      { key: { status: 1 }, unique: true, partialFilterExpression: { status: 'active' } }
    ]);
    const countDocumentsMock = jest.fn().mockResolvedValue(1);

    const collectionMock = jest.fn((name) => {
      if (name === 'orchestrationpolicyversions') {
        return {
          indexes: indexesMock,
          countDocuments: countDocumentsMock
        };
      }
      return {};
    });

    mongoose.connection.db = {
      admin: () => ({ command: adminCommandMock, ping: adminPingMock }),
      listCollections: listCollectionsMock,
      collection: collectionMock
    };

    const snapshotSpy = jest.spyOn(policyGovernanceService, 'resolveActivePolicySnapshot').mockResolvedValue({
      policyVersion: 'v1.0.0',
      source: 'CODE_BASELINE'
    });
    const listVersionsSpy = jest.spyOn(policyGovernanceService, 'listVersions').mockResolvedValue([
      { policyVersion: 'v1.0.0', status: 'active' }
    ]);
    const showPolicySpy = jest.spyOn(policyGovernanceService, 'showPolicy').mockResolvedValue({
      policyVersion: 'v1.0.0',
      status: 'active'
    });

    const { report, exitCode } = await runDiagnostics({ json: true });

    expect(exitCode).toBe(0);
    expect(report.status).toBe('HEALTHY');
    expect(report.database.connected).toBe(true);
    expect(report.database.topology.type).toBe('REPLICA_SET');
    expect(report.collections.expected).toBe(16);
    expect(report.collections.missing).toEqual([]);
    expect(report.collections.unexpectedApplicationCollections).toEqual([]);
    expect(report.policyGovernance.activeVersion).toBe('v1.0.0');
    expect(report.policyGovernance.source).toBe('CODE_BASELINE');
    expect(report.policyGovernance.topologyValid).toBe(true);
    expect(report.policyGovernance.indexesMissing).toEqual([]);

    expect(snapshotSpy).toHaveBeenCalledWith(expect.any(Date));
    expect(listVersionsSpy).toHaveBeenCalledWith({ limit: 10, status: 'active' });
    expect(showPolicySpy).toHaveBeenCalledWith({ policyVersion: 'v1.0.0' });
    expect(indexesMock).toHaveBeenCalled();
    expect(countDocumentsMock).toHaveBeenCalledWith({ status: 'active' });
  });

  it('fails with UNHEALTHY and exit 1 if an expected collection is missing', async () => {
    const listCollectionsMock = jest.fn().mockReturnValue({
      toArray: jest.fn().mockResolvedValue(
        EXPECTED_COLLECTIONS.filter((c) => c !== 'questions').map((name) => ({ name }))
      )
    });

    mongoose.connection.db = {
      admin: () => ({ command: jest.fn().mockResolvedValue({}), ping: jest.fn().mockResolvedValue({}) }),
      listCollections: listCollectionsMock,
      collection: () => ({ indexes: jest.fn().mockResolvedValue([]), countDocuments: jest.fn().mockResolvedValue(1) })
    };
    jest.spyOn(policyGovernanceService, 'resolveActivePolicySnapshot').mockResolvedValue({
      policyVersion: 'v1.0.0',
      source: 'CODE_BASELINE'
    });
    jest.spyOn(policyGovernanceService, 'listVersions').mockResolvedValue([]);
    jest.spyOn(policyGovernanceService, 'showPolicy').mockResolvedValue({});

    const { report, exitCode } = await runDiagnostics({ json: true });
    expect(exitCode).toBe(1);
    expect(report.status).toBe('UNHEALTHY');
    expect(report.collections.missing).toContain('questions');
  });

  it('fails with UNHEALTHY and exit 1 if unexpected application collection is present', async () => {
    const collectionsWithExtra = [
      ...EXPECTED_COLLECTIONS.map((name) => ({ name })),
      { name: 'unexpected_extra_collection' }
    ];

    const listCollectionsMock = jest.fn().mockReturnValue({
      toArray: jest.fn().mockResolvedValue(collectionsWithExtra)
    });

    mongoose.connection.db = {
      admin: () => ({ command: jest.fn().mockResolvedValue({}), ping: jest.fn().mockResolvedValue({}) }),
      listCollections: listCollectionsMock,
      collection: () => ({ indexes: jest.fn().mockResolvedValue([]), countDocuments: jest.fn().mockResolvedValue(1) })
    };
    jest.spyOn(policyGovernanceService, 'resolveActivePolicySnapshot').mockResolvedValue({
      policyVersion: 'v1.0.0',
      source: 'CODE_BASELINE'
    });
    jest.spyOn(policyGovernanceService, 'listVersions').mockResolvedValue([]);
    jest.spyOn(policyGovernanceService, 'showPolicy').mockResolvedValue({});

    const { report, exitCode } = await runDiagnostics({ json: true });
    expect(exitCode).toBe(1);
    expect(report.status).toBe('UNHEALTHY');
    expect(report.collections.unexpectedApplicationCollections).toContain('unexpected_extra_collection');
  });

  it('ignores system.* collections during unexpected collection check', async () => {
    const collectionsWithSystem = [
      ...EXPECTED_COLLECTIONS.map((name) => ({ name })),
      { name: 'system.views' },
      { name: 'system.profile' }
    ];

    const listCollectionsMock = jest.fn().mockReturnValue({
      toArray: jest.fn().mockResolvedValue(collectionsWithSystem)
    });

    mongoose.connection.db = {
      admin: () => ({ command: jest.fn().mockResolvedValue({ setName: 'rs0' }), ping: jest.fn().mockResolvedValue({}) }),
      listCollections: listCollectionsMock,
      collection: () => ({
        indexes: jest.fn().mockResolvedValue([
          { key: { _id: 1 }, unique: false },
          { key: { policyVersion: 1 }, unique: true },
          { key: { policyFingerprint: 1 }, unique: true },
          { key: { status: 1 }, unique: true, partialFilterExpression: { status: 'active' } }
        ]),
        countDocuments: jest.fn().mockResolvedValue(1)
      })
    };
    jest.spyOn(policyGovernanceService, 'resolveActivePolicySnapshot').mockResolvedValue({
      policyVersion: 'v1.0.0',
      source: 'CODE_BASELINE'
    });
    jest.spyOn(policyGovernanceService, 'listVersions').mockResolvedValue([]);
    jest.spyOn(policyGovernanceService, 'showPolicy').mockResolvedValue({});

    const { report, exitCode } = await runDiagnostics({ json: true });
    expect(report.collections.unexpectedApplicationCollections).toEqual([]);
    expect(exitCode).toBe(0);
  });

  it('fails with UNHEALTHY and exit 1 if active policy count is not 1', async () => {
    mongoose.connection.db = {
      admin: () => ({ command: jest.fn().mockResolvedValue({}), ping: jest.fn().mockResolvedValue({}) }),
      listCollections: jest.fn().mockReturnValue({
        toArray: jest.fn().mockResolvedValue(EXPECTED_COLLECTIONS.map((name) => ({ name })))
      }),
      collection: () => ({
        indexes: jest.fn().mockResolvedValue([]),
        countDocuments: jest.fn().mockResolvedValue(2) // Invalid: multiple active
      })
    };
    jest.spyOn(policyGovernanceService, 'resolveActivePolicySnapshot').mockResolvedValue({
      policyVersion: 'v1.0.0',
      source: 'CODE_BASELINE'
    });
    jest.spyOn(policyGovernanceService, 'listVersions').mockResolvedValue([]);
    jest.spyOn(policyGovernanceService, 'showPolicy').mockResolvedValue({});

    const { report, exitCode } = await runDiagnostics({ json: true });
    expect(exitCode).toBe(1);
    expect(report.status).toBe('UNHEALTHY');
    expect(report.policyGovernance.topologyValid).toBe(false);
  });

  it('fails with UNHEALTHY and exit 1 if required policy indexes are missing', async () => {
    mongoose.connection.db = {
      admin: () => ({ command: jest.fn().mockResolvedValue({}), ping: jest.fn().mockResolvedValue({}) }),
      listCollections: jest.fn().mockReturnValue({
        toArray: jest.fn().mockResolvedValue(EXPECTED_COLLECTIONS.map((name) => ({ name })))
      }),
      collection: () => ({
        indexes: jest.fn().mockResolvedValue([
          { key: { _id: 1 }, unique: false }
          // Missing policyVersion, policyFingerprint, status indexes
        ]),
        countDocuments: jest.fn().mockResolvedValue(1)
      })
    };
    jest.spyOn(policyGovernanceService, 'resolveActivePolicySnapshot').mockResolvedValue({
      policyVersion: 'v1.0.0',
      source: 'CODE_BASELINE'
    });
    jest.spyOn(policyGovernanceService, 'listVersions').mockResolvedValue([]);
    jest.spyOn(policyGovernanceService, 'showPolicy').mockResolvedValue({});

    const { report, exitCode } = await runDiagnostics({ json: true });
    expect(exitCode).toBe(1);
    expect(report.status).toBe('UNHEALTHY');
    expect(report.policyGovernance.indexesMissing.length).toBeGreaterThan(0);
  });
});
