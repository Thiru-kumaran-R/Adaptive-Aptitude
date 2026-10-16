// src/services/api/progressApi.ts
import { apiClient } from './apiClient';
import type {
  StudentProgressWireResponse,
  TopicMasteryWireResponse,
  PatternMasteryWireResponse,
  WeakestPatternsWireResponse,
  PrerequisiteGraphWireResponse,
} from '../../types/api';

/**
 * Operation 29: GET /api/v1/progress/:userId
 */
export async function fetchOverallProgress(
  userId: string,
  params?: { page?: number; limit?: number; sortBy?: string; sortDir?: string }
): Promise<StudentProgressWireResponse> {
  return apiClient.get<StudentProgressWireResponse>(`/api/v1/progress/${userId}`, {
    params,
  });
}

/**
 * Operation 30: GET /api/v1/progress/:userId/topics
 */
export async function fetchTopicMastery(
  userId: string,
  params?: { topic?: string }
): Promise<TopicMasteryWireResponse> {
  return apiClient.get<TopicMasteryWireResponse>(
    `/api/v1/progress/${userId}/topics`,
    { params }
  );
}

/**
 * Operation 31: GET /api/v1/progress/:userId/patterns (topic is REQUIRED)
 */
export async function fetchPatternMastery(
  userId: string,
  params: { topic: string }
): Promise<PatternMasteryWireResponse> {
  return apiClient.get<PatternMasteryWireResponse>(
    `/api/v1/progress/${userId}/patterns`,
    { params }
  );
}

/**
 * Operation 32: GET /api/v1/progress/:userId/weakest
 */
export async function fetchWeakestPatterns(
  userId: string,
  params?: { topic?: string; limit?: number }
): Promise<WeakestPatternsWireResponse> {
  return apiClient.get<WeakestPatternsWireResponse>(
    `/api/v1/progress/${userId}/weakest`,
    { params }
  );
}

/**
 * Operation 33: GET /api/v1/progress/prerequisites/:patternName
 */
export async function fetchPrerequisites(
  patternName: string
): Promise<PrerequisiteGraphWireResponse> {
  return apiClient.get<PrerequisiteGraphWireResponse>(
    `/api/v1/progress/prerequisites/${encodeURIComponent(patternName)}`
  );
}
