// src/services/api/learningApi.ts
import { apiClient } from './apiClient';
import type {
  LearningTutorRequestPayload,
  TutorWireResponse,
  LearningHintRequestPayload,
  HintWireResponse,
  LearningExplainAttemptPayload,
  ExplainAttemptWireResponse,
  LearningExplainProgressPayload,
  ExplainProgressWireResponse,
  LearningExplainPlanPayload,
  ExplainPlanWireResponse,
  LearningMockReviewPayload,
  LearningMockReviewWireResponse,
} from '../../types/api';

/**
 * Operation 58: POST /api/v1/learning/tutor
 */
export async function requestTutorGuidance(
  payload: LearningTutorRequestPayload
): Promise<TutorWireResponse> {
  return apiClient.post<TutorWireResponse>('/api/v1/learning/tutor', payload);
}

/**
 * Operation 59: POST /api/v1/learning/hint
 */
export async function requestQuestionHint(
  payload: LearningHintRequestPayload
): Promise<HintWireResponse> {
  return apiClient.post<HintWireResponse>('/api/v1/learning/hint', payload);
}

/**
 * Operation 60: POST /api/v1/learning/explain-attempt
 */
export async function requestAttemptExplanation(
  payload: LearningExplainAttemptPayload
): Promise<ExplainAttemptWireResponse> {
  return apiClient.post<ExplainAttemptWireResponse>(
    '/api/v1/learning/explain-attempt',
    payload
  );
}

/**
 * Operation 61: POST /api/v1/learning/explain-progress
 */
export async function requestProgressExplanation(
  payload: LearningExplainProgressPayload
): Promise<ExplainProgressWireResponse> {
  return apiClient.post<ExplainProgressWireResponse>(
    '/api/v1/learning/explain-progress',
    payload
  );
}

/**
 * Operation 62: POST /api/v1/learning/explain-plan
 */
export async function requestPlanExplanation(
  payload: LearningExplainPlanPayload
): Promise<ExplainPlanWireResponse> {
  return apiClient.post<ExplainPlanWireResponse>(
    '/api/v1/learning/explain-plan',
    payload
  );
}

/**
 * Operation 63: POST /api/v1/learning/mock-review
 */
export async function requestMockDebrief(
  payload: LearningMockReviewPayload
): Promise<LearningMockReviewWireResponse> {
  return apiClient.post<LearningMockReviewWireResponse>(
    '/api/v1/learning/mock-review',
    payload
  );
}
