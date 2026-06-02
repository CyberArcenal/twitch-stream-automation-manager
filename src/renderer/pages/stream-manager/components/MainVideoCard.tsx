// src/renderer/pages/stream-manager/components/MainVideoCard.tsx
import React, { useRef, useEffect, useState } from "react";
import {
  Edit3,
  Scissors,
  Users,
  Target,
  UsersRound,
  RefreshCw,
  Plus,
  Trash2,
} from "lucide-react";
import { useUptime } from "../hooks/useUptime";
import { useStreamInfo } from "../hooks/useStreamInfo";
import { useClip } from "../hooks/useClip";
import { useRaid } from "../hooks/useRaid";
import { streamManagerAPI, type Goal } from "../../../api/core/streamManager";
import EditStreamModal from "./EditStreamModal";
import { GoalsModal } from "./GoalsModal";
import { dialogs } from "../../../utils/dialogs";

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
  const videoRef = useRef<HTMLIFrameElement>(null);
  const [isHovering, setIsHovering] = useState(false);
  const uptime = useUptime(isLive, streamData?.started_at);

  // ✅ Tamang destructuring - gumamit ng info at updateField
  const { showEditModal, setShowEditModal, info, updateField, saveStreamInfo } =
    useStreamInfo(streamData, onRefresh);

  const { createClip } = useClip();
  const { startRaid } = useRaid();

  // Goals state
  const [goals, setGoals] = useState<Goal[]>([]);
  const [showGoalsModal, setShowGoalsModal] = useState(false);
  const [newGoalTitle, setNewGoalTitle] = useState("");
  const [newGoalTarget, setNewGoalTarget] = useState(100);
  const [newGoalUnit, setNewGoalUnit] = useState<
    "followers" | "subscribers" | "bits" | "views"
  >("followers");

  const channelName = streamData?.user_login?.toLowerCase();
  const iframeSrc =
    isLive && channelName
      ? `https://player.twitch.tv/?channel=${channelName}&parent=localhost&autoplay=false&muted=true`
      : "";

  // Load goals when modal opens
  useEffect(() => {
    if (showGoalsModal) {
      loadGoals();
    }
  }, [showGoalsModal]);

  const loadGoals = async () => {
    const res = await streamManagerAPI.getGoals();
    if (res.status && res.data) {
      setGoals(res.data);
    }
  };

  const addGoal = async () => {
    if (!newGoalTitle.trim()) return;
    const res = await streamManagerAPI.addGoal({
      title: newGoalTitle,
      target: newGoalTarget,
      current: 0,
      unit: newGoalUnit,
    });
    if (res.status && res.data) {
      setGoals([...goals, res.data]);
      setNewGoalTitle("");
      setNewGoalTarget(100);
    } else {
      alert("Failed to add goal");
    }
  };

  const deleteGoal = async (goalId: string) => {
    if (await dialogs.confirm({title: "Delete this goal?"})) {
      await streamManagerAPI.deleteGoal(goalId);
      setGoals(goals.filter((g) => g.id !== goalId));
    }
  };

  const handleStreamTogether = async () => {
    if (!channelName) return;
    try {
      await window.backendAPI.openStreamTogether(channelName);
    } catch (err) {
      console.error("Failed to open Stream Together:", err);
      alert("Unable to open Stream Together. Please try again.");
    }
  };

  const handleManageGoals = () => {
    setShowGoalsModal(true);
  };

  // Reload iframe when coming from offline to live
  useEffect(() => {
    if (isLive && channelName && videoRef.current && !videoRef.current.src) {
      videoRef.current.src = iframeSrc;
    }
  }, [isLive, channelName, iframeSrc]);

  // Detect if iframe got redirected to login and reload
  useEffect(() => {
    if (!isLive || !videoRef.current) return;
    const iframe = videoRef.current;
    const handleLoad = () => {
      try {
        const iframeUrl = iframe.contentWindow?.location.href;
        if (
          iframeUrl &&
          (iframeUrl.includes("id.twitch.tv") || iframeUrl.includes("login"))
        ) {
          console.log("Detected login redirect, reloading iframe...");
          setTimeout(() => {
            if (iframe.src) iframe.src = iframeSrc;
          }, 1000);
        }
      } catch (e) {
        // Cross-origin means it's a valid Twitch page – good
      }
    };
    iframe.addEventListener("load", handleLoad);
    return () => iframe.removeEventListener("load", handleLoad);
  }, [isLive, iframeSrc]);

  const handleRefreshPreview = () => {
    if (videoRef.current && iframeSrc) {
      videoRef.current.src = "";
      setTimeout(() => {
        if (videoRef.current) videoRef.current.src = iframeSrc;
      }, 100);
    }
  };

  const handleStatusRefresh = () => {
    onRefresh();
  };

  const handleCreateClip = () => createClip(streamData?.user_id);
  const handleRaid = () => startRaid(streamData?.user_id);

  return (
    <div className="bg-[var(--card-bg)] rounded-xl overflow-hidden shadow-lg border border-[var(--card-bg)] h-full flex flex-col min-w-[300px]">
      {/* Stats row with refresh button */}
      <div className="grid grid-cols-4 gap-2 p-2 border-b border-[var(--card-bg)] items-center">
        <div className="text-center">
          <div className="text-[var(--text-secondary)] text-xs">
            Session Time
          </div>
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
            -- kbps
          </div>
        </div>
        <div className="flex justify-end items-center gap-2">
          <div className="text-center">
            <div className="text-[var(--text-secondary)] text-xs">Speed</div>
            <div className="text-[var(--text-primary)] font-semibold">--</div>
          </div>
          <button
            onClick={handleStatusRefresh}
            className="p-1 rounded-full hover:bg-[#2a2a2e] transition"
            title="Check live status now"
          >
            <RefreshCw className="w-4 h-4 text-[var(--text-secondary)]" />
          </button>
        </div>
      </div>

      {/* Video preview area with overlay refresh button */}
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
            <iframe
              ref={videoRef}
              src={iframeSrc}
              className="w-full h-full"
              allowFullScreen
              title="Stream Preview"
            />
            <button
              onClick={handleRefreshPreview}
              className={`absolute top-2 right-2 p-2 rounded-full bg-black/60 hover:bg-black/80 transition-all duration-200 backdrop-blur-sm ${
                isHovering ? "opacity-100" : "opacity-0"
              }`}
              title="Reload video preview"
            >
              <RefreshCw className="w-4 h-4 text-[var(--text-primary)]" />
            </button>
          </>
        )}
      </div>

      {/* Action buttons row - 3 columns, 2 rows */}
      <div className="p-3 border-t border-[var(--card-bg)]">
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => setShowEditModal(true)}
            className="flex items-center justify-center gap-2 bg-[#9147ff] px-2 py-1.5 rounded-lg text-sm hover:bg-[#772ce8] transition"
          >
            <Edit3 className="w-4 h-4" /> Edit Stream Info
          </button>
          <button
            onClick={handleCreateClip}
            className="flex items-center justify-center gap-2 bg-[#2a2a2e] px-2 py-1.5 rounded-lg text-sm hover:bg-[#3a3a4a] transition"
          >
            <Scissors className="w-4 h-4" /> Clip That
          </button>
          <button
            onClick={handleRaid}
            className="flex items-center justify-center gap-2 bg-[#2a2a2e] px-2 py-1.5 rounded-lg text-sm hover:bg-[#3a3a4a] transition"
          >
            <Users className="w-4 h-4" /> Raid Channel
          </button>
          <button
            onClick={handleStreamTogether}
            className="flex items-center justify-center gap-2 bg-[#2a2a2e] px-2 py-1.5 rounded-lg text-sm hover:bg-[#3a3a4a] transition"
          >
            <UsersRound className="w-4 h-4" /> Stream Together
          </button>
          <button
            onClick={handleManageGoals}
            data-goals-manage="true"
            className="flex items-center justify-center gap-2 bg-[var(--btn-secondary-bg)] px-2 py-1.5 rounded-lg text-sm hover:bg-[var(--btn-secondary-hover)] transition"
          >
            <Target className="w-4 h-4" /> Manage Goals
          </button>
          {/* Empty placeholder para mapanatili ang grid (optional) */}
          <div></div>
        </div>
      </div>

      {/* ✅ Tamang pag-render ng EditStreamModal - gamit ang info at updateField */}
      <EditStreamModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        info={info}
        updateField={updateField}
        onSave={saveStreamInfo}
        channelName={channelName || ""}
      />

      {/* Goals Modal */}
      <GoalsModal isOpen={showGoalsModal} onClose={() => setShowGoalsModal(false)} />
    </div>
  );
};

export default MainVideoCard;
