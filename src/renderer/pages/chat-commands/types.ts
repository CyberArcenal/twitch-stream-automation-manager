export interface ChatCommand {
  action: string;
  cooldown: number;
  enabled: boolean;
  response?: string;      // para sa custom reply commands
}

export type CommandFormData = {
  name: string;
  response: string;
  cooldown: number;
};