import { OAuth20, type UserProfile } from "../core/mod.ts";

export interface UserRawData {
  id: string;
  handle?: string;
  img_url?: string;
  email?: string;
}

export class FigmaOAuth extends OAuth20 {
  authRequestUri = "https://www.figma.com/oauth";
  accessTokenRequestUri = "https://api.figma.com/v1/oauth/token";
  userProfileUri = "https://api.figma.com/v1/me";

  override requestAccessTokenMethod = "form_basic" as const;

  override scopes = ["current_user:read"];
  override scopeSeparator = " ";

  mapDataToUserProfile(data: UserRawData): UserProfile {
    return {
      id: data.id,
      ...data.handle && { name: data.handle },
      ...data.email && { email: data.email },
      ...data.img_url && { picture: data.img_url },
      raw: data,
    };
  }
}
