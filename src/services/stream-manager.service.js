// src/main/services/stream-manager.service.js
const { twitchApiService } = require("./twitch-api.service");
const { settingsService } = require("./settings.service");
const Store = require("electron-store");
const { logger } = require("../utils/logger");

class StreamManagerService {
  constructor() {
    this.goalsStore = new Store({ name: "streamGoals" });
    this.lastCommercialTime = null;
    this.commercialCooldownMs = 8 * 60 * 1000; // 8 minutes default

    const { eventSubService } = require("./eventsub.service");
    eventSubService.on("eventsub:follow", this.onFollowEvent.bind(this));
    eventSubService.on(
      "eventsub:subscription",
      this.onSubscriptionEvent.bind(this),
    );
    eventSubService.on("eventsub:bits", this.onBitsEvent.bind(this));
  }

  async onFollowEvent(data) {
    // I‑update ang anumang goal na may unit na "followers"
    await this.incrementGoalProgress("followers", 1);
  }

  async onSubscriptionEvent(data) {
    // I‑update ang subscriber goal (kung ang goal ay "subscribers")
    await this.incrementGoalProgress("subscribers", 1);
  }

  async onBitsEvent(data) {
    // I‑update ang bits goal (kung ang goal ay "bits")
    const amount = data.amount || data.bits || 0;
    if (amount > 0) await this.incrementGoalProgress("bits", amount);
  }

  async incrementGoalProgress(unit, amount) {
    const goals = this.getGoals();
    let updated = false;
    for (const goal of goals) {
      if (goal.unit === unit && goal.current < goal.target) {
        goal.current = Math.min(goal.current + amount, goal.target);
        updated = true;
      }
    }
    if (updated) {
      this.goalsStore.set("goals", goals);
      // I‑broadcast ang update sa lahat ng renderer
      const { BrowserWindow } = require("electron");
      BrowserWindow.getAllWindows().forEach((win) => {
        if (!win.isDestroyed()) {
          win.webContents.send("goal:progress-updated", { unit, amount });
        }
      });
    }
  }

  async updateStreamInfo(broadcasterId, data) {
    logger.info(
      `[StreamManager] Updating stream info for ${broadcasterId}`,
      data,
    );

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

    // Remove undefined fields
    Object.keys(body).forEach(
      (key) => body[key] === undefined && delete body[key],
    );

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
    const result = await twitchApiService.fetchTwitch(`clips?${params}`, {
      method: "POST",
    });
    const clip = result.data?.[0];
    if (!clip) throw new Error("Failed to create clip");
    logger.success("[StreamManager] Clip created", clip);
    return clip; // { id, edit_url }
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

  async _runCommercial(broadcasterId, length = 30) {
    logger.info(
      `[StreamManager] Running ${length}s commercial for ${broadcasterId}`,
    );
    const body = { broadcaster_id: broadcasterId, length };
    return await twitchApiService.fetchTwitch("channels/commercial", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  }

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

  async unbanUser(broadcasterId, userName) {
    const user = await twitchApiService.getUserByName(userName);
    if (!user) throw new Error("User not found");

    const params = new URLSearchParams({
      broadcaster_id: broadcasterId,
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

  async getModerators(broadcasterId) {
    try {
      const params = new URLSearchParams({ broadcaster_id: broadcasterId });
      const result = await twitchApiService.fetchTwitch(
        `moderation/moderators?${params}`,
      );
      return result.data || [];
    } catch (err) {
      logger.warn("[StreamManager] getModerators error:", err.message);
      return [];
    }
  }

  async addModerator(broadcasterId, userId) {
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

  // Goals (local storage)
  getGoals() {
    return this.goalsStore.get("goals", []);
  }

  addGoal(goal) {
    const goals = this.getGoals();
    const newGoal = {
      id: Date.now().toString(),
      ...goal,
      createdAt: new Date().toISOString(),
    };
    goals.push(newGoal);
    this.goalsStore.set("goals", goals);
    return newGoal;
  }

  updateGoalProgress(goalId, currentValue) {
    const goals = this.getGoals();
    const goal = goals.find((g) => g.id === goalId);
    if (goal) {
      goal.current = currentValue;
      this.goalsStore.set("goals", goals);
    }
  }

  deleteGoal(goalId) {
    const goals = this.goalsStore
      .get("goals", [])
      .filter((g) => g.id !== goalId);
    this.goalsStore.set("goals", goals);
  }

  getStreamKey() {
    return this.goalsStore.get("streamKey", null);
  }

  saveStreamKey(key) {
    this.goalsStore.set("streamKey", key);
  }

  async runCommercial(broadcasterId, length = 30) {
    const result = await this._runCommercial(broadcasterId, length);
    this.lastCommercialTime = Date.now();
    this.goalsStore.set("lastCommercialTime", this.lastCommercialTime);
    return result;
  }

  getCommercialCooldownRemaining() {
    const lastTime = this.goalsStore.get("lastCommercialTime");
    if (!lastTime) return 0;
    const elapsed = Date.now() - lastTime;
    return Math.max(0, this.commercialCooldownMs - elapsed);
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

  setStreamStartTime(timestamp) {
    this.goalsStore.set("streamStartTime", timestamp);
  }

  getStreamStartTime() {
    return this.goalsStore.get("streamStartTime");
  }

  getStreamElapsedHours() {
    const startTime = this.getStreamStartTime();
    if (!startTime) return 0;
    return (Date.now() - startTime) / (1000 * 60 * 60);
  }

  shouldShowTitleReminder() {
    const hours = this.getStreamElapsedHours();
    return hours >= 2;
  }

  clearStreamStartTime() {
    this.goalsStore.delete("streamStartTime");
  }
}

const streamManagerService = new StreamManagerService();
module.exports = { streamManagerService };
