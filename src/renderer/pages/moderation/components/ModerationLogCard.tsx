// src/renderer/pages/moderation/components/ModerationLogCard.tsx
import React, { useState } from 'react';
import { History, Undo, Ban, Clock, UserX, Trash2, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { streamManagerAPI } from '../../../api/core/streamManager';
import { useModerationLog } from '../../../contexts/ModerationLogContext';

interface ModerationLogCardProps {
  broadcasterId: string;
  className?: string;
}

export const ModerationLogCard: React.FC<ModerationLogCardProps> = ({
  broadcasterId,
  className,
}) => {
  const { logs, clearLogs, isLoading } = useModerationLog();
  const [filter, setFilter] = useState<'all' | 'ban' | 'timeout' | 'unban' | 'delete'>('all');
  
  // Loading states for actions
  const [undoingLogId, setUndoingLogId] = useState<string | null>(null);
  const [isClearing, setIsClearing] = useState(false);

  const handleUndo = async (log: any) => {
    // Only allow undo for ban/timeout actions
    if (log.action !== 'ban' && log.action !== 'timeout') return;
    
    setUndoingLogId(log.id);
    try {
      await streamManagerAPI.unbanUser(log.targetUserName);
      // The backend will emit a new log entry for the undo action.
      // Optionally you could optimistically update the local log's `undone` flag here.
      // For now, we rely on the real‑time log:entry to refresh the list.
    } catch (err) {
      console.error('Undo failed', err);
      // You could show a toast notification here
    } finally {
      setUndoingLogId(null);
    }
  };

  const handleClearLogs = async () => {
    setIsClearing(true);
    try {
      await clearLogs();
    } catch (err) {
      console.error('Failed to clear logs', err);
    } finally {
      setIsClearing(false);
    }
  };

  const getIcon = (action: string) => {
    switch (action) {
      case 'ban':
        return <Ban className="w-4 h-4 text-red-400" />;
      case 'timeout':
        return <Clock className="w-4 h-4 text-yellow-400" />;
      case 'unban':
        return <UserX className="w-4 h-4 text-green-400" />;
      case 'delete':
        return <Trash2 className="w-4 h-4 text-orange-400" />;
      default:
        return <History className="w-4 h-4 text-[var(--text-secondary)]" />;
    }
  };

  const filteredLogs =
    filter === 'all' ? logs : logs.filter((log) => log.action === filter);

  return (
    <div className={`bg-[var(--card-bg)] rounded-xl shadow-lg border border-[var(--border-color)] flex flex-col overflow-hidden max-h-[500px] ${className || ''}`}>
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
        {['all', 'ban', 'timeout', 'unban', 'delete'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f as any)}
            className={`px-3 py-1 text-xs rounded-full font-medium transition whitespace-nowrap ${
              filter === f
                ? 'bg-[var(--primary-color)] text-white'
                : 'bg-[var(--btn-secondary-bg)] hover:bg-[var(--btn-secondary-hover)] text-[var(--text-secondary)]'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Logs List */}
      <div className="flex-1 overflow-y-auto min-h-0 p-3 space-y-2">
        {isLoading ? (
          <div className="flex justify-center items-center h-32">
            <Loader2 className="w-5 h-5 text-[var(--text-secondary)] animate-spin" />
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
                  {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                </div>
              </div>
              {!log.undone && (log.action === 'ban' || log.action === 'timeout') && (
                <button
                  onClick={() => handleUndo(log)}
                  disabled={undoingLogId === log.id}
                  className="p-1.5 rounded hover:bg-[#3a3a4a] transition flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Undo action"
                >
                  {undoingLogId === log.id ? (
                    <Loader2 className="w-4 h-4 text-green-400 animate-spin" />
                  ) : (
                    <Undo className="w-4 h-4 text-green-400" />
                  )}
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
            disabled={isClearing}
            className="w-full text-center text-sm bg-[var(--btn-secondary-bg)] hover:bg-red-600/30 text-[var(--text-primary)] py-2 rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isClearing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
            Clear Logs
          </button>
        </div>
      )}
    </div>
  );
};