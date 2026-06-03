import React, { useRef, useEffect } from "react";
import type { AutomationLog } from "../types";

interface AutomationLogsProps {
  logs: AutomationLog[];
  onClearLogs: () => void;
}

export const AutomationLogs: React.FC<AutomationLogsProps> = ({
  logs,
  onClearLogs,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom whenever logs change
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <h4 className="text-xs font-medium text-[var(--text-secondary)] uppercase">
          Automation Logs
        </h4>
        <button
          onClick={onClearLogs}
          className="text-xs text-[var(--text-secondary)] hover:text-white"
        >
          Clear
        </button>
      </div>
      <div
        ref={scrollContainerRef}
        className="space-y-1 max-h-15 overflow-y-auto"
      >
        {logs.length === 0 ? (
          <p className="text-xs text-[var(--text-secondary)] italic">
            No automation events yet.
          </p>
        ) : (
          logs.map((log) => (
            <div
              key={log.id}
              className="text-xs border-l-2 border-[#9147ff] pl-2"
            >
              <span className="text-[var(--text-secondary)]">
                {log.timestamp.toLocaleTimeString()}
              </span>
              <span
                className={`ml-2 ${
                  log.type === "error"
                    ? "text-red-400"
                    : log.type === "success"
                      ? "text-green-400"
                      : "text-[var(--text-primary)]"
                }`}
              >
                {log.message}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};