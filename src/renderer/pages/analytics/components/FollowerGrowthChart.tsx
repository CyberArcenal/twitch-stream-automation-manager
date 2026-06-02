import React, { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { analyticsAPI } from "../../../api/core/analytics";
import { CalendarDays } from "lucide-react";

interface FollowerGrowthChartProps {
  broadcasterId: string;
}

export const FollowerGrowthChart: React.FC<FollowerGrowthChartProps> = () => {
  const [data, setData] = useState<{ date: string; followers: number }[]>([]);
  const [days, setDays] = useState<7 | 30 | 90>(30);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await analyticsAPI.getFollowerHistory(days);
        const formatted = (res.data || []).map((point) => ({
          date: new Date(point.timestamp).toLocaleDateString(),
          followers: point.followers,
        }));
        setData(formatted);
      } catch (err) {
        console.error("Failed to fetch follower history", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [days]);

  if (loading) {
    return <div className="bg-[var(--card-bg)] rounded-xl p-5 animate-pulse h-96"></div>;
  }

  return (
    <div className="bg-[var(--card-bg)] rounded-xl shadow-md p-5 border border-[var(--card-bg)]">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-[#9147ff]" />
          <h3 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider">
            Follower Growth
          </h3>
        </div>
        <div className="flex gap-2">
          {[7, 30, 90].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d as any)}
              className={`px-3 py-1 text-xs rounded-md transition ${
                days === d
                  ? "bg-[#9147ff] text-[var(--text-primary)]"
                  : "bg-[#2a2a2e] text-[var(--text-secondary)] hover:bg-[#3a3a4a]"
              }`}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2e" />
          <XAxis dataKey="date" tick={{ fill: "#adadb8" }} tickLine={false} />
          <YAxis tick={{ fill: "#adadb8" }} tickLine={false} />
          <Tooltip
            contentStyle={{
              backgroundColor: "#1f1f23",
              border: "1px solid #2a2a2e",
              borderRadius: "8px",
              color: "#efeff1",
            }}
          />
          <Line
            type="monotone"
            dataKey="followers"
            stroke="#9147ff"
            strokeWidth={2}
            dot={{ fill: "#9147ff", r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};