// sections/AutoTimeoutToggle.tsx
import React from "react";

interface Props {
  enabled: boolean;
  onToggle: () => void;
}

export const AutoTimeoutToggle: React.FC<Props> = ({ enabled, onToggle }) => {
  return (
    <div className="flex items-center justify-between mt-2">
      <span className="text-sm text-[var(--text-primary)]">Timeout user</span>
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
  );
};