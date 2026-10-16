// src/test/api/goalApi.contract.test.ts
import { describe, it, expect } from 'vitest';
import {
  fetchUserProfile,
  fetchUserGoals,
  createGoal,
  fetchGoalById,
  patchGoal,
  deleteGoal,
} from '../../services/api/goalApi';

describe('Goal & User API Contract (Operations 14–19)', () => {
  it('Operation 14: GET /api/v1/users/:userId', async () => {
    const res = await fetchUserProfile('user-test-123');
    expect(res.success).toBe(true);
    expect(res.data.userId).toBe('user-test-123');
  });

  it('Operation 15: GET /api/v1/goals/user/:userId', async () => {
    const res = await fetchUserGoals('user-test-123');
    expect(res.success).toBe(true);
    expect(res.data.length).toBeGreaterThan(0);
    expect(res.data[0]._id).toBe('goal-primary-001');
  });

  it('Operation 16: POST /api/v1/goals', async () => {
    const res = await createGoal({
      title: 'Target CAT Examination',
      type: 'exam_prep',
    });
    expect(res.success).toBe(true);
    expect(res.data._id).toBeDefined();
    expect(res.data.status).toBe('active');
  });

  it('Operation 17: GET /api/v1/goals/:id', async () => {
    const res = await fetchGoalById('goal-primary-001');
    expect(res.success).toBe(true);
    expect(res.data._id).toBe('goal-primary-001');
  });

  it('Operation 18: PATCH /api/v1/goals/:id', async () => {
    const res = await patchGoal('goal-primary-001', {
      title: 'Updated Target CAT Examination',
    });
    expect(res.success).toBe(true);
    expect(res.data.title).toBe('Updated Target CAT Examination');
  });

  it('Operation 19: DELETE /api/v1/goals/:id', async () => {
    const res = await deleteGoal('goal-primary-001');
    expect(res.success).toBe(true);
    expect(res.data.deleted).toBe(true);
  });
});
