// src/renderer/pages/moderation/index.tsx
import React, { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import ChatCard from "../../components/ChatCard"; // ✅ use modern chat
import { UserInfoPanel } from "./components/UserInfoPanel";
import { TeamManagement } from "./components/TeamManagement";
import {
  AutomationLogProvider,
  useAutomationLog,
} from "../../contexts/AutomationLogContext";
import { ErrorBoundary } from "../../components/UI/ErrorBoundary";
import LoadingSpinner from "../../components/Shared/LoadingSpinner";

import { AutomationLogs } from "../../components/automation/components/AutomationLogs";
import { useAutomationRunner, useChatModeration, useStreamTriggers } from "../../components/automation/hooks";
import { ControlButtons } from "../../components/automation/components/ControlButtons";
import { StreamTriggers } from "../../components/automation/components/StreamTriggers";
import { ChatAutomationRules } from "../../components/automation/components/ChatAutomationRules";
import { ModerationLogCard } from "./components/ModerationLogCard";
import CollaborationCard from "../stream-manager/components/CollaborationCard";


const ModerationPageContent: React.FC<{
  broadcasterId: string;
  userLogin: string;
}> = ({ broadcasterId, userLogin }) => {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUserName, setSelectedUserName] = useState<string>("");

  const stream = useStreamTriggers();
  const chat = useChatModeration();
  const { automationRunning, startAutomation, stopAutomation } =
    useAutomationRunner();
  const { logs, clearLogs } = useAutomationLog();

  const handleStart = async () => {
    const fullConfig = {
      ...stream.getConfig(),
      ...chat.getConfig(),
    };
    await startAutomation(fullConfig);
  };

  return (
   <div className="h-full min-h-full !p-4 bg-[var(--background-color)]">
  <div className="grid grid-cols-1 lg:grid-cols-[repeat(auto-fit,minmax(350px,1fr))] gap-4 auto-rows-min">
        {/* Column 1: Chat Card (modern) */}
        <div className="flex flex-col gap-4 h-full">
          <ErrorBoundary>
            <ChatCard
              channelName={userLogin}
              broadcasterId={broadcasterId}
              isLive={true}
              fromModeration={true}
              onSelectUser={(userId, userName) => {
                setSelectedUserId(userId);
                setSelectedUserName(userName);
              }}
            />
          </ErrorBoundary>
        </div>

        {/* Column 2: User Info (optional) + Moderation Logs + Team Management */}
        <div className="flex flex-col gap-4 h-full overflow-hidden">
          {selectedUserId && (
            <ErrorBoundary>
              <UserInfoPanel
                broadcasterId={broadcasterId}
                userId={selectedUserId}
                userName={selectedUserName}
              />
            </ErrorBoundary>
          )}
          <ErrorBoundary>
            <ModerationLogCard broadcasterId={broadcasterId} className="flex-1" />
          </ErrorBoundary>
           <ErrorBoundary>
            <CollaborationCard className="flex-1"/>
          </ErrorBoundary>
        </div>

        {/* Column 3: Automation Engine + Stream Triggers + Chat Rules */}
        <div className="flex flex-col gap-4 h-full overflow-hidden">
          <ErrorBoundary>
            <div className="bg-[var(--card-bg)] rounded-xl shadow-md border border-[var(--border-color)] p-4">
              <h3 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider mb-3">
                Automation Engine
              </h3>
              <ControlButtons
                automationRunning={automationRunning}
                onStart={handleStart}
                onStop={stopAutomation}
              />
            </div>
          </ErrorBoundary>

          <ErrorBoundary>
            <div className="bg-[var(--card-bg)] rounded-xl shadow-md border border-[var(--border-color)] p-4">
              <StreamTriggers
                isLive={true}
                autoRaidEnabled={stream.autoRaidEnabled}
                onToggleAutoRaid={() =>
                  stream.setAutoRaidEnabled(!stream.autoRaidEnabled)
                }
                raidTarget={stream.raidTarget}
                onRaidTargetChange={stream.setRaidTarget}
                autoClipEnabled={stream.autoClipEnabled}
                onToggleAutoClip={() =>
                  stream.setAutoClipEnabled(!stream.autoClipEnabled)
                }
                autoMessageEnabled={stream.autoMessageEnabled}
                onToggleAutoMessage={() =>
                  stream.setAutoMessageEnabled(!stream.autoMessageEnabled)
                }
                autoMessageText={stream.autoMessageText}
                onAutoMessageTextChange={stream.setAutoMessageText}
                autoShoutoutOnRaid={chat.autoShoutoutOnRaid}
                onToggleAutoShoutoutOnRaid={() =>
                  chat.setAutoShoutoutOnRaid(!chat.autoShoutoutOnRaid)
                }
                shoutoutMessage={chat.shoutoutMessage}
                onShoutoutMessageChange={chat.setShoutoutMessage}
                autoStreamMarkers={chat.autoStreamMarkers}
                onToggleAutoStreamMarkers={() =>
                  chat.setAutoStreamMarkers(!chat.autoStreamMarkers)
                }
                markerIntervalMinutes={chat.markerIntervalMinutes}
                onMarkerIntervalMinutesChange={chat.setMarkerIntervalMinutes}
              />
            </div>
          </ErrorBoundary>

          <ErrorBoundary>
            <div className="bg-[var(--card-bg)] rounded-xl shadow-md border border-[var(--border-color)] p-4 overflow-y-hidden">
              <ChatAutomationRules
                fromModerationPage={true}
                autoSlowMode={chat.autoSlowMode}
                onToggleAutoSlowMode={() =>
                  chat.setAutoSlowMode(!chat.autoSlowMode)
                }
                slowModeSpamThreshold={chat.slowModeSpamThreshold}
                onSlowModeSpamThresholdChange={chat.setSlowModeSpamThreshold}
                slowModeWaitTime={chat.slowModeWaitTime}
                onSlowModeWaitTimeChange={chat.setSlowModeWaitTime}
                autoDeleteMessage={chat.autoDeleteMessage}
                onToggleAutoDeleteMessage={() =>
                  chat.setAutoDeleteMessage(!chat.autoDeleteMessage)
                }
                autoTimeoutUser={chat.autoTimeoutUser}
                onToggleAutoTimeout={() =>
                  chat.setAutoTimeoutUser(!chat.autoTimeoutUser)
                }
                autoFollowerMode={chat.autoFollowerMode}
                onToggleAutoFollowerMode={() =>
                  chat.setAutoFollowerMode(!chat.autoFollowerMode)
                }
                followerModeDuration={chat.followerModeDuration}
                onFollowerModeDurationChange={chat.setFollowerModeDuration}
                autoBlockLinks={chat.autoBlockLinks}
                onToggleAutoBlockLinks={() =>
                  chat.setAutoBlockLinks(!chat.autoBlockLinks)
                }
                blockedTerms={chat.blockedTerms}
                onAddBlockedTerm={chat.addBlockedTerm}
                onRemoveBlockedTerm={chat.removeBlockedTerm}
                autoModerationEnabled={chat.autoModerationEnabled}
                onToggleAutoModeration={() =>
                  chat.setAutoModerationEnabled(!chat.autoModerationEnabled)
                }
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
                onToggleAutoClipOnChatSpike={() =>
                  chat.setAutoClipOnChatSpike(!chat.autoClipOnChatSpike)
                }
                chatSpikeThreshold={chat.chatSpikeThreshold}
                onChatSpikeThresholdChange={chat.setChatSpikeThreshold}
                chatSpikeCooldownMinutes={chat.chatSpikeCooldownMinutes}
                onChatSpikeCooldownMinutesChange={
                  chat.setChatSpikeCooldownMinutes
                }
              />
            </div>
          </ErrorBoundary>
        </div>

        {/* Column 4: Automation Logs */}
        <div className="flex flex-col gap-4 h-full overflow-hidden">
          <ErrorBoundary>
            <div className="bg-[var(--card-bg)] rounded-xl shadow-md border border-[var(--border-color)] p-4 flex flex-col h-full overflow-hidden">
              <AutomationLogs
                logs={logs}
                onClearLogs={clearLogs}
                className="flex-1 flex flex-col h-full min-h-0 max-h-[880px]"
                classNameToLog="flex-1 overflow-y-scroll"
                fromModeration={true}
              />
            </div>
          </ErrorBoundary>
        </div>
      </div>
    </div>
  );
};

const ModerationPage: React.FC = () => {
  const { user } = useAuth();
  const [broadcasterId, setBroadcasterId] = useState<string>("");

  useEffect(() => {
    if (user?.id) setBroadcasterId(user.id);
  }, [user]);

  if (!broadcasterId) {
    return (
      <div className="flex justify-center items-center h-full">
        <LoadingSpinner size="medium" text="Loading moderation tools..." />
      </div>
    );
  }

  return (
      <ModerationPageContent
        broadcasterId={broadcasterId}
        userLogin={user?.login || ""}
      />
  );
};

export default ModerationPage;
