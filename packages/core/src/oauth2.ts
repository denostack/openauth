import fetch from 'cross-fetch'

import { Client } from './client'
import { join } from './helpers'
import {
  AccessTokenRespnoseOptions,
  AccessTokenResponse,
  AuthRequestUriOptions,
  AuthUser,
} from './interfaces/oauth'


export interface OAuth2Options {
  clientId: string
  clientSecret?: string
  redirectUri: string
  code?: string
  scope?: string[] | string
  fetch?: (input: Request | string, init?: RequestInit) => Promise<Response>
}

export class OAuth2<TClient extends Client = Client> {

  _fetch: (input: Request | string, init?: RequestInit) => Promise<Response>
  _unauthClient?: TClient

  constructor(public options: OAuth2Options) {
    this._fetch = options.fetch ?? fetch
  }

  /**
   * start with https:// or http://
   */
  apiBaseUri(): string {
    throw new TypeError('It must be implemented.')
  }

  /**
   * start with https:// or http://
   */
  authRequestUri(): string {
    throw new TypeError('It must be implemented.')
  }

  accessTokenRequestUri(): string {
    throw new TypeError('It must be implemented.')
  }

  buildScopes(scopes: string[]): string {
    return scopes.join(',')
  }

  getAuthRequestFiels(options: AuthRequestUriOptions = {}): Record<string, any> {
    const scope = options.scope ?? this.options.scope
    return {
      response_type: options.responseType ?? 'code',
      client_id: options.clientId ?? this.options.clientId,
      redirect_uri: options.redirectUri ?? this.options.redirectUri,
      state: options.state,
      scope: scope ? this.buildScopes(Array.isArray(scope) ? scope : [scope]) : null,
    }
  }

  /**
   * @see https://tools.ietf.org/html/rfc6749#section-2.3.1
   * @see https://tools.ietf.org/html/rfc6749#section-4.1.3
   */
  requestAccessToken(code: string, options: AccessTokenRespnoseOptions = {}): Promise<Record<string, any>> {
    return this.getClient().get({
      path: this.accessTokenRequestUri(),
      query: this.getAccessTokenFields(code, options),
    }).then(({ data }) => data)
  }

  getAccessTokenFields(code: string, options: AccessTokenRespnoseOptions = {}): Record<string, any> {
    const clientSecret = options.clientSecret ?? this.options.clientSecret
    return {
      client_id: options.clientId ?? this.options.clientId,
      ...clientSecret ? { client_secret: clientSecret } : {},
      redirect_uri: options.redirectUri ?? this.options.redirectUri,
      code,
      grant_type: 'authorization_code',
    }
  }

  /**
   * @see https://tools.ietf.org/html/rfc6749#section-4.1.4
   */
  mapDataToAccessTokenResponse(body: Record<string, any>): AccessTokenResponse {
    return {
      accessToken: body.access_token,
      tokenType: body.token_type,
      expiresIn: body.expires_in,
      refreshToken: body.refresh_token,
    }
  }

  createClient(accessToken?: string): TClient {
    return new Client({
      baseUri: this.apiBaseUri(),
      fetch: this._fetch,
      accessToken,
    }) as TClient
  }

  /**
   * @see https://tools.ietf.org/html/rfc6749#section-4.1.1
   */
  getAuthRequestUri(options: AuthRequestUriOptions = {}): Promise<string> {
    const url = join(this.authRequestUri(), { path: '', query: this.getAuthRequestFiels(options) })
    return Promise.resolve(url.toString())
  }

  async getAccessTokenResponse(code: string, options: AccessTokenRespnoseOptions = {}): Promise<AccessTokenResponse> {
    return this.mapDataToAccessTokenResponse(await this.requestAccessToken(code, options))
  }

  getClient(accessToken?: string): TClient {
    if (!accessToken) {
      return this._unauthClient ?? (this._unauthClient = this.createClient())
    }
    return this.createClient(accessToken)
  }

  getAuthUser(accessToken: string): Promise<AuthUser> {
    throw new TypeError('It must be implemented.')
  }
}
