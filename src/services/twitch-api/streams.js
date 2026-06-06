// src/main/services/twitch-api/streams.js
const { settingsService } = require("../settings");
const { logger } = require("../../utils/logger");

function createStreamsModule(client) {
  return {
    async getStreams(userIds) {
      if (!userIds || userIds.length === 0) {
        logger.debug("[TwitchApi] getStreams called with empty userIds, returning empty");
        return { data: [] };
      }
      logger.debug(`[TwitchApi] getStreams called for ${userIds.length} user IDs`);
      const params = new URLSearchParams();
      userIds.forEach((id) => params.append("user_id", id));
      const result = await client.fetchTwitch(`streams?${params}`);
      logger.debug(`[TwitchApi] getStreams - found ${result.data?.length || 0} live streams`);
      return result;
    },

    async getTopStreams(first = 100, after = null) {
      logger.debug(`[TwitchApi] getTopStreams called first=${first}, after=${after}`);
      const params = new URLSearchParams({
        first: String(Math.min(first, 100)),
        type: "live",
      });
      if (after) params.append("after", after);
      const result = await client.fetchTwitch(`streams?${params}`);
      logger.debug(`[TwitchApi] getTopStreams - got ${result.data?.length || 0} streams`);
      return result;
    },

    async getTopStreamsWithFilters(first = 100, after = null, gameId = null, language = null) {
      logger.debug(`[TwitchApi] getTopStreamsWithFilters first=${first}, after=${after}, gameId=${gameId}, language=${language}`);
      const params = new URLSearchParams({
        first: String(Math.min(first, 100)),
        type: "live",
      });
      if (after) params.append("after", after);
      if (gameId) params.append("game_id", gameId);
      if (language) params.append("language", language);
      const result = await client.fetchTwitch(`streams?${params}`);
      logger.debug(`[TwitchApi] getTopStreamsWithFilters - got ${result.data?.length || 0} streams`);
      return result;
    },

    async getFollowedStreams(userId, limit = 100) {
      logger.info(`[TwitchApi] getFollowedStreams called for userId=${userId}, limit=${limit}`);
      try {
        const followedResponse = await this.getFollowedChannels(userId);
        if (!followedResponse?.data || followedResponse.data.length === 0) {
          logger.info("[TwitchApi] getFollowedStreams - no followed channels found");
          return { data: [] };
        }

        const broadcasterIds = followedResponse.data.map(channel => channel.broadcaster_id);
        const limitedIds = broadcasterIds.slice(0, Math.min(limit, 100));
        logger.debug(`[TwitchApi] getFollowedStreams - fetching streams for ${limitedIds.length} broadcasters`);
        const streamsResponse = await this.getStreams(limitedIds);
        logger.info(`[TwitchApi] getFollowedStreams - found ${streamsResponse?.data?.length || 0} live followed streams`);
        return streamsResponse;
      } catch (error) {
        logger.error("[TwitchApi] getFollowedStreams - error:", error);
        throw error;
      }
    },

    async getStreamKey() {
      const userId = settingsService.get("twitch")?.userId;
      if (!userId) {
        logger.error("[TwitchApi] getStreamKey - no userId in settings");
        throw new Error("Not logged in");
      }
      logger.debug(`[TwitchApi] getStreamKey called for userId=${userId}`);
      const result = await client.fetchTwitch(`streams/key?broadcaster_id=${userId}`);
      logger.info("[TwitchApi] getStreamKey - success (key obtained)");
      return result;
    },

    async createStreamMarker(broadcasterId, description) {
      if (!description || description.trim() === "") {
        throw new Error("Marker description is required");
      }
      const body = {
        user_id: broadcasterId,
        description: description.trim(),
      };
      return await client.fetchTwitch("streams/markers", {
        method: "POST",
        body: JSON.stringify(body),
      });
    },

    async getIngestServers() {
      logger.debug("[TwitchApi] getIngestServers called");
      const result = await client.fetchTwitch("ingests");
      logger.debug(`[TwitchApi] getIngestServers - found ${result.data?.length || 0} ingest servers`);
      return result;
    },
  };
}

module.exports = { createStreamsModule };