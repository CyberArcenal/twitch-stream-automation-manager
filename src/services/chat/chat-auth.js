const { RefreshingAuthProvider } = require("@twurple/auth");
const { settingsService } = require("../settings.service");
const { logger } = require("../../utils/logger");
const { CLIENT_ID, CLIENT_SECRET } = require("../../shared/config");

class ChatAuth {
  constructor() {
    this.authProvider = null;
  }

  async getAuthProvider() {
    if (this.authProvider) {
      logger.debug("[ChatAuth] Returning existing auth provider");
      return this.authProvider;
    }

    const twitchData = settingsService.get("twitch");
    if (!twitchData?.accessToken || !twitchData?.refreshToken || !twitchData?.userId) {
      logger.error("[ChatAuth] Missing Twitch tokens");
      throw new Error("No Twitch tokens found");
    }

    logger.info(`[ChatAuth] Creating auth provider for user ${twitchData.userId}`);

    const tokenStore = {
      getUserToken: async (userId) => {
        const data = settingsService.get("twitch");
        if (data && data.userId === userId) {
          let scopeString = data.scope || "chat:read chat:edit";
          if (Array.isArray(scopeString)) scopeString = scopeString.join(" ");
          return {
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
            expiresIn: data.expiresIn || 3600,
            obtainmentTimestamp: data.obtainmentTimestamp || Date.now(),
            scope: scopeString,
          };
        }
        return null;
      },
      setUserToken: async (userId, token) => {
        const existing = settingsService.get("twitch") || {};
        settingsService.setTwitchTokens(
          token.accessToken,
          token.refreshToken || existing.refreshToken || "",
          userId,
          existing.login || "",
          token.expiresIn,
          token.obtainmentTimestamp,
          token.scope || "chat:read chat:edit"
        );
        logger.info(`[ChatAuth] Token updated for ${userId}`);
      },
      removeUserToken: async (userId) => {
        logger.warn(`[ChatAuth] removeUserToken called for ${userId}`);
      },
    };

    this.authProvider = new RefreshingAuthProvider(
      { clientId: CLIENT_ID, clientSecret: CLIENT_SECRET },
      tokenStore
    );

    const tokenData = {
      accessToken: twitchData.accessToken,
      refreshToken: twitchData.refreshToken,
      expiresIn: twitchData.expiresIn || 3600,
      obtainmentTimestamp: twitchData.obtainmentTimestamp || Date.now(),
    };

    await this.authProvider.addUserForToken(tokenData, ["chat"]);
    logger.info("[ChatAuth] User added with 'chat' intent");

    this.authProvider.onRefresh(async (userId, newTokenData) => {
      if (userId === twitchData.userId) {
        logger.info(`[ChatAuth] Token refreshed for user ${userId}`);
        settingsService.setTwitchTokens(
          newTokenData.accessToken,
          newTokenData.refreshToken || twitchData.refreshToken,
          twitchData.userId,
          twitchData.login,
          newTokenData.expiresIn,
          newTokenData.obtainmentTimestamp,
          newTokenData.scope || "chat:read chat:edit"
        );
      }
    });

    this.authProvider.onRefreshFailure(async (userId, error) => {
      logger.error(`[ChatAuth] Token refresh failed for ${userId}:`, error);
    });

    return this.authProvider;
  }
}

module.exports = { ChatAuth };