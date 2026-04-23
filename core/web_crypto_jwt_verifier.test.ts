import { assertEquals, assertRejects } from "@std/assert";
import { beforeEach, describe, it } from "@std/testing/bdd";
import { assertSpyCalls, stub } from "@std/testing/mock";
import { JwtVerifierError } from "./jwt_verifier.ts";
import { type Jwks, WebCryptoJwtVerifier } from "./web_crypto_jwt_verifier.ts";

const JWKS_URI = "https://example.test/.well-known/jwks.json";
const KID = "test-key-1";

function encodeBase64Url(data: Uint8Array | string): string {
  const bytes = typeof data === "string" ? new TextEncoder().encode(data) : data;
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function generateRs256KeyPair(): Promise<CryptoKeyPair> {
  return await crypto.subtle.generateKey(
    {
      name: "RSASSA-PKCS1-v1_5",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["sign", "verify"],
  ) as CryptoKeyPair;
}

async function generateJwks(key: CryptoKey, kid: string): Promise<Jwks> {
  const jwk = await crypto.subtle.exportKey("jwk", key);
  return { keys: [{ ...jwk, kid }] };
}

async function signJwt(
  privateKey: CryptoKey,
  header: Record<string, unknown>,
  payload: Record<string, unknown>,
): Promise<string> {
  const encodedHeader = encodeBase64Url(JSON.stringify(header));
  const encodedPayload = encodeBase64Url(JSON.stringify(payload));
  const data = new TextEncoder().encode(`${encodedHeader}.${encodedPayload}`);
  const signature = await crypto.subtle.sign(
    { name: "RSASSA-PKCS1-v1_5" },
    privateKey,
    data,
  );
  const encodedSignature = encodeBase64Url(new Uint8Array(signature));
  return `${encodedHeader}.${encodedPayload}.${encodedSignature}`;
}

describe("WebCryptoJwtVerifier", () => {
  let keyPair: CryptoKeyPair;
  let jwks: Jwks;
  let verifier: WebCryptoJwtVerifier;

  beforeEach(async () => {
    keyPair = await generateRs256KeyPair();
    jwks = await generateJwks(keyPair.publicKey, KID);
    verifier = new WebCryptoJwtVerifier();
  });

  function stubFetch(jwksResponse: unknown = jwks, status = 200) {
    return stub(globalThis, "fetch", () =>
      Promise.resolve(
        {
          status,
          json: () => Promise.resolve(jwksResponse),
        } as Response,
      ));
  }

  async function makeToken(payload: Record<string, unknown> = {}, headerOverrides: Record<string, unknown> = {}) {
    return await signJwt(
      keyPair.privateKey,
      { alg: "RS256", typ: "JWT", kid: KID, ...headerOverrides },
      payload,
    );
  }

  describe("without options", () => {
    it("returns payload without verifying signature", async () => {
      const token = await makeToken({ sub: "12345", iss: "https://example.test" });
      const payload = await verifier.verify(token);
      assertEquals(payload.sub, "12345");
      assertEquals(payload.iss, "https://example.test");
    });

    it("throws when token format is invalid", async () => {
      await assertRejects(
        () => verifier.verify("invalid.token"),
        JwtVerifierError,
        "Invalid JWT format",
      );
    });
  });

  describe("options.jwksUri", () => {
    it("verifies a valid signature and returns payload", async () => {
      const token = await makeToken({ sub: "12345" });
      const fetchStub = stubFetch();
      try {
        const payload = await verifier.verify(token, { jwksUri: JWKS_URI });
        assertEquals(payload.sub, "12345");
        assertSpyCalls(fetchStub, 1);
      } finally {
        fetchStub.restore();
      }
    });

    it("throws when signature is tampered", async () => {
      const token = await makeToken({ sub: "12345" });
      const [h, p] = token.split(".");
      const tampered = `${h}.${p}.${encodeBase64Url(new Uint8Array(256))}`;
      const fetchStub = stubFetch();
      try {
        await assertRejects(
          () => verifier.verify(tampered, { jwksUri: JWKS_URI }),
          JwtVerifierError,
          "JWT signature verification failed",
        );
      } finally {
        fetchStub.restore();
      }
    });

    it("throws when header is missing kid", async () => {
      const token = await signJwt(
        keyPair.privateKey,
        { alg: "RS256", typ: "JWT" },
        { sub: "12345" },
      );
      const fetchStub = stubFetch();
      try {
        await assertRejects(
          () => verifier.verify(token, { jwksUri: JWKS_URI }),
          JwtVerifierError,
          "JWT header missing kid",
        );
      } finally {
        fetchStub.restore();
      }
    });

    it("throws when header is missing alg", async () => {
      const token = await signJwt(
        keyPair.privateKey,
        { typ: "JWT", kid: KID },
        { sub: "12345" },
      );
      const fetchStub = stubFetch();
      try {
        await assertRejects(
          () => verifier.verify(token, { jwksUri: JWKS_URI }),
          JwtVerifierError,
          "JWT header missing alg",
        );
      } finally {
        fetchStub.restore();
      }
    });

    it("throws when JWK is not found for given kid", async () => {
      const token = await makeToken({ sub: "12345" }, { kid: "unknown-kid" });
      const fetchStub = stubFetch();
      try {
        await assertRejects(
          () => verifier.verify(token, { jwksUri: JWKS_URI }),
          JwtVerifierError,
          "JWK not found for kid: unknown-kid",
        );
      } finally {
        fetchStub.restore();
      }
    });

    it("throws when algorithm is not supported", async () => {
      const token = await signJwt(
        keyPair.privateKey,
        { alg: "PS256", typ: "JWT", kid: KID },
        { sub: "12345" },
      );
      const fetchStub = stubFetch();
      try {
        await assertRejects(
          () => verifier.verify(token, { jwksUri: JWKS_URI }),
          JwtVerifierError,
          "Unsupported algorithm: PS256",
        );
      } finally {
        fetchStub.restore();
      }
    });

    it("throws when JWKS endpoint returns non-200 status", async () => {
      const token = await makeToken({ sub: "12345" });
      const fetchStub = stubFetch({}, 500);
      try {
        await assertRejects(
          () => verifier.verify(token, { jwksUri: JWKS_URI }),
          JwtVerifierError,
          "Failed to fetch JWKS: 500",
        );
      } finally {
        fetchStub.restore();
      }
    });

    it("caches JWKS between verifications", async () => {
      const token1 = await makeToken({ sub: "1" });
      const token2 = await makeToken({ sub: "2" });
      const fetchStub = stubFetch();
      try {
        await verifier.verify(token1, { jwksUri: JWKS_URI });
        await verifier.verify(token2, { jwksUri: JWKS_URI });
        assertSpyCalls(fetchStub, 1);
      } finally {
        fetchStub.restore();
      }
    });

    it("refetches JWKS when cached key does not match kid", async () => {
      const token1 = await makeToken({ sub: "1" });

      const newKeyPair = await generateRs256KeyPair();
      const newKid = "test-key-2";
      const originalJwks = await generateJwks(keyPair.publicKey, KID);
      const rotatedJwks = await generateJwks(newKeyPair.publicKey, newKid);

      let callCount = 0;
      const fetchStub = stub(globalThis, "fetch", () => {
        callCount++;
        return Promise.resolve(
          {
            status: 200,
            json: () => Promise.resolve(callCount === 1 ? originalJwks : rotatedJwks),
          } as Response,
        );
      });

      try {
        await verifier.verify(token1, { jwksUri: JWKS_URI });

        const token2 = await signJwt(
          newKeyPair.privateKey,
          { alg: "RS256", typ: "JWT", kid: newKid },
          { sub: "2" },
        );

        const payload = await verifier.verify(token2, { jwksUri: JWKS_URI });
        assertEquals(payload.sub, "2");
        assertSpyCalls(fetchStub, 2);
      } finally {
        fetchStub.restore();
      }
    });
  });

  describe("options.secret (HS256)", () => {
    const SECRET = "shared-client-secret";

    async function signHs256(payload: Record<string, unknown>, secret = SECRET): Promise<string> {
      const encodedHeader = encodeBase64Url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
      const encodedPayload = encodeBase64Url(JSON.stringify(payload));
      const key = await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(secret),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"],
      );
      const sig = await crypto.subtle.sign(
        { name: "HMAC" },
        key,
        new TextEncoder().encode(`${encodedHeader}.${encodedPayload}`),
      );
      return `${encodedHeader}.${encodedPayload}.${encodeBase64Url(new Uint8Array(sig))}`;
    }

    it("verifies a valid HS256 signature using secret", async () => {
      const token = await signHs256({ sub: "12345" });
      const payload = await verifier.verify(token, { secret: SECRET });
      assertEquals(payload.sub, "12345");
    });

    it("throws when HS256 signature is signed with a different secret", async () => {
      const token = await signHs256({ sub: "12345" }, "other-secret");
      await assertRejects(
        () => verifier.verify(token, { secret: SECRET }),
        JwtVerifierError,
        "JWT signature verification failed",
      );
    });

    it("does not require kid for HMAC tokens", async () => {
      const token = await signHs256({ sub: "12345" });
      // no jwksUri, no kid — should still verify via secret alone
      const payload = await verifier.verify(token, { secret: SECRET });
      assertEquals(payload.sub, "12345");
    });
  });

  describe("options.issuer", () => {
    it("passes when issuer matches", async () => {
      const token = await makeToken({ iss: "https://example.test" });
      const payload = await verifier.verify(token, { issuer: "https://example.test" });
      assertEquals(payload.iss, "https://example.test");
    });

    it("throws when issuer does not match", async () => {
      const token = await makeToken({ iss: "https://evil.test" });
      await assertRejects(
        () => verifier.verify(token, { issuer: "https://example.test" }),
        JwtVerifierError,
        "Invalid issuer: expected https://example.test, got https://evil.test",
      );
    });

    it("throws when issuer is missing from payload", async () => {
      const token = await makeToken({ sub: "12345" });
      await assertRejects(
        () => verifier.verify(token, { issuer: "https://example.test" }),
        JwtVerifierError,
        "Invalid issuer",
      );
    });
  });

  describe("options.audience", () => {
    it("passes when audience matches string aud", async () => {
      const token = await makeToken({ aud: "my-client-id" });
      const payload = await verifier.verify(token, { audience: "my-client-id" });
      assertEquals(payload.aud, "my-client-id");
    });

    it("passes when audience matches one of array aud", async () => {
      const token = await makeToken({ aud: ["other-client", "my-client-id"] });
      const payload = await verifier.verify(token, { audience: "my-client-id" });
      assertEquals(payload.aud, ["other-client", "my-client-id"]);
    });

    it("throws when audience does not match string aud", async () => {
      const token = await makeToken({ aud: "other-client" });
      await assertRejects(
        () => verifier.verify(token, { audience: "my-client-id" }),
        JwtVerifierError,
        "Invalid audience: expected my-client-id",
      );
    });

    it("throws when audience is not in array aud", async () => {
      const token = await makeToken({ aud: ["a", "b"] });
      await assertRejects(
        () => verifier.verify(token, { audience: "my-client-id" }),
        JwtVerifierError,
        "Invalid audience: expected my-client-id",
      );
    });
  });

  describe("options.now", () => {
    it("passes when now is before exp", async () => {
      const token = await makeToken({ exp: 2_000_000_000 });
      const payload = await verifier.verify(token, { now: new Date(1_000_000_000_000) });
      assertEquals(payload.exp, 2_000_000_000);
    });

    it("throws when now is after exp", async () => {
      const token = await makeToken({ exp: 1_000_000_000 });
      await assertRejects(
        () => verifier.verify(token, { now: new Date(2_000_000_000_000) }),
        JwtVerifierError,
        "JWT has expired",
      );
    });

    it("passes when exp is missing from payload", async () => {
      const token = await makeToken({ sub: "12345" });
      const payload = await verifier.verify(token, { now: new Date() });
      assertEquals(payload.sub, "12345");
    });
  });

  describe("combined options", () => {
    it("passes when all options are satisfied", async () => {
      const token = await makeToken({
        sub: "12345",
        iss: "https://example.test",
        aud: "my-client-id",
        exp: 2_000_000_000,
      });
      const fetchStub = stubFetch();
      try {
        const payload = await verifier.verify(token, {
          jwksUri: JWKS_URI,
          issuer: "https://example.test",
          audience: "my-client-id",
          now: new Date(1_000_000_000_000),
        });
        assertEquals(payload.sub, "12345");
      } finally {
        fetchStub.restore();
      }
    });
  });
});
