import { HttpTransport, RequestOptions, HttpResponse } from './transport';

export type MockHandler = (options: RequestOptions) => HttpResponse | Promise<HttpResponse>;

export class FakeTransport implements HttpTransport {
  private handlers: Map<string, MockHandler> = new Map();
  private defaultHandler?: MockHandler;

  public setHandler(method: string, path: string, handler: MockHandler) {
    this.handlers.set(`${method.toUpperCase()} ${path}`, handler);
  }

  public setDefaultHandler(handler: MockHandler) {
    this.defaultHandler = handler;
  }

  public async request<T>(options: RequestOptions): Promise<HttpResponse<T>> {
    const key = `${options.method.toUpperCase()} ${options.path}`;
    const handler = this.handlers.get(key) || this.defaultHandler;

    if (!handler) {
      return {
        status: 404,
        headers: {},
        data: { message: `Mock not found for ${key}` } as any,
      };
    }

    const result = await handler(options);
    return result as HttpResponse<T>;
  }
}
