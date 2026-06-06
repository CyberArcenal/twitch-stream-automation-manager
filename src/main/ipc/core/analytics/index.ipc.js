//@ts-check
const { ipcMain } = require('electron');
const { analyticsCollector } = require('../../../../services/analytics-collector');
const { logger } = require('../../../../utils/logger');


async function handleAnalyticsRequest(event, payload) {
  const { method, params = {} } = payload;

  switch (method) {
    case 'startCollecting':
      analyticsCollector.startCollecting(params.intervalMinutes || 15);
      return true;
    case 'stopCollecting':
      analyticsCollector.stopCollecting();
      return true;
    case 'getSnapshots':
      return analyticsCollector.getSnapshots(params.limit);
    case 'getFollowerHistory':
      return analyticsCollector.getFollowerHistory(params.days || 30);
    case 'getViewerHistory':
      return analyticsCollector.getViewerHistory(params.days || 30);
    case 'clearHistory':
      analyticsCollector.clearHistory();
      return true;
    default:
      throw new Error(`Unknown analytics method: ${method}`);
  }
}

ipcMain.handle('analytics', async (event, payload) => {
  try {
    logger.debug(`[IPC] request: ${JSON.stringify(event)} - ${JSON.stringify(payload)}`);
    const result = await handleAnalyticsRequest(event, payload);
    return { status: true, message: 'OK', data: result };
  } catch (err) {
    console.error('[IPC:analytics]', err);
    return { status: false, message: err.message, data: null };
  }
});

console.log('[IPC] Analytics handler registered');