// src/services/api/authApi.ts
import { apiClient } from './apiClient';
import type {
  RegisterRequestPayload,
  AuthRegisterWireResponse,
  LoginRequestPayload,
  AuthLoginWireResponse,
  AuthRefreshWireResponse,
  AuthLogoutWireResponse,
  AuthRevokeAllWireResponse,
  AuthMeWireResponse,
} from '../../types/api';

/**
 * Operation 1: POST /api/v1/auth/register
 */
export async function registerLearner(
  payload: RegisterRequestPayload
): Promise<AuthRegisterWireResponse> {
  return apiClient.post<AuthRegisterWireResponse>('/api/v1/auth/register', payload);
}

/**
 * Operation 2: POST /api/v1/auth/login
 */
export async function loginLearner(
  payload: LoginRequestPayload
): Promise<AuthLoginWireResponse> {
  return apiClient.post<AuthLoginWireResponse>('/api/v1/auth/login', payload);
}

/**
 * Operation 3: POST /api/v1/auth/refresh
 */
export async function refreshSession(): Promise<AuthRefreshWireResponse> {
  return apiClient.post<AuthRefreshWireResponse>('/api/v1/auth/refresh');
}

/**
 * Operation 4: POST /api/v1/auth/logout
 */
export async function logoutLearner(): Promise<AuthLogoutWireResponse> {
  return apiClient.post<AuthLogoutWireResponse>('/api/v1/auth/logout');
}

/**
 * Operation 5: POST /api/v1/auth/revoke-all
 */
export async function revokeAllSessions(): Promise<AuthRevokeAllWireResponse> {
  return apiClient.post<AuthRevokeAllWireResponse>('/api/v1/auth/revoke-all');
}

/**
 * Operation 6: GET /api/v1/auth/me
 */
export async function fetchAuthMe(): Promise<AuthMeWireResponse> {
  return apiClient.get<AuthMeWireResponse>('/api/v1/auth/me');
}
