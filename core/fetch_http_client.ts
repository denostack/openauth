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

    let body: string | null = null;
    if (headers["content-type"] === "application/x-www-form-urlencoded") {
      body = new URLSearchParams(params as Record<string, string>).toString();
    } else {
      body = JSON.stringify(params);
    }

    const response = await fetch(path, {
      method,
      headers,
      ...method !== "GET" ? { body } : {},
    });

    const status = response.status;
    if (status >= 300 && status < 400) {
      return this.request<T>(
        method,
        response.headers.get("location") || "",
        params,
        headers,
      );
    }
    const contentType = response.headers.get("content-type");
    const data = contentType?.includes("application/json") ? await response.json() : {};
    if (response.status >= 400) {
      throw new HttpClientError(
        response.statusText,
        response.status,
        data,
      );
    }
    if ("error" in data) {
      throw new HttpClientError(
        response.statusText,
        response.status,
        data,
      );
    }
    return {
      status,
      headers: Object.fromEntries([...response.headers]),
      data: data as T,
    };
  }
}
