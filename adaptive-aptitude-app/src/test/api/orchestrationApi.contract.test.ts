// src/test/api/orchestrationApi.contract.test.ts
import { describe, it, expect } from 'vitest';
import {
  fetchNextAction,
  fetchDailyAgenda,
  fetchInterventions,
  issuePrescription,
  activatePrescription,
  completePrescription,
} from '../../services/api/orchestrationApi';

describe('Orchestration & Attribution API Contract (Operations 53–57, 64)', () => {
  it('Operation 53: GET /api/v1/orchestration/next-action', async () => {
    const res = await fetchNextAction({ userId: 'user-test-123' });
    expect(res.success).toBe(true);
    expect(res.data.status).toBe('recommended');
    expect(res.data.nextAction?.actionType).toBe('targeted_drill');
  });

  it('Operation 54: GET /api/v1/orchestration/daily-agenda', async () => {
    const res = await fetchDailyAgenda({ userId: 'user-test-123' });
    expect(res.success).toBe(true);
    expect(res.data.status).toBe('active');
    expect(res.data.agenda?.segments.length).toBeGreaterThan(0);
  });

  it('Operation 55: GET /api/v1/orchestration/interventions', async () => {
    const res = await fetchInterventions({ userId: 'user-test-123' });
    expect(res.success).toBe(true);
    expect(res.data.status).toBe('active');
    expect(res.data.interventions.length).toBeGreaterThan(0);
  });

  it('Operation 64: POST /api/v1/attribution/prescriptions (with required Idempotency-Key)', async () => {
    const idempotencyKey = 'idemp-key-test-uuid-123';
    const res = await issuePrescription(
      {
        originSurface: 'next_action',
        goalId: 'goal-primary-001',
      },
      idempotencyKey
    );
    expect(res.success).toBe(true);
    expect(res.data.prescriptionId).toBe('presc-issued-999');
    expect(res.data.originSurface).toBe('next_action');
  });

  it('Operation 56: POST /api/v1/attribution/prescriptions/:prescriptionId/activate', async () => {
    const res = await activatePrescription('presc-issued-999');
    expect(res.success).toBe(true);
    expect(res.data.status).toBe('active');
  });

  it('Operation 57: POST /api/v1/attribution/prescriptions/:prescriptionId/complete', async () => {
    const res = await completePrescription('presc-issued-999');
    expect(res.success).toBe(true);
    expect(res.data.status).toBe('completed');
  });
});
