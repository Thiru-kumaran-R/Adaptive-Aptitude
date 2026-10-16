'use strict';

/**
 * User Model — Phase 14: Security, Identity & Platform Protection
 *
 * Represents the student identity and profile record.
 *
 * userId is the application-level student identifier (String) used consistently
 * across ALL student-owned collections.
 */

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: [true, 'userId is required'],
      unique: true,
      trim: true,
      validate: {
        validator: (v) => typeof v === 'string' && v.trim().length > 0,
        message: 'userId cannot be empty',
      },
    },

    name: {
      type: String,
      required: [true, 'name is required'],
      trim: true,
      validate: {
        validator: (v) => typeof v === 'string' && v.trim().length > 0,
        message: 'name cannot be empty',
      },
    },

    email: {
      type: String,
      required: false,
      trim: true,
      lowercase: true,
    },

    avatar: {
      type: String,
      required: false,
    },

    passwordHash: {
      type: String,
      required: false,
      select: false,
    },

    status: {
      type: String,
      enum: ['active', 'disabled'],
      default: 'active',
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// ── Indexes ────────────────────────────────────────────────────────────────
// User-model-local autoIndex suppression preventing automatic index creation
userSchema.set('autoIndex', false);

// Canonical email schema index declaration
userSchema.index(
  { email: 1 },
  {
    unique: true,
    partialFilterExpression: {
      email: {
        $exists: true,
        $type: 'string',
        $gt: '',
      },
    },
  }
);

const User = mongoose.model('User', userSchema);

module.exports = User;
