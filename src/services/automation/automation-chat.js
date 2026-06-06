//@ts-check
const { chatSettingsService } = require("../chat-settings");
const { twitchChatService } = require("../chat");
const { settingsService } = require("../settings");
const { logger } = require("../../utils/logger");

class AutomationChatMonitor {
  constructor(config, actions) {
    this.config = config;
    this.actions = actions;
    this.messageCounts = new Map();
    this.slowModeTriggered = false;
    this.slowModeResetTimer = null;
    this.messageTimestamps = [];
    this.lastClipTime = 0;
  }

  reset() {
    this.messageCounts.clear();
    this.slowModeTriggered = false;
    if (this.slowModeResetTimer) clearTimeout(this.slowModeResetTimer);
    this.messageTimestamps = [];
    this.lastClipTime = 0;
  }

  handleChatMessage(channel, user, message, msg, currentChannel) {
    if (currentChannel && channel !== currentChannel) return;

    const autoSlowMode = this.config.get("autoSlowMode");
    if (!autoSlowMode) return;
    if (this.slowModeTriggered) {
      this.checkChatSpike(message);
      return;
    }

    this.detectSpam(channel, user, message, msg);
    this.checkChatSpike(message);
  }

  detectSpam(channel, user, message, msg) {
    const now = Date.now();
    const userId = msg.userInfo?.userId;
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
    logger.debug(
      `[AutomationChatMonitor] User ${user} message count: ${userData.count}/${this.config.get("slowModeSpamThreshold")}`,
    );

    if (userData.count >= this.config.get("slowModeSpamThreshold")) {
      this.triggerSlowMode();
      this.messageCounts.clear();
    }
  }

  async triggerSlowMode() {
    logger.info(
      `[AutomationChatMonitor] Spam detected, enabling slow mode for ${this.config.get("slowModeDuration")} seconds`,
    );
    this.slowModeTriggered = true;

    const broadcasterId = settingsService.get("twitch")?.userId;
    if (broadcasterId) {
      try {
        await chatSettingsService.setSlowMode(
          broadcasterId,
          broadcasterId,
          true,
          this.config.get("slowModeWaitTime"),
        );
        chatSettingsService.scheduleSlowModeDisable(
          broadcasterId,
          broadcasterId,
          this.config.get("slowModeDuration"),
        );
        this.slowModeResetTimer = setTimeout(() => {
          this.slowModeTriggered = false;
          this.slowModeResetTimer = null;
        }, this.config.get("slowModeDuration") * 1000);
      } catch (err) {
        logger.error("[AutomationChatMonitor] Failed to enable slow mode:", err);
      }
    }
  }

  checkChatSpike(message) {
    if (!this.config.get("autoClipOnChatSpike")) return;

    const now = Date.now();
    this.messageTimestamps.push(now);
    const oneMinuteAgo = now - 60 * 1000;
    this.messageTimestamps = this.messageTimestamps.filter(
      (ts) => ts > oneMinuteAgo,
    );
    const currentRate = this.messageTimestamps.length;

    const cooldownMs = this.config.get("chatSpikeCooldownMinutes") * 60 * 1000;
    if (
      currentRate >= this.config.get("chatSpikeThreshold") &&
      now - this.lastClipTime >= cooldownMs
    ) {
      logger.info(
        `[AutomationChatMonitor] Chat spike detected: ${currentRate} msgs/min. Creating clip.`,
      );
      this.lastClipTime = now;
      this.createClipOnSpike();
    }
  }

  async createClipOnSpike() {
    const clip = await this.actions.createClip();
    if (clip) {
      await this.actions.sendChatMessage(
        `📸 Clip created for the hype! ${clip.edit_url}`,
      );
      logger.info(
        `[AutomationChatMonitor] Auto-clip created due to chat spike. Clip: ${clip.id}`,
      );
    }
  }
}

module.exports = { AutomationChatMonitor };
