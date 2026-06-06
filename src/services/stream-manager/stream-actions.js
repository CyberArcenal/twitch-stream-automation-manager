// src/main/services/stream-manager/stream-actions.js
const { twitchApiService } = require("../twitch-api");
const { logger } = require("../../utils/logger");

class StreamActions {
  async updateStreamInfo(broadcasterId, data) {
    logger.info(`[StreamManager] Updating stream info for ${broadcasterId}`, data);
    const body = {
      title: data.title,
      game_id: data.game_id,
      go_live_notification: data.go_live_notification,
      broadcaster_language: data.broadcaster_language,
      tags: data.tags,
      is_branded_content: data.is_branded_content,
      content_classification_labels: data.content_classification_labels,
      is_rerun: data.is_rerun,
    };
    Object.keys(body).forEach(key => body[key] === undefined && delete body[key]);
    const params = new URLSearchParams({ broadcaster_id: broadcasterId });
    await twitchApiService.fetchTwitch(`channels?${params}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    logger.success("[StreamManager] Stream info updated");
    return true;
  }

  async createClip(broadcasterId) {
    logger.info(`[StreamManager] Creating clip for ${broadcasterId}`);
    const params = new URLSearchParams({ broadcaster_id: broadcasterId });
    const result = await twitchApiService.fetchTwitch(`clips?${params}`, { method: "POST" });
    const clip = result.data?.[0];
    if (!clip) throw new Error("Failed to create clip");
    logger.success("[StreamManager] Clip created", clip);
    return clip;
  }

  async startRaid(fromBroadcasterId, toBroadcasterLogin) {
    logger.info(`[StreamManager] Raiding ${toBroadcasterLogin}`);
    const user = await twitchApiService.getUserByName(toBroadcasterLogin);
    if (!user) throw new Error("Target channel not found");
    const body = {
      from_broadcaster_id: fromBroadcasterId,
      to_broadcaster_id: user.id,
    };
    await twitchApiService.fetchTwitch("raids", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    logger.success(`[StreamManager] Raid started to ${toBroadcasterLogin}`);
    return true;
  }
}

module.exports = { StreamActions };