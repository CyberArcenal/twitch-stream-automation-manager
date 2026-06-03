import { useState, useEffect } from 'react';
import { streamManagerAPI } from '../../../../../api/core/streamManager';

export interface ChatModerationState {
  autoSlowMode: boolean;
  slowModeSpamThreshold: number;
  slowModeWaitTime: number;
  autoDeleteMessage: boolean;
  autoTimeoutUser: boolean;
  autoFollowerMode: boolean;
  followerModeDuration: number;
  autoBlockLinks: boolean;
  blockedTerms: string[];
  autoModerationEnabled: boolean;
}

export const useChatModeration = () => {
  const [autoSlowMode, setAutoSlowMode] = useState(false);
  const [slowModeSpamThreshold, setSlowModeSpamThreshold] = useState(5);
  const [slowModeWaitTime, setSlowModeWaitTime] = useState(10);
  const [autoDeleteMessage, setAutoDeleteMessage] = useState(false);
  const [autoTimeoutUser, setAutoTimeoutUser] = useState(true);
  const [autoFollowerMode, setAutoFollowerMode] = useState(false);
  const [followerModeDuration, setFollowerModeDuration] = useState(60);
  const [autoBlockLinks, setAutoBlockLinks] = useState(false);
  const [blockedTerms, setBlockedTerms] = useState<string[]>([]);
  const [autoModerationEnabled, setAutoModerationEnabled] = useState(false);

  // Load from backend
  useEffect(() => {
    const load = async () => {
      const res = await streamManagerAPI.getAutomationStatus();
      if (res.status && res.data?.config) {
        setAutoSlowMode(res.data.config.autoSlowMode ?? false);
        setSlowModeSpamThreshold(res.data.config.slowModeSpamThreshold ?? 5);
        setSlowModeWaitTime(res.data.config.slowModeWaitTime ?? 10);
        setAutoDeleteMessage(res.data.config.autoDeleteMessage ?? false);
        setAutoTimeoutUser(res.data.config.autoTimeoutUser ?? true);
        setAutoFollowerMode(res.data.config.autoFollowerMode ?? false);
        setFollowerModeDuration(res.data.config.followerModeDuration ?? 60);
        setAutoBlockLinks(res.data.config.autoBlockLinks ?? false);
        setBlockedTerms(res.data.config.blockedTerms ?? []);
        setAutoModerationEnabled(res.data.config.autoModerationEnabled ?? false);
      }
    };
    load();
  }, []);

  const getConfig = () => ({
    autoSlowMode,
    slowModeSpamThreshold,
    slowModeWaitTime,
    autoDeleteMessage,
    autoTimeoutUser,
    autoFollowerMode,
    followerModeDuration,
    autoBlockLinks,
    blockedTerms,
    autoModerationEnabled,
  });

  return {
    // states
    autoSlowMode, setAutoSlowMode,
    slowModeSpamThreshold, setSlowModeSpamThreshold,
    slowModeWaitTime, setSlowModeWaitTime,
    autoDeleteMessage, setAutoDeleteMessage,
    autoTimeoutUser, setAutoTimeoutUser,
    autoFollowerMode, setAutoFollowerMode,
    followerModeDuration, setFollowerModeDuration,
    autoBlockLinks, setAutoBlockLinks,
    blockedTerms, setBlockedTerms,
    autoModerationEnabled, setAutoModerationEnabled,
    // helpers
    addBlockedTerm: (term: string) => setBlockedTerms(prev => [...prev, term.toLowerCase()]),
    removeBlockedTerm: (term: string) => setBlockedTerms(prev => prev.filter(t => t !== term)),
    getConfig,  // ✅ fixed: export the actual function
  };
};