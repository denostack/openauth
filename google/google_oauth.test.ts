import { assertEquals, assertInstanceOf, fail } from "@std/assert";
import { beforeEach, describe, it } from "@std/testing/bdd";
import { stub } from "@std/testing/mock";
import { FetchHttpClient, type HttpClient, HttpClientError, type OAuth, OAuthError } from "../core/mod.ts";
import { GoogleOAuth } from "./google_oauth.ts";

const CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID") ?? "1234567890";
const CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET") ?? "1234567890abcdefghijklmnopqrstuvwxyz";
const REDIRECT_URI = "https://openauth.denostack.com/callback/google";
const ACCESS_TOKEN = Deno.env.get("GOOGLE_ACCESS_TOKEN") ?? "GOOGLE_ACCESS_TOKEN_1234";
const ID_TOKEN = Deno.env.get("GOOGLE_ID_TOKEN") ?? "GOOGLE_ID_TOKEN_1234";

describe("GoogleOAuth", () => {
  let httpClient: HttpClient;
  let oauth: OAuth;
  beforeEach(() => {
    httpClient = new FetchHttpClient();
    oauth = new GoogleOAuth({
      client: httpClient,
      clientId: CLIENT_ID,
      clientSecret: CLIENT_SECRET,
      redirectUri: REDIRECT_URI,
    });
  });

  it("getAuthRequestUri with default scopes", async () => {
    const uri = await oauth.getAuthRequestUri();
    assertEquals(
      uri,
      `https://accounts.google.com/o/oauth2/v2/auth?${new URLSearchParams({
        response_type: "code",
        client_id: CLIENT_ID,
        redirect_uri: REDIRECT_URI,
        scope: "openid",
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
          expires_in: 3599,
          token_type: "Bearer",
          scope: "openid email",
          id_token: ID_TOKEN,
        },
      });
    });

    const code = "CODE";
    const result = await oauth.getAccessTokenResponse(code);
    assertEquals(result, {
      accessToken: ACCESS_TOKEN,
      tokenType: "Bearer",
      expiresIn: 3599,
      scopes: ["openid", "email"],
      idToken: ID_TOKEN,
    });
  });

  it("getAccessTokenResponse fail", async () => {
    stub(httpClient, "request", () => {
      return Promise.reject(
        new HttpClientError("Bad Request", 400, {
          error: "invalid_grant",
          error_description: "Malformed auth code.",
        }),
      );
    });

    try {
      const code = "GOOGLE_CODE_1234";
      await oauth.getAccessTokenResponse(code);
      fail();
    } catch (e) {
      assertInstanceOf(e, OAuthError);
      assertEquals(e.type, "invalid_grant");
      assertEquals(e.message, "Malformed auth code.");
      assertEquals(e.extra, {});
    }
  });

  it("getUserProfile success", async () => {
    stub(httpClient, "request", () => {
      return Promise.resolve({
        status: 200,
        headers: {},
        data: {
          sub: "123456789",
          name: "Changwan Jun",
          picture: "https://lh3.googleusercontent.com/1234",
          email: "wan2land@gmail.com",
        },
      });
    });

    const userProfile = await oauth.getUserProfile(ACCESS_TOKEN);
    assertEquals(userProfile, {
      id: "123456789",
      email: "wan2land@gmail.com",
      name: "Changwan Jun",
      picture: "https://lh3.googleusercontent.com/1234",
      raw: {
        sub: "123456789",
        name: "Changwan Jun",
        picture: "https://lh3.googleusercontent.com/1234",
        email: "wan2land@gmail.com",
      },
    });
  });

  it("getUserProfile fail", async () => {
    stub(httpClient, "request", () => {
      return Promise.reject(
        new HttpClientError("Unauthorized", 401, {
          error: "invalid_request",
          error_description: "Invalid Credentials",
        }),
      );
    });

    try {
      await oauth.getUserProfile("INVALID_ACCESS_TOKEN");
      fail();
    } catch (e) {
      assertInstanceOf(e, OAuthError);
      assertEquals(e.type, "invalid_request");
      assertEquals(e.message, "Invalid Credentials");
    }
  });
});
