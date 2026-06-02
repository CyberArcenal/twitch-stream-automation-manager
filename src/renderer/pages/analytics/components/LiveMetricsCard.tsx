import React from "react";
import { Eye, Users } from "lucide-react";

interface LiveMetricsCardProps {
  currentViewers: number;
  followerCount: number;
}

export const LiveMetricsCard: React.FC<LiveMetricsCardProps> = ({
  currentViewers,
  followerCount,
}) => {
  return (
    <div className="bg-[var(--card-bg)] rounded-xl shadow-md p-5 border border-[var(--card-bg)]">
      <div className="flex items-center gap-3 mb-4">
        <Eye className="w-5 h-5 text-[#9147ff]" />
        <h3 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider">
          Live Metrics
        </h3>
      </div>
      <div className="space-y-4">
        <div>
          <div className="text-xs text-[var(--text-secondary)] mb-1">Current Viewers</div>
          <div className="text-3xl font-bold text-[var(--text-primary)]">{currentViewers.toLocaleString()}</div>
        </div>
        <div>
          <div className="text-xs text-[var(--text-secondary)] mb-1">Total Followers</div>
          <div className="text-2xl font-semibold text-[var(--text-primary)]">{followerCount.toLocaleString()}</div>
        </div>
      </div>
    </div>
  );
};