# openauth <a href="https://github.com/denostack"><img src="https://raw.githubusercontent.com/denostack/images/main/logo.svg" width="160" align="right" /></a>

<p>
  <a href="https://github.com/denostack/openauth/actions"><img alt="Build" src="https://img.shields.io/github/actions/workflow/status/denostack/openauth/ci.yml?branch=main&logo=github&style=flat-square" /></a>
  <a href="https://codecov.io/gh/denostack/openauth"><img alt="Coverage" src="https://img.shields.io/codecov/c/gh/denostack/openauth?style=flat-square" /></a>
  <img alt="License" src="https://img.shields.io/github/license/denostack/openauth?style=flat-square" />
  <img alt="Language Typescript" src="https://img.shields.io/badge/language-Typescript-007acc.svg?style=flat-square" />
  <br />
  <a href="https://jsr.io/@denostack/openauth"><img alt="JSR version" src="https://jsr.io/badges/@denostack/openauth?style=flat-square" /></a>
  <a href="https://www.npmjs.com/package/@openauth/core"><img alt="NPM Version" src="https://img.shields.io/npm/v/@openauth/core.svg?style=flat-square&logo=npm" /></a>
  <a href="https://npmcharts.com/compare/@openauth/core?minimal=true"><img alt="Downloads" src="https://img.shields.io/npm/dt/@openauth/core.svg?style=flat-square" /></a>
</p>

**OAuth without the framework.**

Minimal, typed OAuth 2.0 clients: authorization URL, code exchange, verified user profile - three calls, nothing more.
Sessions, storage, and UI stay yours.

- **Zero dependencies** - [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API) and `fetch`
  only. Runs on Deno, Node.js, and Bun.
- **Per-provider packages** - install `@openauth/google`, get Google. Nothing else.
- **OIDC done right** - `id_token` signature (JWKS), issuer, audience, and expiration verified out of the box.

## Not another auth framework

| If you want...                                     | Use               |
| -------------------------------------------------- | ----------------- |
| A hosted identity service                          | Auth0, Clerk      |
| A self-hosted auth server                          | OpenAuth (SST)    |
| Framework middleware with sessions                 | Auth.js, Passport |
| **Just the OAuth flow, verified profile included** | **openauth**      |

## Install

```bash
# Deno
deno add jsr:@denostack/openauth

# Node.js / Bun - one package per provider
npm install @openauth/google
```

## Usage

Every provider follows the same 3-step flow:

```ts
import { GoogleOAuth } from "@denostack/openauth/google"; // npm: @openauth/google

const oauth = new GoogleOAuth({
  clientId: "your_client_id",
  clientSecret: "your_client_secret",
  redirectUri: "https://example.com/callback/google",
});

// 1. Generate the authorization URL and redirect the user
const url = await oauth.getAuthRequestUri({ state: "random_state" });

// 2. Exchange the authorization code for an access token
const token = await oauth.getAccessTokenResponse(code);

// 3. Fetch the user profile
const user = await oauth.getUserProfile(token.accessToken);
// => { id, name, email, emailVerified, picture, ... , raw }
```

For OIDC providers (e.g. Google), you can skip the extra HTTP request and extract the profile directly from the
`id_token`:

```ts
const user = await oauth.getUserProfileFromIdToken(token.idToken);
```

The token's signature (via JWKS), issuer, audience, and expiration are all verified.

## Providers

| Provider                 |     OIDC      | Download                                                                                                                                                                           |
| ------------------------ | :-----------: | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Apple](./apple)         |       ✓       | <a href="https://npmcharts.com/compare/@openauth/apple?minimal=true"><img alt="Downloads" src="https://img.shields.io/npm/dt/@openauth/apple.svg?style=flat-square" /></a>         |
| [Atlassian](./atlassian) | not supported | <a href="https://npmcharts.com/compare/@openauth/atlassian?minimal=true"><img alt="Downloads" src="https://img.shields.io/npm/dt/@openauth/atlassian.svg?style=flat-square" /></a> |
| [Discord](./discord)     | not supported | <a href="https://npmcharts.com/compare/@openauth/discord?minimal=true"><img alt="Downloads" src="https://img.shields.io/npm/dt/@openauth/discord.svg?style=flat-square" /></a>     |
| [Facebook](./facebook)   |       ✓       | <a href="https://npmcharts.com/compare/@openauth/facebook?minimal=true"><img alt="Downloads" src="https://img.shields.io/npm/dt/@openauth/facebook.svg?style=flat-square" /></a>   |
| [Figma](./figma)         | not supported | <a href="https://npmcharts.com/compare/@openauth/figma?minimal=true"><img alt="Downloads" src="https://img.shields.io/npm/dt/@openauth/figma.svg?style=flat-square" /></a>         |
| [GitHub](./github)       | not supported | <a href="https://npmcharts.com/compare/@openauth/github?minimal=true"><img alt="Downloads" src="https://img.shields.io/npm/dt/@openauth/github.svg?style=flat-square" /></a>       |
| [GitLab](./gitlab)       |       ✓       | <a href="https://npmcharts.com/compare/@openauth/gitlab?minimal=true"><img alt="Downloads" src="https://img.shields.io/npm/dt/@openauth/gitlab.svg?style=flat-square" /></a>       |
| [Google](./google)       |       ✓       | <a href="https://npmcharts.com/compare/@openauth/google?minimal=true"><img alt="Downloads" src="https://img.shields.io/npm/dt/@openauth/google.svg?style=flat-square" /></a>       |
| [Kakao](./kakao)         |       ✓       | <a href="https://npmcharts.com/compare/@openauth/kakao?minimal=true"><img alt="Downloads" src="https://img.shields.io/npm/dt/@openauth/kakao.svg?style=flat-square" /></a>         |
| [LINE](./line)           |       ✓       | <a href="https://npmcharts.com/compare/@openauth/line?minimal=true"><img alt="Downloads" src="https://img.shields.io/npm/dt/@openauth/line.svg?style=flat-square" /></a>           |
| [LinkedIn](./linkedin)   |       ✓       | <a href="https://npmcharts.com/compare/@openauth/linkedin?minimal=true"><img alt="Downloads" src="https://img.shields.io/npm/dt/@openauth/linkedin.svg?style=flat-square" /></a>   |
| [Naver](./naver)         | not supported | <a href="https://npmcharts.com/compare/@openauth/naver?minimal=true"><img alt="Downloads" src="https://img.shields.io/npm/dt/@openauth/naver.svg?style=flat-square" /></a>         |
| [Slack](./slack)         |       ✓       | <a href="https://npmcharts.com/compare/@openauth/slack?minimal=true"><img alt="Downloads" src="https://img.shields.io/npm/dt/@openauth/slack.svg?style=flat-square" /></a>         |

Click a provider to see its detailed usage guide. The **OIDC** column marks providers that support
[`getUserProfileFromIdToken`](#usage) - verifying a signed `id_token` instead of calling the userinfo endpoint.

More providers are on the way - each one is verified against the real service before release.
