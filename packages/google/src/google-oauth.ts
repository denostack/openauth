import { AccessTokenRespnoseOptions, AuthUser, Client, OAuth2, OAuth2Options } from '@openauth/core'

import { GoogleClient } from './google-client'

export type GoogleOAuthOptions = OAuth2Options

export class GoogleOAuth extends OAuth2<GoogleClient> {

  apiBaseUri(): string {
    return 'https://www.googleapis.com'
  }

  authRequestUri(): string {
    return 'https://accounts.google.com/o/oauth2/v2/auth'
  }

  accessTokenRequestUri(): string {
    return 'https://oauth2.googleapis.com/token'
  }

  buildScopes(scopes: string[]): string {
    return scopes.join(' ')
  }

  createClient(accessToken?: string): Client {
    return new GoogleClient({
      baseUri: this.apiBaseUri(),
      fetch: this._fetch,
      accessToken,
    })
  }

  async requestAccessToken(code: string, options: AccessTokenRespnoseOptions = {}): Promise<Record<string, any>> {
    return this.getClient().post(this.accessTokenRequestUri(), this.getAccessTokenFields(code, options)).then(({ data }) => data)
  }

  async getAuthUser(accessToken: string): Promise<AuthUser> {
    const { data } = await this.getClient(accessToken).get<{
      email: string,
      email_verified: boolean,
      family_name: string,
      given_name: string,
      locale: string,
      name: string,
      picture: string,
      sub: string,
    }>('oauth2/v3/userinfo')
    return {
      id: data.sub,
      name: data.name,
      email: data.email,
      avatar: data.picture,
      raw: data,
    }
  }
}
