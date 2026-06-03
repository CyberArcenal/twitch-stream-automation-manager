// I-re-export ang lahat para hindi masira ang existing imports
export { useStreamTriggers } from './useStreamTriggers';
export { useChatModeration } from './useChatModeration';
export { useAutomationRunner } from './useAutomationRunner';

// Para sa mga lumang component na umaasa sa `useAutomation`,
// gumawa tayo ng composite hook na may katulad na interface
import { useStreamTriggers } from './useStreamTriggers';
import { useChatModeration } from './useChatModeration';
import { useAutomationRunner } from './useAutomationRunner';
import { useAutomationLog } from '../../../../../contexts/AutomationLogContext';

export const useAutomation = () => {
  const stream = useStreamTriggers();
  const chat = useChatModeration();
  const runner = useAutomationRunner();
  const { logs, addLog, clearLogs } = useAutomationLog();

  // Pinagsamang start function – ginagamit ang lahat ng config
  const startAutomation = async () => {
    const fullConfig = {
      ...stream.getConfig(),   // ✅ fixed: was getStreamTriggersConfig
      ...chat.getConfig(),     // ✅ fixed: was getChatModerationConfig
    };
    return runner.startAutomation(fullConfig);
  };

  const stopAutomation = runner.stopAutomation;

  return {
    // Stream triggers
    autoRaidEnabled: stream.autoRaidEnabled,
    setAutoRaidEnabled: stream.setAutoRaidEnabled,
    autoClipEnabled: stream.autoClipEnabled,
    setAutoClipEnabled: stream.setAutoClipEnabled,
    autoMessageEnabled: stream.autoMessageEnabled,
    setAutoMessageEnabled: stream.setAutoMessageEnabled,
    autoMessageText: stream.autoMessageText,
    setAutoMessageText: stream.setAutoMessageText,
    raidTarget: stream.raidTarget,
    setRaidTarget: stream.setRaidTarget,

    // Chat moderation
    autoModerationEnabled: chat.autoModerationEnabled,
    setAutoModerationEnabled: chat.setAutoModerationEnabled,
    autoBlockLinks: chat.autoBlockLinks,
    setAutoBlockLinks: chat.setAutoBlockLinks,
    blockedTerms: chat.blockedTerms,
    addBlockedTerm: chat.addBlockedTerm,
    removeBlockedTerm: chat.removeBlockedTerm,
    autoDeleteMessage: chat.autoDeleteMessage,
    setAutoDeleteMessage: chat.setAutoDeleteMessage,
    autoTimeoutUser: chat.autoTimeoutUser,
    setAutoTimeoutUser: chat.setAutoTimeoutUser,

    // Runner
    automationRunning: runner.automationRunning,
    setAutomationRunning: runner.setAutomationRunning,
    startAutomation,
    stopAutomation,

    // Logs
    logs,
    addLog,
    clearLogs,
  };
};