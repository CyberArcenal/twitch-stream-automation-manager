// src/renderer/pages/settings/tabs/AutomationTab.tsx
import React, { useState, useEffect } from "react";
import { useLiveStatus } from "../../stream-manager/hooks/useLiveStatus";

import { useAutomationLog } from "../../../contexts/AutomationLogContext";
import { useAutomationRunner, useChatModeration, useStreamTriggers } from "../../../components/automation/hooks";
import { StreamTriggers } from "../../../components/automation/components/StreamTriggers";
import { ChatAutomationRules } from "../../../components/automation/components/ChatAutomationRules";
import { CustomScripts } from "../../../components/automation/components/CustomScripts";
import { AutomationLogs } from "../../../components/automation/components/AutomationLogs";
import { ControlButtons } from "../../../components/automation/components/ControlButtons";
import { streamManagerAPI } from "../../../api/core/streamManager";

const STORAGE_KEY = "automation_custom_scripts";

interface CustomScript {
  name: string;
  enabled: boolean;
}

export const AutomationTab: React.FC = () => {
  const { isLive } = useLiveStatus();
  const stream = useStreamTriggers();
  const chat = useChatModeration();
  const { automationRunning, startAutomation, stopAutomation, setAutomationRunning } = useAutomationRunner();
  const { logs, clearLogs, addLog } = useAutomationLog();

  const [scripts, setScripts] = useState<CustomScript[]>([]);
  const [newTermLocal, setNewTermLocal] = useState("");
  const [newBadgeLocal, setNewBadgeLocal] = useState("");

  // Load scripts from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setScripts(JSON.parse(stored));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  useEffect(() => {
  const load = async () => {
    const running = await streamManagerAPI.isAutomationRunning();
    setAutomationRunning(running);
  };
  load();
}, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(scripts));
  }, [scripts]);

  const addScript = (name: string) => {
    setScripts([...scripts, { name, enabled: true }]);
    addLog(`Custom script "${name}" added`, "success");
  };

  const toggleScript = (index: number) => {
    setScripts(scripts.map((s, i) => (i === index ? { ...s, enabled: !s.enabled } : s)));
    const script = scripts[index];
    addLog(`Script "${script.name}" ${script.enabled ? "disabled" : "enabled"}`, "info");
  };

  const removeScript = (index: number) => {
    const script = scripts[index];
    setScripts(scripts.filter((_, i) => i !== index));
    addLog(`Script "${script.name}" removed`, "error");
  };

  const handleStart = async () => {
    const fullConfig = {
      ...stream.getConfig(),
      ...chat.getConfig(),
    };
    await startAutomation(fullConfig);
  };

  const handleStop = async () => {
    await stopAutomation();
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-[var(--text-primary)]">Automation Settings</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column: Stream Triggers + Chat Rules */}
        <div className="space-y-6">
          <div className="bg-[var(--card-bg)] rounded-xl p-5 border border-[var(--border-color)]">
            <StreamTriggers
              isLive={isLive}
              autoRaidEnabled={stream.autoRaidEnabled}
              onToggleAutoRaid={() => stream.setAutoRaidEnabled(!stream.autoRaidEnabled)}
              raidTarget={stream.raidTarget}
              onRaidTargetChange={stream.setRaidTarget}
              autoClipEnabled={stream.autoClipEnabled}
              onToggleAutoClip={() => stream.setAutoClipEnabled(!stream.autoClipEnabled)}
              autoMessageEnabled={stream.autoMessageEnabled}
              onToggleAutoMessage={() => stream.setAutoMessageEnabled(!stream.autoMessageEnabled)}
              autoMessageText={stream.autoMessageText}
              onAutoMessageTextChange={stream.setAutoMessageText}
              autoShoutoutOnRaid={chat.autoShoutoutOnRaid}
              onToggleAutoShoutoutOnRaid={() => chat.setAutoShoutoutOnRaid(!chat.autoShoutoutOnRaid)}
              shoutoutMessage={chat.shoutoutMessage}
              onShoutoutMessageChange={chat.setShoutoutMessage}
              autoStreamMarkers={chat.autoStreamMarkers}
              onToggleAutoStreamMarkers={() => chat.setAutoStreamMarkers(!chat.autoStreamMarkers)}
              markerIntervalMinutes={chat.markerIntervalMinutes}
              onMarkerIntervalMinutesChange={chat.setMarkerIntervalMinutes}
            />
          </div>
          <div className="bg-[var(--card-bg)] rounded-xl p-5 border border-[var(--border-color)]">
            <ChatAutomationRules
              fromModerationPage={false}
              autoSlowMode={chat.autoSlowMode}
              onToggleAutoSlowMode={() => chat.setAutoSlowMode(!chat.autoSlowMode)}
              slowModeSpamThreshold={chat.slowModeSpamThreshold}
              onSlowModeSpamThresholdChange={chat.setSlowModeSpamThreshold}
              slowModeWaitTime={chat.slowModeWaitTime}
              onSlowModeWaitTimeChange={chat.setSlowModeWaitTime}
              autoDeleteMessage={chat.autoDeleteMessage}
              onToggleAutoDeleteMessage={() => chat.setAutoDeleteMessage(!chat.autoDeleteMessage)}
              autoTimeoutUser={chat.autoTimeoutUser}
              onToggleAutoTimeout={() => chat.setAutoTimeoutUser(!chat.autoTimeoutUser)}
              autoFollowerMode={chat.autoFollowerMode}
              onToggleAutoFollowerMode={() => chat.setAutoFollowerMode(!chat.autoFollowerMode)}
              followerModeDuration={chat.followerModeDuration}
              onFollowerModeDurationChange={chat.setFollowerModeDuration}
              autoBlockLinks={chat.autoBlockLinks}
              onToggleAutoBlockLinks={() => chat.setAutoBlockLinks(!chat.autoBlockLinks)}
              blockedTerms={chat.blockedTerms}
              onAddBlockedTerm={chat.addBlockedTerm}
              onRemoveBlockedTerm={chat.removeBlockedTerm}
              autoModerationEnabled={chat.autoModerationEnabled}
              onToggleAutoModeration={() => chat.setAutoModerationEnabled(!chat.autoModerationEnabled)}
              slowModeDuration={chat.slowModeDuration}
              setSlowModeDuration={chat.setSlowModeDuration}
              repeatWindowSeconds={chat.repeatWindowSeconds}
              setRepeatWindowSeconds={chat.setRepeatWindowSeconds}
              repeatCountThreshold={chat.repeatCountThreshold}
              setRepeatCountThreshold={chat.setRepeatCountThreshold}
              blockedBadges={chat.blockedBadges}
              onAddBlockedBadge={chat.addBlockedBadge}
              onRemoveBlockedBadge={chat.removeBlockedBadge}
              autoClipOnChatSpike={chat.autoClipOnChatSpike}
              onToggleAutoClipOnChatSpike={() => chat.setAutoClipOnChatSpike(!chat.autoClipOnChatSpike)}
              chatSpikeThreshold={chat.chatSpikeThreshold}
              onChatSpikeThresholdChange={chat.setChatSpikeThreshold}
              chatSpikeCooldownMinutes={chat.chatSpikeCooldownMinutes}
              onChatSpikeCooldownMinutesChange={chat.setChatSpikeCooldownMinutes}
            />
          </div>
        </div>

        {/* Right column: Custom Scripts + Automation Logs + Control Buttons */}
        <div className="space-y-6">
          <div className="bg-[var(--card-bg)] rounded-xl p-5 border border-[var(--border-color)]">
            <CustomScripts
              scripts={scripts}
              onAddScript={addScript}
              onToggleScript={toggleScript}
              onRemoveScript={removeScript}
            />
          </div>
          <div className="bg-[var(--card-bg)] rounded-xl p-5 border border-[var(--border-color)]">
            <AutomationLogs logs={logs} onClearLogs={clearLogs} />
          </div>
          <div className="bg-[var(--card-bg)] rounded-xl p-5 border border-[var(--border-color)]">
            <ControlButtons
              automationRunning={automationRunning}
              onStart={handleStart}
              onStop={handleStop}
            />
          </div>
        </div>
      </div>
    </div>
  );
};