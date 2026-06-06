// src/main/services/settings/index.js
const { getStore } = require("./store");
const { defaults } = require("./defaults");
const { AccountManager } = require("./account");
const { PreferencesManager } = require("./preferences");
const { migrateOldAccount } = require("./migration");
const { logger } = require("../../utils/logger");

class SettingsService {
  constructor() {
    this.store = getStore();
    this.accounts = new AccountManager();
    this.preferences = new PreferencesManager();
    migrateOldAccount();
    this._syncTwitchKey();
    logger.debug("[SettingsService] Initialized");
  }

  // Internal
  _syncTwitchKey() {
    const active = this.accounts.getActiveAccount();
    if (active) {
      this.store.set("twitch", {
        accessToken: active.accessToken,
        refreshToken: active.refreshToken,
        userId: active.userId,
        login: active.login,
        scope: active.scope,
        expiresIn: active.expiresIn,
        obtainmentTimestamp: active.obtainmentTimestamp,
      });
    } else {
      this.store.delete("twitch");
    }
  }

  // Legacy getter for `twitch` property
  get twitch() {
    return this.accounts.getTwitchLegacy();
  }

  // General get/set (direct store access)
  getAll() {
    return this.store.store;
  }

  get(key) {
    if (key === "twitch") {
      return this.twitch;
    }
    return this.store.get(key);
  }

  set(key, value) {
    if (key === "twitch") {
      logger.warn("[Settings] Direct set of 'twitch' is deprecated; use account methods.");
      // Still allow for backward compatibility
      const active = this.accounts.getActiveAccount();
      if (active) {
        this.accounts.updateAccountToken(active.userId, value);
      }
      this._syncTwitchKey();
    } else {
      this.store.set(key, value);
    }
  }

  // Account methods
  getAccounts() {
    return this.accounts.getAccounts();
  }

  getActiveAccountId() {
    return this.accounts.getActiveAccountId();
  }

  getActiveAccount() {
    return this.accounts.getActiveAccount();
  }

  addAccount(userId, accountData) {
    this.accounts.addAccount(userId, accountData);
    this._syncTwitchKey();
  }

  removeAccount(userId) {
    this.accounts.removeAccount(userId);
    this._syncTwitchKey();
  }

  setActiveAccount(userId) {
    this.accounts.setActiveAccount(userId);
    this._syncTwitchKey();
  }

  updateAccountToken(userId, tokenData) {
    this.accounts.updateAccountToken(userId, tokenData);
    this._syncTwitchKey();
  }

  // Legacy token methods (use account methods instead)
  setTwitchTokens(accessToken, refreshToken, userId, login, expiresIn = 0, obtainmentTimestamp = Date.now(), scope = "") {
    let scopeString = scope;
    if (Array.isArray(scope)) scopeString = scope.join(" ");
    const accountData = {
      userId,
      login,
      accessToken,
      refreshToken,
      expiresIn,
      obtainmentTimestamp,
      scope: scopeString,
      userData: { id: userId, login, display_name: login, profile_image_url: null },
    };
    this.addAccount(userId, accountData);
    this.setActiveAccount(userId);
  }

  clearTwitchTokens() {
    const activeId = this.getActiveAccountId();
    if (activeId) this.removeAccount(activeId);
  }

  // Preferences methods
  getTheme() {
    return this.preferences.getTheme();
  }

  setTheme(theme) {
    this.preferences.setTheme(theme);
  }

  getLanguage() {
    return this.preferences.getLanguage();
  }

  setLanguage(lang) {
    this.preferences.setLanguage(lang);
  }

  getNotificationPreferences() {
    return this.preferences.getNotificationPreferences();
  }

  updateNotificationPreferences(prefs) {
    this.preferences.updateNotificationPreferences(prefs);
  }

  testNotification(type) {
    this.preferences.testNotification(type);
  }

  getChatFilters() {
    return this.preferences.getChatFilters();
  }

  addChatFilter(word) {
    this.preferences.addChatFilter(word);
  }

  removeChatFilter(word) {
    this.preferences.removeChatFilter(word);
  }

  getChatDisplayDelay() {
    return this.preferences.getChatDisplayDelay();
  }

  setChatDisplayDelay(seconds) {
    this.preferences.setChatDisplayDelay(seconds);
  }

  // Import/Export
  async exportAllSettings() {
    const all = this.store.store;
    const accounts = this.getAccounts();
    const activeAccount = this.getActiveAccountId();
    return { settings: all, accounts, activeAccount };
  }

  async importAllSettings(data) {
    Object.keys(data.settings).forEach((key) => {
      this.store.set(key, data.settings[key]);
    });
    this.store.set("accounts", data.accounts);
    this.store.set("activeAccountId", data.activeAccount);
    this._syncTwitchKey();
    return true;
  }

  reset() {
    logger.warn("[Settings] Resetting all settings to defaults");
    this.store.clear();
    this.store.set(defaults);
    this._syncTwitchKey();
  }
}

// Singleton
const settingsService = new SettingsService();
module.exports = { settingsService, SettingsService };