// src/layouts/TopBar/NotificationsDropdown.tsx
import React, { useState, useEffect, useRef } from "react";
import { Bell, Check, Trash2 } from "lucide-react";
import { notificationStoreAPI, type StoredNotification } from "../../api/core/notification-store";
import { dialogs } from "../../utils/dialogs";
import { useNavigate } from "react-router-dom";

export const NotificationsDropdown: React.FC = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<StoredNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [show, setShow] = useState(false);
  const [anim, setAnim] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const load = async () => {
    const res = await notificationStoreAPI.getAll();
    if (res.status && res.data) {
      setNotifications(res.data);
      setUnreadCount(res.data.filter(n => !n.read).length);
    }
  };

  useEffect(() => {
    load();
    const listener = window.backendAPI?.on?.("notification:new", load);
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

  const markRead = async (id: string) => {
    await notificationStoreAPI.markRead(id);
    await load();
  };

  const markAllRead = async () => {
    await notificationStoreAPI.markAllRead();
    await load();
  };

  const deleteOne = async (id: string) => {
    await notificationStoreAPI.delete(id);
    await load();
  };

  const clearAll = async () => {
    if (await dialogs.confirm({ title: "Clear All", message: "Delete all notifications?" })) {
      await notificationStoreAPI.clearAll();
      await load();
    }
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
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-[var(--text-primary)] text-xs rounded-full w-5 h-5 flex items-center justify-center shadow-md">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {show && (
        <div
          className={`absolute right-0 mt-2 w-96 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl shadow-2xl z-50 overflow-hidden transition-all duration-150 ease-out origin-top-right
            ${anim ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-color)] bg-[var(--sidebar-bg)]">
            <h3 className="font-semibold text-[var(--sidebar-text)]">Notifications</h3>
            <div className="flex gap-2">
              {notifications.some(n => !n.read) && (
                <button onClick={markAllRead} className="text-xs text-[var(--primary-color)] hover:underline">Mark all read</button>
              )}
              {notifications.length > 0 && (
                <button onClick={clearAll} className="text-xs text-red-400 hover:underline">Clear all</button>
              )}
            </div>
          </div>
          <div className="max-h-96 overflow-y-auto custom-scrollbar">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-[var(--text-tertiary)]">No notifications yet</div>
            ) : (
              notifications.map(notif => (
                <div key={notif.id} className={`px-4 py-3 border-b border-[var(--border-color)] hover:bg-[var(--card-hover-bg)] transition-colors ${!notif.read ? "bg-[var(--primary-color)]/5" : ""}`}>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-[var(--sidebar-text)]">{notif.title}</p>
                      <p className="text-xs text-[var(--text-secondary)] mt-1">{notif.message}</p>
                      <p className="text-xs text-[var(--text-tertiary)] mt-1">{formatRelativeTime(notif.timestamp)}</p>
                    </div>
                    <div className="flex gap-1 ml-2">
                      {!notif.read && (
                        <button onClick={() => markRead(notif.id)} className="p-1 rounded-md hover:bg-[var(--primary-color)]/20 text-[var(--primary-color)]" title="Mark as read">
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button onClick={() => deleteOne(notif.id)} className="p-1 rounded-md hover:bg-red-500/20 text-red-400" title="Delete">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="px-4 py-2 border-t border-[var(--border-color)] text-center">
            <button
              onClick={() => { navigate("/notifications"); setShow(false); }}
              className="text-xs text-[var(--primary-color)] hover:underline"
            >
              View all in Notifications page
            </button>
          </div>
        </div>
      )}
    </div>
  );
};