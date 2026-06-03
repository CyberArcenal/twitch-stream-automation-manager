// src/main/ipc/core/stream-manager/index.ipc.js
//@ts-check
const { ipcMain } = require("electron");
const { settingsService } = require("../../../../services/settings.service");
const {
  streamManagerService,
} = require("../../../../services/stream-manager.service");
const { logger } = require("../../../../utils/logger");
const {
  obsDetectionService,
} = require("../../../../services/obs-detection.service");
const {
  automationService,
} = require("../../../../services/automation.service");
const {
  obsWebSocketService,
} = require("../../../../services/obs-websocket.service");
const { languagesService } = require("../../../../services/languages.service");
const { twitchApiService } = require("../../../../services/twitch-api.service");

/**
 * @param {Electron.IpcMainInvokeEvent} event
 */
// @ts-ignore
// @ts-ignore
// @ts-ignore
// @ts-ignore
// @ts-ignore
async function handleStreamManagerRequest(event, { method, params = {} }) {
  const broadcasterId = settingsService.get("twitch")?.userId;
  if (
    !broadcasterId &&
    method !== "getStreamKey" &&
    method !== "saveStreamKey"
  ) {
    throw new Error("Not logged in");
  }

  const moderatorId = broadcasterId;

  switch (method) {
    case "updateStreamInfo":
      return await streamManagerService.updateStreamInfo(broadcasterId, {
        // @ts-ignore
        title: params.title,
        // @ts-ignore
        game_id: params.game_id,
        // @ts-ignore
        go_live_notification: params.go_live_notification,
        // @ts-ignore
        broadcaster_language: params.broadcaster_language,
        // @ts-ignore
        tags: params.tags,
        // @ts-ignore
        is_branded_content: params.is_branded_content,
        // @ts-ignore
        content_classification_labels: params.content_classification_labels,
        // @ts-ignore
        is_rerun: params.is_rerun,
      });
    case "deleteMessage":
      
      return await streamManagerService.deleteMessage(
        broadcasterId,
        broadcasterId,
        params.messageId,
      );
    case "createClip":
      
      return await streamManagerService.createClip(broadcasterId);
    case "startRaid":
      return await streamManagerService.startRaid(
        broadcasterId,
        // @ts-ignore
        params.toBroadcasterLogin,
      );
    case "banUser":
      return await streamManagerService.banUser(
        broadcasterId,
        moderatorId,
        // @ts-ignore
        params.userName,
      );
    case "timeoutUser":
      return await streamManagerService.timeoutUser(
        broadcasterId,
        moderatorId,
        // @ts-ignore
        params.userName,
        // @ts-ignore
        params.duration,
      );
    case "clearChat":
      return await streamManagerService.clearChat(broadcasterId, moderatorId);
    case "getGoals":
      return streamManagerService.getGoals();
    case "addGoal":
      // @ts-ignore
      return streamManagerService.addGoal(params.goal);
    case "updateGoalProgress":
      return streamManagerService.updateGoalProgress(
        // @ts-ignore
        params.goalId,
        // @ts-ignore
        params.currentValue,
      );
    case "deleteGoal":
      // @ts-ignore
      return streamManagerService.deleteGoal(params.goalId);
    case "getStreamKey":
      return streamManagerService.getStreamKey();
    case "saveStreamKey":
      // @ts-ignore
      streamManagerService.saveStreamKey(params.key);
      return true;
    case "isOBSRunning":
      return await obsDetectionService.isOBSRunning();
    case "runCommercial":
      return await streamManagerService.runCommercial(
        // @ts-ignore
        params.broadcasterId,
        // @ts-ignore
        params.length,
      );

    case "startAutomation":
      // @ts-ignore
      automationService.start(params.config);
      return true;
    case "stopAutomation":
      automationService.stop();
      return true;
    case "getAutomationStatus":
      return {
        running: automationService.running,
        config: automationService.config,
      };
    case "obsConnect":
      try {
        const result = await obsWebSocketService.connect(
          // @ts-ignore
          params.host,
          // @ts-ignore
          params.port,
          // @ts-ignore
          params.password,
        );
        return result;
      } catch (err) {
        // Throw error so outer handler returns { status: false, message: err.message }
        // @ts-ignore
        throw new Error(err.message);
      }
    case "obsDisconnect":
      await obsWebSocketService.disconnect();
      return true;
    case "getOBSStatus":
      return obsWebSocketService.getConnectionStatus();
    case "getScenes":
      return await obsWebSocketService.getScenes();
    case "getCurrentScene":
      return await obsWebSocketService.getCurrentScene();
    case "setCurrentScene":
      // @ts-ignore
      return await obsWebSocketService.setCurrentScene(params.sceneName);
    case "getStreamStatus":
      return await obsWebSocketService.getStreamStatus();
    case "getOBSStats":
      return await obsWebSocketService.getStats();
    case "obsUpdatePassword":
      // @ts-ignore
      return await obsWebSocketService.updatePassword(params.password);
    case "obsClearPassword":
      return await obsWebSocketService.clearPassword();

    case "getModerators":
      return await streamManagerService.getModerators(broadcasterId);
    case "addModerator":
      return await streamManagerService.addModerator(
        broadcasterId,
        // @ts-ignore
        params.userId,
      );
    case "removeModerator":
      return await streamManagerService.removeModerator(
        broadcasterId,
        // @ts-ignore
        params.userId,
      );
    case "unbanUser":
      return await streamManagerService.unbanUser(
        settingsService.get("twitch").userId,
        params.userName,
      );
    case "getUserByName":
      // Re‑use the existing method from twitchApiService
      return await twitchApiService.getUserByName(params.username);

    case "obsStartStream":
      return await obsWebSocketService.startStream();
    case "obsStopStream":
      return await obsWebSocketService.stopStream();
    case "getStreamTags":
      return await twitchApiService.getStreamTags(params.broadcasterId);
    case "getAllStreamTags":
      return await twitchApiService.getAllStreamTags(params.first);
    case "getLanguages":
      return languagesService.getLanguages();
    case "getCommercialCooldown":
      return streamManagerService.getCommercialCooldownRemaining();
    case "getStreamElapsedHours":
      return streamManagerService.getStreamElapsedHours();
    case "shouldShowTitleReminder":
      return streamManagerService.shouldShowTitleReminder();
    case "createStreamMarker":
      return await twitchApiService.createStreamMarker(
        settingsService.get("twitch").userId,
        params.description,
      );

    case "getIngestServers":
      return await twitchApiService.getIngestServers();
    case "regenerateStreamKey":
      // Opens dashboard – hindi direktang makukuha ang bagong key, pero pwede mong tawagin ang regenerate method
      return await twitchApiService.regenerateStreamKey();
    case "openDashboardSettings":
      const login = settingsService.get("twitch")?.login;
      if (!login) throw new Error("Not logged in");
      const section = params.section || "stream"; // stream, channel, ads, moderator
      const urls = {
        stream: `https://dashboard.twitch.tv/u/${login}/stream-manager/settings`,
        channel: `https://dashboard.twitch.tv/u/${login}/settings/channel`,
        ads: `https://dashboard.twitch.tv/u/${login}/stream-manager/ads`,
        moderator: `https://dashboard.twitch.tv/u/${login}/settings/moderation`,
      };
      const url = urls[section] || urls.stream;
      const { shell } = require("electron");
      await shell.openExternal(url);
      return true;
    case "obsGetSettings":
      return obsWebSocketService.settings;
    case "obsUpdateSettings":
      obsWebSocketService.updateConnectionSettings(params.settings);
      return true;
    case "obsTestConnection":
      return await obsWebSocketService.testConnection(
        params.host,
        params.port,
        params.password,
      );
    case "getAutomationConfig":
      return automationService.getConfig();
    case "updateAutomationConfig":
      automationService.start(params.config);
      return true;
    case "getChatters":
      return await twitchApiService.getChatters(
        params.broadcasterId,
        params.moderatorId,
      );
    default:
      throw new Error(`Unknown stream-manager method: ${method}`);
  }
}

ipcMain.handle("stream-manager", async (event, payload) => {
  try {
    const result = await handleStreamManagerRequest(event, payload);
    return { status: true, message: "OK", data: result };
  } catch (err) {
    // @ts-ignore
    logger.error("[IPC:stream-manager]", err);
    // @ts-ignore
    return { status: false, message: err.message, data: null };
  }
});

console.log("[IPC] Stream manager handler registered");
