// services/auto-moderation/actions.js

const { streamManagerService } = require("../stream-manager");
const { logger } = require("../../utils/logger");
const { moderationLogService } = require("../moderation-log");
const { LogCategory } = require("../log");

class ModerationActions {
  constructor(settings) {
    this.settings = settings;
  }

  async takeAction(broadcasterId, userId, userName, messageId, violation) {
    const { reason, timeout } = violation;
    let actionTaken = false;

    try {
      // Delete message if enabled
      if (this.settings.autoDeleteMessage) {
        await streamManagerService.deleteMessage(
          broadcasterId,
          broadcasterId,
          messageId,
        );
        logger.info(
          `[AutoMod] Deleted message from ${userName} (reason: ${reason})`,
        );
        moderationLogService.addLog(
          "delete",
          broadcasterId,
          userId,
          userName,
          null,
          reason,
          LogCategory.AUTOMATION,
          `Auto-mod deleted message from ${userName} (${reason})`,
        );
        actionTaken = true;
      }

      // Timeout user if enabled
      if (this.settings.autoTimeoutUser && timeout > 0) {
        await streamManagerService.timeoutUser(
          broadcasterId,
          broadcasterId,
          userName,
          timeout,
        );
        logger.info(
          `[AutoMod] Timed out ${userName} for ${timeout}s (reason: ${reason})`,
        );
        moderationLogService.addLog(
          "timeout",
          broadcasterId,
          userId,
          userName,
          timeout,
          reason,
          LogCategory.AUTOMATION,
          `Auto-mod timed out ${userName} for ${timeout}s (${reason})`,
        );
        actionTaken = true;
      }

      return { actionTaken, reason };
    } catch (err) {
      logger.error(`[AutoMod] Failed to take action against ${userName}:`, err);
      return { actionTaken: false, reason: null, error: err.message };
    }
  }
}

module.exports = { ModerationActions };
