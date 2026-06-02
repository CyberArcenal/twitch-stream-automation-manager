import React, { useState, useEffect } from "react";
import { MessageCircle } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { chatHistoryAPI } from "../../../api/core/chatHistory";

interface ChatHeatmapCardProps {
  channelName: string;
}

export const ChatHeatmapCard: React.FC<ChatHeatmapCardProps> = ({ channelName }) => {
  const [data, setData] = useState<{ hour: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!channelName) return;
    const fetchHeatmap = async () => {
      try {
        const res = await chatHistoryAPI.getHourlyActivity(channelName, 7);
        const hourly = res.data || {};
        const chartData = Array.from({ length: 24 }, (_, i) => ({
          hour: `${i}:00`,
          count: hourly[i] || 0,
        }));
        setData(chartData);
      } catch (err) {
        console.error("Failed to fetch chat heatmap", err);
      } finally {
        setLoading(false);
      }
    };
    fetchHeatmap();
  }, [channelName]);

  if (loading) {
    return <div className="bg-[var(--card-bg)] rounded-xl p-5 animate-pulse h-96"></div>;
  }

  return (
    <div className="bg-[var(--card-bg)] rounded-xl shadow-md p-5 border border-[var(--card-bg)]">
      <div className="flex items-center gap-3 mb-4">
        <MessageCircle className="w-5 h-5 text-[#9147ff]" />
        <h3 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider">
          Chat Activity (Last 7 Days)
        </h3>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2e" />
          <XAxis dataKey="hour" tick={{ fill: "#adadb8" }} interval={3} tickLine={false} />
          <YAxis tick={{ fill: "#adadb8" }} tickLine={false} />
          <Tooltip
            contentStyle={{
              backgroundColor: "#1f1f23",
              border: "1px solid #2a2a2e",
              borderRadius: "8px",
            }}
          />
          <Bar dataKey="count" fill="#9147ff" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};