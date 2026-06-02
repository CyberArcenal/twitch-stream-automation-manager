import type { BaseResponse } from './common';

export interface ChatCommand {
  action: string;
  cooldown: number;
  enabled: boolean;
  userCooldowns?: Map<string, number>;
}

class ChatCommandsAPI {
  async getCommands(): Promise<BaseResponse<Record<string, ChatCommand>>> {
    return window.backendAPI['chat-commands']({ method: 'getCommands' });
  }
  async addCommand(command: string, action: string, cooldown: number): Promise<BaseResponse<boolean>> {
    return window.backendAPI['chat-commands']({ method: 'addCommand', params: { command, action, cooldown } });
  }
  async removeCommand(command: string): Promise<BaseResponse<boolean>> {
    return window.backendAPI['chat-commands']({ method: 'removeCommand', params: { command } });
  }
  async setCommandEnabled(command: string, enabled: boolean): Promise<BaseResponse<boolean>> {
    return window.backendAPI['chat-commands']({ method: 'setCommandEnabled', params: { command, enabled } });
  }
}

export const chatCommandsAPI = new ChatCommandsAPI();