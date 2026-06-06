// src/main/services/settings/account.js
const { getStore } = require("./store");
const { logger } = require("../../utils/logger");

class AccountManager {
  constructor() {
    this.store = getStore();
  }

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

  getTwitchLegacy() {
    const active = this.getActiveAccount();
    return active
      ? {
          accessToken: active.accessToken,
          refreshToken: active.refreshToken,
          userId: active.userId,
          login: active.login,
          scope: active.scope,
          expiresIn: active.expiresIn,
          obtainmentTimestamp: active.obtainmentTimestamp,
        }
      : {};
  }

  addAccount(userId, accountData) {
    const accounts = this.getAccounts();
    accounts[userId] = accountData;
    this.store.set("accounts", accounts);
    if (!this.getActiveAccountId()) {
      this.setActiveAccount(userId);
    }
    logger.info(`[Settings] Account added: ${userId}`);
  }

  removeAccount(userId) {
    const accounts = this.getAccounts();
    delete accounts[userId];
    this.store.set("accounts", accounts);
    if (this.getActiveAccountId() === userId) {
      const remainingIds = Object.keys(accounts);
      this.setActiveAccount(remainingIds[0] || null);
    }
    logger.info(`[Settings] Account removed: ${userId}`);
  }

  setActiveAccount(userId) {
    this.store.set("activeAccountId", userId);
    logger.info(`[Settings] Active account switched to ${userId}`);
  }

  updateAccountToken(userId, tokenData) {
    const accounts = this.getAccounts();
    if (accounts[userId]) {
      accounts[userId] = { ...accounts[userId], ...tokenData };
      this.store.set("accounts", accounts);
      logger.debug(`[Settings] Token updated for ${userId}`);
      return true;
    }
    return false;
  }

  // For backward compatibility: getter for twitch object
  getTwitchObject() {
    return this.getTwitchLegacy();
  }
}

module.exports = { AccountManager };