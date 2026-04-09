import { type AccessTokenResponseOptions, type AuthUser, OAuth20, OAuthError } from "../core/mod.ts";

export class GoogleOAuth extends OAuth20 {
  apiBaseUri(): string {
    return "https://www.googleapis.com";
  }

  authRequestUri(): string {
    return "https://accounts.google.com/o/oauth2/v2/auth";
  }

  accessTokenRequestUri(): string {
    return "https://oauth2.googleapis.com/token";
  }

  override buildScopes(scopes: string[]): string {
    return scopes.join(" ");
  }

  override requestAccessToken(
    code: string,
    options: AccessTokenResponseOptions = {},
  ) {
    return this.httpClient.request<Record<string, unknown>>(
      "POST",
      this.accessTokenRequestUri(),
      this.getAccessTokenFields(code, options),
    ).then((res) => {
      if (res.status >= 400) {
        const data = res.data as { error: string; error_description: string; message?: string };
        const message = data.error_description || data.message ||
          "Error occurred";
        throw Object.assign(new OAuthError(message), data);
      }
      return res.data;
    });
  }

  async getAuthUser(accessToken: string): Promise<AuthUser> {
    const url = `${this.apiBaseUri()}/oauth2/v3/userinfo`;
    const res = await this.httpClient.request<
      // deno-lint-ignore no-explicit-any
      Record<string, any>
    >("GET", url, {}, {
      authorization: `Bearer ${accessToken}`,
    });
    if (res.status >= 400) {
      const data = res.data as { error: string; error_description: string; message?: string };
      const message = data.error_description || data.message ||
        "Error occurred";
      throw Object.assign(new OAuthError(message), data);
    }
    return {
      id: res.data.sub,
      name: res.data.name,
      email: res.data.email,
      avatar: res.data.picture,
      raw: res.data,
    };
  }
}
