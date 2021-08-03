import { GithubOAuth } from './github-oauth'

const CLIENT_ID = process.env.GITHUB_CLIENT_ID ?? '1234567890'
const CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET ?? '1234567890abcdefghijklmnopqrstuvwxyz'
const REDIRECT_URI = process.env.GITHUB_REDIRECT_URI ?? 'https://openauth.wani.kr/github/callback'
const SCOPE = ['read:user', 'user:email', 'user:follow']

describe('@openauth/github GithubOAuth', () => {

  it('test getAuthRequestUri', async () => {
    const oauth = new GithubOAuth({
      clientId: CLIENT_ID,
      clientSecret: CLIENT_SECRET,
      redirectUri: REDIRECT_URI,
      scope: SCOPE,
    })

    const state = 'randomstring'
    const uri = await oauth.getAuthRequestUri({ state })

    expect(uri).toEqual(`https://github.com/login/oauth/authorize?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&state=${state}&scope=${encodeURIComponent(SCOPE.join(' ')).replace(/%20/g, '+')}`)
  })

  it('test getAccessTokenResponse success', async () => {
    const mockFetch = jest.fn()
    mockFetch.mockImplementation(() => Promise.resolve({
      status: 200,
      headers: {},
      json: () => Promise.resolve({
        access_token: 'ACCESSTOKEN_1234567890',
        token_type: 'bearer',
        scope: SCOPE.join(','),
      }),
    }))

    const oauth = new GithubOAuth({
      clientId: CLIENT_ID,
      clientSecret: CLIENT_SECRET,
      redirectUri: REDIRECT_URI,
      scope: SCOPE,
      fetch: mockFetch,
    })

    const AUTHCODE = 'TOKEN_FROM_GITHUB_1234567890'
    const state = 'randomstring'
    await expect(oauth.getAccessTokenResponse(AUTHCODE, { state })).resolves.toEqual({
      accessToken: 'ACCESSTOKEN_1234567890',
      tokenType: 'bearer',
    })

    expect(mockFetch).toHaveBeenCalledTimes(1)
    expect(mockFetch).toHaveBeenCalledWith(
      `https://github.com/login/oauth/access_token?client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&code=${AUTHCODE}&state=${state}`,
      {
        method: 'GET',
        headers: {
          'accept': 'application/json',
          'content-type': 'application/json',
        },
      },
    )
  })

  it('test getAccessTokenResponse fail', async () => {
    const mockFetch = jest.fn()
    mockFetch.mockImplementation(() => Promise.resolve({
      status: 200,
      headers: {},
      json: () => Promise.resolve({
        error: 'bad_verification_code',
        error_description: 'The code passed is incorrect or expired.',
        error_uri: 'https://docs.github.com/apps/managing-oauth-apps/troubleshooting-oauth-app-access-token-request-errors/#bad-verification-code',
      }),
    }))

    const oauth = new GithubOAuth({
      clientId: CLIENT_ID,
      clientSecret: CLIENT_SECRET,
      redirectUri: REDIRECT_URI,
      scope: SCOPE,
      fetch: mockFetch,
    })

    const AUTHCODE = 'TOKEN_FROM_GITHUB_1234567890'
    const state = 'randomstring'
    try {
      await oauth.getAccessTokenResponse(AUTHCODE, { state })
      ;(global.fail as any)()
    } catch (e) {
      expect(e.error).toEqual('bad_verification_code')
      expect(e.message).toEqual('The code passed is incorrect or expired.')
    }

    expect(mockFetch).toHaveBeenCalledTimes(1)
    expect(mockFetch).toHaveBeenCalledWith(
      `https://github.com/login/oauth/access_token?client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&code=${AUTHCODE}&state=${state}`,
      {
        method: 'GET',
        headers: {
          'accept': 'application/json',
          'content-type': 'application/json',
        },
      },
    )
  })

  it('test getAuthUser', async () => {
    const mockFetch = jest.fn()
    mockFetch.mockImplementation(() => Promise.resolve({
      status: 200,
      headers: {},
      json: () => Promise.resolve({
        login: 'wan2land',
        id: '123456789',
        avatar_url: 'https://corgi.photos/400/400',
        name: 'Cris Jun',
        email: 'hi@wani.kr',
        blog: 'https://wani.kr',
        location: 'Seoul',
        bio: 'Computer-Illiterate. JS, a little bit.',
        public_repos: 49,
        public_gists: 18,
        followers: 65,
        following: 103,
        created_at: '2013-04-07T19:53:43Z',
        updated_at: '2020-05-18T14:14:36Z',
      }),
    }))

    const oauth = new GithubOAuth({
      clientId: CLIENT_ID,
      clientSecret: CLIENT_SECRET,
      redirectUri: REDIRECT_URI,
      scope: SCOPE,
      fetch: mockFetch,
    })

    const ACCESS_TOKEN = 'ACCESSTOKEN_1234567890'
    await expect(oauth.getAuthUser(ACCESS_TOKEN)).resolves.toEqual({
      id: '123456789',
      email: 'hi@wani.kr',
      name: 'Cris Jun',
      avatar: 'https://corgi.photos/400/400',
      raw: {
        login: 'wan2land',
        id: '123456789',
        avatar_url: 'https://corgi.photos/400/400',
        name: 'Cris Jun',
        email: 'hi@wani.kr',
        blog: 'https://wani.kr',
        location: 'Seoul',
        bio: 'Computer-Illiterate. JS, a little bit.',
        public_repos: 49,
        public_gists: 18,
        followers: 65,
        following: 103,
        created_at: '2013-04-07T19:53:43Z',
        updated_at: '2020-05-18T14:14:36Z',
      },
    })

    expect(mockFetch).toHaveBeenCalledTimes(1)
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.github.com/user',
      {
        method: 'GET',
        headers: {
          'accept': 'application/json',
          'content-type': 'application/json',
          'authorization': `Bearer ${ACCESS_TOKEN}`,
        },
      },
    )
  })
})
