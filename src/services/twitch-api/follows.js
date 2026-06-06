// src/main/services/twitch-api/follows.js
const { logger } = require("../../utils/logger");

function createFollowsModule(client) {
  return {
    async getFollowedChannels(userId, after = null) {
      logger.debug(`[TwitchApi] getFollowedChannels called for userId=${userId}, after=${after}`);
      const params = new URLSearchParams({
        user_id: userId,
        first: "100",
      });
      if (after) params.append("after", after);
      const result = await client.fetchTwitch(`channels/followed?${params}`);
      logger.debug(`[TwitchApi] getFollowedChannels - got ${result.data?.length || 0} entries, total=${result.total || "?"}`);
      return result;
    },
  };
}

module.exports = { createFollowsModule };