# @openauth/apple <a href="https://github.com/denostack"><img src="https://raw.githubusercontent.com/denostack/images/main/logo.svg" width="160" align="right" /></a>

Sign in with Apple OAuth 2.0 client.

## Install

```bash
# Deno
deno add jsr:@denostack/openauth

# Node.js / Bun
npx jsr add @denostack/openauth
# or
npm install @openauth/apple
```

## Usage

```ts
// Deno
import { AppleOAuth } from "@denostack/openauth/apple";

// Node.js / Bun
import { AppleOAuth } from "@openauth/apple";
```

Apple requires the client secret to be an ES256-signed JWT instead of a static string, so `AppleOAuth` takes your Team
ID, Key ID, and the contents of the `.p8` private key file (downloaded from Apple Developer) instead of a
`clientSecret`. A short-lived JWT (5 minutes) is signed automatically on each token request:

```ts
const oauth = new AppleOAuth({
  clientId: "com.example.app.sid", // Services ID
  teamId: "your_team_id",
  keyId: "your_key_id",
  privateKey: Deno.readTextFileSync("AuthKey_XXXXXXXXXX.p8"),
  redirectUri: "https://example.com/callback/apple",
});

// 1. Generate the authorization URL and redirect the user
const url = await oauth.getAuthRequestUri({ state: "random_state" });

// 2. Exchange the authorization code for an access token
const token = await oauth.getAccessTokenResponse(code);

// 3. Extract the user profile from the id_token
const user = await oauth.getUserProfileFromIdToken(token.idToken!);
// => { id, email, emailVerified, raw }
```

### User Profile

Apple does not provide a user profile endpoint, so `getUserProfile` is not available. Use `getUserProfileFromIdToken`
with the `id_token` returned from `getAccessTokenResponse`:

```ts
const token = await oauth.getAccessTokenResponse(code);
const user = await oauth.getUserProfileFromIdToken(token.idToken!);
```

This verifies:

- **Signature** against Apple's JWKS (`https://appleid.apple.com/auth/keys`, RS256)
- **Issuer** matches `https://appleid.apple.com`
- **Audience** matches your `clientId`
- **Expiration** (`exp`) is in the future

If any check fails, a `JwtVerifierError` is thrown.

> [!NOTE]
> The user's name is only included in the `user` form post parameter on the **first** authorization, not in the
> id_token. Persist it at that point if you need it.

### Custom Scopes

The default scopes are `name email`. Since Apple requires `response_mode=form_post` when requesting scopes, the
authorization response is delivered as a POST request to your `redirectUri`.

```ts
const oauth = new AppleOAuth({
  clientId: "com.example.app.sid",
  teamId: "your_team_id",
  keyId: "your_key_id",
  privateKey: Deno.readTextFileSync("AuthKey_XXXXXXXXXX.p8"),
  redirectUri: "https://example.com/callback/apple",
  scope: ["email"],
});
```
