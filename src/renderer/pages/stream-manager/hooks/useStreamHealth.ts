// src/renderer/pages/stream-manager/hooks/useStreamHealth.ts
import { useState, useEffect, useRef, useMemo } from 'react';
import { streamManagerAPI } from '../../../api/core/streamManager';

export const useStreamHealth = (isLive: boolean) => {
  const [bitrate, setBitrate] = useState(0);
  const [fps, setFps] = useState(0);
  const [droppedFrames, setDroppedFrames] = useState(0);
  const [cpuUsage, setCpuUsage] = useState(0);
  const [connected, setConnected] = useState(false);
  const [latency, setLatency] = useState<number | null>(null);
  const lastBytesRef = useRef<{ bytes: number; timestamp: number }>({ bytes: 0, timestamp: 0 });

  useEffect(() => {
    if (!isLive) return;

    const fetchStats = async () => {
      try {
        // Check OBS connection
        const statusRes = await streamManagerAPI.getOBSStatus();
        if (!statusRes.status || !statusRes.data) {
          setConnected(false);
          return;
        }
        setConnected(true);

        // Get OBS stats
        const statsRes = await streamManagerAPI.getOBSStats();
        if (statsRes.status && statsRes.data) {
          const totalFrames = statsRes.data.outputTotalFrames || 1;
          const skipped = statsRes.data.outputSkippedFrames || 0;
          const droppedPercent = (skipped / totalFrames) * 100;
          setDroppedFrames(Math.min(100, Math.round(droppedPercent)));
          setCpuUsage(statsRes.data.cpuUsage || 0);
          setFps(statsRes.data.activeFps || 0);

          // ✅ Real bitrate from output bytes
          const currentBytes = statsRes.data.outputTotalBytes || 0;
          const now = Date.now();
          const last = lastBytesRef.current;
          if (last.bytes > 0 && last.timestamp > 0) {
            const bytesDiff = currentBytes - last.bytes;
            const timeDiff = (now - last.timestamp) / 1000; // seconds
            if (timeDiff > 0) {
              const bitrateKbps = (bytesDiff * 8) / (timeDiff * 1000);
              setBitrate(Math.max(0, Math.round(bitrateKbps)));
            }
          }
          lastBytesRef.current = { bytes: currentBytes, timestamp: now };
        }
      } catch (err) {
        console.error('Failed to fetch OBS stats', err);
        setConnected(false);
      }
    };

    // ✅ Measure latency (ping to a fast endpoint)
    const measureLatency = async () => {
      const start = performance.now();
      try {
        await fetch('https://api.twitch.tv/helix/streams?first=1', { method: 'HEAD', mode: 'no-cors' });
        const end = performance.now();
        setLatency(Math.round(end - start));
      } catch {
        // Fallback to a generic endpoint
        try {
          await fetch('https://www.google.com/favicon.ico', { method: 'HEAD', mode: 'no-cors' });
          const end = performance.now();
          setLatency(Math.round(end - start));
        } catch {
          setLatency(null);
        }
      }
    };

    fetchStats();
    const statsInterval = setInterval(fetchStats, 3000);
    const latencyInterval = setInterval(measureLatency, 10000);
    measureLatency(); // initial measure

    return () => {
      clearInterval(statsInterval);
      clearInterval(latencyInterval);
    };
  }, [isLive]);

  return useMemo(() => ({ bitrate, fps, droppedFrames, cpuUsage, connected, latency }), [bitrate, fps, droppedFrames, cpuUsage, connected, latency]);
};