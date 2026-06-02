// src/renderer/api/core/auth.ts
import type { BaseResponse } from "./common";

export interface AuthUser {
  accessToken: string;
  userId: string;
  login: string;
}

interface StoredAccount {
  userId: string;
  login: string;
  displayName: string;
  profileImage: string;
  isActive: boolean;
}

class AuthAPI {
  async login(): Promise<BaseResponse<AuthUser>> {
    return window.backendAPI.auth({ method: "login" });
  }

  async logout(): Promise<BaseResponse<void>> {
    return window.backendAPI.auth({ method: "logout" });
  }

  async isLoggedIn(): Promise<BaseResponse<boolean>> {
    return window.backendAPI.auth({ method: "isLoggedIn" });
  }

  async getAccessToken(): Promise<BaseResponse<string>> {
    return window.backendAPI.auth({ method: "getAccessToken" });
  }

  async refreshToken(): Promise<BaseResponse<boolean>> {
    return window.backendAPI.auth({ method: "refreshToken" });
  }

  async revokeAllTokens(): Promise<BaseResponse<void>> {
    return window.backendAPI.auth({ method: "revokeAllTokens" });
  }

  async getAccounts(): Promise<StoredAccount[]> {
    const result = await window.backendAPI.auth({ method: "getAccounts" });
    return result.data;
  }

  async switchAccount(userId: string): Promise<void> {
    await window.backendAPI.auth({
      method: "switchAccount",
      params: { userId },
    });
  }

  async loginNewAccount(): Promise<AuthUser> {
    return window.backendAPI.auth({ method: "loginNewAccount" });
  }

  async logoutAccount(userId: string): Promise<void> {
    await window.backendAPI.auth({
      method: "logoutAccount",
      params: { userId },
    });
  }
}

export const authAPI = new AuthAPI();
