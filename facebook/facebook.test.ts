import { assertEquals } from "@std/assert";
import { assertSpyCall, assertSpyCalls, stub } from "@std/testing/mock";
import { FetchHttpClient } from "../core/fetch_http_client.ts";
import { Facebook } from "./facebook.ts";

const CLIENT_ID = Deno.env.get("FACEBOOK_CLIENT_ID") ?? "1234567890";
const CLIENT_SECRET = Deno.env.get("FACEBOOK_CLIENT_SECRET") ??
  "1234567890abcdefghijklmnopqrstuvwxyz";
const REDIRECT_URI = Deno.env.get("FACEBOOK_REDIRECT_URI") ??
  "https://openauth.wani.kr/facebook/callback";
const SCOPE = ["pages_show_list", "public_profile"];

Deno.test("Facebook getAuthRequestUri", async () => {
  const httpClient = new FetchHttpClient();
  const oauth = new Facebook({
    client: httpClient,
    clientId: CLIENT_ID,
    clientSecret: CLIENT_SECRET,
    redirectUri: REDIRECT_URI,
    scope: SCOPE,
  });

  const uri = await oauth.getAuthRequestUri();

  assertEquals(
    uri,
    `https://www.facebook.com/${oauth.version}/dialog/oauth?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${
      encodeURIComponent(REDIRECT_URI)
    }&scope=${encodeURIComponent(SCOPE.join(","))}`,
  );
});

Deno.test("Facebook getAccessTokenResponse success", async () => {
  const httpClient = new FetchHttpClient();
  const requestStub = stub(httpClient, "request", () => {
    return Promise.resolve({
      status: 200,
      headers: {},
      data: {
        access_token: "ACCESSTOKEN_1234567890",
        token_type: "bearer",
        expires_in: 5183770,
      },
    });
  });

  try {
    const oauth = new Facebook({
      client: httpClient,
      clientId: CLIENT_ID,
      clientSecret: CLIENT_SECRET,
      redirectUri: REDIRECT_URI,
      scope: SCOPE,
    });

    const AUTHCODE = "TOKEN_FROM_FACEBOOK_1234567890";
    const result = await oauth.getAccessTokenResponse(AUTHCODE);
    assertEquals(result, {
      accessToken: "ACCESSTOKEN_1234567890",
      tokenType: "bearer",
      expiresIn: 5183770,
    });

    assertSpyCalls(requestStub, 1);
    assertSpyCall(requestStub, 0, {
      args: [
        "GET",
        new URL(
          `https://graph.facebook.com/${oauth.version}/oauth/access_token?client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}&redirect_uri=${
            encodeURIComponent(REDIRECT_URI)
          }&code=${AUTHCODE}&grant_type=authorization_code`,
        ),
      ],
    });
  } finally {
    requestStub.restore();
  }
});

Deno.test("Facebook getAuthUser", async () => {
  const httpClient = new FetchHttpClient();
  const requestStub = stub(httpClient, "request", () => {
    return Promise.resolve({
      status: 200,
      headers: {},
      data: {
        id: "123456789",
        name: "Cris Jun",
      },
    });
  });

  try {
    const oauth = new Facebook({
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
      name: "Cris Jun",
      avatar:
        `https://graph.facebook.com/${oauth.version}/123456789/picture?type=normal`,
      raw: {
        id: "123456789",
        name: "Cris Jun",
      },
    });

    assertSpyCalls(requestStub, 1);
    assertSpyCall(requestStub, 0, {
      args: [
        "GET",
        new URL(
          `https://graph.facebook.com/${oauth.version}/me?fields=id%2Cemail%2Cname`,
        ),
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
