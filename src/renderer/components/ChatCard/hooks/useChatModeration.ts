// hooks/useChatModeration.ts
import { useState } from "react";
import { useModeration } from "../../../pages/stream-manager/hooks/useModeration";
import { dialogs } from "../../../utils/dialogs";
import { streamManagerAPI } from "../../../api/core/streamManager";

export const useChatModeration = (broadcasterId: string) => {
  const { banUser, timeoutUser, clearChat } = useModeration(broadcasterId);
  const [isBanningUser, setIsBanningUser] = useState<string | null>(null);
  const [isUnbanningUser, setIsUnbanningUser] = useState<string | null>(null);
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

  const unbanUserWithLoading = async (username: string) => {
    const confirmed = await dialogs.confirm({
      title: "Unban User",
      message: `Are you sure you want to unban ${username}?`,
    });
    if (!confirmed) return;

    setIsUnbanningUser(username);
    try {
      await streamManagerAPI.unbanUser(username);
      dialogs.success(`Unbanned ${username}`);
    } catch (err: any) {
      dialogs.error(`Failed to unban: ${err.message}`);
    } finally {
      setIsUnbanningUser(null);
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
      dialogs.error("Could not clear chat.");
    } finally {
      setIsClearingChat(false);
    }
  };

  return {
    banUser: banUserWithLoading,
    unbanUser: unbanUserWithLoading,

    timeoutUser: timeoutUserWithLoading,
    clearChat: clearChatWithLoading,
    isBanningUser,
    isUnbanningUser,
    isTimeoutingUser,
    isClearingChat,
  };
};
