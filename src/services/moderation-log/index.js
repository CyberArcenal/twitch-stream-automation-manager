// services/moderation-log/index.js

const { ModerationLogStorage } = require("./storage");
const { sendLog, LogCategory } = require("../log");
const { logger } = require("../../utils/logger");

class ModerationLogService {
  constructor() {
    this.storage = new ModerationLogStorage();
  }

  /**
   * Add a moderation log entry
   * @param {string} action - 'ban', 'timeout', 'unban', 'delete', 'clear'
   * @param {string} broadcasterId
   * @param {string} targetUserId
   * @param {string} targetUserName
   * @param {number|null} duration - for timeout
   * @param {string|null} reason
   * @param {string} category - 'automation' or 'moderation' (default 'moderation')
   * @param {string|null} customMessage - optional custom message
   * @returns {Object} logEntry
   */
  addLog(
    action,
    broadcasterId,
    targetUserId,
    targetUserName,
    duration = null,
    reason = null,
    category = LogCategory.MODERATION,
    customMessage = null
  ) {
    // Generate default message if not provided
    let message = customMessage;
    if (!message) {
      switch (action) {
        case "delete":
          message = `Message deleted from ${targetUserName}${reason ? ` (${reason})` : ""}`;
          break;
        case "timeout":
          message = `${targetUserName} timed out for ${duration}s${reason ? ` (${reason})` : ""}`;
          break;
        case "ban":
          message = `${targetUserName} banned${reason ? ` (${reason})` : ""}`;
          break;
        case "unban":
          message = `${targetUserName} unbanned`;
          break;
        case "clear":
          message = `Chat cleared by ${targetUserName}`;
          break;
        default:
          message = `${action} on ${targetUserName}`;
      }
    }

    const logEntry = {
      id: `${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      action,
      broadcasterId,
      targetUserId,
      targetUserName,
      duration,
      reason,
      category,           // 'automation' or 'moderation'
      message,
      timestamp: new Date().toISOString(),
      undone: false,
      undoneAt: null,
    };

    this.storage.add(logEntry);
    logger.info(`[ModerationLog] [${category.toUpperCase()}] ${message}`);

    // Send to renderer via central log service
    sendLog({
      category,
      message,
      type: action === "ban" ? "error" : action === "timeout" ? "warning" : "info",
      meta: {
        id: logEntry.id,
        action,
        targetUserName,
        duration,
        reason,
        undone: false,
      },
    });

    return logEntry;
  }

  markUndone(logId) {
    const logs = this.storage.getAll();
    const log = logs.find(l => l.id === logId);
    if (log && !log.undone) {
      log.undone = true;
      log.undoneAt = new Date().toISOString();
      this.storage.update(log);
      const undoMessage = `Undid ${log.action} on ${log.targetUserName}`;
      logger.info(`[ModerationLog] ${undoMessage}`);

      sendLog({
        category: log.category,
        message: undoMessage,
        type: "success",
        meta: {
          originalId: logId,
          action: log.action,
          targetUserName: log.targetUserName,
        },
      });
      return true;
    }
    return false;
  }

  getLogs(filter = {}) {
    let logs = this.storage.getAll();
    if (filter.targetUserName) {
      logs = logs.filter(l =>
        l.targetUserName.toLowerCase().includes(filter.targetUserName.toLowerCase())
      );
    }
    if (filter.action) {
      logs = logs.filter(l => l.action === filter.action);
    }
    if (filter.category) {
      logs = logs.filter(l => l.category === filter.category);
    }
    return logs;
  }

  getUserWarnings(userId) {
    return this.storage
      .getAll()
      .filter(l => l.targetUserId === userId && l.action === "timeout");
  }

  clearLogs() {
    this.storage.clear();
    logger.info("[ModerationLog] All logs cleared");
  }
}

// Singleton instance
const moderationLogService = new ModerationLogService();
module.exports = { moderationLogService, ModerationLogService };