import type { ChatCommand } from '../../pages/chat-commands/types';
import type { BaseResponse } from './common';

class ChatCommandsAPI {
  async getCommands(): Promise<BaseResponse<Record<string, ChatCommand>>> {
    return window.backendAPI['chat-commands']({ method: 'getCommands' });
  }
  async addCustomCommand(command: string, response: string, cooldown: number): Promise<BaseResponse<boolean>> {
    return window.backendAPI['chat-commands']({ method: 'addCustomCommand', params: { command, response, cooldown } });
  }
  async updateCommand(command: string, updates: Partial<ChatCommand>): Promise<BaseResponse<boolean>> {
    return window.backendAPI['chat-commands']({ method: 'updateCommand', params: { command, updates } });
  }
  async removeCommand(command: string): Promise<BaseResponse<boolean>> {
    return window.backendAPI['chat-commands']({ method: 'removeCommand', params: { command } });
  }
  async setCommandEnabled(command: string, enabled: boolean): Promise<BaseResponse<boolean>> {
    return window.backendAPI['chat-commands']({ method: 'setCommandEnabled', params: { command, enabled } });
  }
}

export const chatCommandsAPI = new ChatCommandsAPI();