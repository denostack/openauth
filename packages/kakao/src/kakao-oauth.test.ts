import { KakaoOAuth } from './kakao-oauth'

const CLIENT_ID = process.env.KAKAO_CLIENT_ID ?? '1234567890'
const CLIENT_SECRET = process.env.KAKAO_CLIENT_SECRET ?? '1234567890abcdefghijklmnopqrstuvwxyz'
const REDIRECT_URI = process.env.KAKAO_REDIRECT_URI ?? 'https://openauth.wani.kr/kakao/callback'

describe('@openauth/kakao KakaoOAuth', () => {


  it('test getAuthRequestUri', async () => {
    const oauth = new KakaoOAuth({
      clientId: CLIENT_ID,
      clientSecret: CLIENT_SECRET,
      redirectUri: REDIRECT_URI,
    })

    const state = 'randomstring'
    const uri = await oauth.getAuthRequestUri({ state })

    expect(uri).toEqual(`https://kauth.kakao.com/oauth/authorize?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&state=${state}`)
  })

  it('test getAccessTokenResponse success', async () => {
    const mockFetch = jest.fn()
    mockFetch.mockImplementation(() => Promise.resolve({
      status: 200,
      headers: {},
      json: () => Promise.resolve({
        access_token: 'ACCESSTOKEN_1234567890',
        token_type: 'bearer',
        refresh_token: 'REFRESHTOKEN_1234567890',
        expires_in: 21599,
        scope: 'age_range birthday account_email gender profile',
        refresh_token_expires_in: 5183999,
      }),
    }))

    const oauth = new KakaoOAuth({
      clientId: CLIENT_ID,
      clientSecret: CLIENT_SECRET,
      redirectUri: REDIRECT_URI,
      fetch: mockFetch,
    })

    const AUTHCODE = 'TOKEN_FROM_KAKAO_1234567890'
    await expect(oauth.getAccessTokenResponse(AUTHCODE)).resolves.toEqual({
      accessToken: 'ACCESSTOKEN_1234567890',
      refreshToken: 'REFRESHTOKEN_1234567890',
      tokenType: 'bearer',
      expiresIn: 21599,
      refreshTokenExpiresIn: 5183999,
    })

    expect(mockFetch).toHaveBeenCalledTimes(1)
    expect(mockFetch).toHaveBeenCalledWith(
      `https://kauth.kakao.com/oauth/token?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&code=${AUTHCODE}&grant_type=authorization_code`,
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
      status: 400,
      headers: {},
      json: () => Promise.resolve({
        error: 'invalid_grant',
        error_description: 'authorization code not found.',
        error_code: 'KOE320',
      }),
    }))

    const oauth = new KakaoOAuth({
      clientId: CLIENT_ID,
      clientSecret: CLIENT_SECRET,
      redirectUri: REDIRECT_URI,
      fetch: mockFetch,
    })

    const AUTHCODE = 'TOKEN_FROM_KAKAO_1234567890'
    try {
      await oauth.getAccessTokenResponse(AUTHCODE)
      ;(global.fail as any)()
    } catch (e) {
      expect(e.error).toEqual('invalid_grant')
      expect(e.message).toEqual('authorization code not found.')
      expect(e.code).toEqual('KOE320')
    }

    expect(mockFetch).toHaveBeenCalledTimes(1)
    expect(mockFetch).toHaveBeenCalledWith(
      `https://kauth.kakao.com/oauth/token?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&code=${AUTHCODE}&grant_type=authorization_code`,
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
        id: 123456789,
        connected_at: '2020-08-09T13:52:19Z',
        properties: {
          nickname: 'Cris Jun',
          profile_image: 'https://corgi.photos/640/640',
          thumbnail_image: 'https://corgi.photos/110/110',
        },
        kakao_account: {
          profile_needs_agreement: false,
          profile: {
            nickname: 'Cris Jun',
            thumbnail_image_url: 'https://corgi.photos/110/110',
            profile_image_url: 'https://corgi.photos/640/640',
            is_default_image: false,
          },
          has_email: true,
          email_needs_agreement: false,
          is_email_valid: true,
          is_email_verified: true,
          email: 'wan2land@gmail.com',
        },
      }),
    }))

    const oauth = new KakaoOAuth({
      clientId: CLIENT_ID,
      clientSecret: CLIENT_SECRET,
      redirectUri: REDIRECT_URI,
      fetch: mockFetch,
    })

    const ACCESS_TOKEN = 'ACCESSTOKEN_1234567890'
    await expect(oauth.getAuthUser(ACCESS_TOKEN)).resolves.toEqual({
      avatar: 'https://corgi.photos/640/640',
      id: '123456789',
      email: 'wan2land@gmail.com',
      nickname: 'Cris Jun',
      raw: {
        id: 123456789,
        connected_at: '2020-08-09T13:52:19Z',
        properties: {
          nickname: 'Cris Jun',
          profile_image: 'https://corgi.photos/640/640',
          thumbnail_image: 'https://corgi.photos/110/110',
        },
        kakao_account: {
          profile_needs_agreement: false,
          profile: {
            nickname: 'Cris Jun',
            thumbnail_image_url: 'https://corgi.photos/110/110',
            profile_image_url: 'https://corgi.photos/640/640',
            is_default_image: false,
          },
          has_email: true,
          email_needs_agreement: false,
          is_email_valid: true,
          is_email_verified: true,
          email: 'wan2land@gmail.com',
        },
      },
    })

    expect(mockFetch).toHaveBeenCalledTimes(1)
    expect(mockFetch).toHaveBeenCalledWith(
      'https://kapi.kakao.com/v2/user/me',
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
