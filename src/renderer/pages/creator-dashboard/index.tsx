import React, { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import { StreamInfoCard } from "./components/StreamInfoCard";
import { RecentActivityFeed } from "./components/RecentActivityFeed";
import { QuickActionsCard } from "./components/QuickActionsCard";
import { AlertsRemindersCard } from "./components/AlertsRemindersCard";
import { StreamGoalsCard } from "./components/StreamGoalsCard";
import LoadingSpinner from "../../components/Shared/LoadingSpinner";

const CreatorDashboard: React.FC = () => {
  const { user } = useAuth();
  const [broadcasterId, setBroadcasterId] = useState<string>("");
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    if (user?.id) setBroadcasterId(user.id);
  }, [user]);

  if (!broadcasterId) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingSpinner/>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-[var(--background-color)] min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Creator Dashboard</h1>
        <p className="text-[var(--text-secondary)]">
          Manage your stream and engage with your community
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Stream Info */}
        <div className="lg:col-span-2 space-y-6">
          <StreamInfoCard broadcasterId={broadcasterId} />
          <RecentActivityFeed />
        </div>

        {/* Right column: Quick Actions, Alerts, Goals */}
        <div className="space-y-6">
          <QuickActionsCard broadcasterId={broadcasterId} />
          <AlertsRemindersCard broadcasterId={broadcasterId} />
          <StreamGoalsCard broadcasterId={broadcasterId} />
        </div>
      </div>
    </div>
  );
};

export default CreatorDashboard;
