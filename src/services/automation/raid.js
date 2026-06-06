// src/main/services/automation/raid.js
const { chatSettingsService } = require("../chat-settings");
const { settingsService } = require("../settings");
const { logger } = require("../../utils/logger");

class RaidHandler {
  constructor(loggerUtil) {
    this.loggerUtil = loggerUtil;
  }

  async handleRaid(data, config, sendChatMessage) {
    const broadcasterId = settingsService.get("twitch")?.userId;
    if (!broadcasterId) return;

    if (config.autoFollowerMode) {
      logger.info(`[Automation] Raid detected, enabling follower mode for ${config.followerModeDuration} minutes`);
      try {
        await chatSettingsService.setFollowerMode(broadcasterId, broadcasterId, true, 0);
        chatSettingsService.scheduleFollowerModeDisable(broadcasterId, broadcasterId, config.followerModeDuration);
        this.loggerUtil.logAction(
          "follower_mode",
          "system",
          config.followerModeDuration * 60,
          `Auto-enabled follower mode after raid from ${data?.fromBroadcasterName || "unknown"}`,
          `Follower mode enabled for ${config.followerModeDuration} minutes (raid)`
        );
      } catch (err) {
        logger.error("[Automation] Failed to enable follower mode on raid:", err);
      }
    }

    if (config.autoShoutoutOnRaid && data?.fromBroadcasterName) {
      const fromName = data.fromBroadcasterName;
      let message = config.shoutoutMessage;
      message = message.replace(/\{fromBroadcasterName\}/g, fromName);
      await sendChatMessage(message);
      logger.info(`[Automation] Sent shoutout on raid from ${fromName}: "${message}"`);
      this.loggerUtil.logAction(
        "shoutout",
        fromName,
        null,
        "Raid shoutout sent",
        `Shoutout to ${fromName}: "${message}"`
      );
    }
  }
}

module.exports = { RaidHandler };