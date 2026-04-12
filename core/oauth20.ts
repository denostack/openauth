import { FetchHttpClient } from "./fetch_http_client.ts";
import { type HttpClient, HttpClientError, type HttpClientResponse } from "./http_client.ts";
import type {
  AccessTokenResponse,
  AccessTokenResponseOptions,
  AuthRequestUriOptions,
  OAuth,
  UserProfile,
} from "./oauth.ts";
import { OAuthError } from "./oauth_error.ts";

export interface OAuth2Options {
  clientId: string;
  clientSecret?: string;
  redirectUri: string;
  code?: string;
  scope?: string[] | string;
  client?: HttpClient;
}

export abstract class OAuth20 implements OAuth {
  httpClient: HttpClient;

  abstract authRequestUri: string;
  abstract accessTokenRequestUri: string;
  abstract userProfileUri: string;

  requestAccessTokenMethod: "get" | "x-www-form-urlencoded" = "x-www-form-urlencoded";

  scopes: string[] = [];
  scopeSeparator: string = ",";

  constructor(public options: OAuth2Options) {
    this.httpClient = options.client ?? new FetchHttpClient();
  }

  buildScopes(scopes: string[]): string {
    return scopes.join(this.scopeSeparator);
  }

  getAuthRequestFields(options: AuthRequestUriOptions = {}): Record<string, string> {
    const scope = ("scope" in options ? options.scope : this.options.scope) ?? this.scopes;
    const scopeAsArray = Array.isArray(scope) ? scope : [scope];
    return {
      response_type: options.responseType ?? "code",
      client_id: options.clientId ?? this.options.clientId,
      redirect_uri: options.redirectUri ?? this.options.redirectUri,
      ...options.state ? { state: options.state } : {},
      ...scopeAsArray.length > 0 ? { scope: this.buildScopes(scopeAsArray) } : {},
    };
  }

  /**
   * @see https://tools.ietf.org/html/rfc6749#section-4.1.1
   */
  getAuthRequestUri(options: AuthRequestUriOptions = {}): Promise<string> {
    return Promise.resolve(`${this.authRequestUri}?${new URLSearchParams(this.getAuthRequestFields(options))}`);
  }

  getAccessTokenFields(code: string, options: AccessTokenResponseOptions = {}): Record<string, string> {
    const clientSecret = options.clientSecret ?? this.options.clientSecret;
    return {
      client_id: options.clientId ?? this.options.clientId,
      ...clientSecret ? { client_secret: clientSecret } : {},
      redirect_uri: options.redirectUri ?? this.options.redirectUri,
      code,
      grant_type: "authorization_code",
      ...options.state ? { state: options.state } : {},
    };
  }

  createErrorFromHttpClientError(e: HttpClientError): OAuthError {
    if ("error_description" in e.data) {
      const { error_description: message, error: type, ...extra } = e.data as {
        error: string;
        error_description: string;
      };
      return new OAuthError(message || "Error occurred", type, extra);
    }
    const { message, ...extra } = e.data as { message?: string };
    return new OAuthError(message || "Error occurred", e.message, extra);
  }

  /**
   * @see https://tools.ietf.org/html/rfc6749#section-2.3.1
   * @see https://tools.ietf.org/html/rfc6749#section-4.1.3
   */
  requestAccessToken(code: string, options: AccessTokenResponseOptions = {}): Promise<Record<string, unknown>> {
    let responsePromise: Promise<HttpClientResponse<Record<string, unknown>>>;
    switch (this.requestAccessTokenMethod) {
      case "get": {
        responsePromise = this.httpClient.request<Record<string, unknown>>(
          "GET",
          `${this.accessTokenRequestUri}?${new URLSearchParams(this.getAccessTokenFields(code, options))}`,
        );
        break;
      }
      case "x-www-form-urlencoded":
      default: {
        responsePromise = this.httpClient.request<Record<string, unknown>>(
          "POST",
          this.accessTokenRequestUri,
          this.getAccessTokenFields(code, options),
          { "content-type": "application/x-www-form-urlencoded" },
        );
      }
    }
    return responsePromise.then((res) => res.data)
      .catch((e) => {
        if (e instanceof HttpClientError) {
          throw this.createErrorFromHttpClientError(e);
        }
        throw e;
      });
  }

  /**
   * @see https://tools.ietf.org/html/rfc6749#section-4.1.4
   */
  mapDataToAccessTokenResponse(data: Record<string, unknown>): AccessTokenResponse {
    return {
      accessToken: data.access_token as string,
      ...typeof data.scope === "string" && { scopes: data.scope.split(" ").filter((t) => t.trim()) },
      ...typeof data.token_type === "string" && { tokenType: data.token_type },
      ...typeof data.expires_in === "number" && { expiresIn: data.expires_in },
      ...typeof data.expires_in === "string" && { expiresIn: +data.expires_in },
      ...typeof data.refresh_token === "string" && { refreshToken: data.refresh_token },
      ...typeof data.refresh_token_expires_in === "number" &&
        { refreshTokenExpiresIn: data.refresh_token_expires_in },
      ...typeof data.id_token === "string" && { idToken: data.id_token },
    };
  }

  async getAccessTokenResponse(
    code: string,
    options: AccessTokenResponseOptions = {},
  ): Promise<AccessTokenResponse> {
    return this.mapDataToAccessTokenResponse(
      await this.requestAccessToken(
        code,
        options,
      ),
    );
  }

  abstract mapDataToUserProfile(data: unknown): UserProfile;

  getUserProfile(accessToken: string): Promise<UserProfile> {
    return this.httpClient.request<unknown>("GET", this.userProfileUri, {}, {
      authorization: `Bearer ${accessToken}`,
    })
      .then((res) => this.mapDataToUserProfile(res.data))
      .catch((e) => {
        if (e instanceof HttpClientError) {
          throw this.createErrorFromHttpClientError(e);
        }
        throw e;
      });
  }
}
