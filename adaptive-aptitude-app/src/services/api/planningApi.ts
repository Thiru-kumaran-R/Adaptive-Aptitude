// src/services/api/planningApi.ts
import { apiClient } from './apiClient';
import type {
  PlanPreviewRequestPayload,
  PlanPreviewWireResponse,
  PlanGenerateRequestPayload,
  PlanGenerateWireResponse,
  PlanReplanRequestPayload,
  PlanReplanWireResponse,
  PlanScheduleWireResponse,
  PlanListWireResponse,
  DailyObjectiveListWireResponse,
  DailyObjectivePatchPayload,
  DailyObjectivePatchWireResponse,
} from '../../types/api';

/**
 * Operation 20: POST /api/v1/planning/preview
 */
export async function previewPlan(
  payload: PlanPreviewRequestPayload
): Promise<PlanPreviewWireResponse> {
  return apiClient.post<PlanPreviewWireResponse>('/api/v1/planning/preview', payload);
}

/**
 * Operation 21: POST /api/v1/planning/generate
 */
export async function generatePlan(
  payload: PlanGenerateRequestPayload
): Promise<PlanGenerateWireResponse> {
  return apiClient.post<PlanGenerateWireResponse>('/api/v1/planning/generate', payload);
}

/**
 * Operation 22: POST /api/v1/planning/plans/:planId/replan
 */
export async function replanPlan(
  planId: string,
  payload: PlanReplanRequestPayload
): Promise<PlanReplanWireResponse> {
  return apiClient.post<PlanReplanWireResponse>(
    `/api/v1/planning/plans/${planId}/replan`,
    payload
  );
}

/**
 * Operation 23: GET /api/v1/planning/plans/:planId/schedule
 */
export async function fetchPlanSchedule(
  planId: string
): Promise<PlanScheduleWireResponse> {
  return apiClient.get<PlanScheduleWireResponse>(
    `/api/v1/planning/plans/${planId}/schedule`
  );
}

/**
 * Operation 24: GET /api/v1/study-plans/user/:userId
 */
export async function fetchUserPlans(
  userId: string,
  params?: { status?: string }
): Promise<PlanListWireResponse> {
  return apiClient.get<PlanListWireResponse>(
    `/api/v1/study-plans/user/${userId}`,
    { params }
  );
}

/**
 * Operation 25: GET /api/v1/daily-objectives/user/:userId
 */
export async function fetchUserDailyObjectives(
  userId: string,
  params?: { page?: number; limit?: number }
): Promise<DailyObjectiveListWireResponse> {
  return apiClient.get<DailyObjectiveListWireResponse>(
    `/api/v1/daily-objectives/user/${userId}`,
    { params }
  );
}

/**
 * Operation 26: PATCH /api/v1/daily-objectives/:id
 */
export async function patchDailyObjective(
  id: string,
  payload: DailyObjectivePatchPayload
): Promise<DailyObjectivePatchWireResponse> {
  return apiClient.patch<DailyObjectivePatchWireResponse>(
    `/api/v1/daily-objectives/${id}`,
    payload
  );
}
