// src/services/api/mockApi.ts
import { apiClient } from './apiClient';
import type {
  MockBlueprintListWireResponse,
  MockSessionCreateRequestPayload,
  MockSessionCreateWireResponse,
  MockSessionStartWireResponse,
  MockSessionDetailWireResponse,
  MockQuestionWireResponse,
  MockResponseSavePayload,
  MockResponseSaveWireResponse,
  MockSectionCompleteWireResponse,
  MockSubmitWireResponse,
  MockSessionAbandonWireResponse,
  MockResultWireResponse,
  MockReviewWireResponse,
} from '../../types/api';

/**
 * Operation 38: GET /api/v1/mock-blueprints
 */
export async function fetchMockBlueprints(): Promise<MockBlueprintListWireResponse> {
  return apiClient.get<MockBlueprintListWireResponse>('/api/v1/mock-blueprints');
}

/**
 * Operation 39: POST /api/v1/mock-sessions
 */
export async function createMockSession(
  payload: MockSessionCreateRequestPayload
): Promise<MockSessionCreateWireResponse> {
  return apiClient.post<MockSessionCreateWireResponse>(
    '/api/v1/mock-sessions',
    payload
  );
}

/**
 * Operation 40: POST /api/v1/mock-sessions/:id/start
 */
export async function startMockSession(
  id: string
): Promise<MockSessionStartWireResponse> {
  return apiClient.post<MockSessionStartWireResponse>(
    `/api/v1/mock-sessions/${id}/start`
  );
}

/**
 * Operation 41: GET /api/v1/mock-sessions/:id
 */
export async function fetchMockSession(
  id: string
): Promise<MockSessionDetailWireResponse> {
  return apiClient.get<MockSessionDetailWireResponse>(
    `/api/v1/mock-sessions/${id}`
  );
}

/**
 * Operation 42: GET /api/v1/mock-sessions/:id/questions/:questionId
 */
export async function fetchMockQuestion(
  id: string,
  questionId: string
): Promise<MockQuestionWireResponse> {
  return apiClient.get<MockQuestionWireResponse>(
    `/api/v1/mock-sessions/${id}/questions/${questionId}`
  );
}

/**
 * Operation 43: POST /api/v1/mock-sessions/:id/responses
 */
export async function saveMockResponse(
  id: string,
  payload: MockResponseSavePayload
): Promise<MockResponseSaveWireResponse> {
  return apiClient.post<MockResponseSaveWireResponse>(
    `/api/v1/mock-sessions/${id}/responses`,
    payload
  );
}

/**
 * Operation 44: POST /api/v1/mock-sessions/:id/sections/:sectionId/complete
 */
export async function completeMockSection(
  id: string,
  sectionId: string
): Promise<MockSectionCompleteWireResponse> {
  return apiClient.post<MockSectionCompleteWireResponse>(
    `/api/v1/mock-sessions/${id}/sections/${sectionId}/complete`
  );
}

/**
 * Operation 45: POST /api/v1/mock-sessions/:id/submit
 */
export async function submitMockSession(
  id: string
): Promise<MockSubmitWireResponse> {
  return apiClient.post<MockSubmitWireResponse>(
    `/api/v1/mock-sessions/${id}/submit`
  );
}

/**
 * Operation 46: POST /api/v1/mock-sessions/:id/abandon
 */
export async function abandonMockSession(
  id: string
): Promise<MockSessionAbandonWireResponse> {
  return apiClient.post<MockSessionAbandonWireResponse>(
    `/api/v1/mock-sessions/${id}/abandon`
  );
}

/**
 * Operation 47: GET /api/v1/mock-sessions/:id/result
 */
export async function fetchMockResult(
  id: string
): Promise<MockResultWireResponse> {
  return apiClient.get<MockResultWireResponse>(
    `/api/v1/mock-sessions/${id}/result`
  );
}

/**
 * Operation 48: GET /api/v1/mock-sessions/:id/review
 */
export async function fetchMockReview(
  id: string
): Promise<MockReviewWireResponse> {
  return apiClient.get<MockReviewWireResponse>(
    `/api/v1/mock-sessions/${id}/review`
  );
}
