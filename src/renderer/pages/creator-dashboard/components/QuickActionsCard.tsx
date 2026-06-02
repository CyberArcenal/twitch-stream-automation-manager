import React, { useState, useEffect } from "react";
import { Play, Square, Megaphone, Scissors, Share2, Shield } from "lucide-react";
import { streamManagerAPI } from "../../../api/core/streamManager";

interface QuickActionsCardProps {
  broadcasterId: string;
}

export const QuickActionsCard: React.FC<QuickActionsCardProps> = ({ broadcasterId }) => {
  const [obsConnected, setObsConnected] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [shoutoutTarget, setShoutoutTarget] = useState("");
  const [raidTarget, setRaidTarget] = useState("");
  const [loading, setLoading] = useState(false);

  // Check OBS status periodically
  useEffect(() => {
    const checkOBS = async () => {
      try {
        const status = await streamManagerAPI.getOBSStatus();
        setObsConnected(status.status && status.data);
        if (status.data) {
          const streamStatus = await streamManagerAPI.getStreamStatus();
          setStreaming(streamStatus.data?.outputActive || false);
        }
      } catch (err) {
        setObsConnected(false);
      }
    };
    checkOBS();
    const interval = setInterval(checkOBS, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleObsStart = async () => {
    setLoading(true);
    try {
      await streamManagerAPI.obsConnect();
      setObsConnected(true);
    } catch (err) {
      console.error("OBS start failed", err);
    } finally {
      setLoading(false);
    }
  };

  const handleObsStop = async () => {
    setLoading(true);
    try {
      await streamManagerAPI.obsDisconnect();
      setObsConnected(false);
      setStreaming(false);
    } catch (err) {
      console.error("OBS stop failed", err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartStream = async () => {
    try {
      await streamManagerAPI.obsStartStream();
      setStreaming(true);
    } catch (err) {
      console.error("Start stream failed", err);
    }
  };

  const handleStopStream = async () => {
    try {
      await streamManagerAPI.obsStopStream();
      setStreaming(false);
    } catch (err) {
      console.error("Stop stream failed", err);
    }
  };

  const handleCommercial = async (length: number) => {
    try {
      await streamManagerAPI.runCommercial(length);
    } catch (err) {
      console.error("Commercial failed", err);
    }
  };

  const handleCreateClip = async () => {
    try {
      const res = await streamManagerAPI.createClip(broadcasterId);
      if (res.status && res.data) {
        window.open(res.data.edit_url, "_blank");
      }
    } catch (err) {
      console.error("Clip creation failed", err);
    }
  };

  const handleShoutout = async () => {
    if (!shoutoutTarget.trim()) return;
    try {
      await streamManagerAPI.sendShoutout(shoutoutTarget);
      setShoutoutTarget("");
    } catch (err) {
      console.error("Shoutout failed", err);
    }
  };

  const handleRaid = async () => {
    if (!raidTarget.trim()) return;
    try {
      await streamManagerAPI.startRaid(broadcasterId, raidTarget);
      setRaidTarget("");
    } catch (err) {
      console.error("Raid failed", err);
    }
  };

  return (
    <div className="bg-[var(--card-bg)] rounded-xl shadow-md border border-[var(--card-bg)] p-5">
      <div className="flex items-center gap-2 mb-4">
        <Shield className="w-5 h-5 text-[#9147ff]" />
        <h3 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider">
          Quick Actions
        </h3>
      </div>
      <div className="space-y-4">
        {/* OBS Connection */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-[var(--text-primary)]">OBS WebSocket</span>
          <div className="flex gap-2">
            {!obsConnected ? (
              <button onClick={handleObsStart} className="px-3 py-1 bg-[var(--primary-color)] rounded-md text-sm hover:bg-[var(--primary-color)]/80 transition">
                Connect
              </button>
            ) : (
              <button onClick={handleObsStop} className="px-3 py-1 bg-[var(--primary-color)]/80 rounded-md text-sm hover:bg-[var(--primary-color)]/100 transition">
                Disconnect
              </button>
            )}
          </div>
        </div>

        {/* Start / Stop Stream */}
        {obsConnected && (
          <div className="flex gap-2">
            {!streaming ? (
              <button
                onClick={handleStartStream}
                className="flex-1 flex items-center justify-center gap-1 bg-green-600 py-2 rounded-md text-sm hover:bg-green-600/80 transition"
              >
                <Play className="w-4 h-4" /> Start Stream
              </button>
            ) : (
              <button
                onClick={handleStopStream}
                className="flex-1 flex items-center justify-center gap-1 bg-red-600 py-2 rounded-md text-sm hover:bg-red-600/80 transition"
              >
                <Square className="w-4 h-4" /> Stop Stream
              </button>
            )}
          </div>
        )}

        {/* Run Commercial */}
        <div>
          <div className="text-xs text-[var(--text-secondary)] mb-1">Run Commercial</div>
          <div className="flex gap-2">
            <button onClick={() => handleCommercial(30)} className="flex-1 py-1 bg-[var(--primary-color)]/80 rounded-md text-sm hover:bg-[var(--primary-color)]/100 transition">
              30s
            </button>
            <button onClick={() => handleCommercial(60)} className="flex-1 py-1 bg-[var(--primary-color)]/80 rounded-md text-sm hover:bg-[var(--primary-color)]/100 transition">
              60s
            </button>
          </div>
        </div>

        {/* Create Clip */}
        <button
          onClick={handleCreateClip}
          className="w-full flex items-center justify-center gap-1 py-2 bg-[var(--primary-color)] rounded-md text-sm hover:bg-[var(--primary-color)]/80 transition"
        >
          <Scissors className="w-4 h-4" /> Create Clip
        </button>

        {/* Shoutout */}
        <div>
          <div className="flex gap-2">
            <input
              type="text"
              value={shoutoutTarget}
              onChange={(e) => setShoutoutTarget(e.target.value)}
              placeholder="Channel name"
              className="flex-1 bg-[var(--background-color)] border border-[var(--card-bg)] rounded px-2 py-1 text-sm"
            />
            <button onClick={handleShoutout} className="px-3 py-1 bg-[var(--primary-color)]/80 rounded-md text-sm hover:bg-[var(--primary-color)]/100 transition">
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Raid */}
        <div>
          <div className="flex gap-2">
            <input
              type="text"
              value={raidTarget}
              onChange={(e) => setRaidTarget(e.target.value)}
              placeholder="Raid target"
              className="flex-1 bg-[var(--background-color)] border border-[var(--card-bg)] rounded px-2 py-1 text-sm"
            />
            <button onClick={handleRaid} className="px-3 py-1 bg-[var(--primary-color)] rounded-md text-sm hover:bg-[var(--primary-color)]/80 transition">
              Raid
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};