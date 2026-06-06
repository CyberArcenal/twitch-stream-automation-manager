// src/main/services/twitch-api/games.js
const { logger } = require("../../utils/logger");

function createGamesModule(client) {
  return {
    async getGameInfo(gameId) {
      logger.debug(`[TwitchApi] getGameInfo called for gameId=${gameId}`);
      const result = await client.fetchTwitch(`games?id=${gameId}`);
      const game = result.data?.[0] || null;
      logger.debug(`[TwitchApi] getGameInfo - ${game ? "found" : "not found"}`);
      return game ? { data: [game] } : result;
    },
  };
}

module.exports = { createGamesModule };