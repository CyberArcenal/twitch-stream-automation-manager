//@ts-check
const { ipcMain } = require('electron');
const { chatHistoryService } = require('../../../../services/chat-history.service');


async function handleChatHistoryRequest(event, payload) {
  const { method, params = {} } = payload;

  switch (method) {
    case 'getHourlyActivity':
      return chatHistoryService.getHourlyActivity(params.channel, params.daysBack || 7);
    case 'getDailyActivity':
      return chatHistoryService.getDailyActivity(params.channel, params.daysBack || 30);
    case 'getMessagesInRange':
      return chatHistoryService.getMessagesInRange(params.channel, new Date(params.startDate), new Date(params.endDate));
    case 'clearChannelHistory':
      chatHistoryService.clearChannelHistory(params.channel);
      return true;
    case 'clearAllHistory':
      chatHistoryService.clearAllHistory();
      return true;
    default:
      throw new Error(`Unknown chatHistory method: ${method}`);
  }
}

ipcMain.handle('chat-history', async (event, payload) => {
  try {
    const result = await handleChatHistoryRequest(event, payload);
    return { status: true, message: 'OK', data: result };
  } catch (err) {
    console.error('[IPC:chat-history]', err);
    return { status: false, message: err.message, data: null };
  }
});

console.log('[IPC] Chat History handler registered');