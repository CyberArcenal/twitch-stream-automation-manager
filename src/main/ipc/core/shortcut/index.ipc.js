//@ts-check
const { ipcMain } = require("electron");
const { shortcutService } = require("../../../../services/shortcut.service");
const { logger } = require("../../../../utils/logger");
const { shortcutStorage } = require("../../../../services/shortcut-storage.service");

async function handleShortcutRequest(event, payload) {
  const { method, params = {} } = payload;

  switch (method) {
    case "register":
      shortcutService.registerShortcuts(params.shortcuts);
      return true;
    case "unregisterAll":
      shortcutService.unregisterAll();
      return true;
    case "unregister":
      shortcutService.unregister(params.accelerators);
      return true;
    case "isRegistered":
      return shortcutService.isRegistered(params.accelerator);
    case "getShortcuts":
      return shortcutStorage.getShortcuts();
    case "setShortcuts":
      shortcutStorage.setShortcuts(params.shortcuts);
      return true;
    case "resetShortcuts":
      shortcutStorage.resetToDefaults();
      return true;
    default:
      throw new Error(`Unknown shortcut method: ${method}`);
  }
}

ipcMain.handle("shortcut", async (event, payload) => {
  try {
    logger.debug(`[IPC] request: ${JSON.stringify(event)} - ${JSON.stringify(payload)}`);
    const result = await handleShortcutRequest(event, payload);
    return { status: true, message: "OK", data: result };
  } catch (err) {
    console.error("[IPC:shortcut]", err);
    return { status: false, message: err.message, data: null };
  }
});
console.log("[IPC] Shortcut handler registered");
