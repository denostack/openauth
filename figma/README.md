# @openauth/figma <a href="https://github.com/denostack"><img src="https://raw.githubusercontent.com/denostack/images/main/logo.svg" width="160" align="right" /></a>

Figma OAuth 2.0 client.

## Install

```bash
# Deno
deno add jsr:@denostack/openauth

# Node.js / Bun
npx jsr add @denostack/openauth
# or
npm install @openauth/figma
```

## Usage

```ts
// Deno
import { FigmaOAuth } from "@denostack/openauth/figma";

// Node.js / Bun
import { FigmaOAuth } from "@openauth/figma";
```

```ts
const oauth = new FigmaOAuth({
  clientId: "your_client_id",
  clientSecret: "your_client_secret",
  redirectUri: "https://example.com/callback/figma",
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

The default scope is `current_user:read`. You can override it in the constructor or per request:

```ts
// Set scopes in the constructor
const oauth = new FigmaOAuth({
  clientId: "your_client_id",
  clientSecret: "your_client_secret",
  redirectUri: "https://example.com/callback/figma",
  scope: ["current_user:read", "file_content:read"],
});

// Or override per request
const url = await oauth.getAuthRequestUri({
  state: "random_state",
  scope: ["current_user:read", "file_content:read", "file_comments:read"],
});
```
