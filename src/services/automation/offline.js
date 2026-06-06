// src/main/services/automation/offline.js
const { streamManagerService } = require("../stream-manager");
const { settingsService } = require("../settings");
const { logger } = require("../../utils/logger");

class OfflineHandler {
  constructor(loggerUtil) {
    this.loggerUtil = loggerUtil;
  }

  async handleStreamOffline(data, config, running, offlineHandled, setOfflineHandled) {
    if (!running || offlineHandled) return;
    setOfflineHandled(true);
    const broadcasterId = data?.broadcasterId || settingsService.get("twitch")?.userId;
    if (!broadcasterId) return;

    if (config.autoRaid && config.raidTarget) {
      try {
        await streamManagerService.startRaid(broadcasterId, config.raidTarget);
        logger.info(`[Automation] Auto-raid to ${config.raidTarget} triggered`);
        this.loggerUtil.logAction(
          "auto_raid",
          config.raidTarget,
          null,
          "Stream ended",
          `Auto-raided to ${config.raidTarget} after stream offline`
        );
      } catch (err) {
        logger.error("[Automation] Auto-raid failed:", err);
      }
    }
    if (config.autoClip) {
      try {
        await streamManagerService.createClip(broadcasterId);
        logger.info("[Automation] Auto-clip triggered");
        this.loggerUtil.logAction(
          "auto_clip",
          "system",
          null,
          "Stream ended",
          "Auto-clip created at stream end"
        );
      } catch (err) {
        logger.error("[Automation] Auto-clip failed:", err);
      }
    }
  }
}

module.exports = { OfflineHandler };