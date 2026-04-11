import {
  type AccessTokenResponseOptions,
  type AuthUser,
  HttpClientError,
  OAuth20,
  type OAuth2Options,
} from "../core/mod.ts";

export interface UserRawData {
  id: number;
  username?: string;
  name?: string;
  avatar_url?: string;
  email?: string;
}

export interface GitlabOAuthOptions extends OAuth2Options {
  host?: string;
}

export class GitlabOAuth extends OAuth20 {
  override defaultScopes = ["read_user"];
  host: string;

  constructor(options: GitlabOAuthOptions) {
    super(options);
    this.host = (options.host ?? "https://gitlab.com").replace(/\/+$/, "");
  }

  apiBaseUri(): string {
    return `${this.host}/api/v4`;
  }

  authRequestUri(): string {
    return `${this.host}/oauth/authorize`;
  }

  accessTokenRequestUri(): string {
    return `${this.host}/oauth/token`;
  }

  override buildScopes(scopes: string[]): string {
    return scopes.join(" ");
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
      const url = `${this.apiBaseUri()}/user`;
      const res = await this.httpClient.request<UserRawData>("GET", url, {}, {
        authorization: `Bearer ${accessToken}`,
      });
      return {
        id: `${res.data.id}`,
        ...res.data.username && { username: res.data.username },
        ...res.data.name && { name: res.data.name },
        ...res.data.email && { email: res.data.email },
        ...res.data.avatar_url && { avatar: res.data.avatar_url },
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
