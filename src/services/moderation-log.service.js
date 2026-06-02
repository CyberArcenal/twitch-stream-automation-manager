// src/main/services/moderation-log.service.js
const Store = require('electron-store');
const { logger } = require('../utils/logger');

class ModerationLogService {
  constructor() {
    this.store = new Store({ name: 'moderationLogs' });
  }

  addLog(action, broadcasterId, targetUserId, targetUserName, duration = null, reason = null) {
    const logs = this.store.get('logs', []);
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
    // keep last 1000 logs
    if (logs.length > 1000) logs.pop();
    this.store.set('logs', logs);
    logger.info(`[ModerationLog] ${action} on ${targetUserName}`);
    return logEntry;
  }

  markUndone(logId) {
    const logs = this.store.get('logs', []);
    const log = logs.find(l => l.id === logId);
    if (log) {
      log.undone = true;
      log.undoneAt = new Date().toISOString();
      this.store.set('logs', logs);
      return true;
    }
    return false;
  }

  getLogs(filter = {}) {
    let logs = this.store.get('logs', []);
    if (filter.targetUserName) {
      logs = logs.filter(l => l.targetUserName.toLowerCase().includes(filter.targetUserName.toLowerCase()));
    }
    if (filter.action) {
      logs = logs.filter(l => l.action === filter.action);
    }
    return logs;
  }

  getUserWarnings(userId) {
    return this.store.get('logs', []).filter(l => l.targetUserId === userId && l.action === 'timeout');
  }

  clearLogs() {
    this.store.delete('logs');
  }
}

const moderationLogService = new ModerationLogService();
module.exports = { moderationLogService, ModerationLogService };