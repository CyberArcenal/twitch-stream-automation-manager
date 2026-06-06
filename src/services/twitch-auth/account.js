// src/main/services/twitch-auth/account.js
const { settingsService } = require("../settings");
const { BrowserWindow } = require("electron");
const { logger } = require("../../utils/logger");

class AccountManager {
  constructor(tokenManager) {
    this.tokenManager = tokenManager;
    this.refreshTimer = null;
  }

  getAccounts() {
    const accounts = settingsService.getAccounts();
    return Object.values(accounts).map((acc) => ({
      userId: acc.userId,
      login: acc.login,
      displayName: acc.userData?.display_name || acc.login,
      profileImage: acc.userData?.profile_image_url || null,
      isActive: acc.userId === settingsService.getActiveAccountId(),
    }));
  }

  getActiveAccount() {
    return settingsService.getActiveAccount();
  }

  getAccessToken() {
    return settingsService.twitch.accessToken;
  }

  getRefreshToken() {
    return settingsService.twitch.refreshToken;
  }

  isLoggedIn() {
    return !!settingsService.twitch.accessToken;
  }

  async logoutAccount(userId) {
    const account = settingsService.getAccounts()[userId];
    if (account) {
      await this.tokenManager.revokeToken(account.accessToken);
      await this.tokenManager.revokeToken(account.refreshToken);
      settingsService.removeAccount(userId);
    }
    return true;
  }

  async switchAccount(userId) {
    const account = settingsService.getAccounts()[userId];
    if (!account) throw new Error("Account not found");
    settingsService.setActiveAccount(userId);
    this.scheduleTokenRefresh(account.expiresIn || 3600);
    BrowserWindow.getAllWindows().forEach((win) => {
      if (!win.isDestroyed()) win.webContents.send("account:changed");
    });
    return true;
  }

  scheduleTokenRefresh(expiresInSeconds) {
    if (this.refreshTimer) clearTimeout(this.refreshTimer);
    const refreshMs = (expiresInSeconds - 300) * 1000;
    if (refreshMs <= 0) {
      logger.warn("[Auth] Token expires too soon, skipping refresh scheduling");
      return;
    }
    logger.debug(`[Auth] Scheduling token refresh in ${Math.round(refreshMs / 1000)} seconds`);
    this.refreshTimer = setTimeout(async () => {
      try {
        const storedRefreshToken = this.getRefreshToken();
        if (storedRefreshToken) {
          logger.info("[Auth] Auto‑refreshing token...");
          const { accessToken, refreshToken, expiresIn } = await this.tokenManager.refreshAccessToken(storedRefreshToken);
          const active = this.getActiveAccount();
          if (active) {
            settingsService.updateAccountToken(active.userId, {
              accessToken,
              refreshToken,
              expiresIn,
              obtainmentTimestamp: Date.now(),
            });
            logger.success("[Auth] Token refreshed successfully");
            this.scheduleTokenRefresh(expiresIn);
          }
        } else {
          logger.warn("[Auth] No stored refresh token – cannot auto‑refresh");
        }
      } catch (err) {
        logger.error("[Auth] Auto‑refresh failed", err);
        if (this.refreshTimer) clearTimeout(this.refreshTimer);
        this.refreshTimer = null;
        const active = this.getActiveAccount();
        if (active) await this.logoutAccount(active.userId);
      }
    }, refreshMs);
  }

  async refreshTokenIfNeeded() {
    const active = this.getActiveAccount();
    if (!active || !active.refreshToken) return false;
    try {
      const { accessToken, refreshToken, expiresIn } = await this.tokenManager.refreshAccessToken(active.refreshToken);
      settingsService.updateAccountToken(active.userId, {
        accessToken,
        refreshToken,
        expiresIn,
        obtainmentTimestamp: Date.now(),
      });
      this.scheduleTokenRefresh(expiresIn);
      return true;
    } catch (err) {
      logger.error("[Auth] Refresh failed, clearing account", err);
      await this.logoutAccount(active.userId);
      return false;
    }
  }
}

module.exports = { AccountManager };