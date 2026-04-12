# @openauth/github <a href="https://github.com/denostack"><img src="https://raw.githubusercontent.com/denostack/images/main/logo.svg" width="160" align="right" /></a>

GitHub OAuth 2.0 client.

## Install

```bash
# Deno
deno add jsr:@denostack/openauth

# Node.js / Bun
npx jsr add @denostack/openauth
# or
npm install @openauth/github
```

## Usage

```ts
// Deno
import { GithubOAuth } from "@denostack/openauth/github";

// Node.js / Bun
import { GithubOAuth } from "@openauth/github";
```

```ts
const oauth = new GithubOAuth({
  clientId: "your_client_id",
  clientSecret: "your_client_secret",
  redirectUri: "https://example.com/callback/github",
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

The default scope is `user:email`. You can override it in the constructor or per request:

```ts
// Set scopes in the constructor
const oauth = new GithubOAuth({
  clientId: "your_client_id",
  clientSecret: "your_client_secret",
  redirectUri: "https://example.com/callback/github",
  scope: ["user:email", "read:user"],
});

// Or override per request
const url = await oauth.getAuthRequestUri({
  state: "random_state",
  scope: ["user:email", "read:user", "repo"],
});
```
