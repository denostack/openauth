import { type AuthUser, HttpClientError, OAuth20 } from "../core/mod.ts";

export interface UserRawData {
  id: number;
  avatar_url: string;
  name: string;
  email: string;
}

export class GithubOAuth extends OAuth20 {
  override defaultScopes: string[] = ["user:email"];

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

  async getAuthUser(accessToken: string): Promise<AuthUser> {
    try {
      const url = `${this.apiBaseUri()}/user`;
      const res = await this.httpClient.request<UserRawData>("GET", url, {}, {
        authorization: `Bearer ${accessToken}`,
      });
      return {
        id: `${res.data.id}`,
        name: res.data.name,
        email: res.data.email,
        avatar: res.data.avatar_url,
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
