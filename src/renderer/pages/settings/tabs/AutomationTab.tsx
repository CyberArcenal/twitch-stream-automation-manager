import React, { useState, useEffect } from "react";
import { Rocket, MessageCircle, Video, Users } from "lucide-react";
import { streamManagerAPI } from "../../../api/core/streamManager";

export const AutomationTab: React.FC = () => {
  const [autoRaid, setAutoRaid] = useState(false);
  const [autoClip, setAutoClip] = useState(false);
  const [autoMessage, setAutoMessage] = useState(false);
  const [autoMessageText, setAutoMessageText] = useState("Thanks for the follow/sub! 🎉");
  const [raidTarget, setRaidTarget] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await streamManagerAPI.getAutomationStatus();
        if (res.status && res.data) {
          setAutoRaid(res.data.config.autoRaid);
          setAutoClip(res.data.config.autoClip);
          setAutoMessage(res.data.config.autoMessage);
          setAutoMessageText(res.data.config.autoMessageText);
          setRaidTarget(res.data.config.raidTarget || "");
        }
      } catch (err) {
        console.error("Failed to load automation settings", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const saveSettings = async () => {
    const config = { autoRaid, autoClip, autoMessage, autoMessageText, raidTarget: raidTarget || null };
    await streamManagerAPI.startAutomation(config); // startAutomation also saves config
  };

  if (loading) return <div className="animate-pulse h-64 bg-[var(--card-bg)] rounded-xl"></div>;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-[var(--text-primary)]">Automation Defaults</h2>
      <div className="bg-[var(--card-bg)] rounded-xl p-6 space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-[#9147ff]" />
            <span className="text-[var(--text-primary)]">Auto‑raid when stream ends</span>
          </div>
          <button
            onClick={() => setAutoRaid(!autoRaid)}
            className={`relative w-10 h-5 rounded-full transition-colors ${autoRaid ? "bg-[#9147ff]" : "bg-[#2a2a2e]"}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${autoRaid ? "translate-x-5" : ""}`} />
          </button>
        </div>
        {autoRaid && (
          <div className="ml-7">
            <input
              type="text"
              value={raidTarget}
              onChange={(e) => setRaidTarget(e.target.value)}
              placeholder="Target channel name"
              className="w-full bg-[var(--background-color)] border border-[var(--card-bg)] rounded px-3 py-2 text-[var(--text-primary)] text-sm"
            />
          </div>
        )}

        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Video className="w-5 h-5 text-[#9147ff]" />
            <span className="text-[var(--text-primary)]">Auto‑clip on stream offline</span>
          </div>
          <button
            onClick={() => setAutoClip(!autoClip)}
            className={`relative w-10 h-5 rounded-full transition-colors ${autoClip ? "bg-[#9147ff]" : "bg-[#2a2a2e]"}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${autoClip ? "translate-x-5" : ""}`} />
          </button>
        </div>

        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-[#9147ff]" />
            <span className="text-[var(--text-primary)]">Auto‑message on follow/sub</span>
          </div>
          <button
            onClick={() => setAutoMessage(!autoMessage)}
            className={`relative w-10 h-5 rounded-full transition-colors ${autoMessage ? "bg-[#9147ff]" : "bg-[#2a2a2e]"}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${autoMessage ? "translate-x-5" : ""}`} />
          </button>
        </div>
        {autoMessage && (
          <div className="ml-7">
            <input
              type="text"
              value={autoMessageText}
              onChange={(e) => setAutoMessageText(e.target.value)}
              className="w-full bg-[var(--background-color)] border border-[var(--card-bg)] rounded px-3 py-2 text-[var(--text-primary)] text-sm"
            />
          </div>
        )}

        <button onClick={saveSettings} className="w-full mt-4 py-2 bg-[#9147ff] rounded-md text-[var(--text-primary)]">Save Automation Settings</button>
      </div>
    </div>
  );
};