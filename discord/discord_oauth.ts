import { type AccessTokenResponseOptions, type AuthUser, HttpClientError, OAuth20, OAuthError } from "../core/mod.ts";

export interface UserRawData {
  id: string;
  username?: string;
  avatar?: string;
  global_name?: string;
  email?: string;
}

export class DiscordOAuth extends OAuth20 {
  override defaultScopes = ["identify"];

  apiBaseUri(): string {
    return "https://discord.com/api/v10";
  }

  authRequestUri(): string {
    return "https://discord.com/api/oauth2/authorize";
  }

  accessTokenRequestUri(): string {
    return `${this.apiBaseUri()}/oauth2/token`;
  }

  override buildScopes(scopes: string[]): string {
    return scopes.join(" ");
  }

  override createErrorFromHttpClientError(e: HttpClientError) {
    if (e.status === 401) {
      const { message, ...extra } = e.data as { message: string };
      return new OAuthError(message || "Error occurred", e.message, extra);
    }
    const { error_description: message, error: type, ...extra } = e.data as {
      error?: string;
      error_description?: string;
    };
    return new OAuthError(message || "Error occurred", type, extra);
  }

  override requestAccessToken(
    code: string,
    options: AccessTokenResponseOptions = {},
  ): Promise<Record<string, unknown>> {
    return this.httpClient.request<Record<string, unknown>>(
      "POST",
      this.accessTokenRequestUri(),
      this.getAccessTokenFields(code, options),
      { "content-type": "application/x-www-form-urlencoded" },
    ).then((res) => res.data).catch((e) => {
      if (e instanceof HttpClientError) {
        throw this.createErrorFromHttpClientError(e);
      }
      throw e;
    });
  }

  async getAuthUser(accessToken: string): Promise<AuthUser> {
    try {
      const url = `${this.apiBaseUri()}/users/@me`;
      const res = await this.httpClient.request<UserRawData>("GET", url, {}, {
        authorization: `Bearer ${accessToken}`,
      });
      return {
        id: res.data.id,
        nickname: res.data.global_name ?? res.data.username,
        ...res.data.email && { email: res.data.email },
        ...res.data.avatar && { avatar: `https://cdn.discordapp.com/avatars/${res.data.id}/${res.data.avatar}.png` },
        raw: res.data,
      };
    } catch (e) {
      if (e instanceof HttpClientError) {
        throw this.createErrorFromHttpClientError(e);
      }
      throw e;
    }
  }
}
