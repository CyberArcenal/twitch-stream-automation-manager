// src/main/services/twitch-api/bits.js
const { logger } = require("../../utils/logger");

function createBitsModule(client) {
  return {
    async getBitsLeaderboard(broadcasterId, count = 10) {
      const params = new URLSearchParams({
        count: String(Math.min(count, 100)),
        period: "week",
      });
      if (broadcasterId) params.append("user_id", broadcasterId);
      return await client.fetchTwitch(`bits/leaderboard?${params}`);
    },
  };
}

module.exports = { createBitsModule };