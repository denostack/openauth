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

### Verify ID Token

Facebook's standard web OAuth flow does **not** return an `id_token`. However, Facebook's
[Limited Login](https://developers.facebook.com/docs/facebook-login/limited-login/) (iOS/Android only) returns an
OIDC-compliant `id_token` that you can verify server-side:

```ts
// The idToken comes from the Facebook SDK on iOS/Android, not from oauth.getAccessTokenResponse()
const user = await oauth.getUserProfileFromIdToken(idToken);
```

This verifies:

- **Signature** against Facebook's JWKS (`https://www.facebook.com/.well-known/oauth/openid/jwks/`)
- **Issuer** matches `https://www.facebook.com`
- **Audience** matches your `clientId` (app ID)
- **Expiration** (`exp`) is in the future

If any check fails, a `JwtVerifierError` is thrown.

> This flow is meant for validating tokens obtained from the mobile Facebook SDK's Limited Login. Tokens from the
> standard web OAuth flow (`getAccessTokenResponse`) do not include an `id_token`.

If you have already validated the token elsewhere and just want to decode the payload, pass `withoutValidation`:

```ts
const user = await oauth.getUserProfileFromIdToken(idToken, {
  withoutValidation: true,
});
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
