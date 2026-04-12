import { OAuth20, type OAuth2Options, type UserProfile } from "../core/mod.ts";

export interface UserRawData {
  id: number;
  username?: string;
  name?: string;
  avatar_url?: string;
  email?: string;
}

export interface GitlabOAuthOptions extends OAuth2Options {
  host?: string;
}

export class GitlabOAuth extends OAuth20 {
  authRequestUri: string;
  accessTokenRequestUri: string;
  userProfileUri: string;

  override scopes = ["read_user"];
  override scopeSeparator = " ";

  constructor(options: GitlabOAuthOptions) {
    super(options);
    const host = (options.host ?? "https://gitlab.com").replace(/\/+$/, "");
    this.authRequestUri = `${host}/oauth/authorize`;
    this.accessTokenRequestUri = `${host}/oauth/token`;
    this.userProfileUri = `${host}/api/v4/user`;
  }

  mapDataToUserProfile(data: UserRawData): UserProfile {
    return {
      id: `${data.id}`,
      ...data.username && { username: data.username },
      ...data.name && { name: data.name },
      ...data.email && { email: data.email },
      ...data.avatar_url && { picture: data.avatar_url },
      raw: data,
    };
  }
}
