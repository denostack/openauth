import { type HttpClient, HttpClientError, type HttpClientResponse } from "./http_client.ts";

export class FetchHttpClient implements HttpClient {
  async request<T = unknown>(
    method: string,
    path: string | URL,
    params: Record<string, unknown> = {},
    headers: Record<string, string> = {},
  ): Promise<
    HttpClientResponse<T>
  > {
    method = method.toUpperCase();
    headers = Object.fromEntries(
      Object.entries(headers).map(([key, value]) => [key.toLowerCase(), value]),
    );

    headers.accept = headers.accept || "application/json";
    headers["content-type"] = headers["content-type"] || "application/json";

    let requestPath = path;
    let body: string | null = null;
    if (method === "GET" || method === "HEAD") {
      const url = new URL(path);
      for (const [key, value] of Object.entries(params as Record<string, string>)) {
        url.searchParams.append(key, value);
      }
      requestPath = url;
    } else if (headers["content-type"] === "application/x-www-form-urlencoded") {
      body = new URLSearchParams(params as Record<string, string>).toString();
    } else {
      body = JSON.stringify(params);
    }

    const response = await fetch(requestPath, {
      method,
      headers,
      ...body !== null ? { body } : {},
    });

    const status = response.status;
    const contentType = response.headers.get("content-type");
    const data = contentType?.includes("application/json") ? await response.json().catch(() => ({})) : {};
    if (status >= 400 || (data !== null && typeof data === "object" && "error" in data)) {
      throw new HttpClientError(
        response.statusText,
        status,
        data,
      );
    }
    return {
      status,
      headers: Object.fromEntries(response.headers),
      data: data as T,
    };
  }
}
