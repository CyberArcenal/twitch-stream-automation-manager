// AutomationLogs.tsx
import React, { useRef, useEffect } from "react";
import type { AutomationLog } from "../types";

interface AutomationLogsProps {
  logs: AutomationLog[];
  className?: string;          // for the outer container
  classNameToLog?: string;     // for the scrollable div
  fromModeration?: boolean;
  onClearLogs: () => void;
}

export const AutomationLogs: React.FC<AutomationLogsProps> = ({
  logs,
  className,
  classNameToLog,
  fromModeration,
  onClearLogs,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className={`flex flex-col ${className || ""} ${fromModeration? "min-h-[200px]": ""}`}>
      <div className="flex justify-between items-center mb-2 flex-shrink-0">
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
        className={`overflow-y-auto ${classNameToLog || "max-h-13"}`}
      >
        {logs.length === 0 ? (
          <p className="text-xs text-[var(--text-secondary)] italic">
            No automation events yet.
          </p>
        ) : (
          logs.map((log) => (
            <div
              key={log.id}
              className="text-xs border-l-2 border-[#9147ff] pl-2 mb-1"
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