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

  const messageIdsRef = useRef<Set<string>>(new Set());
  const lastUserMessageRef = useRef<
    Map<string, { text: string; timestamp: number }>
  >(new Map());
  const cleanupTimerRef = useRef<ReturnType<typeof setTimeout>>(0);
  const sentMessagesRef = useRef<Map<string, { text: string; timestamp: number; localId: string }>>(new Map());

  const isDuplicateMessage = (
    msgId: string,
    user: string,
    text: string,
    timestamp: number,
    isFromMe?: boolean,
    existingIds?: Set<string>
  ): boolean => {
    if (isFromMe) return false;

    // Primary check: ID-based deduplication
    if (messageIdsRef.current.has(msgId) || existingIds?.has(msgId)) {
      console.log(`[Chat] Duplicate ID detected: ${msgId} → skipped`);
      return true;
    }

    // Secondary check: Content-based deduplication (same user sending same text)
    const lastMsg = lastUserMessageRef.current.get(user);
    if (
      lastMsg &&
      lastMsg.text === text &&
      timestamp - lastMsg.timestamp < 5000
    ) {
      console.log(`[Chat] Duplicate content from ${user}: "${text}" → skipped`);
      return true;
    }

    return false;
  };

  // Cleanup old entries from tracking map to prevent memory leak
  const cleanupTrackedMessages = () => {
    if (cleanupTimerRef.current) clearTimeout(cleanupTimerRef.current);
    cleanupTimerRef.current = setTimeout(() => {
      const now = Date.now();
      // Clear sent messages older than 30 seconds
      for (const [key, data] of sentMessagesRef.current.entries()) {
        if (now - data.timestamp > 30000) {
          sentMessagesRef.current.delete(key);
        }
      }
      messageIdsRef.current.clear();
      lastUserMessageRef.current.clear();
    }, 60000); // Cleanup every 60 seconds
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
      // Track all loaded message IDs
      formatted.forEach((m) => messageIdsRef.current.add(m.id));
    }
  };

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (cleanupTimerRef.current) clearTimeout(cleanupTimerRef.current);
    };
  }, []);

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

      if (isDuplicateMessage(msg.id, msg.user, msg.message, msgTime, msg.isFromMe)) {
        return;
      }

      setMessages((prev) => {
        // Check if this is a sent message (replace local with real)
        const sentKey = `${msg.user}:${msg.message}`;
        const sentData = sentMessagesRef.current.get(sentKey);

        if (sentData && msg.isFromMe) {
          // Replace local message with real one
          sentMessagesRef.current.delete(sentKey);
          messageIdsRef.current.add(msg.id);
          return prev.map((m) =>
            m.id === sentData.localId ? msg : m
          );
        }

        // Double-check with current state before adding
        if (prev.some((m) => m.id === msg.id)) return prev;

        // Track this message ID to prevent future duplicates
        messageIdsRef.current.add(msg.id);
        lastUserMessageRef.current.set(msg.user, {
          text: msg.message,
          timestamp: msgTime,
        });
        cleanupTrackedMessages();

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
          const existingIds = new Set(prev.map((m) => m.id));
          const newMsgs = res.data.filter((m) => {
            const id = m.messageId || m.id;
            // Skip if already in current messages
            if (existingIds.has(id)) return false;

            const msgTime = new Date(m.timestamp).getTime();
            // Skip if duplicate by content
            if (isDuplicateMessage(id, m.user, m.message, msgTime, m.isFromMe, existingIds)) {
              return false;
            }
            return true;
          });

          if (newMsgs.length === 0) return prev;

          const formatted = newMsgs.map((m) => {
            const id = m.messageId || m.id;
            const msgTime = new Date(m.timestamp).getTime();
            messageIdsRef.current.add(id);
            lastUserMessageRef.current.set(m.user, {
              text: m.message,
              timestamp: msgTime,
            });
            return { ...m, id };
          });

          cleanupTrackedMessages();
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
