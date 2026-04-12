import { type HttpClientError, OAuth20, type OAuth2Options, OAuthError, type UserProfile } from "../core/mod.ts";

export interface UserRawData {
  id: string;
  email?: string;
  name?: string;
}

export interface FacebookOAuthOptions extends OAuth2Options {
  version?: string;
}

export class FacebookOAuth extends OAuth20 {
  get authRequestUri(): string {
    return `https://www.facebook.com/${this.version}/dialog/oauth`;
  }
  get accessTokenRequestUri(): string {
    return `https://graph.facebook.com/${this.version}/oauth/access_token`;
  }
  get userProfileUri(): string {
    return `https://graph.facebook.com/${this.version}/me?${new URLSearchParams({ fields: "id,email,name" })}`;
  }

  override scopes = ["email"];
  override scopeSeparator = ",";

  version: string;

  constructor(options: FacebookOAuthOptions) {
    super(options);
    this.version = options.version ?? "v25.0";
  }

  override createErrorFromHttpClientError(e: HttpClientError): OAuthError {
    if ("error" in e.data) {
      const { error: { message, type, ...extra } = {} } = e.data as {
        error?: {
          message: string;
          type: string;
        };
      };
      return new OAuthError(message || "Error occurred", type, extra);
    }
    return super.createErrorFromHttpClientError(e);
  }

  mapDataToUserProfile(data: unknown): UserProfile {
    const raw = data as UserRawData;
    return {
      id: raw.id,
      ...raw.name && { name: raw.name },
      ...raw.email && { email: raw.email },
      picture: `https://graph.facebook.com/${this.version}/${raw.id}/picture?type=normal`,
      raw: data,
    };
  }
}
