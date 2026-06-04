// src/main/services/automation.service.js
const { eventSubService } = require("./eventsub.service");
const { streamManagerService } = require("./stream-manager.service");
const { twitchChatService } = require("./twitch-chat.service");
const { settingsService } = require("./settings.service");
const { logger } = require("../utils/logger");
const { autoModerationService } = require("./auto-moderation.service");
const { chatSettingsService } = require("./chat-settings.service");
const { twitchApiService } = require("./twitch-api.service");

class AutomationService {
  constructor() {
    this.running = false;
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

      // ✅ bagong config para sa shoutout sa raid
      autoShoutoutOnRaid: false,
      shoutoutMessage:
        "Thanks for the raid @{fromBroadcasterName}! Check them out at twitch.tv/{fromBroadcasterName}",

      autoClipOnChatSpike: false,
      chatSpikeThreshold: 100, // messages per minute
      chatSpikeCooldownMinutes: 5, // cooldown in minutes
      autoStreamMarkers: false,
      markerIntervalMinutes: 30,
    };
    this.listenersAttached = false;
    this.offlineHandled = false;
    this.messageCounts = new Map();
    this.slowModeTriggered = false;
    this.slowModeResetTimer = null;
    this.chatCheckInterval = null;
    this.messageTimestamps = []; // array of timestamps for messages in current channel
    this.lastClipTime = 0; // timestamp ng huling clip trigger
    this.markerTimer = null;
    this.isLive = false;

