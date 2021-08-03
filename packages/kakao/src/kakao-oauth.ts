import { OAuth2, AuthUser, AccessTokenResponse, OAuth2Options } from '@openauth/core'

import { KakaoClient } from './kakao-client'

export type KakaoOAuthOptions = OAuth2Options

export class KakaoOAuth extends OAuth2<KakaoClient> {

  apiBaseUri(): string {
    return 'https://kapi.kakao.com/v2'
  }

  authRequestUri(): string {
    return 'https://kauth.kakao.com/oauth/authorize'
  }

  accessTokenRequestUri(): string {
    return 'https://kauth.kakao.com/oauth/token'
  }

  mapDataToAccessTokenResponse(body: Record<string, any>): AccessTokenResponse {
    return {
      accessToken: body.access_token,
      tokenType: body.token_type,
      expiresIn: body.expires_in,
      refreshToken: body.refresh_token,
      refreshTokenExpiresIn: body.refresh_token_expires_in,
    }
  }

  createClient(accessToken?: string): KakaoClient {
    return new KakaoClient({
      baseUri: this.apiBaseUri(),
      fetch: this._fetch,
      accessToken,
    })
  }

  async getAuthUser(accessToken: string): Promise<AuthUser> {
    const { data } = await this.getClient(accessToken).getUserMe()
    return {
      id: `${data.id}`,
      email: data.kakao_account?.email,
      nickname: data.properties?.nickname ?? data.kakao_account?.profile?.nickname,
      avatar: data.properties?.profile_image ?? data.kakao_account?.profile?.profile_image_url,
      raw: data,
    }
  }
}
