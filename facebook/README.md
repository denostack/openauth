# @openauth/facebook <a href="https://github.com/denostack"><img src="https://raw.githubusercontent.com/denostack/images/main/logo.svg" width="160" align="right" /></a>

Facebook OAuth 2.0 client.

## Install

```bash
# Deno
deno add jsr:@denostack/openauth

# Node.js / Bun
npx jsr add @denostack/openauth
# or
npm install @openauth/facebook
```

## Usage

```ts
// Deno
import { FacebookOAuth } from "@denostack/openauth/facebook";

// Node.js / Bun
import { FacebookOAuth } from "@openauth/facebook";
```

```ts
const oauth = new FacebookOAuth({
  clientId: "your_client_id",
  clientSecret: "your_client_secret",
  redirectUri: "https://example.com/callback/facebook",
  // version: "v25.0", // optional, defaults to "v25.0"
});

// 1. Generate the authorization URL and redirect the user
const url = await oauth.getAuthRequestUri({ state: "random_state" });

// 2. Exchange the authorization code for an access token
const token = await oauth.getAccessTokenResponse(code);

// 3. Fetch the user profile
const user = await oauth.getUserProfile(token.accessToken);
// => { id, name, email, picture, raw }
```

### Custom Scopes

The default scope is `email`. You can override it in the constructor or per request:

```ts
// Set scopes in the constructor
const oauth = new FacebookOAuth({
  clientId: "your_client_id",
  clientSecret: "your_client_secret",
  redirectUri: "https://example.com/callback/facebook",
  scope: ["email", "public_profile"],
});

// Or override per request
const url = await oauth.getAuthRequestUri({
  state: "random_state",
  scope: ["email", "public_profile", "user_friends"],
});
```
