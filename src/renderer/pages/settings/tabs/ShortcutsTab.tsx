import React, { useState, useEffect } from "react";
import { Keyboard, RotateCcw } from "lucide-react";
import { shortcutAPI } from "../../../api/core/shortcut";

interface Shortcut {
  action: string;
  accelerator: string;
  description: string;
}

const defaultShortcuts: Shortcut[] = [
  { action: "playpause", accelerator: "MediaPlayPause", description: "Play/Pause" },
  { action: "play", accelerator: "Ctrl+Shift+P", description: "Play" },
  { action: "pause", accelerator: "Ctrl+Shift+O", description: "Pause" },
  { action: "nextChannel", accelerator: "MediaNextTrack", description: "Next Channel" },
  { action: "previousChannel", accelerator: "MediaPreviousTrack", description: "Previous Channel" },
  { action: "mute", accelerator: "Ctrl+Shift+M", description: "Mute" },
  { action: "volumeUp", accelerator: "Ctrl+Shift+Up", description: "Volume Up" },
  { action: "volumeDown", accelerator: "Ctrl+Shift+Down", description: "Volume Down" },
  { action: "fullscreen", accelerator: "F11", description: "Fullscreen" },
  { action: "closePlayer", accelerator: "Ctrl+W", description: "Close Player" },
];

export const ShortcutsTab: React.FC = () => {
  const [shortcuts, setShortcuts] = useState<Shortcut[]>(defaultShortcuts);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [tempAccelerator, setTempAccelerator] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await shortcutAPI.getShortcuts();
        if (res.status && res.data) {
          const saved = Object.entries(res.data).map(([action, accelerator]) => ({
            action,
            accelerator: accelerator as string,
            description: defaultShortcuts.find(s => s.action === action)?.description || action,
          }));
          setShortcuts(saved);
        }
      } catch (err) {
        console.error("Failed to load shortcuts", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const startEditing = (index: number) => {
    setEditingIndex(index);
    setTempAccelerator(shortcuts[index].accelerator);
  };

  const captureKey = (e: React.KeyboardEvent) => {
    e.preventDefault();
    const keys: string[] = [];
    if (e.ctrlKey) keys.push("Ctrl");
    if (e.shiftKey) keys.push("Shift");
    if (e.altKey) keys.push("Alt");
    if (e.metaKey) keys.push("Cmd");
    const key = e.key.length === 1 ? e.key.toUpperCase() : e.key;
    if (key !== "Control" && key !== "Shift" && key !== "Alt" && key !== "Meta") {
      keys.push(key);
    }
    let accelerator = keys.join("+");
    if (accelerator === "Space") accelerator = "Space";
    setTempAccelerator(accelerator);
  };

  const saveShortcut = async () => {
    if (editingIndex === null) return;
    const updated = [...shortcuts];
    updated[editingIndex].accelerator = tempAccelerator;
    setShortcuts(updated);
    setEditingIndex(null);
    // Save to backend
    const shortcutMap: Record<string, string> = {};
    updated.forEach(s => { shortcutMap[s.action] = s.accelerator; });
    await shortcutAPI.setShortcuts(shortcutMap);
  };

  const resetDefaults = async () => {
    await shortcutAPI.resetShortcuts();
    setShortcuts(defaultShortcuts);
  };

  if (loading) return <div className="animate-pulse h-64 bg-[var(--card-bg)] rounded-xl"></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-[var(--text-primary)]">Keyboard Shortcuts</h2>
        <button onClick={resetDefaults} className="flex items-center gap-1 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
          <RotateCcw className="w-4 h-4" /> Reset to Defaults
        </button>
      </div>
      <div className="bg-[var(--card-bg)] rounded-xl p-6">
        <div className="space-y-3">
          {shortcuts.map((shortcut, idx) => (
            <div key={shortcut.action} className="flex items-center justify-between py-2 border-b border-[var(--card-bg)] last:border-0">
              <span className="text-[var(--text-primary)] text-sm">{shortcut.description}</span>
              {editingIndex === idx ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tempAccelerator}
                    onKeyDown={captureKey}
                    onBlur={saveShortcut}
                    placeholder="Press keys"
                    className="bg-[var(--background-color)] border border-[var(--card-bg)] rounded px-2 py-1 text-[var(--text-primary)] text-sm w-32 text-center"
                    autoFocus
                  />
                  <button onClick={saveShortcut} className="text-green-400 text-xs">Save</button>
                  <button onClick={() => setEditingIndex(null)} className="text-red-400 text-xs">Cancel</button>
                </div>
              ) : (
                <button
                  onClick={() => startEditing(idx)}
                  className="bg-[#2a2a2e] px-3 py-1 rounded-md text-xs text-[var(--text-primary)] font-mono"
                >
                  {shortcut.accelerator}
                </button>
              )}
            </div>
          ))}
        </div>
        <p className="text-xs text-[var(--text-secondary)] mt-4">Click on a shortcut to change it. Press the desired key combination.</p>
      </div>
    </div>
  );
};