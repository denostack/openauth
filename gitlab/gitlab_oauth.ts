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
  get authRequestUri(): string {
    return `${this.host}/oauth/authorize`;
  }
  get accessTokenRequestUri(): string {
    return `${this.host}/oauth/token`;
  }
  get userProfileUri(): string {
    return `${this.host}/api/v4/user`;
  }

  host: string;

  override scopes = ["read_user"];
  override scopeSeparator = " ";

  constructor(options: GitlabOAuthOptions) {
    super(options);
    this.host = (options.host ?? "https://gitlab.com").replace(/\/+$/, "");
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
