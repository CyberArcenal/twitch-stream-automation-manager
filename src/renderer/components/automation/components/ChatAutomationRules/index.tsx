// ChatAutomationRules.tsx
import React from "react";
import { Shield } from "lucide-react";
import { AutoSlowModeSection } from "./sections/AutoSlowModeSection";
import { AutoDeleteToggle } from "./sections/AutoDeleteToggle";
import { AutoTimeoutToggle } from "./sections/AutoTimeoutToggle";
import { AutoFollowerModeSection } from "./sections/AutoFollowerModeSection";
import { AutoBlockLinksToggle } from "./sections/AutoBlockLinksToggle";
import { SpamDetectionSection } from "./sections/SpamDetectionSection";
import { AutoClipOnChatSpikeSection } from "./sections/AutoClipOnChatSpikeSection";
import { MasterToggleSection } from "./sections/MasterToggleSection";
import { BlockedWordsSection } from "../../../Modals/BlockedWords/BlockedWordsSection";
import { BlockedBadgesSection } from "../../../Modals/BlockedBadges/BlockedBadgesSection";


interface ChatAutomationRulesProps {
  fromModerationPage?: boolean;
  autoSlowMode: boolean;
  onToggleAutoSlowMode: () => void;
  slowModeSpamThreshold: number;
  onSlowModeSpamThresholdChange: (value: number) => void;
  slowModeWaitTime: number;
  onSlowModeWaitTimeChange: (value: number) => void;
  autoDeleteMessage: boolean;
  onToggleAutoDeleteMessage: () => void;
  autoTimeoutUser: boolean;
  onToggleAutoTimeout: () => void;
  autoFollowerMode: boolean;
  onToggleAutoFollowerMode: () => void;
  followerModeDuration: number;
  onFollowerModeDurationChange: (value: number) => void;
  autoBlockLinks: boolean;
  onToggleAutoBlockLinks: () => void;
  blockedTerms: string[];
  onAddBlockedTerm: (term: string) => void;
  onRemoveBlockedTerm: (term: string) => void;
  autoModerationEnabled: boolean;
  onToggleAutoModeration: () => void;
  slowModeDuration: number;
  setSlowModeDuration: (value: number) => void;
  repeatWindowSeconds: number;
  setRepeatWindowSeconds: (value: number) => void;
  repeatCountThreshold: number;
  setRepeatCountThreshold: (value: number) => void;
  blockedBadges: string[];
  onAddBlockedBadge: (badge: string) => void;
  onRemoveBlockedBadge: (badge: string) => void;
  autoClipOnChatSpike: boolean;
  onToggleAutoClipOnChatSpike: () => void;
  chatSpikeThreshold: number;
  onChatSpikeThresholdChange: (value: number) => void;
  chatSpikeCooldownMinutes: number;
  onChatSpikeCooldownMinutesChange: (value: number) => void;
}

export const ChatAutomationRules: React.FC<ChatAutomationRulesProps> = (props) => {
  return (
    <div>
      <h4 className="text-xs font-medium text-[var(--text-secondary)] uppercase mb-2 flex items-center gap-1">
        <Shield className="w-3 h-3" /> Chat Automation
      </h4>
      <div className={`space-y-3 overflow-y-scroll pr-2 pb-3 ${props.fromModerationPage ? "max-h-[490px]" : "max-h-[390px]"}`}>
        <AutoSlowModeSection
          enabled={props.autoSlowMode}
          onToggle={props.onToggleAutoSlowMode}
          spamThreshold={props.slowModeSpamThreshold}
          onSpamThresholdChange={props.onSlowModeSpamThresholdChange}
          waitTime={props.slowModeWaitTime}
          onWaitTimeChange={props.onSlowModeWaitTimeChange}
          duration={props.slowModeDuration}
          onDurationChange={props.setSlowModeDuration}
        />

        <AutoDeleteToggle
          enabled={props.autoDeleteMessage}
          onToggle={props.onToggleAutoDeleteMessage}
        />

        <AutoTimeoutToggle
          enabled={props.autoTimeoutUser}
          onToggle={props.onToggleAutoTimeout}
        />

        <AutoFollowerModeSection
          enabled={props.autoFollowerMode}
          onToggle={props.onToggleAutoFollowerMode}
          duration={props.followerModeDuration}
          onDurationChange={props.onFollowerModeDurationChange}
        />

        <AutoBlockLinksToggle
          enabled={props.autoBlockLinks}
          onToggle={props.onToggleAutoBlockLinks}
        />

        <BlockedWordsSection
          blockedTerms={props.blockedTerms}
          onAddTerm={props.onAddBlockedTerm}
          onRemoveTerm={props.onRemoveBlockedTerm}
        />

        <BlockedBadgesSection
          blockedBadges={props.blockedBadges}
          onAddBadge={props.onAddBlockedBadge}
          onRemoveBadge={props.onRemoveBlockedBadge}
        />

        <SpamDetectionSection
          windowSeconds={props.repeatWindowSeconds}
          onWindowSecondsChange={props.setRepeatWindowSeconds}
          repeatThreshold={props.repeatCountThreshold}
          onRepeatThresholdChange={props.setRepeatCountThreshold}
        />

        <AutoClipOnChatSpikeSection
          enabled={props.autoClipOnChatSpike}
          onToggle={props.onToggleAutoClipOnChatSpike}
          threshold={props.chatSpikeThreshold}
          onThresholdChange={props.onChatSpikeThresholdChange}
          cooldownMinutes={props.chatSpikeCooldownMinutes}
          onCooldownMinutesChange={props.onChatSpikeCooldownMinutesChange}
        />

        <MasterToggleSection
          enabled={props.autoModerationEnabled}
          onToggle={props.onToggleAutoModeration}
        />
      </div>
    </div>
  );
};