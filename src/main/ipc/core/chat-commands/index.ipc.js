// src/main/ipc/index.ipc.js
//@ts-check
const { ipcMain } = require('electron');
const { chatCommandsService } = require('../../../../services/chat-commands.service');
const { logger } = require('../../../../utils/logger');

async function handleChatCommandsRequest(event, payload) {
  const { method, params = {} } = payload;

  switch (method) {
    case 'getCommands':
      return chatCommandsService.getAllCommands(); // dapat ibalik ang lahat ng commands (kasama ang response)
    case 'addCustomCommand':
      return chatCommandsService.addCustomCommand(params.command, params.response, params.cooldown);
    case 'updateCommand':
      return chatCommandsService.updateCommand(params.command, params.updates);
    case 'removeCommand':
      return chatCommandsService.removeCommand(params.command);
    case 'setCommandEnabled':
      chatCommandsService.setCommandEnabled(params.command, params.enabled);
      return true;
    default:
      throw new Error(`Unknown chat-commands method: ${method}`);
  }
}

ipcMain.handle('chat-commands', async (event, payload) => {
  try {
    logger.debug(`[IPC] request: ${JSON.stringify(event)} - ${JSON.stringify(payload)}`);
    const result = await handleChatCommandsRequest(event, payload);
    return { status: true, message: 'OK', data: result };
  } catch (err) {
    console.error('[IPC:chat-commands]', err);
    return { status: false, message: err.message, data: null };
  }
});