import { assertEquals, assertInstanceOf, fail } from "@std/assert";
import { beforeEach, describe, it } from "@std/testing/bdd";
import { assertSpyCall, stub } from "@std/testing/mock";
import {
  FetchHttpClient,
  type HttpClient,
  HttpClientError,
  type JwtVerifier,
  type OAuth,
  OAuthError,
  WebCryptoJwtVerifier,
} from "../core/mod.ts";
import { SlackOAuth } from "./slack_oauth.ts";

const CLIENT_ID = Deno.env.get("SLACK_CLIENT_ID") ?? "1234567890.1234567890";
const CLIENT_SECRET = Deno.env.get("SLACK_CLIENT_SECRET") ?? "1234567890abcdefghijklmnopqrstuvwxyz";
const REDIRECT_URI = "https://openauth.denostack.com/callback/slack";
const ACCESS_TOKEN = Deno.env.get("SLACK_ACCESS_TOKEN") ?? "SLACK_ACCESS_TOKEN_1234";
const ID_TOKEN = Deno.env.get("SLACK_ID_TOKEN") ?? "SLACK_ID_TOKEN_1234";

describe("SlackOAuth", () => {
  let httpClient: HttpClient;
  let jwtVerifier: JwtVerifier;
  let oauth: OAuth;
  beforeEach(() => {
    httpClient = new FetchHttpClient();
    jwtVerifier = new WebCryptoJwtVerifier();
    oauth = new SlackOAuth({
      httpClient,
      jwtVerifier,
      clientId: CLIENT_ID,
      clientSecret: CLIENT_SECRET,
      redirectUri: REDIRECT_URI,
    });
  });

  it("getAuthRequestUri", async () => {
    const uri = await oauth.getAuthRequestUri();
    assertEquals(
      uri,
      `https://slack.com/openid/connect/authorize?${new URLSearchParams({
        response_type: "code",
        client_id: CLIENT_ID,
        redirect_uri: REDIRECT_URI,
        scope: "openid profile email",
      })}`,
    );
  });

  it("getAccessTokenResponse success", async () => {
    const requestStub = stub(httpClient, "request", () => {
      return Promise.resolve({
        status: 200,
        headers: {},
        data: {
          ok: true,
          access_token: ACCESS_TOKEN,
          token_type: "Bearer",
          id_token: ID_TOKEN,
        },
      });
    });

    const code = "CODE";
    const result = await oauth.getAccessTokenResponse(code);
    assertEquals(result, {
      accessToken: ACCESS_TOKEN,
      tokenType: "Bearer",
      idToken: ID_TOKEN,
    });

    // Slack only reads credentials from the request body
    assertSpyCall(requestStub, 0, {
      args: ["POST", "https://slack.com/api/openid.connect.token", {
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
        new HttpClientError("OK", 200, {
          ok: false,
          error: "invalid_code",
        }),
      );
    });

    try {
      const code = "CODE";
      await oauth.getAccessTokenResponse(code);
      fail();
    } catch (e) {
      assertInstanceOf(e, OAuthError);
      assertEquals(e.type, "invalid_code");
      assertEquals(e.message, "Error occurred");
      assertEquals(e.extra, { ok: false });
    }
  });

  it("getUserProfile success", async () => {
    stub(httpClient, "request", () => {
      return Promise.resolve({
        status: 200,
        headers: {},
        data: {
          ok: true,
          sub: "U0R7JM123",
          "https://slack.com/user_id": "U0R7JM123",
          "https://slack.com/team_id": "T0R7GR123",
          email: "wan2land@gmail.com",
          email_verified: true,
          date_email_verified: 1622128723,
          name: "Changwan Jun",
          picture: "https://secure.gravatar.com/avatar/1234.png",
          given_name: "Changwan",
          family_name: "Jun",
          locale: "en-US",
          "https://slack.com/team_name": "DenoStack",
          "https://slack.com/team_domain": "denostack",
        },
      });
    });

    const userProfile = await oauth.getUserProfile(ACCESS_TOKEN);
    assertEquals(userProfile, {
      id: "U0R7JM123",
      name: "Changwan Jun",
      email: "wan2land@gmail.com",
      emailVerified: true,
      picture: "https://secure.gravatar.com/avatar/1234.png",
      locale: "en-US",
      raw: {
        ok: true,
        sub: "U0R7JM123",
        "https://slack.com/user_id": "U0R7JM123",
        "https://slack.com/team_id": "T0R7GR123",
        email: "wan2land@gmail.com",
        email_verified: true,
        date_email_verified: 1622128723,
        name: "Changwan Jun",
        picture: "https://secure.gravatar.com/avatar/1234.png",
        given_name: "Changwan",
        family_name: "Jun",
        locale: "en-US",
        "https://slack.com/team_name": "DenoStack",
        "https://slack.com/team_domain": "denostack",
      },
    });
  });

  it("getUserProfile fail", async () => {
    stub(httpClient, "request", () => {
      return Promise.reject(
        new HttpClientError("invalid_auth", 200, {
          ok: false,
          error: "invalid_auth",
        }),
      );
    });

    try {
      await oauth.getUserProfile("INVALID_ACCESS_TOKEN");
      fail();
    } catch (e) {
      assertInstanceOf(e, OAuthError);
      assertEquals(e.type, "invalid_auth");
      assertEquals(e.message, "Error occurred");
      assertEquals(e.extra, { ok: false });
    }
  });

  it("getUserProfileFromIdToken success", async () => {
    stub(jwtVerifier, "verify", () => {
      return Promise.resolve({
        iss: "https://slack.com",
        sub: "U0R7JM123",
        aud: CLIENT_ID,
        exp: 1775969077,
        iat: 1775965477,
        auth_time: 1775965477,
        nonce: "abcd",
        at_hash: "SGVsbG8gV29ybGQ",
        "https://slack.com/team_id": "T0R7GR123",
        "https://slack.com/user_id": "U0R7JM123",
        email: "wan2land@gmail.com",
        email_verified: true,
        date_email_verified: 1622128723,
        locale: "en-US",
        name: "Changwan Jun",
        picture: "https://secure.gravatar.com/avatar/1234.png",
        given_name: "Changwan",
        family_name: "Jun",
      });
    });

    const userProfile = await oauth.getUserProfileFromIdToken(ID_TOKEN);
    assertEquals(userProfile, {
      id: "U0R7JM123",
      name: "Changwan Jun",
      email: "wan2land@gmail.com",
      emailVerified: true,
      picture: "https://secure.gravatar.com/avatar/1234.png",
      locale: "en-US",
      raw: {
        iss: "https://slack.com",
        sub: "U0R7JM123",
        aud: CLIENT_ID,
        exp: 1775969077,
        iat: 1775965477,
        auth_time: 1775965477,
        nonce: "abcd",
        at_hash: "SGVsbG8gV29ybGQ",
        "https://slack.com/team_id": "T0R7GR123",
        "https://slack.com/user_id": "U0R7JM123",
        email: "wan2land@gmail.com",
        email_verified: true,
        date_email_verified: 1622128723,
        locale: "en-US",
        name: "Changwan Jun",
        picture: "https://secure.gravatar.com/avatar/1234.png",
        given_name: "Changwan",
        family_name: "Jun",
      },
    });
  });
});
