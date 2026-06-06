// services/auto-moderation/index.js
const { logger } = require("../../utils/logger");
const { ModerationSettings } = require("./settings");
const { ModerationRules } = require("./rules");
const { ModerationActions } = require("./actions");

class AutoModerationService {
  constructor() {
    this.settings = new ModerationSettings();
    this.rules = new ModerationRules(this.settings);
    this.actions = new ModerationActions(this.settings);
    this.settings.load();
  }

  // --- Public API ---
  setEnabled(enabled) {
    this.settings.setEnabled(enabled);
    logger.info(`[AutoMod] ${enabled ? "Enabled" : "Disabled"}`);
  }

  setAutoDeleteMessage(enabled) {
    this.settings.setAutoDeleteMessage(enabled);
  }

  setAutoTimeoutUser(enabled) {
    this.settings.setAutoTimeoutUser(enabled);
  }

  setLevel(level) {
    this.settings.setLevel(level);
  }

  updateRules(newRules) {
    this.settings.updateRules(newRules);
  }

  addTrustedUser(username) {
    const lower = username.toLowerCase();
    if (!this.settings.rules.trustedUsers.includes(lower)) {
      this.settings.rules.trustedUsers.push(lower);
      this.settings.save();
      logger.info(`[AutoMod] Added trusted user: ${username}`);
    }
  }

  removeTrustedUser(username) {
    const lower = username.toLowerCase();
    const before = this.settings.rules.trustedUsers.length;
    this.settings.rules.trustedUsers = this.settings.rules.trustedUsers.filter(u => u !== lower);
    if (this.settings.rules.trustedUsers.length < before) {
      this.settings.save();
      logger.info(`[AutoMod] Removed trusted user: ${username}`);
    }
  }

  getConfig() {
    return {
      enabled: this.settings.enabled,
      level: this.settings.level,
      rules: this.settings.rules,
      autoDeleteMessage: this.settings.autoDeleteMessage,
      autoTimeoutUser: this.settings.autoTimeoutUser,
    };
  }

  /**
   * Process a chat message.
   * @returns {Promise<{shouldSuppress: boolean, reason?: string, actionTaken?: boolean}>}
   */
  async processMessage(channel, userId, userName, message, broadcasterId, msg) {
    logger.debug(`[AutoMod] Processing message from ${userName}: "${message}"`);

    if (!this.settings.enabled) {
      logger.debug("[AutoMod] Disabled, skipping checks");
      return { shouldSuppress: false };
    }

    if (this.rules.isTrustedUser(userName)) {
      logger.debug(`[AutoMod] User ${userName} is trusted, skipping checks`);
      return { shouldSuppress: false };
    }

    if (!broadcasterId) {
      logger.warn("[AutoMod] Missing broadcasterId, cannot process");
      return { shouldSuppress: false };
    }

    // Extract badges from msg (if available)
    let badges = null;
    try {
      if (msg.userInfo?.badges) badges = msg.userInfo.badges;
    } catch (e) {
      // ignore
    }

    const violation = this.rules.evaluateMessage(userId, userName, message, badges);
    if (!violation) {
      logger.debug(`[AutoMod] Message from ${userName} passed all checks`);
      return { shouldSuppress: false };
    }

    // Take action
    const { actionTaken, reason, error } = await this.actions.takeAction(
      broadcasterId, userId, userName, msg.id, violation
    );

    if (actionTaken) {
      return {
        shouldSuppress: true,
        reason: violation.reason,
        actionTaken: true,
      };
    } else if (error) {
      // Log but don't suppress if action failed? Usually we still suppress to be safe.
      return {
        shouldSuppress: true,
        reason: violation.reason,
        actionTaken: false,
        error,
      };
    }

    // Fallback: suppress anyway (e.g., if actions disabled but we still want to hide message)
    if (!this.settings.autoDeleteMessage && !this.settings.autoTimeoutUser) {
      // No action taken, but still should suppress? Usually yes.
      return { shouldSuppress: true, reason: violation.reason };
    }

    return { shouldSuppress: false };
  }
}

// Singleton instance
const autoModerationService = new AutoModerationService();
module.exports = { autoModerationService, AutoModerationService };