import { type AuthUser, HttpClientError, OAuth20, type OAuth2Options, OAuthError } from "../core/mod.ts";

export interface UserRawData {
  id: string;
  email: string;
  name: string;
}

export interface FacebookOAuthOptions extends OAuth2Options {
  version?: string;
}

export class FacebookOAuth extends OAuth20 {
  override defaultScopes = ["email"];

  version: string;

  constructor(options: FacebookOAuthOptions) {
    super(options);
    this.version = options.version ?? "v25.0";
  }

  apiBaseUri(): string {
    return `https://graph.facebook.com/${this.version}`;
  }

  authRequestUri(): string {
    return `https://www.facebook.com/${this.version}/dialog/oauth`;
  }

  accessTokenRequestUri(): string {
    return `${this.apiBaseUri()}/oauth/access_token`;
  }

  override createErrorFromHttpClientError(e: HttpClientError) {
    const { error: { message, type, ...extra } = {} } = e.data as {
      error?: {
        message: string;
        type: string;
      };
    };
    return new OAuthError(message || "Error occurred", type, extra);
  }

  async getAuthUser(accessToken: string): Promise<AuthUser> {
    try {
      const url = `${this.apiBaseUri()}/me?${new URLSearchParams({ fields: "id,email,name" })}`;
      const res = await this.httpClient.request<UserRawData>("GET", url, {}, {
        authorization: `Bearer ${accessToken}`,
      });
      return {
        id: res.data.id,
        ...res.data.name && { name: res.data.name },
        ...res.data.email && { email: res.data.email },
        avatar: `https://graph.facebook.com/${this.version}/${res.data.id}/picture?type=normal`,
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
