import { assertEquals, assertInstanceOf, fail } from "@std/assert";
import { assertSpyCall, assertSpyCalls, stub } from "@std/testing/mock";
import { FetchHttpClient, OAuthError } from "../core/mod.ts";
import { KakaoOAuth } from "./kakao_oauth.ts";
import { describe, it } from "@std/testing/bdd";

const CLIENT_ID = Deno.env.get("KAKAO_CLIENT_ID") ?? "1234567890";
const CLIENT_SECRET = Deno.env.get("KAKAO_CLIENT_SECRET") ?? "1234567890abcdefghijklmnopqrstuvwxyz";
const REDIRECT_URI = "https://openauth.denostack.com/callback/kakao";

describe("KakaoOAuth", () => {
  it("getAuthRequestUri", async () => {
    const httpClient = new FetchHttpClient();
    const oauth = new KakaoOAuth({
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

  it("getAccessTokenResponse success", async () => {
    const httpClient = new FetchHttpClient();
    const requestStub = stub(httpClient, "request", () => {
      return Promise.resolve({
        status: 200,
        headers: {},
        data: {
          access_token: "KAKAO_ACCESS_TOKEN_1234",
          token_type: "bearer",
          refresh_token: "REFRESHTOKEN_1234567890",
          expires_in: 21599,
          scope: "age_range birthday account_email gender profile", // optional
          refresh_token_expires_in: 5183999,
        },
      });
    });

    try {
      const oauth = new KakaoOAuth({
        client: httpClient,
        clientId: CLIENT_ID,
        clientSecret: CLIENT_SECRET,
        redirectUri: REDIRECT_URI,
      });

      const REDIRECT_CALLBACK_URL =
        "https://openauth.denostack.com/callback/kakao?code=KAKAO_CODE_1234&state=randomstring";
      const searchParams = Object.fromEntries(new URL(REDIRECT_CALLBACK_URL).searchParams.entries());
      const code = searchParams.code;

      const result = await oauth.getAccessTokenResponse(code);
      assertEquals(result, {
        accessToken: "KAKAO_ACCESS_TOKEN_1234",
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
            }&code=${code}&grant_type=authorization_code`,
          ),
        ],
      });
    } finally {
      requestStub.restore();
    }
  });

  it("getAccessTokenResponse fail", async () => {
    const httpClient = new FetchHttpClient();
    const requestStub = stub(httpClient, "request", () => {
      return Promise.resolve({
        status: 400,
        headers: {},
        data: {
          error: "invalid_grant",
          error_description: "authorization code not found.",
          error_code: "KOE320",
          unknown_params: "unknown_value",
        },
      });
    });

    try {
      const oauth = new KakaoOAuth({
        client: httpClient,
        clientId: CLIENT_ID,
        clientSecret: CLIENT_SECRET,
        redirectUri: REDIRECT_URI,
      });

      const code = "KAKAO_CODE_1234";
      try {
        await oauth.getAccessTokenResponse(code);
        fail();
      } catch (e) {
        assertInstanceOf(e, OAuthError);
        assertEquals(e.type, "invalid_grant");
        assertEquals(e.message, "authorization code not found.");
        assertEquals(e.extra, { error_code: "KOE320", unknown_params: "unknown_value" });
      }

      assertSpyCalls(requestStub, 1);
      assertSpyCall(requestStub, 0, {
        args: [
          "GET",
          new URL(
            `https://kauth.kakao.com/oauth/token?client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}&redirect_uri=${
              encodeURIComponent(REDIRECT_URI)
            }&code=${code}&grant_type=authorization_code`,
          ),
        ],
      });
    } finally {
      requestStub.restore();
    }
  });

  it("getAuthUser", async () => {
    const httpClient = new FetchHttpClient();
    const requestStub = stub(httpClient, "request", () => {
      return Promise.resolve({
        status: 200,
        headers: {},
        data: {
          id: 123456789,
          connected_at: "2020-08-09T13:52:19Z",
          properties: {
            nickname: "Changwan Jun",
            profile_image: "https://corgi.photos/640/640",
            thumbnail_image: "https://corgi.photos/110/110",
          },
          kakao_account: {
            profile_needs_agreement: false,
            profile: {
              nickname: "Changwan Jun",
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
      const oauth = new KakaoOAuth({
        client: httpClient,
        clientId: CLIENT_ID,
        clientSecret: CLIENT_SECRET,
        redirectUri: REDIRECT_URI,
      });

      const ACCESS_TOKEN = "KAKAO_ACCESS_TOKEN_1234";
      const authUser = await oauth.getAuthUser(ACCESS_TOKEN);
      assertEquals(authUser, {
        avatar: "https://corgi.photos/640/640",
        id: "123456789",
        email: "wan2land@gmail.com",
        nickname: "Changwan Jun",
        raw: {
          id: 123456789,
          connected_at: "2020-08-09T13:52:19Z",
          properties: {
            nickname: "Changwan Jun",
            profile_image: "https://corgi.photos/640/640",
            thumbnail_image: "https://corgi.photos/110/110",
          },
          kakao_account: {
            profile_needs_agreement: false,
            profile: {
              nickname: "Changwan Jun",
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
});
