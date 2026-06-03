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
      blockedBadges: [], // ✅ bagong array: mga badge name na dapat i‑timeout
      repeatWindowSeconds: 10,
      repeatCountThreshold: 3,
    };
    this.autoDeleteMessage = false;
    this.autoTimeoutUser = true;
    this.enabled = false;
    this.level = "basic";
    this.userMessageHistory = new Map();
    this.loadSettings();
  }

  loadSettings() {
    const autoMod = settingsService.get("autoModeration") || {};
    this.rules = {
      links: autoMod.links !== undefined ? autoMod.links : true,
      maxCapsPercent: autoMod.maxCapsPercent || 70,
      maxEmojis: autoMod.maxEmojis || 5,
      blockedWords: autoMod.blockedWords || [],
      trustedUsers: autoMod.trustedUsers || [],
      blockedBadges: autoMod.blockedBadges || [], // ✅ load
      repeatWindowSeconds: autoMod.repeatWindowSeconds ?? 10,
      repeatCountThreshold: autoMod.repeatCountThreshold ?? 3,
    };
    this.enabled = autoMod.enabled || false;
    this.level = autoMod.level || "basic";
    this.autoDeleteMessage = autoMod.autoDeleteMessage || false;
    this.autoTimeoutUser =
      autoMod.autoTimeoutUser !== undefined ? autoMod.autoTimeoutUser : true;
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
      blockedBadges: this.rules.blockedBadges, // ✅ i‑save
      autoDeleteMessage: this.autoDeleteMessage,
      autoTimeoutUser: this.autoTimeoutUser,
      repeatWindowSeconds: this.rules.repeatWindowSeconds,
      repeatCountThreshold: this.rules.repeatCountThreshold,
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
   * @param {{ links: boolean; blockedWords: any; repeatWindowSeconds: any; repeatCountThreshold: any; }} newRules
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
    if (!this.rules.trustedUsers.includes(lower)) {
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
   * ✅ Suriin kung ang user ay may anumang badge na nasa blocked list
   * @param {Record<string, string>} badges - badge object mula sa Twitch (ex: { broadcaster: "1", subscriber: "12" })
   * @returns {string|null} - pangalan ng unang blocked badge na natagpuan, o null
   */
  hasBlockedBadge(badges) {
    if (!badges || !this.rules.blockedBadges.length) return null;
    for (const badgeName of this.rules.blockedBadges) {
      if (badges[badgeName]) return badgeName;
    }
    return null;
  }

  /**
   * @param {any} userId
   * @param {any} message
   */
  isRepeatedMessage(userId, message) {
    const now = Date.now();
    const windowMs = this.rules.repeatWindowSeconds * 1000;
    const threshold = this.rules.repeatCountThreshold;

    let history = this.userMessageHistory.get(userId) || [];
    history = history.filter((/** @type {{ timestamp: number; }} */ entry) => now - entry.timestamp < windowMs);
    history.push({ message, timestamp: now });
    this.userMessageHistory.set(userId, history);

    const count = history.filter((/** @type {{ message: any; }} */ entry) => entry.message === message).length;
    return count >= threshold;
  }

  /**
   * @param {string} channel
   * @param {string} userId
   * @param {string} userName
   * @param {string} message
   * @param {any} broadcasterId
   * @param {import("@twurple/chat").ChatMessage} msg
   */
  async processMessage(channel, userId, userName, message, broadcasterId, msg) {
    logger.debug(`[AutoMod] Processing message from ${userName}: "${message}"`);
    if (!this.enabled) {
      logger.debug("[AutoMod] Auto-moderation is disabled, skipping checks.");
      return false;
    }

    if (this.rules.trustedUsers.includes(userName.toLowerCase())) {
      logger.debug(`[AutoMod] User ${userName} is trusted, skipping checks.`);
      return false;
    }

    let timeoutSeconds = 0;
    let reason = "";

    // ✅ 0. Check blocked badges (pinakamataas na priyoridad)
    const userBadges = msg.userInfo?.badges; // object: { badgeName: version }
    const blockedBadge = this.hasBlockedBadge(userBadges);
    if (blockedBadge) {
      timeoutSeconds = 60; // 1 minuto timeout
      reason = `Blocked badge: ${blockedBadge}`;
      logger.info(
        `[AutoMod] User ${userName} has blocked badge "${blockedBadge}", timing out.`,
      );
    }
    // 1. Repeated message (spam)
    else if (this.isRepeatedMessage(userId, message)) {
      timeoutSeconds = 60;
      reason = "Repeated message (spam)";
      logger.info(
        `[AutoMod] Detected repeated message from ${userName}: "${message}"`,
      );
    }
    // 2. Links
    else if (this.rules.links && /https?:\/\//i.test(message)) {
      timeoutSeconds = 300;
      reason = "Link posted";
      logger.info(`[AutoMod] Detected link in message from ${userName}`);
    }
    // 3. Caps (non-Latin friendly)
    else if (this.rules.maxCapsPercent > 0) {
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
    // 4. Emojis
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

    // 5. Blocked words (always check)
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
            timeoutSeconds,
            reason,
          );
          actionTaken = true;
        }

        return actionTaken;
      } catch (err) {
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
        this.rules.repeatWindowSeconds = 0;
        this.rules.repeatCountThreshold = 0;
        // Hindi binabago ang blockedBadges – panatilihin ang nakaimbak
        this.enabled = false;
        break;
      case "basic":
        this.rules.links = true;
        this.rules.maxCapsPercent = 70;
        this.rules.maxEmojis = 5;
        this.rules.repeatWindowSeconds = 10;
        this.rules.repeatCountThreshold = 3;
        this.enabled = true;
        break;
      case "aggressive":
        this.rules.links = true;
        this.rules.maxCapsPercent = 50;
        this.rules.maxEmojis = 3;
        this.rules.repeatWindowSeconds = 5;
        this.rules.repeatCountThreshold = 2;
        this.enabled = true;
        break;
    }
  }

  getConfig() {
    return { enabled: this.enabled, level: this.level, rules: this.rules };
  }
}

const autoModerationService = new AutoModerationService();
module.exports = { autoModerationService, AutoModerationService };
