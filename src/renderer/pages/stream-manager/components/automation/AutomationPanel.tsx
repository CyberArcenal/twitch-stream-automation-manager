import React, { useState, useEffect } from "react";
import { StreamTriggers } from "./components/StreamTriggers";
import { ChatAutomationRules } from "./components/ChatAutomationRules";
import { CustomScripts } from "./components/CustomScripts";
import { AutomationLogs } from "./components/AutomationLogs";
import { ControlButtons } from "./components/ControlButtons";
import { useAutomationLog } from "../../../../contexts/AutomationLogContext";
import { useAutomationRunner, useChatModeration, useStreamTriggers } from "./hooks";

interface AutomationPanelProps {
  isLive: boolean;
  broadcasterId?: string;
  moderatorId?: string;
}

const STORAGE_KEY = "automation_custom_scripts";

interface CustomScript {
  name: string;
  enabled: boolean;
}

const AutomationPanel: React.FC<AutomationPanelProps> = ({ isLive }) => {
  const { logs, clearLogs, addLog } = useAutomationLog();
  const stream = useStreamTriggers();
  const chat = useChatModeration();
  const [newBadge, setNewBadge] = useState("");
  const { automationRunning, startAutomation, stopAutomation } = useAutomationRunner();
  

  const [scripts, setScripts] = useState<CustomScript[]>([]);
  const [newTermLocal, setNewTermLocal] = useState("");

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
    localStorage.setItem(STORAGE_KEY, JSON.stringify(scripts));
  }, [scripts]);

  // Custom scripts handlers
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
      ...stream.getConfig(),   // ✅ fixed
      ...chat.getConfig(),     // ✅ fixed
    };
    await startAutomation(fullConfig);
  };

  const handleStop = async () => {
    await stopAutomation();
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
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

        <ChatAutomationRules
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
        newTerm={newTermLocal}
        onNewTermChange={setNewTermLocal}
        autoModerationEnabled={chat.autoModerationEnabled}
        onToggleAutoModeration={() => chat.setAutoModerationEnabled(!chat.autoModerationEnabled)} slowModeDuration={chat.slowModeDuration} setSlowModeDuration={chat.setSlowModeDuration}
        repeatWindowSeconds={chat.repeatWindowSeconds} setRepeatWindowSeconds={chat.setRepeatWindowSeconds}
        repeatCountThreshold={chat.repeatCountThreshold} setRepeatCountThreshold={chat.setRepeatCountThreshold}
        blockedBadges={chat.blockedBadges}
        onAddBlockedBadge={chat.addBlockedBadge}
        onRemoveBlockedBadge={chat.removeBlockedBadge}
        newBadge={newBadge}
        onNewBadgeChange={setNewBadge}
        autoClipOnChatSpike={chat.autoClipOnChatSpike}
        onToggleAutoClipOnChatSpike={() => chat.setAutoClipOnChatSpike(!chat.autoClipOnChatSpike)}
        chatSpikeThreshold={chat.chatSpikeThreshold}
        onChatSpikeThresholdChange={chat.setChatSpikeThreshold}
        chatSpikeCooldownMinutes={chat.chatSpikeCooldownMinutes}
        onChatSpikeCooldownMinutesChange={chat.setChatSpikeCooldownMinutes}
        />


        <CustomScripts
          scripts={scripts}
          onAddScript={addScript}
          onToggleScript={toggleScript}
          onRemoveScript={removeScript}
        />

        <AutomationLogs logs={logs} onClearLogs={clearLogs} />
      </div>

      <ControlButtons
        automationRunning={automationRunning}
        onStart={handleStart}
        onStop={handleStop}
      />
    </div>
  );
};

export default AutomationPanel;