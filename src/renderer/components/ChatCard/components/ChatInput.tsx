// src/renderer/pages/stream-manager/components/ChatInput.tsx
import React, { useRef, useState, type RefObject } from "react";
import { Send, Smile, X } from "lucide-react";
import EmojiPicker, { Theme } from "emoji-picker-react";
import { createPortal } from "react-dom";
import type { ChatMessage } from "../../../api/core/chat";

interface ChatInputProps {
  input: string;
  setInput: (value: string) => void;
  onSend: () => void;
  onEmojiClick: (emoji: any) => void;
  replyingTo: ChatMessage | null;
  cancelReply: () => void;
  isConnected: boolean;
  isSending: boolean;
  showEmojiPicker: boolean;
  setShowEmojiPicker: (show: boolean) => void;
  inputRef: RefObject<HTMLInputElement>;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  input,
  setInput,
  onSend,
  onEmojiClick,
  replyingTo,
  cancelReply,
  isConnected,
  isSending,
  showEmojiPicker,
  setShowEmojiPicker,
  inputRef,
}) => {
  const [pickerPosition, setPickerPosition] = useState({ top: 0, right: 0 });

  const pickerButtonRef = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const pickerPortalRef = useRef<HTMLDivElement>(null);

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  const togglePicker = () => {
    if (!showEmojiPicker && pickerButtonRef.current) {
      const rect = pickerButtonRef.current.getBoundingClientRect();
      setPickerPosition({
        top: rect.top - 10,
        right: window.innerWidth - rect.right,
      });
    }
    setShowEmojiPicker(!showEmojiPicker);
  };

  return (
    <div className="p-3 border-t border-[var(--border-color)]">
      {replyingTo && (
        <div className="flex items-center justify-between text-xs bg-[var(--btn-secondary-bg)] rounded-md px-2 py-1 mb-2">
          <span className="text-[var(--text-secondary)]">
            Replying to{" "}
            <span className="text-[var(--text-primary)] font-medium">
              {replyingTo.user}
            </span>
          </span>
          <button
            onClick={cancelReply}
            className="p-0.5 hover:bg-[var(--btn-secondary-hover)] rounded"
          >
            <X className="w-3 h-3 text-[var(--text-secondary)]" />
          </button>
        </div>
      )}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={
              replyingTo
                ? `Reply to @${replyingTo.user}...`
                : "Send a message..."
            }
            className="w-full bg-[var(--card-bg)] border border-[#2a2a2e] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] placeholder-[#adadb8] focus:outline-none focus:border-[var(--primary-color)]/80 transition-colors disabled:opacity-50 pr-8"
            disabled={!isConnected || isSending}
          />
          <button
            ref={pickerButtonRef}
            type="button"
            onClick={togglePicker}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-[var(--primary-color)] hover:text-[var(--primary-color)]/80 transition-colors"
            aria-label="Insert emoji"
          >
            <Smile className="w-4 h-4" />
          </button>
        </div>
        <button
          onClick={onSend}
          disabled={!isConnected || isSending || !input.trim()}
          className="p-2 bg-[var(--primary-color)]/90 rounded-lg hover:bg-[var(--primary-color)] disabled:opacity-50 transition-colors"
          aria-label="Send message"
        >
          <Send className="w-4 h-4 text-white" />
        </button>
      </div>
      <div className="text-xs text-[var(--text-secondary)] text-center mt-2">
        {!isConnected ? "Connecting..." : "Hover message to interact"}
      </div>

      {/* Emoji Picker Portal - stays open after selection */}
      {showEmojiPicker &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={pickerPortalRef}
            className="fixed z-[100]"
            style={{
              bottom: `calc(100vh - ${pickerPosition.top}px)`,
              right: `${pickerPosition.right}px`,
            }}
          >
            <EmojiPicker
              onEmojiClick={onEmojiClick}
              autoFocusSearch={false}
              width={350}
              height={450}
              theme={Theme.DARK}
              lazyLoadEmojis={true}
            />
          </div>,
          document.body,
        )}
    </div>
  );
};
