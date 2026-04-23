import { OAuth20, type UserProfile } from "../core/mod.ts";

/**
 * @see https://developers.naver.com/docs/login/profile/profile.md
 */
export interface UserRawData {
  response: {
    id: string;
    nickname?: string;
    name?: string;
    email?: string;
    gender?: "M" | "F" | "U";
    age?: string;
    birthyear?: string; // yyyy
    birthday?: string; // MM-dd
    mobile?: string;
    profile_image?: string;
  };
}

export class NaverOAuth extends OAuth20 {
  authRequestUri = "https://nid.naver.com/oauth2.0/authorize";
  accessTokenRequestUri = "https://nid.naver.com/oauth2.0/token";
  userProfileUri = "https://openapi.naver.com/v1/nid/me";

  /**
   * @see https://developers.naver.com/docs/login/api/api.md#3-1--%EB%84%A4%EC%9D%B4%EB%B2%84-%EB%A1%9C%EA%B7%B8%EC%9D%B8-%EC%9D%B8%EC%A6%9D-%EC%9A%94%EC%B2%AD
   */
  override scopes = [];
  override scopeSeparator = ",";

  override requestAccessTokenMethod = "get" as const;

  override mapDataToUserProfile(data: UserRawData): UserProfile {
    return {
      id: data.response.id,
      ...(data.response.name && { name: data.response.name }),
      ...(data.response.profile_image && { picture: data.response.profile_image }),
      ...(data.response.nickname && { nickname: data.response.nickname }),
      ...(data.response.email && { email: data.response.email }),
      ...(data.response.birthyear && data.response.birthday &&
        { birthdate: `${data.response.birthyear}-${data.response.birthday}` }),
      ...(data.response.gender === "M" ? { gender: "male" } : data.response.gender === "F" ? { gender: "female" } : {}),
      raw: data.response,
    };
  }
}
