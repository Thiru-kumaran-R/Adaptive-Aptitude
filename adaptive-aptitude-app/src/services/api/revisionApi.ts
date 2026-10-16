// src/services/api/revisionApi.ts
import { apiClient } from './apiClient';
import type {
  RevisionDueListWireResponse,
  RevisionPlanWireResponse,
  RevisionRebuildRequestPayload,
  RevisionRebuildWireResponse,
} from '../../types/api';

/**
 * Operation 35: GET /api/v1/revisions/due
 */
export async function fetchRevisionDue(
  params?: {
    date?: string;
    referenceDate?: string;
    topic?: string;
    planId?: string;
    goalId?: string;
    limit?: number;
  }
): Promise<RevisionDueListWireResponse> {
  return apiClient.get<RevisionDueListWireResponse>('/api/v1/revisions/due', {
    params,
  });
}

/**
 * Operation 36: GET /api/v1/revisions/plan
 */
export async function fetchRevisionPlan(
  params?: {
    days?: 1 | 2;
    questionBudget?: number;
    patternsPerDay?: number;
    referenceDate?: string;
    date?: string;
    topic?: string;
    planId?: string;
    goalId?: string;
  }
): Promise<RevisionPlanWireResponse> {
  return apiClient.get<RevisionPlanWireResponse>('/api/v1/revisions/plan', {
    params,
  });
}

/**
 * Operation 37: POST /api/v1/revisions/rebuild
 */
export async function rebuildRevisionQueue(
  payload: RevisionRebuildRequestPayload
): Promise<RevisionRebuildWireResponse> {
  return apiClient.post<RevisionRebuildWireResponse>(
    '/api/v1/revisions/rebuild',
    payload
  );
}
