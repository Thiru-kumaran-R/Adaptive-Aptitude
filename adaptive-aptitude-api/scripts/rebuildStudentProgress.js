'use strict';

/**
 * scripts/rebuildStudentProgress.js
 *
 * Rebuild StudentProgress aggregates from Attempt history.
 *
 * PURPOSE:
 *   StudentProgress is an aggregate cache derived from Attempt records.
 *   If a progress update failed during attempt recording (e.g. network error,
 *   partial failure before the transaction committed), this script recomputes
 *   all progress data from the authoritative Attempt history.
 *
 * SAFETY:
 *   - Runs against MAIN database (adaptive_aptitude) by default.
 *   - Requires --confirm flag to run in write mode.
 *   - Without --confirm, runs in dry-run mode and only prints statistics.
 *   - Accepts --userId=<id> to rebuild for a single user only.
 *   - Accepts --all to rebuild for ALL users.
 *
 * USAGE:
 *   node scripts/rebuildStudentProgress.js --dry-run
 *   node scripts/rebuildStudentProgress.js --userId=student_001 --confirm
 *   node scripts/rebuildStudentProgress.js --all --confirm
 *
 * RESERVED FIELDS:
 *   mastery and highestDifficultyMastered are set to 0.
 *   They will be computed by Phase 4 mastery engine.
 *
 * STREAK FIELDS:
 *   consecutiveCorrect and consecutiveIncorrect are set to 0.
 *   Streaks cannot be accurately derived from aggregate history alone
 *   (requires processing attempts in exact chronological order per user/pattern).
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') });

const mongoose = require('mongoose');
const studentProgressService = require('../src/services/studentProgressService');
const Attempt = require('../src/models/attemptModel');

const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run') || !args.includes('--confirm');
const rebuildAll = args.includes('--all');
const userIdArg = args.find((a) => a.startsWith('--userId='));
const targetUserId = userIdArg ? userIdArg.replace('--userId=', '') : null;

if (!rebuildAll && !targetUserId) {
  console.error('Error: specify either --all or --userId=<id>');
  console.error('Usage: node scripts/rebuildStudentProgress.js --all --confirm');
  console.error('       node scripts/rebuildStudentProgress.js --userId=student_001 --confirm');
  process.exit(1);
}

const main = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI not set in .env');
    process.exit(1);
  }

  await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 });
  console.log(`Connected to database: ${mongoose.connection.name}`);

  if (isDryRun) {
    console.log('\n⚠ DRY-RUN MODE: No data will be written. Pass --confirm to execute.\n');
  }

  let userIds = [];

  if (rebuildAll) {
    const distinct = await Attempt.distinct('userId');
    userIds = distinct;
    console.log(`Found ${userIds.length} unique users in Attempt history.`);
  } else {
    // Validate the provided userId has any attempts
    const count = await Attempt.countDocuments({ userId: targetUserId });
    if (count === 0) {
      console.log(`No Attempt records found for userId="${targetUserId}". Nothing to rebuild.`);
      await mongoose.disconnect();
      return;
    }
    userIds = [targetUserId];
    console.log(`Found ${count} attempts for userId="${targetUserId}".`);
  }

  let totalRebuilt = 0;

  for (const userId of userIds) {
    if (isDryRun) {
      // Count what would be rebuilt
      const groups = await Attempt.aggregate([
        { $match: { userId } },
        { $group: { _id: { topic: '$topic', pattern: '$pattern' } } },
      ]);
      console.log(`[DRY-RUN] userId="${userId}" → would rebuild ${groups.length} progress record(s).`);
    } else {
      const result = await studentProgressService.rebuildProgressForUser(userId);
      console.log(`[REBUILD] userId="${userId}" → rebuilt ${result.rebuilt} progress record(s).`);
      totalRebuilt += result.rebuilt;
    }
  }

  if (!isDryRun) {
    console.log(`\n✅ REBUILD COMPLETE: ${userIds.length} user(s), ${totalRebuilt} progress record(s) rebuilt.`);
  } else {
    console.log(`\n✅ DRY-RUN COMPLETE. Run with --confirm to execute the rebuild.`);
  }

  await mongoose.disconnect();
};

main().catch((err) => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
