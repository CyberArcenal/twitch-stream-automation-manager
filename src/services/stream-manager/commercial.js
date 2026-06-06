// src/main/services/stream-manager/commercial.js
const { twitchApiService } = require("../twitch-api");
const { logger } = require("../../utils/logger");

class CommercialManager {
  constructor() {
    this.lastCommercialTime = null;
    this.commercialCooldownMs = 8 * 60 * 1000; // 8 minutes
  }

  async runCommercial(broadcasterId, length = 30) {
    logger.info(`[StreamManager] Running ${length}s commercial for ${broadcasterId}`);
    const body = { broadcaster_id: broadcasterId, length };
    const result = await twitchApiService.fetchTwitch("channels/commercial", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    this.lastCommercialTime = Date.now();
    return result;
  }

  getCommercialCooldownRemaining() {
    if (!this.lastCommercialTime) return 0;
    const elapsed = Date.now() - this.lastCommercialTime;
    return Math.max(0, this.commercialCooldownMs - elapsed);
  }
}

module.exports = { CommercialManager };