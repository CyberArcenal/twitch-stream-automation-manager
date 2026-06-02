// src/renderer/pages/stream-manager/hooks/useAlertsFeed.ts
import { useState, useEffect } from 'react';
import { eventsubAPI } from '../../../api/core/eventsub';

export interface StreamEvent {
  id: string;
  type: 'follow' | 'subscribe' | 'raid' | 'hype_train';
  user: string;
  message: string;
  timestamp: Date;
  data?: any;
}

let eventSubStarted = false; // Global flag to prevent multiple initializations

export const useAlertsFeed = (channelId: string) => {
  const [events, setEvents] = useState<StreamEvent[]>([]);

  useEffect(() => {
    if (!channelId) return;

    // Start EventSub only once globally
    if (!eventSubStarted) {
      eventSubStarted = true;
      eventsubAPI.start().catch(console.error);
      eventsubAPI.subscribeFollows(channelId).catch(console.error);
      eventsubAPI.subscribeSubscriptions(channelId).catch(console.error);
      // Optionally subscribe to raids and hype trains as well
      eventsubAPI.subscribeRaidEvents?.(channelId).catch(console.error);
      eventsubAPI.subscribeHypeTrainEvents?.(channelId).catch(console.error);
    }

    const handleFollow = (data: any) => {
      setEvents(prev => [{
        id: `follow-${Date.now()}`,
        type: 'follow',
        user: data.followerName,
        message: `${data.followerName} followed you!`,
        timestamp: new Date(),
        data,
      }, ...prev.slice(0, 49)]);
    };

    const handleSubscribe = (data: any) => {
      const tierLabel = data.tier === '1000' ? 'Tier 1' : data.tier === '2000' ? 'Tier 2' : 'Tier 3';
      setEvents(prev => [{
        id: `sub-${Date.now()}`,
        type: 'subscribe',
        user: data.userName,
        message: `${data.userName} subscribed (${tierLabel})!`,
        timestamp: new Date(),
        data,
      }, ...prev.slice(0, 49)]);
    };

    const handleRaid = (data: any) => {
      setEvents(prev => [{
        id: `raid-${Date.now()}`,
        type: 'raid',
        user: data.fromBroadcasterName,
        message: `${data.fromBroadcasterName} is raiding with ${data.viewers} viewers!`,
        timestamp: new Date(),
        data,
      }, ...prev.slice(0, 49)]);
    };

    const handleHypeTrain = (data: any) => {
      setEvents(prev => [{
        id: `hype-${Date.now()}`,
        type: 'hype_train',
        user: '',
        message: `Hype Train level ${data.level} started!`,
        timestamp: new Date(),
        data,
      }, ...prev.slice(0, 49)]);
    };

    window.backendAPI?.on?.('eventsub:follow', handleFollow);
    window.backendAPI?.on?.('eventsub:subscription', handleSubscribe);
    window.backendAPI?.on?.('eventsub:raid', handleRaid);
    window.backendAPI?.on?.('eventsub:hype_train', handleHypeTrain);

    return () => {
      // Only remove listeners, do not stop EventSub globally
      window.backendAPI?.off?.('eventsub:follow', handleFollow);
      window.backendAPI?.off?.('eventsub:subscription', handleSubscribe);
      window.backendAPI?.off?.('eventsub:raid', handleRaid);
      window.backendAPI?.off?.('eventsub:hype_train', handleHypeTrain);
    };
  }, [channelId]);

  const clearEvents = () => setEvents([]);

  return { events, clearEvents };
};