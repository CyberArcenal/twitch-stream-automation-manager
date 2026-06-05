//@ts-check
const { ipcMain } = require("electron");
const { settingsService } = require("../../../../services/settings.service");
const {
  autoModerationService,
} = require("../../../../services/auto-moderation.service");
const { logger } = require("../../../../utils/logger");

/**
 * @param {Electron.IpcMainInvokeEvent} event
 * @param {{ method: any; params?: {} | undefined; }} payload
 */
// @ts-ignore
async function handleSettingsRequest(event, payload) {
  const { method, params = {} } = payload;

  switch (method) {
    case "get":
      // @ts-ignore
      return settingsService.get(params.key);
    case "set":
      // @ts-ignore
      settingsService.set(params.key, params.value);
      return true;
    case "getAll":
      return settingsService.getAll();
    case "addChatFilter":
      // @ts-ignore
      settingsService.addChatFilter(params.word);
      return true;
    case "removeChatFilter":
      // @ts-ignore
      settingsService.removeChatFilter(params.word);
      return true;
    case "reset":
      settingsService.reset();
      return true;
    case "testNotification":
      // @ts-ignore
      settingsService.testNotification(params.type);
      return true;
    case "getAutoModeration":
      return autoModerationService.getConfig();
    case "updateAutoModeration":
      autoModerationService.updateRules(params.config);
      // Also handle enabled flag separately if included
      if (params.config.enabled !== undefined) {
        autoModerationService.setEnabled(params.config.enabled);
      }
      return true;
    case "getLanguage":
      return settingsService.getLanguage();
    case "setLanguage":
      settingsService.setLanguage(params.lang);
      return true;
    case "exportSettings":
      return await settingsService.exportAllSettings();
    case "importSettings":
      await settingsService.importAllSettings(params.data);
      return true;
    default:
      throw new Error(`Unknown settings method: ${method}`);
  }
}

ipcMain.handle("settings", async (event, payload) => {
  try {
    logger.debug(`[IPC] request: ${JSON.stringify(event)} - ${JSON.stringify(payload)}`);
    const result = await handleSettingsRequest(event, payload);
    return { status: true, message: "OK", data: result };
  } catch (err) {
    console.error("[IPC:settings]", err);
    // @ts-ignore
    return { status: false, message: err.message, data: null };
  }
});

console.log("[IPC] Settings handler registered");
