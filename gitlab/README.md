# @openauth/gitlab <a href="https://github.com/denostack"><img src="https://raw.githubusercontent.com/denostack/images/main/logo.svg" width="160" align="right" /></a>

GitLab OAuth 2.0 client.

## Install

```bash
# Deno
deno add jsr:@denostack/openauth

# Node.js / Bun
npx jsr add @denostack/openauth
# or
npm install @openauth/gitlab
```

## Usage

```ts
// Deno
import { GitlabOAuth } from "@denostack/openauth/gitlab";

// Node.js / Bun
import { GitlabOAuth } from "@openauth/gitlab";
```

```ts
const oauth = new GitlabOAuth({
  clientId: "your_client_id",
  clientSecret: "your_client_secret",
  redirectUri: "https://example.com/callback/gitlab",
  // host: "https://gitlab.example.com", // optional, defaults to "https://gitlab.com"
});

// 1. Generate the authorization URL and redirect the user
const url = await oauth.getAuthRequestUri({ state: "random_state" });

// 2. Exchange the authorization code for an access token
const token = await oauth.getAccessTokenResponse(code);

// 3. Fetch the user profile
const user = await oauth.getUserProfile(token.accessToken);
// => { id, username, name, email, picture, raw }
```

### Verify ID Token

GitLab returns an `id_token` alongside the access token when the `openid` scope is requested. You can verify it and
extract the user profile without calling the userinfo endpoint:

```ts
const oauth = new GitlabOAuth({
  clientId: "your_client_id",
  clientSecret: "your_client_secret",
  redirectUri: "https://example.com/callback/gitlab",
  scope: ["openid", "profile", "email"],
});

const token = await oauth.getAccessTokenResponse(code);
const user = await oauth.getUserProfileFromIdToken(token.idToken!);
```

This verifies:

- **Signature** against GitLab's JWKS (`{host}/oauth/discovery/keys`)
- **Issuer** matches your GitLab `host` (`https://gitlab.com` by default)
- **Audience** matches your `clientId`
- **Expiration** (`exp`) is in the future

If any check fails, a `JwtVerifierError` is thrown.

> For self-hosted GitLab, the issuer and JWKS URI are derived from the `host` option you pass to the constructor.

If you have already validated the token elsewhere and just want to decode the payload, pass `withoutValidation`:

```ts
const user = await oauth.getUserProfileFromIdToken(token.idToken!, {
  withoutValidation: true,
});
```

### Custom Scopes

The default scope is `read_user`. You can override it in the constructor or per request:

```ts
// Set scopes in the constructor
const oauth = new GitlabOAuth({
  clientId: "your_client_id",
  clientSecret: "your_client_secret",
  redirectUri: "https://example.com/callback/gitlab",
  scope: ["read_user", "openid"],
});

// Or override per request
const url = await oauth.getAuthRequestUri({
  state: "random_state",
  scope: ["read_user", "openid", "profile"],
});
```
