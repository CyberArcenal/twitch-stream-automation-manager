// src/main/services/follows.service.js
//@ts-check
const { twitchApiService } = require("./twitch-api.service");
const { settingsService } = require("./settings.service");
const { BrowserWindow } = require("electron");
const { logger } = require("../utils/logger");
// @ts-ignore
const { twitchChatService } = require("./twitch-chat.service");

class FollowsService {
  constructor() {
    this.followsCache = null;
    this.cacheTimestamp = 0;
    this.CACHE_TTL = 5 * 60 * 1000; // 5 minutes
    this.mainWindow = null;
    logger.debug("[FollowsService] Constructor - instance created");
  }

  /**
   * @param {BrowserWindow | null} mainWindow
   */
  initialize(mainWindow) {
    this.mainWindow = mainWindow;
    logger.info("[FollowsService] Initialized");
  }

  /**
   * @param {string} channel
   * @param {{ action: string; broadcasterId: any; }} data
   */
 _sendToRenderers(channel, data) {
    try {
      const windows = BrowserWindow.getAllWindows();
      windows.forEach((win) => {
        if (!win.isDestroyed()) {
          win.webContents.send(channel, data);
        }
      });
    } catch (error) {
      // If running outside Electron (e.g., tests), ignore
      logger.warn(
        "Failed to send IPC event (maybe not in Electron):",
        // @ts-ignore
        error.message,
      );
    }
  }

  isCacheValid() {
    const valid =
      this.followsCache && Date.now() - this.cacheTimestamp < this.CACHE_TTL;
    logger.debug(`[FollowsService] isCacheValid: ${valid}`);
    return valid;
  }

  /**
   * @param {any} userId
   */
  async getFollowedChannels(userId, after = null, forceRefresh = false) {
    if (!userId) throw new Error("User ID is required");
    logger.info(
      `[FollowsService] getFollowedChannels called userId=${userId}, after=${after}, forceRefresh=${forceRefresh}`,
    );
    if (!forceRefresh && this.isCacheValid()) {
      logger.debug("[FollowsService] Returning cached follows");
      return this.followsCache;
    }

    const response = await twitchApiService.getFollowedChannels(userId, after);
    let allFollows = [...(response.data || [])];
    let cursor = response.pagination?.cursor;
    while (cursor) {
      logger.debug(`[FollowsService] Fetching next page with cursor ${cursor}`);
      const nextPage = await twitchApiService.getFollowedChannels(
        userId,
        cursor,
      );
      allFollows = allFollows.concat(nextPage.data || []);
      cursor = nextPage.pagination?.cursor;
    }

    const result = {
      data: allFollows,
      total: allFollows.length,
      timestamp: Date.now(),
    };
    this.followsCache = result;
    this.cacheTimestamp = Date.now();
    logger.info(
      `[FollowsService] getFollowedChannels - fetched ${allFollows.length} followed channels`,
    );
    return result;
  }

  /**
   * Get followers of a channel (users who follow the broadcaster)
   * @param {string} broadcasterId - The ID of the broadcaster whose followers to fetch
   * @param {string|null} after - Pagination cursor
   */
  async getFollowers(broadcasterId, after = null) {
    try {
      const params = new URLSearchParams({
        broadcaster_id: broadcasterId,
        first: "100",
      });
      if (after) params.append("after", after);
      const result = await twitchApiService.fetchTwitch(
        `channels/followers?${params}`,
      );
      return {
        data: result.data || [],
        pagination: result.pagination || {},
        total: result.total || 0,
      };
    } catch (err) {
      // @ts-ignore
      logger.error("[FollowsService] getFollowers error:", err.message);
      return { data: [], pagination: {}, total: 0 };
    }
  }

