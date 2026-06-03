// src/main/services/automation.service.js
//@ts-check
const { eventSubService } = require("./eventsub.service");
const { streamManagerService } = require("./stream-manager.service");
const { twitchChatService } = require("./twitch-chat.service");
const { settingsService } = require("./settings.service");
const { logger } = require("../utils/logger");
const { autoModerationService } = require("./auto-moderation.service");

class AutomationService {
  constructor() {
    this.running = false;
    this.config = {
      autoRaid: false,
      autoClip: false,
      autoMessage: false,
      autoMessageText: "Thanks for the follow/sub! 🎉",
      raidTarget: null,
    };
    this.listenersAttached = false;
    this.offlineHandled = false; // para iwas multiple raid/clip
    this.loadConfig();
  }

  /**
   * @param {{ autoBlockLinks: boolean; blockedTerms: string | any[]; autoDeleteMessage: boolean; autoTimeoutUser: boolean; autoModerationEnabled: boolean; }} config
   */
  start(config) {
    this.config = { ...this.config, ...config };
    this.running = true;
    this.offlineHandled = false;

    // ✅ I-sync ang auto-moderation settings
    // I-enable o i-disable base sa UI toggle
    const enableAutoMod = config.autoModerationEnabled === true;
    autoModerationService.setEnabled(enableAutoMod);

    if (enableAutoMod) {
      // I-sync ang rules
      autoModerationService.updateRules({
        links: config.autoBlockLinks === true,
        blockedWords: config.blockedTerms || [],
      });
      autoModerationService.setAutoDeleteMessage(
        config.autoDeleteMessage === true,
      );
      autoModerationService.setAutoTimeoutUser(
        config.autoTimeoutUser !== false,
      );
      logger.info("[Automation] Auto-moderation settings synced with UI");
    } else {
      logger.info("[Automation] Auto-moderation disabled by user preference");
    }

    this.attachEventListeners();
    this.saveConfig();
    logger.info("[Automation] Started");
  }

  stop() {
    this.running = false;
    this.offlineHandled = false;
    logger.info("[Automation] Stopped");
  }

  attachEventListeners() {
    if (this.listenersAttached) return;
    eventSubService.on("eventsub:follow", this.handleFollow.bind(this));
    eventSubService.on(
      "eventsub:subscription",
      this.handleSubscription.bind(this),
    );
    eventSubService.on(
      "eventsub:stream-offline",
      this.handleStreamOffline.bind(this),
    );
    this.listenersAttached = true;
    logger.debug("[Automation] Event listeners attached");
  }

  /**
   * @param {{ followerName: any; }} data
   */
  async handleFollow(data) {
    if (!this.running) return;
    if (this.config.autoMessage && data?.followerName) {
      const msg = `@${data.followerName} ${this.config.autoMessageText}`;
      await this.sendChatMessage(msg);
    }
  }

  /**
   * @param {{ userName: any; }} data
   */
  async handleSubscription(data) {
    if (!this.running) return;
    if (this.config.autoMessage && data?.userName) {
      const msg = `@${data.userName} ${this.config.autoMessageText}`;
      await this.sendChatMessage(msg);
    }
  }

  /**
   * @param {{ broadcasterId: any; }} data
   */
  async handleStreamOffline(data) {
    if (!this.running) return;
    // Iwas multiple triggers
    if (this.offlineHandled) return;
    this.offlineHandled = true;

    const broadcasterId =
      data?.broadcasterId || settingsService.get("twitch")?.userId;
    if (!broadcasterId) {
      logger.warn("[Automation] No broadcaster ID for offline event");
      return;
    }

    if (this.config.autoRaid && this.config.raidTarget) {
      try {
        await streamManagerService.startRaid(
          broadcasterId,
          this.config.raidTarget,
        );
        logger.info(
          `[Automation] Auto-raid to ${this.config.raidTarget} triggered`,
        );
      } catch (err) {
        // @ts-ignore
        logger.error("[Automation] Auto-raid failed:", err);
      }
    }
    if (this.config.autoClip) {
      try {
        await streamManagerService.createClip(broadcasterId);
        logger.info("[Automation] Auto-clip triggered");
      } catch (err) {
        // @ts-ignore
        logger.error("[Automation] Auto-clip failed:", err);
      }
    }
  }

  /**
   * @param {string} message
   */
  async sendChatMessage(message) {
    if (!twitchChatService.currentChannel) {
      logger.warn("[Automation] Chat not connected, cannot send auto-message");
      return;
    }
    try {
      await twitchChatService.sendChatMessage(message);
      logger.debug(`[Automation] Auto-message sent: "${message}"`);
    } catch (err) {
      // @ts-ignore
      logger.error("[Automation] Failed to send auto-message:", err);
    }
  }

  loadConfig() {
    const saved = settingsService.get("automationConfig") || {};
    this.config = {
      autoRaid: false,
      autoClip: false,
      autoMessage: false,
      autoMessageText: "Thanks for the follow/sub! 🎉",
      raidTarget: null,
      autoModerationEnabled: false, 
      autoBlockLinks: false, 
      blockedTerms: [], 
      autoDeleteMessage: false, 
      autoTimeoutUser: true, 
      ...saved,
    };
  }

  saveConfig() {
    settingsService.set("automationConfig", this.config);
  }

  getConfig() {
    return { running: this.running, config: this.config };
  }
}

const automationService = new AutomationService();
module.exports = { automationService, AutomationService };
