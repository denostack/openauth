import { InstagramOAuth } from './instagram-oauth'

const CLIENT_ID = process.env.INSTAGRAM_CLIENT_ID ?? '1234567890'
const CLIENT_SECRET = process.env.INSTAGRAM_CLIENT_SECRET ?? '1234567890abcdefghijklmnopqrstuvwxyz'
const REDIRECT_URI = process.env.INSTAGRAM_REDIRECT_URI ?? 'https://openauth.wani.kr/instagram/callback'
const SCOPE = ['user_profile', 'user_media']

describe('@openauth/instagram InstagramOAuth', () => {

  it('test getAuthRequestUri', async () => {
    const oauth = new InstagramOAuth({
      clientId: CLIENT_ID,
      clientSecret: CLIENT_SECRET,
      redirectUri: REDIRECT_URI,
      scope: SCOPE,
    })

    const uri = await oauth.getAuthRequestUri()

    expect(uri).toEqual(`https://api.instagram.com/oauth/authorize?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${encodeURIComponent(SCOPE.join(','))}`)
  })

  it('test getAccessTokenResponse success', async () => {
    const mockFetch = jest.fn()
    mockFetch.mockImplementation(() => Promise.resolve({
      status: 200,
      headers: {},
      json: () => Promise.resolve({
        access_token: 'ACCESSTOKEN_1234567890',
        user_id: 123456789,
      }),
    }))

    const oauth = new InstagramOAuth({
      clientId: CLIENT_ID,
      clientSecret: CLIENT_SECRET,
      redirectUri: REDIRECT_URI,
      scope: SCOPE,
      fetch: mockFetch,
    })

    const AUTHCODE = 'TOKEN_FROM_INSTAGRAM_1234567890'
    await expect(oauth.getAccessTokenResponse(AUTHCODE)).resolves.toEqual({
      accessToken: 'ACCESSTOKEN_1234567890',
    })

    expect(mockFetch).toHaveBeenCalledTimes(1)
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.instagram.com/oauth/access_token',
      {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'content-type': 'application/x-www-form-urlencoded',
        },
        body: `client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&code=${AUTHCODE}&grant_type=authorization_code`,
      },
    )
  })

  it('test getAccessTokenResponse fail', async () => {
    const mockFetch = jest.fn()
    mockFetch.mockImplementation(() => Promise.resolve({
      status: 400,
      headers: {},
      json: () => Promise.resolve({
        error_type: 'OAuthException',
        code: 400,
        error_message: 'Invalid authorization code',
      }),
    }))

    const oauth = new InstagramOAuth({
      clientId: CLIENT_ID,
      clientSecret: CLIENT_SECRET,
      redirectUri: REDIRECT_URI,
      scope: SCOPE,
      fetch: mockFetch,
    })

    const AUTHCODE = 'TOKEN_FROM_INSTAGRAM_1234567890'
    try {
      await oauth.getAccessTokenResponse(AUTHCODE)
      ;(global.fail as any)()
    } catch (e) {
      expect(e.type).toEqual('OAuthException')
      expect(e.code).toEqual(400)
      expect(e.message).toEqual('Invalid authorization code')
    }

    expect(mockFetch).toHaveBeenCalledTimes(1)
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.instagram.com/oauth/access_token',
      {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'content-type': 'application/x-www-form-urlencoded',
        },
        body: `client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&code=${AUTHCODE}&grant_type=authorization_code`,
      },
    )
  })

  it('test getAuthUser', async () => {
    const mockFetch = jest.fn()
    mockFetch.mockImplementation(() => Promise.resolve({
      status: 200,
      headers: {},
      json: () => Promise.resolve({
        id: '123456790',
        username: 'crisjun',
        account_type: 'BUSINESS',
        media_count: 100,
      }),
    }))

    const oauth = new InstagramOAuth({
      clientId: CLIENT_ID,
      clientSecret: CLIENT_SECRET,
      redirectUri: REDIRECT_URI,
      scope: SCOPE,
      fetch: mockFetch,
    })

    const ACCESS_TOKEN = 'ACCESSTOKEN_1234567890'
    await expect(oauth.getAuthUser(ACCESS_TOKEN)).resolves.toEqual({
      id: '123456790',
      nickname: 'crisjun',
      raw: {
        id: '123456790',
        username: 'crisjun',
        account_type: 'BUSINESS',
        media_count: 100,
      },
    })

    expect(mockFetch).toHaveBeenCalledTimes(1)
    expect(mockFetch).toHaveBeenCalledWith(
      'https://graph.instagram.com/me?fields=id%2Cusername%2Caccount_type%2Cmedia_count',
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
