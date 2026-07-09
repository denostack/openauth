import { assertEquals, assertRejects, assertStrictEquals } from "@std/assert";
import { stub } from "@std/testing/mock";

import { FetchHttpClient } from "./fetch_http_client.ts";
import { HttpClientError } from "./http_client.ts";

Deno.test("fetch_http_client get", async () => {
  const client = new FetchHttpClient();

  const fetchStub = stub(globalThis, "fetch", (url, options) => {
    assertStrictEquals(url.toString(), "https://test.local/");
    assertStrictEquals((options as RequestInit)?.method, "GET");
    return Promise.resolve({
      status: 200,
      headers: new Headers({ "X-Test": "test", "Content-Type": "application/json" }),
      json: () => Promise.resolve({ success: true }),
    } as Response);
  });

  try {
    assertEquals(await client.request("GET", "https://test.local"), {
      status: 200,
      headers: {
        "content-type": "application/json",
        "x-test": "test",
      },
      data: {
        success: true,
      },
    });
  } finally {
    fetchStub.restore();
  }
});

Deno.test("fetch_http_client get with params appends query string", async () => {
  const client = new FetchHttpClient();

  const fetchStub = stub(globalThis, "fetch", (url, options) => {
    assertStrictEquals(url.toString(), "https://test.local/?foo=bar");
    assertStrictEquals((options as RequestInit)?.method, "GET");
    assertStrictEquals((options as RequestInit)?.body, undefined);
    return Promise.resolve({
      status: 200,
      headers: new Headers({ "Content-Type": "application/json" }),
      json: () => Promise.resolve({ success: true }),
    } as Response);
  });

  try {
    const response = await client.request("GET", "https://test.local", { foo: "bar" });
    assertEquals(response.data, { success: true });
  } finally {
    fetchStub.restore();
  }
});

Deno.test("fetch_http_client throws HttpClientError on error status with non-object body", async () => {
  const client = new FetchHttpClient();

  const fetchStub = stub(globalThis, "fetch", () =>
    Promise.resolve({
      status: 400,
      statusText: "Bad Request",
      headers: new Headers({ "Content-Type": "application/json" }),
      json: () => Promise.resolve(null),
    } as Response));

  try {
    await assertRejects(
      () => client.request("POST", "https://test.local", { foo: "bar" }),
      HttpClientError,
      "Bad Request",
    );
  } finally {
    fetchStub.restore();
  }
});
