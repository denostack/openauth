import 'cross-fetch'
import { join } from './helpers'
import { HttpPath } from './interfaces/oauth'

export interface ClientOptions {
  baseUri: string
  accessToken?: string
  fetch: (input: Request | string, init?: RequestInit) => Promise<Response>
}

export class Client {

  _fetch: (input: Request | string, init?: RequestInit) => Promise<Response>

  constructor(public options: ClientOptions) {
    this._fetch = options.fetch
  }

  get<TData = any>(path: string | HttpPath, params: Record<string, any> = {}, headers: Record<string, string | string[]> = {}): Promise<{ status: number, headers: any, data: TData }> {
    return this.request<TData>('GET', path, params, headers)
  }

  post<TData = any>(path: string | HttpPath, params: Record<string, any> = {}, headers: Record<string, string | string[]> = {}): Promise<{ status: number, headers: any, data: TData }> {
    return this.request<TData>('POST', path, params, headers)
  }

  put<TData = any>(path: string | HttpPath, params: Record<string, any> = {}, headers: Record<string, string | string[]> = {}): Promise<{ status: number, headers: any, data: TData }> {
    return this.request<TData>('PUT', path, params, headers)
  }

  delete<TData = any>(path: string | HttpPath, params: Record<string, any> = {}, headers: Record<string, string | string[]> = {}): Promise<{ status: number, headers: any, data: TData }> {
    return this.request<TData>('DELETE', path, params, headers)
  }

  request<TData = any>(method: string, path: string | HttpPath, params: Record<string, any> = {}, headers: Record<string, any> = {}): Promise<{ status: number, headers: any, data: TData }> {
    const url = join(this.options.baseUri, path)

    headers = Object.fromEntries(Object.entries(headers).map(([key, value]) => [key.toLowerCase(), value]))

    headers.accept = headers.accept || 'application/json'
    headers['content-type'] = headers['content-type'] || 'application/json'
    if (this.options.accessToken) {
      headers.authorization = `Bearer ${this.options.accessToken}`
    }

    let body = JSON.stringify(params)
    if (headers['content-type'] === 'application/x-www-form-urlencoded') {
      body = new URLSearchParams(params).toString()
    }

    return this._fetch(url.toString(), {
      method,
      headers,
      ...method.toLowerCase() === 'get' ? {} : { body },
    }).then(response => response.json().then((data) => {
      // console.log('response', data)
      return {
        status: response.status,
        headers: response.headers,
        data,
      }
    }))
  }
}
