export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface RequestOptions {
  method: HttpMethod;
  path: string;
  headers?: Record<string, string>;
  body?: any;
  signal?: AbortSignal;
}

export interface HttpResponse<T = any> {
  status: number;
  headers: Record<string, string>;
  data: T;
}

export interface HttpTransport {
  request<T>(options: RequestOptions): Promise<HttpResponse<T>>;
}
