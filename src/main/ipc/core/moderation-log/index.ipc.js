//@ts-check
const { ipcMain } = require("electron");
const { moderationLogService } = require("../../../../services/moderation-log.service");


ipcMain.handle("moderation-log", async (event, payload) => {
  const { method, params = {} } = payload;
  switch (method) {
    case "getLogs":
      return moderationLogService.getLogs(params.filter);
    case "getUserWarnings":
      return moderationLogService.getUserWarnings(params.userId);
    case "clearLogs":
      return moderationLogService.clearLogs();
    default:
      throw new Error(`Unknown moderation-log method: ${method}`);
  }
});
