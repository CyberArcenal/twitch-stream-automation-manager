// src/renderer/contexts/ModerationLogContext.tsx
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { moderationLogAPI, type ModerationLogEntry } from '../api/core/moderationLog';


export interface ModerationLogContextType {
  logs: ModerationLogEntry[];
  addLog: (entry: ModerationLogEntry) => void;
  clearLogs: () => Promise<void>;
  isLoading: boolean;
}

const ModerationLogContext = createContext<ModerationLogContextType | undefined>(undefined);

export const ModerationLogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [logs, setLogs] = useState<ModerationLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch initial historical logs
  const fetchHistoricalLogs = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await moderationLogAPI.getLogs();
      if (res.status && res.data) {
        setLogs(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch moderation logs', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Add a single log (used for real‑time events)
  const addLog = useCallback((entry: ModerationLogEntry) => {
    setLogs(prev => [entry, ...prev]);
  }, []);

  // Clear all logs via API and update state
  const clearLogs = useCallback(async () => {
    try {
      await moderationLogAPI.clearLogs();
      setLogs([]);
    } catch (err) {
      console.error('Failed to clear moderation logs', err);
    }
  }, []);

  // Listen for real‑time logs from backend
  useEffect(() => {
    const handleLogEntry = (data: any) => {
      // Only accept moderation category
      if (data?.category === 'moderation') {
        // Transform backend log shape to ModerationLogEntry if needed
        // Backend sends: { id, timestamp, category, message, type, meta: { action, targetUserName, duration, reason, undone, ... } }
        const newEntry: ModerationLogEntry = {
          id: data.id || String(Date.now()),
          action: data.meta?.action || 'unknown',
          broadcasterId: data.meta?.broadcasterId || '',
          targetUserId: data.meta?.targetUserId || '',
          targetUserName: data.meta?.targetUserName || 'Unknown',
          duration: data.meta?.duration || null,
          reason: data.meta?.reason || null,
          category: 'moderation',
          message: data.message,
          timestamp: data.timestamp,
          undone: data.meta?.undone || false,
          undoneAt: data.meta?.undoneAt || null,
        };
        addLog(newEntry);
      }
    };

    // Assume window.backendAPI.on is available (Electron IPC)
    window.backendAPI?.on?.('log:entry', handleLogEntry);
    return () => window.backendAPI?.off?.('log:entry', handleLogEntry);
  }, [addLog]);

  // Initial fetch
  useEffect(() => {
    fetchHistoricalLogs();
  }, [fetchHistoricalLogs]);

  return (
    <ModerationLogContext.Provider value={{ logs, addLog, clearLogs, isLoading }}>
      {children}
    </ModerationLogContext.Provider>
  );
};

export const useModerationLog = () => {
  const context = useContext(ModerationLogContext);
  if (!context) throw new Error('useModerationLog must be used within ModerationLogProvider');
  return context;
};