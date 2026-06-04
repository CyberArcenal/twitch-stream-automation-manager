import { useState, useEffect } from 'react';
import { streamManagerAPI } from '../../../api/core/streamManager';

export const useStreamTriggers = () => {
  const [autoRaidEnabled, setAutoRaidEnabled] = useState(false);
  const [autoClipEnabled, setAutoClipEnabled] = useState(false);
  const [autoMessageEnabled, setAutoMessageEnabled] = useState(false);
  const [autoMessageText, setAutoMessageText] = useState("Thanks for the follow/sub! 🎉");
  const [raidTarget, setRaidTarget] = useState("");

  // Load from backend
  useEffect(() => {
    const load = async () => {
      const res = await streamManagerAPI.getAutomationStatus();
      if (res.status && res.data?.config) {
        setAutoRaidEnabled(res.data.config.autoRaid ?? false);
        setAutoClipEnabled(res.data.config.autoClip ?? false);
        setAutoMessageEnabled(res.data.config.autoMessage ?? false);
        setAutoMessageText(res.data.config.autoMessageText ?? "Thanks for the follow/sub! 🎉");
        setRaidTarget(res.data.config.raidTarget ?? "");
      }
    };
    load();
  }, []);

  const getConfig = () => ({
    autoRaid: autoRaidEnabled,
    autoClip: autoClipEnabled,
    autoMessage: autoMessageEnabled,
    autoMessageText,
    raidTarget: raidTarget || null,
  });

  return {
    autoRaidEnabled, setAutoRaidEnabled,
    autoClipEnabled, setAutoClipEnabled,
    autoMessageEnabled, setAutoMessageEnabled,
    autoMessageText, setAutoMessageText,
    raidTarget, setRaidTarget,
    getConfig,  // ✅ fixed: export the actual function
  };
};