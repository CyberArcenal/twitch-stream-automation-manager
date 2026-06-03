// src/main/services/settings.service.js
//@ts-check
const Store = require("electron-store");
const { logger } = require("../utils/logger");
const { BrowserWindow } = require("electron");

const defaults = {
  theme: "dark",
  language: "en",
  notificationsEnabled: true,
  notificationPreferences: {
    stream_live: true,
    new_follower: true,
    subscription: true,
    gift_sub: true,
    raid: true,
    hype_train: true,
  },
  autoPlay: true,
  chatFilters: [],
  accounts: {},
  twitch: {},
  activeAccountId: null,
};

class SettingsService {
  constructor() {
    this.store = new Store({ defaults });
    // @ts-ignore
    logger.debug("[SettingsService] Initialized with defaults", defaults);
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
      // If running outside Electron (e.g., tests), ignore
      logger.warn(
        "Failed to send IPC event (maybe not in Electron):",
        // @ts-ignore
        error.message,
      );
    }
  }

  _migrateOldAccount() {
    const oldTwitch = this.store.get("twitch");
    if (
      oldTwitch &&
      // @ts-ignore
      oldTwitch.userId &&
      // @ts-ignore
      !this.store.get("accounts")[oldTwitch.userId]
    ) {
      const {
        // @ts-ignore
        userId,
        // @ts-ignore
        login,
        // @ts-ignore
        accessToken,
        // @ts-ignore
        refreshToken,
        // @ts-ignore
        scope,
        // @ts-ignore
        expiresIn,
        // @ts-ignore
        obtainmentTimestamp,
      } = oldTwitch;
      this.store.set(`accounts.${userId}`, {
        userId,
        login,
        accessToken,
        refreshToken,
        scope,
        expiresIn,
        obtainmentTimestamp,
        userData: {
          id: userId,
          login,
          display_name: login,
          profile_image_url: null,
        },
      });
      this.store.set("activeAccountId", userId);
      this.store.delete("twitch");
      logger.info(
        "[SettingsService] Migrated old single account to multi-account format",
      );
    }
  }

  // Multi‑account helpers
  getAccounts() {
    return this.store.get("accounts", {});
  }

  getActiveAccountId() {
    return this.store.get("activeAccountId");
  }

  getActiveAccount() {
    const activeId = this.getActiveAccountId();
    const accounts = this.getAccounts();
    return activeId ? accounts[activeId] : null;
  }

  /**
   * @param {unknown} userId
   */
  setActiveAccount(userId) {
    this.store.set("activeAccountId", userId);
    logger.info(`[SettingsService] Active account switched to ${userId}`);
  }

  /**
   * @param {string | number} userId
   * @param {any} accountData
   */
  addAccount(userId, accountData) {
    const accounts = this.getAccounts();
    // @ts-ignore
    accounts[userId] = accountData;
    this.store.set("accounts", accounts);
    if (!this.getActiveAccountId()) this.setActiveAccount(userId);
    logger.info(`[SettingsService] Account added: ${userId}`);
  }

  /**
   * @param {string | number | null} userId
   */
  removeAccount(userId) {
    const accounts = this.getAccounts();
    // @ts-ignore
    delete accounts[userId];
    this.store.set("accounts", accounts);
    if (this.getActiveAccountId() === userId) {
      const remainingIds = Object.keys(accounts);
      this.setActiveAccount(remainingIds[0] || null);
    }
    logger.info(`[SettingsService] Account removed: ${userId}`);
  }

  /**
   * @param {string | number} userId
   * @param {any} tokenData
   */
  updateAccountToken(userId, tokenData) {
    const accounts = this.getAccounts();
    // @ts-ignore
    if (accounts[userId]) {
      // @ts-ignore
      accounts[userId] = { ...accounts[userId], ...tokenData };
      this.store.set("accounts", accounts);
      logger.debug(`[SettingsService] Token updated for ${userId}`);
    }
  }

  // Backward compatibility for existing code that expects 'twitch' getter
  get twitch() {
    const active = this.getActiveAccount();
    return active
      ? {
          // @ts-ignore
          accessToken: active.accessToken,
          // @ts-ignore
          refreshToken: active.refreshToken,
          // @ts-ignore
          userId: active.userId,
          // @ts-ignore
          login: active.login,
          // @ts-ignore
          scope: active.scope,
          // @ts-ignore
          expiresIn: active.expiresIn,
          // @ts-ignore
          obtainmentTimestamp: active.obtainmentTimestamp,
        }
      : {};
  }

  getAll() {
    const all = this.store.store;
    // @ts-ignore
    logger.debug("[SettingsService] getAll called, keys:", Object.keys(all));
    return all;
  }

  // @ts-ignore
  get(key) {
    const value = this.store.get(key);
    if (key === "twitch") {
      if (value) {
        // logger.debug("[SettingsService] get(twitch):", {
        //   hasToken: !!value.accessToken,
        //   userId: value.userId,
        //   login: value.login,
        //   scope: value.scope || null,
        // });
      } else {
        logger.debug("[SettingsService] get(twitch): no twitch data");
      }
    } else {
      // logger.debug(`[SettingsService] get(${key}) =`, value);
    }
    return value;
  }

  // @ts-ignore
  set(key, value) {
    if (key === "twitch") {
      // @ts-ignore
      logger.debug("[SettingsService] set(twitch): updating tokens", {
        userId: value?.userId,
        login: value?.login,
      });
    } else {
      logger.debug(`[SettingsService] set(${key}) =`, value);
    }
    this.store.set(key, value);
  }

  // @ts-ignore
  addChatFilter(word) {
    const filters = this.get("chatFilters");
    const lowerWord = word.toLowerCase();
    if (!filters.includes(lowerWord)) {
      this.set("chatFilters", [...filters, lowerWord]);
      logger.debug(`[SettingsService] addChatFilter: added "${word}"`);
    } else {
      logger.debug(`[SettingsService] addChatFilter: "${word}" already exists`);
    }
  }

  // @ts-ignore
  removeChatFilter(word) {
    const filters = this.get("chatFilters");
    // @ts-ignore
    this.set(
      "chatFilters",
      filters.filter((/** @type {any} */ f) => f !== word.toLowerCase()),
    );
    logger.debug(`[SettingsService] removeChatFilter: removed "${word}"`);
  }

  // @ts-ignore
  /**
   * @param {string} accessToken
   * @param {any} refreshToken
   * @param {any} userId
   * @param {any} login
   */
  setTwitchTokens(
    accessToken,
    refreshToken,
    userId,
    login,
    expiresIn = 0,
    obtainmentTimestamp = Date.now(),
    scope = "",
  ) {
    // Convert scope to string if it's an array
    let scopeString = scope;
    if (Array.isArray(scope)) {
      scopeString = scope.join(" ");
    }
    this.set("twitch", {
      accessToken,
      refreshToken,
      userId,
      login,
      expiresIn,
      obtainmentTimestamp,
      scope: scopeString,
    });
    // @ts-ignore
    logger.info("[SettingsService] Twitch tokens saved", {
      userId,
      login,
      hasToken: !!accessToken,
      scope: scopeString,
    });
  }

  clearTwitchTokens() {
    this.set("twitch", {});
    logger.warn("[SettingsService] Twitch tokens cleared");
  }

  reset() {
    logger.warn("[SettingsService] Resetting all settings to defaults");
    this.store.clear();
    this.store.set(defaults);
  }

  getNotificationPreferences() {
    return this.get("notificationPreferences");
  }

  /**
   * @param {any} prefs
   */
  updateNotificationPreferences(prefs) {
    this.set("notificationPreferences", {
      ...this.get("notificationPreferences"),
      ...prefs,
    });
  }
  /**
   * @param {string | number} type
   */
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
      // @ts-ignore
      title: titles[type],
      // @ts-ignore
      message: messages[type],
    });
    // Also show native notification if possible
    const { notificationService } = require("./notification.service");
    // @ts-ignore
    notificationService.show(titles[type], messages[type]);
  }
  getLanguage() {
    return this.store.get("language", "en");
  }
  /**
   * @param {unknown} lang
   */
  setLanguage(lang) {
    this.store.set("language", lang);
    this._sendToRenderers("settings:language-changed", { language: lang });
  }

  async exportAllSettings() {
    const all = this.store.store;
    const accounts = this.getAccounts();
    const activeAccount = this.getActiveAccountId();
    return { settings: all, accounts, activeAccount };
  }

  /**
   * @param {{ settings: { [x: string]: unknown; }; accounts: unknown; activeAccount: unknown; }} data
   */
  async importAllSettings(data) {
    // Override store
    Object.keys(data.settings).forEach((key) => {
      this.store.set(key, data.settings[key]);
    });
    // Override accounts
    this.store.set("accounts", data.accounts);
    this.store.set("activeAccountId", data.activeAccount);
    return true;
  }

  getChatDisplayDelay() {
    return this.store.get("chatDisplayDelay", 0);
  }
  /**
   * @param {unknown} seconds
   */
  setChatDisplayDelay(seconds) {
    this.store.set("chatDisplayDelay", seconds);
  }
}

const settingsService = new SettingsService();
module.exports = { settingsService, SettingsService };
