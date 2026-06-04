// sections/AutoSlowModeSection.tsx
import React from "react";

interface Props {
  enabled: boolean;
  onToggle: () => void;
  spamThreshold: number;
  onSpamThresholdChange: (value: number) => void;
  waitTime: number;
  onWaitTimeChange: (value: number) => void;
  duration: number;
  onDurationChange: (value: number) => void;
}

export const AutoSlowModeSection: React.FC<Props> = ({
  enabled,
  onToggle,
  spamThreshold,
  onSpamThresholdChange,
  waitTime,
  onWaitTimeChange,
  duration,
  onDurationChange,
}) => {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm text-[var(--text-primary)]">
          Auto‑enable Slow Mode on spam
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
        <div className="ml-6 space-y-2">
          <div className="flex justify-between text-xs">
            <span>Spam threshold (messages per minute)</span>
            <input
              type="number"
              value={spamThreshold}
              onChange={(e) => onSpamThresholdChange(Number(e.target.value))}
              className="w-16 bg-[var(--input-bg)] border border-[var(--input-border)] rounded px-1 text-center"
            />
          </div>
          <div className="flex justify-between text-xs">
            <span>Slow mode wait time (seconds)</span>
            <select
              value={waitTime}
              onChange={(e) => onWaitTimeChange(Number(e.target.value))}
              className="bg-[var(--input-bg)] border border-[var(--input-border)] rounded px-1"
            >
              <option value={5}>5 sec</option>
              <option value={10}>10 sec</option>
              <option value={30}>30 sec</option>
            </select>
          </div>
          <div className="flex justify-between text-xs">
            <span>Slow mode duration (seconds)</span>
            <input
              type="number"
              value={duration}
              onChange={(e) => onDurationChange(Number(e.target.value))}
              min={10}
              max={300}
              step={10}
              className="w-20 bg-[var(--input-bg)] border border-[var(--input-border)] rounded px-1"
            />
          </div>
        </div>
      )}
    </div>
  );
};