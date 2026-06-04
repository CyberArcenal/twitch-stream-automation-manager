// src/renderer/pages/predictions/components/CreatePredictionModal.tsx
import React, { useState } from "react";
import { predictionsAPI } from "../../../api/core/predictions";
import { dialogs } from "../../../utils/dialogs";

interface CreatePredictionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  broadcasterId: string;
}

export const CreatePredictionModal: React.FC<CreatePredictionModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  broadcasterId,
}) => {
  const [formData, setFormData] = useState({
    title: "",
    outcomes: ["", ""],
    predictionWindow: 60,
  });
  const [creating, setCreating] = useState(false);

  if (!isOpen) return null;

  const handleCreate = async () => {
    if (!broadcasterId) {
      dialogs.error("Not logged in");
      return;
    }
    if (!formData.title.trim() || formData.outcomes.some((o) => !o.trim())) {
      dialogs.error("Please fill all fields");
      return;
    }
    setCreating(true);
    try {
      await predictionsAPI.create(
        broadcasterId,
        formData.title,
        formData.outcomes,
        formData.predictionWindow,
      );
      onSuccess();
      onClose();
      setFormData({ title: "", outcomes: ["", ""], predictionWindow: 60 });
    } catch (err) {
      console.error("Failed to create prediction", err);
      dialogs.error(
        "Failed to create prediction. Make sure you have the required scope.",
      );
    } finally {
      setCreating(false);
    }
  };

  const addOutcome = () => {
    if (formData.outcomes.length >= 10) return;
    setFormData({ ...formData, outcomes: [...formData.outcomes, ""] });
  };

  const removeOutcome = (index: number) => {
    if (formData.outcomes.length <= 2) return;
    const newOutcomes = formData.outcomes.filter((_, i) => i !== index);
    setFormData({ ...formData, outcomes: newOutcomes });
  };

  const updateOutcome = (index: number, value: string) => {
    const newOutcomes = [...formData.outcomes];
    newOutcomes[index] = value;
    setFormData({ ...formData, outcomes: newOutcomes });
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-[var(--card-bg)] rounded-xl w-full max-w-lg p-6 border border-[var(--border-color)] max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-4">
          Create Prediction
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-[var(--text-secondary)] mb-1">
              Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="e.g., Will I win this match?"
              className="w-full bg-[var(--background-color)] border border-[var(--border-color)] rounded px-3 py-2 text-[var(--text-primary)]"
            />
          </div>
          <div>
            <label className="block text-sm text-[var(--text-secondary)] mb-1">
              Outcomes (2–10 options)
            </label>
            {formData.outcomes.map((outcome, idx) => (
              <div key={idx} className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={outcome}
                  onChange={(e) => updateOutcome(idx, e.target.value)}
                  placeholder={`Option ${idx + 1}`}
                  className="flex-1 bg-[var(--background-color)] border border-[var(--border-color)] rounded px-3 py-2 text-[var(--text-primary)]"
                />
                {formData.outcomes.length > 2 && (
                  <button
                    onClick={() => removeOutcome(idx)}
                    className="px-2 text-red-400 hover:text-red-300"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
            {formData.outcomes.length < 10 && (
              <button
                onClick={addOutcome}
                className="text-sm text-[#9147ff] hover:text-[#772ce8]"
              >
                + Add outcome
              </button>
            )}
          </div>
          <div>
            <label className="block text-sm text-[var(--text-secondary)] mb-1">
              Prediction Window (seconds)
            </label>
            <select
              value={formData.predictionWindow}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  predictionWindow: parseInt(e.target.value),
                })
              }
              className="w-full bg-[var(--background-color)] border border-[var(--border-color)] rounded px-3 py-2 text-[var(--text-primary)]"
            >
              <option value={60}>60 seconds</option>
              <option value={120}>120 seconds</option>
              <option value={300}>5 minutes</option>
              <option value={600}>10 minutes</option>
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#2a2a2e] rounded-md text-sm hover:bg-[#3a3a4a] transition"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={creating}
            className="px-4 py-2 bg-[var(--primary-color)] rounded-md text-sm disabled:opacity-50 hover:bg-[#772ce8] transition"
          >
            {creating ? "Creating..." : "Create Prediction"}
          </button>
        </div>
      </div>
    </div>
  );
};