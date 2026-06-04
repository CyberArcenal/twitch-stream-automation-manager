// sections/AutoFollowerModeSection.tsx
import React from "react";

interface Props {
  enabled: boolean;
  onToggle: () => void;
  duration: number;
  onDurationChange: (value: number) => void;
}

export const AutoFollowerModeSection: React.FC<Props> = ({
  enabled,
  onToggle,
  duration,
  onDurationChange,
}) => {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm text-[var(--text-primary)]">
          Auto‑enable Follower Mode during raid
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
        <div className="ml-6">
          <div className="flex justify-between text-xs">
            <span>Follower mode duration (minutes)</span>
            <input
              type="number"
              value={duration}
              onChange={(e) => onDurationChange(Number(e.target.value))}
              className="w-20 bg-[var(--input-bg)] border border-[var(--input-border)] rounded px-1"
            />
          </div>
        </div>
      )}
    </div>
  );
};