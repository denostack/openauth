import { AuthUser, Client, OAuth2, OAuth2Options, AccessTokenRespnoseOptions } from '@openauth/core'

import { InstagramClient } from './instagram-client'

export type InstagramOAuthOptions = OAuth2Options

export class InstagramOAuth extends OAuth2 {

  apiBaseUri(): string {
    return 'https://graph.instagram.com'
  }

  authRequestUri(): string {
    return 'https://api.instagram.com/oauth/authorize'
  }

  accessTokenRequestUri(): string {
    return 'https://api.instagram.com/oauth/access_token'
  }

  createClient(accessToken?: string): Client {
    return new InstagramClient({
      baseUri: this.apiBaseUri(),
      fetch: this._fetch,
      accessToken,
    })
  }

  requestAccessToken(code: string, options: AccessTokenRespnoseOptions = {}): Promise<Record<string, any>> {
    return this.getClient().post(
      this.accessTokenRequestUri(),
      this.getAccessTokenFields(code, options),
      {
        'content-type': 'application/x-www-form-urlencoded',
      },
    ).then(({ data }) => data)
  }

  async getAuthUser(accessToken: string): Promise<AuthUser> {
    const { data } = await this.getClient(accessToken).get<{ id: string, username?: string, account_type?: string, media_count?: number }>({
      path: 'me',
      query: {
        fields: [
          'id',
          'username',
          'account_type',
          'media_count',
        ].join(','),
      },
    })
    return {
      id: data.id,
      nickname: data.username,
      raw: data,
    }
  }
}