  /**
   * @param {any} broadcasterId
   */
  async followChannel(broadcasterId) {
    if (!broadcasterId) throw new Error("Broadcaster ID is required");
    logger.info(
      `[FollowsService] followChannel called for broadcasterId=${broadcasterId}`,
    );

    const userId = settingsService.get("twitch").userId;
    if (!userId) throw new Error("User not logged in");

    const body = { from_id: userId, to_id: broadcasterId };
    await twitchApiService.fetchTwitch("users/follows", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    // Invalidate cache
    this.followsCache = null;
    this.cacheTimestamp = 0;
    this._sendToRenderers("follows:changed", {
      action: "follow",
      broadcasterId,
    });
    logger.info(
      `[FollowsService] Successfully followed channel ${broadcasterId}`,
    );
    return true;
  }

  /**
   * @param {any} broadcasterId
   */
  async unfollowChannel(broadcasterId) {
    if (!broadcasterId) throw new Error("Broadcaster ID is required");
    logger.info(
      `[FollowsService] unfollowChannel called for broadcasterId=${broadcasterId}`,
    );

    const userId = settingsService.get("twitch").userId;
    if (!userId) throw new Error("User not logged in");

    const params = new URLSearchParams({
      from_id: userId,
      to_id: broadcasterId,
    });
    await twitchApiService.fetchTwitch(`users/follows?${params}`, {
      method: "DELETE",
    });

    // Invalidate cache
    this.followsCache = null;
    this.cacheTimestamp = 0;
    this._sendToRenderers("follows:changed", {
      action: "unfollow",
      broadcasterId,
    });
    logger.info(
      `[FollowsService] Successfully unfollowed channel ${broadcasterId}`,
    );
    return true;
  }

  /**
   * @param {any} broadcasterId
   */
  async isFollowing(broadcasterId) {
    if (!broadcasterId) return false;
    const userId = settingsService.get("twitch").userId;
    if (!userId) return false;

    try {
      const params = new URLSearchParams({
        from_id: userId,
        to_id: broadcasterId,
      });
      const result = await twitchApiService.fetchTwitch(
        `users/follows?${params}`,
      );
      const following = result.data && result.data.length > 0;
      logger.debug(
        `[FollowsService] isFollowing for ${broadcasterId}: ${following}`,
      );
      return following;
    } catch (err) {
      // @ts-ignore
      logger.warn(`[FollowsService] isFollowing error: ${err.message}`);
      return false;
    }
  }

  saveFollowsToLocalStorage() {
    if (this.followsCache && this.followsCache.data) {
      logger.debug("[FollowsService] Saving follows to localStorage");
      settingsService.set("cachedFollows", {
        data: this.followsCache.data,
        timestamp: this.followsCache.timestamp,
      });
    }
  }

  // src/main/services/follows.service.js
  /**
   * @param {any} broadcasterId
   * @param {any} userId
   */
  async getFollowDate(broadcasterId, userId) {
    try {
      const params = new URLSearchParams({
        broadcaster_id: broadcasterId,
        user_id: userId,
      });
      const result = await twitchApiService.fetchTwitch(
        `channels/followers?${params}`,
      );
      return result.data?.[0]?.followed_at || null;
    } catch (err) {
      // @ts-ignore
      logger.warn(`[FollowsService] getFollowDate error: ${err.message}`);
      return null;
    }
  }

  loadFollowsFromLocalStorage() {
    const cached = settingsService.get("cachedFollows");
    if (cached && cached.data && cached.timestamp) {
      this.followsCache = {
        data: cached.data,
        total: cached.data.length,
        timestamp: cached.timestamp,
      };
      this.cacheTimestamp = cached.timestamp;
      logger.debug(
        `[FollowsService] Loaded ${cached.data.length} follows from localStorage`,
      );
      return true;
    }
    logger.debug("[FollowsService] No cached follows found");
    return false;
  }

  clearCache() {
    logger.info("[FollowsService] Clearing follows cache");
    this.followsCache = null;
    this.cacheTimestamp = 0;
    settingsService.set("cachedFollows", null);
  }
}

const followsService = new FollowsService();
module.exports = { followsService, FollowsService };
