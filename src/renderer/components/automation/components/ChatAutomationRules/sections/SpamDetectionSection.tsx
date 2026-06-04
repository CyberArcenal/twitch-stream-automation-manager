// sections/SpamDetectionSection.tsx
import React from "react";

interface Props {
  windowSeconds: number;
  onWindowSecondsChange: (value: number) => void;
  repeatThreshold: number;
  onRepeatThresholdChange: (value: number) => void;
}

export const SpamDetectionSection: React.FC<Props> = ({
  windowSeconds,
  onWindowSecondsChange,
  repeatThreshold,
  onRepeatThresholdChange,
}) => {
  return (
    <div className="mt-3 pt-2 border-t border-[var(--border-color)]">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs font-medium text-[var(--text-secondary)]">
          Spam Detection (Repeated Messages)
        </span>
      </div>
      <div className="flex gap-4">
        <label className="flex-1 text-xs">
          <span>Window (seconds)</span>
          <input
            type="number"
            value={windowSeconds}
            onChange={(e) => onWindowSecondsChange(Number(e.target.value))}
            min={1}
            max={60}
            className="w-full mt-1 bg-[var(--input-bg)] border border-[var(--input-border)] rounded px-2 py-1"
          />
        </label>
        <label className="flex-1 text-xs">
          <span>Threshold (repeats)</span>
          <input
            type="number"
            value={repeatThreshold}
            onChange={(e) => onRepeatThresholdChange(Number(e.target.value))}
            min={2}
            max={10}
            className="w-full mt-1 bg-[var(--input-bg)] border border-[var(--input-border)] rounded px-2 py-1"
          />
        </label>
      </div>
      <p className="text-[10px] text-[var(--text-secondary)] mt-1">
        Auto‑timeout user if same message is sent &gt;= threshold within window.
      </p>
    </div>
  );
};