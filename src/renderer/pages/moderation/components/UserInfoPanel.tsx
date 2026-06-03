import React, { useState, useEffect } from "react";
import { User, Calendar, Award, AlertTriangle } from "lucide-react";
import { userAPI } from "../../../api/core/user";
import { followsAPI } from "../../../api/core/follows";
import { moderationLogAPI } from "../../../api/core/moderationLog";
import { formatDistanceToNow, format } from "date-fns";

interface UserInfoPanelProps {
  broadcasterId: string;
  userId: string;
  userName: string;
}

export const UserInfoPanel: React.FC<UserInfoPanelProps> = ({
  broadcasterId,
  userId,
  userName,
}) => {
  const [badges, setBadges] = useState<{ global: any[]; channel: any[] }>({
    global: [],
    channel: [],
  });
  const [followDate, setFollowDate] = useState<string | null>(null);
  const [subTier, setSubTier] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Badges
        const badgesRes = await userAPI.getUserBadges(userId);
        if (badgesRes.status) setBadges(badgesRes.data);

        // Follow date
        const followRes = await followsAPI.getFollowDate(broadcasterId, userId);
        if (followRes.status && followRes.data) setFollowDate(followRes.data);

        // Sub tier (check if user subscribes to broadcaster)
        // Requires 'channel:read:subscriptions' – will work only for broadcaster's own channel
        const subsRes = await userAPI.getUserSubscriptions();
        const sub = subsRes.data?.data?.find((s: any) => s.user_id === userId);
        if (sub) setSubTier(sub.tier);

        // Warning history
        const warnsRes = await moderationLogAPI.getUserWarnings(userId);
        if (warnsRes.status) setWarnings(warnsRes.data || []);
      } catch (err) {
        console.error("Failed to load user info", err);
      } finally {
        setLoading(false);
      }
    };
    if (userId) fetchData();
  }, [userId, broadcasterId]);

  if (loading) {
    return (
      <div className="bg-[var(--card-bg)] rounded-xl p-5 animate-pulse h-64"></div>
    );
  }

  return (
    <div className="bg-[var(--card-bg)] rounded-xl shadow-md border border-[var(--card-bg)] p-5">
      <div className="flex items-center gap-3 mb-4">
        <User className="w-5 h-5 text-[#9147ff]" />
        <h3 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider">
          User Info: {userName}
        </h3>
      </div>
      <div className="space-y-3">
        {/* Badges */}
        <div className="flex flex-wrap gap-2">
          {badges.global.slice(0, 5).map((badge) => (
            <span
              key={badge.set_id}
              className="px-2 py-0.5 bg-[#2a2a2e] rounded text-xs text-[var(--text-primary)]"
            >
              {badge.set_id}
            </span>
          ))}
          {badges.channel.slice(0, 3).map((badge) => (
            <span
              key={badge.set_id}
              className="px-2 py-0.5 bg-[var(--primary-color)]/20 rounded text-xs text-[#9147ff]"
            >
              {badge.set_id}
            </span>
          ))}
        </div>

        {/* Follow date */}
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="w-4 h-4 text-[var(--text-secondary)]" />
          <span className="text-[var(--text-primary)]">
            Followed:{" "}
            {followDate
              ? formatDistanceToNow(new Date(followDate), { addSuffix: true })
              : "Not following"}
          </span>
        </div>

        {/* Sub tier */}
        {subTier && (
          <div className="flex items-center gap-2 text-sm">
            <Award className="w-4 h-4 text-purple-400" />
            <span className="text-[var(--text-primary)]">
              Subscriber: Tier {parseInt(subTier) / 1000}
            </span>
          </div>
        )}

        {/* Warnings */}
        <div>
          <div className="flex items-center gap-2 text-sm mb-2">
            <AlertTriangle className="w-4 h-4 text-yellow-400" />
            <span className="text-[var(--text-primary)]">Warnings ({warnings.length})</span>
          </div>
          {warnings.length === 0 ? (
            <p className="text-xs text-[var(--text-secondary)]">No previous timeouts</p>
          ) : (
            <ul className="space-y-1 text-xs text-[var(--text-secondary)] max-h-32 overflow-y-auto">
              {warnings.slice(0, 5).map((w) => (
                <li key={w.id}>
                  {format(new Date(w.timestamp), "MMM d, HH:mm")} – {w.reason || "No reason"} ({w.duration}s)
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};