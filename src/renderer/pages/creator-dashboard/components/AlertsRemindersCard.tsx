import React, { useState, useEffect } from "react";
import { Bell, Clock, AlertTriangle } from "lucide-react";
import { notificationAPI } from "../../../api/core/notification";
import { streamManagerAPI } from "../../../api/core/streamManager";
import { eventsubAPI } from "../../../api/core/eventsub";

interface AlertsRemindersCardProps {
  broadcasterId: string;
}

export const AlertsRemindersCard: React.FC<AlertsRemindersCardProps> = ({ broadcasterId }) => {
  const [isLive, setIsLive] = useState(false);
  const [elapsedHours, setElapsedHours] = useState(0);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const [showReminder, setShowReminder] = useState(false);

  useEffect(() => {
    // Check live status
    const checkLive = async () => {
      try {
        const { streamsAPI } = await import("../../../api/core/streams");
        const { userAPI } = await import("../../../api/core/user");
        const userRes = await userAPI.getCurrentUser();
        if (userRes.status && userRes.data) {
          const streamRes = await streamsAPI.getStreamByUserLogin(userRes.data.login);
          setIsLive(!!streamRes.data);
        }
      } catch (err) {
        console.error("Failed to check live status", err);
      }
    };
    checkLive();
    const interval = setInterval(checkLive, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!isLive) return;
    const updateElapsed = async () => {
      const hours = await streamManagerAPI.getStreamElapsedHours();
      const elapsed = hours.data || 0;
      setElapsedHours(elapsed);
      const shouldRemind = await streamManagerAPI.shouldShowTitleReminder();
      setShowReminder(shouldRemind.data || false);
    };
    updateElapsed();
    const timer = setInterval(updateElapsed, 60000);
    return () => clearInterval(timer);
  }, [isLive]);

  useEffect(() => {
    const updateCooldown = async () => {
      const remaining = await streamManagerAPI.getCommercialCooldown();
      setCooldownRemaining(remaining.data || 0);
    };
    updateCooldown();
    const interval = setInterval(updateCooldown, 1000);
    return () => clearInterval(interval);
  }, []);

  const testGoLiveNotification = async () => {
    await notificationAPI.testGoLiveNotification();
  };

  const formatCooldown = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="bg-[var(--card-bg)] rounded-xl shadow-md border border-[var(--card-bg)] p-5">
      <div className="flex items-center gap-2 mb-4">
        <Bell className="w-5 h-5 text-[#9147ff]" />
        <h3 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider">
          Alerts & Reminders
        </h3>
      </div>
      <div className="space-y-4">
        <button
          onClick={testGoLiveNotification}
          className="w-full py-2 bg-[var(--primary-color)] rounded-md text-sm hover:bg-[var(--primary-color)]/20 transition"
        >
          Test Go‑Live Notification
        </button>

        {isLive && (
          <>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--text-primary)] flex items-center gap-1">
                <Clock className="w-4 h-4" /> Stream Duration
              </span>
              <span className="text-sm font-mono text-[var(--text-primary)]">
                {Math.floor(elapsedHours)}h {Math.floor((elapsedHours % 1) * 60)}m
              </span>
            </div>
            {showReminder && (
              <div className="flex items-center gap-2 p-2 bg-yellow-500/20 rounded-lg">
                <AlertTriangle className="w-4 h-4 text-yellow-400" />
                <span className="text-xs text-[var(--text-primary)]">
                  Stream has been live for over 2 hours. Consider updating your title/category.
                </span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--text-primary)]">Next Ad Available In</span>
              <span className="text-sm font-mono text-[var(--text-primary)]">{formatCooldown(cooldownRemaining)}</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};