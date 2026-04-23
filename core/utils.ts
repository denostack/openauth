export function getUnixTime(date: Date): number {
  return ~~(date.getTime() / 1000);
}

export function decodeBase64Url(str: string): Uint8Array<ArrayBuffer> {
  const binary = atob(str.replace(/-/g, "+").replace(/_/g, "/"));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}
