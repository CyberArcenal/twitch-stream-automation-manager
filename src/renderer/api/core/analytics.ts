// src/renderer/api/core/analytics.ts
import type { BaseResponse } from './common';

export interface AnalyticsSnapshot {
  timestamp: string;
  viewerCount: number;
  followerCount: number;
  topClips: Array<{
    id: string;
    title: string;
    viewCount: number;
    createdAt: string;
    thumbnailUrl: string;
  }>;
}

export interface FollowerHistoryPoint {
  timestamp: string;
  followers: number;
}

export interface ViewerHistoryPoint {
  timestamp: string;
  viewers: number;
}

class AnalyticsAPI {
  async startCollecting(intervalMinutes: number = 15): Promise<BaseResponse<boolean>> {
    return window.backendAPI.analytics({
      method: 'startCollecting',
      params: { intervalMinutes },
    });
  }

  async stopCollecting(): Promise<BaseResponse<boolean>> {
    return window.backendAPI.analytics({ method: 'stopCollecting' });
  }

  async getSnapshots(limit?: number): Promise<BaseResponse<AnalyticsSnapshot[]>> {
    return window.backendAPI.analytics({
      method: 'getSnapshots',
      params: { limit },
    });
  }

  async getFollowerHistory(days: number = 30): Promise<BaseResponse<FollowerHistoryPoint[]>> {
    return window.backendAPI.analytics({
      method: 'getFollowerHistory',
      params: { days },
    });
  }

  async getViewerHistory(days: number = 30): Promise<BaseResponse<ViewerHistoryPoint[]>> {
    return window.backendAPI.analytics({
      method: 'getViewerHistory',
      params: { days },
    });
  }

  async clearHistory(): Promise<BaseResponse<boolean>> {
    return window.backendAPI.analytics({ method: 'clearHistory' });
  }
}

export const analyticsAPI = new AnalyticsAPI();