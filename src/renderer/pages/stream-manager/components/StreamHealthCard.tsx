import React from 'react';
import { useStreamHealth } from '../hooks/useStreamHealth';
import { Wifi } from 'lucide-react';

interface StreamHealthCardProps {
  isLive: boolean;
}

const StreamHealthCard: React.FC<StreamHealthCardProps> = ({ isLive }) => {
  const { bitrate, fps, droppedFrames, cpuUsage, connected, latency } = useStreamHealth(isLive);

  return (
    <div className="bg-[var(--card-bg)] rounded-xl p-4 shadow-lg border border-[var(--border-color)] min-w-[300px]">
      <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-2">Stream Health</h3>
      {!connected ? (
        <p className="text-xs text-[var(--text-secondary)] text-center py-2">
          OBS not connected. Enable WebSocket server in OBS (port 4455).
        </p>
      ) : (
        <div className="space-y-3">
          {/* Bitrate */}
          <div>
            <div className="flex justify-between text-xs text-[var(--text-secondary)] mb-1">
              <span>Bitrate</span>
              <span>{bitrate.toLocaleString()} kbps</span>
            </div>
            <div className="w-full bg-[var(--input-border)] rounded-full h-2">
              <div className="bg-[#9147ff] h-2 rounded-full transition-all" style={{ width: `${Math.min(100, (bitrate / 6000) * 100)}%` }} />
            </div>
          </div>

          {/* FPS */}
          <div>
            <div className="flex justify-between text-xs text-[var(--text-secondary)] mb-1">
              <span>FPS</span>
              <span>{fps}</span>
            </div>
            <div className="w-full bg-[var(--input-border)] rounded-full h-2">
              <div className="bg-[#9147ff] h-2 rounded-full transition-all" style={{ width: `${Math.min(100, (fps / 60) * 100)}%` }} />
            </div>
          </div>

          {/* Dropped Frames */}
          <div>
            <div className="flex justify-between text-xs text-[var(--text-secondary)] mb-1">
              <span>Dropped Frames</span>
              <span>{droppedFrames}%</span>
            </div>
            <div className="w-full bg-[var(--input-border)] rounded-full h-2">
              <div className={`h-2 rounded-full transition-all ${droppedFrames > 5 ? 'bg-red-500' : 'bg-[#9147ff]'}`} style={{ width: `${Math.min(100, droppedFrames)}%` }} />
            </div>
          </div>

          {/* CPU Usage */}
          <div>
            <div className="flex justify-between text-xs text-[var(--text-secondary)] mb-1">
              <span>CPU Usage</span>
              <span>{cpuUsage.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-[var(--input-border)] rounded-full h-2">
              <div className={`h-2 rounded-full transition-all ${cpuUsage > 80 ? 'bg-red-500' : 'bg-[#9147ff]'}`} style={{ width: `${Math.min(100, cpuUsage)}%` }} />
            </div>
          </div>

          {/* Latency (Ping) */}
          {latency !== null && (
            <div className="flex justify-between items-center text-xs">
              <span className="text-[var(--text-secondary)] flex items-center gap-1">
                <Wifi className="w-3 h-3" /> Network Latency
              </span>
              <span className="text-[var(--text-primary)]">{latency} ms</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StreamHealthCard;