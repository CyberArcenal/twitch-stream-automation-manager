// src/main/services/automation/events.js
const { eventSubService } = require("../eventsub");
const { twitchChatService } = require("../chat");
const { logger } = require("../../utils/logger");

class EventListenerManager {
  constructor(handlers) {
    this.handlers = handlers;
    this.listenersAttached = false;
    this.chatCheckInterval = null;
  }

  attach() {
    if (this.listenersAttached) return;
    logger.info("[Automation] Attaching event listeners...");

    eventSubService.on("eventsub:follow", this.handlers.handleFollow);
    eventSubService.on("eventsub:subscription", this.handlers.handleSubscription);
    eventSubService.on("eventsub:stream-offline", this.handlers.handleStreamOffline);
    eventSubService.on("eventsub:raid", this.handlers.handleRaid);
    eventSubService.on("eventsub:stream-online", this.handlers.handleStreamOnline);

    if (twitchChatService.chatClient) {
      twitchChatService.chatClient.onMessage(this.handlers.handleChatMessage);
    } else {
      this.chatCheckInterval = setInterval(() => {
        if (twitchChatService.chatClient) {
          twitchChatService.chatClient.onMessage(this.handlers.handleChatMessage);
          clearInterval(this.chatCheckInterval);
          this.chatCheckInterval = null;
        }
      }, 1000);
    }

    this.listenersAttached = true;
    logger.debug("[Automation] Event listeners attached");
  }

  detach() {
    if (this.chatCheckInterval) clearInterval(this.chatCheckInterval);
    this.listenersAttached = false;
  }
}

module.exports = { EventListenerManager };