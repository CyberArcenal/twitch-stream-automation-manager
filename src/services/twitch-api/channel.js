// src/main/services/twitch-api/channel.js
const { logger } = require("../../utils/logger");

function createChannelModule(client) {
  return {
    async getChannelInfo(broadcasterId) {
      logger.debug(`[TwitchApi] getChannelInfo called for broadcasterId=${broadcasterId}`);
      const result = await client.fetchTwitch(`channels?broadcaster_id=${broadcasterId}`);
      logger.debug(`[TwitchApi] getChannelInfo - result ${result.data?.length ? "found" : "not found"}`);
      return result;
    },

    async getStreamTags(broadcasterId) {
      const result = await client.fetchTwitch(`streams/tags?broadcaster_id=${broadcasterId}`);
      return result.data || [];
    },

    async getAllStreamTags(first = 100) {
      const result = await client.fetchTwitch(`tags/streams?first=${first}`);
      return result.data || [];
    },
  };
}

module.exports = { createChannelModule };