import {
  type AccessTokenResponse,
  type AccessTokenResponseOptions,
  type AuthUser,
  OAuth20,
} from "../core/oauth20.ts";
import { OAuthError } from "../core/oauth_error.ts";
import type { NaverApiResult, NidMe } from "./api.ts";

export class Naver extends OAuth20 {
  apiBaseUri(): string {
    return "https://openapi.naver.com/v1";
  }

  authRequestUri(): string {
    return "https://nid.naver.com/oauth2.0/authorize";
  }

  accessTokenRequestUri(): string {
    return "https://nid.naver.com/oauth2.0/token";
  }

  override mapDataToAccessTokenResponse(
    // deno-lint-ignore no-explicit-any
    body: Record<string, any>,
  ): AccessTokenResponse {
    return {
      accessToken: body.access_token,
      tokenType: body.token_type,
      expiresIn: +body.expires_in,
      refreshToken: body.refresh_token,
    };
  }

  override requestAccessToken(
    code: string,
    options: AccessTokenResponseOptions = {},
    // deno-lint-ignore no-explicit-any
  ): Promise<Record<string, any>> {
    const url = new URL(this.accessTokenRequestUri());
    url.search = new URLSearchParams(
      this.getAccessTokenFields(code, options),
    ).toString();
    // deno-lint-ignore no-explicit-any
    return this.httpClient.request<Record<string, any>>("GET", url).then(
      (res) => {
        if (res.data.error) {
          const { error_description: description, ...errorProps } = res.data;
          throw Object.assign(
            new OAuthError(description || "Error occurred"),
            errorProps,
          );
        }
        if (res.status >= 400) {
          const { error_description: description, ...errorProps } = res.data;
          throw Object.assign(
            new OAuthError(description || "Error occurred"),
            errorProps,
          );
        }
        return res.data;
      },
    );
  }

  async getAuthUser(accessToken: string): Promise<AuthUser> {
    const url = `${this.apiBaseUri()}/nid/me`;
    const res = await this.httpClient.request<NaverApiResult<NidMe>>(
      "GET",
      url,
      {},
      {
        authorization: `Bearer ${accessToken}`,
      },
    );
    if (res.status >= 400) {
      // deno-lint-ignore no-explicit-any
      const data = res.data as any;
      const { error_description: description, ...errorProps } = data;
      throw Object.assign(
        new OAuthError(description || "Error occurred"),
        errorProps,
      );
    }
    const data = res.data.response;
    return {
      id: data.id,
      name: data.name,
      email: data.email,
      raw: data,
    };
  }
}
