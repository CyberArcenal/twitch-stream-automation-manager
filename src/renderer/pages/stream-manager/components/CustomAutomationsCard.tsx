import React, { useState } from "react";
import SceneManager from "./SceneManager";
import AlertConfigurator from "./AlertConfigurator";
import AutomationPanel from "./automation/AutomationPanel";

interface CustomAutomationsCardProps {
  isLive: boolean;
  broadcasterId?: string;
  moderatorId?: string;
}

const CustomAutomationsCard: React.FC<CustomAutomationsCardProps> = ({ isLive, broadcasterId, moderatorId }) => {
  const [activeTab, setActiveTab] = useState<"automations" | "scenes" | "alerts">("automations");

  return (
    <div className="bg-[var(--card-bg)] rounded-xl shadow-lg border border-[var(--border-color)] flex flex-col overflow-hidden h-full min-w-[300px]">
      <div className="flex border-b border-[var(--border-color)]">
        <button onClick={() => setActiveTab("automations")} className={`flex-1 py-2 text-sm font-medium ${activeTab === "automations" ? "text-[var(--text-primary)] border-b-2 border-[#9147ff] bg-[var(--primary-color)]/10" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"}`}>Automations</button>
        <button onClick={() => setActiveTab("scenes")} className={`flex-1 py-2 text-sm font-medium ${activeTab === "scenes" ? "text-[var(--text-primary)] border-b-2 border-[#9147ff] bg-[var(--primary-color)]/10" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"}`}>Scenes</button>
        <button onClick={() => setActiveTab("alerts")} className={`flex-1 py-2 text-sm font-medium ${activeTab === "alerts" ? "text-[var(--text-primary)] border-b-2 border-[#9147ff] bg-[var(--primary-color)]/10" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"}`}>Alerts</button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {activeTab === "automations" && <AutomationPanel isLive={isLive} broadcasterId={broadcasterId} moderatorId={moderatorId} />}
        {activeTab === "scenes" && <SceneManager />}
        {activeTab === "alerts" && <AlertConfigurator />}
      </div>
    </div>
  );
};

export default CustomAutomationsCard;