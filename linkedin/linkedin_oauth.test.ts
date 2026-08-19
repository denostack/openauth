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
import { LinkedInOAuth } from "./linkedin_oauth.ts";

const CLIENT_ID = Deno.env.get("LINKEDIN_CLIENT_ID") ?? "1234567890";
const CLIENT_SECRET = Deno.env.get("LINKEDIN_CLIENT_SECRET") ?? "1234567890abcdefghijklmnopqrstuvwxyz";
const REDIRECT_URI = "https://openauth.denostack.com/callback/linkedin";
const ACCESS_TOKEN = Deno.env.get("LINKEDIN_ACCESS_TOKEN") ?? "LINKEDIN_ACCESS_TOKEN_1234";
const ID_TOKEN = Deno.env.get("LINKEDIN_ID_TOKEN") ?? "LINKEDIN_ID_TOKEN_1234";

describe("LinkedInOAuth", () => {
  let httpClient: HttpClient;
  let jwtVerifier: JwtVerifier;
  let oauth: OAuth;
  beforeEach(() => {
    httpClient = new FetchHttpClient();
    jwtVerifier = new WebCryptoJwtVerifier();
    oauth = new LinkedInOAuth({
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
      `https://www.linkedin.com/oauth/v2/authorization?${new URLSearchParams({
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
          access_token: ACCESS_TOKEN,
          expires_in: 5183999,
          scope: "email,openid,profile",
          token_type: "Bearer",
          id_token: ID_TOKEN,
        },
      });
    });

    const code = "CODE";
    const result = await oauth.getAccessTokenResponse(code);
    assertEquals(result, {
      accessToken: ACCESS_TOKEN,
      expiresIn: 5183999,
      scope: "email,openid,profile",
      tokenType: "Bearer",
      idToken: ID_TOKEN,
    });

    assertSpyCall(requestStub, 0, {
      args: ["POST", "https://www.linkedin.com/oauth/v2/accessToken", {
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
        new HttpClientError("Bad Request", 400, {
          error: "invalid_request",
          error_description: "Unable to retrieve access token: authorization code not found",
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
      assertEquals(e.message, "Unable to retrieve access token: authorization code not found");
      assertEquals(e.extra, {});
    }
  });

  // LinkedIn returns the OIDC `locale` claim as its platform locale record, not a BCP 47 string.
  for (
    const locale of ["ko_KR", {
      country: "KR",
      language: "ko",
    }]
  ) {
    it(`getUserProfile success (locale = ${JSON.stringify(locale)})`, async () => {
      stub(httpClient, "request", () => {
        return Promise.resolve({
          status: 200,
          headers: {},
          data: {
            sub: "782bbtaQ",
            name: "Changwan Jun",
            given_name: "Changwan",
            family_name: "Jun",
            picture: "https://media.licdn-ei.com/dms/image/C5F03AQHqK8v7tB1HCQ/profile-displayphoto-shrink_100_100/0/",
            locale,
            email: "wan2land@gmail.com",
            email_verified: true,
          },
        });
      });

      const userProfile = await oauth.getUserProfile(ACCESS_TOKEN);
      assertEquals(userProfile, {
        id: "782bbtaQ",
        name: "Changwan Jun",
        email: "wan2land@gmail.com",
        emailVerified: true,
        picture: "https://media.licdn-ei.com/dms/image/C5F03AQHqK8v7tB1HCQ/profile-displayphoto-shrink_100_100/0/",
        locale: "ko-KR",
        raw: {
          sub: "782bbtaQ",
          name: "Changwan Jun",
          given_name: "Changwan",
          family_name: "Jun",
          picture: "https://media.licdn-ei.com/dms/image/C5F03AQHqK8v7tB1HCQ/profile-displayphoto-shrink_100_100/0/",
          locale,
          email: "wan2land@gmail.com",
          email_verified: true,
        },
      });
    });
  }

  it("getUserProfile fail", async () => {
    stub(httpClient, "request", () => {
      return Promise.reject(
        new HttpClientError("Unauthorized", 401, {
          serviceErrorCode: 65600,
          message: "Invalid access token",
          status: 401,
        }),
      );
    });

    try {
      await oauth.getUserProfile("INVALID_ACCESS_TOKEN");
      fail();
    } catch (e) {
      assertInstanceOf(e, OAuthError);
      assertEquals(e.type, "Unauthorized");
      assertEquals(e.message, "Invalid access token");
      assertEquals(e.extra, { serviceErrorCode: 65600, status: 401 });
    }
  });

  it("getUserProfileFromIdToken success", async () => {
    stub(jwtVerifier, "verify", () => {
      return Promise.resolve({
        iss: "https://www.linkedin.com/oauth",
        aud: CLIENT_ID,
        iat: 1775965477,
        exp: 1775969077,
        sub: "782bbtaQ",
        name: "Changwan Jun",
        given_name: "Changwan",
        family_name: "Jun",
        picture: "https://media.licdn-ei.com/dms/image/C5F03AQHqK8v7tB1HCQ/profile-displayphoto-shrink_100_100/0/",
        email: "wan2land@gmail.com",
        email_verified: true,
        locale: "en_US", // linkedin return POSIX locale style
      });
    });

    const userProfile = await oauth.getUserProfileFromIdToken(ID_TOKEN);
    assertEquals(userProfile, {
      id: "782bbtaQ",
      name: "Changwan Jun",
      email: "wan2land@gmail.com",
      emailVerified: true,
      picture: "https://media.licdn-ei.com/dms/image/C5F03AQHqK8v7tB1HCQ/profile-displayphoto-shrink_100_100/0/",
      locale: "en-US", // openauth change posix to BCP47
      raw: {
        iss: "https://www.linkedin.com/oauth",
        aud: CLIENT_ID,
        iat: 1775965477,
        exp: 1775969077,
        sub: "782bbtaQ",
        name: "Changwan Jun",
        given_name: "Changwan",
        family_name: "Jun",
        picture: "https://media.licdn-ei.com/dms/image/C5F03AQHqK8v7tB1HCQ/profile-displayphoto-shrink_100_100/0/",
        email: "wan2land@gmail.com",
        email_verified: true,
        locale: "en_US",
      },
    });
  });
});
