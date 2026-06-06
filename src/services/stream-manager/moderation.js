// src/main/services/stream-manager/moderation.js
const { twitchApiService } = require("../twitch-api");
const { logger } = require("../../utils/logger");

class ModerationManager {
  async banUser(broadcasterId, moderatorId, userName) {
    const user = await twitchApiService.getUserByName(userName);
    if (!user) throw new Error("User not found");
    const body = {
      broadcaster_id: broadcasterId,
      moderator_id: moderatorId,
      data: { user_id: user.id },
    };
    await twitchApiService.fetchTwitch("moderation/bans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return true;
  }

  async unbanUser(broadcasterId, moderatorId, userName) {
    const user = await twitchApiService.getUserByName(userName);
    if (!user) throw new Error("User not found");
    const params = new URLSearchParams({
      broadcaster_id: broadcasterId,
      moderator_id: moderatorId,
      user_id: user.id,
    });
    await twitchApiService.fetchTwitch(`moderation/bans?${params}`, {
      method: "DELETE",
    });
    return true;
  }

  async timeoutUser(broadcasterId, moderatorId, userName, durationSeconds) {
    const user = await twitchApiService.getUserByName(userName);
    if (!user) throw new Error("User not found");
    const body = {
      broadcaster_id: broadcasterId,
      moderator_id: moderatorId,
      data: { user_id: user.id, duration: durationSeconds },
    };
    await twitchApiService.fetchTwitch("moderation/bans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return true;
  }

  async clearChat(broadcasterId, moderatorId) {
    const params = new URLSearchParams({
      broadcaster_id: broadcasterId,
      moderator_id: moderatorId,
    });
    await twitchApiService.fetchTwitch(`moderation/chat?${params}`, {
      method: "DELETE",
    });
    return true;
  }

  async deleteMessage(broadcasterId, moderatorId, messageId) {
    const params = new URLSearchParams({
      broadcaster_id: broadcasterId,
      moderator_id: moderatorId,
      message_id: messageId,
    });
    await twitchApiService.fetchTwitch(`moderation/chat?${params}`, {
      method: "DELETE",
    });
    return true;
  }

  async getModerators(broadcasterId) {
    try {
      const params = new URLSearchParams({ broadcaster_id: broadcasterId });
      const result = await twitchApiService.fetchTwitch(`moderation/moderators?${params}`);
      return result.data || [];
    } catch (err) {
      logger.warn("[ModerationManager] getModerators error:", err.message);
      return [];
    }
  }

  async addModerator(broadcasterId, userId) {
    if (broadcasterId === userId) {
      logger.info("[ModerationManager] Skipping addModerator for self");
      return true;
    }
    const params = new URLSearchParams({
      broadcaster_id: broadcasterId,
      user_id: userId,
    });
    await twitchApiService.fetchTwitch(`moderation/moderators?${params}`, {
      method: "POST",
    });
    return true;
  }

  async removeModerator(broadcasterId, userId) {
    const params = new URLSearchParams({
      broadcaster_id: broadcasterId,
      user_id: userId,
    });
    await twitchApiService.fetchTwitch(`moderation/moderators?${params}`, {
      method: "DELETE",
    });
    return true;
  }

  async sendShoutout(fromBroadcasterId, toBroadcasterId, moderatorId) {
    const params = new URLSearchParams({
      from_broadcaster_id: fromBroadcasterId,
      to_broadcaster_id: toBroadcasterId,
      moderator_id: moderatorId,
    });
    await twitchApiService.fetchTwitch(`chat/shoutouts?${params}`, {
      method: "POST",
    });
    return true;
  }
}

module.exports = { ModerationManager };