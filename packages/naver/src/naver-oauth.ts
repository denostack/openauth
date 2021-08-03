import { OAuth2, AuthUser, AccessTokenResponse, OAuth2Options } from '@openauth/core'

import { NaverClient } from './naver-client'

export type NaverOAuthOptions = OAuth2Options

export class NaverOAuth extends OAuth2<NaverClient> {

  apiBaseUri(): string {
    return 'https://openapi.naver.com/v1'
  }

  authRequestUri(): string {
    return 'https://nid.naver.com/oauth2.0/authorize'
  }

  accessTokenRequestUri(): string {
    return 'https://nid.naver.com/oauth2.0/token'
  }

  mapDataToAccessTokenResponse(body: Record<string, any>): AccessTokenResponse {
    return {
      accessToken: body.access_token,
      tokenType: body.token_type,
      expiresIn: +body.expires_in,
      refreshToken: body.refresh_token,
    }
  }

  createClient(accessToken?: string): NaverClient {
    return new NaverClient({
      baseUri: this.apiBaseUri(),
      fetch: this._fetch,
      accessToken,
    })
  }

  async getAuthUser(accessToken: string): Promise<AuthUser> {
    const data = await this.getClient(accessToken).getNidMe()
    return {
      id: data.id,
      name: data.name,
      email: data.email,
      raw: data,
    }
  }
}
