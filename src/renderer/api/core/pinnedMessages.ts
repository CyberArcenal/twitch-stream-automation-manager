// src/renderer/api/core/pinnedMessages.ts
import type { BaseResponse } from './common';
import type { ChatMessage } from './chat';

class PinnedMessagesAPI {
  async get(channelName: string): Promise<BaseResponse<ChatMessage[]>> {
    return window.backendAPI['pinned-messages']({
      method: 'get',
      params: { channelName }
    });
  }

  async pin(channelName: string, message: ChatMessage): Promise<BaseResponse<boolean>> {
    return window.backendAPI['pinned-messages']({
      method: 'pin',
      params: { channelName, message }
    });
  }

  async unpin(channelName: string, messageId: string): Promise<BaseResponse<boolean>> {
    return window.backendAPI['pinned-messages']({
      method: 'unpin',
      params: { channelName, messageId }
    });
  }

  async clear(channelName: string): Promise<BaseResponse<void>> {
    return window.backendAPI['pinned-messages']({
      method: 'clear',
      params: { channelName }
    });
  }
}

export const pinnedMessagesAPI = new PinnedMessagesAPI();