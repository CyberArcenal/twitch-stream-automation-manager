import React, { useState, useEffect } from "react";
import { Activity, Cpu, HardDrive, Wifi } from "lucide-react";
import { streamManagerAPI } from "../../../api/core/streamManager";

export const StreamHealthCard: React.FC = () => {
  const [health, setHealth] = useState<{
    streaming: boolean;
    bitrate: number;
    fps: number;
    droppedFrames: number;
    cpuUsage: number;
    memoryUsage: number;
  }>({
    streaming: false,
    bitrate: 0,
    fps: 0,
    droppedFrames: 0,
    cpuUsage: 0,
    memoryUsage: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchHealth = async () => {
    try {
      const status = await streamManagerAPI.getStreamStatus();
      const stats = await streamManagerAPI.getOBSStats();
      setHealth({
        streaming: status.data?.outputActive || false,
        bitrate: status.data?.outputBytes ? (status.data.outputBytes / 125000) : 0,
        fps: stats.data?.activeFps || 0,
        droppedFrames: stats.data?.outputSkippedFrames || 0,
        cpuUsage: stats.data?.cpuUsage || 0,
        memoryUsage: stats.data?.memoryUsage || 0,
      });
    } catch (err) {
      console.warn("OBS not connected or stats unavailable", err);
      setHealth(prev => ({ ...prev, streaming: false }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="bg-[var(--card-bg)] rounded-xl p-5 animate-pulse">
        <div className="h-24 bg-[#2a2a2e] rounded"></div>
      </div>
    );
  }

  return (
    <div className="bg-[var(--card-bg)] rounded-xl shadow-md p-5 border border-[var(--card-bg)]">
      <div className="flex items-center gap-3 mb-4">
        <Activity className="w-5 h-5 text-[#9147ff]" />
        <h3 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider">
          Stream Health
        </h3>
      </div>
      {!health.streaming ? (
        <div className="text-center text-[var(--text-secondary)] py-4">Not currently streaming</div>
      ) : (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs text-[var(--text-secondary)] flex items-center gap-1"><Wifi className="w-3 h-3" /> Bitrate</span>
            <span className="text-sm font-mono text-[var(--text-primary)]">{Math.round(health.bitrate)} kbps</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-[var(--text-secondary)] flex items-center gap-1"><Activity className="w-3 h-3" /> FPS</span>
            <span className="text-sm font-mono text-[var(--text-primary)]">{health.fps}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-[var(--text-secondary)] flex items-center gap-1"><Cpu className="w-3 h-3" /> Dropped Frames</span>
            <span className="text-sm font-mono text-[var(--text-primary)]">{health.droppedFrames}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-[var(--text-secondary)] flex items-center gap-1"><HardDrive className="w-3 h-3" /> CPU Usage</span>
            <span className="text-sm font-mono text-[var(--text-primary)]">{health.cpuUsage}%</span>
          </div>
        </div>
      )}
    </div>
  );
};