import {
  type AccessTokenResponse,
  type AccessTokenResponseOptions,
  type AuthUser,
  OAuth20,
} from "../core/oauth20.ts";
import { OAuthError } from "../core/oauth_error.ts";
import type { GetUserMeResponse } from "./interfaces.ts";

export class Kakao extends OAuth20 {
  apiBaseUri(): string {
    return "https://kapi.kakao.com/v2";
  }

  authRequestUri(): string {
    return "https://kauth.kakao.com/oauth/authorize";
  }

  accessTokenRequestUri(): string {
    return "https://kauth.kakao.com/oauth/token";
  }

  override mapDataToAccessTokenResponse(
    // deno-lint-ignore no-explicit-any
    body: Record<string, any>,
  ): AccessTokenResponse {
    return {
      accessToken: body.access_token,
      tokenType: body.token_type,
      expiresIn: body.expires_in,
      refreshToken: body.refresh_token,
      refreshTokenExpiresIn: body.refresh_token_expires_in,
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
        if (res.status >= 400) {
          const {
            error_description: description,
            error_code: errorCode,
            ...errorProps
          } = res.data;
          throw Object.assign(
            new OAuthError(description || "Error occurred"),
            { code: errorCode, ...errorProps },
          );
        }
        return res.data;
      },
    );
  }

  async getAuthUser(accessToken: string): Promise<AuthUser> {
    const url = `${this.apiBaseUri()}/user/me`;
    const res = await this.httpClient.request<GetUserMeResponse>(
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
      const {
        error_description: description,
        error_code: errorCode,
        ...errorProps
      } = data;
      throw Object.assign(
        new OAuthError(description || "Error occurred"),
        { code: errorCode, ...errorProps },
      );
    }
    const data = res.data;
    return {
      id: `${data.id}`,
      email: data.kakao_account?.email,
      nickname: data.properties?.nickname ??
        data.kakao_account?.profile?.nickname,
      avatar: data.properties?.profile_image ??
        data.kakao_account?.profile?.profile_image_url,
      raw: data,
    };
  }
}
