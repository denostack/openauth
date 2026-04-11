import { type AuthUser, HttpClientError, OAuth20, OAuthError } from "../core/mod.ts";

export interface UserRawData {
  resultcode: "00";
  message: "success";
  response: {
    id: string;
    nickname?: string;
    profile_image?: string;
    email?: string;
    name?: string;
  };
}

export class NaverOAuth extends OAuth20 {
  override defaultScopes: string[] = ["openid"];

  apiBaseUri(): string {
    return "https://openapi.naver.com/v1";
  }

  authRequestUri(): string {
    return "https://nid.naver.com/oauth2.0/authorize";
  }

  accessTokenRequestUri(): string {
    return "https://nid.naver.com/oauth2.0/token";
  }

  override createErrorFromHttpClientError(e: HttpClientError) {
    if (e.status === 401) {
      const { message, ...extra } = e.data as { message: string };
      return new OAuthError(message, e.message, extra);
    }
    const { error_description: message, error: type, ...extra } = e.data as {
      error: string;
      error_description: string;
    };
    return new OAuthError(message || "Error occurred", type, extra);
  }

  async getAuthUser(accessToken: string): Promise<AuthUser> {
    try {
      const url = `${this.apiBaseUri()}/nid/me`;
      const res = await this.httpClient.request<UserRawData>(
        "GET",
        url,
        {},
        {
          authorization: `Bearer ${accessToken}`,
        },
      );
      return {
        id: res.data.response.id,
        ...(res.data.response.name && { name: res.data.response.name }),
        ...(res.data.response.profile_image && { avatar: res.data.response.profile_image }),
        ...(res.data.response.nickname && { nickname: res.data.response.nickname }),
        ...(res.data.response.email && { email: res.data.response.email }),
        raw: res.data.response,
      };
    } catch (e) {
      if (e instanceof HttpClientError) {
        throw this.createErrorFromHttpClientError(e);
      }
      throw e;
    }
  }
}
