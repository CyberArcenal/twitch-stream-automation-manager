// src/renderer/pages/stream-manager/components/ChatInput.tsx
import React, { type RefObject } from 'react';
import { Send, Smile, X } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';
import type { ChatMessage } from '../../../../../api/core/chat';

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
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="p-3 border-t border-[var(--border-color)]">
      {replyingTo && (
        <div className="flex items-center justify-between text-xs bg-[var(--btn-secondary-bg)] rounded-md px-2 py-1 mb-2">
          <span className="text-[var(--text-secondary)]">
            Replying to{' '}
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
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={
            replyingTo
              ? `Reply to @${replyingTo.user}...`
              : isConnected
                ? 'Send a message...'
                : 'Connecting...'
          }
          disabled={!isConnected}
          className="flex-1 bg-[var(--input-bg)] border border-[var(--input-border)] rounded px-2 py-1 text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] disabled:opacity-50 focus:outline-none focus:border-[#9147ff]"
        />
        <div className="relative">
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="p-1 bg-[var(--btn-secondary-bg)] rounded hover:bg-[var(--btn-secondary-hover)]"
            title="Insert emoji"
          >
            <Smile className="w-4 h-4 text-[var(--text-primary)]" />
          </button>
          {showEmojiPicker && (
            <div className="absolute bottom-full right-0 mb-2 z-50">
              <EmojiPicker onEmojiClick={onEmojiClick} />
            </div>
          )}
        </div>
        <button
          onClick={onSend}
          disabled={!isConnected || !input.trim() || isSending}
          className="p-1 bg-[var(--primary-color)] rounded hover:bg-[#772ce8] disabled:opacity-50"
        >
          <Send className="w-4 h-4 text-white" />
        </button>
      </div>
      <div className="text-xs text-[var(--text-secondary)] text-center mt-2">
        {!isConnected ? 'Connecting...' : 'Hover message to interact'}
      </div>
    </div>
  );
};