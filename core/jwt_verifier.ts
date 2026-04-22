export class JwtVerifierError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "JwtVerifierError";
  }
}

export interface JwtVerifyOptions {
  jwksUri?: string;
  now?: Date;
  issuer?: string;
  audience?: string;
}

export interface JwtVerifier {
  verify(token: string, options?: JwtVerifyOptions): Promise<Record<string, unknown>>;
}
