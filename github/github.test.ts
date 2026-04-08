import { assertEquals, fail } from "@std/assert";
import { assertSpyCall, assertSpyCalls, stub } from "@std/testing/mock";
import { FetchHttpClient } from "../core/fetch_http_client.ts";
import { Github } from "./github.ts";

const CLIENT_ID = Deno.env.get("GITHUB_CLIENT_ID") ?? "1234567890";
const CLIENT_SECRET = Deno.env.get("GITHUB_CLIENT_SECRET") ??
  "1234567890abcdefghijklmnopqrstuvwxyz";
const REDIRECT_URI = Deno.env.get("GITHUB_REDIRECT_URI") ??
  "https://openauth.wani.kr/github/callback";
const SCOPE = ["read:user", "user:email", "user:follow"];

Deno.test("Github getAuthRequestUri", async () => {
  const httpClient = new FetchHttpClient();
  const oauth = new Github({
    client: httpClient,
    clientId: CLIENT_ID,
    clientSecret: CLIENT_SECRET,
    redirectUri: REDIRECT_URI,
    scope: SCOPE,
  });

  const state = "randomstring";
  const uri = await oauth.getAuthRequestUri({ state });

  assertEquals(
    uri,
    `https://github.com/login/oauth/authorize?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${
      encodeURIComponent(REDIRECT_URI)
    }&state=${state}&scope=${
      encodeURIComponent(SCOPE.join(" ")).replace(/%20/g, "+")
    }`,
  );
});

Deno.test("Github getAccessTokenResponse success", async () => {
  const httpClient = new FetchHttpClient();
  const requestStub = stub(httpClient, "request", () => {
    return Promise.resolve({
      status: 200,
      headers: {},
      data: {
        access_token: "ACCESSTOKEN_1234567890",
        token_type: "bearer",
        scope: SCOPE.join(","),
      },
    });
  });

  try {
    const oauth = new Github({
      client: httpClient,
      clientId: CLIENT_ID,
      clientSecret: CLIENT_SECRET,
      redirectUri: REDIRECT_URI,
      scope: SCOPE,
    });

    const AUTHCODE = "TOKEN_FROM_GITHUB_1234567890";
    const state = "randomstring";
    const result = await oauth.getAccessTokenResponse(AUTHCODE, { state });
    assertEquals(result, {
      accessToken: "ACCESSTOKEN_1234567890",
      tokenType: "bearer",
    });

    assertSpyCalls(requestStub, 1);
    assertSpyCall(requestStub, 0, {
      args: [
        "GET",
        new URL(
          `https://github.com/login/oauth/access_token?client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}&redirect_uri=${
            encodeURIComponent(REDIRECT_URI)
          }&code=${AUTHCODE}&state=${state}`,
        ),
      ],
    });
  } finally {
    requestStub.restore();
  }
});

Deno.test("Github getAccessTokenResponse fail", async () => {
  const httpClient = new FetchHttpClient();
  const requestStub = stub(httpClient, "request", () => {
    return Promise.resolve({
      status: 200,
      headers: {},
      data: {
        error: "bad_verification_code",
        error_description: "The code passed is incorrect or expired.",
        error_uri:
          "https://docs.github.com/apps/managing-oauth-apps/troubleshooting-oauth-app-access-token-request-errors/#bad-verification-code",
      },
    });
  });

  try {
    const oauth = new Github({
      client: httpClient,
      clientId: CLIENT_ID,
      clientSecret: CLIENT_SECRET,
      redirectUri: REDIRECT_URI,
      scope: SCOPE,
    });

    const AUTHCODE = "TOKEN_FROM_GITHUB_1234567890";
    const state = "randomstring";
    try {
      await oauth.getAccessTokenResponse(AUTHCODE, { state });
      fail();
    } catch (e) {
      assertEquals(
        (e as Error & { error: string }).error,
        "bad_verification_code",
      );
      assertEquals(
        (e as Error).message,
        "The code passed is incorrect or expired.",
      );
    }

    assertSpyCalls(requestStub, 1);
    assertSpyCall(requestStub, 0, {
      args: [
        "GET",
        new URL(
          `https://github.com/login/oauth/access_token?client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}&redirect_uri=${
            encodeURIComponent(REDIRECT_URI)
          }&code=${AUTHCODE}&state=${state}`,
        ),
      ],
    });
  } finally {
    requestStub.restore();
  }
});

Deno.test("Github getAuthUser", async () => {
  const httpClient = new FetchHttpClient();
  const requestStub = stub(httpClient, "request", () => {
    return Promise.resolve({
      status: 200,
      headers: {},
      data: {
        login: "wan2land",
        id: "123456789",
        avatar_url: "https://corgi.photos/400/400",
        name: "Cris Jun",
        email: "hi@wani.kr",
        blog: "https://wani.kr",
        location: "Seoul",
        bio: "Computer-Illiterate. JS, a little bit.",
        public_repos: 49,
        public_gists: 18,
        followers: 65,
        following: 103,
        created_at: "2013-04-07T19:53:43Z",
        updated_at: "2020-05-18T14:14:36Z",
      },
    });
  });

  try {
    const oauth = new Github({
      client: httpClient,
      clientId: CLIENT_ID,
      clientSecret: CLIENT_SECRET,
      redirectUri: REDIRECT_URI,
      scope: SCOPE,
    });

    const ACCESS_TOKEN = "ACCESSTOKEN_1234567890";
    const authUser = await oauth.getAuthUser(ACCESS_TOKEN);
    assertEquals(authUser, {
      id: "123456789",
      email: "hi@wani.kr",
      name: "Cris Jun",
      avatar: "https://corgi.photos/400/400",
      raw: {
        login: "wan2land",
        id: "123456789",
        avatar_url: "https://corgi.photos/400/400",
        name: "Cris Jun",
        email: "hi@wani.kr",
        blog: "https://wani.kr",
        location: "Seoul",
        bio: "Computer-Illiterate. JS, a little bit.",
        public_repos: 49,
        public_gists: 18,
        followers: 65,
        following: 103,
        created_at: "2013-04-07T19:53:43Z",
        updated_at: "2020-05-18T14:14:36Z",
      },
    });

    assertSpyCalls(requestStub, 1);
    assertSpyCall(requestStub, 0, {
      args: [
        "GET",
        "https://api.github.com/user",
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
