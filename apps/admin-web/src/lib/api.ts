// PHASE: Admin-A
// Keep the API on the same loopback interface in local development. In hosted
import type { ApiErrorResponse } from '@40labs/types';

// environments the API origin must be configured explicitly.
const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000').replace(/\/$/, '');

export class ApiClientError extends Error {
  constructor(message: string, readonly status: number, readonly code?: string) {
    super(message);
    this.name = 'ApiClientError';
  }
}
export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...options,
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        ...(options.body == null ? {} : { 'Content-Type': 'application/json' }),
        ...options.headers,
      },
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    throw new Error(`Cannot reach the admin API at ${API_BASE}. Check that api-core is running and VITE_API_BASE_URL is correct.`);
  }

  const data: unknown = res.status === 204 ? {} : await res.json().catch(() => ({}));

  if (res.status === 401) {
    if (!window.location.pathname.includes('/login')) {
      window.location.href = '/login';
    }
    throw new ApiClientError('Your admin session has expired. Sign in again.', 401, 'UNAUTHORIZED');
  }

  if (!res.ok) {
    const body = data as Partial<ApiErrorResponse> & { code?: string; message?: string };
    const message = (typeof body.error === 'string' ? body.error : body.error?.message)
      || body.message || `Request failed with status ${res.status}`;
    const code = typeof body.error === 'object' ? body.error?.code : body.code;
    throw new ApiClientError(message, res.status, code);
  }

  return data as T;
}
