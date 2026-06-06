// src/main/services/automation/slowMode.js
const { chatSettingsService } = require("../chat-settings");
const { settingsService } = require("../settings");
const { logger } = require("../../utils/logger");

class SlowModeHandler {
  constructor(loggerUtil) {
    this.messageCounts = new Map();
    this.slowModeTriggered = false;
    this.slowModeResetTimer = null;
    this.loggerUtil = loggerUtil;
  }

  handleMessage(user, userId, config) {
    if (!config.autoSlowMode || this.slowModeTriggered) return false;

    const now = Date.now();
    const userKey = userId || user;
    let userData = this.messageCounts.get(userKey);
    if (!userData) {
      userData = { count: 0, resetTimer: null };
      this.messageCounts.set(userKey, userData);
    }

    if (userData.resetTimer && now > userData.resetTimer) {
      userData.count = 0;
      userData.resetTimer = null;
    }
    if (!userData.resetTimer) {
      userData.resetTimer = now + 60 * 1000;
    }
    userData.count++;
    logger.debug(`[Automation] User ${user} message count: ${userData.count}/${config.slowModeSpamThreshold}`);

    if (userData.count >= config.slowModeSpamThreshold) {
      logger.info(`[Automation] Spam detected from ${user}, enabling slow mode for ${config.slowModeDuration} seconds`);
      this.slowModeTriggered = true;
      const broadcasterId = settingsService.get("twitch")?.userId;
      if (broadcasterId) {
        chatSettingsService.setSlowMode(broadcasterId, broadcasterId, true, config.slowModeWaitTime)
          .catch(err => logger.error("[Automation] Failed to enable slow mode:", err));
        chatSettingsService.scheduleSlowModeDisable(broadcasterId, broadcasterId, config.slowModeDuration);
        this.slowModeResetTimer = setTimeout(() => {
          this.slowModeTriggered = false;
          this.slowModeResetTimer = null;
        }, config.slowModeDuration * 1000);
        this.loggerUtil.logAction(
          "slow_mode",
          user,
          config.slowModeDuration,
          `Spam detected (${userData.count} msgs/min)`,
          `Auto slow mode enabled for ${config.slowModeDuration}s due to spam from ${user}`
        );
      }
      this.messageCounts.clear();
      return true;
    }
    return false;
  }

  reset() {
    this.messageCounts.clear();
    if (this.slowModeResetTimer) clearTimeout(this.slowModeResetTimer);
    this.slowModeTriggered = false;
  }
}

module.exports = { SlowModeHandler };