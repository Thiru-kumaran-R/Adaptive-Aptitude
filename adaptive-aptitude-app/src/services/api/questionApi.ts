// src/services/api/questionApi.ts
import { apiClient } from './apiClient';
import type {
  TopicListWireResponse,
  PatternListWireResponse,
  QuestionPaginatedWireResponse,
  QuestionRandomListWireResponse,
  QuestionDetailWireResponse,
} from '../../types/api';

/**
 * Operation 7: GET /api/v1/questions/topics
 */
export async function fetchTopics(): Promise<TopicListWireResponse> {
  return apiClient.get<TopicListWireResponse>('/api/v1/questions/topics');
}

/**
 * Operation 8: GET /api/v1/questions/topic/:topic/patterns
 */
export async function fetchPatternsByTopic(
  topic: string
): Promise<PatternListWireResponse> {
  return apiClient.get<PatternListWireResponse>(
    `/api/v1/questions/topic/${encodeURIComponent(topic)}/patterns`
  );
}

/**
 * Operation 9: GET /api/v1/questions/topic/:topic
 */
export async function fetchQuestionsByTopic(
  topic: string,
  params?: { page?: number; limit?: number }
): Promise<QuestionPaginatedWireResponse> {
  return apiClient.get<QuestionPaginatedWireResponse>(
    `/api/v1/questions/topic/${encodeURIComponent(topic)}`,
    { params }
  );
}

/**
 * Operation 10: GET /api/v1/questions/topic/:topic/pattern/:pattern
 */
export async function fetchQuestionsByPattern(
  topic: string,
  pattern: string,
  params?: { page?: number; limit?: number; difficulty?: number }
): Promise<QuestionPaginatedWireResponse> {
  return apiClient.get<QuestionPaginatedWireResponse>(
    `/api/v1/questions/topic/${encodeURIComponent(topic)}/pattern/${encodeURIComponent(pattern)}`,
    { params }
  );
}

/**
 * Operation 11: GET /api/v1/questions/topic/:topic/random
 */
export async function fetchRandomQuestionsByTopic(
  topic: string,
  params?: { limit?: number; difficulty?: number }
): Promise<QuestionRandomListWireResponse> {
  return apiClient.get<QuestionRandomListWireResponse>(
    `/api/v1/questions/topic/${encodeURIComponent(topic)}/random`,
    { params }
  );
}

/**
 * Operation 12: GET /api/v1/questions/topic/:topic/pattern/:pattern/random
 */
export async function fetchRandomQuestionsByPattern(
  topic: string,
  pattern: string,
  params?: { limit?: number; difficulty?: number }
): Promise<QuestionRandomListWireResponse> {
  return apiClient.get<QuestionRandomListWireResponse>(
    `/api/v1/questions/topic/${encodeURIComponent(topic)}/pattern/${encodeURIComponent(pattern)}/random`,
    { params }
  );
}

/**
 * Operation 13: GET /api/v1/questions/:id
 */
export async function fetchQuestionById(
  id: string
): Promise<QuestionDetailWireResponse> {
  return apiClient.get<QuestionDetailWireResponse>(`/api/v1/questions/${id}`);
}
