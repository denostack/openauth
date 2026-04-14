export interface AuthRequestUriOptions {
  clientId?: string;
  redirectUri?: string;
  /** default: "code" */
  responseType?: string;
  scope?: string[] | string | null;
  state?: string;
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
  picture?: string;
  raw?: unknown;
}

export interface OAuth {
  getAuthRequestUri(options?: AuthRequestUriOptions): Promise<string>;
  getAccessTokenResponse(code: string, options?: AccessTokenResponseOptions): Promise<AccessTokenResponse>;
  getUserProfile(accessToken: string): Promise<UserProfile>;
}
