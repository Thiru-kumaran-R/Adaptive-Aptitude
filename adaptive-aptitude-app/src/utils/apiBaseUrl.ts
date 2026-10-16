// src/utils/apiBaseUrl.ts
export function getApiBaseUrl(): string {
  return import.meta.env.VITE_API_BASE_URL || '/';
}

export function resolveApiUrl(path: string): string {
  const baseUrl = import.meta.env.VITE_API_BASE_URL;
  if (!baseUrl || baseUrl === '' || baseUrl === '/') {
    return path.startsWith('/') ? path : `/${path}`;
  }
  const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${cleanBase}${cleanPath}`;
}

