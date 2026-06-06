// src/main/services/settings/preferences.js
const { getStore } = require("./store");
const { logger } = require("../../utils/logger");
const { BrowserWindow } = require("electron");

class PreferencesManager {
  constructor() {
    this.store = getStore();
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
      logger.warn("Failed to send IPC event:", error.message);
    }
  }

  getTheme() {
    return this.store.get("theme", "dark");
  }

  setTheme(theme) {
    this.store.set("theme", theme);
    this._sendToRenderers("theme:changed", { theme });
  }

  getLanguage() {
    return this.store.get("language", "en");
  }

  setLanguage(lang) {
    this.store.set("language", lang);
    this._sendToRenderers("settings:language-changed", { language: lang });
  }

  getNotificationPreferences() {
    return this.store.get("notificationPreferences");
  }

  updateNotificationPreferences(prefs) {
    const current = this.getNotificationPreferences();
    this.store.set("notificationPreferences", { ...current, ...prefs });
  }

  areNotificationsEnabled() {
    return this.store.get("notificationsEnabled", true);
  }

  setNotificationsEnabled(enabled) {
    this.store.set("notificationsEnabled", enabled);
  }

  getAutoPlay() {
    return this.store.get("autoPlay", true);
  }

  setAutoPlay(enabled) {
    this.store.set("autoPlay", enabled);
  }

  getChatFilters() {
    return this.store.get("chatFilters", []);
  }

  addChatFilter(word) {
    const filters = this.getChatFilters();
    const lowerWord = word.toLowerCase();
    if (!filters.includes(lowerWord)) {
      this.store.set("chatFilters", [...filters, lowerWord]);
      logger.debug(`[Settings] Added chat filter: "${word}"`);
    }
  }

  removeChatFilter(word) {
    const filters = this.getChatFilters();
    this.store.set(
      "chatFilters",
      filters.filter(f => f !== word.toLowerCase())
    );
    logger.debug(`[Settings] Removed chat filter: "${word}"`);
  }

  getChatDisplayDelay() {
    return this.store.get("chatDisplayDelay", 0);
  }

  setChatDisplayDelay(seconds) {
    this.store.set("chatDisplayDelay", seconds);
  }

  testNotification(type) {
    const titles = {
      stream_live: "Stream Live!",
      new_follower: "New Follower",
      subscription: "New Subscription",
      gift_sub: "Gift Subscription",
      raid: "Raid Incoming!",
      hype_train: "Hype Train Started!",
    };
    const messages = {
      stream_live: "A followed channel just went live!",
      new_follower: "Someone started following you!",
      subscription: "Thank you for subscribing!",
      gift_sub: "You received a gift subscription!",
      raid: "A raid is heading your way!",
      hype_train: "The hype train is rolling!",
    };
    this._sendToRenderers("notification:test", {
      type,
      title: titles[type],
      message: messages[type],
    });
    // Also show native notification
    const { notificationService } = require("../notification");
    notificationService.show(titles[type], messages[type]);
  }
}

module.exports = { PreferencesManager };