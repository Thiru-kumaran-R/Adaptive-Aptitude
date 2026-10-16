// src/services/api/attemptApi.ts
import { apiClient } from './apiClient';
import type {
  AttemptRecordRequestPayload,
  AttemptRecordWireResponse,
  AttemptListWireResponse,
} from '../../types/api';

/**
 * Operation 27: POST /api/v1/attempts
 */
export async function recordAttempt(
  payload: AttemptRecordRequestPayload
): Promise<AttemptRecordWireResponse> {
  return apiClient.post<AttemptRecordWireResponse>('/api/v1/attempts', payload);
}

/**
 * Operation 28: GET /api/v1/attempts/user/:userId
 */
export async function fetchUserAttempts(
  userId: string,
  params?: {
    page?: number;
    limit?: number;
    topic?: string;
    pattern?: string;
    questionId?: string;
    sessionId?: string;
  }
): Promise<AttemptListWireResponse> {
  return apiClient.get<AttemptListWireResponse>(
    `/api/v1/attempts/user/${userId}`,
    { params }
  );
}
