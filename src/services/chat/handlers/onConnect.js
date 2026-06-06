// services/chat/handlers/onConnect.js
const { settingsService } = require("../../settings");
const { chatCommandsService } = require("../../chat-commands");
const { logger } = require("../../../utils/logger");
const { sendToRenderers } = require("../chat-utils");

module.exports = function createOnConnectHandler(badgesModule) {
  return async function onConnect(channelName) {
    logger.info(`[Chat] Connected and authenticated to ${channelName}`);

    const twitchData = settingsService.get("twitch");
    const broadcasterId = twitchData?.userId;

    if (broadcasterId) {
      await badgesModule.fetchBadgeSets(broadcasterId);
    } else {
      logger.warn("[Chat] No broadcaster ID found, cannot fetch badges");
    }

    chatCommandsService.attachListener();
    sendToRenderers("chat:connected", { channel: channelName });
  };
};