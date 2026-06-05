// src/main/ipc/core/pinned-messages/index.ipc.js
//@ts-check
const { ipcMain } = require("electron");
const {
  pinnedMessagesService,
} = require("../../../../services/pinned-messages.service");
const { logger } = require("../../../../utils/logger");

async function handlePinnedRequest(event, payload) {
  const { method, params = {} } = payload;
  switch (method) {
    case "get":
      return pinnedMessagesService.getPinnedMessages(params.channelName);
    case "pin":
      return pinnedMessagesService.pinMessage(
        params.channelName,
        params.message,
      );
    case "unpin":
      return pinnedMessagesService.unpinMessage(
        params.channelName,
        params.messageId,
      );
    case "clear":
      return pinnedMessagesService.clearPinnedMessages(params.channelName);
    default:
      throw new Error(`Unknown pinned-messages method: ${method}`);
  }
}

ipcMain.handle("pinned-messages", async (event, payload) => {
  try {
    logger.debug(
      `[IPC] request: ${JSON.stringify(event)} - ${JSON.stringify(payload)}`,
    );
    const result = await handlePinnedRequest(event, payload);
    return { status: true, message: "OK", data: result };
  } catch (err) {
    logger.error("[IPC:pinned]", err);
    return { status: false, message: err.message, data: null };
  }
});
