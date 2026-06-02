// src/renderer/pages/stream-manager/hooks/useUptime.ts
import { useState, useEffect } from 'react';
import { streamManagerAPI } from '../../../api/core/streamManager';

export const useUptime = (isLive: boolean, startedAt?: string) => {
  const [uptime, setUptime] = useState('');

  useEffect(() => {
    if (!isLive) {
      setUptime('');
      return;
    }

    const updateUptime = async () => {
      try {
        const res = await streamManagerAPI.getStreamElapsedHours();
        if (res.status && typeof res.data === 'number') {
          const hours = res.data;
          const totalSeconds = Math.floor(hours * 3600);
          const h = Math.floor(totalSeconds / 3600);
          const m = Math.floor((totalSeconds % 3600) / 60);
          const s = totalSeconds % 60;
          setUptime(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
        } else {
          // Fallback to client-side calculation if backend fails
          if (startedAt) {
            const diff = (Date.now() - new Date(startedAt).getTime()) / 1000;
            const h = Math.floor(diff / 3600);
            const m = Math.floor((diff % 3600) / 60);
            const s = Math.floor(diff % 60);
            setUptime(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
          }
        }
      } catch (err) {
        console.error('Failed to get stream elapsed hours', err);
        // Fallback to client-side calculation
        if (startedAt) {
          const diff = (Date.now() - new Date(startedAt).getTime()) / 1000;
          const h = Math.floor(diff / 3600);
          const m = Math.floor((diff % 3600) / 60);
          const s = Math.floor(diff % 60);
          setUptime(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
        }
      }
    };

    updateUptime();
    const interval = setInterval(updateUptime, 1000);
    return () => clearInterval(interval);
  }, [isLive, startedAt]);

  return uptime;
};