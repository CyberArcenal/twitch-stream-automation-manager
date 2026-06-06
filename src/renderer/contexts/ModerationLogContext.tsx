// src/renderer/contexts/ModerationLogContext.tsx
import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
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
  // Track seen log IDs to avoid duplicates (optional, but adds extra safety)
  const seenIds = useRef<Set<string>>(new Set());

  const fetchHistoricalLogs = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await moderationLogAPI.getLogs();
      if (res.status && res.data) {
        // Clear seen IDs and re-populate
        seenIds.current.clear();
        res.data.forEach(log => seenIds.current.add(log.id));
        setLogs(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch moderation logs', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Add a single log – skip if we already have the same ID
  const addLog = useCallback((entry: ModerationLogEntry) => {
    setLogs(prev => {
      // If this ID already exists, ignore the duplicate
      if (prev.some(log => log.id === entry.id)) {
        return prev;
      }
      // Keep only last 100 entries (adjust as needed)
      return [entry, ...prev.slice(0, 99)];
    });
    // Also track in ref to prevent future duplicates from rapid fire
    seenIds.current.add(entry.id);
  }, []);

  const clearLogs = useCallback(async () => {
    try {
      await moderationLogAPI.clearLogs();
      setLogs([]);
      seenIds.current.clear();
    } catch (err) {
      console.error('Failed to clear moderation logs', err);
    }
  }, []);

  // Listen for real‑time logs from backend
  useEffect(() => {
    const handleLogEntry = (data: any) => {
      // Only accept moderation category
      if (data?.category !== 'moderation') return;

      // Transform backend log shape to ModerationLogEntry
      const newEntry: ModerationLogEntry = {
        id: data.id || String(Date.now()),
        action: data.action || 'unknown',
        broadcasterId: data.broadcasterId || '',
        targetUserId: data.targetUserId || '',
        targetUserName: data.targetUserName || 'Unknown',
        duration: data.duration ?? null,
        reason: data.reason ?? null,
        category: 'moderation',
        message: data.message,
        timestamp: data.timestamp,
        undone: data.undone ?? false,
        undoneAt: data.undoneAt ?? null,
      };

      // addLog already deduplicates by ID
      addLog(newEntry);
    };

    // Use a stable reference for the listener so that `off` works correctly
    window.backendAPI?.on?.('log:entry', handleLogEntry);
    return () => {
      window.backendAPI?.off?.('log:entry', handleLogEntry);
    };
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