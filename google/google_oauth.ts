import { OAuth20, type UserProfile } from "../core/mod.ts";

export interface UserRawData {
  sub: string;
  name?: string;
  nickname?: string;
  email?: string;
  picture?: string;
}

export class GoogleOAuth extends OAuth20 {
  authRequestUri = "https://accounts.google.com/o/oauth2/v2/auth";
  accessTokenRequestUri = "https://oauth2.googleapis.com/token";
  userProfileUri = "https://www.googleapis.com/oauth2/v3/userinfo";

  override jwksUri = "https://www.googleapis.com/oauth2/v3/certs";
  override jwtIssuer = "https://accounts.google.com";

  override scopes = ["openid"];
  override scopeSeparator = " ";

  mapDataToUserProfile(data: UserRawData): UserProfile {
    return {
      id: data.sub,
      ...(data.nickname && { nickname: data.nickname }),
      ...(data.name && { name: data.name }),
      ...(data.email && { email: data.email }),
      ...(data.picture && { picture: data.picture }),
      raw: data,
    };
  }
}
