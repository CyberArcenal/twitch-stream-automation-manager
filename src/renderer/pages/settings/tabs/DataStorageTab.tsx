import React from "react";
import { Trash2, RefreshCw } from "lucide-react";
import { historyAPI } from "../../../api/core/history";
import { notificationStoreAPI } from "../../../api/core/notification-store";
import { settingsAPI } from "../../../api/core/settings";
import { dialogs } from "../../../utils/dialogs";

export const DataStorageTab: React.FC = () => {
  const clearWatchHistory = async () => {
    if (await dialogs.confirm({title: "Clear all watch history?"})) {
      await historyAPI.clear();
      alert("Watch history cleared");
    }
  };

  const clearNotifications = async () => {
    if (await dialogs.confirm({title: "Clear all notification history?"})) {
      await notificationStoreAPI.clearAll();
      alert("Notification history cleared");
    }
  };

  const resetSettings = async () => {
    if (await dialogs.confirm({title: "Reset all settings to defaults? This action cannot be undone."})) {
      await settingsAPI.reset();
      alert("Settings reset. Please restart the app.");
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-[var(--text-primary)]">Data & Storage</h2>
      <div className="bg-[var(--card-bg)] rounded-xl p-6 space-y-4">
        <button onClick={clearWatchHistory} className="w-full flex items-center justify-between p-3 bg-[#2a2a2e]/50 rounded-lg hover:bg-[#2a2a2e] transition">
          <span className="text-[var(--text-primary)]">Clear Watch History</span>
          <Trash2 className="w-4 h-4 text-red-400" />
        </button>
        <button onClick={clearNotifications} className="w-full flex items-center justify-between p-3 bg-[#2a2a2e]/50 rounded-lg hover:bg-[#2a2a2e] transition">
          <span className="text-[var(--text-primary)]">Clear Notification Cache</span>
          <Trash2 className="w-4 h-4 text-red-400" />
        </button>
        <button onClick={resetSettings} className="w-full flex items-center justify-between p-3 bg-[#2a2a2e]/50 rounded-lg hover:bg-[#2a2a2e] transition">
          <span className="text-[var(--text-primary)]">Reset All Settings</span>
          <RefreshCw className="w-4 h-4 text-yellow-400" />
        </button>
      </div>
    </div>
  );
};