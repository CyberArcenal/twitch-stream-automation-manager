// src/main/services/auto-moderation.service.js
//@ts-check
const { settingsService } = require("./settings.service");
const { streamManagerService } = require("./stream-manager.service");
const { moderationLogService } = require("./moderation-log.service");
const { logger } = require("../utils/logger");

class AutoModerationService {
  constructor() {
    this.rules = {
      links: true,
      maxCapsPercent: 70,
      maxEmojis: 5,
      blockedWords: [],
      trustedUsers: [],
    };
    this.autoDeleteMessage = false;
    this.autoTimeoutUser = true;
    this.enabled = false;
    this.level = "basic";
  }

  loadSettings() {
    const autoMod = settingsService.get("autoModeration") || {};
    this.rules = {
      links: autoMod.links !== undefined ? autoMod.links : true,
      maxCapsPercent: autoMod.maxCapsPercent || 70,
      maxEmojis: autoMod.maxEmojis || 5,
      blockedWords: autoMod.blockedWords || [],
      trustedUsers: autoMod.trustedUsers || [],
    };
    this.enabled = autoMod.enabled || false;
    this.level = autoMod.level || "basic";
    this.autoDeleteMessage = autoMod.autoDeleteMessage || false;
    this.autoTimeoutUser =
      autoMod.autoTimeoutUser !== undefined ? autoMod.autoTimeoutUser : true;
    // Hindi na tinatawag ang _applyLevelRules() para hindi ma-overwrite ang custom rules
  }

  saveSettings() {
    settingsService.set("autoModeration", {
      enabled: this.enabled,
      level: this.level,
      links: this.rules.links,
      maxCapsPercent: this.rules.maxCapsPercent,
      maxEmojis: this.rules.maxEmojis,
      blockedWords: this.rules.blockedWords,
      trustedUsers: this.rules.trustedUsers,
      autoDeleteMessage: this.autoDeleteMessage,
      autoTimeoutUser: this.autoTimeoutUser,
    });
  }

  /**
   * @param {boolean} enabled
   */
  setAutoDeleteMessage(enabled) {
    this.autoDeleteMessage = enabled;
    this.saveSettings();
  }

  /**
   * @param {boolean} enabled
   */
  setAutoTimeoutUser(enabled) {
    this.autoTimeoutUser = enabled;
    this.saveSettings();
    logger.info(
      `[AutoMod] Auto-timeout user ${enabled ? "enabled" : "disabled"}`,
    );
  }

  /**
   * @param {boolean} enabled
   */
  setEnabled(enabled) {
    this.enabled = enabled;
    this.saveSettings();
    logger.info(`[AutoMod] ${enabled ? "Enabled" : "Disabled"}`);
  }

  /**
   * @param {{ links: boolean; blockedWords: any; }} newRules
   */
  updateRules(newRules) {
    this.rules = { ...this.rules, ...newRules };
    this.saveSettings();
  }

  /**
   * @param {string} username
   */
  addTrustedUser(username) {
    const lower = username.toLowerCase();
    // @ts-ignore
    if (!this.rules.trustedUsers.includes(lower)) {
      // @ts-ignore
      this.rules.trustedUsers.push(lower);
      this.saveSettings();
    }
  }

  /**
   * @param {string} username
   */
  removeTrustedUser(username) {
    const lower = username.toLowerCase();
    this.rules.trustedUsers = this.rules.trustedUsers.filter(
      (u) => u !== lower,
    );
    this.saveSettings();
  }

