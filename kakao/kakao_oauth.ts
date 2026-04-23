import { type HttpClientError, OAuth20, OAuthError, type OidcIdTokenClaims, type UserProfile } from "../core/mod.ts";

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
    is_email_verified?: boolean;
    gender?: "male" | "female";
  };
}

export class KakaoOAuth extends OAuth20 {
  authRequestUri = "https://kauth.kakao.com/oauth/authorize";
  accessTokenRequestUri = "https://kauth.kakao.com/oauth/token";
  userProfileUri = "https://kapi.kakao.com/v2/user/me";

  override jwksUri = "https://kauth.kakao.com/.well-known/jwks.json";
  override jwtIssuer = "https://kauth.kakao.com";

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

  mapDataToUserProfile(data: UserRawData | OidcIdTokenClaims): UserProfile {
    if ("sub" in data) {
      return this.mapOidcIdTokenClaimsToUserProfile(data);
    }
    const nickname = data.properties?.nickname ?? data.kakao_account?.profile?.nickname;
    const picture = data.properties?.profile_image ?? data.kakao_account?.profile?.profile_image_url;
    return {
      id: `${data.id}`,
      ...(data.kakao_account?.email && { email: data.kakao_account?.email }),
      ...(typeof data.kakao_account?.is_email_verified === "boolean" &&
        { emailVerified: data.kakao_account?.is_email_verified }),
      ...(nickname && { nickname }),
      ...(picture && { picture }),
      ...(data.kakao_account?.gender && { gender: data.kakao_account?.gender }),
      raw: data,
    };
  }
}
