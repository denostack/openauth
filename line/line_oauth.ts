import { OAuth20, type UserProfile } from "../core/mod.ts";

export interface UserRawData {
  userId: string;
  displayName?: string;
  pictureUrl?: string;
  email?: string;
}

export class LineOAuth extends OAuth20 {
  authRequestUri = "https://access.line.me/oauth2/v2.1/authorize";
  accessTokenRequestUri = "https://api.line.me/oauth2/v2.1/token";
  userProfileUri = "https://api.line.me/v2/profile";

  override scopes = ["openid", "profile"];
  override scopeSeparator = " ";

  mapDataToUserProfile(data: UserRawData): UserProfile {
    return {
      id: data.userId,
      name: data.displayName,
      ...data.email && { email: data.email },
      ...data.pictureUrl && { picture: data.pictureUrl },
      raw: data,
    };
  }
}
