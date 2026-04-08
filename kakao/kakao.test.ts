import { assertEquals, fail } from "@std/assert";
import { assertSpyCall, assertSpyCalls, stub } from "@std/testing/mock";
import { FetchHttpClient } from "../core/fetch_http_client.ts";
import { Kakao } from "./kakao.ts";

const CLIENT_ID = Deno.env.get("KAKAO_CLIENT_ID") ?? "1234567890";
const CLIENT_SECRET = Deno.env.get("KAKAO_CLIENT_SECRET") ??
  "1234567890abcdefghijklmnopqrstuvwxyz";
const REDIRECT_URI = Deno.env.get("KAKAO_REDIRECT_URI") ??
  "https://openauth.wani.kr/kakao/callback";

Deno.test("Kakao getAuthRequestUri", async () => {
  const httpClient = new FetchHttpClient();
  const oauth = new Kakao({
    client: httpClient,
    clientId: CLIENT_ID,
    clientSecret: CLIENT_SECRET,
    redirectUri: REDIRECT_URI,
  });

  const state = "randomstring";
  const uri = await oauth.getAuthRequestUri({ state });

  assertEquals(
    uri,
    `https://kauth.kakao.com/oauth/authorize?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${
      encodeURIComponent(REDIRECT_URI)
    }&state=${state}`,
  );
});

Deno.test("Kakao getAccessTokenResponse success", async () => {
  const httpClient = new FetchHttpClient();
  const requestStub = stub(httpClient, "request", () => {
    return Promise.resolve({
      status: 200,
      headers: {},
      data: {
        access_token: "ACCESSTOKEN_1234567890",
        token_type: "bearer",
        refresh_token: "REFRESHTOKEN_1234567890",
        expires_in: 21599,
        scope: "age_range birthday account_email gender profile",
        refresh_token_expires_in: 5183999,
      },
    });
  });

  try {
    const oauth = new Kakao({
      client: httpClient,
      clientId: CLIENT_ID,
      clientSecret: CLIENT_SECRET,
      redirectUri: REDIRECT_URI,
    });

    const AUTHCODE = "TOKEN_FROM_KAKAO_1234567890";
    const result = await oauth.getAccessTokenResponse(AUTHCODE);
    assertEquals(result, {
      accessToken: "ACCESSTOKEN_1234567890",
      refreshToken: "REFRESHTOKEN_1234567890",
      tokenType: "bearer",
      expiresIn: 21599,
      refreshTokenExpiresIn: 5183999,
    });

    assertSpyCalls(requestStub, 1);
    assertSpyCall(requestStub, 0, {
      args: [
        "GET",
        new URL(
          `https://kauth.kakao.com/oauth/token?client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}&redirect_uri=${
            encodeURIComponent(REDIRECT_URI)
          }&code=${AUTHCODE}&grant_type=authorization_code`,
        ),
      ],
    });
  } finally {
    requestStub.restore();
  }
});

Deno.test("Kakao getAccessTokenResponse fail", async () => {
  const httpClient = new FetchHttpClient();
  const requestStub = stub(httpClient, "request", () => {
    return Promise.resolve({
      status: 400,
      headers: {},
      data: {
        error: "invalid_grant",
        error_description: "authorization code not found.",
        error_code: "KOE320",
      },
    });
  });

  try {
    const oauth = new Kakao({
      client: httpClient,
      clientId: CLIENT_ID,
      clientSecret: CLIENT_SECRET,
      redirectUri: REDIRECT_URI,
    });

    const AUTHCODE = "TOKEN_FROM_KAKAO_1234567890";
    try {
      await oauth.getAccessTokenResponse(AUTHCODE);
      fail();
    } catch (e) {
      assertEquals(
        (e as Error & { error: string }).error,
        "invalid_grant",
      );
      assertEquals(
        (e as Error).message,
        "authorization code not found.",
      );
      assertEquals(
        (e as Error & { code: string }).code,
        "KOE320",
      );
    }

    assertSpyCalls(requestStub, 1);
    assertSpyCall(requestStub, 0, {
      args: [
        "GET",
        new URL(
          `https://kauth.kakao.com/oauth/token?client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}&redirect_uri=${
            encodeURIComponent(REDIRECT_URI)
          }&code=${AUTHCODE}&grant_type=authorization_code`,
        ),
      ],
    });
  } finally {
    requestStub.restore();
  }
});

Deno.test("Kakao getAuthUser", async () => {
  const httpClient = new FetchHttpClient();
  const requestStub = stub(httpClient, "request", () => {
    return Promise.resolve({
      status: 200,
      headers: {},
      data: {
        id: 123456789,
        connected_at: "2020-08-09T13:52:19Z",
        properties: {
          nickname: "Cris Jun",
          profile_image: "https://corgi.photos/640/640",
          thumbnail_image: "https://corgi.photos/110/110",
        },
        kakao_account: {
          profile_needs_agreement: false,
          profile: {
            nickname: "Cris Jun",
            thumbnail_image_url: "https://corgi.photos/110/110",
            profile_image_url: "https://corgi.photos/640/640",
            is_default_image: false,
          },
          has_email: true,
          email_needs_agreement: false,
          is_email_valid: true,
          is_email_verified: true,
          email: "wan2land@gmail.com",
        },
      },
    });
  });

  try {
    const oauth = new Kakao({
      client: httpClient,
      clientId: CLIENT_ID,
      clientSecret: CLIENT_SECRET,
      redirectUri: REDIRECT_URI,
    });

    const ACCESS_TOKEN = "ACCESSTOKEN_1234567890";
    const authUser = await oauth.getAuthUser(ACCESS_TOKEN);
    assertEquals(authUser, {
      avatar: "https://corgi.photos/640/640",
      id: "123456789",
      email: "wan2land@gmail.com",
      nickname: "Cris Jun",
      raw: {
        id: 123456789,
        connected_at: "2020-08-09T13:52:19Z",
        properties: {
          nickname: "Cris Jun",
          profile_image: "https://corgi.photos/640/640",
          thumbnail_image: "https://corgi.photos/110/110",
        },
        kakao_account: {
          profile_needs_agreement: false,
          profile: {
            nickname: "Cris Jun",
            thumbnail_image_url: "https://corgi.photos/110/110",
            profile_image_url: "https://corgi.photos/640/640",
            is_default_image: false,
          },
          has_email: true,
          email_needs_agreement: false,
          is_email_valid: true,
          is_email_verified: true,
          email: "wan2land@gmail.com",
        },
      },
    });

    assertSpyCalls(requestStub, 1);
    assertSpyCall(requestStub, 0, {
      args: [
        "GET",
        "https://kapi.kakao.com/v2/user/me",
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
