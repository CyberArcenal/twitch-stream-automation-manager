// src/renderer/pages/stream-manager/hooks/useChat.ts
import { useState, useEffect, useRef } from "react";
import { chatAPI, type ChatMessage } from "../../../api/core/chat";
import { userAPI } from "../../../api/core/user";
import { useModeration } from "./useModeration";
import { dialogs } from "../../../utils/dialogs";

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
  const { banUser, timeoutUser, clearChat } = useModeration(broadcasterId || "");
  const channelNameRef = useRef(channelName);

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
      localStorage.setItem(`pinned_${channelName}`, JSON.stringify(pinnedMessages));
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
          // Ensure each recent message has an id (they should)
          const formatted = recentRes.data.map(m => ({
            ...m,
            id: m.messageId || m.id, // fallback to messageId if present
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

  // 🧩 ALWAYS attach the message listener (independent of `connected` state)
  useEffect(() => {
    const handleMessage = (rawMsg: any) => {
      console.log("[Chat] IPC message received:", rawMsg);
      const currentChannel = channelNameRef.current;
      if (rawMsg.channel === currentChannel) {
        // Convert the raw message to a proper ChatMessage object
        const msg: ChatMessage = {
          ...rawMsg,
          id: rawMsg.messageId || rawMsg.id, // ✅ critical: use messageId as id
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
        console.log("[Chat] Channel matches, adding message:", msg.message);
        setMessages((prev) => {
          // Deduplicate by id (now we have a proper string id)
          if (prev.some((m) => m.id === msg.id)) {
            console.log("[Chat] Duplicate skipped, id:", msg.id);
            return prev;
          }
          return [...prev, msg].slice(-200);
        });
      } else {
        console.log("[Chat] Channel mismatch:", rawMsg.channel, "vs", currentChannel);
      }
    };

    const unsubMsg = window.backendAPI?.on?.("chat:message", handleMessage);
    return () => {
      unsubMsg?.();
    };
  }, []); // runs once on mount – listener stays alive

  // Also listen for connection status changes to show the indicator
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

  // Fallback: poll recent messages every 10 seconds to catch any missed messages
  useEffect(() => {
    if (!connected || !channelName) return;
    const interval = setInterval(async () => {
      try {
        const recentRes = await chatAPI.getRecentMessages?.(channelName);
        if (recentRes?.status && recentRes.data) {
          setMessages((prev) => {
            const newMessages = recentRes.data.filter((msg) => {
              const msgId = msg.messageId || msg.id;
              return !prev.some((p) => p.id === msgId);
            });
            if (newMessages.length === 0) return prev;
            const formatted = newMessages.map(m => ({
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

  const sendMessage = async (text: string, replyToId?: string) => {
    if (!text.trim() || !connected) return false;
    try {
      await chatAPI.send(text, replyToId);
      // local echo
      const localMsg: ChatMessage = {
        id: `local-${Date.now()}`,
        messageId: `local-${Date.now()}`, // for consistency
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
    }
  };

  const clearChatMessages = async () => {
    if (!broadcasterId) return;
    try {
      await clearChat();
      setMessages([]);
    } catch (err) {
      dialogs.error("Could not clear chat.");
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

  const deleteMessage = (msgId: string) => {
    setMessages((prev) => prev.filter((msg) => msg.id !== msgId));
    setPinnedMessages((prev) => prev.filter((msg) => msg.id !== msgId));
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
    banUser,
    timeoutUser,
    pinMessage,
    unpinMessage,
    deleteMessage,
    currentUser,
  };
};