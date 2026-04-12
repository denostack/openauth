import { assertEquals, assertInstanceOf, fail } from "@std/assert";
import { beforeEach, describe, it } from "@std/testing/bdd";
import { stub } from "@std/testing/mock";
import { FetchHttpClient, type HttpClient, HttpClientError, type OAuth, OAuthError } from "../core/mod.ts";
import { FacebookOAuth } from "./facebook_oauth.ts";

const CLIENT_ID = Deno.env.get("FACEBOOK_CLIENT_ID") ?? "1234567890";
const CLIENT_SECRET = Deno.env.get("FACEBOOK_CLIENT_SECRET") ?? "1234567890abcdefghijklmnopqrstuvwxyz";
const REDIRECT_URI = "https://openauth.denostack.com/callback/facebook";
const ACCESS_TOKEN = Deno.env.get("FACEBOOK_ACCESS_TOKEN") ?? "FACEBOOK_ACCESS_TOKEN_1234";
const ID_TOKEN = Deno.env.get("FACEBOOK_ID_TOKEN") ?? "FACEBOOK_ID_TOKEN_1234";

describe("FacebookOAuth", () => {
  let httpClient: HttpClient;
  let oauth: OAuth;
  beforeEach(() => {
    httpClient = new FetchHttpClient();
    oauth = new FacebookOAuth({
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
      `https://www.facebook.com/${(oauth as FacebookOAuth).version}/dialog/oauth?${new URLSearchParams({
        response_type: "code",
        client_id: CLIENT_ID,
        redirect_uri: REDIRECT_URI,
        scope: "email",
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
          expires_in: 5183941,
        },
      });
    });

    const code = "CODE";

    const result = await oauth.getAccessTokenResponse(code);
    assertEquals(result, {
      accessToken: ACCESS_TOKEN,
      tokenType: "bearer",
      expiresIn: 5183941,
    });
  });

  it("getAccessTokenResponse fail", async () => {
    stub(httpClient, "request", () => {
      return Promise.reject(
        new HttpClientError("Bad Request", 400, {
          error: {
            message: "Invalid verification code format.",
            type: "OAuthException",
            code: 100,
            fbtrace_id: "AXXXXXXXX",
          },
        }),
      );
    });

    try {
      const code = "TOKEN_FROM_FACEBOOK_1234567890";
      await oauth.getAccessTokenResponse(code);
      fail();
    } catch (e) {
      assertInstanceOf(e, OAuthError);
      assertEquals(e.type, "OAuthException");
      assertEquals(e.message, "Invalid verification code format.");
      assertEquals(e.extra, { code: 100, fbtrace_id: "AXXXXXXXX" });
    }
  });

  it("getUserProfile success", async () => {
    stub(httpClient, "request", () => {
      return Promise.resolve({
        status: 200,
        headers: {},
        data: { id: "123456789", email: "wan2land@gmail.com", name: "Changwan Jun" },
      });
    });

    const userProfile = await oauth.getUserProfile(ACCESS_TOKEN);
    assertEquals(userProfile, {
      id: "123456789",
      email: "wan2land@gmail.com",
      name: "Changwan Jun",
      picture: `https://graph.facebook.com/${(oauth as FacebookOAuth).version}/123456789/picture?type=normal`,
      raw: {
        id: "123456789",
        email: "wan2land@gmail.com",
        name: "Changwan Jun",
      },
    });
  });

  it("getUserProfile fail", async () => {
    stub(httpClient, "request", () => {
      return Promise.reject(
        new HttpClientError("Unauthorized", 401, {
          error: {
            message: "Invalid OAuth access token - Cannot parse access token",
            type: "OAuthException",
            code: 190,
            fbtrace_id: "AXXXXXX",
          },
        }),
      );
    });

    try {
      await oauth.getUserProfile("BAD_TOKEN");
      fail();
    } catch (e) {
      assertInstanceOf(e, OAuthError);
      assertEquals(e.type, "OAuthException");
      assertEquals(e.message, "Invalid OAuth access token - Cannot parse access token");
      assertEquals(e.extra, { code: 190, fbtrace_id: "AXXXXXX" });
    }
  });
});
