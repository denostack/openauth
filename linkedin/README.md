# @openauth/linkedin <a href="https://github.com/denostack"><img src="https://raw.githubusercontent.com/denostack/images/main/logo.svg" width="160" align="right" /></a>

LinkedIn OAuth 2.0 client (Sign In with LinkedIn using OpenID Connect).

## Install

```bash
# Deno
deno add jsr:@denostack/openauth

# Node.js / Bun
npx jsr add @denostack/openauth
# or
npm install @openauth/linkedin
```

## Usage

```ts
// Deno
import { LinkedInOAuth } from "@denostack/openauth/linkedin";

// Node.js / Bun
import { LinkedInOAuth } from "@openauth/linkedin";
```

```ts
const oauth = new LinkedInOAuth({
  clientId: "your_client_id",
  clientSecret: "your_client_secret",
  redirectUri: "https://example.com/callback/linkedin",
});

// 1. Generate the authorization URL and redirect the user
const url = await oauth.getAuthRequestUri({ state: "random_state" });

// 2. Exchange the authorization code for an access token
//    (LinkedIn only accepts the client credentials in the request body, which is the default here)
const token = await oauth.getAccessTokenResponse(code);

// 3. Fetch the user profile
const user = await oauth.getUserProfile(token.accessToken);
// => { id, name, email, emailVerified, picture, locale, raw }
```

### Verify ID Token

When the `openid` scope is requested (the default), LinkedIn returns an `id_token` alongside the access token. You can
verify it and extract the user profile without calling the userinfo endpoint:

```ts
const token = await oauth.getAccessTokenResponse(code);
const user = await oauth.getUserProfileFromIdToken(token.idToken!);
// => { id, name, email, picture, raw }
```

This verifies:

- **Signature** against LinkedIn's JWKS (`https://www.linkedin.com/oauth/openid/jwks`, RS256)
- **Issuer** matches `https://www.linkedin.com/oauth`
- **Audience** matches your `clientId`
- **Expiration** (`exp`) is in the future

If any check fails, a `JwtVerifierError` is thrown.

If you have already validated the token elsewhere and just want to decode the payload, pass `verify: false`:

```ts
const user = await oauth.getUserProfileFromIdToken(token.idToken!, {
  verify: false,
});
```

### Custom Scopes

The default scopes are `openid profile email`. You can override them in the constructor or per request:

```ts
// Set scopes in the constructor
const oauth = new LinkedInOAuth({
  clientId: "your_client_id",
  clientSecret: "your_client_secret",
  redirectUri: "https://example.com/callback/linkedin",
  scope: ["openid", "profile"],
});

// Or override per request
const url = await oauth.getAuthRequestUri({
  state: "random_state",
  scope: ["openid", "profile", "email"],
});
```
