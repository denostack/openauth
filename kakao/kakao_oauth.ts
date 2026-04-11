import { type AccessTokenResponseOptions, type AuthUser, OAuth20, OAuthError } from "../core/mod.ts";

export interface UserRawData {
  id: number;
  connected_at: string; // "2026-04-09T14:50:25Z"
  properties?: {
    nickname?: string;
    profile_image?: string;
    thumbnail_image?: string;
  };
  kakao_account?: {
    profile_needs_agreement?: boolean;
    profile?: {
      nickname?: string;
      thumbnail_image_url?: string;
      profile_image_url: string;
    };
    has_email?: boolean;
    email_needs_agreement?: boolean;
    is_email_valid?: boolean;
    is_email_verified?: boolean;
    email?: string;
    has_age_range?: boolean;
    age_range_needs_agreement?: boolean;
    age_range?: string;
    has_birthday?: boolean;
    birthday_needs_agreement?: boolean;
    birthday?: string;
    birthday_type?: "SOLAR" | "LUNAR";
    has_gender?: boolean;
    gender_needs_agreement?: boolean;
    gender?: "male" | "female";
  };
}

export class KakaoOAuth extends OAuth20 {
  apiBaseUri(): string {
    return "https://kapi.kakao.com/v2";
  }

  authRequestUri(): string {
    return "https://kauth.kakao.com/oauth/authorize";
  }

  accessTokenRequestUri(): string {
    return "https://kauth.kakao.com/oauth/token";
  }

  override requestAccessToken(
    code: string,
    options: AccessTokenResponseOptions = {},
  ): Promise<Record<string, unknown>> {
    const url = new URL(this.accessTokenRequestUri());
    url.search = new URLSearchParams(
      this.getAccessTokenFields(code, options),
    ).toString();
    return this.httpClient.request<Record<string, unknown>>("GET", url).then(
      (res) => {
        if (res.status >= 400) {
          const { error_description: message, error: type, ...extra } = res.data as {
            error: string;
            error_description: string;
            error_code: string;
          };
          throw new OAuthError(message || "Error occurred", type, extra);
        }
        return res.data;
      },
    );
  }

  async getAuthUser(accessToken: string): Promise<AuthUser> {
    const url = `${this.apiBaseUri()}/user/me`;
    const res = await this.httpClient.request<UserRawData>(
      "GET",
      url,
      {},
      {
        authorization: `Bearer ${accessToken}`,
      },
    );
    if (res.status >= 400) {
      // deno-lint-ignore no-explicit-any
      const data = res.data as any;
      const {
        error_description: description,
        error_code: errorCode,
        ...errorProps
      } = data;
      throw Object.assign(
        new OAuthError(description || "Error occurred"),
        { code: errorCode, ...errorProps },
      );
    }
    const data = res.data;
    return {
      id: `${data.id}`,
      email: data.kakao_account?.email,
      nickname: data.properties?.nickname ??
        data.kakao_account?.profile?.nickname,
      avatar: data.properties?.profile_image ??
        data.kakao_account?.profile?.profile_image_url,
      raw: data,
    };
  }
}
