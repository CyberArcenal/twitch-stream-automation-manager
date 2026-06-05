import React, { useState, useEffect } from "react";
import { History, Undo, Ban, Clock, UserX, Trash2 } from "lucide-react";
import { moderationLogAPI, type ModerationLogEntry } from "../../../api/core/moderationLog";
import { streamManagerAPI } from "../../../api/core/streamManager";
import { formatDistanceToNow } from "date-fns";

interface ModerationLogCardProps {
  broadcasterId: string;
  className?: string;
}

export const ModerationLogCard: React.FC<ModerationLogCardProps> = ({
  broadcasterId,
  className,
}) => {
  const [logs, setLogs] = useState<ModerationLogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<"all" | "ban" | "timeout" | "unban">("all");

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await moderationLogAPI.getLogs(
        filter !== "all" ? { action: filter } : undefined
      );
      if (res.status) setLogs(res.data || []);
    } catch (err) {
      console.error("Failed to fetch logs", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 5000);
    return () => clearInterval(interval);
  }, [filter]);

  const handleUndo = async (log: ModerationLogEntry) => {
    if (log.action === "ban" || log.action === "timeout") {
      try {
        await streamManagerAPI.unbanUser(log.targetUserName);
        fetchLogs();
      } catch (err) {
        console.error("Undo failed", err);
      }
    }
  };

  const handleClearLogs = async () => {
    try {
      await moderationLogAPI.clearLogs();
      fetchLogs();
    } catch (err) {
      console.error("Failed to clear logs", err);
    }
  };

  const getIcon = (action: string) => {
    switch (action) {
      case "ban":
        return <Ban className="w-4 h-4 text-red-400" />;
      case "timeout":
        return <Clock className="w-4 h-4 text-yellow-400" />;
      case "unban":
        return <UserX className="w-4 h-4 text-green-400" />;
      default:
        return <History className="w-4 h-4 text-[var(--text-secondary)]" />;
    }
  };

  const filteredLogs =
    filter === "all" ? logs : logs.filter((log) => log.action === filter);

  return (
    <div
      className={`bg-[var(--card-bg)] rounded-xl shadow-lg border border-[var(--border-color)] flex flex-col overflow-hidden ${
        className || ""
      }`}
    >
      {/* Header */}
      <div className="p-4 border-b border-[var(--border-color)] flex justify-between items-center flex-shrink-0">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-[#9147ff]" />
          <h3 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider">
            Moderation Logs
          </h3>
        </div>
        <span className="text-xs bg-[var(--btn-secondary-bg)] px-2 py-1 rounded-full">
          {filteredLogs.length}
        </span>
      </div>

      {/* Filter Tabs */}
      <div className="px-4 py-2 border-b border-[var(--border-color)] flex gap-2 flex-shrink-0 overflow-x-auto">
        {["all", "ban", "timeout", "unban"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f as any)}
            className={`px-3 py-1 text-xs rounded-full font-medium transition whitespace-nowrap ${
              filter === f
                ? "bg-[var(--primary-color)] text-white"
                : "bg-[var(--btn-secondary-bg)] hover:bg-[var(--btn-secondary-hover)] text-[var(--text-secondary)]"
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Logs List */}
      <div className="flex-1 overflow-y-auto min-h-0 p-3 space-y-2">
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin text-[var(--text-secondary)]">⟳</div>
          </div>
        ) : filteredLogs.length === 0 ? (
          <p className="text-center text-[var(--text-secondary)] text-sm py-8">
            No moderation actions yet
          </p>
        ) : (
          filteredLogs.map((log) => (
            <div
              key={log.id}
              className="flex items-start gap-3 p-2.5 rounded-lg bg-[#2a2a2e]/30 hover:bg-[#2a2a2e]/50 transition"
            >
              {getIcon(log.action)}
              <div className="flex-1 min-w-0">
                <div className="text-sm text-[var(--text-primary)] font-medium">
                  <span className="font-semibold">{log.targetUserName}</span>
                  <span className="text-[var(--text-secondary)] ml-2">
                    {log.action}
                  </span>
                </div>
                {log.reason && (
                  <div className="text-xs text-[var(--text-secondary)] mt-1">
                    Reason: {log.reason}
                  </div>
                )}
                {log.duration && (
                  <div className="text-xs text-[var(--text-secondary)]">
                    Duration: {log.duration}s
                  </div>
                )}
                <div className="text-xs text-[var(--text-secondary)] mt-1">
                  {formatDistanceToNow(new Date(log.timestamp), {
                    addSuffix: true,
                  })}
                </div>
              </div>
              {!log.undone &&
                (log.action === "ban" || log.action === "timeout") && (
                  <button
                    onClick={() => handleUndo(log)}
                    className="p-1.5 rounded hover:bg-[#3a3a4a] transition flex-shrink-0"
                    title="Undo action"
                  >
                    <Undo className="w-4 h-4 text-green-400" />
                  </button>
                )}
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      {filteredLogs.length > 0 && (
        <div className="p-3 border-t border-[var(--border-color)] flex-shrink-0">
          <button
            onClick={handleClearLogs}
            className="w-full text-center text-sm bg-[var(--btn-secondary-bg)] hover:bg-red-600/30 text-[var(--text-primary)] py-2 rounded-lg transition flex items-center justify-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Clear Logs
          </button>
        </div>
      )}
    </div>
  );
};
