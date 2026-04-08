import {
  type AccessTokenResponse,
  type AccessTokenResponseOptions,
  type AuthUser,
  OAuth20,
} from "../core/oauth20.ts";
import { OAuthError } from "../core/oauth_error.ts";

export class Github extends OAuth20 {
  apiBaseUri(): string {
    return "https://api.github.com";
  }

  authRequestUri(): string {
    return "https://github.com/login/oauth/authorize";
  }

  accessTokenRequestUri(): string {
    return "https://github.com/login/oauth/access_token";
  }

  override buildScopes(scopes: string[]): string {
    return scopes.join(" ");
  }

  override getAccessTokenFields(
    code: string,
    options: AccessTokenResponseOptions = {},
  ): Record<string, string> {
    return {
      client_id: this.options.clientId,
      ...this.options.clientSecret
        ? { client_secret: this.options.clientSecret }
        : {},
      redirect_uri: this.options.redirectUri,
      code,
      ...options.state ? { state: options.state } : {},
    };
  }

  override mapDataToAccessTokenResponse(
    // deno-lint-ignore no-explicit-any
    body: Record<string, any>,
  ): AccessTokenResponse {
    return {
      accessToken: body.access_token,
      ...body.token_type ? { tokenType: body.token_type } : {},
      ...body.expires_in ? { expiresIn: +body.expires_in } : {},
      ...body.refresh_token ? { refreshToken: body.refresh_token } : {},
    };
  }

  override requestAccessToken(
    code: string,
    options: AccessTokenResponseOptions = {},
    // deno-lint-ignore no-explicit-any
  ): Promise<Record<string, any>> {
    const url = new URL(this.accessTokenRequestUri());
    url.search = new URLSearchParams(
      this.getAccessTokenFields(code, options),
    ).toString();
    // deno-lint-ignore no-explicit-any
    return this.httpClient.request<Record<string, any>>("GET", url).then(
      (res) => {
        if (res.data.error) {
          const { error_description: message, ...errorProps } = res.data;
          throw Object.assign(
            new OAuthError(message || "Error occurred"),
            errorProps,
          );
        }
        if (res.status >= 400) {
          const { message, ...errorProps } = res.data;
          throw Object.assign(
            new OAuthError(message || "Error occurred"),
            errorProps,
          );
        }
        return res.data;
      },
    );
  }

  async getAuthUser(accessToken: string): Promise<AuthUser> {
    const url = `${this.apiBaseUri()}/user`;
    const res = await this.httpClient.request<
      // deno-lint-ignore no-explicit-any
      Record<string, any>
    >("GET", url, {}, {
      authorization: `Bearer ${accessToken}`,
    });
    if (res.status >= 400) {
      const { message, ...errorProps } = res.data;
      throw Object.assign(
        new OAuthError(message || "Error occurred"),
        errorProps,
      );
    }
    return {
      id: `${res.data.id}`,
      name: res.data.name,
      email: res.data.email,
      avatar: res.data.avatar_url,
      raw: res.data,
    };
  }
}
