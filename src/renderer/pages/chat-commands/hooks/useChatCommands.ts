import { useState, useEffect, useCallback } from 'react';
import { chatCommandsAPI } from '../../../api/core/chatCommands';
import type { ChatCommand } from '../types';
import { dialogs } from '../../../utils/dialogs';

export const useChatCommands = () => {
  const [commands, setCommands] = useState<Record<string, ChatCommand>>({});
  const [loading, setLoading] = useState(true);

  const fetchCommands = useCallback(async () => {
    try {
      const res = await chatCommandsAPI.getCommands();
      if (res.status) setCommands(res.data);
    } catch (err) {
      console.error('Failed to fetch commands', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCommands();
  }, [fetchCommands]);

  const addCommand = async (name: string, response: string, cooldown: number) => {
    const res = await chatCommandsAPI.addCustomCommand(name, response, cooldown);
    if (res.status) fetchCommands();
    return res;
  };

  const updateCommand = async (name: string, updates: Partial<ChatCommand>) => {
    const res = await chatCommandsAPI.updateCommand(name, updates);
    if (res.status) fetchCommands();
    return res;
  };

  const deleteCommand = async (name: string) => {
    if (!(await dialogs.confirm({ title: `Delete command "${name}"?` }))) return;
    const res = await chatCommandsAPI.removeCommand(name);
    if (res.status) fetchCommands();
    return res;
  };

  const toggleEnabled = async (name: string, currentEnabled: boolean) => {
    await chatCommandsAPI.setCommandEnabled(name, !currentEnabled);
    fetchCommands();
  };

  return {
    commands,
    loading,
    addCommand,
    updateCommand,
    deleteCommand,
    toggleEnabled,
    refresh: fetchCommands,
  };
};