/**
 * Standard OpenID Connect claims carried in an ID token payload.
 *
 * @see https://openid.net/specs/openid-connect-core-1_0.html#StandardClaims
 */
export interface OidcIdTokenClaims {
  sub: string;
  iss?: string;
  aud?: string | string[];
  exp?: number;
  iat?: number;
  auth_time?: number;
  nonce?: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  middle_name?: string;
  nickname?: string;
  preferred_username?: string;
  profile?: string;
  picture?: string;
  website?: string;
  email?: string;
  email_verified?: boolean;
  gender?: "male" | "female";
  /**
   * Birth date in yyyy-MM-dd format.
   * @example 1980-01-01
   */
  birthdate?: string;
  /**
   * Time zone.
   * @example Europe/Paris or America/Los_Angeles
   */
  zoneinfo?: string;
  /**
   * Preferred language, as a BCP 47 language tag.
   * @example en-US
   */
  locale?: string;
  phone_number?: string;
  phone_number_verified?: boolean;
  updated_at?: number;
}
