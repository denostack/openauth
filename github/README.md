# Open Auth - Github

<p align="left">
  <a href="https://npmcharts.com/compare/@openauth/github?minimal=true"><img alt="Downloads" src="https://img.shields.io/npm/dt/@openauth/github.svg?style=flat-square" /></a>
  <a href="https://www.npmjs.com/package/@openauth/github"><img alt="Version" src="https://img.shields.io/npm/v/@openauth/github.svg?style=flat-square" /></a>
  <img alt="License" src="https://img.shields.io/npm/l/@openauth/github.svg?style=flat-square" />
  <img alt="Typescript" src="https://img.shields.io/badge/language-Typescript-007acc.svg?style=flat-square" />
  <a href="https://david-dm.org/wan2land/openauth?path=packages/github"><img alt="dependencies Status" src="https://img.shields.io/david/wan2land/openauth.svg?style=flat-square&path=packages/github" /></a>
</p>

**@openauth/github** is an implementation of Github OAuth.

## Installation

```bash
npm i @openauth/github
```

## Usage

```typescript
import { GithubOAuth } from "@openauth/github";

const oauth = new GithubOAuth({
  clientId: "client_id",
  clientSecret: "client_secret",
  redirectUri: "https://wani.kr/auth/github/callback",
  scope: [
    "read:user",
    "user:email",
    "user:follow",
  ],
});

// 1. After getting auth request uri, connect.
const redirectUri = await oauth.getAuthRequestUri();

// 2. It redirects with the code, and replaces the access token with this code value.
const { accessToken } = await oauth.getAccessTokenResponse(code);

// 3. Get user profile.
await oauth.getAuthUser(accessToken);

// 4. Other API
await oauth.getClient(accessToken).get("user");
```
