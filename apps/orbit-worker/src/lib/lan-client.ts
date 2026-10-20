// [PHASE: MVP]
// [SPEC: apps/orbit-worker/CONTEXT/01-ARCHITECTURE.md]
import { getServerCredential } from './secure-store';
import { pinnedServerFetch } from './pinned-transport';
import { useConnectionStore } from '../stores/connection';

export type LanClientErrorKind = 'offline' | 'unauthorized' | 'revoked' | 'server';

export class LanClientError extends Error {
  constructor(public kind: LanClientErrorKind, message: string, public status?: number) {
    super(message);
    this.name = 'LanClientError';
  }
}

export interface LanClient {
  get<T = any>(path: string): Promise<T>;
  post<T = any>(path: string, body?: any, headers?: Record<string, string>): Promise<T>;
}

export async function getLanClient(businessId: string): Promise<LanClient> {
  const server = await getServerCredential(businessId);
  if (!server) {
    useConnectionStore.getState().setStatus('unreachable');
    throw new LanClientError('offline', 'No server credential found for business');
  }

  const request = async <T = any>(method: string, path: string, body?: any, customHeaders?: Record<string, string>): Promise<T> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    try {
      const response = await pinnedServerFetch(
        server,
        path,
        {
          method,
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${server.credential}`,
            ...(customHeaders || {}),
          },
          body: body ? JSON.stringify(body) : undefined,
          signal: controller.signal,
        }
      );
      clearTimeout(timeoutId);

      if (response.status === 401 || response.status === 403) {
        useConnectionStore.getState().setStatus('revoked');
        throw new LanClientError('revoked', 'Session unauthorized or revoked', response.status);
      }

      if (!response.ok) {
        const errText = await response.text().catch(() => 'Server error');
        throw new LanClientError('server', `Server error: ${response.status} ${errText}`, response.status);
      }

      const data = await response.json().catch(() => ({}));
      useConnectionStore.getState().setStatus('connected');
      return data as T;
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err instanceof LanClientError) throw err;
      if (err.name === 'AbortError' || err.message?.includes('network') || err.message?.includes('timeout') || err.message?.includes('Failed to fetch')) {
        useConnectionStore.getState().setStatus('unreachable');
        throw new LanClientError('offline', 'Network request timed out or device offline');
      }
      throw new LanClientError('server', err.message || 'Unknown network error');
    }
  };

  return {
    get: async <T = any>(path: string) => request<T>('GET', path),
    post: async <T = any>(path: string, body?: any, headers?: Record<string, string>) => request<T>('POST', path, body, headers),
  };
}
