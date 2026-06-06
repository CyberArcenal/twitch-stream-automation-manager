//@ts-check
const { settingsService } = require("../settings");
const { logger } = require("../../utils/logger");

class AutomationConfig {
  constructor() {
    this.config = {
      autoRaid: false,
      autoClip: false,
      autoMessage: false,
      autoMessageText: "Thanks for the follow/sub! 🎉",
      raidTarget: null,
      autoModerationEnabled: false,
      autoBlockLinks: false,
      blockedTerms: [],
      blockedBadges: [],
      autoDeleteMessage: false,
      autoTimeoutUser: true,
      autoSlowMode: false,
      slowModeSpamThreshold: 5,
      slowModeWaitTime: 10,
      slowModeDuration: 60,
      autoFollowerMode: false,
      followerModeDuration: 5,
      repeatWindowSeconds: 10,
      repeatCountThreshold: 3,
      autoShoutoutOnRaid: false,
      shoutoutMessage:
        "Thanks for the raid @{fromBroadcasterName}! Check them out at twitch.tv/{fromBroadcasterName}",
      autoClipOnChatSpike: false,
      chatSpikeThreshold: 100,
      chatSpikeCooldownMinutes: 5,
      autoStreamMarkers: false,
      markerIntervalMinutes: 30,
    };
    this.reload();
  }

  reload() {
    const saved = settingsService.get("automationConfig") || {};
    logger.info("[AutomationConfig] Loading config, saved keys:", Object.keys(saved));
    this.config = { ...this.config, ...saved };
    logger.debug("[AutomationConfig] Config loaded:", {
      autoRaid: this.config.autoRaid,
      autoClip: this.config.autoClip,
      autoModerationEnabled: this.config.autoModerationEnabled,
    });
  }

  update(customConfig = {}) {
    this.config = { ...this.config, ...customConfig };
    logger.debug("[AutomationConfig] Config updated with:", Object.keys(customConfig));
  }

  save() {
    logger.debug("[AutomationConfig] Saving config");
    settingsService.set("automationConfig", this.config);
  }

  get(key) {
    return this.config[key];
  }

  getAll() {
    return { ...this.config };
  }

  toJSON() {
    return this.config;
  }
}

module.exports = { AutomationConfig };
