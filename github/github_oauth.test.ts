import { assertEquals, assertInstanceOf, fail } from "@std/assert";
import { assertSpyCall, assertSpyCalls, stub } from "@std/testing/mock";
import { FetchHttpClient, OAuthError } from "../core/mod.ts";
import { GithubOAuth } from "./github_oauth.ts";
import { describe, it } from "@std/testing/bdd";

const CLIENT_ID = Deno.env.get("GITHUB_CLIENT_ID") ?? "1234567890";
const CLIENT_SECRET = Deno.env.get("GITHUB_CLIENT_SECRET") ?? "1234567890abcdefghijklmnopqrstuvwxyz";
const REDIRECT_URI = "https://openauth.denostack.com/callback/github";
const SCOPE = ["read:user", "user:email", "user:follow"];

describe("GithubOAuth", () => {
  it("getAuthRequestUri", async () => {
    const httpClient = new FetchHttpClient();
    const oauth = new GithubOAuth({
      client: httpClient,
      clientId: CLIENT_ID,
      clientSecret: CLIENT_SECRET,
      redirectUri: REDIRECT_URI,
      scope: SCOPE,
    });

    const state = "randomstring";
    const uri = await oauth.getAuthRequestUri({ state });

    console.log(uri);
    assertEquals(
      uri,
      `https://github.com/login/oauth/authorize?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${
        encodeURIComponent(REDIRECT_URI)
      }&state=${state}&scope=${encodeURIComponent(SCOPE.join(" ")).replace(/%20/g, "+")}`,
    );
  });

  it("getAccessTokenResponse success", async () => {
    const httpClient = new FetchHttpClient();
    const requestStub = stub(httpClient, "request", () => {
      return Promise.resolve({
        status: 200,
        headers: {},
        data: {
          access_token: "GITHUB_ACCESS_TOKEN_1234",
          token_type: "bearer",
          scope: SCOPE.join(","),
        },
      });
    });

    try {
      const oauth = new GithubOAuth({
        client: httpClient,
        clientId: CLIENT_ID,
        clientSecret: CLIENT_SECRET,
        redirectUri: REDIRECT_URI,
        scope: SCOPE,
      });

      const REDIRECT_CALLBACK_URL =
        "https://openauth.denostack.com/callback/github?code=GITHUB_CODE_1234&state=randomstring";
      const searchParams = Object.fromEntries(new URL(REDIRECT_CALLBACK_URL).searchParams.entries());
      const code = searchParams.code;
      const state = searchParams.state;

      const result = await oauth.getAccessTokenResponse(code, { state });
      assertEquals(result, {
        accessToken: "GITHUB_ACCESS_TOKEN_1234",
        tokenType: "bearer",
      });

      assertSpyCalls(requestStub, 1);
      assertSpyCall(requestStub, 0, {
        args: [
          "GET",
          new URL(
            `https://github.com/login/oauth/access_token?client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}&redirect_uri=${
              encodeURIComponent(REDIRECT_URI)
            }&code=${code}&state=${state}`,
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
        status: 200,
        headers: {},
        data: {
          error: "bad_verification_code",
          error_description: "The code passed is incorrect or expired.",
          error_uri:
            "https://docs.github.com/apps/managing-oauth-apps/troubleshooting-oauth-app-access-token-request-errors/#bad-verification-code",
          unknown_params: "unknown_value",
        },
      });
    });

    try {
      const oauth = new GithubOAuth({
        client: httpClient,
        clientId: CLIENT_ID,
        clientSecret: CLIENT_SECRET,
        redirectUri: REDIRECT_URI,
        scope: SCOPE,
      });

      const code = "GITHUB_CODE_1234";
      const state = "randomstring";
      try {
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
      }

      assertSpyCalls(requestStub, 1);
      assertSpyCall(requestStub, 0, {
        args: [
          "GET",
          new URL(
            `https://github.com/login/oauth/access_token?client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}&redirect_uri=${
              encodeURIComponent(REDIRECT_URI)
            }&code=${code}&state=${state}`,
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
          login: "wan2land",
          id: 12345,
          node_id: "ABCDE",
          avatar_url: "https://corgi.photos/400/400",
          gravatar_id: "",
          type: "User",
          user_view_type: "private",
          site_admin: false,
          name: "Changwan Jun",
          email: "wan2land@gmail.com",
          hireable: null,
          bio: "Corgi Daddy",
        },
      });
    });

    try {
      const oauth = new GithubOAuth({
        client: httpClient,
        clientId: CLIENT_ID,
        clientSecret: CLIENT_SECRET,
        redirectUri: REDIRECT_URI,
        scope: SCOPE,
      });

      const ACCESS_TOKEN = "GITHUB_ACCESS_TOKEN_1234";
      const authUser = await oauth.getAuthUser(ACCESS_TOKEN);
      assertEquals(authUser, {
        id: "12345",
        email: "wan2land@gmail.com",
        name: "Changwan Jun",
        avatar: "https://corgi.photos/400/400",
        raw: {
          login: "wan2land",
          id: 12345,
          node_id: "ABCDE",
          avatar_url: "https://corgi.photos/400/400",
          gravatar_id: "",
          type: "User",
          user_view_type: "private",
          site_admin: false,
          name: "Changwan Jun",
          email: "wan2land@gmail.com",
          hireable: null,
          bio: "Corgi Daddy",
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
});
