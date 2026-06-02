import React, { useState, useEffect } from "react";
import { TrendingUp, Plus, CheckCircle, XCircle, Clock } from "lucide-react";
import { predictionsAPI, type Prediction } from "../../api/core/predictions";
import { useAuth } from "../../hooks/useAuth";
import { formatDistanceToNow } from "date-fns";
import LoadingSpinner from "../../components/Shared/LoadingSpinner";
import { dialogs } from "../../utils/dialogs";

const PredictionsPage: React.FC = () => {
  const { user } = useAuth();
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    outcomes: ["", ""],
    predictionWindow: 60,
  });
  const [creating, setCreating] = useState(false);

  const fetchPredictions = async () => {
    if (!user?.id) return;
    try {
      const res = await predictionsAPI.getActive(user.id);
      console.log(`Fetched predictions: ${JSON.stringify(res)}`);
      if (res.status) setPredictions(res.data);
    } catch (err) {
      console.error("Failed to fetch predictions", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPredictions();
    const interval = setInterval(fetchPredictions, 10000); // refresh every 10s
    return () => clearInterval(interval);
  }, [user?.id]);

  const handleCreate = async () => {
    if (!user?.id) return;
    if (!formData.title.trim() || formData.outcomes.some((o) => !o.trim())) {
      alert("Please fill all fields");
      return;
    }
    setCreating(true);
    try {
      await predictionsAPI.create(
        user.id,
        formData.title,
        formData.outcomes,
        formData.predictionWindow,
      );
      setShowCreateModal(false);
      setFormData({ title: "", outcomes: ["", ""], predictionWindow: 60 });
      fetchPredictions();
    } catch (err) {
      console.error("Failed to create prediction", err);
      alert(
        "Failed to create prediction. Make sure you have the required scope.",
      );
    } finally {
      setCreating(false);
    }
  };

  const handleResolve = async (
    predictionId: string,
    winningOutcomeId: string,
  ) => {
    if (
      !(await dialogs.confirm({
        title: "Resolve prediction with this outcome?",
        message: "This action cannot be undone.",
      }))
    )
      return;
    try {
      await predictionsAPI.resolve(predictionId, winningOutcomeId);
      fetchPredictions();
    } catch (err) {
      console.error("Failed to resolve prediction", err);
      alert("Failed to resolve prediction");
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingSpinner />
      </div>
    );
  }

  console.log(predictions);

  return (
    <div className="p-6 space-y-6 bg-[var(--background-color)] min-h-screen">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">
            Predictions
          </h1>
          <p className="text-[var(--text-secondary)]">
            Create and manage channel point predictions
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#9147ff] rounded-lg hover:bg-[#772ce8] transition"
        >
          <Plus className="w-4 h-4" /> New Prediction
        </button>
      </div>

      {/* Active Predictions */}
      <div>
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
          Active Predictions
        </h2>
        {predictions.length === 0 ? (
          <div className="bg-[var(--card-bg)] rounded-xl p-8 text-center text-[var(--text-secondary)]">
            No active predictions. Start one!
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {predictions?.map((pred) => (
              <div
                key={pred.id}
                className="bg-[var(--card-bg)] rounded-xl border border-[var(--card-bg)] p-5"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                      {pred.title}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)] mt-1">
                      <Clock className="w-3 h-3" />
                      {formatDistanceToNow(new Date(pred.created_at), {
                        addSuffix: true,
                      })}
                      <span className="mx-1">•</span>
                      {pred.prediction_window}s window
                    </div>
                  </div>
                  <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded-full">
                    {pred.status}
                  </span>
                </div>

                {/* Outcomes */}
                <div className="mt-4 space-y-3">
                  {pred.outcomes.map((outcome) => (
                    <div
                      key={outcome.id}
                      className="bg-[#2a2a2e]/50 rounded-lg p-3"
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[var(--text-primary)] font-medium">
                          {outcome.title}
                        </span>
                        <div className="flex gap-3 text-sm">
                          <span className="text-[var(--text-secondary)]">
                            {outcome.users} users
                          </span>
                          <span className="text-[#9147ff] font-mono">
                            {outcome.channel_points.toLocaleString()} pts
                          </span>
                        </div>
                      </div>
                      {pred.status === "ACTIVE" && (
                        <button
                          onClick={() => handleResolve(pred.id, outcome.id)}
                          className="mt-2 text-xs text-green-400 hover:text-green-300 transition"
                        >
                          Resolve with this outcome
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Prediction Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-[var(--card-bg)] rounded-xl w-full max-w-lg p-6 border border-[var(--card-bg)] max-h-[90vh] overflow-y-auto">
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
                  className="w-full bg-[var(--background-color)] border border-[var(--card-bg)] rounded px-3 py-2 text-[var(--text-primary)]"
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
                      className="flex-1 bg-[var(--background-color)] border border-[var(--card-bg)] rounded px-3 py-2 text-[var(--text-primary)]"
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
                  className="w-full bg-[var(--background-color)] border border-[var(--card-bg)] rounded px-3 py-2 text-[var(--text-primary)]"
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
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 bg-[#2a2a2e] rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={creating}
                className="px-4 py-2 bg-[#9147ff] rounded-md disabled:opacity-50"
              >
                {creating ? "Creating..." : "Create Prediction"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PredictionsPage;
