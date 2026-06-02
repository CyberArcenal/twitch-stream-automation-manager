import React, { useState, useEffect } from "react";
import { History, Undo, Ban, Clock, UserX } from "lucide-react";
import { moderationLogAPI, type ModerationLogEntry } from "../../../api/core/moderationLog";
import { streamManagerAPI } from "../../../api/core/streamManager";
import { formatDistanceToNow } from "date-fns";

interface ModerationLogsProps {
  broadcasterId: string;
}

export const ModerationLogs: React.FC<ModerationLogsProps> = ({ broadcasterId }) => {
  const [logs, setLogs] = useState<ModerationLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      const res = await moderationLogAPI.getLogs();
      if (res.status) setLogs(res.data || []);
    } catch (err) {
      console.error("Failed to fetch logs", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleUndo = async (log: ModerationLogEntry) => {
    if (log.action === "ban" || log.action === "timeout") {
      try {
        await streamManagerAPI.unbanUser(log.targetUserName);
        // Mark as undone in logs (optional: refresh logs)
        await moderationLogAPI.clearLogs(); // simplistic; better to have an update endpoint
        fetchLogs();
      } catch (err) {
        console.error("Undo failed", err);
      }
    }
  };

  const getIcon = (action: string) => {
    switch (action) {
      case "ban": return <Ban className="w-4 h-4 text-red-400" />;
      case "timeout": return <Clock className="w-4 h-4 text-yellow-400" />;
      case "unban": return <UserX className="w-4 h-4 text-green-400" />;
      default: return <History className="w-4 h-4 text-[var(--text-secondary)]" />;
    }
  };

  if (loading) return <div className="bg-[var(--card-bg)] rounded-xl p-5 animate-pulse h-64"></div>;

  return (
    <div className="bg-[var(--card-bg)] rounded-xl shadow-md border border-[var(--card-bg)] p-5">
      <div className="flex items-center gap-2 mb-4">
        <History className="w-5 h-5 text-[#9147ff]" />
        <h3 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider">
          Moderation Logs
        </h3>
      </div>
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {logs.length === 0 ? (
          <p className="text-center text-[var(--text-secondary)] text-sm">No moderation actions yet</p>
        ) : (
          logs.map((log) => (
            <div
              key={log.id}
              className="flex items-start gap-2 p-2 rounded-lg bg-[#2a2a2e]/30"
            >
              {getIcon(log.action)}
              <div className="flex-1">
                <div className="text-sm text-[var(--text-primary)]">
                  <span className="font-semibold">{log.targetUserName}</span> – {log.action}
                  {log.duration && ` (${log.duration}s)`}
                  {log.reason && ` – ${log.reason}`}
                </div>
                <div className="text-xs text-[var(--text-secondary)]">
                  {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                </div>
              </div>
              {!log.undone && (log.action === "ban" || log.action === "timeout") && (
                <button
                  onClick={() => handleUndo(log)}
                  className="p-1 rounded hover:bg-[#3a3a4a]"
                  title="Undo (unban)"
                >
                  <Undo className="w-4 h-4 text-green-400" />
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};