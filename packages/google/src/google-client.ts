import { Client, HttpPath } from '@openauth/core'

export class GoogleClient extends Client {

  request<TData = any>(method: string, path: string | HttpPath, params: Record<string, any> = {}, headers: Record<string, any> = {}): Promise<{ status: number, headers: any, data: TData }> {
    return super.request(method, path, params, headers).then((response) => {
      if (response.status >= 400) {
        const { message, error_description: description, ...errorProps } = response.data
        throw Object.assign(new Error(description || message || 'Error occured'), errorProps)
      }
      return response
    })
  }
}
