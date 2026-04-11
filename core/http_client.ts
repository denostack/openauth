export class HttpClientError extends Error {
  public data: Record<string, unknown>;
  public status: number;
  constructor(message: string, status: number, data: Record<string, unknown>) {
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
