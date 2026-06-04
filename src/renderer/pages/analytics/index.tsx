// src/renderer/pages/analytics/index.tsx
import React, { useState, useEffect } from "react";
import { streamsAPI } from "../../api/core/streams";
import { followsAPI } from "../../api/core/follows";
import { useAuth } from "../../hooks/useAuth";
import { ErrorBoundary } from "../../components/UI/ErrorBoundary";
import LoadingSpinner from "../../components/Shared/LoadingSpinner";
import { LiveMetricsCard } from "./components/LiveMetricsCard";
import { StreamHealthCard } from "./components/StreamHealthCard";
import { SubscriberStatsCard } from "./components/SubscriberStatsCard";
import { TopClipsCard } from "./components/TopClipsCard";
import { FollowerGrowthChart } from "./components/FollowerGrowthChart";
import { ChatHeatmapCard } from "./components/ChatHeatmapCard";
import { ExportButtons } from "./components/ExportButtons";

const AnalyticsPage: React.FC = () => {
  const { user } = useAuth();
  const [broadcasterId, setBroadcasterId] = useState<string>("");
  const [currentViewers, setCurrentViewers] = useState<number>(0);
  const [followerCount, setFollowerCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (user?.id) setBroadcasterId(user.id);
  }, [user]);

  // Poll live metrics every 30 seconds
  useEffect(() => {
    if (!broadcasterId) return;

    const fetchMetrics = async () => {
      try {
        const streamRes = await streamsAPI.getStreamByUserLogin(user?.login || "");
        const viewers = streamRes.data?.viewer_count || 0;
        setCurrentViewers(viewers);

        const followersRes = await followsAPI.getFollowers(broadcasterId);
        setFollowerCount(followersRes.data?.total || followersRes.data?.data?.length || 0);
      } catch (err) {
        console.error("Failed to fetch live metrics", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000);
    return () => clearInterval(interval);
  }, [broadcasterId, user?.login]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <LoadingSpinner size="medium" text="Loading analytics..." />
      </div>
    );
  }

  return (
    <div className="h-full min-h-full !p-4 bg-[var(--background-color)]">
      {/* Metrics row: 4 cards on large screens, wraps on smaller */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <ErrorBoundary>
          <LiveMetricsCard currentViewers={currentViewers} followerCount={followerCount} />
        </ErrorBoundary>
        <ErrorBoundary>
          <StreamHealthCard />
        </ErrorBoundary>
        <ErrorBoundary>
          <SubscriberStatsCard broadcasterId={broadcasterId} />
        </ErrorBoundary>
        <ErrorBoundary>
          <TopClipsCard broadcasterId={broadcasterId} />
        </ErrorBoundary>
      </div>

      {/* Charts row: two columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <ErrorBoundary>
          <FollowerGrowthChart broadcasterId={broadcasterId} />
        </ErrorBoundary>
        <ErrorBoundary>
          <ChatHeatmapCard channelName={user?.login || ""} />
        </ErrorBoundary>
      </div>

      {/* Export buttons row */}
      <div className="flex justify-end">
        <ErrorBoundary>
          <ExportButtons />
        </ErrorBoundary>
      </div>
    </div>
  );
};

export default AnalyticsPage;