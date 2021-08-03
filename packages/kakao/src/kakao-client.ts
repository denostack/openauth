import { Client, HttpPath } from '@openauth/core'

import { GetUserMeResponse } from './interfaces'


export class KakaoClient extends Client {

  request<TData = any>(method: string, path: string | HttpPath, params: Record<string, any> = {}, headers: Record<string, any> = {}): Promise<{ status: number, headers: any, data: TData }> {
    return super.request(method, path, params, headers).then((response) => {
      if (response.status >= 400) {
        const { error_description: description, error_code: code, ...errorProps } = response.data
        throw Object.assign(new Error(description || 'Error occured'), {
          code,
          ...errorProps,
        })
      }
      return response
    })
  }

  getUserMe() {
    return this.get<GetUserMeResponse>('user/me')
  }
}
