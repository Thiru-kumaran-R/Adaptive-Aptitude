// src/services/api/analyticsApi.ts
import { apiClient } from './apiClient';
import type {
  AnalyticsDashboardWireResponse,
  CognitiveProfileWireResponse,
  RetentionAnalyticsWireResponse,
  ExamReadinessWireResponse,
} from '../../types/api';

/**
 * Operation 49: GET /api/v1/analytics/dashboard
 */
export async function fetchAnalyticsDashboard(
  params: { userId: string }
): Promise<AnalyticsDashboardWireResponse> {
  return apiClient.get<AnalyticsDashboardWireResponse>(
    '/api/v1/analytics/dashboard',
    { params }
  );
}

/**
 * Operation 50: GET /api/v1/analytics/cognitive-profile
 */
export async function fetchCognitiveProfile(
  params: { userId: string; windowDays?: number; topic?: string }
): Promise<CognitiveProfileWireResponse> {
  return apiClient.get<CognitiveProfileWireResponse>(
    '/api/v1/analytics/cognitive-profile',
    { params }
  );
}

/**
 * Operation 51: GET /api/v1/analytics/retention
 */
export async function fetchRetentionAnalytics(
  params: { userId: string }
): Promise<RetentionAnalyticsWireResponse> {
  return apiClient.get<RetentionAnalyticsWireResponse>(
    '/api/v1/analytics/retention',
    { params }
  );
}

/**
 * Operation 52: GET /api/v1/analytics/readiness/:goalId
 */
export async function fetchExamReadiness(
  goalId: string,
  params: { userId: string }
): Promise<ExamReadinessWireResponse> {
  return apiClient.get<ExamReadinessWireResponse>(
    `/api/v1/analytics/readiness/${goalId}`,
    { params }
  );
}
