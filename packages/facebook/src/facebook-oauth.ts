import { Client, OAuth2, AuthUser, OAuth2Options } from '@openauth/core'

import { FacebookClient } from './facebook-client'

export interface FacebookOAuthOptions extends OAuth2Options {
  version?: string
  clientId: string
  redirectUri: string
  clientSecret: string
  scope: string | string[]
}

export class FacebookOAuth extends OAuth2<FacebookClient> {

  version: string

  constructor(options: FacebookOAuthOptions) {
    super(options)
    this.version = options.version ?? 'v11.0'
  }

  apiBaseUri(): string {
    return `https://graph.facebook.com/${this.version}`
  }

  authRequestUri(): string {
    return `https://www.facebook.com/${this.version}/dialog/oauth`
  }

  accessTokenRequestUri(): string {
    return 'oauth/access_token'
  }

  createClient(accessToken?: string): Client {
    return new FacebookClient({
      baseUri: this.apiBaseUri(),
      fetch: this._fetch,
      accessToken,
    })
  }

  async getAuthUser(accessToken: string): Promise<AuthUser> {
    const { data } = await this.getClient(accessToken).get<{ id: string, name?: string, email?: string }>({
      path: 'me',
      query: {
        fields: 'id,email,name',
      },
    })
    return {
      id: data.id,
      name: data.name,
      email: data.email,
      avatar: `https://graph.facebook.com/${this.version}/${data.id}/picture?type=normal`,
      raw: data,
    }
  }
}
