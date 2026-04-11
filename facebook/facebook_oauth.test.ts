import { assertEquals, assertInstanceOf, fail } from "@std/assert";
import { assertSpyCall, assertSpyCalls, stub } from "@std/testing/mock";
import { FetchHttpClient, type HttpClient, HttpClientError, type OAuth, OAuthError } from "../core/mod.ts";
import { FacebookOAuth } from "./facebook_oauth.ts";
import { beforeEach, describe, it } from "@std/testing/bdd";

const CLIENT_ID = Deno.env.get("FACEBOOK_CLIENT_ID") ?? "1234567890";
const CLIENT_SECRET = Deno.env.get("FACEBOOK_CLIENT_SECRET") ?? "1234567890abcdefghijklmnopqrstuvwxyz";
const REDIRECT_URI = "https://openauth.denostack.com/callback/facebook";

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

  it("getAuthRequestUri with default scopes", async () => {
    const uri = await oauth.getAuthRequestUri({ state: "randomstring" });
    assertEquals(
      uri,
      `https://www.facebook.com/${(oauth as FacebookOAuth).version}/dialog/oauth?${new URLSearchParams({
        response_type: "code",
        client_id: CLIENT_ID,
        redirect_uri: REDIRECT_URI,
        state: "randomstring",
        scope: "email",
      })}`,
    );
  });

  it("getAuthRequestUri with custom scopes", async () => {
    const uri = await oauth.getAuthRequestUri({
      state: "randomstring",
      scope: ["email", "public_profile"],
    });
    assertEquals(
      uri,
      `https://www.facebook.com/${(oauth as FacebookOAuth).version}/dialog/oauth?${new URLSearchParams({
        response_type: "code",
        client_id: CLIENT_ID,
        redirect_uri: REDIRECT_URI,
        state: "randomstring",
        scope: "email,public_profile",
      })}`,
    );
  });

  it("getAccessTokenResponse success", async () => {
    const requestStub = stub(httpClient, "request", () => {
      return Promise.resolve({
        status: 200,
        headers: {},
        data: {
          access_token: "FACEBOOK_ACCESS_TOKEN_1234",
          token_type: "bearer",
          expires_in: 5183941,
        },
      });
    });

    try {
      const code = "TOKEN_FROM_FACEBOOK_1234567890";

      const result = await oauth.getAccessTokenResponse(code);
      assertEquals(result, {
        accessToken: "FACEBOOK_ACCESS_TOKEN_1234",
        tokenType: "bearer",
        expiresIn: 5183941,
      });

      assertSpyCalls(requestStub, 1);
      assertSpyCall(requestStub, 0, {
        args: [
          "GET",
          `https://graph.facebook.com/${(oauth as FacebookOAuth).version}/oauth/access_token?${new URLSearchParams({
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            redirect_uri: REDIRECT_URI,
            code,
            grant_type: "authorization_code",
          })}`,
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
    } finally {
      requestStub.restore();
    }
  });

  it("getAuthUser success", async () => {
    const requestStub = stub(httpClient, "request", () => {
      return Promise.resolve({
        status: 200,
        headers: {},
        data: { id: "123456789", email: "wan2land@gmail.com", name: "Changwan Jun" },
      });
    });

    try {
      const ACCESS_TOKEN = "FACEBOOK_ACCESS_TOKEN_1234";
      const authUser = await oauth.getAuthUser(ACCESS_TOKEN);
      assertEquals(authUser, {
        id: "123456789",
        email: "wan2land@gmail.com",
        name: "Changwan Jun",
        avatar: `https://graph.facebook.com/${(oauth as FacebookOAuth).version}/123456789/picture?type=normal`,
        raw: {
          id: "123456789",
          email: "wan2land@gmail.com",
          name: "Changwan Jun",
        },
      });

      assertSpyCalls(requestStub, 1);
      assertSpyCall(requestStub, 0, {
        args: [
          "GET",
          `https://graph.facebook.com/${(oauth as FacebookOAuth).version}/me?${new URLSearchParams({
            fields: "id,email,name",
          })}`,
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
      await oauth.getAuthUser("BAD_TOKEN");
      fail();
    } catch (e) {
      assertInstanceOf(e, OAuthError);
      assertEquals(e.type, "OAuthException");
      assertEquals(e.message, "Invalid OAuth access token - Cannot parse access token");
      assertEquals(e.extra, { code: 190, fbtrace_id: "AXXXXXX" });
    } finally {
      requestStub.restore();
    }
  });
});
