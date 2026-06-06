// src/main/services/twitch-auth/index.js
const { PkceHelper } = require("./pkce");
const { TokenManager } = require("./token");
const { AccountManager } = require("./account");
const { LoginHandler } = require("./login");
const { settingsService } = require("../settings");
const { logger } = require("../../utils/logger");

class TwitchAuthService {
  constructor() {
    this.pkce = new PkceHelper();
    this.tokenManager = new TokenManager();
    this.accountManager = new AccountManager(this.tokenManager);
    this.loginHandler = new LoginHandler(this.pkce, this.tokenManager, this.accountManager);
  }

  // PKCE methods
  generateCodeVerifier() {
    return this.pkce.generateCodeVerifier();
  }

  generateCodeChallenge(verifier) {
    return this.pkce.generateCodeChallenge(verifier);
  }

  // Token methods
  async exchangeCodeForTokens(code, codeVerifier) {
    return this.tokenManager.exchangeCodeForTokens(code, codeVerifier);
  }

  async refreshAccessToken(refreshToken) {
    return this.tokenManager.refreshAccessToken(refreshToken);
  }

  async revokeToken(token) {
    return this.tokenManager.revokeToken(token);
  }

  // Account methods
  getAccounts() {
    return this.accountManager.getAccounts();
  }

  getActiveAccount() {
    return this.accountManager.getActiveAccount();
  }

  getAccessToken() {
    return this.accountManager.getAccessToken();
  }

  getRefreshToken() {
    return this.accountManager.getRefreshToken();
  }

  isLoggedIn() {
    return this.accountManager.isLoggedIn();
  }

  async logoutAccount(userId) {
    return this.accountManager.logoutAccount(userId);
  }

  async switchAccount(userId) {
    return this.accountManager.switchAccount(userId);
  }

  scheduleTokenRefresh(expiresInSeconds) {
    this.accountManager.scheduleTokenRefresh(expiresInSeconds);
  }

  async refreshTokenIfNeeded() {
    return this.accountManager.refreshTokenIfNeeded();
  }

  // Login methods
  async login() {
    return this.loginHandler.login();
  }

  async loginNewAccount() {
    return this.loginHandler.loginNewAccount();
  }

  async getUserInfo(accessToken) {
    return this.loginHandler.getUserInfo(accessToken);
  }

  // Utility
  async checkTokenScopes(accessToken) {
    const url = "https://id.twitch.tv/oauth2/validate";
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const data = await res.json();
    const required = ["user:write:chat", "user:read:chat"];
    const missing = required.filter((s) => !data.scopes?.includes(s));
    if (missing.length) {
      logger.warn(`Token missing scopes: ${missing.join(", ")}`);
    }
  }

  async logout() {
    const activeId = settingsService.getActiveAccountId();
    if (activeId) await this.logoutAccount(activeId);
  }

  async revokeAllTokens() {
    const accessToken = this.getAccessToken();
    const refreshToken = this.getRefreshToken();
    if (accessToken) await this.revokeToken(accessToken);
    if (refreshToken) await this.revokeToken(refreshToken);
    await this.logout();
  }
}

// Singleton instance
const twitchAuthService = new TwitchAuthService();
module.exports = { twitchAuthService, TwitchAuthService };