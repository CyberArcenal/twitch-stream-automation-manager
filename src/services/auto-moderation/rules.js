// services/auto-moderation/rules.js
const { logger } = require("../../utils/logger");

class ModerationRules {
  constructor(settings) {
    this.settings = settings;
    this.userMessageHistory = new Map(); // userId -> array of { message, timestamp }
  }

  isTrustedUser(userName) {
    return this.settings.rules.trustedUsers.includes(userName.toLowerCase());
  }

  hasBlockedBadge(badges) {
    if (!badges || !this.settings.rules.blockedBadges.length) return null;
    for (const badgeName of this.settings.rules.blockedBadges) {
      if (badges[badgeName]) return badgeName;
    }
    return null;
  }

  isRepeatedMessage(userId, message) {
    const now = Date.now();
    const windowMs = this.settings.rules.repeatWindowSeconds * 1000;
    const threshold = this.settings.rules.repeatCountThreshold;

    if (windowMs <= 0 || threshold <= 0) return false;

    let history = this.userMessageHistory.get(userId) || [];
    history = history.filter(entry => now - entry.timestamp < windowMs);
    history.push({ message, timestamp: now });
    this.userMessageHistory.set(userId, history);

    const count = history.filter(entry => entry.message === message).length;
    const isRepeat = count >= threshold;
    if (isRepeat) {
      logger.debug(`[AutoMod] Repeated message for user ${userId}: ${message} (count=${count})`);
    }
    return isRepeat;
  }

  containsLink(message) {
    return this.settings.rules.links && /https?:\/\//i.test(message);
  }

  excessiveCaps(message) {
    if (this.settings.rules.maxCapsPercent <= 0) return false;
    const letters = (message.match(/\p{L}/gu) || []).length;
    const caps = (message.match(/\p{Lu}/gu) || []).length;
    if (letters > 5 && (caps / letters) * 100 > this.settings.rules.maxCapsPercent) {
      return true;
    }
    return false;
  }

  excessiveEmojis(message) {
    if (this.settings.rules.maxEmojis <= 0) return false;
    const emojiRegex = /[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu;
    const emojis = message.match(emojiRegex) || [];
    return emojis.length > this.settings.rules.maxEmojis;
  }

  containsBlockedWord(message) {
    if (this.settings.rules.blockedWords.length === 0) return null;
    const lowerMsg = message.toLowerCase();
    for (const word of this.settings.rules.blockedWords) {
      if (lowerMsg.includes(word)) return word;
    }
    return null;
  }

  evaluateMessage(userId, userName, message, badges) {
    // Priority order (higher first)
    const blockedBadge = this.hasBlockedBadge(badges);
    if (blockedBadge) {
      return { violation: "blocked_badge", reason: `Blocked badge: ${blockedBadge}`, timeout: 60 };
    }

    if (this.isRepeatedMessage(userId, message)) {
      return { violation: "repeat", reason: "Repeated message (spam)", timeout: 60 };
    }

    if (this.containsLink(message)) {
      return { violation: "link", reason: "Link posted", timeout: 300 };
    }

    if (this.excessiveCaps(message)) {
      return { violation: "caps", reason: "Excessive caps", timeout: 60 };
    }

    if (this.excessiveEmojis(message)) {
      return { violation: "emojis", reason: "Too many emojis", timeout: 60 };
    }

    const blockedWord = this.containsBlockedWord(message);
    if (blockedWord) {
      return { violation: "blocked_word", reason: `Blocked word: ${blockedWord}`, timeout: 300 };
    }

    return null; // no violation
  }
}

module.exports = { ModerationRules };