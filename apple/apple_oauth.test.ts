import { assertEquals, assertInstanceOf, assertRejects, fail } from "@std/assert";
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
import { AppleOAuth } from "./apple_oauth.ts";

const CLIENT_ID = Deno.env.get("APPLE_CLIENT_ID") ?? "com.example.app.sid";
const TEAM_ID = Deno.env.get("APPLE_TEAM_ID") ?? "TEAM1234567";
const KEY_ID = Deno.env.get("APPLE_KEY_ID") ?? "KEY1234567";
const PRIVATE_KEY = Deno.env.get("APPLE_PRIVATE_KEY") ?? `-----BEGIN PRIVATE KEY-----
-----END PRIVATE KEY-----`;
const REDIRECT_URI = "https://local.manaboo.co.kr/auth/apple/callback"; // "https://openauth.denostack.com/callback/apple";
const ACCESS_TOKEN = Deno.env.get("APPLE_ACCESS_TOKEN") ?? "APPLE_ACCESS_TOKEN_1234";
const REFRESH_TOKEN = Deno.env.get("APPLE_REFRESH_TOKEN") ?? "APPLE_REFRESH_TOKEN_1234";
const ID_TOKEN = Deno.env.get("APPLE_ID_TOKEN") ?? "APPLE_ID_TOKEN_1234";

describe("AppleOAuth", () => {
  let httpClient: HttpClient;
  let jwtVerifier: JwtVerifier;
  let oauth: OAuth;
  beforeEach(() => {
    httpClient = new FetchHttpClient();
    jwtVerifier = new WebCryptoJwtVerifier();
    oauth = new AppleOAuth({
      httpClient,
      jwtVerifier,
      clientId: CLIENT_ID,
      teamId: TEAM_ID,
      keyId: KEY_ID,
      privateKey: PRIVATE_KEY,
      redirectUri: REDIRECT_URI,
    });
  });

  it("getAuthRequestUri", async () => {
    const uri = await oauth.getAuthRequestUri({ state: "randomstring" });
    assertEquals(
      uri,
      `https://appleid.apple.com/auth/authorize?${new URLSearchParams({
        response_type: "code",
        client_id: CLIENT_ID,
        redirect_uri: REDIRECT_URI,
        state: "randomstring",
        scope: "name email",
        response_mode: "form_post",
      })}`,
    );
  });

  it("getAuthRequestUri with empty scope", async () => {
    const uri = await oauth.getAuthRequestUri({ state: "randomstring", scope: [] });
    assertEquals(
      uri,
      `https://appleid.apple.com/auth/authorize?${new URLSearchParams({
        response_type: "code",
        client_id: CLIENT_ID,
        redirect_uri: REDIRECT_URI,
        state: "randomstring",
        response_mode: "query",
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
          token_type: "Bearer",
          expires_in: 3600,
          refresh_token: REFRESH_TOKEN,
          id_token: ID_TOKEN,
        },
      });
    });

    const code = "CODE";
    const result = await oauth.getAccessTokenResponse(code);
    assertEquals(result, {
      accessToken: ACCESS_TOKEN,
      tokenType: "Bearer",
      expiresIn: 3600,
      refreshToken: REFRESH_TOKEN,
      idToken: ID_TOKEN,
    });
  });

  it("getAccessTokenResponse fail", async () => {
    stub(httpClient, "request", () => {
      return Promise.reject(
        new HttpClientError("Bad Request", 400, {
          error: "invalid_grant",
          error_description: "The code has expired or has been revoked.",
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
      assertEquals(e.message, "The code has expired or has been revoked.");
    }
  });

  it("getUserProfile not supported", async () => {
    await assertRejects(() => oauth.getUserProfile(ACCESS_TOKEN), OAuthError);
  });

  it("getUserProfileFromIdToken success", async () => {
    stub(jwtVerifier, "verify", () => {
      return Promise.resolve({
        at_hash: "ABCDEFG",
        aud: CLIENT_ID,
        iss: "https://appleid.apple.com",
        exp: 1775969077,
        iat: 1775965477,
        sub: "001234.abcdef1234567890.1234",
        email: "wan2land@privaterelay.appleid.com",
        email_verified: true,
        is_private_email: true,
        auth_time: 1775965477,
        nonce_supported: true,
      });
    });

    const userProfile = await oauth.getUserProfileFromIdToken(ID_TOKEN);
    assertEquals(userProfile, {
      id: "001234.abcdef1234567890.1234",
      email: "wan2land@privaterelay.appleid.com",
      emailVerified: true,
      raw: {
        at_hash: "ABCDEFG",
        aud: CLIENT_ID,
        iss: "https://appleid.apple.com",
        exp: 1775969077,
        iat: 1775965477,
        sub: "001234.abcdef1234567890.1234",
        email: "wan2land@privaterelay.appleid.com",
        email_verified: true,
        is_private_email: true,
        auth_time: 1775965477,
        nonce_supported: true,
      },
    });
  });
});
