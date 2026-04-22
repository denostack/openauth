# @openauth/google <a href="https://github.com/denostack"><img src="https://raw.githubusercontent.com/denostack/images/main/logo.svg" width="160" align="right" /></a>

Google OAuth 2.0 client.

## Install

```bash
# Deno
deno add jsr:@denostack/openauth

# Node.js / Bun
npx jsr add @denostack/openauth
# or
npm install @openauth/google
```

## Usage

```ts
// Deno
import { GoogleOAuth } from "@denostack/openauth/google";

// Node.js / Bun
import { GoogleOAuth } from "@openauth/google";
```

```ts
const oauth = new GoogleOAuth({
  clientId: "your_client_id",
  clientSecret: "your_client_secret",
  redirectUri: "https://example.com/callback/google",
});

// 1. Generate the authorization URL and redirect the user
const url = await oauth.getAuthRequestUri({ state: "random_state" });

// 2. Exchange the authorization code for an access token
const token = await oauth.getAccessTokenResponse(code);

// 3. Fetch the user profile
const user = await oauth.getUserProfile(token.accessToken);
// => { id, name, email, picture, raw }
```

### Verify ID Token

When the `openid` scope is requested (the default), Google returns an `id_token` alongside the access token. You can
verify it and extract the user profile without calling the userinfo endpoint:

```ts
const token = await oauth.getAccessTokenResponse(code);
const user = await oauth.getUserProfileFromIdToken(token.idToken!);
// => { id, email, raw }
```

This verifies:

- **Signature** against Google's JWKS (`https://www.googleapis.com/oauth2/v3/certs`)
- **Issuer** matches `https://accounts.google.com`
- **Audience** matches your `clientId`
- **Expiration** (`exp`) is in the future

If any check fails, a `JwtVerifierError` is thrown.

If you have already validated the token elsewhere and just want to decode the payload, pass `withoutValidation`:

```ts
const user = await oauth.getUserProfileFromIdToken(token.idToken!, {
  withoutValidation: true,
});
```

### Custom Scopes

The default scope is `openid`. You can override it in the constructor or per request:

```ts
// Set scopes in the constructor
const oauth = new GoogleOAuth({
  clientId: "your_client_id",
  clientSecret: "your_client_secret",
  redirectUri: "https://example.com/callback/google",
  scope: ["openid", "email", "profile"],
});

// Or override per request
const url = await oauth.getAuthRequestUri({
  state: "random_state",
  scope: ["openid", "email", "profile"],
});
```
