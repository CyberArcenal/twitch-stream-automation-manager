// sections/AutoDeleteToggle.tsx
import React from "react";
import { Ban } from "lucide-react";

interface Props {
  enabled: boolean;
  onToggle: () => void;
}

export const AutoDeleteToggle: React.FC<Props> = ({ enabled, onToggle }) => {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-[var(--text-primary)] flex items-center gap-1">
        <Ban className="w-3 h-3" /> Auto‑delete messages containing blocked terms
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
  );
};