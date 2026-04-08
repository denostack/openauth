export interface HttpClientResponse<T> {
  status: number;
  headers: Record<string, string>;
  data: T;
}

export interface HttpClient {
  request<T = unknown>(
    method: string,
    path: string | URL,
    params?: Record<string, unknown>,
    headers?: Record<string, string>,
  ): Promise<
    HttpClientResponse<T>
  >;
}
