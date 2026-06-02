import React, { useState, useEffect } from "react";
import { Bell, Volume2, VolumeX } from "lucide-react";
import { notificationAPI } from "../../../api/core/notification";
import { settingsAPI } from "../../../api/core/settings";

export const NotificationsTab: React.FC = () => {
  const [enabled, setEnabled] = useState(true);
  const [preferences, setPreferences] = useState({
    stream_live: true,
    new_follower: true,
    subscription: true,
    gift_sub: true,
    raid: true,
    hype_train: true,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const enabledRes = await notificationAPI.isEnabled();
        if (enabledRes.status) setEnabled(enabledRes.data);
        const prefsRes = await settingsAPI.get("notificationPreferences");
        if (prefsRes.status && prefsRes.data) setPreferences(prefsRes.data);
      } catch (err) {
        console.error("Failed to load notification settings", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const toggleEnabled = async () => {
    const newValue = !enabled;
    setEnabled(newValue);
    await notificationAPI.setEnabled(newValue);
  };

  const togglePreference = async (key: keyof typeof preferences) => {
    const newPrefs = { ...preferences, [key]: !preferences[key] };
    setPreferences(newPrefs);
    await settingsAPI.updateNotificationPreferences(newPrefs);
  };

  const testNotification = async () => {
    await notificationAPI.show("Test Notification", "This is a test message");
  };

  if (loading) return <div className="animate-pulse h-64 bg-[var(--card-bg)] rounded-xl"></div>;

  const notificationTypes = [
    { key: "stream_live", label: "Stream Live", icon: "🔴" },
    { key: "new_follower", label: "New Follower", icon: "👤" },
    { key: "subscription", label: "Subscription", icon: "⭐" },
    { key: "gift_sub", label: "Gift Subscription", icon: "🎁" },
    { key: "raid", label: "Raid", icon: "🚀" },
    { key: "hype_train", label: "Hype Train", icon: "🚂" },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-[var(--text-primary)]">Notifications</h2>
      <div className="bg-[var(--card-bg)] rounded-xl p-6 space-y-6">
        {/* Master toggle */}
        <div className="flex justify-between items-center pb-4 border-b border-[var(--card-bg)]">
          <div className="flex items-center gap-2">
            {enabled ? <Volume2 className="w-5 h-5 text-[#9147ff]" /> : <VolumeX className="w-5 h-5 text-[var(--text-secondary)]" />}
            <span className="text-[var(--text-primary)]">Desktop Notifications</span>
          </div>
          <button
            onClick={toggleEnabled}
            className={`relative w-10 h-5 rounded-full transition-colors ${enabled ? "bg-[#9147ff]" : "bg-[#2a2a2e]"}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${enabled ? "translate-x-5" : ""}`} />
          </button>
        </div>

        {/* Event checkboxes */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] uppercase">Notify for</h3>
          {notificationTypes.map(({ key, label, icon }) => (
            <label key={key} className="flex items-center justify-between cursor-pointer">
              <span className="text-sm text-[var(--text-primary)] flex items-center gap-2">
                <span>{icon}</span> {label}
              </span>
              <button
                onClick={() => togglePreference(key as keyof typeof preferences)}
                className={`relative w-10 h-5 rounded-full transition-colors ${preferences[key as keyof typeof preferences] ? "bg-[#9147ff]" : "bg-[#2a2a2e]"}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${preferences[key as keyof typeof preferences] ? "translate-x-5" : ""}`} />
              </button>
            </label>
          ))}
        </div>

        {/* Test button */}
        <button onClick={testNotification} className="px-4 py-2 bg-[#9147ff] rounded-md text-[var(--text-primary)] text-sm hover:bg-[#772ce8] transition">
          Test Notification
        </button>
      </div>
    </div>
  );
};