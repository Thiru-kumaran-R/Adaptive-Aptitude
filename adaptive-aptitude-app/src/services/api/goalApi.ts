// src/services/api/goalApi.ts
import { apiClient } from './apiClient';
import type {
  UserGetWireResponse,
  GoalListWireResponse,
  GoalCreateRequestPayload,
  GoalCreateWireResponse,
  GoalDetailWireResponse,
  GoalPatchRequestPayload,
  GoalPatchWireResponse,
  GoalDeleteWireResponse,
} from '../../types/api';

/**
 * Operation 14: GET /api/v1/users/:userId
 */
export async function fetchUserProfile(
  userId: string
): Promise<UserGetWireResponse> {
  return apiClient.get<UserGetWireResponse>(`/api/v1/users/${userId}`);
}

/**
 * Operation 15: GET /api/v1/goals/user/:userId
 */
export async function fetchUserGoals(
  userId: string
): Promise<GoalListWireResponse> {
  return apiClient.get<GoalListWireResponse>(`/api/v1/goals/user/${userId}`);
}

/**
 * Operation 16: POST /api/v1/goals
 */
export async function createGoal(
  payload: GoalCreateRequestPayload
): Promise<GoalCreateWireResponse> {
  return apiClient.post<GoalCreateWireResponse>('/api/v1/goals', payload);
}

/**
 * Operation 17: GET /api/v1/goals/:id
 */
export async function fetchGoalById(
  id: string
): Promise<GoalDetailWireResponse> {
  return apiClient.get<GoalDetailWireResponse>(`/api/v1/goals/${id}`);
}

/**
 * Operation 18: PATCH /api/v1/goals/:id
 */
export async function patchGoal(
  id: string,
  payload: GoalPatchRequestPayload
): Promise<GoalPatchWireResponse> {
  return apiClient.patch<GoalPatchWireResponse>(`/api/v1/goals/${id}`, payload);
}

/**
 * Operation 19: DELETE /api/v1/goals/:id
 */
export async function deleteGoal(
  id: string
): Promise<GoalDeleteWireResponse> {
  return apiClient.delete<GoalDeleteWireResponse>(`/api/v1/goals/${id}`);
}
