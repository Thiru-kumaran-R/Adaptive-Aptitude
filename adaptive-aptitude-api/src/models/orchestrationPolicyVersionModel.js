'use strict';

/**
 * OrchestrationPolicyVersion Model — Phase 12: Prescriptive Policy Versioning & Governance (PPVG)
 *
 * Implements authoritative orchestration policy versioning, Strategy B offline simulation
 * evidence linkage, single-active runtime governance, immutable schema fields,
 * append-only lifecycle ledger, and multi-layer write/delete bypass protection.
 */

const mongoose = require('mongoose');

const lifecycleEventSchema = new mongoose.Schema(
  {
    eventType: {
      type: String,
      required: true,
      enum: ['PROMOTED', 'ACTIVATED', 'SUPERSEDED', 'ROLLBACK_ORIGIN', 'ROLLBACK_TARGET'],
    },
    eventAt: {
      type: Date,
      required: true,
    },
    operatorId: {
      type: String,
      required: true,
      trim: true,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    fromPolicyVersion: {
      type: String,
      default: null,
    },
    toPolicyVersion: {
      type: String,
      default: null,
    },
    evidenceSimulationFingerprint: {
      type: String,
      default: null,
    },
    evidenceArtifactSha256: {
      type: String,
      default: null,
    },
  },
  { _id: true, timestamps: false }
);

function createImmutableSetter(field) {
  return function (val) {
    if (!this.isNew && this.get && this.get(field) !== undefined && this.get(field) !== val) {
      this.markModified(field);
      if (!this.$locals) this.$locals = {};
      if (!this.$locals._attemptedImmutableMod) this.$locals._attemptedImmutableMod = {};
      this.$locals._attemptedImmutableMod[field] = val;
    }
    return val;
  };
}

const orchestrationPolicyVersionSchema = new mongoose.Schema(
  {
    policyVersion: {
      type: String,
      required: true,
      trim: true,
      match: /^v\d+\.\d+\.\d+$/,
      immutable: true,
      set: createImmutableSetter('policyVersion'),
    },
    policyFingerprint: {
      type: String,
      required: true,
      trim: true,
      match: /^[a-f0-9]{64}$/,
      immutable: true,
      set: createImmutableSetter('policyFingerprint'),
    },
    status: {
      type: String,
      required: true,
      enum: ['promoted', 'active', 'superseded', 'rolled_back'],
      default: 'promoted',
    },
    policyDefinition: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
      immutable: true,
      set: createImmutableSetter('policyDefinition'),
    },
    promotedBy: {
      type: String,
      required: true,
      trim: true,
      immutable: true,
      set: createImmutableSetter('promotedBy'),
    },
    promotedAt: {
      type: Date,
      required: true,
      immutable: true,
      set: createImmutableSetter('promotedAt'),
    },
    evidenceSimulationFingerprint: {
      type: String,
      default: null,
      trim: true,
      match: /^[a-f0-9]{64}$/,
      immutable: true,
      set: createImmutableSetter('evidenceSimulationFingerprint'),
    },
    evidenceArtifactSha256: {
      type: String,
      default: null,
      trim: true,
      match: /^[a-f0-9]{64}$/,
      immutable: true,
      set: createImmutableSetter('evidenceArtifactSha256'),
    },
    notes: {
      type: String,
      default: '',
      trim: true,
      immutable: true,
      set: createImmutableSetter('notes'),
    },
    isBaseline: {
      type: Boolean,
      required: true,
      default: false,
      immutable: true,
      set: createImmutableSetter('isBaseline'),
    },
    lifecycleEvents: {
      type: [lifecycleEventSchema],
      default: [],
    },
  },
  {
    collection: 'orchestrationpolicyversions',
    timestamps: true,
  }
);

// ── Conditional Evidence Hash Validation ──────────────────────────────────
orchestrationPolicyVersionSchema.pre('validate', function (next) {
  if (this.isBaseline === true) {
    if (this.evidenceSimulationFingerprint !== null || this.evidenceArtifactSha256 !== null) {
      return next(new Error('Baseline policy documents must have null evidence hashes.'));
    }
  } else if (this.isBaseline === false) {
    const shaRegex = /^[a-f0-9]{64}$/;
    if (!this.evidenceSimulationFingerprint || !shaRegex.test(this.evidenceSimulationFingerprint)) {
      return next(new Error('Promoted policies require valid 64-char lowercase hex evidenceSimulationFingerprint.'));
    }
    if (!this.evidenceArtifactSha256 || !shaRegex.test(this.evidenceArtifactSha256)) {
      return next(new Error('Promoted policies require valid 64-char lowercase hex evidenceArtifactSha256.'));
    }
  }
  return next();
});

// ── Lifecycle Snapshot Management Protocol ($locals) ──────────────────────
function captureLifecycleSnapshot(doc) {
  if (!doc.$locals) doc.$locals = {};
  doc.$locals.originalLifecycleEvents = JSON.parse(JSON.stringify(doc.lifecycleEvents || []));
}

orchestrationPolicyVersionSchema.post('init', function () {
  captureLifecycleSnapshot(this);
});

orchestrationPolicyVersionSchema.post('save', function () {
  captureLifecycleSnapshot(this);
});

