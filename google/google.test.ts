import { assertEquals, fail } from "@std/assert";
import { assertSpyCall, assertSpyCalls, stub } from "@std/testing/mock";
import { FetchHttpClient } from "../core/fetch_http_client.ts";
import { Google } from "./google.ts";

const CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID") ?? "1234567890";
const CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET") ??
  "1234567890abcdefghijklmnopqrstuvwxyz";
const REDIRECT_URI = Deno.env.get("GOOGLE_REDIRECT_URI") ??
  "https://openauth.wani.kr/google/callback";
const SCOPE = ["openid", "profile", "email"];

Deno.test("Google getAuthRequestUri", async () => {
  const httpClient = new FetchHttpClient();
  const oauth = new Google({
    client: httpClient,
    clientId: CLIENT_ID,
    clientSecret: CLIENT_SECRET,
    redirectUri: REDIRECT_URI,
    scope: SCOPE,
  });

  const uri = await oauth.getAuthRequestUri();

  assertEquals(
    uri,
    `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${
      encodeURIComponent(REDIRECT_URI)
    }&scope=${encodeURIComponent(SCOPE.join(" ")).replace(/%20/g, "+")}`,
  );
});

Deno.test("Google getAccessTokenResponse success", async () => {
  const httpClient = new FetchHttpClient();
  const requestStub = stub(httpClient, "request", () => {
    return Promise.resolve({
      status: 200,
      headers: {},
      data: {
        access_token: "ACCESSTOKEN_1234567890",
        expires_in: 3599,
        token_type: "Bearer",
        scope: SCOPE.join(" "),
        id_token: "IDTOKEN_1234567890",
      },
    });
  });

  try {
    const oauth = new Google({
      client: httpClient,
      clientId: CLIENT_ID,
      clientSecret: CLIENT_SECRET,
      redirectUri: REDIRECT_URI,
      scope: SCOPE,
    });

    const AUTHCODE = "TOKEN_FROM_GOOGLE_1234567890";
    const result = await oauth.getAccessTokenResponse(AUTHCODE);
    assertEquals(result, {
      accessToken: "ACCESSTOKEN_1234567890",
      tokenType: "Bearer",
      expiresIn: 3599,
    });

    assertSpyCalls(requestStub, 1);
    assertSpyCall(requestStub, 0, {
      args: [
        "POST",
        "https://oauth2.googleapis.com/token",
        {
          client_id: CLIENT_ID,
          client_secret: CLIENT_SECRET,
          redirect_uri: REDIRECT_URI,
          code: AUTHCODE,
          grant_type: "authorization_code",
        },
      ],
    });
  } finally {
    requestStub.restore();
  }
});

Deno.test("Google getAccessTokenResponse fail", async () => {
  const httpClient = new FetchHttpClient();
  const requestStub = stub(httpClient, "request", () => {
    return Promise.resolve({
      status: 400,
      headers: {},
      data: {
        error: "invalid_grant",
        error_description: "Malformed auth code.",
      },
    });
  });

  try {
    const oauth = new Google({
      client: httpClient,
      clientId: CLIENT_ID,
      clientSecret: CLIENT_SECRET,
      redirectUri: REDIRECT_URI,
      scope: SCOPE,
    });

    const AUTHCODE = "TOKEN_FROM_GOOGLE_1234567890";
    try {
      await oauth.getAccessTokenResponse(AUTHCODE);
      fail();
    } catch (e) {
      assertEquals(
        (e as Error & { error: string }).error,
        "invalid_grant",
      );
      assertEquals((e as Error).message, "Malformed auth code.");
    }

    assertSpyCalls(requestStub, 1);
    assertSpyCall(requestStub, 0, {
      args: [
        "POST",
        "https://oauth2.googleapis.com/token",
        {
          client_id: CLIENT_ID,
          client_secret: CLIENT_SECRET,
          redirect_uri: REDIRECT_URI,
          code: AUTHCODE,
          grant_type: "authorization_code",
        },
      ],
    });
  } finally {
    requestStub.restore();
  }
});

Deno.test("Google getAuthUser", async () => {
  const httpClient = new FetchHttpClient();
  const requestStub = stub(httpClient, "request", () => {
    return Promise.resolve({
      status: 200,
      headers: {},
      data: {
        sub: "123456789",
        name: "Cris Jun",
        given_name: "Cris",
        family_name: "Jun",
        picture: "https://corgi.photos/200/200",
        email: "wan2land@gmail.com",
        email_verified: true,
        locale: "ko",
      },
    });
  });

  try {
    const oauth = new Google({
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
      email: "wan2land@gmail.com",
      name: "Cris Jun",
      avatar: "https://corgi.photos/200/200",
      raw: {
        sub: "123456789",
        name: "Cris Jun",
        given_name: "Cris",
        family_name: "Jun",
        picture: "https://corgi.photos/200/200",
        email: "wan2land@gmail.com",
        email_verified: true,
        locale: "ko",
      },
    });

    assertSpyCalls(requestStub, 1);
    assertSpyCall(requestStub, 0, {
      args: [
        "GET",
        "https://www.googleapis.com/oauth2/v3/userinfo",
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
