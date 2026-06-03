import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";

export interface AutomationLogEntry {
  id: string;
  timestamp: Date;
  message: string;
  type: "info" | "success" | "error" | "warning";
}

interface AutomationLogContextType {
  logs: AutomationLogEntry[];
  addLog: (message: string, type: AutomationLogEntry["type"]) => void;
  clearLogs: () => void;
}

const AutomationLogContext = createContext<
  AutomationLogContextType | undefined
>(undefined);

export const AutomationLogProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [logs, setLogs] = useState<AutomationLogEntry[]>([]);

  const addLog = useCallback(
    (message: string, type: AutomationLogEntry["type"] = "info") => {
      const newLog: AutomationLogEntry = {
        id: Date.now().toString(),
        timestamp: new Date(),
        message,
        type,
      };
      setLogs((prev) => [newLog, ...prev.slice(0, 99)]);
    },
    [],
  );

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  useEffect(() => {
    const handleBackendLog = (data: any) => {
      addLog(data.message, data.type);
    };
    window.backendAPI?.on?.("automation:log", handleBackendLog);
    return () => window.backendAPI?.off?.("automation:log", handleBackendLog);
  }, [addLog]);

  return (
    <AutomationLogContext.Provider value={{ logs, addLog, clearLogs }}>
      {children}
    </AutomationLogContext.Provider>
  );
};

export const useAutomationLog = () => {
  const context = useContext(AutomationLogContext);
  if (!context)
    throw new Error(
      "useAutomationLog must be used within AutomationLogProvider",
    );
  return context;
};
