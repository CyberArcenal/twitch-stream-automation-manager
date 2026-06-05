// services/chat/handlers/onDisconnect.js
const { logger } = require("../../../utils/logger");

module.exports = function createOnDisconnectHandler(clientManager) {
  return async function onDisconnect(manually) {
    if (!manually && clientManager.currentChannel) {
      logger.warn(`[Chat] Disconnected from ${clientManager.currentChannel}, will attempt reconnect (attempt ${clientManager.reconnectAttempts + 1})`);
      clientManager.handleReconnect();
    } else {
      logger.info(`[Chat] Disconnected manually from ${clientManager.currentChannel || "unknown"}`);
    }
  };
};