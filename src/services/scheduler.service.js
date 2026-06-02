const Store = require('electron-store');
const { logger } = require('../utils/logger');
const { streamManagerService } = require('./stream-manager.service');
const { twitchApiService } = require('./twitch-api.service');
const { settingsService } = require('./settings.service');

class SchedulerService {
  constructor() {
    this.store = new Store({ name: 'scheduler' });
    this.intervals = new Map();
    this.loadSchedules();
  }

  loadSchedules() {
    const schedules = this.store.get('schedules', []);
    schedules.forEach(schedule => {
      if (schedule.enabled) this.scheduleJob(schedule);
    });
  }

  saveSchedules(schedules) {
    this.store.set('schedules', schedules);
  }

  addSchedule(schedule) {
    const schedules = this.store.get('schedules', []);
    const newSchedule = {
      id: Date.now().toString(),
      ...schedule,
      enabled: true,
      createdAt: new Date().toISOString(),
    };
    schedules.push(newSchedule);
    this.saveSchedules(schedules);
    if (newSchedule.enabled) this.scheduleJob(newSchedule);
    return newSchedule;
  }

  updateSchedule(id, updates) {
    const schedules = this.store.get('schedules', []);
    const index = schedules.findIndex(s => s.id === id);
    if (index === -1) return null;
    schedules[index] = { ...schedules[index], ...updates };
    this.saveSchedules(schedules);
    this.cancelJob(id);
    if (schedules[index].enabled) this.scheduleJob(schedules[index]);
    return schedules[index];
  }

  deleteSchedule(id) {
    this.cancelJob(id);
    const schedules = this.store.get('schedules', []);
    const filtered = schedules.filter(s => s.id !== id);
    this.saveSchedules(filtered);
  }

  scheduleJob(schedule) {
    const { id, type, cronPattern, action, params } = schedule;
    // Simple interval-based (for demo) – use node-cron for production
    const interval = this.parseCronToMs(cronPattern);
    if (!interval) return;
    const intervalId = setInterval(async () => {
      try {
        await this.executeAction(type, action, params);
        logger.info(`[Scheduler] Executed scheduled ${type}: ${action}`);
      } catch (err) {
        logger.error(`[Scheduler] Failed to execute ${id}:`, err);
      }
    }, interval);
    this.intervals.set(id, intervalId);
  }

  parseCronToMs(cronPattern) {
    // Simple: 'every 30 mins', 'every 1 hour', 'every day at 15:00'
    // For demo, just parse 'every X minutes/hours'
    const match = cronPattern.match(/every (\d+) (minute|minutes|hour|hours)/i);
    if (match) {
      const value = parseInt(match[1]);
      const unit = match[2].toLowerCase();
      if (unit.startsWith('minute')) return value * 60 * 1000;
      if (unit.startsWith('hour')) return value * 60 * 60 * 1000;
    }
    return null;
  }

  async executeAction(type, action, params) {
    const broadcasterId = settingsService.get('twitch')?.userId;
    if (!broadcasterId) throw new Error('Not logged in');
    switch (action) {
      case 'updateStreamInfo':
        await streamManagerService.updateStreamInfo(broadcasterId, params);
        break;
      case 'runCommercial':
        await streamManagerService.runCommercial(broadcasterId, params.length || 30);
        break;
      default:
        logger.warn(`[Scheduler] Unknown action: ${action}`);
    }
  }

  cancelJob(id) {
    if (this.intervals.has(id)) {
      clearInterval(this.intervals.get(id));
      this.intervals.delete(id);
    }
  }

  cancelAll() {
    for (const [id] of this.intervals) {
      clearInterval(this.intervals.get(id));
    }
    this.intervals.clear();
  }

  getSchedules() {
    return this.store.get('schedules', []);
  }
}

const schedulerService = new SchedulerService();
module.exports = { schedulerService };