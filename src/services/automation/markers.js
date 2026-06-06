// src/main/services/automation/markers.js
const { twitchApiService } = require("../twitch-api");
const { settingsService } = require("../settings");
const { logger } = require("../../utils/logger");

class MarkerHandler {
  constructor(loggerUtil) {
    this.markerTimer = null;
    this.loggerUtil = loggerUtil;
  }

  start(config, isLive, running) {
    if (!running || !isLive || !config.autoStreamMarkers) return;
    if (this.markerTimer) clearInterval(this.markerTimer);
    const intervalMs = config.markerIntervalMinutes * 60 * 1000;
    logger.info(`[Automation] Starting stream markers every ${config.markerIntervalMinutes} minutes`);
    this.markerTimer = setInterval(() => this.createMarker(), intervalMs);
  }

  stop() {
    if (this.markerTimer) {
      clearInterval(this.markerTimer);
      this.markerTimer = null;
      logger.info("[Automation] Stopped stream markers");
    }
  }

  async createMarker() {
    const broadcasterId = settingsService.get("twitch")?.userId;
    if (!broadcasterId) {
      logger.warn("[Automation] Cannot create stream marker: no broadcaster ID");
      return;
    }
    try {
      const description = `Auto marker (${new Date().toLocaleTimeString()})`;
      await twitchApiService.createStreamMarker(broadcasterId, description);
      logger.info(`[Automation] Stream marker created: "${description}"`);
      this.loggerUtil.logAction("stream_marker", "system", null, null, `Auto stream marker created: ${description}`);
    } catch (err) {
      logger.error("[Automation] Failed to create stream marker:", err);
    }
  }
}

module.exports = { MarkerHandler };