  /**
   * @param {string} channel
   * @param {string} userId
   * @param {string} userName
   * @param {string} message
   * @param {any} broadcasterId
   * @param {import("@twurple/chat").ChatMessage} msg
   */
  // @ts-ignore
  async processMessage(channel, userId, userName, message, broadcasterId, msg) {
    logger.debug(`[AutoMod] Processing message from ${userName}: "${message}"`);
    if (!this.enabled) {
      logger.debug("[AutoMod] Auto-moderation is disabled, skipping checks.");
      return false;
    }

    // @ts-ignore
    if (this.rules.trustedUsers.includes(userName.toLowerCase())) {
      logger.debug(`[AutoMod] User ${userName} is trusted, skipping checks.`);
      return false;
    }

    // @ts-ignore
    const autoBlockLinks =
      settingsService.get("automationConfig")?.autoBlockLinks;
    let timeoutSeconds = 0;
    let reason = "";

    // 1. Links
    if (this.rules.links && /https?:\/\//i.test(message)) {
      timeoutSeconds = 300;
      reason = "Link posted";
      logger.info(`[AutoMod] Detected link in message from ${userName}`);
    }
    // 2. Caps (non-Latin friendly)
    else if (this.rules.maxCapsPercent > 0) {
      // Gumamit ng Unicode property escapes para suportahan ang iba't ibang script
      const letters = (message.match(/\p{L}/gu) || []).length;
      const caps = (message.match(/\p{Lu}/gu) || []).length;
      if (letters > 5 && (caps / letters) * 100 > this.rules.maxCapsPercent) {
        timeoutSeconds = 60;
        reason = "Excessive caps";
        logger.info(
          `[AutoMod] Detected excessive caps in message from ${userName}`,
        );
      }
    }
    // 3. Emojis
    else if (this.rules.maxEmojis > 0) {
      const emojiRegex = /[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu;
      const emojis = message.match(emojiRegex) || [];
      if (emojis.length > this.rules.maxEmojis) {
        timeoutSeconds = 60;
        reason = `Too many emojis (${emojis.length})`;
        logger.info(
          `[AutoMod] Detected too many emojis in message from ${userName}`,
        );
      }
    }

    // 4. Blocked words (always check, kahit may nauna nang violation)
    if (timeoutSeconds === 0 && this.rules.blockedWords.length > 0) {
      const lowerMsg = message.toLowerCase();
      for (const word of this.rules.blockedWords) {
        if (lowerMsg.includes(word)) {
          timeoutSeconds = 300;
          reason = `Blocked word: ${word}`;
          logger.info(
            `[AutoMod] Detected blocked word "${word}" in message from ${userName}`,
          );
          break;
        }
      }
    }

    // Kung may violation at may kahit isang aksyon na naka-enable
    if (timeoutSeconds > 0) {
      let actionTaken = false;

      try {
        if (this.autoDeleteMessage) {
          await streamManagerService.deleteMessage(
            broadcasterId,
            broadcasterId,
            msg.id,
          );
          logger.info(
            `[AutoMod] Deleted message from ${userName} (reason: ${reason})`,
          );
          moderationLogService.addLog(
            "delete",
            broadcasterId,
            userId,
            userName,
            null,
            // @ts-ignore
            reason,
          );
          actionTaken = true;
        }

        if (this.autoTimeoutUser) {
          await streamManagerService.timeoutUser(
            broadcasterId,
            broadcasterId,
            userName,
            timeoutSeconds,
          );
          moderationLogService.addLog(
            "timeout",
            broadcasterId,
            userId,
            userName,
            // @ts-ignore
            timeoutSeconds,
            reason,
          );
          actionTaken = true;
        }

        // Kung walang aksyon (parehong naka-off), huwag mag-return true
        return actionTaken;
      } catch (err) {
        // @ts-ignore
        logger.error(`[AutoMod] Failed to act on ${userName}:`, err);
        return false;
      }
    }

    return false;
  }

  /**
   * @param {string} level
   */
  setLevel(level) {
    this.level = level;
    this._applyLevelRules();
    this.saveSettings();
  }

  _applyLevelRules() {
    switch (this.level) {
      case "none":
        this.rules.links = false;
        this.rules.maxCapsPercent = 0;
        this.rules.maxEmojis = 0;
        this.enabled = false;
        break;
      case "basic":
        this.rules.links = true;
        this.rules.maxCapsPercent = 70;
        this.rules.maxEmojis = 5;
        this.enabled = true;
        break;
      case "aggressive":
        this.rules.links = true;
        this.rules.maxCapsPercent = 50;
        this.rules.maxEmojis = 3;
        this.enabled = true;
        break;
    }
  }

  // Inalis ang getChatDisplayDelay / setChatDisplayDelay dahil wala naman sa settingsService
  // Kung kailangan, dapat idagdag sa settingsService mismo.

  getConfig() {
    return { enabled: this.enabled, level: this.level, rules: this.rules };
  }
}

const autoModerationService = new AutoModerationService();
module.exports = { autoModerationService, AutoModerationService };
