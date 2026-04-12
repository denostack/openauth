import { assertEquals, assertInstanceOf, fail } from "@std/assert";
import { beforeEach, describe, it } from "@std/testing/bdd";
import { assertSpyCalls, stub } from "@std/testing/mock";
import { FetchHttpClient, type HttpClient, HttpClientError, type OAuth, OAuthError } from "../core/mod.ts";
import { LineOAuth } from "./line_oauth.ts";

const CLIENT_ID = Deno.env.get("LINE_CLIENT_ID") ?? "1234567890";
const CLIENT_SECRET = Deno.env.get("LINE_CLIENT_SECRET") ?? "1234567890abcdefghijklmnopqrstuvwxyz";
const REDIRECT_URI = "https://openauth.denostack.com/callback/line";
const ACCESS_TOKEN = Deno.env.get("LINE_ACCESS_TOKEN") ?? "LINE_ACCESS_TOKEN_1234";
const REFRESH_TOKEN = Deno.env.get("LINE_REFRESH_TOKEN") ?? "LINE_REFRESH_TOKEN_1234";
const ID_TOKEN = Deno.env.get("LINE_ID_TOKEN") ?? "LINE_ID_TOKEN_1234";

describe("LineOAuth", () => {
  let httpClient: HttpClient;
  let oauth: OAuth;
  beforeEach(() => {
    httpClient = new FetchHttpClient();
    oauth = new LineOAuth({
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
      `https://access.line.me/oauth2/v2.1/authorize?${new URLSearchParams({
        response_type: "code",
        client_id: CLIENT_ID,
        redirect_uri: REDIRECT_URI,
        scope: "openid profile",
      })}`,
    );
  });

  it("getAccessTokenResponse success", async () => {
    const requestStub = stub(httpClient, "request", () => {
      return Promise.resolve({
        status: 200,
        headers: {},
        data: {
          access_token: ACCESS_TOKEN,
          token_type: "Bearer",
          refresh_token: REFRESH_TOKEN,
          expires_in: 2592000,
          scope: "openid profile",
          id_token: ID_TOKEN,
        },
      });
    });

    try {
      const code = "CODE";
      const result = await oauth.getAccessTokenResponse(code);
      assertEquals(result, {
        scopes: ["openid", "profile"],
        accessToken: ACCESS_TOKEN,
        tokenType: "Bearer",
        expiresIn: 2592000,
        refreshToken: REFRESH_TOKEN,
        idToken: ID_TOKEN,
      });
      assertSpyCalls(requestStub, 1);
    } finally {
      requestStub.restore();
    }
  });

  it("getAccessTokenResponse fail", async () => {
    const requestStub = stub(httpClient, "request", () => {
      return Promise.reject(
        new HttpClientError("Bad Request", 400, {
          error: "invalid_grant",
          error_description: "invalid authorization code",
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
      assertEquals(e.message, "invalid authorization code");
      assertEquals(e.extra, { unknown_params: "unknown_value" });
    } finally {
      requestStub.restore();
    }
  });

  it("getUserProfile success", async () => {
    const requestStub = stub(httpClient, "request", () => {
      return Promise.resolve({
        status: 200,
        headers: {},
        data: {
          userId: "U1234567890",
          displayName: "Changwan Jun",
          pictureUrl: "https://profile.line-scdn.net/1234",
          statusMessage: "Hello",
        },
      });
    });

    try {
      const userProfile = await oauth.getUserProfile(ACCESS_TOKEN);
      assertEquals(userProfile, {
        id: "U1234567890",
        name: "Changwan Jun",
        picture: "https://profile.line-scdn.net/1234",
        raw: {
          userId: "U1234567890",
          displayName: "Changwan Jun",
          pictureUrl: "https://profile.line-scdn.net/1234",
          statusMessage: "Hello",
        },
      });
      assertSpyCalls(requestStub, 1);
    } finally {
      requestStub.restore();
    }
  });

  it("getUserProfile fail", async () => {
    const requestStub = stub(httpClient, "request", () => {
      return Promise.reject(
        new HttpClientError("Unauthorized", 401, {
          message: "invalid token",
        }),
      );
    });

    try {
      await oauth.getUserProfile("INVALID_ACCESS_TOKEN");
      fail();
    } catch (e) {
      assertInstanceOf(e, OAuthError);
      assertEquals(e.type, "Unauthorized");
      assertEquals(e.message, "invalid token");
    } finally {
      requestStub.restore();
    }
  });
});
