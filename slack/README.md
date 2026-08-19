# @openauth/slack <a href="https://github.com/denostack"><img src="https://raw.githubusercontent.com/denostack/images/main/logo.svg" width="160" align="right" /></a>

Slack OAuth 2.0 client (Sign in with Slack, OpenID Connect).

## Install

```bash
# Deno
deno add jsr:@denostack/openauth

# Node.js / Bun
npx jsr add @denostack/openauth
# or
npm install @openauth/slack
```

## Usage

```ts
// Deno
import { SlackOAuth } from "@denostack/openauth/slack";

// Node.js / Bun
import { SlackOAuth } from "@openauth/slack";
```

```ts
const oauth = new SlackOAuth({
  clientId: "your_client_id",
  clientSecret: "your_client_secret",
  redirectUri: "https://example.com/callback/slack",
});

// 1. Generate the authorization URL and redirect the user
const url = await oauth.getAuthRequestUri({ state: "random_state" });

// 2. Exchange the authorization code for an access token
const token = await oauth.getAccessTokenResponse(code);

// 3. Fetch the user profile
const user = await oauth.getUserProfile(token.accessToken);
// => { id, name, email, picture, raw }
```

The raw profile also contains Slack-specific claims such as `https://slack.com/user_id` and `https://slack.com/team_id`.

### Verify ID Token

When the `openid` scope is requested (the default), Slack returns an `id_token` alongside the access token. You can
verify it and extract the user profile without calling the userinfo endpoint:

```ts
const token = await oauth.getAccessTokenResponse(code);
const user = await oauth.getUserProfileFromIdToken(token.idToken!);
// => { id, name, email, picture, raw }
```

This verifies:

- **Signature** against Slack's JWKS (`https://slack.com/openid/connect/keys`)
- **Issuer** matches `https://slack.com`
- **Audience** matches your `clientId`
- **Expiration** (`exp`) is in the future

If any check fails, a `JwtVerifierError` is thrown.

### Custom Scopes

The default scopes are `openid profile email`. You can override them in the constructor or per request:

```ts
// Set scopes in the constructor
const oauth = new SlackOAuth({
  clientId: "your_client_id",
  clientSecret: "your_client_secret",
  redirectUri: "https://example.com/callback/slack",
  scope: ["openid", "email"],
});

// Or override per request
const url = await oauth.getAuthRequestUri({
  state: "random_state",
  scope: ["openid", "profile", "email"],
});
```
