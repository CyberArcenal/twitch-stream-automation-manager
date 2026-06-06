// src/main/services/automation/logger.js
const { settingsService } = require("../settings");
const { moderationLogService } = require("../moderation-log");
const { LogCategory } = require("../log");
const { logger } = require("../../utils/logger");

class Logger {
  logAction(action, targetUserName, duration = null, reason = null, customMessage = null) {
    const broadcasterId = settingsService.get("twitch")?.userId;
    if (!broadcasterId) {
      logger.warn("[Automation] Cannot log action: no broadcasterId");
      return;
    }
    moderationLogService.addLog(
      action,
      broadcasterId,
      null,
      targetUserName || "system",
      duration,
      reason,
      LogCategory.AUTOMATION,
      customMessage
    );
  }
}

module.exports = { Logger };