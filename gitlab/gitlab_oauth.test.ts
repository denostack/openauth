import { assertEquals, assertInstanceOf, fail } from "@std/assert";
import { beforeEach, describe, it } from "@std/testing/bdd";
import { stub } from "@std/testing/mock";
import { FetchHttpClient, type HttpClient, HttpClientError, type OAuth, OAuthError } from "../core/mod.ts";
import { GitlabOAuth } from "./gitlab_oauth.ts";

const CLIENT_ID = Deno.env.get("GITLAB_CLIENT_ID") ?? "1234567890";
const CLIENT_SECRET = Deno.env.get("GITLAB_CLIENT_SECRET") ?? "1234567890abcdefghijklmnopqrstuvwxyz";
const REDIRECT_URI = "https://openauth.denostack.com/callback/gitlab";
const ACCESS_TOKEN = Deno.env.get("GITLAB_ACCESS_TOKEN") ?? "GITLAB_ACCESS_TOKEN_1234";
const REFRESH_TOKEN = Deno.env.get("GITLAB_REFRESH_TOKEN") ?? "GITLAB_REFRESH_TOKEN_1234";

describe("GitlabOAuth", () => {
  let httpClient: HttpClient;
  let oauth: OAuth;
  beforeEach(() => {
    httpClient = new FetchHttpClient();
    oauth = new GitlabOAuth({
      client: httpClient,
      clientId: CLIENT_ID,
      clientSecret: CLIENT_SECRET,
      redirectUri: REDIRECT_URI,
    });
  });

  it("getAuthRequestUri", async () => {
    const uri = await oauth.getAuthRequestUri();
    assertEquals(
      uri,
      `https://gitlab.com/oauth/authorize?${new URLSearchParams({
        response_type: "code",
        client_id: CLIENT_ID,
        redirect_uri: REDIRECT_URI,
        scope: "read_user",
      })}`,
    );
  });

  it("getAuthRequestUri with custom host", async () => {
    const oauth = new GitlabOAuth({
      host: "https://gitlab.example.com",
      client: httpClient,
      clientId: CLIENT_ID,
      clientSecret: CLIENT_SECRET,
      redirectUri: REDIRECT_URI,
    });
    const uri = await oauth.getAuthRequestUri();
    assertEquals(
      uri,
      `https://gitlab.example.com/oauth/authorize?${new URLSearchParams({
        response_type: "code",
        client_id: CLIENT_ID,
        redirect_uri: REDIRECT_URI,
        scope: "read_user",
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
          expires_in: 7200,
          refresh_token: REFRESH_TOKEN,
          scope: "read_user",
          created_at: 1775929000,
        },
      });
    });

    const code = "CODE";
    const result = await oauth.getAccessTokenResponse(code);
    assertEquals(result, {
      accessToken: ACCESS_TOKEN,
      tokenType: "Bearer",
      expiresIn: 7200,
      refreshToken: REFRESH_TOKEN,
      scopes: ["read_user"],
    });
  });

  it("getAccessTokenResponse fail", async () => {
    stub(httpClient, "request", () => {
      return Promise.reject(
        new HttpClientError("Bad Request", 400, {
          error: "invalid_grant",
          error_description:
            "The provided authorization grant is invalid, expired, revoked, does not match the redirection URI used in the authorization request, or was issued to another client.",
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
      assertEquals(
        e.message,
        "The provided authorization grant is invalid, expired, revoked, does not match the redirection URI used in the authorization request, or was issued to another client.",
      );
      assertEquals(e.extra, {});
    }
  });

  it("getUserProfile success", async () => {
    stub(httpClient, "request", () => {
      return Promise.resolve({
        status: 200,
        headers: {},
        data: {
          id: 123456,
          username: "wan2land",
          name: "Changwan Jun",
          email: "wan2land@gmail.com",
          avatar_url: "https://gitlab.com/uploads/photo.png",
          web_url: "https://gitlab.com/wan2land",
        },
      });
    });

    const userProfile = await oauth.getUserProfile(ACCESS_TOKEN);
    assertEquals(userProfile, {
      id: "123456",
      username: "wan2land",
      name: "Changwan Jun",
      email: "wan2land@gmail.com",
      picture: "https://gitlab.com/uploads/photo.png",
      raw: {
        id: 123456,
        username: "wan2land",
        name: "Changwan Jun",
        email: "wan2land@gmail.com",
        avatar_url: "https://gitlab.com/uploads/photo.png",
        web_url: "https://gitlab.com/wan2land",
      },
    });
  });

  it("getUserProfile fail", async () => {
    stub(httpClient, "request", () => {
      return Promise.reject(
        new HttpClientError("Unauthorized", 401, {
          message: "401 Unauthorized",
        }),
      );
    });

    try {
      await oauth.getUserProfile("INVALID_ACCESS_TOKEN");
      fail();
    } catch (e) {
      assertInstanceOf(e, OAuthError);
      assertEquals(e.type, "Unauthorized");
      assertEquals(e.message, "401 Unauthorized");
    }
  });
});
