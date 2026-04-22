export function getUnixTime(date: Date): number {
  return ~~(date.getTime() / 1000);
}

export function decodeBase64Url(str: string): string {
  return atob(str.replace(/-/g, "+").replace(/_/g, "/"));
}
