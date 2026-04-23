import type { OidcIdTokenClaims } from "./oidc.ts";

export class JwtVerifierError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "JwtVerifierError";
  }
}

export interface JwtVerifyOptions {
  jwksUri?: string;
  secret?: string;
  now?: Date;
  issuer?: string;
  audience?: string;
}

export interface JwtVerifier {
  verify(token: string, options?: JwtVerifyOptions): Promise<OidcIdTokenClaims>;
}
