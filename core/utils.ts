export function getUnixTime(date: Date): number {
  return Math.floor(date.getTime() / 1000);
}

export function decodeBase64Url(str: string): Uint8Array<ArrayBuffer> {
  const binary = atob(str.replace(/-/g, "+").replace(/_/g, "/"));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export function encodeBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function decodePem(pem: string): Uint8Array<ArrayBuffer> {
  return decodeBase64Url(pem.replace(/-----[^-]+-----/g, "").replace(/\s+/g, ""));
}

export interface JwtHeader {
  alg: "ES256";
  kid: string;
}

export interface JwtPayload {
  iss?: string;
  iat?: number;
  exp?: number;
  aud?: string;
  sub?: string;
}

export async function createJwt(header: JwtHeader, payload: JwtPayload, key: CryptoKey) {
  const encoder = new TextEncoder();
  const signingBody = `${encodeBase64Url(encoder.encode(JSON.stringify(header)))}.${
    encodeBase64Url(encoder.encode(JSON.stringify(payload)))
  }`;
  const signature = await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, key, encoder.encode(signingBody));
  return `${signingBody}.${encodeBase64Url(new Uint8Array(signature))}`;
}
