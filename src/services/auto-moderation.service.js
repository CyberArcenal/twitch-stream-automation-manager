// src/main/services/auto-moderation.service.js
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
      trustedUsers: [], // array of usernames (lowercase)
    };
    this.enabled = false;
    this.level = "basic"; // 'none', 'basic', 'aggressive'
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
    this._applyLevelRules();
  }

  saveSettings() {
    settingsService.set("autoModeration", {
      enabled: this.enabled,
      level: this.level,
      enabled: this.enabled,
      links: this.rules.links,
      maxCapsPercent: this.rules.maxCapsPercent,
      maxEmojis: this.rules.maxEmojis,
      blockedWords: this.rules.blockedWords,
      trustedUsers: this.rules.trustedUsers,
    });
  }

  setEnabled(enabled) {
    this.enabled = enabled;
    this.saveSettings();
    logger.info(`[AutoMod] ${enabled ? "Enabled" : "Disabled"}`);
  }

  updateRules(newRules) {
    this.rules = { ...this.rules, ...newRules };
    this.saveSettings();
  }

  addTrustedUser(username) {
    const lower = username.toLowerCase();
    if (!this.rules.trustedUsers.includes(lower)) {
      this.rules.trustedUsers.push(lower);
      this.saveSettings();
    }
  }

  removeTrustedUser(username) {
    const lower = username.toLowerCase();
    this.rules.trustedUsers = this.rules.trustedUsers.filter(
      (u) => u !== lower,
    );
    this.saveSettings();
  }

  async processMessage(channel, userId, userName, message, broadcasterId) {
    if (!this.enabled) return false;
    if (this.rules.trustedUsers.includes(userName.toLowerCase())) return false;

    let timeoutSeconds = 0;
    let reason = "";

    // Check links
    if (this.rules.links && /https?:\/\//i.test(message)) {
      timeoutSeconds = 300; // 5 minutes
      reason = "Link posted";
    }
    // Check caps percentage
    else if (this.rules.maxCapsPercent > 0) {
      const letters = message.replace(/[^A-Za-z]/g, "");
      const caps = message.replace(/[^A-Z]/g, "");
      if (
        letters.length > 5 &&
        (caps.length / letters.length) * 100 > this.rules.maxCapsPercent
      ) {
        timeoutSeconds = 60;
        reason = "Excessive caps";
      }
    }
    // Check emoji count
    else if (this.rules.maxEmojis > 0) {
      const emojiRegex = /[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu;
      const emojis = message.match(emojiRegex) || [];
      if (emojis.length > this.rules.maxEmojis) {
        timeoutSeconds = 60;
        reason = `Too many emojis (${emojis.length})`;
      }
    }
    // Check blocked words
    if (timeoutSeconds === 0 && this.rules.blockedWords.length > 0) {
      const lowerMsg = message.toLowerCase();
      for (const word of this.rules.blockedWords) {
        if (lowerMsg.includes(word)) {
          timeoutSeconds = 300;
          reason = `Blocked word: ${word}`;
          break;
        }
      }
    }

    if (timeoutSeconds > 0) {
      try {
        await streamManagerService.timeoutUser(
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
        logger.info(
          `[AutoMod] Timed out ${userName} for ${timeoutSeconds}s: ${reason}`,
        );
        return true;
      } catch (err) {
        logger.error(`[AutoMod] Failed to timeout ${userName}:`, err);
      }
    }
    return false;
  }

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

  getChatDisplayDelay() {
    return this.store.get("chatDisplayDelay", 0); // seconds
  }
  setChatDisplayDelay(seconds) {
    this.store.set("chatDisplayDelay", seconds);
  }

  getConfig() {
    return { enabled: this.enabled, level: this.level, rules: this.rules };
  }
}

const autoModerationService = new AutoModerationService();
module.exports = { autoModerationService, AutoModerationService };
