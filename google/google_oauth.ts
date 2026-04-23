import { OAuth20, type OidcIdTokenClaims, type UserProfile } from "../core/mod.ts";

export interface UserRawData extends OidcIdTokenClaims {
  hd?: string; // hosted domain (ex. denostack.com)
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
    return this.mapOidcIdTokenClaimsToUserProfile(data);
  }
}
