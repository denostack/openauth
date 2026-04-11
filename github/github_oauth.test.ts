import { assertEquals, assertInstanceOf, fail } from "@std/assert";
import { assertSpyCall, assertSpyCalls, stub } from "@std/testing/mock";
import { FetchHttpClient, type HttpClient, HttpClientError, type OAuth, OAuthError } from "../core/mod.ts";
import { GithubOAuth } from "./github_oauth.ts";
import { beforeEach, describe, it } from "@std/testing/bdd";

const CLIENT_ID = Deno.env.get("GITHUB_CLIENT_ID") ?? "1234567890";
const CLIENT_SECRET = Deno.env.get("GITHUB_CLIENT_SECRET") ?? "1234567890abcdefghijklmnopqrstuvwxyz";
const REDIRECT_URI = "https://openauth.denostack.com/callback/github";

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

  it("getAuthRequestUri with default scopes", async () => {
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

  it("getAuthRequestUri with custom scopes", async () => {
    const uri = await oauth.getAuthRequestUri({
      state: "randomstring",
      scope: ["read:user", "user:email", "user:follow"],
    });
    assertEquals(
      uri,
      `https://github.com/login/oauth/authorize?${new URLSearchParams({
        response_type: "code",
        client_id: CLIENT_ID,
        redirect_uri: REDIRECT_URI,
        state: "randomstring",
        scope: "read:user user:email user:follow",
      })}`,
    );
  });

  it("getAccessTokenResponse success", async () => {
    const requestStub = stub(httpClient, "request", () => {
      return Promise.resolve({
        status: 200,
        headers: {},
        data: {
          access_token: "GITHUB_ACCESS_TOKEN_1234",
          token_type: "bearer",
          scope: "read:user,user:email,user:follow",
        },
      });
    });

    try {
      const code = "GITHUB_CODE_1234";
      const state = "randomstring";
      const result = await oauth.getAccessTokenResponse(code, { state });
      assertEquals(result, {
        accessToken: "GITHUB_ACCESS_TOKEN_1234",
        tokenType: "bearer",
      });

      assertSpyCalls(requestStub, 1);
      assertSpyCall(requestStub, 0, {
        args: [
          "GET",
          `https://github.com/login/oauth/access_token?client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}&redirect_uri=${
            encodeURIComponent(REDIRECT_URI)
          }&code=${code}&grant_type=authorization_code&state=${state}`,
        ],
      });
    } finally {
      requestStub.restore();
    }
  });

  it("getAccessTokenResponse fail", async () => {
    const requestStub = stub(httpClient, "request", () => {
      return Promise.reject(
        new HttpClientError("OK", 200, {
          error: "bad_verification_code",
          error_description: "The code passed is incorrect or expired.",
          error_uri:
            "https://docs.github.com/apps/managing-oauth-apps/troubleshooting-oauth-app-access-token-request-errors/#bad-verification-code",
          unknown_params: "unknown_value",
        }),
      );
    });

    try {
      const code = "GITHUB_CODE_1234";
      const state = "randomstring";
      await oauth.getAccessTokenResponse(code, { state });
      fail();
    } catch (e) {
      assertInstanceOf(e, OAuthError);
      assertEquals(e.type, "bad_verification_code");
      assertEquals(e.message, "The code passed is incorrect or expired.");
      assertEquals(e.extra, {
        error_uri:
          "https://docs.github.com/apps/managing-oauth-apps/troubleshooting-oauth-app-access-token-request-errors/#bad-verification-code",
        unknown_params: "unknown_value",
      });
    } finally {
      requestStub.restore();
    }
  });

  it("getAuthUser success", async () => {
    const requestStub = stub(httpClient, "request", () => {
      return Promise.resolve({
        status: 200,
        headers: {},
        data: {
          id: 12345,
          avatar_url: "https://corgi.photos/400/400",
          name: "Changwan Jun",
          email: "wan2land@gmail.com",
        },
      });
    });

    try {
      const ACCESS_TOKEN = "GITHUB_ACCESS_TOKEN_1234";
      const authUser = await oauth.getAuthUser(ACCESS_TOKEN);
      assertEquals(authUser, {
        id: "12345",
        email: "wan2land@gmail.com",
        name: "Changwan Jun",
        avatar: "https://corgi.photos/400/400",
        raw: {
          id: 12345,
          avatar_url: "https://corgi.photos/400/400",
          name: "Changwan Jun",
          email: "wan2land@gmail.com",
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

  it("getAuthUser fail", async () => {
    const requestStub = stub(httpClient, "request", () => {
      return Promise.reject(
        new HttpClientError("Unauthorized", 401, {
          message: "Bad credentials",
          documentation_url: "https://docs.github.com/rest",
          status: "401",
        }),
      );
    });

    try {
      const ACCESS_TOKEN = "GITHUB_ACCESS_TOKEN_1234";
      await oauth.getAuthUser(ACCESS_TOKEN);
      fail();
    } catch (e) {
      assertInstanceOf(e, OAuthError);
      assertEquals(e.type, "Unauthorized");
      assertEquals(e.message, "Bad credentials");
      assertEquals(e.extra, {
        documentation_url: "https://docs.github.com/rest",
        status: "401",
      });
    } finally {
      requestStub.restore();
    }
  });
});
