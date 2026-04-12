# Open Auth - Facebook

<p align="left">
  <a href="https://npmcharts.com/compare/@openauth/facebook?minimal=true"><img alt="Downloads" src="https://img.shields.io/npm/dt/@openauth/facebook.svg?style=flat-square" /></a>
  <a href="https://www.npmjs.com/package/@openauth/facebook"><img alt="Version" src="https://img.shields.io/npm/v/@openauth/facebook.svg?style=flat-square" /></a>
  <img alt="License" src="https://img.shields.io/npm/l/@openauth/facebook.svg?style=flat-square" />
  <img alt="Typescript" src="https://img.shields.io/badge/language-Typescript-007acc.svg?style=flat-square" />
  <a href="https://david-dm.org/wan2land/openauth?path=packages/facebook"><img alt="dependencies Status" src="https://img.shields.io/david/wan2land/openauth.svg?style=flat-square&path=packages/facebook" /></a>
</p>

**@openauth/facebook** is an implementation of Facebook OAuth.

## Installation

```bash
npm i @openauth/facebook
```

## Usage

```typescript
import { FacebookOAuth } from "@openauth/facebook";

const oauth = new FacebookOAuth({
  clientId: "client_id",
  clientSecret: "client_secret",
  redirectUri: "https://wani.kr/auth/facebook/callback",
  scope: [
    "public_profile",
  ],
});
```

OAuth login link.

```typescript
oauth.getAuthRequestUri(); // print https://www.facebook.com/v7.0/dialog/oauth?response_type=code&client_id=client_id&redirect_uri=https%3A%2F%2Fwani.kr%2Fauth%2Ffacebook%2Fcallback&scope=public_profile
```

After logging in, you will be redirected to the `redirectUri` page with the `code` value.

```typescript
const code = "AQAO3q3...";

const response = await oauth.getAccessTokenResponse(code);
console.log(response); // { accessToken: 'EAAD...', tokenType: 'bearer', expiresIn: 5165353 }
```

Save `accessToken` and use it when requesting API.

```typescript
const user = await oauth.getUserProfile(response.accessToken);
console.log(user); // { id: '3000000', name: 'Changwan Jun' }
```
