import React from "react";

interface StreamTriggersProps {
  isLive: boolean;
  autoRaidEnabled: boolean;
  onToggleAutoRaid: () => void;
  raidTarget: string;
  onRaidTargetChange: (value: string) => void;
  autoClipEnabled: boolean;
  onToggleAutoClip: () => void;
  autoMessageEnabled: boolean;
  onToggleAutoMessage: () => void;
  autoMessageText: string;
  onAutoMessageTextChange: (value: string) => void;
  autoShoutoutOnRaid: boolean;
  onToggleAutoShoutoutOnRaid: () => void;
  shoutoutMessage: string;
  onShoutoutMessageChange: (value: string) => void;
  autoStreamMarkers: boolean;
  onToggleAutoStreamMarkers: () => void;
  markerIntervalMinutes: number;
  onMarkerIntervalMinutesChange: (value: number) => void;
}

export const StreamTriggers: React.FC<StreamTriggersProps> = ({
  isLive,
  autoRaidEnabled,
  onToggleAutoRaid,
  raidTarget,
  onRaidTargetChange,
  autoClipEnabled,
  onToggleAutoClip,
  autoMessageEnabled,
  onToggleAutoMessage,
  autoMessageText,
  onAutoMessageTextChange,
  autoShoutoutOnRaid,
  onToggleAutoShoutoutOnRaid,
  shoutoutMessage,
  onShoutoutMessageChange,
  autoStreamMarkers,
  onToggleAutoStreamMarkers,
  markerIntervalMinutes,
  onMarkerIntervalMinutesChange,
}) => {
  return (
    <div>
      <h4 className="text-xs font-medium text-[var(--text-secondary)] uppercase mb-2">
        Stream Triggers
      </h4>
      <div className="space-y-2 overflow-y-scroll max-h-[160px] pr-2 pb-3">
        {/* Auto-raid */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-[var(--text-primary)]">
            Auto‑raid when stream ends
          </span>
          <button
            onClick={onToggleAutoRaid}
            disabled={!isLive}
            className={`relative w-10 h-5 rounded-full transition-colors ${
              autoRaidEnabled
                ? "bg-[var(--primary-color)]"
                : "bg-[var(--input-border)]"
            } ${!isLive ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                autoRaidEnabled ? "translate-x-5" : ""
              }`}
            />
          </button>
        </div>
        {autoRaidEnabled && (
          <div className="mt-2">
            <input
              type="text"
              value={raidTarget}
              onChange={(e) => onRaidTargetChange(e.target.value)}
              placeholder="Raid target channel"
              className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded px-2 py-1 text-sm"
            />
          </div>
        )}

        {/* Auto-clip */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-[var(--text-primary)]">
            Auto‑clip when stream ends
          </span>
          <button
            onClick={onToggleAutoClip}
            disabled={!isLive}
            className={`relative w-10 h-5 rounded-full transition-colors bg-[var(--input-border)] ${autoClipEnabled ? "bg-[var(--primary-color)]" : "bg-[var(--input-border)]"}`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                autoClipEnabled ? "translate-x-5" : ""
              }`}
            />
          </button>
        </div>

        {/* Auto-message */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-[var(--text-primary)]">
            Auto‑message on follow/sub
          </span>
          <button
            onClick={onToggleAutoMessage}
            disabled={!isLive}
            className={`relative w-10 h-5 rounded-full transition-colors bg-[var(--input-border)] ${autoMessageEnabled ? "bg-[var(--primary-color)]" : "bg-[var(--input-border)]"}`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                autoMessageEnabled ? "translate-x-5" : ""
              }`}
            />
          </button>
        </div>
        {autoMessageEnabled && (
          <div className="mt-2">
            <input
              type="text"
              value={autoMessageText}
              onChange={(e) => onAutoMessageTextChange(e.target.value)}
              placeholder="Auto‑message text"
              className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded px-2 py-1 text-sm"
            />
          </div>
        )}
        <div className="flex items-center justify-between">
          <span className="text-sm text-[var(--text-primary)] flex items-center gap-1">
            <span>🔊</span> Auto‑shoutout on raid
          </span>
          <button
            onClick={onToggleAutoShoutoutOnRaid}
            className="relative w-10 h-5 rounded-full transition-colors bg-[var(--input-border)]"
          >
            <span
              className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${autoShoutoutOnRaid ? "translate-x-5" : ""}`}
            />
          </button>
        </div>
        {autoShoutoutOnRaid && (
          <div className="ml-6">
            <label className="text-xs text-[var(--text-secondary)]">
              Shoutout message
            </label>
            <input
              type="text"
              value={shoutoutMessage}
              onChange={(e) => onShoutoutMessageChange(e.target.value)}
              placeholder="Message (use {fromBroadcasterName})"
              className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded px-2 py-1 text-sm mt-1"
            />
            <p className="text-[10px] text-[var(--text-secondary)] mt-1">
              Use {"{fromBroadcasterName}"} to insert the raider's name.
            </p>
          </div>
        )}

        <div className="mt-3 pt-2 border-t border-[var(--border-color)]">
          <div className="flex items-center justify-between">
            <span className="text-sm text-[var(--text-primary)] flex items-center gap-1">
              <span>⏱️</span> Auto‑save stream markers
            </span>
            <button
              onClick={onToggleAutoStreamMarkers}
              className={`relative w-10 h-5 rounded-full transition-colors ${autoStreamMarkers ? "bg-[var(--primary-color)]" : "bg-[var(--input-border)]"}`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${autoStreamMarkers ? "translate-x-5" : ""}`}
              />
            </button>
          </div>
          {autoStreamMarkers && (
            <div className="ml-6 mt-2">
              <div className="flex justify-between text-xs">
                <span>Interval (minutes)</span>
                <input
                  type="number"
                  value={markerIntervalMinutes}
                  onChange={(e) =>
                    onMarkerIntervalMinutesChange(Number(e.target.value))
                  }
                  min={5}
                  max={120}
                  step={5}
                  className="w-20 bg-[var(--input-bg)] border border-[var(--input-border)] rounded px-1"
                />
              </div>
              <p className="text-[10px] text-[var(--text-secondary)] mt-1">
                Automatically creates a stream marker every X minutes while
                live.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
