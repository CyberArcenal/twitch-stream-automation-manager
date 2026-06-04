// src/renderer/pages/predictions/index.tsx
import React, { useState, useEffect } from "react";
import { Plus, Clock } from "lucide-react";
import { predictionsAPI, type Prediction } from "../../api/core/predictions";
import { useAuth } from "../../hooks/useAuth";
import { formatDistanceToNow } from "date-fns";
import LoadingSpinner from "../../components/Shared/LoadingSpinner";
import { ErrorBoundary } from "../../components/UI/ErrorBoundary";
import { dialogs } from "../../utils/dialogs";
import { CreatePredictionModal } from "./components/CreatePredictionModal";

const PredictionsPage: React.FC = () => {
  const { user } = useAuth();
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const fetchPredictions = async () => {
    if (!user?.id) return;
    try {
      const res = await predictionsAPI.getActive(user.id);
      if (res.status) setPredictions(res.data);
    } catch (err) {
      console.error("Failed to fetch predictions", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPredictions();
    const interval = setInterval(fetchPredictions, 10000);
    return () => clearInterval(interval);
  }, [user?.id]);

  const handleResolve = async (predictionId: string, winningOutcomeId: string) => {
    const confirmed = await dialogs.confirm({
      title: "Resolve prediction with this outcome?",
      message: "This action cannot be undone.",
    });
    if (!confirmed) return;
    try {
      await predictionsAPI.resolve(predictionId, winningOutcomeId);
      fetchPredictions();
    } catch (err) {
      console.error("Failed to resolve prediction", err);
      dialogs.error("Failed to resolve prediction");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <LoadingSpinner size="medium" text="Loading predictions..." />
      </div>
    );
  }

  return (
    <div className="h-full min-h-full !p-4 bg-[var(--background-color)]">
      <div className="flex justify-between items-center mb-6">
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
          className="flex items-center gap-2 px-4 py-2 bg-[var(--primary-color)] rounded-lg hover:bg-[#772ce8] transition text-sm"
        >
          <Plus className="w-4 h-4" /> New Prediction
        </button>
      </div>

      <ErrorBoundary>
        {predictions.length === 0 ? (
          <div className="bg-[var(--card-bg)] rounded-xl p-8 text-center text-[var(--text-secondary)] border border-[var(--border-color)]">
            No active predictions. Click "New Prediction" to start one.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {predictions.map((pred) => (
              <div
                key={pred.id}
                className="bg-[var(--card-bg)] rounded-xl border border-[var(--border-color)] p-5 flex flex-col"
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

                <div className="mt-4 space-y-3 flex-1">
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
      </ErrorBoundary>

      <CreatePredictionModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={fetchPredictions}
        broadcasterId={user?.id || ""}
      />
    </div>
  );
};

export default PredictionsPage;