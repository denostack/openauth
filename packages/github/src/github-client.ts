import { Client, HttpPath } from '@openauth/core'

export class GithubClient extends Client {

  request<TData = any>(method: string, path: string | HttpPath, params: Record<string, any> = {}, headers: Record<string, any> = {}): Promise<{ status: number, headers: any, data: TData }> {
    return super.request(method, path, params, headers).then(response => {
      if (response.status >= 400) {
        const { message, ...errorProps } = response.data
        throw Object.assign(new Error(message || 'Error occured'), errorProps)
      }
      if (response.data.error) {
        const { error_description: message, ...errorProps } = response.data
        throw Object.assign(new Error(message || 'Error occured'), errorProps)
      }
      return response
    })
  }
}
