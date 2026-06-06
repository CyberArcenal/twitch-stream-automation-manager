// src/main/services/twitch-auth/login.js
const { BrowserWindow } = require("electron");
const {
  CLIENT_ID,
  REDIRECT_URI,
  SCOPES,
  API_BASE,
} = require("../../shared/config");
const { logger } = require("../../utils/logger");
const { settingsService } = require("../settings");

class LoginHandler {
  constructor(pkceHelper, tokenManager, accountManager) {
    this.pkce = pkceHelper;
    this.tokenManager = tokenManager;
    this.accountManager = accountManager;
  }

  async getUserInfo(accessToken) {
    logger.debug("[Auth] Fetching user info");
    const url = `${API_BASE}/users`;
    const headers = {
      Authorization: `Bearer ${accessToken}`,
      "Client-Id": CLIENT_ID,
    };
    const response = await fetch(url, { headers });
    const data = await response.json();
    if (!data.data || data.data.length === 0) {
      logger.error("[Auth] No user data received", data);
      throw new Error("No user data");
    }
    logger.debug("[Auth] User info fetched", {
      id: data.data[0].id,
      login: data.data[0].login,
    });
    return data.data[0];
  }

  async login() {
    logger.info("[Auth] Starting login flow");
    const codeVerifier = this.pkce.generateCodeVerifier();
    const codeChallenge = this.pkce.generateCodeChallenge(codeVerifier);

    const authWindow = new BrowserWindow({
      width: 800,
      height: 600,
      modal: true,
      webPreferences: { nodeIntegration: false },
      show: true,
    });
    logger.debug("[Auth] Auth window created");

    const authUrl = `https://id.twitch.tv/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=${encodeURIComponent(SCOPES)}&code_challenge_method=S256&code_challenge=${codeChallenge}&force_verify=true&prompt=consent`;

    let resolved = false;
    let rejectFunction = null;

    const cleanup = () => {
      if (authWindow && !authWindow.isDestroyed()) authWindow.close();
      resolved = true;
    };

    return new Promise((resolve, reject) => {
      rejectFunction = reject;

      const handleNavigation = (event, url) => {
        if (url.startsWith(REDIRECT_URI)) {
          event.preventDefault();
          logger.debug("[Auth] Redirect detected", { url });
          const urlObj = new URL(url);
          const code = urlObj.searchParams.get("code");
          if (code) {
            cleanup();
            logger.info("[Auth] Authorization code received");
            this.tokenManager.exchangeCodeForTokens(code, codeVerifier)
              .then(async ({ accessToken, refreshToken, expiresIn }) => {
                const user = await this.getUserInfo(accessToken);
                settingsService.addAccount(user.id, {
                  userId: user.id,
                  login: user.login,
                  accessToken,
                  refreshToken,
                  expiresIn,
                  obtainmentTimestamp: Date.now(),
                  scope: SCOPES,
                  userData: user,
                });
                this.accountManager.scheduleTokenRefresh(expiresIn);
                logger.success("[Auth] Login successful", {
                  userId: user.id,
                  login: user.login,
                });
                resolve({ accessToken, userId: user.id, login: user.login });
              })
              .catch((err) => {
                logger.error("[Auth] Login failed after exchange", err);
                reject(err);
              });
          } else {
            const error = urlObj.searchParams.get("error");
            logger.error("[Auth] No code in redirect", { error });
            reject(new Error(error || "Authorization failed"));
          }
        }
      };

      authWindow.webContents.on("will-navigate", handleNavigation);
      authWindow.webContents.on("will-redirect", handleNavigation);
      authWindow.webContents.on("did-fail-load", (event, errorCode, errorDesc, validatedURL) => {
        if (validatedURL && validatedURL.startsWith(REDIRECT_URI)) {
          event.preventDefault();
        } else if (validatedURL === authUrl && !resolved) {
          logger.error("[Auth] Failed to load auth URL", { errorCode, errorDesc });
          reject(new Error(`Failed to load Twitch auth page: ${errorDesc}`));
        }
      });
      authWindow.on("closed", () => {
        if (!resolved && rejectFunction) {
          logger.warn("[Auth] Auth window closed by user");
          rejectFunction(new Error("Auth window closed"));
        }
      });

      authWindow.loadURL(authUrl).catch((err) => {
        if (!resolved) {
          logger.error("[Auth] loadURL failed", err);
          reject(err);
        }
      });
    });
  }

  async loginNewAccount() {
    return await this.login();
  }
}

module.exports = { LoginHandler };