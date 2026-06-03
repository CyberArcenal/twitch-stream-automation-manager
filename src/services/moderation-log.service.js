// src/main/services/moderation-log.service.js
//@ts-check
const Store = require("electron-store");
const { logger } = require("../utils/logger");
const { BrowserWindow } = require("electron");

class ModerationLogService {
  constructor() {
    this.store = new Store({ name: "moderationLogs" });
  }

  /**
   * Send event to all renderer windows
   * @param {string} channel
   * @param {any} data
   */
  _sendToRenderers(channel, data) {
    try {
      const windows = BrowserWindow.getAllWindows();
      windows.forEach((win) => {
        if (!win.isDestroyed()) {
          win.webContents.send(channel, data);
        }
      });
    } catch (error) {
      logger.warn(
        "Failed to send IPC event (maybe not in Electron):",
        error.message,
      );
    }
  }

  addLog(
    action,
    broadcasterId,
    targetUserId,
    targetUserName,
    duration = null,
    reason = null,
  ) {
    const logs = this.store.get("logs", []);
    const logEntry = {
      id: Date.now().toString(),
      action, // 'ban', 'timeout', 'unban'
      broadcasterId,
      targetUserId,
      targetUserName,
      duration,
      reason,
      timestamp: new Date().toISOString(),
      undone: false,
      undoneAt: null,
    };
    logs.unshift(logEntry);
    if (logs.length > 1000) logs.pop();
    this.store.set("logs", logs);
    logger.info(`[ModerationLog] ${action} on ${targetUserName}`);

    // Send to renderer for real‑time display
    this._sendToRenderers("automation:log", {
      id: logEntry.id,
      timestamp: logEntry.timestamp,
      message: `${action} on ${targetUserName}${reason ? ` (${reason})` : ""}`,
      type:
        action === "ban" ? "error" : action === "timeout" ? "warning" : "info",
    });

    return logEntry;
  }

  markUndone(logId) {
    const logs = this.store.get("logs", []);
    const log = logs.find((l) => l.id === logId);
    if (log) {
      log.undone = true;
      log.undoneAt = new Date().toISOString();
      this.store.set("logs", logs);
      logger.info(
        `[ModerationLog] Marked undone: ${log.action} on ${log.targetUserName}`,
      );
      // Send to renderer that this action was undone
      this._sendToRenderers("automation:log", {
        id: `${Date.now()}-undo`,
        timestamp: new Date().toISOString(),
        message: `Undid ${log.action} on ${log.targetUserName}`,
        type: "success",
      });
      return true;
    }
    return false;
  }

  getLogs(filter = {}) {
    let logs = this.store.get("logs", []);
    if (filter.targetUserName) {
      logs = logs.filter((l) =>
        l.targetUserName
          .toLowerCase()
          .includes(filter.targetUserName.toLowerCase()),
      );
    }
    if (filter.action) {
      logs = logs.filter((l) => l.action === filter.action);
    }
    return logs;
  }

  getUserWarnings(userId) {
    return this.store
      .get("logs", [])
      .filter((l) => l.targetUserId === userId && l.action === "timeout");
  }

  clearLogs() {
    this.store.delete("logs");
  }
}

const moderationLogService = new ModerationLogService();
module.exports = { moderationLogService, ModerationLogService };
