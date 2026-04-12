import { assertEquals, assertInstanceOf, fail } from "@std/assert";
import { beforeEach, describe, it } from "@std/testing/bdd";
import { assertSpyCalls, stub } from "@std/testing/mock";
import { FetchHttpClient, type HttpClient, HttpClientError, type OAuth, OAuthError } from "../core/mod.ts";
import { NaverOAuth } from "./naver_oauth.ts";

const CLIENT_ID = Deno.env.get("NAVER_CLIENT_ID") ?? "1234567890";
const CLIENT_SECRET = Deno.env.get("NAVER_CLIENT_SECRET") ?? "1234567890abcdefghijklmnopqrstuvwxyz";
const REDIRECT_URI = "https://openauth.denostack.com/callback/naver";
const ACCESS_TOKEN = Deno.env.get("NAVER_ACCESS_TOKEN") ?? "NAVER_ACCESS_TOKEN_1234";
const REFRESH_TOKEN = Deno.env.get("NAVER_REFRESH_TOKEN") ?? "NAVER_REFRESH_TOKEN_1234";

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

  it("getAuthRequestUri", async () => {
    const uri = await oauth.getAuthRequestUri();
    console.log(uri);
    assertEquals(
      uri,
      `https://nid.naver.com/oauth2.0/authorize?${new URLSearchParams({
        response_type: "code",
        client_id: CLIENT_ID,
        redirect_uri: REDIRECT_URI,
        scope: "openid",
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
          refresh_token: REFRESH_TOKEN,
          token_type: "bearer",
          expires_in: "3600",
        },
      });
    });

    try {
      const code = "CODE";
      const result = await oauth.getAccessTokenResponse(code);
      assertEquals(result, {
        accessToken: ACCESS_TOKEN,
        refreshToken: REFRESH_TOKEN,
        tokenType: "bearer",
        expiresIn: 3600,
      });
      assertSpyCalls(requestStub, 1);
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
      const code = "CODE";
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

  it("getUserProfile success", async () => {
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
            profile_image: "https://phinf.pstatic.net/contact/1234567",
            email: "wan2land@gmail.com",
            name: "Changwan Jun",
          },
        },
      });
    });

    try {
      const userProfile = await oauth.getUserProfile(ACCESS_TOKEN);
      assertEquals(userProfile, {
        id: "123456789",
        nickname: "Cris",
        picture: "https://phinf.pstatic.net/contact/1234567",
        email: "wan2land@gmail.com",
        name: "Changwan Jun",
        raw: {
          id: "123456789",
          nickname: "Cris",
          profile_image: "https://phinf.pstatic.net/contact/1234567",
          email: "wan2land@gmail.com",
          name: "Changwan Jun",
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
          resultcode: "024",
          message: "Authentication failed (인증 실패하였습니다.)",
        }),
      );
    });

    try {
      await oauth.getUserProfile("INVALID_ACCESS_TOKEN");
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
