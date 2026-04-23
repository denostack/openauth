export interface AuthRequestUriOptions {
  clientId?: string;
  redirectUri?: string;
  /** default: "code" */
  responseType?: string;
  scope?: string[] | string | null;
  state?: string;
  prompt?: string;
  loginHint?: string;
  /** extra parameters */
  extra?: Record<string, string>;
}

export interface AccessTokenResponseOptions {
  clientId?: string;
  clientSecret?: string;
  redirectUri?: string;
  state?: string;
}

export interface AccessTokenResponse {
  accessToken: string;
  scope?: string;
  tokenType?: string;
  expiresIn?: number;
  refreshToken?: string;
  refreshTokenExpiresIn?: number;
  idToken?: string;
}

export interface UserProfile {
  id: string;
  username?: string;
  nickname?: string;
  name?: string;
  email?: string;
  emailVerified?: boolean;
  picture?: string;
  /**
   * @example Europe/Paris or America/Los_Angeles
   */
  zoneinfo?: string;
  /**
   * Preferred language, as a BCP 47 language tag.
   * @example en-US
   */
  locale?: string;
  gender?: "male" | "female";
  /**
   * Birth date in yyyy-MM-dd format.
   * @example 1980-01-01
   */
  birthdate?: string;
  raw?: unknown;
}

export interface GetUserProfileFromIdTokenOptions {
  withoutValidation?: boolean;
}

export interface OAuth {
  getAuthRequestUri(options?: AuthRequestUriOptions): Promise<string>;
  getAccessTokenResponse(code: string, options?: AccessTokenResponseOptions): Promise<AccessTokenResponse>;
  getUserProfile(accessToken: string): Promise<UserProfile>;
  getUserProfileFromIdToken(idToken: string, options?: GetUserProfileFromIdTokenOptions): Promise<UserProfile>;
}
