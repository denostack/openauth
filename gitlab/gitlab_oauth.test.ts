import { assertEquals, assertInstanceOf, fail } from "@std/assert";
import { assertSpyCall, assertSpyCalls, stub } from "@std/testing/mock";
import { FetchHttpClient, type HttpClient, HttpClientError, type OAuth, OAuthError } from "../core/mod.ts";
import { GitlabOAuth } from "./gitlab_oauth.ts";
import { beforeEach, describe, it } from "@std/testing/bdd";

const CLIENT_ID = Deno.env.get("GITLAB_CLIENT_ID") ?? "1234567890";
const CLIENT_SECRET = Deno.env.get("GITLAB_CLIENT_SECRET") ?? "1234567890abcdefghijklmnopqrstuvwxyz";
const REDIRECT_URI = "https://openauth.denostack.com/callback/gitlab";

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

  it("getAuthRequestUri with default scopes", async () => {
    const uri = await oauth.getAuthRequestUri({ state: "randomstring" });
    assertEquals(
      uri,
      `https://gitlab.com/oauth/authorize?${new URLSearchParams({
        response_type: "code",
        client_id: CLIENT_ID,
        redirect_uri: REDIRECT_URI,
        state: "randomstring",
        scope: "read_user",
      })}`,
    );
  });

  it("getAuthRequestUri with custom scopes", async () => {
    const uri = await oauth.getAuthRequestUri({
      state: "randomstring",
      scope: ["read_user", "api"],
    });
    assertEquals(
      uri,
      `https://gitlab.com/oauth/authorize?${new URLSearchParams({
        response_type: "code",
        client_id: CLIENT_ID,
        redirect_uri: REDIRECT_URI,
        state: "randomstring",
        scope: "read_user api",
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
    const requestStub = stub(httpClient, "request", () => {
      return Promise.resolve({
        status: 200,
        headers: {},
        data: {
          access_token: "ACCESS_TOKEN",
          token_type: "Bearer",
          expires_in: 7200,
          refresh_token: "REFRESH_TOKEN",
          scope: "read_user",
          created_at: 1775929000,
        },
      });
    });

    try {
      const code = "CODE";
      const result = await oauth.getAccessTokenResponse(code);
      assertEquals(result, {
        accessToken: "ACCESS_TOKEN",
        tokenType: "Bearer",
        expiresIn: 7200,
        refreshToken: "REFRESH_TOKEN",
      });
      assertSpyCalls(requestStub, 1);
      assertSpyCall(requestStub, 0, {
        args: [
          "POST",
          "https://gitlab.com/oauth/token",
          {
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            redirect_uri: REDIRECT_URI,
            code,
            grant_type: "authorization_code",
          },
          { "content-type": "application/x-www-form-urlencoded" },
        ],
      });
    } finally {
      requestStub.restore();
    }
  });

  it("getAccessTokenResponse fail", async () => {
    const requestStub = stub(httpClient, "request", () => {
      return Promise.reject(
        new HttpClientError("Bad Request", 400, {
          error: "invalid_grant",
          error_description:
            "The provided authorization grant is invalid, expired, revoked, does not match the redirection URI used in the authorization request, or was issued to another client.",
          unknown_params: "unknown_value",
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
      assertEquals(e.extra, { unknown_params: "unknown_value" });
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
          id: 123456,
          username: "wan2land",
          name: "Changwan Jun",
          email: "wan2land@gmail.com",
          avatar_url: "https://gitlab.com/uploads/photo.png",
          web_url: "https://gitlab.com/wan2land",
        },
      });
    });

    try {
      const accessToken = "ACCESS_TOKEN";
      const authUser = await oauth.getAuthUser(accessToken);
      assertEquals(authUser, {
        id: "123456",
        username: "wan2land",
        name: "Changwan Jun",
        email: "wan2land@gmail.com",
        avatar: "https://gitlab.com/uploads/photo.png",
        raw: {
          id: 123456,
          username: "wan2land",
          name: "Changwan Jun",
          email: "wan2land@gmail.com",
          avatar_url: "https://gitlab.com/uploads/photo.png",
          web_url: "https://gitlab.com/wan2land",
        },
      });
      assertSpyCalls(requestStub, 1);
      assertSpyCall(requestStub, 0, {
        args: ["GET", "https://gitlab.com/api/v4/user", {}, { authorization: "Bearer ACCESS_TOKEN" }],
      });
    } finally {
      requestStub.restore();
    }
  });

  it("getAuthUser fail", async () => {
    const requestStub = stub(httpClient, "request", () => {
      return Promise.reject(
        new HttpClientError("Unauthorized", 401, {
          message: "401 Unauthorized",
        }),
      );
    });

    try {
      await oauth.getAuthUser("ACCESS_TOKEN");
      fail();
    } catch (e) {
      assertInstanceOf(e, OAuthError);
      assertEquals(e.type, "Unauthorized");
      assertEquals(e.message, "401 Unauthorized");
    } finally {
      requestStub.restore();
    }
  });
});
