// src/services/api/apiClient.ts
import { getAccessToken, executeSingleFlightRefresh } from './tokenManager';
import { resolveApiUrl } from '../../utils/apiBaseUrl';

export class ApiClientError extends Error {
  statusCode: number;
  code: string;
  correlationId: string | null;
  retryAfter: number | null;

  constructor(
    statusCode: number,
    code: string,
    message: string,
    correlationId: string | null = null,
    retryAfter: number | null = null
  ) {
    super(message);
    this.name = 'ApiClientError';
    this.statusCode = statusCode;
    this.code = code;
    this.correlationId = correlationId;
    this.retryAfter = retryAfter;
  }
}

export interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}

export async function apiClient<T = unknown>(
  endpoint: string,
  options: RequestOptions = {},
  isRetry = false
): Promise<T> {
  let url = resolveApiUrl(endpoint);
  if (options.params) {
    const searchParams = new URLSearchParams();
    for (const [key, val] of Object.entries(options.params)) {
      if (val !== undefined && val !== null) {
        searchParams.append(key, String(val));
      }
    }
    const query = searchParams.toString();
    if (query) {
      url += (url.includes('?') ? '&' : '?') + query;
    }
  }

  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && options.body && typeof options.body === 'string') {
    headers.set('Content-Type', 'application/json');
  }

  const token = getAccessToken();
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const fetchOptions: RequestInit = {
    ...options,
    headers,
    credentials: 'include',
  };

  const response = await fetch(url, fetchOptions);

  if (response.status === 401 && !isRetry && !endpoint.includes('/api/v1/auth/')) {
    try {
      const newToken = await executeSingleFlightRefresh();
      // Retry once with new token
      const retryHeaders = new Headers(options.headers || {});
      retryHeaders.set('Authorization', `Bearer ${newToken}`);
      if (!retryHeaders.has('Content-Type') && options.body && typeof options.body === 'string') {
        retryHeaders.set('Content-Type', 'application/json');
      }
      return apiClient<T>(
        endpoint,
        {
          ...options,
          headers: retryHeaders,
        },
        true
      );
    } catch {
      // Refresh failed, proceed to throw error below
    }
  }

  const correlationId = response.headers.get('x-correlation-id');
  const retryAfterHeader = response.headers.get('retry-after');
  const retryAfter = retryAfterHeader ? parseInt(retryAfterHeader, 10) : null;

  if (!response.ok) {
    let errorCode = 'INTERNAL_SERVER_ERROR';
    let errorMessage = response.statusText || 'An error occurred';
    try {
      const errorJson = await response.json();
      if (errorJson) {
        if (typeof errorJson.error === 'string') {
          errorCode = errorJson.error;
        } else if (errorJson.error && typeof errorJson.error === 'object') {
          errorCode = errorJson.error.code || errorJson.error.name || errorCode;
          errorMessage = errorJson.error.message || errorMessage;
        }
        if (errorJson.message && typeof errorJson.message === 'string') {
          errorMessage = errorJson.message;
        }
      }
    } catch {
      // Body not JSON
    }
    throw new ApiClientError(
      response.status,
      errorCode,
      errorMessage,
      correlationId,
      retryAfter !== null && isNaN(retryAfter) ? null : retryAfter
    );
  }


  if (response.status === 204) {
    return {} as T;
  }

  const data = await response.json();
  return data as T;
}

apiClient.get = <T>(endpoint: string, options?: RequestOptions): Promise<T> =>
  apiClient<T>(endpoint, { ...options, method: 'GET' });

apiClient.post = <T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> =>
  apiClient<T>(endpoint, {
    ...options,
    method: 'POST',
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

apiClient.put = <T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> =>
  apiClient<T>(endpoint, {
    ...options,
    method: 'PUT',
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

apiClient.patch = <T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> =>
  apiClient<T>(endpoint, {
    ...options,
    method: 'PATCH',
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

apiClient.delete = <T>(endpoint: string, options?: RequestOptions): Promise<T> =>
  apiClient<T>(endpoint, { ...options, method: 'DELETE' });
