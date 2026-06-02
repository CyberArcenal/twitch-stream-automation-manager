// src/renderer/pages/stream-manager/index.tsx
import React from "react";
import { useLiveStatus } from "./hooks/useLiveStatus";
import LoadingSpinner from "../../components/Shared/LoadingSpinner";
import MainVideoCard from "./components/MainVideoCard";
import QuickActionsCard from "./components/QuickActionsCard";
import ConnectionHubCard from "./components/ConnectionHubCard";
import ConnectedSoftwareCard from "./components/ConnectedSoftwareCard";
import StreamHealthCard from "./components/StreamHealthCard";
import ChatCard from "./components/ChatCard";
import CustomAutomationsCard from "./components/CustomAutomationsCard";
import AlertsCard from "./components/AlertsCard";
import CollaborationCard from "./components/CollaborationCard";

const StreamManagerPage: React.FC = () => {
  const { isLive, streamData, loading, refresh } = useLiveStatus();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <LoadingSpinner size="medium" text="Loading stream manager..." />
      </div>
    );
  }

  return (
    <div className="h-full min-h-full overflow-auto p-4 bg-[var(--background-color)]">
      {/* 
        Grid: 
        - Single column on mobile.
        - On large screens, each column is at least 350px wide and expands to fill remaining space.
        - Columns automatically wrap to next row when needed.
        - auto-rows-[1fr] makes rows of equal height (optional, can be removed).
      */}
      <div className="grid grid-cols-1 lg:grid-cols-[repeat(auto-fit,minmax(350px,1fr))] gap-4 auto-rows-[1fr] h-full">
        {/* Column 1: Main Video Card */}
        <div className="h-full">
          <MainVideoCard
            isLive={isLive || false}
            streamData={streamData}
            onRefresh={refresh}
          />
        </div>

        {/* Column 2: Connection Hub + Quick Actions + Alerts */}
        <div className="flex flex-col gap-4 h-full">
          <ConnectionHubCard isLive={isLive || false} onRefresh={refresh} />
          <ConnectedSoftwareCard isLive={isLive || false} />
          <QuickActionsCard isLive={isLive || false} />
          <AlertsCard isLive={isLive || false} channelId={streamData?.user_id} />
        </div>

        {/* Column 3: Stream Health + Chat */}
        <div className="flex flex-col gap-4 h-full">
          <StreamHealthCard isLive={isLive || false} />
          <ChatCard
            channelName={streamData?.user_login}
            broadcasterId={streamData?.user_id}
            isLive={isLive || false}
          />
        </div>

        {/* Column 4: Automations + Collaboration */}
        <div className="flex flex-col gap-4 h-full">
          <CustomAutomationsCard isLive={isLive || false} />
          <CollaborationCard />
        </div>
      </div>
    </div>
  );
};

export default StreamManagerPage;