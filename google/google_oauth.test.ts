import { assertEquals, assertInstanceOf, fail } from "@std/assert";
import { assertSpyCall, assertSpyCalls, stub } from "@std/testing/mock";
import { describe, it } from "@std/testing/bdd";
import { FetchHttpClient, OAuthError } from "../core/mod.ts";
import { GoogleOAuth } from "./google_oauth.ts";

const CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID") ?? "1234567890";
const CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET") ?? "1234567890abcdefghijklmnopqrstuvwxyz";
const REDIRECT_URI = "https://openauth.denostack.com/callback/google";
const SCOPE = ["openid", "profile", "email"];

describe("GoogleOAuth", () => {
  it("getAuthRequestUri", async () => {
    const httpClient = new FetchHttpClient();
    const oauth = new GoogleOAuth({
      client: httpClient,
      clientId: CLIENT_ID,
      clientSecret: CLIENT_SECRET,
      redirectUri: REDIRECT_URI,
      scope: SCOPE,
    });

    const uri = await oauth.getAuthRequestUri();
    assertEquals(
      uri,
      `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${
        encodeURIComponent(REDIRECT_URI)
      }&scope=${encodeURIComponent(SCOPE.join(" ")).replace(/%20/g, "+")}`,
    );
  });

  it("getAccessTokenResponse success", async () => {
    const httpClient = new FetchHttpClient();
    const requestStub = stub(httpClient, "request", () => {
      return Promise.resolve({
        status: 200,
        headers: {},
        data: {
          access_token: "GOOGLE_ACCESS_TOKEN_1234",
          expires_in: 3599,
          token_type: "Bearer",
          scope: SCOPE.join(" "),
          id_token: "IDTOKEN_1234567890",
        },
      });
    });

    try {
      const oauth = new GoogleOAuth({
        client: httpClient,
        clientId: CLIENT_ID,
        clientSecret: CLIENT_SECRET,
        redirectUri: REDIRECT_URI,
        scope: SCOPE,
      });

      const REDIRECT_CALLBACK_URL =
        "https://openauth.denostack.com/callback/google?iss=https%3A%2F%2Faccounts.google.com&code=GOOGLE_CODE_1234&scope=email+profile+https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fuserinfo.profile+https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fuserinfo.email+openid&authuser=0&prompt=consent";
      const searchParams = Object.fromEntries(new URL(REDIRECT_CALLBACK_URL).searchParams.entries());
      const code = searchParams.code;

      const result = await oauth.getAccessTokenResponse(code);
      assertEquals(result, {
        accessToken: "GOOGLE_ACCESS_TOKEN_1234",
        tokenType: "Bearer",
        expiresIn: 3599,
      });

      assertSpyCalls(requestStub, 1);
      assertSpyCall(requestStub, 0, {
        args: [
          "POST",
          "https://oauth2.googleapis.com/token",
          {
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            redirect_uri: REDIRECT_URI,
            code: code,
            grant_type: "authorization_code",
          },
        ],
      });
    } finally {
      requestStub.restore();
    }
  });

  it("getAccessTokenResponse fail", async () => {
    const httpClient = new FetchHttpClient();
    const requestStub = stub(httpClient, "request", () => {
      return Promise.resolve({
        status: 400,
        headers: {},
        data: {
          error: "invalid_grant",
          error_description: "Malformed auth code.",
          unknown_params: "unknown_value",
        },
      });
    });

    try {
      const oauth = new GoogleOAuth({
        client: httpClient,
        clientId: CLIENT_ID,
        clientSecret: CLIENT_SECRET,
        redirectUri: REDIRECT_URI,
        scope: SCOPE,
      });

      const code = "GOOGLE_CODE_1234";
      try {
        await oauth.getAccessTokenResponse(code);
        fail();
      } catch (e) {
        assertInstanceOf(e, OAuthError);
        assertEquals(e.type, "invalid_grant");
        assertEquals(e.message, "Malformed auth code.");
        assertEquals(e.extra, { unknown_params: "unknown_value" });
      }

      assertSpyCalls(requestStub, 1);
      assertSpyCall(requestStub, 0, {
        args: [
          "POST",
          "https://oauth2.googleapis.com/token",
          {
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            redirect_uri: REDIRECT_URI,
            code,
            grant_type: "authorization_code",
          },
        ],
      });
    } finally {
      requestStub.restore();
    }
  });

  it("getAuthUser", async () => {
    const httpClient = new FetchHttpClient();
    const requestStub = stub(httpClient, "request", () => {
      return Promise.resolve({
        status: 200,
        headers: {},
        data: {
          sub: "123456789",
          name: "Changwan Jun",
          given_name: "Changwan",
          family_name: "Jun",
          picture: "https://corgi.photos/200/200",
          email: "wan2land@gmail.com",
          email_verified: true,
          locale: "ko",
        },
      });
    });

    try {
      const oauth = new GoogleOAuth({
        client: httpClient,
        clientId: CLIENT_ID,
        clientSecret: CLIENT_SECRET,
        redirectUri: REDIRECT_URI,
        scope: SCOPE,
      });

      const ACCESS_TOKEN = "GOOGLE_ACCESS_TOKEN_1234";
      const authUser = await oauth.getAuthUser(ACCESS_TOKEN);
      assertEquals(authUser, {
        id: "123456789",
        email: "wan2land@gmail.com",
        name: "Changwan Jun",
        avatar: "https://corgi.photos/200/200",
        raw: {
          sub: "123456789",
          name: "Changwan Jun",
          given_name: "Changwan",
          family_name: "Jun",
          picture: "https://corgi.photos/200/200",
          email: "wan2land@gmail.com",
          email_verified: true,
          locale: "ko",
        },
      });

      assertSpyCalls(requestStub, 1);
      assertSpyCall(requestStub, 0, {
        args: [
          "GET",
          "https://www.googleapis.com/oauth2/v3/userinfo",
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
});
