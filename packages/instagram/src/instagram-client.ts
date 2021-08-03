import { HttpPath, Client } from '@openauth/core'

export class InstagramClient extends Client {

  request<TData = any>(method: string, path: string | HttpPath, params: Record<string, any> = {}, headers: Record<string, any> = {}): Promise<{ status: number, headers: any, data: TData }> {
    return super.request(method, path, params, headers).then((response) => {
      if (response.status >= 400) {
        const { error_message: message, error_type: type, ...errorProps } = response.data
        throw Object.assign(new Error(message || 'Error occured'), {
          type,
          ...errorProps,
        })
      }
      return response
    })
  }
}
