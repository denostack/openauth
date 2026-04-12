import { OAuth20, type UserProfile } from "../core/mod.ts";

export interface UserRawData {
  id: string;
  username?: string;
  avatar?: string;
  global_name?: string;
  email?: string;
}

export class DiscordOAuth extends OAuth20 {
  authRequestUri = "https://discord.com/api/oauth2/authorize";
  accessTokenRequestUri = "https://discord.com/api/v10/oauth2/token";
  userProfileUri = "https://discord.com/api/v10/users/@me";

  override scopes = ["identify"];
  override scopeSeparator = " ";

  mapDataToUserProfile(data: unknown): UserProfile {
    const raw = data as UserRawData;
    return {
      id: raw.id,
      nickname: raw.global_name,
      ...raw.username && { username: raw.username },
      ...raw.email && { email: raw.email },
      ...raw.avatar && { picture: `https://cdn.discordapp.com/avatars/${raw.id}/${raw.avatar}.png` },
      raw: data,
    };
  }
}
