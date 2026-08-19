# @openauth/atlassian <a href="https://github.com/denostack"><img src="https://raw.githubusercontent.com/denostack/images/main/logo.svg" width="160" align="right" /></a>

Atlassian OAuth 2.0 (3LO) client.

## Install

```bash
# Deno
deno add jsr:@denostack/openauth

# Node.js / Bun
npx jsr add @denostack/openauth
# or
npm install @openauth/atlassian
```

## Usage

```ts
// Deno
import { AtlassianOAuth } from "@denostack/openauth/atlassian";

// Node.js / Bun
import { AtlassianOAuth } from "@openauth/atlassian";
```

```ts
const oauth = new AtlassianOAuth({
  clientId: "your_client_id",
  clientSecret: "your_client_secret",
  redirectUri: "https://example.com/callback/atlassian",
});

// 1. Generate the authorization URL and redirect the user
const url = await oauth.getAuthRequestUri({ state: "random_state" });

// 2. Exchange the authorization code for an access token
const token = await oauth.getAccessTokenResponse(code);

// 3. Fetch the user profile
const user = await oauth.getUserProfile(token.accessToken);
// => { id, nickname, name, email, picture, zoneinfo, locale, raw }
```

> The authorization URL automatically includes the `audience=api.atlassian.com` and `prompt=consent` parameters required
> by Atlassian.

### Custom Scopes

The default scope is `read:me`. You can override it in the constructor or per request:

```ts
// Set scopes in the constructor
const oauth = new AtlassianOAuth({
  clientId: "your_client_id",
  clientSecret: "your_client_secret",
  redirectUri: "https://example.com/callback/atlassian",
  scope: ["read:me", "read:jira-user"],
});

// Or override per request
const url = await oauth.getAuthRequestUri({
  state: "random_state",
  scope: ["read:me", "read:jira-user", "offline_access"],
});
```
