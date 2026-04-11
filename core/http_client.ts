// deno-lint-ignore no-explicit-any
export class HttpClientError<T = any> extends Error {
  public data: T;
  public status: number;
  constructor(message: string, status: number, data: T) {
    super(message);
    this.name = "HttpClientError";
    this.status = status;
    this.data = data;
  }
}

export interface HttpClientResponse<T> {
  status: number;
  headers: Record<string, string>;
  data: T;
}

export interface HttpClient {
  request<T>(
    method: string,
    path: string | URL,
    params?: Record<string, unknown>,
    headers?: Record<string, string>,
  ): Promise<
    HttpClientResponse<T>
  >;
}
