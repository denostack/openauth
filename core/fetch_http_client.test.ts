import { assertEquals, assertStrictEquals } from "@std/assert";
import { stub } from "@std/testing/mock";

import { FetchHttpClient } from "./fetch_http_client.ts";

Deno.test("fetch_http_client get", async () => {
  const client = new FetchHttpClient();

  stub(globalThis, "fetch", (url, options) => {
    assertStrictEquals(url, "https://test.local");
    assertStrictEquals((options as RequestInit)?.method, "GET");
    return Promise.resolve({
      status: 200,
      headers: new Headers({ "X-Test": "test" }),
      json: () => Promise.resolve({ success: true }),
    } as Response);
  });

  assertEquals(await client.request("GET", "https://test.local"), {
    status: 200,
    headers: {
      "x-test": "test",
    },
    data: {
      success: true,
    },
  });
});
