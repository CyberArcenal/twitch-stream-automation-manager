// sections/MasterToggleSection.tsx
import React from "react";
import { Shield } from "lucide-react";

interface Props {
  enabled: boolean;
  onToggle: () => void;
}

export const MasterToggleSection: React.FC<Props> = ({ enabled, onToggle }) => {
  return (
    <div className="flex items-center justify-between border-t border-[var(--border-color)] pt-3 mt-3">
      <span className="text-sm font-medium text-[var(--text-primary)] flex items-center gap-1">
        <Shield className="w-4 h-4" /> Chat Auto‑Moderation (Master)
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