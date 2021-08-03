import { NaverOAuth } from './naver-oauth'

const CLIENT_ID = process.env.NAVER_CLIENT_ID ?? '1234567890'
const CLIENT_SECRET = process.env.NAVER_CLIENT_SECRET ?? '1234567890abcdefghijklmnopqrstuvwxyz'
const REDIRECT_URI = process.env.NAVER_REDIRECT_URI ?? 'https://openauth.wani.kr/naver/callback'


describe('@openauth/naver NaverOAuth', () => {

  it('test getAuthRequestUri', async () => {
    const oauth = new NaverOAuth({
      clientId: CLIENT_ID,
      clientSecret: CLIENT_SECRET,
      redirectUri: REDIRECT_URI,
    })

    const state = 'randomstate'
    const uri = await oauth.getAuthRequestUri({ state })

    expect(uri).toEqual(`https://nid.naver.com/oauth2.0/authorize?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&state=${state}`)
  })

  it('test getAccessTokenResponse success', async () => {
    const mockFetch = jest.fn()
    mockFetch.mockImplementation(() => Promise.resolve({
      status: 200,
      headers: {},
      json: () => Promise.resolve({
        access_token: 'ACCESSTOKEN_1234567890',
        refresh_token: 'REFRESHTOKEN_1234567890',
        token_type: 'bearer',
        expires_in: '3600',
      }),
    }))

    const oauth = new NaverOAuth({
      clientId: CLIENT_ID,
      clientSecret: CLIENT_SECRET,
      redirectUri: REDIRECT_URI,
      fetch: mockFetch,
    })

    const AUTHCODE = 'TOKEN_FROM_NAVER_1234567890'
    await expect(oauth.getAccessTokenResponse(AUTHCODE)).resolves.toEqual({
      accessToken: 'ACCESSTOKEN_1234567890',
      refreshToken: 'REFRESHTOKEN_1234567890',
      tokenType: 'bearer',
      expiresIn: 3600,
    })

    expect(mockFetch).toHaveBeenCalledTimes(1)
    expect(mockFetch).toHaveBeenCalledWith(
      `https://nid.naver.com/oauth2.0/token?client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&code=${AUTHCODE}&grant_type=authorization_code`,
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
        error: 'invalid_request',
        error_description: 'no valid data in session',
      }),
    }))

    const oauth = new NaverOAuth({
      clientId: CLIENT_ID,
      clientSecret: CLIENT_SECRET,
      redirectUri: REDIRECT_URI,
      fetch: mockFetch,
    })

    const AUTHCODE = 'TOKEN_FROM_NAVER_1234567890'
    try {
      await oauth.getAccessTokenResponse(AUTHCODE)
      ;(global.fail as any)()
    } catch (e) {
      expect(e.error).toEqual('invalid_request')
      expect(e.message).toEqual('no valid data in session')
    }

    expect(mockFetch).toHaveBeenCalledTimes(1)
    expect(mockFetch).toHaveBeenCalledWith(
      `https://nid.naver.com/oauth2.0/token?client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&code=${AUTHCODE}&grant_type=authorization_code`,
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
        resultcode: '00',
        message: 'success',
        response: {
          id: '123456789',
          email: 'wan2land@gmail.com',
          name: 'Cris Jun',
        },
      }),
    }))

    const oauth = new NaverOAuth({
      clientId: CLIENT_ID,
      clientSecret: CLIENT_SECRET,
      redirectUri: REDIRECT_URI,
      fetch: mockFetch,
    })

    const ACCESS_TOKEN = 'ACCESSTOKEN_1234567890'
    await expect(oauth.getAuthUser(ACCESS_TOKEN)).resolves.toEqual({
      id: '123456789',
      email: 'wan2land@gmail.com',
      name: 'Cris Jun',
      raw: {
        id: '123456789',
        email: 'wan2land@gmail.com',
        name: 'Cris Jun',
      },
    })

    expect(mockFetch).toHaveBeenCalledTimes(1)
    expect(mockFetch).toHaveBeenCalledWith(
      'https://openapi.naver.com/v1/nid/me',
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
