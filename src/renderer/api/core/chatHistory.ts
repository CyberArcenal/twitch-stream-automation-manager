// src/renderer/api/core/chatHistory.ts
import type { BaseResponse } from './common';

export interface ChatMessageRecord {
  id: string;
  user: string;
  message: string;
  badges: any;
  timestamp: string;
}

export interface HourlyActivity {
  [hour: number]: number;
}

export interface DailyActivityPoint {
  date: string;
  count: number;
}

class ChatHistoryAPI {
  async getHourlyActivity(channel: string, daysBack: number = 7): Promise<BaseResponse<HourlyActivity>> {
    return window.backendAPI['chat-history']({
      method: 'getHourlyActivity',
      params: { channel, daysBack },
    });
  }

  async getDailyActivity(channel: string, daysBack: number = 30): Promise<BaseResponse<DailyActivityPoint[]>> {
    return window.backendAPI['chat-history']({
      method: 'getDailyActivity',
      params: { channel, daysBack },
    });
  }

  async getMessagesInRange(channel: string, startDate: Date, endDate: Date): Promise<BaseResponse<ChatMessageRecord[]>> {
    return window.backendAPI['chat-history']({
      method: 'getMessagesInRange',
      params: { channel, startDate: startDate.toISOString(), endDate: endDate.toISOString() },
    });
  }

  async clearChannelHistory(channel: string): Promise<BaseResponse<boolean>> {
    return window.backendAPI['chat-history']({
      method: 'clearChannelHistory',
      params: { channel },
    });
  }

  async clearAllHistory(): Promise<BaseResponse<boolean>> {
    return window.backendAPI['chat-history']({ method: 'clearAllHistory' });
  }
}

export const chatHistoryAPI = new ChatHistoryAPI();