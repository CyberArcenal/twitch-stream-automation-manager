import React, { useState, useEffect } from "react";
import { Copy, ExternalLink, RefreshCw, Play, Square, Server, Loader2 } from "lucide-react";
import { useStreamKey } from "../hooks/useStreamKey";
import { useOBSConnection } from "../hooks/useOBSConnection";
import { useStreamHealth } from "../hooks/useStreamHealth";
import { streamManagerAPI } from "../../../api/core/streamManager";
import { streamSettingsAPI, type IngestServer } from "../../../api/core/streamSettings";

interface ConnectionHubCardProps {
  isLive: boolean;
  onRefresh: () => Promise<void> | void;
}

const ConnectionHubCard: React.FC<ConnectionHubCardProps> = ({ isLive, onRefresh }) => {
  const { streamKey, setStreamKey, showKey, setShowKey, saveKey, copyKey, openDashboard } = useStreamKey();
  const { isConnected: obsConnected, softwareName } = useOBSConnection();
  const { bitrate } = useStreamHealth(isLive);
  const [ingestServers, setIngestServers] = useState<IngestServer[]>([]);
  const [selectedIngestId, setSelectedIngestId] = useState<string>("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch ingest servers
  useEffect(() => {
    const loadIngests = async () => {
      try {
        const res = await streamSettingsAPI.getIngestServers();
        if (res.status && res.data) {
          setIngestServers(res.data);
          const defaultIngest = res.data.find(s => s.default);
          if (defaultIngest) setSelectedIngestId(defaultIngest.id);
        }
      } catch (err) {
        console.error("Failed to load ingest servers", err);
      }
    };
    loadIngests();
  }, []);

  // Check if stream is active (bitrate > 0 indicates streaming)
  useEffect(() => {
    setIsStreaming(obsConnected && bitrate > 0);
  }, [obsConnected, bitrate]);

  const handleStartStream = async () => {
    try {
      await streamManagerAPI.obsStartStream();
    } catch (err) {
      console.error("Failed to start stream", err);
      alert("Failed to start stream. Make sure OBS is connected and not already streaming.");
    }
  };

  const handleStopStream = async () => {
    try {
      await streamManagerAPI.obsStopStream();
    } catch (err) {
      console.error("Failed to stop stream", err);
      alert("Failed to stop stream.");
    }
  };

  const handleIngestChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const ingestId = e.target.value;
    setSelectedIngestId(ingestId);
    // Open Twitch dashboard to change ingest server manually
    window.backendAPI.openDashboard("https://dashboard.twitch.tv/settings/stream");
    alert("Ingest server changed in Twitch dashboard. Please update your OBS settings accordingly.");
  };

  const handleCheckLiveStatus = async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      await onRefresh();
    } catch (err) {
      console.error("Refresh failed", err);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="bg-[var(--card-bg)] rounded-xl p-4 shadow-lg border border-[var(--border-color)] min-w-[300px]">
      <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-2">Connection Hub</h3>

      {/* OBS Status */}
      <div className="mb-3 flex justify-between items-center">
        <span className="text-xs text-[var(--text-secondary)]">OBS WebSocket</span>
        <span className={`text-xs ${obsConnected ? "text-green-400" : "text-red-400"}`}>
          {obsConnected ? "● Connected" : "● Disconnected"}
        </span>
      </div>

      {/* Stream Key */}
      <div className="mb-3">
        <label className="text-xs text-[var(--text-secondary)] block mb-1">Stream Key</label>
        <div className="flex gap-2">
          <input
            type={showKey ? "text" : "password"}
            value={streamKey}
            onChange={(e) => setStreamKey(e.target.value)}
            onBlur={saveKey}
            placeholder="Your stream key"
            className="flex-1 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg px-2 py-1 text-sm text-[var(--text-primary)]"
          />
          <button onClick={() => setShowKey(!showKey)} className="px-2 py-1 bg-[var(--btn-secondary-bg)] rounded text-xs hover:bg-[var(--btn-secondary-hover)]">
            {showKey ? "Hide" : "Show"}
          </button>
          <button onClick={copyKey} className="px-2 py-1 bg-[#9147ff] rounded">
            <Copy className="w-4 h-4" />
          </button>
          <button onClick={openDashboard} className="px-2 py-1 bg-[var(--btn-secondary-bg)] rounded hover:bg-[var(--btn-secondary-hover)]">
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Ingest Server Selection */}
      <div className="mb-3">
        <label className="text-xs text-[var(--text-secondary)] block mb-1 flex items-center gap-1">
          <Server className="w-3 h-3" /> Ingest Server
        </label>
        <select
          value={selectedIngestId}
          onChange={handleIngestChange}
          className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded px-2 py-1 text-sm text-[var(--text-primary)]"
        >
          <option value="">Select ingest server...</option>
          {ingestServers.map((server) => (
            <option key={server.id} value={server.id}>
              {server.name} {server.default ? "(Recommended)" : ""}
            </option>
          ))}
        </select>
        <p className="text-xs text-[var(--text-tertiary)] mt-1">
          Changing ingest server opens Twitch dashboard. Update OBS settings accordingly.
        </p>
      </div>

      {/* Check Live Status button with loading state */}
      <button
        onClick={handleCheckLiveStatus}
        disabled={refreshing}
        className="w-full flex items-center justify-center gap-1 bg-[#9147ff] py-1.5 rounded-lg text-sm text-white hover:bg-[#772ce8] transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {refreshing ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
        {refreshing ? "Checking..." : "Check Live Status"}
      </button>
    </div>
  );
};

export default ConnectionHubCard;