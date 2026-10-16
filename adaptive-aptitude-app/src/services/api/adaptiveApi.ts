// src/services/api/adaptiveApi.ts
import { apiClient } from './apiClient';
import type { AdaptiveNextQuestionWireResponse } from '../../types/api';

/**
 * Operation 34: GET /api/v1/adaptive/next-question
 */
export async function fetchAdaptiveNextQuestion(
  params?: { topic?: string; pattern?: string; planId?: string }
): Promise<AdaptiveNextQuestionWireResponse> {
  return apiClient.get<AdaptiveNextQuestionWireResponse>(
    '/api/v1/adaptive/next-question',
    { params }
  );
}
