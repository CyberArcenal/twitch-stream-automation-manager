// src/main/ipc/core/twitch-auth/index.ipc.js (modified)
//@ts-check
const { ipcMain } = require("electron");
const { twitchAuthService } = require("../../../../services/twitch-auth");
const { logger } = require("../../../../utils/logger");

async function handleAuthRequest(event, payload) {
  const { method, params = {} } = payload;
  switch (method) {
    case "login": return await twitchAuthService.login();
    case "logout": return await twitchAuthService.logout();
    case "isLoggedIn": return twitchAuthService.isLoggedIn();
    case "getAccessToken": return twitchAuthService.getAccessToken();
    case "refreshToken": return await twitchAuthService.refreshTokenIfNeeded();
    case "revokeAllTokens": await twitchAuthService.revokeAllTokens(); return true;
    case "getAccounts": return twitchAuthService.getAccounts();
    case "switchAccount": return await twitchAuthService.switchAccount(params.userId);
    case "loginNewAccount": return await twitchAuthService.loginNewAccount();
    case "logoutAccount": return await twitchAuthService.logoutAccount(params.userId);
    default: throw new Error(`Unknown auth method: ${method}`);
  }
}

ipcMain.handle("twitch-auth", async (event, payload) => {
  try {
    logger.debug(`[IPC] request: ${JSON.stringify(event)} - ${JSON.stringify(payload)}`);
    const result = await handleAuthRequest(event, payload);
    return { status: true, message: "OK", data: result };
  } catch (err) {
    console.error("[IPC:auth]", err);
    return { status: false, message: err.message, data: null };
  }
});