import { assertEquals, assertInstanceOf, fail } from "@std/assert";
import { beforeEach, describe, it } from "@std/testing/bdd";
import { assertSpyCall, stub } from "@std/testing/mock";
import { FetchHttpClient, type HttpClient, HttpClientError, type OAuth, OAuthError } from "../core/mod.ts";
import { FigmaOAuth } from "./figma_oauth.ts";

const CLIENT_ID = Deno.env.get("FIGMA_CLIENT_ID") ?? "1234567890";
const CLIENT_SECRET = Deno.env.get("FIGMA_CLIENT_SECRET") ?? "1234567890abcdefghijklmnopqrstuvwxyz";
const REDIRECT_URI = "https://openauth.denostack.com/callback/figma";
const ACCESS_TOKEN = Deno.env.get("FIGMA_ACCESS_TOKEN") ?? "FIGMA_ACCESS_TOKEN_1234";
const REFRESH_TOKEN = Deno.env.get("FIGMA_REFRESH_TOKEN") ?? "FIGMA_REFRESH_TOKEN_1234";

describe("FigmaOAuth", () => {
  let httpClient: HttpClient;
  let oauth: OAuth;
  beforeEach(() => {
    httpClient = new FetchHttpClient();
    oauth = new FigmaOAuth({
      httpClient,
      clientId: CLIENT_ID,
      clientSecret: CLIENT_SECRET,
      redirectUri: REDIRECT_URI,
    });
  });

  it("getAuthRequestUri", async () => {
    const uri = await oauth.getAuthRequestUri({ state: "random_state" });
    assertEquals(
      uri,
      `https://www.figma.com/oauth?${new URLSearchParams({
        response_type: "code",
        client_id: CLIENT_ID,
        redirect_uri: REDIRECT_URI,
        state: "random_state", // required
        scope: "current_user:read",
      })}`,
    );
  });

  it("getAccessTokenResponse success", async () => {
    const requestStub = stub(httpClient, "request", () => {
      return Promise.resolve({
        status: 200,
        headers: {},
        data: {
          user_id: 123456789,
          access_token: ACCESS_TOKEN,
          token_type: "bearer",
          expires_in: 7776000,
          refresh_token: REFRESH_TOKEN,
        },
      });
    });

    const code = "CODE";
    const result = await oauth.getAccessTokenResponse(code, { state: "random_state" });
    assertEquals(result, {
      accessToken: ACCESS_TOKEN,
      tokenType: "bearer",
      expiresIn: 7776000,
      refreshToken: REFRESH_TOKEN,
    });

    // Figma sends the credentials via HTTP Basic auth; client_secret is not in the body
    assertSpyCall(requestStub, 0, {
      args: ["POST", "https://api.figma.com/v1/oauth/token", {
        client_id: CLIENT_ID,
        redirect_uri: REDIRECT_URI,
        code,
        grant_type: "authorization_code",
        state: "random_state",
      }, {
        "content-type": "application/x-www-form-urlencoded",
        authorization: `Basic ${btoa(`${CLIENT_ID}:${CLIENT_SECRET}`)}`,
      }],
    });
  });

  it("getAccessTokenResponse fail", async () => {
    stub(httpClient, "request", () => {
      return Promise.reject(
        new HttpClientError("Bad Request", 400, {
          error: "invalid_grant",
          error_description: "An error occurred processing your request",
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
      assertEquals(e.message, "An error occurred processing your request");
      assertEquals(e.extra, {});
    }
  });

  it("getUserProfile success", async () => {
    stub(httpClient, "request", () => {
      return Promise.resolve({
        status: 200,
        headers: {},
        data: {
          id: "123456789",
          handle: "Changwan Jun",
          img_url: "https://s3-alpha.figma.com/profile/1234abcd",
          email: "wan2land@gmail.com",
        },
      });
    });

    const userProfile = await oauth.getUserProfile(ACCESS_TOKEN);
    assertEquals(userProfile, {
      id: "123456789",
      name: "Changwan Jun",
      email: "wan2land@gmail.com",
      picture: "https://s3-alpha.figma.com/profile/1234abcd",
      raw: {
        id: "123456789",
        handle: "Changwan Jun",
        img_url: "https://s3-alpha.figma.com/profile/1234abcd",
        email: "wan2land@gmail.com",
      },
    });
  });

  it("getUserProfile fail", async () => {
    stub(httpClient, "request", () => {
      return Promise.reject(
        new HttpClientError("Forbidden", 403, {
          status: 403,
          err: "Invalid token",
        }),
      );
    });

    try {
      await oauth.getUserProfile("INVALID_ACCESS_TOKEN");
      fail();
    } catch (e) {
      assertInstanceOf(e, OAuthError);
      assertEquals(e.type, "Forbidden");
      assertEquals(e.message, "Error occurred");
      assertEquals(e.extra, { status: 403, err: "Invalid token" });
    }
  });
});
