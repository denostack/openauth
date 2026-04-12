# openauth <a href="https://github.com/denostack"><img src="https://raw.githubusercontent.com/denostack/images/main/logo.svg" width="160" align="right" /></a>

<p>
  <a href="https://github.com/denostack/openauth/actions"><img alt="Build" src="https://img.shields.io/github/actions/workflow/status/denostack/openauth/ci.yml?branch=main&logo=github&style=flat-square" /></a>
  <a href="https://codecov.io/gh/denostack/openauth"><img alt="Coverage" src="https://img.shields.io/codecov/c/gh/denostack/openauth?style=flat-square" /></a>
  <img alt="License" src="https://img.shields.io/npm/l/openauth.svg?style=flat-square" />
  <img alt="Language Typescript" src="https://img.shields.io/badge/language-Typescript-007acc.svg?style=flat-square" />
  <br />
  <a href="https://jsr.io/@denostack/openauth"><img alt="JSR version" src="https://jsr.io/badges/@denostack/openauth?style=flat-square" /></a>
</p>

Pure OAuth 2.0 for any JavaScript runtime.

No framework lock-in. No middleware. Just a clean 3-step OAuth flow that works on Deno, Node.js, and Bun.

## Usage

Every provider follows the same 3-step flow:

```ts
// 1. Generate the authorization URL and redirect the user
const url = await oauth.getAuthRequestUri({ state: "random_state" });

// 2. Exchange the authorization code for an access token
const token = await oauth.getAccessTokenResponse(code);

// 3. Fetch the user profile
const user = await oauth.getUserProfile(token.accessToken);
```

## Providers

| Provider | README                  |
| -------- | ----------------------- |
| Discord  | [discord/](./discord)   |
| Facebook | [facebook/](./facebook) |
| GitHub   | [github/](./github)     |
| GitLab   | [gitlab/](./gitlab)     |
| Google   | [google/](./google)     |
| Kakao    | [kakao/](./kakao)       |
| LINE     | [line/](./line)         |
| Naver    | [naver/](./naver)       |
