// src/renderer/pages/stream-manager/hooks/useChatInput.ts
import { useState, useRef } from 'react';
import type { ChatMessage } from '../../../../../api/core/chat';

export const useChatInput = () => {
  const [input, setInput] = useState('');
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const cancelReply = () => setReplyingTo(null);

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

  const onEmojiClick = (emojiObject: any) => {
    setInput(prev => prev + emojiObject.emoji);
    setShowEmojiPicker(false);
    inputRef.current?.focus();
  };

  return {
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
  };
};