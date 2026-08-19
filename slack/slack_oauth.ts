import { OAuth20, type OidcIdTokenClaims, type UserProfile } from "../core/mod.ts";

export interface UserRawData extends OidcIdTokenClaims {
  ok?: boolean;
  date_email_verified?: number;
  "https://slack.com/user_id"?: string;
  "https://slack.com/team_id"?: string;
  "https://slack.com/team_name"?: string;
  "https://slack.com/team_domain"?: string;
  "https://slack.com/user_image_512"?: string;
  "https://slack.com/team_image_230"?: string;
}

export class SlackOAuth extends OAuth20 {
  authRequestUri = "https://slack.com/openid/connect/authorize";
  accessTokenRequestUri = "https://slack.com/api/openid.connect.token";
  userProfileUri = "https://slack.com/api/openid.connect.userInfo";

  override jwksUri = "https://slack.com/openid/connect/keys";
  override jwtIssuer = "https://slack.com";

  override scopes = ["openid", "profile", "email"];
  override scopeSeparator = " ";

  mapDataToUserProfile(data: UserRawData): UserProfile {
    return this.mapOidcIdTokenClaimsToUserProfile(data);
  }
}
