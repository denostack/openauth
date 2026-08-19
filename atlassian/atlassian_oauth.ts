import { type AuthRequestUriOptions, OAuth20, type UserProfile } from "../core/mod.ts";

/**
 * @see https://developer.atlassian.com/cloud/jira/platform/oauth-2-3lo-apps/
 */
export interface UserRawData {
  account_type?: string;
  account_id: string;
  email?: string;
  name?: string;
  picture?: string;
  account_status?: string;
  nickname?: string;
  zoneinfo?: string;
  locale?: string;
  extended_profile?: {
    job_title?: string;
    organization?: string;
    department?: string;
    location?: string;
  };
}

export class AtlassianOAuth extends OAuth20 {
  authRequestUri = "https://auth.atlassian.com/authorize";
  accessTokenRequestUri = "https://auth.atlassian.com/oauth/token";
  userProfileUri = "https://api.atlassian.com/me";

  override scopes = ["read:me"];
  override scopeSeparator = " ";

  override getAuthRequestFields({ extra, ...options }: AuthRequestUriOptions = {}): Record<string, string> {
    return super.getAuthRequestFields({
      prompt: "consent",
      extra: { audience: "api.atlassian.com", ...extra },
      ...options,
    });
  }

  mapDataToUserProfile(data: UserRawData): UserProfile {
    return {
      id: data.account_id,
      ...data.nickname && { nickname: data.nickname },
      ...data.name && { name: data.name },
      ...data.email && { email: data.email },
      ...data.picture && { picture: data.picture },
      ...data.zoneinfo && { zoneinfo: data.zoneinfo },
      ...data.locale && { locale: data.locale },
      raw: data,
    };
  }
}
