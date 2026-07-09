import {
  type AuthRequestUriOptions,
  OAuth20,
  type OAuth2Options,
  OAuthError,
  type OidcIdTokenClaims,
  type UserProfile,
} from "../core/mod.ts";
import { createJwt, decodePem, getUnixTime } from "../core/utils.ts";

export interface UserRawData extends OidcIdTokenClaims {
  at_hash?: string;
  is_private_email?: boolean;
  nonce_supported?: boolean;
}

export interface AppleOAuthOptions extends Omit<OAuth2Options, "clientSecret"> {
  teamId: string;
  keyId: string;
  /** Contents of the .p8 private key file downloaded from Apple Developer. (PKCS#8 PEM) */
  privateKey: string;
}

export class AppleOAuth extends OAuth20 {
  teamId: string;
  keyId: string;
  privateKey: string;

  #keyPromise: Promise<CryptoKey> | null = null;

  authRequestUri = "https://appleid.apple.com/auth/authorize";
  accessTokenRequestUri = "https://appleid.apple.com/auth/token";
  userProfileUri = "";

  override jwksUri = "https://appleid.apple.com/auth/keys";
  override jwtIssuer = "https://appleid.apple.com";

  override scopes = ["name", "email"];
  override scopeSeparator = " ";

  constructor({ teamId, keyId, privateKey, ...options }: AppleOAuthOptions) {
    super({
      ...options,
      clientSecret: () => this.#createClientSecret(),
    });
    this.teamId = teamId;
    this.keyId = keyId;
    this.privateKey = privateKey;
  }

  override getAuthRequestFields(options: AuthRequestUriOptions = {}): Record<string, string> {
    // Apple requires response_mode=form_post when the name or email scope is requested.
    return {
      ...super.getAuthRequestFields(options),
      response_mode: "form_post",
    };
  }

  mapDataToUserProfile(data: UserRawData): UserProfile {
    return this.mapOidcIdTokenClaimsToUserProfile(data);
  }

  override mapOidcIdTokenClaimsToUserProfile(data: OidcIdTokenClaims): UserProfile {
    const profile = super.mapOidcIdTokenClaimsToUserProfile(data);
    // Apple may send email_verified as the string "true" instead of a boolean.
    if ((data.email_verified as unknown) === "true") {
      profile.emailVerified = true;
    }
    return profile;
  }

  /** Apple has no user profile endpoint. Use {@linkcode getUserProfileFromIdToken} with the id_token instead. */
  override getUserProfile(_accessToken: string): Promise<UserProfile> {
    return Promise.reject(
      new OAuthError("Apple does not provide a user profile endpoint. Use getUserProfileFromIdToken instead."),
    );
  }

  async #createClientSecret(): Promise<string> {
    const now = getUnixTime(new Date());
    this.#keyPromise ??= crypto.subtle.importKey(
      "pkcs8",
      decodePem(this.privateKey),
      { name: "ECDSA", namedCurve: "P-256" },
      false,
      ["sign"],
    );
    const key = await this.#keyPromise;
    return createJwt({ alg: "ES256", "kid": this.keyId }, {
      iss: this.teamId,
      iat: now,
      exp: now + 300,
      aud: "https://appleid.apple.com",
      sub: this.options.clientId,
    }, key);
  }
}
