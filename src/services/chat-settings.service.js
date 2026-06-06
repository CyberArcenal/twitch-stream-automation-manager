// src/main/services/chat-settings.service.js
//@ts-check
const { twitchApiService } = require("./twitch-api");
const { settingsService } = require("./settings.service");
const { logger } = require("../utils/logger");

class ChatSettingsService {
  constructor() {
    this.slowModeActive = false;
    this.followerModeActive = false;
    this.slowModeTimeout = null;
    this.followerModeTimeout = null;
  }

  /**
   * I-enable o i-disable ang slow mode sa channel
   * @param {string} broadcasterId
   * @param {string} moderatorId
   * @param {boolean} enabled
   * @param {number} delaySeconds - Ilang segundo ang pagitan ng bawat mensahe (default 10)
   */
  async setSlowMode(broadcasterId, moderatorId, enabled, delaySeconds = 10) {
    try {
      await twitchApiService.updateChatSettings(broadcasterId, moderatorId, {
        slow_mode: enabled,
        slow_mode_wait_time: enabled ? delaySeconds : null,
      });
      this.slowModeActive = enabled;
      logger.info(`[ChatSettings] Slow mode ${enabled ? "enabled" : "disabled"} (${delaySeconds}s)`);
      return true;
    } catch (err) {
      logger.error("[ChatSettings] Failed to set slow mode:", err);
      return false;
    }
  }

  /**
   * I-enable o i-disable ang follower-only mode
   * @param {string} broadcasterId
   * @param {string} moderatorId
   * @param {boolean} enabled
   * @param {number} followMinutes - Ilang minuto dapat naka-follow para makapag-chat (default 0 = any follower)
   */
  async setFollowerMode(broadcasterId, moderatorId, enabled, followMinutes = 0) {
    try {
      await twitchApiService.updateChatSettings(broadcasterId, moderatorId, {
        follower_mode: enabled,
        follower_mode_duration: enabled ? followMinutes : null,
      });
      this.followerModeActive = enabled;
      logger.info(`[ChatSettings] Follower mode ${enabled ? "enabled" : "disabled"} (${followMinutes} min follow requirement)`);
      return true;
    } catch (err) {
      logger.error("[ChatSettings] Failed to set follower mode:", err);
      return false;
    }
  }

  /**
   * Auto-disable slow mode pagkatapos ng ilang segundo
   * @param {string} broadcasterId
   * @param {string} moderatorId
   * @param {number} durationSeconds
   */
  scheduleSlowModeDisable(broadcasterId, moderatorId, durationSeconds = 60) {
    if (this.slowModeTimeout) clearTimeout(this.slowModeTimeout);
    this.slowModeTimeout = setTimeout(async () => {
      await this.setSlowMode(broadcasterId, moderatorId, false);
      this.slowModeTimeout = null;
    }, durationSeconds * 1000);
  }

  /**
   * Auto-disable follower mode pagkatapos ng ilang minuto
   * @param {string} broadcasterId
   * @param {string} moderatorId
   * @param {number} durationMinutes
   */
  scheduleFollowerModeDisable(broadcasterId, moderatorId, durationMinutes = 5) {
    if (this.followerModeTimeout) clearTimeout(this.followerModeTimeout);
    this.followerModeTimeout = setTimeout(async () => {
      await this.setFollowerMode(broadcasterId, moderatorId, false);
      this.followerModeTimeout = null;
    }, durationMinutes * 60 * 1000);
  }
}

const chatSettingsService = new ChatSettingsService();
module.exports = { chatSettingsService, ChatSettingsService };