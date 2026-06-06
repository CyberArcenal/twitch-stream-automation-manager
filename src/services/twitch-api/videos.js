// src/main/services/twitch-api/videos.js
const { logger } = require("../../utils/logger");

function createVideosModule(client) {
  return {
    async getVideos(userId, type = "archive", first = 20, after = null) {
      logger.debug(`[TwitchApi] getVideos called userId=${userId}, type=${type}, first=${first}, after=${after}`);
      const params = new URLSearchParams({
        user_id: userId,
        type: type,
        first: String(Math.min(first, 100)),
      });
      if (after) params.append("after", after);
      const result = await client.fetchTwitch(`videos?${params}`);
      logger.debug(`[TwitchApi] getVideos - found ${result.data?.length || 0} videos`);
      return result;
    },
  };
}

module.exports = { createVideosModule };