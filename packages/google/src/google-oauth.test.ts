import { GoogleOAuth } from './google-oauth'

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID ?? '1234567890'
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET ?? '1234567890abcdefghijklmnopqrstuvwxyz'
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI ?? 'https://openauth.wani.kr/google/callback'
const SCOPE = ['openid', 'profile', 'email']

describe('@openauth/google GoogleOAuth', () => {

  it('test getAuthRequestUri', async () => {
    const oauth = new GoogleOAuth({
      clientId: CLIENT_ID,
      clientSecret: CLIENT_SECRET,
      redirectUri: REDIRECT_URI,
      scope: SCOPE,
    })

    const uri = await oauth.getAuthRequestUri()

    expect(uri).toEqual(`https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${encodeURIComponent(SCOPE.join(' ')).replace(/%20/g, '+')}`)
  })

  it('test getAccessTokenResponse success', async () => {
    const mockFetch = jest.fn()
    mockFetch.mockImplementation(() => Promise.resolve({
      status: 200,
      headers: {},
      json: () => Promise.resolve({
        access_token: 'ACCESSTOKEN_1234567890',
        expires_in: 3599,
        token_type: 'Bearer',
        scope: SCOPE.join(' '),
        id_token: 'IDTOKEN_1234567890',
      }),
    }))

    const oauth = new GoogleOAuth({
      clientId: CLIENT_ID,
      clientSecret: CLIENT_SECRET,
      redirectUri: REDIRECT_URI,
      scope: SCOPE,
      fetch: mockFetch,
    })

    const AUTHCODE = 'TOKEN_FROM_GOOGLE_1234567890'
    await expect(oauth.getAccessTokenResponse(AUTHCODE)).resolves.toEqual({
      accessToken: 'ACCESSTOKEN_1234567890',
      tokenType: 'Bearer',
      expiresIn: 3599,
    })

    expect(mockFetch).toHaveBeenCalledTimes(1)
    expect(mockFetch).toHaveBeenCalledWith(
      'https://oauth2.googleapis.com/token',
      {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          client_id: CLIENT_ID,
          client_secret: CLIENT_SECRET,
          redirect_uri: REDIRECT_URI,
          code: AUTHCODE,
          grant_type: 'authorization_code',
        }),
      },
    )
  })

  it('test getAccessTokenResponse fail', async () => {
    const mockFetch = jest.fn()
    mockFetch.mockImplementation(() => Promise.resolve({
      status: 400,
      headers: {},
      json: () => Promise.resolve({
        error: 'invalid_grant',
        error_description: 'Malformed auth code.',
      }),
    }))

    const oauth = new GoogleOAuth({
      clientId: CLIENT_ID,
      clientSecret: CLIENT_SECRET,
      redirectUri: REDIRECT_URI,
      scope: SCOPE,
      fetch: mockFetch,
    })

    const AUTHCODE = 'TOKEN_FROM_GOOGLE_1234567890'
    try {
      await oauth.getAccessTokenResponse(AUTHCODE)
      ;(global.fail as any)()
    } catch (e) {
      expect(e.error).toEqual('invalid_grant')
      expect(e.message).toEqual('Malformed auth code.')
    }

    expect(mockFetch).toHaveBeenCalledTimes(1)
    expect(mockFetch).toHaveBeenCalledWith(
      'https://oauth2.googleapis.com/token',
      {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          client_id: CLIENT_ID,
          client_secret: CLIENT_SECRET,
          redirect_uri: REDIRECT_URI,
          code: AUTHCODE,
          grant_type: 'authorization_code',
        }),
      },
    )
  })

  it('test getAuthUser', async () => {
    const mockFetch = jest.fn()
    mockFetch.mockImplementation(() => Promise.resolve({
      status: 200,
      headers: {},
      json: () => Promise.resolve({
        sub: '123456789',
        name: 'Cris Jun',
        given_name: 'Cris',
        family_name: 'Jun',
        picture: 'https://corgi.photos/200/200',
        email: 'wan2land@gmail.com',
        email_verified: true,
        locale: 'ko',
      }),
    }))

    const oauth = new GoogleOAuth({
      clientId: CLIENT_ID,
      clientSecret: CLIENT_SECRET,
      redirectUri: REDIRECT_URI,
      scope: SCOPE,
      fetch: mockFetch,
    })

    const ACCESS_TOKEN = 'ACCESSTOKEN_1234567890'
    await expect(oauth.getAuthUser(ACCESS_TOKEN)).resolves.toEqual({
      id: '123456789',
      email: 'wan2land@gmail.com',
      name: 'Cris Jun',
      avatar: 'https://corgi.photos/200/200',
      raw: {
        sub: '123456789',
        name: 'Cris Jun',
        given_name: 'Cris',
        family_name: 'Jun',
        picture: 'https://corgi.photos/200/200',
        email: 'wan2land@gmail.com',
        email_verified: true,
        locale: 'ko',
      },
    })

    expect(mockFetch).toHaveBeenCalledTimes(1)
    expect(mockFetch).toHaveBeenCalledWith(
      'https://www.googleapis.com/oauth2/v3/userinfo',
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
