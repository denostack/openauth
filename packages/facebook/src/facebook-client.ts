import { Client, HttpPath } from '@openauth/core'

export class FacebookClient extends Client {

  request<TData = any>(method: string, path: string | HttpPath, params: Record<string, any> = {}, headers: Record<string, any> = {}): Promise<{ status: number, headers: any, data: TData }> {
    return super.request(method, path, params, headers).then(response => {
      if (response.data.error) {
        const { message, ...errorProps } = response.data.error
        throw Object.assign(new Error(message || 'Error Occured'), errorProps)
      }
      return response
    })
  }
}
