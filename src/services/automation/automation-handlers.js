//@ts-check
const { chatSettingsService } = require("../chat-settings");
const { settingsService } = require("../settings");
const { logger } = require("../../utils/logger");

class AutomationHandlers {
  constructor(config, actions) {
    this.config = config;
    this.actions = actions;
    this.isLive = false;
    this.offlineHandled = false;
    this.markerTimer = null;
  }

  resetOfflineFlag() {
    this.offlineHandled = false;
  }

  startMarkerTimer() {
    if (this.markerTimer) clearInterval(this.markerTimer);
    const intervalMs = this.config.get("markerIntervalMinutes") * 60 * 1000;
    logger.info(
      `[AutomationHandlers] Starting stream markers every ${this.config.get("markerIntervalMinutes")} minutes`,
    );
    this.markerTimer = setInterval(async () => {
      await this.actions.createStreamMarker();
    }, intervalMs);
  }

  stopMarkerTimer() {
    if (this.markerTimer) {
      clearInterval(this.markerTimer);
      this.markerTimer = null;
      logger.info("[AutomationHandlers] Stopped stream markers");
    }
  }

  async handleStreamOnline(data) {
    logger.debug("[AutomationHandlers] handleStreamOnline");
    this.isLive = true;
    if (this.config.get("autoStreamMarkers")) {
      this.startMarkerTimer();
    }
  }

  async handleStreamOffline(data) {
    logger.info(
      "[AutomationHandlers] handleStreamOffline, offlineHandled:",
      this.offlineHandled,
    );
    if (this.offlineHandled) return;
    this.offlineHandled = true;

    this.stopMarkerTimer();
    this.isLive = false;

    const broadcasterId =
      data?.broadcasterId || settingsService.get("twitch")?.userId;
    if (!broadcasterId) {
      logger.warn("[AutomationHandlers] No broadcaster ID for offline event");
      return;
    }

    if (this.config.get("autoRaid") && this.config.get("raidTarget")) {
      await this.actions.startRaid(this.config.get("raidTarget"));
      logger.info(
        `[AutomationHandlers] Auto-raid to ${this.config.get("raidTarget")} triggered`,
      );
    }

    if (this.config.get("autoClip")) {
      await this.actions.createClip();
      logger.info("[AutomationHandlers] Auto-clip triggered");
    }
  }

  async handleFollow(data) {
    if (this.config.get("autoMessage") && data?.followerName) {
      const msg = `@${data.followerName} ${this.config.get("autoMessageText")}`;
      await this.actions.sendChatMessage(msg);
    }
  }

  async handleSubscription(data) {
    if (this.config.get("autoMessage") && data?.userName) {
      const msg = `@${data.userName} ${this.config.get("autoMessageText")}`;
      await this.actions.sendChatMessage(msg);
    }
  }

  async handleRaid(data) {
    logger.debug("[AutomationHandlers] handleRaid triggered, data:", data);

    const broadcasterId = settingsService.get("twitch")?.userId;
    if (!broadcasterId) {
      logger.warn("[AutomationHandlers] handleRaid: no broadcasterId, skipping");
      return;
    }

    // Auto-follower mode
    if (this.config.get("autoFollowerMode")) {
      logger.info(
        `[AutomationHandlers] Raid detected, enabling follower mode for ${this.config.get("followerModeDuration")} minutes`,
      );
      try {
        await chatSettingsService.setFollowerMode(
          broadcasterId,
          broadcasterId,
          true,
          0,
        );
        chatSettingsService.scheduleFollowerModeDisable(
          broadcasterId,
          broadcasterId,
          this.config.get("followerModeDuration"),
        );
      } catch (err) {
        logger.error(
          "[AutomationHandlers] Failed to enable follower mode on raid:",
          err,
        );
      }
    }

    // Auto-shoutout on raid
    if (this.config.get("autoShoutoutOnRaid") && data?.fromBroadcasterName) {
      const fromName = data.fromBroadcasterName;
      let message = this.config.get("shoutoutMessage");
      message = message.replace(/\{fromBroadcasterName\}/g, fromName);
      await this.actions.sendChatMessage(message);
      logger.info(
        `[AutomationHandlers] Sent shoutout on raid from ${fromName}: "${message}"`,
      );
    }
  }
}

module.exports = { AutomationHandlers };
