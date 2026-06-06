// src/main/services/eventsub/connection.js
const WebSocket = require("ws");
const { logger } = require("../../utils/logger");
const { sendToRenderers } = require("./ipc-sender");

class EventSubConnection {
  constructor() {
    this.ws = null;
    this.sessionId = null;
    this.connected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.autoSubscriptionsCreated = false;
  }

  connect(onMessageHandler, onSubscriptionReady) {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      logger.debug("[EventSub] Already connected or connecting");
      return;
    }
    const wsUrl = "wss://eventsub.wss.twitch.tv/ws";
    logger.info(`[EventSub] Connecting to WebSocket: ${wsUrl}`);
    this.ws = new WebSocket(wsUrl);
    this.ws.on("open", () => {
      logger.info("[EventSub] WebSocket opened");
      this.reconnectAttempts = 0;
    });
    this.ws.on("message", (data) => onMessageHandler(data, this));
    this.ws.on("error", (err) => {
      logger.error("[EventSub] WebSocket error:", err);
    });
    this.ws.on("close", (code, reason) => {
      logger.warn(`[EventSub] WebSocket closed: ${code} - ${reason}`);
      this.connected = false;
      this.sessionId = null;
      this.autoSubscriptionsCreated = false;
      sendToRenderers("eventsub:disconnected", { code, reason });
      this.reconnect(onMessageHandler, onSubscriptionReady);
    });
  }

  reconnect(onMessageHandler, onSubscriptionReady) {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      logger.error("[EventSub] Max reconnect attempts reached, giving up");
      return;
    }
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    this.reconnectAttempts++;
    logger.info(`[EventSub] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
    setTimeout(() => this.connect(onMessageHandler, onSubscriptionReady), delay);
  }

  disconnect() {
    logger.info("[EventSub] Disconnecting WebSocket");
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.connected = false;
    this.sessionId = null;
    this.autoSubscriptionsCreated = false;
  }

  setSessionId(id) {
    this.sessionId = id;
  }

  setConnected(connected) {
    this.connected = connected;
  }

  markSubscriptionsCreated() {
    this.autoSubscriptionsCreated = true;
  }

  areSubscriptionsCreated() {
    return this.autoSubscriptionsCreated;
  }

  getSessionId() {
    return this.sessionId;
  }

  isConnected() {
    return this.connected;
  }
}

module.exports = { EventSubConnection };