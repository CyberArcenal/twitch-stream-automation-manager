// services/moderation-log/storage.js

const Store = require("electron-store");
const { logger } = require("../../utils/logger");

class ModerationLogStorage {
  constructor() {
    this.store = new Store({ name: "moderationLogs" });
  }

  getAll() {
    return this.store.get("logs", []);
  }

  save(logs) {
    this.store.set("logs", logs);
  }

  add(logEntry) {
    const logs = this.getAll();
    logs.unshift(logEntry);
    if (logs.length > 1000) logs.pop();
    this.save(logs);
    logger.debug(`[ModerationLogStorage] Added log ${logEntry.id}`);
    return logEntry;
  }

  update(updatedLog) {
    const logs = this.getAll();
    const index = logs.findIndex(l => l.id === updatedLog.id);
    if (index !== -1) {
      logs[index] = updatedLog;
      this.save(logs);
      return true;
    }
    return false;
  }

  clear() {
    this.store.delete("logs");
  }
}

module.exports = { ModerationLogStorage };