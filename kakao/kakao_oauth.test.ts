import { assertEquals, assertInstanceOf, fail } from "@std/assert";
import { beforeEach, describe, it } from "@std/testing/bdd";
import { stub } from "@std/testing/mock";
import {
  FetchHttpClient,
  type HttpClient,
  HttpClientError,
  type JwtVerifier,
  type OAuth,
  OAuthError,
  WebCryptoJwtVerifier,
} from "../core/mod.ts";
import { KakaoOAuth } from "./kakao_oauth.ts";

const CLIENT_ID = Deno.env.get("KAKAO_CLIENT_ID") ?? "1234567890";
const CLIENT_SECRET = Deno.env.get("KAKAO_CLIENT_SECRET") ?? "1234567890abcdefghijklmnopqrstuvwxyz";
const REDIRECT_URI = "https://openauth.denostack.com/callback/kakao";
const ACCESS_TOKEN = Deno.env.get("KAKAO_ACCESS_TOKEN") ?? "KAKAO_ACCESS_TOKEN_1234";
const REFRESH_TOKEN = Deno.env.get("KAKAO_REFRESH_TOKEN") ?? "KAKAO_REFRESH_TOKEN_1234";
const ID_TOKEN = Deno.env.get("KAKAO_ID_TOKEN") ?? "KAKAO_ID_TOKEN_1234";

describe("KakaoOAuth", () => {
  let httpClient: HttpClient;
  let jwtVerifier: JwtVerifier;
  let oauth: OAuth;
  beforeEach(() => {
    httpClient = new FetchHttpClient();
    jwtVerifier = new WebCryptoJwtVerifier();
    oauth = new KakaoOAuth({
      httpClient,
      jwtVerifier,
      clientId: CLIENT_ID,
      clientSecret: CLIENT_SECRET,
      redirectUri: REDIRECT_URI,
    });
  });

  it("getAuthRequestUri", async () => {
    const uri = await oauth.getAuthRequestUri({});
    assertEquals(
      uri,
      `https://kauth.kakao.com/oauth/authorize?${new URLSearchParams({
        response_type: "code",
        client_id: CLIENT_ID,
        redirect_uri: REDIRECT_URI,
      })}`,
    );
  });

  it("getAccessTokenResponse success", async () => {
    stub(httpClient, "request", () => {
      return Promise.resolve({
        status: 200,
        headers: {},
        data: {
          access_token: ACCESS_TOKEN,
          token_type: "bearer",
          refresh_token: REFRESH_TOKEN,
          expires_in: 21599,
          scope: "profile_nickname profile_image", // optional
          refresh_token_expires_in: 5183999,
        },
      });
    });

    const code = "CODE";
    const result = await oauth.getAccessTokenResponse(code);
    assertEquals(result, {
      accessToken: ACCESS_TOKEN,
      refreshToken: REFRESH_TOKEN,
      tokenType: "bearer",
      expiresIn: 21599,
      scope: "profile_nickname profile_image",
      refreshTokenExpiresIn: 5183999,
    });
  });

  it("getAccessTokenResponse fail", async () => {
    stub(httpClient, "request", () => {
      return Promise.reject(
        new HttpClientError("Bad Request", 400, {
          error: "invalid_grant",
          error_description: "authorization code not found for code=CODE",
          error_code: "KOE320",
        }),
      );
    });

    try {
      const code = "CODE";
      await oauth.getAccessTokenResponse(code);
      fail();
    } catch (e) {
      assertInstanceOf(e, OAuthError);
      assertEquals(e.type, "invalid_grant");
      assertEquals(e.message, "authorization code not found for code=CODE");
      assertEquals(e.extra, { error_code: "KOE320" });
    }
  });

  it("getUserProfile success", async () => {
    stub(httpClient, "request", () => {
      return Promise.resolve({
        status: 200,
        headers: {},
        data: {
          id: 123456789,
          properties: {
            nickname: "Changwan Jun",
            profile_image: "http://k.kakaocdn.net/dn/1234",
          },
          kakao_account: {
            profile: {
              nickname: "Changwan Jun",
              profile_image_url: "http://k.kakaocdn.net/dn/1234",
            },
            gender: "male",
            email: "wan2land@gmail.com",
            is_email_verified: true,
          },
        },
      });
    });

    const userProfile = await oauth.getUserProfile(ACCESS_TOKEN);
    assertEquals(userProfile, {
      picture: "http://k.kakaocdn.net/dn/1234",
      id: "123456789",
      email: "wan2land@gmail.com",
      emailVerified: true,
      nickname: "Changwan Jun",
      gender: "male",
      raw: {
        id: 123456789,
        properties: {
          nickname: "Changwan Jun",
          profile_image: "http://k.kakaocdn.net/dn/1234",
        },
        kakao_account: {
          profile: {
            nickname: "Changwan Jun",
            profile_image_url: "http://k.kakaocdn.net/dn/1234",
          },
          gender: "male",
          email: "wan2land@gmail.com",
          is_email_verified: true,
        },
      },
    });
  });

  it("getUserProfile fail", async () => {
    stub(httpClient, "request", () => {
      return Promise.reject(
        new HttpClientError("Unauthorized", 401, {
          msg: "this access token does not exist",
          code: -401,
        }),
      );
    });

    try {
      await oauth.getUserProfile("INVALID_ACCESS_TOKEN");
      fail();
    } catch (e) {
      assertInstanceOf(e, OAuthError);
      assertEquals(e.type, "Unauthorized");
      assertEquals(e.message, "this access token does not exist");
      assertEquals(e.extra, { code: -401 });
    }
  });

  it("getUserProfileFromIdToken success", async () => {
    stub(jwtVerifier, "verify", () => {
      return Promise.resolve({
        aud: CLIENT_ID,
        auth_time: 1776926756,
        exp: 1776948356,
        iat: 1776926756,
        iss: "https://kauth.kakao.com",
        nickname: "Changwan Jun",
        picture: "http://k.kakaocdn.net/dn/1234",
        sub: "123456789",
      });
    });

    const userProfile = await oauth.getUserProfileFromIdToken(ID_TOKEN);
    assertEquals(userProfile, {
      id: "123456789",
      nickname: "Changwan Jun",
      picture: "http://k.kakaocdn.net/dn/1234",
      raw: {
        aud: CLIENT_ID,
        auth_time: 1776926756,
        exp: 1776948356,
        iat: 1776926756,
        iss: "https://kauth.kakao.com",
        nickname: "Changwan Jun",
        picture: "http://k.kakaocdn.net/dn/1234",
        sub: "123456789",
      },
    });
  });
});
