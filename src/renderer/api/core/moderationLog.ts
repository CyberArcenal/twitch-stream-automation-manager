import type { BaseResponse } from './common';

export interface ModerationLogEntry {
  id: string;
  action: 'ban' | 'timeout' | 'unban';
  broadcasterId: string;
  targetUserId: string;
  targetUserName: string;
  duration: number | null;
  reason: string | null;
  timestamp: string;
  undone: boolean;
  undoneAt: string | null;
}

class ModerationLogAPI {
  async getLogs(filter?: { targetUserName?: string; action?: string }): Promise<BaseResponse<ModerationLogEntry[]>> {
    return window.backendAPI['moderation-log']({
      method: 'getLogs',
      params: { filter }
    });
  }

  async getUserWarnings(userId: string): Promise<BaseResponse<ModerationLogEntry[]>> {
    return window.backendAPI['moderation-log']({
      method: 'getUserWarnings',
      params: { userId }
    });
  }

  async clearLogs(): Promise<BaseResponse<void>> {
    return window.backendAPI['moderation-log']({ method: 'clearLogs' });
  }
}

export const moderationLogAPI = new ModerationLogAPI();