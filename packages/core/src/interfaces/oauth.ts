
export interface HttpPath {
  path: string
  query: Record<string, any>
}

export interface AuthRequestUriOptions {
  responseType?: string
  clientId?: string
  redirectUri?: string
  scope?: string[] | string | null
  state?: string
}

export interface AccessTokenRespnoseOptions {
  clientId?: string
  clientSecret?: string
  redirectUri?: string
  state?: string
}

export interface AccessTokenResponse {
  accessToken: string
  tokenType?: string
  expiresIn?: number
  refreshToken?: string
  [key: string]: any
}

export interface AuthUser {
  id: string
  nickname?: string
  name?: string
  email?: string
  avatar?: string
  raw?: any
}
