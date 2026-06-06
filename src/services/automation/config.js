// src/main/services/automation/config.js
//@ts-check
const { settingsService } = require("../settings");
const { logger } = require("../../utils/logger");

class Config {
  constructor() {
    this.config = {
      autoRaid: false,
      autoClip: false,
      autoMessage: false,
      autoMessageText: "Thanks for the follow/sub! 🎉",
      raidTarget: null,
      autoSlowMode: false,
      slowModeSpamThreshold: 5,
      slowModeWaitTime: 10,
      slowModeDuration: 60,
      autoFollowerMode: false,
      followerModeDuration: 5,
      autoShoutoutOnRaid: false,
      shoutoutMessage: "Thanks for the raid @{fromBroadcasterName}! Check them out at twitch.tv/{fromBroadcasterName}",
      autoClipOnChatSpike: false,
      chatSpikeThreshold: 100,
      chatSpikeCooldownMinutes: 5,
      autoStreamMarkers: false,
      markerIntervalMinutes: 30,
      autoModerationEnabled: false,
      autoBlockLinks: false,
      blockedTerms: [],
      blockedBadges: [],
      autoDeleteMessage: false,
      autoTimeoutUser: true,
      repeatWindowSeconds: 10,
      repeatCountThreshold: 3,
    };
  }

  load() {
    const saved = settingsService.get("automationConfig") || {};
    logger.info("[Automation] loadConfig() - saved config keys:", Object.keys(saved));
    this.config = { ...this.config, ...saved };
    logger.debug("[Automation] Final config after load:", JSON.stringify(this.config));
  }

  save() {
    logger.debug("[Automation] saveConfig() called");
    settingsService.set("automationConfig", this.config);
  }

  get() { return this.config; }
  update(newConfig) { this.config = { ...this.config, ...newConfig }; this.save(); }
}

module.exports = { Config };