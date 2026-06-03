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
}) => {
  return (
    <div>
      <h4 className="text-xs font-medium text-[var(--text-secondary)] uppercase mb-2">
        Stream Triggers
      </h4>
      <div className="space-y-2">
        {/* Auto-raid */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-[var(--text-primary)]">Auto‑raid when stream ends</span>
          <button
            onClick={onToggleAutoRaid}
            disabled={!isLive}
            className={`relative w-10 h-5 rounded-full transition-colors ${
              autoRaidEnabled ? "bg-[var(--primary-color)]" : "bg-[var(--input-border)]"
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
          <span className="text-sm text-[var(--text-primary)]">Auto‑clip when stream ends</span>
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
          <span className="text-sm text-[var(--text-primary)]">Auto‑message on follow/sub</span>
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
      </div>
    </div>
  );
};