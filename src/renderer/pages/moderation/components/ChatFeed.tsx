import React, { useState, useEffect, useRef } from "react";
import { MessageSquare, Ban, Clock, Trash2, User } from "lucide-react";
import { chatAPI, type ChatMessage } from "../../../api/core/chat";
import { streamManagerAPI } from "../../../api/core/streamManager";
import { formatDistanceToNow } from "date-fns";

interface ChatFeedProps {
  broadcasterId: string;
  channelName: string;
  onSelectUser: (userId: string, userName: string) => void;
}

export const ChatFeed: React.FC<ChatFeedProps> = ({
  broadcasterId,
  channelName,
  onSelectUser,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [connected, setConnected] = useState(false);
  const [hoveredMsgId, setHoveredMsgId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load recent messages on connect
  useEffect(() => {
    if (!channelName) return;

    const connect = async () => {
      try {
        await chatAPI.connect(channelName);
        setConnected(true);
        const recent = await chatAPI.getRecentMessages(channelName);
        if (recent.status && recent.data) setMessages(recent.data);
      } catch (err) {
        console.error("Chat connection failed", err);
      }
    };
    connect();

    return () => {
      chatAPI.disconnect().catch(console.error);
    };
  }, [channelName]);

  // Listen for new messages
  useEffect(() => {
    if (!connected) return;
    const unsub = window.backendAPI?.on?.("chat:message", (msg: ChatMessage) => {
      if (msg.channel === channelName) {
        setMessages((prev) => [...prev, msg].slice(-200));
      }
    });
    return () => unsub?.();
  }, [connected, channelName]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleTimeout = async (userName: string, duration: number) => {
    try {
      await streamManagerAPI.timeoutUser(broadcasterId, userName, duration);
    } catch (err) {
      console.error("Timeout failed", err);
    }
  };

  const handleBan = async (userName: string) => {
    try {
      await streamManagerAPI.banUser(broadcasterId, userName);
    } catch (err) {
      console.error("Ban failed", err);
    }
  };

  const handleDeleteMessage = async (msgId: string) => {
    // Twitch does not have a delete message API, only clear chat.
    // We'll just remove it from local state (soft delete).
    setMessages((prev) => prev.filter((m) => m.id !== msgId));
  };

  if (!connected) {
    return (
      <div className="bg-[var(--card-bg)] rounded-xl p-5 border border-[var(--card-bg)] text-center text-[var(--text-secondary)]">
        Connecting to chat…
      </div>
    );
  }

  return (
    <div className="bg-[var(--card-bg)] rounded-xl shadow-md border border-[var(--card-bg)] flex flex-col h-[500px]">
      <div className="p-3 border-b border-[var(--card-bg)] flex items-center gap-2">
        <MessageSquare className="w-5 h-5 text-[#9147ff]" />
        <h3 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider">
          Live Chat
        </h3>
        <span className="ml-auto text-xs text-green-400">● LIVE</span>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`group flex items-start gap-2 p-2 rounded-lg transition ${
              msg.isFromMe ? "bg-[#2a2a2e]/50" : "hover:bg-[#2a2a2e]"
            }`}
            onMouseEnter={() => setHoveredMsgId(msg.id)}
            onMouseLeave={() => setHoveredMsgId(null)}
          >
            {/* Avatar placeholder */}
            <div className="w-6 h-6 rounded-full bg-[var(--primary-color)] flex items-center justify-center text-xs font-bold">
              {msg.user.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onSelectUser(msg.user, msg.user)}
                  className="text-sm font-semibold text-[var(--text-primary)] hover:text-[#9147ff] transition"
                >
                  {msg.user}
                </button>
                <span className="text-xs text-[var(--text-secondary)]">
                  {formatDistanceToNow(new Date(msg.timestamp), { addSuffix: true })}
                </span>
              </div>
              <p className="text-sm text-[var(--text-primary)] break-words">{msg.message}</p>
            </div>
            {hoveredMsgId === msg.id && !msg.isFromMe && (
              <div className="flex gap-1">
                <button
                  onClick={() => handleTimeout(msg.user, 60)}
                  className="p-1 rounded bg-[#2a2a2e] hover:bg-[#3a3a4a]"
                  title="Timeout 1m"
                >
                  <Clock className="w-4 h-4 text-yellow-400" />
                </button>
                <button
                  onClick={() => handleBan(msg.user)}
                  className="p-1 rounded bg-[#2a2a2e] hover:bg-red-500/20"
                  title="Ban"
                >
                  <Ban className="w-4 h-4 text-red-400" />
                </button>
                <button
                  onClick={() => handleDeleteMessage(msg.id)}
                  className="p-1 rounded bg-[#2a2a2e] hover:bg-red-500/20"
                  title="Delete message (local)"
                >
                  <Trash2 className="w-4 h-4 text-[var(--text-secondary)]" />
                </button>
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};