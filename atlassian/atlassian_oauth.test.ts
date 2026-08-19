import { assertEquals, assertInstanceOf, fail } from "@std/assert";
import { beforeEach, describe, it } from "@std/testing/bdd";
import { assertSpyCall, stub } from "@std/testing/mock";
import { FetchHttpClient, type HttpClient, HttpClientError, type OAuth, OAuthError } from "../core/mod.ts";
import { AtlassianOAuth } from "./atlassian_oauth.ts";

const CLIENT_ID = Deno.env.get("ATLASSIAN_CLIENT_ID") ?? "1234567890";
const CLIENT_SECRET = Deno.env.get("ATLASSIAN_CLIENT_SECRET") ?? "1234567890abcdefghijklmnopqrstuvwxyz";
const REDIRECT_URI = "https://openauth.denostack.com/callback/atlassian";
const ACCESS_TOKEN = Deno.env.get("ATLASSIAN_ACCESS_TOKEN") ?? "ATLASSIAN_ACCESS_TOKEN_1234";

describe("AtlassianOAuth", () => {
  let httpClient: HttpClient;
  let oauth: OAuth;
  beforeEach(() => {
    httpClient = new FetchHttpClient();
    oauth = new AtlassianOAuth({
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
      `https://auth.atlassian.com/authorize?${new URLSearchParams({
        response_type: "code",
        client_id: CLIENT_ID,
        redirect_uri: REDIRECT_URI,
        scope: "read:me",
        prompt: "consent",
        audience: "api.atlassian.com",
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
          expires_in: 3600,
          token_type: "Bearer",
          scope: "read:me",
        },
      });
    });

    const code = "CODE";
    const result = await oauth.getAccessTokenResponse(code);
    assertEquals(result, {
      accessToken: ACCESS_TOKEN,
      tokenType: "Bearer",
      expiresIn: 3600,
      scope: "read:me",
    });

    assertSpyCall(requestStub, 0, {
      args: ["POST", "https://auth.atlassian.com/oauth/token", {
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
        code,
        grant_type: "authorization_code",
      }, { "content-type": "application/x-www-form-urlencoded" }],
    });
  });

  it("getAccessTokenResponse fail", async () => {
    stub(httpClient, "request", () => {
      return Promise.reject(
        new HttpClientError("Forbidden", 403, {
          error: "invalid_request",
          error_description: "authorization_code is invalid",
        }),
      );
    });

    try {
      const code = "CODE";
      await oauth.getAccessTokenResponse(code);
      fail();
    } catch (e) {
      assertInstanceOf(e, OAuthError);
      assertEquals(e.type, "invalid_request");
      assertEquals(e.message, "authorization_code is invalid");
      assertEquals(e.extra, {});
    }
  });

  it("getUserProfile success", async () => {
    stub(httpClient, "request", () => {
      return Promise.resolve({
        status: 200,
        headers: {},
        data: {
          account_type: "atlassian",
          account_id: "112233aa-bb11-cc22-33dd-445566abcabc",
          email: "wan2land@gmail.com",
          name: "Changwan Jun",
          picture: "https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/128",
          account_status: "active",
          nickname: "wan2land",
          zoneinfo: "Asia/Seoul",
          locale: "en-US",
          extended_profile: {
            job_title: "Development Manager",
            organization: "wan2land@gmail.com",
            department: "Design team",
          },
        },
      });
    });

    const userProfile = await oauth.getUserProfile(ACCESS_TOKEN);
    assertEquals(userProfile, {
      id: "112233aa-bb11-cc22-33dd-445566abcabc",
      nickname: "wan2land",
      name: "Changwan Jun",
      email: "wan2land@gmail.com",
      picture: "https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/128",
      zoneinfo: "Asia/Seoul",
      locale: "en-US",
      raw: {
        account_type: "atlassian",
        account_id: "112233aa-bb11-cc22-33dd-445566abcabc",
        email: "wan2land@gmail.com",
        name: "Changwan Jun",
        picture: "https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/128",
        account_status: "active",
        nickname: "wan2land",
        zoneinfo: "Asia/Seoul",
        locale: "en-US",
        extended_profile: {
          job_title: "Development Manager",
          organization: "wan2land@gmail.com",
          department: "Design team",
        },
      },
    });
  });

  it("getUserProfile fail", async () => {
    stub(httpClient, "request", () => {
      return Promise.reject(
        new HttpClientError("Unauthorized", 401, {
          code: 401,
          message: "Unauthorized",
        }),
      );
    });

    try {
      await oauth.getUserProfile("INVALID_ACCESS_TOKEN");
      fail();
    } catch (e) {
      assertInstanceOf(e, OAuthError);
      assertEquals(e.type, "Unauthorized");
      assertEquals(e.message, "Unauthorized");
    }
  });
});
