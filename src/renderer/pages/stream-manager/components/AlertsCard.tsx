import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserPlus, Star, Rocket, Bell, BellOff, Flame, FileText } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useAlertsFeed } from "../hooks/useAlertsFeed";
import { useAlertSettings } from "../hooks/useAlertSettings";
import { useAutomationLog } from "../../../contexts/AutomationLogContext";

interface AlertsCardProps {
  isLive: boolean;
  channelId?: string;
  fromModeration?: boolean;
}

const AlertsCard: React.FC<AlertsCardProps> = ({ isLive, channelId, fromModeration }) => {
  const navigate = useNavigate();
  const { events, clearEvents } = useAlertsFeed(channelId || "");
  const { soundEnabled } = useAlertSettings();
  const [alertsActive, setAlertsActive] = useState(true);
  const [logToAutomation, setLogToAutomation] = useState(() => {
    const saved = localStorage.getItem("alertsCardLogToAutomation");
    return saved ? JSON.parse(saved) : false;
  });
  const { addLog, logs: automationLogs, clearLogs } = useAutomationLog();

  // Use a ref to store IDs of events already logged
  const loggedEventIds = useRef<Set<string>>(new Set());

  const latestEvents = events.slice(0, 5);
  const displayLogs = logToAutomation ? automationLogs.slice(0, 5) : latestEvents;

  // Save toggle state to localStorage
  useEffect(() => {
    localStorage.setItem("alertsCardLogToAutomation", JSON.stringify(logToAutomation));
  }, [logToAutomation]);

  // Handle toggle
  const handleToggleLogging = () => {
    const newState = !logToAutomation;
    setLogToAutomation(newState);
    if (newState) {
      addLog("✅ Alert logging enabled – future alerts will appear here", "info");
    }
  };

  // Log new events (those not yet logged)
  useEffect(() => {
    if (!logToAutomation) return;
    
    // Find events that haven't been logged yet
    events.forEach(event => {
      if (!loggedEventIds.current.has(event.id)) {
        addLog(`Alert: ${event.message}`, "info");
        loggedEventIds.current.add(event.id);
      }
    });
  }, [events, logToAutomation, addLog]);

  // Clear logged IDs when events are cleared (optional)
  const handleClearEvents = () => {
    if (logToAutomation) {
      clearLogs();
    } else {
      clearEvents();
    }
    loggedEventIds.current.clear();
  };

  // Play sound when new event arrives
  const playAlertSound = () => {
    if (!soundEnabled) return;
    const audio = new Audio("/sounds/alert.mp3");
    audio.volume = 0.5;
    audio.play().catch((e) => console.log("Audio play failed", e));
  };

  useEffect(() => {
    if (events.length > 0 && soundEnabled) {
      playAlertSound();
    }
  }, [events.length, soundEnabled]);

  const getIcon = (type: string) => {
    switch (type) {
      case "follow": return <UserPlus className="w-4 h-4 text-green-400" />;
      case "subscribe": return <Star className="w-4 h-4 text-purple-400" />;
      case "raid": return <Rocket className="w-4 h-4 text-orange-400" />;
      case "hype_train": return <Flame className="w-4 h-4 text-red-400" />;
      default: return <Bell className="w-4 h-4 text-yellow-400" />;
    }
  };

  const handleEventClick = (event: any) => {
    switch (event.type) {
      case "follow": navigate("/analytics"); break;
      case "subscribe": navigate("/analytics"); break;
      default: console.log("Event clicked", event);
    }
  };

  return (
    <div className={`bg-[var(--card-bg)] rounded-xl shadow-lg border border-[var(--border-color)] flex flex-col overflow-hidden flex-1 min-w-[300px] ${fromModeration? '': 'max-h-[330px]'}`}>
      <div className="p-3 border-b border-[var(--border-color)] flex justify-between items-center">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">Alerts</h3>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1 text-xs text-[var(--text-secondary)] cursor-pointer">
            <FileText className="w-3 h-3" />
            <span>Log to automation</span>
            <button
              onClick={handleToggleLogging}
              className={`relative w-8 h-4 rounded-full transition-colors ${logToAutomation ? "bg-[var(--primary-color)]" : "bg-[var(--input-border)]"} ml-1`}
            >
              <span className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform ${logToAutomation ? "translate-x-4" : ""}`} />
            </button>
          </label>
          <button
            onClick={() => setAlertsActive(!alertsActive)}
            className="px-2 py-0.5 rounded text-xs bg-[var(--btn-secondary-bg)] hover:bg-[var(--btn-secondary-hover)] transition"
          >
            {alertsActive ? <Bell className="w-3 h-3" /> : <BellOff className="w-3 h-3" />}
          </button>
        </div>
      </div>
      <div className="flex-1 p-3 space-y-2 overflow-y-auto">
        {!isLive && !logToAutomation ? (
          <p className="text-center text-[var(--text-secondary)] text-sm italic">No live stream → no alerts</p>
        ) : displayLogs.length === 0 ? (
          <p className="text-center text-[var(--text-secondary)] text-sm italic">
            {logToAutomation ? "No automation logs" : "No recent alerts"}
          </p>
        ) : logToAutomation ? (
          automationLogs.slice(0, 5).map((log) => (
            <div
              key={log.id}
              className="flex items-start gap-2 text-sm p-1 rounded"
            >
              <FileText className="w-4 h-4 mt-0.5 flex-shrink-0"
                style={{
                  color: log.type === "error" ? "#f87171" : log.type === "success" ? "#4ade80" : "#fbbf24"
                }}
              />
              <div className="flex-1">
                <span className="text-[var(--text-primary)]">{log.message}</span>
                <span className="text-[var(--text-secondary)] text-xs ml-2">
                  {log.timestamp.toLocaleTimeString()}
                </span>
              </div>
            </div>
          ))
        ) : (
          latestEvents.map((event) => (
            <div
              key={event.id}
              className="flex items-start gap-2 text-sm cursor-pointer hover:bg-[var(--btn-secondary-bg)] p-1 rounded transition"
              onClick={() => handleEventClick(event)}
            >
              {getIcon(event.type)}
              <div className="flex-1">
                <span className="text-[var(--text-primary)]">{event.message}</span>
                <span className="text-[var(--text-secondary)] text-xs ml-2">
                  {formatDistanceToNow(event.timestamp, { addSuffix: true })}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
      <div className="p-3 border-t border-[var(--border-color)]">
        <button
          onClick={handleClearEvents}
          className="w-full text-center text-sm bg-[var(--primary-color)] py-1.5 rounded-lg hover:bg-[#772ce8] transition"
        >
          Clear Alerts
        </button>
      </div>
    </div>
  );
};

export default AlertsCard;