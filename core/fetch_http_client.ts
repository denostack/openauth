import type { HttpClient, HttpClientResponse } from "./http_client.ts";

export class FetchHttpClient implements HttpClient {
  request<T = unknown>(
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

    return fetch(path, {
      method,
      headers,
      ...method !== "GET" ? { body } : {},
    }).then((response) => {
      const status = response.status;
      if (status >= 300 && status < 400) {
        return this.request<T>(
          method,
          response.headers.get("location") || "",
          params,
          headers,
        );
      }
      return response.json().then((data) => {
        const headers = Object.fromEntries([...response.headers]);
        return {
          status,
          headers,
          data: data as T,
        };
      });
    });
  }
}
