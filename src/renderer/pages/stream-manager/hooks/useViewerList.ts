// src/renderer/pages/stream-manager/hooks/useViewerList.ts
import { useState, useEffect } from 'react';
import { streamManagerAPI } from '../../../api/core/streamManager';

export const useViewerList = (broadcasterId: string, moderatorId: string, isLive: boolean) => {
  const [viewers, setViewers] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchViewers = async () => {
    if (!broadcasterId || !moderatorId || !isLive) return;
    setLoading(true);
    try {
      const res = await streamManagerAPI.getChatters(broadcasterId, moderatorId);
      if (res.status && res.data?.data) {
        setViewers(res.data.data.map((v: any) => v.user_login));
      }
    } catch (err) {
      console.error('Failed to fetch chatters', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isLive) {
      setViewers([]);
      return;
    }
    fetchViewers();
    const interval = setInterval(fetchViewers, 30000);
    return () => clearInterval(interval);
  }, [broadcasterId, moderatorId, isLive]);

  return { viewers, loading, refresh: fetchViewers };
};