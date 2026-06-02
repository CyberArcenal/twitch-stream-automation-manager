import React, { useState, useEffect } from "react";
import { Info, Upload, FolderOpen } from "lucide-react";

export const AboutTab: React.FC = () => {
  const [version, setVersion] = useState("");
  const [appName, setAppName] = useState("");

  useEffect(() => {
    const load = async () => {
      const info = await window.backendAPI.appInfo();
      setVersion(info.version);
      setAppName(info.name);
    };
    load();
  }, []);

  const checkForUpdates = () => {
    window.backendAPI.updater({ method: "checkForUpdates" });
  };

  const openLogFolder = () => {
    window.backendAPI.openLogFolder();
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-[var(--text-primary)]">About</h2>
      <div className="bg-[var(--card-bg)] rounded-xl p-6 space-y-4">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-[#9147ff] to-[#772ce8] rounded-2xl flex items-center justify-center mb-4">
            <Info className="w-10 h-10 text-[var(--text-primary)]" />
          </div>
          <h3 className="text-xl font-bold text-[var(--text-primary)]">{appName}</h3>
          <p className="text-[var(--text-secondary)]">Version {version}</p>
          <p className="text-xs text-[var(--text-secondary)] mt-2">© 2025 CyberArcenal</p>
        </div>

        <div className="space-y-2 pt-4">
          <button onClick={checkForUpdates} className="w-full flex items-center justify-between p-3 bg-[#2a2a2e]/50 rounded-lg hover:bg-[#2a2a2e] transition">
            <span className="text-[var(--text-primary)]">Check for Updates</span>
            <Upload className="w-4 h-4 text-[#9147ff]" />
          </button>
          <button onClick={openLogFolder} className="w-full flex items-center justify-between p-3 bg-[#2a2a2e]/50 rounded-lg hover:bg-[#2a2a2e] transition">
            <span className="text-[var(--text-primary)]">Open Log Folder</span>
            <FolderOpen className="w-4 h-4 text-[#9147ff]" />
          </button>
        </div>
      </div>
    </div>
  );
};