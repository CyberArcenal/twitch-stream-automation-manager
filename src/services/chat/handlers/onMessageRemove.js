// services/chat/handlers/onMessageRemove.js
const { logger } = require("../../../utils/logger");
const { sendToRenderers } = require("../chat-utils");

/**
 * Creates a handler for Twitch's CLEARMSG event (message removal)
 * 
 * @param {Array} messageBuffer - Reference to the chat client's message buffer (array of recent messages)
 * @returns {Function} Async handler function for onMessageRemove
 */
module.exports = function createOnMessageRemoveHandler(messageBuffer) {
  return async function onMessageRemove(channel, messageId, messageData) {
    // Normalize channel name (remove leading '#')
    const cleanChannel = channel.startsWith("#") ? channel.slice(1) : channel;
    
    logger.info(`[Chat] Message deleted in #${cleanChannel}: ID=${messageId}, by=${messageData?.moderator || "unknown"}`);

    // Find and mark the message as deleted in the message buffer
    const msgIndex = messageBuffer.findIndex(
      (m) => (m.messageId === messageId || m.id === messageId) && m.channel === cleanChannel
    );

    if (msgIndex !== -1) {
      const originalMsg = messageBuffer[msgIndex];
      const deletedBy = messageData?.moderator || messageData?.moderator_name || "Moderator";
      
      // Mark as deleted
      messageBuffer[msgIndex] = {
        ...originalMsg,
        isDeleted: true,
        deletedReason: `Deleted by ${deletedBy}`,
        message: `[Message removed by ${deletedBy}]`,
        parsedMessage: [{ type: "text", text: `[Message removed by ${deletedBy}]` }],
        badges: [], // clear badges for deleted messages
      };
      
      logger.debug(`[Chat] Message ${messageId} marked as deleted in buffer`);
    } else {
      logger.debug(`[Chat] Message ${messageId} not found in buffer (maybe older than buffer limit)`);
    }

    // Broadcast to all renderer windows
    sendToRenderers("chat:message-deleted", {
      channel: cleanChannel,
      messageId,
      deletedBy: messageData?.moderator || messageData?.moderator_name || "Moderator",
      timestamp: new Date().toISOString(),
    });
  };
};