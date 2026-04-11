# Open Auth - Naver

<p align="left">
  <a href="https://npmcharts.com/compare/@openauth/naver?minimal=true"><img alt="Downloads" src="https://img.shields.io/npm/dt/@openauth/naver.svg?style=flat-square" /></a>
  <a href="https://www.npmjs.com/package/@openauth/naver"><img alt="Version" src="https://img.shields.io/npm/v/@openauth/naver.svg?style=flat-square" /></a>
  <img alt="License" src="https://img.shields.io/npm/l/@openauth/naver.svg?style=flat-square" />
  <img alt="Typescript" src="https://img.shields.io/badge/language-Typescript-007acc.svg?style=flat-square" />
  <a href="https://david-dm.org/wan2land/openauth?path=packages/naver"><img alt="dependencies Status" src="https://img.shields.io/david/wan2land/openauth.svg?style=flat-square&path=packages/naver" /></a>
</p>

**@openauth/naver** is an implementation of Naver OAuth.

## Installation

```bash
npm i @openauth/naver
```

## Usage

```typescript
import { NaverOAuth } from "@openauth/naver";

const oauth = new NaverOAuth({
  clientId: "client_id",
  clientSecret: "client_secret",
  redirectUri: "https://wani.kr/auth/naver/callback",
});
```

OAuth login link.

```typescript
oauth.getAuthRequestUri(); // print https://nid.naver.com/oauth2.0/authorize?...
```

After logging in, you will be redirected to the `redirectUri` page with the `code` value.

```typescript
const code = "AQAO3q3...";

const response = await oauth.getAccessTokenResponse(code);
console.log(response); // { accessToken: '...', refreshToken: '...', tokenType: 'bearer', expiresIn: 3600 }
```

Save `accessToken` and use it when requesting API.

```typescript
const user = await oauth.getAuthUser(response.accessToken);
console.log(user); // { id: '3000000', email: '...', name: '...' }
```
