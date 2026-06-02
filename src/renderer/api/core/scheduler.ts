import type { BaseResponse } from './common';

export interface ScheduledEvent {
  id: string;
  type: 'stream' | 'commercial';
  cronPattern: string;
  action: 'updateStreamInfo' | 'runCommercial';
  params: any;
  enabled: boolean;
  createdAt: string;
}

class SchedulerAPI {
  async getSchedules(): Promise<BaseResponse<ScheduledEvent[]>> {
    return window.backendAPI.scheduler({ method: 'getSchedules' });
  }
  async addSchedule(schedule: Omit<ScheduledEvent, 'id' | 'createdAt'>): Promise<BaseResponse<ScheduledEvent>> {
    return window.backendAPI.scheduler({ method: 'addSchedule', params: { schedule } });
  }
  async updateSchedule(id: string, updates: Partial<ScheduledEvent>): Promise<BaseResponse<ScheduledEvent>> {
    return window.backendAPI.scheduler({ method: 'updateSchedule', params: { id, updates } });
  }
  async deleteSchedule(id: string): Promise<BaseResponse<void>> {
    return window.backendAPI.scheduler({ method: 'deleteSchedule', params: { id } });
  }
}

export const schedulerAPI = new SchedulerAPI();