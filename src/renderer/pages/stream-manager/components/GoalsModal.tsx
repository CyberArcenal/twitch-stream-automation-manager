// src/renderer/pages/stream-manager/components/GoalsModal.tsx
import React, { useState, useEffect } from "react";
import { Trash2 } from "lucide-react";
import Modal from "../../../components/UI/Modal";
import Button from "../../../components/UI/Button";
import { streamManagerAPI, type Goal } from "../../../api/core/streamManager";
import { dialogs } from "../../../utils/dialogs";
import { useAutomationLog } from "../../../contexts/AutomationLogContext";

interface GoalsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GoalsModal: React.FC<GoalsModalProps> = ({ isOpen, onClose }) => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [newGoalTitle, setNewGoalTitle] = useState("");
  const [newGoalTarget, setNewGoalTarget] = useState(100);
  const [newGoalUnit, setNewGoalUnit] = useState<
    "followers" | "subscribers" | "bits" | "views"
  >("followers");

  const { addLog } = useAutomationLog(); // para sa logs ng progress update

  const loadGoals = async () => {
    try {
      const res = await streamManagerAPI.getGoals();
      if (res.status && res.data) {
        setGoals(res.data);
      }
    } catch (err) {
      console.error("Failed to load goals", err);
    } finally {
      setLoading(false);
    }
  };

  // Mag‑load ng goals kapag binuksan ang modal
  useEffect(() => {
    if (isOpen) {
      loadGoals();
    }
  }, [isOpen]);

  // ✅ MAGDAGDAG NG EVENT LISTENERS PARA SA REAL‑TIME UPDATE
  useEffect(() => {
    // Hindi na kailangan ng mga listener kung sarado ang modal?
    // Pero puwede pa ring makinig para sa susunod na pagbukas.
    // Mas mainam na laging makinig at i‑refresh ang goals kung bukas ang modal.
    if (!isOpen) return;

    const handleGoalUpdate = (data: any) => {
      console.log("[GoalsModal] Goal update event received", data);
      loadGoals(); // i‑refresh ang buong listahan
      if (data.goalTitle) {
        addLog(`Goal "${data.goalTitle}" progress updated`, "success");
      }
    };

    // Makinig sa mga event na maaaring magpabago ng goal progress
    window.backendAPI?.on?.("goal:progress-updated", handleGoalUpdate);
    window.backendAPI?.on?.("eventsub:follow", handleGoalUpdate);
    window.backendAPI?.on?.("eventsub:subscription", handleGoalUpdate);
    window.backendAPI?.on?.("eventsub:bits", handleGoalUpdate);
    window.backendAPI?.on?.("stream:viewer-count", handleGoalUpdate); // kung mayroon

    return () => {
      window.backendAPI?.off?.("goal:progress-updated", handleGoalUpdate);
      window.backendAPI?.off?.("eventsub:follow", handleGoalUpdate);
      window.backendAPI?.off?.("eventsub:subscription", handleGoalUpdate);
      window.backendAPI?.off?.("eventsub:bits", handleGoalUpdate);
      window.backendAPI?.off?.("stream:viewer-count", handleGoalUpdate);
    };
  }, [isOpen, addLog]);

  const addGoal = async () => {
    if (!newGoalTitle.trim()) return;
    try {
      const res = await streamManagerAPI.addGoal({
        title: newGoalTitle,
        target: newGoalTarget,
        current: 0,
        unit: newGoalUnit,
      });
      if (res.status && res.data) {
        setGoals([...goals, res.data]);
        setNewGoalTitle("");
        setNewGoalTarget(100);
      } else {
        dialogs.error("Failed to add goal");
      }
    } catch (err) {
      console.error("Error adding goal", err);
      dialogs.error("Error adding goal");
    }
  };

  const deleteGoal = async (goalId: string) => {
    if (
      await dialogs.confirm({
        title: "Delete this goal?",
        message:
          "Are you sure you want to delete this goal? This action cannot be undone.",
      })
    ) {
      await streamManagerAPI.deleteGoal(goalId);
      setGoals(goals.filter((g) => g.id !== goalId));
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Manage Goals"
      size="md"
      minHeight="min-h-[400px]"
    >
      <div className="space-y-6">
        {/* Add new goal */}
        <div className="border border-[var(--border-color)] rounded-lg p-4">
          <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-3">
            Add New Goal
          </h4>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Goal title (e.g., 'Reach 100 followers')"
              value={newGoalTitle}
              onChange={(e) => setNewGoalTitle(e.target.value)}
              className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded px-3 py-2 text-sm text-[var(--text-primary)]"
            />
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Target"
                value={newGoalTarget}
                onChange={(e) => setNewGoalTarget(Number(e.target.value))}
                className="flex-1 bg-[var(--input-bg)] border border-[var(--input-border)] rounded px-3 py-2 text-sm text-[var(--text-primary)]"
              />
              <select
                value={newGoalUnit}
                onChange={(e) => setNewGoalUnit(e.target.value as any)}
                className="flex-1 bg-[var(--input-bg)] border border-[var(--input-border)] rounded px-3 py-2 text-sm text-[var(--text-primary)]"
              >
                <option value="followers">Followers</option>
                <option value="subscribers">Subscribers</option>
                <option value="bits">Bits</option>
                <option value="views">Views</option>
              </select>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={addGoal}
              className="w-full"
            >
              Add Goal
            </Button>
          </div>
        </div>

        {/* Goals list */}
        <div>
          <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-3">
            Current Goals
          </h4>
          {loading ? (
            <div className="text-center text-[var(--text-secondary)] text-sm">
              Loading...
            </div>
          ) : goals.length === 0 ? (
            <p className="text-center text-[var(--text-secondary)] text-sm">
              No goals yet. Create one above.
            </p>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {goals.map((goal) => (
                <div
                  key={goal.id}
                  className="flex justify-between items-center p-3 bg-[var(--input-bg)] rounded-lg"
                >
                  <div>
                    <div className="text-sm font-medium text-[var(--text-primary)]">
                      {goal.title}
                    </div>
                    <div className="text-xs text-[var(--text-secondary)]">
                      {goal.current} / {goal.target} {goal.unit}
                    </div>
                    {/* Progress bar (optional enhancement) */}
                    <div className="w-full bg-gray-700 rounded-full h-1.5 mt-1">
                      <div
                        className="bg-[#9147ff] h-1.5 rounded-full"
                        style={{ width: `${(goal.current / goal.target) * 100}%` }}
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => deleteGoal(goal.id)}
                    className="text-red-500 hover:text-red-400 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};