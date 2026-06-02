// src/main/services/analytics-collector.service.js
//@ts-check
const { twitchApiService } = require("./twitch-api.service");
const { followsService } = require("./follows.service");
const { clipsService } = require("./clips.service");
const { settingsService } = require("./settings.service");
const { logger } = require("../utils/logger");
const Store = require("electron-store");
const { BrowserWindow } = require("electron");

class AnalyticsCollectorService {
  constructor() {
    this.store = new Store({ name: "analytics" });
    this.intervalId = null;
    this.intervalMinutes = 15; // default: every 15 minutes
    this.mainWindow = null;
  }

  initialize(mainWindow) {
    this.mainWindow = mainWindow;
    logger.info("[AnalyticsCollector] Initialized");
  }

  _sendToRenderers(channel, data) {
    try {
      BrowserWindow.getAllWindows().forEach((win) => {
        if (!win.isDestroyed()) win.webContents.send(channel, data);
      });
    } catch (err) {
      logger.warn("[AnalyticsCollector] send error:", err);
    }
  }

  startCollecting(intervalMinutes = 15) {
    if (this.intervalId) clearInterval(this.intervalId);
    this.intervalMinutes = intervalMinutes;
    this.intervalId = setInterval(
      () => {
        this.collectSnapshot().catch((err) =>
          logger.error("[AnalyticsCollector] Snapshot failed:", err),
        );
      },
      intervalMinutes * 60 * 1000,
    );
    logger.info(
      `[AnalyticsCollector] Started collecting every ${intervalMinutes} minutes`,
    );
    // Take first snapshot immediately
    this.collectSnapshot().catch((err) =>
      logger.error("[AnalyticsCollector] Initial snapshot failed:", err),
    );
  }

  stopCollecting() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      logger.info("[AnalyticsCollector] Stopped collecting");
    }
  }

  async collectSnapshot() {
    const broadcasterId = settingsService.get("twitch")?.userId;
    if (!broadcasterId) {
      logger.warn("[AnalyticsCollector] No logged-in user, skipping snapshot");
      return null;
    }

    const timestamp = new Date().toISOString();
    let viewerCount = 0;
    let followerCount = 0;
    let topClips = [];

    try {
      // Get current stream info
      const streams = await twitchApiService.getStreams([broadcasterId]);
      if (streams.data && streams.data.length > 0) {
        viewerCount = streams.data[0].viewer_count;
      }

      // Get follower count
      const followers = await followsService.getFollowers(broadcasterId);
      followerCount = followers.total || followers.data?.length || 0;

      // Get top clips (last 7 days, by view count)
      const clipsResult = await clipsService.getTopClips(
        null,
        broadcasterId,
        "week",
        5,
      );
      topClips =
        clipsResult.data?.map((clip) => ({
          id: clip.id,
          title: clip.title,
          viewCount: clip.view_count,
          createdAt: clip.created_at,
          thumbnailUrl: clip.thumbnail_url,
        })) || [];
    } catch (err) {
      logger.error("[AnalyticsCollector] Error fetching data:", err);
    }

    const snapshot = {
      timestamp,
      viewerCount,
      followerCount,
      topClips,
    };

    // Save to store
    const history = this.store.get("snapshots", []);
    history.unshift(snapshot);
    // Keep only last 30 days of snapshots (approx 2880 snapshots if every 15min)
    const maxSnapshots = ((24 * 60) / this.intervalMinutes) * 30;
    if (history.length > maxSnapshots) history.length = maxSnapshots;
    this.store.set("snapshots", history);

    logger.debug(
      `[AnalyticsCollector] Snapshot saved: viewers=${viewerCount}, followers=${followerCount}`,
    );
    this._sendToRenderers("analytics:new-snapshot", snapshot);
    return snapshot;
  }

  getSnapshots(limit = 1000) {
    const snapshots = this.store.get("snapshots", []);
    return snapshots.slice(0, limit);
  }

  getFollowerHistory(days = 30) {
    const snapshots = this.getSnapshots();
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return snapshots
      .filter((s) => new Date(s.timestamp) >= cutoff)
      .map((s) => ({
        timestamp: s.timestamp,
        followers: s.followerCount,
      }));
  }

  getViewerHistory(days = 30) {
    const snapshots = this.getSnapshots();
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return snapshots
      .filter((s) => new Date(s.timestamp) >= cutoff)
      .map((s) => ({
        timestamp: s.timestamp,
        viewers: s.viewerCount,
      }));
  }

  clearHistory() {
    this.store.delete("snapshots");
    logger.info("[AnalyticsCollector] Cleared all analytics history");
  }
}

const analyticsCollector = new AnalyticsCollectorService();
module.exports = { analyticsCollector, AnalyticsCollectorService };
