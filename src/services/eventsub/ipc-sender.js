// src/main/services/eventsub/ipc-sender.js
const { BrowserWindow } = require("electron");
const { logger } = require("../../utils/logger");

function sendToRenderers(channel, data) {
  try {
    const windows = BrowserWindow.getAllWindows();
    windows.forEach((win) => {
      if (!win.isDestroyed()) {
        win.webContents.send(channel, data);
      }
    });
  } catch (error) {
    logger.warn("Failed to send IPC event:", error.message);
  }
}

module.exports = { sendToRenderers };