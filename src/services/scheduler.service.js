// src/main/services/scheduler.service.js
const Store = require('electron-store');
const { logger } = require('../utils/logger');
const { streamManagerService } = require('./stream-manager.service');
const { settingsService } = require('./settings.service');

class SchedulerService {
  constructor() {
    this.store = new Store({ name: 'scheduler' });
    this.intervals = new Map();
    this.dailyJobs = new Map(); // store daily job timeouts
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

  /**
   * Schedule a job based on cronPattern
   * Supported patterns:
   * - "every X minutes" / "every X hours" (interval)
   * - "daily at HH:MM" (e.g., "daily at 15:30")
   */
  scheduleJob(schedule) {
    const { id, type, cronPattern, action, params } = schedule;
    const intervalMs = this.parseInterval(cronPattern);
    if (intervalMs) {
      // interval-based
      const intervalId = setInterval(async () => {
        await this.executeScheduledAction(id, type, action, params);
      }, intervalMs);
      this.intervals.set(id, intervalId);
      logger.info(`[Scheduler] Scheduled interval job ${id}: every ${intervalMs/1000}s`);
      return;
    }

    const dailyTime = this.parseDailyTime(cronPattern);
    if (dailyTime) {
      // daily job: compute next execution time
      const scheduleDaily = () => {
        const now = new Date();
        let next = new Date();
        next.setHours(dailyTime.hours, dailyTime.minutes, 0, 0);
        if (next <= now) next.setDate(next.getDate() + 1);
        const delay = next - now;
        const timeoutId = setTimeout(async () => {
          await this.executeScheduledAction(id, type, action, params);
          // re-schedule for next day
          scheduleDaily();
        }, delay);
        this.dailyJobs.set(id, timeoutId);
        logger.info(`[Scheduler] Scheduled daily job ${id} at ${dailyTime.hours}:${dailyTime.minutes}, next run in ${Math.round(delay/1000)}s`);
      };
      scheduleDaily();
      return;
    }

    logger.warn(`[Scheduler] Unsupported cron pattern: ${cronPattern}`);
  }

  parseInterval(pattern) {
    const match = pattern.match(/every (\d+) (minute|minutes|hour|hours)/i);
    if (match) {
      const value = parseInt(match[1]);
      const unit = match[2].toLowerCase();
      if (unit.startsWith('minute')) return value * 60 * 1000;
      if (unit.startsWith('hour')) return value * 60 * 60 * 1000;
    }
    return null;
  }

  parseDailyTime(pattern) {
    const match = pattern.match(/daily at (\d{1,2}):(\d{2})/i);
    if (match) {
      const hours = parseInt(match[1]);
      const minutes = parseInt(match[2]);
      if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
        return { hours, minutes };
      }
    }
    return null;
  }

  async executeScheduledAction(scheduleId, type, action, params) {
    try {
      logger.info(`[Scheduler] Executing scheduled ${type}: ${action} (schedule ${scheduleId})`);
      await this.executeAction(type, action, params);
    } catch (err) {
      logger.error(`[Scheduler] Failed to execute schedule ${scheduleId}:`, err);
    }
  }

  async executeAction(type, action, params) {
    const broadcasterId = settingsService.get('twitch')?.userId;
    if (!broadcasterId) throw new Error('Not logged in');

    switch (action) {
      case 'updateStreamInfo':
        // params should contain { title, game_id }
        if (!params || (!params.title && !params.game_id)) {
          throw new Error('Missing title or game_id for updateStreamInfo');
        }
        await streamManagerService.updateStreamInfo(broadcasterId, params);
        logger.info(`[Scheduler] Stream info updated: title="${params.title}", game_id=${params.game_id}`);
        break;
      case 'runCommercial':
        await streamManagerService.runCommercial(broadcasterId, params?.length || 30);
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
    if (this.dailyJobs.has(id)) {
      clearTimeout(this.dailyJobs.get(id));
      this.dailyJobs.delete(id);
    }
  }

  cancelAll() {
    for (const [id] of this.intervals) {
      clearInterval(this.intervals.get(id));
    }
    for (const [id] of this.dailyJobs) {
      clearTimeout(this.dailyJobs.get(id));
    }
    this.intervals.clear();
    this.dailyJobs.clear();
  }

  getSchedules() {
    return this.store.get('schedules', []);
  }
}

const schedulerService = new SchedulerService();
module.exports = { schedulerService };