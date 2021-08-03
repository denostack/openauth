import { Client, HttpPath } from '@openauth/core'

import { NaverApiResult, NidMe } from './api'

export class NaverClient extends Client {

  request<TData = any>(method: string, path: string | HttpPath, params: Record<string, any> = {}, headers: Record<string, any> = {}): Promise<{ status: number, headers: any, data: TData }> {
    return super.request(method, path, params, headers).then((response) => {
      if (response.status >= 400) {
        const { error_description: description, ...errorProps } = response.data
        throw Object.assign(new Error(description || 'Error occured'), {
          ...errorProps,
        })
      }
      if (response.data.error) {
        const { error_description: description, ...errorProps } = response.data
        throw Object.assign(new Error(description || 'Error occured'), {
          ...errorProps,
        })
      }
      return response
    })
  }

  getNidMe(): Promise<NidMe> {
    return this.get<NaverApiResult<NidMe>>('nid/me').then(({ data }) => data.response)
  }
}
