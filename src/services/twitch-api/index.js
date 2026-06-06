// src/main/services/twitch-api/index.js
const { TwitchApiClient } = require("./client");
const { createUsersModule } = require("./users");
const { createStreamsModule } = require("./streams");
const { createFollowsModule } = require("./follows");
const { createSearchModule } = require("./search");
const { createChatModule } = require("./chat");
const { createVideosModule } = require("./videos");
const { createBitsModule } = require("./bits");
const { createChannelModule } = require("./channel");
const { createGamesModule } = require("./games");
const { BrowserWindow } = require("electron");
const { settingsService } = require("../settings.service");
const { logger } = require("../../utils/logger");

class TwitchApiService {
  constructor() {
    this.client = new TwitchApiClient();

    // Attach modules
    const users = createUsersModule(this.client);
    const streams = createStreamsModule(this.client);
    const follows = createFollowsModule(this.client);
    const search = createSearchModule(this.client);
    const chat = createChatModule(this.client);
    const videos = createVideosModule(this.client);
    const bits = createBitsModule(this.client);
    const channel = createChannelModule(this.client);
    const games = createGamesModule(this.client);

    // Bind all methods to this instance (or just assign)
    Object.assign(this, users, streams, follows, search, chat, videos, bits, channel, games);

    // Keep a reference to fetchTwitch for any direct usage (though not needed externally)
    this.fetchTwitch = this.client.fetchTwitch.bind(this.client);
  }

  // Special method that was in the original (regenerateStreamKey)
  async regenerateStreamKey() {
    const userId = settingsService.get("twitch")?.userId;
    if (!userId) {
      logger.error("[TwitchApi] regenerateStreamKey - no userId");
      throw new Error("Not logged in");
    }

    logger.info(`[TwitchApi] regenerateStreamKey - opening dashboard for user ${userId}`);
    const dashboardUrl = "https://dashboard.twitch.tv/settings/stream";

    const keyWindow = new BrowserWindow({
      width: 1024,
      height: 768,
      parent: BrowserWindow.getFocusedWindow(),
      modal: false,
      show: true,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
      },
    });

    keyWindow.on("closed", () => {
      logger.info("[TwitchApi] regenerateStreamKey - dashboard window closed, notifying renderers to refresh live status");
      const windows = BrowserWindow.getAllWindows();
      windows.forEach((win) => {
        if (!win.isDestroyed()) {
          win.webContents.send("dashboard:closed", { action: "refresh_live_status" });
        }
      });
    });

    await keyWindow.loadURL(dashboardUrl);
    logger.info("[TwitchApi] regenerateStreamKey - dashboard window loaded");
    return {
      status: true,
      message: "Opened Twitch Dashboard. Please manually regenerate your stream key there.",
    };
  }
}

// Singleton instance
const twitchApiService = new TwitchApiService();
module.exports = { twitchApiService, TwitchApiService };