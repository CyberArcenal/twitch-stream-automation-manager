// src/renderer/pages/creator-dashboard/index.tsx
import React, { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import { StreamInfoCard } from "./components/StreamInfoCard";
import { RecentActivityFeed } from "./components/RecentActivityFeed";
import { QuickActionsCard } from "./components/QuickActionsCard";
import { AlertsRemindersCard } from "./components/AlertsRemindersCard";
import { StreamGoalsCard } from "./components/StreamGoalsCard";
import { ErrorBoundary } from "../../components/UI/ErrorBoundary";
import LoadingSpinner from "../../components/Shared/LoadingSpinner";

const CreatorDashboard: React.FC = () => {
  const { user } = useAuth();
  const [broadcasterId, setBroadcasterId] = useState<string>("");

  useEffect(() => {
    if (user?.id) setBroadcasterId(user.id);
  }, [user]);

  if (!broadcasterId) {
    return (
      <div className="flex justify-center items-center h-full">
        <LoadingSpinner size="medium" text="Loading dashboard..." />
      </div>
    );
  }

  return (
    <div className="h-full min-h-full !p-4 bg-[var(--background-color)]">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
        {/* Left column */}
        <div className="flex flex-col gap-4 h-full">
          <ErrorBoundary>
            <StreamInfoCard broadcasterId={broadcasterId} />
          </ErrorBoundary>
          <ErrorBoundary>
            <RecentActivityFeed />
          </ErrorBoundary>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-4 h-full">
          <ErrorBoundary>
            <QuickActionsCard broadcasterId={broadcasterId} />
          </ErrorBoundary>
          <ErrorBoundary>
            <AlertsRemindersCard broadcasterId={broadcasterId} />
          </ErrorBoundary>
          <ErrorBoundary>
            <StreamGoalsCard broadcasterId={broadcasterId} />
          </ErrorBoundary>
        </div>
      </div>
    </div>
  );
};

export default CreatorDashboard;