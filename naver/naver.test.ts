import { assertEquals, fail } from "@std/assert";
import { assertSpyCall, assertSpyCalls, stub } from "@std/testing/mock";
import { FetchHttpClient } from "../core/fetch_http_client.ts";
import { Naver } from "./naver.ts";

const CLIENT_ID = Deno.env.get("NAVER_CLIENT_ID") ?? "1234567890";
const CLIENT_SECRET = Deno.env.get("NAVER_CLIENT_SECRET") ??
  "1234567890abcdefghijklmnopqrstuvwxyz";
const REDIRECT_URI = Deno.env.get("NAVER_REDIRECT_URI") ??
  "https://openauth.wani.kr/naver/callback";

Deno.test("Naver getAuthRequestUri", async () => {
  const httpClient = new FetchHttpClient();
  const oauth = new Naver({
    client: httpClient,
    clientId: CLIENT_ID,
    clientSecret: CLIENT_SECRET,
    redirectUri: REDIRECT_URI,
  });

  const state = "randomstate";
  const uri = await oauth.getAuthRequestUri({ state });

  assertEquals(
    uri,
    `https://nid.naver.com/oauth2.0/authorize?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${
      encodeURIComponent(REDIRECT_URI)
    }&state=${state}`,
  );
});

Deno.test("Naver getAccessTokenResponse success", async () => {
  const httpClient = new FetchHttpClient();
  const requestStub = stub(httpClient, "request", () => {
    return Promise.resolve({
      status: 200,
      headers: {},
      data: {
        access_token: "ACCESSTOKEN_1234567890",
        refresh_token: "REFRESHTOKEN_1234567890",
        token_type: "bearer",
        expires_in: "3600",
      },
    });
  });

  try {
    const oauth = new Naver({
      client: httpClient,
      clientId: CLIENT_ID,
      clientSecret: CLIENT_SECRET,
      redirectUri: REDIRECT_URI,
    });

    const AUTHCODE = "TOKEN_FROM_NAVER_1234567890";
    const result = await oauth.getAccessTokenResponse(AUTHCODE);
    assertEquals(result, {
      accessToken: "ACCESSTOKEN_1234567890",
      refreshToken: "REFRESHTOKEN_1234567890",
      tokenType: "bearer",
      expiresIn: 3600,
    });

    assertSpyCalls(requestStub, 1);
    assertSpyCall(requestStub, 0, {
      args: [
        "GET",
        new URL(
          `https://nid.naver.com/oauth2.0/token?client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}&redirect_uri=${
            encodeURIComponent(REDIRECT_URI)
          }&code=${AUTHCODE}&grant_type=authorization_code`,
        ),
      ],
    });
  } finally {
    requestStub.restore();
  }
});

Deno.test("Naver getAccessTokenResponse fail", async () => {
  const httpClient = new FetchHttpClient();
  const requestStub = stub(httpClient, "request", () => {
    return Promise.resolve({
      status: 200,
      headers: {},
      data: {
        error: "invalid_request",
        error_description: "no valid data in session",
      },
    });
  });

  try {
    const oauth = new Naver({
      client: httpClient,
      clientId: CLIENT_ID,
      clientSecret: CLIENT_SECRET,
      redirectUri: REDIRECT_URI,
    });

    const AUTHCODE = "TOKEN_FROM_NAVER_1234567890";
    try {
      await oauth.getAccessTokenResponse(AUTHCODE);
      fail();
    } catch (e) {
      assertEquals(
        (e as Error & { error: string }).error,
        "invalid_request",
      );
      assertEquals((e as Error).message, "no valid data in session");
    }

    assertSpyCalls(requestStub, 1);
    assertSpyCall(requestStub, 0, {
      args: [
        "GET",
        new URL(
          `https://nid.naver.com/oauth2.0/token?client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}&redirect_uri=${
            encodeURIComponent(REDIRECT_URI)
          }&code=${AUTHCODE}&grant_type=authorization_code`,
        ),
      ],
    });
  } finally {
    requestStub.restore();
  }
});

Deno.test("Naver getAuthUser", async () => {
  const httpClient = new FetchHttpClient();
  const requestStub = stub(httpClient, "request", () => {
    return Promise.resolve({
      status: 200,
      headers: {},
      data: {
        resultcode: "00",
        message: "success",
        response: {
          id: "123456789",
          email: "wan2land@gmail.com",
          name: "Cris Jun",
        },
      },
    });
  });

  try {
    const oauth = new Naver({
      client: httpClient,
      clientId: CLIENT_ID,
      clientSecret: CLIENT_SECRET,
      redirectUri: REDIRECT_URI,
    });

    const ACCESS_TOKEN = "ACCESSTOKEN_1234567890";
    const authUser = await oauth.getAuthUser(ACCESS_TOKEN);
    assertEquals(authUser, {
      id: "123456789",
      email: "wan2land@gmail.com",
      name: "Cris Jun",
      raw: {
        id: "123456789",
        email: "wan2land@gmail.com",
        name: "Cris Jun",
      },
    });

    assertSpyCalls(requestStub, 1);
    assertSpyCall(requestStub, 0, {
      args: [
        "GET",
        "https://openapi.naver.com/v1/nid/me",
        {},
        {
          authorization: `Bearer ${ACCESS_TOKEN}`,
        },
      ],
    });
  } finally {
    requestStub.restore();
  }
});