// ── Pre-Save Invariant Checks: 9 Immutable Fields & Append-Only Ledger ────
orchestrationPolicyVersionSchema.pre('save', function (next) {
  if (this.isNew) {
    return next();
  }

  // 1. Immutable fields check
  const IMMUTABLE_FIELDS = [
    'policyVersion',
    'policyFingerprint',
    'policyDefinition',
    'promotedBy',
    'promotedAt',
    'evidenceSimulationFingerprint',
    'evidenceArtifactSha256',
    'isBaseline',
    'notes',
  ];

  for (const field of IMMUTABLE_FIELDS) {
    if (
      this.isModified(field) ||
      (this.$locals &&
        this.$locals._attemptedImmutableMod &&
        this.$locals._attemptedImmutableMod[field] !== undefined)
    ) {
      const err = new Error(`IMMUTABLE_FIELD_MUTATION: Field "${field}" is immutable and cannot be modified.`);
      err.code = 'IMMUTABLE_FIELD_MUTATION';
      return next(err);
    }
  }

  // 2. Append-only lifecycleEvents history check
  const originalEvents = this.$locals && this.$locals.originalLifecycleEvents
    ? this.$locals.originalLifecycleEvents
    : [];
  const currentEvents = this.lifecycleEvents || [];

  if (currentEvents.length < originalEvents.length) {
    const err = new Error('LIFECYCLE_MUTATION_PROHIBITED: Historical lifecycle events cannot be truncated or removed.');
    err.code = 'LIFECYCLE_MUTATION_PROHIBITED';
    return next(err);
  }

  for (let i = 0; i < originalEvents.length; i++) {
    const orig = originalEvents[i];
    const curr = currentEvents[i].toObject ? currentEvents[i].toObject() : currentEvents[i];

    if (
      orig.eventType !== curr.eventType ||
      new Date(orig.eventAt).getTime() !== new Date(curr.eventAt).getTime() ||
      orig.operatorId !== curr.operatorId ||
      orig.reason !== curr.reason ||
      orig.fromPolicyVersion !== curr.fromPolicyVersion ||
      orig.toPolicyVersion !== curr.toPolicyVersion ||
      orig.evidenceSimulationFingerprint !== curr.evidenceSimulationFingerprint ||
      orig.evidenceArtifactSha256 !== curr.evidenceArtifactSha256
    ) {
      const err = new Error(`LIFECYCLE_MUTATION_PROHIBITED: Historical lifecycle event at index ${i} cannot be modified.`);
      err.code = 'LIFECYCLE_MUTATION_PROHIBITED';
      return next(err);
    }
  }

  return next();
});

// ── Query Update Write-Bypass Protection ──────────────────────────────────
const FORBIDDEN_QUERY_UPDATE_OPS = [
  'updateOne',
  'updateMany',
  'findOneAndUpdate',
  'replaceOne',
  'findOneAndReplace',
];

FORBIDDEN_QUERY_UPDATE_OPS.forEach((op) => {
  orchestrationPolicyVersionSchema.pre(op, function (next) {
    const err = new Error(`DIRECT_QUERY_UPDATE_PROHIBITED: Generic query mutation via "${op}" is prohibited.`);
    err.code = 'DIRECT_QUERY_UPDATE_PROHIBITED';
    return next(err);
  });
});

// ── Deletion Protection (Document and Query) ──────────────────────────────
orchestrationPolicyVersionSchema.pre('deleteOne', { document: true, query: false }, function (next) {
  const err = new Error('UNAUTHORIZED_DELETION: OrchestrationPolicyVersion documents cannot be deleted.');
  err.code = 'UNAUTHORIZED_DELETION';
  return next(err);
});

const FORBIDDEN_QUERY_DELETE_OPS = ['deleteOne', 'deleteMany', 'findOneAndDelete'];
FORBIDDEN_QUERY_DELETE_OPS.forEach((op) => {
  orchestrationPolicyVersionSchema.pre(op, { document: false, query: true }, function (next) {
    const err = new Error(`UNAUTHORIZED_DELETION: Query deletion via "${op}" is prohibited.`);
    err.code = 'UNAUTHORIZED_DELETION';
    return next(err);
  });
});

// ── Bulk Write Protection ─────────────────────────────────────────────────
orchestrationPolicyVersionSchema.pre('insertMany', function (next) {
  const err = new Error('DIRECT_MODEL_WRITE_PROHIBITED: insertMany is prohibited.');
  err.code = 'DIRECT_MODEL_WRITE_PROHIBITED';
  return next(err);
});

orchestrationPolicyVersionSchema.pre('bulkWrite', function (next) {
  const err = new Error('DIRECT_MODEL_WRITE_PROHIBITED: bulkWrite is prohibited.');
  err.code = 'DIRECT_MODEL_WRITE_PROHIBITED';
  return next(err);
});

// ── Custom Schema Indexes (Exactly 3) ─────────────────────────────────────
// 1. Version uniqueness lookup
orchestrationPolicyVersionSchema.index(
  { policyVersion: 1 },
  { unique: true }
);

// 2. Fingerprint uniqueness / duplicate lookup
orchestrationPolicyVersionSchema.index(
  { policyFingerprint: 1 },
  { unique: true }
);

// 3. Single-Active Partial Unique Index
orchestrationPolicyVersionSchema.index(
  { status: 1 },
  {
    unique: true,
    partialFilterExpression: { status: 'active' },
  }
);

const OrchestrationPolicyVersion = mongoose.model(
  'OrchestrationPolicyVersion',
  orchestrationPolicyVersionSchema
);

module.exports = OrchestrationPolicyVersion;
