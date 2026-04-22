import { type JwtVerifier, JwtVerifierError, type JwtVerifyOptions } from "./jwt_verifier.ts";
import { decodeBase64Url, getUnixTime } from "./utils.ts";

const importAlgorithmParams: Record<string, RsaHashedImportParams | EcKeyImportParams> = {
  RS256: { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
  ES256: { name: "ECDSA", namedCurve: "P-256" },
};

const verifyAlgorithmParams: Record<string, AlgorithmIdentifier | RsaPssParams | EcdsaParams> = {
  RS256: { name: "RSASSA-PKCS1-v1_5" },
  ES256: { name: "ECDSA", hash: "SHA-256" },
};

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

  async verify(token: string, options: JwtVerifyOptions = {}): Promise<Record<string, unknown>> {
    const parts = token.split(".");
    if (parts.length !== 3) {
      throw new JwtVerifierError("Invalid JWT format");
    }

    // verify signature if jwksUri is provided
    if (options.jwksUri) {
      const header: JwtHeader = JSON.parse(decodeBase64Url(parts[0]));
      if (!header.kid || !header.alg) {
        throw new JwtVerifierError("JWT header missing kid or alg");
      }
      const cryptoKey = await this.#getCryptoKey(options.jwksUri, header.kid, header.alg);
      const data = new TextEncoder().encode(`${parts[0]}.${parts[1]}`);
      const signature = Uint8Array.from(decodeBase64Url(parts[2]), (c) => c.charCodeAt(0));

      const verifyParams = verifyAlgorithmParams[header.alg];
      if (!(await crypto.subtle.verify(verifyParams, cryptoKey, signature, data))) {
        throw new JwtVerifierError("JWT signature verification failed");
      }
    }

    const payload = JSON.parse(decodeBase64Url(parts[1]));
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

  async #getCryptoKey(jwksUri: string, kid: string, alg: string): Promise<CryptoKey> {
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
    const importParams = importAlgorithmParams[alg];
    if (!importParams) {
      throw new JwtVerifierError(`Unsupported algorithm: ${alg}`);
    }
    return crypto.subtle.importKey("jwk", jwk, importParams, false, ["verify"]);
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
