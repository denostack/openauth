import { assertEquals, assertInstanceOf, fail } from "@std/assert";
import { assertSpyCall, assertSpyCalls, stub } from "@std/testing/mock";
import { FetchHttpClient, type HttpClient, HttpClientError, type OAuth, OAuthError } from "../core/mod.ts";
import { NaverOAuth } from "./naver_oauth.ts";
import { beforeEach, describe, it } from "@std/testing/bdd";

const CLIENT_ID = Deno.env.get("NAVER_CLIENT_ID") ?? "1234567890";
const CLIENT_SECRET = Deno.env.get("NAVER_CLIENT_SECRET") ?? "1234567890abcdefghijklmnopqrstuvwxyz";
const REDIRECT_URI = "https://openauth.denostack.com/callback/naver";

describe("NaverOAuth", () => {
  let httpClient: HttpClient;
  let oauth: OAuth;
  beforeEach(() => {
    httpClient = new FetchHttpClient();
    oauth = new NaverOAuth({
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
      `https://nid.naver.com/oauth2.0/authorize?${new URLSearchParams({
        response_type: "code",
        client_id: CLIENT_ID,
        redirect_uri: REDIRECT_URI,
        state: "randomstring",
        scope: "openid",
      })}`,
    );
  });

  it("getAuthRequestUri with custom scopes", async () => {
    const uri = await oauth.getAuthRequestUri({
      state: "randomstring",
      scope: ["openid", "email"],
    });
    assertEquals(
      uri,
      `https://nid.naver.com/oauth2.0/authorize?${new URLSearchParams({
        response_type: "code",
        client_id: CLIENT_ID,
        redirect_uri: REDIRECT_URI,
        state: "randomstring",
        scope: "openid,email",
      })}`,
    );
  });

  it("getAccessTokenResponse success", async () => {
    const requestStub = stub(httpClient, "request", () => {
      return Promise.resolve({
        status: 200,
        headers: {},
        data: {
          access_token: "NAVER_ACCESS_TOKEN_1234",
          refresh_token: "NAVER_REFRESH_TOKEN_1234",
          token_type: "bearer",
          expires_in: "3600",
        },
      });
    });

    try {
      const code = "TOKEN_FROM_NAVER_1234567890";

      const result = await oauth.getAccessTokenResponse(code);
      assertEquals(result, {
        accessToken: "NAVER_ACCESS_TOKEN_1234",
        refreshToken: "NAVER_REFRESH_TOKEN_1234",
        tokenType: "bearer",
        expiresIn: 3600,
      });

      assertSpyCalls(requestStub, 1);
      assertSpyCall(requestStub, 0, {
        args: [
          "GET",
          `https://nid.naver.com/oauth2.0/token?${new URLSearchParams({
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
        new HttpClientError("OK", 200, {
          error: "invalid_request",
          error_description: "no valid data in session",
          unknown_params: "unknown_value",
        }),
      );
    });

    try {
      const code = "TOKEN_FROM_NAVER_1234567890";
      await oauth.getAccessTokenResponse(code);
      fail();
    } catch (e) {
      assertInstanceOf(e, OAuthError);
      assertEquals(e.type, "invalid_request");
      assertEquals(e.message, "no valid data in session");
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
          resultcode: "00",
          message: "success",
          response: {
            id: "123456789",
            nickname: "Cris",
            profile_image: "https://corgi.photos/200/200",
            email: "wan2land@gmail.com",
            name: "Changwan Jun",
          },
        },
      });
    });

    try {
      const ACCESS_TOKEN = "NAVER_ACCESS_TOKEN_1234";
      const authUser = await oauth.getAuthUser(ACCESS_TOKEN);
      assertEquals(authUser, {
        id: "123456789",
        nickname: "Cris",
        avatar: "https://corgi.photos/200/200",
        email: "wan2land@gmail.com",
        name: "Changwan Jun",
        raw: {
          id: "123456789",
          nickname: "Cris",
          profile_image: "https://corgi.photos/200/200",
          email: "wan2land@gmail.com",
          name: "Changwan Jun",
        },
      });

      assertSpyCalls(requestStub, 1);
      assertSpyCall(requestStub, 0, {
        args: [
          "GET",
          "https://openapi.naver.com/v1/nid/me",
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
          resultcode: "024",
          message: "Authentication failed (인증 실패하였습니다.)",
        }),
      );
    });

    try {
      await oauth.getAuthUser("NAVER_ACCESS_TOKEN_1234");
      fail();
    } catch (e) {
      assertInstanceOf(e, OAuthError);
      assertEquals(e.type, "Unauthorized");
      assertEquals(e.message, "Authentication failed (인증 실패하였습니다.)");
      assertEquals(e.extra, { resultcode: "024" });
    } finally {
      requestStub.restore();
    }
  });
});
