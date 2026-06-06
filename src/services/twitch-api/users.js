// src/main/services/twitch-api/users.js
const { logger } = require("../../utils/logger");

function createUsersModule(client) {
  return {
    async getCurrentUser() {
      logger.debug("[TwitchApi] getCurrentUser called");
      const result = await client.fetchTwitch("users");
      logger.debug(`[TwitchApi] getCurrentUser - found ${result.data?.length || 0} users`);
      return result;
    },

    async getUserByName(login) {
      logger.debug(`[TwitchApi] getUserByName called for login=${login}`);
      const result = await client.fetchTwitch(`users?login=${login}`);
      const user = result.data?.[0] || null;
      logger.debug(`[TwitchApi] getUserByName - ${user ? "found" : "not found"}`);
      return user;
    },

    async getUserById(userId) {
      logger.debug(`[TwitchApi] getUserById called for userId=${userId}`);
      const result = await client.fetchTwitch(`users?id=${userId}`);
      return result.data?.[0] || null;
    },
  };
}

module.exports = { createUsersModule };