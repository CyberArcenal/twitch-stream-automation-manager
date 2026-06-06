// src/renderer/contexts/AutomationLogContext.tsx
import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';

export interface AutomationLogEntry {
  id: string;          // Use backend id for consistency and deduplication
  timestamp: Date;
  message: string;
  type: 'info' | 'success' | 'error' | 'warning';
}

interface AutomationLogContextType {
  logs: AutomationLogEntry[];
  addLog: (message: string, type: AutomationLogEntry['type'], backendId?: string, timestamp?: Date) => void;
  clearLogs: () => void;
}

const AutomationLogContext = createContext<AutomationLogContextType | undefined>(undefined);

export const AutomationLogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [logs, setLogs] = useState<AutomationLogEntry[]>([]);
  // Keep track of seen backend IDs to avoid duplicates (optional but safe)
  const seenIds = useRef<Set<string>>(new Set());

  const addLog = useCallback((
    message: string,
    type: AutomationLogEntry['type'] = 'info',
    backendId?: string,
    timestamp?: Date
  ) => {
    // Use backend-provided id if available, otherwise generate a fallback
    const id = backendId || `${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const finalTimestamp = timestamp || new Date();

    setLogs((prev) => {
      // If this ID already exists, ignore duplicate
      if (prev.some(log => log.id === id)) {
        return prev;
      }
      // Keep only last 100 logs (adjust as needed)
      const newLog: AutomationLogEntry = { id, timestamp: finalTimestamp, message, type };
      return [newLog, ...prev.slice(0, 99)];
    });
    seenIds.current.add(id);
  }, []);

  const clearLogs = useCallback(() => {
    setLogs([]);
    seenIds.current.clear();
  }, []);

  // Listen to unified log:entry channel, filter for automation category
  useEffect(() => {
    const handleBackendLog = (data: any) => {
      if (data?.category === 'automation') {
        // Use backend id and timestamp for deduplication
        const backendId = data.id;
        const timestamp = data.timestamp ? new Date(data.timestamp) : new Date();
        addLog(data.message, data.type || 'info', backendId, timestamp);
      }
    };
    window.backendAPI?.on?.('log:entry', handleBackendLog);
    return () => window.backendAPI?.off?.('log:entry', handleBackendLog);
  }, [addLog]);

  return (
    <AutomationLogContext.Provider value={{ logs, addLog, clearLogs }}>
      {children}
    </AutomationLogContext.Provider>
  );
};

export const useAutomationLog = () => {
  const context = useContext(AutomationLogContext);
  if (!context) throw new Error('useAutomationLog must be used within AutomationLogProvider');
  return context;
};