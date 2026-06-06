// src/main/services/pinned-messages.js
//@ts-check
const Store = require('electron-store');
const { logger } = require('../../utils/logger');
const { BrowserWindow } = require('electron');

class PinnedMessagesService {
  constructor() {
    this.store = new Store({ name: 'pinnedMessages' });
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
      logger.warn('Failed to send IPC event:', error.message);
    }
  }

  /**
   * Get all pinned messages for a channel
   * @param {string} channelName
   * @returns {Array}
   */
  getPinnedMessages(channelName) {
    const key = `pinned_${channelName}`;
    const messages = this.store.get(key, []);
    logger.debug(`[PinnedMessages] Retrieved ${messages.length} pinned messages for ${channelName}`);
    return messages;
  }

  /**
   * Pin a message
   * @param {string} channelName
   * @param {object} message - full message object (must have id)
   * @returns {boolean}
   */
  pinMessage(channelName, message) {
    const key = `pinned_${channelName}`;
    const current = this.store.get(key, []);
    if (current.some(m => m.id === message.id)) {
      logger.debug(`[PinnedMessages] Message ${message.id} already pinned, skipping`);
      return false;
    }
    const newPinned = [message, ...current];
    this.store.set(key, newPinned);
    logger.info(`[PinnedMessages] Pinned message ${message.id} in ${channelName}`);
    this._sendToRenderers('pinned:updated', { channelName, pinned: newPinned });
    return true;
  }

  /**
   * Unpin a message
   * @param {string} channelName
   * @param {string} messageId
   * @returns {boolean}
   */
  unpinMessage(channelName, messageId) {
    const key = `pinned_${channelName}`;
    const current = this.store.get(key, []);
    const filtered = current.filter(m => m.id !== messageId);
    if (filtered.length === current.length) return false;
    this.store.set(key, filtered);
    logger.info(`[PinnedMessages] Unpinned message ${messageId} from ${channelName}`);
    this._sendToRenderers('pinned:updated', { channelName, pinned: filtered });
    return true;
  }

  /**
   * Clear all pinned messages for a channel
   * @param {string} channelName
   */
  clearPinnedMessages(channelName) {
    const key = `pinned_${channelName}`;
    this.store.delete(key);
    logger.info(`[PinnedMessages] Cleared all pinned messages for ${channelName}`);
    this._sendToRenderers('pinned:updated', { channelName, pinned: [] });
  }
}

const pinnedMessagesService = new PinnedMessagesService();
module.exports = { pinnedMessagesService, PinnedMessagesService };