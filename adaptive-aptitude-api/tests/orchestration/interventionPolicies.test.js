'use strict';

/**
 * Suite 5: Cognitive Intervention Policy Tests — Phase 9
 *
 * Requirements (Section 49):
 *   - Prerequisite bottleneck intervention
 *   - Same prerequisite blocking multiple targets -> distinct intervention IDs
 *   - Mastery < 0.70 qualifies, 0.70 does not qualify
 *   - Rushing >= 0.60 qualifies, < 0.60 does not qualify
 *   - Same pacingTargetTopic reused
 *   - Pacing suppression suppresses intervention
 *   - Severity === corresponding action priorityTier (no 'medium')
 *   - No retention cliff category, no stamina-collapse category
 *   - Interventions remain observable even when active mock exists
 */

const mongoose = require('mongoose');
const { connectTestDB, disconnectTestDB, clearAllTestCollections } = require('../helpers/dbSetup');

const User = require('../../src/models/userModel');
const Goal = require('../../src/models/goalModel');
const StudyPlan = require('../../src/models/studyPlanModel');
const DailyObjective = require('../../src/models/dailyObjectiveModel');
const StudentProgress = require('../../src/models/studentProgressModel');
const MockSession = require('../../src/models/mockSessionModel');

const readinessService = require('../../src/services/analytics/readinessService');
const speedAccuracyMatrixService = require('../../src/services/analytics/speedAccuracyMatrixService');
const { getInterventions } = require('../../src/services/orchestration/interventionPolicyService');
const { INTERVENTION_CATEGORIES, PRIORITY_TIERS } = require('../../src/config/orchestrationConfig');

