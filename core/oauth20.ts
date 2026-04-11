import type { HttpClient } from "./http_client.ts";
import { FetchHttpClient } from "./fetch_http_client.ts";
import { OAuthError } from "./oauth_error.ts";
import type { AuthUser } from "./auth_user.ts";

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

  defaultScopes(): string[] {
    return [];
  }

  buildScopes(scopes: string[]): string {
    return scopes.join(",");
  }

  getAuthRequestFields(options: AuthRequestUriOptions = {}): Record<string, string> {
    const scope = ("scope" in options ? options.scope : this.options.scope) ?? this.defaultScopes();
    const scopeAsArray = Array.isArray(scope) ? scope : [scope];
    return {
      response_type: options.responseType ?? "code",
      client_id: options.clientId ?? this.options.clientId,
      redirect_uri: options.redirectUri ?? this.options.redirectUri,
      ...options.state ? { state: options.state } : {},
      ...scopeAsArray.length > 0 ? { scope: this.buildScopes(scopeAsArray) } : {},
      ...options.codeChallenge ? { code_challenge: options.codeChallenge } : {},
      ...options.codeChallengeMethod ? { code_challenge_method: options.codeChallengeMethod } : {},
    };
  }

  /**
   * @see https://tools.ietf.org/html/rfc6749#section-4.1.1
   */
  getAuthRequestUri(options: AuthRequestUriOptions = {}): Promise<string> {
    return Promise.resolve(`${this.authRequestUri()}?${new URLSearchParams(this.getAuthRequestFields(options))}`);
  }

  getAccessTokenFields(code: string, options: AccessTokenResponseOptions = {}): Record<string, string> {
    const clientSecret = options.clientSecret ?? this.options.clientSecret;
    return {
      client_id: options.clientId ?? this.options.clientId,
      ...clientSecret ? { client_secret: clientSecret } : {},
      redirect_uri: options.redirectUri ?? this.options.redirectUri,
      code,
      grant_type: "authorization_code",
      ...options.codeVerifier ? { code_verifier: options.codeVerifier } : {},
      ...options.state ? { state: options.state } : {},
    };
  }

  /**
   * @see https://tools.ietf.org/html/rfc6749#section-2.3.1
   * @see https://tools.ietf.org/html/rfc6749#section-4.1.3
   */
  requestAccessToken(code: string, options: AccessTokenResponseOptions = {}): Promise<Record<string, unknown>> {
    const url = `${this.accessTokenRequestUri()}?${new URLSearchParams(this.getAccessTokenFields(code, options))}`;
    return this.httpClient.request<Record<string, unknown>>("GET", url).then((res) => res.data);
  }

  /**
   * @see https://tools.ietf.org/html/rfc6749#section-4.1.4
   */
  mapDataToAccessTokenResponse(body: Record<string, unknown>): AccessTokenResponse {
    return {
      accessToken: body.access_token as string,
      ...typeof body.token_type === "string" ? { tokenType: body.token_type } : {},
      ...typeof body.expires_in === "number" ? { expiresIn: body.expires_in } : {},
      ...typeof body.refresh_token === "string" ? { refreshToken: body.refresh_token } : {},
      ...typeof body.refresh_token_expires_in === "number"
        ? { refreshTokenExpiresIn: body.refresh_token_expires_in }
        : {},
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
}
