import { type JwtVerifier, JwtVerifierError, type JwtVerifyOptions } from "./jwt_verifier.ts";
import { decodeBase64Url, getUnixTime } from "./utils.ts";
import type { OidcIdTokenClaims } from "./oidc.ts";

const textDecoder = new TextDecoder();

function decodeJwtPart<T>(str: string): T {
  return JSON.parse(textDecoder.decode(decodeBase64Url(str))) as T;
}

const importAlgorithmParams: Record<string, RsaHashedImportParams | EcKeyImportParams | HmacImportParams> = {
  RS256: { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
  ES256: { name: "ECDSA", namedCurve: "P-256" },
  HS256: { name: "HMAC", hash: "SHA-256" },
  HS384: { name: "HMAC", hash: "SHA-384" },
  HS512: { name: "HMAC", hash: "SHA-512" },
};

const verifyAlgorithmParams: Record<string, AlgorithmIdentifier | RsaPssParams | EcdsaParams> = {
  RS256: { name: "RSASSA-PKCS1-v1_5" },
  ES256: { name: "ECDSA", hash: "SHA-256" },
  HS256: { name: "HMAC" },
  HS384: { name: "HMAC" },
  HS512: { name: "HMAC" },
};

function isHmacAlg(alg: string): boolean {
  return alg === "HS256" || alg === "HS384" || alg === "HS512";
}

interface JwtHeader {
  typ?: string;
  kid?: string;
  alg?: string;
}

/** @internal */
export interface Jwks {
  keys: (JsonWebKey & { kid: string })[];
}

export class WebCryptoJwtVerifier implements JwtVerifier {
  #jwksStorage = new Map<string, { jwks: Jwks; expiry: number }>();

  async verify(token: string, options: JwtVerifyOptions = {}): Promise<OidcIdTokenClaims> {
    const parts = token.split(".");
    if (parts.length !== 3) {
      throw new JwtVerifierError("Invalid JWT format");
    }

    // verify signature if jwksUri or secret is provided
    if (options.jwksUri || options.secret) {
      const header = decodeJwtPart<JwtHeader>(parts[0]);
      if (!header.alg) {
        throw new JwtVerifierError("JWT header missing alg");
      }
      const verifyParams = verifyAlgorithmParams[header.alg];
      if (!verifyParams) {
        throw new JwtVerifierError(`Unsupported algorithm: ${header.alg}`);
      }
      const cryptoKey = isHmacAlg(header.alg)
        ? await this.#getHmacKey(header.alg, options.secret)
        : await this.#getJwksKey(header.alg, header.kid, options.jwksUri);
      const data = new TextEncoder().encode(`${parts[0]}.${parts[1]}`);
      const signature = decodeBase64Url(parts[2]);

      if (!(await crypto.subtle.verify(verifyParams, cryptoKey, signature, data))) {
        throw new JwtVerifierError("JWT signature verification failed");
      }
    }

    const payload = decodeJwtPart<OidcIdTokenClaims>(parts[1]);
    if (options.issuer && payload.iss !== options.issuer) {
      throw new JwtVerifierError(`Invalid issuer: expected ${options.issuer}, got ${payload.iss}`);
    }
    if (options.audience) {
      const aud = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
      if (!aud.includes(options.audience)) {
        throw new JwtVerifierError(`Invalid audience: expected ${options.audience}`);
      }
    }
    if (options.now && typeof payload.exp === "number" && payload.exp < getUnixTime(options.now)) {
      throw new JwtVerifierError("JWT has expired");
    }
    return payload;
  }

  #getHmacKey(alg: string, secret: string | undefined): Promise<CryptoKey> {
    if (!secret) {
      throw new JwtVerifierError(`${alg} requires a shared secret`);
    }
    return crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      importAlgorithmParams[alg],
      false,
      ["verify"],
    );
  }

  async #getJwksKey(alg: string, kid: string | undefined, jwksUri: string | undefined): Promise<CryptoKey> {
    if (!jwksUri) {
      throw new JwtVerifierError(`${alg} requires jwksUri`);
    }
    if (!kid) {
      throw new JwtVerifierError("JWT header missing kid");
    }
    const cached = this.#jwksStorage.get(jwksUri);
    let jwks: Jwks;
    if (!cached || cached.expiry < Date.now()) {
      this.#jwksStorage.delete(jwksUri);
      jwks = await this.#fetchJwks(jwksUri);
    } else {
      jwks = cached.jwks;
    }
    let jwk = jwks.keys.find((k) => k.kid === kid);
    if (!jwk) {
      jwks = await this.#fetchJwks(jwksUri);
      jwk = jwks.keys.find((k) => k.kid === kid);
    }
    if (!jwk) {
      throw new JwtVerifierError(`JWK not found for kid: ${kid}`);
    }
    return crypto.subtle.importKey("jwk", jwk, importAlgorithmParams[alg], false, ["verify"]);
  }

  async #fetchJwks(jwksUri: string): Promise<Jwks> {
    const response = await fetch(jwksUri);
    if (response.status !== 200) {
      throw new JwtVerifierError(`Failed to fetch JWKS: ${response.status}`);
    }
    const jwks: Jwks = await response.json();
    this.#jwksStorage.set(jwksUri, { jwks, expiry: Date.now() + 600_000 });
    return jwks;
  }
}