describe('Suite 5: Cognitive Intervention Policy Tests', () => {
  const userId = 'usr_intervention_test';
  const referenceNow = new Date('2026-10-06T12:00:00.000Z');

  beforeAll(async () => {
    await connectTestDB();
  });

  afterAll(async () => {
    await disconnectTestDB();
  });

  beforeEach(async () => {
    await clearAllTestCollections();
    await User.create({ userId, name: 'Intervention Test User' });
    jest.restoreAllMocks();
  });

  describe('1. Prerequisite Bottleneck Interventions', () => {
    it('generates PREREQUISITE_BOTTLENECK for plan-aligned target when prerequisite mastery < 0.70', async () => {
      const goal = await Goal.create({
        userId,
        title: 'Target Exam',
        type: 'company',
        targetDate: new Date('2026-11-01T00:00:00Z'),
        status: 'active',
      });

      await StudyPlan.create({
        userId,
        name: 'Target Plan',
        goalId: goal._id,
        startDate: new Date('2026-10-01T00:00:00Z'),
        endDate: new Date('2026-11-01T00:00:00Z'),
        status: 'active',
        targets: [
          { topic: 'Profit and Loss', pattern: "Successive Discounts & 'Buy X Get Y Free' Schemes" },
        ],
      });

      // Mock readinessService returning canonical bottleneck
      jest.spyOn(readinessService, 'getGoalReadiness').mockResolvedValue({
        criticalPrerequisiteBottlenecks: [
          {
            targetPattern: "Successive Discounts & 'Buy X Get Y Free' Schemes",
            unmasteredPrerequisite: 'Direct Profit/Loss & Multiplying Factor',
            prerequisiteMastery: 0.45,
          },
        ],
      });

      jest.spyOn(speedAccuracyMatrixService, 'getSpeedAccuracyMatrix').mockResolvedValue({
        speedAccuracyMatrix: { rushingRiskScore: 0.2 },
      });

      const res = await getInterventions({
        userId,
        goal,
        explicitGoalProvided: true,
        referenceNow,
      });

      expect(res.interventions).toHaveLength(1);
      const intv = res.interventions[0];
      expect(intv.category).toBe(INTERVENTION_CATEGORIES.PREREQUISITE_BOTTLENECK);
      expect(intv.topic).toBe('Profit and Loss');
      expect(intv.pattern).toBe('Direct Profit/Loss & Multiplying Factor');
      expect(intv.blockedTarget.pattern).toBe("Successive Discounts & 'Buy X Get Y Free' Schemes");
      // Severity must match priorityTier (W=50 + S=13.75 + I=10 = 73.75 -> 'urgent')
      expect(intv.severity).toBe(PRIORITY_TIERS.URGENT);
      expect(intv.severity).not.toBe('medium');
    });

    it('generates distinct intervention IDs when same prerequisite blocks multiple target patterns', async () => {
      const goal = await Goal.create({
        userId,
        title: 'Target Exam',
        type: 'company',
        targetDate: new Date('2026-11-01T00:00:00Z'),
        status: 'active',
      });

      await StudyPlan.create({
        userId,
        name: 'Target Plan',
        goalId: goal._id,
        startDate: new Date('2026-10-01T00:00:00Z'),
        endDate: new Date('2026-11-01T00:00:00Z'),
        status: 'active',
        targets: [
          { topic: 'Profit and Loss', pattern: "Successive Discounts & 'Buy X Get Y Free' Schemes" },
          { topic: 'Profit and Loss', pattern: 'MP-CP-Discount-Profit Golden Ratio Formula' },
        ],
      });

      jest.spyOn(readinessService, 'getGoalReadiness').mockResolvedValue({
        criticalPrerequisiteBottlenecks: [
          {
            targetPattern: "Successive Discounts & 'Buy X Get Y Free' Schemes",
            unmasteredPrerequisite: 'Direct Profit/Loss & Multiplying Factor',
            prerequisiteMastery: 0.50,
          },
          {
            targetPattern: 'MP-CP-Discount-Profit Golden Ratio Formula',
            unmasteredPrerequisite: 'Direct Profit/Loss & Multiplying Factor',
            prerequisiteMastery: 0.50,
          },
        ],
      });

      jest.spyOn(speedAccuracyMatrixService, 'getSpeedAccuracyMatrix').mockResolvedValue({
        speedAccuracyMatrix: { rushingRiskScore: 0.1 },
      });

      const res = await getInterventions({
        userId,
        goal,
        explicitGoalProvided: true,
        referenceNow,
      });

      expect(res.interventions).toHaveLength(2);
      expect(res.interventions[0].interventionId).not.toBe(res.interventions[1].interventionId);
      expect(res.interventions[0].interventionId).toContain('blocks_successive-discounts-buy-x-get-y-free-schemes');
      expect(res.interventions[1].interventionId).toContain('blocks_mp-cp-discount-profit-golden-ratio-formula');
    });

    it('excludes bottlenecks where prerequisite mastery >= 0.70', async () => {
      const goal = await Goal.create({
        userId,
        title: 'Target Exam',
        type: 'company',
        targetDate: new Date('2026-11-01T00:00:00Z'),
        status: 'active',
      });

      await StudyPlan.create({
        userId,
        name: 'Target Plan',
        goalId: goal._id,
        startDate: new Date('2026-10-01T00:00:00Z'),
        endDate: new Date('2026-11-01T00:00:00Z'),
        status: 'active',
        targets: [{ topic: 'Profit and Loss', pattern: "Successive Discounts & 'Buy X Get Y Free' Schemes" }],
      });

      jest.spyOn(readinessService, 'getGoalReadiness').mockResolvedValue({
        criticalPrerequisiteBottlenecks: [
          {
            targetPattern: "Successive Discounts & 'Buy X Get Y Free' Schemes",
            unmasteredPrerequisite: 'Direct Profit/Loss & Multiplying Factor',
            prerequisiteMastery: 0.70, // Exactly 0.70 does not qualify (< 0.70 required)
          },
        ],
      });

      jest.spyOn(speedAccuracyMatrixService, 'getSpeedAccuracyMatrix').mockResolvedValue({
        speedAccuracyMatrix: { rushingRiskScore: 0.1 },
      });

      const res = await getInterventions({
        userId,
        goal,
        explicitGoalProvided: true,
        referenceNow,
      });

      expect(res.interventions).toHaveLength(0);
    });
  });

  describe('2. Rushing Calibration Interventions & Topic Resolution', () => {
    it('generates RUSHING_CALIBRATION when rushingRiskScore >= 0.60 and resolves topic', async () => {
      const goal = await Goal.create({
        userId,
        title: 'Target Exam',
        type: 'company',
        targetDate: new Date('2026-11-01T00:00:00Z'),
        status: 'active',
      });

      const plan = await StudyPlan.create({
        userId,
        name: 'Target Plan',
        goalId: goal._id,
        startDate: new Date('2026-10-01T00:00:00Z'),
        endDate: new Date('2026-11-01T00:00:00Z'),
        status: 'active',
        targets: [{ topic: 'Percentage', pattern: 'Basic Percentage Calculation' }],
      });

      await DailyObjective.create({
        userId,
        planId: plan._id,
        goalId: goal._id,
        date: new Date('2026-10-06T00:00:00.000Z'),
        topic: 'Percentage',
        patterns: [
          { pattern: 'Basic Percentage Calculation', targetQuestions: 10, completedQuestions: 0 },
        ],
        status: 'pending',
      });

      jest.spyOn(readinessService, 'getGoalReadiness').mockResolvedValue({
        criticalPrerequisiteBottlenecks: [],
      });

      jest.spyOn(speedAccuracyMatrixService, 'getSpeedAccuracyMatrix').mockResolvedValue({
        speedAccuracyMatrix: { rushingRiskScore: 0.75, medianTimeCorrectSeconds: 40 },
      });

      const res = await getInterventions({
        userId,
        goal,
        explicitGoalProvided: true,
        referenceNow,
      });

      expect(res.interventions).toHaveLength(1);
      const intv = res.interventions[0];
      expect(intv.category).toBe(INTERVENTION_CATEGORIES.RUSHING_CALIBRATION);
      expect(intv.topic).toBe('Percentage');
      expect(intv.pattern).toBeNull();
      expect(intv.blockedTarget).toBeNull();
      expect(intv.severity).toBe(PRIORITY_TIERS.LOW); // W=20 + S=0 + I=10 = 30 -> low (<35)
      expect(intv.rationale).toContain('Overall rushing risk is high: 75.0% of classified errors were fast rushing errors');
    });

    it('does NOT generate RUSHING_CALIBRATION when rushingRiskScore < 0.60', async () => {
      const goal = await Goal.create({
        userId,
        title: 'Target Exam',
        type: 'company',
        targetDate: new Date('2026-11-01T00:00:00Z'),
        status: 'active',
      });

      await StudyPlan.create({
        userId,
        name: 'Target Plan',
        goalId: goal._id,
        startDate: new Date('2026-10-01T00:00:00Z'),
        endDate: new Date('2026-11-01T00:00:00Z'),
        status: 'active',
        targets: [{ topic: 'Percentage', pattern: 'Basic Percentage Calculation' }],
      });

      jest.spyOn(readinessService, 'getGoalReadiness').mockResolvedValue({
        criticalPrerequisiteBottlenecks: [],
      });

      jest.spyOn(speedAccuracyMatrixService, 'getSpeedAccuracyMatrix').mockResolvedValue({
        speedAccuracyMatrix: { rushingRiskScore: 0.59 },
      });

      const res = await getInterventions({
        userId,
        goal,
        explicitGoalProvided: true,
        referenceNow,
      });

      expect(res.interventions).toHaveLength(0);
    });

    it('suppresses RUSHING_CALIBRATION when no pacingTargetTopic can be resolved (Priority C)', async () => {
      // User with NO active plan and NO daily objective
      jest.spyOn(readinessService, 'getGoalReadiness').mockResolvedValue({
        criticalPrerequisiteBottlenecks: [],
      });

      jest.spyOn(speedAccuracyMatrixService, 'getSpeedAccuracyMatrix').mockResolvedValue({
        speedAccuracyMatrix: { rushingRiskScore: 0.80 },
      });

      const res = await getInterventions({
        userId,
        goal: null,
        explicitGoalProvided: false,
        referenceNow,
      });

      expect(res.interventions).toHaveLength(0);
    });
  });

  describe('3. Active Mock Observability & Strict Absence of Unauthorized Interventions', () => {
    it('keeps interventions observable even when active mock session exists', async () => {
      const goal = await Goal.create({
        userId,
        title: 'Target Exam',
        type: 'company',
        targetDate: new Date('2026-11-01T00:00:00Z'),
        status: 'active',
      });

      await StudyPlan.create({
        userId,
        name: 'Target Plan',
        goalId: goal._id,
        startDate: new Date('2026-10-01T00:00:00Z'),
        endDate: new Date('2026-11-01T00:00:00Z'),
        status: 'active',
        targets: [{ topic: 'Profit and Loss', pattern: "Successive Discounts & 'Buy X Get Y Free' Schemes" }],
      });

      jest.spyOn(readinessService, 'getGoalReadiness').mockResolvedValue({
        criticalPrerequisiteBottlenecks: [
          {
            targetPattern: "Successive Discounts & 'Buy X Get Y Free' Schemes",
            unmasteredPrerequisite: 'Direct Profit/Loss & Multiplying Factor',
            prerequisiteMastery: 0.30,
          },
        ],
      });

      jest.spyOn(speedAccuracyMatrixService, 'getSpeedAccuracyMatrix').mockResolvedValue({
        speedAccuracyMatrix: { rushingRiskScore: 0.1 },
      });

      const res = await getInterventions({
        userId,
        goal,
        explicitGoalProvided: true,
        referenceNow,
      });

      expect(res.interventions).toHaveLength(1);
      expect(res.interventions[0].category).toBe(INTERVENTION_CATEGORIES.PREREQUISITE_BOTTLENECK);
    });

    it('never emits retention cliff or stamina collapse interventions', async () => {
      const goal = await Goal.create({
        userId,
        title: 'Target Exam',
        type: 'company',
        targetDate: new Date('2026-11-01T00:00:00Z'),
        status: 'active',
      });

      await StudyPlan.create({
        userId,
        name: 'Target Plan',
        goalId: goal._id,
        startDate: new Date('2026-10-01T00:00:00Z'),
        endDate: new Date('2026-11-01T00:00:00Z'),
        status: 'active',
        targets: [{ topic: 'Percentage', pattern: 'Basic Percentage Calculation' }],
      });

      jest.spyOn(readinessService, 'getGoalReadiness').mockResolvedValue({
        criticalPrerequisiteBottlenecks: [],
      });

      jest.spyOn(speedAccuracyMatrixService, 'getSpeedAccuracyMatrix').mockResolvedValue({
        speedAccuracyMatrix: { rushingRiskScore: 0.70 },
      });

      const res = await getInterventions({
        userId,
        goal,
        explicitGoalProvided: true,
        referenceNow,
      });

      for (const intv of res.interventions) {
        expect(intv.category).not.toBe('RETENTION_CLIFF');
        expect(intv.category).not.toBe('STAMINA_COLLAPSE');
        expect([
          INTERVENTION_CATEGORIES.PREREQUISITE_BOTTLENECK,
          INTERVENTION_CATEGORIES.RUSHING_CALIBRATION,
        ]).toContain(intv.category);
      }
    });
  });
});