    logger.info("[Automation] Service created, loading config...");
    this.loadConfig();
  }

  start(config) {
    logger.info("[Automation] start() called, config keys:", Object.keys(config || {}));
    
    // ✅ Check authentication before starting
    const twitchData = settingsService.get("twitch");
    logger.info("[Automation] Twitch data present on start:", {
      hasAccessToken: !!twitchData?.accessToken,
      hasRefreshToken: !!twitchData?.refreshToken,
      userId: twitchData?.userId,
      login: twitchData?.login,
      expiresIn: twitchData?.expiresIn,
    });

    if (!twitchData?.accessToken) {
      logger.error("[Automation] Cannot start: No access token found!");
      throw new Error("Not logged in - access token missing");
    }

    this.config = { ...this.config, ...config };
    this.running = true;
    this.offlineHandled = false;
    this.messageTimestamps = [];
    this.lastClipTime = 0;

    const enableAutoMod = config.autoModerationEnabled === true;
    autoModerationService.setEnabled(enableAutoMod);

    if (enableAutoMod) {
      autoModerationService.updateRules({
        links: config.autoBlockLinks === true,
        blockedWords: config.blockedTerms || [],
        blockedBadges: config.blockedBadges || [],
        repeatWindowSeconds:
          config.repeatWindowSeconds ?? this.config.repeatWindowSeconds ?? 10,
        repeatCountThreshold:
          config.repeatCountThreshold ?? this.config.repeatCountThreshold ?? 3,
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

    if (this.running && this.isLive && this.config.autoStreamMarkers) {
      this.startMarkerTimer();
    }

    this.messageCounts.clear();
    this.slowModeTriggered = false;
    if (this.slowModeResetTimer) clearTimeout(this.slowModeResetTimer);

    this.attachEventListeners();
    this.saveConfig();
    logger.info("[Automation] Started successfully");
  }

  stop() {
    logger.info("[Automation] stop() called, current running:", this.running);
    this.running = false;
    this.offlineHandled = false;
    this.messageCounts.clear();
    if (this.slowModeResetTimer) clearTimeout(this.slowModeResetTimer);
    if (this.chatCheckInterval) {
      clearInterval(this.chatCheckInterval);
      this.chatCheckInterval = null;
    }
    this.stopMarkerTimer();
    logger.info("[Automation] Stopped");
  }

  attachEventListeners() {
    if (this.listenersAttached) {
      logger.debug("[Automation] Event listeners already attached");
      return;
    }
    logger.info("[Automation] Attaching event listeners...");

    eventSubService.on("eventsub:follow", this.handleFollow.bind(this));
    eventSubService.on(
      "eventsub:subscription",
      this.handleSubscription.bind(this),
    );
    eventSubService.on(
      "eventsub:stream-offline",
      this.handleStreamOffline.bind(this),
    );
    eventSubService.on("eventsub:raid", this.handleRaid.bind(this));
    eventSubService.on(
      "eventsub:stream-online",
      this.handleStreamOnline.bind(this),
    );
    eventSubService.on(
      "eventsub:stream-offline",
      this.handleStreamOffline.bind(this),
    );

    if (twitchChatService.chatClient) {
      twitchChatService.chatClient.onMessage(this.handleChatMessage.bind(this));
      logger.debug("[Automation] Chat message listener attached directly");
    } else {
      logger.debug("[Automation] ChatClient not ready, setting up interval to retry");
      this.chatCheckInterval = setInterval(() => {
        if (twitchChatService.chatClient) {
          twitchChatService.chatClient.onMessage(
            this.handleChatMessage.bind(this),
          );
          clearInterval(this.chatCheckInterval);
          this.chatCheckInterval = null;
          logger.debug("[Automation] Chat message listener attached after delay");
        }
      }, 1000);
    }

    this.listenersAttached = true;
    logger.debug("[Automation] Event listeners attached");
  }

  handleStreamOnline(data) {
    logger.debug("[Automation] handleStreamOnline, running:", this.running);
    if (!this.running) return;
    this.isLive = true;
    if (this.config.autoStreamMarkers) {
      this.startMarkerTimer();
    }
  }

  startMarkerTimer() {
    if (this.markerTimer) clearInterval(this.markerTimer);
    const intervalMs = this.config.markerIntervalMinutes * 60 * 1000;
    logger.info(
      `[Automation] Starting stream markers every ${this.config.markerIntervalMinutes} minutes`,
    );
    this.markerTimer = setInterval(async () => {
      await this.createStreamMarker();
    }, intervalMs);
  }

  stopMarkerTimer() {
    if (this.markerTimer) {
      clearInterval(this.markerTimer);
      this.markerTimer = null;
      logger.info("[Automation] Stopped stream markers");
    }
  }

  async createStreamMarker() {
    const broadcasterId = settingsService.get("twitch")?.userId;
    if (!broadcasterId) {
      logger.warn("[Automation] Cannot create stream marker: no broadcaster ID");
      return;
    }
    try {
      const description = `Auto marker (${new Date().toLocaleTimeString()})`;
      await twitchApiService.createStreamMarker(broadcasterId, description);
      logger.info(`[Automation] Stream marker created: "${description}"`);
    } catch (err) {
      logger.error("[Automation] Failed to create stream marker:", err);
    }
  }

  async handleRaid(data) {
    logger.debug("[Automation] handleRaid triggered, running:", this.running, "data:", data);
    if (!this.running) return;

    const broadcasterId = settingsService.get("twitch")?.userId;
    if (!broadcasterId) {
      logger.warn("[Automation] handleRaid: no broadcasterId, skipping");
      return;
    }

    // ✅ Auto-follower mode (kung naka-on)
    if (this.config.autoFollowerMode) {
      logger.info(
        `[Automation] Raid detected, enabling follower mode for ${this.config.followerModeDuration} minutes`,
      );
      try {
        await chatSettingsService.setFollowerMode(
          broadcasterId,
          broadcasterId,
          true,
          0,
        );
        chatSettingsService.scheduleFollowerModeDisable(
          broadcasterId,
          broadcasterId,
          this.config.followerModeDuration,
        );
      } catch (err) {
        logger.error(
          "[Automation] Failed to enable follower mode on raid:",
          err,
        );
      }
    }

    // ✅ Auto-shoutout on raid (kung naka-on)
    if (this.config.autoShoutoutOnRaid && data?.fromBroadcasterName) {
      const fromName = data.fromBroadcasterName;
      let message = this.config.shoutoutMessage;
      message = message.replace(/\{fromBroadcasterName\}/g, fromName);
      await this.sendChatMessage(message);
      logger.info(
        `[Automation] Sent shoutout on raid from ${fromName}: "${message}"`,
      );
    }
  }

  async handleFollow(data) {
    if (!this.running) return;
    if (this.config.autoMessage && data?.followerName) {
      const msg = `@${data.followerName} ${this.config.autoMessageText}`;
      await this.sendChatMessage(msg);
    }
  }

  async handleSubscription(data) {
    if (!this.running) return;
    if (this.config.autoMessage && data?.userName) {
      const msg = `@${data.userName} ${this.config.autoMessageText}`;
      await this.sendChatMessage(msg);
    }
  }

  async handleChatMessage(channel, user, message, msg) {
    if (
      twitchChatService.currentChannel &&
      channel !== twitchChatService.currentChannel
    )
      return;
    if (!this.running) return;
    if (!this.config.autoSlowMode) return;
    if (this.slowModeTriggered) return;

    const now = Date.now();
    const userId = msg.userInfo?.userId;
    const userKey = userId || user;

    let userData = this.messageCounts.get(userKey);
    if (!userData) {
      userData = { count: 0, resetTimer: null };
      this.messageCounts.set(userKey, userData);
    }

    if (userData.resetTimer && now > userData.resetTimer) {
      userData.count = 0;
      userData.resetTimer = null;
    }

    if (!userData.resetTimer) {
      userData.resetTimer = now + 60 * 1000;
    }

    userData.count++;
    logger.debug(
      `[Automation] User ${user} message count: ${userData.count}/${this.config.slowModeSpamThreshold}`,
    );

    if (userData.count >= this.config.slowModeSpamThreshold) {
      logger.info(
        `[Automation] Spam detected from ${user}, enabling slow mode for ${this.config.slowModeDuration} seconds`,
      );
      this.slowModeTriggered = true;

      const broadcasterId = settingsService.get("twitch")?.userId;
      if (broadcasterId) {
        try {
          await chatSettingsService.setSlowMode(
            broadcasterId,
            broadcasterId,
            true,
            this.config.slowModeWaitTime,
          );
          chatSettingsService.scheduleSlowModeDisable(
            broadcasterId,
            broadcasterId,
            this.config.slowModeDuration,
          );
          this.slowModeResetTimer = setTimeout(() => {
            this.slowModeTriggered = false;
            this.slowModeResetTimer = null;
          }, this.config.slowModeDuration * 1000);
        } catch (err) {
          logger.error("[Automation] Failed to enable slow mode:", err);
        }
      }
      this.messageCounts.clear();
    }

    // ✅ Auto-clip on chat spike (kung naka-on at hindi pa sa cooldown)
    if (this.config.autoClipOnChatSpike) {
      const now = Date.now();
      this.messageTimestamps.push(now);
      const oneMinuteAgo = now - 60 * 1000;
      this.messageTimestamps = this.messageTimestamps.filter(
        (ts) => ts > oneMinuteAgo,
      );
      const currentRate = this.messageTimestamps.length;

      const cooldownMs = this.config.chatSpikeCooldownMinutes * 60 * 1000;
      if (
        currentRate >= this.config.chatSpikeThreshold &&
        now - this.lastClipTime >= cooldownMs
      ) {
        logger.info(
          `[Automation] Chat spike detected: ${currentRate} msgs/min. Creating clip.`,
        );
        this.lastClipTime = now;
        const broadcasterId = settingsService.get("twitch")?.userId;
        if (broadcasterId) {
          try {
            const clip = await streamManagerService.createClip(broadcasterId);
            await this.sendChatMessage(
              `📸 Clip created for the hype! ${clip.edit_url}`,
            );
            logger.info(
              `[Automation] Auto-clip created due to chat spike. Clip: ${clip.id}`,
            );
          } catch (err) {
            logger.error(
              "[Automation] Failed to create clip on chat spike:",
              err,
            );
          }
        }
      }
    }
  }

  async handleStreamOffline(data) {
    logger.info("[Automation] handleStreamOffline called, running:", this.running, "offlineHandled:", this.offlineHandled);
    if (!this.running) return;
    if (this.offlineHandled) return;
    this.offlineHandled = true;

    this.stopMarkerTimer();
    this.isLive = false;

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
        logger.error("[Automation] Auto-raid failed:", err);
      }
    }
    if (this.config.autoClip) {
      try {
        await streamManagerService.createClip(broadcasterId);
        logger.info("[Automation] Auto-clip triggered");
      } catch (err) {
        logger.error("[Automation] Auto-clip failed:", err);
      }
    }
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

  loadConfig() {
    const saved = settingsService.get("automationConfig") || {};
    logger.info("[Automation] loadConfig() - saved config keys:", Object.keys(saved));
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
      ...saved,
    };
    logger.debug("[Automation] Final config after load:", {
      autoRaid: this.config.autoRaid,
      autoClip: this.config.autoClip,
      autoModerationEnabled: this.config.autoModerationEnabled,
    });
  }

  saveConfig() {
    logger.debug("[Automation] saveConfig() called");
    settingsService.set("automationConfig", this.config);
  }

  getConfig() {
    const twitchData = settingsService.get("twitch");
    const hasToken = !!twitchData?.accessToken;
    logger.debug("[Automation] getConfig() called, token present:", hasToken);
    if (!hasToken) {
      logger.warn("[Automation] getConfig() - no access token, automation may fail later");
    }
    return { running: this.running, config: this.config };
  }
}

const automationService = new AutomationService();
module.exports = { automationService, AutomationService };