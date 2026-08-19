import { OAuth20, type OidcIdTokenClaims, type UserProfile } from "../core/mod.ts";

export interface UserRawData extends Omit<OidcIdTokenClaims, "locale"> {
  /**
   * LinkedIn documents the OIDC `locale` claim as a BCP 47 string (e.g. "en-US"),
   * but the userinfo endpoint actually returns LinkedIn's platform locale record
   * (e.g. `{ "language": "ko", "country": "KR" }`).
   */
  locale?: string | {
    language?: string;
    country?: string;
  };
}

export class LinkedInOAuth extends OAuth20 {
  authRequestUri = "https://www.linkedin.com/oauth/v2/authorization";
  accessTokenRequestUri = "https://www.linkedin.com/oauth/v2/accessToken";
  userProfileUri = "https://api.linkedin.com/v2/userinfo";

  override jwksUri = "https://www.linkedin.com/oauth/openid/jwks";
  override jwtIssuer = "https://www.linkedin.com/oauth";

  override scopes = ["openid", "profile", "email"];
  override scopeSeparator = " ";

  mapDataToUserProfile(data: UserRawData): UserProfile {
    const { locale, ...oidcData } = data;
    return {
      ...this.mapOidcIdTokenClaimsToUserProfile({
        ...oidcData,
        ...(locale ? { locale: normalizeLocale(locale) } : {}),
      }),
      raw: data,
    };
  }
}

function normalizeLocale(locale: string | { language?: string; country?: string }): string {
  if (typeof locale === "string") {
    return locale;
  }
  return [locale.language, locale.country].filter(Boolean).join("-");
}
