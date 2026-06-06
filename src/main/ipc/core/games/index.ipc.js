//@ts-check
const { ipcMain } = require("electron");
const { gamesService } = require("../../../../services/games");
const { logger } = require("../../../../utils/logger");

async function handleGamesRequest(event, payload) {
  const { method, params = {} } = payload;

  switch (method) {
    case "getTopGames":
      return await gamesService.getTopGames(params.first);
    case "getGameInfo":
      return await gamesService.getGameInfo(params.gameId);
    case "getStreamsByGame":
      return await gamesService.getStreamsByGame(params.gameId, params.first);
    case "getGameByName":
      return await gamesService.getGameByName(params.name);
    case "searchCategories":
      return await gamesService.searchCategories(params.query, params.first);
    default:
      throw new Error(`Unknown games method: ${method}`);
  }
}

ipcMain.handle("games", async (event, payload) => {
  try {
    logger.debug(`[IPC] request: ${JSON.stringify(event)} - ${JSON.stringify(payload)}`);
    const result = await handleGamesRequest(event, payload);
    return { status: true, message: "OK", data: result };
  } catch (err) {
    console.error("[IPC:games]", err);
    return { status: false, message: err.message, data: null };
  }
});
console.log("[IPC] Games handler registered");
