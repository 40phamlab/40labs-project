import { HttpTransport, RequestOptions } from './transport';
import { ApiError, classifyHttpError } from './errors';

export interface ApiClientConfig {
  transport: HttpTransport;
  baseUrl?: string;
  getDefaultHeaders?: () => Record<string, string>;
}

export interface PairRequestPayload {
  sessionId: string;
  token: string;
  deviceLabel: string;
  deviceType: 'phone' | 'tablet' | string;
}

export interface PairingHealthResponse {
  status: string;
  version?: string;
}

export interface PairResponse {
  credential: string;
  businessId?: string;
}

export interface DeviceMeResponse {
  id: string;
  deviceLabel: string;
  status: 'active' | 'revoked' | 'blocked';
  permissions: string[];
}

export class ApiClient {
  private transport: HttpTransport;
  private baseUrl: string;
  private getDefaultHeaders?: () => Record<string, string>;

  constructor(config: ApiClientConfig) {
    this.transport = config.transport;
    this.baseUrl = config.baseUrl || '';
    this.getDefaultHeaders = config.getDefaultHeaders;
  }

  public async request<T>(options: RequestOptions): Promise<T> {
    const defaultHeaders = this.getDefaultHeaders ? this.getDefaultHeaders() : {};
    const headers = {
      'Content-Type': 'application/json',
      ...defaultHeaders,
      ...(options.headers || {}),
    };

    const path = this.baseUrl ? `${this.baseUrl}${options.path}` : options.path;

    try {
      const response = await this.transport.request<T>({
        ...options,
        path,
        headers,
      });

      if (response.status < 200 || response.status >= 300) {
        const code = classifyHttpError(response.status, response.data);
        throw new ApiError(
          typeof response.data === 'string'
            ? response.data
            : (response.data as any)?.message || `HTTP error ${response.status}`,
          response.status,
          code,
          response.data
        );
      }

      return response.data;
    } catch (err: any) {
      if (err instanceof ApiError) {
        throw err;
      }
      if (err instanceof SyntaxError) {
        throw new ApiError('Malformed response JSON', 0, 'MALFORMED_RESPONSE', err.message);
      }
      throw new ApiError(err.message || 'Network error', 0, 'NETWORK_ERROR', err);
    }
  }

  // Endpoints
  public async getPairingHealth(signal?: AbortSignal): Promise<PairingHealthResponse> {
    return this.request<PairingHealthResponse>({
      method: 'GET',
      path: '/api/pairing/health',
      signal,
    });
  }

  public async pairDevice(payload: PairRequestPayload, signal?: AbortSignal): Promise<PairResponse> {
    return this.request<PairResponse>({
      method: 'POST',
      path: '/api/pairing/pair',
      body: payload,
      signal,
    });
  }

  public async getDevicesMe(token: string, signal?: AbortSignal): Promise<DeviceMeResponse> {
    return this.request<DeviceMeResponse>({
      method: 'GET',
      path: '/api/v1/devices/me',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      signal,
    });
  }

  public async postHeartbeat(token: string, signal?: AbortSignal): Promise<{ status: string }> {
    return this.request<{ status: string }>({
      method: 'POST',
      path: '/api/v1/devices/me/heartbeat',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      signal,
    });
  }
}
