// sections/AutoClipOnChatSpikeSection.tsx
import React from "react";

interface Props {
  enabled: boolean;
  onToggle: () => void;
  threshold: number;
  onThresholdChange: (value: number) => void;
  cooldownMinutes: number;
  onCooldownMinutesChange: (value: number) => void;
}

export const AutoClipOnChatSpikeSection: React.FC<Props> = ({
  enabled,
  onToggle,
  threshold,
  onThresholdChange,
  cooldownMinutes,
  onCooldownMinutesChange,
}) => {
  return (
    <div className="mt-3 pt-2 border-t border-[var(--border-color)]">
      <div className="flex items-center justify-between">
        <span className="text-sm text-[var(--text-primary)] flex items-center gap-1">
          <span>🎬</span> Auto‑clip on chat spike
        </span>
        <button
          onClick={onToggle}
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
      {enabled && (
        <div className="ml-6 mt-2 space-y-2">
          <div className="flex justify-between text-xs">
            <span>Messages per minute threshold</span>
            <input
              type="number"
              value={threshold}
              onChange={(e) => onThresholdChange(Number(e.target.value))}
              min={10}
              max={500}
              step={10}
              className="w-20 bg-[var(--input-bg)] border border-[var(--input-border)] rounded px-1"
            />
          </div>
          <div className="flex justify-between text-xs">
            <span>Cooldown (minutes)</span>
            <input
              type="number"
              value={cooldownMinutes}
              onChange={(e) => onCooldownMinutesChange(Number(e.target.value))}
              min={1}
              max={60}
              className="w-20 bg-[var(--input-bg)] border border-[var(--input-border)] rounded px-1"
            />
          </div>
          <p className="text-[10px] text-[var(--text-secondary)]">
            Creates a clip when chat activity exceeds threshold. Cooldown prevents multiple clips too close.
          </p>
        </div>
      )}
    </div>
  );
};