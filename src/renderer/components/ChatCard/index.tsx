// src/renderer/pages/stream-manager/components/ChatCard.tsx
import React, { useEffect, useMemo, useRef } from "react";
import { MessageSquare, Trash2 } from "lucide-react";
import {
  useChatConnection,
  useChatInput,
  useChatMessages,
  useChatModeration,
} from "./hooks";
import { userAPI } from "../../api/core/user";
import { ChatInput } from "./components/ChatInput";
import ChatMessageItem from "./components/ChatMessageItem";

interface ChatCardProps {
  channelName?: string;
  broadcasterId?: string;
  isLive: boolean;
  fromModeration?: boolean;
  className?: string;
  onSelectUser?: (userId: string, userName: string) => void;
}

const ChatCard: React.FC<ChatCardProps> = ({
  channelName,
  broadcasterId,
  isLive,
  fromModeration = false,
  className,
  onSelectUser,
}) => {
  const { connected } = useChatConnection(channelName, isLive);
  const [currentUser, setCurrentUser] = React.useState("You");

  const {
    messages,
    pinnedMessages,
    sendMessage,
    deleteMessage,
    pinMessage,
    unpinMessage,
    loadRecentMessages,
    isDeletingId,
    isSending,
  } = useChatMessages(channelName, currentUser);

  const {
    banUser,
    timeoutUser,
    clearChat,
    unbanUser,
    isUnbanningUser,
    isBanningUser,
    isTimeoutingUser,
    isClearingChat,
  } = useChatModeration(broadcasterId || "");

  const {
    input,
    setInput,
    replyingTo,
    setReplyingTo,
    cancelReply,
    mentionUser,
    onEmojiClick,
    showEmojiPicker,
    setShowEmojiPicker,
    inputRef,
  } = useChatInput();

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const res = await userAPI.getCurrentUser();
      if (res.status && res.data?.display_name)
        setCurrentUser(res.data.display_name);
    };
    fetchUser();
  }, []);

  useEffect(() => {
    if (connected) loadRecentMessages();
  }, [connected]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
  }, [messages, pinnedMessages]);

  const handleSend = async () => {
    const success = await sendMessage(input, replyingTo?.id);
    if (success) {
      setInput("");
      cancelReply();
    }
  };

  const displayedMessages = useMemo(
    () => [
      ...pinnedMessages.map((msg) => ({ ...msg, isPinned: true })),
      ...messages.filter((msg) => !pinnedMessages.some((p) => p.id === msg.id)),
    ],
    [messages, pinnedMessages],
  );

  return (
    <div
      className={`
        bg-[var(--card-bg)] rounded-xl shadow-lg border border-[var(--border-color)] 
        flex flex-col 
        ${fromModeration ? "h-full min-h-[600px]" : "h-full max-h-[560px]"}
        min-h-[300px] min-w-[300px]
        ${className || ""}
      `}
    >
      <div
        className={`p-3 border-b border-[var(--border-color)] flex justify-between items-center`}
      >
        <div className="text-sm font-semibold text-[var(--text-primary)]">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-[#9147ff]" />

            <h3 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider">
              Live Chat
            </h3>
            {connected ? (
              <span className="ml-2 text-xs text-green-400">● LIVE</span>
            ) : (
              <span className="ml-2 text-xs text-red-400">● OFFLINE</span>
            )}
          </div>
        </div>
        <button
          onClick={clearChat}
          disabled={isClearingChat}
          className="text-red-400 text-xs hover:text-red-300 disabled:opacity-50"
          title="Clear all messages"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {displayedMessages.map((msg) => (
          <ChatMessageItem
            key={msg.id}
            message={msg}
            onReplyClick={setReplyingTo}
            onMentionClick={mentionUser}
            onPinClick={pinMessage}
            onUnpinClick={unpinMessage}
            onDeleteClick={(id) => deleteMessage(id, broadcasterId!)}
            onBanClick={banUser}
            onTimeoutClick={timeoutUser}
            currentUser={currentUser}
            isLive={isLive}
            isPinned={msg.isPinned}
            isDeletingId={isDeletingId}
            isBanningUser={isBanningUser}
            isTimeoutingUser={isTimeoutingUser}
            onSelectUser={onSelectUser}
            onUnbanClick={unbanUser}
            isUnbanningUser={isUnbanningUser}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      <ChatInput
        input={input}
        setInput={setInput}
        onSend={handleSend}
        onEmojiClick={onEmojiClick}
        replyingTo={replyingTo}
        cancelReply={cancelReply}
        isConnected={connected}
        isSending={isSending}
        showEmojiPicker={showEmojiPicker}
        setShowEmojiPicker={setShowEmojiPicker}
        inputRef={inputRef as any}
      />
    </div>
  );
};

export default ChatCard;
