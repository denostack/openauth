import { type HttpClientError, OAuth20, OAuthError, type UserProfile } from "../core/mod.ts";

export interface UserRawData {
  id: number;
  properties?: {
    nickname?: string;
    profile_image?: string;
  };
  kakao_account?: {
    profile?: {
      nickname?: string;
      profile_image_url: string;
    };
    email?: string;
  };
}

export class KakaoOAuth extends OAuth20 {
  authRequestUri = "https://kauth.kakao.com/oauth/authorize";
  accessTokenRequestUri = "https://kauth.kakao.com/oauth/token";
  userProfileUri = "https://kapi.kakao.com/v2/user/me";

  override scopes = [];
  override scopeSeparator = ",";

  override requestAccessTokenMethod = "get" as const;

  override createErrorFromHttpClientError(e: HttpClientError): OAuthError {
    if ("msg" in e.data) {
      const { msg: message, ...extra } = e.data;
      return new OAuthError(message, e.message, extra);
    }
    return super.createErrorFromHttpClientError(e);
  }

  mapDataToUserProfile(data: UserRawData): UserProfile {
    return {
      id: `${data.id}`,
      ...data.kakao_account?.email && { email: data.kakao_account?.email },
      nickname: data.properties?.nickname ?? data.kakao_account?.profile?.nickname,
      picture: data.properties?.profile_image ?? data.kakao_account?.profile?.profile_image_url,
      raw: data,
    };
  }
}
