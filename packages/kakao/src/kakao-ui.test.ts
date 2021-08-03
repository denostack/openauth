import { chromium } from 'playwright'
import { parse } from 'querystring'

import { KakaoOAuth } from './kakao-oauth'

const PLAYWRIGHT_HEADLESS = (process.env.PLAYWRIGHT_HEADLESS ?? '') !== 'false'

const CLIENT_ID = process.env.KAKAO_CLIENT_ID ?? ''
const CLIENT_SECRET = process.env.KAKAO_CLIENT_SECRET ?? ''
const REDIRECT_URI = process.env.KAKAO_REDIRECT_URI ?? ''

const USERNAME = process.env.KAKAO_USERNAME ?? ''
const PASSWORD = process.env.KAKAO_PASSWORD ?? ''

async function loginAndGetAuthCode(url: string, redirectUri: string): Promise<string> {
  const browser = await chromium.launch({ headless: PLAYWRIGHT_HEADLESS })
  const context = await browser.newContext()
  const page = await context.newPage()

  await page.goto(url)

  await page.waitForSelector('#id_email_2, #id_password_3')

  await page.fill('#id_email_2', USERNAME)
  await page.fill('#id_password_3', PASSWORD)

  await Promise.all([
    page.waitForNavigation(),
    page.click('#login-form button.submit'),
  ])

  if (page.url().startsWith(redirectUri)) {
    const url = page.url()
    await browser.close()
    return parse(url.split('?')[1]).code as string
  }

  const [_, enabledAgreeAll] = await Promise.all([
    page.waitForSelector('#acceptButton'),
    page.waitForSelector('[for=agreeAll]', { timeout: 100 }).then(() => true).catch(() => false),
  ])

  if (enabledAgreeAll) {
    await page.click('[for=agreeAll]')
  }

  await Promise.all([
    page.waitForNavigation(),
    page.click('#acceptButton'),
  ])

  if (page.url().startsWith(redirectUri)) {
    const url = page.url()
    await browser.close()
    return parse(url.split('?')[1]).code as string
  }

  throw new Error('fail to login')
}

describe('@openauth/kakao ui test', () => {

  if (!USERNAME || !PASSWORD) {
    it.skip('skip', () => void 0)
    return
  }

  const oauth = new KakaoOAuth({
    clientId: CLIENT_ID,
    clientSecret: CLIENT_SECRET,
    redirectUri: REDIRECT_URI,
  })

  it('test login', async () => {
    const authCode = await loginAndGetAuthCode(await oauth.getAuthRequestUri(), REDIRECT_URI)

    const { accessToken } = await oauth.getAccessTokenResponse(authCode)
    const authUser = await oauth.getAuthUser(accessToken)

    expect(authUser).toEqual({
      id: expect.any(String),
      email: expect.any(String),
      nickname: expect.any(String),
      avatar: expect.any(String),
      raw: expect.any(Object),
    })

    expect(authUser.id).toEqual(`${authUser.raw.id}`)
    expect(authUser.email).toEqual(authUser.raw.kakao_account.email)
    expect(authUser.nickname).toEqual(authUser.raw.kakao_account.profile.nickname)
  })
})
