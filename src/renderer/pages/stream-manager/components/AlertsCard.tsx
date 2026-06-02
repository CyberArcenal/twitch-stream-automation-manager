import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserPlus, Star, Rocket, Bell, BellOff, Flame } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useAlertsFeed } from "../hooks/useAlertsFeed";
import { useAlertSettings } from "../hooks/useAlertSettings";
import { SkeletonCard } from "../../../components/UI/SkeletonCard";

interface AlertsCardProps {
  isLive: boolean;
  channelId?: string;
}

const AlertsCard: React.FC<AlertsCardProps> = ({ isLive, channelId }) => {
  const navigate = useNavigate();
  const { events, clearEvents } = useAlertsFeed(channelId || "");
  const { soundEnabled } = useAlertSettings(); // we'll use soundEnabled for playing sound
  const [alertsActive, setAlertsActive] = useState(true);
  const latestEvents = events.slice(0, 5);

  // Function to play a short sound (if soundEnabled)
  const playAlertSound = () => {
    if (!soundEnabled) return;
    const audio = new Audio("/sounds/alert.mp3"); // place a sound file in public/sounds/
    audio.volume = 0.5;
    audio.play().catch((e) => console.log("Audio play failed", e));
  };

  // When a new event is added, play sound
  React.useEffect(() => {
    if (events.length > 0 && soundEnabled) {
      playAlertSound();
    }
  }, [events.length, soundEnabled]);

  const getIcon = (type: string) => {
    switch (type) {
      case "follow":
        return <UserPlus className="w-4 h-4 text-green-400" />;
      case "subscribe":
        return <Star className="w-4 h-4 text-purple-400" />;
      case "raid":
        return <Rocket className="w-4 h-4 text-orange-400" />;
      case "hype_train":
        return <Flame className="w-4 h-4 text-red-400" />;
      default:
        return <Bell className="w-4 h-4 text-yellow-400" />;
    }
  };

  const handleEventClick = (event: any) => {
    switch (event.type) {
      case "follow":
        navigate("/analytics");
        break;
      case "subscribe":
        navigate("/analytics");
        break;
      case "raid":
        // Could open a modal or navigate to a raid info page
        console.log("Raid event clicked", event);
        break;
      case "hype_train":
        console.log("Hype train event clicked", event);
        break;
      default:
        break;
    }
  };

  if (!channelId) {
    return <SkeletonCard lines={3} />;
  }

  return (
    <div className="bg-[var(--card-bg)] rounded-xl shadow-lg border border-[var(--border-color)] flex flex-col overflow-hidden flex-1 min-w-[300px]">
      <div className="p-3 border-b border-[var(--border-color)] flex justify-between items-center">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">
          Alerts
        </h3>
        <button
          onClick={() => setAlertsActive(!alertsActive)}
          className="px-2 py-0.5 rounded text-xs bg-[var(--btn-secondary-bg)] hover:bg-[var(--btn-secondary-hover)] transition"
        >
          {alertsActive ? (
            <Bell className="w-3 h-3" />
          ) : (
            <BellOff className="w-3 h-3" />
          )}
        </button>
      </div>
      <div className="flex-1 p-3 space-y-2 overflow-y-auto">
        {!isLive ? (
          <p className="text-center text-[var(--text-secondary)] text-sm italic">
            No live stream → no alerts
          </p>
        ) : latestEvents.length === 0 ? (
          <p className="text-center text-[var(--text-secondary)] text-sm italic">
            No recent alerts
          </p>
        ) : (
          latestEvents.map((event) => (
            <div
              key={event.id}
              className="flex items-start gap-2 text-sm cursor-pointer hover:bg-[var(--btn-secondary-bg)] p-1 rounded transition"
              onClick={() => handleEventClick(event)}
            >
              {getIcon(event.type)}
              <div className="flex-1">
                <span className="text-[var(--text-primary)]">
                  {event.message}
                </span>
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
          onClick={clearEvents}
          className="w-full text-center text-sm bg-[#9147ff] py-1.5 rounded-lg hover:bg-[#772ce8] transition"
        >
          Clear Alerts
        </button>
      </div>
    </div>
  );
};

export default AlertsCard;
