import React, { useState, useEffect } from "react";
import { streamsAPI } from "../../api/core/streams";
import { followsAPI } from "../../api/core/follows";

import { useAuth } from "../../hooks/useAuth";
import { LiveMetricsCard } from "./components/LiveMetricsCard";
import { StreamHealthCard } from "./components/StreamHealthCard";
import { SubscriberStatsCard } from "./components/SubscriberStatsCard";
import { TopClipsCard } from "./components/TopClipsCard";
import { FollowerGrowthChart } from "./components/FollowerGrowthChart";
import { ChatHeatmapCard } from "./components/ChatHeatmapCard";
import { ExportButtons } from "./components/ExportButtons";
import LoadingSpinner from "../../components/Shared/LoadingSpinner";

const AnalyticsPage: React.FC = () => {
  const { user } = useAuth();
  const [broadcasterId, setBroadcasterId] = useState<string>("");
  const [currentViewers, setCurrentViewers] = useState<number>(0);
  const [followerCount, setFollowerCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  // Load broadcaster ID from logged‑in user
  useEffect(() => {
    if (user?.id) {
      setBroadcasterId(user.id);
    }
  }, [user]);

  // Poll live metrics every 30 seconds
  useEffect(() => {
    if (!broadcasterId) return;

    const fetchMetrics = async () => {
      try {
        // Current viewers
        const streamRes = await streamsAPI.getStreamByUserLogin(user?.login || "");
        const viewers = streamRes.data?.viewer_count || 0;
        setCurrentViewers(viewers);

        // Follower count
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
      <div className="flex items-center justify-center h-full">
       <LoadingSpinner/>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-[var(--background-color)] min-h-screen">
      {/* Page Title */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Analytics</h1>
        <p className="text-[var(--text-secondary)]">Understand your stream performance</p>
      </div>

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <LiveMetricsCard
          currentViewers={currentViewers}
          followerCount={followerCount}
        />
        <StreamHealthCard />
        <SubscriberStatsCard broadcasterId={broadcasterId} />
        <TopClipsCard broadcasterId={broadcasterId} />
      </div>

      {/* Charts & Graphs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <FollowerGrowthChart broadcasterId={broadcasterId} />
        <ChatHeatmapCard channelName={user?.login || ""} />
      </div>

      {/* Export Actions */}
      <div className="flex justify-end">
        <ExportButtons />
      </div>
    </div>
  );
};

export default AnalyticsPage;