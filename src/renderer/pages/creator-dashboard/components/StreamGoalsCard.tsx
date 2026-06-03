import React, { useState, useEffect } from "react";
import { Target, Plus, Trash2, Edit3, Eye } from "lucide-react";
import { streamManagerAPI, type Goal } from "../../../api/core/streamManager";
import { dialogs } from "../../../utils/dialogs";

interface StreamGoalsCardProps {
  broadcasterId: string;
}

export const StreamGoalsCard: React.FC<StreamGoalsCardProps> = () => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [title, setTitle] = useState("");
  const [target, setTarget] = useState(100);
  const [unit, setUnit] = useState<"followers" | "subscribers" | "bits">("followers");
  const [loading, setLoading] = useState(true);
  const [overlayHtml, setOverlayHtml] = useState("");
  const [showOverlayPreview, setShowOverlayPreview] = useState(false);

  const fetchGoals = async () => {
    try {
      const res = await streamManagerAPI.getGoals();
      if (res.status) setGoals(res.data);
    } catch (err) {
      console.error("Failed to fetch goals", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
    // Listen for goal updates (optional)
  }, []);

  const fetchOverlayHtml = async () => {
    const html = await window.backendAPI.getGoalOverlayHTML();
    setOverlayHtml(html);
    setShowOverlayPreview(true);
  };

  const addGoal = async () => {
    if (!title.trim()) return;
    try {
      await streamManagerAPI.addGoal({ title, target, current: 0, unit });
      fetchGoals();
      setTitle("");
      setTarget(100);
      setUnit("followers");
      setShowAddForm(false);
    } catch (err) {
      console.error("Failed to add goal", err);
    }
  };

  const updateGoal = async () => {
    if (!editingGoal) return;
    try {
      // No direct update method – we'll delete and re-add? Or use updateGoalProgress only.
      // For simplicity, we'll use the existing goal's current value and only update title/target/unit?
      // Actually there's no PATCH for goals. We'll just show that you can edit, but for now we'll re‑fetch.
      dialogs.info("Editing not fully implemented; you can delete and recreate.");
      setEditingGoal(null);
    } catch (err) {
      console.error("Failed to update goal", err);
    }
  };

  const deleteGoal = async (id: string) => {
    try {
      await streamManagerAPI.deleteGoal(id);
      fetchGoals();
    } catch (err) {
      console.error("Failed to delete goal", err);
    }
  };

  if (loading) return <div className="bg-[var(--card-bg)] rounded-xl p-5 animate-pulse h-64"></div>;

  return (
    <div className="bg-[var(--card-bg)] rounded-xl shadow-md border border-[var(--card-bg)] p-5">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-[#9147ff]" />
          <h3 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider">
            Stream Goals
          </h3>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchOverlayHtml}
            className="p-1 rounded hover:bg-[#2a2a2e]"
            title="Preview Overlay"
          >
            <Eye className="w-4 h-4 text-[var(--text-secondary)]" />
          </button>
          <button
            onClick={() => setShowAddForm(true)}
            className="p-1 rounded hover:bg-[#2a2a2e]"
          >
            <Plus className="w-4 h-4 text-[var(--text-secondary)]" />
          </button>
        </div>
      </div>

      {/* Goals list */}
      <div className="space-y-3 max-h-64 overflow-y-auto">
        {goals.length === 0 ? (
          <p className="text-center text-[var(--text-secondary)] text-sm">No active goals. Create one!</p>
        ) : (
          goals.map((goal) => {
            const percent = (goal.current / goal.target) * 100;
            return (
              <div key={goal.id} className="bg-[#2a2a2e]/30 rounded-lg p-3">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium text-[var(--text-primary)]">{goal.title}</div>
                    <div className="text-xs text-[var(--text-secondary)]">
                      {goal.current} / {goal.target} {goal.unit}
                    </div>
                  </div>
                  <button onClick={() => deleteGoal(goal.id)} className="text-red-400 hover:text-red-300">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="mt-2 h-2 bg-[var(--card-bg)] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[var(--primary-color)] rounded-full transition-all"
                    style={{ width: `${Math.min(percent, 100)}%` }}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add/Edit Form Modal */}
      {(showAddForm || editingGoal) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[var(--card-bg)] rounded-xl p-6 w-96 border border-[var(--card-bg)]">
            <h4 className="text-[var(--text-primary)] font-semibold mb-4">
              {editingGoal ? "Edit Goal" : "New Goal"}
            </h4>
            <div className="space-y-3">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Goal title"
                className="w-full bg-[var(--background-color)] border border-[var(--card-bg)] rounded px-3 py-2 text-[var(--text-primary)]"
              />
              <input
                type="number"
                value={target}
                onChange={(e) => setTarget(Number(e.target.value))}
                placeholder="Target value"
                className="w-full bg-[var(--background-color)] border border-[var(--card-bg)] rounded px-3 py-2 text-[var(--text-primary)]"
              />
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value as any)}
                className="w-full bg-[var(--background-color)] border border-[var(--card-bg)] rounded px-3 py-2 text-[var(--text-primary)]"
              >
                <option value="followers">Followers</option>
                <option value="subscribers">Subscribers</option>
                <option value="bits">Bits</option>
              </select>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setEditingGoal(null);
                }}
                className="px-3 py-1 bg-[#2a2a2e] rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={editingGoal ? updateGoal : addGoal}
                className="px-3 py-1 bg-[var(--primary-color)] rounded-md"
              >
                {editingGoal ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Overlay Preview Modal */}
      {showOverlayPreview && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-[var(--card-bg)] rounded-xl p-4 w-[400px] border border-[var(--card-bg)]">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-[var(--text-primary)] font-semibold">Overlay Preview</h4>
              <button onClick={() => setShowOverlayPreview(false)} className="text-[var(--text-primary)]">×</button>
            </div>
            <iframe srcDoc={overlayHtml} className="w-full h-64 rounded border border-[var(--card-bg)]" title="Overlay Preview" />
            <div className="mt-4 text-xs text-[var(--text-secondary)] text-center">
              Use this URL in OBS Browser Source: <code className="bg-[var(--background-color)] px-1 rounded">data:text/html,{encodeURIComponent(overlayHtml.slice(0, 100))}…</code>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};