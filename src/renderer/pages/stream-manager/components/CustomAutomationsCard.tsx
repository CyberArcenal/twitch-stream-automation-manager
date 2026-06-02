import React, { useState } from "react";
import AutomationPanel from "./AutomationPanel";
import SceneManager from "./SceneManager";
import AlertConfigurator from "./AlertConfigurator";

interface CustomAutomationsCardProps {
  isLive: boolean;
}

const CustomAutomationsCard: React.FC<CustomAutomationsCardProps> = ({ isLive }) => {
  const [activeTab, setActiveTab] = useState<"automations" | "scenes" | "alerts">("automations");

  return (
    <div className="bg-[var(--card-bg)] rounded-xl shadow-lg border border-[var(--border-color)] flex flex-col overflow-hidden h-full min-w-[300px]">
      {/* Tab bar */}
      <div className="flex border-b border-[var(--border-color)]">
        {["automations", "scenes", "alerts"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`flex-1 py-2 text-sm font-medium transition-colors ${
              activeTab === tab
                ? "text-[var(--text-primary)] border-b-2 border-[#9147ff] bg-[#9147ff]/10"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            {tab === "automations" ? "Automations" : tab === "scenes" ? "Scenes" : "Alerts"}
          </button>
        ))}
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === "automations" && <AutomationPanel isLive={isLive} />}
        {activeTab === "scenes" && <SceneManager />}
        {activeTab === "alerts" && <AlertConfigurator />}
      </div>
    </div>
  );
};

export default CustomAutomationsCard;