import { assertEquals, assertInstanceOf, fail } from "@std/assert";
import { assertSpyCall, assertSpyCalls, stub } from "@std/testing/mock";
import { FetchHttpClient, type HttpClient, HttpClientError, type OAuth, OAuthError } from "../core/mod.ts";
import { DiscordOAuth } from "./discord_oauth.ts";
import { beforeEach, describe, it } from "@std/testing/bdd";

const CLIENT_ID = Deno.env.get("DISCORD_CLIENT_ID") ?? "1234567890";
const CLIENT_SECRET = Deno.env.get("DISCORD_CLIENT_SECRET") ?? "1234567890abcdefghijklmnopqrstuvwxyz";
const REDIRECT_URI = "https://openauth.denostack.com/callback/discord";

describe("DiscordOAuth", () => {
  let httpClient: HttpClient;
  let oauth: OAuth;
  beforeEach(() => {
    httpClient = new FetchHttpClient();
    oauth = new DiscordOAuth({
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
      `https://discord.com/api/oauth2/authorize?${new URLSearchParams({
        response_type: "code",
        client_id: CLIENT_ID,
        redirect_uri: REDIRECT_URI,
        state: "randomstring",
        scope: "identify",
      })}`,
    );
  });

  it("getAuthRequestUri with custom scopes", async () => {
    const uri = await oauth.getAuthRequestUri({
      state: "randomstring",
      scope: ["identify", "email"],
    });
    assertEquals(
      uri,
      `https://discord.com/api/oauth2/authorize?${new URLSearchParams({
        response_type: "code",
        client_id: CLIENT_ID,
        redirect_uri: REDIRECT_URI,
        state: "randomstring",
        scope: "identify email",
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
          expires_in: 604800,
          refresh_token: "REFRESH_TOKEN",
          scope: "identify",
        },
      });
    });

    try {
      const code = "CODE";
      const result = await oauth.getAccessTokenResponse(code);
      assertEquals(result, {
        accessToken: "ACCESS_TOKEN",
        tokenType: "Bearer",
        expiresIn: 604800,
        refreshToken: "REFRESH_TOKEN",
      });
      assertSpyCalls(requestStub, 1);
      assertSpyCall(requestStub, 0, {
        args: [
          "POST",
          "https://discord.com/api/v10/oauth2/token",
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
          error_description: 'Invalid "code" in request.',
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
      assertEquals(e.message, 'Invalid "code" in request.');
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
          id: "123456789",
          username: "wan2land",
          discriminator: "0",
          avatar: "abc123def456",
          email: "wan2land@gmail.com",
          global_name: "Cris",
        },
      });
    });

    try {
      const accessToken = "ACCESS_TOKEN";
      const authUser = await oauth.getAuthUser(accessToken);
      assertEquals(authUser, {
        id: "123456789",
        nickname: "Cris",
        email: "wan2land@gmail.com",
        avatar: "https://cdn.discordapp.com/avatars/123456789/abc123def456.png",
        raw: {
          id: "123456789",
          username: "wan2land",
          discriminator: "0",
          avatar: "abc123def456",
          email: "wan2land@gmail.com",
          global_name: "Cris",
        },
      });
      assertSpyCalls(requestStub, 1);
      assertSpyCall(requestStub, 0, {
        args: ["GET", "https://discord.com/api/v10/users/@me", {}, { authorization: "Bearer ACCESS_TOKEN" }],
      });
    } finally {
      requestStub.restore();
    }
  });

  it("getAuthUser fail", async () => {
    const requestStub = stub(httpClient, "request", () => {
      return Promise.reject(
        new HttpClientError("Unauthorized", 401, {
          message: "401: Unauthorized",
          code: 0,
        }),
      );
    });

    try {
      const accessToken = "ACCESS_TOKEN";
      await oauth.getAuthUser(accessToken);
      fail();
    } catch (e) {
      assertInstanceOf(e, OAuthError);
      assertEquals(e.type, "Unauthorized");
      assertEquals(e.message, "401: Unauthorized");
    } finally {
      requestStub.restore();
    }
  });
});
