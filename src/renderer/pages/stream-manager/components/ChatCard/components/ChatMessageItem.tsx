// src/renderer/pages/stream-manager/components/ChatMessageItem.tsx
import React, { memo } from "react";
import { Loader2 } from "lucide-react";
import type { ChatMessage } from "../../../../../api/core/chat";

const Badge: React.FC<{ name: string; version: string; imageUrl?: string }> = ({
  name,
  version,
  imageUrl,
}) => {
  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={name}
        title={`${name} ${version}`}
        className="inline-block h-4 w-auto align-middle mr-0.5"
        onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
      />
    );
  }
  return (
    <span
      className="text-[10px] text-[var(--text-secondary)] bg-[#2a2a2e] px-1 rounded mr-0.5"
      title={name}
    >
      {name}
    </span>
  );
};

const highlightMentions = (text: string): React.ReactNode => {
  const parts = text.split(/(@\w+)/g);
  return parts.map((part, i) => {
    if (part.startsWith("@")) {
      return (
        <span key={i} className="text-[#9147ff] font-medium">
          {part}
        </span>
      );
    }
    return part;
  });
};

const renderMessageContent = (message: ChatMessage): React.ReactNode => {
  if (message.parsedMessage && message.parsedMessage.length > 0) {
    return message.parsedMessage.map((part: any, idx: number) => {
      if (part.type === "emote") {
        const emoteUrl = `https://static-cdn.jtvnw.net/emoticons/v1/${part.id}/3.0`;
        return (
          <img
            key={idx}
            src={emoteUrl}
            alt={part.name || "emote"}
            className="inline-block align-middle h-5 w-auto my-[-2px] mx-0.5"
            loading="lazy"
          />
        );
      }
      return <span key={idx}>{highlightMentions(part.text)}</span>;
    });
  }
  return highlightMentions(message.message);
};

const formatTime = (timestamp: string) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

interface ChatMessageItemProps {
  message: ChatMessage;
  onReplyClick: (msg: ChatMessage) => void;
  onMentionClick: (username: string) => void;
  onPinClick: (msg: ChatMessage) => void;
  onUnpinClick: (msgId: string) => void;
  onDeleteClick: (msgId: string) => void;
  onBanClick?: (username: string) => void;
  onTimeoutClick?: (username: string, duration: number) => void;
  currentUser: string;
  isLive: boolean;
  isPinned?: boolean;
  // ✅ Loading states – mga string identifier, hindi boolean
  isDeletingId?: string | null;
  isBanningUser?: string | null;
  isTimeoutingUser?: string | null;
}

const ChatMessageItem: React.FC<ChatMessageItemProps> = memo(
  ({
    message,
    onReplyClick,
    onMentionClick,
    onPinClick,
    onUnpinClick,
    onDeleteClick,
    onBanClick,
    onTimeoutClick,
    currentUser,
    isLive,
    isPinned,
    isDeletingId = null,
    isBanningUser = null,
    isTimeoutingUser = null,
  }) => {
    const isOwnMessage =
      currentUser && message.user.toLowerCase() === currentUser.toLowerCase();
    const badges = message.badges || [];
    const isDeleted = message.isDeleted === true;

    const isLoadingDelete = isDeletingId === message.id;
    const isLoadingBan = isBanningUser === message.user;
    const isLoadingTimeout = isTimeoutingUser === message.user;

    const handleReply = () => !isDeleted && onReplyClick(message);
    const handleMention = () => !isDeleted && onMentionClick(message.user);
    const handlePin = () => !isDeleted && onPinClick(message);
    const handleUnpin = () => !isDeleted && onUnpinClick(message.id);
    const handleDelete = () => !isLoadingDelete && onDeleteClick(message.id);
    const handleBan = () => !isLoadingBan && onBanClick?.(message.user);
    const handleTimeout = () =>
      !isLoadingTimeout && onTimeoutClick?.(message.user, 600);

    return (
      <div
        className={`group relative flex flex-col text-sm leading-relaxed px-2 py-1.5 rounded-lg transition-all duration-150
          ${isDeleted ? "opacity-60 bg-gray-800/30" : ""}
          ${
            isOwnMessage && !isDeleted
              ? "bg-[var(--primary-color)]/10 border-l-2 border-l-[#9147ff] hover:bg-[var(--primary-color)]/15"
              : "hover:bg-[#2a2a2e]/30"
          }
          ${
            isPinned && !isDeleted
              ? "bg-[#2a2a2e]/30 border-l-2 border-l-yellow-500"
              : ""
          }
        `}
      >
        <div className="flex items-start gap-1">
          {badges.length > 0 && !isDeleted && (
            <div className="flex flex-shrink-0 gap-0.5 mr-0.5">
              {badges.map((badge: any, idx: number) => (
                <Badge key={idx} {...badge} />
              ))}
            </div>
          )}
          <span
            className={`font-semibold flex-shrink-0 ${
              isOwnMessage && !isDeleted
                ? "text-[#9147ff]"
                : "text-[var(--text-primary)]"
            } ${isDeleted ? "line-through text-gray-400" : ""}`}
          >
            {message.user}
            {isOwnMessage && !isDeleted && (
              <span className="text-xs ml-1 text-[#9147ff]/70">(you)</span>
            )}
          </span>
          <div className="flex-1 overflow-x-hidden break-words">
            {message.replyParentMsgId && !isDeleted && (
              <span className="text-[var(--text-secondary)] text-xs block mb-0.5">
                ↳ Replying to previous message
              </span>
            )}
            <span
              className={isDeleted ? "italic text-gray-400" : "text-[#efeff1]"}
            >
              {isDeleted ? "[Message removed]" : renderMessageContent(message)}
            </span>
          </div>
        </div>

        {!isDeleted && (
          <div className="mt-1 flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
            {!isOwnMessage && isLive && onBanClick && onTimeoutClick && (
              <>
                <button
                  onClick={handleTimeout}
                  disabled={isLoadingTimeout}
                  className="text-xs text-yellow-400 hover:text-yellow-300 disabled:opacity-50 flex items-center gap-1"
                >
                  {isLoadingTimeout && <Loader2 className="w-3 h-3 animate-spin" />}
                  Timeout
                </button>
                <button
                  onClick={handleBan}
                  disabled={isLoadingBan}
                  className="text-xs text-red-400 hover:text-red-300 disabled:opacity-50 flex items-center gap-1"
                >
                  {isLoadingBan && <Loader2 className="w-3 h-3 animate-spin" />}
                  Ban
                </button>
              </>
            )}
            {isPinned ? (
              <button onClick={handleUnpin} className="text-xs">Unpin</button>
            ) : (
              <button onClick={handlePin} className="text-xs">Pin</button>
            )}
            <button
              onClick={handleDelete}
              disabled={isLoadingDelete}
              className="text-xs text-red-400 hover:text-red-300 disabled:opacity-50 flex items-center gap-1"
            >
              {isLoadingDelete && <Loader2 className="w-3 h-3 animate-spin" />}
              Delete
            </button>
            <span className="text-xs text-[var(--text-secondary)]/60">
              {formatTime(message.timestamp)}
            </span>
          </div>
        )}
      </div>
    );
  }
);

export default ChatMessageItem;