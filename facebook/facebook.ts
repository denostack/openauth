import { type AuthUser, OAuth20, type OAuth2Options } from "../core/oauth20.ts";
import { OAuthError } from "../core/oauth_error.ts";

export interface FacebookOAuthOptions extends OAuth2Options {
  version?: string;
}

export class Facebook extends OAuth20 {
  version: string;

  constructor(options: FacebookOAuthOptions) {
    super(options);
    this.version = options.version ?? "v11.0";
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

  async getAuthUser(accessToken: string): Promise<AuthUser> {
    const url = new URL(`${this.apiBaseUri()}/me`);
    url.searchParams.set("fields", "id,email,name");
    const res = await this.httpClient.request<
      // deno-lint-ignore no-explicit-any
      Record<string, any>
    >("GET", url, {}, {
      authorization: `Bearer ${accessToken}`,
    });
    if (res.data.error) {
      const { message, ...errorProps } = res.data.error;
      throw Object.assign(
        new OAuthError(message || "Error occurred"),
        errorProps,
      );
    }
    return {
      id: res.data.id,
      ...res.data.name ? { name: res.data.name } : {},
      ...res.data.email ? { email: res.data.email } : {},
      avatar:
        `https://graph.facebook.com/${this.version}/${res.data.id}/picture?type=normal`,
      raw: res.data,
    };
  }
}
