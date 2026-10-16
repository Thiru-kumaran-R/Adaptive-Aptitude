'use strict';

/**
 * tests/planningGeneration.test.js — Phase 5: Planning Generation & Preview Tests
 */

const mongoose = require('mongoose');
const supertest = require('supertest');
const { signAccessToken } = require('../src/services/authService');

function getAuthHeaders(userId = 'usr_test_default', extra = {}) {
  return { Authorization: `Bearer ${signAccessToken({ userId, ...extra })}` };
}

function createAuthRequest(defaultUserId = 'usr_test_default') {
  return function authRequest(targetApp) {
    const inst = supertest(targetApp);
    return new Proxy(inst, {
      get(target, method) {
        const origMethod = target[method];
        if (typeof origMethod !== 'function' || !['get', 'post', 'put', 'patch', 'delete'].includes(method)) {
          return origMethod;
        }
        return function(url) {
          const testInstance = origMethod.call(target, url);
          let targetUserId = defaultUserId;
          const queryMatch = url && typeof url === 'string' && url.match(/[?&]userId=([^&]+)/);
          const pathMatch = url && typeof url === 'string' && url.match(/\/(?:user|users)\/([^/?]+)/);
          if (queryMatch) {
            targetUserId = decodeURIComponent(queryMatch[1]);
          } else if (pathMatch) {
            targetUserId = decodeURIComponent(pathMatch[1]);
          }
          if (targetUserId) {
            testInstance.set(getAuthHeaders(targetUserId));
          }
          const origSend = testInstance.send;
          testInstance.send = function(data) {
            if (data && typeof data === 'object' && data.userId) {
              testInstance.set(getAuthHeaders(data.userId));
            }
            return origSend.call(testInstance, data);
          };
          return testInstance;
        };
      }
    });
  };
}
const request = createAuthRequest();
const createApp = require('../src/app');
const { connectTestDB, disconnectTestDB } = require('./helpers/dbSetup');
const User = require('../src/models/userModel');
const Goal = require('../src/models/goalModel');
const StudyPlan = require('../src/models/studyPlanModel');
const DailyObjective = require('../src/models/dailyObjectiveModel');
const StudentProgress = require('../src/models/studentProgressModel');
const RevisionItem = require('../src/models/revisionItemModel');
const RevisionProcessingRecord = require('../src/models/revisionProcessingRecordModel');
const { formatLogicalDate } = require('../src/utils/dateUtils');

const app = createApp();

