import { assertEquals, assertInstanceOf, fail } from "@std/assert";
import { beforeEach, describe, it } from "@std/testing/bdd";
import { stub } from "@std/testing/mock";
import { FetchHttpClient, type HttpClient, HttpClientError, type OAuth, OAuthError } from "../core/mod.ts";
import { GithubOAuth } from "./github_oauth.ts";

const CLIENT_ID = Deno.env.get("GITHUB_CLIENT_ID") ?? "1234567890";
const CLIENT_SECRET = Deno.env.get("GITHUB_CLIENT_SECRET") ?? "1234567890abcdefghijklmnopqrstuvwxyz";
const REDIRECT_URI = "https://openauth.denostack.com/callback/github";
const ACCESS_TOKEN = Deno.env.get("GITHUB_ACCESS_TOKEN") ?? "GITHUB_ACCESS_TOKEN_1234";

describe("GithubOAuth", () => {
  let httpClient: HttpClient;
  let oauth: OAuth;
  beforeEach(() => {
    httpClient = new FetchHttpClient();
    oauth = new GithubOAuth({
      client: httpClient,
      clientId: CLIENT_ID,
      clientSecret: CLIENT_SECRET,
      redirectUri: REDIRECT_URI,
    });
  });

  it("getAuthRequestUri", async () => {
    const uri = await oauth.getAuthRequestUri({ state: "randomstring" });
    assertEquals(
      uri,
      `https://github.com/login/oauth/authorize?${new URLSearchParams({
        response_type: "code",
        client_id: CLIENT_ID,
        redirect_uri: REDIRECT_URI,
        state: "randomstring",
        scope: "user:email",
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
          scope: "read:user,user:email,user:follow",
        },
      });
    });

    const code = "CODE";
    const result = await oauth.getAccessTokenResponse(code);
    assertEquals(result, {
      accessToken: ACCESS_TOKEN,
      tokenType: "bearer",
      scope: "read:user,user:email,user:follow",
    });
  });

  it("getAccessTokenResponse fail", async () => {
    stub(httpClient, "request", () => {
      return Promise.reject(
        new HttpClientError("OK", 200, {
          error: "bad_verification_code",
          error_description: "The code passed is incorrect or expired.",
          error_uri:
            "https://docs.github.com/apps/managing-oauth-apps/troubleshooting-oauth-app-access-token-request-errors/#bad-verification-code",
        }),
      );
    });

    try {
      const code = "CODE";
      await oauth.getAccessTokenResponse(code);
      fail();
    } catch (e) {
      assertInstanceOf(e, OAuthError);
      assertEquals(e.type, "bad_verification_code");
      assertEquals(e.message, "The code passed is incorrect or expired.");
      assertEquals(e.extra, {
        error_uri:
          "https://docs.github.com/apps/managing-oauth-apps/troubleshooting-oauth-app-access-token-request-errors/#bad-verification-code",
      });
    }
  });

  it("getUserProfile success", async () => {
    stub(httpClient, "request", () => {
      return Promise.resolve({
        status: 200,
        headers: {},
        data: {
          id: 12345,
          login: "wan2land",
          avatar_url: "https://avatars.githubusercontent.com/u/12345",
          name: "Changwan Jun",
          email: "wan2land@gmail.com",
        },
      });
    });

    const userProfile = await oauth.getUserProfile(ACCESS_TOKEN);
    assertEquals(userProfile, {
      id: "12345",
      username: "wan2land",
      email: "wan2land@gmail.com",
      name: "Changwan Jun",
      picture: "https://avatars.githubusercontent.com/u/12345",
      raw: {
        id: 12345,
        login: "wan2land",
        avatar_url: "https://avatars.githubusercontent.com/u/12345",
        name: "Changwan Jun",
        email: "wan2land@gmail.com",
      },
    });
  });

  it("getUserProfile fail", async () => {
    stub(httpClient, "request", () => {
      return Promise.reject(
        new HttpClientError("Unauthorized", 401, {
          message: "Bad credentials",
          documentation_url: "https://docs.github.com/rest",
          status: "401",
        }),
      );
    });

    try {
      await oauth.getUserProfile("INVALID_ACCESS_TOKEN");
      fail();
    } catch (e) {
      assertInstanceOf(e, OAuthError);
      assertEquals(e.type, "Unauthorized");
      assertEquals(e.message, "Bad credentials");
      assertEquals(e.extra, {
        documentation_url: "https://docs.github.com/rest",
        status: "401",
      });
    }
  });
});
