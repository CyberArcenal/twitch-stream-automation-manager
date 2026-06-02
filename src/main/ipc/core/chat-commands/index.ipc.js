const { ipcMain } = require('electron');
const { chatCommandsService } = require('../../../../services/chat-commands.service');

async function handleChatCommandsRequest(event, payload) {
  const { method, params = {} } = payload;

  switch (method) {
    case 'getCommands':
      return chatCommandsService.commands;
    case 'addCommand':
      return chatCommandsService.addCommand(params.command, params.action, params.cooldown);
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
    const result = await handleChatCommandsRequest(event, payload);
    return { status: true, message: 'OK', data: result };
  } catch (err) {
    console.error('[IPC:chat-commands]', err);
    return { status: false, message: err.message, data: null };
  }
});