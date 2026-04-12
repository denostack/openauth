# @openauth/kakao <a href="https://github.com/denostack"><img src="https://raw.githubusercontent.com/denostack/images/main/logo.svg" width="160" align="right" /></a>

Kakao OAuth 2.0 client.

## Install

```bash
# Deno
deno add jsr:@denostack/openauth

# Node.js / Bun
npx jsr add @denostack/openauth
# or
npm install @openauth/kakao
```

## Usage

```ts
// Deno
import { KakaoOAuth } from "@denostack/openauth/kakao";

// Node.js / Bun
import { KakaoOAuth } from "@openauth/kakao";
```

```ts
const oauth = new KakaoOAuth({
  clientId: "your_client_id",
  clientSecret: "your_client_secret",
  redirectUri: "https://example.com/callback/kakao",
});

// 1. Generate the authorization URL and redirect the user
const url = await oauth.getAuthRequestUri({ state: "random_state" });

// 2. Exchange the authorization code for an access token
const token = await oauth.getAccessTokenResponse(code);

// 3. Fetch the user profile
const user = await oauth.getUserProfile(token.accessToken);
// => { id, nickname, picture, email, raw }
```

### Custom Scopes

No scopes are requested by default. You can add scopes in the constructor or per request:

```ts
// Set scopes in the constructor
const oauth = new KakaoOAuth({
  clientId: "your_client_id",
  clientSecret: "your_client_secret",
  redirectUri: "https://example.com/callback/kakao",
  scope: ["profile_nickname", "account_email"],
});

// Or override per request
const url = await oauth.getAuthRequestUri({
  state: "random_state",
  scope: ["profile_nickname", "profile_image", "account_email"],
});
```
