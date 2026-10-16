// src/test/api/planningApi.contract.test.ts
import { describe, it, expect } from 'vitest';
import {
  previewPlan,
  generatePlan,
  replanPlan,
  fetchPlanSchedule,
  fetchUserPlans,
  fetchUserDailyObjectives,
  patchDailyObjective,
} from '../../services/api/planningApi';

describe('Planning API Contract (Operations 20–26)', () => {
  it('Operation 20: POST /api/v1/planning/preview', async () => {
    const res = await previewPlan({
      goalId: 'goal-primary-001',
      scope: { allCanonicalPatterns: true },
      dailyQuestionBudget: 20,
    });
    expect(res.success).toBe(true);
    expect(res.data.scheduledWorkload).toBe(600);
  });

  it('Operation 21: POST /api/v1/planning/generate', async () => {
    const res = await generatePlan({
      goalId: 'goal-primary-001',
      scope: { allCanonicalPatterns: true },
      dailyQuestionBudget: 20,
    });
    expect(res.success).toBe(true);
    expect(res.data.plan._id).toBe('plan-gen-001');
  });


  it('Operation 22: POST /api/v1/planning/plans/:planId/replan', async () => {
    const res = await replanPlan('plan-gen-001', {
      replaceToday: true,
    });
    expect(res.success).toBe(true);
    expect(res.data.planId).toBe('plan-gen-001');
  });


  it('Operation 23: GET /api/v1/planning/plans/:planId/schedule', async () => {
    const res = await fetchPlanSchedule('plan-gen-001');
    expect(res.success).toBe(true);
    expect(res.data.objectives.length).toBeGreaterThan(0);
  });

  it('Operation 24: GET /api/v1/study-plans/user/:userId', async () => {
    const res = await fetchUserPlans('user-test-123');
    expect(res.success).toBe(true);
    expect(res.data.length).toBeGreaterThan(0);
  });

  it('Operation 25: GET /api/v1/daily-objectives/user/:userId', async () => {
    const res = await fetchUserDailyObjectives('user-test-123');
    expect(res.success).toBe(true);
    expect(res.data.length).toBeGreaterThan(0);
  });

  it('Operation 26: PATCH /api/v1/daily-objectives/:id', async () => {
    const res = await patchDailyObjective('obj-daily-001', {
      status: 'completed',
    });
    expect(res.success).toBe(true);
    expect(res.data.status).toBe('completed');
  });
});
