export class OAuthError extends Error {
  public type?: string;
  public extra?: Record<string, unknown>;

  constructor(message: string, type?: string, extra?: Record<string, unknown>) {
    super(message);
    this.name = "OAuthError";
    this.type = type;
    this.extra = extra;
  }
}
