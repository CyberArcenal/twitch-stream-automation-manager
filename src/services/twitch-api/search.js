// src/main/services/twitch-api/search.js
const { logger } = require("../../utils/logger");

function createSearchModule(client) {
  return {
    async searchChannels(query, first = 20) {
      logger.debug(`[TwitchApi] searchChannels called query="${query}", first=${first}`);
      const params = new URLSearchParams({
        query,
        first: String(Math.min(first, 100)),
      });
      const result = await client.fetchTwitch(`search/channels?${params}`);
      logger.debug(`[TwitchApi] searchChannels - found ${result.data?.length || 0} channels`);
      return result;
    },

    async searchCategories(query, first = 20) {
      logger.debug(`[TwitchApi] searchCategories called query="${query}", first=${first}`);
      const params = new URLSearchParams({
        query,
        first: String(Math.min(first, 100)),
      });
      const result = await client.fetchTwitch(`search/categories?${params}`);
      logger.debug(`[TwitchApi] searchCategories - found ${result.data?.length || 0} categories`);
      return result;
    },

    async searchStreams(query, first = 20) {
      logger.debug(`[TwitchApi] searchStreams called query="${query}", first=${first}`);
      const channels = await this.searchChannels(query, first);
      const channelIds = channels.data.map(c => c.id);
      if (channelIds.length === 0) {
        logger.debug("[TwitchApi] searchStreams - no channels found, returning empty");
        return { data: [] };
      }
      const streams = await this.getStreams(channelIds);
      logger.debug(`[TwitchApi] searchStreams - found ${streams.data?.length || 0} streams`);
      return streams;
    },
  };
}

module.exports = { createSearchModule };