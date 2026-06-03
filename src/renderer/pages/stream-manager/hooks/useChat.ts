// src/renderer/pages/stream-manager/hooks/useChat.ts
import { useState, useEffect, useRef } from "react";
import { chatAPI, type ChatMessage } from "../../../api/core/chat";
import { userAPI } from "../../../api/core/user";
import { useModeration } from "./useModeration";
import { dialogs } from "../../../utils/dialogs";
import { streamManagerAPI } from "../../../api/core/streamManager";

export const useChat = (
  channelName?: string,
  broadcasterId?: string,
  isLive?: boolean,
) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [pinnedMessages, setPinnedMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [connected, setConnected] = useState(false);
  const [currentUser, setCurrentUser] = useState("You");
  const [hoveredMsgId, setHoveredMsgId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { banUser, timeoutUser, clearChat } = useModeration(
    broadcasterId || "",
  );
  const channelNameRef = useRef(channelName);

  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isBanning, setIsBanning] = useState<string | null>(null);
  const [isTimeouting, setIsTimeouting] = useState<string | null>(null);
  const [isClearingChat, setIsClearingChat] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Track last message per user for duplicate filtering
  const lastUserMessage = useRef<
    Map<string, { text: string; timestamp: number }>
  >(new Map());

  // Helper function to detect duplicate messages (same user + same text within 30 seconds)
  const isDuplicateMessage = (
    user: string,
    messageText: string,
    currentTime: number,
    isFromMe?: boolean,
  ): boolean => {
    if (isFromMe) return false; // Always allow own messages

    const last = lastUserMessage.current.get(user);
    if (
      last &&
      last.text === messageText &&
      currentTime - last.timestamp < 30000
    ) {
      console.log(
        `[Chat] Duplicate message from ${user} within 30s: "${messageText}" → skipped`,
      );
      return true;
    }
    // Update the map with this new message
    lastUserMessage.current.set(user, {
      text: messageText,
      timestamp: currentTime,
    });
    return false;
  };

  // Keep channelNameRef up to date
  useEffect(() => {
    channelNameRef.current = channelName;
  }, [channelName]);

  // Load pinned messages from localStorage
  useEffect(() => {
    if (channelName) {
      const stored = localStorage.getItem(`pinned_${channelName}`);
      if (stored) {
        try {
          setPinnedMessages(JSON.parse(stored));
        } catch (e) {}
      }
    }
  }, [channelName]);

  // Save pinned messages to localStorage whenever they change
  useEffect(() => {
    if (channelName) {
      localStorage.setItem(
        `pinned_${channelName}`,
        JSON.stringify(pinnedMessages),
      );
    }
  }, [pinnedMessages, channelName]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, pinnedMessages]);

  // Fetch current user
  useEffect(() => {
    const fetchUser = async () => {
      const res = await userAPI.getCurrentUser();
      if (res.status && res.data?.display_name)
        setCurrentUser(res.data.display_name);
    };
    fetchUser();
  }, []);

  // Connect / disconnect
  useEffect(() => {
    if (!channelName || !isLive) {
      if (connected) {
        chatAPI.disconnect().catch(console.error);
        setConnected(false);
        setMessages([]);
      }
      return;
    }
    const connect = async () => {
      try {
        await chatAPI.connect(channelName);
        setConnected(true);
        // Load recent messages from backend
        const recentRes = await chatAPI.getRecentMessages?.(channelName);
        if (recentRes?.status && recentRes.data) {
          const formatted = recentRes.data.map((m) => ({
            ...m,
            id: m.messageId || m.id,
          }));
          setMessages(formatted);
        }
      } catch (err) {
        console.error(err);
        setConnected(false);
      }
    };
    connect();
    return () => {
      chatAPI.disconnect().catch(console.error);
      setConnected(false);
    };
  }, [channelName, isLive]);

  // Socket message listener (with duplicate filter)
  useEffect(() => {
    const handleMessage = (rawMsg: any) => {
      console.log("[Chat] IPC message received:", rawMsg);
      const currentChannel = channelNameRef.current;
      if (rawMsg.channel === currentChannel) {
        const msg: ChatMessage = {
          ...rawMsg,
          id: rawMsg.messageId || rawMsg.id,
          message: rawMsg.message,
          user: rawMsg.user,
          channel: rawMsg.channel,
          timestamp: rawMsg.timestamp,
          badges: rawMsg.badges || [],
          emotes: rawMsg.emotes,
          parsedMessage: rawMsg.parsedMessage,
          isFromMe: rawMsg.isFromMe,
          replyParentMsgId: rawMsg.replyParentMsgId,
        };

        const msgTime = new Date(msg.timestamp).getTime();
        // Check duplicate (same user + same message text within 30s)
        if (isDuplicateMessage(msg.user, msg.message, msgTime, msg.isFromMe)) {
          return; // Skip adding this message
        }

        console.log("[Chat] Channel matches, adding message:", msg.message);
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg].slice(-200);
        });
      } else {
        console.log(
          "[Chat] Channel mismatch:",
          rawMsg.channel,
          "vs",
          currentChannel,
        );
      }
    };

    const unsubMsg = window.backendAPI?.on?.("chat:message", handleMessage);
    return () => {
      unsubMsg?.();
    };
  }, []); // runs once on mount – listener stays alive

  // Connection status listeners
  useEffect(() => {
    const handleConnected = () => setConnected(true);
    const handleDisconnected = () => setConnected(false);
    window.backendAPI?.on?.("chat:connected", handleConnected);
    window.backendAPI?.on?.("chat:disconnected", handleDisconnected);
    return () => {
      window.backendAPI?.off?.("chat:connected", handleConnected);
      window.backendAPI?.off?.("chat:disconnected", handleDisconnected);
    };
  }, []);

  // Fallback: poll recent messages every 10 seconds (with duplicate filter)
  useEffect(() => {
    if (!connected || !channelName) return;
    const interval = setInterval(async () => {
      try {
        const recentRes = await chatAPI.getRecentMessages?.(channelName);
        if (recentRes?.status && recentRes.data) {
          setMessages((prev) => {
            const newMessages = recentRes.data.filter((msg) => {
              const msgId = msg.messageId || msg.id;
              // Skip if already in list by ID
              if (prev.some((p) => p.id === msgId)) return false;
              // Apply duplicate filter
              const msgTime = new Date(msg.timestamp).getTime();
              if (
                isDuplicateMessage(msg.user, msg.message, msgTime, msg.isFromMe)
              ) {
                return false;
              }
              return true;
            });
            if (newMessages.length === 0) return prev;
            const formatted = newMessages.map((m) => ({
              ...m,
              id: m.messageId || m.id,
            }));
            return [...prev, ...formatted].slice(-200);
          });
        }
      } catch (err) {
        console.error("Fallback message fetch failed", err);
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [connected, channelName]);

  // Send message (with loading state)
  const sendMessage = async (text: string, replyToId?: string) => {
    if (!text.trim() || !connected) return false;
    setIsSending(true);
    try {
      await chatAPI.send(text, replyToId);
      const localMsg: ChatMessage = {
        id: `local-${Date.now()}`,
        messageId: `local-${Date.now()}`,
        channel: channelName || "",
        user: currentUser,
        message: text,
        badges: [],
        emotes: null,
        timestamp: new Date().toISOString(),
        isFromMe: true,
        replyParentMsgId: replyToId,
      };
      setMessages((prev) => [...prev, localMsg].slice(-200));
      setInput("");
      return true;
    } catch (err) {
      console.error(err);
      dialogs.error("Failed to send message.");
      return false;
    } finally {
      setIsSending(false);
    }
  };

  // Clear chat (with loading)
  const clearChatMessages = async () => {
    if (!broadcasterId) return;
    setIsClearingChat(true);
    try {
      await clearChat();
      setMessages([]);
    } catch (err) {
      dialogs.error("Could not clear chat.");
    } finally {
      setIsClearingChat(false);
    }
  };

  const mentionUser = (username: string) => {
    if (!inputRef.current) return;
    const start = inputRef.current.selectionStart || 0;
    const end = inputRef.current.selectionEnd || 0;
    const mention = `@${username} `;
    const newValue = input.slice(0, start) + mention + input.slice(end);
    setInput(newValue);
    setTimeout(() => {
      inputRef.current?.focus();
      const newPos = start + mention.length;
      inputRef.current?.setSelectionRange(newPos, newPos);
    }, 0);
  };

  const pinMessage = (msg: ChatMessage) => {
    setPinnedMessages((prev) => {
      if (prev.some((p) => p.id === msg.id)) return prev;
      return [...prev, msg];
    });
  };

  const unpinMessage = (msgId: string) => {
    setPinnedMessages((prev) => prev.filter((msg) => msg.id !== msgId));
  };

  const deleteMessage = async (msgId: string) => {
    if (!broadcasterId) {
      dialogs.error("No broadcaster ID");
      return;
    }
    setIsDeleting(msgId);
    try {
      const res = await streamManagerAPI.deleteMessage(msgId);
      if (res.status) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === msgId
              ? {
                  ...msg,
                  message: "[Message removed]",
                  isDeleted: true,
                  deletedAt: new Date().toISOString(),
                }
              : msg,
          ),
        );
        setPinnedMessages((prev) =>
          prev.map((msg) =>
            msg.id === msgId
              ? {
                  ...msg,
                  message: "[Message removed]",
                  isDeleted: true,
                  deletedAt: new Date().toISOString(),
                }
              : msg,
          ),
        );
      } else {
        dialogs.error(`Delete failed: ${res.message}`);
      }
    } catch (err) {
      console.error("Delete error", err);
      dialogs.error("Could not delete message. Make sure you are a moderator.");
    } finally {
      setIsDeleting(null);
    }
  };

  const banUserWithLoading = async (username: string) => {
    setIsBanning(username);
    try {
      await banUser(username);
    } catch (err) {
      dialogs.error(`Failed to ban ${username}`);
    } finally {
      setIsBanning(null);
    }
  };

  const timeoutUserWithLoading = async (username: string, duration: number) => {
    setIsTimeouting(username);
    try {
      await timeoutUser(username, duration);
    } catch (err) {
      dialogs.error(`Failed to timeout ${username}`);
    } finally {
      setIsTimeouting(null);
    }
  };

  return {
    messages,
    pinnedMessages,
    input,
    setInput,
    connected,
    hoveredMsgId,
    setHoveredMsgId,
    messagesEndRef,
    inputRef,
    sendMessage,
    clearChatMessages,
    mentionUser,
    banUser: banUserWithLoading,
    timeoutUser: timeoutUserWithLoading,
    pinMessage,
    unpinMessage,
    deleteMessage,
    currentUser,
    isDeleting,
    isBanning,
    isTimeouting,
    isClearingChat,
    isSending,
  };
};
