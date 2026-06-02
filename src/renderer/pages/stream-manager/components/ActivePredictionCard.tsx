import React, { useState, useEffect } from 'react';
import { TrendingUp, Users } from 'lucide-react';
import { predictionsAPI } from '../../../api/core/predictions';

interface ActivePredictionCardProps {
  broadcasterId: string;
}

export const ActivePredictionCard: React.FC<ActivePredictionCardProps> = ({ broadcasterId }) => {
  const [prediction, setPrediction] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      if (!broadcasterId) return;
      try {
        const res = await predictionsAPI.getActive(broadcasterId);
        if (res.status && res.data.length > 0) {
          setPrediction(res.data[0]);
        } else {
          setPrediction(null);
        }
      } catch (err) {
        console.error('Failed to fetch active prediction', err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
    const interval = setInterval(fetch, 10000);
    return () => clearInterval(interval);
  }, [broadcasterId]);

  if (loading) return <div className="bg-[var(--card-bg)] rounded-xl p-3 animate-pulse h-20"></div>;
  if (!prediction) return null; // or show a placeholder

  return (
    <div className="bg-[var(--card-bg)] rounded-xl shadow-lg border border-[var(--border-color)] p-3">
      <div className="flex items-center gap-2 mb-2">
        <TrendingUp className="w-4 h-4 text-[#9147ff]" />
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">Active Prediction</h3>
      </div>
      <div className="text-sm text-[var(--text-primary)] font-medium mb-1">{prediction.title}</div>
      <div className="space-y-1">
        {prediction.outcomes.map((outcome: any) => (
          <div key={outcome.id} className="flex justify-between text-xs">
            <span>{outcome.title}</span>
            <span className="text-[var(--text-secondary)]">{outcome.channel_points} pts ({outcome.users} users)</span>
          </div>
        ))}
      </div>
    </div>
  );
};