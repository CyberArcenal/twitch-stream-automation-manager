export interface ScheduleParams {
  title?: string;
  game_id?: string;
  length?: number;
}

export interface ScheduledEvent {
  id: string;
  type: 'stream' | 'commercial';
  cronPattern: string;
  action: 'updateStreamInfo' | 'runCommercial';
  params: ScheduleParams;
  enabled: boolean;
  createdAt: string;
}

export type ScheduleFormData = Omit<ScheduledEvent, 'id' | 'createdAt'>;