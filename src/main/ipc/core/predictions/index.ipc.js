//@ts-check
const { ipcMain } = require("electron");
const {
  predictionsService,
} = require("../../../../services/twitch-predictions.service");
const { settingsService } = require("../../../../services/settings.service");
const { logger } = require("../../../../utils/logger");

async function handlePredictionsRequest(event, payload) {
  const { method, params = {} } = payload;

  try {
    switch (method) {
      case "getActive":
        const broadcasterId = settingsService.get("twitch")?.userId;
        if (!broadcasterId) throw new Error("Not logged in");
        return await predictionsService.getActivePredictions(broadcasterId);
      case "create":
        return await predictionsService.createPrediction(
          params.broadcasterId,
          params.title,
          params.outcomes,
          params.predictionWindowSeconds,
        );
      case "resolve":
        return await predictionsService.resolvePrediction(
          params.predictionId,
          params.winningOutcomeId,
        );
      default:
        throw new Error(`Unknown predictions method: ${method}`);
    }
  } catch (err) {
    return { status: false, message: err.message, data: null };
  }
}

ipcMain.handle("predictions", async (event, payload) => {
  try {
    logger.debug(`[IPC] request: ${JSON.stringify(event)} - ${JSON.stringify(payload)}`);
    const result = await handlePredictionsRequest(event, payload);
    return { status: true, message: "OK", data: result };
  } catch (err) {
    console.error("[IPC:predictions]", err);
    return { status: false, message: err.message, data: null };
  }
});
console.log("[IPC] Predictions handler registered");
