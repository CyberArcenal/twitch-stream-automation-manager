//@ts-check
const { ipcMain } = require('electron');
const { schedulerService } = require('../../../../services/scheduler.service');
const { logger } = require('../../../../utils/logger');

async function handleSchedulerRequest(event, payload) {
  const { method, params = {} } = payload;
  switch (method) {
    case 'getSchedules':
      return schedulerService.getSchedules();
    case 'addSchedule':
      return schedulerService.addSchedule(params.schedule);
    case 'updateSchedule':
      return schedulerService.updateSchedule(params.id, params.updates);
    case 'deleteSchedule':
      return schedulerService.deleteSchedule(params.id);
    default:
      throw new Error(`Unknown scheduler method: ${method}`);
  }
}

ipcMain.handle('scheduler', async (event, payload) => {
  try {
    logger.debug(`[IPC] request: ${JSON.stringify(event)} - ${JSON.stringify(payload)}`);
    const result = await handleSchedulerRequest(event, payload);
    return { status: true, message: 'OK', data: result };
  } catch (err) {
    console.error('[IPC:scheduler]', err);
    return { status: false, message: err.message, data: null };
  }
});