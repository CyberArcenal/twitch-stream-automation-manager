import React, { useState, useEffect } from "react";
import { Film, Eye, Calendar } from "lucide-react";
import { clipsAPI, type Clip } from "../../../api/core/clips";
import { formatDistanceToNow } from "date-fns";

interface TopClipsCardProps {
  broadcasterId: string;
}

export const TopClipsCard: React.FC<TopClipsCardProps> = ({ broadcasterId }) => {
  const [clips, setClips] = useState<Clip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!broadcasterId) return;
    const fetchClips = async () => {
      try {
        const res = await clipsAPI.getTopClips(undefined, broadcasterId, "week", 5);
        setClips(res.data?.data || []);
      } catch (err) {
        console.error("Failed to fetch top clips", err);
      } finally {
        setLoading(false);
      }
    };
    fetchClips();
  }, [broadcasterId]);

  if (loading) {
    return <div className="bg-[var(--card-bg)] rounded-xl p-5 animate-pulse h-64"></div>;
  }

  return (
    <div className="bg-[var(--card-bg)] rounded-xl shadow-md p-5 border border-[var(--card-bg)]">
      <div className="flex items-center gap-3 mb-4">
        <Film className="w-5 h-5 text-[#9147ff]" />
        <h3 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider">
          Top Clips (Last 7 Days)
        </h3>
      </div>
      {clips.length === 0 ? (
        <div className="text-center text-[var(--text-secondary)] py-4">No clips available</div>
      ) : (
        <div className="space-y-3 max-h-72 overflow-y-auto">
          {clips.map((clip) => (
            <div key={clip.id} className="flex items-start gap-3 border-b border-[var(--card-bg)] pb-2 last:border-0">
              <img
                src={clip.thumbnail_url}
                alt={clip.title}
                className="w-16 h-9 rounded object-cover"
              />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-[var(--text-primary)] truncate">{clip.title}</div>
                <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)] mt-1">
                  <Eye className="w-3 h-3" /> {clip.view_count.toLocaleString()}
                  <Calendar className="w-3 h-3 ml-2" /> {formatDistanceToNow(new Date(clip.created_at), { addSuffix: true })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};