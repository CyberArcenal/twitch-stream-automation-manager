// services/chat/handlers/onJoin.js
const { logger } = require("../../../utils/logger");
const { sendToRenderers } = require("../chat-utils");

module.exports = function createOnJoinHandler(clientManager) {
  return function onJoin(channel, user) {
    if (user === clientManager.currentUserLogin) {
      logger.info(`[Chat] Own user ${user} joined ${channel}`);
      sendToRenderers("chat:connected", { channel });
      clientManager.reconnectAttempts = 0;
    } else {
      logger.debug(`[Chat] User ${user} joined ${channel}`);
      sendToRenderers("chat:user-joined", { channel, user });
    }
  };
};