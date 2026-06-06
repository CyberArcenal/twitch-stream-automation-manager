// src/main/services/chat-history.js
//@ts-check
const Store = require("electron-store");
const { logger } = require("../../utils/logger");
const { BrowserWindow } = require("electron");

class ChatHistoryService {
  constructor() {
    this.store = new Store({ name: "chatHistory" });
    this.maxMessagesPerChannel = 10000; // keep last 10k messages per channel
    this.retentionDays = 7; // delete messages older than 7 days
  }

  _sendToRenderers(channel, data) {
    try {
      const windows = BrowserWindow.getAllWindows();
      windows.forEach((win) => {
        if (!win.isDestroyed()) {
          win.webContents.send(channel, data);
        }
      });
    } catch (error) {
      // If running outside Electron (e.g., tests), ignore
      logger.warn(
        "Failed to send IPC event (maybe not in Electron):",
        // @ts-ignore
        error.message,
      );
    }
  }

  /**
   * Add a chat message to history
   * @param {string} channel - channel name (without #)
   * @param {string} user - username
   * @param {string} message - message text
   * @param {string} messageId - Twitch message ID
   * @param {Object} badges - badge info (optional)
   */
  addMessage(channel, user, message, messageId, badges = {}) {
    const key = `messages_${channel}`;
    let messages = this.store.get(key, []);
    const timestamp = new Date().toISOString();

    messages.unshift({
      id: messageId,
      user,
      message,
      badges,
      timestamp,
    });

    // Limit size
    if (messages.length > this.maxMessagesPerChannel) {
      messages = messages.slice(0, this.maxMessagesPerChannel);
    }

    // Auto-delete old messages based on retention (run occasionally)
    this._pruneOldMessages(messages, key);

    this.store.set(key, messages);
    logger.debug(`[ChatHistory] Added message from ${user} in #${channel}`);
  }

  _pruneOldMessages(messages, key) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - this.retentionDays);
    const filtered = messages.filter((m) => new Date(m.timestamp) >= cutoff);
    if (filtered.length !== messages.length) {
      this.store.set(key, filtered);
      logger.debug(
        `[ChatHistory] Pruned ${messages.length - filtered.length} old messages for ${key}`,
      );
    }
  }

  /**
   * Get chat messages for a channel within a time range
   * @param {string} channel - channel name
   * @param {Date} startDate - start of range
   * @param {Date} endDate - end of range
   * @returns {Array} messages
   */
  getMessagesInRange(channel, startDate, endDate) {
    const key = `messages_${channel}`;
    const messages = this.store.get(key, []);
    return messages.filter((m) => {
      const ts = new Date(m.timestamp);
      return ts >= startDate && ts <= endDate;
    });
  }

  getMessageById(messageId) {
    const allKeys = this.store.store;
    for (const key of Object.keys(allKeys)) {
      if (key.startsWith("messages_")) {
        const messages = this.store.get(key, []);
        const found = messages.find((msg) => msg.id === messageId);
        if (found) return found;
      }
    }
    return null;
  }

  /**
   * Get hourly message count for heatmap (grouped by hour)
   * @param {string} channel
   * @param {number} daysBack - e.g., 7
   * @returns {Object} - { [hour: string]: count }
   */
  getHourlyActivity(channel, daysBack = 7) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);
    const messages = this.getMessagesInRange(channel, startDate, endDate);

    const hourlyCounts = {};
    for (let i = 0; i < 24; i++) hourlyCounts[i] = 0;

    messages.forEach((msg) => {
      const hour = new Date(msg.timestamp).getHours();
      hourlyCounts[hour]++;
    });

    return hourlyCounts;
  }

  /**
   * Get daily message counts for line chart
   * @param {string} channel
   * @param {number} daysBack
   * @returns {Array<{date: string, count: number}>}
   */
  getDailyActivity(channel, daysBack = 30) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);
    const messages = this.getMessagesInRange(channel, startDate, endDate);

    const dailyMap = new Map();
    messages.forEach((msg) => {
      const date = new Date(msg.timestamp).toISOString().split("T")[0];
      dailyMap.set(date, (dailyMap.get(date) || 0) + 1);
    });

    // Fill missing dates with 0
    const result = [];
    for (
      let d = new Date(startDate);
      d <= endDate;
      d.setDate(d.getDate() + 1)
    ) {
      const dateStr = d.toISOString().split("T")[0];
      result.push({ date: dateStr, count: dailyMap.get(dateStr) || 0 });
    }
    return result;
  }

  clearChannelHistory(channel) {
    const key = `messages_${channel}`;
    this.store.delete(key);
    logger.info(`[ChatHistory] Cleared history for #${channel}`);
  }

  clearAllHistory() {
    const allKeys = this.store.store;
    Object.keys(allKeys).forEach((key) => {
      if (key.startsWith("messages_")) this.store.delete(key);
    });
    logger.info("[ChatHistory] Cleared all chat history");
  }
}

const chatHistoryService = new ChatHistoryService();
module.exports = { chatHistoryService, ChatHistoryService };
