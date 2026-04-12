import { OAuth20, type UserProfile } from "../core/mod.ts";

export interface UserRawData {
  id: number;
  login?: string;
  avatar_url?: string;
  name?: string;
  email?: string;
}

export class GithubOAuth extends OAuth20 {
  authRequestUri = "https://github.com/login/oauth/authorize";
  accessTokenRequestUri = "https://github.com/login/oauth/access_token";
  userProfileUri = "https://api.github.com/user";

  override scopes = ["user:email"];
  override scopeSeparator = " ";

  mapDataToUserProfile(data: UserRawData): UserProfile {
    return {
      id: `${data.id}`,
      ...data.login && { username: data.login },
      ...data.name && { name: data.name },
      ...data.email && { email: data.email },
      ...data.avatar_url && { picture: data.avatar_url },
      raw: data,
    };
  }
}
