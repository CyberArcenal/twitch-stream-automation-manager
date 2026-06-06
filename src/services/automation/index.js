// src/main/services/automation/index.js
//@ts-check
const { settingsService } = require("../settings");
const { autoModerationService } = require("../auto-moderation");
const { twitchChatService } = require("../chat");
const { logger } = require("../../utils/logger");
const { Config } = require("./config");
const { Logger } = require("./logger");
const { SlowModeHandler } = require("./slowMode");
const { ChatSpikeHandler } = require("./chatSpike");
const { MarkerHandler } = require("./markers");
const { RaidHandler } = require("./raid");
const { OfflineHandler } = require("./offline");
const { EventListenerManager } = require("./events");


class AutomationService {
  constructor() {
    this.running = false;
    this.isLive = false;
    this.offlineHandled = false;

    this.configManager = new Config();
    this.loggerUtil = new Logger();
    this.slowMode = new SlowModeHandler(this.loggerUtil);
    this.chatSpike = new ChatSpikeHandler(this.loggerUtil);
    this.markers = new MarkerHandler(this.loggerUtil);
    this.raidHandler = new RaidHandler(this.loggerUtil);
    this.offlineHandler = new OfflineHandler(this.loggerUtil);

    this.handleFollow = this.handleFollow.bind(this);
    this.handleSubscription = this.handleSubscription.bind(this);
    this.handleStreamOffline = this.handleStreamOffline.bind(this);
    this.handleRaid = this.handleRaid.bind(this);
    this.handleStreamOnline = this.handleStreamOnline.bind(this);
    this.handleChatMessage = this.handleChatMessage.bind(this);

    this.eventManager = new EventListenerManager({
      handleFollow: this.handleFollow,
      handleSubscription: this.handleSubscription,
      handleStreamOffline: this.handleStreamOffline,
      handleRaid: this.handleRaid,
      handleStreamOnline: this.handleStreamOnline,
      handleChatMessage: this.handleChatMessage,
    });

    this.loadConfig();
    logger.info("[Automation] Service created, loading config...");
  }

  loadConfig() { this.configManager.load(); }
  saveConfig() { this.configManager.save(); }

  getConfig() {
    const twitchData = settingsService.get("twitch");
    const hasToken = !!twitchData?.accessToken;
    if (!hasToken) logger.warn("[Automation] getConfig() - no access token, automation may fail later");
    return { running: this.running, config: this.configManager.get() };
  }

  start(config) {
    logger.info("[Automation] start() called, config keys:", Object.keys(config || {}));
    const twitchData = settingsService.get("twitch");
    if (!twitchData?.accessToken) {
      logger.error("[Automation] Cannot start: No access token found!");
      throw new Error("Not logged in - access token missing");
    }

    this.configManager.update(config);
    this.running = true;
    this.offlineHandled = false;
    this.chatSpike.reset();
    this.slowMode.reset();

    const enableAutoMod = config.autoModerationEnabled === true;
    autoModerationService.setEnabled(enableAutoMod);
    if (enableAutoMod) {
      autoModerationService.updateRules({
        links: config.autoBlockLinks === true,
        blockedWords: config.blockedTerms || [],
        blockedBadges: config.blockedBadges || [],
        repeatWindowSeconds: config.repeatWindowSeconds ?? this.configManager.get().repeatWindowSeconds ?? 10,
        repeatCountThreshold: config.repeatCountThreshold ?? this.configManager.get().repeatCountThreshold ?? 3,
      });
      autoModerationService.setAutoDeleteMessage(config.autoDeleteMessage === true);
      autoModerationService.setAutoTimeoutUser(config.autoTimeoutUser !== false);
      logger.info("[Automation] Auto-moderation settings synced with UI");
    }

    if (this.running && this.isLive && this.configManager.get().autoStreamMarkers) {
      this.markers.start(this.configManager.get(), this.isLive, this.running);
    }

    this.eventManager.attach();
    this.configManager.save();
    logger.info("[Automation] Started successfully");
  }

  stop() {
    logger.info("[Automation] stop() called, current running:", this.running);
    this.running = false;
    this.offlineHandled = false;
    this.slowMode.reset();
    this.markers.stop();
    this.eventManager.detach();
    logger.info("[Automation] Stopped");
  }

  // ==================== Event Handlers ====================
  async handleFollow(data) {
    if (!this.running) return;
    const config = this.configManager.get();
    if (config.autoMessage && data?.followerName) {
      const msg = `@${data.followerName} ${config.autoMessageText}`;
      await this.sendChatMessage(msg);
      this.loggerUtil.logAction(
        "auto_message",
        data.followerName,
        null,
        "Follow auto-message",
        `Auto-message sent to follower ${data.followerName}: "${msg}"`
      );
    }
  }

  async handleSubscription(data) {
    if (!this.running) return;
    const config = this.configManager.get();
    if (config.autoMessage && data?.userName) {
      const msg = `@${data.userName} ${config.autoMessageText}`;
      await this.sendChatMessage(msg);
      this.loggerUtil.logAction(
        "auto_message",
        data.userName,
        null,
        "Subscription auto-message",
        `Auto-message sent to subscriber ${data.userName}: "${msg}"`
      );
    }
  }

  async handleRaid(data) {
    if (!this.running) return;
    await this.raidHandler.handleRaid(data, this.configManager.get(), this.sendChatMessage.bind(this));
  }

  async handleStreamOnline(data) {
    if (!this.running) return;
    this.isLive = true;
    if (this.configManager.get().autoStreamMarkers) {
      this.markers.start(this.configManager.get(), this.isLive, this.running);
    }
  }

  async handleStreamOffline(data) {
    await this.offlineHandler.handleStreamOffline(
      data,
      this.configManager.get(),
      this.running,
      this.offlineHandled,
      (val) => { this.offlineHandled = val; }
    );
    this.markers.stop();
    this.isLive = false;
  }

  async handleChatMessage(channel, user, message, msg) {
    if (twitchChatService.currentChannel && channel !== twitchChatService.currentChannel) return;
    if (!this.running) return;

    const config = this.configManager.get();
    const userId = msg.userInfo?.userId;

    this.slowMode.handleMessage(user, userId, config);
    this.chatSpike.handleMessage(config, this.sendChatMessage.bind(this));
  }

  async sendChatMessage(message) {
    if (!twitchChatService.currentChannel) {
      logger.warn("[Automation] Chat not connected, cannot send auto-message");
      return;
    }
    try {
      await twitchChatService.sendChatMessage(message);
      logger.debug(`[Automation] Auto-message sent: "${message}"`);
    } catch (err) {
      logger.error("[Automation] Failed to send auto-message:", err);
    }
  }
}

const automationService = new AutomationService();
module.exports = { automationService, AutomationService };