import { FacebookOAuth } from './facebook-oauth'

const CLIENT_ID = process.env.FACEBOOK_CLIENT_ID ?? '1234567890'
const CLIENT_SECRET = process.env.FACEBOOK_CLIENT_SECRET ?? '1234567890abcdefghijklmnopqrstuvwxyz'
const REDIRECT_URI = process.env.FACEBOOK_REDIRECT_URI ?? 'https://openauth.wani.kr/facebook/callback'
const SCOPE = ['pages_show_list', 'public_profile']

describe('@openauth/facebook FacebookOAuth', () => {

  it('test getAuthRequestUri', async () => {
    const oauth = new FacebookOAuth({
      clientId: CLIENT_ID,
      clientSecret: CLIENT_SECRET,
      redirectUri: REDIRECT_URI,
      scope: SCOPE,
    })

    const uri = await oauth.getAuthRequestUri()

    expect(uri).toEqual(`https://www.facebook.com/${oauth.version}/dialog/oauth?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${encodeURIComponent(SCOPE.join(','))}`)
  })

  // TODO add mock error
  // error: {
  //   message: 'This authorization code has expired.',
  //   type: 'OAuthException',
  //   code: 100,
  //   error_subcode: 36007,
  //   fbtrace_id: 'Base64CharactersId'
  // }

  it('test getAccessTokenResponse success', async () => {
    const mockFetch = jest.fn()
    mockFetch.mockImplementation(() => Promise.resolve({
      status: 200,
      headers: {},
      json: () => Promise.resolve({
        access_token: 'ACCESSTOKEN_1234567890',
        token_type: 'bearer',
        expires_in: 5183770,
      }),
    }))

    const oauth = new FacebookOAuth({
      clientId: CLIENT_ID,
      clientSecret: CLIENT_SECRET,
      redirectUri: REDIRECT_URI,
      scope: SCOPE,
      fetch: mockFetch,
    })

    const AUTHCODE = 'TOKEN_FROM_FACEBOOK_1234567890'
    await expect(oauth.getAccessTokenResponse(AUTHCODE)).resolves.toEqual({
      accessToken: 'ACCESSTOKEN_1234567890',
      tokenType: 'bearer',
      expiresIn: 5183770,
    })

    expect(mockFetch).toHaveBeenCalledTimes(1)
    expect(mockFetch).toHaveBeenCalledWith(
      `https://graph.facebook.com/${oauth.version}/oauth/access_token?client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&code=${AUTHCODE}&grant_type=authorization_code`,
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
        id: '123456789',
        name: 'Cris Jun',
      }),
    }))

    const oauth = new FacebookOAuth({
      clientId: CLIENT_ID,
      clientSecret: CLIENT_SECRET,
      redirectUri: REDIRECT_URI,
      scope: SCOPE,
      fetch: mockFetch,
    })

    const ACCESS_TOKEN = 'ACCESSTOKEN_1234567890'

    await expect(oauth.getAuthUser(ACCESS_TOKEN)).resolves.toEqual({
      id: '123456789',
      name: 'Cris Jun',
      avatar: `https://graph.facebook.com/${oauth.version}/123456789/picture?type=normal`,
      raw: {
        id: '123456789',
        name: 'Cris Jun',
      },
    })

    expect(mockFetch).toHaveBeenCalledTimes(1)
    expect(mockFetch).toHaveBeenCalledWith(
      `https://graph.facebook.com/${oauth.version}/me?fields=id%2Cemail%2Cname`,
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
