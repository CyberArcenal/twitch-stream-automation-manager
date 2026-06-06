// hooks/useChatMessages.ts
import { useState, useEffect, useRef } from "react";
import { chatAPI, type ChatMessage } from "../../../api/core/chat";
import { streamManagerAPI } from "../../../api/core/streamManager";
import { dialogs } from "../../../utils/dialogs";
import { pinnedMessagesAPI } from "../../../api/core/pinnedMessages";

export const useChatMessages = (channelName?: string, currentUser?: string) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [pinnedMessages, setPinnedMessages] = useState<ChatMessage[]>([]);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  const lastUserMessage = useRef<
    Map<string, { text: string; timestamp: number }>
  >(new Map());

  const isDuplicateMessage = (
    user: string,
    text: string,
    timestamp: number,
    isFromMe?: boolean,
  ): boolean => {
    if (isFromMe) return false;
    const last = lastUserMessage.current.get(user);
    if (last && last.text === text && timestamp - last.timestamp < 30000) {
      console.log(`[Chat] Duplicate from ${user}: "${text}" → skipped`);
      return true;
    }
    lastUserMessage.current.set(user, { text, timestamp });
    return false;
  };

  // Load recent messages from backend on connect
  const loadRecentMessages = async () => {
    if (!channelName) return;
    const res = await chatAPI.getRecentMessages?.(channelName);
    if (res?.status && res.data) {
      const formatted = res.data.map((m) => ({
        ...m,
        id: m.messageId || m.id,
      }));
      setMessages(formatted);
    }
  };

  const loadPinnedMessages = async () => {
    if (!channelName) return;
    const res = await pinnedMessagesAPI.get(channelName);
    if (res.status && res.data) {
      setPinnedMessages(res.data);
    }
  };

  const pinMessage = async (msg: ChatMessage) => {
    if (!channelName) return;
    const res = await pinnedMessagesAPI.pin(channelName, msg);
    if (res.status) {
      // Optimistically update UI
      setPinnedMessages((prev) => [
        msg,
        ...prev.filter((m) => m.id !== msg.id),
      ]);
    }
  };

  // Socket message listener
  useEffect(() => {
    const handleMessage = (rawMsg: any) => {
      if (rawMsg.channel !== channelName) return;
      const msg: ChatMessage = {
        ...rawMsg,
        id: rawMsg.messageId || rawMsg.id,
      };
      const msgTime = new Date(msg.timestamp).getTime();
      if (isDuplicateMessage(msg.user, msg.message, msgTime, msg.isFromMe))
        return;
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg].slice(-200);
      });
    };
    const unsub = window.backendAPI?.on?.("chat:message", handleMessage);
    return () => unsub?.();
  }, [channelName]);

  // Fallback polling
  useEffect(() => {
    if (!channelName) return;
    const interval = setInterval(async () => {
      const res = await chatAPI.getRecentMessages?.(channelName);
      if (res?.status && res.data) {
        setMessages((prev) => {
          const newMsgs = res.data.filter((m) => {
            const id = m.messageId || m.id;
            if (prev.some((p) => p.id === id)) return false;
            const msgTime = new Date(m.timestamp).getTime();
            if (isDuplicateMessage(m.user, m.message, msgTime, m.isFromMe))
              return false;
            return true;
          });
          if (newMsgs.length === 0) return prev;
          const formatted = newMsgs.map((m) => ({
            ...m,
            id: m.messageId || m.id,
          }));
          return [...prev, ...formatted].slice(-200);
        });
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [channelName]);

  useEffect(() => {
  const handleMessageDeleted = (data: { channel: string; messageId: string; deletedBy: string }) => {
    if (data.channel !== channelName) return;
    setMessages(prev => prev.map(msg =>
      msg.id === data.messageId || msg.messageId === data.messageId
        ? { ...msg, isDeleted: true, message: "[Message removed by moderator]", deletedReason: `Deleted by ${data.deletedBy}` }
        : msg
    ));
    setPinnedMessages(prev => prev.map(msg =>
      msg.id === data.messageId || msg.messageId === data.messageId
        ? { ...msg, isDeleted: true, message: "[Message removed by moderator]", deletedReason: `Deleted by ${data.deletedBy}` }
        : msg
    ));
  };
  const unsub = window.backendAPI?.on?.('chat:message-deleted', handleMessageDeleted);
  return () => unsub?.();
}, [channelName]);

  // Send message
  const sendMessage = async (text: string, replyToId?: string) => {
    if (!text.trim() || !channelName) return false;
    setIsSending(true);
    try {
      await chatAPI.send(text, replyToId);
      const localMsg: ChatMessage = {
        id: `local-${Date.now()}`,
        messageId: `local-${Date.now()}`,
        channel: channelName,
        user: currentUser || "You",
        message: text,
        badges: [],
        emotes: null,
        timestamp: new Date().toISOString(),
        isFromMe: true,
        replyParentMsgId: replyToId,
      };
      setMessages((prev) => [...prev, localMsg].slice(-200));
      return true;
    } catch (err) {
      dialogs.error("Failed to send message.");
      return false;
    } finally {
      setIsSending(false);
    }
  };

  // Delete message (with loading)
  const deleteMessage = async (msgId: string, broadcasterId: string) => {
    setIsDeletingId(msgId);
    try {
      const res = await streamManagerAPI.deleteMessage(msgId);
      if (res.status) {
        const updateFn = (msg: ChatMessage) =>
          msg.id === msgId
            ? { ...msg, message: "[Message removed]", isDeleted: true }
            : msg;
        setMessages((prev) => prev.map(updateFn));
        setPinnedMessages((prev) => prev.map(updateFn));
      } else {
        dialogs.error(`Delete failed: ${res.message}`);
      }
    } catch {
      dialogs.error("Could not delete message.");
    } finally {
      setIsDeletingId(null);
    }
  };

  // Unpin message
  const unpinMessage = async (msgId: string) => {
    if (!channelName) return;
    const res = await pinnedMessagesAPI.unpin(channelName, msgId);
    if (res.status) {
      setPinnedMessages((prev) => prev.filter((m) => m.id !== msgId));
    }
  };

  // Save pinned to localStorage
  useEffect(() => {
    if (channelName) {
      localStorage.setItem(
        `pinned_${channelName}`,
        JSON.stringify(pinnedMessages),
      );
    }
  }, [pinnedMessages, channelName]);

  // Listen for real‑time updates from main process (when pins change elsewhere)
  useEffect(() => {
    const handlePinnedUpdate = (data: any) => {
      if (data.channelName === channelName) {
        setPinnedMessages(data.pinned);
      }
    };
    const unsub = window.backendAPI?.on?.("pinned:updated", handlePinnedUpdate);
    return () => unsub?.();
  }, [channelName]);

  // Load pinned on mount and when channel changes
  useEffect(() => {
    if (channelName) {
      loadPinnedMessages();
    }
  }, [channelName]);

  return {
    messages,
    pinnedMessages,
    sendMessage,
    deleteMessage,
    pinMessage,
    unpinMessage,
    loadRecentMessages,
    isDeletingId,
    isSending,
  };
};
