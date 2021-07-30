import { join } from './helpers'

describe('testsuite of helpers', () => {
  it('test join', () => {
    expect(join('https://wani.kr/oauth', '').toString()).toEqual('https://wani.kr/oauth')
    expect(join('https://wani.kr/oauth?response_type=code', '').toString()).toEqual('https://wani.kr/oauth?response_type=code')

    expect(join('https://wani.kr/oauth', '.').toString()).toEqual('https://wani.kr/oauth')
    expect(join('https://wani.kr/oauth?response_type=code', '.').toString()).toEqual('https://wani.kr/oauth?response_type=code')

    expect(join('https://wani.kr/oauth', { path: '', query: { client_id: 'CLIENT_ID' } }).toString())
      .toEqual('https://wani.kr/oauth?client_id=CLIENT_ID')

    expect(join('https://wani.kr/oauth?response_type=code', { path: '', query: { client_id: 'CLIENT_ID' } }).toString())
      .toEqual('https://wani.kr/oauth?response_type=code&client_id=CLIENT_ID')

    expect(join('https://wani.kr/oauth?response_type=code', { path: '', query: { client_id: 'CLIENT_ID', response_type: 'token' } }).toString())
      .toEqual('https://wani.kr/oauth?response_type=token&client_id=CLIENT_ID')

    expect(join('https://wani.kr/oauth', { path: 'me', query: { client_id: 'CLIENT_ID', response_type: null, ignore_null: null, ignore_undef: undefined } }).toString())
      .toEqual('https://wani.kr/oauth/me?client_id=CLIENT_ID')

    expect(join('https://wani.kr/oauth?response_type=code', { path: 'me', query: { client_id: 'CLIENT_ID', response_type: null, ignore_null: null, ignore_undef: undefined } }).toString())
      .toEqual('https://wani.kr/oauth/me?client_id=CLIENT_ID')

  })
})
