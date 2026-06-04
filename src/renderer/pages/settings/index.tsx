// src/renderer/pages/settings/index.tsx
import React, { useState } from "react";
import {
  Settings, Moon, Sun, Globe, Play, Bell, Shield, Keyboard,
  Monitor, Users, Database, Rocket, Info
} from "lucide-react";
import { GeneralTab } from "./tabs/GeneralTab";
import { NotificationsTab } from "./tabs/NotificationsTab";
import { ShortcutsTab } from "./tabs/ShortcutsTab";
import { OBSWebSocketTab } from "./tabs/OBSWebSocketTab";
import { AccountsTab } from "./tabs/AccountsTab";
import { DataStorageTab } from "./tabs/DataStorageTab";
import { AutomationTab } from "./tabs/AutomationTab";
import { AboutTab } from "./tabs/AboutTab";
import { AutomationLogProvider } from "../../contexts/AutomationLogContext";

const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState("general");

  const tabs = [
    { id: "general", name: "General", icon: Settings },
    { id: "notifications", name: "Notifications", icon: Bell },
    { id: "shortcuts", name: "Keyboard Shortcuts", icon: Keyboard },
    { id: "obs", name: "OBS WebSocket", icon: Monitor },
    { id: "accounts", name: "Accounts", icon: Users },
    { id: "data", name: "Data & Storage", icon: Database },
    { id: "automation", name: "Automation", icon: Rocket },
    { id: "about", name: "About", icon: Info },
  ];

  return (
    <AutomationLogProvider>   {/* ✅ Wrap the whole page */}
      <div className="flex h-full bg-[var(--background-color)]">
        {/* Sidebar */}
        <div className="w-64 border-r border-[var(--card-border)] bg-[var(--card-bg)] p-4 space-y-1 rounded-2xl m-4">
          <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4 px-2">Settings</h2>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition ${
                activeTab === tab.id
                  ? "bg-[var(--primary-color)] text-white"
                  : "text-[var(--text-secondary)] hover:bg-[var(--primary-color)]/20 hover:text-[var(--text-primary)]"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span className="text-sm">{tab.name}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === "general" && <GeneralTab />}
          {activeTab === "notifications" && <NotificationsTab />}
          {activeTab === "shortcuts" && <ShortcutsTab />}
          {activeTab === "obs" && <OBSWebSocketTab />}
          {activeTab === "accounts" && <AccountsTab />}
          {activeTab === "data" && <DataStorageTab />}
          {activeTab === "automation" && <AutomationTab />}
          {activeTab === "about" && <AboutTab />}
        </div>
      </div>
    </AutomationLogProvider>
  );
};

export default SettingsPage;