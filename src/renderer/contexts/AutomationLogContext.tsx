// src/renderer/contexts/AutomationLogContext.tsx
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

export interface AutomationLogEntry {
  id: string;
  timestamp: Date;
  message: string;
  type: 'info' | 'success' | 'error' | 'warning';
}

interface AutomationLogContextType {
  logs: AutomationLogEntry[];
  addLog: (message: string, type: AutomationLogEntry['type']) => void;
  clearLogs: () => void;
}

const AutomationLogContext = createContext<AutomationLogContextType | undefined>(undefined);

export const AutomationLogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [logs, setLogs] = useState<AutomationLogEntry[]>([]);

  const addLog = useCallback((message: string, type: AutomationLogEntry['type'] = 'info') => {
    const newLog: AutomationLogEntry = {
      id: Date.now().toString(),
      timestamp: new Date(),
      message,
      type,
    };
    setLogs((prev) => [newLog, ...prev.slice(0, 99)]);
  }, []);

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  // Listen to unified log:entry channel, filter for automation category
  useEffect(() => {
    const handleBackendLog = (data: any) => {
      if (data?.category === 'automation') {
        addLog(data.message, data.type || 'info');
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