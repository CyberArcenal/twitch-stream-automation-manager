// src/renderer/pages/stream-manager/index.tsx
import React from "react";
import { useLiveStatus } from "./hooks/useLiveStatus";
import LoadingSpinner from "../../components/Shared/LoadingSpinner";
import MainVideoCard from "./components/MainVideoCard";
import QuickActionsCard from "./components/QuickActionsCard";
import ConnectionHubCard from "./components/ConnectionHubCard";
import ConnectedSoftwareCard from "./components/ConnectedSoftwareCard";
import StreamHealthCard from "./components/StreamHealthCard";
import ChatCard from "../../components/ChatCard";
import CustomAutomationsCard from "./components/CustomAutomationsCard";
import AlertsCard from "./components/AlertsCard";
import CollaborationCard from "./components/CollaborationCard";
import { StreamGoalsPreviewCard } from "./components/StreamGoalsPreviewCard";
import { ErrorBoundary } from "../../components/UI/ErrorBoundary";
import { ViewerListCard } from "./components/ViewerListCard";
import { ActivePredictionCard } from "./components/ActivePredictionCard";
import { AutomationLogProvider } from "../../contexts/AutomationLogContext";
// ❌ tanggalin: import { useDashboardLayout } from "../../contexts/DashboardLayoutContext";

const StreamManagerPage: React.FC = () => {
  const { isLive, streamData, loading, refresh } = useLiveStatus();
  // ❌ tanggalin: const { layout, isEditMode, toggleEditMode } = useDashboardLayout();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <LoadingSpinner size="medium" text="Loading stream manager..." />
      </div>
    );
  }

  const handleManageGoals = () => {
    const manageBtn = document.querySelector(
      '[data-goals-manage="true"]',
    ) as HTMLButtonElement;
    if (manageBtn) manageBtn.click();
  };

  return (
    <AutomationLogProvider>
      <div className="h-full min-h-full !p-4 bg-[var(--background-color)]">
        <div className="grid grid-cols-1 lg:grid-cols-[repeat(auto-fit,minmax(350px,1fr))] gap-4 h-full">
          {/* Column 1: Main Video Card */}
          <div className="flex flex-col gap-4 h-full">
            <ErrorBoundary>
              <MainVideoCard
                isLive={isLive || false}
                streamData={streamData}
                onRefresh={refresh}
              />
            </ErrorBoundary>
            {/* <ErrorBoundary>
              <ActivePredictionCard broadcasterId={streamData?.user_id} />
            </ErrorBoundary> */}
            <ErrorBoundary>
              <StreamGoalsPreviewCard onManageGoals={handleManageGoals} />
            </ErrorBoundary>
          </div>

          {/* Column 2: Connection Hub + Quick Actions + Alerts */}
          <div className="flex flex-col gap-4 h-full">
            {/* <ErrorBoundary>
              <ConnectionHubCard isLive={isLive || false} onRefresh={refresh} />
            </ErrorBoundary> */}
            <ErrorBoundary>
              <CollaborationCard />
            </ErrorBoundary>
            <ErrorBoundary>
              <ConnectedSoftwareCard isLive={isLive || false} />
            </ErrorBoundary>
            <ErrorBoundary>
              <QuickActionsCard isLive={isLive || false} />
            </ErrorBoundary>
            <ErrorBoundary>
              <AlertsCard
                isLive={isLive || false}
                channelId={streamData?.user_id}
              />
            </ErrorBoundary>
          </div>

          {/* Column 3: Stream Health + Viewer List + Chat */}
          <div className="flex flex-col gap-4 h-full">
            <ErrorBoundary>
              <StreamHealthCard isLive={isLive || false} />
            </ErrorBoundary>
            <ErrorBoundary>
              <ViewerListCard
                broadcasterId={streamData?.user_id || ""}
                moderatorId={streamData?.user_id || ""}
                isLive={isLive}
              />
            </ErrorBoundary>
            <ErrorBoundary>
              <ChatCard
                channelName={streamData?.user_login}
                broadcasterId={streamData?.user_id}
                isLive={isLive || false}
              />
            </ErrorBoundary>
          </div>

          {/* Column 4: Automations + Collaboration */}
          <div className="flex flex-col gap-4 h-full">
            <ErrorBoundary>
              <CustomAutomationsCard
                isLive={isLive || false}
                broadcasterId={streamData?.user_id}
                moderatorId={streamData?.user_id}
              />
            </ErrorBoundary>
          </div>
        </div>
      </div>
    </AutomationLogProvider>
  );
};

export default StreamManagerPage;
