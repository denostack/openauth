import { assertEquals, assertInstanceOf, fail } from "@std/assert";
import { beforeEach, describe, it } from "@std/testing/bdd";
import { stub } from "@std/testing/mock";
import { FetchHttpClient, type HttpClient, HttpClientError, type OAuth, OAuthError } from "../core/mod.ts";
import { DiscordOAuth } from "./discord_oauth.ts";

const CLIENT_ID = Deno.env.get("DISCORD_CLIENT_ID") ?? "1234567890";
const CLIENT_SECRET = Deno.env.get("DISCORD_CLIENT_SECRET") ?? "1234567890abcdefghijklmnopqrstuvwxyz";
const REDIRECT_URI = "https://openauth.denostack.com/callback/discord";
const ACCESS_TOKEN = Deno.env.get("DISCORD_ACCESS_TOKEN") ?? "DISCORD_ACCESS_TOKEN_1234";
const REFRESH_TOKEN = Deno.env.get("DISCORD_REFRESH_TOKEN") ?? "DISCORD_REFRESH_TOKEN_1234";

describe("DiscordOAuth", () => {
  let httpClient: HttpClient;
  let oauth: OAuth;
  beforeEach(() => {
    httpClient = new FetchHttpClient();
    oauth = new DiscordOAuth({
      httpClient,
      clientId: CLIENT_ID,
      clientSecret: CLIENT_SECRET,
      redirectUri: REDIRECT_URI,
    });
  });

  it("getAuthRequestUri", async () => {
    const uri = await oauth.getAuthRequestUri();
    assertEquals(
      uri,
      `https://discord.com/api/oauth2/authorize?${new URLSearchParams({
        response_type: "code",
        client_id: CLIENT_ID,
        redirect_uri: REDIRECT_URI,
        scope: "identify",
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
          expires_in: 604800,
          refresh_token: REFRESH_TOKEN,
          scope: "identify",
        },
      });
    });

    const code = "CODE";
    const result = await oauth.getAccessTokenResponse(code);
    assertEquals(result, {
      accessToken: ACCESS_TOKEN,
      tokenType: "Bearer",
      expiresIn: 604800,
      refreshToken: REFRESH_TOKEN,
      scope: "identify",
    });
  });

  it("getAccessTokenResponse fail", async () => {
    stub(httpClient, "request", () => {
      return Promise.reject(
        new HttpClientError("Bad Request", 400, {
          error: "invalid_grant",
          error_description: 'Invalid "code" in request.',
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
          username: "wan2land",
          discriminator: "0",
          avatar: "abc123def456",
          email: "wan2land@gmail.com",
          global_name: "Cris",
        },
      });
    });

    const userProfile = await oauth.getUserProfile(ACCESS_TOKEN);
    assertEquals(userProfile, {
      id: "123456789",
      username: "wan2land",
      nickname: "Cris",
      email: "wan2land@gmail.com",
      picture: "https://cdn.discordapp.com/avatars/123456789/abc123def456.png",
      raw: {
        id: "123456789",
        username: "wan2land",
        discriminator: "0",
        avatar: "abc123def456",
        email: "wan2land@gmail.com",
        global_name: "Cris",
      },
    });
  });

  it("getUserProfile fail", async () => {
    stub(httpClient, "request", () => {
      return Promise.reject(
        new HttpClientError("Unauthorized", 401, {
          message: "401: Unauthorized",
          code: 0,
        }),
      );
    });

    try {
      await oauth.getUserProfile("INVALID_ACCESS_TOKEN");
      fail();
    } catch (e) {
      assertInstanceOf(e, OAuthError);
      assertEquals(e.type, "Unauthorized");
      assertEquals(e.message, "401: Unauthorized");
    }
  });
});
