import type { HttpClient } from "./http_client.ts";
import { FetchHttpClient } from "./fetch_http_client.ts";
import { OAuthError } from "./oauth_error.ts";
import type { AuthUser } from "./auth_user.ts";
export type { AuthUser } from "./auth_user.ts";

// deno-lint-ignore no-explicit-any
type AnyRecord = Record<string, any>;

export interface AuthRequestUriOptions {
  responseType?: string;
  clientId?: string;
  redirectUri?: string;
  scope?: string[] | string | null;
  state?: string;
}

export interface AccessTokenResponseOptions {
  clientId?: string;
  clientSecret?: string;
  redirectUri?: string;
  state?: string;
}

export interface AccessTokenResponse {
  accessToken: string;
  tokenType?: string;
  expiresIn?: number;
  refreshToken?: string;
  refreshTokenExpiresIn?: number;
}

export interface OAuth2Options {
  clientId: string;
  clientSecret?: string;
  redirectUri: string;
  code?: string;
  scope?: string[] | string;
  client?: HttpClient;
}

export abstract class OAuth20 {
  httpClient: HttpClient;
  constructor(public options: OAuth2Options) {
    this.httpClient = options.client ?? new FetchHttpClient();
  }

  abstract getAuthUser(accessToken: string): Promise<AuthUser>;

  /**
   * start with https:// or http://
   */
  abstract apiBaseUri(): string;

  /**
   * start with https:// or http://
   */
  abstract authRequestUri(): string;

  abstract accessTokenRequestUri(): string;

  buildScopes(scopes: string[]): string {
    return scopes.join(",");
  }

  getAuthRequestFields(
    options: AuthRequestUriOptions = {},
  ): Record<string, string> {
    const scope = ("scope" in options ? options.scope : this.options.scope) ??
      [];
    const scopeAsArray = Array.isArray(scope) ? scope : [scope];
    return {
      response_type: options.responseType ?? "code",
      client_id: options.clientId ?? this.options.clientId,
      redirect_uri: options.redirectUri ?? this.options.redirectUri,
      ...options.state ? { state: options.state } : {},
      ...scopeAsArray.length > 0
        ? { scope: this.buildScopes(scopeAsArray) }
        : {},
    };
  }

  /**
   * @see https://tools.ietf.org/html/rfc6749#section-2.3.1
   * @see https://tools.ietf.org/html/rfc6749#section-4.1.3
   */
  requestAccessToken(
    code: string,
    options: AccessTokenResponseOptions = {},
  ): Promise<AnyRecord> {
    const url = new URL(this.accessTokenRequestUri());
    url.search = new URLSearchParams(
      this.getAccessTokenFields(code, options),
    ).toString();
    return this.httpClient.request<AnyRecord>("GET", url).then(
      (res) => {
        if ("error" in res) {
          throw new OAuthError("Error Occurred");
        }
        return res.data;
      },
    );
  }

  getAccessTokenFields(
    code: string,
    options: AccessTokenResponseOptions = {},
  ): AnyRecord {
    const clientSecret = options.clientSecret ?? this.options.clientSecret;
    return {
      client_id: options.clientId ?? this.options.clientId,
      ...clientSecret ? { client_secret: clientSecret } : {},
      redirect_uri: options.redirectUri ?? this.options.redirectUri,
      code,
      grant_type: "authorization_code",
    };
  }

  /**
   * @see https://tools.ietf.org/html/rfc6749#section-4.1.4
   */
  mapDataToAccessTokenResponse(
    body: AnyRecord,
  ): AccessTokenResponse {
    return {
      accessToken: body.access_token,
      ...body.token_type ? { tokenType: body.token_type } : {},
      ...typeof body.expires_in === "number"
        ? { expiresIn: body.expires_in }
        : {},
      ...body.refresh_token ? { refreshToken: body.refresh_token } : {},
    };
  }

  /**
   * @see https://tools.ietf.org/html/rfc6749#section-4.1.1
   */
  getAuthRequestUri(options: AuthRequestUriOptions = {}): Promise<string> {
    const url = new URL(this.authRequestUri());
    url.search = new URLSearchParams(this.getAuthRequestFields(options))
      .toString();
    return Promise.resolve(url.toString());
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
}
