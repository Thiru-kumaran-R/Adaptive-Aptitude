// src/test/api/analyticsApi.contract.test.ts
import { describe, it, expect } from 'vitest';
import {
  fetchAnalyticsDashboard,
  fetchCognitiveProfile,
  fetchRetentionAnalytics,
  fetchExamReadiness,
} from '../../services/api/analyticsApi';

describe('Analytics API Contract (Operations 49–52)', () => {
  it('Operation 49: GET /api/v1/analytics/dashboard', async () => {
    const res = await fetchAnalyticsDashboard({ userId: 'user-test-123' });
    expect(res.success).toBe(true);
    expect(res.data.summary.totalPracticeAttempts).toBe(85);
    expect(res.data.topicMasteryRadar.length).toBeGreaterThan(0);
  });

  it('Operation 50: GET /api/v1/analytics/cognitive-profile', async () => {
    const res = await fetchCognitiveProfile({ userId: 'user-test-123' });
    expect(res.success).toBe(true);
    expect(res.data.speedAccuracyMatrix.quadrantCounts.accurateAndFast).toBe(45);
    expect(res.data.staminaCurve?.quartileAccuracy.length).toBe(4);
  });

  it('Operation 51: GET /api/v1/analytics/retention', async () => {
    const res = await fetchRetentionAnalytics({ userId: 'user-test-123' });
    expect(res.success).toBe(true);
    expect(res.data.currentState.stageDistribution.stage0_1day).toBe(4);
    expect(res.data.observedRetentionByGap.length).toBeGreaterThan(0);
  });

  it('Operation 52: GET /api/v1/analytics/readiness/:goalId', async () => {
    const res = await fetchExamReadiness('goal-primary-001', { userId: 'user-test-123' });
    expect(res.success).toBe(true);
    expect(res.data.goalId).toBe('goal-primary-001');
    expect(res.data.readinessScore).toBe(0.74);
  });
});
