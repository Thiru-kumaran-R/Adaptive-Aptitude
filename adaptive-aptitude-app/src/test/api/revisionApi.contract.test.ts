// src/test/api/revisionApi.contract.test.ts
import { describe, it, expect } from 'vitest';
import {
  fetchRevisionDue,
  fetchRevisionPlan,
  rebuildRevisionQueue,
} from '../../services/api/revisionApi';

describe('Spaced Revision API Contract (Operations 35–37)', () => {
  it('Operation 35: GET /api/v1/revisions/due', async () => {
    const res = await fetchRevisionDue();
    expect(res.success).toBe(true);
    expect(res.data.length).toBeGreaterThan(0);
    expect(res.data[0].pattern).toBe('Percentages');
  });

  it('Operation 36: GET /api/v1/revisions/plan', async () => {
    const res = await fetchRevisionPlan({ days: 1 });
    expect(res.success).toBe(true);
    expect(res.data.days).toBe(1);
    expect(res.data.projections.length).toBeGreaterThan(0);
  });

  it('Operation 37: POST /api/v1/revisions/rebuild', async () => {
    const res = await rebuildRevisionQueue({});
    expect(res.success).toBe(true);
    expect(res.message).toBeDefined();
  });
});
