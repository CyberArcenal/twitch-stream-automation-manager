import { useState, useEffect } from "react";
import { useAutomationLog } from "../../../contexts/AutomationLogContext";
import { streamManagerAPI } from "../../../api/core/streamManager";

export const useAutomationRunner = () => {
  const [automationRunning, setAutomationRunning] = useState(false);
  const { addLog } = useAutomationLog();

  useEffect(() => {
    const load = async () => {
      const running = await streamManagerAPI.isAutomationRunning();
      setAutomationRunning(running);
    };
    load();
  }, []);

  const startAutomation = async (fullConfig: any) => {
    const res = await streamManagerAPI.startAutomation(fullConfig);
    if (res.status) {
      setAutomationRunning(true);
      addLog("Automation system started", "success");
      return true;
    } else {
      addLog(`Failed to start automation: ${res.message}`, "error");
      return false;
    }
  };

  const stopAutomation = async () => {
    const res = await streamManagerAPI.stopAutomation();
    if (res.status) {
      setAutomationRunning(false);
      addLog("Automation system stopped", "info");
      return true;
    } else {
      addLog(`Failed to stop automation: ${res.message}`, "error");
      return false;
    }
  };

  return {
    automationRunning,
    setAutomationRunning,
    startAutomation,
    stopAutomation,
  };
};
