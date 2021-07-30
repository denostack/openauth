import { AccessTokenRespnoseOptions, AccessTokenResponse, AuthUser, Client, OAuth2, OAuth2Options } from '@openauth/core'

import { GithubClient } from './github-client'

export type GithubOauthOptions = OAuth2Options

export class GithubOAuth extends OAuth2<GithubClient> {

  apiBaseUri(): string {
    return 'https://api.github.com'
  }

  authRequestUri(): string {
    return 'https://github.com/login/oauth/authorize'
  }

  accessTokenRequestUri(): string {
    return 'https://github.com/login/oauth/access_token'
  }

  buildScopes(scopes: string[]): string {
    return scopes.join(' ')
  }

  createClient(accessToken?: string): Client {
    return new GithubClient({
      baseUri: this.apiBaseUri(),
      fetch: this._fetch,
      accessToken,
    })
  }

  getAccessTokenFields(code: string, options: AccessTokenRespnoseOptions = {}): Record<string, any> {
    return {
      client_id: this.options.clientId,
      client_secret: this.options.clientSecret,
      redirect_uri: this.options.redirectUri,
      code,
      ...options.state ? { state: options.state } : {},
    }
  }

  mapDataToAccessTokenResponse(body: Record<string, any>): AccessTokenResponse {
    return {
      accessToken: body.access_token,
      tokenType: body.token_type,
      ...body.expires_in ? { expiresIn: +body.expires_in } : {},
      refreshToken: body.refresh_token,
    }
  }

  async getAuthUser(accessToken: string): Promise<AuthUser> {
    const { data } = await this.getClient(accessToken).get<{ id: number, name?: string, email?: string, avatar_url?: string }>('user')
    return {
      id: `${data.id}`,
      name: data.name,
      email: data.email,
      avatar: data.avatar_url,
      raw: data,
    }
  }
}