describe('Planning Generation & Preview (Phase 5)', () => {
  const testUserId = 'test_plan_user_' + Date.now();
  const otherUserId = 'other_plan_user_' + Date.now();
  let userGoalId;
  let otherGoalId;

  beforeAll(async () => {
    await connectTestDB();

    await User.create({
      userId: testUserId,
      name: 'Plan Test User',
      email: `${testUserId}@example.com`,
    });

    await User.create({
      userId: otherUserId,
      name: 'Other Test User',
      email: `${otherUserId}@example.com`,
    });

    const g1 = await Goal.create({
      userId: testUserId,
      title: 'TCS Placement Prep',
      type: 'company',
      targetName: 'TCS',
    });
    userGoalId = g1._id.toString();

    const g2 = await Goal.create({
      userId: otherUserId,
      title: 'Infosys Placement Prep',
      type: 'company',
      targetName: 'Infosys',
    });
    otherGoalId = g2._id.toString();
  });

  afterAll(async () => {
    await User.deleteMany({ userId: { $in: [testUserId, otherUserId] } });
    await Goal.deleteMany({ userId: { $in: [testUserId, otherUserId] } });
    await StudyPlan.deleteMany({ userId: { $in: [testUserId, otherUserId] } });
    await DailyObjective.deleteMany({ userId: { $in: [testUserId, otherUserId] } });
    await StudentProgress.deleteMany({ userId: { $in: [testUserId, otherUserId] } });
    await RevisionItem.deleteMany({ userId: { $in: [testUserId, otherUserId] } });
    await RevisionProcessingRecord.deleteMany({ userId: { $in: [testUserId, otherUserId] } });
    await disconnectTestDB();
  });

  beforeEach(async () => {
    await StudyPlan.deleteMany({ userId: { $in: [testUserId, otherUserId] } });
    await DailyObjective.deleteMany({ userId: { $in: [testUserId, otherUserId] } });
    await RevisionItem.deleteMany({ userId: { $in: [testUserId, otherUserId] } });
    await RevisionProcessingRecord.deleteMany({ userId: { $in: [testUserId, otherUserId] } });
  });

  describe('Horizon & Preset Calculations', () => {
    it('supports 3d preset (3 days)', async () => {
      const res = await request(app)
        .post('/api/v1/planning/preview')
        .send({
          userId: testUserId,
          goalId: userGoalId,
          durationPreset: '3d',
          referenceDate: '2026-10-01',
          scope: { topics: ['Percentage'] },
        });

      expect(res.status).toBe(200);
      expect(res.body.data.days).toBe(3);
      expect(res.body.data.startDate).toBe('2026-10-01');
      expect(res.body.data.endDate).toBe('2026-10-03');
    });

    it('supports 7d and 9d presets', async () => {
      const res7 = await request(app)
        .post('/api/v1/planning/preview')
        .send({
          userId: testUserId,
          goalId: userGoalId,
          durationPreset: '7d',
          referenceDate: '2026-10-01',
          scope: { topics: ['Percentage'] },
        });
      expect(res7.body.data.days).toBe(7);
      expect(res7.body.data.endDate).toBe('2026-10-07');

      const res9 = await request(app)
        .post('/api/v1/planning/preview')
        .send({
          userId: testUserId,
          goalId: userGoalId,
          durationPreset: '9d',
          referenceDate: '2026-10-01',
          scope: { topics: ['Percentage'] },
        });
      expect(res9.body.data.days).toBe(9);
      expect(res9.body.data.endDate).toBe('2026-10-09');
    });

    it('supports calendar month presets (1m, 2m, 3m, 6m)', async () => {
      const res1m = await request(app)
        .post('/api/v1/planning/preview')
        .send({
          userId: testUserId,
          goalId: userGoalId,
          durationPreset: '1m',
          referenceDate: '2026-10-01',
          scope: { topics: ['Percentage'] },
        });
      expect(res1m.status).toBe(200);
      expect(res1m.body.data.startDate).toBe('2026-10-01');
      expect(res1m.body.data.endDate).toBe('2026-10-31');
      expect(res1m.body.data.days).toBe(31); // October has 31 days

      const res2m = await request(app)
        .post('/api/v1/planning/preview')
        .send({
          userId: testUserId,
          goalId: userGoalId,
          durationPreset: '2m',
          referenceDate: '2026-10-01',
          scope: { topics: ['Percentage'] },
        });
      expect(res2m.status).toBe(200);
      expect(res2m.body.data.startDate).toBe('2026-10-01');
      expect(res2m.body.data.endDate).toBe('2026-11-30');
      expect(res2m.body.data.days).toBe(61); // 31 + 30 days

      const res3m = await request(app)
        .post('/api/v1/planning/preview')
        .send({
          userId: testUserId,
          goalId: userGoalId,
          durationPreset: '3m',
          referenceDate: '2026-10-01',
          scope: { topics: ['Percentage'] },
        });
      expect(res3m.status).toBe(200);
      expect(res3m.body.data.startDate).toBe('2026-10-01');
      expect(res3m.body.data.endDate).toBe('2026-12-31');
      expect(res3m.body.data.days).toBe(92); // 31 + 30 + 31 days

      const res6m = await request(app)
        .post('/api/v1/planning/preview')
        .send({
          userId: testUserId,
          goalId: userGoalId,
          durationPreset: '6m',
          referenceDate: '2026-10-01',
          scope: { topics: ['Percentage'] },
        });
      expect(res6m.status).toBe(200);
      expect(res6m.body.data.startDate).toBe('2026-10-01');
      expect(res6m.body.data.endDate).toBe('2027-03-31');
      expect(res6m.body.data.days).toBe(182); // Oct(31) + Nov(30) + Dec(31) + Jan(31) + Feb(28) + Mar(31)
    });

    it('supports custom explicit start and target dates', async () => {
      const res = await request(app)
        .post('/api/v1/planning/preview')
        .send({
          userId: testUserId,
          goalId: userGoalId,
          startDate: '2026-11-01',
          targetDate: '2026-11-05',
          scope: { topics: ['Percentage'] },
        });
      expect(res.status).toBe(200);
      expect(res.body.data.startDate).toBe('2026-11-01');
      expect(res.body.data.endDate).toBe('2026-11-05');
      expect(res.body.data.days).toBe(5);
    });

    it('rejects conflicting durationPreset and targetDate with PLANNING_HORIZON_CONFLICT', async () => {
      const res = await request(app)
        .post('/api/v1/planning/preview')
        .send({
          userId: testUserId,
          goalId: userGoalId,
          durationPreset: '7d', // resolves to 2026-10-07
          startDate: '2026-10-01',
          targetDate: '2026-10-15', // conflict!
          scope: { topics: ['Percentage'] },
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('PLANNING_HORIZON_CONFLICT');
    });

    it('allows durationPreset and targetDate when they resolve to the exact same horizon end date', async () => {
      const res = await request(app)
        .post('/api/v1/planning/preview')
        .send({
          userId: testUserId,
          goalId: userGoalId,
          durationPreset: '7d', // resolves to 2026-10-07
          startDate: '2026-10-01',
          targetDate: '2026-10-07', // matching!
          scope: { topics: ['Percentage'] },
        });

      expect(res.status).toBe(200);
      expect(res.body.data.days).toBe(7);
      expect(res.body.data.endDate).toBe('2026-10-07');
    });
  });

  describe('Scope Validation & Prerequisite Expansion', () => {
    it('rejects company goal without scope with 400 PLANNING_SCOPE_REQUIRED', async () => {
      const res = await request(app)
        .post('/api/v1/planning/preview')
        .send({
          userId: testUserId,
          goalId: userGoalId,
          durationPreset: '7d',
        });
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('PLANNING_SCOPE_REQUIRED');
    });

    it('rejects government goal without scope with 400 PLANNING_SCOPE_REQUIRED', async () => {
      const govGoal = await Goal.create({
        userId: testUserId,
        title: 'UPSC Prep',
        type: 'government',
        targetName: 'UPSC',
      });
      const res = await request(app)
        .post('/api/v1/planning/preview')
        .send({
          userId: testUserId,
          goalId: govGoal._id.toString(),
          durationPreset: '1m',
        });
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('PLANNING_SCOPE_REQUIRED');
      await Goal.deleteOne({ _id: govGoal._id });
    });

    it('restricts explicit topic scope strictly to canonical topic patterns and prerequisites', async () => {
      const res = await request(app)
        .post('/api/v1/planning/preview')
        .send({
          userId: testUserId,
          goalId: userGoalId,
          durationPreset: '7d',
          scope: { topics: ['Percentage'] },
        });
      expect(res.status).toBe(200);
      for (const obj of res.body.data.objectives) {
        expect(obj.topic).toBe('Percentage');
      }
    });

    it('restricts explicit pattern scope strictly to requested patterns and prerequisites', async () => {
      const res = await request(app)
        .post('/api/v1/planning/preview')
        .send({
          userId: testUserId,
          goalId: userGoalId,
          durationPreset: '7d',
          scope: { patterns: ['Basic Percentage Calculation'] },
        });
      expect(res.status).toBe(200);
      const plannedPatterns = new Set();
      for (const obj of res.body.data.objectives) {
        for (const p of obj.patterns) {
          plannedPatterns.add(p.pattern);
        }
      }
      expect(plannedPatterns.has('Basic Percentage Calculation')).toBe(true);
      expect(plannedPatterns.size).toBe(1);
    });

    it('allows explicit all-canonical mode (scope.allCanonicalPatterns = true)', async () => {
      const res = await request(app)
        .post('/api/v1/planning/preview')
        .send({
          userId: testUserId,
          goalId: userGoalId,
          durationPreset: '7d',
          scope: { allCanonicalPatterns: true },
        });
      expect(res.status).toBe(200);
      expect(res.body.data.reasonCodes).toContain('ALL_CANONICAL_SCOPE');
    });

    it('rejects cross-user Goal access with 403 or 404', async () => {
      const res = await request(app)
        .post('/api/v1/planning/preview')
        .send({
          userId: testUserId,
          goalId: otherGoalId, // belongs to otherUserId
          durationPreset: '7d',
          scope: { topics: ['Percentage'] },
        });
      expect([403, 404]).toContain(res.status);

      const genRes = await request(app)
        .post('/api/v1/planning/generate')
        .send({
          userId: testUserId,
          goalId: otherGoalId, // belongs to otherUserId
          durationPreset: '7d',
          scope: { topics: ['Percentage'] },
        });
      expect([403, 404]).toContain(genRes.status);
    });

    it('rejects invalid topic with INVALID_TOPIC', async () => {
      const res = await request(app)
        .post('/api/v1/planning/preview')
        .send({
          userId: testUserId,
          goalId: userGoalId,
          durationPreset: '7d',
          scope: { topics: ['NonExistentTopic123'] },
        });
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_TOPIC');
    });

    it('rejects invalid pattern with INVALID_PATTERN', async () => {
      const res = await request(app)
        .post('/api/v1/planning/preview')
        .send({
          userId: testUserId,
          goalId: userGoalId,
          durationPreset: '7d',
          scope: { patterns: ['NonExistentPattern456'] },
        });
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_PATTERN');
    });

    it('automatically includes unmet prerequisites and places them before dependent pattern', async () => {
      // "Basic Speed-Distance-Time & Unit Conversions" is foundational; "Average Speed" requires it
      const res = await request(app)
        .post('/api/v1/planning/preview')
        .send({
          userId: testUserId,
          goalId: userGoalId,
          durationPreset: '7d',
          scope: { patterns: ['Average Speed'] },
        });

      expect(res.status).toBe(200);
      expect(res.body.data.prerequisitesAdded).toBeGreaterThanOrEqual(1);

      // Verify prerequisite pattern appears before "Average Speed" in proposed schedule
      const plannedPatterns = [];
      for (const obj of res.body.data.objectives) {
        for (const p of obj.patterns) {
          plannedPatterns.push(p.pattern);
        }
      }

      const prereqIdx = plannedPatterns.indexOf('Basic Speed-Distance-Time & Unit Conversions');
      const targetIdx = plannedPatterns.indexOf('Average Speed');

      expect(prereqIdx).toBeGreaterThanOrEqual(0);
      expect(targetIdx).toBeGreaterThanOrEqual(0);
      expect(prereqIdx).toBeLessThan(targetIdx);
    });

    it('enforces same-day prerequisite ordering: prerequisite appears earlier in DailyObjective.patterns[]', async () => {
      // Force both foundational prerequisite and dependent into the same DailyObjective (maxPatternsPerDay = 3 >= 2)
      const res = await request(app)
        .post('/api/v1/planning/preview')
        .send({
          userId: testUserId,
          goalId: userGoalId,
          durationPreset: '3d',
          maxPatternsPerDay: 3,
          scope: { patterns: ['Average Speed'] },
        });

      expect(res.status).toBe(200);
      const objectives = res.body.data.objectives;
      expect(objectives.length).toBeGreaterThan(0);

      const day1 = objectives[0];
      const patternNames = day1.patterns.map((p) => p.pattern);

      // Both patterns fit on Day 1 because they share the same topic ('Time, Speed and Distance')
      expect(patternNames).toContain('Basic Speed-Distance-Time & Unit Conversions');
      expect(patternNames).toContain('Average Speed');

      const prereqPos = patternNames.indexOf('Basic Speed-Distance-Time & Unit Conversions');
      const dependentPos = patternNames.indexOf('Average Speed');

      // Invariant: Prerequisite must strictly precede dependent in the objective patterns array
      expect(prereqPos).toBeLessThan(dependentPos);
    });

    it('skips already-mastered patterns (mastery >= 0.85) by default', async () => {
      // Seed mastery for a pattern
      await StudentProgress.create({
        userId: testUserId,
        topic: 'Percentage',
        pattern: 'Basic Percentage Calculation',
        mastery: 0.90,
        totalAttempts: 15,
        correctAttempts: 14,
      });

      const res = await request(app)
        .post('/api/v1/planning/preview')
        .send({
          userId: testUserId,
          goalId: userGoalId,
          durationPreset: '7d',
          scope: { patterns: ['Basic Percentage Calculation'] },
        });

      expect(res.status).toBe(200);
      expect(res.body.data.patternsAlreadyMastered).toBe(1);
      expect(res.body.data.patternsScheduled).toBe(0);

      // When includeMastered is true, it should schedule it
      const resInclude = await request(app)
        .post('/api/v1/planning/preview')
        .send({
          userId: testUserId,
          goalId: userGoalId,
          durationPreset: '7d',
          includeMastered: true,
          scope: { patterns: ['Basic Percentage Calculation'] },
        });

      expect(resInclude.body.data.patternsScheduled).toBe(1);

      // Clean up progress
      await StudentProgress.deleteOne({ userId: testUserId, pattern: 'Basic Percentage Calculation' });
    });

    it('enforces planning priority tie-break order: lower mastery -> fewer attempts -> canonical registry order -> pattern name', async () => {
      // Four simultaneously eligible foundational patterns in Percentage (all have 0 prerequisites):
      // Pattern A: 'Basic Percentage Calculation' (registry index 99) -> mastery = 0.40, attempts = 10
      // Pattern B: 'Single Percentage Increase and Decrease' (registry index 100) -> mastery = 0.40, attempts = 3
      // Pattern C: 'Percentage of a Quantity & Fractions' (registry index 102) -> mastery = 0.55, attempts = 1
      // Pattern D: 'Reverse Percentage & Base Value' (registry index 101) -> mastery = 0.40, attempts = 3
      await StudentProgress.deleteMany({ userId: testUserId });

      await StudentProgress.insertMany([
        { userId: testUserId, topic: 'Percentage', pattern: 'Basic Percentage Calculation', mastery: 0.40, attempts: 10 },
        { userId: testUserId, topic: 'Percentage', pattern: 'Single Percentage Increase and Decrease', mastery: 0.40, attempts: 3 },
        { userId: testUserId, topic: 'Percentage', pattern: 'Percentage of a Quantity & Fractions', mastery: 0.55, attempts: 1 },
        { userId: testUserId, topic: 'Percentage', pattern: 'Reverse Percentage & Base Value', mastery: 0.40, attempts: 3 },
      ]);

      const res = await request(app)
        .post('/api/v1/planning/preview')
        .send({
          userId: testUserId,
          goalId: userGoalId,
          durationPreset: '3d',
          maxPatternsPerDay: 4,
          scope: {
            patterns: [
              'Basic Percentage Calculation',
              'Single Percentage Increase and Decrease',
              'Percentage of a Quantity & Fractions',
              'Reverse Percentage & Base Value',
            ],
          },
        });

      expect(res.status).toBe(200);
      const day1 = res.body.data.objectives[0];
      const ordered = day1.patterns.map((p) => p.pattern);

      // Verify the 4-step tie-break contract:
      // 1. A vs B (both mastery 0.40): B wins because fewer attempts (3 < 10)
      // 2. B vs D (both mastery 0.40, both 3 attempts): B wins because earlier registry index (100 < 101)
      // 3. D vs A (both mastery 0.40): D wins because fewer attempts (3 < 10)
      // 4. A, B, D vs C: Lower mastery (0.40 < 0.55) takes priority over attempts
      expect(ordered).toEqual([
        'Single Percentage Increase and Decrease', // Rank 1: Pattern B
        'Reverse Percentage & Base Value',         // Rank 2: Pattern D
        'Basic Percentage Calculation',           // Rank 3: Pattern A
        'Percentage of a Quantity & Fractions',    // Rank 4: Pattern C
      ]);

      // New student special case: when mastery = 0 and attempts = 0, canonical registry order naturally resolves
      await StudentProgress.deleteMany({ userId: testUserId });
      const newStudentRes = await request(app)
        .post('/api/v1/planning/preview')
        .send({
          userId: testUserId,
          goalId: userGoalId,
          durationPreset: '3d',
          maxPatternsPerDay: 4,
          scope: {
            patterns: [
              'Reverse Percentage & Base Value',
              'Percentage of a Quantity & Fractions',
              'Single Percentage Increase and Decrease',
              'Basic Percentage Calculation',
            ],
          },
        });

      expect(newStudentRes.status).toBe(200);
      const newDay1 = newStudentRes.body.data.objectives[0];
      const newOrdered = newDay1.patterns.map((p) => p.pattern);
      expect(newOrdered).toEqual([
        'Basic Percentage Calculation',           // Index 99
        'Single Percentage Increase and Decrease', // Index 100
        'Reverse Percentage & Base Value',         // Index 101
        'Percentage of a Quantity & Fractions',    // Index 102
      ]);
    });
  });

  describe('Capacity, Allocation & Reconciliation', () => {
    it('detects capacity shortfall when scope exceeds horizon and reports CAPACITY_LIMIT_REACHED', async () => {
      // 3 days horizon with 3 patterns/day = max 9 patterns can be scheduled
      // All canonical patterns (278) will vastly exceed capacity
      const res = await request(app)
        .post('/api/v1/planning/preview')
        .send({
          userId: testUserId,
          goalId: userGoalId,
          durationPreset: '3d',
          dailyQuestionBudget: 30,
          maxPatternsPerDay: 3,
          scope: { allCanonicalPatterns: true },
        });

      expect(res.status).toBe(200);
      expect(res.body.data.capacityShortfall).toBe(true);
      expect(res.body.data.reasonCodes).toContain('CAPACITY_LIMIT_REACHED');
      expect(res.body.data.patternsUnscheduled).toBeGreaterThan(0);
      expect(res.body.data.unscheduledWorkload).toBeGreaterThan(0);
      expect(res.body.data.horizonQuestionCapacity).toBe(90); // 3 days * 30 questions
    });

    it('enforces DailyObjective.targetMinutes <= configured dailyMinutes and actualMinutes = 0', async () => {
      // Test default configured dailyMinutes (60) on generation
      const resDefault = await request(app)
        .post('/api/v1/planning/generate')
        .send({
          userId: testUserId,
          goalId: userGoalId,
          durationPreset: '3d',
          scope: { topics: ['Percentage'] },
        });

      expect(resDefault.status).toBe(201);
      for (const obj of resDefault.body.data.objectives) {
        expect(obj.targetMinutes).toBeLessThanOrEqual(60);
        expect(obj.actualMinutes).toBe(0);
        // Verify patterns have no persisted targetMinutes (matches Phase 3 schema)
        for (const p of obj.patterns) {
          expect(p.targetMinutes).toBeUndefined();
        }
      }

      // Test override dailyMinutes (45) on preview
      const resOverride = await request(app)
        .post('/api/v1/planning/preview')
        .send({
          userId: testUserId,
          goalId: userGoalId,
          durationPreset: '3d',
          dailyMinutes: 45,
          scope: { topics: ['Percentage'] },
        });

      expect(resOverride.status).toBe(200);
      for (const obj of resOverride.body.data.objectives) {
        expect(obj.targetMinutes).toBeLessThanOrEqual(45);
        expect(obj.actualMinutes).toBe(0);
      }
    });

    it('guarantees preview is strictly write-free (0 DB changes)', async () => {
      const plansBefore = await StudyPlan.countDocuments({ userId: testUserId });
      const objBefore = await DailyObjective.countDocuments({ userId: testUserId });
      const revBefore = await RevisionItem.countDocuments({ userId: testUserId });
      const procBefore = await RevisionProcessingRecord.countDocuments({ userId: testUserId });

      await request(app)
        .post('/api/v1/planning/preview')
        .send({
          userId: testUserId,
          goalId: userGoalId,
          durationPreset: '7d',
          scope: { topics: ['Percentage'] },
        });

      const plansAfter = await StudyPlan.countDocuments({ userId: testUserId });
      const objAfter = await DailyObjective.countDocuments({ userId: testUserId });
      const revAfter = await RevisionItem.countDocuments({ userId: testUserId });
      const procAfter = await RevisionProcessingRecord.countDocuments({ userId: testUserId });

      expect(plansAfter).toBe(plansBefore);
      expect(objAfter).toBe(objBefore);
      expect(revAfter).toBe(revBefore);
      expect(procAfter).toBe(procBefore);
    });

    it('guarantees atomic plan generation: rolls back StudyPlan if DailyObjective insertion fails', async () => {
      const plansBefore = await StudyPlan.countDocuments();
      const objBefore = await DailyObjective.countDocuments();

      // Spy on DailyObjective.create to force an error during insertion
      const spy = jest.spyOn(DailyObjective, 'create').mockImplementationOnce(() => {
        throw new Error('SIMULATED_OBJECTIVE_INSERT_FAILURE');
      });

      const res = await request(app)
        .post('/api/v1/planning/generate')
        .send({
          userId: testUserId,
          goalId: userGoalId,
          durationPreset: '3d',
          scope: { topics: ['Percentage'] },
        });

      spy.mockRestore();

      expect(res.status).toBe(500);
      const plansAfter = await StudyPlan.countDocuments();
      const objAfter = await DailyObjective.countDocuments();

      // Invariant: no orphaned StudyPlan, no partial DailyObjectives
      expect(plansAfter).toBe(plansBefore);
      expect(objAfter).toBe(objBefore);
    });

    it('generates committed StudyPlan with targetQuestions reconciled with DailyObjectives', async () => {
      const res = await request(app)
        .post('/api/v1/planning/generate')
        .send({
          userId: testUserId,
          goalId: userGoalId,
          durationPreset: '3d',
          dailyQuestionBudget: 30,
          dailyMinutes: 60,
          maxPatternsPerDay: 2,
          scope: { topics: ['Percentage'] },
        });

      expect(res.status).toBe(201);
      const plan = res.body.data.plan;
      const objectives = res.body.data.objectives;

      expect(plan).toBeDefined();
      expect(objectives.length).toBeGreaterThan(0);

      // Verify single primary topic per objective
      for (const obj of objectives) {
        expect(obj.topic).toBe('Percentage');
        expect(obj.patterns.length).toBeLessThanOrEqual(2);
        const dayQuestions = obj.patterns.reduce((sum, p) => sum + p.targetQuestions, 0);
        expect(dayQuestions).toBeLessThanOrEqual(30);
      }

      // Verify reconciliation: sum(DailyObjective targetQuestions per pattern) === StudyPlan.targets[].targetQuestions
      const objectiveTotals = new Map();
      for (const obj of objectives) {
        for (const p of obj.patterns) {
          objectiveTotals.set(p.pattern, (objectiveTotals.get(p.pattern) || 0) + p.targetQuestions);
        }
      }

      for (const target of plan.targets) {
        const expectedTotal = objectiveTotals.get(target.pattern);
        expect(target.targetQuestions).toBe(expectedTotal);
      }

      // Verify schedule retrieval endpoint
      const schedRes = await request(app)
        .get(`/api/v1/planning/plans/${plan._id}/schedule?userId=${testUserId}`);

      expect(schedRes.status).toBe(200);
      expect(schedRes.body.data.totalObjectives).toBe(objectives.length);

      // Verify cross-user schedule access is blocked
      const forbiddenSched = await request(app)
        .get(`/api/v1/planning/plans/${plan._id}/schedule?userId=${otherUserId}`);
      expect(forbiddenSched.status).toBe(403);
    });

    it('leaves targetDifficulty absent or unset in generated DailyObjectives (Phase 4 owns difficulty)', async () => {
      const res = await request(app)
        .post('/api/v1/planning/generate')
        .send({
          userId: testUserId,
          goalId: userGoalId,
          durationPreset: '3d',
          scope: { topics: ['Percentage'] },
        });

      expect(res.status).toBe(201);
      const objectives = res.body.data.objectives;
      for (const obj of objectives) {
        for (const p of obj.patterns) {
          expect(p.targetDifficulty).toBeUndefined();
        }
      }

      // Also verify persisted MongoDB document
      const storedObj = await DailyObjective.findOne({ planId: res.body.data.plan._id }).lean();
      for (const p of storedObj.patterns) {
        expect(p.targetDifficulty).toBeUndefined();
      }
    });

    it('applies dailyQuestionBudget, dailyMinutes, and maxPatternsPerDay overrides within limits', async () => {
      const res = await request(app)
        .post('/api/v1/planning/preview')
        .send({
          userId: testUserId,
          goalId: userGoalId,
          durationPreset: '3d',
          dailyQuestionBudget: 45,
          dailyMinutes: 90,
          maxPatternsPerDay: 3,
          scope: { topics: ['Percentage'] },
        });

      expect(res.status).toBe(200);
      expect(res.body.data.dailyQuestionBudget).toBe(45);
      expect(res.body.data.dailyMinutes).toBe(90);
      expect(res.body.data.maxPatternsPerDay).toBe(3);

      for (const obj of res.body.data.objectives) {
        expect(obj.targetMinutes).toBeLessThanOrEqual(90);
        expect(obj.patterns.length).toBeLessThanOrEqual(3);
        const dayQ = obj.patterns.reduce((sum, p) => sum + p.targetQuestions, 0);
        expect(dayQ).toBeLessThanOrEqual(45);
      }
    });

    it('validates dailyQuestionBudget bounds (1..200), dailyMinutes (1..600), maxPatternsPerDay (1..10) for preview and generate', async () => {
      const invalidCases = [
        { payload: { dailyQuestionBudget: 0 }, desc: 'dailyQuestionBudget = 0' },
        { payload: { dailyQuestionBudget: 201 }, desc: 'dailyQuestionBudget = 201' },
        { payload: { dailyMinutes: 0 }, desc: 'dailyMinutes = 0' },
        { payload: { dailyMinutes: 601 }, desc: 'dailyMinutes = 601' },
        { payload: { maxPatternsPerDay: 0 }, desc: 'maxPatternsPerDay = 0' },
        { payload: { maxPatternsPerDay: 11 }, desc: 'maxPatternsPerDay = 11' },
      ];

      for (const { payload } of invalidCases) {
        // Preview
        const prevRes = await request(app)
          .post('/api/v1/planning/preview')
          .send({
            userId: testUserId,
            goalId: userGoalId,
            durationPreset: '3d',
            scope: { topics: ['Percentage'] },
            ...payload,
          });
        expect(prevRes.status).toBe(400);
        expect(prevRes.body.error.code).toBe('VALIDATION_ERROR');

        // Generate
        const genRes = await request(app)
          .post('/api/v1/planning/generate')
          .send({
            userId: testUserId,
            goalId: userGoalId,
            durationPreset: '3d',
            scope: { topics: ['Percentage'] },
            ...payload,
          });
        expect(genRes.status).toBe(400);
        expect(genRes.body.error.code).toBe('VALIDATION_ERROR');
      }
    });

    it('ensures safe failure logging does not log question contents or answers across failure events', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      // 1. PLAN_REPLANNING_FAILED
      const badPlanId = new mongoose.Types.ObjectId();
      await request(app)
        .post(`/api/v1/planning/plans/${badPlanId}/replan`)
        .send({ userId: testUserId });

      // 2. PLAN_GENERATION_FAILED
      const badGoalId = new mongoose.Types.ObjectId();
      await request(app)
        .post('/api/v1/planning/generate')
        .send({
          userId: testUserId,
          goalId: badGoalId,
          durationPreset: '3d',
          scope: { topics: ['Percentage'] },
        });

      // 3. REVISION_REBUILD_FAILED
      const rebuildSpy = jest.spyOn(RevisionItem, 'deleteOne').mockImplementationOnce(() => {
        throw new Error('SIMULATED_REBUILD_DB_ERROR');
      });
      await request(app)
        .post('/api/v1/revisions/rebuild')
        .send({ userId: testUserId, topic: 'Percentage', pattern: 'Basic Percentage Calculation' });
      rebuildSpy.mockRestore();

      expect(consoleSpy).toHaveBeenCalled();
      const loggedMessages = consoleSpy.mock.calls.map((c) => c[0]);

      const foundEvents = new Set();
      for (const msg of loggedMessages) {
        if (typeof msg === 'string') {
          expect(msg).not.toMatch(/"answer"/i);
          expect(msg).not.toMatch(/"correctAnswer"/i);
          expect(msg).not.toMatch(/"selectedAnswer"/i);
          expect(msg).not.toMatch(/"explanation"/i);
          expect(msg).not.toMatch(/"options"/i);
          expect(msg).not.toMatch(/"password"/i);

          if (msg.includes('PLAN_REPLANNING_FAILED')) foundEvents.add('PLAN_REPLANNING_FAILED');
          if (msg.includes('PLAN_GENERATION_FAILED')) foundEvents.add('PLAN_GENERATION_FAILED');
          if (msg.includes('REVISION_REBUILD_FAILED')) foundEvents.add('REVISION_REBUILD_FAILED');
        }
      }

      expect(foundEvents.has('PLAN_REPLANNING_FAILED')).toBe(true);
      expect(foundEvents.has('PLAN_GENERATION_FAILED')).toBe(true);
      expect(foundEvents.has('REVISION_REBUILD_FAILED')).toBe(true);

      consoleSpy.mockRestore();
    });

    it('verifies generated StudyPlan.targets and preview proposedTargets contain targetMastery = 0.85', async () => {
      // 1. Preview
      const prevRes = await request(app)
        .post('/api/v1/planning/preview')
        .send({
          userId: testUserId,
          goalId: userGoalId,
          durationPreset: '3d',
          scope: { topics: ['Percentage'] },
        });

      expect(prevRes.status).toBe(200);
      expect(prevRes.body.data.proposedTargets.length).toBeGreaterThan(0);
      for (const t of prevRes.body.data.proposedTargets) {
        expect(t.targetMastery).toBe(0.85);
      }

      // 2. Generate
      const genRes = await request(app)
        .post('/api/v1/planning/generate')
        .send({
          userId: testUserId,
          goalId: userGoalId,
          durationPreset: '3d',
          scope: { topics: ['Percentage'] },
        });

      expect(genRes.status).toBe(201);
      const plan = genRes.body.data.plan;
      expect(plan.targets.length).toBeGreaterThan(0);
      for (const t of plan.targets) {
        expect(t.targetMastery).toBe(0.85);
      }

      // 3. Persisted document in MongoDB
      const persistedPlan = await StudyPlan.findById(plan._id).lean();
      expect(persistedPlan.targets.length).toBeGreaterThan(0);
      for (const t of persistedPlan.targets) {
        expect(t.targetMastery).toBe(0.85);
      }

      // 4. Parity check between preview and generate under identical inputs
      expect(plan.targets.length).toBe(prevRes.body.data.proposedTargets.length);
      for (let i = 0; i < plan.targets.length; i++) {
        expect(plan.targets[i].pattern).toBe(prevRes.body.data.proposedTargets[i].pattern);
        expect(plan.targets[i].targetMastery).toBe(prevRes.body.data.proposedTargets[i].targetMastery);
      }
    });

    it('enforces DailyObjective uniqueness on { userId, planId, date } compound index', async () => {
      const plan = await StudyPlan.create({
        userId: testUserId,
        goalId: new mongoose.Types.ObjectId(),
        name: 'Uniqueness Test Plan',
        startDate: new Date('2026-10-01T00:00:00.000Z'),
        endDate: new Date('2026-10-03T00:00:00.000Z'),
        status: 'active',
      });

      const date = new Date('2026-10-01T00:00:00.000Z');

      await DailyObjective.create({
        userId: testUserId,
        planId: plan._id,
        goalId: plan.goalId,
        date,
        topic: 'Percentage',
        patterns: [{ pattern: 'Basic Percentage Calculation', targetQuestions: 10, completedQuestions: 0 }],
        targetMinutes: 60,
        actualMinutes: 0,
        status: 'pending',
      });

      let duplicateError = null;
      try {
        await DailyObjective.create({
          userId: testUserId,
          planId: plan._id,
          goalId: plan.goalId,
          date,
          topic: 'Percentage',
          patterns: [{ pattern: 'Successive Percentage Changes', targetQuestions: 10, completedQuestions: 0 }],
          targetMinutes: 60,
          actualMinutes: 0,
          status: 'pending',
        });
      } catch (err) {
        duplicateError = err;
      }

      expect(duplicateError).toBeDefined();
      expect(duplicateError.code).toBe(11000);
    });
  });

  describe('Gate 1 — Mastered Pattern Override Contract', () => {
    const masteredUserId = 'gate1_mastered_user_' + Date.now();
    let masteredGoalId;

    beforeAll(async () => {
      await User.create({
        userId: masteredUserId,
        name: 'Mastered Override User',
        email: `${masteredUserId}@example.com`,
      });

      const g = await Goal.create({
        userId: masteredUserId,
        title: 'Mastered Override Goal',
        type: 'company',
      });
      masteredGoalId = g._id.toString();

      // Seed StudentProgress with mastery = 0.90 (>= 0.85)
      await StudentProgress.create({
        userId: masteredUserId,
        topic: 'Percentage',
        pattern: 'Basic Percentage Calculation',
        mastery: 0.90,
        attempts: 20,
        totalAttempts: 20,
        correctAttempts: 18,
      });
    });

    afterAll(async () => {
      await User.deleteOne({ userId: masteredUserId });
      await Goal.deleteMany({ userId: masteredUserId });
      await StudentProgress.deleteMany({ userId: masteredUserId });
      await StudyPlan.deleteMany({ userId: masteredUserId });
      await DailyObjective.deleteMany({ userId: masteredUserId });
    });

    it('skips mastered pattern when includeMastered is omitted', async () => {
      const res = await request(app)
        .post('/api/v1/planning/preview')
        .send({
          userId: masteredUserId,
          goalId: masteredGoalId,
          durationPreset: '7d',
          scope: { patterns: ['Basic Percentage Calculation'] },
        });

      expect(res.status).toBe(200);
      expect(res.body.data.patternsAlreadyMastered).toBe(1);
      expect(res.body.data.patternsScheduled).toBe(0);
      expect(res.body.data.reasonCodes).toContain('MASTERED_PATTERN_SKIPPED');
    });

    it('skips mastered pattern when includeMastered = false', async () => {
      const res = await request(app)
        .post('/api/v1/planning/preview')
        .send({
          userId: masteredUserId,
          goalId: masteredGoalId,
          durationPreset: '7d',
          includeMastered: false,
          scope: { patterns: ['Basic Percentage Calculation'] },
        });

      expect(res.status).toBe(200);
      expect(res.body.data.patternsAlreadyMastered).toBe(1);
      expect(res.body.data.patternsScheduled).toBe(0);
      expect(res.body.data.reasonCodes).toContain('MASTERED_PATTERN_SKIPPED');
    });

    it('includes mastered pattern when includeMastered = true without modifying stored progress', async () => {
      const res = await request(app)
        .post('/api/v1/planning/preview')
        .send({
          userId: masteredUserId,
          goalId: masteredGoalId,
          durationPreset: '7d',
          includeMastered: true,
          scope: { patterns: ['Basic Percentage Calculation'] },
        });

      expect(res.status).toBe(200);
      expect(res.body.data.patternsScheduled).toBe(1);
      expect(res.body.data.patternsAlreadyMastered).toBe(0);
      expect(res.body.data.reasonCodes).not.toContain('MASTERED_PATTERN_SKIPPED');

      // Verify stored StudentProgress is completely untouched
      const prog = await StudentProgress.findOne({ userId: masteredUserId, pattern: 'Basic Percentage Calculation' });
      expect(prog.mastery).toBe(0.90);
      expect(prog.attempts).toBe(20);
    });

    it('demonstrates preview and generate parity when includeMastered = true', async () => {
      // 1. Preview
      const previewRes = await request(app)
        .post('/api/v1/planning/preview')
        .send({
          userId: masteredUserId,
          goalId: masteredGoalId,
          durationPreset: '3d',
          dailyQuestionBudget: 30,
          includeMastered: true,
          scope: { patterns: ['Basic Percentage Calculation'] },
        });

      expect(previewRes.status).toBe(200);
      expect(previewRes.body.data.patternsScheduled).toBe(1);
      expect(previewRes.body.data.scheduledWorkload).toBe(30);

      // 2. Generate
      const genRes = await request(app)
        .post('/api/v1/planning/generate')
        .send({
          userId: masteredUserId,
          goalId: masteredGoalId,
          durationPreset: '3d',
          dailyQuestionBudget: 30,
          includeMastered: true,
          scope: { patterns: ['Basic Percentage Calculation'] },
        });

      expect(genRes.status).toBe(201);
      expect(genRes.body.data.summary.patternsScheduled).toBe(previewRes.body.data.patternsScheduled);
      expect(genRes.body.data.summary.scheduledWorkload).toBe(previewRes.body.data.scheduledWorkload);
      expect(genRes.body.data.plan.planningMeta.includeMastered).toBe(true);
      expect(genRes.body.data.plan.targets[0].pattern).toBe('Basic Percentage Calculation');
    });

    it('enforces that includeMastered: true does not bypass horizon capacity limits', async () => {
      // 1-day horizon with dailyQuestionBudget = 10, maxPatternsPerDay = 1
      // Attempt to schedule 3 mastered patterns
      await StudentProgress.create({
        userId: masteredUserId,
        topic: 'Percentage',
        pattern: 'Single Percentage Increase and Decrease',
        mastery: 0.92,
      });
      await StudentProgress.create({
        userId: masteredUserId,
        topic: 'Percentage',
        pattern: 'Reverse Percentage & Base Value',
        mastery: 0.88,
      });

      const res = await request(app)
        .post('/api/v1/planning/preview')
        .send({
          userId: masteredUserId,
          goalId: masteredGoalId,
          startDate: '2026-10-01',
          targetDate: '2026-10-01', // 1 day
          dailyQuestionBudget: 10,
          maxPatternsPerDay: 1,
          includeMastered: true,
          scope: {
            patterns: [
              'Basic Percentage Calculation',
              'Single Percentage Increase and Decrease',
              'Reverse Percentage & Base Value',
            ],
          },
        });

      expect(res.status).toBe(200);
      expect(res.body.data.days).toBe(1);
      // Only 1 pattern can fit on 1 day with maxPatternsPerDay = 1
      expect(res.body.data.patternsScheduled).toBe(1);
      expect(res.body.data.patternsUnscheduled).toBe(2);
      expect(res.body.data.capacityShortfall).toBe(true);
      expect(res.body.data.reasonCodes).toContain('CAPACITY_LIMIT_REACHED');

      await StudentProgress.deleteMany({
        userId: masteredUserId,
        pattern: { $in: ['Single Percentage Increase and Decrease', 'Reverse Percentage & Base Value'] },
      });
    });

    it('does not reschedule prerequisites of mastered patterns if prerequisite mastery >= 0.70', async () => {
      // "Average Speed" requires "Basic Speed-Distance-Time & Unit Conversions"
      // Set Average Speed mastery = 0.90 (mastered)
      // Set Basic Speed-Distance-Time mastery = 0.75 (prerequisite met >= 0.70)
      await StudentProgress.create({
        userId: masteredUserId,
        topic: 'Time, Speed and Distance',
        pattern: 'Average Speed',
        mastery: 0.90,
      });
      await StudentProgress.create({
        userId: masteredUserId,
        topic: 'Time, Speed and Distance',
        pattern: 'Basic Speed-Distance-Time & Unit Conversions',
        mastery: 0.75,
      });

      const res = await request(app)
        .post('/api/v1/planning/preview')
        .send({
          userId: masteredUserId,
          goalId: masteredGoalId,
          durationPreset: '3d',
          includeMastered: true,
          scope: { patterns: ['Average Speed'] },
        });

      expect(res.status).toBe(200);
      // Prerequisite already satisfied (0.75 >= 0.70), so 0 prerequisites added
      expect(res.body.data.prerequisitesAdded).toBe(0);
      expect(res.body.data.patternsScheduled).toBe(1);
      expect(res.body.data.objectives[0].patterns.map((p) => p.pattern)).toEqual(['Average Speed']);

      await StudentProgress.deleteMany({
        userId: masteredUserId,
        pattern: { $in: ['Average Speed', 'Basic Speed-Distance-Time & Unit Conversions'] },
      });
    });
  });

  describe('Gate 2 — Explicit Custom Horizon Across Goal Types Contract', () => {
    const horizonUserId = 'gate2_horizon_user_' + Date.now();
    let companyGoalId;
    let govGoalId;
    let entranceGoalId;
    let customGoalId;

    beforeAll(async () => {
      await User.create({
        userId: horizonUserId,
        name: 'Horizon Test User',
        email: `${horizonUserId}@example.com`,
      });

      const cg = await Goal.create({
        userId: horizonUserId,
        title: 'Company Goal TCS',
        type: 'company',
        targetName: 'TCS',
      });
      companyGoalId = cg._id.toString();

      const gg = await Goal.create({
        userId: horizonUserId,
        title: 'Government Goal UPSC',
        type: 'government',
        targetName: 'UPSC',
      });
      govGoalId = gg._id.toString();

      const eg = await Goal.create({
        userId: horizonUserId,
        title: 'Entrance Goal CAT',
        type: 'entrance',
        targetName: 'CAT',
      });
      entranceGoalId = eg._id.toString();

      const cug = await Goal.create({
        userId: horizonUserId,
        title: 'Custom User Goal',
        type: 'custom',
      });
      customGoalId = cug._id.toString();
    });

    afterAll(async () => {
      await User.deleteOne({ userId: horizonUserId });
      await Goal.deleteMany({ userId: horizonUserId });
      await StudyPlan.deleteMany({ userId: horizonUserId });
      await DailyObjective.deleteMany({ userId: horizonUserId });
    });

    it('accepts explicit 5-day horizon for company goal when durationPreset is absent', async () => {
      const res = await request(app)
        .post('/api/v1/planning/preview')
        .send({
          userId: horizonUserId,
          goalId: companyGoalId,
          startDate: '2026-10-01',
          targetDate: '2026-10-05',
          scope: { topics: ['Percentage'] },
        });

      expect(res.status).toBe(200);
      expect(res.body.data.startDate).toBe('2026-10-01');
      expect(res.body.data.endDate).toBe('2026-10-05');
      expect(res.body.data.days).toBe(5);
      expect(res.body.data.durationPreset).toBeNull();
    });

    it('still supports company duration preset (7d)', async () => {
      const res = await request(app)
        .post('/api/v1/planning/preview')
        .send({
          userId: horizonUserId,
          goalId: companyGoalId,
          durationPreset: '7d',
          referenceDate: '2026-10-01',
          scope: { topics: ['Percentage'] },
        });

      expect(res.status).toBe(200);
      expect(res.body.data.days).toBe(7);
      expect(res.body.data.startDate).toBe('2026-10-01');
      expect(res.body.data.endDate).toBe('2026-10-07');
    });

    it('accepts government custom explicit non-preset horizon (46 days)', async () => {
      const res = await request(app)
        .post('/api/v1/planning/preview')
        .send({
          userId: horizonUserId,
          goalId: govGoalId,
          startDate: '2026-10-01',
          targetDate: '2026-11-15',
          scope: { topics: ['Percentage'] },
        });

      expect(res.status).toBe(200);
      expect(res.body.data.startDate).toBe('2026-10-01');
      expect(res.body.data.endDate).toBe('2026-11-15');
      expect(res.body.data.days).toBe(46);
    });

    it('accepts custom explicit horizon for entrance goal', async () => {
      const res = await request(app)
        .post('/api/v1/planning/preview')
        .send({
          userId: horizonUserId,
          goalId: entranceGoalId,
          startDate: '2026-10-01',
          targetDate: '2026-10-20',
          scope: { topics: ['Percentage'] },
        });

      expect(res.status).toBe(200);
      expect(res.body.data.days).toBe(20);
    });

    it('accepts custom goal with explicit dates', async () => {
      const res = await request(app)
        .post('/api/v1/planning/preview')
        .send({
          userId: horizonUserId,
          goalId: customGoalId,
          startDate: '2026-10-01',
          targetDate: '2026-10-10',
          scope: { topics: ['Percentage'] },
        });

      expect(res.status).toBe(200);
      expect(res.body.data.days).toBe(10);
    });

    it('rejects explicit horizon without scope with 400 PLANNING_SCOPE_REQUIRED', async () => {
      const res = await request(app)
        .post('/api/v1/planning/preview')
        .send({
          userId: horizonUserId,
          goalId: companyGoalId,
          startDate: '2026-10-01',
          targetDate: '2026-10-05',
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('PLANNING_SCOPE_REQUIRED');
    });

    it('rejects invalid date order (targetDate < startDate) with 400 INVALID_DATE_RANGE', async () => {
      const res = await request(app)
        .post('/api/v1/planning/preview')
        .send({
          userId: horizonUserId,
          goalId: companyGoalId,
          startDate: '2026-10-10',
          targetDate: '2026-10-05',
          scope: { topics: ['Percentage'] },
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_DATE_RANGE');
    });
  });
});

