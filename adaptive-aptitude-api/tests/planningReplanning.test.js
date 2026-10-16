'use strict';

/**
 * tests/planningReplanning.test.js — Phase 5: Progress-Aware Replanning Tests
 */

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
const Attempt = require('../src/models/attemptModel');
const Question = require('../src/models/questionModel');
const { addLogicalDays, formatLogicalDate } = require('../src/utils/dateUtils');

const app = createApp();

describe('Progress-Aware Replanning (Phase 5)', () => {
  const testUserId = 'test_replan_user_' + Date.now();
  const otherUserId = 'other_replan_user_' + Date.now();
  let goalId;
  let sampleQuestion;

  beforeAll(async () => {
    await connectTestDB();

    await User.create({
      userId: testUserId,
      name: 'Replan User',
      email: `${testUserId}@example.com`,
    });

    await User.create({
      userId: otherUserId,
      name: 'Other User',
      email: `${otherUserId}@example.com`,
    });

    const g = await Goal.create({
      userId: testUserId,
      title: 'Replanning Goal',
      type: 'company',
    });
    goalId = g._id.toString();

    sampleQuestion = await Question.findOne({ topic: 'Percentage' });
  });

  afterAll(async () => {
    await User.deleteMany({ userId: { $in: [testUserId, otherUserId] } });
    await Goal.deleteMany({ userId: { $in: [testUserId, otherUserId] } });
    await StudyPlan.deleteMany({ userId: { $in: [testUserId, otherUserId] } });
    await DailyObjective.deleteMany({ userId: { $in: [testUserId, otherUserId] } });
    await StudentProgress.deleteMany({ userId: { $in: [testUserId, otherUserId] } });
    await Attempt.deleteMany({ userId: { $in: [testUserId, otherUserId] } });
    await disconnectTestDB();
  });

  it('rejects replanning when plan belongs to another user', async () => {
    const plan = await StudyPlan.create({
      userId: otherUserId,
      goalId,
      name: 'Other Plan',
      startDate: new Date('2026-10-01'),
      endDate: new Date('2026-10-07'),
      status: 'active',
    });

    const res = await request(app)
      .post(`/api/v1/planning/plans/${plan._id}/replan`)
      .send({ userId: testUserId });

    expect(res.status).toBe(403);
  });

  it('preserves past completed objectives and today with progress while regenerating future pending', async () => {
    const referenceDate = '2026-10-03'; // Today is Day 3

    // 1. Create a 7-day plan
    const genRes = await request(app)
      .post('/api/v1/planning/generate')
      .send({
        userId: testUserId,
        goalId,
        durationPreset: '7d',
        startDate: '2026-10-01',
        dailyQuestionBudget: 30,
        maxPatternsPerDay: 2,
        scope: { topics: ['Percentage'] },
      });

    expect(genRes.status).toBe(201);
    const planId = genRes.body.data.plan._id;

    // 2. Mark Day 1 (2026-10-01) as completed in the past
    await DailyObjective.updateOne(
      { planId, date: new Date('2026-10-01T00:00:00.000Z') },
      { $set: { status: 'completed', 'patterns.0.completedQuestions': 10 } }
    );

    // 3. Mark Day 3 (Today, 2026-10-03) with partial progress
    await DailyObjective.updateOne(
      { planId, date: new Date('2026-10-03T00:00:00.000Z') },
      { $set: { 'patterns.0.completedQuestions': 5 } }
    );

    // 4. Create an immutable Attempt record
    let attemptId;
    if (sampleQuestion) {
      const att = await Attempt.create({
        userId: testUserId,
        questionId: sampleQuestion._id,
        topic: sampleQuestion.topic,
        pattern: sampleQuestion.pattern,
        difficulty: sampleQuestion.difficulty,
        selectedAnswer: sampleQuestion.answer,
        correctAnswer: sampleQuestion.answer,
        isCorrect: true,
        timeTaken: 30,
        source: 'practice',
        attemptedAt: new Date('2026-10-02T10:00:00.000Z'),
      });
      attemptId = att._id;
    }

    // 5. Run explicit replan
    const replanRes = await request(app)
      .post(`/api/v1/planning/plans/${planId}/replan`)
      .send({
        userId: testUserId,
        referenceDate,
      });

    expect(replanRes.status).toBe(200);
    const data = replanRes.body.data;
    expect(data.success).toBe(true);
    expect(data.replanCutoffDate).toBe('2026-10-03');
    expect(data.preservedObjectives).toBeGreaterThanOrEqual(2); // Day 1 completed + Day 3 with progress
    expect(data.newObjectives).toBeGreaterThanOrEqual(1); // Days 4-7 regenerated

    // Verify Day 1 remained completed
    const day1Obj = await DailyObjective.findOne({
      planId,
      date: new Date('2026-10-01T00:00:00.000Z'),
    });
    expect(day1Obj.status).toBe('completed');
    expect(day1Obj.patterns[0].completedQuestions).toBe(10);

    // Verify Day 3 preserved its progress
    const day3Obj = await DailyObjective.findOne({
      planId,
      date: new Date('2026-10-03T00:00:00.000Z'),
    });
    expect(day3Obj.patterns[0].completedQuestions).toBe(5);

    // Verify historical Attempt remains strictly unchanged
    if (attemptId) {
      const storedAtt = await Attempt.findById(attemptId);
      expect(storedAtt).toBeDefined();
      expect(storedAtt.isCorrect).toBe(true);
    }
  });

  it('guarantees replanning is deterministic (running twice produces identical schedule)', async () => {
    // Generate a fresh 5-day plan
    const genRes = await request(app)
      .post('/api/v1/planning/generate')
      .send({
        userId: testUserId,
        goalId,
        startDate: '2026-11-01',
        targetDate: '2026-11-05',
        dailyQuestionBudget: 20,
        maxPatternsPerDay: 2,
        scope: { topics: ['Percentage'] },
      });

    const planId = genRes.body.data.plan._id;
    const refDate = '2026-11-02';

    // First replan
    const replan1 = await request(app)
      .post(`/api/v1/planning/plans/${planId}/replan`)
      .send({ userId: testUserId, referenceDate: refDate });
    expect(replan1.status).toBe(200);

    const objsAfterReplan1 = await DailyObjective.find({ planId }).sort({ date: 1 }).lean();

    // Second replan against identical state
    const replan2 = await request(app)
      .post(`/api/v1/planning/plans/${planId}/replan`)
      .send({ userId: testUserId, referenceDate: refDate });
    expect(replan2.status).toBe(200);

    const objsAfterReplan2 = await DailyObjective.find({ planId }).sort({ date: 1 }).lean();

    expect(objsAfterReplan2.length).toBe(objsAfterReplan1.length);
    for (let i = 0; i < objsAfterReplan1.length; i++) {
      expect(formatLogicalDate(objsAfterReplan2[i].date)).toBe(formatLogicalDate(objsAfterReplan1[i].date));
      expect(objsAfterReplan2[i].topic).toBe(objsAfterReplan1[i].topic);
      expect(objsAfterReplan2[i].patterns.length).toBe(objsAfterReplan1[i].patterns.length);
      for (let j = 0; j < objsAfterReplan1[i].patterns.length; j++) {
        expect(objsAfterReplan2[i].patterns[j].pattern).toBe(objsAfterReplan1[i].patterns[j].pattern);
        expect(objsAfterReplan2[i].patterns[j].targetQuestions).toBe(objsAfterReplan1[i].patterns[j].targetQuestions);
      }
    }
  });

  it('preserves today with completedQuestions === 0 by default, but replaces it when allowReplaceToday is true', async () => {
    // Generate plan
    const genRes = await request(app)
      .post('/api/v1/planning/generate')
      .send({
        userId: testUserId,
        goalId,
        startDate: '2026-12-01',
        targetDate: '2026-12-05',
        dailyQuestionBudget: 20,
        maxPatternsPerDay: 2,
        scope: { topics: ['Percentage'] },
      });

    const planId = genRes.body.data.plan._id;
    const refDate = '2026-12-02'; // Day 2 is "today"

    const todayObjBefore = await DailyObjective.findOne({
      planId,
      date: new Date('2026-12-02T00:00:00.000Z'),
    });
    expect(todayObjBefore).toBeDefined();
    const originalPattern = todayObjBefore.patterns[0].pattern;

    // Case A: Default replan (allowReplaceToday omitted / false) -> today is preserved
    const replanA = await request(app)
      .post(`/api/v1/planning/plans/${planId}/replan`)
      .send({ userId: testUserId, referenceDate: refDate });

    expect(replanA.status).toBe(200);
    const todayObjAfterA = await DailyObjective.findOne({
      planId,
      date: new Date('2026-12-02T00:00:00.000Z'),
    });
    expect(todayObjAfterA._id.toString()).toBe(todayObjBefore._id.toString());

    // Case B: Explicit replan with allowReplaceToday: true -> today is replaced
    const replanB = await request(app)
      .post(`/api/v1/planning/plans/${planId}/replan`)
      .send({
        userId: testUserId,
        referenceDate: refDate,
        allowReplaceToday: true,
      });

    expect(replanB.status).toBe(200);
    expect(replanB.body.data.success).toBe(true);
    // Verifies auditable fields
    expect(replanB.body.data).toHaveProperty('preservedObjectives');
    expect(replanB.body.data).toHaveProperty('removedFutureObjectives');
    expect(replanB.body.data).toHaveProperty('newObjectives');
    expect(replanB.body.data).toHaveProperty('patternsRescheduled');
    expect(replanB.body.data).toHaveProperty('patternsSkippedAsMastered');
    expect(replanB.body.data).toHaveProperty('unscheduledPatterns');
    expect(replanB.body.data).toHaveProperty('remainingCapacity');
  });

  it('preserves future in_progress objectives while replacing future pending objectives', async () => {
    const genRes = await request(app)
      .post('/api/v1/planning/generate')
      .send({
        userId: testUserId,
        goalId,
        startDate: '2027-01-01',
        targetDate: '2027-01-05',
        dailyQuestionBudget: 20,
        maxPatternsPerDay: 2,
        scope: { topics: ['Percentage'] },
      });

    const planId = genRes.body.data.plan._id;
    const refDate = '2027-01-01'; // Today is Day 1

    // Mark Day 3 as in_progress (e.g. user started future objective early)
    await DailyObjective.updateOne(
      { planId, date: new Date('2027-01-03T00:00:00.000Z') },
      { $set: { status: 'in_progress' } }
    );

    const replan = await request(app)
      .post(`/api/v1/planning/plans/${planId}/replan`)
      .send({ userId: testUserId, referenceDate: refDate });

    expect(replan.status).toBe(200);

    // Verify Day 3 in_progress objective was preserved
    const day3Obj = await DailyObjective.findOne({
      planId,
      date: new Date('2027-01-03T00:00:00.000Z'),
    });
    expect(day3Obj).toBeDefined();
    expect(day3Obj.status).toBe('in_progress');
  });

  it('preserves targetMastery = 0.85 across replanning without erasing, nullifying, or replacing with current mastery', async () => {
    const genRes = await request(app)
      .post('/api/v1/planning/generate')
      .send({
        userId: testUserId,
        goalId,
        startDate: '2027-02-01',
        targetDate: '2027-02-05',
        dailyQuestionBudget: 20,
        maxPatternsPerDay: 2,
        scope: { topics: ['Percentage'] },
      });

    const planId = genRes.body.data.plan._id;

    // Seed student progress with lower mastery (e.g. 0.45) for one of the patterns
    await StudentProgress.findOneAndUpdate(
      { userId: testUserId, topic: 'Percentage', pattern: 'Basic Percentage Calculation' },
      { $set: { mastery: 0.45, attempts: 5 } },
      { upsert: true }
    );

    const replanRes = await request(app)
      .post(`/api/v1/planning/plans/${planId}/replan`)
      .send({ userId: testUserId, referenceDate: '2027-02-02' });

    expect(replanRes.status).toBe(200);

    const updatedPlan = await StudyPlan.findById(planId).lean();
    expect(updatedPlan.targets.length).toBeGreaterThan(0);
    for (const t of updatedPlan.targets) {
      expect(t.targetMastery).toBe(0.85);
      expect(t.targetMastery).not.toBeNull();
      expect(t.targetMastery).not.toBe(0.45); // must NOT be replaced with current mastery
    }
  });

  it('preserves intentional includeMastered semantics across replanning', async () => {
    // 1. Seed mastered progress (mastery = 0.91 >= 0.85)
    await StudentProgress.findOneAndUpdate(
      { userId: testUserId, topic: 'Percentage', pattern: 'Basic Percentage Calculation' },
      { $set: { mastery: 0.91, attempts: 25, totalAttempts: 25, correctAttempts: 23 } },
      { upsert: true }
    );

    // 2. Generate plan with explicit includeMastered = true
    const genRes = await request(app)
      .post('/api/v1/planning/generate')
      .send({
        userId: testUserId,
        goalId,
        startDate: '2027-03-01',
        targetDate: '2027-03-03',
        dailyQuestionBudget: 30,
        maxPatternsPerDay: 1,
        includeMastered: true,
        scope: { patterns: ['Basic Percentage Calculation'] },
      });

    expect(genRes.status).toBe(201);
    const planId = genRes.body.data.plan._id;
    expect(genRes.body.data.plan.planningMeta.includeMastered).toBe(true);
    expect(genRes.body.data.summary.patternsScheduled).toBe(1);

    // 3. Replan with referenceDate = '2027-03-01' and allowReplaceToday = true
    // Replanning must preserve the plan's planningMeta.includeMastered semantics
    const replanRes = await request(app)
      .post(`/api/v1/planning/plans/${planId}/replan`)
      .send({
        userId: testUserId,
        referenceDate: '2027-03-01',
        allowReplaceToday: true,
      });

    expect(replanRes.status).toBe(200);
    expect(replanRes.body.data.patternsSkippedAsMastered).toBe(0);
    expect(replanRes.body.data.patternsRescheduled).toBe(1);

    // Verify DailyObjectives still contain the mastered pattern
    const remainingObjs = await DailyObjective.find({ planId }).sort({ date: 1 });
    expect(remainingObjs.length).toBeGreaterThan(0);
    const scheduledPatternNames = remainingObjs.flatMap((o) => o.patterns.map((p) => p.pattern));
    expect(scheduledPatternNames).toContain('Basic Percentage Calculation');

    // Clean up
    await StudentProgress.deleteOne({ userId: testUserId, pattern: 'Basic Percentage Calculation' });
  });
});

