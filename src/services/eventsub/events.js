// src/main/services/eventsub/events.js
const { notificationStore } = require("../notification-store");
const { streamManagerService } = require("../stream-manager");
const { logger } = require("../../utils/logger");
const { sendToRenderers } = require("./ipc-sender");
const EventEmitter = require("events");

class EventSubEvents extends EventEmitter {
  constructor() {
    super();
  }

  handleEvent(message) {
    const { metadata, payload } = message;
    const eventType = metadata.subscription_type;
    const eventData = payload.event;

    logger.info(`[EventSub] Received event: ${eventType}`, eventData);

    switch (eventType) {
      case "stream.online":
        sendToRenderers("eventsub:stream-online", {
          broadcasterId: eventData.broadcaster_user_id,
          broadcasterName: eventData.broadcaster_user_login,
          title: eventData.title,
          gameId: eventData.game_id,
          startedAt: eventData.started_at,
        });
        this.emit("eventsub:stream-online", eventData);
        notificationStore.add({
          type: "stream_online",
          title: `${eventData.broadcaster_user_login} is live!`,
          message: eventData.title,
          data: {
            broadcasterId: eventData.broadcaster_user_id,
            broadcasterName: eventData.broadcaster_user_login,
            title: eventData.title,
            gameId: eventData.game_id,
          },
        });
        streamManagerService.setStreamStartTime(Date.parse(eventData.started_at));
        break;

      case "stream.offline":
        sendToRenderers("eventsub:stream-offline", {
          broadcasterId: eventData.broadcaster_user_id,
          broadcasterName: eventData.broadcaster_user_login,
        });
        this.emit("eventsub:stream-offline", eventData);
        streamManagerService.clearStreamStartTime();
        break;

      case "channel.follow":
        sendToRenderers("eventsub:follow", {
          followerId: eventData.user_id,
          followerName: eventData.user_login,
          followedAt: eventData.followed_at,
          broadcasterId: eventData.broadcaster_user_id,
        });
        this.emit("eventsub:follow", eventData);
        notificationStore.add({
          type: "follow",
          title: "New follower",
          message: `${eventData.user_login} followed you!`,
          data: {
            followerId: eventData.user_id,
            followerName: eventData.user_login,
            broadcasterId: eventData.broadcaster_user_id,
          },
        });
        break;

      case "channel.subscribe":
        sendToRenderers("eventsub:subscription", {
          userId: eventData.user_id,
          userName: eventData.user_login,
          tier: eventData.tier,
          isGift: eventData.is_gift,
          broadcasterId: eventData.broadcaster_user_id,
        });
        this.emit("eventsub:subscription", eventData);
        notificationStore.add({
          type: "subscription",
          title: eventData.is_gift ? "Gift subscription" : "New subscription",
          message: `${eventData.user_login} subscribed with tier ${parseInt(eventData.tier) / 1000}${eventData.is_gift ? " (gift)" : ""}`,
          data: {
            userId: eventData.user_id,
            userName: eventData.user_login,
            tier: eventData.tier,
            isGift: eventData.is_gift,
          },
        });
        break;

      case "channel.raid":
        sendToRenderers("eventsub:raid", {
          fromBroadcasterId: eventData.from_broadcaster_user_id,
          fromBroadcasterName: eventData.from_broadcaster_user_login,
          viewers: eventData.viewers,
          toBroadcasterId: eventData.to_broadcaster_user_id,
        });
        this.emit("eventsub:raid", eventData);
        break;

      case "channel.hype_train.begin":
        sendToRenderers("eventsub:hype_train", {
          level: eventData.level,
          total: eventData.total,
          progress: eventData.progress,
          goal: eventData.goal,
        });
        this.emit("eventsub:hype_train", eventData);
        break;

      case "channel.bits":
        sendToRenderers("eventsub:bits", eventData);
        this.emit("eventsub:bits", eventData);
        break;

      default:
        logger.warn(`[EventSub] Unhandled event type: ${eventType}`);
    }
  }

  handleWebSocketMessage(data, connection, subscriptions) {
    const message = JSON.parse(data.toString());
    const msgType = message.metadata.message_type;
    logger.debug(`[EventSub] WebSocket message type: ${msgType}`);

    switch (msgType) {
      case "session_welcome":
        connection.setSessionId(message.payload.session.id);
        connection.setConnected(true);
        logger.info(`[EventSub] WebSocket connected, session: ${connection.getSessionId()}`);
        sendToRenderers("eventsub:connected", { sessionId: connection.getSessionId() });
        subscriptions.ensureEssentialSubscriptions().catch(err => logger.error(err));
        break;

      case "session_keepalive":
        logger.debug("[EventSub] Keepalive received, no response needed.");
        break;

      case "notification":
        this.handleEvent(message);
        break;

      case "session_reconnect":
        logger.warn("[EventSub] Reconnect requested, new URL:", message.payload.session.reconnect_url);
        // TODO: implement reconnect using the new URL
        break;

      case "revocation":
        logger.warn("[EventSub] Subscription revoked:", message.payload.subscription);
        subscriptions.handleRevocation(message.payload.subscription.id);
        break;

      default:
        logger.debug("[EventSub] Unknown message type:", msgType);
    }
  }
}

module.exports = { EventSubEvents };