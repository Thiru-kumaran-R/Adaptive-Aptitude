// src/services/api/tokenManager.ts
import { resolveApiUrl } from '../../utils/apiBaseUrl';

export interface RefreshExchangeError extends Error {
  statusCode?: number;
  code: string;
}

let inMemoryAccessToken: string | null = null;
let singleFlightRefreshPromise: Promise<string> | null = null;

export function getAccessToken(): string | null {
  return inMemoryAccessToken;
}

export function setAccessToken(token: string | null): void {
  inMemoryAccessToken = token;
}

export function clearAccessToken(): void {
  inMemoryAccessToken = null;
}

export async function executeSingleFlightRefresh(): Promise<string> {
  // If an exchange is already in-flight, all callers await the identical promise
  if (singleFlightRefreshPromise) {
    return singleFlightRefreshPromise;
  }

  singleFlightRefreshPromise = (async () => {
    try {
      const response = await fetch(resolveApiUrl('/api/v1/auth/refresh'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorCode =
          errorData?.error?.code ||
          (response.status === 403
            ? 'FORBIDDEN'
            : response.status >= 500
            ? 'SERVICE_UNAVAILABLE'
            : 'UNAUTHORIZED');

        // CLASSIFICATION OCCURS BEFORE DESTRUCTIVE TOKEN CLEARING
        if (
          errorCode === 'INVALID_REFRESH_TOKEN' ||
          errorCode === 'SESSION_EXPIRED' ||
          errorCode === 'REFRESH_REUSE_DETECTED' ||
          errorCode === 'ACCOUNT_DISABLED' ||
          errorCode === 'UNAUTHORIZED'
        ) {
          clearAccessToken();
        } else if (
          errorCode === 'REFRESH_ORIGIN_REQUIRED' ||
          errorCode === 'CORS_ORIGIN_DENIED'
        ) {
          clearAccessToken();
        }
        // Transient 5xx failures MUST NOT clear valid in-memory tokens

        const err = new Error(errorCode) as RefreshExchangeError;
        err.statusCode = response.status;
        err.code = errorCode;
        throw err;
      }

      const payload = await response.json();
      const newAccessToken: string = payload.data.accessToken;
      setAccessToken(newAccessToken);
      return newAccessToken;
    } catch (networkOrSystemError: unknown) {
      if (
        networkOrSystemError instanceof Error &&
        'code' in networkOrSystemError &&
        typeof (networkOrSystemError as RefreshExchangeError).code === 'string'
      ) {
        throw networkOrSystemError;
      }
      // Network/fetch failure: DO NOT clear in-memory token
      const err = new Error('NETWORK_ERROR') as RefreshExchangeError;
      err.code = 'NETWORK_ERROR';
      throw err;
    } finally {
      // Release concurrency lock immediately upon resolution or rejection
      singleFlightRefreshPromise = null;
    }
  })();

  return singleFlightRefreshPromise;
}

export async function performSingleFlightRefresh(refreshFn?: () => Promise<string>): Promise<string> {
  if (refreshFn) {
    if (singleFlightRefreshPromise) {
      return singleFlightRefreshPromise;
    }
    singleFlightRefreshPromise = (async () => {
      try {
        const token = await refreshFn();
        setAccessToken(token);
        return token;
      } catch (err: unknown) {
        const errorCode =
          err && typeof err === 'object' && 'code' in err && typeof (err as { code: unknown }).code === 'string'
            ? (err as { code: string }).code
            : '';
        const statusCode =
          err && typeof err === 'object' && 'statusCode' in err && typeof (err as { statusCode: unknown }).statusCode === 'number'
            ? (err as { statusCode: number }).statusCode
            : 0;

        if (
          statusCode === 401 ||
          errorCode === 'INVALID_REFRESH_TOKEN' ||
          errorCode === 'SESSION_EXPIRED' ||
          errorCode === 'REFRESH_REUSE_DETECTED' ||
          errorCode === 'ACCOUNT_DISABLED' ||
          errorCode === 'UNAUTHORIZED' ||
          errorCode === 'REFRESH_ORIGIN_REQUIRED' ||
          errorCode === 'CORS_ORIGIN_DENIED'
        ) {
          clearAccessToken();
        }
        // Transient 5xx / NETWORK_ERROR / SERVICE_UNAVAILABLE MUST NOT clear valid in-memory token
        throw err;
      } finally {
        singleFlightRefreshPromise = null;
      }
    })();
    return singleFlightRefreshPromise;
  }
  return executeSingleFlightRefresh();
}

