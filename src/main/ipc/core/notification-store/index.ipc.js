// src/main/ipc/core/notification-store/index.ipc.js
//@ts-check
const { ipcMain } = require('electron');
const { notificationStore } = require('../../../../services/notification-store');
const { logger } = require('../../../../utils/logger');


async function handleNotificationRequest(event, payload) {
  const { method, params = {} } = payload;

  switch (method) {
    case 'getAll':
      return notificationStore.getAll();
    case 'markRead':
      return notificationStore.markRead(params.id);
    case 'markAllRead':
      return notificationStore.markAllRead();
    case 'delete':
      return notificationStore.delete(params.id);
    case 'clearAll':
      return notificationStore.clearAll();
    default:
      throw new Error(`Unknown notification method: ${method}`);
  }
}

ipcMain.handle('notification-store', async (event, payload) => {
  try {
    logger.debug(`[IPC] request: ${JSON.stringify(payload)}`);
    const result = await handleNotificationRequest(event, payload);
    return { status: true, message: 'OK', data: result };
  } catch (err) {
    console.error('[IPC:notification-store]', err);
    return { status: false, message: err.message, data: null };
  }
});

console.log('[IPC] Notification Store handler registered');