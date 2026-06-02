import React, { useState, useEffect } from "react";
import { Monitor, Wifi, WifiOff } from "lucide-react";
import { streamManagerAPI } from "../../../api/core/streamManager";

export const OBSWebSocketTab: React.FC = () => {
  const [host, setHost] = useState("localhost");
  const [port, setPort] = useState(4455);
  const [password, setPassword] = useState("");
  const [autoConnect, setAutoConnect] = useState(false);
  const [connected, setConnected] = useState(false);
  const [testing, setTesting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await streamManagerAPI.obsGetSettings();
        if (res.status && res.data) {
          setHost(res.data.host);
          setPort(res.data.port);
          setPassword(res.data.password);
          setAutoConnect(res.data.autoConnect);
        }
        const status = await streamManagerAPI.getOBSStatus();
        setConnected(status.status && status.data);
      } catch (err) {
        console.error("Failed to load OBS settings", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const saveSettings = async () => {
    await streamManagerAPI.obsUpdateSettings({ host, port, password, autoConnect });
    if (autoConnect && !connected) {
      await streamManagerAPI.obsConnect(host, port, password);
      setConnected(true);
    }
  };

  const testConnection = async () => {
    setTesting(true);
    try {
      const success = await streamManagerAPI.obsTestConnection(host, port, password);
      if (success.status) alert("Connection successful!");
      else alert("Connection failed");
    } catch (err) {
      alert(`Connection failed: ${err}`);
    } finally {
      setTesting(false);
    }
  };

  const handleConnect = async () => {
    try {
      await streamManagerAPI.obsConnect(host, port, password);
      setConnected(true);
    } catch (err) {
      alert("Connection failed");
    }
  };

  const handleDisconnect = async () => {
    await streamManagerAPI.obsDisconnect();
    setConnected(false);
  };

  if (loading) return <div className="animate-pulse h-64 bg-[var(--card-bg)] rounded-xl"></div>;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-[var(--text-primary)]">OBS WebSocket</h2>
      <div className="bg-[var(--card-bg)] rounded-xl p-6 space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-[var(--text-primary)]">Status</span>
          <span className={`flex items-center gap-1 text-sm ${connected ? "text-green-400" : "text-red-400"}`}>
            {connected ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
            {connected ? "Connected" : "Disconnected"}
          </span>
        </div>

        <div>
          <label className="block text-sm text-[var(--text-secondary)] mb-1">Host</label>
          <input
            type="text"
            value={host}
            onChange={(e) => setHost(e.target.value)}
            className="w-full bg-[var(--background-color)] border border-[var(--card-bg)] rounded px-3 py-2 text-[var(--text-primary)]"
          />
        </div>

        <div>
          <label className="block text-sm text-[var(--text-secondary)] mb-1">Port</label>
          <input
            type="number"
            value={port}
            onChange={(e) => setPort(parseInt(e.target.value) || 4455)}
            className="w-full bg-[var(--background-color)] border border-[var(--card-bg)] rounded px-3 py-2 text-[var(--text-primary)]"
          />
        </div>

        <div>
          <label className="block text-sm text-[var(--text-secondary)] mb-1">Password (if any)</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-[var(--background-color)] border border-[var(--card-bg)] rounded px-3 py-2 text-[var(--text-primary)]"
          />
        </div>

        <div className="flex justify-between items-center">
          <span className="text-[var(--text-primary)]">Auto-connect on startup</span>
          <button
            onClick={() => setAutoConnect(!autoConnect)}
            className={`relative w-10 h-5 rounded-full transition-colors ${autoConnect ? "bg-[#9147ff]" : "bg-[#2a2a2e]"}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${autoConnect ? "translate-x-5" : ""}`} />
          </button>
        </div>

        <div className="flex gap-2 pt-2">
          <button onClick={saveSettings} className="px-4 py-2 bg-[#9147ff] rounded-md text-sm">Save Settings</button>
          <button onClick={testConnection} disabled={testing} className="px-4 py-2 bg-[#2a2a2e] rounded-md text-sm">
            {testing ? "Testing..." : "Test Connection"}
          </button>
          {!connected ? (
            <button onClick={handleConnect} className="px-4 py-2 bg-green-600 rounded-md text-sm">Connect</button>
          ) : (
            <button onClick={handleDisconnect} className="px-4 py-2 bg-red-600 rounded-md text-sm">Disconnect</button>
          )}
        </div>
      </div>
    </div>
  );
};