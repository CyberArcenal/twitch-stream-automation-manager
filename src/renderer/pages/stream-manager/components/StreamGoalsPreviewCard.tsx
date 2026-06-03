import React, { useState, useEffect, useCallback } from "react";
import { Target, Plus } from "lucide-react";
import { streamManagerAPI, type Goal } from "../../../api/core/streamManager";

interface StreamGoalsPreviewCardProps {
  onManageGoals?: () => void;
}

export const StreamGoalsPreviewCard: React.FC<StreamGoalsPreviewCardProps> = ({ onManageGoals }) => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGoals = useCallback(async () => {
    try {
      const res = await streamManagerAPI.getGoals();
      if (res.status) {
        setGoals(res.data);
      }
    } catch (err) {
      console.error("Failed to fetch goals", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGoals();
    // Poll every 5 seconds to pick up new goals (since no real‑time event)
    const interval = setInterval(fetchGoals, 5000);
    return () => clearInterval(interval);
  }, [fetchGoals]);

  if (loading) {
    return (
      <div className="bg-[var(--card-bg)] rounded-xl p-3 animate-pulse">
        <div className="h-16 bg-[var(--input-bg)] rounded"></div>
      </div>
    );
  }

  if (goals.length === 0) {
    return (
      <div className="bg-[var(--card-bg)] rounded-xl p-3 border border-[var(--border-color)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-[#9147ff]" />
            <span className="text-xs text-[var(--text-secondary)]">No active goals</span>
          </div>
          <button
            onClick={onManageGoals}
            className="text-xs text-[#9147ff] hover:underline flex items-center gap-1"
          >
            <Plus className="w-3 h-3" /> Create goal
          </button>
        </div>
      </div>
    );
  }

  // Show up to 3 goals, scroll if more
  const displayGoals = goals.slice(0, 3);
  const hasMore = goals.length > 3;

  return (
    <div className="bg-[var(--card-bg)] rounded-xl p-3 border border-[var(--border-color)] space-y-2">
      <div className="flex justify-between items-center mb-1">
        <div className="flex items-center gap-1">
          <Target className="w-3 h-3 text-[#9147ff]" />
          <span className="text-xs font-medium text-[var(--text-primary)]">
            Stream Goals {goals.length > 0 && `(${goals.length})`}
          </span>
        </div>
        <button
          onClick={onManageGoals}
          className="text-xs text-[#9147ff] hover:underline"
        >
          Manage
        </button>
      </div>
      <div className="space-y-2 max-h-32 overflow-y-auto">
        {displayGoals.map((goal) => {
          const percent = Math.min(100, (goal.current / goal.target) * 100);
          return (
            <div key={goal.id} className="space-y-0.5">
              <div className="flex justify-between text-[10px]">
                <span className="text-[var(--text-primary)] truncate max-w-[100px]">
                  {goal.title}
                </span>
                <span className="text-[var(--text-secondary)]">
                  {goal.current} / {goal.target} {goal.unit}
                </span>
              </div>
              <div className="h-1.5 bg-[var(--input-border)] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[var(--primary-color)] rounded-full transition-all"
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          );
        })}
        {hasMore && (
          <div className="text-[10px] text-[var(--text-secondary)] text-center pt-1">
            +{goals.length - 3} more
          </div>
        )}
      </div>
    </div>
  );
};