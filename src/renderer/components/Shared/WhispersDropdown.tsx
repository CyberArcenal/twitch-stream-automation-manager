// src/layouts/TopBar/WhispersDropdown.tsx
import React, { useState, useEffect, useRef } from "react";
import { MessageCircle } from "lucide-react";
import { whisperAPI, type Conversation } from "../../api/core/whisper";
import { useNavigate } from "react-router-dom";

export const WhispersDropdown: React.FC = () => {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [show, setShow] = useState(false);
  const [anim, setAnim] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const load = async () => {
    const res = await whisperAPI.getConversations();
    if (res.status && res.data) {
      setConversations(res.data);
      const unread = res.data.reduce((sum, conv) => sum + conv.unreadCount, 0);
      setUnreadCount(unread);
    }
  };

  useEffect(() => {
    load();
    const listener = window.backendAPI?.on?.("whisper:new", load);
    return () => listener?.();
  }, []);

  const toggle = () => {
    if (!show) {
      setShow(true);
      setTimeout(() => setAnim(true), 10);
    } else {
      setAnim(false);
      setTimeout(() => setShow(false), 150);
    }
  };

  const openConversation = (userId: string, userName: string) => {
    navigate(`/whispers?user=${userId}&name=${userName}`);
    setShow(false);
  };

  const formatRelativeTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMins = Math.floor((now.getTime() - date.getTime()) / 60000);
    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString();
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node) && show) {
        setAnim(false);
        setTimeout(() => setShow(false), 150);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [show]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={toggle}
        className="relative p-2 rounded-xl hover:bg-[var(--card-hover-bg)] text-[var(--sidebar-text)] transition-all duration-200"
      >
        <MessageCircle className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-[#9146ff] text-[var(--text-primary)] text-xs rounded-full w-5 h-5 flex items-center justify-center shadow-md">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {show && (
        <div
          className={`absolute right-0 mt-2 w-80 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl shadow-2xl z-50 overflow-hidden transition-all duration-150 ease-out origin-top-right
            ${anim ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}
        >
          <div className="px-4 py-3 border-b border-[var(--border-color)] bg-[var(--sidebar-bg)]">
            <h3 className="font-semibold text-[var(--sidebar-text)]">Whispers</h3>
          </div>
          <div className="max-h-96 overflow-y-auto custom-scrollbar">
            {conversations.length === 0 ? (
              <div className="px-4 py-8 text-center text-[var(--text-tertiary)]">No whisper conversations</div>
            ) : (
              conversations.map(conv => (
                <button
                  key={conv.userId}
                  onClick={() => openConversation(conv.userId, conv.userName)}
                  className="w-full text-left px-4 py-3 border-b border-[var(--border-color)] hover:bg-[var(--card-hover-bg)] transition-colors flex items-center gap-3"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#9146ff] to-[#772ce8] flex items-center justify-center text-[var(--text-primary)] font-bold">
                    {conv.userName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between">
                      <span className="font-medium text-[var(--sidebar-text)] truncate">{conv.userName}</span>
                      <span className="text-xs text-[var(--text-tertiary)]">{formatRelativeTime(conv.lastTimestamp)}</span>
                    </div>
                    <p className="text-xs text-[var(--text-secondary)] truncate">{conv.lastMessage}</p>
                  </div>
                  {conv.unreadCount > 0 && (
                    <span className="bg-[#9146ff] text-[var(--text-primary)] text-xs rounded-full w-5 h-5 flex items-center justify-center">{conv.unreadCount}</span>
                  )}
                </button>
              ))
            )}
          </div>
          <div className="px-4 py-2 border-t border-[var(--border-color)] text-center">
            <button
              onClick={() => { navigate("/whispers"); setShow(false); }}
              className="text-xs text-[var(--primary-color)] hover:underline"
            >
              View all whispers
            </button>
          </div>
        </div>
      )}
    </div>
  );
};