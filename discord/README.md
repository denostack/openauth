# @openauth/discord <a href="https://github.com/denostack"><img src="https://raw.githubusercontent.com/denostack/images/main/logo.svg" width="160" align="right" /></a>

Discord OAuth 2.0 client.

## Install

```bash
# Deno
deno add jsr:@denostack/openauth

# Node.js / Bun
npx jsr add @denostack/openauth
# or
npm install @openauth/discord
```

## Usage

```ts
// Deno
import { DiscordOAuth } from "@denostack/openauth/discord";

// Node.js / Bun
import { DiscordOAuth } from "@openauth/discord";
```

```ts
const oauth = new DiscordOAuth({
  clientId: "your_client_id",
  clientSecret: "your_client_secret",
  redirectUri: "https://example.com/callback/discord",
});

// 1. Generate the authorization URL and redirect the user
const url = await oauth.getAuthRequestUri({ state: "random_state" });

// 2. Exchange the authorization code for an access token
const token = await oauth.getAccessTokenResponse(code);

// 3. Fetch the user profile
const user = await oauth.getUserProfile(token.accessToken);
// => { id, username, name, email, picture, raw }
```

### Custom Scopes

The default scope is `identify`. You can override it in the constructor or per request:

```ts
// Set scopes in the constructor
const oauth = new DiscordOAuth({
  clientId: "your_client_id",
  clientSecret: "your_client_secret",
  redirectUri: "https://example.com/callback/discord",
  scope: ["identify", "email"],
});

// Or override per request
const url = await oauth.getAuthRequestUri({
  state: "random_state",
  scope: ["identify", "email", "guilds"],
});
```
