# Open Auth - Google

<p align="left">
  <a href="https://npmcharts.com/compare/@openauth/google?minimal=true"><img alt="Downloads" src="https://img.shields.io/npm/dt/@openauth/google.svg?style=flat-square" /></a>
  <a href="https://www.npmjs.com/package/@openauth/google"><img alt="Version" src="https://img.shields.io/npm/v/@openauth/google.svg?style=flat-square" /></a>
  <img alt="License" src="https://img.shields.io/npm/l/@openauth/google.svg?style=flat-square" />
  <img alt="Typescript" src="https://img.shields.io/badge/language-Typescript-007acc.svg?style=flat-square" />
  <a href="https://david-dm.org/wan2land/openauth?path=packages/google"><img alt="dependencies Status" src="https://img.shields.io/david/wan2land/openauth.svg?style=flat-square&path=packages/google" /></a>
</p>

**@openauth/google** is an implementation of Google OAuth.

## Installation

```bash
npm i @openauth/google
```

## Usage

```typescript
import { GoogleOAuth } from "@openauth/google";

const oauth = new GoogleOAuth({
  clientId: "client_id",
  clientSecret: "client_secret",
  redirectUri: "https://wani.kr/auth/google/callback",
  scope: [
    "email",
    "profile",
    "openid",
  ],
});

// 1. After getting auth request uri, connect.
const redirectUri = await oauth.getAuthRequestUri();

// 2. It redirects with the code, and replaces the access token with this code value.
const { accessToken } = await oauth.getAccessTokenResponse(code);

// 3. Get user profile.
await oauth.getAuthUser(accessToken);
/*
{
  id: "123456789",
  email: "wan2land@gmail.com",
  name: "Changwan Jun",
  avatar: "https://corgi.photos/200/200",
  raw: {
    sub: "123456789",
    name: "Changwan Jun",
    given_name: "Changwan",
    family_name: "Jun",
    picture: "https://corgi.photos/200/200",
    email: "wan2land@gmail.com",
    email_verified: true,
    locale: "ko",
    ...
  },
}
*/
```
