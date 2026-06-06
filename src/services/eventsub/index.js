// src/main/services/eventsub/index.js
const { EventEmitter } = require("events");
const { EventSubConnection } = require("./connection");
const { EventSubSubscriptions } = require("./subscriptions");
const { EventSubEvents } = require("./events");
const { twitchAuthService } = require("../twitch-auth");
const { logger } = require("../../utils/logger");

class EventSubService extends EventEmitter {
  constructor() {
    super();
    this.connection = new EventSubConnection();
    this.subscriptions = new EventSubSubscriptions(this.connection);
    this.events = new EventSubEvents();
    this.mainWindow = null;

    // Forward events from events module
    this.events.on("eventsub:stream-online", (data) => this.emit("eventsub:stream-online", data));
    this.events.on("eventsub:stream-offline", (data) => this.emit("eventsub:stream-offline", data));
    this.events.on("eventsub:follow", (data) => this.emit("eventsub:follow", data));
    this.events.on("eventsub:subscription", (data) => this.emit("eventsub:subscription", data));
    this.events.on("eventsub:raid", (data) => this.emit("eventsub:raid", data));
    this.events.on("eventsub:hype_train", (data) => this.emit("eventsub:hype_train", data));
    this.events.on("eventsub:bits", (data) => this.emit("eventsub:bits", data));

    logger.debug("[EventSubService] Constructor - instance created");
  }

  initialize(mainWindow) {
    this.mainWindow = mainWindow;
    logger.info("[EventSubService] Initialized with mainWindow");
  }

  async getAppAccessToken() {
    const token = twitchAuthService.getAccessToken();
    if (!token) {
      logger.error("[EventSubService] getAppAccessToken - no access token");
      throw new Error("Not authenticated");
    }
    return token;
  }

  start() {
    if (this.connection.ws && (this.connection.ws.readyState === 1 || this.connection.ws.readyState === 0)) {
      logger.info("[EventSubService] Already connected or connecting, skipping start");
      return;
    }
    logger.info("[EventSubService] Starting EventSub service");
    const onMessageHandler = (data) => this.events.handleWebSocketMessage(data, this.connection, this.subscriptions);
    this.connection.connect(onMessageHandler, () => this.subscriptions.ensureEssentialSubscriptions());
  }

  stop() {
    logger.info("[EventSubService] Stopping EventSub service");
    this.connection.disconnect();
  }

  // Public subscription methods
  async subscribeToStream(userId) {
    return this.subscriptions.subscribeToStreamOnline(userId);
  }

  async subscribeToFollows(userId) {
    return this.subscriptions.subscribeToFollowEvents(userId);
  }

  async subscribeToSubscriptions(userId) {
    return this.subscriptions.subscribeToSubscriptionEvents(userId);
  }

  async subscribeToBitsEvents(userId) {
    return this.subscriptions.subscribeToBitsEvents(userId);
  }

  async subscribeToRaidEvents(userId) {
    return this.subscriptions.subscribeToRaidEvents(userId);
  }

  async subscribeToHypeTrainEvents(userId) {
    return this.subscriptions.subscribeToHypeTrainEvents(userId);
  }

  async resubscribeAll() {
    return this.subscriptions.resubscribeAll();
  }

  // For backward compatibility
  get ws() { return this.connection.ws; }
  get sessionId() { return this.connection.getSessionId(); }
  get connected() { return this.connection.isConnected(); }
  get autoSubscriptionsCreated() { return this.connection.areSubscriptionsCreated(); }
}

const eventSubService = new EventSubService();
module.exports = { eventSubService, EventSubService };