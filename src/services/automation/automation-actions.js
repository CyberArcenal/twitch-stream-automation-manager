//@ts-check
const { streamManagerService } = require("../stream-manager");
const { twitchChatService } = require("../chat");
const { twitchApiService } = require("../twitch-api");
const { settingsService } = require("../settings");
const { logger } = require("../../utils/logger");

class AutomationActions {
  async sendChatMessage(message) {
    if (!twitchChatService.currentChannel) {
      logger.warn("[AutomationActions] Chat not connected, cannot send auto-message");
      return;
    }
    try {
      await twitchChatService.sendChatMessage(message);
      logger.debug(`[AutomationActions] Auto-message sent: "${message}"`);
    } catch (err) {
      logger.error("[AutomationActions] Failed to send auto-message:", err);
    }
  }

  async createStreamMarker() {
    const broadcasterId = settingsService.get("twitch")?.userId;
    if (!broadcasterId) {
      logger.warn("[AutomationActions] Cannot create stream marker: no broadcaster ID");
      return;
    }
    try {
      const description = `Auto marker (${new Date().toLocaleTimeString()})`;
      await twitchApiService.createStreamMarker(broadcasterId, description);
      logger.info(`[AutomationActions] Stream marker created: "${description}"`);
    } catch (err) {
      logger.error("[AutomationActions] Failed to create stream marker:", err);
    }
  }

  async createClip() {
    const broadcasterId = settingsService.get("twitch")?.userId;
    if (!broadcasterId) {
      logger.warn("[AutomationActions] Cannot create clip: no broadcaster ID");
      return null;
    }
    try {
      const clip = await streamManagerService.createClip(broadcasterId);
      logger.info(`[AutomationActions] Clip created: ${clip.id}`);
      return clip;
    } catch (err) {
      logger.error("[AutomationActions] Failed to create clip:", err);
      return null;
    }
  }

  async startRaid(raidTarget) {
    const broadcasterId = settingsService.get("twitch")?.userId;
    if (!broadcasterId) {
      logger.warn("[AutomationActions] Cannot start raid: no broadcaster ID");
      return;
    }
    try {
      await streamManagerService.startRaid(broadcasterId, raidTarget);
      logger.info(`[AutomationActions] Raid started to ${raidTarget}`);
    } catch (err) {
      logger.error("[AutomationActions] Failed to start raid:", err);
    }
  }
}

module.exports = { AutomationActions };
