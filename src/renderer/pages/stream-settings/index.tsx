// src/renderer/pages/stream-settings/index.tsx
import React, { useState, useEffect } from "react";
import { Key, Server, Zap, Video, DollarSign, Mic, BookmarkPlus, Copy, Check } from "lucide-react";
import { streamManagerAPI } from "../../api/core/streamManager";
import { streamSettingsAPI, type IngestServer } from "../../api/core/streamSettings";
import { useAuth } from "../../hooks/useAuth";
import LoadingSpinner from "../../components/Shared/LoadingSpinner";
import { dialogs } from "../../utils/dialogs";

const StreamSettingsPage: React.FC = () => {
  const { user } = useAuth();
  const [streamKey, setStreamKey] = useState("");
  const [ingestServers, setIngestServers] = useState<IngestServer[]>([]);
  const [selectedIngest, setSelectedIngest] = useState("");
  const [markerDescription, setMarkerDescription] = useState("");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load stream key and ingest servers
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const keyRes = await streamManagerAPI.getStreamKey();
        if (keyRes.status && keyRes.data) setStreamKey(keyRes.data.stream_key);

        const ingestRes = await streamSettingsAPI.getIngestServers();
        if (ingestRes.status && ingestRes.data) {
          setIngestServers(ingestRes.data);
          const defaultIngest = ingestRes.data.find(s => s.default);
          if (defaultIngest) setSelectedIngest(defaultIngest.id);
        }
      } catch (err) {
        console.error("Failed to load stream settings", err);
      } finally {
        setLoading(false);
      }
    };
    loadSettings();
  }, []);

  const copyStreamKey = () => {
    navigator.clipboard.writeText(streamKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const openTwitchDashboard = (section: string) => {
    const login = user?.login;
    if (!login) return;
    const urls: Record<string, string> = {
      latency: `https://dashboard.twitch.tv/u/${login}/stream-manager/settings`,
      vod: `https://dashboard.twitch.tv/u/${login}/settings/channel#vods`,
      ads: `https://dashboard.twitch.tv/u/${login}/stream-manager/ads`,
      muted: `https://dashboard.twitch.tv/u/${login}/settings/channel#muted`,
    };
    window.open(urls[section], "_blank");
  };

  const createMarker = async () => {
    if (!markerDescription.trim()) return;
    try {
      await streamManagerAPI.createStreamMarker(markerDescription);
      setMarkerDescription("");
      dialogs.success("Marker created successfully!");
    } catch (err) {
      console.error("Failed to create marker", err);
      dialogs.error("Failed to create marker. Make sure you are live.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingSpinner/>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-[var(--background-color)] min-h-screen">
      <h1 className="text-2xl font-bold text-[var(--text-primary)]">Stream Settings</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column: Stream Key & Ingest */}
        <div className="space-y-6">
          {/* Stream Key */}
          <div className="bg-[var(--card-bg)] rounded-xl shadow-md border border-[var(--card-bg)] p-5">
            <div className="flex items-center gap-2 mb-4">
              <Key className="w-5 h-5 text-[#9147ff]" />
              <h3 className="text-sm font-semibold text-[var(--text-primary)] uppercase">Stream Key</h3>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="password"
                value={streamKey}
                readOnly
                className="flex-1 bg-[var(--background-color)] border border-[var(--card-bg)] rounded px-3 py-2 text-[var(--text-primary)] font-mono text-sm"
              />
              <button
                onClick={copyStreamKey}
                className="p-2 bg-[var(--card-bg)] rounded-md hover:bg-[var(--primary-color)] transition"
                title="Copy stream key"
              >
                {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-[var(--text-primary)]" />}
              </button>
            </div>
            <p className="text-xs text-[var(--text-secondary)] mt-2">
              Keep your stream key secret. Never share it.
            </p>
          </div>

          {/* Ingest Server */}
          <div className="bg-[var(--card-bg)] rounded-xl shadow-md border border-[var(--card-bg)] p-5">
            <div className="flex items-center gap-2 mb-4">
              <Server className="w-5 h-5 text-[#9147ff]" />
              <h3 className="text-sm font-semibold text-[var(--text-primary)] uppercase">Ingest Server</h3>
            </div>
            <select
              value={selectedIngest}
              onChange={(e) => setSelectedIngest(e.target.value)}
              className="w-full bg-[var(--background-color)] border border-[var(--card-bg)] rounded px-3 py-2 text-[var(--text-primary)]"
            >
              {ingestServers.map((server) => (
                <option key={server.id} value={server.id}>
                  {server.name} {server.default ? "(Recommended)" : ""}
                </option>
              ))}
            </select>
            <p className="text-xs text-[var(--text-secondary)] mt-2">
              Select the closest ingest server for optimal performance.
            </p>
          </div>
        </div>

        {/* Right column: Dashboard links & Stream markers */}
        <div className="space-y-6">
          {/* Dashboard Settings */}
          <div className="bg-[var(--card-bg)] rounded-xl shadow-md border border-[var(--card-bg)] p-5">
            <h3 className="text-sm font-semibold text-[var(--text-primary)] uppercase mb-4">Twitch Dashboard Settings</h3>
            <div className="space-y-3">
              <button
                onClick={() => openTwitchDashboard("latency")}
                className="w-full flex items-center justify-between p-3 bg-[#2a2a2e]/50 rounded-lg hover:bg-[#2a2a2e] transition"
              >
                <span className="flex items-center gap-2"><Zap className="w-4 h-4 text-[#9147ff]" /> Latency Mode</span>
                <span className="text-xs text-[var(--text-secondary)]">Normal / Low latency</span>
              </button>
              <button
                onClick={() => openTwitchDashboard("vod")}
                className="w-full flex items-center justify-between p-3 bg-[#2a2a2e]/50 rounded-lg hover:bg-[#2a2a2e] transition"
              >
                <span className="flex items-center gap-2"><Video className="w-4 h-4 text-[#9147ff]" /> VOD Settings</span>
                <span className="text-xs text-[var(--text-secondary)]">Auto‑publish / Disable</span>
              </button>
              <button
                onClick={() => openTwitchDashboard("ads")}
                className="w-full flex items-center justify-between p-3 bg-[#2a2a2e]/50 rounded-lg hover:bg-[#2a2a2e] transition"
              >
                <span className="flex items-center gap-2"><DollarSign className="w-4 h-4 text-[#9147ff]" /> ADS Settings</span>
                <span className="text-xs text-[var(--text-secondary)]">Pre‑roll / Mid‑roll</span>
              </button>
              <button
                onClick={() => openTwitchDashboard("muted")}
                className="w-full flex items-center justify-between p-3 bg-[#2a2a2e]/50 rounded-lg hover:bg-[#2a2a2e] transition"
              >
                <span className="flex items-center gap-2"><Mic className="w-4 h-4 text-[#9147ff]" /> Muted Sections</span>
                <span className="text-xs text-[var(--text-secondary)]">Twitch Soundtrack toggle</span>
              </button>
            </div>
          </div>

          {/* Stream Markers */}
          <div className="bg-[var(--card-bg)] rounded-xl shadow-md border border-[var(--card-bg)] p-5">
            <div className="flex items-center gap-2 mb-4">
              <BookmarkPlus className="w-5 h-5 text-[#9147ff]" />
              <h3 className="text-sm font-semibold text-[var(--text-primary)] uppercase">Stream Markers</h3>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={markerDescription}
                onChange={(e) => setMarkerDescription(e.target.value)}
                placeholder="Marker description (e.g., 'Epic moment')"
                className="flex-1 bg-[var(--background-color)] border border-[var(--card-bg)] rounded px-3 py-2 text-[var(--text-primary)]"
              />
              <button
                onClick={createMarker}
                className="px-4 py-2 bg-[var(--primary-color)] rounded-md hover:bg-[#772ce8] transition"
              >
                Create
              </button>
            </div>
            <p className="text-xs text-[var(--text-secondary)] mt-2">
              Mark important moments in your VOD. Only available while live.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StreamSettingsPage;