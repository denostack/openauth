# Open Auth - Kakao

<p align="left">
  <a href="https://npmcharts.com/compare/@openauth/kakao?minimal=true"><img alt="Downloads" src="https://img.shields.io/npm/dt/@openauth/kakao.svg?style=flat-square" /></a>
  <a href="https://www.npmjs.com/package/@openauth/kakao"><img alt="Version" src="https://img.shields.io/npm/v/@openauth/kakao.svg?style=flat-square" /></a>
  <img alt="License" src="https://img.shields.io/npm/l/@openauth/kakao.svg?style=flat-square" />
  <img alt="Typescript" src="https://img.shields.io/badge/language-Typescript-007acc.svg?style=flat-square" />
  <a href="https://david-dm.org/wan2land/openauth?path=packages/kakao"><img alt="dependencies Status" src="https://img.shields.io/david/wan2land/openauth.svg?style=flat-square&path=packages/kakao" /></a>
</p>

**@openauth/kakao** is an implementation of Kakao OAuth.

## Installation

```bash
npm i @openauth/kakao
```

## Usage

```typescript
import { KakaoOAuth } from "@openauth/kakao";

const oauth = new KakaoOAuth({
  clientId: "client_id",
  clientSecret: "client_secret",
  redirectUri: "https://wani.kr/auth/kakao/callback",
});
```

OAuth login link.

```typescript
oauth.getAuthRequestUri(); // print https://kauth.kakao.com/oauth/authorize?...
```

After logging in, you will be redirected to the `redirectUri` page with the `code` value.

```typescript
const code = "AQAO3q3...";

const response = await oauth.getAccessTokenResponse(code);
console.log(response); // { accessToken: '...', refreshToken: '...', tokenType: 'bearer', expiresIn: 21599, refreshTokenExpiresIn: 5183999 }
```

Save `accessToken` and use it when requesting API.

```typescript
const user = await oauth.getAuthUser(response.accessToken);
console.log(user); // { id: '3000000', email: '...', nickname: '...' }
```
