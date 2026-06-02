import React, { useState, useEffect } from "react";
import { Star, Bitcoin } from "lucide-react";
import { userAPI } from "../../../api/core/user";


interface SubscriberStatsCardProps {
  broadcasterId: string;
}

export const SubscriberStatsCard: React.FC<SubscriberStatsCardProps> = ({ broadcasterId }) => {
  const [subCount, setSubCount] = useState<number>(0);
  const [bitsTotal, setBitsTotal] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!broadcasterId) return;
    const fetchData = async () => {
      try {
        // Get subscribers list (requires 'channel:read:subscriptions')
        const subsRes = await userAPI.getUserSubscriptions();
        const subs = subsRes.data?.data || [];
        setSubCount(subs.length);

        // Bits leaderboard (requires 'bits:read')
        // Assuming you have a method in twitchApiService
        const bitsRes = await (window as any).backendAPI.twitchApi?.getBitsLeaderboard?.(broadcasterId, 1);
        setBitsTotal(bitsRes?.data?.data?.[0]?.total || 0);
      } catch (err) {
        console.warn("Failed to fetch subscriber/bits data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [broadcasterId]);

  if (loading) {
    return <div className="bg-[var(--card-bg)] rounded-xl p-5 animate-pulse h-32"></div>;
  }

  return (
    <div className="bg-[var(--card-bg)] rounded-xl shadow-md p-5 border border-[var(--card-bg)]">
      <div className="flex items-center gap-3 mb-4">
        <Star className="w-5 h-5 text-[#9147ff]" />
        <h3 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider">
          Subscribers & Bits
        </h3>
      </div>
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-xs text-[var(--text-secondary)]">Active Subscribers</span>
          <span className="text-xl font-bold text-[var(--text-primary)]">{subCount.toLocaleString()}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs text-[var(--text-secondary)] flex items-center gap-1"><Bitcoin className="w-3 h-3" /> Bits Used (Week)</span>
          <span className="text-xl font-bold text-[var(--text-primary)]">{bitsTotal.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
};