// PHASE: Admin-A
// Keep the API on the same loopback interface in local development. In hosted
// environments the API origin must be configured explicitly.
const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000').replace(/\/$/, '');

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

  if (res.status === 401) {
    if (!window.location.pathname.includes('/login')) {
      window.location.href = '/login';
    }
    throw new Error('Unauthorized');
  }

  const data = res.status === 204 ? {} : await res.json().catch(() => ({}));

  if (!res.ok) {
    const message = (typeof data.error === 'string' ? data.error : data.error?.message)
      || data.message
      || `Request failed with status ${res.status}`;
    throw new Error(message);
  }

  return data as T;
}
