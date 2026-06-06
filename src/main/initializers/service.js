//@ts-check
//src/main/initializers/service.js
const updaterModule = require("../ipc/utils/updater/index.ipc");
const { analyticsCollector } = require("../../services/analytics-collector.service");
const { eventSubService } = require("../../services/eventsub.service");
const { followsService } = require("../../services/follows.service");
const { pipService } = require("../../services/picture-in-picture.service");
const { playerService } = require("../../services/player.service");
const { schedulerService } = require("../../services/scheduler.service");
const { twitchApiService } = require("../../services/twitch-api");
const { twitchAuthService } = require("../../services/twitch-auth.service");
const { twitchChatService } = require("../../services/twitch-chat.service");
const { logger } = require("../../utils/logger");
const { notificationService } = require("../../services/notification.service");

// ===================== SERVICE INITIALIZATION =====================
/**
 * @param {Electron.CrossProcessExports.BrowserWindow | null} mainWindow
 */
async function initializeServices(mainWindow) {
  logger.info("Initializing services...");

  updaterModule.setMainWindow(mainWindow);

  notificationService.initialize(mainWindow);
  twitchChatService.initChatService(mainWindow);
  followsService.initialize(mainWindow);
  playerService.initialize(mainWindow);
  eventSubService.initialize(mainWindow);
  pipService.initialize(mainWindow);
  analyticsCollector.startCollecting(15);
  schedulerService.loadSchedules();

  if (twitchAuthService.isLoggedIn()) {
    try {
      await twitchApiService.getCurrentUser();
      logger.info(
        "User already logged in – starting stream monitor"
      );
    } catch (err) {
      logger.info(
        "Stored token invalid – clearing and requiring re-login"
      );
      await twitchAuthService.logout();
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send("auth:invalid", {});
      }
    }
  }
  logger.debug("All services initialized");
}


module.exports = {initializeServices}