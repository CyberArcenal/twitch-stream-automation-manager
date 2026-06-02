// src/renderer/pages/stream-manager/components/MainVideoCard.tsx
import React, { useRef, useEffect, useState, useCallback } from "react";
import {
  Edit3,
  Scissors,
  Users,
  Target,
  UsersRound,
  RefreshCw,
  Volume2,
  VolumeX,
  Bookmark,
} from "lucide-react";
import { useUptime } from "../hooks/useUptime";
import { useStreamInfo } from "../hooks/useStreamInfo";
import { useClip } from "../hooks/useClip";
import { useRaid } from "../hooks/useRaid";
import { useStreamHealth } from "../hooks/useStreamHealth";
import { streamManagerAPI, type Goal } from "../../../api/core/streamManager";
import EditStreamModal from "./EditStreamModal";
import { GoalsModal } from "./GoalsModal";
import { dialogs } from "../../../utils/dialogs";
import Player, { type PlayerRef } from "./Player";
import { useStreamMarker } from "../hooks/useStreamMarker";

interface MainVideoCardProps {
  isLive: boolean;
  streamData: any;
  onRefresh: () => void;
}

const MainVideoCard: React.FC<MainVideoCardProps> = ({
  isLive,
  streamData,
  onRefresh,
}) => {
  const playerRef = useRef<PlayerRef>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [muted, setMuted] = useState(true); // start muted to avoid autoplay issues
  const [volume, setVolumeState] = useState(0.5);
  const uptime = useUptime(isLive, streamData?.started_at);
  const { bitrate, connected: obsConnected } = useStreamHealth(isLive);
  const { createMarker } = useStreamMarker();

  const { showEditModal, setShowEditModal, info, updateField, saveStreamInfo } =
    useStreamInfo(streamData, onRefresh);
  const { createClip } = useClip();
  const { startRaid } = useRaid();

  const channelName = streamData?.user_login?.toLowerCase();

  // Reload player when channel changes or becomes live
  useEffect(() => {
    if (isLive && channelName) {
      playerRef.current?.reload();
    }
  }, [isLive, channelName]);

  const handleRefreshPreview = () => {
    playerRef.current?.reload();
  };

  const handleToggleMute = () => {
    const newMuted = !muted;
    setMuted(newMuted);
    playerRef.current?.setMuted(newMuted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolumeState(val);
    playerRef.current?.setVolume(val);
    if (val > 0 && muted) {
      setMuted(false);
      playerRef.current?.setMuted(false);
    }
  };

  const handleCreateClip = () => createClip(streamData?.user_id);
  const handleRaid = () => startRaid(streamData?.user_id);
  const handleStatusRefresh = () => onRefresh();

  const handleStreamTogether = async () => {
    if (!channelName) return;
    try {
      await window.backendAPI.openStreamTogether(channelName);
    } catch (err) {
      console.error("Failed to open Stream Together:", err);
      dialogs.error("Unable to open Stream Together. Please try again.");
    }
  };

  const handleManageGoals = () => {
    // We need to open the GoalsModal – but it's rendered inside MainVideoCard already.
    // We'll use a state to control it.
    // Actually GoalsModal is already rendered at the bottom, we need to show it.
    // We'll add a state for it.
  };

  // We'll add a local state for goals modal (already exists in original code but we removed it).
  // Let's add it back.
  const [showGoalsModal, setShowGoalsModal] = useState(false);

  return (
    <div className="bg-[var(--card-bg)] rounded-xl overflow-hidden shadow-lg border border-[var(--border-color)] h-full flex flex-col min-w-[300px]">
      {/* Stats row with refresh button */}
      <div className="grid grid-cols-4 gap-2 p-2 border-b border-[var(--border-color)] items-center">
        <div className="text-center">
          <div className="text-[var(--text-secondary)] text-xs">Session Time</div>
          <div className="text-[var(--text-primary)] font-semibold text-sm">
            {isLive ? uptime : "00:00:00"}
          </div>
        </div>
        <div className="text-center">
          <div className="text-[var(--text-secondary)] text-xs">Viewers</div>
          <div className="text-[var(--text-primary)] font-semibold">
            {streamData?.viewer_count?.toLocaleString() || 0}
          </div>
        </div>
        <div className="text-center">
          <div className="text-[var(--text-secondary)] text-xs">Bitrate</div>
          <div className="text-[var(--text-primary)] font-semibold">
            {obsConnected && bitrate > 0 ? `${Math.round(bitrate)} kbps` : "--"}
          </div>
        </div>
        <div className="flex justify-end items-center gap-2">
          <div className="text-center">
            <div className="text-[var(--text-secondary)] text-xs">Speed</div>
            <div className="text-[var(--text-primary)] font-semibold">
              {obsConnected ? "Auto" : "--"}
            </div>
          </div>
          <button
            onClick={handleStatusRefresh}
            className="p-1 rounded-full hover:bg-[var(--btn-secondary-bg)] transition"
            title="Check live status now"
          >
            <RefreshCw className="w-4 h-4 text-[var(--text-secondary)]" />
          </button>
        </div>
      </div>

      {/* Video preview area with volume controls */}
      <div
        className="relative bg-black flex-1 min-h-[250px] group"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        {!isLive ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-4xl font-bold text-[var(--text-secondary)] mb-2">
              OFFLINE
            </div>
            <p className="text-sm text-[var(--text-secondary)]">
              Stream is not currently live
            </p>
          </div>
        ) : (
          <>
            <Player
              ref={playerRef}
              channelName={channelName!}
              autoplay={true}
            />
            {/* Volume control overlay */}
            <div className="absolute bottom-2 right-2 flex items-center gap-2 bg-black/60 rounded-full px-2 py-1 backdrop-blur-sm">
              <button onClick={handleToggleMute} className="text-white p-1 hover:text-[#9147ff]">
                {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={handleVolumeChange}
                className="w-20 h-1 bg-white/30 rounded-full accent-[#9147ff]"
              />
            </div>
            {/* Refresh button overlay */}
            <button
              onClick={handleRefreshPreview}
              className={`absolute top-2 right-2 p-2 rounded-full bg-black/60 hover:bg-black/80 transition-all duration-200 backdrop-blur-sm ${
                isHovering ? "opacity-100" : "opacity-0"
              }`}
              title="Reload video"
            >
              <RefreshCw className="w-4 h-4 text-white" />
            </button>
          </>
        )}
      </div>

      {/* Action buttons row */}
      <div className="p-3 border-t border-[var(--border-color)]">
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => setShowEditModal(true)}
            className="flex items-center justify-center gap-2 bg-[#9147ff] px-2 py-1.5 rounded-lg text-sm hover:bg-[#772ce8] transition"
          >
            <Edit3 className="w-4 h-4" /> Edit Stream Info
          </button>
          <button
            onClick={handleCreateClip}
            className="flex items-center justify-center gap-2 bg-[var(--btn-secondary-bg)] px-2 py-1.5 rounded-lg text-sm hover:bg-[var(--btn-secondary-hover)] transition"
          >
            <Scissors className="w-4 h-4" /> Clip That
          </button>
          <button
  onClick={() => createMarker()}
  className="flex items-center justify-center gap-2 bg-[var(--btn-secondary-bg)] px-2 py-1.5 rounded-lg text-sm hover:bg-[var(--btn-secondary-hover)] transition"
>
  <Bookmark className="w-4 h-4" /> Add Marker
</button>
          <button
            onClick={handleRaid}
            className="flex items-center justify-center gap-2 bg-[var(--btn-secondary-bg)] px-2 py-1.5 rounded-lg text-sm hover:bg-[var(--btn-secondary-hover)] transition"
          >
            <Users className="w-4 h-4" /> Raid Channel
          </button>
          <button
            onClick={handleStreamTogether}
            className="flex items-center justify-center gap-2 bg-[var(--btn-secondary-bg)] px-2 py-1.5 rounded-lg text-sm hover:bg-[var(--btn-secondary-hover)] transition"
          >
            <UsersRound className="w-4 h-4" /> Stream Together
          </button>
          <button
            onClick={() => setShowGoalsModal(true)}
            data-goals-manage="true"
            className="flex items-center justify-center gap-2 bg-[var(--btn-secondary-bg)] px-2 py-1.5 rounded-lg text-sm hover:bg-[var(--btn-secondary-hover)] transition"
          >
            <Target className="w-4 h-4" /> Manage Goals
          </button>
          <div></div>
        </div>
      </div>

      <EditStreamModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        info={info}
        updateField={updateField}
        onSave={saveStreamInfo}
        channelName={channelName || ""}
      />

      <GoalsModal isOpen={showGoalsModal} onClose={() => setShowGoalsModal(false)} />
    </div>
  );
};

export default MainVideoCard;