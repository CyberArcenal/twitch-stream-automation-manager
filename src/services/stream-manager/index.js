// src/main/services/stream-manager/index.js
const { GoalsManager } = require("./goals");
const { ModerationManager } = require("./moderation");
const { StreamActions } = require("./stream-actions");
const { CommercialManager } = require("./commercial");
const { logger } = require("../../utils/logger");

class StreamManagerService {
  constructor() {
    this.goals = new GoalsManager();
    this.moderation = new ModerationManager();
    this.streamActions = new StreamActions();
    this.commercial = new CommercialManager();

    // Listen to EventSub events to auto‑increment goals
    const { eventSubService } = require("../eventsub");
    eventSubService.on("eventsub:follow", (data) => {
      this.goals.incrementGoalProgress("followers", 1);
    });
    eventSubService.on("eventsub:subscription", (data) => {
      this.goals.incrementGoalProgress("subscribers", 1);
    });
    eventSubService.on("eventsub:bits", (data) => {
      const amount = data.amount || data.bits || 0;
      if (amount > 0) this.goals.incrementGoalProgress("bits", amount);
    });
  }

  // Stream info methods
  async updateStreamInfo(broadcasterId, data) {
    return this.streamActions.updateStreamInfo(broadcasterId, data);
  }

  async createClip(broadcasterId) {
    return this.streamActions.createClip(broadcasterId);
  }

  async startRaid(fromBroadcasterId, toBroadcasterLogin) {
    return this.streamActions.startRaid(fromBroadcasterId, toBroadcasterLogin);
  }

  // Moderation methods
  async banUser(broadcasterId, moderatorId, userName) {
    return this.moderation.banUser(broadcasterId, moderatorId, userName);
  }

  async unbanUser(broadcasterId, moderatorId, userName) {
    return this.moderation.unbanUser(broadcasterId, moderatorId, userName);
  }

  async timeoutUser(broadcasterId, moderatorId, userName, durationSeconds) {
    return this.moderation.timeoutUser(broadcasterId, moderatorId, userName, durationSeconds);
  }

  async clearChat(broadcasterId, moderatorId) {
    return this.moderation.clearChat(broadcasterId, moderatorId);
  }

  async deleteMessage(broadcasterId, moderatorId, messageId) {
    return this.moderation.deleteMessage(broadcasterId, moderatorId, messageId);
  }

  async getModerators(broadcasterId) {
    return this.moderation.getModerators(broadcasterId);
  }

  async addModerator(broadcasterId, userId) {
    return this.moderation.addModerator(broadcasterId, userId);
  }

  async removeModerator(broadcasterId, userId) {
    return this.moderation.removeModerator(broadcasterId, userId);
  }

  async sendShoutout(fromBroadcasterId, toBroadcasterId, moderatorId) {
    return this.moderation.sendShoutout(fromBroadcasterId, toBroadcasterId, moderatorId);
  }

  // Commercial methods
  async runCommercial(broadcasterId, length = 30) {
    return this.commercial.runCommercial(broadcasterId, length);
  }

  getCommercialCooldownRemaining() {
    return this.commercial.getCommercialCooldownRemaining();
  }

  // Goals methods
  getGoals() {
    return this.goals.getGoals();
  }

  addGoal(goal) {
    return this.goals.addGoal(goal);
  }

  updateGoalProgress(goalId, currentValue) {
    return this.goals.updateGoalProgress(goalId, currentValue);
  }

  deleteGoal(goalId) {
    return this.goals.deleteGoal(goalId);
  }

  getStreamKey() {
    return this.goals.getStreamKey();
  }

  saveStreamKey(key) {
    return this.goals.saveStreamKey(key);
  }

  setStreamStartTime(timestamp) {
    this.goals.setStreamStartTime(timestamp);
  }

  getStreamStartTime() {
    return this.goals.getStreamStartTime();
  }

  getStreamElapsedHours() {
    return this.goals.getStreamElapsedHours();
  }

  shouldShowTitleReminder() {
    return this.goals.shouldShowTitleReminder();
  }

  clearStreamStartTime() {
    this.goals.clearStreamStartTime();
  }

  // Internal method used by EventSub (not needed externally but kept for completeness)
  async incrementGoalProgress(unit, amount) {
    return this.goals.incrementGoalProgress(unit, amount);
  }
}

const streamManagerService = new StreamManagerService();
module.exports = { streamManagerService, StreamManagerService };