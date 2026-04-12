import { OAuth20, type UserProfile } from "../core/mod.ts";

export interface UserRawData {
  response: {
    id: string;
    nickname?: string;
    profile_image?: string;
    email?: string;
    name?: string;
  };
}

export class NaverOAuth extends OAuth20 {
  authRequestUri = "https://nid.naver.com/oauth2.0/authorize";
  accessTokenRequestUri = "https://nid.naver.com/oauth2.0/token";
  userProfileUri = "https://openapi.naver.com/v1/nid/me";

  override scopes = ["openid"];
  override scopeSeparator = ",";

  override requestAccessTokenMethod = "get" as const;

  override mapDataToUserProfile(data: UserRawData): UserProfile {
    return {
      id: data.response.id,
      ...(data.response.name && { name: data.response.name }),
      ...(data.response.profile_image && { picture: data.response.profile_image }),
      ...(data.response.nickname && { nickname: data.response.nickname }),
      ...(data.response.email && { email: data.response.email }),
      raw: data.response,
    };
  }
}
