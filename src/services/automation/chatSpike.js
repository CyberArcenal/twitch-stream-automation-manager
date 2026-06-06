// src/main/services/automation/chatSpike.js
//@ts-check
const { streamManagerService } = require("../stream-manager");
const { settingsService } = require("../settings");
const { logger } = require("../../utils/logger");

class ChatSpikeHandler {
  constructor(loggerUtil) {
    this.messageTimestamps = [];
    this.lastClipTime = 0;
    this.loggerUtil = loggerUtil;
  }

  handleMessage(config, sendChatMessage) {
    if (!config.autoClipOnChatSpike) return false;

    const now = Date.now();
    this.messageTimestamps.push(now);
    const oneMinuteAgo = now - 60 * 1000;
    this.messageTimestamps = this.messageTimestamps.filter(ts => ts > oneMinuteAgo);
    const currentRate = this.messageTimestamps.length;
    const cooldownMs = config.chatSpikeCooldownMinutes * 60 * 1000;

    if (currentRate >= config.chatSpikeThreshold && now - this.lastClipTime >= cooldownMs) {
      logger.info(`[Automation] Chat spike detected: ${currentRate} msgs/min. Creating clip.`);
      this.lastClipTime = now;
      const broadcasterId = settingsService.get("twitch")?.userId;
      if (broadcasterId) {
        streamManagerService.createClip(broadcasterId)
          .then(clip => {
            sendChatMessage(`📸 Clip created for the hype! ${clip.edit_url}`);
            logger.info(`[Automation] Auto-clip created due to chat spike. Clip: ${clip.id}`);
            this.loggerUtil.logAction(
              "auto_clip",
              "system",
              null,
              `Chat spike: ${currentRate} msgs/min`,
              `Auto-clip created due to chat spike (${currentRate} msgs/min). Clip: ${clip.id}`
            );
          })
          .catch(err => logger.error("[Automation] Failed to create clip on chat spike:", err));
      }
      return true;
    }
    return false;
  }

  reset() {
    this.messageTimestamps = [];
    this.lastClipTime = 0;
  }
}

module.exports = { ChatSpikeHandler };