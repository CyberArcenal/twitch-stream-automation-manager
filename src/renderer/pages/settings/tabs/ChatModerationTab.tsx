import React, { useState, useEffect } from "react";
import { ListFilter, Shield, Clock } from "lucide-react";
import { settingsAPI } from "../../../api/core/settings";

export const ChatModerationTab: React.FC = () => {
  const [blockedWords, setBlockedWords] = useState<string[]>([]);
  const [newWord, setNewWord] = useState("");
  const [autoModLevel, setAutoModLevel] = useState<"none" | "basic" | "aggressive">("basic");
  const [chatDelay, setChatDelay] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const filtersRes = await settingsAPI.get("chatFilters");
        if (filtersRes.status) setBlockedWords(filtersRes.data || []);
        const autoModRes = await settingsAPI.getAutoModeration();
        if (autoModRes.status && autoModRes.data) setAutoModLevel(autoModRes.data.level || "basic");
        const delayRes = await settingsAPI.get("chatDisplayDelay");
        if (delayRes.status) setChatDelay(delayRes.data || 0);
      } catch (err) {
        console.error("Failed to load chat moderation settings", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const addBlockedWord = async () => {
    if (!newWord.trim()) return;
    await settingsAPI.addChatFilter(newWord);
    setBlockedWords([...blockedWords, newWord.toLowerCase()]);
    setNewWord("");
  };

  const removeBlockedWord = async (word: string) => {
    await settingsAPI.removeChatFilter(word);
    setBlockedWords(blockedWords.filter((w) => w !== word));
  };

  const updateAutoModLevel = async (level: "none" | "basic" | "aggressive") => {
    setAutoModLevel(level);
    const currentConfig = await settingsAPI.getAutoModeration();
    const newConfig = { ...currentConfig.data, level };
    await settingsAPI.updateAutoModeration(newConfig);
  };

  const updateChatDelay = async (seconds: number) => {
    setChatDelay(seconds);
    await settingsAPI.set("chatDisplayDelay", seconds);
  };

  if (loading) return <div className="animate-pulse h-64 bg-[var(--card-bg)] rounded-xl"></div>;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-[var(--text-primary)]">Chat & Moderation</h2>
      <div className="bg-[var(--card-bg)] rounded-xl p-6 space-y-6">
        {/* Blocked words */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <ListFilter className="w-5 h-5 text-[#9147ff]" />
            <h3 className="text-[var(--text-primary)] font-semibold">Blocked Words</h3>
          </div>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={newWord}
              onChange={(e) => setNewWord(e.target.value)}
              placeholder="Word to block"
              className="flex-1 bg-[var(--background-color)] border border-[var(--card-bg)] rounded px-3 py-2 text-[var(--text-primary)] text-sm"
            />
            <button onClick={addBlockedWord} className="px-3 py-2 bg-[var(--primary-color)] rounded-md text-sm">Add</button>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {blockedWords.map((word) => (
              <span key={word} className="inline-flex items-center gap-1 px-2 py-1 bg-[#2a2a2e] rounded-full text-sm text-[var(--text-primary)]">
                {word}
                <button onClick={() => removeBlockedWord(word)} className="ml-1 text-red-400 hover:text-red-300">×</button>
              </span>
            ))}
          </div>
        </div>

        {/* Auto-mod level */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Shield className="w-5 h-5 text-[#9147ff]" />
            <h3 className="text-[var(--text-primary)] font-semibold">Auto‑Moderation Level</h3>
          </div>
          <div className="flex gap-2">
            {(["none", "basic", "aggressive"] as const).map((level) => (
              <button
                key={level}
                onClick={() => updateAutoModLevel(level)}
                className={`flex-1 py-2 rounded-md text-sm ${autoModLevel === level ? "bg-[var(--primary-color)] text-[var(--text-primary)]" : "bg-[#2a2a2e] text-[var(--text-secondary)]"}`}
              >
                {level === "none" ? "Off" : level.charAt(0).toUpperCase() + level.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Chat delay (UI only) */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-5 h-5 text-[#9147ff]" />
            <h3 className="text-[var(--text-primary)] font-semibold">Chat Display Delay (seconds)</h3>
          </div>
          <input
            type="number"
            min="0"
            max="30"
            value={chatDelay}
            onChange={(e) => updateChatDelay(parseInt(e.target.value) || 0)}
            className="w-32 bg-[var(--background-color)] border border-[var(--card-bg)] rounded px-3 py-2 text-[var(--text-primary)]"
          />
          <p className="text-xs text-[var(--text-secondary)] mt-1">Delay before messages appear in the chat feed.</p>
        </div>
      </div>
    </div>
  );
};