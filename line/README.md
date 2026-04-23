# @openauth/line <a href="https://github.com/denostack"><img src="https://raw.githubusercontent.com/denostack/images/main/logo.svg" width="160" align="right" /></a>

LINE OAuth 2.0 client.

## Install

```bash
# Deno
deno add jsr:@denostack/openauth

# Node.js / Bun
npx jsr add @denostack/openauth
# or
npm install @openauth/line
```

## Usage

```ts
// Deno
import { LineOAuth } from "@denostack/openauth/line";

// Node.js / Bun
import { LineOAuth } from "@openauth/line";
```

```ts
const oauth = new LineOAuth({
  clientId: "your_client_id",
  clientSecret: "your_client_secret",
  redirectUri: "https://example.com/callback/line",
});

// 1. Generate the authorization URL and redirect the user
const url = await oauth.getAuthRequestUri({ state: "random_state" });

// 2. Exchange the authorization code for an access token
const token = await oauth.getAccessTokenResponse(code);

// 3. Fetch the user profile
const user = await oauth.getUserProfile(token.accessToken);
// => { id, name, picture, raw }
```

### Verify ID Token

LINE returns an `id_token` alongside the access token when the `openid` scope is requested (included in the default
scopes). You can verify it and extract the user profile without calling the userinfo endpoint:

```ts
const token = await oauth.getAccessTokenResponse(code);
const user = await oauth.getUserProfileFromIdToken(token.idToken!);
```

This verifies:

- **Signature** against LINE's JWKS (`https://api.line.me/oauth2/v2.1/certs`, ES256)
- **Issuer** matches `https://access.line.me`
- **Audience** matches your `clientId` (channel ID)
- **Expiration** (`exp`) is in the future

If any check fails, a `JwtVerifierError` is thrown.

If you have already validated the token elsewhere and just want to decode the payload, pass `withoutValidation`:

```ts
const user = await oauth.getUserProfileFromIdToken(token.idToken!, {
  withoutValidation: true,
});
```

### Custom Scopes

The default scopes are `openid profile`. You can override them in the constructor or per request:

```ts
// Set scopes in the constructor
const oauth = new LineOAuth({
  clientId: "your_client_id",
  clientSecret: "your_client_secret",
  redirectUri: "https://example.com/callback/line",
  scope: ["openid", "profile", "email"],
});

// Or override per request
const url = await oauth.getAuthRequestUri({
  state: "random_state",
  scope: ["openid", "profile", "email"],
});
```
