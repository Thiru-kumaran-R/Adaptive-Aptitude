'use strict';

require('dotenv').config();

const mongoose = require('mongoose');
const database = require('../src/config/database');

const SCRYPT_HASH_REGEX = /^\$scrypt\$v=1\$N=\d+,r=\d+,p=\d+\$[0-9a-fA-F]+\$[0-9a-fA-F]+$/;

async function checkAuthMigrationReadiness(options = {}) {
  const shouldDisconnect = options.disconnect ?? false;
  let exitCode = 0;

  if (mongoose.connection.readyState !== 1) {
    await database.connectDB();
  }

  const usersCollection = mongoose.connection.db.collection('users');
  const allUsers = await usersCollection.find({}).toArray();

  const totalUsers = allUsers.length;
  let usersMissingEmail = 0;
  let usersBlankEmail = 0;
  let usersWithNonCanonicalEmail = 0;
  let usersMissingPasswordHash = 0;
  let usersWithMalformedPasswordHash = 0;
  let invalidAccountStatus = 0;
  let legacyUserIdIntegrityFailures = 0;
  let usersNotAuthEligible = 0;

  const canonicalEmailCounts = new Map();

  for (const user of allUsers) {
    const rawEmail = user.email;
    const hasEmail = rawEmail !== undefined && rawEmail !== null;
    const isBlank = hasEmail && (typeof rawEmail !== 'string' || rawEmail.trim().length === 0);

    if (!hasEmail) {
      usersMissingEmail++;
    } else if (isBlank) {
      usersBlankEmail++;
    } else if (typeof rawEmail === 'string') {
      const canonical = rawEmail.trim().toLowerCase();
      if (rawEmail !== canonical) {
        usersWithNonCanonicalEmail++;
      }
      canonicalEmailCounts.set(canonical, (canonicalEmailCounts.get(canonical) || 0) + 1);
    }

    const rawHash = user.passwordHash;
    const hasHash = rawHash !== undefined && rawHash !== null && typeof rawHash === 'string' && rawHash.length > 0;

    if (!hasHash) {
      usersMissingPasswordHash++;
    } else if (!SCRYPT_HASH_REGEX.test(rawHash)) {
      usersWithMalformedPasswordHash++;
    }

    if (user.status !== undefined && user.status !== null && !['active', 'disabled'].includes(user.status)) {
      invalidAccountStatus++;
    }

    if (!user.userId || typeof user.userId !== 'string' || user.userId.trim().length === 0) {
      legacyUserIdIntegrityFailures++;
    }

    const isAuthEligible = hasEmail && !isBlank && hasHash && SCRYPT_HASH_REGEX.test(rawHash) && user.status !== 'disabled';
    if (!isAuthEligible) {
      usersNotAuthEligible++;
    }
  }

  let duplicateCanonicalEmails = 0;
  for (const count of canonicalEmailCounts.values()) {
    if (count > 1) {
      duplicateCanonicalEmails += count;
    }
  }

  const indexSafetyPass = duplicateCanonicalEmails === 0 && usersWithNonCanonicalEmail === 0;
  exitCode = indexSafetyPass ? 0 : 1;

  const results = {
    totalUsers,
    usersMissingEmail,
    usersBlankEmail,
    duplicateCanonicalEmails,
    usersWithNonCanonicalEmail,
    usersMissingPasswordHash,
    usersWithMalformedPasswordHash,
    invalidAccountStatus,
    legacyUserIdIntegrityFailures,
    usersNotAuthEligible,
    indexSafetyPass,
    exitCode
  };

  if (!options.silent) {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('  PHASE 14 AUTH MIGRATION READINESS AUDIT (READ-ONLY)');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`Total users scanned:                  ${totalUsers}`);
    console.log(`Users missing email:                  ${usersMissingEmail}`);
    console.log(`Users with blank email:               ${usersBlankEmail}`);
    console.log(`Duplicate canonical emails:           ${duplicateCanonicalEmails}`);
    console.log(`Users with non-canonical email:       ${usersWithNonCanonicalEmail}`);
    console.log(`Users missing passwordHash:           ${usersMissingPasswordHash}`);
    console.log(`Users with malformed passwordHash:    ${usersWithMalformedPasswordHash}`);
    console.log(`Invalid account statuses:             ${invalidAccountStatus}`);
    console.log(`Legacy userId integrity failures:     ${legacyUserIdIntegrityFailures}`);
    console.log(`Users not authentication eligible:    ${usersNotAuthEligible}`);
    console.log('───────────────────────────────────────────────────────────');
    if (indexSafetyPass) {
      console.log('INDEX SAFETY: PASS (Email unique index may be safely created)');
    } else {
      console.log('INDEX SAFETY: BLOCKER DETECTED (Resolve non-canonical/duplicate emails first)');
    }
    console.log('═══════════════════════════════════════════════════════════');
  }

  if (shouldDisconnect && mongoose.connection.readyState === 1) {
    await database.disconnectDB();
  }

  return results;
}

if (require.main === module) {
  checkAuthMigrationReadiness({ shouldDisconnect: true })
    .then((results) => {
      process.exit(results.exitCode);
    })
    .catch((err) => {
      console.error('Migration readiness audit failed:', err);
      process.exit(1);
    });
}

module.exports = {
  checkAuthMigrationReadiness
};
