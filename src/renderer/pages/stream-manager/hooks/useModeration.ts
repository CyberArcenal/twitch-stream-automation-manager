import { useCallback } from 'react';
import { streamManagerAPI } from '../../../api/core/streamManager';
import { moderationLogAPI } from '../../../api/core/moderationLog';

export const useModeration = (broadcasterId: string) => {
  const banUser = useCallback(async (username: string) => {
    const res = await streamManagerAPI.banUser(broadcasterId, username);
    if (!res.status) throw new Error(res.message);
  }, [broadcasterId]);

  const timeoutUser = useCallback(async (username: string, durationSeconds: number = 600) => {
    const res = await streamManagerAPI.timeoutUser(broadcasterId, username, durationSeconds);
    if (!res.status) throw new Error(res.message);
  }, [broadcasterId]);

  const clearChat = useCallback(async () => {
    const res = await streamManagerAPI.clearChat(broadcasterId);
    if (!res.status) throw new Error(res.message);
  }, [broadcasterId]);

  const undoLastAction = useCallback(async () => {
    const logsRes = await moderationLogAPI.getLogs();
    if (!logsRes.status || logsRes.data.length === 0) {
      dialogs.error('No actions to undo');
      return;
    }
    const lastAction = logsRes.data[0];
    if (lastAction.action === 'ban' || lastAction.action === 'timeout') {
      const unbanRes = await streamManagerAPI.unbanUser(lastAction.targetUserName);
      if (unbanRes.status) {
        dialogs.error(`Undid ${lastAction.action} on ${lastAction.targetUserName}`);
      } else {
        dialogs.error('Undo failed');
      }
    } else {
      dialogs.error(`Cannot undo ${lastAction.action}`);
    }
  }, []);

  return { banUser, timeoutUser, clearChat, undoLastAction };
};