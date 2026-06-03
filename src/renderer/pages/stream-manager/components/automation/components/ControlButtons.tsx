import React from "react";
import { Play, Square } from "lucide-react";

interface ControlButtonsProps {
  automationRunning: boolean;
  onStart: () => void;
  onStop: () => void;
}

export const ControlButtons: React.FC<ControlButtonsProps> = ({
  automationRunning,
  onStart,
  onStop,
}) => {
  return (
    <div className="border-t border-[var(--border-color)] p-3 flex gap-2">
      <button
        onClick={onStart}
        disabled={automationRunning}
        className="flex-1 flex items-center justify-center gap-1 bg-[var(--primary-color)] py-1.5 rounded-lg hover:bg-[#772ce8] disabled:opacity-50 text-white text-sm"
      >
        <Play className="w-3 h-3" /> Start
      </button>
      <button
        onClick={onStop}
        disabled={!automationRunning}
        className="flex-1 flex items-center justify-center gap-1 bg-[var(--btn-secondary-bg)] py-1.5 rounded-lg hover:bg-[var(--btn-secondary-hover)] disabled:opacity-50 text-sm"
      >
        <Square className="w-3 h-3" /> Stop
      </button>
    </div>
  );
};