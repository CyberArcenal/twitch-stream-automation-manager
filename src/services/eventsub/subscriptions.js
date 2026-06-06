// src/main/services/eventsub/subscriptions.js
const { twitchApiService } = require("../twitch-api");
const { settingsService } = require("../settings");
const { logger } = require("../../utils/logger");

class EventSubSubscriptions {
  constructor(connection) {
    this.connection = connection;
    this.subscriptions = new Map(); // subscriptionId -> { type, condition, userId }
  }

  async createSubscription(type, version, condition, transport = null) {
    if (!this.connection.getSessionId()) {
      throw new Error("No active EventSub session – please wait for connection");
    }
    logger.info(`[EventSub] createSubscription - type=${type}, condition=${JSON.stringify(condition)}`);
    const body = {
      type,
      version,
      condition,
      transport: transport || {
        method: "websocket",
        session_id: this.connection.getSessionId(),
      },
    };
    const result = await twitchApiService.fetchTwitch("eventsub/subscriptions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    logger.info(`[EventSub] Subscription created: ${result.data[0]?.id}`);
    return result.data[0];
  }

  async deleteSubscription(subscriptionId) {
    logger.info(`[EventSub] deleteSubscription - id=${subscriptionId}`);
    const params = new URLSearchParams({ id: subscriptionId });
    try {
      await twitchApiService.fetchTwitch(`eventsub/subscriptions?${params}`, { method: "DELETE" });
      logger.debug(`[EventSub] Deleted subscription ${subscriptionId}`);
    } catch (err) {
      if (err.message?.includes("404") || err.status === 404) {
        logger.debug(`[EventSub] Subscription ${subscriptionId} not found (already deleted)`);
      } else {
        logger.error(`[EventSub] Failed to delete subscription ${subscriptionId}: ${err.message}`);
        throw err;
      }
    }
  }

  async subscribeToStreamOnline(userId) {
    logger.info(`[EventSub] subscribeToStreamOnline - userId=${userId}`);
    const subscription = await this.createSubscription("stream.online", "1", {
      broadcaster_user_id: userId,
    });
    this.subscriptions.set(subscription.id, {
      type: "stream.online",
      condition: { broadcaster_user_id: userId },
      userId,
    });
    return subscription;
  }

  async subscribeToStreamOffline(userId) {
    logger.info(`[EventSub] subscribeToStreamOffline - userId=${userId}`);
    const subscription = await this.createSubscription("stream.offline", "1", {
      broadcaster_user_id: userId,
    });
    this.subscriptions.set(subscription.id, {
      type: "stream.offline",
      condition: { broadcaster_user_id: userId },
      userId,
    });
    return subscription;
  }

  async subscribeToFollowEvents(userId) {
    logger.info(`[EventSub] subscribeToFollowEvents - userId=${userId}`);
    const subscription = await this.createSubscription("channel.follow", "2", {
      broadcaster_user_id: userId,
      moderator_user_id: userId,
    });
    this.subscriptions.set(subscription.id, {
      type: "channel.follow",
      condition: { broadcaster_user_id: userId },
      userId,
    });
    return subscription;
  }

  async subscribeToSubscriptionEvents(userId) {
    logger.info(`[EventSub] subscribeToSubscriptionEvents - userId=${userId}`);
    const subscription = await this.createSubscription("channel.subscribe", "1", {
      broadcaster_user_id: userId,
    });
    this.subscriptions.set(subscription.id, {
      type: "channel.subscribe",
      condition: { broadcaster_user_id: userId },
      userId,
    });
    return subscription;
  }

  async subscribeToBitsEvents(userId) {
    const subscription = await this.createSubscription("channel.bits", "1", {
      broadcaster_user_id: userId,
    });
    this.subscriptions.set(subscription.id, {
      type: "channel.bits",
      condition: { broadcaster_user_id: userId },
      userId,
    });
    return subscription;
  }

  async subscribeToRaidEvents(userId) {
    const subscription = await this.createSubscription("channel.raid", "1", {
      to_broadcaster_user_id: userId,
    });
    this.subscriptions.set(subscription.id, {
      type: "channel.raid",
      condition: { to_broadcaster_user_id: userId },
      userId,
    });
    return subscription;
  }

  async subscribeToHypeTrainEvents(userId) {
    const subscription = await this.createSubscription("channel.hype_train.begin", "1", {
      broadcaster_user_id: userId,
    });
    this.subscriptions.set(subscription.id, {
      type: "channel.hype_train.begin",
      condition: { broadcaster_user_id: userId },
      userId,
    });
    return subscription;
  }

  async ensureEssentialSubscriptions() {
    const userId = settingsService.get("twitch")?.userId;
    if (!userId) {
      logger.warn("[EventSub] No user logged in, cannot create subscriptions");
      return;
    }
    if (this.connection.areSubscriptionsCreated()) {
      logger.debug("[EventSub] Subscriptions already created for this session");
      return;
    }
    try {
      await this.subscribeToFollowEvents(userId);
      await this.subscribeToSubscriptionEvents(userId);
      await this.subscribeToStreamOnline(userId);
      await this.subscribeToStreamOffline(userId);
      this.connection.markSubscriptionsCreated();
      logger.success("[EventSub] Essential subscriptions created");
    } catch (err) {
      logger.error("[EventSub] Failed to create essential subscriptions:", err);
    }
  }

  async resubscribeAll() {
    logger.info(`[EventSub] Resubscribing to ${this.subscriptions.size} stored subscriptions`);
    for (const [id, sub] of this.subscriptions.entries()) {
      try {
        let newSub;
        switch (sub.type) {
          case "stream.online":
            newSub = await this.subscribeToStreamOnline(sub.userId);
            break;
          case "stream.offline":
            newSub = await this.subscribeToStreamOffline(sub.userId);
            break;
          case "channel.follow":
            newSub = await this.subscribeToFollowEvents(sub.userId);
            break;
          case "channel.subscribe":
            newSub = await this.subscribeToSubscriptionEvents(sub.userId);
            break;
          default:
            continue;
        }
        this.subscriptions.delete(id);
        this.subscriptions.set(newSub.id, { ...sub, id: newSub.id });
        logger.debug(`[EventSub] Resubscribed ${sub.type} (old=${id}, new=${newSub.id})`);
      } catch (err) {
        logger.error(`[EventSub] Failed to resubscribe ${sub.type}:`, err);
      }
    }
  }

  handleRevocation(subscriptionId) {
    this.subscriptions.delete(subscriptionId);
  }
}

module.exports = { EventSubSubscriptions };