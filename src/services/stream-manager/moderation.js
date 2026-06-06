// src/main/services/stream-manager/moderation.js
//@ts-check
const { twitchApiService } = require("../twitch-api");
const { logger } = require("../../utils/logger");
const { moderationLogService } = require("../moderation-log");
const { LogCategory } = require("../log");
const { chatHistoryService } = require("../chat-history");

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

    moderationLogService.addLog(
      "ban",
      broadcasterId,
      user.id,
      userName,
      null,
      "Manual ban",
      LogCategory.MODERATION,
      `${userName} banned manually`,
    );

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

    moderationLogService.addLog(
      "unban",
      broadcasterId,
      user.id,
      userName,
      null,
      "Manual unban",
      LogCategory.MODERATION,
      `${userName} unbanned manually`,
    );

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

    moderationLogService.addLog(
      "timeout",
      broadcasterId,
      user.id,
      userName,
      durationSeconds,
      "Manual timeout",
      LogCategory.MODERATION,
      `${userName} timed out for ${durationSeconds}s manually`,
    );

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

    moderationLogService.addLog(
      "clear",
      broadcasterId,
      null,
      "system",
      null,
      "Chat cleared manually",
      LogCategory.MODERATION,
      "Chat cleared manually",
    );

    return true;
  }

  async deleteMessage(broadcasterId, moderatorId, messageId) {
    // 1. Hanapin ang message sa chat history
    let targetUserId = null;
    let targetUserName = "unknown";

    try {
      const message = chatHistoryService.getMessageById?.(messageId);
      if (message) {
        targetUserName = message.user || "unknown";
        targetUserId = message.userId || null;
      } else {
        logger.warn(
          `[ModerationManager] Message ${messageId} not found in history, using fallback`,
        );
      }
    } catch (err) {
      logger.error(
        `[ModerationManager] Failed to look up message ${messageId}:`,
        err,
      );
    }

    // 2. I-delete ang message sa Twitch
    const params = new URLSearchParams({
      broadcaster_id: broadcasterId,
      moderator_id: moderatorId,
      message_id: messageId,
    });
    await twitchApiService.fetchTwitch(`moderation/chat?${params}`, {
      method: "DELETE",
    });

    // 3. Mag-log gamit ang nakuha na username/userId
    moderationLogService.addLog(
      "delete",
      broadcasterId,
      targetUserId,
      targetUserName,
      null,
      "Message deleted manually",
      LogCategory.MODERATION,
      `Message ${messageId} deleted manually`,
    );

    return true;
  }

  async getModerators(broadcasterId) {
    try {
      const params = new URLSearchParams({ broadcaster_id: broadcasterId });
      const result = await twitchApiService.fetchTwitch(
        `moderation/moderators?${params}`,
      );
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
