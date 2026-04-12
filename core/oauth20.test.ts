import { assertEquals } from "@std/assert";
import { beforeEach, describe, it } from "@std/testing/bdd";
import { assertSpyCall, assertSpyCalls, stub } from "@std/testing/mock";
import { FetchHttpClient, type HttpClient, type OAuth } from "../core/mod.ts";
import type { UserProfile } from "./oauth.ts";
import { OAuth20 } from "./oauth20.ts";

class CustomOAuth20 extends OAuth20 {
  authRequestUri = "https://openauth.denostack.com/oauth2/authorize";
  accessTokenRequestUri = "https://openauth.denostack.com/oauth2/token";
  userProfileUri = "https://openauth.denostack.com/oauth2/userinfo";

  override defaultScopes = ["userinfo"];
  override scopeSeparator: string = "|";

  mapDataToUserProfile(data: Record<string, unknown>): UserProfile {
    return {
      id: data.sub as string,
      raw: data,
    };
  }
}

describe("OAuth20", () => {
  let httpClient: HttpClient;
  let oauth: OAuth;
  beforeEach(() => {
    httpClient = new FetchHttpClient();
    oauth = new CustomOAuth20({
      client: httpClient,
      clientId: "CLIENT_ID",
      clientSecret: "CLIENT_SECRET",
      redirectUri: "REDIRECT_URI",
    });
  });

  it("getAuthRequestUri without options", async () => {
    const uri = await oauth.getAuthRequestUri();
    assertEquals(
      uri,
      `https://openauth.denostack.com/oauth2/authorize?${new URLSearchParams({
        response_type: "code",
        client_id: "CLIENT_ID",
        redirect_uri: "REDIRECT_URI",
        scope: "userinfo", // default scope
      })}`,
    );
  });

  it("getAuthRequestUri with options", async () => {
    const uri = await oauth.getAuthRequestUri({
      clientId: "OVERRIDE_CLIENT_ID",
      redirectUri: "OVERRIDE_REDIRECT_URI",
      responseType: "token",
      scope: ["openid", "profile", "email"],
      state: "randomstring",
    });
    assertEquals(
      uri,
      `https://openauth.denostack.com/oauth2/authorize?${new URLSearchParams({
        response_type: "token",
        client_id: "OVERRIDE_CLIENT_ID",
        redirect_uri: "OVERRIDE_REDIRECT_URI",
        state: "randomstring",
        scope: "openid|profile|email",
      })}`,
    );
  });

  it("getAccessTokenResponse without options", async () => {
    const requestStub = stub(httpClient, "request", () => {
      return Promise.resolve({
        status: 200,
        headers: {},
        data: {
          access_token: "ACCESS_TOKEN",
          token_type: "Bearer",
          refresh_token: "REFRESH_TOKEN",
          expires_in: 2592000,
          scope: "userinfo",
          id_token: "ID_TOKEN",
        },
      });
    });

    try {
      const code = "CODE";
      const result = await oauth.getAccessTokenResponse(code);
      assertEquals(result, {
        scope: "userinfo",
        accessToken: "ACCESS_TOKEN",
        tokenType: "Bearer",
        expiresIn: 2592000,
        refreshToken: "REFRESH_TOKEN",
        idToken: "ID_TOKEN",
      });
      assertSpyCalls(requestStub, 1);
      assertSpyCall(requestStub, 0, {
        args: [
          "POST",
          "https://openauth.denostack.com/oauth2/token",
          {
            client_id: "CLIENT_ID",
            client_secret: "CLIENT_SECRET",
            redirect_uri: "REDIRECT_URI",
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

  it("getAccessTokenResponse with options", async () => {
    const requestStub = stub(httpClient, "request", () => {
      return Promise.resolve({
        status: 200,
        headers: {},
        data: {
          access_token: "ACCESS_TOKEN",
          token_type: "Bearer",
          refresh_token: "REFRESH_TOKEN",
          expires_in: 2592000,
          scope: "userinfo",
          id_token: "ID_TOKEN",
        },
      });
    });

    try {
      const code = "CODE";
      const result = await oauth.getAccessTokenResponse(code, {
        clientId: "OVERRIDE_CLIENT_ID",
        clientSecret: "OVERRIDE_CLIENT_SECRET",
        redirectUri: "OVERRIDE_REDIRECT_URI",
        state: "STATE",
      });
      assertEquals(result, {
        scope: "userinfo",
        accessToken: "ACCESS_TOKEN",
        tokenType: "Bearer",
        expiresIn: 2592000,
        refreshToken: "REFRESH_TOKEN",
        idToken: "ID_TOKEN",
      });
      assertSpyCalls(requestStub, 1);
      assertSpyCall(requestStub, 0, {
        args: [
          "POST",
          "https://openauth.denostack.com/oauth2/token",
          {
            client_id: "OVERRIDE_CLIENT_ID",
            client_secret: "OVERRIDE_CLIENT_SECRET",
            redirect_uri: "OVERRIDE_REDIRECT_URI",
            code,
            grant_type: "authorization_code",
            state: "STATE",
          },
          { "content-type": "application/x-www-form-urlencoded" },
        ],
      });
    } finally {
      requestStub.restore();
    }
  });

  it("getAccessTokenResponse with get method", async () => {
    (oauth as CustomOAuth20).requestAccessTokenMethod = "get";
    const requestStub = stub(httpClient, "request", () => {
      return Promise.resolve({
        status: 200,
        headers: {},
        data: {
          access_token: "ACCESS_TOKEN",
          token_type: "Bearer",
          refresh_token: "REFRESH_TOKEN",
          expires_in: 2592000,
          scope: "userinfo",
          id_token: "ID_TOKEN",
        },
      });
    });

    try {
      const code = "CODE";
      const result = await oauth.getAccessTokenResponse(code, {
        clientId: "OVERRIDE_CLIENT_ID",
        clientSecret: "OVERRIDE_CLIENT_SECRET",
        redirectUri: "OVERRIDE_REDIRECT_URI",
        state: "STATE",
      });
      assertEquals(result, {
        scope: "userinfo",
        accessToken: "ACCESS_TOKEN",
        tokenType: "Bearer",
        expiresIn: 2592000,
        refreshToken: "REFRESH_TOKEN",
        idToken: "ID_TOKEN",
      });
      assertSpyCalls(requestStub, 1);
      assertSpyCall(requestStub, 0, {
        args: [
          "GET",
          `https://openauth.denostack.com/oauth2/token?${new URLSearchParams({
            client_id: "OVERRIDE_CLIENT_ID",
            client_secret: "OVERRIDE_CLIENT_SECRET",
            redirect_uri: "OVERRIDE_REDIRECT_URI",
            code,
            grant_type: "authorization_code",
            state: "STATE",
          })}`,
        ],
      });
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
          sub: "12345",
          something: "something",
        },
      });
    });

    try {
      const userProfile = await oauth.getUserProfile("ACCESS_TOKEN");
      assertEquals(userProfile, {
        id: "12345",
        raw: {
          sub: "12345",
          something: "something",
        },
      });
      assertSpyCalls(requestStub, 1);
      assertSpyCall(requestStub, 0, {
        args: ["GET", "https://openauth.denostack.com/oauth2/userinfo", {}, {
          authorization: `Bearer ACCESS_TOKEN`,
        }],
      });
    } finally {
      requestStub.restore();
    }
  });
});
