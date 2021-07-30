import { HttpPath } from './interfaces/oauth'


export function join(base: string, path: string | HttpPath): URL {
  const baseUrl = new URL(base)
  baseUrl.pathname = `${baseUrl.pathname.replace(/\/+$/, '')}/`

  let _path = typeof path === 'string' ? path : path.path
  _path = _path === '.' ? '' : _path

  const _query = typeof path === 'string' ? [] : Object.entries(path.query)

  const url = new URL(_path, baseUrl)
  for (const [key, value] of _query) {
    if (value === null || typeof value === 'undefined') {
      url.searchParams.delete(key)
    } else if (Array.isArray(value)) {
      for (const item of value) {
        url.searchParams.append(key, item)
      }
    } else {
      url.searchParams.set(key, value)
    }
  }
  url.pathname = url.pathname.replace(/\/+$/, '')
  return url
}
