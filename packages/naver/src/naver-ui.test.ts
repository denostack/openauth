import { chromium } from 'playwright'
import { parse } from 'querystring'

import { NaverOAuth } from './naver-oauth'

const PLAYWRIGHT_HEADLESS = (process.env.PLAYWRIGHT_HEADLESS ?? '') !== 'false'

const CLIENT_ID = process.env.NAVER_CLIENT_ID ?? ''
const CLIENT_SECRET = process.env.NAVER_CLIENT_SECRET ?? ''
const REDIRECT_URI = process.env.NAVER_REDIRECT_URI ?? ''

const USERNAME = process.env.NAVER_USERNAME ?? ''
const PASSWORD = process.env.NAVER_PASSWORD ?? ''

async function loginAndGetAuthCode(url: string, redirectUri: string): Promise<string> {
  const browser = await chromium.launch({ headless: PLAYWRIGHT_HEADLESS })
  const context = await browser.newContext()
  const page = await context.newPage()

  await page.goto(url)

  await page.waitForSelector('#id, #pw')

  await page.fill('#id', USERNAME)
  await page.fill('#pw', PASSWORD)

  await Promise.all([
    page.waitForNavigation(),
    page.click('form input[type=submit]'),
  ])

  if (page.url().startsWith(redirectUri)) {
    const url = page.url()
    await browser.close()
    return parse(url.split('?')[1]).code as string
  }

  await page.click('[for=extend_profile_name]')
  await page.click('[for=extend_profile_naveremail]')

  await Promise.all([
    page.waitForNavigation(),
    page.click('button.btn_unit_on'),
  ])

  if (page.url().startsWith(redirectUri)) {
    const url = page.url()
    await browser.close()
    return parse(url.split('?')[1]).code as string
  }

  throw new Error('fail to login')
}

describe('@openauth/naver ui test', () => {

  if (!USERNAME || !PASSWORD) {
    it.skip('skip', () => void 0)
    return
  }

  const oauth = new NaverOAuth({
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
      name: expect.any(String),
      raw: {
        id: expect.any(String),
        email: expect.any(String),
        name: expect.any(String),
      },
    })

    expect(authUser.id).toEqual(authUser.raw.id)
    expect(authUser.email).toEqual(authUser.raw.email)
    expect(authUser.name).toEqual(authUser.raw.name)
  }, 30000)
})
