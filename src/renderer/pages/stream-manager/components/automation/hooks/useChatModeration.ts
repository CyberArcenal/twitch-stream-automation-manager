import { useState, useEffect } from "react";
import { streamManagerAPI } from "../../../../../api/core/streamManager";

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
  const [slowModeDuration, setSlowModeDuration] = useState<number>(0);
  const [repeatWindowSeconds, setRepeatWindowSeconds] = useState(10);
  const [repeatCountThreshold, setRepeatCountThreshold] = useState(3);
  const [autoShoutoutOnRaid, setAutoShoutoutOnRaid] = useState(false);
  const [shoutoutMessage, setShoutoutMessage] = useState(
    "Thanks for the raid @{fromBroadcasterName}! Check them out at twitch.tv/{fromBroadcasterName}",
  );
   const [blockedBadges, setBlockedBadges] = useState<string[]>([]);
     const [autoClipOnChatSpike, setAutoClipOnChatSpike] = useState(false);
  const [chatSpikeThreshold, setChatSpikeThreshold] = useState(100);
  const [chatSpikeCooldownMinutes, setChatSpikeCooldownMinutes] = useState(5);
    const [autoStreamMarkers, setAutoStreamMarkers] = useState(false);
  const [markerIntervalMinutes, setMarkerIntervalMinutes] = useState(30);

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
        setAutoModerationEnabled(
          res.data.config.autoModerationEnabled ?? false,
        );
        setSlowModeDuration(res.data.config.slowModeDuration ?? 60);
        setRepeatWindowSeconds(res.data.config.repeatWindowSeconds ?? 10);
        setRepeatCountThreshold(res.data.config.repeatCountThreshold ?? 3);
        setAutoShoutoutOnRaid(res.data.config.autoShoutoutOnRaid ?? false);
        setShoutoutMessage(res.data.config.shoutoutMessage ?? "...");
        setBlockedBadges(res.data.config.blockedBadges ?? []);
           setAutoClipOnChatSpike(res.data.config.autoClipOnChatSpike ?? false);
        setChatSpikeThreshold(res.data.config.chatSpikeThreshold ?? 100);
        setChatSpikeCooldownMinutes(res.data.config.chatSpikeCooldownMinutes ?? 5);
         setAutoStreamMarkers(res.data.config.autoStreamMarkers ?? false);
        setMarkerIntervalMinutes(res.data.config.markerIntervalMinutes ?? 30);
      }
    };
    load();
  }, []);

  const getConfig = () => ({
    autoSlowMode,
    slowModeDuration,
    slowModeSpamThreshold,
    slowModeWaitTime,
    autoDeleteMessage,
    autoTimeoutUser,
    autoFollowerMode,
    followerModeDuration,
    autoBlockLinks,
    blockedTerms,
    autoModerationEnabled,
    repeatWindowSeconds,
    repeatCountThreshold,
    autoShoutoutOnRaid,
    shoutoutMessage,
    blockedBadges,
        autoClipOnChatSpike,
    chatSpikeThreshold,
    chatSpikeCooldownMinutes,
       autoStreamMarkers,
    markerIntervalMinutes,
  });


  const addBlockedBadge = (badge: string) => {
    if (!badge.trim()) return;
    setBlockedBadges(prev => [...prev, badge.trim().toLowerCase()]);
  };

  const removeBlockedBadge = (badge: string) => {
    setBlockedBadges(prev => prev.filter(b => b !== badge));
  };


  return {
    // states
    autoSlowMode,
    setAutoSlowMode,
    slowModeSpamThreshold,
    setSlowModeSpamThreshold,
    slowModeWaitTime,
    setSlowModeWaitTime,
    autoDeleteMessage,
    setAutoDeleteMessage,
    autoTimeoutUser,
    setAutoTimeoutUser,
    autoFollowerMode,
    setAutoFollowerMode,
    followerModeDuration,
    setFollowerModeDuration,
    autoBlockLinks,
    setAutoBlockLinks,
    blockedTerms,
    setBlockedTerms,
    autoModerationEnabled,
    setAutoModerationEnabled,
    slowModeDuration,
    setSlowModeDuration,
    repeatWindowSeconds,
    setRepeatWindowSeconds,
    repeatCountThreshold,
    setRepeatCountThreshold,
    autoShoutoutOnRaid,
    setAutoShoutoutOnRaid,
    shoutoutMessage,
    setShoutoutMessage,
    blockedBadges,
    addBlockedBadge,
    removeBlockedBadge,
      autoClipOnChatSpike, setAutoClipOnChatSpike,
    chatSpikeThreshold, setChatSpikeThreshold,
    chatSpikeCooldownMinutes, setChatSpikeCooldownMinutes,
       autoStreamMarkers, setAutoStreamMarkers,
    markerIntervalMinutes, setMarkerIntervalMinutes,
    // helpers
    addBlockedTerm: (term: string) =>
      setBlockedTerms((prev) => [...prev, term.toLowerCase()]),
    removeBlockedTerm: (term: string) =>
      setBlockedTerms((prev) => prev.filter((t) => t !== term)),
    getConfig, // ✅ fixed: export the actual function
  };
};
