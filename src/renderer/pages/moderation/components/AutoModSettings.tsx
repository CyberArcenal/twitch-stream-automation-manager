import React, { useState, useEffect } from "react";
import { Shield, ShieldAlert, ShieldCheck, ListFilter, Users } from "lucide-react";
import { settingsAPI } from "../../../api/core/settings";

interface AutoModSettingsProps {
  broadcasterId: string;
}

export const AutoModSettings: React.FC<AutoModSettingsProps> = () => {
  const [enabled, setEnabled] = useState(false);
  const [level, setLevel] = useState<"none" | "basic" | "aggressive">("basic");
  const [blockedWords, setBlockedWords] = useState<string[]>([]);
  const [trustedUsers, setTrustedUsers] = useState<string[]>([]);
  const [newWord, setNewWord] = useState("");
  const [newTrusted, setNewTrusted] = useState("");
  const [loading, setLoading] = useState(true);

  // Load settings
  useEffect(() => {
    const load = async () => {
      try {
        const res = await settingsAPI.getAutoModeration();
        if (res.status && res.data) {
          setEnabled(res.data.enabled);
          setLevel(res.data.level || "basic");
          setBlockedWords(res.data.rules?.blockedWords || []);
          setTrustedUsers(res.data.rules?.trustedUsers || []);
        } else {
          setEnabled(false);
          setLevel("basic");
        }
      } catch (err) {
        console.error("Failed to load auto-mod settings", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const saveSettings = async (newConfig: any) => {
    try {
      await settingsAPI.updateAutoModeration(newConfig);
    } catch (err) {
      console.error("Failed to save auto-mod settings", err);
    }
  };

  const toggleEnabled = async () => {
    const newEnabled = !enabled;
    setEnabled(newEnabled);
    await saveSettings({ enabled: newEnabled, level, rules: { blockedWords, trustedUsers } });
  };

  const changeLevel = async (newLevel: "none" | "basic" | "aggressive") => {
    setLevel(newLevel);
    await saveSettings({ enabled, level: newLevel, rules: { blockedWords, trustedUsers } });
  };

  const addBlockedWord = async () => {
    if (!newWord.trim()) return;
    const updated = [...blockedWords, newWord.trim().toLowerCase()];
    setBlockedWords(updated);
    setNewWord("");
    await saveSettings({ enabled, level, rules: { blockedWords: updated, trustedUsers } });
  };

  const removeBlockedWord = async (word: string) => {
    const updated = blockedWords.filter((w) => w !== word);
    setBlockedWords(updated);
    await saveSettings({ enabled, level, rules: { blockedWords: updated, trustedUsers } });
  };

  const addTrustedUser = async () => {
    if (!newTrusted.trim()) return;
    const updated = [...trustedUsers, newTrusted.trim().toLowerCase()];
    setTrustedUsers(updated);
    setNewTrusted("");
    await saveSettings({ enabled, level, rules: { blockedWords, trustedUsers: updated } });
  };

  const removeTrustedUser = async (user: string) => {
    const updated = trustedUsers.filter((u) => u !== user);
    setTrustedUsers(updated);
    await saveSettings({ enabled, level, rules: { blockedWords, trustedUsers: updated } });
  };

  if (loading) return <div className="bg-[var(--card-bg)] rounded-xl p-5 animate-pulse h-80"></div>;

  return (
    <div className="bg-[var(--card-bg)] rounded-xl shadow-md border border-[var(--border-color)] p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-[#9147ff]" />
          <h3 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider">
            Auto‑Moderation
          </h3>
        </div>
        <button
          onClick={toggleEnabled}
          className={`relative w-10 h-5 rounded-full transition-colors ${
            enabled ? "bg-[var(--primary-color)]" : "bg-[var(--input-border)]"
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
              enabled ? "translate-x-5" : ""
            }`}
          />
        </button>
      </div>

      <div className="space-y-4">
        {/* Level selector */}
        <div>
          <label className="text-xs text-[var(--text-secondary)] block mb-2">Strictness Level</label>
          <div className="flex gap-2">
            {(["none", "basic", "aggressive"] as const).map((lvl) => (
              <button
                key={lvl}
                onClick={() => changeLevel(lvl)}
                disabled={!enabled}
                className={`flex-1 py-1.5 rounded-md text-sm font-medium transition ${
                  level === lvl
                    ? "bg-[var(--primary-color)] text-white"
                    : "bg-[var(--btn-secondary-bg)] text-[var(--text-secondary)] hover:bg-[var(--btn-secondary-hover)]"
                } ${!enabled ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {lvl === "none" ? "Off" : lvl === "basic" ? "Basic" : "Aggressive"}
              </button>
            ))}
          </div>
        </div>

        {/* Blocked words */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <ListFilter className="w-4 h-4 text-[var(--text-secondary)]" />
            <span className="text-xs font-medium text-[var(--text-primary)]">Blocked Words</span>
          </div>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={newWord}
              onChange={(e) => setNewWord(e.target.value)}
              placeholder="e.g., spamword"
              className="flex-1 bg-[var(--input-bg)] border border-[var(--input-border)] rounded px-2 py-1 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[#9147ff]"
            />
            <button
              onClick={addBlockedWord}
              disabled={!enabled}
              className="px-3 py-1 bg-[var(--primary-color)] rounded-md text-sm disabled:opacity-50 hover:bg-[#772ce8] transition"
            >
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
            {blockedWords.map((word) => (
              <span
                key={word}
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-[var(--btn-secondary-bg)] rounded-full text-xs text-[var(--text-primary)]"
              >
                {word}
                <button
                  onClick={() => removeBlockedWord(word)}
                  className="hover:text-red-400"
                >
                  ×
                </button>
              </span>
            ))}
            {blockedWords.length === 0 && (
              <span className="text-xs text-[var(--text-secondary)] italic">No blocked words</span>
            )}
          </div>
        </div>

        {/* Trusted users (allow list) */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-[var(--text-secondary)]" />
            <span className="text-xs font-medium text-[var(--text-primary)]">Trusted Users (Allow List)</span>
          </div>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={newTrusted}
              onChange={(e) => setNewTrusted(e.target.value)}
              placeholder="username"
              className="flex-1 bg-[var(--input-bg)] border border-[var(--input-border)] rounded px-2 py-1 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[#9147ff]"
            />
            <button
              onClick={addTrustedUser}
              disabled={!enabled}
              className="px-3 py-1 bg-[var(--primary-color)] rounded-md text-sm disabled:opacity-50 hover:bg-[#772ce8] transition"
            >
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
            {trustedUsers.map((user) => (
              <span
                key={user}
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-[var(--btn-secondary-bg)] rounded-full text-xs text-[var(--text-primary)]"
              >
                {user}
                <button
                  onClick={() => removeTrustedUser(user)}
                  className="hover:text-red-400"
                >
                  ×
                </button>
              </span>
            ))}
            {trustedUsers.length === 0 && (
              <span className="text-xs text-[var(--text-secondary)] italic">No trusted users</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};