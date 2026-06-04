// hooks/useChatModeration.ts
import { useState } from 'react';
import { useModeration } from '../../../pages/stream-manager/hooks/useModeration';
import { dialogs } from '../../../utils/dialogs';

export const useChatModeration = (broadcasterId: string) => {
  const { banUser, timeoutUser, clearChat } = useModeration(broadcasterId);
  const [isBanningUser, setIsBanningUser] = useState<string | null>(null);
  const [isTimeoutingUser, setIsTimeoutingUser] = useState<string | null>(null);
  const [isClearingChat, setIsClearingChat] = useState(false);

  const banUserWithLoading = async (username: string) => {
    setIsBanningUser(username);
    try {
      await banUser(username);
    } catch {
      dialogs.error(`Failed to ban ${username}`);
    } finally {
      setIsBanningUser(null);
    }
  };

  const timeoutUserWithLoading = async (username: string, duration: number) => {
    setIsTimeoutingUser(username);
    try {
      await timeoutUser(username, duration);
    } catch {
      dialogs.error(`Failed to timeout ${username}`);
    } finally {
      setIsTimeoutingUser(null);
    }
  };

  const clearChatWithLoading = async () => {
    setIsClearingChat(true);
    try {
      await clearChat();
    } catch {
      dialogs.error('Could not clear chat.');
    } finally {
      setIsClearingChat(false);
    }
  };

  return {
    banUser: banUserWithLoading,
    timeoutUser: timeoutUserWithLoading,
    clearChat: clearChatWithLoading,
    isBanningUser,
    isTimeoutingUser,
    isClearingChat,
  };
};