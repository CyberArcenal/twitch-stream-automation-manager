import React, { useState, useEffect } from "react";
import { Bell, UserPlus, Star, Rocket, Flame } from "lucide-react";
import { notificationStoreAPI, type StoredNotification } from "../../../api/core/notification-store";
import { formatDistanceToNow } from "date-fns";

export const RecentActivityFeed: React.FC = () => {
  const [notifications, setNotifications] = useState<StoredNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const res = await notificationStoreAPI.getAll();
      if (res.status) setNotifications(res.data.slice(0, 10));
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Listen for new notifications
    const unsub = window.backendAPI?.on?.("notification:new", () => fetchNotifications());
    return () => unsub?.();
  }, []);

  const getIcon = (type: string) => {
    switch (type) {
      case "follow": return <UserPlus className="w-4 h-4 text-green-400" />;
      case "subscription": return <Star className="w-4 h-4 text-purple-400" />;
      case "raid": return <Rocket className="w-4 h-4 text-orange-400" />;
      case "hype_train": return <Flame className="w-4 h-4 text-red-400" />;
      default: return <Bell className="w-4 h-4 text-[var(--text-secondary)]" />;
    }
  };

  if (loading) return <div className="bg-[var(--card-bg)] rounded-xl p-5 animate-pulse h-64"></div>;

  return (
    <div className="bg-[var(--card-bg)] rounded-xl shadow-md border border-[var(--card-bg)] p-5">
      <div className="flex items-center gap-2 mb-4">
        <Bell className="w-5 h-5 text-[#9147ff]" />
        <h3 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider">
          Recent Activity
        </h3>
      </div>
      <div className="space-y-3 max-h-64 overflow-y-auto">
        {notifications.length === 0 ? (
          <p className="text-center text-[var(--text-secondary)] text-sm">No recent events</p>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif.id}
              className="flex items-start gap-3 p-2 rounded-lg hover:bg-[#2a2a2e] transition cursor-pointer"
              onClick={() => {
                // Optional: navigate to analytics or show modal
                console.log("Event clicked", notif);
              }}
            >
              {getIcon(notif.type)}
              <div className="flex-1">
                <div className="text-sm text-[var(--text-primary)]">{notif.title}</div>
                <div className="text-xs text-[var(--text-secondary)]">{notif.message}</div>
                <div className="text-xs text-[var(--text-secondary)] mt-1">
                  {formatDistanceToNow(new Date(notif.timestamp), { addSuffix: true })}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};