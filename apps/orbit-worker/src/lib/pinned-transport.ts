import OrbitPinnedTransport, {
  PinnedNativeResponse,
  OrbitPinnedTransportNativeModule,
} from '../../modules/orbit-pinned-transport/src';

export interface PinnedResponse {
  ok: boolean;
  status: number;
  headers: { get: (name: string) => string | null };
  text: () => Promise<string>;
  json: <T = any>() => Promise<T>;
}

export interface PinnedRequestOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
  signal?: AbortSignal;
}

export interface PinnedServerConfig {
  endpoint: string;
  endpoints?: string[];
  fp: string;
}

function toResponse(nativeResponse: PinnedNativeResponse): PinnedResponse {
  const body = nativeResponse.body;
  const headers = new Map(
    Object.entries(nativeResponse.headers).map(([name, value]) => [name.toLowerCase(), value]),
  );

  return {
    ok: nativeResponse.status >= 200 && nativeResponse.status < 300,
    status: nativeResponse.status,
    headers: { get: (name) => headers.get(name.toLowerCase()) ?? null },
    text: async () => body,
    json: async <T = any>() => (body ? JSON.parse(body) as T : {} as T),
  };
}

export async function pinnedFetch(
  url: string,
  options: PinnedRequestOptions,
  fingerprint: string,
): Promise<PinnedResponse> {
  if (!/^https:\/\//i.test(url)) {
    throw new Error('Orbit secure transport only accepts HTTPS endpoints');
  }
  if (!/^[a-f\d]{64}$/i.test(fingerprint)) {
    throw new Error('Orbit server fingerprint is missing or invalid');
  }
  const headers = Object.fromEntries(
    Object.entries(options.headers ?? {}).filter((entry): entry is [string, string] => typeof entry[1] === 'string'),
  );

  if (!OrbitPinnedTransport || typeof OrbitPinnedTransport.request !== 'function') {
    // Web or non-native fallback
    const res = await fetch(url, {
      method: options.method ?? 'GET',
      headers,
      body: options.body ?? undefined,
      signal: options.signal,
    });
    let jsonResult: any = null;
    let body = '';
    if (res) {
      if (typeof res.text === 'function') {
        try {
          body = await res.text();
        } catch {
          // fallback
        }
      }
      if (!body && typeof res.json === 'function') {
        try {
          jsonResult = await res.json();
          body = typeof jsonResult === 'string' ? jsonResult : JSON.stringify(jsonResult);
        } catch {
          // fallback
        }
      }
    }
    const status = res?.status ?? 500;
    const ok = res?.ok ?? (status >= 200 && status < 300);
    return {
      ok,
      status,
      headers: { get: (name) => (res?.headers && typeof res.headers.get === 'function' ? res.headers.get(name) : null) },
      text: async () => body,
      json: async <T = any>() => (jsonResult !== null ? jsonResult : (body ? JSON.parse(body) as T : {} as T)),
    };
  }

  const response = await OrbitPinnedTransport.request(
    url,
    options.method ?? 'GET',
    headers,
    options.body ?? null,
    fingerprint,
  );
  return toResponse(response);
}

export async function pinnedFetchFromEndpoints(
  endpoints: string[],
  path: string,
  options: PinnedRequestOptions,
  fingerprint: string,
): Promise<{ response: PinnedResponse; endpoint: string }> {
  let lastError: unknown;
  for (const endpoint of endpoints) {
    try {
      const response = await pinnedFetch(`${endpoint.replace(/\/$/, '')}${path}`, options, fingerprint);
      return { response, endpoint };
    } catch (error) {
      lastError = error;
    }
  }
  throw new Error('ORBIT_NETWORK_UNREACHABLE', { cause: lastError });
}

export async function pinnedServerFetch(
  server: PinnedServerConfig,
  pathOrUrl: string,
  options: PinnedRequestOptions,
): Promise<PinnedResponse> {
  let path = pathOrUrl;
  if (/^https?:\/\//i.test(pathOrUrl)) {
    const target = new URL(pathOrUrl);
    path = `${target.pathname}${target.search}`;
  }
  if (!path.startsWith('/')) path = `/${path}`;
  const endpoints = server.endpoints?.length ? server.endpoints : [server.endpoint];
  const result = await pinnedFetchFromEndpoints(endpoints, path, options, server.fp);
  return result.response;
}
