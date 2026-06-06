// services/auto-moderation/settings.js
const { settingsService } = require("../settings");
const { logger } = require("../../utils/logger");

class ModerationSettings {
  constructor() {
    this.rules = {
      links: true,
      maxCapsPercent: 70,
      maxEmojis: 5,
      blockedWords: [],
      trustedUsers: [],
      blockedBadges: [],
      repeatWindowSeconds: 10,
      repeatCountThreshold: 3,
    };
    this.autoDeleteMessage = false;
    this.autoTimeoutUser = true;
    this.enabled = false;
    this.level = "basic";
  }

  load() {
    const autoMod = settingsService.get("autoModeration") || {};
    logger.debug("[AutoModSettings] Loading settings", autoMod);

    this.rules = {
      links: autoMod.links !== undefined ? autoMod.links : true,
      maxCapsPercent: autoMod.maxCapsPercent || 70,
      maxEmojis: autoMod.maxEmojis || 5,
      blockedWords: autoMod.blockedWords || [],
      trustedUsers: autoMod.trustedUsers || [],
      blockedBadges: autoMod.blockedBadges || [],
      repeatWindowSeconds: autoMod.repeatWindowSeconds ?? 10,
      repeatCountThreshold: autoMod.repeatCountThreshold ?? 3,
    };
    this.enabled = autoMod.enabled || false;
    this.level = autoMod.level || "basic";
    this.autoDeleteMessage = autoMod.autoDeleteMessage || false;
    this.autoTimeoutUser = autoMod.autoTimeoutUser !== undefined ? autoMod.autoTimeoutUser : true;

    logger.info(`[AutoMod] Settings loaded: enabled=${this.enabled}, level=${this.level}`);
  }

  save() {
    const data = {
      enabled: this.enabled,
      level: this.level,
      links: this.rules.links,
      maxCapsPercent: this.rules.maxCapsPercent,
      maxEmojis: this.rules.maxEmojis,
      blockedWords: this.rules.blockedWords,
      trustedUsers: this.rules.trustedUsers,
      blockedBadges: this.rules.blockedBadges,
      autoDeleteMessage: this.autoDeleteMessage,
      autoTimeoutUser: this.autoTimeoutUser,
      repeatWindowSeconds: this.rules.repeatWindowSeconds,
      repeatCountThreshold: this.rules.repeatCountThreshold,
    };
    settingsService.set("autoModeration", data);
    logger.debug("[AutoModSettings] Settings saved");
  }

  updateRules(newRules) {
    this.rules = { ...this.rules, ...newRules };
    this.save();
  }

  setEnabled(enabled) {
    this.enabled = enabled;
    this.save();
  }

  setAutoDeleteMessage(enabled) {
    this.autoDeleteMessage = enabled;
    this.save();
  }

  setAutoTimeoutUser(enabled) {
    this.autoTimeoutUser = enabled;
    this.save();
  }

  setLevel(level) {
    this.level = level;
    this._applyLevelRules();
    this.save();
  }

  _applyLevelRules() {
    switch (this.level) {
      case "none":
        this.rules.links = false;
        this.rules.maxCapsPercent = 0;
        this.rules.maxEmojis = 0;
        this.rules.repeatWindowSeconds = 0;
        this.rules.repeatCountThreshold = 0;
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
}

module.exports = { ModerationSettings };