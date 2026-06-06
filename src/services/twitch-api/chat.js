// src/main/services/twitch-api/chat.js
const { logger } = require("../../utils/logger");

function createChatModule(client) {
  return {
    async getChatSettings(broadcasterId, moderatorId) {
      logger.debug(`[TwitchApi] getChatSettings called for broadcaster=${broadcasterId}, moderator=${moderatorId}`);
      const params = new URLSearchParams({
        broadcaster_id: broadcasterId,
        moderator_id: moderatorId,
      });
      const result = await client.fetchTwitch(`chat/settings?${params}`);
      logger.debug(`[TwitchApi] getChatSettings - success`);
      return result;
    },

    async updateChatSettings(broadcasterId, moderatorId, settings) {
      logger.info(`[TwitchApi] updateChatSettings called for broadcaster=${broadcasterId}`, settings);
      const params = new URLSearchParams({
        broadcaster_id: broadcasterId,
        moderator_id: moderatorId,
      });
      const result = await client.fetchTwitch(`chat/settings?${params}`, {
        method: "PATCH",
         headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
      });
      logger.info(`[TwitchApi] updateChatSettings - success`);
      return result;
    },

    async getChatters(broadcasterId, moderatorId) {
      const params = new URLSearchParams({
        broadcaster_id: broadcasterId,
        moderator_id: moderatorId,
        first: 100,
      });
      return await client.fetchTwitch(`chat/chatters?${params}`);
    },

    async addBlockedTerm(broadcasterId, moderatorId, term) {
      const body = { term };
      return await client.fetchTwitch(
        `moderation/blocked_terms?broadcaster_id=${broadcasterId}&moderator_id=${moderatorId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );
    },

    async removeBlockedTerm(broadcasterId, termId) {
      const params = new URLSearchParams({
        broadcaster_id: broadcasterId,
        id: termId,
      });
      return await client.fetchTwitch(`moderation/blocked_terms?${params}`, {
        method: "DELETE",
      });
    },
  };
}

module.exports = { createChatModule };