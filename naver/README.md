# @openauth/naver <a href="https://github.com/denostack"><img src="https://raw.githubusercontent.com/denostack/images/main/logo.svg" width="160" align="right" /></a>

Naver OAuth 2.0 client.

## Install

```bash
# Deno
deno add jsr:@denostack/openauth

# Node.js / Bun
npx jsr add @denostack/openauth
# or
npm install @openauth/naver
```

## Usage

```ts
// Deno
import { NaverOAuth } from "@denostack/openauth/naver";

// Node.js / Bun
import { NaverOAuth } from "@openauth/naver";
```

```ts
const oauth = new NaverOAuth({
  clientId: "your_client_id",
  clientSecret: "your_client_secret",
  redirectUri: "https://example.com/callback/naver",
});

// 1. Generate the authorization URL and redirect the user
const url = await oauth.getAuthRequestUri({ state: "random_state" });

// 2. Exchange the authorization code for an access token
const token = await oauth.getAccessTokenResponse(code);

// 3. Fetch the user profile
const user = await oauth.getUserProfile(token.accessToken);
// => { id, nickname, name, email, picture, raw }
```

### Custom Scopes

Naver does not use scopes to control access — all permissions are configured in the Naver Developers application
console. No scopes are requested by default.
